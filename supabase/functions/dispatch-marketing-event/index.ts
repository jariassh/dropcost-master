import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: dispatch-marketing-event
 * Centraliza el envío de emails basados en eventos del sistema.
 * Utiliza mapeos configurables en la tabla 'marketing_event_mappings'.
 */

serve(async (req: Request) => {
  // Manejo de CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { 
      event_type, 
      user_id, 
      email, 
      template_id: override_template_id, 
      variables = {}, 
      is_test_email = false 
    } = body;

    if (!event_type) throw new Error("event_type es requerido");

    // 1. Obtener mapeo del evento (si no hay override_template_id)
    let final_template_id = override_template_id;
    
    if (!final_template_id && event_type !== 'template_test') {
      const { data: mapping, error: mappingError } = await supabase
        .from('marketing_event_mappings')
        .select('template_id')
        .eq('event_type', event_type)
        .eq('enabled', true)
        .maybeSingle();

      if (mappingError) throw mappingError;
      if (!mapping) {
        console.warn(`[Dispatcher] No existe mapeo activo para el evento: ${event_type}`);
        return new Response(JSON.stringify({ message: "Evento ignorado (sin mapeo)" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      final_template_id = mapping.template_id;
    }

    // Si es template_test, DEBE venir el template_id
    if (event_type === 'template_test' && !final_template_id) {
        throw new Error("template_id es requerido para pruebas");
    }

    // 2. Obtener la plantilla
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', final_template_id)
      .single();

    if (templateError || !template) throw new Error("Plantilla no encontrada");

    // 3. Procesar variables dinámicas
    let subject = template.subject || "Sin Asunto";
    let htmlContent = template.html_content || "";

    if (is_test_email) {
      subject = `[TEST] ${subject}`;
    }

    // Variables de estilo y URL por defecto para plantillas globales
    let appUrl = Deno.env.get("SITE_URL");
    const { data: configData } = await supabase.from('configuracion_global').select('site_url').limit(1).maybeSingle();
    if (configData && configData.site_url) {
        appUrl = configData.site_url;
    }
    appUrl = appUrl || "https://app.dropcost.com";

    const enhancedVariables = {
      color_bg_primary: "#ffffff",
      color_bg_secondary: "#f9fafb",
      color_text_primary: "#111827",
      color_text_secondary: "#6b7280",
      color_border: "#e5e7eb",
      app_url: appUrl,
      ...variables
    };

    // Función auxiliar para reemplazo de variables
    const processVars = (str: string, vars: Record<string, any>) => {
      let result = str;
      // 1. Reemplazar variables conocidas
      Object.entries(vars).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        result = result.replace(regex, String(value ?? ''));
      });
      // 2. Limpiar variables sobrantes para no romper CSS/HTML
      result = result.replace(/{{\s*[\w]+\s*}}/g, '');
      return result;
    };

    const finalSubject = processVars(subject, enhancedVariables);
    const finalHtml = processVars(htmlContent, enhancedVariables);

    // 4. Registrar evento en marketing_events
    const { data: eventLog, error: logError } = await supabase
      .from('marketing_events')
      .insert({
        event_type,
        user_id,
        email,
        template_id: final_template_id,
        variables,
        is_test_email,
        status: is_test_email ? 'test' : 'pending'
      })
      .select()
      .single();

    if (logError) throw logError;

    // 5. Despachar al email-service (o enviar directamente con Resend)
    // Aquí invocamos la función interna de envío que ya tiene configurado Resend
    const dispatchResponse = await fetch(`${supabaseUrl}/functions/v1/email-service`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
            to: email,
            from: `${template.sender_name || 'DropCost'} <${template.sender_prefix || 'support'}@dropcost.jariash.com>`,
            subject: finalSubject,
            html: finalHtml
        })
    });

    const resData = await dispatchResponse.json();

    // 6. Actualizar registro final
    await supabase
      .from('marketing_events')
      .update({
        status: dispatchResponse.ok ? 'sent' : 'failed',
        sent_at: dispatchResponse.ok ? new Date().toISOString() : null,
        email_service_id: resData.id || null,
        error_message: dispatchResponse.ok ? null : JSON.stringify(resData)
      })
      .eq('id', eventLog.id);

    return new Response(JSON.stringify({
      success: dispatchResponse.ok,
      event_id: eventLog.id,
      message: dispatchResponse.ok ? "Email despachado correctamente" : "Fallo en el despacho"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error(`[Dispatcher Error] ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  }
});
