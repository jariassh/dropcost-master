import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Subscription Reminder Cron
 * 
 * Esta función se ejecuta diariamente (programada vía pg_cron o Supabase Cron).
 * Detecta usuarios cuyo plan vence en 2 días, 1 día o hoy,
 * y dispara los emails de recordatorio correspondientes.
 * 
 * Eventos disparados:
 *   - SUSCRIPCION_RENOVACION_2_DIAS  (2 días antes)
 *   - SUSCRIPCION_RENOVACION_1_DIA   (1 día antes)
 *   - SUSCRIPCION_RENOVACION_HOY     (el mismo día de vencimiento)
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

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Definir los 3 umbrales de días
        const triggers = [
            { dias: 2, evento: 'SUSCRIPCION_RENOVACION_2_DIAS' },
            { dias: 1, evento: 'SUSCRIPCION_RENOVACION_1_DIA' },
            { dias: 0, evento: 'SUSCRIPCION_RENOVACION_HOY' },
        ];

        const results: Record<string, any>[] = [];

        for (const { dias, evento } of triggers) {
            const targetDate = new Date(hoy);
            targetDate.setDate(targetDate.getDate() + dias);

            const fechaInicio = new Date(targetDate);
            fechaInicio.setHours(0, 0, 0, 0);
            const fechaFin = new Date(targetDate);
            fechaFin.setHours(23, 59, 59, 999);

            // Buscar usuarios cuyo plan vence exactamente en ese rango de días
            // Revisa tanto fecha_vencimiento_plan como plan_expires_at
            const { data: usuarios, error } = await supabase
                .from('users')
                .select('id, email, nombres, apellidos, plan_id, fecha_vencimiento_plan, plan_expires_at')
                .eq('estado_suscripcion', 'activa')
                .neq('plan_id', 'plan_free')
                .or(
                    `fecha_vencimiento_plan.gte.${fechaInicio.toISOString()},plan_expires_at.gte.${fechaInicio.toISOString()}`
                )
                .or(
                    `fecha_vencimiento_plan.lte.${fechaFin.toISOString()},plan_expires_at.lte.${fechaFin.toISOString()}`
                );

            if (error) {
                console.error(`[Cron] Error buscando usuarios para ${evento}:`, error);
                results.push({ evento, error: error.message, enviados: 0 });
                continue;
            }

            // Filtrar más precisamente en código (el .or con múltiples condiciones puede ser ambiguo)
            const usuariosFiltrados = (usuarios || []).filter(u => {
                const fechaVenc = u.fecha_vencimiento_plan || u.plan_expires_at;
                if (!fechaVenc) return false;
                const fv = new Date(fechaVenc);
                fv.setHours(0, 0, 0, 0);
                return fv.getTime() === targetDate.getTime();
            });

            console.log(`[Cron] ${evento}: ${usuariosFiltrados.length} usuarios encontrados para ${targetDate.toISOString().split('T')[0]}`);

            let enviados = 0;
            const errores: string[] = [];

            for (const usuario of usuariosFiltrados) {
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
                        console.log(`[Cron] Email enviado a ${usuario.email} para ${evento}`);
                    } else {
                        const errBody = await res.text();
                        errores.push(`${usuario.email}: ${errBody}`);
                        console.error(`[Cron] Error enviando a ${usuario.email}:`, errBody);
                    }
                } catch (e: any) {
                    errores.push(`${usuario.email}: ${e.message}`);
                    console.error(`[Cron] Excepción para ${usuario.email}:`, e);
                }
            }

            results.push({
                evento,
                fecha_objetivo: targetDate.toISOString().split('T')[0],
                usuarios_encontrados: usuariosFiltrados.length,
                enviados,
                errores,
            });
        }

        console.log('[Cron] Resumen de ejecución:', JSON.stringify(results));

        return new Response(
            JSON.stringify({ ok: true, timestamp: new Date().toISOString(), results }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('[Cron] Error general:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
