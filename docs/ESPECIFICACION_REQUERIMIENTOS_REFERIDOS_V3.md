# Especificación de Requerimientos - Sistema de Referidos V3
## DropCost Master

**Versión:** 3.0 (Automático + Panel Admin de Configuración)  
**Fecha:** Febrero 2026  
**Fase:** Post-Auth y Planes  
**Requerimientos:** RF-064 a RF-082

---

## 1. Resumen Ejecutivo

Sistema de **referidos automático y configurable** donde:
- **Todo usuario** puede generar referidos y ganar comisiones (15% Nivel 1)
- **Ascenso automático a Líder** cuando alcanza X referidos activos (configurable, default 50)
- **Comisión Nivel 2** (5%, configurable) para Líderes
- **Vigencia 12 meses** (configurable desde admin)
- **Panel Admin centralizado** para controlar: porcentajes, límites, tiempos, sin tocar código

**Acceso:**
- Usuario normal: ve referidos propios (pantalla referidos)
- Líder: ve Nivel 1 + Nivel 2
- Admin/SuperAdmin: panel completo de control + estadísticas globales

---

## 2. Requerimientos Funcionales

### RF-064: Pantalla Referidos - Usuario Normal (No Líder)

**Ubicación:** Sidebar → Sistema de Referidos

**Vista Usuario Normal (Afiliado):**
```
┌──────────────────────────────────────────────────┐
│ 🎁 SISTEMA DE REFERIDOS                          │
│ Invita a otros Dropshippers y gana comisiones    │
├──────────────────────────────────────────────────┤
│                                                  │
│ Tu Enlace de Invitación:                         │
│ [http://localhost:5173/registro?ref=jariash] [Copiar]
│                                                  │
│ KPIs:                                            │
│ ┌─────────────┬──────────────┬────────────────┐│
│ │ Clicks      │ Registrados  │ Ganancias      ││
│ │ 15          │ 1            │ $0             ││
│ └─────────────┴──────────────┴────────────────┘│
│                                                  │
│ Tus Referidos (Nivel 1):                         │
│ ┌──────────────────────────────────────────────┐│
│ │ Usuario     │ Estado  │ F.Registro │ Acción ││
│ ├──────────────────────────────────────────────┤│
│ │ User Test   │ Activo  │ 15/2/2026  │ Ver >  ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ℹ️ Para ser LÍDER necesitas:                    │
│ • 50 referidos directos activos                 │
│ • Actualmente tienes: 1/50                      │
│                                                  │
│ [Billetera] [Historial] [Descargar Reporte]    │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### RF-065: Pantalla Referidos - Usuario Líder

**Vista Usuario Líder (automático cuando llega a 50+ referidos):**
```
┌──────────────────────────────────────────────────┐
│ 🎁 SISTEMA DE REFERIDOS                          │
│ Líder de Comunidad ⭐                            │
├──────────────────────────────────────────────────┤
│                                                  │
│ Tu Enlace de Invitación:                         │
│ [http://localhost:5173/registro?ref=jariash] [Copiar]
│                                                  │
│ KPIs:                                            │
│ ┌──────────────┬──────────────┬────────────────┐│
│ │ Clicks       │ Registrados  │ Ganancias      ││
│ │ 150          │ 52           │ $15.600        ││
│ └──────────────┴──────────────┴────────────────┘│
│                                                  │
│ TABS:                                            │
│ [Nivel 1 (Directo)] [Nivel 2 (Secundario)]     │
│                                                  │
│ NIVEL 1 - Tus Referidos Directos (52):          │
│ ┌──────────────────────────────────────────────┐│
│ │ Usuario     │ Estado  │ F.Registro │ Acción ││
│ ├──────────────────────────────────────────────┤│
│ │ User Test   │ Activo  │ 15/2/2026  │ Ver >  ││
│ │ Juan Pérez  │ Activo  │ 14/2/2026  │ Ver >  ││
│ │ María López │ Activo  │ 13/2/2026  │ Ver >  ││
│ │ ... (49 más)│         │            │        ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ NIVEL 2 - Referidos de tus Referidos (23):      │
│ ┌──────────────────────────────────────────────┐│
│ │ Referido De │ Usuario    │ F.Registro │ Acción│
│ ├──────────────────────────────────────────────┤│
│ │ Juan Pérez  │ Carlos     │ 10/2/2026  │ Ver > │
│ │ María López │ Ana García │ 8/2/2026   │ Ver > │
│ │ (usuario 1) │ Pedro Ruiz │ 5/2/2026   │ Ver > │
│ │ ... (20 más)│            │            │       │
│ └──────────────────────────────────────────────┘│
│                                                  │
│ [Billetera] [Historial] [Descargar Reporte]    │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### RF-066: Ver Detalles Referido (Expandir Nivel 2)

**Al hacer click "Ver >" en referido Nivel 1:**

```
┌──────────────────────────────────────────────────┐
│ ← Atrás | Referidos de: Juan Pérez              │
├──────────────────────────────────────────────────┤
│                                                  │
│ INFORMACIÓN:                                     │
│ ├─ Nombre: Juan Pérez                           │
│ ├─ Email: juan@example.com                      │
│ ├─ Registrado: 14 febrero 2026                  │
│ ├─ Estado: Activo                               │
│ ├─ Comisión Nivel 1: 15%                        │
│ ├─ Comisiones generadas: $10.200                │
│ └─ Vigencia comisión: 12 meses (10 restantes)   │
│                                                  │
│ SUS REFERIDOS (Nivel 2 para ti):                │
│ ┌──────────────────────────────────────────────┐│
│ │ Usuario    │ Estado  │ F.Registro │ Comisión ││
│ ├──────────────────────────────────────────────┤│
│ │ Carlos     │ Activo  │ 10/2/2026  │ 5%       ││
│ │ Ana García │ Activo  │ 8/2/2026   │ 5%       ││
│ │ Pedro Ruiz │ Activo  │ 5/2/2026   │ 5%       ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ Tu comisión por estos Nivel 2: $450/mes         │
│                                                  │
│ [Cerrar]                                         │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### RF-067: Panel Admin - Configuración Sistema de Referidos

**Ubicación:** Admin Panel → Configuración → Sistema de Referidos (NUEVO)

**Panel de Control (sin tocar código):**
```
┌─────────────────────────────────────────────────────────┐
│ ⚙️ CONFIGURACIÓN - SISTEMA DE REFERIDOS                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ COMISIONES:                                             │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Comisión Nivel 1 (Directo):                         ││
│ │ [15] % ← campo editable                             ││
│ │ Descripción: Porcentaje que gana usuario por c/ref ││
│ │                                                     ││
│ │ Comisión Nivel 2 (Secundario):                      ││
│ │ [5] % ← campo editable                              ││
│ │ Descripción: Porcentaje que gana Líder en Nivel 2  ││
│ │                                                     ││
│ │ [Guardar cambios]                                  ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ASCENSO A LÍDER:                                        │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Referidos requeridos para ser Líder:                ││
│ │ [50] ← campo editable                               ││
│ │ Descripción: Cantidad de referidos directos activos ││
│ │ para ascender automáticamente a Líder               ││
│ │                                                     ││
│ │ ℹ️ Cuando un usuario alcanza este número,          ││
│ │    automáticamente se convierte en Líder            ││
│ │                                                     ││
│ │ [Guardar cambios]                                  ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ VIGENCIA DE COMISIONES:                                 │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Meses de recurrencia de comisión:                   ││
│ │ [12] meses ← campo editable                          ││
│ │ Descripción: Tiempo máximo que una comisión es      ││
│ │ válida después de registrar un referido             ││
│ │                                                     ││
│ │ Ejemplo: Si es 12 meses, después de 12 meses       ││
│ │ la comisión expira automáticamente                  ││
│ │                                                     ││
│ │ [Guardar cambios]                                  ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ VISTA PREVIA:                                           │
│ Con los valores actuales:                              │
│ • Usuario gana 15% por referido directo               │
│ • Líder gana 5% por referido de referido              │
│ • Necesita 50 referidos para ser Líder                │
│ • Comisiones duran 12 meses                           │
│                                                         │
│ HISTORIAL DE CAMBIOS:                                  │
│ • 15/2/2026 - Admin cambió Comisión Nivel 1 a 15%   │
│ • 14/2/2026 - Sistema creado (valores por defecto)   │
│                                                         │
│ [Restaurar valores por defecto] [Exportar Config]     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### RF-068: Tabla Base de Datos - Configuración

```sql
CREATE TABLE sistema_referidos_config (
  id UUID PRIMARY KEY,
  
  -- Comisiones
  comision_nivel_1 NUMERIC(5,2) DEFAULT 15.00, -- %
  comision_nivel_2 NUMERIC(5,2) DEFAULT 5.00,  -- %
  
  -- Ascenso a Líder
  referidos_minimo_lider INTEGER DEFAULT 50, -- cantidad
  
  -- Vigencia
  meses_vigencia_comision INTEGER DEFAULT 12, -- meses
  
  -- Control
  fecha_actualizacion TIMESTAMP DEFAULT NOW(),
  actualizado_por UUID, -- admin que hizo cambio
  
  FOREIGN KEY (actualizado_por) REFERENCES users(id)
);

-- Tabla historial cambios
CREATE TABLE sistema_referidos_cambios (
  id UUID PRIMARY KEY,
  
  tipo_cambio VARCHAR, -- 'comision_nivel_1', 'comision_nivel_2', 'referidos_minimo', 'vigencia'
  valor_anterior NUMERIC,
  valor_nuevo NUMERIC,
  
  usuario_admin UUID NOT NULL,
  fecha_cambio TIMESTAMP DEFAULT NOW(),
  descripcion TEXT,
  
  FOREIGN KEY (usuario_admin) REFERENCES users(id)
);
```

---

### RF-069: Ascenso Automático a Líder (Cron Job)

**Ejecutar diariamente (1am):**

```typescript
// Ejecutar cada día
schedule.scheduleJob('0 1 * * *', async () => {
  const config = await obtenerConfigReferidos();
  const referidosMinimo = config.referidos_minimo_lider; // 50, configurable
  
  // Obtener usuarios que PODRÍAN ser líderes
  const usuariosCandidatos = await db.query(`
    SELECT u.id, COUNT(ru.id) as total_referidos
    FROM users u
    LEFT JOIN referidos_usuarios ru ON u.id = ru.lider_id
    WHERE u.rol = 'usuario'
    AND ru.estado = 'activo'
    GROUP BY u.id
    HAVING COUNT(ru.id) >= $1
  `, [referidosMinimo]);
  
  // Ascender a Líder
  for (const usuario of usuariosCandidatos) {
    await db.query(`
      UPDATE users 
      SET rol = 'lider'
      WHERE id = $1 AND rol = 'usuario'
    `, [usuario.id]);
    
    // Notificar usuario
    await enviarEmail(usuario.email, {
      asunto: '🎉 ¡Felicidades! Eres ahora Líder de Comunidad',
      contenido: `Alcanzaste ${usuario.total_referidos} referidos activos
                  Ahora ganas comisión Nivel 2 (5%) de tus referidos.
                  Accede a tu panel de Referidos para ver más detalles.`
    });
  }
  
  console.log(`${usuariosCandidatos.length} usuarios ascendidos a Líder`);
});
```

---

### RF-070: Panel Admin - Estadísticas Globales Referidos

**Ubicación:** Admin Panel → Reportes → Sistema de Referidos (NUEVO)

```
┌────────────────────────────────────────────────────┐
│ 📊 ESTADÍSTICAS GLOBALES - SISTEMA DE REFERIDOS    │
├────────────────────────────────────────────────────┤
│                                                    │
│ KPIs GENERALES:                                    │
│ ┌──────────────┬──────────────┬────────────────┐  │
│ │ Total        │ Usuarios     │ Ganancias      │  │
│ │ Referidos    │ Líderes      │ Totales        │  │
│ │ 1,234        │ 23           │ $180.400       │  │
│ └──────────────┴──────────────┴────────────────┘  │
│                                                    │
│ COMISIONES PAGADAS (Mes actual):                   │
│ │ Nivel 1: $120.300                               │
│ │ Nivel 2: $18.900                                │
│ │ Total pagado: $139.200                          │
│                                                    │
│ TOP 10 LÍDERES (por comisiones):                   │
│ ┌────────────────────────────────────────────────┐ │
│ │ Líder          │ Referidos │ Comisión  │ Pagos │ │
│ ├────────────────────────────────────────────────┤ │
│ │ Ivan Caicedo   │ 120       │ $18.000   │ ✅    │ │
│ │ Juan Pérez     │ 95        │ $14.250   │ ✅    │ │
│ │ María García   │ 87        │ $13.050   │ ✅    │ │
│ │ ... (7 más)    │           │           │       │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ COMISIONES POR EXPIRAR (próximos 30 días):        │
│ • 45 comisiones de usuarios registrados hace      │
│   11-12 meses                                     │
│ • Monto estimado a no pagar: $5.600               │
│                                                    │
│ [Descargar Reporte] [Ver Detalles]               │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### RF-071: Panel Admin - Gestión de Pagos Referidos

**Ubicación:** Admin Panel → Pagos → Referidos (NUEVO)

```
┌────────────────────────────────────────────────────┐
│ 💰 GESTIÓN DE PAGOS - REFERIDOS                    │
├────────────────────────────────────────────────────┤
│                                                    │
│ FILTROS:                                           │
│ [Estado: Pendiente ▼] [Mes: Feb 2026 ▼]          │
│ [Usuario: ___________] [Buscar]                   │
│                                                    │
│ TABLA PAGOS PENDIENTES:                            │
│ ┌────────────────────────────────────────────────┐ │
│ │ Líder     │ Monto   │ Referidos │ F.Vencimiento│ │
│ ├────────────────────────────────────────────────┤ │
│ │ Ivan      │ $12.500 │ 50        │ 15 mar 2026 │ │
│ │ Juan      │ $10.200 │ 42        │ 14 mar 2026 │ │
│ │ María     │ $9.800  │ 38        │ 13 mar 2026 │ │
│ │           │         │           │             │ │
│ │ [✓] Pagar│ [✓] Verificar │ [✓] Exportar  │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ ACCIONES:                                          │
│ [Procesar pagos seleccionados]                    │
│ [Generar archivo Transfer Wise]                   │
│ [Enviar notificaciones]                           │
│                                                    │
│ HISTORIAL PAGOS (últimos 30 días):                │
│ ┌────────────────────────────────────────────────┐ │
│ │ Líder  │ Monto │ F.Pago │ Referencia │ Estado │ │
│ ├────────────────────────────────────────────────┤ │
│ │ Ivan   │ $12.5k│ 1 feb  │ TW-001     │ ✅ Pag │ │
│ │ Juan   │ $10.2k│ 1 feb  │ TW-002     │ ✅ Pag │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### RF-072: API Endpoints Configuración

```
GET /api/admin/referidos/config
├─ Admin only
└─ Response: { comision_nivel_1, comision_nivel_2, 
              referidos_minimo_lider, meses_vigencia }

PUT /api/admin/referidos/config
├─ Admin only
├─ Request: { comision_nivel_1?, comision_nivel_2?, 
             referidos_minimo_lider?, meses_vigencia_comision? }
└─ Response: { success, cambios_realizados }

GET /api/admin/referidos/cambios-historial
├─ Admin only
└─ Response: array de cambios realizados

GET /api/admin/referidos/estadisticas
├─ Admin only
└─ Response: { total_referidos, usuarios_lideres, 
              comisiones_pagadas, top_lideres }

POST /api/admin/referidos/procesar-pagos
├─ Admin only
├─ Request: { lider_ids: [] }
└─ Response: { pagos_procesados, total }
```

---

## 3. Cambios Principales vs V2.0

```
ANTES (V2.0):
├─ Líderes creados manualmente por admin
├─ Configuración hardcodeada (tocar código)
└─ Sin panel admin de control

AHORA (V3.0) - ACTUALIZADO:
├─ Ascenso automático a Líder (50+ referidos) ✨
├─ Panel Admin centralizado (sin código) ✨
├─ Comisiones configurables (15%, 5%, etc) ✨
├─ Límite referidos configurable (50, 100, etc) ✨
├─ Vigencia configurable (12, 6, 24 meses, etc) ✨
├─ Historial de cambios (auditoría) ✨
├─ Estadísticas globales para admin ✨
└─ Gestión de pagos centralizada ✨

BENEFICIO:
└─ Admin controla TODO sin tocar código
└─ Cambios en tiempo real
└─ Flexible y escalable
```

---

## 4. Tabla de Configuración - Valores por Defecto

```
Parámetro                    | Default | Rango        | Notas
----|---|---|---
Comisión Nivel 1             | 15%     | 5%-30%       | Usuario normal
Comisión Nivel 2             | 5%      | 2%-10%       | Líder Nivel 2
Referidos mínimo para Líder   | 50      | 10-500       | Cantidad referidos
Meses vigencia comisión       | 12      | 1-36 meses   | Duración máxima
```

---

## 5. Timeline Implementación

| Fase | Duración | Tareas |
|------|----------|--------|
| **Fase 1** | Semana 1 | Tablas BD + configuración |
| **Fase 2** | Semana 2 | Panel Admin (config) |
| **Fase 3** | Semana 2 | Cron ascenso automático |
| **Fase 4** | Semana 3 | Pantalla referidos (usuario + líder) |
| **Fase 5** | Semana 3 | Estadísticas admin |
| **Fase 6** | Semana 4 | Testing + Go live |

---

**Fin Especificación de Requerimientos - Sistema de Referidos V3.0**

---

## 📊 RESUMEN V3.0

**RF-064 a RF-072 (9 requerimientos funcionales)**

✅ **Automático:**
- Todo usuario genera referidos
- Ascenso automático a Líder (50+ referidos configurable)
- Comisión Nivel 2 automática para Líderes
- Sin crear líderes manualmente

✅ **Panel Admin Configurable:**
- Comisión Nivel 1 (configurable)
- Comisión Nivel 2 (configurable)
- Límite referidos para ser Líder (configurable)
- Vigencia comisión en meses (configurable)
- Sin tocar código

✅ **Vistas:**
- Usuario normal: solo Nivel 1
- Líder: Nivel 1 + Nivel 2
- Admin: todo + estadísticas globales + pagos

✅ **Limpio:**
- Sin MLM/pirámide
- Meritocrático
- Automático y escalable

✅ **Timeline:** 4 semanas
