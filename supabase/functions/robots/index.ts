
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("Hello from robots.txt!");

serve(async (req) => {
  const APP_URL = Deno.env.get("VITE_APP_URL") || "http://localhost:3000";
  const isLocal = APP_URL.includes("localhost");
  // const isTesting = APP_URL.includes("hostinger"); // Logic handled same as production unless specific exclusion needed

  let robotsTxt = "";

  if (isLocal) {
    // Bloquear todo en local
    robotsTxt = `User-agent: *
Disallow: /

# Generado automáticamente para entorno LOCAL
`;
  } else {
    // Permitir en testing y producción
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

# Sitemap - DINÁMICO
Sitemap: ${APP_URL}/functions/v1/sitemap

# Generado automáticamente el ${new Date().toISOString()}
# Dominio: ${APP_URL}
`;
  }

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400", // Cache 24 horas
    },
  });
});
