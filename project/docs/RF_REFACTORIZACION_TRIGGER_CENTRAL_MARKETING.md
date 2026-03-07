# REQUISITO FUNCIONAL: REFACTORIZACIÓN TRIGGER CENTRAL MARKETING
**DropCost Master**  
**Estado:** Especificación Activa  
**Fecha:** 26 de febrero de 2026  
**Criticidad:** ALTA - Refactorización funcional

---

## I. DESCRIPCIÓN GENERAL

Refactorizar sistema de triggers de marketing de específicos (1 trigger por evento) a trigger central genérico con variables dinámicas. Mantiene funcionalidad actual sin downtime.

**Objetivo:** Permitir que marketing cree nuevas campañas/plantillas sin código

---

## II. PROBLEMA ACTUAL

```
ARQUITECTURA ACTUAL:

trigger_user_registered → plantilla_welcome
trigger_password_reset → plantilla_password
trigger_2fa_enabled → plantilla_2fa
trigger_verification_code → plantilla_verification
trigger_promo → plantilla_promo

LIMITACIÓN:
├─ Cada nuevo evento = nuevo trigger en código
├─ Marketing no puede crear triggers
├─ No escalable
├─ Difícil mantener
```

---

## III. SOLUCIÓN FINAL

```
NUEVA ARQUITECTURA:

trigger_marketing_event (CENTRAL + GENÉRICO)
  ├─ event_type: 'user_registered' | 'password_reset' | 'promo' | ...
  ├─ template_id: (plantilla a usar)
  ├─ user_id: (destinatario)
  └─ variables: { name, email, code, promo_name, ... }

BENEFICIO:
├─ 1 solo trigger central
├─ Variables dinámicas (JSON)
├─ Marketing crea plantillas sin código
├─ Escalable infinitamente
```

---

## IV. FASE 1: INFRAESTRUCTURA BASE (Staging)

### 4.1 Tabla: marketing_events

```sql
CREATE TABLE marketing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación evento
  event_type VARCHAR(100) NOT NULL, -- 'user_registered', 'password_reset', 'promo', etc
  
  -- Destinatario
  user_id UUID NOT NULL REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  
  -- Plantilla
  template_id UUID NOT NULL REFERENCES email_templates(id),
  
  -- Variables dinámicas (JSON)
  variables JSONB DEFAULT '{}'::jsonb,
  
  -- Estado
  status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'sent' | 'failed' | 'skipped'
  
  -- Respuesta email service
  email_service_id VARCHAR(255), -- ID de Resend/SendGrid
  error_message TEXT,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'skipped'))
);

CREATE INDEX idx_marketing_events_type ON marketing_events(event_type);
CREATE INDEX idx_marketing_events_user ON marketing_events(user_id);
CREATE INDEX idx_marketing_events_status ON marketing_events(status);
CREATE INDEX idx_marketing_events_created ON marketing_events(created_at);
```

### 4.2 Tabla: marketing_event_mappings

```sql
-- Mapeo: event_type → plantilla default
CREATE TABLE marketing_event_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  event_type VARCHAR(100) NOT NULL UNIQUE, -- 'user_registered', etc
  template_id UUID NOT NULL REFERENCES email_templates(id),
  enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserts iniciales (mantener eventos actuales):
INSERT INTO marketing_event_mappings (event_type, template_id, enabled) VALUES
('user_registered', (SELECT id FROM email_templates WHERE code = 'welcome'), true),
('password_reset', (SELECT id FROM email_templates WHERE code = 'password_reset'), true),
('2fa_enabled', (SELECT id FROM email_templates WHERE code = '2fa_code'), true),
('verification_code', (SELECT id FROM email_templates WHERE code = 'verification'), true),
('promo_campaign', (SELECT id FROM email_templates WHERE code = 'promo'), true);

CREATE INDEX idx_mapping_event ON marketing_event_mappings(event_type);
```

### 4.3 Edge Function: dispatch_marketing_event

**Archivo: `/functions/dispatch-marketing-event.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const {
      event_type,
      user_id,
      email,
      template_id,
      variables = {}
    } = await req.json();

    // 1. Validar event_type (existe en mappings)
    const { data: mapping } = await supabase
      .from('marketing_event_mappings')
      .select('template_id')
      .eq('event_type', event_type)
      .eq('enabled', true)
      .single();

    if (!mapping) {
      return new Response(
        JSON.stringify({ error: `Event type ${event_type} not found` }),
        { status: 400 }
      );
    }

    // 2. Obtener plantilla
    const { data: template } = await supabase
      .from('email_templates')
      .select('subject, body_html')
      .eq('id', template_id || mapping.template_id)
      .single();

    if (!template) {
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { status: 404 }
      );
    }

    // 3. Reemplazar variables en plantilla
    let subject = template.subject;
    let bodyHtml = template.body_html;

    // Reemplazar {{ variable }} con valores reales
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(regex, String(value));
      bodyHtml = bodyHtml.replace(regex, String(value));
    });

    // 4. Guardar evento en BD (estado: pending)
    const { data: event, error: insertError } = await supabase
      .from('marketing_events')
      .insert({
        event_type,
        user_id,
        email,
        template_id: template_id || mapping.template_id,
        variables,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 5. Enviar email (Resend)
    let emailResponse;
    try {
      emailResponse = await resend.emails.send({
        from: 'noreply@dropcost.jariash.com',
        to: email,
        subject,
        html: bodyHtml
      });

      // 6. Actualizar estado a 'sent'
      await supabase
        .from('marketing_events')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          email_service_id: emailResponse.id
        })
        .eq('id', event.id);

      console.log(`✅ Email sent for ${event_type}:`, emailResponse.id);

      return new Response(
        JSON.stringify({
          success: true,
          event_id: event.id,
          email_id: emailResponse.id
        }),
        { status: 200 }
      );
    } catch (emailError) {
      // Error al enviar, marcar como 'failed'
      await supabase
        .from('marketing_events')
        .update({
          status: 'failed',
          error_message: String(emailError)
        })
        .eq('id', event.id);

      console.error(`❌ Failed to send email:`, emailError);
      throw emailError;
    }
  } catch (error) {
    console.error('Error in dispatch_marketing_event:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
```

---

## V. FASE 2: MIGRACIÓN TRIGGERS EXISTENTES (Staging)

### 5.1 Refactorizar: trigger_user_registered

**Antes (específico):**
```typescript
// Viejo trigger
auth.onUserCreated(async (user) => {
  await send_email_welcome(user.email, user.user_metadata);
});
```

**Después (genérico):**
```typescript
// Nuevo trigger - usar dispatch_marketing_event
auth.onUserCreated(async (user) => {
  await fetch('/functions/dispatch-marketing-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: 'user_registered',
      user_id: user.id,
      email: user.email,
      variables: {
        name: user.user_metadata?.full_name || 'Usuario',
        email: user.email,
        plan: 'free'
      }
    })
  });
});
```

### 5.2 Refactorizar: trigger_password_reset

**Antes:**
```typescript
// Trigger específico
password_reset_requested((user_id, token) => {
  send_password_reset_email(user_id, token);
});
```

**Después:**
```typescript
// Nuevo trigger genérico
password_reset_requested(async (user_id, token) => {
  const { data: user } = await supabase
    .from('auth.users')
    .select('email')
    .eq('id', user_id)
    .single();

  await fetch('/functions/dispatch-marketing-event', {
    method: 'POST',
    body: JSON.stringify({
      event_type: 'password_reset',
      user_id,
      email: user.email,
      variables: {
        reset_token: token,
        reset_link: `https://dropcost.jariash.com/reset?token=${token}`,
        email: user.email
      }
    })
  });
});
```

### 5.3 Refactorizar: trigger_verification_code

**Antes:**
```typescript
verification_requested((user_id, code) => {
  send_verification_email(user_id, code);
});
```

**Después:**
```typescript
verification_requested(async (user_id, code) => {
  const { data: user } = await supabase
    .from('auth.users')
    .select('email')
    .eq('id', user_id)
    .single();

  await fetch('/functions/dispatch-marketing-event', {
    method: 'POST',
    body: JSON.stringify({
      event_type: 'verification_code',
      user_id,
      email: user.email,
      variables: {
        verification_code: code,
        email: user.email
      }
    })
  });
});
```

### 5.4 Refactorizar: trigger_2fa_enabled

```typescript
// Similar pattern
two_fa_enabled(async (user_id, secret) => {
  const { data: user } = await supabase
    .from('auth.users')
    .select('email')
    .eq('id', user_id)
    .single();

  await fetch('/functions/dispatch-marketing-event', {
    method: 'POST',
    body: JSON.stringify({
      event_type: '2fa_enabled',
      user_id,
      email: user.email,
      variables: {
        email: user.email,
        setup_time: new Date().toISOString()
      }
    })
  });
});
```

---

## VI. FASE 3: NUEVAS CAMPAÑAS (Sin código)

### 6.1 Agregar Event Type (BD, sin código)

```sql
-- Insertar en marketing_event_mappings (solo SQL)
INSERT INTO marketing_event_mappings (event_type, template_id, enabled)
VALUES ('promo_black_friday', (SELECT id FROM email_templates WHERE code = 'promo_bf'), true);
```

### 6.2 Disparar Evento Manualmente (Marketing)

```typescript
// En admin/marketing: crear campañas manuales
async function launchPromoCampaign(promoName: string) {
  const users = await supabase
    .from('tiendas')
    .select('user_id, auth.users.email')
    .eq('plan', 'pro'); // Solo Pro users

  for (const user of users) {
    await fetch('/functions/dispatch-marketing-event', {
      method: 'POST',
      body: JSON.stringify({
        event_type: 'promo_black_friday',
        user_id: user.user_id,
        email: user.email,
        variables: {
          promo_name: promoName,
          discount: '30%',
          expiry_date: '2026-12-31'
        }
      })
    });
  }
}
```

---

## VII. CHECKLIST IMPLEMENTACIÓN (Fases)

### FASE 1: Infraestructura (1-2 horas)
- [ ] Tabla marketing_events creada
- [ ] Tabla marketing_event_mappings creada
- [ ] Edge Function dispatch_marketing_event implementada
- [ ] Inserts iniciales en mappings (5 eventos actuales)

### FASE 2: Migración Triggers (2-3 horas)
- [ ] Refactorizar trigger_user_registered
- [ ] Refactorizar trigger_password_reset
- [ ] Refactorizar trigger_verification_code
- [ ] Refactorizar trigger_2fa_enabled
- [ ] Test cada trigger en Staging

### FASE 3: Validación (1 hora)
- [ ] Registrar usuario de prueba → email llegue ✅
- [ ] Reset password → email llegue ✅
- [ ] 2FA code → email llegue ✅
- [ ] Verificar BD: tabla marketing_events con registros ✅
- [ ] Verificar que variables se reemplazan correctamente ✅

### FASE 4: Producción (30 min)
- [ ] Ejecutar script migración en Prod
- [ ] Desplegar código (main branch)
- [ ] Test: registrar usuario en Prod
- [ ] Monitorear marketing_events log
- [ ] ✅ LIVE

---

## VIII. TABLA RESUMEN

| Ítem | Antes | Después |
|------|-------|---------|
| **Triggers** | 5 específicos | 1 central genérico |
| **Código para nuevo evento** | Nuevo trigger (dev) | Solo SQL insert (no-code) |
| **Escalabilidad** | Baja | Alta |
| **Dowtime** | Mínimo (30 min) | 0 downtime |
| **Variables dinámicas** | Hardcoded | JSON flexible |
| **Auditoría** | Limitada | Completa (marketing_events log) |

---

## IX. TESTING STAGING

```
PROCEDIMIENTO:

1. Registrar usuario de prueba
   ├─ Usuario recibe email welcome
   ├─ Verificar tabla marketing_events
   └─ Status: 'sent' ✅

2. Reset password
   ├─ Usuario recibe email reset
   ├─ Verificar variables reemplazadas
   └─ Status: 'sent' ✅

3. 2FA code
   ├─ Usuario recibe email 2FA
   ├─ Código debe estar en email
   └─ Status: 'sent' ✅

4. Crear usuario referido
   ├─ Verificar que dispara correctamente
   └─ Email llega con variables ✅

5. Crear promo (nueva)
   ├─ Insertar en marketing_event_mappings (SQL)
   ├─ Disparar evento
   ├─ Email llega
   └─ Sin código ✅
```

---

## X. NOTAS IMPORTANTES

```
✅ MANTIENE FUNCIONALIDAD:
└─ Los usuarios reciben emails igual que antes
└─ Las plantillas siguen siendo las mismas
└─ SIN cambios para usuarios finales

✅ MEJORA ESCALABILIDAD:
└─ Marketing puede crear campañas sin dev
└─ Variables dinámicas en JSON
└─ Auditoría completa

⚠️ SIN DOWNTIME:
└─ Refactorizar en Staging
└─ Test completo
└─ Deploy a Prod (rápido)
└─ Rollback posible si algo falla
```

---

**DOCUMENTO LISTO PARA ANTIGRAVITY - REFACTORIZACIÓN RÁPIDA** ✅

**FASES (NO SEMANAS):**
1. Infraestructura Base (Staging) - 1-2 horas
2. Migración Triggers (Staging) - 2-3 horas
3. Validación Completa (Staging) - 1 hora
4. Deploy Producción (Prod) - 30 minutos

**TOTAL: ~4-5 horas de trabajo efectivo**

