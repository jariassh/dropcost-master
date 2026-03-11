# APÉNDICE: RF DROP ASSISTANT v2 - MONITOREO CUOTAS OLLAMA CLOUD

**Documento complementario a:** RF_DROP_ASSISTANT_v2_OLLAMA_CLOUD_INTEGRATION.md

---

## I. MONITOREO DE TOKENS OLLAMA

### Problema
Ollama Cloud NO expone endpoint público de cuota/límite.  
**Solución:** Trackear tokens manualmente en cada respuesta API.

---

## II. NUEVAS TABLAS BD (ADICIONES)

### Tabla: ollama_usage_log

```sql
CREATE TABLE ollama_usage_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,                  -- NULL si es operación interna
  operation VARCHAR(100) NOT NULL,   -- 'summarization', 'context_generation'
  
  -- Tokens extraídos de respuesta Ollama
  tokens_input INT DEFAULT 0,        -- prompt_tokens (entrada)
  tokens_output INT DEFAULT 0,       -- completion_tokens (salida)
  tokens_total INT DEFAULT 0,        -- total
  
  -- Metadata
  duration_ms INT DEFAULT 0,         -- tiempo respuesta (ms)
  status VARCHAR(20) DEFAULT 'success', -- 'success', 'error', 'rate_limited'
  error_message VARCHAR(500),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices para análisis
  INDEX (user_id, created_at),
  INDEX (operation, created_at),
  INDEX (created_at),
  INDEX (status)
);
```

**Ejemplo de registro:**
```
id | user_id | operation       | tokens_input | tokens_output | tokens_total | duration_ms | status  | created_at
1  | NULL    | summarization   | 1200         | 250           | 1450         | 1850        | success | 2026-03-10 15:30:00
2  | 5       | context_gen     | 800          | 180           | 980          | 1200        | success | 2026-03-10 15:31:00
3  | NULL    | summarization   | 950          | 220           | 1170         | 1600        | success | 2026-03-10 15:32:00
```

---

### Tabla: ollama_quota_alerts

```sql
CREATE TABLE ollama_quota_alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  alert_type ENUM(
    'session_warning',    -- 70% de cuota sesión
    'session_critical',   -- 90% de cuota sesión
    'weekly_warning',     -- 70% de cuota semanal
    'weekly_critical'     -- 90% de cuota semanal
  ) NOT NULL,
  
  tokens_used INT NOT NULL,
  tokens_limit INT NOT NULL,
  percent_used DECIMAL(5,2) NOT NULL,
  
  -- Notificación
  status ENUM('active', 'resolved', 'ignored') DEFAULT 'active',
  notified_admin BOOLEAN DEFAULT false,
  email_sent_to VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  
  INDEX (created_at),
  INDEX (status),
  INDEX (alert_type)
);
```

**Ejemplo de registro:**
```
id | alert_type        | tokens_used | tokens_limit | percent_used | status  | notified_admin | email_sent_to
1  | session_warning   | 14000       | 20000        | 70.00        | active  | true           | admin@dropcost.com
2  | weekly_critical   | 90000       | 100000       | 90.00        | resolved| true           | admin@dropcost.com
```

---

## III. SERVICIO DE TRACKING TOKENS

**File: `/src/lib/ollama-tracking-service.ts`**

```typescript
import db from '@/lib/db';

interface OllamaResponse {
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  response_time_ms: number;
}

/**
 * Log tokens consumidos en cada llamada Ollama
 */
export async function logOllamaUsage(
  operation: string,
  response: OllamaResponse,
  userId?: number,
  error?: string
): Promise<void> {
  const tokensInput = response.usage?.prompt_tokens || 0;
  const tokensOutput = response.usage?.completion_tokens || 0;
  const tokensTotal = tokensInput + tokensOutput;

  try {
    await db.insert('ollama_usage_log', {
      user_id: userId || null,
      operation,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      tokens_total: tokensTotal,
      duration_ms: response.response_time_ms || 0,
      status: error ? 'error' : 'success',
      error_message: error || null,
      created_at: new Date(),
    });
  } catch (e) {
    console.error('Error logging Ollama usage:', e);
  }
}

/**
 * Obtener estadísticas de uso (hoy/esta semana/este mes)
 */
export async function getOllamaUsageStats() {
  const now = new Date();
  const today = new Date(now.setHours(0, 0, 0, 0));
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [statsToday, statsWeek, statsMonth] = await Promise.all([
    db.query(
      `SELECT 
        SUM(tokens_total) as total_tokens,
        COUNT(*) as request_count,
        AVG(duration_ms) as avg_duration_ms
       FROM ollama_usage_log
       WHERE created_at >= ? AND status = 'success'`,
      [today]
    ),
    db.query(
      `SELECT 
        SUM(tokens_total) as total_tokens,
        COUNT(*) as request_count
       FROM ollama_usage_log
       WHERE created_at >= ? AND status = 'success'`,
      [thisWeek]
    ),
    db.query(
      `SELECT 
        SUM(tokens_total) as total_tokens,
        COUNT(*) as request_count
       FROM ollama_usage_log
       WHERE created_at >= ? AND status = 'success'`,
      [thisMonth]
    ),
  ]);

  return {
    today: {
      tokens: statsToday[0]?.total_tokens || 0,
      requests: statsToday[0]?.request_count || 0,
      avg_duration_ms: statsToday[0]?.avg_duration_ms || 0,
    },
    this_week: {
      tokens: statsWeek[0]?.total_tokens || 0,
      requests: statsWeek[0]?.request_count || 0,
    },
    this_month: {
      tokens: statsMonth[0]?.total_tokens || 0,
      requests: statsMonth[0]?.request_count || 0,
    },
  };
}

/**
 * Detectar si se alcanzó límite de cuota
 * IMPORTANTE: Ollama NO expone límites públicamente
 * Estos son ESTIMADOS basados en plan
 */
export async function checkQuotaStatus(): Promise<{
  session_tokens_used: number;
  session_limit_estimated: number; // Estimado
  session_percent: number;
  weekly_tokens_used: number;
  weekly_limit_estimated: number; // Estimado
  weekly_percent: number;
  needs_alert: boolean;
  alert_type?: string;
}> {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  const [sessionData, weeklyData] = await Promise.all([
    db.query(
      `SELECT SUM(tokens_total) as total_tokens FROM ollama_usage_log 
       WHERE created_at >= ? AND status = 'success'`,
      [twoHoursAgo]
    ),
    db.query(
      `SELECT SUM(tokens_total) as total_tokens FROM ollama_usage_log 
       WHERE created_at >= ? AND status = 'success'`,
      [fiveDaysAgo]
    ),
  ]);

  // ESTIMADOS (Ollama no publica estos números)
  // Ajustar según plan real (Free/Pro/Max)
  const SESSION_LIMIT_ESTIMATED = 50000; // 2 horas
  const WEEKLY_LIMIT_ESTIMATED = 500000; // 5 días

  const sessionTokens = sessionData[0]?.total_tokens || 0;
  const weeklyTokens = weeklyData[0]?.total_tokens || 0;

  const sessionPercent = (sessionTokens / SESSION_LIMIT_ESTIMATED) * 100;
  const weeklyPercent = (weeklyTokens / WEEKLY_LIMIT_ESTIMATED) * 100;

  let alertType = null;
  let needsAlert = false;

  // Detectar umbral de alerta
  if (sessionPercent >= 90) {
    alertType = 'session_critical';
    needsAlert = true;
  } else if (sessionPercent >= 70) {
    alertType = 'session_warning';
    needsAlert = true;
  } else if (weeklyPercent >= 90) {
    alertType = 'weekly_critical';
    needsAlert = true;
  } else if (weeklyPercent >= 70) {
    alertType = 'weekly_warning';
    needsAlert = true;
  }

  // Si hay alerta, registrar en BD
  if (needsAlert) {
    await db.insert('ollama_quota_alerts', {
      alert_type: alertType,
      tokens_used: Math.max(sessionTokens, weeklyTokens),
      tokens_limit:
        alertType.includes('session') ?
          SESSION_LIMIT_ESTIMATED :
          WEEKLY_LIMIT_ESTIMATED,
      percent_used:
        alertType.includes('session') ? sessionPercent : weeklyPercent,
      status: 'active',
      created_at: new Date(),
    });
  }

  return {
    session_tokens_used: sessionTokens,
    session_limit_estimated: SESSION_LIMIT_ESTIMATED,
    session_percent: Math.round(sessionPercent),
    weekly_tokens_used: weeklyTokens,
    weekly_limit_estimated: WEEKLY_LIMIT_ESTIMATED,
    weekly_percent: Math.round(weeklyPercent),
    needs_alert: needsAlert,
    alert_type: alertType,
  };
}
```

---

## IV. ENDPOINTS ADMIN

### GET /api/admin/ollama-usage

```typescript
// GET /api/admin/ollama-usage

import { getOllamaUsageStats, checkQuotaStatus } from '@/lib/ollama-tracking-service';

export async function GET(request: Request) {
  try {
    const stats = await getOllamaUsageStats();
    const quotaStatus = await checkQuotaStatus();

    return Response.json({
      usage_stats: stats,
      quota_status: quotaStatus,
      summary: {
        today_tokens: stats.today.tokens,
        this_month_tokens: stats.this_month.tokens,
        session_usage: `${quotaStatus.session_percent}%`,
        weekly_usage: `${quotaStatus.weekly_percent}%`,
        alert_active: quotaStatus.needs_alert,
        alert_type: quotaStatus.alert_type,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

**Response ejemplo:**
```json
{
  "usage_stats": {
    "today": {
      "tokens": 15000,
      "requests": 12,
      "avg_duration_ms": 1650
    },
    "this_week": {
      "tokens": 95000,
      "requests": 75
    },
    "this_month": {
      "tokens": 450000,
      "requests": 350
    }
  },
  "quota_status": {
    "session_tokens_used": 15000,
    "session_limit_estimated": 50000,
    "session_percent": 30,
    "weekly_tokens_used": 95000,
    "weekly_limit_estimated": 500000,
    "weekly_percent": 19,
    "needs_alert": false,
    "alert_type": null
  },
  "summary": {
    "today_tokens": 15000,
    "this_month_tokens": 450000,
    "session_usage": "30%",
    "weekly_usage": "19%",
    "alert_active": false,
    "alert_type": null
  }
}
```

---

## V. DASHBOARD KPI (ADMIN)

```
┌────────────────────────────────────────────┐
│ OLLAMA CLOUD USAGE MONITOR                 │
├────────────────────────────────────────────┤
│                                            │
│ TODAY:                                     │
│ ├─ Tokens: 15,000                         │
│ ├─ Requests: 12                           │
│ └─ Avg Duration: 1650ms                   │
│                                            │
│ THIS WEEK:                                 │
│ ├─ Tokens: 95,000                         │
│ └─ Requests: 75                           │
│                                            │
│ THIS MONTH:                                │
│ ├─ Tokens: 450,000                        │
│ └─ Requests: 350                          │
│                                            │
│ ─────────────────────────────────────────│
│                                            │
│ QUOTA STATUS:                              │
│                                            │
│ Session (2h window):                       │
│ ├─ Used: 15,000 / 50,000                  │
│ └─ Progress: ████████░░░░░░░░░░ 30%       │
│   Status: ✅ NORMAL                        │
│                                            │
│ Weekly (5d window):                        │
│ ├─ Used: 95,000 / 500,000                 │
│ └─ Progress: ████░░░░░░░░░░░░░░░░░ 19%    │
│   Status: ✅ NORMAL                        │
│                                            │
│ ─────────────────────────────────────────│
│                                            │
│ PROJECTED USAGE:                           │
│ ├─ Daily average: 15K tokens              │
│ ├─ Month projection: 450K tokens          │
│ ├─ Upgrade trigger: > 400K/month          │
│ └─ Current plan: Pro ($20/mes) ✅         │
│                                            │
│ ─────────────────────────────────────────│
│                                            │
│ ALERTS:                                    │
│ └─ None active ✅                         │
│                                            │
│ [Last 7 days chart] [Settings]             │
│                                            │
└────────────────────────────────────────────┘
```

---

## VI. ALERTAS AUTOMÁTICAS

```
CONDICIONES DE ALERTA:

Session (2h window):
├─ 70% → WARNING (amarillo)
│  └─ Notificar admin vía email
├─ 90% → CRITICAL (rojo)
│  └─ Notificar admin + sugerir upgrade
└─ 100% → BLOCKED (operación falla)

Weekly (5d window):
├─ 70% → WARNING (amarillo)
│  └─ Log en BD
├─ 90% → CRITICAL (rojo)
│  └─ Notificar admin
└─ 100% → BLOCKED (operación falla)

ACCIÓN CUANDO ALERTA:
1. Crear registro en ollama_quota_alerts
2. Enviar email a admin (si no ya enviado hoy)
3. Mostrar banner rojo en dashboard
4. Sugerir upgrade a plan superior
5. Opcionalmente: parar nuevas consultas (si 100%)
```

---

## VII. INTEGRACIÓN CON SERVICIO OLLAMA EXISTENTE

**En `/src/lib/ollama-service.ts` (modificar):**

```typescript
import { logOllamaUsage } from './ollama-tracking-service';

export async function summarizeThreadWithOllama(
  threadContext: ThreadContext
): Promise<{
  resumen: string;
  puntosClaves: string[];
  tokensAhorrados: number;
}> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/chat/completions`, {
      // ... llamada existente ...
    });

    const data = await response.json();

    // ✅ AGREGAR: Log tokens consumidos
    await logOllamaUsage(
      'summarization',
      {
        usage: {
          prompt_tokens: data.usage?.prompt_tokens || 0,
          completion_tokens: data.usage?.completion_tokens || 0,
        },
        response_time_ms: data.response_time_ms || 0,
      },
      userId, // pasar userId si disponible
      null // sin error
    );

    // ... resto de lógica existente ...
  } catch (error) {
    // Log error también
    await logOllamaUsage(
      'summarization',
      {
        usage: { prompt_tokens: 0, completion_tokens: 0 },
        response_time_ms: 0,
      },
      userId,
      error.message
    );
    throw error;
  }
}
```

---

## VIII. CHECKLIST ADICIONAL (Monitoreo)

- [ ] Crear tabla ollama_usage_log
- [ ] Crear tabla ollama_quota_alerts
- [ ] Crear /src/lib/ollama-tracking-service.ts
- [ ] Integrar logOllamaUsage() en ollama-service.ts
- [ ] Crear endpoint GET /api/admin/ollama-usage
- [ ] Crear dashboard KPI (admin)
- [ ] Implementar alertas email automáticas
- [ ] Testing: Verificar logs de tokens
- [ ] Testing: Verificar alertas (simular 90% quota)
- [ ] Documentar límites estimados (personalizar por plan)
- [ ] Setup email notificaciones (SendGrid/SMTP)

---

## IX. NOTAS IMPORTANTES

```
⚠️ LÍMITES ESTIMADOS (NO publicados por Ollama):
   └─ SESSION_LIMIT = 50,000 (2h window)
   └─ WEEKLY_LIMIT = 500,000 (5d window)
   └─ PERSONALIZAR según tu plan real

⚠️ OLLAMA NO expone endpoint de cuota:
   └─ Debe ser monitoreo manual
   └─ Basado en tokens en cada respuesta

✅ VENTAJAS del sistema:
   └─ Visibilidad total del uso
   └─ Alertas proactivas
   └─ Decisión informada para upgrade
   └─ Historial completo para análisis
```

---

**DOCUMENTO COMPLETO PARA ANTIGRAVITY - SOLO AGREGAR LO FALTANTE.** ✅

