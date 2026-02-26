# REQUERIMIENTO FUNCIONAL - MIS COSTEOS
## Reorganización del Simulador + Control de Cuota

**Versión:** 1.0  
**Módulo:** Simulador → Mis Costeos  
**Prioridad:** Alta  
**Implementador:** Antigravity

---

## 1. VISIÓN GENERAL

Cambiar la estructura actual "Simulador" a una página principal **"Mis Costeos"** donde:
- Se listan TODOS los costeos del usuario (table principal)
- Se pueden filtrar por nombre de producto
- Se crea nuevo costeo con nombre requerido (modal)
- Se abre editor de costeo al seleccionar/crear
- Se previene pérdida de datos con modal "Deseas guardar?"

---

## 2. FLUJO COMPLETO

### 2.1 Pantalla Inicial - Sin Tienda

**Condición:** Usuario no tiene tienda creada  
**Acción:** Mostrar pantalla de creación de tienda (actual)

```
┌─────────────────────────────────┐
│ ¡Crea tu primera tienda!        │
│ (imagen + descripción)          │
│                                 │
│ [Crear Tienda]                  │
└─────────────────────────────────┘
```

**Flujo:**
1. Usuario completa: nombre tienda, logo, país
2. Click [Crear Tienda]
3. Tienda se guarda en BD
4. Redirige a "Mis Costeos" (vacío)

---

### 2.2 Pantalla Principal - Mis Costeos

**Condición:** Usuario tiene tienda(s)  
**Ubicación:** Navegación principal (no dentro de Simulador)

```
┌──────────────────────────────────────────────┐
│ Mis Costeos                                  │
│                                              │
│ [Filtrar por nombre ▼] [+ Nuevo Costeo]    │
│                                              │
│ ┌────────────────────────────────────────┐   │
│ │ Nombre Producto  │ Precio Final │ Acciones│
│ ├────────────────────────────────────────┤   │
│ │ iPhone 15 Pro    │ $850.00     │ Editar  │   │
│ │ Faja Reductora   │ $45.00      │ Editar  │   │
│ │ Crema Anti-Edad  │ $32.50      │ Editar  │   │
│ └────────────────────────────────────────┘   │
│                                              │
│ Mostrando 3 de 8 costeos (25/100 usados)    │
└──────────────────────────────────────────────┘
```

**Características:**

#### 2.2.1 Tabla de Costeos
- Columnas: Nombre Producto, Precio Final, Fecha Creación, Acciones
- Orden: Más recientes primero
- Paginación: 10 por página
- Contador: "Costeos usados: X/Y" (ej: 25/100)

#### 2.2.2 Filtro por Nombre
```
Input: [Buscar por nombre de producto...]
└─ Filtrado en tiempo real (debounce 300ms)
└─ Case-insensitive
```

#### 2.2.3 Botón "Nuevo Costeo"
- Color: Primario (#0066FF)
- Ubicación: Top-right
- Click: Abre Modal "Crear Costeo"

#### 2.2.4 Indicador de Cuota
```
"Costeos creados: 25/100"
Si alcanza 100:
├─ Botón "Nuevo Costeo" → deshabilitado
├─ Tooltip: "Has alcanzado tu límite"
└─ Link: "Upgrade a Pro para ilimitado"
```

#### 2.2.5 Acciones por Costeo

| Acción | Disponible | Condición |
|--------|-----------|-----------|
| **Duplicar** | Botón aparece SI plan permite | Solo si costeo tiene datos (NO vacío) |
| **Eliminar** | Botón aparece SI plan permite | Siempre (costeo vacío o completo) |
| **Editar** | ❌ NUNCA aparece | No existe en ningún plan |

**Nota:** No hay opción editar. Para cambiar costeo = Duplicar + Crear nuevo variante.

---

## 3. MODAL - CREAR NUEVO COSTEO

**Trigger:** Click en botón "Nuevo Costeo"  
**Tipo:** Modal (no página)

```
┌────────────────────────────────────────┐
│ Nuevo Costeo                        X  │
│                                        │
│ Nombre del Producto *                 │
│ [________________________]             │
│ Ejemplo: Faja Reductora, iPhone, etc  │
│                                        │
│ [Cancelar]              [Continuar]    │
└────────────────────────────────────────┘
```

**Validaciones:**
- Campo requerido (no vacío)
- Máx 100 caracteres
- Permitir duplicados (mismo nombre con diferentes proveedores)

**Flujo al hacer click [Continuar]:**
1. Valida nombre (no vacío, no duplicado)
2. Guarda costeo VACÍO en BD con:
   - `nombre_producto`: "Faja Reductora"
   - `tienda_id`: [tienda actual]
   - `usuario_id`: [usuario logueado]
   - `estado`: "vacío" (sin parámetros)
   - `precio_final`: null
3. Cierra modal
4. Abre editor (Simulador) con costeo vacío
5. Descuenta 1 de la cuota disponible

---

## 4. EDITOR - SIMULADOR

**Ubicación:** Página /simulador/:costeo_id  
**Cambios:**

### 4.1 Identificación de Costeo
En el header, mostrar:
```
"Editando: Faja Reductora" (nombre guardado)
```

### 4.2 Edición en Tiempo Real
Mientras usuario edita parámetros:
- Se actualiza `precio_final` en tiempo real
- No se guarda automáticamente
- Precio visible en pantalla

### 4.3 Botones de Acción
```
[Guardar] [Cancelar]
```

**Nota:** NO hay botón "Editar" en ningún plan.  
Los costeos son finales. Para variantes, duplicar + crear nuevo.

**Botón [Guardar]:**
- Guarda todos los parámetros en BD
- Recalcula y guarda `precio_final`
- Muestra toast: "Costeo guardado"
- Vuelve a "Mis Costeos"

**Botón [Cancelar]:**
- Si hay cambios sin guardar → Modal de confirmación
- Si no hay cambios → Vuelve a "Mis Costeos" directo

---

## 5. MODAL - GUARDAR ANTES DE SALIR

**Trigger:** Usuario intenta salir del editor SIN guardar  
**Condición:** Hay cambios sin guardar (parámetros editados)

```
┌──────────────────────────────────────┐
│ ⚠️ CAMBIOS SIN GUARDAR               │
│                                      │
│ ¿Deseas guardar los cambios antes    │
│ de salir?                            │
│                                      │
│ [No guardar] [Cancelar] [Guardar]    │
└──────────────────────────────────────┘
```

**Opciones:**

| Opción | Acción |
|--------|--------|
| **Guardar** | Guarda parámetros + vuelve a "Mis Costeos" |
| **No guardar** | Costeo se guarda VACÍO (sin parámetros) + vuelve a "Mis Costeos" |
| **Cancelar** | Cierra modal, sigue en editor |

**Resultado si [No guardar]:**
- Costeo guardado con nombre pero SIN datos
- Cuota YA consumida
- NO aparece botón Duplicar (costeo incompleto)
- Botón Eliminar disponible (si plan permite)

**Triggers para modal:**
- Cambiar de sección (ej: Dashboard, Referidos)
- Click atrás (browser back)
- Refrescar página (F5)
- Cerrar tab

---

## 6. GESTIÓN DE CUOTA Y BOTONES

### 6.1 Cálculo de Uso
```
costeos_usados = COUNT(costeos) WHERE tienda_id IN (usuario_tiendas)
cuota_disponible = plan.limite_costeos - costeos_usados

Ejemplo Plan Pro:
├─ Limite: 250 costeos
├─ Usados: 200
├─ Disponible: 50
```

### 6.2 Botón Duplicar - Reglas
**Aparece SI:**
- ✅ Plan permite duplicar (Enterprise SÍ, Pro NO, Starter NO)
- ✅ Costeo tiene datos (NO vacío)

**Deshabilitado SI:**
- ❌ Costeo está vacío (sin parámetros)
- ❌ Cuota agotada
- ❌ Plan no permite

**Tooltip:**
- Costeo vacío: "Completa este costeo antes de duplicar"
- Cuota agotada: "Alcanzaste tu límite de costeos"

### 6.3 Botón Eliminar - Reglas
**Aparece SI:**
- ✅ Plan permite eliminar (Enterprise SÍ, Pro NO, Starter NO)

**Nota:** Puede eliminar costeo vacío o completo

### 6.4 Bloqueo por Cuota Agotada
Cuando `cuota_disponible <= 0`:
- Botón "Nuevo Costeo" → **deshabilitado**
- Tooltip: "Has alcanzado el límite de costeos (250/250)"
- Link: "Upgrade a Enterprise para ilimitado"
- Color botón: gris (#D1D5DB)

### 6.5 Advertencia de Cuota Baja
Si `cuota_disponible < 10`:
- Mostrar banner amarillo:
  ```
  "⚠️ Te quedan {X} costeos disponibles"
  ```
- Link a upgrade

---

## 7. ESTRUCTURA BD

### 7.1 Tabla costeos (cambios)

```sql
CREATE TABLE costeos (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL,
  tienda_id UUID NOT NULL,
  
  nombre_producto VARCHAR(100) NOT NULL,
  
  -- Parámetros (nullable, puede estar vacío)
  costo_producto DECIMAL(10,2),
  costo_flete DECIMAL(10,2),
  gastos_adicionales DECIMAL(10,2),
  cpa DECIMAL(10,2),
  margen DECIMAL(5,2),
  devoluciones DECIMAL(5,2),
  
  precio_final DECIMAL(10,2),
  
  estado VARCHAR(20), -- 'vacio', 'guardado'
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tienda_id, nombre_producto),
  FOREIGN KEY (usuario_id) REFERENCES users(id),
  FOREIGN KEY (tienda_id) REFERENCES tiendas(id),
  INDEX(usuario_id, tienda_id)
);
```

---

## 8. PROTECCIÓN DE CUOTA

### 8.1 Prevenir Múltiples Cuentas Abusivas
Aunque usuario puede crear otras cuentas:
- Cada cuenta gasta su propia cuota (250 Pro)
- Cumple objetivo: recibir dinero por cada Plan Pro
- Sistema referidos activo (comisiones)
- Es un win-win válido

### 8.2 Métrica de Control
Monitorear en admin:
- Usuarios con 3+ cuentas (mismo email dominio)
- Cuentas que se refieren a sí mismas (fraud detection)
- Patrón: crear cuenta → usar cuota → crear otra

---

## 9. FLUJO VISUAL COMPLETO

```
INICIO
  ├─ ¿Tiene tienda?
  │  ├─ NO → Crear Tienda
  │  │    └─ [Crear] → Redirige a "Mis Costeos"
  │  └─ SÍ → "Mis Costeos" (lista vacía o con costeos)
  │
  ├─ Clic [Nuevo Costeo]
  │  └─ Modal: Nombre Producto
  │     ├─ [Continuar] → Guarda vacío → Abre Simulador
  │     └─ [Cancelar] → Cierra modal
  │
  ├─ En Simulador: Edita parámetros
  │  ├─ Precio actualiza en tiempo real
  │  ├─ [Guardar] → Guarda parámetros → "Mis Costeos"
  │  ├─ [Cancelar] → ¿Cambios sin guardar?
  │  │              ├─ SÍ → Modal confirmación
  │  │              └─ NO → "Mis Costeos"
  │  └─ Intenta salir → Modal "Guardar cambios?"
  │
  └─ Vuelve a "Mis Costeos"
     ├─ Costeo aparece en tabla
     ├─ Cuota: 1/100 usada
     └─ Puede editar, duplicar (si permite plan), eliminar (si permite plan)
```

---

## 10. CAMBIOS EN NAVEGACIÓN

**Antes:**
```
Nav: Dashboard | Simulador | Referidos | Config
```

**Después:**
```
Nav: Dashboard | Mis Costeos | Referidos | Config
```

**En "Mis Costeos" sidebar (si aplica):**
```
Mis Costeos
├─ Tabla (Mis Costeos)
├─ [Nuevo Costeo] (botón)
└─ Indicador: X/100 usados
```

---

## 11. VALIDACIONES

| Validación | Condición | Acción |
|-----------|-----------|--------|
| Nombre producto vacío | Input vacío | Deshabilitar [Continuar] |
| Nombre duplicado | Ya existe en tienda | Mostrar error |
| Cuota agotada | 100/100 costeos | Deshabilitar [Nuevo Costeo] |
| Cambios sin guardar | Editar + salir | Modal confirmación |
| Plan no permite eliminar | Plan Pro | Deshabilitar botón Eliminar |

---

## 12. CHECKLIST IMPLEMENTACIÓN

```
[ ] Crear/actualizar tabla costeos con estado
[ ] Endpoint GET /costeos (listar por usuario + tienda)
[ ] Endpoint POST /costeos (crear costeo vacío)
[ ] Endpoint PUT /costeos/{id} (actualizar parámetros)
[ ] Endpoint DELETE /costeos/{id} (eliminar)
[ ] Endpoint GET /costeos/{id} (detalle)
[ ] Componente tabla "Mis Costeos"
[ ] Modal "Crear Costeo" (nombre producto)
[ ] Modal "Guardar cambios?" (antes de salir)
[ ] Página Simulador (editor de costeo)
[ ] Filtro por nombre (debounce)
[ ] Indicador cuota (X/Y costeos)
[ ] Bloqueo cuota agotada
[ ] Navegación: Simulador → Mis Costeos
[ ] Tests: flujo completo crear → editar → guardar
[ ] Tests: modal guardar antes de salir
[ ] Tests: cuota y bloqueo
```

---

**NOTAS CRÍTICAS:**
- **NO hay opción Editar:** Costeos son finales una vez creados
- **Duplicar solo si completo:** Costeo vacío no puede duplicarse
- **Cuota se consume al crear:** Al hacer click [Continuar] en modal nombre
- **Guardar es obligatorio:** Para que el costeo sea útil (tenga parámetros)
- **Control de abuse:** Sin edición + cuota por costeo = previene abuso
- **Flujo natural:** Crea (consume cuota) → Edita → Guarda (parámetros) → Listo

---
