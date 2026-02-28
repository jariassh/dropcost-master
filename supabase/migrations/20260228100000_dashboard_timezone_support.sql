-- ==========================================
-- Soporte para Timezones en Dashboard
-- Author: Backend Engineer
-- Date: 2026-02-27
-- ==========================================

-- 1. Actualizar get_dashboard_pro_data para soportar p_timezone
CREATE OR REPLACE FUNCTION public.get_dashboard_pro_data(
    p_tienda_id UUID, 
    p_dias INTEGER DEFAULT 30,
    p_timezone TEXT DEFAULT 'UTC'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ventas_totales NUMERIC;
    v_gastos_totales NUMERIC;
    v_ordenes_count INTEGER;
    v_roas_promedio NUMERIC;
    v_aov_promedio NUMERIC;
    v_cvr_promedio NUMERIC;
    v_charts JSONB;
    v_start_timestamp TIMESTAMPTZ;
BEGIN
    -- Determinar el inicio del periodo en UTC basado en la zona horaria del usuario
    v_start_timestamp := (CURRENT_TIMESTAMP AT TIME ZONE p_timezone - (p_dias || ' days')::INTERVAL) AT TIME ZONE p_timezone;

    -- Ventas Reales (Orders)
    SELECT COALESCE(SUM(total_orden), 0), COUNT(*)
    INTO v_ventas_totales, v_ordenes_count
    FROM public.orders
    WHERE tienda_id = p_tienda_id
    AND fecha_orden >= v_start_timestamp;

    -- Gastos Reales (Meta Spend en Costeos vinculados)
    -- En esta fase Master, meta_stats se asocia a la tienda.
    SELECT COALESCE(SUM(meta_spend), 0), 
           COALESCE(AVG(meta_roas), 0),
           COALESCE(AVG(meta_aov), 0),
           COALESCE(AVG(meta_cvr), 0)
    INTO v_gastos_totales, v_roas_promedio, v_aov_promedio, v_cvr_promedio
    FROM public.costeos
    WHERE tienda_id = p_tienda_id;

    -- Gráfico de Ventas Diarias (Agrupado por el día LOCAL del usuario)
    SELECT jsonb_agg(d) INTO v_charts
    FROM (
        SELECT 
            TO_CHAR(timezone(p_timezone, fecha_orden)::date, 'YYYY-MM-DD') as fecha,
            COALESCE(SUM(total_orden), 0) as ventas
        FROM public.orders
        WHERE tienda_id = p_tienda_id
        AND fecha_orden >= v_start_timestamp
        GROUP BY 1
        ORDER BY 1 ASC
    ) d;

    RETURN jsonb_build_object(
        'kpis', jsonb_build_object(
            'ganancia_total', v_ventas_totales - v_gastos_totales,
            'ventas_totales', v_ventas_totales,
            'gastos_totales', v_gastos_totales,
            'roas_promedio', v_roas_promedio,
            'aov_promedio', v_aov_promedio,
            'cvr_promedio', v_cvr_promedio,
            'ordenes_count', v_ordenes_count,
            'server_time', NOW(),
            'user_time', timezone(p_timezone, NOW())
        ),
        'charts', jsonb_build_object(
            'ventas_diarias', COALESCE(v_charts, '[]'::jsonb)
        )
    );
END;
$$;

-- 2. Actualizar calculate_kpis para soportar p_timezone
CREATE OR REPLACE FUNCTION public.calculate_kpis(
  p_tienda_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_timezone TEXT DEFAULT 'UTC'
)
RETURNS TABLE (
  fecha DATE,
  ventas_count INTEGER,
  ingresos_totales NUMERIC,
  gasto_publicidad NUMERIC,
  cpa_promedio NUMERIC,
  roas_real NUMERIC,
  margen_real NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usuario_id UUID;
BEGIN
  -- Obtener el usuario_id de la tienda para consultar Meta Ads
  SELECT usuario_id INTO v_usuario_id FROM public.tiendas WHERE id = p_tienda_id;

  IF v_usuario_id IS NULL THEN
    RAISE EXCEPTION 'Tienda no encontrada';
  END IF;

  RETURN QUERY
  WITH dates AS (
    SELECT generate_series(p_start_date::timestamp, p_end_date::timestamp, '1 day'::interval)::date AS calc_date
  ),
  shopify_data AS (
    SELECT 
      d.calc_date,
      COUNT(o.id) AS v_count,
      COALESCE(SUM(o.total_price), 0) AS ingresos
    FROM dates d
    LEFT JOIN public.data_shopify_orders o 
      ON o.tienda_id = p_tienda_id 
      AND (timezone(p_timezone, o.shopify_created_at))::date = d.calc_date
      AND o.financial_status != 'refunded'
      AND o.cancelled_at IS NULL
    GROUP BY d.calc_date
  ),
  meta_data AS (
    SELECT 
      d.calc_date,
      COALESCE(SUM(m.gasto_real), 0) AS gasto,
      COALESCE(SUM(m.conversiones), 0) AS conversiones
    FROM dates d
    LEFT JOIN public.data_meta_ads m 
      ON m.usuario_id = v_usuario_id 
      AND (timezone(p_timezone, m.fecha_sincronizacion))::date = d.calc_date
    GROUP BY d.calc_date
  )
  SELECT 
    d.calc_date AS fecha,
    sd.v_count::INTEGER AS ventas_count,
    sd.ingresos::NUMERIC AS ingresos_totales,
    md.gasto::NUMERIC AS gasto_publicidad,
    CASE 
      WHEN sd.v_count > 0 THEN (md.gasto / sd.v_count)::NUMERIC
      ELSE 0::NUMERIC
    END AS cpa_promedio,
    CASE 
      WHEN md.gasto > 0 THEN (sd.ingresos / md.gasto)::NUMERIC
      ELSE 0::NUMERIC
    END AS roas_real,
    ((sd.ingresos - md.gasto) / (1 - 0.0))::NUMERIC AS margen_real
  FROM dates d
  JOIN shopify_data sd ON d.calc_date = sd.calc_date
  JOIN meta_data md ON d.calc_date = md.calc_date
  ORDER BY d.calc_date DESC;
END;
$$;
