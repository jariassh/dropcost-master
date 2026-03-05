# REQUISITO FUNCIONAL: MÓDULO CONTACTOS CON DESCARGO DE RESPONSABILIDAD
**DropCost Master**  
**Versión:** 1.0  
**Estado:** Especificación Final  
**Fecha:** 26 de febrero de 2026  
**Criticidad:** ALTA - GDPR Compliance

---

## I. DESCRIPCIÓN GENERAL

Módulo que permite al usuario (dropshipper) almacenar y descargar información de sus clientes a través de órdenes sincronizadas desde Shopify. El acceso requiere aceptación explícita de un descargo de responsabilidad, donde el usuario asume responsabilidad legal sobre los datos de sus clientes.

**Principio:** Transparencia + Consentimiento explícito + Auditoría

---

## II. FLUJO GENERAL

```
Usuario accede a Módulo Contactos
    ↓
¿Tienda tiene módulo habilitado?
    ├─ NO → Modal Descargo Responsabilidad
    │   ├─ Lectura de términos
    │   └─ Toggle: "Acepto responsabilidad"
    │       ├─ NO → No permite acceso
    │       └─ SÍ → Guarda en BD + desbloquea módulo
    │
    └─ SÍ → Muestra tabla de contactos
        ├─ Únicos por tienda
        ├─ Solo órdenes DESPUÉS de aceptación
        └─ Botones: Descargar Excel / CSV
```

---

## III. PASO 0: POLÍTICA DE PRIVACIDAD - NUEVA CLÁUSULA

**Agregar a Sección 7 "Sus Derechos":**

```markdown
### Módulo de Contactos - Responsabilidad del Usuario

**Si habilita el módulo de Contactos en DropCost:**

El usuario (propietario de tienda) acepta ser responsable del tratamiento 
de datos de sus clientes descargados desde DropCost Master. Esto incluye:

- Almacenamiento seguro de los datos
- Cumplimiento de leyes locales (GDPR si aplica)
- Respuesta a solicitudes de acceso/eliminación de sus clientes
- No usar datos para fines distintos a relación comercial directa

**DropCost Master actúa como intermediario de datos, NO como responsable 
del tratamiento.** El usuario es quien contrata directamente con sus clientes 
y debe informarles que sus datos se procesan a través de esta plataforma.

**Auditoría:** DropCost guarda registro de fecha/hora de aceptación 
de esta responsabilidad para transparencia legal.
```

---

## IV. MODAL INICIAL - DESCARGO DE RESPONSABILIDAD

**Aparece la primera vez que usuario intenta acceder a Módulo Contactos**

### 4.1 UI del Modal

```
┌─────────────────────────────────────────────────────┐
│                                                       │
│  🔒 DESCARGO DE RESPONSABILIDAD - MÓDULO CONTACTOS  │
│                                                       │
│  ─────────────────────────────────────────────────── │
│                                                       │
│  TÉRMINOS:                                            │
│                                                       │
│  Al habilitar el Módulo de Contactos, aceptas que: │
│                                                       │
│  1. ERES RESPONSABLE de los datos de tus clientes   │
│     descargados desde DropCost Master               │
│                                                       │
│  2. CUMPLIRÁS con leyes de protección de datos      │
│     (GDPR, CCPA, leyes locales si aplica)          │
│                                                       │
│  3. INFORMARÁS a tus clientes que sus datos se      │
│     procesan a través de DropCost                    │
│                                                       │
│  4. RESPONDERÁS a solicitudes de acceso/            │
│     eliminación de tus clientes directamente         │
│                                                       │
│  5. GUARDARÁS de forma segura y usarás SOLO para   │
│     relación comercial directa                       │
│                                                       │
│  DropCost Master actúa como intermediario.          │
│  No somos responsables del tratamiento posterior.    │
│                                                       │
│  ─────────────────────────────────────────────────── │
│                                                       │
│  ☐ Entiendo y acepto esta responsabilidad          │
│                                                       │
│  [Cancelar]  [Habilitar Módulo Contactos]          │
│                                                       │
│  Fecha de aceptación será registrada en auditoría   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### 4.2 Validación

```
Botón "Habilitar" deshabilitado hasta que:
├─ Checkbox esté marcado ✓
└─ Usuario haya leído (scroll hasta abajo)

Si cancela:
└─ Modal se cierra
└─ No guarda nada
└─ Próxima vez = aparece modal nuevamente
```

---

## V. PASO 1: ACEPTACIÓN Y ALMACENAMIENTO

### 5.1 Backend (Edge Function: habilitar-modulo-contactos)

```
POST /api/modulos/habilitar-contactos

Request:
{
  "tienda_id": "uuid",
  "user_id": "uuid",
  "aceptado": true
}

Lógica:
1. Validar que usuario es propietario de tienda (RLS)
2. Validar checkbox = true
3. Guardar en tabla contact_module_acceptance:
   {
     "tienda_id": tienda_id,
     "user_id": user_id,
     "aceptado_en": NOW(),
     "ip_address": request.ip,
     "user_agent": request.headers.user-agent,
     "estado": "activo"
   }
4. Actualizar tabla tiendas:
   {
     "contactos_modulo_habilitado": true,
     "contactos_habilitado_en": NOW()
   }
5. Retornar { success: true, redirect: "/app/contactos" }

Error handling:
└─ Si ya está habilitado → { success: true, redirect: "/app/contactos" }
```

### 5.2 Tabla BD: contact_module_acceptance

```sql
CREATE TABLE contact_module_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Auditoría legal
  aceptado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(255),
  user_agent TEXT,
  
  -- Gestión
  estado VARCHAR(50) DEFAULT 'activo', -- activo, revocado
  revocado_en TIMESTAMP,
  
  CONSTRAINT unique_tienda_acceptance UNIQUE(tienda_id, user_id)
);

CREATE INDEX idx_contact_acceptance_tienda ON contact_module_acceptance(tienda_id);
CREATE INDEX idx_contact_acceptance_aceptado ON contact_module_acceptance(aceptado_en);
```

---

## VI. MÓDULO CONTACTOS - TABLA PRINCIPAL

**Aparece solo si `contact_module_acceptance.estado = 'activo'`**

### 6.1 UI - Tabla de Contactos

```
┌─────────────────────────────────────────────────────────────┐
│  📋 MIS CONTACTOS                                            │
│                                                               │
│  Clientes únicos que han realizado compras                  │
│  Datos sincronizados desde órdenes Shopify                  │
│                                                               │
│  ─────────────────────────────────────────────────────────── │
│                                                               │
│  Filtros:  [País ▼] [Compras ▼]  [Buscar...]               │
│                                                               │
│  Descargar: [📥 Excel] [📥 CSV]                             │
│                                                               │
│  ─────────────────────────────────────────────────────────── │
│                                                               │
│  Nombre | Email | Teléfono | WhatsApp | Ciudad | Compras   │
│  ────────────────────────────────────────────────────────── │
│  Cliente 1 | email1@... | 3000000 | 3000000 | Medellín | 5   │
│  Cliente 2 | email2@... | 3001111 | 3001111 | Bogotá | 2     │
│  Cliente 3 | email3@... | 3002222 | 3002222 | Cali | 8       │
│  ...                                                         │
│  ────────────────────────────────────────────────────────── │
│                                                               │
│  Mostrando 1-50 de 342 contactos                            │
│                                                               │
│  [⬅ Anterior] [1] [2] [3] [Siguiente ➡]                    │
│                                                               │
│  ⚙️ Configuración: [Gestionar módulo]                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Columnas

| Columna | Tipo | Origen Shopify | Ejemplo |
|---------|------|----------------|---------|
| **Nombre** | VARCHAR | customer.first_name + last_name | "Juan García" |
| **Email** | VARCHAR | customer.email | "juan@email.com" |
| **Teléfono** | VARCHAR | shipping_address.phone | "3000000" |
| **WhatsApp** | VARCHAR | shipping_address.phone (duplicado, mismo valor) | "3000000" |
| **Ciudad** | VARCHAR | shipping_address.city | "Medellín" |
| **País** | VARCHAR | shipping_address.country | "Colombia" |
| **Compras** | INT | COUNT(orders WHERE customer_id = X) | 5 |
| **Primera Compra** | DATE | MIN(order.created_at) | "2026-02-15" |
| **Última Compra** | DATE | MAX(order.created_at) | "2026-02-26" |

### 6.3 Datos Inclusión

```
❌ NO incluir:
├─ Órdenes previas a aceptación de módulo
├─ Información de pago/tarjeta
├─ IPs de cliente
└─ Datos personales extra

✅ SÍ incluir:
├─ Datos de envío (ciudad, país)
├─ Contacto (email, teléfono)
├─ Historial compras (número, fecha)
└─ Solo órdenes DESPUÉS de aceptación
```

---

## VII. DESCARGAS - EXCEL Y CSV

### 7.1 Botón "Descargar Excel"

```
POST /api/contactos/descargar-excel

Response: Archivo .xlsx con estructura:
┌────────────────────────────────────────────┐
│ Nombre | Email | Teléfono | WhatsApp | ...  │
├────────────────────────────────────────────┤
│ Cliente 1 | email1@... | 3000000 | 3000000 │
│ Cliente 2 | email2@... | 3001111 | 3001111 │
└────────────────────────────────────────────┘

Nombre archivo: Contactos_[TiendaNombre]_[YYYYMMDD].xlsx
Descarga automática al navegador
```

### 7.2 Botón "Descargar CSV"

```
POST /api/contactos/descargar-csv

Response: Archivo .csv con estructura:
"Nombre","Email","Teléfono","WhatsApp","Ciudad","País","Compras"
"Cliente 1","email1@...","3000000","3000000","Medellín","Colombia","5"
"Cliente 2","email2@...","3001111","3001111","Bogotá","Colombia","2"

Nombre archivo: Contactos_[TiendaNombre]_[YYYYMMDD].csv
Descarga automática al navegador
```

### 7.3 Auditoría de Descargas

```sql
CREATE TABLE contact_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  formato VARCHAR(10), -- 'excel' o 'csv'
  cantidad_registros INT,
  
  descargado_en TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(255),
  
  -- Para auditoría legal
  hash_archivo VARCHAR(255) -- SHA256 del archivo descargado
);

CREATE INDEX idx_downloads_tienda ON contact_downloads(tienda_id);
CREATE INDEX idx_downloads_fecha ON contact_downloads(descargado_en);
```

---

## VIII. INTEGRACIÓN CON DASHBOARD - ÚLTIMAS ÓRDENES

**Card "Últimas Órdenes Shopify" (como imagen adjunta)**

### 8.1 Comportamiento SIN Módulo Habilitado

```
┌────────────────────────────────┐
│ 📦 ÚLTIMAS ÓRDENES SHOPIFY      │
│                                 │
│ MK-CRM-47 | $82.650 | ✅        │
│ MK-CRM-148| $82.650 | ✅        │
│ MK-CRM-9  | $82.650 | ✅        │
│ MK-CRM-124| $82.650 | ✅        │
│                                 │
│ ⚠️ Órdenes NO clickeables      │
│ (No es interactivo)             │
│                                 │
│ [Habilitar Módulo Contactos]    │
│                                 │
└────────────────────────────────┘

Mensaje al intentar click:
"Para ver detalles de tus clientes, 
debes habilitar el Módulo Contactos. 
Esto permite a DropCost guardar 
información de contacto de tus clientes."
```

### 8.2 Comportamiento CON Módulo Habilitado (Órdenes DESPUÉS de aceptación)

```
┌────────────────────────────────┐
│ 📦 ÚLTIMAS ÓRDENES SHOPIFY      │
│                                 │
│ ✓ MK-CRM-47 | $82.650 | ✅     │ ← Clickeable
│ ✓ MK-CRM-148| $82.650 | ✅     │ ← Clickeable
│ ✓ MK-CRM-9  | $82.650 | ✅     │ ← Clickeable
│ ✗ MK-CRM-5  | $82.650 | ✅     │ ← NO clickeable (antes de aceptación)
│                                 │
│ Click → Abre modal con datos   │
│                                 │
└────────────────────────────────┘
```

### 8.3 Modal de Orden (Detalle Completo)

```
┌─────────────────────────────────────────────┐
│  📦 Orden MK-CRM-148                        │
│  Recibido el 5/3/2026, 15:07:00             │
│  Status: ✅ ENTREGADO                        │
│                                              │
│  ─────────────────────────────────────────  │
│                                              │
│  👤 INFORMACIÓN DEL CLIENTE                  │
│  Nombre: Cliente 148                        │
│  Email: mock@cliente.com                    │
│  WhatsApp: 3000000                          │
│  País: Colombia                             │
│  Ciudad: Bogotá                             │
│                                              │
│  📍 DIRECCIÓN DE ENVÍO                       │
│  Información en notas                        │
│                                              │
│  📝 NOTAS SHOPIFY                            │
│  Sin notas especiales para este pedido.     │
│                                              │
│  💰 Total: $82.650,00                        │
│                                              │
│  [Cerrar Detalle]                           │
│                                              │
└─────────────────────────────────────────────┘
```

### 8.4 Marca Visual para Órdenes Pre-Aceptación

```
❌ Orden previa a aceptación (NO clickeable):
   └─ Aparece en gris o con opacidad 50%
   └─ Icono 🔒 (bloqueado)
   └─ Cursor: no-pointer (no es clickeable)
   └─ Tooltip: "Esta orden es previa a la aceptación 
              del Módulo Contactos"

✅ Orden posterior a aceptación (clickeable):
   └─ Aparece normal (colores normales)
   └─ Cursor: pointer
   └─ Al click: abre modal con datos completos
```

---

## IX. CONFIGURACIÓN - OPCIÓN PARA REVOCAR

**En Configuración > Tienda o Módulo Contactos**

```
┌────────────────────────────────────────┐
│  ⚙️ MÓDULO CONTACTOS - CONFIGURACIÓN    │
│                                         │
│  Estado: ✅ ACTIVO                      │
│  Habilitado desde: 26 de febrero 2026   │
│  Órdenes procesadas: 342                │
│  Últimas descarga: 26 feb 15:30         │
│                                         │
│  [📥 Ver historial descargas]           │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ⚠️ Zona peligrosa:                     │
│                                         │
│  [🔴 Deshabilitar Módulo]               │
│                                         │
│  Nota: Esto NO eliminará datos ya      │
│  descargados. Solo impedirá nuevas      │
│  sincronizaciones.                      │
│                                         │
└────────────────────────────────────────┘
```

---

## X. ENDPOINTS REQUERIDOS

**POST /api/modulos/habilitar-contactos**
```
Request: { tienda_id, user_id, aceptado: true }
Response: { success: true, redirect: "/app/contactos" }
```

**GET /api/contactos/lista**
```
Response: [ { nombre, email, telefono, whatsapp, ciudad, pais, compras, primera_compra, ultima_compra } ]
RLS: Solo contactos de tienda del usuario
Filtro: Solo órdenes DESPUÉS de aceptación
```

**POST /api/contactos/descargar-excel**
```
Response: Archivo XLSX descargable
Auditoría: Guarda en contact_downloads
```

**POST /api/contactos/descargar-csv**
```
Response: Archivo CSV descargable
Auditoría: Guarda en contact_downloads
```

**GET /api/contactos/historial-descargas**
```
Response: [ { fecha, formato, cantidad, ip } ]
```

**POST /api/modulos/deshabilitar-contactos**
```
Request: { tienda_id }
Lógica: Marca como "revocado" (auditoría legal)
```

---

## XI. BASE DE DATOS - TABLAS RELACIONADAS

**Tabla: contact_module_acceptance** (ya definida arriba)

**Tabla: contact_downloads** (ya definida arriba)

**Tabla: shopify_clientes** (nueva - para cache)
```sql
CREATE TABLE shopify_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id),
  
  -- Datos cliente
  nombre VARCHAR(255),
  email VARCHAR(255),
  telefono VARCHAR(20),
  ciudad VARCHAR(100),
  pais VARCHAR(100),
  
  -- Historial
  numero_compras INT DEFAULT 0,
  primera_compra_fecha TIMESTAMP,
  ultima_compra_fecha TIMESTAMP,
  
  -- Auditoría
  cliente_shopify_id VARCHAR(255) UNIQUE,
  sincronizado_en TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_tienda_cliente UNIQUE(tienda_id, email)
);

CREATE INDEX idx_clientes_tienda ON shopify_clientes(tienda_id);
CREATE INDEX idx_clientes_sincronizado ON shopify_clientes(sincronizado_en);
```

---

## XII. SINCRONIZACIÓN - WEBHOOK SHOPIFY

**Al recibir orden nueva (solo si módulo HABILITADO):**

```
Webhook: orders/create

Lógica:
1. Verificar que tienda tiene módulo habilitado
2. Verificar que orden es POSTERIOR a aceptación_en
3. Si YES → sincronizar cliente en shopify_clientes
   ├─ nombre
   ├─ email
   ├─ telefono
   ├─ ciudad
   ├─ pais
   └─ numero_compras (increment)
4. Si NO → ignorar datos cliente
```

---

## XIII. PRIVACIDAD - CONSIDERACIONES GDPR

```
✅ CUMPLIMIENTO:
├─ Consentimiento explícito (checkbox + fecha)
├─ Derechos usuario: Auditoría disponible
├─ Derecho al olvido: Can request elimination
├─ Transparencia: Cláusula clara en política
└─ Responsabilidad: Usuario acepta como controller

⚠️ LIMITACIONES (DropCost no es responsable):
├─ Usuario debe informar a sus clientes
├─ Usuario responde a ARPA/GDPR requests
├─ DropCost borra si usuario lo pide (pero descargado = fuera de scope)
└─ DropCost guarda auditoría (aceptación, descargas)
```

---

## XIV. CHECKLIST PRE-LANZAMIENTO

- [ ] Tabla contact_module_acceptance creada
- [ ] Tabla contact_downloads creada
- [ ] Tabla shopify_clientes creada
- [ ] Modal descargo responsabilidad diseñado
- [ ] Política privacidad actualizada (Sección 7)
- [ ] Endpoints testados (todos los 5)
- [ ] Webhook Shopify sincroniza correctamente
- [ ] Órdenes pre-aceptación NO aparecen en tabla
- [ ] Órdenes post-aceptación SÍ aparecen
- [ ] Descargas Excel/CSV funcionan
- [ ] Auditoría se guarda (IP, timestamp, etc)
- [ ] Dark mode testado
- [ ] Responsive testado (mobile-desktop)
- [ ] RLS validada (user A no ve tienda B)
- [ ] Seguridad: sin datos sensibles en logs

---

## XV. NO REGRESIÓN - REGLAS CRÍTICAS

**⚠️ PROTECCIÓN DE DATOS CRÍTICA:**

1. **NUNCA guardar datos cliente si módulo NO habilitado**
   - Validar `contact_module_acceptance.estado = 'activo'` ANTES
   - Si falta check → LOG de intento no autorizado

2. **NUNCA mostrar datos en modal si orden PRE-aceptación**
   - Comparar: order.created_at > acceptance_date
   - Si NO cumple → modal bloqueado

3. **NUNCA eliminar auditoría de aceptación**
   - contact_module_acceptance es INMUTABLE (no UPDATE)
   - Solo INSERT (nueva aceptación) o marcar como revocado

4. **NUNCA descargar contactos sin auditoría**
   - Cada descarga → guardar en contact_downloads
   - Si descarga falla → registrar error
   - Si usuario descarga → rastrear fecha/ip/cantidad

---

**DOCUMENTO LISTO PARA IMPLEMENTACIÓN** ✅

