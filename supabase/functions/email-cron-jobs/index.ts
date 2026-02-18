import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const resultados: Record<string, number> = {};

        // Helper: llamar al dispatcher
        async function dispararTrigger(codigo_evento: string, datos: Record<string, string>) {
            try {
                const res = await fetch(`${supabaseUrl}/functions/v1/email-trigger-dispatcher`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                    },
                    body: JSON.stringify({ codigo_evento, datos }),
                });
                if (!res.ok) {
                    const body = await res.text();
                    console.error(`[cron] Error disparando ${codigo_evento}:`, body);
                }
            } catch (err) {
                console.error(`[cron] Excepción disparando ${codigo_evento}:`, err);
            }
        }

        // ============================================================
        // 1. SUSCRIPCION_POR_VENCER
        //    Usuarios cuya suscripción vence en exactamente 3 días
        // ============================================================
        {
            const hoy = new Date();
            const en3Dias = new Date(hoy);
            en3Dias.setDate(hoy.getDate() + 3);
            const fechaInicio = en3Dias.toISOString().split('T')[0] + 'T00:00:00.000Z';
            const fechaFin = en3Dias.toISOString().split('T')[0] + 'T23:59:59.999Z';

            const { data: suscripciones } = await supabase
                .from('subscriptions')
                .select(`
                    id,
                    user_id,
                    plan_id,
                    end_date,
                    users!inner (nombres, apellidos, email)
                `)
                .eq('status', 'activa')
                .gte('end_date', fechaInicio)
                .lte('end_date', fechaFin);

            let count = 0;
            for (const sub of (suscripciones || [])) {
                const user = (sub as any).users;
                await dispararTrigger('SUSCRIPCION_POR_VENCER', {
                    usuario_nombre: `${user.nombres} ${user.apellidos}`,
                    usuario_email: user.email,
                    plan_nombre: sub.plan_id || 'Plan',
                    fecha_vencimiento: sub.end_date,
                    dias_restantes: '3',
                });
                count++;
            }
            resultados['SUSCRIPCION_POR_VENCER'] = count;
        }

        // ============================================================
        // 2. COMISION_PROXIMA_EXPIRAR
        //    Comisiones que vencen en exactamente 30 días
        // ============================================================
        {
            const hoy = new Date();
            const en30Dias = new Date(hoy);
            en30Dias.setDate(hoy.getDate() + 30);
            const fechaInicio = en30Dias.toISOString().split('T')[0] + 'T00:00:00.000Z';
            const fechaFin = en30Dias.toISOString().split('T')[0] + 'T23:59:59.999Z';

            const { data: comisiones } = await supabase
                .from('comisiones_referidos')
                .select(`
                    id,
                    usuario_id,
                    monto,
                    fecha_expiracion_comision,
                    users!inner (nombres, apellidos, email)
                `)
                .eq('estado', 'pendiente')
                .gte('fecha_expiracion_comision', fechaInicio)
                .lte('fecha_expiracion_comision', fechaFin);

            let count = 0;
            for (const comision of (comisiones || [])) {
                const user = (comision as any).users;
                await dispararTrigger('COMISION_PROXIMA_EXPIRAR', {
                    usuario_nombre: `${user.nombres} ${user.apellidos}`,
                    usuario_email: user.email,
                    monto_comision: String(comision.monto || 0),
                    fecha_expiracion: comision.fecha_expiracion_comision,
                    dias_restantes: '30',
                });
                count++;
            }
            resultados['COMISION_PROXIMA_EXPIRAR'] = count;
        }

        // ============================================================
        // 3. COMISION_EXPIRADA
        //    Comisiones cuya fecha_expiracion_comision <= hoy
        // ============================================================
        {
            const ahora = new Date().toISOString();

            const { data: expiradas } = await supabase
                .from('comisiones_referidos')
                .select(`
                    id,
                    usuario_id,
                    monto,
                    fecha_expiracion_comision,
                    users!inner (nombres, apellidos, email)
                `)
                .eq('estado', 'pendiente')
                .lte('fecha_expiracion_comision', ahora);

            let count = 0;
            for (const comision of (expiradas || [])) {
                const user = (comision as any).users;
                await dispararTrigger('COMISION_EXPIRADA', {
                    usuario_nombre: `${user.nombres} ${user.apellidos}`,
                    usuario_email: user.email,
                    monto_comision: String(comision.monto || 0),
                    fecha_expiracion: comision.fecha_expiracion_comision,
                });

                // Marcar como expirada en BD para no re-notificar
                await supabase
                    .from('comisiones_referidos')
                    .update({ estado: 'expirada' })
                    .eq('id', comision.id);

                count++;
            }
            resultados['COMISION_EXPIRADA'] = count;
        }

        // ============================================================
        // 4. PROXIMO_REFERIDO_PARA_LIDER
        //    Líderes en múltiplos de 10 referidos (10, 20, 30, 40)
        //    antes de llegar a 50 (umbral de siguiente nivel)
        // ============================================================
        {
            // Buscar líderes con total_referidos en múltiplos de 10 (entre 10 y 49)
            const { data: lideres } = await supabase
                .from('users')
                .select('id, nombres, apellidos, email, total_referidos')
                .eq('rol', 'lider')
                .gt('total_referidos', 0)
                .lt('total_referidos', 50);

            let count = 0;
            for (const lider of (lideres || [])) {
                const total = lider.total_referidos || 0;
                // Solo notificar si está en un múltiplo de 10
                if (total > 0 && total % 10 === 0) {
                    const siguienteHito = total + 10 <= 50 ? total + 10 : 50;
                    await dispararTrigger('PROXIMO_REFERIDO_PARA_LIDER', {
                        lider_nombre: `${lider.nombres} ${lider.apellidos}`,
                        lider_email: lider.email,
                        total_referidos: String(total),
                        referidos_para_siguiente_hito: String(siguienteHito - total),
                        siguiente_hito: String(siguienteHito),
                    });
                    count++;
                }
            }
            resultados['PROXIMO_REFERIDO_PARA_LIDER'] = count;
        }

        return new Response(
            JSON.stringify({ success: true, resultados }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('[email-cron-jobs] Error inesperado:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Error interno' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
