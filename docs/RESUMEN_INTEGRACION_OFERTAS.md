# Resumen Integración - Módulo Ofertas Irresistibles

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Estado:** Especificación Completa - Listo para Desarrollo

---

## 🎯 Objetivo del Módulo

Permitir a usuarios crear **estrategias de venta inteligentes** basadas en costeos previamente guardados, con opciones para:
- Descuentos en precio
- Bundles con margen variable (Recomendado para COD)
- Obsequios o complementos gratis

**Beneficio para usuario:** Aumentar ticket promedio manteniendo o controlando rentabilidad.

---

## 📍 Ubicación en Navegación

```
Sidebar izquierdo (entre Análisis Regional y Configuración):
├─ Dashboard
├─ Simulador
├─ Análisis Regional
├─ 🎁 Ofertas Irresistibles ← NUEVO MÓDULO
├─ Configuración
└─ Admin (si es admin)
```

---

## 🔄 Flujo Integrado

### A. En SIMULADOR (Fase costeo)
```
Usuario costea producto → Tab "📊 Estrategia de Volumen"
  ├─ Activar tabla de precios por volumen
  ├─ Definir % margen para unidades 2+
  ├─ Ver tabla: 1u, 2u, 3u, 4u, 5u con precios
  └─ Guardar costeo CON estrategia volumen
```

**Guardado en BD:**
- `estrategia_volumen_activada` (boolean)
- `estrategia_volumen_margen_porcentaje` (numeric)
- `tabla_precios` (JSON)

**Mostrar badge en costeos:** "📊 Con tabla de volumen"

---

### B. En OFERTAS IRRESISTIBLES (Crear campañas)
```
Usuario accede Ofertas → 
  1️⃣ Educación (carousel 3 estrategias) ← Primera vez
  2️⃣ Wizard 4 pasos:
     - Elegir estrategia
     - Seleccionar costeo (con opción "Usar tabla predefinida")
     - Builder dinámico (descuento/bundle/obsequio)
     - Preview y confirmar
  3️⃣ Dashboard mis ofertas (tabla + filtros)
```

**Si costeo tiene estrategia volumen:**
- Mostrar: "✅ Este costeo tiene tabla de volumen predefinida"
- Opción: "Usar tabla predefinida" o "Personalizar"

---

## 📋 Nuevos Requerimientos Funcionales (RF)

| RF | Nombre | Descripción |
|----|----|-----------|
| RF-051 | Educación Onboarding | Carousel mostrando 3 estrategias |
| RF-052 | Acceso Educación | Help button para revisar educación |
| RF-053 | Paso 1: Elegir Estrategia | Seleccionar descuento/bundle/obsequio |
| RF-054 | Paso 2: Seleccionar Costeo | Dropdown con costeos guardados |
| RF-055 | Paso 3: Builder Dinámico | Configuración según estrategia elegida |
| RF-056 | Paso 4: Preview | Revisión antes de activar |
| RF-057 | Dashboard Mis Ofertas | Tabla/cards con ofertas activas |
| RF-058 | Ver Detalles Oferta | Modal con información completa |
| RF-059 | Editar Oferta | Modificar parámetros oferta activa |
| RF-060 | Pausar/Reanudar Oferta | Toggle estado |
| RF-061 | Eliminar Oferta | Borrar con confirmación |
| RF-062 | Tab Estrategia Volumen | Nueva sección en Simulador |
| RF-063 | Usar Tabla Predefinida | Integración Simulador ↔ Ofertas |

**Total:** 13 nuevos requerimientos funcionales

---

## 🗄️ Cambios en Base de Datos

### Tabla COSTEOS (Actualizar)
```sql
-- Agregar columnas:
estrategia_volumen_activada BOOLEAN DEFAULT false
estrategia_volumen_margen_porcentaje NUMERIC(5,2)
tabla_precios JSON -- Array con opciones 1u, 2u, 3u, 4u, 5u
```

### Tabla OFERTAS (Crear)
```sql
CREATE TABLE ofertas (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL,
  tienda_id UUID NOT NULL,
  costeo_id UUID NOT NULL,
  nombre_producto VARCHAR,
  tipo_estrategia ENUM('descuento', 'bundle', 'obsequio'),
  
  -- Descuento
  descuento_porcentaje NUMERIC(5,2),
  
  -- Bundle
  bundle_cantidad INTEGER,
  bundle_margen_porcentaje NUMERIC(5,2),
  
  -- Obsequio
  obsequio_tipo VARCHAR,
  obsequio_costo NUMERIC,
  obsequio_descripcion TEXT,
  
  -- Común
  ganancia_estimada NUMERIC,
  margen_estimado NUMERIC(5,2),
  estado ENUM('activa', 'pausada', 'expirada'),
  
  fecha_creacion TIMESTAMP,
  fecha_activacion TIMESTAMP,
  fecha_expiracion TIMESTAMP,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES users(id),
  FOREIGN KEY (tienda_id) REFERENCES tiendas(id),
  FOREIGN KEY (costeo_id) REFERENCES costeos(id)
);

-- RLS: Usuario solo ve sus ofertas
CREATE POLICY "Users view own ofertas"
ON ofertas FOR SELECT
USING (usuario_id = auth.uid());
```

---

## 🔌 API Endpoints Nuevos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/ofertas/crear` | Crear nueva oferta |
| GET | `/ofertas` | Listar mis ofertas |
| GET | `/ofertas/{id}` | Ver detalles oferta |
| PUT | `/ofertas/{id}` | Editar oferta |
| PATCH | `/ofertas/{id}/pausar` | Pausar/reanudar |
| DELETE | `/ofertas/{id}` | Eliminar oferta |

---

## 🎨 Pantallas UI/UX Nuevas

| Pantalla | Descripción | Responsive |
|----------|-----------|-----------|
| Dashboard Mis Ofertas | Tabla/cards con ofertas activas | Sí (card view mobile) |
| Carousel Educativo | 3 slides estrategias | Sí |
| Wizard Paso 1 | Elegir estrategia (3 cards) | Sí |
| Wizard Paso 2 | Seleccionar costeo | Sí |
| Wizard Paso 3 | Builder dinámico (3 variantes) | Sí |
| Wizard Paso 4 | Preview oferta | Sí |
| Modal Detalles | Ver información oferta | Sí (modal adaptable) |
| Tab Simulador | Estrategia de Volumen | Sí |

---

## 📊 Cálculos Clave

### Descuento en Precio
```
Precio oferta = Precio original × (1 - Descuento%)
Tu ganancia nueva = Ganancia original × (1 - Descuento%)
Margen nuevo = Tu ganancia nueva / Precio oferta × 100
```

### Bundle con Margen Variable
```
Precio unidad 2+ = Costo_proveedor + (Margen_original × % margen)

Para 2 unidades:
  Total = Precio_unidad_1 + Precio_unidad_2
  Por unidad = Total / 2
  Ahorro cliente = Precio_unidad_1 - Por_unidad
  Tu ganancia total = Ganancia_u1 + (Margen_original × % margen)
```

### Obsequios
```
Valor percibido = Precio producto + Costo regalo
Tu ganancia nueva = Ganancia original - Costo regalo
```

---

## 🧪 Testing Requerido

### Unit Tests
- ✅ Cálculo descuento correcto
- ✅ Cálculo bundle (precio, ahorro, ganancia)
- ✅ Cálculo obsequio (reducción ganancia)
- ✅ Tabla volumen (5 opciones precios)
- ✅ Validaciones inputs

### E2E Tests (Casos Críticos)
- ✅ Crear oferta descuento → Activar → Ver en dashboard
- ✅ Crear oferta bundle con tabla predefinida → Usar tabla
- ✅ Crear oferta bundle personalizada → Cambiar % margen
- ✅ Crear oferta obsequio → Pausar → Reanudar
- ✅ Eliminar oferta (con confirmación)

### Integration Tests
- ✅ RLS: User A no ve ofertas User B
- ✅ Costeo sin estrategia volumen → No mostrar opción
- ✅ Costeo con estrategia volumen → Pre-seleccionar parámetros

---

## 📈 Validaciones de Negocio

**Descuento:**
- Debe ser > 0% y < 100%
- ⚠️ Warning si margen final < 5%

**Bundle:**
- Cantidad mínima: 2 unidades
- Cantidad máxima: 10 unidades
- % margen: 10-100%
- ⚠️ Warning si % margen < 10%

**Obsequio:**
- Costo regalo no puede ser > margen original
- Validación: No pierdes dinero

**General:**
- No se puede crear oferta sin costeo previo
- No se puede crear 2 ofertas iguales mismo producto/tienda

---

## 📱 Responsive Design

| Device | Comportamiento |
|--------|-----------|
| Mobile (320-640px) | Wizard full width, cards 1 col, botones 48px |
| Tablet (641-1024px) | Wizard 80% width, cards 2 col, tabla scroll |
| Desktop (1025px+) | Wizard 600px centrado, cards 3-4 col, tabla full |

---

## 🌙 Dark Mode

Soportado en:
- Dashboard ofertas
- Wizard
- Modales
- Cards

Usando CSS variables definidas en Diseño UI/UX.

---

## 🔄 Flujo Completo Usuario (Ejemplo)

```
1. Usuario costea "Zapatilla Deportiva" en Simulador
   → Accede Tab "Estrategia de Volumen"
   → Activa checkbox
   → Configura 50% margen para 2+
   → Ve tabla: 1u=$89.4k, 2u=$108.3k ($54.1), etc
   → Guarda costeo CON estrategia

2. Usuario accede Ofertas Irresistibles
   → Primera vez: ve carousel educativo
   → Presiona "Crear mi primera oferta"
   → Elige "Bundle" (estrategia)
   → Selecciona costeo "Zapatilla"
   → Ve "✅ Usar tabla predefinida" (50% margen)
   → Presiona "Usar tabla predefinida"
   → Preview muestra tabla de 2-5 unidades
   → Presiona "Activar oferta"
   → Oferta creada y visible en dashboard

3. En Dashboard Mis Ofertas
   → Ve tabla con Zapatilla
   → Estrategia: "📦 Bundle | Margen 50%"
   → Comparativa: 1u/$89.4k → 2u/$108.3k → 5u/$164.8k
   → Ganancia: $17.8k → $53.6k ✅
   → Estado: ✅ Activa
   → Puede editar, pausar o eliminar
```

---

## ⏱️ Timeline de Desarrollo (Referencia)

| Semana | Tarea |
|--------|-------|
| Sem 1-2 | Auth + Simulador base |
| Sem 2-3 | Tab "Estrategia de Volumen" en Simulador |
| Sem 3-4 | Módulo Ofertas Irresistibles (Educación + Wizard) |
| Sem 4-5 | Dashboard Ofertas + Gestión |
| Sem 5 | Testing integral (unit + E2E) |

---

## 📚 Documentos de Referencia

- ✅ [Especificación Requerimientos Ofertas](ESPECIFICACION_REQUERIMIENTOS_OFERTAS.md)
- ✅ [Especificación UI/UX Ofertas](ESPECIFICACION_UIUX_OFERTAS.md)
- ✅ [Guía Estrategias Ofertas](Guía de Estrategias de Ofertas para COD.md)

---

## ✅ Checklist Pre-Desarrollo

- [ ] Leer especificación requerimientos completa
- [ ] Revisar diseños UI/UX en Stitch/Figma
- [ ] Validar tabla costeos con nuevas columnas
- [ ] Crear tabla ofertas en BD
- [ ] Crear RLS policies
- [ ] Implementar endpoints API (5 nuevos)
- [ ] Desarrollar Tab Simulador
- [ ] Desarrollar Wizard (4 pasos)
- [ ] Desarrollar Dashboard ofertas
- [ ] Escribir tests (unit + E2E)
- [ ] Validar cálculos con ejemplos
- [ ] Revisar responsive mobile/tablet
- [ ] Implementar dark mode
- [ ] Deploy staging
- [ ] Testing final
- [ ] Deploy producción

---

**Fin Resumen Integración - Módulo Ofertas Irresistibles**
