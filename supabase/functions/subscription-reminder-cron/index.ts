import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Subscription Reminder Cron
 *
 * Paso 1 (SIEMPRE): Actualiza dias_restantes en la tabla users para TODOS los usuarios
 *   activos, calculado desde UTC-5 (hora Colombia) hacia la fecha de vencimiento.
 *
 * Paso 2 (TRIGGERS): Después de actualizar, busca usuarios por dias_restantes = 2, 1, 0
 *   y dispara los emails de recordatorio.
 *
 * Ejecutar diariamente a las 9:00 AM UTC (4:00 AM Colombia) vía pg_cron.
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const dispatcherUrl = `${supabaseUrl}/functions/v1/email-trigger-dispatcher`;

        // ============================================================
        // PASO 1: Actualizar dias_restantes para TODOS los usuarios activos
        // Usando UTC-5 (America/Bogota) como referencia de "hoy"
        // ============================================================
        console.log('[Cron] Iniciando actualización de dias_restantes...');

        // Hora actual en Colombia (UTC-5)
        const ahora = new Date();
        // Colombia es UTC-5 (sin horario de verano)
        const offsetColombia = -5 * 60; // minutos
        const utcMinutes = ahora.getTime() / 60000 + ahora.getTimezoneOffset();
        const colombiaMs = (utcMinutes + offsetColombia) * 60000;
        const hoyCol = new Date(colombiaMs);
        hoyCol.setHours(0, 0, 0, 0);

        // Traer todos los usuarios activos con campo de vencimiento
        const { data: todosUsuarios, error: fetchError } = await supabase
            .from('users')
            .select('id, fecha_vencimiento_plan, plan_expires_at, created_at, fecha_registro')
            .eq('estado_suscripcion', 'activa')
            .neq('plan_id', 'plan_free');

        if (fetchError) {
            console.error('[Cron] Error al traer usuarios activos:', fetchError);
            throw fetchError;
        }

        console.log(`[Cron] ${todosUsuarios?.length || 0} usuarios activos encontrados para actualizar.`);

        let actualizados = 0;
        const erroresActualizacion: string[] = [];

        for (const u of (todosUsuarios || [])) {
            // Resolver la fecha de vencimiento: prioridad fecha_vencimiento_plan > plan_expires_at > created_at+30
            let fechaVenc: Date | null = null;

            if (u.fecha_vencimiento_plan) {
                fechaVenc = new Date(u.fecha_vencimiento_plan);
            } else if (u.plan_expires_at) {
                fechaVenc = new Date(u.plan_expires_at);
            } else if (u.created_at || u.fecha_registro) {
                fechaVenc = new Date(u.created_at || u.fecha_registro);
                fechaVenc.setDate(fechaVenc.getDate() + 30);
            }

            if (!fechaVenc) {
                // Sin fecha de vencimiento → no podemos calcular
                continue;
            }

            // Truncar fecha de vencimiento al inicio del día (Colombia)
            const vencCol = new Date(fechaVenc);
            vencCol.setHours(0, 0, 0, 0);

            const diffMs = vencCol.getTime() - hoyCol.getTime();
            const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

            const { error: updateError } = await supabase
                .from('users')
                .update({ dias_restantes: diasRestantes })
                .eq('id', u.id);

            if (updateError) {
                erroresActualizacion.push(`${u.id}: ${updateError.message}`);
                console.error(`[Cron] Error actualizando dias_restantes para ${u.id}:`, updateError);
            } else {
                actualizados++;
            }
        }

        console.log(`[Cron] dias_restantes actualizado para ${actualizados} usuarios. Errores: ${erroresActualizacion.length}`);

        // ============================================================
        // PASO 2: Disparar emails según dias_restantes actualizado
        // ============================================================
        const triggerMap = [
            { diasRestantes: 2, evento: 'SUSCRIPCION_RENOVACION_2_DIAS' },
            { diasRestantes: 1, evento: 'SUSCRIPCION_RENOVACION_1_DIA' },
            { diasRestantes: 0, evento: 'SUSCRIPCION_RENOVACION_HOY' },
        ];

        const resultsTriggers: Record<string, any>[] = [];

        for (const { diasRestantes, evento } of triggerMap) {
            const { data: usuarios, error: triggerError } = await supabase
                .from('users')
                .select('id, email, nombres, apellidos, plan_id')
                .eq('estado_suscripcion', 'activa')
                .neq('plan_id', 'plan_free')
                .eq('dias_restantes', diasRestantes);

            if (triggerError) {
                console.error(`[Cron] Error buscando usuarios con dias_restantes=${diasRestantes}:`, triggerError);
                resultsTriggers.push({ evento, error: triggerError.message, enviados: 0 });
                continue;
            }

            console.log(`[Cron] ${evento}: ${usuarios?.length || 0} usuarios con dias_restantes=${diasRestantes}`);

            let enviados = 0;
            const erroresTrigger: string[] = [];

            for (const usuario of (usuarios || [])) {
                try {
                    const payload = {
                        codigo_evento: evento,
                        tipo_envio: 'automatico',
                        datos: {
                            usuario_id: usuario.id,
                            usuario_email: usuario.email,
                            email: usuario.email,
                            nombres: usuario.nombres || '',
                            apellidos: usuario.apellidos || '',
                        }
                    };

                    const res = await fetch(dispatcherUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${supabaseServiceKey}`,
                        },
                        body: JSON.stringify(payload),
                    });

                    if (res.ok) {
                        enviados++;
                        console.log(`[Cron] ✅ Email enviado a ${usuario.email} → ${evento}`);
                    } else {
                        const errBody = await res.text();
                        erroresTrigger.push(`${usuario.email}: ${errBody}`);
                        console.error(`[Cron] ❌ Error enviando a ${usuario.email}:`, errBody);
                    }
                } catch (e: any) {
                    erroresTrigger.push(`${usuario.email}: ${e.message}`);
                    console.error(`[Cron] Excepción para ${usuario.email}:`, e);
                }
            }

            resultsTriggers.push({
                evento,
                dias_restantes: diasRestantes,
                usuarios_encontrados: usuarios?.length || 0,
                enviados,
                errores: erroresTrigger,
            });
        }

        const resumen = {
            ok: true,
            timestamp: new Date().toISOString(),
            hoy_colombia: hoyCol.toISOString().split('T')[0],
            actualizacion: { usuarios_actualizados: actualizados, errores: erroresActualizacion },
            triggers: resultsTriggers,
        };

        console.log('[Cron] 🏁 Resumen final:', JSON.stringify(resumen));

        return new Response(JSON.stringify(resumen), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[Cron] 💥 Error general:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
