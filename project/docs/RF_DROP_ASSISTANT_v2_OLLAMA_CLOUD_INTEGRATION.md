# REQUISITO FUNCIONAL: DROP ASSISTANT v2 - OLLAMA CLOUD INTEGRATION
**DropCost Master**  
**Estado:** Especificación de Mejora/Extensión  
**Fecha:** 10 de marzo de 2026  
**Criticidad:** ALTA - Optimization  
**Ámbito:** Extensión del RF DROP ASSISTANT existente

---

## I. PROPÓSITO

Este RF detalla la integración de **OLLAMA Cloud API** para mejorar la inteligencia contextual de DROP ASSISTANT SIN aumentar costos de tokens Gemini.

**NO es reemplazo** del RF DROP ASSISTANT anterior.  
**ES extensión/mejora** que Antigravity debe considerar para implementar lo faltante.

---

## II. PROBLEMA A RESOLVER

```
SITUACIÓN ACTUAL:
├─ Al pasar contexto largo a Gemini → muchos tokens input
├─ Conversaciones grandes → costos altos
├─ Usuario paga precio fijo, pero costo TÚ sube
├─ Márgenes se comprimen

SOLUCIÓN:
└─ Usar Ollama (gratis) para summarization + contexto
└─ Solo pasar contexto optimizado a Gemini
└─ Resultado: -70% tokens Gemini, misma calidad
```

---

## III. ARQUITECTURA OLLAMA CLOUD

### 3.1 Flujo General (Con Ollama)

```
USER PREGUNTA (En chat widget)
  ↓
SISTEMA RECUPERA:
├─ Thread conversación (BD)
├─ Datos costeo relevante
├─ Preferencias usuario (anónimo sí/no)
└─ Aprendizaje colectivo anónimo (si aplica)
  ↓
OLLAMA CLOUD (Summarization):
├─ Lee thread completo
├─ Lee aprendizaje colectivo anónimo
├─ Genera resumen contextual (200-300 tokens)
├─ COSTO: $0
└─ Salida: contexto optimizado
  ↓
GEMINI (solo si MENTOR):
├─ Recibe resumen Ollama
├─ Recibe pregunta actual
├─ Recibe datos costeo
├─ Genera respuesta
├─ Consume créditos (BAJO por contexto optimizado)
└─ COSTO: Créditos usuario
  ↓
RESPUESTA AL USUARIO
```

### 3.2 Modelo Ollama (Recomendado)

```
MODELO: mistral:7b (o llama2:7b)
├─ Tamaño: ~5GB
├─ Velocidad: Rápida
├─ Calidad: Excelente para summarization
├─ Costo: GRATIS (API Cloud)
└─ Ideal para: Spanish, context understanding

ALTERNATIVA: mixtral:8x7b (mejor calidad, más lento)
```

---

## IV. ROLES & DECISIONES OLLAMA vs GEMINI

**⚠️ IMPORTANTE: NO dañar lo implementado**

```
VERIFICACIÓN PREVIA:

✅ ¿Qué ya existe en plataforma?
└─ RF DROP ASSISTANT anterior menciona:
   ├─ Tabla agents (prompts dinámicos)
   ├─ Conversation_threads (BD)
   ├─ Consultas_anonimas (leads)
   ├─ User_credits & credit_transactions
   └─ Gemini integration básica

❌ ¿Qué FALTA?
└─ Ollama Cloud API integration
└─ Contexto summarization automática
└─ Aprendizaje colectivo anónimo (table)
└─ Management de thread lifecycle
└─ Seguridad: compartir datos anónimo (opt-in)

RECOMENDACIÓN:
No tocar lo existente. Solo AGREGAR:
├─ Tabla anonymous_learnings
├─ Tabla user_sharing_preferences
├─ Servicio Ollama summarization
├─ Lógica contexto optimization
└─ Prompts mejorados para Gemini
```

---

## V. ESPECIFICACIÓN DETALLADA

### 5.1 Nuevas Tablas BD

#### Tabla: ollama_usage_log (MONITOREO DE CUOTAS)
```sql
CREATE TABLE ollama_usage_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  operation VARCHAR(100) NOT NULL, -- 'summarization', 'context_generation'
  tokens_input INT DEFAULT 0,      -- prompt_tokens de respuesta Ollama
  tokens_output INT DEFAULT 0,     -- completion_tokens de respuesta Ollama
  tokens_total INT DEFAULT 0,      -- total tokens usados
  duration_ms INT DEFAULT 0,       -- tiempo respuesta
  error_occurred BOOLEAN DEFAULT false,
  error_message VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX (user_id, created_at),
  INDEX (operation, created_at),
  INDEX (created_at) -- Para análisis diario/semanal
);
```

**Ejemplos de registros:**
```json
{
  "user_id": null,
  "operation": "summarization",
  "tokens_input": 1200,
  "tokens_output": 250,
  "tokens_total": 1450,
  "duration_ms": 1850,
  "error_occurred": false
}

{
  "user_id": 5,
  "operation": "context_generation",
  "tokens_input": 800,
  "tokens_output": 180,
  "tokens_total": 980,
  "duration_ms": 1200,
  "error_occurred": false
}
```

---

#### Tabla: ollama_quota_alerts (Historial alertas)
```sql
CREATE TABLE ollama_quota_alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  alert_type ENUM('session_warning', 'session_critical', 'weekly_warning', 'weekly_critical') NOT NULL,
  tokens_used INT,
  tokens_limit INT,
  percent_used DECIMAL(5,2),
  status ENUM('active', 'resolved', 'ignored') DEFAULT 'active',
  notified_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  
  INDEX (created_at),
  INDEX (status)
);
```

---

#### Tabla: anonymous_learnings
```sql
CREATE TABLE anonymous_learnings (
  id UUID PRIMARY KEY,
  tipo_consulta VARCHAR(50), -- 'viabilidad', 'cpa', 'buyer_persona', 'estrategia_campaña'
  resumen_contexto TEXT, -- Info generalizada SIN datos sensibles
  niche VARCHAR(100), -- Electrónica, moda, etc (generalizado)
  rango_precio_producto INT, -- $10-50, $50-100 (rangos, no exacto)
  cpa_promedio DECIMAL(10,2), -- Promedio anónimo de CPAs
  margen_promedio DECIMAL(10,2), -- Promedio anónimo de márgenes
  pais VARCHAR(2), -- Generalizado (sin tienda específica)
  recomendaciones TEXT, -- Insights generales
  creado_por INT, -- User ID (solo para auditoría, NO en consulta)
  created_at TIMESTAMP,
  
  -- Seguridad: NO incluir
  -- ❌ nombre_tienda
  -- ❌ nombre_usuario
  -- ❌ nombre_producto
  -- ❌ email
  -- ❌ datos específicos de usuario
  
  INDEX (tipo_consulta, pais, created_at)
);
```

**Ejemplo de registro (SEGURO):**
```json
{
  "tipo_consulta": "viabilidad",
  "resumen_contexto": "Usuario en niche electrónica testea producto rango $50-100",
  "niche": "Electrónica",
  "rango_precio_producto": "50-100",
  "cpa_promedio": 15.50,
  "margen_promedio": 22.30,
  "pais": "CO",
  "recomendaciones": "En electrónica, CPA promedio es $15-20. Margen saludable 20%+"
}
```

#### Tabla: user_sharing_preferences
```sql
CREATE TABLE user_sharing_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  compartir_anonimo BOOLEAN DEFAULT false, -- Opt-in para aprendizaje colectivo
  tipos_datos_compartir SET('viabilidad', 'cpa', 'buyer_persona', 'estrategia'), -- Qué share
  fecha_opt_in TIMESTAMP NULL,
  creditos_regalo INT DEFAULT 0, -- Incentivo por compartir (ej: +10 créditos)
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Tabla: thread_summaries (Optimización)
```sql
CREATE TABLE thread_summaries (
  id UUID PRIMARY KEY,
  thread_id UUID NOT NULL,
  user_id INT NOT NULL,
  resumen_ollama TEXT, -- Generado por Ollama
  puntos_clave JSON, -- [{ tema, decisión }, ...]
  mensajes_count INT, -- Cuántos mensajes fueron resumidos
  tokens_ahorrados INT, -- Tokens Gemini evitados
  generated_at TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES conversation_threads(id),
  INDEX (thread_id, user_id)
);
```

---

### 5.2 OLLAMA Cloud API Integration

#### 5.2.1 Setup

```
REGISTRO OLLAMA:
1. Ir a: https://ollama.ai/
2. Sign up (gratis)
3. Generar API Key
4. Guardar en .env:
   OLLAMA_API_KEY=xxx
   OLLAMA_API_URL=https://api.ollama.ai/v1

MODELO:
├─ Descargar: mistral:7b
└─ O elegir otro en: https://ollama.ai/library

RATE LIMITS OLLAMA CLOUD:
├─ Session quota: Se resetea cada 2 horas
├─ Weekly quota: Se resetea cada 5 días
├─ Notification: Email automático cuando se acerca límite
└─ Plan (Free/Pro/Max): Determina cuota disponible

NOTA: Ollama NO expone endpoint público de cuota
      → TÚ debes monitorear tokens en cada respuesta
      → Implementar tracking manual (tabla BD)
```

#### 5.2.2 Servicio Ollama (Backend)

**File: `/src/lib/ollama-service.ts`**

```typescript
import Anthropic from "@anthropic-ai/sdk";

const OLLAMA_API_URL = process.env.OLLAMA_API_URL;
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;

interface ThreadContext {
  conversationHistory: { role: string; content: string }[];
  userPreferences?: { compartirAnonimo: boolean };
  costeoData?: { precio: number; cpa: number; margen: number };
}

/**
 * Resumir thread completo usando Ollama
 * @param threadContext - Contexto completo del thread
 * @returns Resumen optimizado (~200-300 tokens)
 */
export async function summarizeThreadWithOllama(
  threadContext: ThreadContext
): Promise<{
  resumen: string;
  puntosClaves: string[];
  tokensAhorrados: number;
}> {
  try {
    const systemPrompt = `
    Eres un asistente de summarización para DropCost Master.
    Tu objetivo: Crear resumen CONCISO de conversación dropshipper.
    
    REGLAS:
    1. Resumen máximo 300 tokens
    2. Identifica puntos clave (decisiones, preguntas, recomendaciones)
    3. Mantén contexto pero elimina repeticiones
    4. Preserve números (CPA, margen, precio)
    5. Lenguaje claro y directo
    
    FORMATO SALIDA:
    [RESUMEN]
    ...texto resumido...
    
    [PUNTOS_CLAVE]
    - Punto 1
    - Punto 2
    - Punto 3
    `;

    const userMessage = `
    Resumir esta conversación:
    ${JSON.stringify(threadContext.conversationHistory)}
    
    Datos costeo relevante: ${JSON.stringify(threadContext.costeoData || {})}
    `;

    const response = await fetch(`${OLLAMA_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral:7b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3, // Bajo para consistencia
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content;

    // Parse respuesta
    const resumenMatch = responseText.match(/\[RESUMEN\]([\s\S]*?)\[PUNTOS_CLAVE\]/);
    const puntosMatch = responseText.match(/\[PUNTOS_CLAVE\]([\s\S]*?)$/);

    const resumen = resumenMatch ? resumenMatch[1].trim() : responseText;
    const puntosClaves = puntosMatch
      ? puntosMatch[1]
          .trim()
          .split("\n")
          .filter((p) => p.startsWith("-"))
          .map((p) => p.replace(/^-\s*/, ""))
      : [];

    // Estimar tokens ahorrados
    const originalTokens = Math.ceil(
      JSON.stringify(threadContext.conversationHistory).length / 4
    );
    const resumenTokens = Math.ceil(resumen.length / 4);
    const tokensAhorrados = Math.max(0, originalTokens - resumenTokens);

    return {
      resumen,
      puntosClaves,
      tokensAhorrados,
    };
  } catch (error) {
    console.error("Ollama summarization error:", error);
    // Fallback: retornar últimos 3 mensajes sin resumir
    return {
      resumen: threadContext.conversationHistory
        .slice(-3)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n"),
      puntosClaves: [],
      tokensAhorrados: 0,
    };
  }
}

/**
 * Generar aprendizaje colectivo anónimo desde consulta
 */
export async function generateAnonymousLearning(
  consulta: {
    tipo: string;
    niche: string;
    precio: number;
    cpa: number;
    margen: number;
    pais: string;
  },
  userId: number
): Promise<object> {
  // Este insight se genera SIN exponer datos de usuario

  return {
    tipo_consulta: consulta.tipo,
    resumen_contexto: `Usuario en niche ${consulta.niche} consulta sobre producto precio $${consulta.precio}`,
    niche: consulta.niche,
    rango_precio_producto: `${Math.floor(consulta.precio / 50) * 50}-${Math.ceil(consulta.precio / 50) * 50}`,
    cpa_promedio: consulta.cpa,
    margen_promedio: consulta.margen,
    pais: consulta.pais,
    recomendaciones: `En ${consulta.niche}, CPA típico es $${consulta.cpa}. Margen ${consulta.margen}% es ${consulta.margen > 20 ? "saludable" : "ajustado"}`,
  };
}
```

---

### 5.3 Mejora Prompts Gemini (MENTOR)

**⚠️ NO reemplazar los existentes. AGREGAR contexto Ollama**

```
PROMPT MEJORADO PARA MENTOR (GEMINI):

CONTEXTO INYECTADO (del sistema, no del user):
1. Resumen Ollama del thread (300 tokens máx)
2. Puntos clave previos (conversación)
3. Datos costeo actual
4. Aprendizaje colectivo anónimo (si usuario optó)
5. Histórico de decisiones (resumido)

NUEVO SYSTEM PROMPT:

"Eres DROP ASSISTANT mentor financiero de dropshipping.

CONTEXTO DEL USUARIO:
${resumenOllama}

PUNTOS CLAVE PREVIOS:
${puntosClaves.join('\n')}

DATOS COSTEO ACTUAL:
- Precio: $X
- CPA: $Y
- Margen: Z%

APRENDIZAJE COLECTIVO (anónimo, si user autorizó):
${aprendizajeColectivo || 'Usuario NO autorizó compartir'}

INSTRUCCIONES:
1. Mantener coherencia con puntos clave previos
2. Basarse en contexto resumido (no abrumar)
3. Mencionar aprendizaje colectivo si es relevante
4. Siempre explicar EL POR QUÉ
5. Recomendaciones accionables
6. Si datos insuficientes → pedir clarificación
7. NO repetir lo ya discutido (está en puntos clave)"
```

---

### 5.4 Flujo Conversation Thread (Completo)

```
USER ABRE CHAT → PREGUNTA MENTORÍA
  ↓
SISTEMA DETECTA:
├─ user_id
├─ tienda_id
├─ tipo = "mentoría"
├─ tema (viabilidad, CPA, buyer_persona, etc)
└─ conversation_thread existente? SÍ/NO
  ↓
IF THREAD EXISTE:
├─ Consulta BD: conversation_threads (todas mensajes)
├─ Consulta BD: thread_summaries (si existe)
│  └─ IF NO existe → generar con Ollama
│
├─ Ollama resume completo thread
│  └─ Output: resumen + puntos_clave + tokens_ahorrados
│
├─ Guardar en thread_summaries (cache)
│
└─ Continuar a GEMINI
  
ELSE IF THREAD NUEVO:
├─ Crear conversation_threads entry
└─ Pasar solo pregunta (sin contexto previo)
  
GEMINI:
├─ Recibe: system_prompt (con Ollama context)
├─ Recibe: resumen_ollama
├─ Recibe: pregunta_actual
├─ Recibe: datos_costeo
├─ Calcula tokens input (optimizado)
├─ Responde
├─ Deducir créditos (según tokens reales)
└─ Guardar en conversation_threads
  
DATOS ANÓNIMOS (OPT-IN):
├─ IF user.compartir_anonimo = true
│  └─ Generar anonymous_learning
│  └─ Guardar sin datos sensibles
│  └─ Agregar +10 créditos regalo (incentivo)
└─ ELSE: Solo guardar thread privado
```

---

### 5.5 Leads Anónimos (Landing) - Con Ollama

```
LEAD ABRE CHAT (Landing, sin registro)
  ↓
MUESTRA FORMULARIO:
├─ Nombre
├─ Teléfono (con IP API país)
└─ Email
  ↓
CLICK "Continuar"
  ↓
CREAR: consultas_anonimas entry
  ↓
CHAT ABIERTO (SELLER role - Ollama)
  ↓
CONVERSACIÓN OCURRE (guardar en BD)
  ↓
TIMEOUT 30 MIN (sin mensajes)
  └─ Thread cierra automático
  
---

LEAD RETORNA (después 30+ min)
  ↓
SISTEMA DETECTA:
├─ Email en formulario
├─ Teléfono en formulario
├─ Buscar en BD: consultas_anonimas (match)
│  └─ IF match por email O teléfono → VINCULAR
│  └─ IF NO match → crear nuevo entry
  
IF VINCULADO A ENTRY ANTERIOR:
├─ Recuperar conversaciones previas
├─ Ollama resume threads previos
├─ Contexto: "Hola de nuevo. Veo que ya hablamos de X"
├─ Continuar conversación con contexto (Ollama)
└─ Guardar como nuevo thread en misma entrada

RESULTADO:
└─ Admin ve: Lead X, conversaciones múltiples, historial completo
   (Ollama mantiene coherencia entre sesiones)
```

---

## VI. SEGURIDAD & PRIVACIDAD (CRÍTICO)

### 6.1 Datos a NUNCA compartir (Anonymous Learning)

```
❌ PROHIBIDO:
├─ Nombre tienda
├─ Nombre usuario
├─ Nombre producto específico
├─ Email
├─ Teléfono
├─ ID usuarios
├─ Marcas exactas
├─ Márgenes exactos (solo rangos)
├─ CPAs exactos (solo promedios)
├─ Descripciones detalladas de productos
└─ Datos de ubicación específica (solo país)

✅ PERMITIDO (Anónimo):
├─ Niche generalizado (Electrónica, Moda, Salud)
├─ Rango precio ($50-100, no $87.32)
├─ Rango CPA (promedio $15-20, no $15.57)
├─ Rango margen (20-30%, no exacto)
├─ País (CO, MX, EC - no ciudad)
├─ Tipo consulta (viabilidad, CPA, estrategia)
└─ Insights generales ("En electrónica, típico es...")
```

### 6.2 Opt-in Explícito

```
CONFIGURACIÓN USUARIO:
┌──────────────────────────────────────────┐
│ PRIVACIDAD & APRENDIZAJE COLECTIVO      │
├──────────────────────────────────────────┤
│                                          │
│ ☐ Compartir datos de forma anónima      │
│                                          │
│ Si habilitas:                            │
│ ✓ Tus datos financieros ayudan a        │
│   otros dropshippers                     │
│ ✓ Ganas +10 créditos gratis             │
│ ✓ NO se comparten nombres, emails,      │
│   productos, tiendas                    │
│ ✓ Solo datos generalizados (niche,      │
│   rangos, promedios)                    │
│                                          │
│ [Aceptar] [Saber más]                   │
│                                          │
└──────────────────────────────────────────┘

TECH:
├─ user_sharing_preferences.compartir_anonimo = true/false
├─ Solo si TRUE → generar anonymous_learning
├─ Audit log: creado_por (para compliance)
└─ User puede cambiar en cualquier momento
```

---

## VII. QUERY OPTIMIZATION

```
ÍNDICES RECOMENDADOS:

conversation_threads:
└─ INDEX (user_id, tipo, created_at)
└─ INDEX (user_id, tienda_id, status)

thread_summaries:
└─ INDEX (thread_id)
└─ INDEX (user_id, generated_at)

anonymous_learnings:
└─ INDEX (tipo_consulta, pais, created_at)
└─ INDEX (niche, created_at)

consultas_anonimas (existente):
└─ UNIQUE INDEX (email, telefono) - IMPORTANTE
   (para vincular threads posteriores)
```

---

## VIII. ENDPOINTS API (Nuevos o Modificados)

```
POST /api/chat/mentor
├─ Input: { user_id, thread_id, pregunta, tienda_id }
├─ Lógica:
│  1. Recuperar thread anterior
│  2. Llamar summarizeThreadWithOllama()
│  3. Pasar contexto a Gemini
│  4. Deducir créditos
│  5. Guardar en conversation_threads
│  6. Si compartir_anonimo=true → generar anonymous_learning
└─ Output: { respuesta, creditos_consumidos }

GET /api/threads/:thread_id
├─ Recuperar thread + summary + puntos clave
└─ (Usuario puede revisar contexto de resúmenes)

GET /api/user/:user_id/sharing-preferences
├─ Verificar estado compartir anónimo
├─ Mostrar créditos regalados
└─ Opción para cambiar settings

POST /api/user/:user_id/sharing-preferences
├─ Actualizar opt-in
├─ Si first time TRUE → agregar +10 créditos
└─ Registrar en user_sharing_preferences
```

---

## IX. NOTAS PARA ANTIGRAVITY

### 9.1 QUÉ NO TOCAR (YA IMPLEMENTADO)

```
✅ Mantener como está:
├─ Tabla agents (prompts)
├─ Tabla conversation_threads (estructura básica)
├─ Tabla consultas_anonimas (estructura básica)
├─ Tabla user_credits & credit_transactions
├─ Chat widget UI (flotante, minimizable)
├─ Scope detection automática
├─ Formulario contacto landing
├─ Gemini integration básica
└─ Sistema de créditos (1 cred = $0.05)

ADVERTENCIA:
No modificar:
❌ user_credits deduction logic
❌ credit_transactions logging
❌ Mercado Pago integration
❌ Tabla agents estructura
```

### 9.2 QUÉ AGREGAR (ESTE RF)

```
✅ Implementar:
├─ Ollama Cloud API integration
├─ Servicio summarizeThreadWithOllama()
├─ Tabla anonymous_learnings (nueva)
├─ Tabla user_sharing_preferences (nueva)
├─ Tabla thread_summaries (cache, nueva)
├─ Lógica contexto optimization
├─ Prompts mejorados (AGREGAR a agents, no reemplazar)
├─ Opt-in UI para compartir datos
├─ Endpoints API nuevos
└─ Indices BD para optimización

MODIFICAR:
├─ Endpoint /api/chat/mentor 
│  └─ AGREGAR lógica Ollama before Gemini
└─ Conversation_threads schema
   └─ AGREGAR campo: aprendizaje_colectivo_incluido (boolean)
```

### 9.3 Variables Entorno (Agregar)

```
.env:
├─ OLLAMA_API_KEY=xxxxx
├─ OLLAMA_API_URL=https://api.ollama.ai/v1
├─ OLLAMA_MODEL=mistral:7b
└─ OLLAMA_TIMEOUT=30000 (ms)
```

---

## X. BENEFICIOS FINALES

```
ANTES (sin Ollama):
├─ Conversación 20 mensajes → 5000 tokens input
├─ Costo Gemini: $0.075 por respuesta
├─ User paga: 5 créditos = $0.25
└─ TÚ pierdes: $0.15 por consulta

DESPUÉS (con Ollama):
├─ Ollama resume 20 mensajes → 300 tokens
├─ Gemini recibe: 300 + 200 = 500 tokens input
├─ Costo Gemini: $0.015 por respuesta
├─ User paga: 1 crédito = $0.05
└─ TÚ ganas: $0.035 por consulta (+233%)

ESCALA (100 usuarios, 10 consultas/mes):
├─ SIN Ollama: 1000 consultas × -$0.15 = -$150/mes
└─ CON Ollama: 1000 consultas × +$0.035 = +$35/mes
   └─ DIFERENCIA: +$185/mes adicional
```

---

## XI. TIMELINE (INDICATIVO)

```
FASE 1: Setup Ollama Cloud (1 día)
├─ Generar API Key
├─ Configurar .env
├─ Crear servicio summarizeThreadWithOllama()

FASE 2: BD + Tablas (1 día)
├─ Crear anonymous_learnings
├─ Crear user_sharing_preferences
├─ Crear thread_summaries
├─ Agregar índices

FASE 3: Lógica Contexto (2-3 días)
├─ Endpoint /api/chat/mentor (modificado)
├─ Integrar Ollama before Gemini
├─ Deducción de créditos optimizada
├─ Anonymous learning generation

FASE 4: UI & Testing (1-2 días)
├─ Opt-in UI para compartir datos
├─ Testing de threads + resúmenes
├─ Validar seguridad (no exponer datos)
└─ Load testing Ollama API

TOTAL: 5-7 días (con focus)
```

---

## XII. CHECKLIST IMPLEMENTATION

- [ ] Registrar en Ollama Cloud
- [ ] Generar API Key + guardar .env
- [ ] Crear /src/lib/ollama-service.ts
- [ ] Crear tabla anonymous_learnings
- [ ] Crear tabla user_sharing_preferences
- [ ] Crear tabla thread_summaries
- [ ] Implementar summarizeThreadWithOllama()
- [ ] Implementar generateAnonymousLearning()
- [ ] Modificar /api/chat/mentor (agregar Ollama)
- [ ] Agregar índices BD
- [ ] Crear UI opt-in compartir datos
- [ ] Testing: threads con Ollama
- [ ] Testing: anonymous learning (sin exponer datos)
- [ ] Testing: deducción créditos (con contexto optimizado)
- [ ] Load testing Ollama API
- [ ] Documentar para admin
- [ ] Deploy a producción

---

## XIII. REFERENCIAS

**RF Anterior:** RF_DROP_ASSISTANT_SISTEMA_COMPLETO.md (NO reemplazar)

**Áreas Existentes (NO tocar):**
- Chat widget UI
- Gemini API basic integration
- Credit system
- Scope detection

**Áreas a Extender:**
- Conversation storage (agregar contexto Ollama)
- Prompt engineering (mejorar con contexto)
- User experience (opt-in privacidad)

---

**DOCUMENTO LISTO PARA ANTIGRAVITY.** ✅

Este RF es EXTENSIÓN, no reemplazo. Antigravity debe usar esto para identificar lo faltante e implementar sin modificar lo ya existente.

