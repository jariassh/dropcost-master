# Especificación de Requerimientos - Configuración Global
## DropCost Master

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Fase:** Configuración y Setup  
**Requerimientos:** RF-139 a RF-152

---

## 1. Resumen Ejecutivo

Panel centralizado en Admin donde se configuran:
- **SEO & Metadatos** (título, descripción, keywords, robots)
- **Branding** (favicon, logos, paleta de colores global)
- **Tracking & Scripts** (píxeles, analytics, widgets)
- **Información empresa** (datos públicos)

Todos los cambios se aplican **instantáneamente** a Admin Panel + Panel Usuario sin recargar página.

---

## 2. Requerimientos Funcionales

### RF-139: Panel Configuración Global - Vista Principal

**Ubicación:** Admin Panel → Configuración → Configuración Global (NUEVO)

```
┌──────────────────────────────────────────────────────────┐
│ ⚙️ CONFIGURACIÓN GLOBAL DE PLATAFORMA                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ TABS:                                                    │
│ [SEO & Metadatos] [Branding] [Tracking] [Información]  │
│                                                          │
│ Seleccionado: SEO & Metadatos                           │
│                                                          │
│ (Contenido dinámico por tab)                            │
│                                                          │
│ Cambios aplicados: Instantáneamente ✅                  │
│ Última actualización: 15 feb 2026, 10:30am              │
│ Por: Admin Master                                        │
│                                                          │
│ [Guardar cambios] [Restaurar valores por defecto]      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### RF-140: TAB SEO & Metadatos

**Contenido:**

```
┌──────────────────────────────────────────────────────────┐
│ SEO & METADATOS                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ META TÍTULOS Y DESCRIPCIONES:                            │
│                                                          │
│ Título Meta (en buscadores):                             │
│ [DropCost Master - Calculadora de Costos para Dropship] │
│ (máx 60 caracteres) - Caracteres: 60/60 ✅              │
│                                                          │
│ Descripción Meta (en buscadores):                        │
│ [Calcula costos, márgenes y CPA en tiempo real. La     │
│  herramienta #1 para optimizar tu dropshipping en LATAM]│
│ (máx 160 caracteres) - Caracteres: 150/160 ✅           │
│                                                          │
│ PALABRAS CLAVE:                                          │
│ [dropshipping, calculadora costos, CPA, margen, ecommerce]
│ (separadas por comas)                                   │
│                                                          │
│ IMAGEN COMPARTIBLE (OG:IMAGE):                           │
│ URL: [https://cdn.dropcostmaster.com/og-image.png]      │
│ Recomendado: 1200x630px                                 │
│ Previsualización: [Mostrar] [Cambiar imagen]            │
│                                                          │
│ CONFIGURACIÓN ROBOTS:                                    │
│ ┌──────────────────────────────────────────────────────┐│
│ │ ☑ Permitir indexación (robots.txt)                   ││
│ │ ☑ Permitir seguimiento de links                      ││
│ │ ☑ Mostrar en búsqueda Google                         ││
│ │ ☑ Permitir snippet enriquecido                       ││
│ │                                                      ││
│ │ Robots.txt content:                                  ││
│ │ User-agent: *                                        ││
│ │ Allow: /                                             ││
│ │ Disallow: /admin                                     ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ SITEMAP:                                                │
│ ☑ Generar sitemap.xml automáticamente                   │
│ ☑ Enviar a Google Search Console                        │
│ URL Sitemap: https://dropcostmaster.com/sitemap.xml    │
│                                                          │
│ [Regenerar sitemap ahora] [Enviar a GSC]              │
│                                                          │
│ VISTA PREVIA (Cómo se verá en Google):                 │
│ ┌──────────────────────────────────────────────────────┐│
│ │ DropCost Master - Calculadora de Costos para...     ││
│ │ https://dropcostmaster.com                           ││
│ │ Calcula costos, márgenes y CPA en tiempo real...    ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### RF-141: TAB Branding

**Contenido:**

```
┌──────────────────────────────────────────────────────────┐
│ BRANDING                                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ FAVICON:                                                 │
│ URL: [https://cdn.dropcostmaster.com/favicon.ico]       │
│ Recomendado: 32x32px o 64x64px                          │
│ Previsualización: [Mostrar]                             │
│ [Cambiar favicon]                                       │
│                                                          │
│ LOGO PRINCIPAL:                                          │
│ URL: [https://cdn.dropcostmaster.com/logo-principal.png]│
│ Usado en: Header principal, navbar                      │
│ Recomendado: 200x60px                                   │
│ Previsualización: [Mostrar]                             │
│ [Cambiar logo]                                          │
│                                                          │
│ LOGO FOOTER:                                             │
│ URL: [https://cdn.dropcostmaster.com/logo-footer.png]   │
│ Usado en: Footer, documentos                            │
│ Recomendado: 180x50px                                   │
│ Previsualización: [Mostrar]                             │
│ [Cambiar logo]                                          │
│                                                          │
│ ════════════════════════════════════════════════════════ │
│                                                          │
│ PALETA DE COLORES GLOBAL:                               │
│                                                          │
│ Color Primario (Botones, acentos):                      │
│ [#0066FF] ← Picker color integrado ◉                    │
│ Previsualización: ▓▓▓ Azul primario                     │
│                                                          │
│ Color Secundario:                                        │
│ [#1A1F3A] ← Picker color integrado ◉                    │
│ Previsualización: ▓▓▓ Azul oscuro                       │
│                                                          │
│ Color de Éxito:                                          │
│ [#10B981] ← Picker color integrado ◉                    │
│ Previsualización: ▓▓▓ Verde éxito                       │
│                                                          │
│ Color de Error:                                          │
│ [#EF4444] ← Picker color integrado ◉                    │
│ Previsualización: ▓▓▓ Rojo error                        │
│                                                          │
│ Color de Warning:                                        │
│ [#F59E0B] ← Picker color integrado ◉                    │
│ Previsualización: ▓▓▓ Naranja warning                   │
│                                                          │
│ Color Fondo Principal:                                   │
│ [#FFFFFF] ← Picker color integrado ◉                    │
│ Previsualización: ▓▓▓ Blanco                            │
│                                                          │
│ Color Texto Principal:                                   │
│ [#1F2937] ← Picker color integrado ◉                    │
│ Previsualización: ▓▓▓ Gris oscuro                       │
│                                                          │
│ Color Texto Secundario:                                  │
│ [#6B7280] ← Picker color integrado ◉                    │
│ Previsualización: ▓▓▓ Gris claro                        │
│                                                          │
│ IMPORTANCIA:                                             │
│ ⚠️ Estos colores se aplicarán instantáneamente a:       │
│ • Admin Panel                                           │
│ • Panel Usuario                                         │
│ • Todos los botones, acentos, avisos                    │
│ • Sin necesidad de recargar página                      │
│                                                          │
│ [Previsualizar en tiempo real] [Resetear a por defecto]│
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### RF-142: TAB Tracking & Scripts

**Contenido:**

```
┌──────────────────────────────────────────────────────────┐
│ TRACKING & SCRIPTS                                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ CÓDIGO EN ENCABEZADO (HEAD):                             │
│ Usado para: Píxeles Meta, Google Analytics, etc         │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ <!-- Google Analytics -->                           ││
│ │ <script async src="https://www.googletagmanager...  ││
│ │ gtag('config', 'G-XXXXXXXXXX');                     ││
│ │                                                    ││
│ │ <!-- Meta Pixel -->                                ││
│ │ <img height="1" width="1" style="display:none"    ││
│ │ src="https://www.facebook.com/tr?id=123456789...  ││
│ │                                                    ││
│ │ Validación: ✅ HTML válido                         ││
│ │ Caracteres: 345/5000                               ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ [Validar código] [Limpiar] [Ver preview]               │
│                                                          │
│ ────────────────────────────────────────────────────────│
│                                                          │
│ CÓDIGO EN PIE DE PÁGINA (FOOTER):                        │
│ Usado para: Chat widgets, analytics, retargeting       │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ <!-- Intercom Chat Widget -->                       ││
│ │ <script>                                            ││
│ │   window.intercomSettings = {                       ││
│ │     api_base: "https://api-iam.intercom.io",       ││
│ │     app_id: "xyz123",                              ││
│ │     name: "jariash"                                ││
│ │   };                                                ││
│ │ </script>                                           ││
│ │                                                    ││
│ │ <!-- HubSpot Tracking -->                          ││
│ │ <script src="https://js.hs-scripts.com/123456...  ││
│ │                                                    ││
│ │ Validación: ✅ HTML válido                         ││
│ │ Caracteres: 523/5000                               ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ [Validar código] [Limpiar] [Ver preview]               │
│                                                          │
│ ────────────────────────────────────────────────────────│
│                                                          │
│ VISTA PREVIA (HEAD):                                     │
│ ┌──────────────────────────────────────────────────────┐│
│ │ <head>                                              ││
│ │   ...código configurado aquí...                     ││
│ │ </head>                                             ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ VISTA PREVIA (FOOTER):                                   │
│ ┌──────────────────────────────────────────────────────┐│
│ │ <footer>                                            ││
│ │   ...código configurado aquí...                     ││
│ │ </footer>                                           ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ IMPORTANTE:                                              │
│ ⚠️ El código se inyecta directamente en la página       │
│ • No valida seguridad (confía en admin)                 │
│ • Cambios aplicados instantáneamente                    │
│ • Guarda historial de cambios (auditoría)              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### RF-143: TAB Información Empresa

**Contenido:**

```
┌──────────────────────────────────────────────────────────┐
│ INFORMACIÓN EMPRESA                                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ DATOS PÚBLICOS:                                          │
│                                                          │
│ Nombre Empresa:                                          │
│ [DropCost Master]                                        │
│                                                          │
│ Descripción (para meta tags):                            │
│ [Plataforma SaaS de costeo para dropshippers...]       │
│ (máx 500 caracteres)                                    │
│                                                          │
│ Sitio Web:                                               │
│ [https://dropcostmaster.com]                            │
│                                                          │
│ Email de Contacto Público:                               │
│ [contacto@dropcostmaster.com]                           │
│                                                          │
│ Teléfono (opcional):                                     │
│ [+57 1234567890]                                        │
│                                                          │
│ País de Operación:                                       │
│ [🇨🇴 Colombia]                                           │
│                                                          │
│ REDES SOCIALES:                                          │
│                                                          │
│ Instagram:                                               │
│ [https://instagram.com/dropcostmaster]                  │
│                                                          │
│ LinkedIn:                                                │
│ [https://linkedin.com/company/dropcostmaster]           │
│                                                          │
│ Twitter:                                                 │
│ [https://twitter.com/dropcostmaster]                    │
│                                                          │
│ YouTube:                                                 │
│ [https://youtube.com/@dropcostmaster]                   │
│                                                          │
│ POLÍTICAS:                                               │
│                                                          │
│ URL Términos y Condiciones:                              │
│ [https://dropcostmaster.com/terminos-condiciones]       │
│                                                          │
│ URL Política de Privacidad:                              │
│ [https://dropcostmaster.com/politica-privacidad]        │
│                                                          │
│ [Guardar cambios]                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### RF-144: Inyección Dinámmica de Colores (CSS Variables)

**Implementación técnica:**

```css
:root {
  /* Colores configurables desde admin */
  --color-primary: #0066FF;
  --color-secondary: #1A1F3A;
  --color-success: #10B981;
  --color-error: #EF4444;
  --color-warning: #F59E0B;
  --color-bg-primary: #FFFFFF;
  --color-text-primary: #1F2937;
  --color-text-secondary: #6B7280;
}

/* Aplicación de colores */
.btn-primary { background-color: var(--color-primary); }
.text-primary { color: var(--color-text-primary); }
.bg-primary { background-color: var(--color-bg-primary); }
/* etc... */
```

**Actualización en tiempo real (sin reload):**

```typescript
// Cuando admin cambia color
function actualizarColorGlobal(nombreColor: string, codigoHex: string) {
  document.documentElement.style.setProperty(
    `--color-${nombreColor}`,
    codigoHex
  );
  
  // Guardar en BD
  await guardarConfiguracion({
    tipo: 'color',
    nombre: nombreColor,
    valor: codigoHex
  });
}
```

---

### RF-145: Validación de Código HTML

**Validaciones en Tracking & Scripts:**

```typescript
// Validar HTML válido
function validarHTML(codigo: string): boolean {
  try {
    new DOMParser().parseFromString(codigo, 'text/html');
    return true;
  } catch {
    return false;
  }
}

// Advertencias de seguridad
function advertenciasSeguridad(codigo: string): string[] {
  const advertencias = [];
  
  if (codigo.includes('<script>')) {
    advertencias.push('⚠️ Script tag detectado');
  }
  if (codigo.includes('onclick=')) {
    advertencias.push('⚠️ Event inline detectado');
  }
  
  return advertencias;
}
```

---

### RF-146: Tabla Base de Datos - Configuración Global

```sql
CREATE TABLE configuracion_global (
  id UUID PRIMARY KEY,
  
  -- SEO
  meta_title VARCHAR(60),
  meta_description VARCHAR(160),
  meta_keywords TEXT,
  og_image_url VARCHAR,
  
  -- Robots
  permitir_indexacion BOOLEAN DEFAULT true,
  permitir_seguimiento BOOLEAN DEFAULT true,
  robots_txt_custom TEXT,
  
  -- Branding
  favicon_url VARCHAR,
  logo_principal_url VARCHAR,
  logo_footer_url VARCHAR,
  
  -- Colores (CSS Variables)
  color_primary VARCHAR(7) DEFAULT '#0066FF',
  color_secondary VARCHAR(7) DEFAULT '#1A1F3A',
  color_success VARCHAR(7) DEFAULT '#10B981',
  color_error VARCHAR(7) DEFAULT '#EF4444',
  color_warning VARCHAR(7) DEFAULT '#F59E0B',
  color_bg_primary VARCHAR(7) DEFAULT '#FFFFFF',
  color_text_primary VARCHAR(7) DEFAULT '#1F2937',
  color_text_secondary VARCHAR(7) DEFAULT '#6B7280',
  
  -- Tracking
  codigo_head TEXT,
  codigo_footer TEXT,
  
  -- Información
  nombre_empresa VARCHAR,
  descripcion_empresa TEXT,
  sitio_web VARCHAR,
  email_contacto VARCHAR,
  telefono VARCHAR,
  pais_operacion VARCHAR(2),
  
  -- Redes sociales
  instagram_url VARCHAR,
  linkedin_url VARCHAR,
  twitter_url VARCHAR,
  youtube_url VARCHAR,
  
  -- Políticas
  terminos_condiciones_url VARCHAR,
  politica_privacidad_url VARCHAR,
  
  -- Auditoría
  actualizado_por UUID,
  fecha_actualizacion TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (actualizado_por) REFERENCES users(id)
);

-- Tabla historial cambios
CREATE TABLE configuracion_global_historial (
  id UUID PRIMARY KEY,
  campo_modificado VARCHAR,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  usuario_admin UUID NOT NULL,
  fecha_cambio TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (usuario_admin) REFERENCES users(id)
);
```

---

### RF-147: API Endpoints - Configuración Global

```
GET /api/admin/configuracion-global
├─ Admin only
└─ Response: { todos los campos configuración }

PUT /api/admin/configuracion-global
├─ Admin only
├─ Request: { campo: valor, ... }
└─ Response: { success, cambios_aplicados }

GET /api/admin/configuracion-global/colores
├─ Admin only
└─ Response: { colores CSS variables }

PUT /api/admin/configuracion-global/colores
├─ Admin only
├─ Request: { color_primary, color_secondary, ... }
└─ Response: { success, colores_actualizados }

GET /api/admin/configuracion-global/historial
├─ Admin only
└─ Response: { cambios históricos con usuario y fecha }

POST /api/admin/configuracion-global/validar-html
├─ Admin only
├─ Request: { codigo_html }
└─ Response: { valido, advertencias }

POST /api/admin/configuracion-global/resetear
├─ Admin only
└─ Response: { success, valores_restaurados }
```

---

### RF-148: Carga de Imágenes (Favicon, Logos)

**Proceso:**

```
Usuario sube imagen (favicon, logo)
  ↓
Validar: Formato (PNG, JPG, SVG), tamaño (<5MB)
  ↓
Subir a CDN (ej: Cloudinary, S3)
  ↓
Guardar URL en BD
  ↓
Actualizar página instantáneamente
  ↓
Mostrar previsualización
```

---

### RF-149: Historial de Cambios (Auditoría)

**Mostrar en admin:**

```
ÚLTIMOS CAMBIOS:
├─ 15/2/2026 10:30 - Admin cambió Color Primario a #0066FF
├─ 15/2/2026 10:15 - Admin agregó Meta Descripción
├─ 14/2/2026 15:45 - Admin subió Favicon nuevo
└─ 14/2/2026 14:20 - Admin configuró Google Analytics
```

---

### RF-150: Preview en Tiempo Real

**Funcionalidad:**

```
Admin cambia color primario
  ↓
Sin guardar, el color cambia en tiempo real en su pantalla
  ↓
Previsualiza cómo se verá en el sitio
  ↓
Si le gusta, presiona [Guardar]
  ↓
Se aplica a todos los usuarios
```

---

### RF-151: Resetear a Valores por Defecto

**Botón en cada sección:**

```
[Restaurar valores por defecto]

Confirmación:
"¿Estás seguro? Se perderán todos los cambios personalizados
 y se volverá a la configuración original de DropCost Master."

[Cancelar] [Restaurar]
```

---

### RF-152: Restricción de Acceso

**Solo Super Admin puede:**
- Cambiar colores globales
- Editar código HEAD/FOOTER
- Modificar SEO
- Cambiar logos y favicon
- Resetear valores

**Admin puede:**
- Ver configuración
- (Sin permisos de edición)

---

## 3. Timeline Implementación

| Fase | Duración | Tareas |
|------|----------|--------|
| **Fase 1** | Día 1 | Tabla BD + API |
| **Fase 2** | Día 2 | UI Tabs (4 secciones) |
| **Fase 3** | Día 2-3 | Color picker + CSS variables |
| **Fase 4** | Día 3 | Upload imágenes (favicon, logos) |
| **Fase 5** | Día 4 | Validación HTML + preview |
| **Fase 6** | Día 4-5 | Historial + resetear |
| **Fase 7** | Día 5 | Testing + Go live |

**Total:** 5 días

---

## 4. Checklist Go-Live

- [ ] Tabla BD creada con todos campos
- [ ] API endpoints funcionando
- [ ] UI Configuración Global accesible
- [ ] Tab SEO & Metadatos completo
- [ ] Tab Branding con color picker
- [ ] Tab Tracking con editor HTML
- [ ] Tab Información empresa
- [ ] CSS variables se inyectan dinámicamente
- [ ] Cambios sin reload en tiempo real
- [ ] Upload imágenes funciona
- [ ] Validación HTML en scripts
- [ ] Historial de cambios registra
- [ ] Resetear a por defecto funciona
- [ ] Preview de colores en tiempo real
- [ ] Acceso solo SuperAdmin
- [ ] Testing responsivo
- [ ] Deploy staging ✅
- [ ] Deploy producción ✅

---

**Fin Especificación de Requerimientos - Configuración Global**

---

## 📊 RESUMEN

**RF-139 a RF-152 (14 requerimientos)**

✅ **SEO & Metadatos:**
- Título, descripción, keywords
- OG:Image
- Robots.txt automático
- Sitemap.xml

✅ **Branding:**
- Favicon (URL)
- Logo principal/footer (URL)
- Paleta de 8 colores (picker integrado)
- CSS variables (dinámico)

✅ **Tracking & Scripts:**
- Editor HTML HEAD
- Editor HTML FOOTER
- Validación código
- Previsualización

✅ **Información:**
- Datos empresa
- Redes sociales
- Políticas

✅ **Características:**
- Cambios en tiempo real (sin reload)
- Historial auditoría
- Resetear a por defecto
- Upload imágenes
- Solo SuperAdmin

✅ **Timeline:** 5 días
