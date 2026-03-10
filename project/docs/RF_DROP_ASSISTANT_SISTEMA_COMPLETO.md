# REQUISITO FUNCIONAL: DROP ASSISTANT - SISTEMA COMPLETO
**DropCost Master**  
**Estado:** Especificación Activa  
**Fecha:** 10 de marzo de 2026  
**Criticidad:** CRÍTICA - Core Feature  
**Fases:** 3 (MVP Quick Deploy)

---

## I. DESCRIPCIÓN GENERAL

DROP ASSISTANT es un asistente IA multi-rol que proporciona soporte técnico (gratis) y mentoría financiera (de pago con créditos) a usuarios en diferentes contextos de la plataforma.

**Objetivo:** Acompañamiento completo al dropshipper desde el primer contacto (landing) hasta mentoría avanzada (simulador), minimizando tickets de soporte y maximizando conversión.

**Scope MVP:**
- Asistente flotante en toda la plataforma
- 3 roles automáticos (SELLER landing, SUPPORT app, MENTOR mentoría)
- Sistema de créditos para mentoría
- Knowledge Base interna (admin-only)
- Almacenamiento de conversaciones

---

## II. ARQUITECTURA GENERAL

```
┌──────────────────────────────────────────────────────┐
│                  DROP ASSISTANT                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  CHAT WIDGET (Flotante, fixed bottom-right)         │
│  ├─ Landing (sin registro)                          │
│  │  └─ ROL: SELLER                                  │
│  │  └─ Requiere: Formulario contacto (obligatorio)  │
│  │  └─ Almacena: consultas_anonimas                 │
│  │                                                   │
│  ├─ App (registrado, sin plan)                      │
│  │  └─ ROL: SOPORTE (gratis)                        │
│  │  └─ Almacena: conversation_threads               │
│  │                                                   │
│  ├─ App (registrado, con plan)                      │
│  │  ├─ ROL: SOPORTE (gratis) - Preguntas técnicas   │
│  │  └─ ROL: MENTOR (créditos) - Mentoría financiera │
│  │  └─ User elige: "¿Soporte o Mentoría?"           │
│  │  └─ Almacena: conversation_threads               │
│  │                                                   │
│  └─ Prompts dinámicos desde BD (agents table)       │
│                                                      │
│  BACKEND:                                            │
│  ├─ Gemini API (procesamiento)                      │
│  ├─ Knowledge Base (consulta KB interna)            │
│  ├─ Detección scope (automática)                    │
│  ├─ Sistema de créditos (deducción automática)      │
│  └─ Storage conversaciones                          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## III. FASES IMPLEMENTACIÓN

### FASE 1: KNOWLEDGE BASE (1-2 días)
- Crear página interna KB (admin-only)
- Documentar todas funcionalidades
- Agente consulta KB al responder

### FASE 2: DROP ASSISTANT FLOTANTE (3-4 días)
- Chat widget en toda app
- Formulario contacto (landing)
- Prompts dinámicos desde BD
- Scope detection automático

### FASE 3: WALLET + CRÉDITOS (2-3 días)
- Tabla user_credits
- Deducción automática
- Integración Mercado Pago
- Pricing: 1 cred = $0.05

---

## IV. ESPECIFICACIÓN DETALLADA

### 4.1 FORMULARIO CONTACTO (Landing)

**Ubicación:** Chat widget landing (primer paso antes de chat)

**Campos Obligatorios:**
```
┌─────────────────────────────────────────┐
│ ¡Hola! Para continuar, necesitamos:     │
├─────────────────────────────────────────┤
│                                         │
│ Nombre Completo                         │
│ [Input: 50 chars]                       │
│                                         │
│ Teléfono WhatsApp                       │
│ [País selector] [+57] [Número]          │
│ Pre-rellenado: País desde IP API        │
│                                         │
│ Correo Electrónico                      │
│ [Input: email válido]                   │
│                                         │
│ ☐ Acepto la Política de Privacidad      │
│   [Link → /politica-privacidad]         │
│                                         │
│ [Continuar] (deshabilitado si no acepta)│
│                                         │
└─────────────────────────────────────────┘
```

**Validaciones:**
- Nombre: mínimo 3 caracteres
- Teléfono: mínimo 7 dígitos, máximo 15
- Email: formato válido
- Política privacidad: checkbox obligatorio
- IP API: detecta país automático

**Almacenamiento:**
```sql
TABLE: consultas_anonimas
- id (UUID)
- nombre (VARCHAR 50)
- telefono (VARCHAR 20)
- email (VARCHAR 100)
- pais (VARCHAR 2) -- Detectado IP API
- conversacion (TEXT) -- JSON array de mensajes
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Flujo:**
1. User hace click chat widget
2. Ve formulario contacto
3. Completa datos
4. Click [Continuar]
5. Crear registro consultas_anonimas
6. Abrir chat widget (mismo ID)
7. Cargar ROL SELLER
8. Iniciar conversación

---

### 4.2 AGENTES & PROMPTS (BD)

**Tabla: agents**
```sql
CREATE TABLE agents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  scope VARCHAR(50) NOT NULL, -- 'landing', 'app_registrado', 'app_suscrito'
  prompt_personalidad TEXT NOT NULL,
  prompt_objetivo_flujo TEXT NOT NULL,
  prompt_reglas TEXT NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Agentes por defecto:**

#### AGENTE 1: SELLER (Landing)
```
ID: 1
Scope: landing
Status: active

PROMPT 1 (Personalidad):
"Eres DROP ASSISTANT, mentor de dropshipping en DropCost Master.
Tu objetivo: Entender dolor del visitante, educarlo sobre DropCost,
guiarlo a registrarse.

Tono: Experto, empático, accesible, consultivo (no pushy).
Lenguaje: Español coloquial, directo.
Personalidad: Mentor experimentado, entiende desafíos dropshipping."

PROMPT 2 (Objetivo & Flujo):
"OBJETIVO: Convertir visitante en usuario registrado.

FLUJO CONVERSACIONAL:
1. DETECT: ¿Cuál es su principal desafío en dropshipping?
2. EDUCATE: Mostrar cómo DropCost resuelve ese dolor
3. HIGHLIGHT: Mencionar simulador, análisis viabilidad, mentor IA
4. GUIDE: CTA → [Registrarse] (con afiliado oculto si aplica)
5. CLOSE: Siempre agregar valor (tip, insight)

FEATURES A MENCIONAR (si es relevante):
- Simulador de viabilidad (dice si producto es viable)
- Calculador CPA (máximo que puedes gastar en ads)
- Creador de ofertas (3 estrategias probadas)
- Mentor IA financiero (análisis de campañas)
- Sistema referidos 20% comisión"

PROMPT 3 (Reglas Estrictas):
"SCOPE:
✅ Preguntas sobre: DropCost, dropshipping, e-commerce, viabilidad, campañas
❌ No responder: Política, religión, medicina, temas fuera dropshipping

REFUSAL:
Si pregunta fuera scope → 'Esa pregunta está fuera mi expertise. 
Pero cuéntame: ¿tienes dudas sobre DropCost?'

RESTRICCIONES:
- Nunca inventar features (solo las reales)
- Nunca garantizar resultados
- Si no sabes → 'Excelente pregunta, déjame verificar'
- Mantener conversación breve (landing es anónimo, focus en conversión)
- Máximo 5 mensajes antes de CTA"
```

#### AGENTE 2: SUPPORT (App registrado, todas áreas)
```
ID: 2
Scope: app_registrado
Status: active

PROMPT 1 (Personalidad):
"Eres DROP ASSISTANT especialista en soporte técnico de DropCost.
Tu objetivo: Resolver dudas de usuario sobre funcionamiento plataforma.

Tono: Técnico, directo, helpful, paciente.
Lenguaje: Español técnico pero accesible.
Personalidad: Especialista técnico confiable."

PROMPT 2 (Objetivo & Flujo):
"OBJETIVO: Resolver dudas técnicas sobre plataforma.

FLUJO:
1. Entender exactamente qué pregunta/problema tiene
2. Consultar KNOWLEDGE BASE (KB interna)
3. Dar respuesta clara con pasos si es necesario
4. Confirmación: ¿se resolvió?
5. Si no → escalación a ticket

RESPONSE STYLE:
- Paso a paso
- Incluir screenshots/instrucciones si aplica
- Confirmar resolución"

PROMPT 3 (Reglas Estrictas):
"SCOPE:
✅ Preguntas técnicas: 'Cómo crear costeo', 'dónde descargar', 
   'error en X', 'cómo funciona Y', 'no me aparece Z'
❌ No responder: Mentoría financiera, análisis de viabilidad, 
   estrategia campañas (son MENTOR role)

LIMITS:
- Este soporte NO cuesta créditos
- Si user pregunta mentoría → sugerir cambiar a rol MENTOR
- Si no encuentra en KB → crear ticket automáticamente"
```

#### AGENTE 3: MENTOR (App suscrito, mentoría)
```
ID: 3
Scope: app_suscrito_mentoría
Status: active

PROMPT 1 (Personalidad):
"Eres DROP ASSISTANT mentor financiero de dropshipping.
Tu objetivo: Guiar al usuario en decisiones financieras, viabilidad,
estrategia campañas.

Tono: Experto, confiable, analítico.
Lenguaje: Español técnico, preciso.
Personalidad: Mentor financiero experimentado, no complaciente."

PROMPT 2 (Objetivo & Flujo):
"OBJETIVO: Proporcionar mentoría de alto valor en análisis financiero
y estrategia de campañas.

CONTEXTO INYECTADO (obtener de costeo actual):
- Producto, precio, país, tienda, niche
- CPA actual, margen neto
- Buyer persona
- Viabilidad (de simulador)

RESPUESTAS ESPERADAS:
- Análisis viabilidad: 'Viable/No viable porque...'
- Estrategia CPA: 'Máximo CPA recomendado: $X porque...'
- Buyer persona: Detallado (edad, poder adquisitivo, dispositivo, etc)
- Configuración campaña: Presupuesto, hooks AIDA/PAS, creativos, 
  schedule, escalamiento
- Optimización: Tácticas específicas para bajar CPA/aumentar ROAS

TOKENS CONSUMIDOS (automático):
- Respuesta rápida: 1 crédito
- Respuesta moderada: 4 créditos
- Research (investigación externa): 9 créditos"

PROMPT 3 (Reglas Estrictas):
"SCOPE:
✅ Mentoría: Viabilidad, CPA, buyer persona, estrategia campañas,
   optimización, análisis de rentabilidad
❌ Soporte técnico (ir a SUPPORT role)
❌ Garantías (decir 'recomendamos' no 'garantizamos')

RESPUESTAS:
- Siempre basadas en números reales (margen, CPA, etc)
- Recomendaciones accionables (no genéricas)
- Explicar EL POR QUÉ de cada recomendación

LÍMITES:
- Si no tiene créditos suficientes → mostrar costo
  'Esta consulta cuesta 9 créditos. Tienes: X. ¿Continuar?'
- Sin créditos → sugerir comprar bundle"
```

---

### 4.3 KNOWLEDGE BASE INTERNA

**Ubicación:** `/admin/knowledge-base` (admin-only)

**Estructura:**
```
/admin/knowledge-base/
├─ /simulador/
│  ├─ Cómo funciona viability
│  ├─ Matriz escalamiento explicada
│  ├─ CPA cálculo paso a paso
│  ├─ Margen bruto operativo (MBO)
│  └─ Troubleshooting
├─ /ofertas/
│  ├─ Las 3 estrategias (AIDA, PAS, otra)
│  ├─ Mejores prácticas
│  ├─ Copy templates
│  └─ Ejemplos reales
├─ /campañas/
│  ├─ Buyer personas por niche/país
│  ├─ Configuración Meta recomendada
│  ├─ Hooks que funcionan
│  ├─ Schedule optimal
│  ├─ Creativos (imagen, carrusel, reel)
│  └─ Escalamiento progresivo
├─ /plataforma/
│  ├─ Guía usuario completa
│  ├─ FAQs
│  ├─ Errores comunes + soluciones
│  ├─ Dashboard features
│  └─ Settings & configuraciones
├─ /créditos/
│  ├─ Cómo funcionan créditos
│  ├─ Pricing ($0.05 por crédito)
│  ├─ Cómo comprar
│  ├─ Tipos de consulta (rápida, moderada, research)
│  └─ Bundles disponibles
└─ /referidos/
   ├─ Programa 20% comisión
   ├─ Cómo invitar
   ├─ Cómo rastrear comisiones
   └─ Payout process
```

**Formato:** Markdown (fácil editar)

**Acceso:**
- Admin: Lectura + escritura
- DROP ASSISTANT: Solo lectura (consultar)

**Uso por agente:**
- SELLER: Consulta `/plataforma/features` + `/créditos/`
- SUPPORT: Consulta `/plataforma/` + `/campañas/`
- MENTOR: Consulta todas secciones (especialmente `/simulador/`, `/campañas/`)

---

### 4.4 CHAT WIDGET (UI)

**Ubicación:** Fixed bottom-right, todas páginas

```
┌─────────────────────────────────┐
│ 💬 DROP ASSISTANT               │ ← Header (minimizable)
├─────────────────────────────────┤
│                                 │
│ [Conversación scroll]           │
│                                 │
│ Agent: Hola, ¿cómo puedo ayudar?│
│ User: Tengo dudas sobre CPA     │
│                                 │
│ [Si MENTOR & sin créditos]      │
│ Agent: Esta consulta cuesta     │
│ 9 créditos. ¿Continuar?         │
│ [Sí] [Comprar créditos]         │
│                                 │
├─────────────────────────────────┤
│ [Input] "Pregunta lo que sea"   │
│ [Enviar]                        │
│                                 │
│ [Minimizar ↓]                   │
└─────────────────────────────────┘

[Si minimizado: botón flotante redondo]
┌─────┐
│ 💬  │ ← Click para abrir chat
└─────┘
```

**Responsividad:**
- Desktop: Widget fijo 350px ancho
- Mobile: Widget 90vw ancho, ajusta altura
- Tablet: Widget 400px ancho

---

### 4.5 SCOPE DETECTION (Automático)

```javascript
LÓGICA DETECCIÓN:

if (!user_logged_in) {
  // Landing
  scope = "landing"
  agent = SELLER
  show_form = true // Formulario contacto obligatorio
  
} else if (user_logged_in && !subscription_active) {
  // Registrado sin plan
  scope = "app_registrado"
  agent = SUPPORT
  show_form = false
  cost = "gratis"
  
} else if (user_logged_in && subscription_active) {
  // Suscrito
  scope = "app_suscrito"
  
  // Mostrar selector: ¿Soporte o Mentoría?
  show_role_selector = true
  
  if (user_selects === "soporte") {
    agent = SUPPORT
    cost = "gratis"
    
  } else if (user_selects === "mentoría") {
    agent = MENTOR
    cost = "créditos"
    check_credits()
  }
}

// Cargar prompts de BD basado en scope + role
prompts = DB.query(
  SELECT prompt_personalidad, 
         prompt_objetivo_flujo, 
         prompt_reglas 
  FROM agents 
  WHERE scope = scope AND status = 'active'
)
```

---

### 4.6 SISTEMA DE CRÉDITOS

**Tabla: user_credits**
```sql
CREATE TABLE user_credits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  available_credits INT DEFAULT 0,
  total_spent_usd DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Tabla: credit_transactions**
```sql
CREATE TABLE credit_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('purchase', 'usage', 'refund') NOT NULL,
  credits_amount INT NOT NULL,
  cost_usd DECIMAL(10,2),
  consultation_type VARCHAR(50), -- 'rápida', 'moderada', 'research'
  mercado_pago_transaction_id VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX (user_id, created_at)
);
```

**Pricing por tipo consulta:**

| Tipo | Tokens | Créditos | Precio USD | Cost TÚ | Markup |
|------|--------|----------|-----------|---------|--------|
| Rápida | 500 | 1 | $0.05 | $0.015 | 3.3x |
| Moderada | 1800 | 4 | $0.20 | $0.054 | 3.7x |
| Research | 3500 | 9 | $0.45 | $0.105 | 4.3x |

**Bundles (Mercado Pago):**
```
5 créditos: $0.25 (vs $0.25 suelto)
10 créditos: $0.40 (vs $0.50 suelto) ↓ 20%
20 créditos: $0.70 (vs $1.00 suelto) ↓ 30%
50 créditos: $1.50 (vs $2.25 suelto) ↓ 33%
100 créditos: $2.50 (vs $4.50 suelto) ↓ 44%
```

**Flujo deducción:**
```
1. User completa pregunta mentoría
2. Sistema detecta tipo (rápida/moderada/research)
3. Muestra: "Esta consulta cuesta X créditos. ¿Continuar?"
4. User confirma
5. Deducir créditos de user_credits
6. Crear transaction record
7. Responder con Gemini
8. Si insuficientes → sugerir comprar bundle
```

---

### 4.7 ALMACENAMIENTO CONVERSACIONES

**Landing (anónimo):**
```sql
TABLE: consultas_anonimas
- Almacenar en JSON array
- No persistente (user no regresa)
- Para análisis retroalimentación
```

**App (registrado/suscrito):**
```sql
TABLE: conversation_threads
CREATE TABLE conversation_threads (
  id UUID PRIMARY KEY,
  user_id INT NOT NULL,
  tienda_id INT,
  tipo ENUM('soporte', 'mentoría') NOT NULL,
  conversacion JSON, -- Array de {role, content, timestamp}
  total_credits_used INT DEFAULT 0,
  status ENUM('active', 'closed') DEFAULT 'active',
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX (user_id, created_at)
);

-- Estructura JSON conversación:
{
  "messages": [
    {
      "role": "assistant",
      "content": "Hola, ¿cómo puedo ayudarte?",
      "timestamp": "2026-03-10T15:30:00Z"
    },
    {
      "role": "user",
      "content": "¿Es viable mi producto?",
      "timestamp": "2026-03-10T15:31:00Z"
    },
    {
      "role": "assistant",
      "content": "Basado en tus números...",
      "credits_consumed": 4,
      "timestamp": "2026-03-10T15:32:00Z"
    }
  ]
}
```

---

### 4.8 INTEGRACIÓN GEMINI API

**Variables de entorno:**
```
GEMINI_API_KEY=xxxxx
GEMINI_MODEL=gemini-1.5-pro
```

**Llamada a Gemini:**
```javascript
async function callGemini(userMessage, scope, role) {
  // 1. Cargar prompts desde BD
  const prompts = await DB.getAgentPrompts(scope, role);
  
  // 2. Consultar KB si es necesario
  let kbContext = "";
  if (role === "SUPPORT" || role === "MENTOR") {
    kbContext = await getKBContext(userMessage);
  }
  
  // 3. Construir system prompt
  const systemPrompt = `
    ${prompts.prompt_personalidad}
    
    ${prompts.prompt_objetivo_flujo}
    
    ${prompts.prompt_reglas}
    
    ${kbContext ? `KNOWLEDGE BASE:\n${kbContext}` : ""}
  `;
  
  // 4. Llamar Gemini
  const response = await gemini.generateContent({
    system: systemPrompt,
    messages: [
      ...conversationHistory,
      { role: "user", content: userMessage }
    ]
  });
  
  // 5. Detectar tokens consumidos (estimar)
  const tokensUsed = estimateTokens(response.text);
  const creditsNeeded = calculateCredits(tokensUsed);
  
  // 6. Si MENTOR, deducir créditos
  if (role === "MENTOR") {
    await deductCredits(userId, creditsNeeded);
    await logTransaction(userId, 'usage', creditsNeeded, role);
  }
  
  // 7. Guardar en conversation_threads
  await saveConversation(userId, role, userMessage, response.text);
  
  return response.text;
}

function calculateCredits(tokensUsed) {
  if (tokensUsed <= 500) return 1;      // Rápida
  if (tokensUsed <= 1800) return 4;     // Moderada
  return 9;                             // Research
}
```

---

### 4.9 AFILIADO OCULTO (Landing)

**Botón [Registrarse]:**
```html
<!-- Con afiliado oculto del admin -->
<a href="/auth/register?ref=admin_code&utm_source=chat_widget" 
   class="btn-primary">
  Registrarse gratis
</a>
```

**Lógica detección referral:**
```javascript
if (request.query.ref === undefined) {
  // Sin referral → usar admin code
  referral_code = "admin_dropcost";
  
} else if (request.query.ref !== undefined) {
  // Con referral → RESPETAR (90 días cookie)
  referral_code = request.query.ref;
  // No sobreescribir con admin code
}
```

---

## V. TABLAS BD (Resumen)

```sql
-- Agentes (prompts dinámicos)
CREATE TABLE agents (
  id INT PRIMARY KEY,
  nombre VARCHAR(100),
  scope VARCHAR(50),
  prompt_personalidad TEXT,
  prompt_objetivo_flujo TEXT,
  prompt_reglas TEXT,
  status ENUM('active', 'inactive'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Consultas anónimas (landing)
CREATE TABLE consultas_anonimas (
  id UUID PRIMARY KEY,
  nombre VARCHAR(50),
  telefono VARCHAR(20),
  email VARCHAR(100),
  pais VARCHAR(2),
  conversacion JSON,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Hilos de conversación (app)
CREATE TABLE conversation_threads (
  id UUID PRIMARY KEY,
  user_id INT,
  tienda_id INT,
  tipo ENUM('soporte', 'mentoría'),
  conversacion JSON,
  total_credits_used INT,
  status ENUM('active', 'closed'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX (user_id, created_at)
);

-- Créditos del usuario
CREATE TABLE user_credits (
  id INT PRIMARY KEY,
  user_id INT UNIQUE,
  available_credits INT,
  total_spent_usd DECIMAL(10,2),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Transacciones de créditos
CREATE TABLE credit_transactions (
  id INT PRIMARY KEY,
  user_id INT,
  type ENUM('purchase', 'usage', 'refund'),
  credits_amount INT,
  cost_usd DECIMAL(10,2),
  consultation_type VARCHAR(50),
  mercado_pago_transaction_id VARCHAR(100),
  created_at TIMESTAMP,
  INDEX (user_id, created_at)
);
```

---

## VI. CHECKLIST IMPLEMENTACIÓN

### FASE 1: KNOWLEDGE BASE
- [ ] Crear estructura KB interna (Markdown)
- [ ] Documentar simulador
- [ ] Documentar ofertas
- [ ] Documentar campañas
- [ ] Documentar plataforma (guía completa)
- [ ] Documentar créditos
- [ ] Documentar referidos
- [ ] Admin UI para editar KB

### FASE 2: DROP ASSISTANT
- [ ] Crear chat widget (UI)
- [ ] Formulario contacto landing
- [ ] IP API integración país
- [ ] Tabla agents en BD
- [ ] Tabla consultas_anonimas
- [ ] Tabla conversation_threads
- [ ] Scope detection automática
- [ ] 3 agentes por defecto (SELLER, SUPPORT, MENTOR)
- [ ] Gemini API integration
- [ ] Llamadas a KB desde agente
- [ ] Minimizable widget

### FASE 3: WALLET + CRÉDITOS
- [ ] Tabla user_credits
- [ ] Tabla credit_transactions
- [ ] Integración Mercado Pago (bundles)
- [ ] Deducción créditos automática
- [ ] Display créditos disponibles
- [ ] Alertas insuficientes créditos
- [ ] Landing: Calculadora créditos (Twilio style)
- [ ] Logging transacciones

---

## VII. COMPONENTES PRINCIPALES

**Files a crear:**

```
/src/components/DropAssistant/
├─ ChatWidget.tsx (UI chat flotante)
├─ ContactForm.tsx (Formulario landing)
├─ RoleSelector.tsx (Soporte vs Mentoría)
├─ CreditsDisplay.tsx (Créditos disponibles)
└─ CreditsWarning.tsx (Insuficientes créditos)

/src/lib/
├─ gemini-agent.ts (Lógica llamadas Gemini)
├─ scope-detection.ts (Detectar contexto user)
├─ credit-calculator.ts (Cálculo créditos)
├─ knowledge-base.ts (Consultar KB)
└─ afiliado-utils.ts (Manejo referral)

/app/admin/
├─ /knowledge-base/ (editar KB)
└─ /agents/ (gestionar agentes - FUTURE)

/api/
├─ /chat (endpoint chat)
├─ /credits/purchase (comprar créditos)
├─ /credits/balance (saldo créditos)
└─ /conversations (historial)
```

---

## VIII. DIAGRAMA FLUJO USUARIO

```
LANDING:
User → Click chat → Ver formulario → Completa datos 
→ Click [Continuar] → Crear consultas_anonimas 
→ Chat abierto (SELLER role) → Respuestas de agente 
→ CTA: [Registrarse con afiliado oculto]

APP REGISTRADO (sin plan):
User → Click chat → Directamente chat 
→ SUPPORT role → Respuestas gratis 
→ Soporte técnico solo

APP SUSCRITO:
User → Click chat → Ver selector 
→ Elige "Soporte" o "Mentoría" 
→ Si SOPORTE: gratis, ilimitado 
→ Si MENTORÍA: verifica créditos 
→ Si insuficientes: mostrar bundles 
→ Si suficientes: deducir + responder
```

---

## IX. CONSIDERACIONES TÉCNICAS

**Performance:**
- Cache prompts de agents (no consultar BD cada mensaje)
- Lazy load KB (consultar solo si es necesario)
- Conversaciones JSON (evitar múltiples filas)

**Seguridad:**
- Validar email landing (prevenir spam)
- Rate limit chat (máx X mensajes/min)
- Validar policy privacidad (obligatorio landing)
- No guardar datos sensibles en KB

**Escalabilidad:**
- Prompts en BD (no hardcodeados) = fácil cambiar
- Tabla agents = fácil agregar más roles (FUTURE)
- Créditos dinámicos = fácil cambiar pricing

---

**LISTO PARA ANTIGRAVITY.** ✅

