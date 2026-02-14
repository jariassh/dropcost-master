# Especificación de Requerimientos - Acortador de Enlaces Propio
## DropCost Master

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Fase:** Post-Capacitación (Semana 20-21)  
**Requerimientos:** RF-088 a RF-099

---

## 1. Resumen Ejecutivo

Sistema de acortador de URLs **propio y autogestionable** para DropCost Master. Permite:
- Generar URLs cortas automáticamente (dominio + 6 caracteres)
- Usar URLs acortadas en toda la app (cursos, referidos, links externos)
- Gestionar, editar, eliminar y rastrear URLs acortadas
- Dashboard de administración de enlaces
- Redirecciones automáticas y sin fricción

**Dominio:** `https://drop.co/abc123` (ejemplo)

---

## 2. Requerimientos Funcionales

### RF-088: Modelo de URL Acortada

**Estructura:**
```
URL Original: https://www.udemy.com/course/meta-ads-beginners/?referralCode=ABC123
                ↓ Sistema acortador
URL Acortada: https://drop.co/xK9m2p
                ↓ Redirige a
URL Original: https://www.udemy.com/course/meta-ads-beginners/?referralCode=ABC123
```

**Componentes:**
- **Dominio:** `drop.co` (tu dominio corto, configurado en DNS)
- **Slug:** `xK9m2p` (6 caracteres, alfanuméricos)
- **Caracteres válidos:** A-Z, a-z, 0-9 (62 caracteres posibles)
- **Total combinaciones posibles:** 62^6 = 56.800 millones de URLs

---

### RF-089: Generar URL Acortada Automáticamente

**Proceso:**
1. Sistema necesita acortar URL (ej: enlace a Udemy)
2. Llamar: `POST /api/enlaces/generar-corto`
3. Sistema genera slug único (6 caracteres random)
4. Guardar en BD: original + slug
5. Devolver URL acortada

**Función backend:**
```typescript
async function generarURLCorta(urlOriginal: string) {
  // 1. Validar URL
  if (!esURLValida(urlOriginal)) throw new Error("URL inválida");
  
  // 2. Verificar si ya existe
  const existente = await db.enlaces.findOne({ url_original: urlOriginal });
  if (existente) return existente.slug;
  
  // 3. Generar slug único
  let slug = generarSlug(); // 6 caracteres random
  while (await db.enlaces.findOne({ slug })) {
    slug = generarSlug(); // Regenerar si ya existe
  }
  
  // 4. Guardar en BD
  await db.enlaces.insert({
    slug,
    url_original: urlOriginal,
    tipo: 'automatico',
    fecha_creacion: now(),
    clicks: 0,
    activo: true
  });
  
  // 5. Devolver URL acortada
  return `https://drop.co/${slug}`;
}

function generarSlug(longitud = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < longitud; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}
```

---

### RF-090: Usar URLs Acortadas en Cursos

**Al mostrar botón "Ver Curso" en Centro de Capacitación:**

```typescript
// Antes (URL larga):
<a href="https://www.udemy.com/course/meta-ads-beginners/?referralCode=ABC123">
  Ver Curso
</a>

// Después (URL acortada):
const urlAcortada = await generarURLCorta(
  "https://www.udemy.com/course/meta-ads-beginners/?referralCode=ABC123"
);
// urlAcortada = "https://drop.co/xK9m2p"

<a href={urlAcortada} target="_blank">
  Ver Curso
</a>
```

**Ventajas:**
- ✅ URLs limpias en la app
- ✅ Rastreo de clicks automático
- ✅ Manejo centralizado de enlaces
- ✅ Fácil cambiar URLs sin actualizar código

---

### RF-091: Usar URLs Acortadas en Referidos

**Enlace de referido normal:**
```
https://dropcostmaster.com/registro?ref=ivan_caicedo
```

**Con acortador:**
```
Generar: https://drop.co/aB7kL3

Este enlace acortado redirige a:
https://dropcostmaster.com/registro?ref=ivan_caicedo
```

**Ventajas:**
- URL fácil de compartir (WhatsApp, Twitter)
- QR más pequeño y legible
- Tracking de cuántos clicks el referido

---

### RF-092: Tabla Base de Datos - Enlaces

```sql
CREATE TABLE enlaces_acortados (
  id UUID PRIMARY KEY,
  
  -- URL Original y Slug
  url_original VARCHAR NOT NULL,
  slug VARCHAR(10) UNIQUE NOT NULL, -- máximo 10 caracteres
  
  -- Metadata
  titulo VARCHAR(200), -- Opcional: "Meta Ads Course"
  descripcion TEXT, -- Opcional
  categoria ENUM(
    'curso',
    'referido',
    'externo',
    'social',
    'afiliado',
    'otro'
  ),
  
  -- Tipo de creación
  tipo ENUM(
    'automatico', -- Generado por sistema
    'manual'      -- Creado por usuario
  ),
  
  -- Tracking
  clicks INTEGER DEFAULT 0,
  ultimo_click TIMESTAMP,
  
  -- Control
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_expiracion TIMESTAMP, -- Opcional: eliminar después
  
  -- Usuario que lo creó (si manual)
  creado_por UUID,
  
  -- Notas internas
  notas TEXT,
  
  FOREIGN KEY (creado_por) REFERENCES users(id),
  UNIQUE(url_original), -- No duplicar URL original
  INDEX(slug), -- Importante para redirecciones rápidas
  INDEX(fecha_creacion)
);
```

---

### RF-093: Redirección de URLs Acortadas

**Endpoint:**
```
GET https://drop.co/{slug}
```

**Lógica:**
```typescript
async function redireccionarEnlace(slug: string) {
  // 1. Buscar enlace en BD
  const enlace = await db.enlaces_acortados.findOne({ slug });
  
  if (!enlace) {
    // Enlace no existe
    return redirectTo('/404-enlace-no-encontrado');
  }
  
  if (!enlace.activo) {
    // Enlace está desactivado
    return redirectTo('/enlace-desactivado');
  }
  
  // 2. Registrar click
  await db.enlaces_acortados.updateOne(
    { slug },
    {
      clicks: enlace.clicks + 1,
      ultimo_click: NOW()
    }
  );
  
  // 3. Redirigir a URL original
  return redirectTo(enlace.url_original, 301); // 301 Moved Permanently
}
```

**Performance:**
- Búsqueda por índice en BD (< 10ms)
- Caché Redis (opcional): guardar últimos 10k accesos
- Sin cookies ni JavaScript requerido

---

### RF-094: Panel Admin - Gestión de Enlaces

**Ubicación:** Admin → Gestión de Enlaces

**Vista principal (Tabla):**
```
┌─────────────────────────────────────────────────────┐
│ 🔗 GESTIÓN DE ENLACES ACORTADOS                      │
│                                                     │
│ [+ Nuevo enlace acortado] [Filtro] [Buscar]       │
├─────────────────────────────────────────────────────┤
│                                                     │
│ TABLA:                                              │
│ ┌──────────────────────────────────────────────┐   │
│ │ Slug  | Título           | Clicks | Activo  │   │
│ ├──────────────────────────────────────────────┤   │
│ │ xK9m2p│ Meta Ads Course  │ 1,234  │ ✅      │   │
│ │ aB7kL3│ Referido Ivan    │ 567    │ ✅      │   │
│ │ cD2pQ9│ Google Analytics │ 234    │ ⏸ No   │   │
│ │ eF5mN1│ Dropshipping 101 │ 0      │ ✅      │   │
│                                                     │
│ [Ver detalles] [Editar] [Desactivar] [⋮ Más]      │
│                                                     │
│ Paginación: 1 - 20 de 156 enlaces                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### RF-095: Crear Enlace Acortado Manualmente

**Modal: "Crear Nuevo Enlace Acortado"**

```
┌──────────────────────────────────────────────┐
│ ➕ Crear Nuevo Enlace Acortado             ✕  │
├──────────────────────────────────────────────┤
│                                              │
│ URL Original:                                │
│ [https://www.ejemplo.com/ruta/muy/larga/url]│
│                                              │
│ Slug (opcional):                             │
│ [drop.co/]______ (6-10 caracteres)          │
│ [⟳ Generar automático]                      │
│                                              │
│ Título (opcional):                           │
│ [Mi enlace especial]                        │
│                                              │
│ Categoría:                                   │
│ [Seleccionar: externo/social/otro...]       │
│                                              │
│ Notas internas:                              │
│ [Para blog, campaña X, etc...]              │
│                                              │
│ Vista previa:                                │
│ https://drop.co/xK9m2p                      │
│ → https://www.ejemplo.com/ruta/...          │
│                                              │
│     [Cancelar]  [Crear enlace]              │
│                                              │
└──────────────────────────────────────────────┘
```

**Validaciones:**
- URL original válida (http/https)
- Slug único (6-10 caracteres, alfanuméricos)
- No pueden ser palabras reservadas (admin, login, etc)

---

### RF-096: Ver Detalles de Enlace

**Panel lateral o Modal:**

```
┌──────────────────────────────────────────────┐
│ DETALLES DEL ENLACE                        ✕  │
├──────────────────────────────────────────────┤
│                                              │
│ INFORMACIÓN BÁSICA                           │
│ ├─ Slug: xK9m2p                             │
│ ├─ URL Acortada: https://drop.co/xK9m2p    │
│ ├─ URL Original: https://udemy.com/course..│
│ ├─ Título: Meta Ads Course                 │
│ ├─ Categoría: Curso                        │
│ └─ Estado: ✅ Activo                        │
│                                              │
│ ESTADÍSTICAS                                 │
│ ├─ Clicks totales: 1,234                   │
│ ├─ Último click: Hace 2 horas              │
│ ├─ Fecha creación: 15 feb 2026             │
│ └─ Creado por: Admin                       │
│                                              │
│ GRÁFICO CLICKS (últimos 7 días)             │
│ │                                           │
│ │     ╱╲    ╱╲                             │
│ │ ───╱  ╲──╱  ╲───                         │
│ │                                           │
│                                              │
│ [Copiar enlace acortado]                    │
│ [QR Code]                                   │
│ [Editar]  [Desactivar]  [Eliminar]         │
│                                              │
└──────────────────────────────────────────────┘
```

---

### RF-097: Editar Enlace Acortado

**Permitir cambiar:**
- Slug (si está disponible)
- Título
- Categoría
- URL original (CUIDADO: redirige a nueva URL)
- Estado (activo/inactivo)
- Notas

**Validaciones:**
- Slug nuevo debe ser único
- URL original debe ser válida

---

### RF-098: Desactivar / Eliminar Enlace

**Desactivar (Soft delete):**
- Marcar como inactivo
- El enlace redirige a página "Enlace desactivado"
- No se elimina de BD (se preserva historial)
- Se puede reactivar

**Eliminar (Hard delete):**
- Solo si es manual + sin clicks
- Si tiene clicks: solo permitir desactivar
- Mostrar advertencia: "¿Estás seguro? Se perderá historial"

**Código:**
```typescript
async function desactivarEnlace(slug: string) {
  await db.enlaces_acortados.updateOne(
    { slug },
    { activo: false }
  );
}

async function eliminarEnlace(slug: string) {
  const enlace = await db.enlaces_acortados.findOne({ slug });
  
  if (enlace.clicks > 0) {
    throw new Error("No puedes eliminar enlace con clicks. Desactívalo.");
  }
  
  if (enlace.tipo === 'automatico') {
    throw new Error("No puedes eliminar enlaces automáticos. Desactívalo.");
  }
  
  await db.enlaces_acortados.deleteOne({ slug });
}
```

---

### RF-099: Filtros y Búsqueda de Enlaces

**Filtros disponibles:**
1. **Por estado:** Todos | Activos | Inactivos
2. **Por categoría:** Curso | Referido | Externo | Social | Afiliado | Otro
3. **Por tipo:** Automático | Manual
4. **Por rango de clicks:** 0 | 1-100 | 100-1k | 1k+

**Búsqueda:**
- Por slug
- Por URL original
- Por título

**Sorting:**
- Más clicks
- Menos clicks
- Más recientes
- Más antiguos

**URL con filtros:**
```
/admin/enlaces?estado=activos&categoria=curso&sort=clicks_desc&buscar=meta
```

---

### RF-100: API Endpoints para Enlaces Acortados

```
POST /api/enlaces/generar-corto
├─ Request: { url_original, titulo?, notas? }
├─ Response: { slug, url_acortada, url_original }
└─ Uso: Sistema interno (cursos, referidos, etc)

POST /api/enlaces/crear-manual
├─ Request: { url_original, slug?, titulo, categoria, notas }
├─ Admin only
└─ Response: { id, slug, url_acortada }

GET /api/enlaces/{slug}
├─ Public (redireccionamiento)
├─ Registra click
└─ Response: Redirige a URL original (301)

GET /api/enlaces/admin/lista
├─ Admin only
├─ Query: ?estado=activos&categoria=curso&sort=clicks_desc
└─ Response: { enlaces: [], total, paginas }

GET /api/enlaces/admin/{slug}
├─ Admin only
└─ Response: Detalles completo enlace

PUT /api/enlaces/admin/{slug}
├─ Admin only
├─ Request: { url_original?, slug?, titulo, estado, notas }
└─ Response: { success, updated_slug }

DELETE /api/enlaces/admin/{slug}
├─ Admin only
├─ Response: { success }

GET /api/enlaces/admin/{slug}/qr
├─ Admin only
├─ Response: QR code PNG (https://drop.co/{slug})

GET /api/enlaces/admin/estadisticas
├─ Admin only
├─ Response: { total_enlaces, total_clicks, top_10_enlaces }
```

---

### RF-101: QR Code para Enlaces Acortados

**Generar automáticamente:**
- Cada enlace acortado tiene QR code
- QR code apunta a: `https://drop.co/{slug}`
- Mostrable en dashboard
- Descargable como PNG

**Librería:** `qrcode` (npm)

```typescript
import QRCode from 'qrcode';

async function generarQR(slug: string) {
  const url = `https://drop.co/${slug}`;
  const qrCodeDataUrl = await QRCode.toDataURL(url);
  return qrCodeDataUrl; // Base64 PNG
}
```

---

### RF-102: Estadísticas y Analytics de Enlaces

**Dashboard global (Admin):**
```
┌──────────────────────────────────────┐
│ 📊 ESTADÍSTICAS DE ENLACES            │
├──────────────────────────────────────┤
│                                      │
│ Total enlaces: 156                   │
│ Activos: 142                         │
│ Inactivos: 14                        │
│                                      │
│ Total clicks históricos: 45,234      │
│ Clicks este mes: 8,234               │
│ Clicks hoy: 234                      │
│                                      │
│ TOP 5 ENLACES (por clicks):          │
│ 1. xK9m2p - Meta Ads   │ 1,234 clicks│
│ 2. aB7kL3 - Referido I │ 567 clicks │
│ 3. cD2pQ9 - Analytics  │ 456 clicks │
│ 4. eF5mN1 - Dropship   │ 345 clicks │
│ 5. gH8vL2 - Design     │ 234 clicks │
│                                      │
│ GRÁFICO (últimos 30 días):           │
│ │ ╱╲ ╱╲ ╱╲ ╱╲ ╱╲ ╱╲    │
│ │╱  ╲╱  ╲╱  ╲╱  ╲╱  ╲   │
│                                      │
└──────────────────────────────────────┘
```

---

## 3. Cron Jobs (Background Tasks)

### Limpiar enlaces inactivos (Mensual)

```typescript
// Ejecutar 1er día del mes, 2am
schedule.scheduleJob('0 2 1 * *', async () => {
  // Eliminar enlaces manuales inactivos sin clicks
  await db.enlaces_acortados.deleteMany({
    tipo: 'manual',
    activo: false,
    clicks: 0,
    fecha_creacion: { $lt: new Date(Date.now() - 90*24*60*60*1000) } // > 90 días
  });
  
  console.log('Enlaces inactivos limpiados');
});
```

---

## 4. Validaciones

**URL Original:**
- Debe ser HTTP/HTTPS válido
- Máximo 2048 caracteres
- No puede contener caracteres especiales sin codificar

**Slug:**
- 6-10 caracteres alfanuméricos
- Único (no puede repetirse)
- No puede ser palabra reservada (admin, login, api, app, etc)
- Case-insensitive (aB7kL3 = ab7kl3)

**Redirecciones:**
- Status code: 301 (Moved Permanently)
- Registrar cada click en BD

---

## 5. Base de Datos - Índices Críticos

```sql
-- Índices para performance
CREATE INDEX idx_slug ON enlaces_acortados(slug); -- Para redirecciones
CREATE INDEX idx_url_original ON enlaces_acortados(url_original); -- Para no duplicar
CREATE INDEX idx_activo ON enlaces_acortados(activo); -- Para filtros
CREATE INDEX idx_categoria ON enlaces_acortados(categoria); -- Para filtros
CREATE INDEX idx_fecha_creacion ON enlaces_acortados(fecha_creacion); -- Para sorting
CREATE INDEX idx_clicks ON enlaces_acortados(clicks DESC); -- Para top enlaces

-- Índice compuesto para búsquedas comunes
CREATE INDEX idx_activo_categoria ON enlaces_acortados(activo, categoria);
```

---

## 6. Seguridad

**Validaciones:**
- ✅ Validar URL antes de guardar (prevenir malware)
- ✅ Rate limiting en endpoint de redirección (prevenir DOS)
- ✅ Solo admin puede crear/editar enlaces
- ✅ Log de quién crea/modifica qué enlace
- ✅ Encriptar URLs en reposo (opcional)

**Rate Limiting:**
```
GET /drop.co/{slug} → 1000 req/min (IPs diferentes)
```

---

## 7. Casos de Uso

### Caso 1: URL Udemy en Cursos

```
// Sistema necesita mostrar botón "Ver Curso"
const urlUdemy = "https://www.udemy.com/course/meta-ads?ref=ABC123";

// Acortar automáticamente
const urlCorta = await generarURLCorta(urlUdemy);
// urlCorta = "https://drop.co/xK9m2p"

// En BD:
// slug: xK9m2p
// url_original: https://www.udemy.com/course/meta-ads?ref=ABC123
// tipo: automatico
// categoria: curso

// En frontend
<a href="https://drop.co/xK9m2p" target="_blank">Ver Curso</a>

// Usuario hace click
// 1. Redirige a https://www.udemy.com/course/meta-ads?ref=ABC123
// 2. Registra click en BD
// 3. Admin ve: "Meta Ads Course | 1,234 clicks"
```

### Caso 2: Enlace de Referido

```
// Generar URL referido
const urlReferido = "https://dropcostmaster.com/registro?ref=ivan_caicedo";

// Acortar
const urlCorta = await generarURLCorta(urlReferido);
// urlCorta = "https://drop.co/aB7kL3"

// Ivan comparte en WhatsApp:
// "¡Mira! https://drop.co/aB7kL3"

// Alguien hace click
// 1. Redirige a registro con ref=ivan_caicedo
// 2. Se registra comisión para Ivan
// 3. Admin ve tracking: "aB7kL3 | 234 clicks"
```

### Caso 3: Admin crea enlace manual

```
Admin en panel:
1. Click "+ Nuevo enlace acortado"
2. Ingresa URL: https://blog.dropcostmaster.com/guia-niches
3. Ingresa slug: guia-niches (automático: gN1aX7)
4. Ingresa título: "Guía de Niches para Dropshipping"
5. Categoría: Externo
6. Notas: "Blog post principal, compartir en email"
7. Click "Crear enlace"

BD:
- slug: gN1aX7
- url_original: https://blog.dropcostmaster.com/guia-niches
- titulo: Guía de Niches...
- tipo: manual
- categoria: externo
```

---

## 8. Timeline Implementación

| Fase | Duración | Tareas |
|------|----------|--------|
| **Fase 1** | Día 1 | BD + índices + generador slug |
| **Fase 2** | Día 1-2 | Endpoints API (6 nuevos) |
| **Fase 3** | Día 2 | Panel admin (tabla + crear) |
| **Fase 4** | Día 3 | Editar, desactivar, eliminar |
| **Fase 5** | Día 3-4 | Filtros, búsqueda, estadísticas |
| **Fase 6** | Día 4 | QR codes + integración en cursos/referidos |
| **Fase 7** | Día 4-5 | Testing + Go live |

**Total:** 5 días (1 semana)

---

## 9. Checklist Go-Live

- [ ] BD creada con todos los índices
- [ ] Generador slug funcionando
- [ ] Endpoint de redirección rápido (<20ms)
- [ ] Panel admin funcional (tabla, crear, editar)
- [ ] Filtros y búsqueda working
- [ ] URLs acortadas en cursos Udemy
- [ ] URLs acortadas en referidos
- [ ] QR codes generando correctamente
- [ ] Analytics mostrando clicks en tiempo real
- [ ] Rate limiting implementado
- [ ] Testing responsivo (mobile, tablet, desktop)
- [ ] Dark mode soporte
- [ ] Deploy staging ✅
- [ ] Deploy producción ✅

---

## 10. Roadmap Futuro (V2+)

- Análisis geográfico de clicks (país, ciudad)
- Análisis por dispositivo (mobile, desktop, tablet)
- Referrer tracking (qué página envía tráfico)
- Custom domains (usa tu dominio en lugar de drop.co)
- API pública para usuarios (crear sus propios enlaces)
- Integración con Google Analytics
- Deep linking (tracking en app)
- Notificaciones cuando enlace llega a X clicks
- Exportar CSV de enlaces y estadísticas

---

**Fin Especificación de Requerimientos - Acortador de Enlaces Propio**

---

## 📊 RESUMEN EJECUTIVO

**RF-088 a RF-102 (15 nuevos requerimientos)**

✅ **Modelo:** 
- URL larga → slug (6 caracteres) → redirige automáticamente
- Dominio propio: `drop.co`
- Ejemplo: `https://drop.co/xK9m2p` → URL original

✅ **Funcionalidades:**
- Generar URLs acortadas automáticamente (en cursos, referidos)
- Crear enlaces manuales (admin)
- Editar, desactivar, eliminar enlaces
- Filtros por estado, categoría, tipo
- Búsqueda por slug, URL, título
- QR codes automáticos
- Analytics: total clicks, gráficos, top enlaces

✅ **Integración:**
- Cursos Udemy: enlace corto en botón
- Referidos: enlace corto para compartir
- Admin panel completo

✅ **Base de datos:**
- 1 tabla (`enlaces_acortados`)
- 6 índices críticos
- Tracking de clicks automático

✅ **API:**
- 8 endpoints nuevos
- Redirecciones rápidas (<20ms)

✅ **Timeline:**
- 5 días (1 semana)

✅ **Ventajas:**
- No depender de Short.io (costo $0)
- Control total
- URLs limpias y profesionales
- Tracking de conversiones
- Fácil de gestionar
