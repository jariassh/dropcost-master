import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    // Manejo de preflight (CORS)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Validar que la petición sea un POST
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 1. Extraer store_id de los parámetros de la URL
        const url = new URL(req.url);
        const storeId = url.searchParams.get('store_id');

        if (!storeId) {
            return new Response(JSON.stringify({ error: 'Missing store_id parameter' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Obtener payload de Shopify
        const payload = await req.json();

        // Inicializar cliente Supabase con privilegios de administrador para saltar RLS
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase configuration missing');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 2. Validar que la tienda exista y obtener el usuario propietario
        const { data: storeData, error: storeError } = await supabase
            .from('tiendas')
            .select('id, usuario_id')
            .eq('id', storeId)
            .single();

        if (storeError || !storeData) {
            return new Response(JSON.stringify({ error: 'Store not found or invalid id' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const userId = storeData.usuario_id;
        const shopifyOrderId = String(payload.id);
        const orderNumber = String(payload.name || payload.order_number);

        // 3. Extracción de datos del cliente
        const customerAddress = payload.shipping_address || payload.billing_address || {};
        const customerName = customerAddress.name || 
            (payload.customer ? `${payload.customer.first_name || ''} ${payload.customer.last_name || ''}`.trim() : null);
        const customerPhone = customerAddress.phone || payload.phone || payload.customer?.phone || null;
        const customerCity = customerAddress.city || null;
        const customerProvince = customerAddress.province || null;

        // 4. Lógica de Product Match y Extracción de Cantidad
        let assignedCosteoId = null;
        let totalQuantity = 0;

        // --- Extracción de UTMs y Atribución ---
        const utms: Record<string, string | null> = {
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            utm_content: null,
            utm_term: null,
            fbclid: null
        };

        // A. Intentar desde note_attributes (Común en apps como Releasit/CartLoop)
        if (payload.note_attributes && Array.isArray(payload.note_attributes)) {
            payload.note_attributes.forEach((attr: any) => {
                const name = String(attr.name).toLowerCase();
                if (name.includes('utm_source') || name === 'utm source') utms.utm_source = attr.value;
                if (name.includes('utm_medium') || name === 'utm medium') utms.utm_medium = attr.value;
                if (name.includes('utm_campaign') || name === 'utm campaign') utms.utm_campaign = attr.value;
                if (name.includes('utm_content') || name === 'utm content') utms.utm_content = attr.value;
                if (name.includes('utm_term') || name === 'utm term') utms.utm_term = attr.value;
                if (name.includes('fbclid')) utms.fbclid = attr.value;
            });
        }

        // B. Intentar desde landing_site (URL de entrada de Shopify)
        if (!utms.utm_source && payload.landing_site) {
            try {
                const landingUrl = new URL(payload.landing_site, 'https://example.com');
                utms.utm_source = landingUrl.searchParams.get('utm_source');
                utms.utm_medium = landingUrl.searchParams.get('utm_medium');
                utms.utm_campaign = landingUrl.searchParams.get('utm_campaign');
                utms.utm_content = landingUrl.searchParams.get('utm_content');
                utms.utm_term = landingUrl.searchParams.get('utm_term');
                utms.fbclid = landingUrl.searchParams.get('fbclid');
            } catch (e) {
                console.warn('Error parseando landing_site:', e);
            }
        }

        // Shopify envía los productos de la orden en el array `line_items`
        if (payload.line_items && payload.line_items.length > 0) {
            // Calcular la sumatoria de las unidades (cantidad real de ítems vendidos en este pedido)
            totalQuantity = payload.line_items.reduce((sum: number, item: any) => {
                return sum + (item.quantity ? Number(item.quantity) : 1);
            }, 0);

            // Para el MVP, mapeamos según el primer producto (ordenes dropshipping uniproducto)
            const firstProductId = String(payload.line_items[0].product_id);

            // Buscamos si existe un costeo asociado al producto y a la tienda
            const { data: costeoData } = await supabase
                .from('costeos')
                .select('id, meta_campaign_id')
                .eq('tienda_id', storeId)
                .eq('product_id_shopify', firstProductId)
                .limit(1)
                .maybeSingle();

            if (costeoData) {
                assignedCosteoId = costeoData.id;
            }
        }

        // Atribución de segunda oportunidad: Si no hay match por producto, buscar por utm_source (Campaign ID)
        if (!assignedCosteoId && utms.utm_source) {
            const { data: campaignMatch } = await supabase
                .from('costeos')
                .select('id')
                .eq('tienda_id', storeId)
                .eq('meta_campaign_id', utms.utm_source)
                .limit(1)
                .maybeSingle();
            
            if (campaignMatch) {
                assignedCosteoId = campaignMatch.id;
                console.log(`[webhook-shopify] Match found via utm_source: ${utms.utm_source}`);
            }
        }

        // 5. Preparar objeto para Base de Datos
        const orderItem = {
            tienda_id: storeId,
            usuario_id: userId,
            costeo_id: assignedCosteoId,
            shopify_order_id: shopifyOrderId,
            order_number: orderNumber,
            fecha_orden: payload.created_at,
            estado_pago: payload.financial_status,
            estado_logistica: payload.fulfillment_status || 'pending',
            cliente_nombre: customerName,
            cliente_telefono: customerPhone,
            cliente_ciudad: customerCity,
            cliente_departamento: customerProvince,
            cliente_direccion: customerAddress.address1 || customerAddress.address2 || null,
            cliente_email: payload.customer?.email || payload.email || null,
            total_orden: Number(payload.total_price),
            cantidad_items: totalQuantity > 0 ? totalQuantity : 1,
            origen: 'shopify',
            notas: payload.note || null,
            customer_details: {
                first_name: payload.customer?.first_name,
                last_name: payload.customer?.last_name,
                email: payload.customer?.email || payload.email,
                phone: customerPhone,
                address: customerAddress,
                note_attributes: payload.note_attributes,
                tags: payload.tags
            },
            // UTMs
            utm_source: utms.utm_source,
            utm_medium: utms.utm_medium,
            utm_campaign: utms.utm_campaign,
            utm_content: utms.utm_content,
            utm_term: utms.utm_term,
            fbclid: utms.fbclid
        };

        // 6. Inserción o Upsert seguro
        // Usamos upsert basado en la llave natural shopify_order_id + tienda_id para garantizar idempotencia
        const { error: insertError } = await supabase
            .from('orders')
            .upsert(orderItem, { 
                onConflict: 'tienda_id,shopify_order_id', 
                ignoreDuplicates: false 
            });

        if (insertError) {
            throw insertError;
        }

        // 7. Registro de éxito
        console.log(`[webhook-shopify] Order ${orderNumber} processed. Costeo Match: ${!!assignedCosteoId}`);

        return new Response(JSON.stringify({ success: true, message: 'Order created/updated successfully' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[webhook-shopify] Error:', error.message);
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
