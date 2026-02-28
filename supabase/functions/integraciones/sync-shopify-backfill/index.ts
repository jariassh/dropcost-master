import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptToken } from "../../utils/crypto.ts";

/**
 * Edge Function: sync-shopify-backfill
 * Sincroniza histórico de órdenes de Shopify usando GraphQL Admin API.
 * Requiere: access_token guardado en la tabla integraciones.
 * 
 * Niveles de atribución:
 *  1. Exacto: fbclid desde customer_journey_summary o landing_site
 *  2. Probable: SKU + rango de fechas de campaña activa
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Consulta GraphQL para obtener órdenes con atribución
const ORDERS_QUERY = `
query OrdersBackfill($first: Int!, $after: String, $query: String) {
  orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
    edges {
      cursor
      node {
        id
        legacyResourceId
        name
        createdAt
        displayFinancialStatus
        displayFulfillmentStatus
        totalPriceSet {
          shopMoney {
            amount
          }
        }
        lineItems(first: 10) {
          edges {
            node {
              product {
                legacyResourceId
              }
              quantity
            }
          }
        }
        shippingAddress {
          name
          phone
          city
          province
        }
        billingAddress {
          phone
        }
        customer {
          firstName
          lastName
          phone
        }
        customerJourneySummary {
          firstVisit {
            landingPage
            referrerUrl
            source
            sourceType
            utmParameters {
              campaign
              content
              medium
              source
              term
            }
          }
          lastVisit {
            landingPage
            referrerUrl
            source
            sourceType
            utmParameters {
              campaign
              content
              medium
              source
              term
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`;

// Extrae fbclid de una URL
function extractFbclid(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("fbclid");
  } catch {
    // Intentar extraer con regex si la URL no es válida
    const match = url.match(/fbclid=([^&]+)/);
    return match ? match[1] : null;
  }
}

// Extrae datos de atribución del customer journey
function extractAttribution(journey: any): {
  fbclid: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  attribution_type: string;
} {
  const result = {
    fbclid: null as string | null,
    source: null as string | null,
    medium: null as string | null,
    campaign: null as string | null,
    attribution_type: "none",
  };

  if (!journey) return result;

  // Nivel 1: Buscar fbclid en la primera y última visita
  const firstLanding = journey.firstVisit?.landingPage;
  const lastLanding = journey.lastVisit?.landingPage;
  const firstReferrer = journey.firstVisit?.referrerUrl;
  const lastReferrer = journey.lastVisit?.referrerUrl;

  result.fbclid =
    extractFbclid(firstLanding) ||
    extractFbclid(lastLanding) ||
    extractFbclid(firstReferrer) ||
    extractFbclid(lastReferrer);

  // Extraer UTMs (priorizar última visita)
  const utmParams =
    journey.lastVisit?.utmParameters || journey.firstVisit?.utmParameters;
  if (utmParams) {
    result.source = utmParams.source || journey.lastVisit?.source || null;
    result.medium = utmParams.medium || null;
    result.campaign = utmParams.campaign || null;
  }

  // Determinar tipo de atribución
  if (result.fbclid) {
    result.attribution_type = "exact_fbclid";
  } else if (result.source || result.campaign) {
    result.attribution_type = "utm_match";
  }

  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { tienda_id, date_from, date_to, costeo_id, shopify_product_id, meta_campaign_id } = await req.json();

    if (!tienda_id) {
      throw new Error("tienda_id is required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Obtener la integración de Shopify para esta tienda
    const { data: integration, error: intError } = await supabaseAdmin
      .from("integraciones")
      .select(
        `
        id,
        tienda_id,
        credenciales_encriptadas,
        config_sync,
        tiendas (
          id,
          usuario_id
        )
      `
      )
      .eq("tienda_id", tienda_id)
      .eq("tipo", "shopify")
      .eq("estado", "conectado")
      .single();

    if (intError || !integration) {
      throw new Error(
        "No se encontró integración de Shopify activa para esta tienda"
      );
    }

    const shopDomain =
      integration.config_sync?.shop_domain ||
      integration.config_sync?.shop_url;
    const encryptedToken = integration.credenciales_encriptadas;

    if (!shopDomain || !encryptedToken) {
      throw new Error("Faltan credenciales de Shopify (dominio o token)");
    }

    // 2. Desencriptar el token
    const accessToken = await decryptToken(encryptedToken);
    const userId = (integration as any).tiendas?.usuario_id;

    if (!userId) {
      throw new Error(
        "No se pudo determinar el usuario propietario de la tienda"
      );
    }

    // 3. Actualizar estado de backfill a "in_progress"
    await supabaseAdmin
      .from("integraciones")
      .update({
        config_sync: {
          ...integration.config_sync,
          backfill_status: "in_progress",
          backfill_started_at: new Date().toISOString(),
        },
      })
      .eq("id", integration.id);

    // 4. Construir query de fechas para Shopify
    let shopifyQuery = "";
    if (date_from) shopifyQuery += `created_at:>='${date_from}'`;
    if (date_to) {
      if (shopifyQuery) shopifyQuery += " AND ";
      shopifyQuery += `created_at:<='${date_to}'`;
    }

    // 5. Paginación GraphQL
    let hasNextPage = true;
    let cursor: string | null = null;
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalErrors = 0;
    const PAGE_SIZE = 50; // Shopify permite máximo 250, pero usamos 50 para seguridad

    // Obtener mapa de costeos por product_id_shopify para esta tienda
    const { data: costeos } = await supabaseAdmin
      .from("costeos")
      .select("id, product_id_shopify")
      .eq("tienda_id", tienda_id)
      .not("product_id_shopify", "is", null);

    const costeoMap = new Map<string, string>();
    if (costeos) {
      for (const c of costeos) {
        if (c.product_id_shopify) {
          costeoMap.set(c.product_id_shopify, c.id);
        }
      }
    }

    while (hasNextPage) {
      // Llamada GraphQL a Shopify
      const graphqlBody = JSON.stringify({
        query: ORDERS_QUERY,
        variables: {
          first: PAGE_SIZE,
          after: cursor,
          query: shopifyQuery || null,
        },
      });

      // Asegurar que el dominio tenga el formato correcto
      const cleanDomain = shopDomain
        .replace("https://", "")
        .replace("http://", "")
        .replace(/\/$/, "");
      const shopifyApiUrl = `https://${cleanDomain}/admin/api/2024-10/graphql.json`;

      const response = await fetch(shopifyApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: graphqlBody,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `Shopify API Error (${response.status}): ${errText.substring(0, 200)}`
        );
      }

      const gqlResult = await response.json();

      if (gqlResult.errors) {
        throw new Error(
          `GraphQL Error: ${JSON.stringify(gqlResult.errors).substring(0, 300)}`
        );
      }

      const ordersData = gqlResult.data?.orders;
      if (!ordersData) {
        break;
      }

      const edges = ordersData.edges || [];
      hasNextPage = ordersData.pageInfo?.hasNextPage || false;
      cursor = ordersData.pageInfo?.endCursor || null;

      // 6. Procesar cada orden
      for (const edge of edges) {
        totalProcessed++;
        const node = edge.node;

        try {
          // Extraer atribución desde customer journey
          const attribution = extractAttribution(node.customerJourneySummary);

          // Mapear primer product_id a costeo
          let assignedCosteoId: string | null = null;
          let totalQuantity = 0;
          const lineItems = node.lineItems?.edges || [];

          // Si nos envían un producto específico desde Frontend (Ej: Lápiz de integraciones)
          // validamos que la orden contenga este producto, si no, lo saltamos
          if (shopify_product_id) {
            const hasTargetProduct = lineItems.some(
              (li: any) => String(li.node?.product?.legacyResourceId) === String(shopify_product_id)
            );
            if (!hasTargetProduct) continue;
          }

          for (const li of lineItems) {
            const productId = li.node?.product?.legacyResourceId;
            totalQuantity += li.node?.quantity || 1;

            // Buscar costeo. Si estamos forzando un costeo_id, lo usamos.
            if (!assignedCosteoId && productId) {
              if (costeo_id && String(productId) === String(shopify_product_id)) {
                assignedCosteoId = costeo_id;
              } else {
                assignedCosteoId = costeoMap.get(String(productId)) || null;
              }
            }
          }

          // Datos del cliente
          const shippingAddr = node.shippingAddress || {};
          const customerName =
            shippingAddr.name ||
            `${node.customer?.firstName || ""} ${node.customer?.lastName || ""}`.trim() ||
            null;
          const customerPhone =
            shippingAddr.phone ||
            node.billingAddress?.phone ||
            node.customer?.phone ||
            null;

          const orderItem = {
            tienda_id: tienda_id,
            usuario_id: userId,
            costeo_id: assignedCosteoId,
            shopify_order_id: node.legacyResourceId,
            order_number: node.name,
            fecha_orden: node.createdAt,
            estado_pago: node.displayFinancialStatus?.toLowerCase() || null,
            estado_logistica:
              node.displayFulfillmentStatus?.toLowerCase() || "pending",
            cliente_nombre: customerName,
            cliente_telefono: customerPhone,
            cliente_ciudad: shippingAddr.city || null,
            cliente_departamento: shippingAddr.province || null,
            total_orden: parseFloat(
              node.totalPriceSet?.shopMoney?.amount || "0"
            ),
            cantidad_items: totalQuantity > 0 ? totalQuantity : 1,
            origen: "shopify",
          };

          // Upsert: evitar duplicados
          const { error: upsertError } = await supabaseAdmin
            .from("orders")
            .upsert(orderItem, {
              onConflict: "tienda_id,shopify_order_id",
              ignoreDuplicates: false,
            });

          if (upsertError) {
            console.error(
              `Error upserting order ${node.name}:`,
              upsertError.message
            );
            totalErrors++;
          } else {
            totalInserted++;
          }
        } catch (orderErr: any) {
          console.error(
            `Error processing order ${node.name}:`,
            orderErr.message
          );
          totalErrors++;
        }
      }

      // Límite de seguridad: máximo 2000 órdenes por ejecución
      if (totalProcessed >= 2000) {
        console.warn("Reached safety limit of 2000 orders per execution");
        break;
      }
    }

    // 7. Actualizar estado de backfill a "completed"
    await supabaseAdmin
      .from("integraciones")
      .update({
        ultima_sincronizacion: new Date().toISOString(),
        config_sync: {
          ...integration.config_sync,
          backfill_status: "completed",
          backfill_completed_at: new Date().toISOString(),
          last_backfill_results: {
            total_processed: totalProcessed,
            total_inserted: totalInserted,
            total_errors: totalErrors,
          },
        },
      })
      .eq("id", integration.id);

    return new Response(
      JSON.stringify({
        success: true,
        results: {
          total_processed: totalProcessed,
          total_inserted: totalInserted,
          total_errors: totalErrors,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Backfill Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
