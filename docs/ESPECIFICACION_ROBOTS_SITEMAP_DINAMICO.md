# Especificación de Requerimientos - Robots.txt y Sitemap Dinámico
## DropCost Master

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Requerimientos:** RF-153 a RF-160  
**Implementador:** Antigravity

---

## 1. Resumen Ejecutivo

Implementar sistema dinámico para:
- **robots.txt:** Archivo de instrucciones para buscadores (Google, Bing)
- **sitemap.xml:** Mapa dinámico de todas las páginas indexables

Ambos archivos se generan automáticamente según páginas activas en BD.
Se adaptan automáticamente según dominio (local → testing → producción).

---

## 2. Configuración de Dominios

### Dominios por Fase

```
FASE 1 - LOCAL (Desarrollo):
Dominio: http://localhost:3000
Robots.txt: http://localhost:3000/robots.txt
Sitemap: http://localhost:3000/sitemap.xml

FASE 2 - TESTING (Hostinger Temporal):
Dominio: https://silver-gorilla-255825.hostingersite.com
Robots.txt: https://silver-gorilla-255825.hostingersite.com/robots.txt
Sitemap: https://silver-gorilla-255825.hostingersite.com/sitemap.xml

FASE 3 - PRODUCCIÓN (Dominio Real):
Dominio: https://dropcostmaster.com
Robots.txt: https://dropcostmaster.com/robots.txt
Sitemap: https://dropcostmaster.com/sitemap.xml
```

### Variables de Entorno

```
.env.local (LOCAL):
────────────────────────────────────
VITE_APP_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000/api
NODE_ENV=development

.env.testing (TESTING - Hostinger):
────────────────────────────────────
VITE_APP_URL=https://silver-gorilla-255825.hostingersite.com
VITE_API_URL=https://silver-gorilla-255825.hostingersite.com/api
NODE_ENV=production

.env.production (PRODUCCIÓN):
────────────────────────────────────
VITE_APP_URL=https://dropcostmaster.com
VITE_API_URL=https://dropcostmaster.com/api
NODE_ENV=production
```

---

## 3. Requerimientos Funcionales

### RF-153: Archivo robots.txt - Estructura y Contenido

**Ubicación:** `/public/robots.txt` (raíz del servidor)

**Contenido dinámico:**

```
User-agent: *
Allow: /
Allow: /registro
Allow: /simulador
Allow: /cursos
Allow: /referidos
Allow: /dashboard
Allow: /ofertas

Disallow: /admin
Disallow: /admin/*
Disallow: /api
Disallow: /api/*
Disallow: /private
Disallow: /private/*
Disallow: /login
Disallow: /*.json$
Disallow: /*.xml$ (excepto sitemap.xml)

User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

Sitemap: [DOMINIO]/sitemap.xml
```

**Explicación de reglas:**

```
Allow: /                          → Permite acceso general
Allow: /registro, /simulador...  → Páginas específicas permitidas
Disallow: /admin                 → Bloquea admin (Google no lo indexe)
Disallow: /api                   → Bloquea endpoints API
Disallow: /*.json$               → Bloquea archivos JSON
Sitemap: [DOMINIO]/sitemap.xml   → Apunta a sitemap dinámico
```

---

### RF-154: Generación Dinámica de robots.txt

**Endpoint:** `GET /robots.txt`

**Implementación:**

```typescript
// src/api/routes/robots.ts (o en Supabase Edge Function)

export async function GET_ROBOTS(req: Request) {
  // Obtener dominio de ambiente
  const APP_URL = process.env.VITE_APP_URL || 'http://localhost:3000';
  
  // Construir contenido dinámico
  const robotsTxt = `User-agent: *
Allow: /
Allow: /registro
Allow: /simulador
Allow: /cursos
Allow: /referidos
Allow: /dashboard
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
Disallow: *.xml$ (excepto /sitemap.xml)

User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Sitemap - DINÁMICO SEGÚN DOMINIO
Sitemap: ${APP_URL}/sitemap.xml

# Generado automáticamente el ${new Date().toISOString()}
# Dominio: ${APP_URL}
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache 24 horas
    },
  });
}
```

**Ruta en servidor:**

```
Express/Node.js:
app.get('/robots.txt', GET_ROBOTS);

Vercel (Next.js):
pages/robots.txt.ts → export default GET_ROBOTS

Supabase Edge Function:
functions/robots/index.ts
```

**Comportamiento:**

```
LOCAL:
GET /robots.txt
→ Sitemap: http://localhost:3000/sitemap.xml

TESTING:
GET /robots.txt
→ Sitemap: https://silver-gorilla-255825.hostingersite.com/sitemap.xml

PRODUCCIÓN:
GET /robots.txt
→ Sitemap: https://dropcostmaster.com/sitemap.xml

Automático según APP_URL. ✅
```

---

### RF-155: Archivo sitemap.xml - Estructura

**Ubicación:** `/sitemap.xml` (raíz del servidor)

**Estructura XML:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">

  <!-- Página principal -->
  <url>
    <loc>[DOMINIO]/</loc>
    <lastmod>2026-02-15T10:30:00Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Registro -->
  <url>
    <loc>[DOMINIO]/registro</loc>
    <lastmod>2026-02-15T10:30:00Z</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Simulador -->
  <url>
    <loc>[DOMINIO]/simulador</loc>
    <lastmod>2026-02-15T10:30:00Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Cursos (cada curso es una página) -->
  <url>
    <loc>[DOMINIO]/cursos</loc>
    <lastmod>2026-02-15T10:30:00Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Referidos -->
  <url>
    <loc>[DOMINIO]/referidos</loc>
    <lastmod>2026-02-15T10:30:00Z</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Ofertas -->
  <url>
    <loc>[DOMINIO]/ofertas</loc>
    <lastmod>2026-02-15T10:30:00Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Dashboard (requiere login - OPCIONAL indexar) -->
  <!-- NO incluir /dashboard porque requiere autenticación -->

</urlset>
```

---

### RF-156: Generación Dinámica de sitemap.xml

**Endpoint:** `GET /sitemap.xml`

**Implementación:**

```typescript
// src/api/routes/sitemap.ts (o Supabase Edge Function)

export async function GET_SITEMAP(req: Request) {
  const APP_URL = process.env.VITE_APP_URL || 'http://localhost:3000';
  const db = createSupabaseClient(); // Conexión a BD
  
  // 1. Obtener páginas públicas
  const pagesPrincipales = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/registro', priority: '0.9', changefreq: 'monthly' },
    { path: '/simulador', priority: '0.9', changefreq: 'weekly' },
    { path: '/cursos', priority: '0.8', changefreq: 'weekly' },
    { path: '/referidos', priority: '0.7', changefreq: 'monthly' },
    { path: '/ofertas', priority: '0.8', changefreq: 'weekly' },
    { path: '/blog', priority: '0.7', changefreq: 'weekly' },
  ];

  // 2. Obtener cursos individuales de BD (si existen)
  const cursos = await db.from('cursos')
    .select('id, slug, fecha_actualizacion')
    .eq('activo', true)
    .eq('publicado', true);

  // 3. Construir XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // 3.1 Agregar páginas principales
  pagesPrincipales.forEach(page => {
    const lastmod = new Date().toISOString().split('T')[0];
    xml += `  <url>
    <loc>${APP_URL}${page.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });

  // 3.2 Agregar cursos dinámicamente
  if (cursos.data && cursos.data.length > 0) {
    cursos.data.forEach(curso => {
      const lastmod = new Date(curso.fecha_actualizacion)
        .toISOString()
        .split('T')[0];
      xml += `  <url>
    <loc>${APP_URL}/cursos/${curso.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    });
  }

  // 3.3 Cerrar XML
  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache 1 hora
    },
  });
}
```

**Ruta en servidor:**

```
Express/Node.js:
app.get('/sitemap.xml', GET_SITEMAP);

Vercel (Next.js):
pages/sitemap.xml.ts → export default GET_SITEMAP

Supabase Edge Function:
functions/sitemap/index.ts
```

**Comportamiento:**

```
Cada vez que alguien accede a /sitemap.xml:
1. Se leen páginas principales
2. Se leen cursos activos de BD
3. Se genera XML dinámico
4. Se retorna con headers correctos
5. Google lo indexa automáticamente

Sin archivo estático. ✅
Sin actualización manual. ✅
```

---

### RF-157: Tabla de Páginas Estáticas vs Dinámicas

**Páginas Estáticas (siempre incluir):**

```
/                    (home)
/registro            (sign up)
/simulador           (herramienta principal)
/cursos              (listado cursos)
/referidos           (programa referidos)
/ofertas             (ofertas irresistibles)
/blog                (blog futuro)
/terminos            (términos y condiciones)
/privacidad          (política privacidad)
/contacto            (formulario contacto)
```

**Páginas Dinámicas (de BD):**

```
/cursos/{slug}       (cada curso individual)
/blog/{slug}         (cada post blog)
/ofertas/{id}        (cada oferta)
```

**Páginas NO indexar:**

```
/admin/*             (panel admin)
/api/*               (endpoints API)
/login               (login)
/dashboard           (requiere autenticación)
/private/*           (páginas privadas)
/*.json              (archivos de datos)
```

---

### RF-158: Generación Automática en Cada Deploy

**Proceso CI/CD:**

```
Cuando Antigravity pushea a producción:

1. Deploy a servidor (Vercel/Hostinger)
2. Variables de entorno cargadas (VITE_APP_URL)
3. Endpoints /robots.txt y /sitemap.xml activos
4. Google ve robots.txt → encuentra sitemap.xml
5. Google indexa todas las páginas

SIN archivo manual. ✅
SIN pasos manuales. ✅
```

**Verificación:**

```bash
# Verificar robots.txt funciona
curl https://dropcostmaster.com/robots.txt

# Verificar sitemap funciona
curl https://dropcostmaster.com/sitemap.xml

# Verificar Sitemap en robots.txt
grep "Sitemap:" https://dropcostmaster.com/robots.txt
```

---

### RF-159: Configuración en Diferentes Dominios

**LOCAL (localhost:3000):**

```
robots.txt:
User-agent: *
Disallow: /
# (Bloquea todo en local, Google no indexa)

Razón: No queremos que Google indexe localhost
```

**TESTING (silver-gorilla-255825.hostingersite.com):**

```
robots.txt:
User-agent: *
Allow: /
Sitemap: https://silver-gorilla-255825.hostingersite.com/sitemap.xml

Razón: Queremos que Google vea la estructura
       (pero con dominio temporal, no es problema)
```

**PRODUCCIÓN (dropcostmaster.com):**

```
robots.txt:
User-agent: *
Allow: /
Sitemap: https://dropcostmaster.com/sitemap.xml

Razón: Queremos máxima indexación en dominio real
```

**Código que lo maneja:**

```typescript
// app.ts
const APP_URL = process.env.VITE_APP_URL;
const isLocal = APP_URL?.includes('localhost');
const isTesting = APP_URL?.includes('hostinger');
const isProduction = APP_URL?.includes('dropcostmaster');

export function GET_ROBOTS(req: Request) {
  let robotsTxt;
  
  if (isLocal) {
    // Bloquear todo en local
    robotsTxt = `User-agent: *\nDisallow: /`;
  } else {
    // Permitir en testing y producción
    robotsTxt = `User-agent: *\nAllow: /\nSitemap: ${APP_URL}/sitemap.xml`;
  }
  
  return new Response(robotsTxt, { headers: {...} });
}
```

---

### RF-160: Integración con Google Search Console

**Después de deploy en producción:**

1. Ir a Google Search Console (https://search.google.com/search-console)
2. Agregar propiedad: https://dropcostmaster.com
3. Verificar propiedad (vía DNS o archivo HTML)
4. En sección "Sitemaps":
   - Click "Agregar sitemap"
   - Ingresar: `https://dropcostmaster.com/sitemap.xml`
   - Google lo procesa automáticamente

**Google luego:**
- Lee /robots.txt
- Encuentra sitemap.xml en robots.txt
- Indexa todas las páginas del sitemap
- Muestra estado de indexación en GSC

---

## 4. Checklist de Implementación

```
[ ] Variables de entorno configuradas (.env.local, .env.testing, .env.production)
[ ] Endpoint GET /robots.txt implementado
[ ] Endpoint GET /sitemap.xml implementado
[ ] robots.txt redirige correctamente según dominio
[ ] sitemap.xml genera dinámicamente desde BD
[ ] Pruebas en localhost: /robots.txt, /sitemap.xml funcionan
[ ] Deploy a Testing: Verificar robots.txt apunta a dominio temporal
[ ] Deploy a Producción: Verificar robots.txt apunta a dropcostmaster.com
[ ] Agregar sitemap en Google Search Console
[ ] Verificar indexación en GSC después 24-48 horas
[ ] Cache headers configurados (24h robots, 1h sitemap)
```

---

## 5. Testing Local

**Verificar en local:**

```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Probar endpoints
curl http://localhost:3000/robots.txt
curl http://localhost:3000/sitemap.xml

# Debe mostrar contenido correcto con dominio localhost
```

---

## 6. Testing en Hostinger (Fase 2)

**Después de deploy en Hostinger:**

```bash
# Verificar que redirige a dominio temporal
curl https://silver-gorilla-255825.hostingersite.com/robots.txt

# Debe incluir:
# Sitemap: https://silver-gorilla-255825.hostingersite.com/sitemap.xml
```

---

## 7. Producción (Fase 3)

**Después de deploy en dropcostmaster.com:**

```bash
# Verificar que redirige a dominio real
curl https://dropcostmaster.com/robots.txt

# Debe incluir:
# Sitemap: https://dropcostmaster.com/sitemap.xml
```

**Luego en Google Search Console:**
1. Agregar propiedad: https://dropcostmaster.com
2. Agregar sitemap: https://dropcostmaster.com/sitemap.xml
3. Esperar 24-48 horas
4. Ver páginas indexadas en GSC

---

## 8. Notas Importantes

```
1. CACHE:
   - robots.txt: Cache 24 horas (Google lo revisa diariamente)
   - sitemap.xml: Cache 1 hora (cambios son frescos)

2. DOMINIOS:
   - LOCAL: Bloquear indexación (no queremos localhost indexado)
   - TESTING: Permitir pero no importa si Google indexa
   - PRODUCCIÓN: Permitir completamente

3. CAMBIOS:
   - Si cambias VITE_APP_URL → reinicia servidor
   - robots.txt y sitemap.xml se regeneran automáticamente
   - No toca código, solo cambia variable de entorno

4. GOOGLE INDEXACIÓN:
   - Google visita /robots.txt primero
   - Ve Sitemap: URL
   - Va a /sitemap.xml
   - Indexa todas las URLs en sitemap

5. VERIFICACIÓN:
   - site:dropcostmaster.com (búsqueda Google)
   - Google Search Console dashboard
   - robots.txt checker (online tools)
```

---

**FIN ESPECIFICACIÓN RF-153 a RF-160**

---

## 📊 RESUMEN

```
RF-153: Estructura robots.txt (dinámico según dominio)
RF-154: Generación dinámica robots.txt
RF-155: Estructura sitemap.xml
RF-156: Generación dinámica sitemap.xml
RF-157: Páginas estáticas vs dinámicas
RF-158: Automatización en deploy
RF-159: Configuración por dominio
RF-160: Integración Google Search Console

✅ robots.txt generado dinámicamente
✅ sitemap.xml generado dinámicamente
✅ Se adapta automáticamente al dominio (local → testing → producción)
✅ Sin archivos estáticos
✅ Sin actualizaciones manuales
✅ Cache configurado
✅ Google indexación automática

IMPLEMENTACIÓN: 
Antigravity debe crear 2 endpoints:
1. GET /robots.txt
2. GET /sitemap.xml

Ambos leen VITE_APP_URL y generan contenido dinámico.
```
