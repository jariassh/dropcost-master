import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string;
  from: string; // "Name <email@domain.com>"
  subject: string;
  html: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Manual Auth Verification to replace Gateway JWT
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    // Allow if key matches Service Key standard format
    if (!authHeader || !serviceKey || authHeader.replace("Bearer ", "") !== serviceKey) {
        // Fallback: Check if it's the Anon key if we want to allow public (Not for email service)
        // strict check for email service
        console.error("[email-service] Auth failed. Header:", authHeader ? "Present" : "Missing");
        return new Response(JSON.stringify({ error: "Unauthorized" }), { 
            status: 401, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not set in secrets");
    }

    const resend = new Resend(resendApiKey);
    const body = await req.json().catch(() => null);

    if (!body) {
        throw new Error("Invalid JSON body");
    }

    const { to, from, subject, html }: EmailPayload = body;

    // Basic validation
    if (!to || !from || !subject || !html) {
        throw new Error("Missing required fields: to, from, subject, html");
    }

    console.log(`[email-service] Sending to: ${to} from: ${from}`);

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
        console.error("[email-service] Resend API Error:", error);
        return new Response(JSON.stringify({ error: error }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    console.log("[email-service] Sent successfully:", data);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[email-service] Internal Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
