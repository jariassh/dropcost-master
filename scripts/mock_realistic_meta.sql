-- Asignar meta_campaign_id a los costeos principales
UPDATE public.costeos SET meta_campaign_id = '202602281' WHERE nombre_producto = 'Crema';
UPDATE public.costeos SET meta_campaign_id = '202602282' WHERE nombre_producto = 'Reloj Inteligente Ultra Pro';
UPDATE public.costeos SET meta_campaign_id = '202602283' WHERE nombre_producto = 'Audífonos Inalámbricos SoundBass';
UPDATE public.costeos SET meta_campaign_id = '202602284' WHERE nombre_producto = 'Licuadora Portátil NutriShake';
UPDATE public.costeos SET meta_campaign_id = '202602285' WHERE nombre_producto = 'Faja Reductora Térmica Xtreme';

-- Crear más ventas para Crema (ID: 8371e455-d4af-43fa-8e9c-6a2d7e6b9b5c) y otras para darle realismo
-- Eliminamos data de meta_ads vieja
DELETE FROM public.data_meta_ads;

DO $$ 
DECLARE
    r RECORD;
    i INT;
    v_date DATE;
    v_spend NUMERIC;
    v_roas NUMERIC;
    v_orders_count INT;
    v_costeo_id UUID;
    v_tienda_id UUID := 'cd3db7e9-8197-4f67-aabc-08cf2c2abf1c';
BEGIN
    -- Añadir órdenes ficticias para Crema si no tiene muchas
    SELECT id INTO v_costeo_id FROM costeos WHERE nombre_producto = 'Crema' AND tienda_id = v_tienda_id;
    
    IF v_costeo_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_orders_count FROM orders WHERE costeo_id = v_costeo_id;
        IF v_orders_count < 100 THEN
            FOR i IN 1..120 LOOP
                v_date := CURRENT_DATE - (random() * 30)::int;
                INSERT INTO public.orders (
                    tienda_id, estado_orden, numero_orden, fecha_orden,
                    cliente_nombre, cliente_email, cliente_telefono,
                    cliente_direccion, cliente_ciudad, cliente_departamento,
                    total_orden, costo_flete, metodo_pago,
                    vendedor_nombre, transportadora, numero_guia, status_guia,
                    producto_nombre, producto_variante, producto_codigo, cantidad, precio_unitario,
                    subtotal, costo_devolucion, comision_dropi, total_proveedor,
                    costeo_id
                ) VALUES (
                    v_tienda_id, 'ENTREGADO', 'MOCK-CREMA-' || i, (v_date || ' ' || floor(random() * 24) || ':' || floor(random() * 59) || ':00')::timestamp,
                    'Cliente ' || i, 'mock@cliente.com', '300000000',
                    'Calle falsa 123', 'Bogotá', 'Cundinamarca',
                    82650, 12000, 'Contra Entrega',
                    'Vendor', 'Servientrega', '1234567890', 'Entregado',
                    'Crema', 'Normal', 'CRE-001', 1, 82650,
                    82650, 0, 5000, 20000,
                    v_costeo_id
                );
            END LOOP;
        END IF;
    END IF;

    -- Generar datos para Meta Ads
    FOR r IN SELECT * FROM costeos WHERE meta_campaign_id IS NOT NULL AND tienda_id = v_tienda_id LOOP
        -- Generate daily data over the last 30 days
        -- Spend from 40k to 120k cop per day
        FOR i IN 0..29 LOOP
            v_date := (CURRENT_DATE - i);
            v_spend := 40000 + (random() * 80000);
            v_roas := 3 + (random() * 3); -- ROAS 3 to 6
            
            INSERT INTO data_meta_ads (
                cuenta_id, 
                id_campana_meta, 
                nombre_campana, 
                gasto_real, 
                compras, 
                roas, 
                cpa_real, 
                cvr, 
                impresiones, 
                clicks, 
                fecha_sincronizacion
            ) VALUES (
                'mock-meta-account', 
                r.meta_campaign_id, 
                r.nombre_producto || ' - Campaign', 
                v_spend, 
                floor(random() * 8) + 2, 
                v_roas, 
                v_spend / (floor(random() * 8) + 2), 
                2.5 + (random() * 2), 
                20000 + floor(random() * 10000), 
                300 + floor(random() * 200), 
                (v_date || ' 23:59:59')::timestamp
            );
        END LOOP;
        
        -- update costeo aggregate fields
        UPDATE costeos 
        SET 
            meta_spend = (SELECT COALESCE(SUM(gasto_real), 0) FROM data_meta_ads WHERE id_campana_meta = r.meta_campaign_id),
            meta_roas = (SELECT COALESCE(AVG(roas), 0) FROM data_meta_ads WHERE id_campana_meta = r.meta_campaign_id),
            meta_aov = r.precio_final,
            meta_cvr = (SELECT COALESCE(AVG(cvr), 0) FROM data_meta_ads WHERE id_campana_meta = r.meta_campaign_id),
            meta_cpa = (SELECT COALESCE(AVG(cpa_real), 0) FROM data_meta_ads WHERE id_campana_meta = r.meta_campaign_id)
        WHERE id = r.id;
    END LOOP;
END $$;
