import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: email-marketing-segment-builder
 * Previsualiza la audiencia según un JSON de filtros.
 */

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("No autorizado");

    const { filters, tiendaId } = await req.json();

    // 1. Construir query dinámica basada en filtros
    let query = supabaseClient.from("users").select("id, email, nombres, apellidos, created_at");

    if (filters) {
      if (filters.rol) {
        query = query.eq("rol", filters.rol);
      }
      if (filters.fechaDesde) {
        query = query.gte("created_at", filters.fechaDesde);
      }
      if (filters.fechaHasta) {
        query = query.lte("created_at", filters.fechaHasta);
      }
    }

    // Nota: El RLS de users ya debería filtrar si el usuario tiene permisos, 
    // pero idealmente aquí filtraríamos por los que pertenecen a la tienda si existe esa relación explícita.
    // Actualmente en el schema public.users no tiene tienda_id, se relaciona en public.tiendas.

    const { data: users, error: queryError } = await query;

    if (queryError) throw queryError;

    return new Response(JSON.stringify({ 
      count: users.length, 
      preview: users.slice(0, 10), // Top 10 para previsualizar
      filtersApplied: filters 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  }
});
