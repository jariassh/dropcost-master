# Especificación de Requerimientos - Analytics de Tráfico
## DropCost Master

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Fase:** Post-Acortador (Semana 22-24)  
**Requerimientos:** RF-103 a RF-118  
**Acceso:** Admin Only 🔒

---

## 1. Resumen Ejecutivo

Sistema de **Analytics de Tráfico** exclusivo para administradores. Permite:
- Rastrear pageviews, clicks, conversiones en tiempo real
- Ver estadísticas por enlace acortado
- Analizar comportamiento usuarios
- Reportes detallados por período
- Gráficos interactivos (Recharts)
- Exportar datos (CSV, PDF)

**Privacidad:** Los datos NO van a Google Analytics. Todo en BD propia (Supabase).

---

## 2. Requerimientos Funcionales

### RF-103: Pixel de Rastreo / Script Analytics

**Implementación:**
Agregar script en `_app.tsx` (React):

```typescript
// src/hooks/useAnalytics.ts

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/services/supabase';

export function useAnalytics() {
  const router = useRouter();
  
  useEffect(() => {
    // Rastrear pageview
    const registrarPageView = async () => {
      const usuario = await obtenerUsuarioActual();
      
      await supabase.from('analytics_eventos').insert({
        tipo: 'pageview',
        pagina: router.pathname,
        usuario_id: usuario?.id || null,
        ip_address: await obtenerIP(),
        user_agent: navigator.userAgent,
        timestamp: new Date(),
        dispositivo: detectarDispositivo(),
        navegador: detectarNavegador()
      });
    };
    
    registrarPageView();
  }, [router.pathname]);
  
  // Función para rastrear clicks en enlaces
  window.registrarClickEnlace = async (enlaceId: string, tipoEnlace: string) => {
    const usuario = await obtenerUsuarioActual();
    
    await supabase.from('analytics_eventos').insert({
      tipo: 'click_enlace',
      enlace_id: enlaceId,
      tipo_enlace: tipoEnlace, // 'curso', 'referido', 'externo'
      usuario_id: usuario?.id || null,
      pagina: window.location.pathname,
      timestamp: new Date()
    });
  };
  
  return { registrarClickEnlace };
}
```

**Uso en componentes:**

```typescript
// En card de curso
const { registrarClickEnlace } = useAnalytics();

<a 
  href={urlAcortada}
  onClick={() => registrarClickEnlace('xK9m2p', 'curso')}
>
  Ver Curso
</a>
```

---

### RF-104: Tabla Base de Datos - Eventos Analytics

```sql
CREATE TABLE analytics_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de evento
  tipo ENUM(
    'pageview',        -- Usuario entra a página
    'click_enlace',    -- Usuario hace click en enlace
    'ver_curso',       -- Usuario abre página curso
    'agregar_favorito',-- Usuario favorita curso
    'inicio_sesion',   -- Usuario login
    'registro',        -- Nuevo usuario
    'cambio_plan',     -- Usuario cambió plan
    'solicitud_pago'   -- Usuario solicitó pago
  ),
  
  -- Página y enlace
  pagina VARCHAR, -- '/cursos', '/dashboard', '/admin'
  enlace_id VARCHAR, -- 'xK9m2p' (si es click_enlace)
  tipo_enlace VARCHAR, -- 'curso', 'referido', 'externo'
  
  -- Usuario
  usuario_id UUID, -- NULL si no está logueado
  
  -- Geolocalización (opcional)
  ip_address VARCHAR,
  pais VARCHAR(2),
  ciudad VARCHAR,
  
  -- Dispositivo y navegador
  user_agent TEXT,
  dispositivo ENUM('mobile', 'tablet', 'desktop'),
  navegador VARCHAR, -- 'Chrome', 'Safari', 'Firefox'
  sistema_operativo VARCHAR, -- 'Windows', 'macOS', 'iOS', 'Android'
  
  -- Sesión
  sesion_id VARCHAR, -- Agrupar eventos por sesión
  duracion_pagina_segundos INTEGER, -- Cuánto estuvo en página
  
  -- Timestamp
  timestamp TIMESTAMP DEFAULT NOW(),
  fecha DATE DEFAULT TODAY(),
  
  -- Índices para performance
  FOREIGN KEY (usuario_id) REFERENCES users(id),
  INDEX(timestamp),
  INDEX(fecha),
  INDEX(tipo),
  INDEX(pagina),
  INDEX(usuario_id),
  INDEX(enlace_id)
);
```

---

### RF-105: Dashboard Analytics - Vista General

**Ubicación:** Admin → Analytics (nuevo menú)

**Pantalla principal:**

```
┌─────────────────────────────────────────────────┐
│ 📊 ANALYTICS DE TRÁFICO                         │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Hoy] [Esta semana] [Este mes] [Personalizado] │
│ [Desde: 1 feb] [Hasta: 15 feb]                 │
│ [Exportar CSV] [Exportar PDF]                  │
│                                                 │
│ KPIs PRINCIPALES:                              │
│ ┌─────────────┬─────────────┬─────────────┐   │
│ │ Pageviews   │ Usuarios    │ Conversiones│   │
│ │ 12,345      │ 1,234       │ 234 (19%)   │   │
│ │ ↑ 23%       │ ↑ 15%       │ ↑ 8%        │   │
│ └─────────────┴─────────────┴─────────────┘   │
│                                                 │
│ GRÁFICO: Pageviews últimos 7 días              │
│ ┌────────────────────────────────────────┐    │
│ │      ╱╲    ╱╲    ╱╲                   │    │
│ │  ╱╲╱  ╲╱╲╱  ╲╱╲╱                      │    │
│ │ Lun  Mar  Mié  Jue  Vie  Sab  Dom     │    │
│ └────────────────────────────────────────┘    │
│                                                 │
│ PRINCIPALES PÁGINAS:                           │
│ ┌────────────────────────────────────────┐    │
│ │ /cursos              │ 5,234 views (42%)│    │
│ │ /dashboard           │ 3,123 views (25%)│    │
│ │ /ofertas             │ 2,145 views (17%)│    │
│ │ /registro            │ 1,345 views (11%)│    │
│ │ /simulador           │ 498 views (4%)   │    │
│ └────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### RF-106: Panel Analytics - Por Enlace Acortado

**Ubicación:** Admin → Analytics → Enlaces Acortados

```
┌──────────────────────────────────────────────┐
│ 🔗 ANALYTICS ENLACES ACORTADOS               │
├──────────────────────────────────────────────┤
│                                              │
│ FILTRAR:                                     │
│ [Tipo: Todos] [Período: Este mes]           │
│ [Búsqueda: _______________]                 │
│                                              │
│ TABLA:                                       │
│ ┌───────────────────────────────────────┐   │
│ │ Slug   │ Título          │ Clicks    │   │
│ ├───────────────────────────────────────┤   │
│ │ xK9m2p │ Meta Ads Course │ 1,234 ↑15│   │
│ │ aB7kL3 │ Referido Ivan   │ 567 ↓-2  │   │
│ │ cD2pQ9 │ Google Analytics│ 456 →0   │   │
│ │ eF5mN1 │ Dropshipping 101│ 234 ↑8   │   │
│ │ gH8vL2 │ Design Course   │ 123      │   │
│ │                                      │    │
│ │ [Ver detalles]  [Más info]         │   │
│ └───────────────────────────────────────┘   │
│                                              │
└──────────────────────────────────────────────┘
```

---

### RF-107: Detalles de Enlace - Estadísticas Detalladas

**Panel lateral/Modal: Click en enlace**

```
┌──────────────────────────────────────────────┐
│ DETALLES: xK9m2p - Meta Ads Course         ✕ │
├──────────────────────────────────────────────┤
│                                              │
│ INFORMACIÓN                                  │
│ ├─ Slug: xK9m2p                             │
│ ├─ Título: Meta Ads Course                 │
│ ├─ Tipo: Curso (Udemy)                     │
│ └─ Creado: 1 feb 2026                      │
│                                              │
│ ESTADÍSTICAS (últimos 30 días)              │
│ ├─ Total clicks: 1,234                     │
│ ├─ Clicks hoy: 45                          │
│ ├─ Clicks promedio/día: 41                 │
│ ├─ Último click: Hace 2 horas              │
│ └─ Tendencia: ↑ +15% vs semana anterior    │
│                                              │
│ GRÁFICO CLICKS (últimos 30 días):           │
│ ┌──────────────────────────────────────┐   │
│ │      ╱╲ ╱╲      ╱╲ ╱╲ ╱╲            │   │
│ │  ╱╲╱  ╲╱  ╲╱╱╲╱╲╱╱  ╲╱╱╲╱          │   │
│ └──────────────────────────────────────┘   │
│                                              │
│ POR DISPOSITIVO:                             │
│ ├─ Desktop: 732 clicks (59%)               │
│ ├─ Mobile: 456 clicks (37%)                │
│ └─ Tablet: 46 clicks (4%)                  │
│                                              │
│ POR NAVEGADOR:                              │
│ ├─ Chrome: 739 clicks (60%)                │
│ ├─ Safari: 298 clicks (24%)                │
│ ├─ Firefox: 123 clicks (10%)               │
│ └─ Otros: 74 clicks (6%)                   │
│                                              │
│ POR PAÍS:                                   │
│ ├─ Colombia: 587 clicks (48%)              │
│ ├─ México: 234 clicks (19%)                │
│ ├─ Argentina: 187 clicks (15%)             │
│ ├─ España: 156 clicks (13%)                │
│ └─ Otros: 70 clicks (5%)                   │
│                                              │
│ REFERENCIAS (dónde vinieron):               │
│ ├─ Directo: 456 clicks (37%)               │
│ ├─ Email: 345 clicks (28%)                 │
│ ├─ WhatsApp: 234 clicks (19%)              │
│ └─ Otros: 199 clicks (16%)                 │
│                                              │
└──────────────────────────────────────────────┘
```

---

### RF-108: Analytics - Comportamiento de Usuarios

**Ubicación:** Admin → Analytics → Usuarios

```
┌──────────────────────────────────────────────┐
│ 👥 COMPORTAMIENTO DE USUARIOS                │
├──────────────────────────────────────────────┤
│                                              │
│ PERÍODO: [Este mes]                         │
│                                              │
│ USUARIOS ÚNICOS: 1,234                      │
│ USUARIOS NUEVOS: 234 (19%)                  │
│ SESIONES TOTALES: 2,567                     │
│ DURACIÓN PROMEDIO SESIÓN: 4m 32s            │
│ PÁGINAS/SESIÓN: 3.2                         │
│ BOUNCE RATE: 32%                            │
│                                              │
│ GRÁFICO: Usuarios únicos vs Visitantes      │
│ ┌──────────────────────────────────────┐   │
│ │ Usuarios: —— (azul)                  │   │
│ │ Sesiones: —— (naranja)               │   │
│ │                                      │   │
│ │    ╱╲    ╱╲    ╱╲                   │   │
│ │  ╱  ╲╱╲╱  ╲╱╱╲╱╲╱                    │   │
│ └──────────────────────────────────────┘   │
│                                              │
│ USUARIOS MÁS ACTIVOS:                       │
│ ┌──────────────────────────────────────┐   │
│ │ Usuario             │ Sesiones │ Views│   │
│ ├──────────────────────────────────────┤   │
│ │ juan@example.com    │ 12       │ 87   │   │
│ │ maria@example.com   │ 9        │ 65   │   │
│ │ carlos@example.com  │ 8        │ 54   │   │
│ └──────────────────────────────────────┘   │
│                                              │
│ CONVERSIÓN POR TIPO USUARIO:                │
│ ├─ Registrados: 24% conversión             │
│ ├─ Gratis: 8% conversión                   │
│ ├─ Pro: 45% conversión                     │
│ └─ Enterprise: 67% conversión              │
│                                              │
└──────────────────────────────────────────────┘
```

---

### RF-109: Analytics - Conversiones por Tipo

**Ubicación:** Admin → Analytics → Conversiones

```
┌──────────────────────────────────────────────┐
│ 💰 CONVERSIONES                              │
├──────────────────────────────────────────────┤
│                                              │
│ PERÍODO: [Este mes]                         │
│                                              │
│ CONVERSIONES TOTALES: 234                   │
│ TASA CONVERSIÓN: 19%                        │
│ INGRESOS GENERADOS: $12,345 USD             │
│                                              │
│ POR TIPO:                                   │
│ ├─ Registro: 234 (100%)                    │
│ ├─ Cambio plan: 89 (38%)                   │
│ ├─ Compra curso: 45 (19%)                  │
│ ├─ Referido activado: 34 (14%)             │
│ └─ Pago comisión: 12 (5%)                  │
│                                              │
│ GRÁFICO: Conversiones por día               │
│ ┌──────────────────────────────────────┐   │
│ │  ╱╲  ╱╲                              │   │
│ │ ╱  ╲╱  ╲  ╱╲ ╱╲                      │   │
│ │        ╲╱  ╲╱╲                       │   │
│ └──────────────────────────────────────┘   │
│                                              │
│ EMBUDO DE CONVERSIÓN:                       │
│ ├─ Visitors: 12,345 (100%)                 │
│ ├─ Clic registro: 1,234 (10%)              │
│ ├─ Registrados: 456 (37% de clic)          │
│ ├─ Activos 7d: 234 (51% de registrados)    │
│ └─ Plan pago: 89 (38% de activos)          │
│                                              │
└──────────────────────────────────────────────┘
```

---

### RF-110: Analytics - Reportes Descargables

**Opciones de exportación:**

```
[Exportar CSV]
├─ Datos brutos (todas las columnas)
├─ Período seleccionado
└─ Archivo: analytics_2026-02-01_2026-02-15.csv

[Exportar PDF]
├─ Reporte visual (gráficos + tablas)
├─ Resumen ejecutivo
├─ Incluye: KPIs, gráficos, top páginas/enlaces
└─ Archivo: analytics_reporte_febrero_2026.pdf

[Enviar por Email]
├─ Seleccionar período
├─ Seleccionar tipo (completo, resumen)
└─ Enviar a: admin@dropcostmaster.com
```

---

### RF-111: Panel Analytics - Filtro por Rango de Fechas

**Controles:**

```
[Hoy] [Ayer] [Esta semana] [Último mes] [Este mes] [Personalizado]

Personalizado:
├─ Desde: [15 feb 2026] ← date picker
└─ Hasta: [20 feb 2026] ← date picker

URL se actualiza:
/admin/analytics?desde=2026-02-15&hasta=2026-02-20
```

---

### RF-112: Alerts/Notificaciones Analytics (Opcional)

**Admin recibe notificación si:**
- Spike de 100+ clicks en 1 hora
- Nuevo tipo de evento detectado
- Bounce rate >50%
- Conversión <10% (alerta baja)

**Notificación in-app:**
```
🔔 Alerta: Spike de tráfico detectado
   xK9m2p (Meta Ads Course)
   234 clicks en última hora
   
   [Ver detalles] [Cerrar]
```

---

### RF-113: Comparar períodos

**Opción para comparar 2 períodos:**

```
Período 1: [Último mes] vs Período 2: [Mes anterior]

Resultados:
├─ Pageviews: 12,345 vs 10,234 (↑ +20%)
├─ Usuarios: 1,234 vs 1,100 (↑ +12%)
├─ Conversiones: 234 vs 189 (↑ +24%)
└─ Gráficos lado a lado

"El mes anterior fue mejor/peor en:"
├─ Tráfico (+20%)
├─ Conversiones (+24%)
└─ Engagement (sin cambios)
```

---

### RF-114: RLS - Row Level Security para Analytics

**Seguridad:**

```sql
-- Solo admin puede ver analytics
CREATE POLICY "admin_only_analytics"
ON analytics_eventos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

**En código:**
```typescript
// Si no es admin, redirigir a 404
if (!usuarioActual.esAdmin) {
  return <NotFound />;
}
```

---

### RF-115: Cache y Performance de Analytics

**Para no ralentizar BD:**

```typescript
// Agregar caché Redis (opcional pero recomendado)
async function obtenerEstadisticas(periodo: string) {
  const cacheKey = `stats_${periodo}`;
  
  // Buscar en caché
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Si no hay caché, consultar BD
  const stats = await calcularEstadisticas(periodo);
  
  // Guardar en caché por 1 hora
  await redis.setex(cacheKey, 3600, JSON.stringify(stats));
  
  return stats;
}
```

**Sin caché:** Queries directas a BD (más lento pero simple)
**Con caché:** Más rápido, se actualiza cada hora

---

### RF-116: API Endpoints Analytics (Admin Only)

```
GET /api/admin/analytics/kpis
├─ Query: ?desde=2026-02-01&hasta=2026-02-15
├─ Admin only
└─ Response: { pageviews, usuarios, conversiones }

GET /api/admin/analytics/pageviews
├─ Query: ?período=semana|mes|custom
├─ Response: { datos, gráfico }

GET /api/admin/analytics/enlaces
├─ Query: ?tipo=todos|curso|referido
├─ Response: { tabla enlaces + clicks }

GET /api/admin/analytics/usuarios
├─ Response: { usuarios activos, comportamiento }

GET /api/admin/analytics/conversiones
├─ Response: { embudo conversión, gráficos }

POST /api/admin/analytics/exportar
├─ Request: { formato: 'csv'|'pdf', período }
├─ Response: { download_url }

GET /api/admin/analytics/comparar
├─ Query: ?período1=enero&período2=febrero
└─ Response: { comparación, variaciones }
```

---

## 3. Base de Datos - Índices Críticos

```sql
-- Índices para performance de queries
CREATE INDEX idx_analytics_timestamp ON analytics_eventos(timestamp);
CREATE INDEX idx_analytics_tipo ON analytics_eventos(tipo);
CREATE INDEX idx_analytics_pagina ON analytics_eventos(pagina);
CREATE INDEX idx_analytics_usuario ON analytics_eventos(usuario_id);
CREATE INDEX idx_analytics_enlace ON analytics_eventos(enlace_id);
CREATE INDEX idx_analytics_fecha ON analytics_eventos(fecha);
CREATE INDEX idx_analytics_dispositivo ON analytics_eventos(dispositivo);

-- Índices compuestos para búsquedas comunes
CREATE INDEX idx_analytics_tipo_fecha ON analytics_eventos(tipo, fecha);
CREATE INDEX idx_analytics_usuario_tipo ON analytics_eventos(usuario_id, tipo);
CREATE INDEX idx_analytics_enlace_tipo ON analytics_eventos(enlace_id, tipo);
```

---

## 4. Validaciones

**Acceso:**
- ✅ Solo admin puede ver analytics
- ✅ Si no es admin → 404 o redirigir login
- ✅ No logurado → 401 Unauthorized

**Filtros:**
- Período máximo: 365 días (no permitir queries gigantes)
- Mínimo: 1 día

---

## 5. Privacidad y Compliance

**Qué se recolecta:**
- ✅ Pageviews, clicks
- ✅ Dispositivo, navegador, país
- ✅ User ID (si está logueado)
- ✅ NO emails (privacidad)
- ✅ NO datos bancarios

**GDPR/LGPD compliance:**
- Usuarios pueden solicitar borrar sus datos
- Analytics se anonimiza después de 90 días
- No compartir con terceros

---

## 6. Timeline Implementación

| Fase | Duración | Tareas |
|------|----------|--------|
| **Fase 1** | Día 1 | BD table + índices + script pixel |
| **Fase 2** | Día 1-2 | Endpoints API (6 nuevos) |
| **Fase 3** | Día 2-3 | Dashboard principal + gráficos |
| **Fase 4** | Día 3 | Panel enlaces + usuarios |
| **Fase 5** | Día 3-4 | Exportar + filtros |
| **Fase 6** | Día 4-5 | Testing + Go live |

**Total:** 5 días (1 semana)

---

## 7. Herramientas/Librerías Necesarias

```
npm install recharts
npm install date-fns
npm install axios (para exportar)

// Ya tenemos
- Supabase (BD)
- React Query (fetch)
- TypeScript (tipos)
```

---

## 8. Checklist Go-Live

- [ ] Tabla analytics_eventos creada
- [ ] Índices en BD
- [ ] Script pixel en _app.tsx
- [ ] Tracking en clicks (useAnalytics hook)
- [ ] API endpoints funcionando
- [ ] Dashboard principal (KPIs + gráficos)
- [ ] Panel enlaces acortados (analytics)
- [ ] Panel usuarios
- [ ] Panel conversiones
- [ ] Exportar CSV/PDF funcionando
- [ ] RLS verificado (solo admin)
- [ ] Caché Redis (opcional, si quedan recursos)
- [ ] Testing responsivo
- [ ] Dark mode soporte
- [ ] Deploy staging ✅
- [ ] Deploy producción ✅

---

## 9. Qué se puede ver en Analytics

```
COMO ADMIN VES:
├─ Total pageviews (cuánta gente entra)
├─ Usuarios únicos (cuántas personas diferentes)
├─ Clicks por enlace acortado (qué links más populares)
├─ Conversión por tipo (quién se convierte)
├─ Top páginas (dónde pasan más tiempo)
├─ Dispositivos (mobile/desktop split)
├─ Países (geolocalización)
├─ Navegadores (Chrome, Safari, etc)
├─ Comportamiento usuario (duración, bounce rate)
└─ Comparaciones entre períodos (mes vs mes)

QUE NO VE:
❌ Datos personales usuarios (emails, números)
❌ Información bancaria/pagos (privacidad)
❌ Conversaciones (chat, tickets)
└─ Solo comportamiento/tráfico
```

---

## 10. Roadmap Futuro (V2+)

- Heat maps (dónde hacen click en página)
- User sessions (video de lo que hace usuario, opcional)
- A/B testing nativo
- Predicciones (ML: qué pasa mañana)
- Integración con Google Ads (meta tracking)
- Funnel analysis (dónde se caen usuarios)
- Cohort analysis (grupos de usuarios)

---

**Fin Especificación de Requerimientos - Analytics de Tráfico**

---

## 📊 RESUMEN EJECUTIVO

**RF-103 a RF-116 (14 nuevos requerimientos)**

✅ **Funcionalidades:**
- Rastreo de pageviews, clicks, conversiones
- Dashboard con KPIs principales
- Análisis por enlace acortado
- Comportamiento de usuarios
- Conversiones y embudo
- Filtros por período
- Exportar CSV/PDF
- Comparar períodos
- Geolocalización, dispositivos, navegadores

✅ **Seguridad:**
- Admin only (RLS verificado)
- No recolecta datos personales
- GDPR/LGPD compliant

✅ **Base de datos:**
- 1 tabla (analytics_eventos)
- 9 índices críticos
- Queries optimizadas

✅ **API:**
- 7 endpoints nuevos
- Todos requieren admin

✅ **Timeline:**
- 5 días (1 semana)

✅ **Performance:**
- Con caché Redis: muy rápido
- Sin caché: lento pero funciona

✅ **Costo:**
- $0 adicional (Supabase + Recharts)

✅ **Lo que ves como admin:**
- Quién visita, qué páginas, cuándo
- Qué enlaces se usan más
- Cuál es el embudo de conversión
- Tendencias y comparaciones

❌ **Lo que NO ves:**
- Datos personales (emails, teléfonos)
- Info pagos (privacidad)
- Conversaciones privadas
