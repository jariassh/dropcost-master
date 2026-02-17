# Especificación de Requerimientos - Centro de Capacitación y Cursos
## DropCost Master

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Fase:** Post-Referidos (Semana 17-19)  
**Requerimientos:** RF-079 a RF-085

---

## 1. Resumen Ejecutivo

Módulo que integra **cursos educativos** (gratis y de pago) en DropCost Master. Los usuarios pueden:
- Ver cursos gratis sobre dropshipping, finanzas, IA
- Acceder a cursos de pago via Udemy con código de afiliado
- Guardar cursos favoritos
- Recibir notificaciones de nuevos cursos

**Modelo de ingresos:** Comisión 5-15% por cada venta de curso Udemy referida.

---

## 2. Requerimientos Funcionales

### RF-079: Landing Principal - Centro de Capacitación

**Ubicación:** Sidebar → "📚 Centro de Capacitación" (Próximamente)

**Pantalla principal:**
```
┌──────────────────────────────────────────┐
│ 📚 CENTRO DE CAPACITACIÓN                │
├──────────────────────────────────────────┤
│                                          │
│ Aprende todo sobre dropshipping,         │
│ finanzas, IA y más                       │
│                                          │
│ [Todos] [Gratis] [Pago] [Favoritos]     │
│ [Búsqueda: _______________] [🔍]        │
│                                          │
│ CATEGORÍAS:                              │
│ ├─ 📢 Publicidad & Marketing             │
│ ├─ 📦 Dropshipping Avanzado              │
│ ├─ 🚚 Logística & COD                    │
│ ├─ 💰 Finanzas & Contabilidad            │
│ ├─ 🤖 IA para Negocios                   │
│ ├─ 🏪 Shopify & Ecommerce                │
│ ├─ ✍️ Copywriting & Design               │
│ └─ 📊 Otros temas                        │
│                                          │
│ CURSOS DESTACADOS:                       │
│ [Card 1] [Card 2] [Card 3] [Card 4]    │
│                                          │
└──────────────────────────────────────────┘
```

---

### RF-080: Catálogo de Cursos Gratis

**Contenido:**
1. **Videos YouTube embebidos:**
   - Canales recomendados: HubSpot Academy, Google Digital Garage
   - Playlists sobre: SEO, publicidad, copywriting
   - Duración: 1h-10h por playlist

2. **Recursos externos gratuitos:**
   - Enlaces a guías, artículos, whitepapers
   - Documentación oficial (Shopify Help, Meta Ads)

3. **Contenido DropCost (Opcional futuro):**
   - Videos tutoriales internos
   - Webinars grabados
   - Guides escritas

**Estructura:**
```
CURSOS GRATIS
├─ [Card YouTube] "Google Ads Masterclass"
│  └─ 12 videos, 8 horas
│
├─ [Card YouTube] "Facebook Marketing"
│  └─ 25 videos, 12 horas
│
├─ [Card Recurso] "Guía SEO Shopify"
│  └─ PDF descargable
│
└─ [Card DropCost] "Cómo costear tu producto"
   └─ Video interno DropCost
```

**Validación:**
- Cursor "Próximamente" en módulo si no hay cursos
- Mostrar: "Se agregarán pronto" + email para notificar

---

### RF-081: Catálogo de Cursos Pago (Udemy)

**Fuente:** Cursos destacados de Udemy (manual o API)

**Cursos a mostrar (MVP):**
```
PUBLICIDAD & MARKETING:
1. "Meta Ads para Principiantes" - Instructor X
2. "Google Ads Avanzado" - Instructor Y
3. "TikTok Ads Marketing" - Instructor Z

DROPSHIPPING:
4. "Dropshipping desde Cero 2026" - Expert
5. "Niching y Research de Productos" - Expert
6. "Proveedores y Suppliers" - Expert

FINANZAS & CONTABILIDAD:
7. "Contabilidad para Dropshippers" - Contador
8. "Impuestos en Dropshipping LATAM" - Abogado
9. "Gestión de Cash Flow" - Asesor

IA PARA NEGOCIOS:
10. "ChatGPT para Marketing" - Expert
11. "Midjourney para Diseño" - Designer
12. "IA en Copywriting" - Copywriter

SHOPIFY & ECOMMERCE:
13. "Shopify Masterclass 2026" - Expert
14. "Optimización de Conversión" - Especialista
15. "Email Marketing en Shopify" - Expert
```

**Información por curso:**
- Thumbnail/imagen
- Título
- Instructor
- Precio (en USD)
- Rating ⭐ (si está disponible)
- Descripción corta (100 caracteres)
- Botón [Ver Curso] → Enlace Udemy + affiliate_id

---

### RF-082: Estructura de Cursos (Card Component)

**Card Curso Gratis:**
```
┌────────────────────────────┐
│ [Thumbnail YouTube/PDF]    │
│                            │
│ Google Ads Masterclass     │
│ 📚 Recurso Gratis         │
│                            │
│ 12 videos • 8 horas       │
│ ⭐⭐⭐⭐⭐ (opcional)        │
│                            │
│ Aprende Google Ads desde   │
│ cero hasta experto...      │
│                            │
│ [❤️ Favorito] [Ver]       │
└────────────────────────────┘
```

**Card Curso Pago (Udemy):**
```
┌────────────────────────────┐
│ [Thumbnail Udemy]          │
│ "PAGO" badge              │
│                            │
│ Meta Ads para Principiantes│
│ Por: Carlos Marketing      │
│                            │
│ Precio: $14.99 USD        │
│ ⭐⭐⭐⭐⭐ (4.8)             │
│ 1,234 estudiantes         │
│                            │
│ Domina Facebook Ads...     │
│                            │
│ [❤️ Favorito] [Ver Curso] │
└────────────────────────────┘
```

---

### RF-083: Filtros y Búsqueda

**Filtros disponibles:**
1. **Por tipo:**
   - Todos | Gratis | Pago

2. **Por categoría:**
   - Publicidad & Marketing
   - Dropshipping Avanzado
   - Logística & COD
   - Finanzas & Contabilidad
   - IA para Negocios
   - Shopify & Ecommerce
   - Copywriting & Design
   - Otros

3. **Búsqueda:**
   - Input busca en: título, instructor, descripción
   - Debounce 300ms + mostrar resultados
   - Si no hay resultados: "No encontramos cursos" + sugerir contacto

**Validación:**
- Filtros se aplican en tiempo real
- URL se actualiza con params: `?tipo=pago&categoria=publicidad&buscar=ads`
- Guardar preferencias en localStorage

---

### RF-084: Sistema de Favoritos

**Funcionalidad:**
1. Usuario presiona ❤️ en card
2. Se guarda en BD (tabla `cursos_favoritos`)
3. Aparece en tab [Favoritos]
4. Toast confirma: "Agregado a favoritos"

**Tabla BD:**
```sql
CREATE TABLE cursos_favoritos (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL,
  curso_id VARCHAR NOT NULL, -- ID Udemy o DropCost
  tipo_curso ENUM('gratis', 'pago'),
  titulo_curso VARCHAR,
  fecha_agregado TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (usuario_id) REFERENCES users(id),
  UNIQUE(usuario_id, curso_id)
);
```

**Comportamiento:**
- Login requerido para favoritar
- Si no está logueado: mostrar modal "Inicia sesión para guardar favoritos"
- Favoritos persistentes (BD)

---

### RF-085: Enlace a Udemy con Código Afiliado

**Proceso:**
1. Usuario presiona [Ver Curso] en card de Udemy
2. Se genera URL con affiliate_id:
   ```
   https://www.udemy.com/course/curso-id/?referralCode=TU_CODIGO_AFILIADO
   ```

3. Se abre en nueva pestaña (`target="_blank"`)
4. Cookie Udemy (7 días) registra tu referido
5. Si compra dentro de 7 días: ✅ Recibas comisión

**Variables de entorno requeridas:**
```
VITE_UDEMY_AFFILIATE_ID=tu_codigo_afiliado
VITE_UDEMY_REFERRAL_CODE=tu_codigo_referral
```

**URL estructura:**
```
Curso: "Complete JavaScript Course"
ID: 1234567

URL generado:
https://www.udemy.com/course/complete-javascript-course/?referralCode=ABC123XYZ
```

**Tracking (Opcional):**
```sql
CREATE TABLE cursos_clicks (
  id UUID PRIMARY KEY,
  usuario_id UUID,
  curso_udemy_id VARCHAR,
  titulo_curso VARCHAR,
  fecha_click TIMESTAMP DEFAULT NOW()
);

-- Usar para analytics
```

---

### RF-086: Notificaciones de Nuevos Cursos

**Email (semanal):**
```
Asunto: "📚 Nuevos cursos esta semana - Centro de Capacitación"

Hola {nombre},

Agregamos 3 nuevos cursos a nuestro Centro de Capacitación:

1. "TikTok Ads Masterclass" - Publicidad
   Aprende a escalar con TikTok Shop...
   [Ver curso]

2. "Dropshipping en 2026" - Dropshipping
   Las estrategias más actuales...
   [Ver curso]

3. "IA para Copywriting" - IA
   Usa ChatGPT para escribir mejores ads...
   [Ver curso]

[Ver todos los cursos]

¿Sugerencias? Responde a este email.
```

**Configuración:**
- Toggle en Configuración: "Recibir notificaciones de nuevos cursos"
- Frecuencia: Semanal (viernes 10am)
- Máximo 5 cursos por email

---

### RF-087: Página "Próximamente" en Sidebar

**Mientras no se lance:**
```
SIDEBAR:
├─ Dashboard
├─ Simulador
├─ Análisis Regional
├─ Ofertas Irresistibles
├─ 📚 Centro de Capacitación (Próximamente) ← AQUÍ
├─ Configuración
└─ Admin
```

**Si hace click (antes de launch):**
```
┌──────────────────────────────────┐
│                                  │
│      📚 PRÓXIMAMENTE              │
│                                  │
│  Centro de Capacitación          │
│                                  │
│  Estamos preparando cursos       │
│  gratis y de pago sobre:         │
│                                  │
│  ✓ Dropshipping avanzado         │
│  ✓ Publicidad digital            │
│  ✓ Finanzas & Contabilidad       │
│  ✓ IA para negocios              │
│  ✓ Y mucho más...                │
│                                  │
│  📧 [Notificarme cuando esté listo]
│                                  │
│              [Cerrar]            │
│                                  │
└──────────────────────────────────┘
```

---

## 3. Base de Datos

### Tabla: cursos (si usas API Udemy, sino es manual)

```sql
CREATE TABLE cursos (
  id UUID PRIMARY KEY,
  
  -- Información básica
  titulo VARCHAR NOT NULL,
  descripcion TEXT,
  instructor VARCHAR,
  thumbnail_url VARCHAR,
  
  -- Tipo y categoría
  tipo ENUM('gratis', 'pago') DEFAULT 'pago',
  categoria ENUM(
    'publicidad',
    'dropshipping',
    'logistica',
    'finanzas',
    'ia',
    'shopify',
    'copywriting',
    'otros'
  ),
  
  -- Datos Udemy (si es pago)
  udemy_id VARCHAR UNIQUE,
  udemy_url VARCHAR,
  precio_usd NUMERIC(10,2),
  rating NUMERIC(2,1), -- ej: 4.8
  estudiantes INTEGER,
  
  -- Datos YouTube (si es gratis)
  youtube_playlist_id VARCHAR,
  youtube_duracion_horas NUMERIC(5,2),
  video_count INTEGER,
  
  -- Metadata
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP,
  activo BOOLEAN DEFAULT true,
  
  UNIQUE(titulo, instructor)
);
```

### Tabla: cursos_favoritos (ya definida arriba)

```sql
CREATE TABLE cursos_favoritos (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL,
  curso_id VARCHAR NOT NULL,
  tipo_curso ENUM('gratis', 'pago'),
  titulo_curso VARCHAR,
  fecha_agregado TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (usuario_id) REFERENCES users(id),
  UNIQUE(usuario_id, curso_id)
);
```

### Tabla: cursos_clicks (Tracking - Opcional)

```sql
CREATE TABLE cursos_clicks (
  id UUID PRIMARY KEY,
  usuario_id UUID,
  curso_udemy_id VARCHAR,
  titulo_curso VARCHAR,
  fecha_click TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (usuario_id) REFERENCES users(id)
);
```

---

## 4. API Endpoints

```
GET /api/cursos
├─ Query params: ?tipo=pago&categoria=publicidad&buscar=ads
├─ Paginación: ?limit=20&skip=0
└─ Response: { cursos: [], total, hasMore }

GET /api/cursos/{curso_id}
└─ Response: Detalles completo curso

GET /api/cursos/favoritos
├─ Usuario autenticado solo
└─ Response: Array de cursos favoritos

POST /api/cursos/favoritar
├─ Request: { curso_id, tipo_curso }
├─ Usuario autenticado solo
└─ Response: { success, favoriteId }

DELETE /api/cursos/favoritos/{curso_id}
├─ Usuario autenticado solo
└─ Response: { success }

GET /api/cursos/enlace-udemy/{curso_id}
├─ Query: ?affiliate_id=TU_ID
├─ Response: { url: "https://www.udemy.com/course/...?ref=..." }
└─ Registra click en BD (si usuario logueado)

POST /api/cursos/preferencias-notificaciones
├─ Request: { recibir_notificaciones: true/false }
├─ Usuario autenticado solo
└─ Response: { success }
```

---

## 5. Validaciones

**Filtros:**
- Tipo debe ser: todos | gratis | pago
- Categoría debe ser válida
- Búsqueda máximo 100 caracteres

**Favoritos:**
- Usuario debe estar logueado
- No puede favoritar 2 veces mismo curso

**Notificaciones:**
- Email máximo 1x por semana
- Usuario puede desuscribirse

---

## 6. Contenido MVP (Inicial)

### Cursos Gratis (15-20)
- YouTube embebidos (Google, HubSpot, etc)
- Guías/recursos externos

### Cursos Pago Udemy (15-20)
```
Publicidad (3):
1. Meta Ads Beginners
2. Google Ads Advanced
3. TikTok Ads Masterclass

Dropshipping (3):
4. Dropshipping desde Cero
5. Niching & Research
6. Suppliers y Proveedores

Finanzas (3):
7. Contabilidad Dropshippers
8. Impuestos LATAM
9. Cash Flow Management

IA (3):
10. ChatGPT para Marketing
11. Midjourney Design
12. AI Copywriting

Shopify (2):
13. Shopify Masterclass
14. Conversión Optimization

Otros (2):
15. Email Marketing
16. Psychology Consumidor
```

---

## 7. Timeline Implementación

| Fase | Duración | Tareas |
|------|----------|--------|
| **Fase 1** | Día 1 | Crear página + agregar 20 cursos (manual) |
| **Fase 2** | Día 1-2 | Cards + filtros + búsqueda |
| **Fase 3** | Día 2-3 | Sistema favoritos + BD |
| **Fase 4** | Día 3-4 | Integración Udemy URLs + affiliate |
| **Fase 5** | Día 4 | Emails + notificaciones |
| **Fase 6** | Día 4-5 | Testing + Go live MVP |

**Total:** 5 días (1 semana)

---

## 8. Ingresos Proyectados

```
Escenario optimista (1.000 usuarios activos/mes):
├─ 15% hacen click en curso Udemy = 150 clicks
├─ 10% compran = 15 compradores
├─ Ticket promedio: $12 USD
├─ Comisión 10%: $1.2 × 15 = $18 USD/mes
├─ Annual: $216 USD ≈ $750.000 COP/año
└─ Escalada a 5k usuarios: $3.7M COP/año
```

---

## 9. Roadmap Futuro (V2+)

- Integración completa API Udemy (traer cursos automáticamente)
- Certificados de cursos internos DropCost
- Webinars en vivo
- Comunidad/foro de estudiantes
- Stats: "Cursos completados" por usuario
- Descuentos especiales Udemy (si socios)
- Programa de afiliados para instructores

---

## 10. Checklist Go-Live

- [ ] 20 cursos agregados (15 pago, 5 gratis)
- [ ] Cards diseñadas y responsive
- [ ] Filtros funcionando
- [ ] Búsqueda working
- [ ] Sistema favoritos working
- [ ] URLs Udemy con affiliate_id funcionales
- [ ] Emails notificaciones configurados
- [ ] Sidebar actualizado (badge "Próximamente" → "Nuevo")
- [ ] Testing responsivo (mobile, tablet, desktop)
- [ ] Dark mode soporte
- [ ] Deploy staging ✅
- [ ] Deploy producción ✅

---

**Fin Especificación de Requerimientos - Centro de Capacitación**

---

## 📊 RESUMEN

**RF-079 a RF-087 (9 nuevos requerimientos)**

✅ Landing principal Centro de Capacitación
✅ Catálogo cursos gratis (YouTube + recursos)
✅ Catálogo cursos pago (Udemy)
✅ Cards component para cursos
✅ Filtros y búsqueda
✅ Sistema favoritos
✅ Integración Udemy + affiliate links
✅ Notificaciones de nuevos cursos
✅ Página "Próximamente" en sidebar

**Tablas BD:** 2-3 nuevas (cursos, favoritos, clicks tracking)
**APIs:** 6 endpoints nuevos
**Timeline:** 5 días (1 semana)
**Ingresos:** $750k-$3.7M COP/año escalado
