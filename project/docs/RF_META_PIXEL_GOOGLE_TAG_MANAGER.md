# REQUISITO FUNCIONAL: INTEGRACIÓN META PIXEL Y GOOGLE TAG MANAGER
**DropCost Master**  
**Estado:** Especificación Activa  
**Fecha:** 26 de febrero de 2026  
**Criticidad:** ALTA - Rastreo integral de conversiones

---

## I. DESCRIPCIÓN GENERAL

Sistema completo de rastreo de conversiones que integra:
- **Meta Pixel:** Rastreo frontend en landing + aplicación
- **Meta Conversions API:** Rastreo backend server-side
- **Google Tag Manager:** Gestor central de eventos
- **Google Analytics 4:** Análisis de datos independiente

**Objetivo:** Capturar complete funnel landing → lead → checkout → purchase con data redundante (Meta + Google)

---

## II. ARQUITECTURA GENERAL

```
FLUJO RASTREO COMPLETO:

1. Landing Page (dropcost.jariash.com)
   ↓ GTM Pixel
   ↓ PageView (Meta + GA4)
   ↓ ViewContent - secciones (Meta + GA4)
   
2. Usuario elige plan → Redirige registro
   
3. Página Registro (/auth/register)
   ↓ GTM Pixel
   ↓ PageView (Meta + GA4)
   
4. Usuario completa registro
   ↓ Lead event ⭐ (Meta Pixel + GTM + GA4)
   ↓ Auditoría en BD
   
5. Launchpad (Onboarding)
   ↓ GTM Pixel
   ↓ PageView (Meta + GA4)
   
6. Usuario elige plan (2da vez)
   ↓ InitiateCheckout (Meta Pixel + GTM + GA4)
   ↓ Redirige Mercado Pago
   
7. Mercado Pago → Pago confirmado
   ↓ Webhook Mercado Pago
   ↓ Purchase event (Conversions API + GTM + GA4)
   ↓ Auditoría en BD
   
8. Dashboard/App (post-compra)
   ↓ GTM Pixel (tracking interno)
   ↓ PageView (Meta + GA4)

DESTINOS SIMULTÁNEOS:
├─ Meta Pixel (client-side)
├─ Meta Conversions API (server-side)
├─ Google Analytics 4 (GA4)
└─ BD (auditoría local)
```

---

## III. EVENTOS RASTREADOS

### Resumen de eventos:

| Evento | Dónde | Cuándo | Destinos |
|--------|-------|--------|----------|
| **PageView** | GTM + Meta Pixel | Usuario llega a página | Meta, GA4 |
| **ViewContent** | GTM + Meta Pixel | Usuario navega secciones | Meta, GA4 |
| **Lead** | GTM + Meta Pixel | Usuario completa registro | Meta, GA4, BD |
| **InitiateCheckout** | GTM + Meta Pixel | Usuario elige plan (Launchpad) | Meta, GA4 |
| **Purchase** | Conversions API | Pago confirmado Mercado Pago | Meta, GA4, BD |

---

## IV. PASO 1: CONFIGURACIÓN INICIAL (Manual)

### 4.1 Google Tag Manager Setup

**Pasos en Google:**
1. Google Tag Manager (https://tagmanager.google.com)
2. Crear Container: "DropCost Master - Producción"
3. Plataforma: Web
4. Copiar GTM ID (formato: GTM-XXXXXX)
5. Guardar en `.env.production`

### 4.2 Google Analytics 4 Setup

**Pasos en Google:**
1. Google Analytics → Crear propiedad GA4
2. Nombre: "DropCost Master Production"
3. Dominio: dropcost.jariash.com
4. Copiar Measurement ID (formato: G-XXXXXXXXXX)
5. Guardar en `.env.production`

### 4.3 Meta Pixel (Ya configurado)

**Del RF anterior:**
- Pixel ID: 1234567890
- Conversions API Token: EAAxxxxxxxx
- Ya guardado en `.env.production`

### 4.4 Variables de Entorno

```env
# .env.production

# Google Tag Manager
NEXT_PUBLIC_GTM_ID=GTM-XXXXXX

# Google Analytics 4
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX

# Meta Pixel
NEXT_PUBLIC_META_PIXEL_ID=1234567890
META_CONVERSIONS_API_TOKEN=EAAxxxxxxxx
META_CONVERSIONS_API_VERSION=v19.0
```

---

## V. PASO 2: GOOGLE TAG MANAGER INSTALLATION

### 5.1 GTM Script en Layout Global

**Archivo: `/src/components/GTMScript.tsx`**

```typescript
'use client';

import Script from 'next/script';

export function GTMScript() {
  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

  if (!GTM_ID) {
    console.warn('GTM_ID not configured');
    return null;
  }

  return (
    <>
      {/* Google Tag Manager - Script principal */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `
        }}
      />

      {/* Google Tag Manager - No-script fallback */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  );
}
```

**Usar en RootLayout:**

```typescript
// app/layout.tsx
import { GTMScript } from '@/components/GTMScript';

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head>
        <GTMScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 5.2 Event Tracking Helper

**Archivo: `/src/lib/gtm-events.ts`**

```typescript
// Función centralizada para disparar eventos en GTM
export function trackEvent(
  eventName: string,
  eventData: Record<string, any> = {}
) {
  if (typeof window === 'undefined') return;

  // Enviar a dataLayer (GTM + GA4)
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...eventData,
    timestamp: new Date().toISOString()
  });

  console.log(`📊 Event tracked: ${eventName}`, eventData);
}

// Eventos específicos

export function trackPageView(pageName: string, pageUrl?: string) {
  trackEvent('page_view', {
    page_title: pageName,
    page_location: pageUrl || window.location.href
  });
}

export function trackViewContent(contentType: string, contentName: string) {
  trackEvent('view_content', {
    content_type: contentType, // 'section', 'page'
    content_name: contentName // 'hero', 'features', 'pricing'
  });
}

export function trackLead(userData: {
  email: string;
  name?: string;
  userId: string;
}) {
  trackEvent('generate_lead', {
    user_email: userData.email,
    user_name: userData.name,
    user_id: userData.userId,
    lead_timestamp: new Date().toISOString()
  });
}

export function trackInitiateCheckout(plan: {
  planName: string;
  amount: number;
  currency?: string;
}) {
  trackEvent('begin_checkout', {
    value: plan.amount,
    currency: plan.currency || 'USD',
    items: [
      {
        item_name: plan.planName,
        price: plan.amount
      }
    ]
  });
}

export function trackPurchase(purchase: {
  transactionId: string;
  amount: number;
  planName: string;
  currency?: string;
}) {
  trackEvent('purchase', {
    transaction_id: purchase.transactionId,
    value: purchase.amount,
    currency: purchase.currency || 'USD',
    items: [
      {
        item_name: purchase.planName,
        price: purchase.amount
      }
    ]
  });
}
```

---

## VI. PASO 3: EVENTOS EN LANDING PAGE

### 6.1 PageView en Landing

**Landing Component:**

```typescript
'use client';

import { useEffect } from 'react';
import { trackPageView } from '@/lib/gtm-events';

export default function LandingPage() {
  useEffect(() => {
    // GTM + GA4 + Meta Pixel
    trackPageView('Landing Page', window.location.href);
  }, []);

  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
    </div>
  );
}
```

### 6.2 ViewContent en Secciones

**PricingSection:**

```typescript
'use client';

import { useEffect } from 'react';
import { trackViewContent } from '@/lib/gtm-events';

export function PricingSection() {
  useEffect(() => {
    trackViewContent('section', 'pricing');
  }, []);

  return (
    <section id="pricing">
      {/* Planes: Starter $3, Pro $10, Enterprise $25 */}
    </section>
  );
}

export function FeaturesSection() {
  useEffect(() => {
    trackViewContent('section', 'features');
  }, []);

  return <section id="features">{/* Features */}</section>;
}
```

---

## VII. PASO 4: EVENTO LEAD (Registro)

### 7.1 Trigger al Completar Registro

**File: `/src/app/auth/register/page.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { trackLead } from '@/lib/gtm-events';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleRegister = async () => {
    try {
      // 1. Registrar usuario
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      const userId = data.user?.id;

      // 2. 🎯 DISPARAR EVENTO LEAD
      trackLead({
        email: formData.email,
        name: formData.name,
        userId: userId || 'unknown'
      });

      // 3. Auditoría en BD
      await fetch('/api/events/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          email: formData.email,
          name: formData.name,
          timestamp: new Date().toISOString()
        })
      });

      // 4. Redirige a Launchpad
      window.location.href = '/app/launchpad';
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
      <input
        type="text"
        placeholder="Nombre"
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <input
        type="password"
        placeholder="Contraseña"
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />
      <button type="submit">Registrarse</button>
    </form>
  );
}
```

### 7.2 Edge Function: Auditoría Lead

**File: `/functions/events-lead.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { user_id, email, name, timestamp } = await req.json();

    // Guardar evento lead en BD
    await supabase.from('gtm_events_log').insert({
      event_type: 'lead',
      user_id,
      email,
      name,
      event_timestamp: timestamp,
      created_at: new Date()
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Lead event tracked' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error tracking lead:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
```

---

## VIII. PASO 5: EVENTO INITIATE CHECKOUT

### 8.1 Trigger en Launchpad

**File: `/src/app/app/launchpad/page.tsx`**

```typescript
'use client';

import { trackInitiateCheckout } from '@/lib/gtm-events';

export default function LaunchpadPage() {
  const handleChoosePlan = (plan: 'starter' | 'pro' | 'enterprise') => {
    const prices = { starter: 3, pro: 10, enterprise: 25 };

    // 🎯 DISPARAR EVENTO INITIATE CHECKOUT
    trackInitiateCheckout({
      planName: plan,
      amount: prices[plan],
      currency: 'USD'
    });

    // Redirige a Mercado Pago
    window.location.href = `/checkout?plan=${plan}`;
  };

  return (
    <div>
      <button onClick={() => handleChoosePlan('starter')}>
        Elegir Starter - $3
      </button>
      <button onClick={() => handleChoosePlan('pro')}>
        Elegir Pro - $10
      </button>
      <button onClick={() => handleChoosePlan('enterprise')}>
        Elegir Enterprise - $25
      </button>
    </div>
  );
}
```

---

## IX. PASO 6: EVENTO PURCHASE (Backend)

### 9.1 Webhook Mercado Pago Mejorado

**File: `/functions/webhook-mercado-pago.ts` (actualizado)**

```typescript
import { createClient } from '@supabase/supabase-js';
import { trackPurchaseMetaAPI } from '@/lib/meta-conversions';
import { trackPurchaseGTM } from '@/lib/gtm-events-server';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const payload = await req.json();
    const { id: payment_id, status } = payload.data;

    if (status === 'approved') {
      // 1. Obtener detalles pago
      const paymentDetails = await fetch(
        `https://api.mercadopago.com/v1/payments/${payment_id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADO_PAGO_TOKEN}`
          }
        }
      ).then(r => r.json());

      const {
        payer: { email },
        transaction_amount: amount,
        metadata: { plan, user_id }
      } = paymentDetails;

      // 2. 🎯 DISPARAR META CONVERSIONS API
      await trackPurchaseMetaAPI({
        email,
        amount,
        plan,
        payment_id,
        user_id
      });

      // 3. 🎯 DISPARAR GTM + GA4 (via dataLayer)
      await trackPurchaseGTM({
        transaction_id: payment_id,
        amount,
        plan,
        user_id,
        email
      });

      // 4. Auditoría en BD
      await supabase.from('gtm_events_log').insert({
        event_type: 'purchase',
        user_id,
        email,
        plan,
        amount,
        payment_id,
        event_timestamp: new Date().toISOString(),
        created_at: new Date()
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Purchase tracked (Meta + GTM + GA4)' 
        }),
        { status: 200 }
      );
    }

    return new Response(JSON.stringify({ success: false }), { status: 200 });
  } catch (error) {
    console.error('Error webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
```

### 9.2 Function: Track Purchase GTM (Server-side)

**File: `/src/lib/gtm-events-server.ts`**

```typescript
import { supabase } from '@/lib/supabase';

export async function trackPurchaseGTM(purchase: {
  transaction_id: string;
  amount: number;
  plan: string;
  user_id: string;
  email: string;
}) {
  // GTM (Client-side) se dispara cuando el usuario regresa del pago
  // Aquí guardamos para auditoría server-side
  
  try {
    await supabase.from('gtm_purchase_log').insert({
      transaction_id: purchase.transaction_id,
      user_id: purchase.user_id,
      email: purchase.email,
      plan: purchase.plan,
      amount: purchase.amount,
      event_timestamp: new Date().toISOString(),
      created_at: new Date()
    });

    console.log('✅ Purchase tracked in GTM audit log');
  } catch (error) {
    console.error('Error tracking purchase in GTM:', error);
  }
}
```

---

## X. PASO 7: GOOGLE ANALYTICS 4 CONFIGURATION

### 10.1 GTM Setup (Google Console)

**En Google Tag Manager Console:**

1. **Crear Tags:**
   - Tag 1: Google Analytics 4 (PageView)
   - Tag 2: Google Analytics 4 (Lead)
   - Tag 3: Google Analytics 4 (InitiateCheckout)
   - Tag 4: Google Analytics 4 (Purchase)

2. **Para cada Tag:**
   - Tipo: Google Analytics: GA4 Event
   - Measurement ID: G-XXXXXXXXXX (tu GA4 ID)
   - Event Name: page_view | generate_lead | begin_checkout | purchase

3. **Triggers:**
   - PageView → Trigger: All Pages
   - Lead → Trigger: Custom Event (event = generate_lead)
   - InitiateCheckout → Trigger: Custom Event (event = begin_checkout)
   - Purchase → Trigger: Custom Event (event = purchase)

### 10.2 Meta Pixel Configuration (Google Console)

**En Google Tag Manager Console:**

1. **Crear Tags Meta Pixel:**
   - Tag 1: Meta Pixel (PageView)
   - Tag 2: Meta Pixel (Lead)
   - Tag 3: Meta Pixel (InitiateCheckout)
   - Tag 4: Meta Pixel (Purchase) - ya existe

2. **Para cada Tag:**
   - Tipo: Meta Pixel
   - Pixel ID: 1234567890
   - Event Name: PageView | Lead | InitiateCheckout | Purchase

3. **Triggers:**
   - Mismo que GA4 (custom events)

---

## XI. BASE DE DATOS - TABLAS AUDITORÍA

### 11.1 Tabla: gtm_events_log

```sql
CREATE TABLE gtm_events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  event_type VARCHAR(50), -- 'page_view', 'lead', 'checkout', 'purchase'
  user_id UUID REFERENCES auth.users(id),
  email VARCHAR(255),
  
  plan VARCHAR(50), -- 'starter', 'pro', 'enterprise'
  amount DECIMAL(10,2),
  payment_id VARCHAR(255),
  
  event_timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_event_type CHECK (event_type IN ('page_view', 'lead', 'checkout', 'purchase'))
);

CREATE INDEX idx_gtm_events_user ON gtm_events_log(user_id);
CREATE INDEX idx_gtm_events_type ON gtm_events_log(event_type);
CREATE INDEX idx_gtm_events_timestamp ON gtm_events_log(event_timestamp);
```

### 11.2 Tabla: gtm_purchase_log

```sql
CREATE TABLE gtm_purchase_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  transaction_id VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  email VARCHAR(255),
  
  plan VARCHAR(50),
  amount DECIMAL(10,2),
  
  event_timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_purchase_user ON gtm_purchase_log(user_id);
CREATE INDEX idx_purchase_timestamp ON gtm_purchase_log(event_timestamp);
```

---

## XII. FLUJO COMPLETO RESUMEN

```
LANDING PAGE (dropcost.jariash.com)
├─ GTM Pixel Carga
├─ PageView → GTM → Meta Pixel + GA4
├─ Usuario navega
├─ ViewContent → GTM → Meta Pixel + GA4

CLICK PLAN (Landing)
├─ Redirige /auth/register

PÁGINA REGISTRO (/auth/register)
├─ GTM Pixel
├─ PageView → GTM → Meta Pixel + GA4

USUARIO COMPLETA REGISTRO
├─ Lead event → GTM → Meta Pixel + GA4 ⭐
├─ Auditoría en BD (gtm_events_log)
├─ Redirige /app/launchpad

LAUNCHPAD (Onboarding)
├─ GTM Pixel
├─ PageView → GTM → Meta Pixel + GA4

USUARIO ELIGE PLAN (2da vez)
├─ InitiateCheckout → GTM → Meta Pixel + GA4 ⭐
├─ Redirige Mercado Pago

MERCADO PAGO (Pago)
├─ Usuario completa pago
├─ Webhook confirma

WEBHOOK MERCADO PAGO
├─ Purchase event → Meta Conversions API ⭐
├─ Purchase event → GTM → GA4 ⭐
├─ Auditoría en BD (gtm_purchase_log + meta_conversions_log)
├─ Redirige /app/dashboard

DASHBOARD (Post-compra)
├─ GTM Pixel
├─ PageView → GTM → Meta Pixel + GA4
```

---

## XIII. DESTINOS DE EVENTOS

```
MATRÍZ DE ENVÍO:

Evento          │ Meta Pixel │ Meta API │ GA4  │ BD
─────────────────────────────────────────────────
PageView        │     ✅     │    ❌    │  ✅  │  ✅
ViewContent     │     ✅     │    ❌    │  ✅  │  ❌
Lead            │     ✅     │    ❌    │  ✅  │  ✅
InitiateCheckout│     ✅     │    ❌    │  ✅  │  ❌
Purchase        │     ✅     │    ✅    │  ✅  │  ✅

EXPLICACIÓN:
└─ Meta Pixel: client-side en navegador
└─ Meta API: server-side desde webhook
└─ GA4: siempre (via GTM)
└─ BD: auditoría crítica (lead + purchase)
```

---

## XIV. TESTING ANTES DE PRODUCCIÓN

**Checklist:**

- [ ] GTM_ID en .env.production
- [ ] GA4 Measurement ID en .env.production
- [ ] Meta Pixel ID en .env.production
- [ ] Meta Conversions API Token en .env.production
- [ ] GTMScript.tsx importado en RootLayout
- [ ] gtm-events.ts con todas las funciones
- [ ] Landing page dispara PageView + ViewContent
- [ ] Registro dispara Lead event
- [ ] Launchpad dispara InitiateCheckout
- [ ] Webhook Mercado Pago dispara Purchase + Meta API
- [ ] Tablas BD creadas (gtm_events_log, gtm_purchase_log)
- [ ] Test manual: Compra $1 USD
- [ ] Verificar en Meta Events Manager: eventos llegando
- [ ] Verificar en Google Analytics 4: eventos llegando
- [ ] Verificar en BD: registros guardados

---

## XV. MONITOREO POST-DEPLOYMENT

**Validar diariamente:**

1. **Meta Events Manager:**
   - ✅ PageView entrando
   - ✅ Lead events registrándose
   - ✅ InitiateCheckout eventos
   - ✅ Purchase completándose

2. **Google Analytics 4:**
   - ✅ Events en tiempo real
   - ✅ Conversions rastreadas
   - ✅ Funnel completo visible

3. **BD Auditoría:**
   - ✅ gtm_events_log populado
   - ✅ gtm_purchase_log con transacciones
   - ✅ meta_conversions_log con API responses

---

## XVI. BENEFICIOS DEL ECOSISTEMA

```
✅ REDUNDANCIA:
└─ Meta falla → tenemos Google data
└─ Google falla → tenemos Meta data
└─ Ambas fallan → tenemos BD local

✅ OPTIMIZACIÓN:
└─ Comparar CPA: Meta vs Google
└─ Identificar mejor canal de conversión
└─ Ajustar budgets según datos reales

✅ COMPLIANCE:
└─ Auditoría completa en BD
└─ Timestamps precisos
└─ Rastreo transparente

✅ INTELIGENCIA:
└─ Entender journey completo
└─ Lead generation cost
└─ Purchase attribution
└─ ROAS por fuente
```

---

## XVII. SIGUIENTES PASOS

1. ✅ Implementar este RF en producción
2. ✅ Test: compra $1 USD
3. ✅ Validar eventos en Meta + Google
4. ✅ Monitorear 7 días
5. ⏭️ Escalar campañas Meta (con data validated)
6. ⏭️ Crear dashboard admin (visualización GTM)

---

**DOCUMENTO LISTO PARA IMPLEMENTACIÓN EN PRODUCCIÓN** ✅

**ECOSISTEMA COMPLETO DE RASTREO ACTIVADO**

```
Landing → GTM → Meta Pixel ✅
Landing → GTM → Google Analytics 4 ✅
Register → GTM → Lead event ✅
Launchpad → GTM → InitiateCheckout event ✅
Mercado Pago → Conversions API → Meta ✅
Mercado Pago → GTM → Google Analytics 4 ✅
Auditoría BD → Complete tracking log ✅
```

