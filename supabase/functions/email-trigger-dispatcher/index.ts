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
        const appUrl = config?.site_url || 'https://app.dropcost.com';
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
        // Valores dinámicos desde sistema_referidos_config del admin
        // ============================================================
        const { data: referralConfig } = await supabase
            .from('sistema_referidos_config')
            .select('comision_nivel_1, comision_nivel_2, meses_vigencia_comision, referidos_minimo_lider')
            .order('fecha_actualizacion', { ascending: false })
            .limit(1)
            .maybeSingle();

        datosEnriquecidos['comision_referido_nivel1'] = String(referralConfig?.comision_nivel_1 ?? 15);
        datosEnriquecidos['comision_referido_nivel2'] = String(referralConfig?.comision_nivel_2 ?? 5);
        datosEnriquecidos['vigencia_meses_comision'] = String(referralConfig?.meses_vigencia_comision ?? 12);
        datosEnriquecidos['requisito_para_lider'] = String(referralConfig?.referidos_minimo_lider ?? 50);

        // Obtener cantidad de referidos actuales del usuario (si tiene perfil de líder)
        const recipientUserId = datosEnriquecidos['usuario_id'] || datos['usuario_id'];
        if (recipientUserId) {
            const { data: liderData } = await supabase
                .from('referidos_lideres')
                .select('total_referidos')
                .eq('user_id', recipientUserId)
                .maybeSingle();
            datosEnriquecidos['referidos_cantidad'] = String(liderData?.total_referidos ?? 0);
        } else {
            datosEnriquecidos['referidos_cantidad'] = '0';
        }

        console.log('[Dispatcher] Referral config: nivel1=', datosEnriquecidos['comision_referido_nivel1'], 'nivel2=', datosEnriquecidos['comision_referido_nivel2'], 'requisito_lider=', datosEnriquecidos['requisito_para_lider'], 'referidos_cantidad=', datosEnriquecidos['referidos_cantidad']);

        // ============================================================
        // CASO ESPECIAL: REFERIDO_REGISTRADO → email al LÍDER (referidor)
        // El trigger llega con codigo_referido (del líder) y referido_nombre (nuevo usuario)
        // ============================================================
        if (codigo_evento === 'REFERIDO_REGISTRADO' && datos['codigo_referido']) {
            const { data: lider, error: liderError } = await supabase
                .from('users')
                .select('id, nombres, apellidos, email, plan_id, codigo_referido_personal')
                .eq('codigo_referido_personal', datos['codigo_referido'])
                .maybeSingle();

            if (liderError) console.error('[Dispatcher] Error buscando líder por codigo_referido:', liderError);

            if (lider) {
                // El destinatario es el LÍDER, no el nuevo usuario
                datosEnriquecidos['usuario_id'] = lider.id;
                datosEnriquecidos['nombres'] = lider.nombres || '';
                datosEnriquecidos['apellidos'] = lider.apellidos || '';
                datosEnriquecidos['email'] = lider.email || '';
                datosEnriquecidos['usuario_email'] = lider.email || '';
                // Nombre del nuevo registrado que usó el link
                datosEnriquecidos['referido_nombre'] = datos['referido_nombre'] || 'tu invitado';
                datosEnriquecidos['referido_email'] = datos['referido_email'] || '';
                datosEnriquecidos['fecha_registro'] = datos['fecha_registro'] || new Date().toISOString().split('T')[0];
                datosEnriquecidos['codigo_referido_personal'] = lider.codigo_referido_personal || datos['codigo_referido'];
                console.log(`[Dispatcher] REFERIDO_REGISTRADO → email a líder ${lider.email}, referido: ${datos['referido_nombre']}`);
            } else {
                console.warn('[Dispatcher] REFERIDO_REGISTRADO: líder no encontrado para codigo_referido:', datos['codigo_referido']);
            }
        }

        // ============================================================
        // ENRIQUECIMIENTO AUTOMÁTICO DE DATOS DE SUSCRIPCIÓN
        // ============================================================
        if (datos['usuario_id'] || datos['id']) {
            const uid = datos['usuario_id'] || datos['id'];
            console.log('[Dispatcher] Enriqueciendo datos para usuario:', uid);
            
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('plan_id, fecha_vencimiento_plan, plan_expires_at, created_at, fecha_registro, link_pago_manual, nombres, apellidos, email, codigo_referido_personal')
                .eq('id', uid)
                .maybeSingle();

            if (userError) console.error('[Dispatcher] Error buscando usuario:', userError);

            if (user) {
                console.log('[Dispatcher] Usuario encontrado. plan_id:', user.plan_id);
                
                // Asegurar datos básicos
                datosEnriquecidos['nombres'] = datos['nombres'] || user.nombres || '';
                datosEnriquecidos['apellidos'] = datos['apellidos'] || user.apellidos || '';
                datosEnriquecidos['email'] = datos['email'] || user.email || '';
                // Código de referido personal del usuario
                if (user.codigo_referido_personal) {
                    datosEnriquecidos['codigo_referido_personal'] = user.codigo_referido_personal;
                    datosEnriquecidos['codigo_referido'] = user.codigo_referido_personal;
                }
                // referido_nombre: nombre de quien se registró con el link (viene en datos desde el trigger de registro)
                if (datos['referido_nombre']) {
                    datosEnriquecidos['referido_nombre'] = datos['referido_nombre'];
                }

                if (user.plan_id) {
                    const planId = user.plan_id;
                    console.log('[Dispatcher] Buscando plan para planId:', planId);
                    
                    // Intento 1: buscar por UUID (id)
                    let { data: plan } = await supabase
                        .from('plans')
                        .select('name, price_monthly, features')
                        .eq('id', planId)
                        .maybeSingle();
                    
                    // Intento 2: si no encontró por ID (era un slug), buscar por slug
                    if (!plan) {
                        const { data: planBySlug } = await supabase
                            .from('plans')
                            .select('name, price_monthly, features')
                            .eq('slug', planId)
                            .maybeSingle();
                        plan = planBySlug;
                    }

                    if (plan) {
                        console.log('[Dispatcher] Plan encontrado:', plan.name);
                        datosEnriquecidos['plan_nombre'] = String(plan.name);
                        // IMPORTANTE: price_monthly puede ser 0, usar != null
                        datosEnriquecidos['plan_precio'] = plan.price_monthly != null
                            ? String(plan.price_monthly)
                            : '0.00';
                        
                        if (Array.isArray(plan.features)) {
                            datosEnriquecidos['plan_detalles'] = plan.features
                                .map((f: string) => `• ${f}`)
                                .join('<br>');
                        }
                    } else {
                        console.warn('[Dispatcher] Plan NO encontrado en DB. planId buscado:', planId);
                        const fallbackName = planId.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                        datosEnriquecidos['plan_nombre'] = fallbackName;
                        if (!datosEnriquecidos['plan_precio']) datosEnriquecidos['plan_precio'] = '0.00';
                    }
                }

                // Fechas y Links - con fallback calculado
                if (user.fecha_vencimiento_plan) {
                    const fecha = new Date(user.fecha_vencimiento_plan);
                    datosEnriquecidos['fecha_proximo_cobro'] = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                } else if (user.plan_expires_at) {
                    // Fallback: columna plan_expires_at (de pagos via Mercado Pago)
                    const fecha = new Date(user.plan_expires_at);
                    datosEnriquecidos['fecha_proximo_cobro'] = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                } else if (user.created_at || user.fecha_registro) {
                    // Fallback final: calcular 30 días desde registro (plan activo antes de implementar el campo)
                    const baseDate = new Date(user.created_at || user.fecha_registro);
                    baseDate.setDate(baseDate.getDate() + 30);
                    datosEnriquecidos['fecha_proximo_cobro'] = baseDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                    console.log('[Dispatcher] fecha_proximo_cobro calculada desde created_at:', datosEnriquecidos['fecha_proximo_cobro']);
                }
                
                // Calcular dias_restantes dinámicamente SIEMPRE al momento del envío.
                // Una vez que la migración corra y el cron actualice el campo, podemos leerlo d BD.
                // Por ahora: calcular al vuelo es la fuente de verdad más confiable.
                const fechaVenc = user.fecha_vencimiento_plan || user.plan_expires_at;
                if (fechaVenc) {
                    const hoy = new Date();
                    hoy.setHours(0, 0, 0, 0);
                    const vencimiento = new Date(fechaVenc);
                    vencimiento.setHours(0, 0, 0, 0);
                    const diff = vencimiento.getTime() - hoy.getTime();
                    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    datosEnriquecidos['dias_restantes'] = String(Math.max(0, dias));
                    datosEnriquecidos['fecha_vencimiento'] = vencimiento.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                    console.log('[Dispatcher] dias_restantes calculado:', datosEnriquecidos['dias_restantes'], '| Vence:', datosEnriquecidos['fecha_vencimiento']);
                } else if (user.created_at || user.fecha_registro) {
                    // Fallback: created_at + 30 días (usuario sin fecha de vencimiento explícita)
                    const base = new Date(user.created_at || user.fecha_registro);
                    const venc = new Date(base);
                    venc.setDate(venc.getDate() + 30);
                    const hoy = new Date(); hoy.setHours(0,0,0,0);
                    venc.setHours(0,0,0,0);
                    const diff = venc.getTime() - hoy.getTime();
                    datosEnriquecidos['dias_restantes'] = String(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
                    datosEnriquecidos['fecha_vencimiento'] = venc.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
                    console.log('[Dispatcher] dias_restantes (fallback created_at+30):', datosEnriquecidos['dias_restantes']);
                }

                datosEnriquecidos['link_pago'] = user.link_pago_manual || `${appUrl}/configuracion`;
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
                console.log('[email-trigger-dispatcher] Invoking email-service at:', emailServiceUrl);

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

                if (!emailResponse.ok) {
                    const errorText = await emailResponse.text();
                    console.error('[email-trigger-dispatcher] email-service failed with status:', emailResponse.status, errorText);
                    throw new Error(`email-service responded ${emailResponse.status}: ${errorText}`);
                } else {
                    const responseData = await emailResponse.json().catch(() => ({}));
                    console.log('[email-trigger-dispatcher] email-service success:', responseData);
                }
            } catch (sendError: any) {
                console.error('[email-trigger-dispatcher] Exception calling email-service:', sendError);
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
            console.error('[email-trigger-dispatcher] Trigger no encontrado:', codigo_evento, triggerError);
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

        // Si no hay plantillas asociadas -> silencio (comportamiento esperado)
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
                console.warn('[email-trigger-dispatcher] Sin email destinatario para trigger', codigo_evento);
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
                    })
                });

                if (!emailResponse.ok) {
                    const errorBody = await emailResponse.text();
                    throw new Error(`email-service respondió ${emailResponse.status}: ${errorBody}`);
                }

                emailsEnviados++;
            } catch (sendError: any) {
                console.error('[email-trigger-dispatcher] Error enviando email:', sendError);
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
                razon_error: razonError
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
