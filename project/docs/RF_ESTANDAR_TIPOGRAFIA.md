# REQUISITO FUNCIONAL: ESTÁNDAR DE TIPOGRAFÍA
**DropCost Master**  
**Versión:** 1.0  
**Estado:** Especificación Final  
**Fecha:** 26 de febrero de 2026

---

## I. DESCRIPCIÓN GENERAL

Este documento estandariza todas las fuentes tipográficas utilizadas en DropCost Master. Todas las fuentes están disponibles en **Google Fonts** (sin costo, con licencia abierta).

El objetivo es:
- Consistencia visual en toda la aplicación
- Jerarquía clara de información
- Legibilidad óptima en todas las resoluciones (320px-1440px+)
- Profesionalismo y elegancia sin artificiosidad

---

## II. FUENTES SELECCIONADAS (Google Fonts)

### 2.1 Fuente Primaria: POPPINS
**Enlace Google Fonts:** https://fonts.google.com/specimen/Poppins  
**Categoría:** Sans-serif  
**Pesos disponibles:** 100, 200, 300, 400, 500, 600, 700, 800, 900  
**Uso:** Títulos, subtítulos, labels, números grandes

**Características:**
- Moderna, geométrica, amigable
- Excelente legibilidad en pantallas
- Soporta español, acentos, caracteres especiales
- Interletraje natural, no necesita ajustes

**Pesos a importar:**
```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
```

---

### 2.2 Fuente Secundaria: INTER
**Enlace Google Fonts:** https://fonts.google.com/specimen/Inter  
**Categoría:** Sans-serif  
**Pesos disponibles:** 100, 200, 300, 400, 500, 600, 700, 800, 900  
**Uso:** Texto corporal, descripciones, instrucciones

**Características:**
- Diseñada específicamente para pantallas
- Altamente legible en tamaños pequeños
- Neutral, profesional, minimalista
- Excelente para readability de largo texto

**Pesos a importar:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
```

---

### 2.3 Fuente Destacados: LORA
**Enlace Google Fonts:** https://fonts.google.com/specimen/Lora  
**Categoría:** Serif  
**Pesos disponibles:** 400, 500, 600, 700  
**Uso:** Citas, testimonios, destacados, callouts

**Características:**
- Elegancia clásica, sofisticada
- Serif calide, no severa
- Perfecta para quotes y mensajes destacados
- Soporta italic para énfasis

**Pesos a importar:**
```css
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
```

---

### 2.4 Fuente Monoespaciada: JETBRAINS MONO
**Enlace Google Fonts:** https://fonts.google.com/specimen/JetBrains+Mono  
**Categoría:** Monospace  
**Pesos disponibles:** 100, 200, 300, 400, 500, 600, 700, 800  
**Uso:** Código, tokens, IDs, valores técnicos

**Características:**
- Diseñada para desarrolladores
- Excelente para lectura de código
- Claridad en caracteres similares (1, l, I, O, 0)
- Ideal para valores numéricos precisos

**Pesos a importar:**
```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap');
```

---

### 2.5 Fuente Alternativa (Opcional): DM SANS
**Enlace Google Fonts:** https://fonts.google.com/specimen/DM+Sans  
**Categoría:** Sans-serif  
**Pesos disponibles:** 400, 500, 600, 700  
**Uso:** Títulos secundarios, alternancia con Poppins

**Características:**
- Moderna, contemporánea
- Similar a Poppins pero con personalidad diferente
- Excelente para variación visual sin romper consistencia
- Opcional para especiales

**Pesos a importar (si se usa):**
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
```

---

## III. ESCALA TIPOGRÁFICA ESTÁNDAR

**Base:** 16px (1rem en navegadores modernos)

### Tamaños por categoría:

| Categoría | Tamaño | Línea | Letra | Peso | Fuente |
|-----------|--------|-------|-------|------|--------|
| **H1 - Título Principal** | 36px-42px | 1.2 | 0px | 700 Bold | Poppins |
| **H2 - Título Secundario** | 28px-32px | 1.3 | 0px | 600 SemiBold | Poppins |
| **H3 - Subtítulo** | 20px-24px | 1.4 | 0px | 500 Medium | Poppins |
| **Body - Texto Normal** | 14px-16px | 1.6 | 0px | 400 Regular | Inter |
| **Small - Etiquetas** | 12px-13px | 1.4 | 0px | 500 Medium | Poppins |
| **Caption - Muy pequeño** | 11px-12px | 1.4 | 0px | 400 Regular | Inter |
| **Cita / Destacado** | 16px-18px | 1.7 | 0px | 400 Regular Italic | Lora |
| **Código / Tokens** | 12px-13px | 1.5 | 0px | 500 Medium | JetBrains Mono |
| **Números / KPI Grandes** | 32px-48px | 1.1 | -1px | 700 Bold | Poppins |
| **Números / KPI Pequeños** | 20px-28px | 1.1 | 0px | 700 Bold | Poppins |

---

## IV. USO POR COMPONENTE

### 4.1 HEADERS / PÁGINAS

**H1 - Página Principal:**
```
Fuente: Poppins
Peso: 700 Bold
Tamaño: 36px (desktop) | 28px (mobile)
Línea: 1.2
Interletrado: 0px
Ejemplo: "Dashboard Operacional"
Código CSS:
h1 {
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 36px;
  line-height: 1.2;
  letter-spacing: 0px;
  color: var(--text-primary);
}
```

**H2 - Sección Principal:**
```
Fuente: Poppins
Peso: 600 SemiBold
Tamaño: 28px (desktop) | 24px (mobile)
Línea: 1.3
Interletrado: 0px
Ejemplo: "Rendimiento Histórico"
Código CSS:
h2 {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 28px;
  line-height: 1.3;
  letter-spacing: 0px;
  color: var(--text-primary);
}
```

**H3 - Subtítulo / Card Header:**
```
Fuente: Poppins
Peso: 500 Medium
Tamaño: 20px (desktop) | 18px (mobile)
Línea: 1.4
Interletrado: 0px
Ejemplo: "CPA Real (PROM)"
Código CSS:
h3 {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 20px;
  line-height: 1.4;
  letter-spacing: 0px;
  color: var(--text-primary);
}
```

---

### 4.2 TEXTO CORPORAL

**Párrafo / Body Text:**
```
Fuente: Inter
Peso: 400 Regular
Tamaño: 14px (default) | 15px (desktop)
Línea: 1.6
Interletrado: 0px
Ejemplo: "Optimiza tu e-commerce y maximiza tus ganancias..."
Código CSS:
p, .body {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.6;
  letter-spacing: 0px;
  color: var(--text-primary);
}
```

**Body Large (Instrucciones claras):**
```
Fuente: Inter
Peso: 400 Regular
Tamaño: 15px-16px
Línea: 1.7
Interletrado: 0px
Ejemplo: Instrucciones de setup en Launchpad
Código CSS:
.body-large {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 15px;
  line-height: 1.7;
  letter-spacing: 0px;
  color: var(--text-primary);
}
```

---

### 4.3 LABELS / PEQUEÑO TEXTO

**Label - Campo:**
```
Fuente: Poppins
Peso: 500 Medium
Tamaño: 12px
Línea: 1.4
Interletrado: 0px
Caso: Sentence case (primera mayúscula)
Ejemplo: "Client ID"
Código CSS:
label, .label {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 1.4;
  letter-spacing: 0px;
  color: var(--text-secondary);
}
```

**Badge / Status:**
```
Fuente: Poppins
Peso: 500 Medium
Tamaño: 12px
Línea: 1.4
Interletrado: 0.5px
Caso: UPPERCASE
Ejemplo: "PAGADO" | "PENDIENTE" | "CRÍTICO"
Código CSS:
.badge, .status {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 1.4;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--status-color);
}
```

**Caption (Muy pequeño):**
```
Fuente: Inter
Peso: 400 Regular
Tamaño: 11px-12px
Línea: 1.4
Interletrado: 0px
Ejemplo: "Última actualización hace 2 horas"
Código CSS:
.caption {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 11px;
  line-height: 1.4;
  letter-spacing: 0px;
  color: var(--text-secondary);
}
```

---

### 4.4 CITAS / DESTACADOS

**Quote / Testimonio:**
```
Fuente: Lora
Peso: 400 Regular
Tamaño: 16px-18px
Línea: 1.7
Interletrado: 0px
Estilo: Italic
Ejemplo: "Ha aumentado mis ventas en 300%"
Código CSS:
.quote, blockquote {
  font-family: 'Lora', serif;
  font-weight: 400;
  font-size: 17px;
  line-height: 1.7;
  letter-spacing: 0px;
  font-style: italic;
  color: var(--text-primary);
  border-left: 4px solid var(--primary);
  padding-left: 16px;
}
```

**Callout / Alert Text:**
```
Fuente: Lora (si es destacado) o Inter (si es técnico)
Peso: 500 Medium
Tamaño: 14px-15px
Línea: 1.6
Interletrado: 0px
Estilo: Normal (sin italic)
Ejemplo: "⚠️ Client ID y Secret NO se guardan"
Código CSS:
.callout {
  font-family: 'Lora', serif;
  font-weight: 500;
  font-size: 15px;
  line-height: 1.6;
  letter-spacing: 0px;
  color: var(--warning-color);
}
```

---

### 4.5 CÓDIGO / TÉCNICO

**Código Inline (dentro de párrafo):**
```
Fuente: JetBrains Mono
Peso: 500 Medium
Tamaño: 12px
Línea: 1.5
Interletrado: 0px
Ejemplo: POST /api/auth/meta/callback
Código CSS:
code {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  font-size: 12px;
  line-height: 1.5;
  letter-spacing: 0px;
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--code-color);
}
```

**Código Block (pre):**
```
Fuente: JetBrains Mono
Peso: 500 Medium
Tamaño: 13px
Línea: 1.6
Interletrado: 0px
Ejemplo: Bloques de código completos
Código CSS:
pre {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  font-size: 13px;
  line-height: 1.6;
  letter-spacing: 0px;
  background: var(--bg-secondary);
  padding: 12px 16px;
  border-radius: 8px;
  overflow-x: auto;
}
```

**Token / ID (copiar-pegar):**
```
Fuente: JetBrains Mono
Peso: 500 Medium
Tamaño: 12px
Línea: 1.4
Interletrado: 0px
Ejemplo: "CLIENT_ID_ABC123"
Código CSS:
.token, .id {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  font-size: 12px;
  line-height: 1.4;
  letter-spacing: 0px;
  background: var(--bg-secondary);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}
```

---

### 4.6 NÚMEROS / MÉTRICAS

**KPI Número Grande (Principal):**
```
Fuente: Poppins
Peso: 700 Bold
Tamaño: 32px-48px (desktop) | 24px-32px (mobile)
Línea: 1.1
Interletrado: -1px
Ejemplo: "$-991.825,4" | "108.174,6"
Código CSS:
.kpi-value, .metric-large {
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 40px;
  line-height: 1.1;
  letter-spacing: -1px;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums; /* Números alineados */
}
```

**KPI Número Pequeño (Secundario):**
```
Fuente: Poppins
Peso: 600 SemiBold
Tamaño: 20px-24px
Línea: 1.1
Interletrado: 0px
Ejemplo: "0%" | "1" orden
Código CSS:
.kpi-value-small, .metric-small {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 22px;
  line-height: 1.1;
  letter-spacing: 0px;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
```

---

### 4.7 BOTONES

**Button Text:**
```
Fuente: Poppins
Peso: 600 SemiBold
Tamaño: 14px
Línea: 1.4
Interletrado: 0px
Caso: Sentence case (acción clara)
Ejemplo: "Conectar Meta" | "Crear Tienda"
Código CSS:
button, .btn {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.4;
  letter-spacing: 0px;
  text-transform: capitalize;
  cursor: pointer;
}
```

**Button Secondary (menos énfasis):**
```
Fuente: Poppins
Peso: 500 Medium
Tamaño: 13px
Línea: 1.4
Interletrado: 0px
Ejemplo: "Cancelar" | "Omitir"
Código CSS:
.btn-secondary {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 13px;
  line-height: 1.4;
  letter-spacing: 0px;
}
```

---

### 4.8 TABLA / DATA

**Table Header:**
```
Fuente: Poppins
Peso: 600 SemiBold
Tamaño: 13px
Línea: 1.4
Interletrado: 0.5px
Caso: Title Case
Ejemplo: "Nombre | Correo | Compras"
Código CSS:
th, .table-header {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 13px;
  line-height: 1.4;
  letter-spacing: 0.5px;
  text-transform: capitalize;
  color: var(--text-secondary);
}
```

**Table Body:**
```
Fuente: Inter
Peso: 400 Regular
Tamaño: 14px
Línea: 1.6
Interletrado: 0px
Ejemplo: Datos en filas
Código CSS:
td, .table-cell {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.6;
  letter-spacing: 0px;
  color: var(--text-primary);
}
```

---

## V. IMPORT CSS GLOBAL

**Agregar en archivo principal (styles.css o global.css):**

```css
/* Google Fonts Import */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@500;700&display=swap');

/* CSS Custom Properties (Variables) */
:root {
  /* Fuentes */
  --font-primary: 'Poppins', sans-serif;
  --font-secondary: 'Inter', sans-serif;
  --font-accent: 'Lora', serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Tamaños (rem basado en 16px = 1rem) */
  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.25rem; /* 20px */
  --text-xl: 1.75rem; /* 28px */
  --text-2xl: 2.25rem; /* 36px */
  --text-3xl: 3rem; /* 48px */
  
  /* Pesos */
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Línea */
  --leading-tight: 1.2;
  --leading-normal: 1.4;
  --leading-relaxed: 1.6;
  --leading-loose: 1.7;
}

/* Reset global */
html {
  font-family: var(--font-secondary);
  font-size: 16px;
  font-weight: var(--font-regular);
  line-height: var(--leading-relaxed);
  color: var(--text-primary);
}

body {
  font-family: var(--font-secondary);
  font-size: 14px;
  line-height: 1.6;
}

/* Headings */
h1 {
  font-family: var(--font-primary);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}

h2 {
  font-family: var(--font-primary);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-normal);
}

h3 {
  font-family: var(--font-primary);
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
}

/* Código */
code, pre {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}
```

---

## VI. RESPONSIVE - AJUSTES POR RESOLUCIÓN

### Desktop (1024px+)
```
H1: 36px-42px
H2: 28px-32px
H3: 20px-24px
Body: 14px-15px
KPI: 32px-48px
```

### Tablet (768px-1023px)
```
H1: 32px-36px
H2: 24px-28px
H3: 18px-22px
Body: 14px
KPI: 28px-40px
```

### Mobile (320px-767px)
```
H1: 24px-28px
H2: 20px-24px
H3: 16px-20px
Body: 13px-14px
KPI: 20px-28px
```

**Código CSS Media Queries:**

```css
/* Mobile first */
body {
  font-size: 13px;
}

h1 { font-size: 24px; }
h2 { font-size: 20px; }
h3 { font-size: 16px; }

/* Tablet */
@media (min-width: 768px) {
  body { font-size: 14px; }
  h1 { font-size: 32px; }
  h2 { font-size: 24px; }
  h3 { font-size: 18px; }
}

/* Desktop */
@media (min-width: 1024px) {
  body { font-size: 15px; }
  h1 { font-size: 36px; }
  h2 { font-size: 28px; }
  h3 { font-size: 20px; }
}
```

---

## VII. CASOS DE USO ESPECÍFICOS DROPCOST

### Launchpad (Onboarding)
```
Título: Poppins 700 Bold, 32px
Instrucción: Inter 400 Regular, 14px
Label Input: Poppins 500 Medium, 12px
Disclaimer: Lora 500 Medium, 14px
```

### Dashboard
```
Título página: Poppins 700 Bold, 36px
Título sección: Poppins 600 SemiBold, 28px
KPI valor: Poppins 700 Bold, 40px
KPI label: Poppins 500 Medium, 12px
```

### Tablas
```
Header: Poppins 600 SemiBold, 13px
Cell text: Inter 400 Regular, 14px
Cell number: JetBrains Mono 500 Medium, 13px
```

### Formularios
```
Label: Poppins 500 Medium, 12px
Input text: Inter 400 Regular, 14px
Helper text: Inter 400 Regular, 11px
Error: Inter 500 Medium, 12px (color rojo)
```

---

## VIII. NO REGRESIÓN - REGLAS CRÍTICAS

**OBLIGATORIO para todos los agentes:**

1. **NUNCA cambiar fuente primaria sin validación**
   - Poppins e Inter son estándar
   - Solo usar alternativas si PM lo aprueba

2. **Respetar escala tipográfica**
   - No crear tamaños intermedios (ej: 17px, 19px, 27px)
   - Si necesitas tamaño nuevo → Preguntar

3. **Mantener consistencia de pesos**
   - H1: 700 Bold
   - H2: 600 SemiBold
   - Body: 400 Regular
   - No invertir (ej: H3 en 700)

4. **Línea y espaciado**
   - Valores están probados para legibilidad
   - Si necesitas ajustar → Documentar por qué

5. **Variables CSS**
   - SIEMPRE usar `var(--font-primary)` en lugar de hardcodear 'Poppins'
   - Facilita cambios globales futuros

---

## IX. TESTING / VALIDACIÓN

**Antes de implementar:**

- [ ] Todas las fuentes cargan desde Google Fonts
- [ ] No hay fuentes fallback que arruinen el diseño
- [ ] Textos legibles en 320px (mobile S)
- [ ] Textos legibles en 1440px (desktop L)
- [ ] Contrastes correctos (WCAG AA mínimo)
- [ ] Acentos español se renderizan bien (ñ, á, é, í, ó, ú)
- [ ] Números en KPIs alineados (tabular-nums)
- [ ] Monospace legible para códigos
- [ ] Dark mode testado (colores de texto varían)

---

## X. IMPLEMENTACIÓN

**Responsable:** Frontend Engineer + Designer  
**Ubicación archivo:** `/src/styles/typography.css` (o similar)  
**Validación:** Product Manager (no regresión)

---

## XI. FUENTES DISPONIBLES (Google Fonts - Verificadas)

✅ **Poppins** - https://fonts.google.com/specimen/Poppins  
✅ **Inter** - https://fonts.google.com/specimen/Inter  
✅ **Lora** - https://fonts.google.com/specimen/Lora  
✅ **JetBrains Mono** - https://fonts.google.com/specimen/JetBrains+Mono  
✅ **DM Sans** (alternativa opcional) - https://fonts.google.com/specimen/DM+Sans

**Todas disponibles sin costo, licencia abierta.**

---

**DOCUMENTO LISTO PARA IMPLEMENTACIÓN** ✅

