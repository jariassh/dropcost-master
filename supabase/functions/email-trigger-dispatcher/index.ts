import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TriggerPayload {
    codigo_evento: string;
    datos: Record<string, string>;
    tipo_envio?: 'automatico' | 'prueba';
    // Para prueba manual: plantilla_id específica + email destino
    plantilla_id_prueba?: string;
    email_destino_prueba?: string;
}

/**
 * Reemplaza todas las variables ${variable} en un texto con los valores del objeto datos.
 * Si la variable no existe en datos, la deja como está.
 */
function reemplazarVariables(texto: string, datos: Record<string, string>): string {
    // Match {{ variable }} or {{variable}}
    return texto.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
        const cleanKey = key.trim();
        return datos[cleanKey] !== undefined ? datos[cleanKey] : match;
    });
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const payload: TriggerPayload = await req.json();
        const { codigo_evento, datos, tipo_envio = 'automatico', plantilla_id_prueba, email_destino_prueba } = payload;

        if (!codigo_evento) {
            return new Response(
                JSON.stringify({ error: 'codigo_evento es requerido' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Obtener configuración global (dominio de email y colores de marca)
        const { data: config } = await supabase
            .from('configuracion_global')
            .select(`
                email_domain, 
                nombre_empresa, 
                site_url,
                color_primary,
                color_primary_dark,
                color_primary_light,
                color_success,
                color_error,
                color_warning,
                color_neutral,
                color_bg_primary,
                color_bg_secondary,
                color_text_primary,
                color_text_secondary,
                color_text_inverse,
                color_sidebar_bg
            `)
            .limit(1)
            .maybeSingle();

        const emailDomain = config?.email_domain || 'dropcost.com';
        const nombreEmpresa = config?.nombre_empresa || 'DropCost';
        const appUrl = config?.site_url || 'https://app.dropcost.com';

        // Enriquecer datos con variables globales (colores y URLs)
        const datosEnriquecidos = {
            ...datos,
            app_url: appUrl,
            login_url: `${appUrl}/login`,
            color_primary: config?.color_primary || '#0066FF',
            color_primary_dark: config?.color_primary_dark || '#0052cc',
            color_primary_light: config?.color_primary_light || '#e6f0ff',
            color_success: config?.color_success || '#10B981',
            color_warning: config?.color_warning || '#F59E0B',
            color_error: config?.color_error || '#EF4444',
            color_neutral: config?.color_neutral || '#6B7280',
            color_bg_primary: config?.color_bg_primary || '#FFFFFF',
            color_bg_secondary: config?.color_bg_secondary || '#F9FAFB',
            color_text_primary: config?.color_text_primary || '#1F2937',
            color_text_secondary: config?.color_text_secondary || '#6B7280',
            color_text_inverse: config?.color_text_inverse || '#FFFFFF',
            color_sidebar_bg: config?.color_sidebar_bg || '#FFFFFF',
        };

        // ============================================================
        // MODO PRUEBA MANUAL: plantilla_id_prueba sin trigger real
        // ============================================================
        if (codigo_evento === '__PRUEBA_MANUAL__' && plantilla_id_prueba) {
            const { data: plantilla } = await supabase
                .from('email_templates')
                .select('id, name, subject, html_content, sender_prefix, sender_name')
                .eq('id', plantilla_id_prueba)
                .maybeSingle();

            if (!plantilla) {
                return new Response(
                    JSON.stringify({ error: 'Plantilla no encontrada' }),
                    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            const senderPrefix = plantilla.sender_prefix || 'support';
            const senderName = plantilla.sender_name || nombreEmpresa;
            const fromEmail = `${senderPrefix}@${emailDomain}`;
            const fromFull = `${senderName} <${fromEmail}>`;
            const toEmail = email_destino_prueba || datos['usuario_email'];

            if (!toEmail) {
                return new Response(
                    JSON.stringify({ error: 'email_destino_prueba es requerido para pruebas manuales' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            const asuntoFinal = reemplazarVariables(plantilla.subject || '', datosEnriquecidos);
            const htmlFinal = reemplazarVariables(plantilla.html_content || '', datosEnriquecidos);

            let estado: 'enviado' | 'fallido' = 'enviado';
            let razonError: string | null = null;

            try {
                // Construct the URL for the email-service function
                const emailServiceUrl = `${supabaseUrl}/functions/v1/email-service`;
                console.log(`[email-trigger-dispatcher] Invoking email-service at: ${emailServiceUrl}`);

                const emailResponse = await fetch(emailServiceUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                    },
                    body: JSON.stringify({ 
                        to: toEmail, 
                        from: fromFull, 
                        subject: asuntoFinal, 
                        html: htmlFinal 
                    }),
                });

                if (!emailResponse.ok) {
                    const errorText = await emailResponse.text();
                    console.error(`[email-trigger-dispatcher] email-service failed with status ${emailResponse.status}: ${errorText}`);
                    throw new Error(`email-service responded ${emailResponse.status}: ${errorText}`);
                } else {
                    const responseData = await emailResponse.json().catch(() => ({}));
                    console.log(`[email-trigger-dispatcher] email-service success:`, responseData);
                }
            } catch (sendError: any) {
                console.error(`[email-trigger-dispatcher] Exception calling email-service:`, sendError);
                estado = 'fallido';
                razonError = sendError.message;
            }

            // Registrar en historial como prueba
            await supabase.from('email_historial').insert({
                plantilla_id: plantilla.id,
                trigger_id: null,
                usuario_id: datos['usuario_id'] || null,
                usuario_email: toEmail,
                asunto_enviado: asuntoFinal,
                contenido_html_enviado: htmlFinal,
                from_email: fromEmail,
                from_name: senderName,
                estado,
                razon_error: razonError,
                tipo_envio: 'prueba',
            });

            return new Response(
                JSON.stringify({ emails_enviados: estado === 'enviado' ? 1 : 0, estado, razon_error: razonError }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ============================================================
        // MODO NORMAL: buscar trigger por codigo_evento
        // ============================================================

        // 1. Buscar el trigger por codigo_evento
        const { data: trigger, error: triggerError } = await supabase
            .from('email_triggers')
            .select('id, nombre_trigger, codigo_evento, activo')
            .eq('codigo_evento', codigo_evento)
            .eq('activo', true)
            .maybeSingle();

        if (triggerError || !trigger) {
            console.error(`[email-trigger-dispatcher] Trigger no encontrado: ${codigo_evento}`, triggerError);
            return new Response(
                JSON.stringify({ emails_enviados: 0, mensaje: 'Trigger no encontrado o inactivo' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }


        // 3. Buscar plantillas asociadas al trigger (activas)
        let plantillasQuery = supabase
            .from('email_plantillas_triggers')
            .select(`
                plantilla_id,
                activo,
                email_templates!inner (
                    id,
                    name,
                    subject,
                    html_content,
                    sender_prefix,
                    sender_name,
                    status
                )
            `)
            .eq('trigger_id', trigger.id)
            .eq('activo', true)
            .eq('email_templates.status', 'activo');

        // Si es prueba manual con plantilla específica, filtrar solo esa
        if (tipo_envio === 'prueba' && plantilla_id_prueba) {
            plantillasQuery = plantillasQuery.eq('plantilla_id', plantilla_id_prueba);
        }

        const { data: asociaciones, error: asocError } = await plantillasQuery;

        if (asocError) {
            console.error('[email-trigger-dispatcher] Error buscando plantillas:', asocError);
            return new Response(
                JSON.stringify({ error: 'Error buscando plantillas asociadas' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Si no hay plantillas asociadas → silencio (comportamiento esperado)
        if (!asociaciones || asociaciones.length === 0) {
            return new Response(
                JSON.stringify({ emails_enviados: 0, mensaje: 'No hay plantillas activas asociadas al trigger' }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        let emailsEnviados = 0;
        const resultados: any[] = [];

        // 4. Enviar un email por cada plantilla asociada
        for (const asociacion of asociaciones) {
            const plantilla = (asociacion as any).email_templates;
            if (!plantilla) continue;

            // Construir remitente desde la plantilla
            const senderPrefix = plantilla.sender_prefix || 'support';
            const senderName = plantilla.sender_name || nombreEmpresa;
            const fromEmail = `${senderPrefix}@${emailDomain}`;
            const fromFull = `${senderName} <${fromEmail}>`;

            // Determinar email destinatario
            const toEmail = tipo_envio === 'prueba' && email_destino_prueba
                ? email_destino_prueba
                : datos['usuario_email'] || datos['lider_email'];

            if (!toEmail) {
                console.warn(`[email-trigger-dispatcher] Sin email destinatario para trigger ${codigo_evento}`);
                continue;
            }

            // Reemplazar variables en asunto y HTML
            const asuntoFinal = reemplazarVariables(plantilla.subject || '', datosEnriquecidos);
            const htmlFinal = reemplazarVariables(plantilla.html_content || '', datosEnriquecidos);

            let estado: 'enviado' | 'fallido' = 'enviado';
            let razonError: string | null = null;

            try {
                // 5. Llamar al email-service existente para enviar
                const emailResponse = await fetch(`${supabaseUrl}/functions/v1/email-service`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                    },
                    body: JSON.stringify({
                        to: toEmail,
                        from: fromFull,
                        subject: asuntoFinal,
                        html: htmlFinal,
                    }),
                });

                if (!emailResponse.ok) {
                    const errorBody = await emailResponse.text();
                    throw new Error(`email-service respondió ${emailResponse.status}: ${errorBody}`);
                }

                emailsEnviados++;
            } catch (sendError: any) {
                console.error(`[email-trigger-dispatcher] Error enviando email:`, sendError);
                estado = 'fallido';
                razonError = sendError.message || 'Error desconocido';
            }

            // 6. Registrar en email_historial
            const historialEntry = {
                plantilla_id: plantilla.id,
                trigger_id: tipo_envio === 'prueba' ? null : trigger.id,
                usuario_id: datos['usuario_id'] || null,
                usuario_email: toEmail,
                asunto_enviado: asuntoFinal,
                contenido_html_enviado: htmlFinal,
                from_email: fromEmail,
                from_name: senderName,
                estado,
                razon_error: razonError,
                tipo_envio,
            };

            const { error: historialError } = await supabase
                .from('email_historial')
                .insert(historialEntry);

            if (historialError) {
                console.error('[email-trigger-dispatcher] Error registrando en historial:', historialError);
            }

            resultados.push({
                plantilla: plantilla.name,
                email: toEmail,
                estado,
                razon_error: razonError,
            });
        }

        return new Response(
            JSON.stringify({
                emails_enviados: emailsEnviados,
                total_plantillas: asociaciones.length,
                resultados,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('[email-trigger-dispatcher] Error inesperado:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Error interno del servidor' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
