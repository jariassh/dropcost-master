# REQUISITO FUNCIONAL: MÓDULO LAUNCHPAD ONBOARDING v2
**DropCost Master**  
**Versión:** 2.0 (Reescrito con flujo usuario correcto)  
**Estado:** Especificación Final  
**Fecha:** 26 de febrero de 2026  
**Criticidad:** ALTA - No regresión obligatoria

---

## I. DESCRIPCIÓN GENERAL

El módulo Launchpad es un sistema de onboarding paso a paso que guía al usuario desde el registro inicial hasta tener su tienda completamente configurada. El Launchpad reemplaza la pantalla antigua de "crear tienda" y es el punto de entrada principal para nuevos usuarios.

**PRINCIPIO CRÍTICO:** No hay creación automática de tienda. Usuario debe crearla manualmente en Paso 1.

---

## II. FLUJO GENERAL

```
Registro (sin plan)
    ↓
Paso 0: Seleccionar Plan ($10, $25, $30-35)
    ↓
Paso 1: Crear Tienda (Manual)
    ├─ Desbloquea: Simulador, Costeos, Ofertas
    ↓
Paso 2: Conectar Shopify
    ├─ Desbloquea: Configuración de Tienda (gestión)
    ↓
Paso 3: Conectar Meta (OAuth)
    ├─ Desbloquea: Configuración de Meta
    ↓
Paso 4: Asignar Cuentas Publicitarias
    ├─ Desbloquea: Dashboard, Sincronizador Drophi
    ↓
100% Completo → Acceso Total
```

---

## III. REQUISITOS FUNCIONALES POR PASO

### 3.0 PASO 0: SELECCIONAR PLAN (Si usuario no tiene plan)

**Condición de entrada:**
- Usuario registrado sin plan activo

**UI:**
```
Título: "Elige tu plan de DropCost Master"

[Card Plan Starter - $10/mes]
├─ Simulador de Costeos
├─ Ofertas Irresistibles
├─ Referidos
└─ Botón: "Elegir Starter"

[Card Plan Pro - $25/mes]
├─ Simulador de Costeos
├─ Ofertas Irresistibles
├─ Dashboard Operacional ⭐
├─ Referidos
├─ Billetera
└─ Botón: "Elegir Pro"

[Card Plan Enterprise - $30-35/mes]
├─ TODO (ilimitado)
├─ Análisis Regional ⭐
└─ Botón: "Elegir Enterprise"

Botón secundario: "Necesito asesoría" (chat)
```

**Backend:**
- Procesar compra (Mercado Pago)
- Crear registro de suscripción
- Redirige a Paso 1

---

### 3.1 PASO 1: CREAR TIENDA (Manual)

**Condición de entrada:**
- Usuario tiene plan activo
- NO tiene tienda creada aún

**UI:**
```
Título: "Crea tu primera tienda"
Subtítulo: "Aquí es donde configurarás tu negocio de dropshipping"

Form:
├─ Campo: Nombre de tienda (requerido, máx 50 caracteres)
├─ Campo: Descripción (opcional, máx 200 caracteres)
├─ Selector: País (default: Colombia)
├─ Selector: Moneda (default: COP)
└─ Botón: "Crear Tienda"

Icon/Ilustración: Tienda (simple)
```

**Validación Frontend:**
- Nombre no vacío
- Nombre único (validar en tiempo real)
- Longitud correcta

**Backend:**
```sql
INSERT INTO tiendas (
  user_id, 
  nombre, 
  descripcion, 
  pais, 
  moneda, 
  estado
) VALUES (?, ?, ?, ?, ?, 'activa');
```

**Respuesta exitosa:**
- ✅ PASO 1 COMPLETADO
- Desbloquea: Simulador, Costeos, Ofertas
- Auto-siguiente: Paso 2

**Nota importante:**
```
⚠️ "Esta es tu tienda principal. 
Podrás crear más tiendas después de completar este onboarding."
```

---

### 3.2 PASO 2: CONECTAR SHOPIFY

**Condición de entrada:**
- Paso 1 completado (tienda existe)
- Usuario debe conectar Shopify para:
  - Dashboard (si plan lo incluye)
  - Sincronizador Drophi

**UI - Opción A: Guía Inline**
```
Título: "Conecta tu tienda Shopify"

Instrucción paso a paso (desplegable):
├─ "1. Ve a tu admin de Shopify"
├─ "2. Apps and integrations → App and sales channel settings"
├─ "3. Develop apps → Create an app"
├─ "4. Nombre: 'DropCost Master'"
├─ "5. Copia tu Client ID y Client Secret"
└─ "6. Pégalos abajo"

Form:
├─ Input 1: "Client ID" (requerido)
├─ Input 2: "Client Secret" (requerido, tipo password)
└─ Botón: "Obtener Token Automáticamente"

Disclaimer (rojo/amarillo):
"⚠️ SEGURIDAD: Tu Client ID y Secret NO se guardan. 
Solo usamos esta información para obtener tu Access Token. 
Por tu seguridad, se descartan inmediatamente después."

Link: "¿Necesitas ayuda? Ver guía completa con screenshots"
```

**Validación Frontend:**
- Client ID: Formato válido (25 caracteres alfanuméricos)
- Client Secret: Formato válido (40+ caracteres)

**Backend (Edge Function: obtener-token-shopify):**
```
POST /api/launchpad/obtener-token-shopify

Request:
{
  "tienda_id": "uuid",
  "client_id": "string",
  "client_secret": "string"
}

Lógica:
1. Recibir Client ID + Secret
2. ❌ NUNCA guardar en BD
3. ❌ NUNCA loguear completos
4. Hacer POST a Shopify OAuth:
   POST https://[tienda].myshopify.com/admin/oauth/access_tokens
   {
     "client_id": client_id,
     "client_secret": client_secret,
     "grant_type": "client_credentials"
   }
5. Recibir access_token
6. Guardar ENCRIPTADO (AES-256) en tabla shopify_integrations:
   {
     "tienda_id": tienda_id,
     "access_token_encrypted": encrypt(access_token),
     "validated_at": NOW(),
     "estado": "activa"
   }
7. ✅ Retornar { success: true, message: "Conectado" }

Error handling:
- Si Client ID/Secret inválidos → { error: "Credenciales inválidas" }
- Si Shopify no responde → { error: "Shopify no disponible" }
- Reintentos: Ilimitados
```

**Respuesta exitosa:**
- ✅ PASO 2 COMPLETADO
- Desbloquea: Configuración de Tienda (gestión, tab Shopify)
- Auto-siguiente: Paso 3
- Aviso: "¡Shopify conectado! Para cambiar, ve a Configuración > Tienda"

**Linkeo al siguiente paso:**
```
Button (después de completar Paso 2):
"Siguiente: Conectar Meta"
└─ Redirige a Paso 3
```

---

### 3.3 PASO 3: CONECTAR META

**Condición de entrada:**
- Paso 2 completado (Shopify conectado)
- Usuario debe conectar Meta para:
  - Dashboard (si plan lo incluye)
  - Sincronizador Drophi

**UI:**
```
Título: "Conecta tu cuenta de Meta"
Subtítulo: "Necesitamos acceso a tu Business Manager para sincronizar campañas"

Explicación:
"Usamos la app oficial 'DropCost Master Connector' 
verificada por Meta para máxima seguridad."

Botón grande: "Conectar con Meta"
├─ Tipo: OAuth (popup o redirect)
├─ Acción: Abre ventana Meta Login
└─ Callback: POST /api/auth/meta/callback

Al completar OAuth:
- Ventana se cierra
- Backend obtiene access_token
- Guarda encriptado
- Redirección automática a Paso 4
```

**Backend (Edge Function: meta-callback):**
```
POST /api/auth/meta/callback

Request:
{
  "code": "string (código de Meta)",
  "state": "string (validación CSRF)"
}

Lógica:
1. Validar que state sea correcto (CSRF protection)
2. Hacer POST a Meta Graph API:
   POST https://graph.instagram.com/v19.0/oauth/access_token
   {
     "client_id": APP_ID,
     "client_secret": APP_SECRET,
     "code": code,
     "redirect_uri": "https://dropcost.jariash.com/api/auth/meta/callback"
   }
3. Recibir access_token de larga duración
4. Guardar ENCRIPTADO en tabla meta_integrations:
   {
     "user_id": user_id,
     "tienda_id": tienda_id,
     "access_token_encrypted": encrypt(access_token),
     "business_account_id": info.business_account_id,
     "validated_at": NOW(),
     "estado": "activa"
   }
5. ✅ Retornar { success: true, redirect: "/launchpad/paso-4" }

Error handling:
- Si OAuth cancela → Volver a Paso 3
- Si código inválido → Reintentar
```

**Respuesta exitosa:**
- ✅ PASO 3 COMPLETADO
- Desbloquea: Configuración de Meta (tab Meta)
- Auto-siguiente: Paso 4
- Aviso: "¡Meta conectado! Para cambiar, ve a Configuración > Meta"

---

### 3.4 PASO 4: ASIGNAR CUENTAS PUBLICITARIAS

**Condición de entrada:**
- Paso 3 completado (Meta conectado)
- Este es el paso final → Desbloquea Dashboard + Sincronizador

**UI:**
```
Título: "Selecciona tus cuentas publicitarias"
Subtítulo: "¿Cuál cuenta de Meta administra esta tienda?"

Instrucción:
"Selecciona una o más cuentas publicitarias que usarás 
para esta tienda. Esto es importante para que el Dashboard 
sincronice correctamente tus métricas."

Tabla/Lista:
┌─────────────────────────────────────┐
│ ☐ Nombre Cuenta    │ ID         │ Status │
├─────────────────────────────────────┤
│ ☐ Mi Negocio 1     │ 1234567890 │ ✓      │
│ ☐ Mi Negocio 2     │ 0987654321 │ ✓      │
│ ☐ Pruebas          │ 1111111111 │ ✓      │
└─────────────────────────────────────┘

Validación:
"Debes seleccionar mínimo 1 cuenta"

Botón: "Vincular Cuentas Seleccionadas"
└─ Deshabilitado hasta seleccionar mínimo 1
```

**Backend (Edge Function: vincular-cuentas-meta):**
```
POST /api/launchpad/vincular-cuentas-meta

Request:
{
  "tienda_id": "uuid",
  "ad_account_ids": ["1234567890", "0987654321"]
}

Lógica:
1. Validar que tienda existe y es del usuario (RLS)
2. Validar que Meta token es válido
3. Para cada ad_account_id:
   - Validar que existe en Meta API
   - Validar que usuario tiene permisos
   - Crear registro en tabla meta_ad_accounts:
     {
       "tienda_id": tienda_id,
       "ad_account_id": ad_account_id,
       "nombre": nombre_desde_meta,
       "vinculado_en": NOW()
     }
4. Actualizar onboarding_progress:
   {
     "paso_4_cuentas_publicitarias": true,
     "completado": true,
     "porcentaje_completado": 100,
     "fecha_completado": NOW()
   }
5. ✅ Retornar { success: true, redirect: "/dashboard" }

Error handling:
- Si ad_account_id no existe → Error: "Cuenta no encontrada en Meta"
- Si sin permisos → Error: "Sin permisos en esa cuenta"
- Reintentos: Ilimitados
```

**Respuesta exitosa:**
- ✅ PASO 4 COMPLETADO (100% Launchpad)
- Desbloquea: Dashboard, Sincronizador Drophi
- Aviso grande: "¡Configuración completa! Acceso total a DropCost Master"
- Auto-redirige a Dashboard en 3 segundos
- O click: "Ir al Dashboard"

---

## IV. BARRA DE PROGRESO

**Ubicación:** Top de página, permanente

```
Progreso: ████████████░░░░░░░░ 60% - 3 de 5 pasos completados

Pasos mostrados:
1. ✅ Crear Tienda
2. ✅ Conectar Shopify
3. ⏳ Conectar Meta
4. ⭕ Cuentas Publicitarias
5. ⭕ (futuro, si aplica)
```

**Actualización en tiempo real:**
- Cada paso completado → progreso sube
- Cada paso desbloqueado → cambio visual

---

## V. NAVEGACIÓN Y ACCESIBILIDAD

**CRÍTICO - Principio de Navegación Directa:**

Cada paso debe llevar al usuario **directamente** a la configuración relevante, no a menús intermedios.

### 5.1 Desde Paso 2 (Shopify)
**Botón secundario en Paso 2:**
```
"Configurar en detalle"
→ Redirige a: /app/configuracion/tienda?tab=shopify&tienda_id={tienda_id}
└─ Directamente a la pestaña Shopify de esa tienda
```

**Después de completar Paso 2:**
```
"Para cambiar tu configuración Shopify, ve a Configuración > Tienda"
└─ Link directo: /app/configuracion/tienda?tab=shopify&tienda_id={tienda_id}
```

### 5.2 Desde Paso 3 (Meta)
**Botón secundario en Paso 3:**
```
"Configurar en detalle"
→ Redirige a: /app/configuracion/cuenta?tab=meta
└─ Directamente a la pestaña Meta en Configuración
```

**Después de completar Paso 3:**
```
"Para cambiar tu configuración Meta, ve a Configuración > Cuenta"
└─ Link directo: /app/configuracion/cuenta?tab=meta
```

### 5.3 Desde Paso 4 (Cuentas Publicitarias)
**Después de completar Paso 4:**
```
"Para agregar/cambiar cuentas publicitarias, ve a Configuración > Tienda > Cuentas Publicitarias"
└─ Link directo: /app/configuracion/tienda?tab=cuentas-publicitarias&tienda_id={tienda_id}
```

---

## VI. BLOQUEO DE FEATURES

**CRÍTICO - Acceso condicional por progreso + plan:**

### 6.1 Acceso Inmediato (desde Paso 1)
```
✅ Simulador de Costeos
✅ Ofertas Irresistibles
✅ Referidos (todos los planes)
✅ Billetera (todos los planes)
✅ Configuración de Perfil
✅ Historial (si plan lo permite)
✅ Soporte/Ayuda
```

### 6.2 Bloqueado hasta Paso 2
```
❌ Gestión de Tienda (si Shopify no conectado)
   └─ Mensaje: "Conecta Shopify primero en el Launchpad"
```

### 6.3 Bloqueado hasta Paso 4 (si plan incluye Dashboard)
```
Plan Starter: Dashboard no existe
Plan Pro/Enterprise:
❌ Dashboard Operacional (bloqueado)
   └─ Mensaje: "Completa el Launchpad para acceder al Dashboard"
❌ Sincronizador Drophi (bloqueado)
   └─ Mensaje: "Completa el Launchpad para sincronizar productos"
```

**Implementación Frontend:**
```typescript
// En cada página
if (feature === 'dashboard' && !isLaunchpadComplete()) {
  return <RedirectToLaunchpad message="Completa la configuración para acceder al Dashboard" />;
}

// Middleware route protection
ProtectedRoute.tsx:
  if (route.requiresLaunchpad && !isLaunchpadComplete()) {
    redirect('/launchpad');
  }
```

---

## VII. BASE DE DATOS

**Tabla nueva: onboarding_progress**

```sql
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  
  -- Pasos completados
  paso_0_plan BOOLEAN DEFAULT false,
  paso_1_tienda BOOLEAN DEFAULT false,
  paso_2_shopify BOOLEAN DEFAULT false,
  paso_3_meta BOOLEAN DEFAULT false,
  paso_4_cuentas_publicitarias BOOLEAN DEFAULT false,
  
  -- Metadata
  completado BOOLEAN DEFAULT false,
  porcentaje_completado INT DEFAULT 0,
  paso_actual INT DEFAULT 0,
  fecha_inicio TIMESTAMP DEFAULT NOW(),
  fecha_completado TIMESTAMP,
  
  -- RLS
  CONSTRAINT onboarding_user_tienda UNIQUE(user_id, tienda_id)
);

CREATE INDEX idx_onboarding_user ON onboarding_progress(user_id);
CREATE INDEX idx_onboarding_completado ON onboarding_progress(completado);
CREATE INDEX idx_onboarding_tienda ON onboarding_progress(tienda_id);
```

**Tablas existentes - Agregar campos:**

```sql
-- shopify_integrations
ALTER TABLE shopify_integrations 
ADD COLUMN validated_at TIMESTAMP;

-- meta_integrations
ALTER TABLE meta_integrations 
ADD COLUMN validated_at TIMESTAMP;

-- meta_ad_accounts (tabla nueva)
CREATE TABLE meta_ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id),
  ad_account_id VARCHAR(255) NOT NULL,
  nombre VARCHAR(255),
  vinculado_en TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_tienda_adaccount UNIQUE(tienda_id, ad_account_id)
);

CREATE INDEX idx_meta_ad_tienda ON meta_ad_accounts(tienda_id);
```

---

## VIII. ENDPOINTS REQUERIDOS

**GET /api/launchpad/estado**
```
Response:
{
  "paso_actual": 2,
  "porcentaje_completado": 40,
  "pasos_completados": {
    "plan": true,
    "tienda": true,
    "shopify": false,
    "meta": false,
    "cuentas": false
  }
}
```

**POST /api/launchpad/crear-tienda**
```
Request:
{
  "nombre": "Mi Tienda",
  "descripcion": "Descripción",
  "pais": "CO",
  "moneda": "COP"
}

Response:
{
  "tienda_id": "uuid",
  "success": true
}
```

**POST /api/launchpad/obtener-token-shopify**
```
Request:
{
  "tienda_id": "uuid",
  "client_id": "string",
  "client_secret": "string"
}

Response:
{
  "success": true,
  "message": "Token obtenido exitosamente"
} o
{
  "success": false,
  "error": "Credenciales inválidas"
}
```

**POST /api/auth/meta/callback**
```
(Ya existe, documentado en sección 3.3)
```

**POST /api/launchpad/vincular-cuentas-meta**
```
Request:
{
  "tienda_id": "uuid",
  "ad_account_ids": ["123", "456"]
}

Response:
{
  "success": true,
  "vinculadas": 2,
  "redirect": "/dashboard"
}
```

**GET /api/launchpad/meta-business-accounts**
```
Response:
{
  "accounts": [
    {
      "id": "1234567890",
      "name": "Mi Negocio 1",
      "status": "ACTIVE"
    }
  ]
}
```

---

## IX. NO REGRESIÓN - REGLAS CRÍTICAS

**⚠️ PARA TODOS LOS AGENTES:**

1. **ANTES de modificar código existente:**
   - ❌ NO cambiar funcionalidad sin preguntar
   - ✅ PREGUNTAR: "¿Por qué funciona así?"
   - ✅ PROPONER: Solución + impacto

2. **Código que NO se toca sin validación:**
   - Auth (login, 2FA, JWT)
   - Cálculos (costeo, márgenes)
   - RLS (aislamiento datos)
   - Pagos (Mercado Pago)
   - Email (dispatcher)
   - Webhooks (Shopify, Meta)

3. **Si encuentras inconsistencia:**
   - Documenta exactamente qué es
   - Propón 2-3 alternativas
   - Espera aprobación ANTES de tocar

4. **Commits son sagrados:**
   - Si rompes algo → Revert inmediato
   - Documentar qué se rompió
   - Reportar a Project Manager

---

## X. FLUJO END-TO-END USUARIO

```
1. Usuario accede a DropCost.jariash.com
2. ¿Tiene plan?
   ├─ NO → Launchpad Paso 0 (seleccionar plan)
   ├─ SÍ → Launchpad Paso 1 (crear tienda)
3. Completa Paso 1 → Acceso a Simulador
4. Completa Paso 2 → Acceso a Configuración Tienda
5. Completa Paso 3 → Acceso a Configuración Meta
6. Completa Paso 4 → Acceso a Dashboard + Sincronizador (100%)
7. Puede volver a Launchpad desde Settings > "Ver Progreso"
8. Al 100%, opción "Ocultar Launchpad" (si quiere)
```

---

## XI. CONSIDERACIONES DE SEGURIDAD

- ✅ Client ID/Secret NUNCA se guardan
- ✅ Access tokens encriptados AES-256
- ✅ CSRF token en OAuth (state parameter)
- ✅ RLS en todas las tablas
- ✅ Validación de permisos en Meta

---

## XII. CASOS DE BORDE

| Caso | Comportamiento |
|------|----------------|
| Usuario cancela OAuth Meta | Vuelve a Paso 3, sin perder progreso anterior |
| Usuario cierra navegador en Paso 2 | Al volver, retoma Paso 2 |
| Usuario cambia de plan | Launchpad se readapta (puede omitir Dashboard si baja a Starter) |
| Usuario intenta saltarse pasos | Bloqueado, botón siguiente deshabilitado |
| Usuario desconecta Shopify después | Dashboard se bloquea, mensaje "Reconecta Shopify" |

---

## XIII. MÉTRICAS A TRACKEAR

```
- % usuarios que completan Launchpad
- Tiempo promedio por paso
- Dónde abandonan
- Plan vs completitud
- Errores más comunes
```

---

## XIV. ROLLOUT

**Fase 1 (Beta - Internos):**
- Testers beta completan Launchpad
- Feedback en grupo WhatsApp
- Ajustes de UX

**Fase 2 (Producción):**
- Todos nuevos usuarios: Obligatorio
- Usuarios existentes: Opción voluntaria "Completar Onboarding"

---

## XV. DOCUMENTO FINAL

**Este documento reemplaza completamente la pantalla antigua de "crear tienda".**

**Responsable de implementación:** Backend Engineer + Frontend Engineer + Product Manager  
**Revisión de No Regresión:** Product Manager (OBLIGATORIO antes de mergear)

---

**DOCUMENTO LISTO PARA IMPLEMENTACIÓN** ✅

