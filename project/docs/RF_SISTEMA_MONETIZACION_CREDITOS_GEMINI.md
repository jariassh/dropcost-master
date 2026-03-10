# REQUISITO FUNCIONAL: SISTEMA DE MONETIZACIÓN DE CRÉDITOS GEMINI
**DropCost Master**  
**Estado:** Especificación Activa  
**Fecha:** 26 de febrero de 2026  
**Criticidad:** CRÍTICA - Ingresos recurrentes

---

## I. DESCRIPCIÓN GENERAL

Sistema completo de monetización basado en créditos Gemini. Incluye:
- Calculadora transparente en landing (estilo Twilio)
- Sistema de wallet y recarga de créditos
- Dashboard admin: costos Gemini vs precio usuario
- Aprendizaje colectivo anónimo (con incentivos)
- Actualización política privacidad + términos
- **DROP ANALYST**: Tu analista IA financiero para dropshipping

---

## II. MAPEO: TOKENS GEMINI → CRÉDITOS USUARIO

### 2.1 Costos Gemini API

```
GEMINI PRICING (Actual):
├─ Input: $0.075 / 1M tokens
├─ Output: $0.3 / 1M tokens
└─ Batch: descuentos adicionales

EJEMPLOS COSTO REAL:
├─ Consulta rápida (500 input + 500 output): ~$0.0003
├─ Consulta moderada (2000 input + 1500 output): ~$0.0015
└─ Research (5000 input + 3000 output): ~$0.0045
```

### 2.2 Sistema de Créditos (Tiering)

```
TABLA MAPEO:

Tipo Consulta | Input | Output | Costo Real | Créditos | Precio Usuario
──────────────┼───────┼────────┼────────────┼──────────┼─────────────────
Rápida (🚀)   | 500   | 500    | $0.0003    | 1        | $0.10
Moderada (⚡) | 2000  | 1500   | $0.0015    | 3        | $0.30
Research (🔬) | 5000  | 3000   | $0.0045    | 10       | $2.00

MARKUP: 3-5x (margen 66-80%)
```

### 2.3 Tabla BD: credit_pricing_config

```sql
CREATE TABLE credit_pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  query_type VARCHAR(50), -- 'quick' | 'moderate' | 'research'
  
  -- Tokens esperados
  avg_input_tokens INT,
  avg_output_tokens INT,
  
  -- Costo Gemini (automático)
  cost_gemini_usd DECIMAL(10,4), -- Se calcula: (input/1M * 0.075) + (output/1M * 0.3)
  
  -- Créditos
  credits_cost INT, -- Cuántos créditos cuesta
  
  -- Precio usuario
  price_usd DECIMAL(10,2), -- Lo que cobra el usuario
  markup_percentage INT, -- (price_usd / cost_gemini_usd) - 1
  
  active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserts iniciales:
INSERT INTO credit_pricing_config VALUES
('quick', 500, 500, 0.0003, 1, 0.10, 333),
('moderate', 2000, 1500, 0.0015, 3, 0.30, 200),
('research', 5000, 3000, 0.0045, 10, 2.00, 444);
```

---

## III. LANDING PAGE - CALCULADORA DE CRÉDITOS

### 3.1 Ubicación

```
Landing dropcost.jariash.com

Estructura:
├─ Hero
├─ Features
├─ Pricing Plans
├─ ⭐ NUEVA SECCIÓN: Credit Calculator ⭐
├─ Testimonios
└─ CTA Final
```

### 3.2 UI: Credit Calculator Component

```
┌────────────────────────────────────────────────────┐
│ 💳 CALCULADORA DE CRÉDITOS DROP ANALYST            │
│ Consulta transparentes a tu analista IA            │
├────────────────────────────────────────────────────┤
│                                                    │
│ PASO 1: ¿Qué tipo de consulta necesitas?          │
│                                                    │
│ ☑ 🚀 Rápida (5 seg)                               │
│   └─ 1 crédito | ~$0.10                           │
│   └─ Respuesta directa sin research               │
│                                                    │
│ ○ ⚡ Moderada (15 seg)                            │
│   └─ 3 créditos | ~$0.30                          │
│   └─ Incluye datos de mercado básicos             │
│                                                    │
│ ○ 🔬 Research (60+ seg)                           │
│   └─ 10 créditos | ~$2.00                         │
│   └─ Análisis profundo + múltiples fuentes        │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ PASO 2: ¿Cuántas consultas necesitas al mes?     │
│                                                    │
│ [═════════●════════════] 10 consultas/mes         │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ TU COSTO ESTIMADO:                                │
│                                                    │
│ 10 consultas × 1 crédito = 10 créditos/mes        │
│ Precio: $1.00/mes ($0.10 por consulta)            │
│                                                    │
│ ─────────────────────────────────────────────────  │
│                                                    │
│ BUNDLES RECOMENDADOS:                             │
│                                                    │
│ [5 créditos = $0.50]   [AHORRA 0%]                │
│ [10 créditos = $0.90]  [AHORRA 10%] ⭐ Recomendado
│ [50 créditos = $3.50]  [AHORRA 30%]               │
│ [100 créditos = $7.00] [AHORRA 35%] Best Value    │
│                                                    │
│ [Iniciar con plan + créditos →]                   │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 3.3 Componente React

**Archivo: `/src/components/Landing/CreditCalculator.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function CreditCalculator() {
  const [queryType, setQueryType] = useState('quick');
  const [monthlyQueries, setMonthlyQueries] = useState(10);
  const [pricing, setPricing] = useState<Record<string, any>>({});
  const [bundles, setBundles] = useState<any[]>([]);

  useEffect(() => {
    // Cargar pricing desde BD
    loadPricingConfig();
    loadBundles();
  }, []);

  const loadPricingConfig = async () => {
    const { data } = await supabase
      .from('credit_pricing_config')
      .select('*')
      .eq('active', true);
    
    const priceMap = {};
    data?.forEach(item => {
      priceMap[item.query_type] = item;
    });
    setPricing(priceMap);
  };

  const loadBundles = async () => {
    const { data } = await supabase
      .from('credit_bundles')
      .select('*')
      .eq('active', true)
      .order('credits_amount', { ascending: true });
    
    setBundles(data || []);
  };

  const currentPricing = pricing[queryType];
  const totalCredits = monthlyQueries * (currentPricing?.credits_cost || 1);
  const monthlyCost = monthlyQueries * (currentPricing?.price_usd || 0);

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800">
          💳 Calculadora de Créditos DROP ANALYST
        </h3>
        <p className="text-gray-600 text-sm mt-1">
          Consulta transparentes a tu mentor IA financiero
        </p>
      </div>

      {/* PASO 1: Tipo de consulta */}
      <div className="mb-8 bg-white p-6 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-4">
          PASO 1: ¿Qué tipo de consulta necesitas?
        </h4>
        <div className="space-y-3">
          {[
            { value: 'quick', emoji: '🚀', label: 'Rápida (5 seg)', desc: 'Respuesta directa' },
            { value: 'moderate', emoji: '⚡', label: 'Moderada (15 seg)', desc: 'Datos de mercado básicos' },
            { value: 'research', emoji: '🔬', label: 'Research (60+ seg)', desc: 'Análisis profundo' }
          ].map(option => (
            <label key={option.value} className="flex items-start p-3 border rounded cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="queryType"
                value={option.value}
                checked={queryType === option.value}
                onChange={(e) => setQueryType(e.target.value)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <p className="font-medium">
                  {option.emoji} {option.label}
                </p>
                <p className="text-xs text-gray-500">{option.desc}</p>
                {pricing[option.value] && (
                  <p className="text-sm text-blue-600 font-semibold">
                    {pricing[option.value].credits_cost} créditos | ${pricing[option.value].price_usd.toFixed(2)}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* PASO 2: Frecuencia */}
      <div className="mb-8 bg-white p-6 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-4">
          PASO 2: ¿Cuántas consultas necesitas al mes?
        </h4>
        <div>
          <input
            type="range"
            min="1"
            max="100"
            value={monthlyQueries}
            onChange={(e) => setMonthlyQueries(Number(e.target.value))}
            className="w-full h-2 bg-blue-200 rounded-lg cursor-pointer"
          />
          <p className="text-center text-2xl font-bold text-blue-600 mt-2">
            {monthlyQueries} consultas/mes
          </p>
        </div>
      </div>

      {/* CÁLCULO */}
      <div className="mb-8 bg-white p-6 rounded-lg border-2 border-blue-300">
        <h4 className="font-semibold text-gray-800 mb-4">TU COSTO ESTIMADO:</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">
              {monthlyQueries} consultas × {currentPricing?.credits_cost || 1} crédito(s)
            </span>
            <span className="font-bold text-blue-600">= {totalCredits} créditos/mes</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Precio total:</span>
              <span className="text-3xl font-bold text-green-600">
                ${monthlyCost.toFixed(2)}/mes
              </span>
            </div>
            <p className="text-xs text-gray-500">
              ${(monthlyCost / monthlyQueries).toFixed(3)} por consulta
            </p>
          </div>
        </div>
      </div>

      {/* BUNDLES */}
      <div className="mb-8 bg-white p-6 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-4">BUNDLES RECOMENDADOS:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {bundles.map(bundle => (
            <button
              key={bundle.id}
              className={`p-4 rounded-lg border-2 transition ${
                totalCredits === bundle.credits_amount
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <p className="font-bold text-lg text-gray-800">
                {bundle.credits_amount}
              </p>
              <p className="text-sm text-blue-600 font-semibold">
                ${bundle.price_usd.toFixed(2)}
              </p>
              <p className="text-xs text-green-600 font-semibold">
                Ahorra {bundle.discount_percentage}%
              </p>
              {bundle.is_best_value && (
                <p className="text-xs text-white bg-green-500 rounded px-2 py-1 mt-2">
                  Best Value ⭐
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition">
        Comenzar con plan + {totalCredits} créditos
      </button>

      <p className="text-center text-xs text-gray-600 mt-4">
        ✨ Incluye acceso a DROP ANALYST - Tu mentor financiero IA
      </p>
    </div>
  );
}
```

---

## IV. SISTEMA DE WALLET Y RECARGA

### 4.1 Tablas BD

```sql
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tienda_id UUID REFERENCES tiendas(id) ON DELETE CASCADE,
  
  total_credits INT DEFAULT 0,
  used_credits INT DEFAULT 0,
  available_credits INT DEFAULT 0,
  
  last_refill TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  type VARCHAR(50), -- 'purchase' | 'usage' | 'refund' | 'sharing_bonus'
  amount_credits INT,
  cost_usd DECIMAL(10,2),
  
  query_type VARCHAR(50), -- Qué tipo de consulta (si type='usage')
  reason TEXT,
  
  payment_id VARCHAR(255), -- ID Mercado Pago
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE credit_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  credits_amount INT UNIQUE, -- 5, 10, 50, 100, etc
  price_usd DECIMAL(10,2),
  discount_percentage INT,
  
  is_best_value BOOLEAN DEFAULT false,
  
  active BOOLEAN DEFAULT true
);
```

### 4.2 Wallet Component

**Archivo: `/src/components/App/CreditWallet.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function CreditWallet() {
  const [credits, setCredits] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);

  useEffect(() => {
    loadCreditsAndTransactions();
  }, []);

  const loadCreditsAndTransactions = async () => {
    const user = await supabase.auth.getUser();
    
    // Créditos usuario
    const { data: creditsData } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.data.user.id)
      .single();
    
    setCredits(creditsData);

    // Transacciones
    const { data: txnData } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.data.user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    setTransactions(txnData || []);

    // Bundles
    const { data: bundlesData } = await supabase
      .from('credit_bundles')
      .select('*')
      .eq('active', true)
      .order('credits_amount', { ascending: true });
    
    setBundles(bundlesData || []);
  };

  if (!credits) return <div>Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Saldo actual */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-lg mb-6">
        <p className="text-sm opacity-90">Créditos disponibles</p>
        <p className="text-5xl font-bold">{credits.available_credits}</p>
        <p className="text-sm mt-2 opacity-90">
          Usados: {credits.used_credits} | Total: {credits.total_credits}
        </p>
      </div>

      {/* Recargar */}
      <div className="bg-white p-6 rounded-lg mb-6 border">
        <h3 className="text-lg font-bold mb-4">💳 Recargar créditos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {bundles.map(bundle => (
            <button
              key={bundle.id}
              onClick={() => handleRecharge(bundle)}
              className="p-4 border-2 rounded-lg hover:border-blue-500 transition text-center"
            >
              <p className="font-bold text-xl">{bundle.credits_amount}</p>
              <p className="text-green-600 font-semibold">${bundle.price_usd}</p>
              <p className="text-xs text-gray-600">Ahorra {bundle.discount_percentage}%</p>
            </button>
          ))}
        </div>
      </div>

      {/* Historial */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-bold mb-4">📜 Historial de transacciones</h3>
        <div className="space-y-2">
          {transactions.map(txn => (
            <div key={txn.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">
                  {txn.type === 'purchase' && '➕ Compra de créditos'}
                  {txn.type === 'usage' && '➖ Consulta ' + txn.query_type}
                  {txn.type === 'sharing_bonus' && '🎁 Bono por compartir'}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(txn.created_at).toLocaleDateString()}
                </p>
              </div>
              <p className={`font-bold ${txn.type === 'purchase' || txn.type === 'sharing_bonus' ? 'text-green-600' : 'text-red-600'}`}>
                {txn.type === 'purchase' || txn.type === 'sharing_bonus' ? '+' : '-'}{txn.amount_credits}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function handleRecharge(bundle: any) {
  // Redirige a Mercado Pago
  window.location.href = `/checkout?credits=${bundle.id}`;
}
```

---

## V. ADMIN DASHBOARD - GEMINI COST ANALYZER

### 5.1 Ubicación

```
/app/admin/gemini-analytics

Acceso: Solo admin (user_role = 'admin')
```

### 5.2 UI Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│ 🤖 GEMINI COST ANALYZER - Dashboard de Monetización           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ MÉTRICAS HOY:                                                │
│                                                              │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐   │
│ │ Costo Real  │ Ingresos    │ Consultas   │ Margen Neto │   │
│ │ $2.34       │ $45.00      │ 45          │ $42.66 (95%)│   │
│ └─────────────┴─────────────┴─────────────┴─────────────┘   │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ DESGLOSE POR TIPO DE CONSULTA:                              │
│                                                              │
│ Rápida (🚀):                                                 │
│ ├─ Consultas: 20                                            │
│ ├─ Costo Gemini: $0.006                                     │
│ ├─ Ingresos: $2.00                                          │
│ └─ Margen: 99.7% ✅                                          │
│                                                              │
│ Moderada (⚡):                                               │
│ ├─ Consultas: 15                                            │
│ ├─ Costo Gemini: $0.0225                                    │
│ ├─ Ingresos: $4.50                                          │
│ └─ Margen: 99.5% ✅                                          │
│                                                              │
│ Research (🔬):                                               │
│ ├─ Consultas: 10                                            │
│ ├─ Costo Gemini: $0.045                                     │
│ ├─ Ingresos: $20.00                                         │
│ └─ Margen: 99.8% ✅                                          │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ CONFIGURACIÓN PRICING:                                      │
│                                                              │
│ Tipo      │ Créditos │ Costo Real │ Precio User │ Markup   │
│ ──────────┼──────────┼────────────┼─────────────┼──────────│
│ Rápida    │ 1        │ $0.0003    │ $0.10       │ 333x     │
│ Moderada  │ 3        │ $0.0015    │ $0.30       │ 200x     │
│ Research  │ 10       │ $0.0045    │ $2.00       │ 444x     │
│                                                              │
│ [⚙️ Editar configuración]                                   │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ PROYECCIONES MENSUALES (basado en hoy):                     │
│                                                              │
│ Costo Gemini estimado: $70.20                               │
│ Ingresos estimados: $1,350.00                               │
│ Margen neto: 94.8% ✅                                        │
│                                                              │
│ [📊 Ver gráficos detallados]                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 Componente React

**Archivo: `/src/components/Admin/GeminiAnalytics.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function GeminiAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [byType, setByType] = useState<any>({});
  const [pricing, setPricing] = useState<any>({});

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    // Obtener transacciones de hoy
    const today = new Date().toISOString().split('T')[0];
    
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('type', 'usage')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    // Obtener configuración de pricing
    const { data: pricingData } = await supabase
      .from('credit_pricing_config')
      .select('*');

    const pricingMap = {};
    let totalCostGemini = 0;
    let totalRevenue = 0;

    const byTypeStats = {};

    pricingData?.forEach(p => {
      pricingMap[p.query_type] = p;
    });

    transactions?.forEach(txn => {
      const pricing = pricingMap[txn.query_type];
      totalCostGemini += pricing?.cost_gemini_usd || 0;
      totalRevenue += pricing?.price_usd || 0;

      if (!byTypeStats[txn.query_type]) {
        byTypeStats[txn.query_type] = {
          queries: 0,
          costGemini: 0,
          revenue: 0
        };
      }
      
      byTypeStats[txn.query_type].queries += 1;
      byTypeStats[txn.query_type].costGemini += pricing?.cost_gemini_usd || 0;
      byTypeStats[txn.query_type].revenue += pricing?.price_usd || 0;
    });

    const margin = ((totalRevenue - totalCostGemini) / totalRevenue * 100).toFixed(1);

    setStats({
      costGemini: totalCostGemini.toFixed(2),
      revenue: totalRevenue.toFixed(2),
      queries: transactions?.length || 0,
      margin,
      marginAmount: (totalRevenue - totalCostGemini).toFixed(2)
    });

    setByType(byTypeStats);
    setPricing(pricingMap);
  };

  if (!stats) return <div>Cargando analytics...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🤖 Gemini Cost Analyzer</h1>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Costo Real</p>
          <p className="text-2xl font-bold text-red-600">${stats.costGemini}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Ingresos</p>
          <p className="text-2xl font-bold text-green-600">${stats.revenue}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Consultas</p>
          <p className="text-2xl font-bold text-blue-600">{stats.queries}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Margen Neto</p>
          <p className="text-2xl font-bold text-green-600">${stats.marginAmount}</p>
          <p className="text-sm text-gray-600">{stats.margin}%</p>
        </div>
      </div>

      {/* Por tipo */}
      <div className="bg-white p-6 rounded-lg border mb-6">
        <h2 className="text-lg font-bold mb-4">Desglose por tipo de consulta</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Consultas</th>
              <th className="text-left p-2">Costo Gemini</th>
              <th className="text-left p-2">Ingresos</th>
              <th className="text-left p-2">Margen</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(byType).map(([type, data]: [string, any]) => {
              const markup = ((data.revenue / data.costGemini - 1) * 100).toFixed(1);
              return (
                <tr key={type} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{type}</td>
                  <td className="p-2">{data.queries}</td>
                  <td className="p-2">${data.costGemini.toFixed(4)}</td>
                  <td className="p-2">${data.revenue.toFixed(2)}</td>
                  <td className="p-2 text-green-600 font-bold">{markup}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Configuración */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-bold mb-4">⚙️ Configuración de Pricing</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Créditos</th>
              <th className="text-left p-2">Costo Gemini</th>
              <th className="text-left p-2">Precio Usuario</th>
              <th className="text-left p-2">Markup</th>
              <th className="text-left p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(pricing).map(([type, config]: [string, any]) => (
              <tr key={type} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">{type}</td>
                <td className="p-2">{config.credits_cost}</td>
                <td className="p-2">${config.cost_gemini_usd.toFixed(4)}</td>
                <td className="p-2">${config.price_usd.toFixed(2)}</td>
                <td className="p-2 font-bold">{config.markup_percentage}x</td>
                <td className="p-2">
                  <button className="text-blue-600 hover:underline text-sm">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## VI. APRENDIZAJE COLECTIVO ANÓNIMO

### 6.1 Nueva funcionalidad: Compartir datos

**Ubicación:** Settings → Privacidad → "Compartir datos para aprendizaje colectivo"

```
┌─────────────────────────────────────────┐
│ 🤝 COMPARTIR PARA APRENDIZAJE            │
├─────────────────────────────────────────┤
│                                         │
│ ☐ Permitir que DropCost utilice mis    │
│   datos de costeos de manera anónima    │
│   para mejorar recomendaciones para     │
│   todos los usuarios.                   │
│                                         │
│ Ejemplos de insights compartidos:      │
│ • "En electrónica, CPA promedio: $45"  │
│ • "Top 3 productos rentables: X, Y, Z" │
│ • "Mejor ticketpromedio por categoría"  │
│                                         │
│ ✅ Activar compartición                 │
│                                         │
│ 🎁 Recibirás 10 créditos gratis        │
│    por activar esta opción             │
│                                         │
└─────────────────────────────────────────┘
```

### 6.2 Tabla BD

```sql
CREATE TABLE user_sharing_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  allow_anonymous_sharing BOOLEAN DEFAULT false,
  sharing_activated_at TIMESTAMP,
  
  bonus_credits_claimed BOOLEAN DEFAULT false,
  bonus_claimed_at TIMESTAMP,
  
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE anonymous_costeo_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- NO incluir user_id (anónimo)
  category VARCHAR(100),
  
  price_range VARCHAR(50), -- "$0-50", "$50-100", etc
  avg_cpa DECIMAL(10,2),
  avg_margin DECIMAL(10,2),
  avg_roi DECIMAL(10,2),
  
  num_samples INT, -- Cuántos datos agregados
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6.3 Función: Generar insights

```typescript
// /src/lib/insights-generator.ts

export async function generateAnonymousInsights() {
  // Cada noche, generar insights agregados
  // SIN información de usuarios
  
  const insights = await aggregateCosteoData();
  // {
  //   "electronics": {
  //     "price_0-50": { avg_cpa: 15.2, avg_margin: 35.5 },
  //     "price_50-100": { avg_cpa: 28.3, avg_margin: 52.1 }
  //   },
  //   "fashion": { ... }
  // }
  
  await storeInsights(insights);
}
```

---

## VII. ACTUALIZACIONES LEGALES

### 7.1 Política de Privacidad - Nueva Sección

```markdown
## Aprendizaje Colectivo Anónimo

Si lo deseas, puedes compartir tus datos de costeos 
de manera COMPLETAMENTE ANÓNIMA para ayudarnos a 
mejorar nuestras recomendaciones para todos los usuarios.

**¿Qué compartirás?**
- Tu industria/categoría
- Rangos de precios
- CPA promedio
- Margen neto promedio

**¿Qué NO compartirás?**
- Tu nombre, email, tienda
- Datos de clientes
- Información personal
- Detalles específicos

**Beneficio:** Recibirás 10 créditos gratis

**Cómo desactivar:** Ve a Configuración → Privacidad
Puedes desactivar en cualquier momento.
```

### 7.2 Términos y Condiciones - Nueva Sección

```markdown
## Créditos y Monetización de DROP ANALYST

1. **Sistema de Créditos**
   - Los créditos son virtuales y no tienen valor monetario fuera de DropCost
   - Los créditos no se pueden transferir, vender o cambiar
   - Los créditos pueden expirar si no se usan en 12 meses
   
2. **Compra y Reembolsos**
   - Las compras de créditos son finales
   - No se ofrecen reembolsos (excepto por error en cobro)
   - Mercado Pago gestiona pagos, sujeto a sus términos
   
3. **Cambios de Precio**
   - DropCost se reserva el derecho de cambiar precios de créditos
   - Los cambios se notificarán con 7 días de anticipación
   - Los créditos ya comprados mantienen su valor
   
4. **Acceso a DROP ANALYST**
   - DROP ANALYST requiere créditos disponibles
   - DropCost se reserva el derecho de cambiar características o precios
   - Los límites de uso pueden ajustarse sin previo aviso
```

---

## VIII. CHECKLIST IMPLEMENTACIÓN

### Tablas BD
- [ ] credit_pricing_config creada
- [ ] user_credits creada
- [ ] credit_transactions creada
- [ ] credit_bundles creada
- [ ] user_sharing_preferences creada
- [ ] anonymous_costeo_insights creada

### Landing Page
- [ ] CreditCalculator component creado
- [ ] Integrado en landing
- [ ] Responsivo mobile
- [ ] Links a checkout funcionan

### Wallet
- [ ] CreditWallet component creado
- [ ] Integrado en /app
- [ ] Historial de transacciones
- [ ] Botones recargar funcionan

### Admin Dashboard
- [ ] GeminiAnalytics component creado
- [ ] KPIs en tiempo real
- [ ] Tabla desglose por tipo
- [ ] Configuración editable

### Aprendizaje Colectivo
- [ ] Toggle en Configuración → Privacidad
- [ ] Bonus créditos al activar
- [ ] Función generateInsights() creada
- [ ] Cron job nightly para insights

### Legal
- [ ] Política privacidad actualizada
- [ ] Términos y condiciones actualizados
- [ ] Review legal (opcional)

---

## IX. INTEGRACIÓN CON DROP ANALYST

```typescript
// Cuando usuario consulta DROP ANALYST

if (userCredits.available_credits < requiredCredits) {
  showMessage('❌ Créditos insuficientes. Ve a recargar.');
  redirect('/app/wallet');
} else {
  // Ejecutar consulta Gemini
  const response = await queryGemini(...);
  
  // Deducir créditos
  await deductCredits(user_id, requiredCredits);
  
  // Registrar transacción
  await recordTransaction({
    type: 'usage',
    query_type: 'moderate',
    credits: 3,
    cost_usd: 0.0015
  });
  
  // Mostrar respuesta
  showDrawkuroResponse(response);
}
```

---

## X. FLUJO COMPLETO DE USUARIO NUEVO

```
1. Usuario llega a landing
   ↓
2. Ve calculadora de créditos
   └─ "100 consultas/mes = $70"
   ↓
3. Click "Comenzar con plan"
   ↓
4. Selecciona plan + bundle créditos
   ├─ Plan Starter ($5) + 50 créditos ($3.50)
   ↓
5. Paga con Mercado Pago
   ↓
6. Entra a app
   ├─ Créditos: 50 disponibles
   ↓
7. Abre simulador (costeo)
   ↓
8. Pregunta a DROP ANALYST
   └─ "¿Este precio es competitivo?"
   ↓
9. DROP ANALYST responde
   ├─ Deducción: 3 créditos
   ├─ Créditos restantes: 47
   ↓
10. En Configuración → Privacidad
    └─ Activa "Compartir datos anónimamente"
    └─ Recibe: +10 créditos (bonus)
    ├─ Créditos totales: 57
    ↓
11. Cuando créditos bajen < 10
    └─ Notificación: "Recarga créditos"
    ↓
12. Va a Wallet
    ├─ Ve histórico de transacciones
    ├─ Elige bundle
    ├─ Paga
    └─ Continúa usando DROP ANALYST

MONETIZACIÓN:
├─ Plan: $5/mes
├─ Créditos: $3.50 (iniciales)
├─ Recargas futuras: $7+ (bundles)
└─ Margen: 95% en cada transacción
```

---

**DOCUMENTO LISTO PARA ANTIGRAVITY** ✅

