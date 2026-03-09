# REQUISITO FUNCIONAL: CÁLCULO CPA Y ANÁLISIS DE VIABILIDAD
**DropCost Master**  
**Estado:** Especificación Activa  
**Fecha:** 26 de febrero de 2026  
**Criticidad:** ALTA - Decisión del usuario

---

## I. DESCRIPCIÓN GENERAL

Agregar cálculo automático de CPA (Costo Por Adquisición) y recomendación de viabilidad en el Simulador de Costeos. Permite usuario saber INMEDIATAMENTE si un producto es viable, break-even o no viable.

**Objetivo:** Tomar decisiones rápidas y no gastar en productos perdedores

---

## II. CÁLCULOS REQUERIDOS

### 2.1 CPA (Costo Por Adquisición)

```
FÓRMULA:

CPA = Gasto Meta / Número de Ventas

Ejemplo:
├─ Gasto Meta: $1.000
├─ Número de ventas: 10
└─ CPA = $1.000 / 10 = $100 por venta
```

### 2.2 Margen Neto

```
FÓRMULA (Ya tienes esto):

Margen Neto = Precio - Costo Producto - Costo Envío - Costo Devolucion

Ejemplo:
├─ Precio: $200
├─ Costo producto: $50
├─ Costo envío: $20
├─ Costo devolución (50% transportista): $10
└─ Margen Neto = $200 - $50 - $20 - $10 = $120 por venta
```

### 2.3 Viabilidad

```
COMPARAR: CPA vs Margen Neto

VIABLE:
├─ Si: CPA < Margen Neto
├─ Ejemplo: CPA $100 < Margen $120
└─ Ganancia por venta: $20 ✅

BREAK-EVEN:
├─ Si: CPA = Margen Neto
├─ Ejemplo: CPA $120 = Margen $120
└─ Ganancia por venta: $0 (ni ganas ni pierdes)

NO VIABLE:
├─ Si: CPA > Margen Neto
├─ Ejemplo: CPA $150 > Margen $100
└─ Pérdida por venta: -$50 ❌
```

### 2.4 Ganancia/Pérdida Por Venta

```
FÓRMULA:

Ganancia Por Venta = Margen Neto - CPA

Ejemplos:

VIABLE:
├─ Margen: $120
├─ CPA: $100
└─ Ganancia: $120 - $100 = $20 ✅

BREAK-EVEN:
├─ Margen: $120
├─ CPA: $120
└─ Ganancia: $120 - $120 = $0 ⚠️

NO VIABLE:
├─ Margen: $100
├─ CPA: $150
└─ Ganancia: $100 - $150 = -$50 ❌
```

---

## III. UI - NUEVO BLOQUE EN SIMULADOR

### 3.1 Posición

```
SIMULADOR ACTUAL:

┌─────────────────────────────────┐
│ CÁLCULO DE COSTEO               │
│ ┌─────────────────────────────┐ │
│ │ Precio venta: $200          │ │
│ │ Costo producto: $50         │ │
│ │ Costo envío: $20            │ │
│ │ Costo devolución: $10       │ │
│ └─────────────────────────────┘ │
│                                 │
│ Margen neto: $120               │
│ ROAS: 2.5x                      │
│                                 │
│ ⭐ NUEVO BLOQUE AQUÍ ⭐          │
│                                 │
└─────────────────────────────────┘
```

### 3.2 Nuevo Bloque: Análisis CPA

```
┌──────────────────────────────────────────┐
│ 📊 ANÁLISIS DE VIABILIDAD                │
├──────────────────────────────────────────┤
│                                          │
│ Costo Por Adquisición (CPA):             │
│ ────────────────────────────────         │
│ Gasto Meta: $1.000                       │
│ ÷ Número de ventas: 10                   │
│ = CPA: $100 por venta                    │
│                                          │
│ ─────────────────────────────────────    │
│                                          │
│ Ganancia por venta:                      │
│ ────────────────────────────────         │
│ Margen neto: $120                        │
│ - CPA: $100                              │
│ = Ganancia: $20 por venta ✅             │
│                                          │
│ ─────────────────────────────────────    │
│                                          │
│ 🟢 RECOMENDACIÓN: VIABLE                 │
│                                          │
│ Este producto es viable. Ganas $20 por   │
│ cada venta después de pagar publicidad.  │
│                                          │
│ Rentabilidad: 20% (ganancia/cpa)         │
│                                          │
└──────────────────────────────────────────┘
```

### 3.3 Diferentes Escenarios

**Escenario 1: VIABLE (Verde ✅)**

```
┌──────────────────────────────────────────┐
│ 📊 ANÁLISIS DE VIABILIDAD                │
│                                          │
│ CPA: $100                                │
│ Margen neto: $120                        │
│ Ganancia: $20 ✅                         │
│                                          │
│ 🟢 VIABLE                                │
│ Rentabilidad: 20%                        │
│                                          │
│ Recomendación:                           │
│ "Adelante, este producto genera          │
│  ganancias. Escala publicidad."          │
│                                          │
└──────────────────────────────────────────┘
```

**Escenario 2: BREAK-EVEN (Amarillo ⚠️)**

```
┌──────────────────────────────────────────┐
│ 📊 ANÁLISIS DE VIABILIDAD                │
│                                          │
│ CPA: $120                                │
│ Margen neto: $120                        │
│ Ganancia: $0 ⚠️                          │
│                                          │
│ 🟡 BREAK-EVEN                            │
│ Rentabilidad: 0%                         │
│                                          │
│ Recomendación:                           │
│ "Cuidado: no ganas ni pierdes.           │
│  Reduce gastos de publicidad o           │
│  negocia precio producto."               │
│                                          │
└──────────────────────────────────────────┘
```

**Escenario 3: NO VIABLE (Rojo ❌)**

```
┌──────────────────────────────────────────┐
│ 📊 ANÁLISIS DE VIABILIDAD                │
│                                          │
│ CPA: $150                                │
│ Margen neto: $100                        │
│ Pérdida: -$50 ❌                         │
│                                          │
│ 🔴 NO VIABLE                             │
│ Rentabilidad: -50%                       │
│                                          │
│ Recomendación:                           │
│ "Alerta: pierdes $50 por cada venta.     │
│  No recomendamos escalar este producto.  │
│  Considera pausar la campaña."           │
│                                          │
└──────────────────────────────────────────┘
```

---

## IV. LÓGICA BACKEND

### 4.1 Función: calculateCPA

```typescript
// /src/lib/costeo-calculations.ts

export function calculateCPA(
  gastoMeta: number,
  numeroVentas: number
): number {
  if (numeroVentas === 0) return 0;
  return gastoMeta / numeroVentas;
}
```

### 4.2 Función: calculateViability

```typescript
export function calculateViability(cpa: number, margenNeto: number) {
  const ganancia = margenNeto - cpa;
  const rentabilidad = cpa > 0 ? (ganancia / cpa) * 100 : 0;

  return {
    cpa,
    margenNeto,
    ganancia,
    rentabilidad,
    status: ganancia > 0 ? 'viable' : ganancia === 0 ? 'breakeven' : 'no_viable',
    color: ganancia > 0 ? 'green' : ganancia === 0 ? 'yellow' : 'red'
  };
}
```

### 4.3 Función: getRecommendation

```typescript
export function getRecommendation(viability: {
  status: 'viable' | 'breakeven' | 'no_viable';
  ganancia: number;
  rentabilidad: number;
}) {
  switch (viability.status) {
    case 'viable':
      return {
        title: '🟢 VIABLE',
        message: `Este producto es viable. Ganas $${viability.ganancia.toFixed(2)} por cada venta.`,
        subMessage: `Rentabilidad: ${viability.rentabilidad.toFixed(1)}% - Recomendamos escalar publicidad.`,
        color: 'green'
      };

    case 'breakeven':
      return {
        title: '🟡 BREAK-EVEN',
        message: `No ganas ni pierdes ($${viability.ganancia.toFixed(2)} por venta).`,
        subMessage: 'Considera reducir gastos de publicidad o negociar precio del producto.',
        color: 'yellow'
      };

    case 'no_viable':
      return {
        title: '🔴 NO VIABLE',
        message: `Este producto NO es viable. Pierdes $${Math.abs(viability.ganancia).toFixed(2)} por cada venta.`,
        subMessage: 'No recomendamos escalar. Considera pausar esta campaña.',
        color: 'red'
      };
  }
}
```

---

## V. INTEGRACIÓN EN SIMULADOR

### 5.1 Componente: ViabilityAnalysis

**Archivo: `/src/components/Simulador/ViabilityAnalysis.tsx`**

```typescript
'use client';

import { calculateCPA, calculateViability, getRecommendation } from '@/lib/costeo-calculations';

export function ViabilityAnalysis({
  gastoMeta,
  numeroVentas,
  margenNeto
}: {
  gastoMeta: number;
  numeroVentas: number;
  margenNeto: number;
}) {
  const cpa = calculateCPA(gastoMeta, numeroVentas);
  const viability = calculateViability(cpa, margenNeto);
  const recommendation = getRecommendation(viability);

  return (
    <div className={`border-l-4 border-${viability.color}-500 p-4 rounded`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold">📊 Análisis de Viabilidad</h3>
      </div>

      <div className="space-y-3 mb-4">
        {/* CPA Calculation */}
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-600">Costo Por Adquisición (CPA)</p>
          <p className="text-xl font-bold">${cpa.toFixed(2)}</p>
          <p className="text-xs text-gray-500">
            ${gastoMeta.toFixed(2)} ÷ {numeroVentas} ventas
          </p>
        </div>

        {/* Ganancia */}
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-600">Ganancia por Venta</p>
          <p className={`text-xl font-bold ${viability.color === 'green' ? 'text-green-600' : viability.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}>
            ${viability.ganancia.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">
            ${margenNeto.toFixed(2)} margen - ${cpa.toFixed(2)} cpa
          </p>
        </div>

        {/* Rentabilidad */}
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-600">Rentabilidad</p>
          <p className={`text-xl font-bold ${viability.color === 'green' ? 'text-green-600' : viability.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}>
            {viability.rentabilidad.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Recommendation */}
      <div className={`bg-${viability.color}-50 border border-${viability.color}-200 p-4 rounded`}>
        <h4 className={`font-bold text-${viability.color}-700 mb-2`}>
          {recommendation.title}
        </h4>
        <p className={`text-sm text-${viability.color}-600 mb-2`}>
          {recommendation.message}
        </p>
        <p className={`text-xs text-${viability.color}-600`}>
          💡 {recommendation.subMessage}
        </p>
      </div>
    </div>
  );
}
```

### 5.2 Usar en Simulador

```typescript
// /src/app/simulador/page.tsx

import { ViabilityAnalysis } from '@/components/Simulador/ViabilityAnalysis';

export default function SimuladorPage() {
  const [gastoMeta, setGastoMeta] = useState(1000);
  const [numeroVentas, setNumeroVentas] = useState(10);
  const [margenNeto, setMargenNeto] = useState(120);

  return (
    <div>
      {/* Inputs */}
      {/* ... existing inputs ... */}

      {/* Nuevo: Viability Analysis */}
      <ViabilityAnalysis
        gastoMeta={gastoMeta}
        numeroVentas={numeroVentas}
        margenNeto={margenNeto}
      />

      {/* Resto del simulador */}
    </div>
  );
}
```

---

## VI. CASOS DE USO

### 6.1 Usuario Testea Producto A

```
Input:
├─ Precio: $200
├─ Costo producto: $50
├─ Envío: $20
├─ Devolución (50%): $10
├─ Gasto Meta: $500
└─ Ventas: 8

Cálculo:
├─ Margen: $120
├─ CPA: $500/8 = $62.50
├─ Ganancia: $120 - $62.50 = $57.50
├─ Rentabilidad: 91.8%
└─ Status: ✅ VIABLE

Recomendación: "Adelante, muy viable. Escala publicidad."
```

### 6.2 Usuario Testea Producto B

```
Input:
├─ Precio: $100
├─ Costo producto: $40
├─ Envío: $25
├─ Devolución (50%): $12.50
├─ Gasto Meta: $1.000
└─ Ventas: 8

Cálculo:
├─ Margen: $22.50
├─ CPA: $1.000/8 = $125
├─ Ganancia: $22.50 - $125 = -$102.50
├─ Rentabilidad: -82%
└─ Status: ❌ NO VIABLE

Recomendación: "Pierdes $102.50 por venta. NO recomendamos continuar."
```

---

## VII. CHECKLIST IMPLEMENTACIÓN

- [ ] Función calculateCPA() creada
- [ ] Función calculateViability() creada
- [ ] Función getRecommendation() creada
- [ ] Componente ViabilityAnalysis.tsx creado
- [ ] Integrado en Simulador (/simulador)
- [ ] Colores: Verde (viable), Amarillo (breakeven), Rojo (no viable)
- [ ] Test: Producto viable → mensaje correcto
- [ ] Test: Producto no viable → mensaje correcto
- [ ] Test: CPA = 0 cuando ventas = 0 (sin dividir por 0)
- [ ] Responsivo mobile
- [ ] Dark mode (si aplica)

---

## VIII. VENTAJA COMPETITIVA

```
LOVABLE (Competidor):
├─ Solo ROAS
├─ Sin CPA
├─ Sin recomendaciones
└─ Usuario calcula manual

DROPCOST (Tú):
├─ ROAS ✅
├─ CPA automático ✅
├─ Recomendación inteligente ✅
├─ Ganancia/Pérdida clara ✅
├─ Viabilidad inmediata ✅
├─ Devoluciones (50% transportista) ✅
└─ Decisiones rápidas ✅

DIFERENCIAL CLARO EN MARKETING.
```

---

**DOCUMENTO LISTO PARA ANTIGRAVITY** ✅

**IMPLEMENTACIÓN RÁPIDA: ~2-3 horas**

