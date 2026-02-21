import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TriggerPayload {
    codigo_evento: string;
    datos: Record<string, string>;
    tipo_envio?: 'automatico' | 'prueba';
    // Para prueba manual: plantilla_id especificada + email destino
    plantilla_id_prueba?: string;
    email_destino_prueba?: string;
}

/**
 * Reemplaza todas las variables {{variable}} en un texto con los valores del objeto datos.
 * La búsqueda es insensible a mayúsculas para las llaves.
 */
function reemplazarVariables(texto: string, datos: Record<string, any>): string {
    return texto.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, key) => {
        const cleanKey = key.trim().toLowerCase();
        
        // Buscar en los datos ignorando mayúsculas/minúsculas en las llaves
        const actualKey = Object.keys(datos).find(k => k.toLowerCase() === cleanKey);
        
        if (actualKey && datos[actualKey] !== undefined && datos[actualKey] !== null) {
            const valor = String(datos[actualKey]);
            // NO reemplazar con string vacío: deja el placeholder visible
            return valor !== '' ? valor : match;
        }
        return match;
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
                logo_principal_url,
                site_url,
                sitio_web,
                email_contacto,
                telefono,
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

        const emailDomain = config?.email_domain || 'dropcost.jariash.com';
        const nombreEmpresa = config?.nombre_empresa || 'DropCost Master';
        
        // Obtener URL base de forma robusta (evitando fallbacks hardcoded si hay config)
        let appUrl = (config?.site_url || config?.sitio_web || '').trim();
        if (!appUrl) appUrl = 'https://app.dropcost.com'; // Fallback final si no hay nada en DB
        
        // Limpiar slash final para evitar dobles slashes en concatenaciones (p.ej. /login)
        appUrl = appUrl.replace(/\/+$/, '');
        
        const logoUrl = config?.logo_principal_url || '';

        // Enriquecer datos con variables globales (colores y URLs)
        const datosEnriquecidos = {
            ...datos,
            nombre_empresa: nombreEmpresa,
            logo_url: logoUrl,
            email_contacto: config?.email_contacto || 'soporte@dropcost.com',
            email_soporte: config?.email_contacto || 'soporte@dropcost.com',
            telefono_soporte: config?.telefono || '',
            app_url: appUrl,
            login_url: `${appUrl}/login`,
            // Variables para Perfil / Seguridad
            email_anterior: datos['email_anterior'] || 'usuario.anterior@gmail.com',
            email_nuevo: datos['email_nuevo'] || 'usuario.nuevo@gmail.com',
            fecha_actualizacion: datos['fecha_actualizacion'] || new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
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
            // Variables de Autenticación (Fallbacks o desde datos si vienen)
            reset_link: datos['reset_link'] || `${appUrl}/actualizar-contrasena?token={{reset_token}}`,
            horas_validez: datos['horas_validez'] || '24',
            verification_link: datos['verification_link'] || `${appUrl}/verificar-email?token={{verification_token}}`,
            login_url: datos['login_url'] || `${appUrl}/login`,
        };

        // ============================================================
        // ENRIQUECIMIENTO: Configuración de Referidos (comisión y vigencia)
        // ============================================================
        let referralConfig = null;
        try {
            const { data } = await supabase
                .from('sistema_referidos_config')
                .select('comision_nivel_1, comision_nivel_2, meses_vigencia_comision, referidos_minimo_lider')
                .order('fecha_actualizacion', { ascending: false })
                .limit(1)
                .maybeSingle();
            referralConfig = data;
        } catch (err) {
            console.error('[Dispatcher] Error al consultar sistema_referidos_config:', err);
        }

        // Asegurar que las variables de comisión NUNCA sean vacías (usar defaults del negocio si falla query)
        datosEnriquecidos['comision_referido_nivel1'] = String(referralConfig?.comision_nivel_1 || 15);
        datosEnriquecidos['comision_referido_nivel2'] = String(referralConfig?.comision_nivel_2 || 5);
        datosEnriquecidos['vigencia_meses_comision'] = String(referralConfig?.meses_vigencia_comision || 12);
        datosEnriquecidos['requisito_para_lider'] = String(referralConfig?.referidos_minimo_lider || 50);
        datosEnriquecidos['referido_nombre'] = datos['referido_nombre'] || 'tu invitado';

        // Obtener cantidad de referidos actuales del usuario/destinatario
        const recipientUserId = datosEnriquecidos['usuario_id'] || datos['usuario_id'];
        if (recipientUserId) {
            try {
                const { data: liderData } = await supabase
                    .from('referidos_lideres')
                    .select('total_referidos')
                    .eq('user_id', recipientUserId)
                    .maybeSingle();
                datosEnriquecidos['referidos_cantidad'] = String(liderData?.total_referidos ?? 0);
            } catch (err) {
                console.error('[Dispatcher] Error al consultar referidos_lideres:', err);
                datosEnriquecidos['referidos_cantidad'] = '0';
            }
        } else {
            datosEnriquecidos['referidos_cantidad'] = '0';
        }

        console.log(`[Dispatcher] Config enriquecida: comision1=${datosEnriquecidos['comision_referido_nivel1']}, referido=${datosEnriquecidos['referido_nombre']}`);

        // ============================================================
        // CASO ESPECIAL: REFERIDO_REGISTRADO → email al LÍDER (referidor)
        // ============================================================
        let targetId = datos['usuario_id'] || datos['id'];
        const refersToUserId = datos['usuario_id']; // El nuevo usuario

        if (codigo_evento === 'REFERIDO_REGISTRADO' && datos['codigo_referido']) {
            const { data: lider } = await supabase
                .from('users')
                .select('id, nombres, apellidos, email, codigo_referido_personal')
                .eq('codigo_referido_personal', datos['codigo_referido'])
                .maybeSingle();

            if (lider) {
                targetId = lider.id;
                datosEnriquecidos['usuario_id'] = lider.id;
                datosEnriquecidos['nombres'] = lider.nombres || '';
                datosEnriquecidos['apellidos'] = lider.apellidos || '';
                datosEnriquecidos['email'] = lider.email || '';
                
                // Buscar el nombre real del REFERIDO usando AUTH (más rápido que tabla public.users)
                if (refersToUserId) {
                    const { data: { user: refAuthUser } } = await supabase.auth.admin.getUserById(refersToUserId);
                    if (refAuthUser?.user_metadata?.nombres) {
                        datosEnriquecidos['referido_nombre'] = `${refAuthUser.user_metadata.nombres} ${refAuthUser.user_metadata.apellidos || ''}`.trim();
                    }
                }
                
                if (!datosEnriquecidos['referido_nombre']) {
                    datosEnriquecidos['referido_nombre'] = datos['referido_nombre'] || 'tu invitado';
                }
                console.log(`[Dispatcher] REFERIDO_REGISTRADO → Destino: ${lider.email}, Referido: ${datosEnriquecidos['referido_nombre']}`);
            }
        }

        // ============================================================
        // ENRIQUECIMIENTO: Obtener datos del destinatario directamente de AUTH
        // Esto evita esperar a que la tabla public.users se sincronice (race condition)
        // ============================================================
        if (targetId) {
            const { data: { user: authUser } } = await supabase.auth.admin.getUserById(targetId);
            
            if (authUser) {
                datosEnriquecidos['nombres'] = authUser.user_metadata?.nombres || datosEnriquecidos['nombres'] || '';
                datosEnriquecidos['apellidos'] = authUser.user_metadata?.apellidos || datosEnriquecidos['apellidos'] || '';
                datosEnriquecidos['email'] = authUser.email || datosEnriquecidos['email'] || '';
                datosEnriquecidos['usuario_email'] = authUser.email || datosEnriquecidos['usuario_email'] || '';

                // Generar Link de Verificación si no está verificado (NO BLOQUEANTE)
                if (!authUser.email_confirmed_at && (codigo_evento === 'USUARIO_REGISTRADO' || codigo_evento === 'BIENVENIDA' || codigo_evento === 'USER_SIGNUP')) {
                    try {
                        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
                            type: 'signup',
                            email: authUser.email!,
                            options: { redirectTo: appUrl }
                        });
                        
                        if (linkError) {
                            console.warn('[Dispatcher] Supabase no permitió generar el link (posiblemente Confirm Email está OFF):', linkError.message);
                            datosEnriquecidos['verification_link'] = `${appUrl}/login?error=verify_manual`;
                        } else if (linkData?.properties?.action_link) {
                            datosEnriquecidos['verification_link'] = linkData.properties.action_link;
                            console.log('[Dispatcher] Link de verificación generado correctamente');
                        }
                    } catch (err) {
                        console.error('[Dispatcher] Error crítico generando link:', err);
                        datosEnriquecidos['verification_link'] = `${appUrl}/login`;
                    }
                }
            }

            // Datos adicionales de la tabla (Suscripción, etc.)
            const { data: dbUser } = await supabase
                .from('users')
                .select('plan_id, fecha_vencimiento_plan, plan_expires_at, link_pago_manual, codigo_referido_personal')
                .eq('id', targetId)
                .maybeSingle();

            if (dbUser) {
                if (dbUser.codigo_referido_personal) {
                    datosEnriquecidos['codigo_referido_personal'] = dbUser.codigo_referido_personal;
                }
                if (dbUser.plan_id) {
                    const { data: plan } = await supabase
                        .from('plans')
                        .select('name, price_monthly, features')
                        .or(`id.eq.${dbUser.plan_id},slug.eq.${dbUser.plan_id}`)
                        .maybeSingle();
                    if (plan) {
                        datosEnriquecidos['plan_nombre'] = String(plan.name);
                        datosEnriquecidos['plan_precio'] = plan.price_monthly != null ? String(plan.price_monthly) : '0.00';
                        if (Array.isArray(plan.features)) {
                            datosEnriquecidos['plan_detalles'] = plan.features.map((f: string) => `• ${f}`).join('<br>');
                        }
                    }
                }
                const fechaVenc = dbUser.fecha_vencimiento_plan || dbUser.plan_expires_at;
                if (fechaVenc) {
                    const venc = new Date(fechaVenc);
                    const hoy = new Date(); hoy.setHours(0,0,0,0); venc.setHours(0,0,0,0);
                    datosEnriquecidos['fecha_proximo_cobro'] = venc.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                    datosEnriquecidos['dias_restantes'] = String(Math.max(0, Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))));
                }
                datosEnriquecidos['link_pago'] = dbUser.link_pago_manual || `${appUrl}/configuracion`;
            }
        }

        // ============================================================
        // MODO PRUEBA MANUAL: plantilla_id sin trigger real
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
            const toEmail = email_destino_prueba || datosEnriquecidos['email'] || datosEnriquecidos['usuario_email'] || datos['usuario_email'];

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
                const emailServiceUrl = `${supabaseUrl}/functions/v1/email-service`;
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
                    })
                });

                if (!emailResponse.ok) throw new Error(`email-service responded ${emailResponse.status}`);
            } catch (sendError: any) {
                estado = 'fallido';
                razonError = sendError.message;
            }

            // Registrar en historial como prueba
            await supabase.from('email_historial').insert({
                plantilla_id: plantilla.id,
                trigger_id: null,
                usuario_id: targetUserId || null,
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
            console.error('[email-trigger-dispatcher] Trigger no encontrado o inactivo:', codigo_evento);
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
            return new Response( JSON.stringify({ error: 'Error interno' }), { status: 500, headers: corsHeaders });
        }

        if (!asociaciones || asociaciones.length === 0) {
            return new Response(
                JSON.stringify({ emails_enviados: 0, mensaje: 'No hay plantillas activas' }),
                { status: 200, headers: corsHeaders }
            );
        }

        let emailsEnviados = 0;
        const resultados: any[] = [];

        // 4. Enviar un email por cada plantilla asociada
        for (const asociacion of asociaciones) {
            const plantilla = (asociacion as any).email_templates;
            if (!plantilla) continue;

            const senderPrefix = plantilla.sender_prefix || 'support';
            const senderName = plantilla.sender_name || nombreEmpresa;
            const fromEmail = `${senderPrefix}@${emailDomain}`;
            const fromFull = `${senderName} <${fromEmail}>`;

            // Determinar email destinatario (Priorizar datosEnriquecidos)
            const toEmail = (tipo_envio === 'prueba' && email_destino_prueba)
                ? email_destino_prueba
                : (datosEnriquecidos['email'] || datosEnriquecidos['usuario_email'] || datos['usuario_email'] || datos['email'] || datos['lider_email']);

            if (!toEmail) {
                console.warn('[email-trigger-dispatcher] Sin destinatario para trigger', codigo_evento);
                continue;
            }

            // Reemplazar variables
            const asuntoFinal = reemplazarVariables(plantilla.subject || '', datosEnriquecidos);
            const htmlFinal = reemplazarVariables(plantilla.html_content || '', datosEnriquecidos);

            let estado: 'enviado' | 'fallido' = 'enviado';
            let razonError: string | null = null;

            try {
                const emailResponse = await fetch(`${supabaseUrl}/functions/v1/email-service`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                    },
                    body: JSON.stringify({ to: toEmail, from: fromFull, subject: asuntoFinal, html: htmlFinal })
                });

                if (!emailResponse.ok) throw new Error(`Status ${emailResponse.status}`);
                emailsEnviados++;
            } catch (sendError: any) {
                estado = 'fallido';
                razonError = sendError.message;
            }

            // Registrar historial
            await supabase.from('email_historial').insert({
                plantilla_id: plantilla.id,
                trigger_id: tipo_envio === 'prueba' ? null : trigger.id,
                usuario_id: targetUserId || null,
                usuario_email: toEmail,
                asunto_enviado: asuntoFinal,
                contenido_html_enviado: htmlFinal,
                from_email: fromEmail,
                from_name: senderName,
                estado,
                razon_error: razonError,
                tipo_envio,
            });

            resultados.push({ plantilla: plantilla.name, email: toEmail, estado });
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
