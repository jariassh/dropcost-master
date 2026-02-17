
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Hello from sitemap.xml!");

serve(async (req) => {
  const APP_URL = Deno.env.get("VITE_APP_URL") || "http://localhost:3000";
  
  // Initialize Supabase Client
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Static Pages
  const pagesPrincipales = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/registro', priority: '0.9', changefreq: 'monthly' },
    { path: '/simulador', priority: '0.9', changefreq: 'weekly' },
    { path: '/cursos', priority: '0.8', changefreq: 'weekly' },
    { path: '/referidos', priority: '0.7', changefreq: 'monthly' },
    { path: '/ofertas', priority: '0.8', changefreq: 'weekly' },
    // { path: '/blog', priority: '0.7', changefreq: 'weekly' }, // Future
  ];

  // 2. Fetch Dynamic Content (Cursos)
  const { data: cursos, error } = await supabase
    .from('cursos')
    .select('slug, fecha_actualizacion')
    .eq('activo', true)
    .eq('publicado', true);
    
  if (error) {
      console.error("Error fetching courses:", error);
  }

   // 2b. Fetch Dynamic Content (Ofertas publicas?) -> Add if needed

  // 3. Build XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // 3.1 Unroll Static Pages
  const today = new Date().toISOString().split('T')[0];
  
  pagesPrincipales.forEach(page => {
    xml += `  <url>
    <loc>${APP_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });

  // 3.2 Unroll Dynamic Cursos
  if (cursos && cursos.length > 0) {
    cursos.forEach((curso: any) => {
      const lastmod = curso.fecha_actualizacion 
        ? new Date(curso.fecha_actualizacion).toISOString().split('T')[0]
        : today;
        
      xml += `  <url>
    <loc>${APP_URL}/cursos/${curso.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    });
  }

  // 3.3 Close XML
  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600", // Cache 1 hour
    },
  });
});
