# Especificación de Requerimientos - Sistema de Referidos
## DropCost Master

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Fase:** Post-Auth y Planes (después de RF-041)  
**Requerimientos:** RF-064 a RF-078

---

## 1. Requerimientos Funcionales

### RF-064: Crear Líder de Comunidad (Admin)

**Acceso:** Solo admin

**Proceso:**
1. Admin accede Panel Admin → Referidos
2. Botón "+ Nuevo Líder"
3. Completa:
   - Nombre líder (ej: Ivan Caicedo)
   - Email líder
   - Porcentaje comisión (ej: 25%)
   - País (para Transfer Wise)

**Sistema genera automáticamente:**
- Código referido: `ivan_caicedo` (basado en nombre, espacios → underscore)
- Enlace: `https://app.dropcostmaster.com?ref=ivan_caicedo`

**Respuesta:**
```
✅ Líder creado exitosamente
Código: ivan_caicedo
Enlace: https://app.dropcostmaster.com?ref=ivan_caicedo
Comisión: 25%
Estado: Activo
```

---

### RF-065: Editar Código de Referido

**Acceso:** Admin o el mismo líder

**Validaciones:**
- Código debe ser único (no existir)
- Código debe ser alphanumeric + underscore (ej: `ivan_caicedo_2026` ✅, `ivan caicedo` ❌)
- Mínimo 5 caracteres, máximo 30
- No puede ser código reservado (ej: `admin`, `login`, `app`)

**Proceso:**
1. Panel Admin → Seleccionar líder
2. Campo "Código de referido": `ivan_caicedo`
3. Editar a: `ivan_caicedo_v2` (ej)
4. Validar: "Este código está disponible ✅"
5. Guardar
6. Enlace se actualiza automáticamente

**Validación en tiempo real:**
```
Input: ivan_caicedo_v2
└─ Disponible ✅

Input: ivan_caicedo (ya existe)
└─ Este código ya está en uso ❌

Input: ivan caicedo (con espacio)
└─ Solo caracteres alfanuméricos y guiones ❌
```

---

### RF-066: Panel Líder de Referidos

**Acceso:** Admin o Líder (si es autenticado)

**Ubicación:** Admin Panel → Referidos → Seleccionar líder

**Mostrar:**
```
Nombre: Ivan Caicedo
Email: ivan@example.com
Estado: Activo

DATOS DE REFERIDO:
├─ Código: ivan_caicedo
├─ Enlace: https://app.dropcostmaster.com?ref=ivan_caicedo
├─ Comisión: 25%
└─ [Copiar código] [Copiar enlace]

ESTADÍSTICAS:
├─ Usuarios referidos: 47
├─ Activos (con suscripción): 42
├─ Cancelados: 5
├─ Tasa retención: 89%

COMISIONES:
├─ Total generado: $975.000
├─ Pendiente (últimos 7 días): $125.000
├─ Pagado: $850.000
└─ [Ver historial completo]

ÚLTIMOS USUARIOS REFERIDOS (tabla):
├─ juan@example.com | Plan Pro | $12.500 | 15 feb 2026
├─ maria@example.com | Plan Básico | $10.000 | 14 feb 2026
└─ ...

BOTONES:
├─ [Editar código]
├─ [Pausar líder]
├─ [Eliminar líder]
└─ [Enviar comisión manual]
```

---

### RF-067: Landing de Registro con Código de Referido

**URL patrón:**
```
https://app.dropcostmaster.com/registro?ref=ivan_caicedo
```

**Componentes visibles:**
```
┌──────────────────────────────────────────┐
│ ✅ Invitado por: Comunidad Ivan Caicedo │
│                                          │
│ Código de referido: ivan_caicedo         │
│ Descuento aplicado: 15% primer mes       │
│ De $50.000 → $42.500 COP                │
└──────────────────────────────────────────┘

[Formulario registro normal]
```

**Validaciones:**
- Si código no existe: Mostrar error, permitir registro sin referido
- Si código existe pero pausado: Mostrar advertencia, permitir sin referido
- Si código válido: Pre-llenar nombre líder, aplicar descuento automático

---

### RF-068: Validación Código en Registro

**Servidor (Backend):**
```
GET /api/referidos/validar?ref=ivan_caicedo

Response:
{
  "codigo_valido": true,
  "nombre_lider": "Comunidad Ivan Caicedo",
  "descuento_porcentaje": 15,
  "estado": "activo"
}

O si es inválido:
{
  "codigo_valido": false,
  "mensaje": "Este código de referido no existe"
}
```

---

### RF-069: Guardar Referido en Registro

**Cuando usuario se registra CON código referido:**

1. Crear usuario normalmente
2. Crear registro en tabla `referidos_usuarios`:
   ```sql
   INSERT INTO referidos_usuarios (
     usuario_id,
     lider_id,
     codigo_referido,
     fecha_registro
   ) VALUES (...)
   ```
3. Si usuario se suscribe después:
   - Generar comisión automáticamente

---

### RF-070: Pantalla "Mi Código de Referido" (Usuario)

**Acceso:** Usuario autenticado (cualquiera, no solo líderes)

**Ubicación:** Configuración → Mi Código de Referido

**Contenido:**
```
┌──────────────────────────────────────────┐
│ 🎁 MI CÓDIGO DE REFERIDO                 │
├──────────────────────────────────────────┤
│                                          │
│ Comparte tu código y gana comisiones    │
│                                          │
│ Tu código: mi_codigo_referido            │
│ Tu enlace: https://app.dropcostmaster... │
│                                          │
│ [Copiar código] [Copiar enlace]          │
│ [Compartir en WhatsApp]                  │
│ [Compartir en Email]                     │
│                                          │
│ TUS REFERIDOS:                           │
│ ├─ Total: 3 usuarios                     │
│ ├─ Activos: 2 usuarios                   │
│ └─ Comisión generada: $37.500            │
│                                          │
│ ÚLTIMOS REFERIDOS:                       │
│ ├─ juan@example.com (15 feb 2026)        │
│ └─ maria@example.com (14 feb 2026)       │
│                                          │
└──────────────────────────────────────────┘
```

---

### RF-071: Wallet de Referidos (Usuario)

**Acceso:** Usuario con referidos activos

**Ubicación:** Configuración → Mi Wallet

**Mostrar:**
```
Saldo disponible: $37.500
Mínimo para retirar: $10.000
En revisión (< 30 días): $0

[Retirar fondos] [Usar en suscripción]

Movimientos recientes:
├─ +$12.500 (Referido juan@) 15 feb
├─ +$12.500 (Referido maria@) 14 feb
└─ +$12.500 (Referido otro@) 13 feb
```

---

### RF-072: Flujo Retiro de Comisión

**Proceso:**
1. Usuario presiona [Retirar fondos]
2. Modal: "¿Cuánto quieres retirar?"
   - Mínimo: $10.000
   - Máximo: saldo disponible
   - Input: [____]
3. Validar: Monto > $10k, cuenta bancaria verificada
4. Confirmar: "Transferencia a [Banco ****1234]"
5. Enviar a cola de procesamiento

---

### RF-073: Cron Job - Procesar Retiros

**Frecuencia:** 1x por semana (viernes 10am)

**Proceso:**
1. Obtener todos retiros con estado "solicitado"
2. Para cada retiro:
   - Llamar Transfer Wise API
   - Crear transferencia
   - Actualizar estado a "procesado"
   - Restar del saldo empresa
3. Enviar email confirmación a usuario

---

### RF-074: Tabla Referidos en Estadísticas (Admin)

**Ubicación:** Admin Panel → Referidos → Tabla General

**Columnas:**
- Nombre líder
- Código referido
- Usuarios referidos (total)
- Usuarios activos
- Comisiones generadas
- Comisiones pagadas
- Estado (activo/pausado/suspendido)
- Acciones

---

### RF-075: Webhook Pago - Generar Comisión

**Cuando usuario paga (Mercado Pago / Stripe):**

1. Webhook recibe pago confirmado
2. Sistema verifica si usuario tiene `referido_codigo`
3. Si tiene:
   - Obtener `lider_id` del código
   - Calcular comisión: `monto_pago × porcentaje_comisión / 100`
   - Crear registro `comisiones_referidos`
   - Actualizar `wallet.saldo` del líder
   - Actualizar `referidos_lideres.total_usuarios_referidos`

---

### RF-076: Validar Disponibilidad Código en Tiempo Real

**Frontend - Al registrase:**
```
Input código: [ivan_caicedo____]

Debounce 500ms + llamar:
GET /api/referidos/codigo-disponible?codigo=ivan_caicedo

Response:
- Si disponible: ✅ "Este código está disponible"
- Si ocupado: ❌ "Este código ya está en uso"
- Si inválido: ❌ "Solo letras, números y guiones"
```

---

### RF-077: Datos Bancarios para Retiro

**Primer retiro requiere:**
1. Número de cuenta
2. Banco
3. Nombre titular
4. Cédula/DNI
5. País

**Validación:**
- IBAN válido (si aplica)
- Banco existe en país seleccionado
- Nombre coincide con cédula (validación Mercado Pago)

**Guardar en tabla:**
```sql
cuenta_bancaria_numero
cuenta_bancaria_banco
cuenta_bancaria_titular
cuenta_bancaria_cedula
cuenta_bancaria_pais
cuenta_bancaria_verificada (boolean)
```

---

### RF-078: Notificaciones Referidos

**Email cuando:**
- Usuario se registra con código referido
- Comisión se genera
- Comisión se procesa/paga
- Código es modificado
- Retiro es solicitado/completado

**In-app cuando:**
- Nueva comisión generada
- Retiro completado
- Dinero llegó a cuenta

---

## 2. Base de Datos

### Tabla: referidos_lideres

```sql
CREATE TABLE referidos_lideres (
  id UUID PRIMARY KEY,
  nombre VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  codigo_referido VARCHAR UNIQUE NOT NULL,
  porcentaje_comision NUMERIC(5,2) NOT NULL,
  estado ENUM('activo', 'pausado', 'suspendido') DEFAULT 'activo',
  
  -- Estadísticas
  total_usuarios_referidos INTEGER DEFAULT 0,
  total_usuarios_activos INTEGER DEFAULT 0,
  total_comisiones_generadas NUMERIC DEFAULT 0,
  total_comisiones_pagadas NUMERIC DEFAULT 0,
  
  -- Bancarios
  cuenta_bancaria_numero VARCHAR,
  cuenta_bancaria_banco VARCHAR,
  cuenta_bancaria_titular VARCHAR,
  cuenta_bancaria_cedula VARCHAR,
  cuenta_bancaria_pais VARCHAR(2),
  cuenta_bancaria_verificada BOOLEAN DEFAULT false,
  
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_ultimo_referido TIMESTAMP,
  
  UNIQUE(email),
  UNIQUE(codigo_referido)
);
```

### Tabla: referidos_usuarios

```sql
CREATE TABLE referidos_usuarios (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL,
  lider_id UUID NOT NULL,
  codigo_referido VARCHAR,
  
  fecha_registro TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (usuario_id) REFERENCES users(id),
  FOREIGN KEY (lider_id) REFERENCES referidos_lideres(id),
  UNIQUE(usuario_id) -- Un usuario solo puede tener 1 referidor
);
```

### Tabla: comisiones_referidos

```sql
CREATE TABLE comisiones_referidos (
  id UUID PRIMARY KEY,
  lider_id UUID NOT NULL,
  usuario_referido_id UUID,
  monto NUMERIC NOT NULL,
  estado ENUM('pendiente', 'pagada', 'rechazada') DEFAULT 'pendiente',
  
  fecha_generacion TIMESTAMP DEFAULT NOW(),
  fecha_pago TIMESTAMP,
  
  FOREIGN KEY (lider_id) REFERENCES referidos_lideres(id),
  FOREIGN KEY (usuario_referido_id) REFERENCES users(id)
);
```

### Tabla: wallet_referidos

```sql
CREATE TABLE wallet_referidos (
  id UUID PRIMARY KEY,
  lider_id UUID NOT NULL UNIQUE,
  saldo NUMERIC DEFAULT 0,
  saldo_retenido NUMERIC DEFAULT 0, -- Comisiones < 30 días
  total_generado NUMERIC DEFAULT 0,
  
  FOREIGN KEY (lider_id) REFERENCES referidos_lideres(id)
);
```

### Tabla: retiros_referidos

```sql
CREATE TABLE retiros_referidos (
  id UUID PRIMARY KEY,
  lider_id UUID NOT NULL,
  monto NUMERIC NOT NULL,
  estado ENUM('solicitado', 'procesado', 'completado', 'rechazado') DEFAULT 'solicitado',
  
  numero_transaccion_transferwise VARCHAR,
  referencia_banco VARCHAR,
  
  fecha_solicitud TIMESTAMP DEFAULT NOW(),
  fecha_procesamiento TIMESTAMP,
  fecha_completamiento TIMESTAMP,
  
  FOREIGN KEY (lider_id) REFERENCES referidos_lideres(id)
);
```

### Tabla: wallet_movimientos

```sql
CREATE TABLE wallet_movimientos (
  id UUID PRIMARY KEY,
  lider_id UUID NOT NULL,
  tipo ENUM('comision_entrada', 'retiro', 'uso_suscripcion', 'ajuste_admin') DEFAULT 'comision_entrada',
  monto NUMERIC NOT NULL,
  descripcion VARCHAR,
  estado ENUM('completado', 'pendiente', 'fallido') DEFAULT 'completado',
  
  fecha TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (lider_id) REFERENCES referidos_lideres(id)
);
```

---

## 3. API Endpoints

```
POST /api/referidos/crear-lider
├─ Admin only
└─ Request: { nombre, email, porcentaje_comision, pais }

PUT /api/referidos/{lider_id}/editar-codigo
├─ Admin only
└─ Request: { nuevo_codigo }

GET /api/referidos/validar?ref=ivan_caicedo
├─ Public
└─ Response: { codigo_valido, nombre_lider, descuento%, estado }

GET /api/referidos/lider/{lider_id}
├─ Admin or Líder autenticado
└─ Response: estadísticas completas

GET /api/referidos/usuario/mi-codigo
├─ Usuario autenticado
└─ Response: código usuario, estadísticas referidos

GET /api/referidos/usuario/wallet
├─ Usuario autenticado
└─ Response: saldo, movimientos, retiros

POST /api/referidos/usuario/solicitar-retiro
├─ Usuario autenticado
└─ Request: { monto, numero_cuenta, banco, cedula }

GET /api/referidos/usuario/mi-wallet/movimientos
├─ Usuario autenticado
└─ Response: historial movimientos

GET /api/referidos/codigo-disponible?codigo=ivan_caicedo
├─ Public (validar en tiempo real)
└─ Response: { disponible: true/false }
```

---

## 4. Validaciones

**Código de referido:**
- Único, alphanumeric + underscore
- Mínimo 5 caracteres
- Máximo 30 caracteres
- No puede ser palabras reservadas
- Cambios solo si está disponible

**Email:**
- Formato válido
- Único

**Comisión:**
- Entre 10% y 50%

**Retiro:**
- Mínimo $10.000 COP
- Máximo saldo disponible
- Cuenta verificada requerida

---

## 5. Timeline Implementación

| Fase | Duración | Tareas |
|------|----------|--------|
| **Fase 1** | Semana 1 | Tablas BD + RLS |
| **Fase 2** | Semana 2 | Endpoints API (6 nuevos) |
| **Fase 3** | Semana 2-3 | Panel Admin referidos |
| **Fase 4** | Semana 3 | Landing registro + validación código |
| **Fase 5** | Semana 4 | Wallet usuario + retiros |
| **Fase 6** | Semana 4-5 | Integración Transfer Wise + Cron |
| **Fase 7** | Semana 5 | Testing + Launch |

---

**Fin Especificación Requerimientos - Sistema de Referidos**
