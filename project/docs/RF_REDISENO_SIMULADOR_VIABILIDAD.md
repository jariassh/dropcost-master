# REQUISITO FUNCIONAL: REDISEÑO SIMULADOR DE VIABILIDAD
**DropCost Master**  
**Estado:** Especificación Activa  
**Fecha:** 27 de febrero de 2026  
**Criticidad:** ALTA - UX/Conversión

---

## I. DESCRIPCIÓN GENERAL

Rediseño completo del Simulador de Viabilidad para mejorar claridad, reducir overwhelm y aumentar conversión. Reorganización de componentes con cards grid, acciones arriba (visible), outputs prominentes y chat integrado.

**Objetivo:** Usuario completa costeo en <3 minutos, ve decisión clara (viable/no viable) en 1 segundo, actúa inmediatamente.

---

## II. PRINCIPIOS DE DISEÑO

```
1. JERARQUÍA VISUAL:
   └─ Acciones (Top) > Inputs (Cards) > Outputs (Focal) > Chat (Flotante)

2. PROGRESSIVE DISCLOSURE:
   └─ Inputs: 3 cards (no overwhelm)
   └─ Outputs: Visual focal (decisión clara)
   └─ Chat: Siempre accesible (no modal)

3. RESPONSIVE:
   └─ Desktop: 3 cards lado a lado
   └─ Tablet: 2 cards + 1
   └─ Mobile: 1 card stacked

4. ACCESIBILIDAD:
   └─ Botones NUNCA ocultos (siempre visibles)
   └─ Labels claros en cada input
   └─ Contraste suficiente (dark mode)
```

---

## III. LAYOUT GLOBAL

### 3.1 Estructura de Página

```
┌───────────────────────────────────────────────────────────────┐
│ HEADER (Sticky)                                               │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ [Logo] Simulador de Viabilidad | [Exportar] [Nuevo Escenario]│
│                                                               │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ SECCIÓN 1: BOTONES DE ACCIÓN (Top - Visible siempre)        │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ [🤖 Consultar DROP ANALYST] [✨ Crear Oferta] [💾 Guardar]│
│ │                                                         │  │
│ │ * Botones primarios (prominent) - Usuario ve primero  │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                               │
│ SECCIÓN 2: INPUT CARDS (Grid 3 columnas)                     │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐    │
│ │ 📦 PRODUCTO    │ │ 🚚 LOGÍSTICA   │ │ 📢 PUBLICIDAD  │    │
│ │                │ │                │ │                │    │
│ │ [inputs]       │ │ [inputs]       │ │ [inputs]       │    │
│ │                │ │                │ │                │    │
│ └────────────────┘ └────────────────┘ └────────────────┘    │
│                                                               │
│ SECCIÓN 3: OUTPUT VISUAL (Focal - Grande)                    │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ 🚦 VIABILITY TRAFFIC LIGHT (Prominent)                 │  │
│ │    [VERDE/AMARILLO/ROJO] + "VIABLE" / "NO VIABLE"     │  │
│ │                                                         │  │
│ │ ┌─────────────────┬─────────────────────────────────┐  │  │
│ │ │ Precio          │ Embudo de Rentabilidad          │  │  │
│ │ │ Sugerido:       │ ┌─────────────────────────────┐ │  │  │
│ │ │ $49.99          │ │ Ingreso: $49.99              │ │  │  │
│ │ │ PSICOLÓGICO     │ │ - Producto: -$12.50          │ │  │  │
│ │ │ ÓPTIMO          │ │ - Logística: -$7.50          │ │  │  │
│ │ │                 │ │ - Publicidad CPA: -$15.57    │ │  │  │
│ │ │                 │ │ ───────────────────────────── │ │  │  │
│ │ │                 │ │ PROFIT FINAL: $14.42 ✅      │ │  │  │
│ │ │                 │ └─────────────────────────────┘ │  │  │
│ │ └─────────────────┴─────────────────────────────────┘  │  │
│ │                                                         │  │
│ │ KPIs Rápidos:                                           │  │
│ │ ├─ Utilidad Neta: $14.42 (+12%)                        │  │
│ │ ├─ CPA Límite: $18.50                                  │  │
│ │ └─ ROAS Proyectado: 2.77x                              │  │
│ │                                                         │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                               │
│ SECCIÓN 4: TABLAS DE SCALING (Secundaria)                   │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Matriz de Escalamiento Pauta                           │  │
│ │ [Conservador] [Moderado] [Agresivo] (3 scenarios)     │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Simulador de Operación Diaria                          │  │
│ │ [Slider] 42 pedidos/día → +$1,085.00/día              │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ SECCIÓN 5: INSIGHT FLOTANTE (Bottom-left)                   │
│ ┌────────────────────────────────────────┐               │  │
│ │ 💡 DROP ANALYST INSIGHT                │               │  │
│ │ "Tu margen de contribución es saldable.│               │  │
│ │  Recomendamos optimizar creativos para │               │  │
│ │  bajar CPA actual 15%."                │               │  │
│ │                                        │               │  │
│ │ [Consultar DROP ANALYST →]             │               │  │
│ └────────────────────────────────────────┘               │  │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────┐
│ DROP ANALYST CHAT (Flotante)  │ ← Side derecha (fijo)
│ (Ya existe - MANTENER)        │
│                               │
│ Mentor Financiero Activo      │
│ [Preguntas sugeridas]         │
│ [Input chat]                  │
│ 0 CR | Consume: 15 CR         │
└───────────────────────────────┘
```

---

## IV. COMPONENTES DETALLADOS

### 4.1 SECCIÓN 1: BOTONES DE ACCIÓN (Sticky Top)

**Ubicación:** Header sticky (siempre visible)  
**Prioridad:** Visible antes de hacer scroll

```
┌─────────────────────────────────────────────────────────────┐
│ [🤖 Consultar DROP ANALYST] [✨ Crear Oferta] [💾 Guardar] │
│                                                             │
│ ← Primary           Secondary           Tertiary →          │
└─────────────────────────────────────────────────────────────┘

ESPECIFICACIONES:

1. BOTÓN PRIMARIO: "Consultar DROP ANALYST"
   ├─ Color: Púrpura/Azul (matches brand)
   ├─ Size: Grande (40px height)
   ├─ Icon: 🤖 Gemini/IA
   ├─ Action: Abre chat/sidebar DROP ANALYST
   ├─ Context: Envía valores actuales al chat
   └─ Tooltip: "Pregunta a tu mentor IA sobre viabilidad"

2. BOTÓN SECUNDARIO: "Crear Oferta"
   ├─ Color: Verde/Acento
   ├─ Size: Mediano
   ├─ Icon: ✨
   ├─ Action: Navega a módulo crear ofertas (ya existe)
   ├─ Context: Envía datos costeo pre-rellenados
   └─ Tooltip: "Diseña la oferta basada en este costeo"

3. BOTÓN TERCIARIO: "Guardar Costeo"
   ├─ Color: Gris/Neutral
   ├─ Size: Mediano
   ├─ Icon: 💾
   ├─ Action: Abre modal "Guardar escenario"
   ├─ Context: user_id, tienda_id, nombre, valores
   └─ Tooltip: "Guarda este análisis para comparar después"

COMPORTAMIENTO:
├─ Desktop: Todos visibles (3 botones lado a lado)
├─ Tablet: Primario + [dropdown] "Más acciones"
└─ Mobile: Primario + [dropdown] "Más"
```

**Archivo:** `/src/components/Simulador/ActionButtonsHeader.tsx`

```typescript
'use client';

import { useState } from 'react';

export function ActionButtonsHeader({
  onConsultDropAnalyst,
  onCreateOffer,
  onSaveCosteo,
  costeoData,
  isValid
}: {
  onConsultDropAnalyst: (data: any) => void;
  onCreateOffer: (data: any) => void;
  onSaveCosteo: (data: any) => void;
  costeoData: any;
  isValid: boolean;
}) {
  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-6 py-4">
      <div className="flex gap-3 justify-start">
        {/* PRIMARY: Drop Analyst */}
        <button
          onClick={() => onConsultDropAnalyst(costeoData)}
          disabled={!isValid}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
          title="Pregunta a tu mentor IA"
        >
          🤖 Consultar DROP ANALYST
        </button>

        {/* SECONDARY: Crear Oferta */}
        <button
          onClick={() => onCreateOffer(costeoData)}
          disabled={!isValid}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
          title="Crear oferta con esta configuración"
        >
          ✨ Crear Oferta
        </button>

        {/* TERTIARY: Guardar */}
        <button
          onClick={() => onSaveCosteo(costeoData)}
          disabled={!isValid}
          className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
          title="Guardar este análisis"
        >
          💾 Guardar
        </button>
      </div>
    </div>
  );
}
```

---

### 4.2 SECCIÓN 2: INPUT CARDS (Grid 3 columnas)

**Ubicación:** Bajo botones, antes de outputs  
**Ancho:** Responsive (3 cols desktop, 1 col mobile)

```
CARD 1: 📦 PRODUCTO (Azul)
┌────────────────────────────┐
│ Configuración de Producto  │
├────────────────────────────┤
│                            │
│ COSTO UNITARIO (USD)       │
│ [Input: 12.50]             │
│ Precio costo proveedor     │
│                            │
│ MARGEN OBJETIVO (%)        │
│ [Input: 300]               │
│ Porcentaje de ganancia     │
│                            │
│ NIVEL DE AMBICIÓN          │
│ ○ Suave (20%)              │
│ ● Moderado (50%)           │
│ ○ Ambicioso (80%+)         │
│                            │
│ [Auto-calcula margen]      │
│                            │
└────────────────────────────┘

CARD 2: 🚚 LOGÍSTICA (Verde)
┌────────────────────────────┐
│ Costos de Envío            │
├────────────────────────────┤
│                            │
│ FLETE PROMEDIO (USD)       │
│ [Input: 7.50]              │
│ Costo transportadora       │
│                            │
│ % DE DEVOLUCIÓN            │
│ [Input: 10]                │
│ Porcentaje estimado        │
│ ℹ️ Transportista cobra 50%  │
│                            │
│ OTROS COSTOS (USD)         │
│ [Input: 0]                 │
│ Empaque, seguros, etc.     │
│                            │
│ [Auto-calcula total]       │
│                            │
└────────────────────────────┘

CARD 3: 📢 PUBLICIDAD (Púrpura)
┌────────────────────────────┐
│ Configuración Campañas     │
├────────────────────────────┤
│                            │
│ CPA ESPERADO (USD)         │
│ [Input: 15.57]             │
│ Costo por adquisición      │
│                            │
│ % CANCELACIONES            │
│ [Input: 15]                │
│ Pedidos que se cancelan    │
│                            │
│ PRESUPUESTO DIARIO (USD)   │
│ [Input: 10]                │
│ Para cálculo escalamiento  │
│                            │
│ [Auto-calcula proyección]  │
│                            │
└────────────────────────────┘
```

**Características de Cards:**

```typescript
// Card Genérica
interface SimuladorCard {
  title: string;           // "📦 Producto"
  icon: string;            // emoji o SVG
  borderColor: string;     // blue-500 | green-500 | purple-500
  fields: InputField[];    // array de inputs
}

interface InputField {
  label: string;           // "Costo Unitario"
  value: number;
  onChange: (value: number) => void;
  hint: string;            // "Precio proveedor"
  unit?: string;           // "USD" | "%"
  min?: number;
  max?: number;
  tooltip?: string;
}
```

**Archivo:** `/src/components/Simulador/InputCards.tsx`

```typescript
'use client';

import { useState } from 'react';

export function InputCards({
  onProductChange,
  onLogisticChange,
  onPublicidadChange,
  values
}: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      
      {/* CARD 1: Producto */}
      <Card
        title="Configuración de Producto"
        icon="📦"
        borderColor="border-blue-500"
        bgColor="bg-blue-950"
      >
        <InputField
          label="Costo Unitario (USD)"
          value={values.costProduct}
          onChange={(v) => onProductChange({...values, costProduct: v})}
          hint="Precio costo proveedor"
        />
        <InputField
          label="Margen Objetivo (%)"
          value={values.marginObjective}
          onChange={(v) => onProductChange({...values, marginObjective: v})}
          hint="Porcentaje de ganancia esperado"
          min={0}
          max={500}
        />
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-300">Nivel de Ambición</label>
          <div className="flex gap-3 mt-2">
            {[
              { label: 'Suave (20%)', value: 'suave' },
              { label: 'Moderado (50%)', value: 'moderado' },
              { label: 'Ambicioso (80%+)', value: 'ambicioso' }
            ].map(option => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ambition"
                  value={option.value}
                  onChange={(e) => onProductChange({...values, ambitionLevel: e.target.value})}
                  className="cursor-pointer"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* CARD 2: Logística */}
      <Card
        title="Costos de Envío"
        icon="🚚"
        borderColor="border-green-500"
        bgColor="bg-green-950"
      >
        <InputField
          label="Flete Promedio (USD)"
          value={values.fletePromedio}
          onChange={(v) => onLogisticChange({...values, fletePromedio: v})}
          hint="Costo transportadora"
        />
        <InputField
          label="% de Devolución"
          value={values.devolutionPercent}
          onChange={(v) => onLogisticChange({...values, devolutionPercent: v})}
          hint="Porcentaje estimado"
          info="ℹ️ Transportista cobra 50%"
        />
        <InputField
          label="Otros Costos (USD)"
          value={values.otherCosts}
          onChange={(v) => onLogisticChange({...values, otherCosts: v})}
          hint="Empaque, seguros, etc."
        />
      </Card>

      {/* CARD 3: Publicidad */}
      <Card
        title="Configuración Campañas"
        icon="📢"
        borderColor="border-purple-500"
        bgColor="bg-purple-950"
      >
        <InputField
          label="CPA Esperado (USD)"
          value={values.cpaEsperado}
          onChange={(v) => onPublicidadChange({...values, cpaEsperado: v})}
          hint="Costo por adquisición"
        />
        <InputField
          label="% Cancelaciones"
          value={values.cancelationPercent}
          onChange={(v) => onPublicidadChange({...values, cancelationPercent: v})}
          hint="Pedidos que se cancelan"
          min={0}
          max={100}
        />
        <InputField
          label="Presupuesto Diario (USD)"
          value={values.presupuestoDiario}
          onChange={(v) => onPublicidadChange({...values, presupuestoDiario: v})}
          hint="Para cálculo escalamiento"
        />
      </Card>

    </div>
  );
}

// InputField Component
function InputField({ label, value, onChange, hint, info, min, max }: any) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-200 mb-1">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
      />
      <p className="text-xs text-gray-400 mt-1">{hint}</p>
      {info && <p className="text-xs text-blue-300 mt-1">{info}</p>}
    </div>
  );
}

// Card Wrapper
function Card({ title, icon, borderColor, bgColor, children }: any) {
  return (
    <div className={`${bgColor} border-l-4 ${borderColor} rounded-lg p-6 backdrop-blur-sm`}>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}
```

---

### 4.3 SECCIÓN 3: OUTPUT VISUAL (Focal)

**Ubicación:** Bajo cards, antes de secundarios  
**Tamaño:** Grande (fullwidth)  
**Propósito:** Decisión clara en 1 segundo

```
┌──────────────────────────────────────────────────────────┐
│ 🚦 VIABILITY TRAFFIC LIGHT                               │
│                                                          │
│        ◉ VIABLE                                          │
│                                                          │
│    (Muy grande, color verde, con animación pulse)       │
│                                                          │
│  "Ganas $14.42 por venta después de publicidad"         │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────┐  ┌───────────────────────────┐ │
│  │ PRECIO SUGERIDO     │  │ EMBUDO DE RENTABILIDAD   │ │
│  │                     │  │                           │ │
│  │ $49.99              │  │ Ingreso:        $49.99   │ │
│  │                     │  │ - Producto:     -$12.50  │ │
│  │ PSICOLÓGICO ÓPTIMO  │  │ - Logística:    -$7.50   │ │
│  │                     │  │ - Publicidad:   -$15.57  │ │
│  │ [Explicación por qué]│  │ ──────────────────────   │ │
│  │                     │  │ PROFIT FINAL:   $14.42 ✅│ │
│  └─────────────────────┘  └───────────────────────────┘ │
│                                                          │
│  KPIs RÁPIDOS:                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ • Utilidad Neta: $14.42 (+12% sobre costo)     │   │
│  │ • CPA Límite: $18.50 (máximo viable)           │   │
│  │ • ROAS Proyectado: 2.77x (revenue/ad spend)    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Archivo:** `/src/components/Simulador/ViabilityOutput.tsx`

```typescript
'use client';

export function ViabilityOutput({ analysis }: {
  analysis: {
    viability: 'viable' | 'breakeven' | 'no_viable';
    profitPerSale: number;
    suggestedPrice: number;
    marginFunnel: { ingreso: number; costos: { producto: number; logistica: number; publicidad: number }; profit: number };
    utilidadNeta: number;
    cpaLimit: number;
    roasProjected: number;
  }
}) {
  const viabilityConfig = {
    viable: { color: 'bg-green-600', text: 'VIABLE', emoji: '✅' },
    breakeven: { color: 'bg-yellow-600', text: 'BREAK-EVEN', emoji: '⚠️' },
    no_viable: { color: 'bg-red-600', text: 'NO VIABLE', emoji: '❌' }
  };

  const config = viabilityConfig[analysis.viability];

  return (
    <div className="w-full mb-8">
      {/* Viability Light */}
      <div className={`${config.color} rounded-lg p-8 text-center mb-6 animate-pulse`}>
        <p className="text-6xl mb-4">{config.emoji}</p>
        <p className="text-4xl font-bold text-white mb-2">{config.text}</p>
        {analysis.viability === 'viable' && (
          <p className="text-lg text-green-100">Ganas ${analysis.profitPerSale.toFixed(2)} por venta</p>
        )}
        {analysis.viability === 'no_viable' && (
          <p className="text-lg text-red-100">Pierdes ${Math.abs(analysis.profitPerSale).toFixed(2)} por venta</p>
        )}
      </div>

      {/* Precio + Embudo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* Precio Sugerido */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h4 className="text-sm text-gray-400 mb-2">PRECIO SUGERIDO</h4>
          <p className="text-5xl font-bold text-white mb-2">${analysis.suggestedPrice.toFixed(2)}</p>
          <p className="text-sm text-gray-300 mb-4">Psicológicamente óptimo</p>
          <div className="bg-slate-700 p-3 rounded text-xs text-gray-200">
            <p>• Competitivo en mercado</p>
            <p>• Margen saludable ({((analysis.profitPerSale / analysis.suggestedPrice) * 100).toFixed(1)}%)</p>
            <p>• Punto de venta psicológico (.99)</p>
          </div>
        </div>

        {/* Embudo */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h4 className="text-sm text-gray-400 mb-4">EMBUDO DE RENTABILIDAD</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Ingreso:</span>
              <span className="text-white font-semibold">${analysis.marginFunnel.ingreso.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">- Producto:</span>
              <span className="text-red-400">${analysis.marginFunnel.costos.producto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">- Logística:</span>
              <span className="text-red-400">${analysis.marginFunnel.costos.logistica.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">- Publicidad:</span>
              <span className="text-red-400">${analysis.marginFunnel.costos.publicidad.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-600 pt-3 flex justify-between">
              <span className="text-gray-300 font-semibold">Profit Final:</span>
              <span className={analysis.profitPerSale > 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                ${analysis.marginFunnel.profit.toFixed(2)} {analysis.profitPerSale > 0 ? '✅' : '❌'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h4 className="text-sm text-gray-400 mb-4">MÉTRICAS CLAVE</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Utilidad Neta</p>
            <p className="text-2xl font-bold text-green-400">${analysis.utilidadNeta.toFixed(2)}</p>
            <p className="text-xs text-gray-400">+12% sobre costo</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">CPA Límite</p>
            <p className="text-2xl font-bold text-blue-400">${analysis.cpaLimit.toFixed(2)}</p>
            <p className="text-xs text-gray-400">Máximo viable</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ROAS Proyectado</p>
            <p className="text-2xl font-bold text-purple-400">{analysis.roasProjected.toFixed(2)}x</p>
            <p className="text-xs text-gray-400">Revenue/Ad spend</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 4.4 SECCIÓN 4: TABLAS SECUNDARIAS

```
MATRIZ DE ESCALAMIENTO PAUTA
┌─────────────────────────────────────────────┐
│ Selecciona estrategia:                      │
│ ○ Conservador  ● Moderado  ○ Agresivo      │
│                                             │
│ Presupuesto recomendado: $10/día            │
│ Pedidos/día esperados: 2-3                  │
│ Ingresos diarios: $100-150                  │
│ Profit diario: $28-42                       │
│                                             │
│ [Copiar configuración] [Ver detalles]      │
└─────────────────────────────────────────────┘

SIMULADOR DE OPERACIÓN DIARIA
┌─────────────────────────────────────────────┐
│ ¿Cuántos pedidos esperarías/día?            │
│                                             │
│ [═════════●═════════════] 42 pedidos/día   │
│                                             │
│ Proyección Diaria:                          │
│ • Ingresos: $2,099.58                       │
│ • Costs: -$1,014.54                         │
│ • Profit: +$1,085.04/día                    │
│                                             │
│ Proyección Mensual (30 días):               │
│ • Profit estimado: +$32,551.20              │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 4.5 SECCIÓN 5: INSIGHT FLOTANTE

```
┌─────────────────────────────────────┐
│ 💡 DROP ANALYST INSIGHT             │
├─────────────────────────────────────┤
│                                     │
│ "Tu margen de contribución es       │
│  saldable. El producto tiene        │
│  potencial pero necesita optimizar  │
│  creativas para bajar CPA actual    │
│  en 15%."                           │
│                                     │
│ [Consultar DROP ANALYST →]          │
│                                     │
└─────────────────────────────────────┘

Ubicación: Fixed, bottom-left
Trigger: Auto-genera basado en análisis
Context: Envía al chat cuando user hace click
```

---

## V. FLUJO DE USUARIO

```
Usuario llega a Simulador
  ↓
VE BOTONES ARRIBA (3 botones primarios)
  ├─ "Consultar DROP ANALYST"
  ├─ "Crear Oferta"
  └─ "Guardar Costeo"
  ↓
Scroll → VE 3 CARDS DE INPUTS
  ├─ Configura Producto
  ├─ Configura Logística
  ├─ Configura Publicidad
  ↓
Valores se calculan en TIEMPO REAL
  ↓
Scroll → VE SALIDA VISUAL (GRANDE)
  ├─ 🚦 Semáforo (verde/rojo)
  ├─ Precio sugerido
  ├─ Embudo margen
  └─ KPIs clave
  ↓
Usuario entiende en 1 segundo: "¿Viable?"
  ↓
Si viable: Click [Crear Oferta]
  └─ Va a módulo ofertas (pre-rellenado)
  
Si no viable: Click [Consultar DROP ANALYST]
  └─ Chat se abre con contexto
  └─ DROP ANALYST sugiere mejoras
  
Si quiere guardar: Click [Guardar Costeo]
  └─ Modal guarda escenario
  └─ Puede comparar después

CERO FRICCIÓN.
SIN SCROLLEAR INNECESARIO.
DECISIÓN CLARA EN 1 SEGUNDO.
```

---

## VI. RESPONSIVE BEHAVIOR

### Desktop (1920px+)
```
3 Cards lado a lado
Full output visual
Chat flotante (right side)
Todos botones visibles
```

### Tablet (768px-1024px)
```
2 Cards + 1 (wraps)
Output visual responsive
Chat puede ser drawer
Botones mayores
```

### Mobile (< 768px)
```
1 Card stacked (scrollable)
Output visual full-width
Chat bottom drawer (on click)
Botones stacked (vertical)
Acciones: Primary + dropdown "Más"
```

---

## VII. CHECKLIST IMPLEMENTACIÓN

- [ ] ActionButtonsHeader component (sticky top)
- [ ] InputCards component (3 grid cards)
- [ ] ViabilityOutput component (focal visual)
- [ ] Integración cálculos real-time
- [ ] Botón [Consultar DROP ANALYST] → abre chat con contexto
- [ ] Botón [Crear Oferta] → navega a módulo (pre-rellenado)
- [ ] Botón [Guardar Costeo] → modal de guardado
- [ ] Insight flotante (auto-genera)
- [ ] Responsive mobile/tablet/desktop
- [ ] Animation semáforo (pulse)
- [ ] Tooltip en botones
- [ ] Dark mode consistency

---

**DOCUMENTO LISTO PARA ANTIGRAVITY** ✅

