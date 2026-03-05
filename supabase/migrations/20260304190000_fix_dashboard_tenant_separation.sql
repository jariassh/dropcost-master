-- Migration: Fix dashboard pro data tenant separation
-- Date: 2026-03-04
-- Author: AI Assistant

CREATE OR REPLACE FUNCTION public.get_dashboard_pro_data(
    p_tienda_id uuid,
    p_dias integer DEFAULT 30,
    p_timezone text DEFAULT 'UTC'::text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_usuario_id UUID;
    v_ventas_totales NUMERIC;
    v_gastos_meta NUMERIC;
    v_gastos_logis NUMERIC;
    v_ordenes_count INTEGER;
    v_roas_promedio NUMERIC;
    v_aov_promedio NUMERIC;
    v_cvr_promedio NUMERIC;
    v_charts JSONB;
    v_start_timestamp TIMESTAMPTZ;
BEGIN
    -- Obtener el usuario_id de la tienda
    SELECT usuario_id INTO v_usuario_id FROM public.tiendas WHERE id = p_tienda_id;

    -- Determinar el inicio del periodo
    v_start_timestamp := (CURRENT_TIMESTAMP AT TIME ZONE p_timezone - (p_dias || ' days')::INTERVAL) AT TIME ZONE p_timezone;

    -- Ventas Reales, Conteo y Gastos Logísticos (del Excel)
    SELECT 
        COALESCE(SUM(total_orden), 0), 
        COUNT(*),
        COALESCE(SUM(precio_flete + comision_dropi + costo_devolucion + total_proveedor), 0)
    INTO v_ventas_totales, v_ordenes_count, v_gastos_logis
    FROM public.orders
    WHERE tienda_id = p_tienda_id
    AND fecha_orden >= v_start_timestamp;

    -- Gastos de Meta Ads (Filtrado estricto por campaña vinculada a la tienda mediante costeos)
    SELECT 
        COALESCE(SUM(m.gasto_real), 0), 
        COALESCE(AVG(CASE WHEN m.gasto_real > 0 THEN (m.valor_acciones / m.gasto_real) ELSE 0 END), 0),
        COALESCE(AVG(CASE WHEN m.conversiones > 0 THEN m.valor_acciones / m.conversiones ELSE 0 END), 0),
        COALESCE(AVG(CASE WHEN m.clics > 0 THEN m.conversiones::numeric / m.clics ELSE 0 END), 0)
    INTO v_gastos_meta, v_roas_promedio, v_aov_promedio, v_cvr_promedio
    FROM public.data_meta_ads m
    JOIN public.costeos c ON m.id_campana_meta = c.meta_campaign_id
    WHERE c.tienda_id = p_tienda_id
    AND m.fecha_sincronizacion >= v_start_timestamp;

    -- Gráfico de Tendencia (Ventas vs Gastos separados)
    SELECT jsonb_agg(d) INTO v_charts
    FROM (
        WITH dates AS (
            SELECT generate_series(v_start_timestamp::date, (CURRENT_TIMESTAMP AT TIME ZONE p_timezone)::date, '1 day'::interval)::date AS calc_date
        ),
        daily_orders AS (
            SELECT 
                timezone(p_timezone, fecha_orden)::date as fecha,
                COALESCE(SUM(total_orden), 0) as ventas,
                COALESCE(SUM(precio_flete + comision_dropi + costo_devolucion + total_proveedor), 0) as logistica
            FROM public.orders
            WHERE tienda_id = p_tienda_id
            AND fecha_orden >= v_start_timestamp
            GROUP BY 1
        ),
        daily_meta AS (
            SELECT 
                timezone(p_timezone, m.fecha_sincronizacion)::date as fecha,
                COALESCE(SUM(m.gasto_real), 0) as meta_spend
            FROM public.data_meta_ads m
            JOIN public.costeos c ON m.id_campana_meta = c.meta_campaign_id
            WHERE c.tienda_id = p_tienda_id
            AND m.fecha_sincronizacion >= v_start_timestamp
            GROUP BY 1
        )
        SELECT 
            TO_CHAR(d.calc_date, 'YYYY-MM-DD') as fecha,
            COALESCE(o.ventas, 0) as ventas,
            COALESCE(o.logistica, 0) as gasto_logistica,
            COALESCE(m.meta_spend, 0) as gasto_meta
        FROM dates d
        LEFT JOIN daily_orders o ON d.calc_date = o.fecha
        LEFT JOIN daily_meta m ON d.calc_date = m.fecha
        ORDER BY d.calc_date ASC
    ) d;

    RETURN jsonb_build_object(
        'kpis', jsonb_build_object(
            'ganancia_total', v_ventas_totales - (v_gastos_meta + v_gastos_logis),
            'ventas_totales', v_ventas_totales,
            'gastos_totales', v_gastos_meta + v_gastos_logis,
            'gastos_meta', v_gastos_meta,
            'gastos_logistica', v_gastos_logis,
            'cpa_promedio', CASE WHEN v_ordenes_count > 0 THEN v_gastos_meta / v_ordenes_count ELSE 0 END,
            'roas_promedio', v_roas_promedio,
            'aov_promedio', v_aov_promedio,
            'cvr_promedio', v_cvr_promedio,
            'ordenes_count', v_ordenes_count
        ),
        'charts', jsonb_build_object(
            'tendencia', COALESCE(v_charts, '[]'::jsonb)
        )
    );
END;
$function$;
