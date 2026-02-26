# Especificación de Requerimientos - Integración Meta Ads (OAuth2)
## DropCost Master

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Fase:** Post-Analytics (Semana 25-27)  
**Requerimientos:** RF-117 a RF-130

---

## 1. Resumen Ejecutivo

Sistema de integración con **Meta Ads** mediante **OAuth2** para sincronizar campañas publicitarias. 

**Características:**
- Una única vinculación por usuario (sirve para todas las tiendas)
- Flujo visual paso a paso con permisos Meta
- Token dura ~60 días + renovación automática
- Sincronización automática cada hora
- Leer: campañas, presupuesto, CPA, resultados
- Ver datos en dashboard

**Acceso:** Usuario autenticado (cualquiera con tiendas)
**Alcance:** Usuario (no por tienda como Shopify/Dropi)

---

## 2. Requerimientos Funcionales

### RF-117: Botón Conectar Meta Ads

**Ubicación:** Configuración → Integraciones

**Vista si NO está conectado:**
```
┌──────────────────────────────────────┐
│ META ADS                             │
│ Estado: ❌ No conectado              │
│                                      │
│ Sincroniza tus campañas publicitarias│
│ y analiza CPA en tiempo real         │
│                                      │
│ [🔗 Conectar Meta Ads]              │
│                                      │
│ ℹ️ Necesitarás:                      │
│ • Cuenta Meta Business Manager       │
│ • Acceso a cuentas publicitarias     │
│ • Navegador con sesión Meta iniciada│
│                                      │
└──────────────────────────────────────┘
```

**Comportamiento:**
- Click abre ventana popup (no redirect)
- Tamaño popup: 500x600px
- URL: `https://www.facebook.com/v18.0/dialog/oauth?...`

---

### RF-118: Flujo OAuth2 Facebook Popup

**Proceso paso a paso (para usuario):**

```
PASO 1: Usuario en DropCost
┌─────────────────────────────────────┐
│ Configuración → Integraciones       │
│                                     │
│ Meta Ads (no conectado)             │
│ [🔗 Conectar Meta Ads]             │
└─────────────────────────────────────┘
        ↓ Click
        
PASO 2: Popup Facebook se abre
┌─────────────────────────────────────┐
│ FACEBOOK - Autorizar DropCost       │
│                                     │
│ ¿Permitir que DropCost Master      │
│ acceda a tu cuenta Meta?            │
│                                     │
│ ⚠️ "DropCost" tendrá acceso a:     │
│ ✓ Tus cuentas publicitarias         │
│ ✓ Campañas y presupuestos           │
│ ✓ Resultados (clics, conversiones)  │
│                                     │
│ Sesión: usuario@facebook.com        │
│ [¿No eres tú? Cambiar cuenta]      │
│                                     │
│ [Permitir] [Cancelar]              │
└─────────────────────────────────────┘
        ↓ Click "Permitir"
        
PASO 3: Popup se cierra, datos se sincronizan
┌─────────────────────────────────────┐
│ DropCost Master (ventana original)  │
│                                     │
│ Sincronizando campañas...           │
│ [spinner/loading]                   │
└─────────────────────────────────────┘
        ↓ 2-3 segundos
        
PASO 4: Éxito
┌─────────────────────────────────────┐
│ ✅ Meta Ads conectado!             │
│                                     │
│ Cuenta Meta: Juan Pérez             │
│ Cuentas publicitarias: 2            │
│ Campañas sincronizadas: 12          │
│ Última sincronización: Hace 30s     │
│                                     │
│ [📊 Ver campañas] [Desconectar]    │
│                                     │
│ Próxima sincronización: en 59 min   │
└─────────────────────────────────────┘
```

---

### RF-119: Configurar App en Meta Developers

**Requisitos previos (setup una sola vez):**

```
1. Ir a: developers.facebook.com
2. Crear app o usar existente
3. Agregar producto: "Facebook Login"
4. Configurar:
   - App ID: obtener del dashboard
   - App Secret: obtener (guardar seguro)
   - Redirect URIs:
     * http://localhost:3000/auth/meta-callback (dev)
     * https://dropcostmaster.com/auth/meta-callback (prod)
   - Permisos requeridos:
     * ads_read (leer campañas)
     * business_management (leer cuentas)
5. Guardar en variables entorno:
   - VITE_META_APP_ID
   - META_APP_SECRET (backend solo)
```

---

### RF-120: Generar URL OAuth2 y Abrir Popup

**Implementación frontend:**

```typescript
// src/components/ConectarMetaAds.tsx

import { useState } from 'react';
import { toast } from 'sonner';

export function ConectarMetaAds() {
  const [loading, setLoading] = useState(false);

  const handleConectarMeta = async () => {
    setLoading(true);

    // 1. Generar state (seguridad CSRF)
    const state = generarStateAleatorio();
    sessionStorage.setItem('meta_oauth_state', state);

    // 2. Construir URL OAuth2
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_META_APP_ID,
      redirect_uri: `${window.location.origin}/auth/meta-callback`,
      scope: 'ads_read,business_management',
      state: state,
      response_type: 'code'
    });

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;

    // 3. Abrir popup (no redirect)
    const popup = window.open(
      authUrl,
      'Meta Login',
      'width=500,height=600,left=200,top=200'
    );

    if (!popup) {
      toast.error('Por favor, permite popups en tu navegador');
      setLoading(false);
      return;
    }

    // 4. Esperar callback (usuario cierra popup o autoriza)
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        setLoading(false);
        // El callback page redirigirá si fue exitoso
      }
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Spinner size="sm" />
        <span>Abriendo Meta...</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleConectarMeta}
      className="btn btn-primary"
    >
      🔗 Conectar Meta Ads
    </button>
  );
}

function generarStateAleatorio(): string {
  return Math.random().toString(36).substring(7);
}
```

---

### RF-121: Página Callback - Recibir Código

**Ubicación:** `/auth/meta-callback`

```typescript
// src/pages/auth/meta-callback.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

export default function MetaCallback() {
  const router = useRouter();
  const { code, state, error } = router.query;
  const [procesando, setProcesando] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    procesarCallback();
  }, [router.isReady]);

  async function procesarCallback() {
    // 1. Validar error de Meta
    if (error) {
      toast.error(`Meta rechazó la conexión: ${error}`);
      router.push('/config/integraciones?tab=meta&error=true');
      return;
    }

    // 2. Validar state (seguridad)
    const storedState = sessionStorage.getItem('meta_oauth_state');
    if (state !== storedState) {
      toast.error('Error de seguridad: state no coincide');
      router.push('/config/integraciones?tab=meta&error=security');
      return;
    }

    if (!code) {
      toast.error('No se recibió código de autorización');
      router.push('/config/integraciones?tab=meta&error=nocode');
      return;
    }

    // 3. Enviar código a backend
    try {
      const response = await fetch('/api/integraciones/conectar-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.mensaje || 'Error conectando Meta');
      }

      const { exito } = await response.json();

      if (exito) {
        toast.success('✅ Meta Ads conectado correctamente');
        
        // Limpiar
        sessionStorage.removeItem('meta_oauth_state');
        
        // Cerrar popup y redirigir en ventana principal
        window.opener?.location.reload();
        window.close();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message);
      router.push('/config/integraciones?tab=meta&error=true');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      {procesando ? (
        <>
          <Spinner />
          <p className="ml-4">Conectando con Meta...</p>
        </>
      ) : (
        <p>Redirigiendo...</p>
      )}
    </div>
  );
}
```

---

### RF-122: Backend - Canjear Código por Token

**Endpoint:** `POST /api/integraciones/conectar-meta`

```typescript
// supabase/functions/integraciones/conectar-meta/index.ts

import { createClient } from '@supabase/supabase-js';
import { encrypt } from '@/utils/encryption';

export async function POST(req: Request) {
  try {
    const { code, state } = await req.json();
    const userId = await verificarAuthJWT(req);

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401 }
      );
    }

    // 1. Validar state
    const storedState = await redis.get(`meta_oauth_state:${userId}`);
    if (state !== storedState) {
      return new Response(
        JSON.stringify({ error: 'State inválido' }),
        { status: 400 }
      );
    }
    await redis.del(`meta_oauth_state:${userId}`);

    // 2. Canjear código por access_token
    const tokenResponse = await fetch(
      'https://graph.instagram.com/v18.0/oauth/access_token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('META_APP_ID') || '',
          client_secret: Deno.env.get('META_APP_SECRET') || '',
          redirect_uri: `${Deno.env.get('FRONTEND_URL')}/auth/meta-callback`,
          code
        }).toString()
      }
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Meta error:', tokenData.error);
      return new Response(
        JSON.stringify({ 
          error: 'Error de Meta',
          mensaje: tokenData.error.message 
        }),
        { status: 400 }
      );
    }

    const { access_token, user_id: meta_user_id } = tokenData;

    // 3. Obtener nombre de cuenta
    const userRes = await fetch(
      `https://graph.facebook.com/v18.0/${meta_user_id}?fields=name&access_token=${access_token}`
    );
    const { name: meta_user_name } = await userRes.json();

    // 4. Guardar integración
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const encrypted_token = encrypt(access_token);

    // Eliminar integración anterior si existe
    await supabase
      .from('integraciones')
      .delete()
      .eq('usuario_id', userId)
      .eq('tipo', 'meta_ads');

    // Crear nueva integración
    const { data, error } = await supabase
      .from('integraciones')
      .insert({
        usuario_id: userId,
        tipo: 'meta_ads',
        estado: 'conectada',
        token_encriptado: encrypted_token,
        meta_user_id: meta_user_id,
        meta_user_name: meta_user_name,
        fecha_conexion: new Date().toISOString(),
        fecha_expiracion: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 días
        ultima_sincronizacion: null
      });

    if (error) throw error;

    // 5. Iniciar sincronización de campañas
    await sincronizarCampaniasMeta(userId, access_token);

    // 6. Programar renovación automática de token
    programarRenovacionToken(userId, access_token);

    return new Response(
      JSON.stringify({ 
        exito: true, 
        mensaje: 'Meta Ads conectado correctamente' 
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error conectando Meta:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error interno',
        mensaje: error.message 
      }),
      { status: 500 }
    );
  }
}
```

---

### RF-123: Sincronizar Campañas Meta

**Backend - función sincronización:**

```typescript
// supabase/functions/integraciones/sincronizar-meta/index.ts

async function sincronizarCampaniasMeta(
  userId: string,
  accessToken: string
) {
  const supabase = createClient(...);

  try {
    // 1. GET /me/adaccounts (obtener cuentas publicitarias)
    const accountsRes = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,currency&access_token=${accessToken}`
    );
    const { data: accounts } = await accountsRes.json();

    // 2. Para cada cuenta publicitaria
    for (const account of accounts) {
      // 3. GET /campaigns con insights
      const campaignRes = await fetch(
        `https://graph.facebook.com/v18.0/${account.id}/campaigns?fields=id,name,status,daily_budget,lifetime_budget,created_time,insights{spend,impressions,clicks,actions,action_values}&access_token=${accessToken}`
      );
      const { data: campaigns } = await campaignRes.json();

      // 4. Guardar cada campaña
      for (const campaign of campaigns) {
        const insights = campaign.insights?.data?.[0] || {};
        
        const spend = parseFloat(insights.spend || '0');
        const actions = parseFloat(insights.actions || '0');
        const cpa = actions > 0 ? spend / actions : 0;

        await supabase.from('data_meta_ads').upsert({
          usuario_id: userId,
          id_campana_meta: campaign.id,
          nombre_campana: campaign.name,
          id_cuenta_publicidad: account.id,
          nombre_cuenta: account.name,
          moneda: account.currency,

          // Métricas
          impresiones: parseInt(insights.impressions || '0'),
          clics: parseInt(insights.clicks || '0'),
          conversiones: parseInt(insights.actions || '0'),
          valor_acciones: parseFloat(insights.action_values || '0'),
          gasto_real: spend,
          cpa_real: parseFloat(cpa.toFixed(2)),

          // Presupuesto
          presupuesto_diario: campaign.daily_budget || null,
          presupuesto_total: campaign.lifetime_budget || null,
          estado_campana: campaign.status,

          // Timestamps
          fecha_sincronizacion: new Date().toISOString(),
          fecha_creacion_campana: campaign.created_time
        }, {
          onConflict: ['usuario_id', 'id_campana_meta']
        });
      }
    }

    // 5. Actualizar fecha última sincronización
    await supabase
      .from('integraciones')
      .update({ 
        ultima_sincronizacion: new Date().toISOString(),
        estado: 'conectada'
      })
      .eq('usuario_id', userId)
      .eq('tipo', 'meta_ads');

    console.log(`✅ Sincronización Meta completada para usuario ${userId}`);
  } catch (error) {
    console.error('Error sincronizando Meta:', error);
    
    // Marcar como error
    await supabase
      .from('integraciones')
      .update({ 
        estado: 'error',
        error_mensaje: error.message
      })
      .eq('usuario_id', userId)
      .eq('tipo', 'meta_ads');
  }
}
```

---

### RF-124: Cron Job - Sincronizar cada hora

**Ejecución automática:**

```typescript
// supabase/functions/cron/sincronizar-meta-cron/index.ts

import { schedule } from '@netlify/functions';

// Ejecutar cada hora
export const handler = schedule('0 * * * *', async () => {
  const supabase = createClient(...);

  // 1. Obtener todas las integraciones Meta conectadas
  const { data: integraciones } = await supabase
    .from('integraciones')
    .select('usuario_id, token_encriptado')
    .eq('tipo', 'meta_ads')
    .eq('estado', 'conectada');

  // 2. Para cada usuario, sincronizar
  for (const integracion of integraciones) {
    const accessToken = decrypt(integracion.token_encriptado);
    await sincronizarCampaniasMeta(integracion.usuario_id, accessToken);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ 
      mensaje: `Sincronización completada para ${integraciones.length} usuarios`
    })
  };
});
```

---

### RF-125: Renovación Automática de Token

**Meta token dura 60 días, pero se renueva si:**
- Se usa regularmente (cada 24h)
- Se implementa refresh automático

```typescript
// supabase/functions/integraciones/renovar-token-meta/index.ts

async function renovarTokenMeta(userId: string) {
  const supabase = createClient(...);

  try {
    // Obtener integración actual
    const { data: integracion } = await supabase
      .from('integraciones')
      .select('token_encriptado')
      .eq('usuario_id', userId)
      .eq('tipo', 'meta_ads')
      .single();

    if (!integracion) return;

    const oldToken = decrypt(integracion.token_encriptado);

    // Intentar renovar token
    const refreshRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=refresh_token&client_id=${Deno.env.get('META_APP_ID')}&client_secret=${Deno.env.get('META_APP_SECRET')}&access_token=${oldToken}`
    );

    const { access_token: newToken } = await refreshRes.json();

    if (newToken) {
      // Guardar nuevo token
      const encrypted = encrypt(newToken);
      await supabase
        .from('integraciones')
        .update({ 
          token_encriptado: encrypted,
          fecha_renovacion: new Date().toISOString()
        })
        .eq('usuario_id', userId)
        .eq('tipo', 'meta_ads');
    }
  } catch (error) {
    console.error('Error renovando token:', error);
  }
}

// Ejecutar cada 58 días (antes de que expire a 60)
export const renovarTokensCron = schedule('0 0 */58 * *', async () => {
  const supabase = createClient(...);

  const { data: usuarios } = await supabase
    .from('integraciones')
    .select('usuario_id')
    .eq('tipo', 'meta_ads')
    .eq('estado', 'conectada');

  for (const { usuario_id } of usuarios) {
    await renovarTokenMeta(usuario_id);
  }
});
```

---

### RF-126: Vista - Campañas Meta Sincronizadas

**Ubicación:** Dashboard → Meta Ads (nuevo tab)

```
┌──────────────────────────────────────────┐
│ 📊 MIS CAMPAÑAS META ADS                 │
├──────────────────────────────────────────┤
│                                          │
│ Estado: ✅ Conectada                    │
│ Última sincronización: Hace 5 minutos    │
│ Próxima sincronización: en 55 minutos    │
│                                          │
│ [🔄 Sincronizar ahora] [Desconectar]   │
│                                          │
│ CUENTAS PUBLICITARIAS:                   │
│ [Todos] [Cuenta 1] [Cuenta 2]           │
│                                          │
│ FILTRO:                                  │
│ [Período: Este mes]                     │
│                                          │
│ TABLA CAMPAÑAS:                          │
│ ┌────────────────────────────────────┐  │
│ │ Campaña        │ Gasto │ CPA  │ ...│  │
│ ├────────────────────────────────────┤  │
│ │ Meta Ads 1     │ $500  │ $2.5 │ ...│  │
│ │ Awareness      │ $1000 │ $3.2 │ ...│  │
│ │ Conversión     │ $800  │ $2.1 │ ...│  │
│ └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

---

### RF-127: Ver Detalles Campaña Meta

**Click en campaña abre panel:**

```
DETALLES CAMPAÑA: Meta Ads 1

Cuenta: ads_123456789
Status: Activa ✅

MÉTRICAS (Este mes):
├─ Impresiones: 45,234
├─ Clics: 1,234
├─ Conversiones: 234
├─ Gasto: $500
├─ CPA: $2.14
└─ CTR: 2.7%

PRESUPUESTO:
├─ Diario: $20
├─ Total: $500
└─ Gastado: $500 (100%)

GRÁFICO: Gasto vs Conversiones (últimos 30 días)

[Editar en Meta] [Comparar con costeo]
```

---

### RF-128: Desconectar Meta Ads

**Botón Desconectar:**

```
Confirmación:
┌──────────────────────────────────────────┐
│ ⚠️ Desconectar Meta Ads                 │
│                                          │
│ ¿Estás seguro?                          │
│                                          │
│ Se eliminarán los datos de campañas     │
│ históricos, pero puedes reconectar      │
│ en cualquier momento.                   │
│                                          │
│ [Cancelar]  [Sí, desconectar]          │
└──────────────────────────────────────────┘
```

**Acción:**
- Eliminar integración
- Limpiar datos campañas meta
- Mostrar botón "Conectar" nuevamente

---

### RF-129: Tabla Base de Datos - Integraciones

```sql
CREATE TABLE integraciones (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL UNIQUE, -- Un Meta por usuario
  
  tipo ENUM('meta_ads', 'shopify', 'dropi') NOT NULL,
  
  -- Token (encriptado)
  token_encriptado TEXT NOT NULL,
  token_refresco TEXT, -- Para renovación automática
  
  -- Meta específico
  meta_user_id VARCHAR,
  meta_user_name VARCHAR,
  meta_cuenta_id VARCHAR,
  
  -- Estado
  estado ENUM('conectada', 'error', 'expirada') DEFAULT 'conectada',
  error_mensaje TEXT,
  
  -- Timestamps
  fecha_conexion TIMESTAMP DEFAULT NOW(),
  fecha_renovacion TIMESTAMP,
  fecha_expiracion TIMESTAMP,
  ultima_sincronizacion TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES users(id),
  UNIQUE(usuario_id, tipo),
  INDEX(usuario_id),
  INDEX(tipo),
  INDEX(estado)
);

CREATE TABLE data_meta_ads (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL,
  
  id_campana_meta VARCHAR NOT NULL,
  nombre_campana VARCHAR,
  id_cuenta_publicidad VARCHAR,
  nombre_cuenta VARCHAR,
  moneda VARCHAR(3), -- USD, COP, etc
  
  -- Métricas
  impresiones BIGINT,
  clics BIGINT,
  conversiones BIGINT,
  valor_acciones NUMERIC,
  gasto_real NUMERIC,
  cpa_real NUMERIC,
  
  -- Presupuesto
  presupuesto_diario NUMERIC,
  presupuesto_total NUMERIC,
  estado_campana VARCHAR,
  
  -- Timestamps
  fecha_sincronizacion TIMESTAMP,
  fecha_creacion_campana TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES users(id),
  UNIQUE(usuario_id, id_campana_meta),
  INDEX(usuario_id),
  INDEX(fecha_sincronizacion)
);
```

---

### RF-130: RLS - Row Level Security

```sql
-- Usuario solo ve sus integraciones
CREATE POLICY "users_view_own_integraciones"
ON integraciones FOR SELECT
USING (usuario_id = auth.uid());

-- Usuario solo puede crear/actualizar sus integraciones
CREATE POLICY "users_manage_own_integraciones"
ON integraciones FOR UPDATE, DELETE
USING (usuario_id = auth.uid());

-- Usuario solo ve sus datos Meta
CREATE POLICY "users_view_own_meta_data"
ON data_meta_ads FOR SELECT
USING (usuario_id = auth.uid());
```

---

## 3. Integración con Tiendas (NO se vincula)

**Estructura:**

```
USUARIO
├─ Vinculación Meta Ads: 1 sola (a nivel usuario)
│  └─ Sirve para TODAS las tiendas
│
└─ Tiendas:
   ├─ Tienda 1
   │  ├─ Shopify: vinculación individual
   │  ├─ Dropi: vinculación individual
   │  └─ Meta Ads: usa la del usuario
   │
   ├─ Tienda 2
   │  ├─ Shopify: vinculación individual
   │  ├─ Dropi: vinculación individual
   │  └─ Meta Ads: usa la del usuario
   │
   └─ Tienda 3
      ├─ Shopify: vinculación individual
      ├─ Dropi: vinculación individual
      └─ Meta Ads: usa la del usuario
```

**En código:**

```typescript
// Cuando usuario crea costeo en Tienda 1
// Puede elegir campaña Meta de su cuenta (no de tienda)
const { data: campanasMeta } = await supabase
  .from('data_meta_ads')
  .select('*')
  .eq('usuario_id', usuarioActual.id); // A nivel usuario
```

---

## 4. API Endpoints

```
POST /api/integraciones/conectar-meta
├─ Callback recibe código
└─ Canjea por token + sincroniza

GET /api/integraciones/estado
├─ Ver si Meta está conectado
└─ Mostrar estado, última sincronización

GET /api/integraciones/campanas-meta
├─ Listar todas las campañas sincronizadas
├─ Query: ?cuenta=abc123 (opcional)
└─ Response: { campanas: [] }

POST /api/integraciones/desconectar-meta
├─ Eliminar integración
└─ Limpiar datos

GET /api/integraciones/campana/{id}
├─ Detalles de una campaña específica
└─ Gráficos, métricas, etc
```

---

## 5. Validaciones

**Permisos Meta requeridos:**
- ✅ ads_read (leer campañas)
- ✅ business_management (leer cuentas)

**Token:**
- Validar que no esté expirado
- Renovar automáticamente
- Si falla: marcar estado "expirada"

**Sincronización:**
- Mínimo cada hora
- Máximo reintento 3 veces si falla
- Si falla 3 veces: notificar usuario

---

## 6. Timeline Implementación

| Fase | Duración | Tareas |
|------|----------|--------|
| **Fase 1** | Día 1 | Setup Meta Developers + variables entorno |
| **Fase 2** | Día 1-2 | Botón + popup OAuth2 |
| **Fase 3** | Día 2 | Callback + canjear código |
| **Fase 4** | Día 2-3 | Sincronización campañas |
| **Fase 5** | Día 3 | Cron job (cada hora) + renovación token |
| **Fase 6** | Día 3-4 | Dashboard campañas Meta |
| **Fase 7** | Día 4-5 | Testing + Go live |

**Total:** 5 días (1 semana)

---

## 7. Checklist Go-Live

- [ ] App creado en Meta Developers
- [ ] Variables entorno configuradas (APP_ID, APP_SECRET)
- [ ] Popup OAuth2 funciona
- [ ] Callback recibe código
- [ ] Token se canjea correctamente
- [ ] Campañas se sincronizan
- [ ] Cron job sincroniza cada hora
- [ ] Token se renueva automáticamente
- [ ] Dashboard muestra campañas Meta
- [ ] Desconectar funciona
- [ ] RLS verificado (usuario solo ve sus datos)
- [ ] Error handling (si Meta falla)
- [ ] Testing responsivo
- [ ] Deploy staging ✅
- [ ] Deploy producción ✅

---

## 8. Security

**Token encriptado:**
- ✅ AES-256 en BD
- ✅ Solo backend puede acceder
- ✅ Nunca exponerlo en logs

**Estado (CSRF prevention):**
- ✅ Generar state aleatorio
- ✅ Guardar en session
- ✅ Validar en callback
- ✅ Eliminar después

**RLS:**
- ✅ Usuario solo ve sus integraciones
- ✅ Usuario solo ve sus campañas Meta
- ✅ No cruzar datos entre usuarios

---

## 9. Roadmap Futuro (V2+)

- Sincronización bidireccional (editar campaña desde DropCost)
- Multi-cuenta Meta (múltiples cuentas publicitarias)
- Histórico de cambios (auditoría)
- Alertas (presupuesto gastado, CPA alto)
- Comparar CPA real vs CPA en DropCost

---

**Fin Especificación de Requerimientos - Integración Meta Ads**

---

## 📊 RESUMEN

**RF-117 a RF-130 (14 nuevos requerimientos)**

✅ **Vinculación:**
- 1 sola por usuario
- Sirve para TODAS las tiendas
- NO se vincula por tienda (a diferencia de Shopify/Dropi)

✅ **Flujo:**
- Usuario: click "Conectar Meta"
- Popup Facebook (autoriza permisos paso a paso)
- Callback recibe código
- Backend canjea por token
- Sincroniza campañas automáticamente

✅ **Token:**
- Dura ~60 días
- Se renueva automáticamente (si se usa)
- Si expira: usuario debe reconectar (1 click)

✅ **Sincronización:**
- Automática cada hora (cron job)
- Guarda: campañas, presupuesto, CPA, conversiones
- BD en Supabase

✅ **Datos disponibles:**
- ID campaña
- Nombre campaña
- Impresiones, clics, conversiones
- Gasto real, CPA real
- Presupuesto diario/total
- Estado campaña

✅ **Security:**
- Token encriptado AES-256
- RLS (usuario solo ve sus datos)
- State validation (CSRF prevention)

✅ **Timeline:** 5 días
