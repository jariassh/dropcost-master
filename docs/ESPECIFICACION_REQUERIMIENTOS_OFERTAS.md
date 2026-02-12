# Especificación de Requerimientos - Módulo Ofertas Irresistibles

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Estado:** Nuevo módulo - Integración a DropCost Master

---

## 1. Resumen Ejecutivo

El módulo **Ofertas Irresistibles** permite a los usuarios crear estrategias de venta inteligentes basadas en costeos previamente guardados. Ofrece 3 estrategias principales con educación integrada, calculadora dinámica y gestión de ofertas activas.

**Objetivo:** Aumentar ticket promedio manteniendo o controlando rentabilidad.

---

## 2. Requerimientos Funcionales

### 2.1 Educación y Onboarding

#### RF-051: Pantalla Educativa (Primera Vez)
Los usuarios que acceden por primera vez a Ofertas ven un carousel/wizard educativo que explica las 3 estrategias:

**Contenido por estrategia:**
- Nombre estrategia
- ¿Qué es?
- Ventajas (3-4 puntos)
- Desventajas (2-3 puntos)
- Ejemplo práctico con números
- Casos de uso ideales
- Botones: "Usar esta estrategia" o "Ver siguiente"

**Estrategias:**
1. **Descuento en Precio**
   - Reduce precio de venta directamente
   - Ideal: liquidación, captar nuevos clientes
   - Impacto: margen disminuye por unidad

2. **Bundle con Margen Variable** (Recomendado para COD)
   - Vender múltiples unidades
   - Unidad 1 precio normal + margen intacto
   - Unidades 2+ = costo proveedor + % margen usuario
   - Cliente ve precio unitario bajando
   - Ideal: aumentar ticket, COD a largo plazo

3. **Obsequios o Complementos**
   - Agregar producto/muestra gratis
   - Genera emoción y sorpresa
   - Ideal: lanzamientos, crear boca a boca

**Comportamiento:**
- Guardar en localStorage que ya vio educación (no mostrar de nuevo)
- Botón "Saltar" disponible
- Al terminar carousel: botón "Crear mi primera oferta"

---

#### RF-052: Acceso Rápido Educación
- Icono "?" o "Ayuda" en header módulo Ofertas
- Link a educación en dashboard mis ofertas
- Video tutorial (opcional, spec solo para interfaz)

---

### 2.2 Crear Oferta - Wizard 4 Pasos

#### RF-053: Paso 1 - Elegir Estrategia
Usuario selecciona una de las 3 estrategias:
- Card visual por estrategia (nombre + ícono + descripción corta)
- Click abre vista paso 2
- Botón "Atrás" regresa (si viene desde dashboard)
- Botón "Siguiente" avanza

**Validación:** Debe seleccionar una estrategia

---

#### RF-054: Paso 2 - Seleccionar Costeo
Usuario elige qué costeo guardado usar como base:

**Dropdown/Select mostrando:**
- Nombre producto
- ID campaña Meta (si existe)
- Precio original
- Costo producto (proveedor)
- Ganancia por unidad
- Margen %

**Si no hay costeos guardados:**
- Mostrar mensaje: "No tienes costeos guardados. Crea uno en Simulador"
- Link a Simulador

**Validación:** Costeo debe estar seleccionado

---

#### RF-055: Paso 3 - Builder Dinámico por Estrategia

**Si eligió DESCUENTO EN PRECIO:**

Controles:
- Slider descuento (rango 0-50%)
- Input numérico alternativo
- Mostrar en tiempo real:
  - Precio original
  - Descuento aplicado ($)
  - Precio final
  - Tu ganancia nueva ($)
  - Margen nuevo (%)
  - ⚠️ Warning si margen <5%: "Necesitarás 3-5x volumen para compensar"

Display:
```
Precio original:     $89.476
Descuento (15%):    -$13.421
Precio oferta:       $76.055
Tu ganancia:         $3.474 ⚠️
Margen:              4.6% ⚠️
```

**Validación:** Descuento >0%

---

**Si eligió BUNDLE CON MARGEN VARIABLE:**

Controles:
- Selector cantidad (botones: 2, 3, 4, 5 unidades) o input
- Slider % margen para unidades 2+ (rango 10-100%)
- Input numérico alternativo para %

Display en tiempo real para CADA opción de cantidad:
```
OPCIÓN 1: 1 Unidad
└─ Precio: $89.476
   Ganancia: $17.895

OPCIÓN 2: 2 Unidades
└─ Unidad 1: $89.476
   Unidad 2: $9.900 (costo proveedor) + $8.947 (50% margen)
   Total: $108.323
   Por unidad: $54.161 (Ahorro $35.315)
   Tu ganancia total: $26.842 ✅

OPCIÓN 3: 3 Unidades
└─ Total: $127.170
   Por unidad: $42.390 (Ahorro $47.086)
   Tu ganancia total: $35.789 ✅

... (hasta 5 unidades o máximo definido)
```

**Fórmula por unidad adicional (2+):**
```
Precio unitario adicional = Costo_proveedor + (Margen_original × % margen seleccionado)

Ejemplo:
Costo_proveedor = $9.900
Margen_original = $17.895
% margen = 50%

Precio unidad 2+ = $9.900 + ($17.895 × 0.50) = $9.900 + $8.947 = $18.847

Precio total para 2 unidades = $89.476 + $18.847 = $108.323
```

**Validación:** 
- Cantidad ≥ 2
- % margen entre 10-100%

---

**Si eligió OBSEQUIOS:**

Controles:
- Selector tipo obsequio (dropdown: Muestra gratis, Complemento, Otro producto, Cupón descuento)
- Input costo del obsequio ($)
- Descripción del regalo (texto, 100 caracteres)

Display en tiempo real:
```
Precio producto:      $89.476
+ Regalo:            + $5.000
= Valor percibido:    $94.476

Tu ganancia:          $12.895 ⬇️
(Reducción por regalo: -$5.000)

Cliente siente que ahorra $5.000
sin bajar tu precio
```

**Validación:**
- Tipo obsequio seleccionado
- Costo obsequio >$0
- Costo obsequio < margen original (validación: no pierdes dinero)

---

#### RF-056: Paso 4 - Preview y Confirmación

**Mostrar:**
- Imagen/nombre producto
- Badge "OFERTA", "BUNDLE", "OBSEQUIO" según estrategia
- Precios según estrategia (ver RF-055)
- Tabla comparativa (1 unidad vs 2+ unidades)
- Tu ganancia estimada
- Fecha activación (hoy)

**Botones:**
- [Editar] → Vuelve a paso 3
- [Activar Oferta] → Guardar en BD
- [Cancelar] → Descarta y vuelve a dashboard

**Validación:** Todos los datos completos

---

### 2.3 Gestión de Ofertas

#### RF-057: Dashboard Mis Ofertas
Tabla/lista mostrando todas las ofertas creadas:

**Columnas:**
- Imagen/Nombre producto
- Estrategia (Descuento | Bundle | Obsequio)
- Detalles (descuento %, unidades, regalo)
- Ganancia estimada (con arrow up/down si varía)
- Estado (Activa | Pausada | Expirada)
- Fecha creación
- Acciones (Ver, Editar, Pausar/Reanudar, Eliminar)

**Filtros:**
- Por estrategia (todas, descuento, bundle, obsequio)
- Por estado (activas, pausadas, todas)

**Comportamiento:**
- Si no hay ofertas: mensaje vacío + botón "+ Crear oferta"
- Si hay ofertas: mostrar tabla + botón "+ Crear oferta" arriba

---

#### RF-058: Ver Detalles Oferta
Al hacer clic en oferta, abre modal/panel lateral mostrando:
- Producto (nombre, imagen, costeo base)
- Estrategia y parámetros usados
- Cálculos detallados
- Ganancia estimada
- Estadísticas si están disponibles (opcional fase 1)
- Botones: Editar, Pausar, Eliminar, Cerrar

---

#### RF-059: Editar Oferta
Usuario puede editar oferta activa:
- Abre wizard pero salt paso 2 (producto ya seleccionado)
- Puede cambiar parámetros (slider descuento, % margen, costo regalo)
- Preview actualiza en tiempo real
- Guardar cambios

---

#### RF-060: Pausar/Reanudar Oferta
- Botón toggle "Pausar" / "Reanudar"
- Cambiar estado en BD
- UI actualiza inmediatamente

---

#### RF-061: Eliminar Oferta
- Botón "Eliminar"
- Confirmación: "¿Estás seguro? Esto no se puede deshacer"
- Si confirma: borrar de BD
- Mostrar toast: "Oferta eliminada"

---

### 2.4 Integración con Simulador (Fase 1 - Integrado)

#### RF-062: Tab "Estrategia de Volumen" en Simulador
Al costear producto en el Simulador, agregar tab adicional después de calcular precio:

**Ubicación:** Al lado de otros tabs en simulador
**Nombre:** "📊 Estrategia de Volumen"

**Contenido:**
- Checkbox: "Activar tabla de precios por volumen"
- Si NO activado:
  - Mostrar mensaje: "Desactivo. Solo un precio (sin descuentos por cantidad)"
  
- Si SÍ activado:
  - Slider: % margen para unidades 2+ (rango 10-100%)
  - Mostrar tabla en tiempo real:
    ```
    1 Unidad: $89.476 (Ganancia: $17.895)
    2 Unidades: Total $108.323 | $54.161 c/u | Ahorro: $35.315
    3 Unidades: Total $127.170 | $42.390 c/u | Ahorro: $47.086
    4 Unidades: Total $146.020 | $36.505 c/u | Ahorro: $52.971
    5 Unidades: Total $164.870 | $32.974 c/u | Ahorro: $56.502
    ```

**Guardar:**
- Junto con costeo, guardar:
  - `estrategia_volumen_activada` (boolean)
  - `estrategia_volumen_margen_porcentaje` (numeric)
  - `tabla_precios` (JSON con array de opciones)

**En el costeo guardado, mostrar badge:**
- Si estrategia volumen activada: "📊 Con tabla de volumen"

**Validación:**
- % margen entre 10-100%
- Mostrar warning si <10%: "Muy bajo, cliente casi no ahorra"
- Mostrar info si =100%: "Sin descuento por cantidad"

#### RF-063: Usar Tabla de Volumen en Ofertas
Cuando usuario crea oferta con Bundle:
- Si el costeo tiene estrategia volumen activada:
  - Pre-seleccionar esos parámetros en Ofertas
  - Mostrar: "✅ Este costeo tiene tabla de volumen predefinida"
  - Botón: "Usar tabla predefinida" o "Personalizar"
  
- Si usuario elige "Usar tabla predefinida":
  - Usar directamente los valores guardados en costeo
  - No puede editar % margen (usa el del costeo)
  - Ahorrar tiempo de configuración

- Si elige "Personalizar":
  - Permitir cambiar % margen
  - Crear nueva oferta con parámetros diferentes

---

## 3. Requerimientos No Funcionales

### RNF-024: Cálculos Exactos
- Usar números con 2 decimales
- Redondeo bancario (ROUND_HALF_UP)
- Precálculos instantáneos (no lag en sliders)

### RNF-025: Validaciones
- Frontend: Validación en cliente (Zod)
- Backend: Revalidar servidor (seguridad)

### RNF-026: Datos Aislados
- Ofertas solo visibles para usuario que las creó
- RLS en tabla ofertas (usuario_id + tienda_id)

### RNF-027: Performance
- Página Ofertas carga <2s
- Wizard carga <1.5s
- Cálculos slider instantáneos (<100ms)

### RNF-028: Mobile Responsive
- Wizard full width en mobile
- Tabla mi ofertas: card view en mobile
- Sliders táctiles en mobile

---

## 4. Estructura Base de Datos

### Tabla: ofertas
```sql
id (UUID, PK)
usuario_id (FK → users)
tienda_id (FK → tiendas)
costeo_id (FK → costeos) -- referencia al costeo base
nombre_producto (VARCHAR) -- denormalizado para facilidad
tipo_estrategia (ENUM: descuento, bundle, obsequio)

-- Estrategia Descuento
descuento_porcentaje (NUMERIC) -- NULL si no es descuento

-- Estrategia Bundle
bundle_cantidad (INTEGER) -- NULL si no es bundle
bundle_margen_porcentaje (NUMERIC) -- NULL si no es bundle

-- Estrategia Obsequio
obsequio_tipo (VARCHAR) -- NULL si no es obsequio
obsequio_costo (NUMERIC) -- NULL si no es obsequio
obsequio_descripcion (TEXT) -- NULL si no es obsequio

-- Común
ganancia_estimada (NUMERIC) -- calculada
margen_estimado (NUMERIC) -- porcentaje calculado

estado (ENUM: activa, pausada, expirada)
fecha_creacion (TIMESTAMP)
fecha_activacion (TIMESTAMP)
fecha_expiracion (TIMESTAMP, nullable)

created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### RLS Policies
```sql
-- Usuario solo ve sus ofertas
CREATE POLICY "Users view own ofertas"
ON ofertas FOR SELECT
USING (usuario_id = auth.uid() AND tienda_id IN (
  SELECT id FROM tiendas WHERE usuario_id = auth.uid()
));

-- Usuario solo crea para sus tiendas
CREATE POLICY "Users create own ofertas"
ON ofertas FOR INSERT
WITH CHECK (usuario_id = auth.uid() AND tienda_id IN (
  SELECT id FROM tiendas WHERE usuario_id = auth.uid()
));

-- Similar para UPDATE, DELETE
```

---

## 5. API Endpoints

### POST /ofertas/crear
Crear nueva oferta

**Request:**
```json
{
  "tiendaId": "uuid-tienda",
  "costeoId": "uuid-costeo",
  "tipoEstrategia": "descuento|bundle|obsequio",
  "descuentoPorcentaje": 15.0,
  "bundleCantidad": 3,
  "bundleMargenPorcentaje": 50.0,
  "obsequioTipo": "muestra_gratis",
  "obsequioCosto": 5000,
  "obsequioDescripcion": "Muestra gratis de nuestro catálogo"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "ofertaId": "uuid-nueva",
    "tipoEstrategia": "bundle",
    "gananciaEstimada": 35789,
    "estado": "activa"
  }
}
```

---

### GET /ofertas
Listar mis ofertas

**Query Params:**
```
?tiendaId=uuid&filtro=todas|activas|pausadas&estrategia=descuento|bundle|obsequio
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "ofertas": [
      {
        "id": "uuid-1",
        "nombreProducto": "Zapatilla",
        "tipoEstrategia": "bundle",
        "gananciaEstimada": 35789,
        "estado": "activa",
        "detalles": {
          "bundleCantidad": 3,
          "bundleMargenPorcentaje": 50
        }
      }
    ]
  }
}
```

---

### PUT /ofertas/{id}
Editar oferta

---

### PATCH /ofertas/{id}/pausar
Pausar oferta

---

### DELETE /ofertas/{id}
Eliminar oferta

---

## 6. Flujos de Usuario

### Flujo 1: Primer Usuario (con Educación)
```
Accede Ofertas → Ve carousel educativo → Lee 3 estrategias →
Presiona "Crear mi primera oferta" → Wizard 4 pasos → Oferta creada
```

### Flujo 2: Usuario Recurrente
```
Accede Ofertas → Ve dashboard mis ofertas → Presiona "+ Crear oferta" →
Elige estrategia → Selecciona costeo → Builder → Preview → Activar
```

### Flujo 3: Editar Oferta Activa
```
Dashboard → Click oferta → Modal detalles → Botón "Editar" →
Wizard (omite paso seleccionar costeo) → Cambiar parámetros →
Guardar cambios
```

---

## 7. Validaciones de Negocio

- Descuento: No puede ser >100%, no puede ser 0%
- Bundle: Mínimo 2 unidades, máximo 10 unidades (configurable)
- Bundle: % margen entre 10-100%
- Obsequio: Costo regalo no puede ser > margen original
- No se puede crear oferta sin costeo guardado previo
- No se puede tener 2 ofertas iguales para mismo producto/tienda (validación)

---

## 8. Testing Requerimientos

### Unit Tests
- Cálculo descuento correcto
- Cálculo bundle (precio unitario, total, ahorro)
- Cálculo obsequio (reducción ganancia)
- Validaciones inputs

### E2E Tests
- Crear oferta descuento → Activar → Ver en dashboard
- Crear oferta bundle → Editar % margen → Guardar cambios
- Crear oferta obsequio → Pausar → Reanudar
- Eliminar oferta (con confirmación)

### Integration Tests
- RLS: User A no ve ofertas User B
- Crear oferta con costeo inexistente → Error
- Editar oferta pausada → Cambiar estado

---

## 9. Roadmap Futuro (Fase 2+)

- Estadísticas: conversión por estrategia
- A/B testing: comparar 2 ofertas
- Calendario: programar ofertas por fecha
- Automáticas: sugerir ofertas basadas en data
- Integración Meta: publicar oferta en anuncio

---

**Fin Especificación de Requerimientos - Módulo Ofertas Irresistibles**
