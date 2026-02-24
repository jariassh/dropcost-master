import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TriggerPayload {
    codigo_evento: string;
    datos: Record<string, string>;
    tipo_envio?: 'automatico' | 'prueba';
    targetId?: string;
    plantilla_id_prueba?: string;
    email_destino_prueba?: string;
}

function reemplazarVariables(texto: string, datos: Record<string, any>): string {
    if (!texto) return '';
    // Soporta {{var}}, ${var} y variables con guiones o puntos
    const regex = /\{\{\s*([^{}]+)\s*\}\}|\$\{\s*([^{}]+)\s*\}/g;
    
    return texto.replace(regex, (match, p1, p2) => {
        const key = (p1 || p2 || '').trim();
        // Búsqueda insensible a mayúsculas
        const actualKey = Object.keys(datos).find(k => k.toLowerCase() === key.toLowerCase());
        
        if (actualKey !== undefined && datos[actualKey] !== undefined && datos[actualKey] !== null) {
            return String(datos[actualKey]);
        }
        return match;
    });
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const payload: any = await req.json();
        const { codigo_evento, datos, tipo_envio = 'automatico', targetId: payloadTargetId, plantilla_id_prueba, email_destino_prueba } = payload;
        
        console.log(`[Dispatcher] RECIBIDO - Evento: ${codigo_evento}, Tipo Envío: ${tipo_envio}, TargetId: ${payloadTargetId || 'N/A'}`);
        console.log(`[Dispatcher] Datos recibidos:`, JSON.stringify(datos));
        
        if (!codigo_evento) {
            console.error(`[Dispatcher] ERROR: No se proporcionó codigo_evento`);
            return new Response(
                JSON.stringify({ error: 'codigo_evento es requerido' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // --- Configuración Global ---
        const { data: config } = await supabase
            .from('configuracion_global')
            .select('*')
            .limit(1)
            .maybeSingle();

        // --- Configuración de Referidos ---
        const { data: refConfig } = await supabase
            .from('sistema_referidos_config')
            .select('*')
            .order('fecha_actualizacion', { ascending: false })
            .limit(1)
            .maybeSingle();

        const emailDomain = config?.email_domain || 'dropcost.jariash.com';
        const nombreEmpresa = config?.nombre_empresa || 'DropCost Master';
        let appUrl = (config?.site_url || config?.sitio_web || 'https://app.dropcost.com').trim().replace(/\/+$/, '');
        const logoUrl = config?.logo_principal_url || '';

        const datosEnriquecidos = {
            ...datos,
            nombre_empresa: nombreEmpresa,
            empresa: nombreEmpresa,
            logo_url: logoUrl,
            app_url: appUrl,
            // Variables de referidos (globales)
            comision_referido_nivel1: refConfig?.comision_nivel_1 || '15',
            comision_referido_nivel2: refConfig?.comision_nivel_2 || '5',
            vigencia_meses_comision: refConfig?.meses_vigencia_comision || '12',
            // Colores del branding (se reemplazan al enviar, no al guardar la plantilla)
            // Así cualquier cambio de branding se aplica automáticamente a todos los correos
            color_primary: config?.color_primary || '#0066FF',
            color_primary_dark: config?.color_primary_dark || '#0052cc',
            color_primary_light: config?.color_primary_light || '#e6f0ff',
            color_success: config?.color_success || '#10B981',
            color_error: config?.color_error || '#EF4444',
            color_warning: config?.color_warning || '#F59E0B',
            color_neutral: config?.color_neutral || '#6B7280',
            color_bg_primary: config?.color_bg_primary || '#FFFFFF',
            color_bg_secondary: config?.color_bg_secondary || '#F9FAFB',
            color_text_primary: config?.color_text_primary || '#1F2937',
            color_text_secondary: config?.color_text_secondary || '#6B7280',
            color_text_inverse: config?.color_text_inverse || '#FFFFFF',
            color_sidebar_bg: config?.color_sidebar_bg || '#0F172A',
            color_card_border: config?.color_card_border || '#E5E7EB',
            color_admin_primary: config?.color_admin_primary || '#7C3AED',
            color_admin_bg: config?.color_admin_bg || '#0F172A',
            color_admin_sidebar: config?.color_admin_sidebar || '#1E293B',
            color_admin_text: config?.color_admin_text || '#F8FAFC',
            // Variables de contacto
            email_soporte: config?.email_soporte || config?.email_contacto || 'soporte@dropcost.com',
        };

        let targetId = payloadTargetId || datos['usuario_id'];

        // --- Especial: Referido ---
        if (codigo_evento === 'REFERIDO_REGISTRADO' && datos['codigo_referido']) {
            const { data: lider } = await supabase.from('users').select('id, email').eq('codigo_referido_personal', datos['codigo_referido']).maybeSingle();
            if (lider) {
                targetId = lider.id;
                datosEnriquecidos['usuario_email'] = lider.email;
            }
        }

        // --- Enriquecimiento con Auth/DB ---
        if (targetId) {
            const { data: { user: authUser } } = await supabase.auth.admin.getUserById(targetId);
            if (authUser) {
                // Priorizamos lo que ya viene en datos (payload) sobre lo que hay en DB
                const dbNombre = `${authUser.user_metadata?.nombres || ''} ${authUser.user_metadata?.apellidos || ''}`.trim();
                
                // CRITICAL FIX: Si es un cambio de email, el destinatario DEBE ser el email_nuevo
                const payloadEmail = datosEnriquecidos['email_nuevo'] || datosEnriquecidos['usuario_email'] || datosEnriquecidos['email'];
                
                datosEnriquecidos['usuario_nombre'] = datosEnriquecidos['usuario_nombre'] || datosEnriquecidos['nombres'] || dbNombre;
                datosEnriquecidos['nombres'] = datosEnriquecidos['nombres'] || datosEnriquecidos['usuario_nombre'];
                datosEnriquecidos['usuario_email'] = payloadEmail || authUser.email;
                datosEnriquecidos['email'] = datosEnriquecidos['usuario_email'];
            }
        }

        // --- Alias de compatibilidad ---
        datosEnriquecidos['link'] = datosEnriquecidos['link'] || datosEnriquecidos['reset_link'] || datosEnriquecidos['verification_link'];
        datosEnriquecidos['reset_link'] = datosEnriquecidos['reset_link'] || datosEnriquecidos['link'];
        datosEnriquecidos['empresa'] = datosEnriquecidos['empresa'] || datosEnriquecidos['nombre_empresa'];

        // --- Modo Prueba Manual ---
        let associations = null;
        let triggerId = null;

        if (codigo_evento === '__PRUEBA_MANUAL__' && plantilla_id_prueba) {
            console.log(`[Dispatcher] MODO PRUEBA MANUAL - Plantilla: ${plantilla_id_prueba}`);
            const { data: testTemplate, error: testError } = await supabase
                .from('email_templates')
                .select('id, name, subject, html_content, sender_prefix, sender_name')
                .eq('id', plantilla_id_prueba)
                .maybeSingle();

            if (testError || !testTemplate) {
                return new Response(JSON.stringify({ error: 'Plantilla de prueba no encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            associations = [{ email_templates: testTemplate }];
        } else {
            // --- Modo Normal: Buscar Trigger y Plantillas ---
            console.log(`[Dispatcher] Buscando trigger para: ${codigo_evento}`);
            const { data: trigger, error: triggerError } = await supabase
                .from('email_triggers')
                .select('id, nombre_trigger, codigo_evento, activo')
                .eq('codigo_evento', codigo_evento)
                .eq('activo', true)
                .maybeSingle();

            if (triggerError || !trigger) {
                console.error(`[Dispatcher] ERROR: Trigger no encontrado o inactivo: ${codigo_evento}`);
                return new Response(
                    JSON.stringify({ error: `Trigger no encontrado: ${codigo_evento}` }),
                    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            triggerId = trigger.id;
            console.log(`[Dispatcher] Trigger encontrado: ${trigger.nombre_trigger}. Buscando plantillas...`);

            const { data: dbAssoc, error: assocError } = await supabase
                .from('email_plantillas_triggers')
                .select(`
                    plantilla_id,
                    email_templates (
                        id, name, subject, html_content, sender_prefix, sender_name
                    )
                `)
                .eq('trigger_id', trigger.id)
                .eq('activo', true);

            if (assocError || !dbAssoc || dbAssoc.length === 0) {
                console.warn(`[Dispatcher] No hay plantillas activas para ${codigo_evento}`);
                return new Response(
                    JSON.stringify({ success: true, message: 'No hay plantillas para este evento' }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            associations = dbAssoc;
        }

        let emails_enviados = 0;
        for (const assoc of associations) {
            const plantilla: any = assoc.email_templates;
            if (!plantilla) continue;

            const toEmail = email_destino_prueba || datosEnriquecidos['usuario_email'] || datosEnriquecidos['email'] || datos['email'];
            if (!toEmail) continue;

            const fromEmail = `${plantilla.sender_name || nombreEmpresa} <${plantilla.sender_prefix || 'support'}@${emailDomain}>`;
            console.log(`[Dispatcher] Reemplazando variables para plantilla: ${plantilla.name}`);
            console.log(`[Dispatcher] Claves disponibles en datosEnriquecidos:`, Object.keys(datosEnriquecidos).join(', '));

            const subjectFinal = reemplazarVariables(plantilla.subject, datosEnriquecidos);
            let htmlFinal = reemplazarVariables(plantilla.html_content, datosEnriquecidos);

            // Heurística de Salud de HTML: Eliminar el parche anterior y solo loguear el estado
            console.log(`[Dispatcher] Longitud HTML final: ${htmlFinal.length}. ¿Tiene font-size:0px? ${htmlFinal.includes('font-size:0px')}`);

            console.log(`[Dispatcher] Enviando email a: ${toEmail}`);
            
            const res = await fetch(`${supabaseUrl}/functions/v1/email-service`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                    to: toEmail,
                    from: fromEmail,
                    subject: subjectFinal,
                    html: htmlFinal,
                }),
            });

            const estado = res.ok ? 'enviado' : 'fallido';
            const razon = res.ok ? null : await res.text();
            if (!res.ok) console.error(`[Dispatcher] Error email-service: ${razon}`);

            await supabase.from('email_historial').insert({
                usuario_id: targetId || null,
                trigger_id: triggerId,
                plantilla_id: plantilla.id,
                usuario_email: toEmail,
                asunto_enviado: subjectFinal,
                contenido_html_enviado: htmlFinal,
                estado,
                razon_error: razon,
                tipo_envio: tipo_envio
            });

            if (res.ok) emails_enviados++;
        }

        return new Response(
            JSON.stringify({ success: true, emails_enviados }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('[Dispatcher] Error Crítico:', error);
        return new Response(
            JSON.stringify({ error: error.message, stack: error.stack }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
