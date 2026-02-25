
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Hello from dynamic robots.txt!");

serve(async (req) => {
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const APP_URL = `${protocol}://${host}`;
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch Config
  const { data: config } = await supabase
    .from('configuracion_global')
    .select('permitir_indexacion, permitir_seguimiento, robots_txt_custom, site_url')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .maybeSingle();

  let robotsTxt = "";

  const allowIndex = config?.permitir_indexacion !== false; // Default true
  const allowFollow = config?.permitir_seguimiento !== false; // Default true

  if (!allowIndex) {
    robotsTxt = `User-agent: *
Disallow: /

# La indexación ha sido desactivada desde el Panel de Administración.
`;
  } else {
    // Si hay un robots.txt personalizado, lo usamos
    if (config?.robots_txt_custom) {
      robotsTxt = config.robots_txt_custom;
    } else {
      // Reglas dinámicas por defecto
      robotsTxt = `User-agent: *
Allow: /
Allow: /registro
Allow: /simulador
Allow: /cursos
Allow: /referidos
Allow: /ofertas
Allow: /blog

Disallow: /admin
Disallow: /admin/*
Disallow: /api
Disallow: /api/*
Disallow: /private
Disallow: /private/*
Disallow: /login
Disallow: /*.json$
Disallow: /*.xml$
Allow: /sitemap.xml

User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1
`;
    }

    // Agregar Sitemap al final si no está en el custom
    if (!robotsTxt.includes("Sitemap:")) {
      robotsTxt += `\n# Sitemap - DINÁMICO\nSitemap: ${APP_URL}/functions/v1/sitemap\n`;
    }
  }

  robotsTxt += `\n# Generado automáticamente el ${new Date().toISOString()}\n`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600", // Cache 1 hora
    },
  });
});
