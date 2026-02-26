-- DropCost Master: Calculate KPIs RPC
-- Version: 1.0
-- Date: 2026-02-26

-- =============================================
-- 1. FUNCTION: calculate_kpis
-- =============================================
-- Consolida las ventas de shopify y el gasto de meta ads por tienda
-- Formula: (Ventas - GastosAdicionales - CPA) / (1 - %Devoluciones)

CREATE OR REPLACE FUNCTION public.calculate_kpis(
  p_tienda_id UUID,
  p_start_date DATE,
  p_end_date DATE
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
      AND DATE(timezone('utc'::text, o.shopify_created_at)) = d.calc_date
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
      AND DATE(timezone('utc'::text, m.fecha_sincronizacion)) = d.calc_date
    GROUP BY d.calc_date
  )
  SELECT 
    d.calc_date AS fecha,
    sd.v_count::INTEGER AS ventas_count,
    sd.ingresos::NUMERIC AS ingresos_totales,
    md.gasto::NUMERIC AS gasto_publicidad,
    -- CPA = Gasto / Conversiones ó Gasto / Ventas de Shopify
    -- En este contexto usaremos las ventas de Shopify para el CPA real o las conversiones de Meta si hay
    CASE 
      WHEN sd.v_count > 0 THEN (md.gasto / sd.v_count)::NUMERIC
      ELSE 0::NUMERIC
    END AS cpa_promedio,
    -- ROAS = Ingresos / Gasto
    CASE 
      WHEN md.gasto > 0 THEN (sd.ingresos / md.gasto)::NUMERIC
      ELSE 0::NUMERIC
    END AS roas_real,
    
    -- Formula: (Ventas - GastosAdicionales - CPA) / (1 - %Devoluciones)
    -- Por defecto consideraremos 10% devoluciones y Gastos Adicionales de 0 para la simplificación global,
    -- a menos que se obtenga de configuración de tienda, que de momento no estamos inyectando.
    -- Mantenemos 0 adicionales y 0% devoluciones por defecto si no hay conf global
    (
      (sd.ingresos - md.gasto) / (1 - 0.0)
    )::NUMERIC AS margen_real

  FROM dates d
  JOIN shopify_data sd ON d.calc_date = sd.calc_date
  JOIN meta_data md ON d.calc_date = md.calc_date
  ORDER BY d.calc_date DESC;

END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.calculate_kpis(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_kpis(UUID, DATE, DATE) TO service_role;
