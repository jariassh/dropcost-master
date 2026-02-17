# PROTOCOLO TÉCNICO DE CÁLCULO - MOTOR FINANCIERO COD
## DropCost Master - Simulador Financiero

**Documento para:** Google Antigravity  
**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Validado contra:** Cálculos algebraicos verificados

---

## 📋 RESUMEN EJECUTIVO

Este documento especifica el **protocolo exacto de cálculo** para el motor financiero COD. Cualquier desviación resultará en precios incorrectos.

**Resultado esperado:** 
- Con los datos estándar (producto $9.900, margen 20%, CPA $15.000, otros $3.700, cancelación 20%, devolución 20%, flete $20.000, comisión 1%)
- **El precio sugerido DEBE ser exactamente: $89.476**

---

## 🔧 PROTOCOLO DE CÁLCULO

### PASO 1: DEFINIR VARIABLES BASE

```javascript
// Inputs del usuario
const costoProducto = 9900;           // $ por unidad
const margenDeseado = 0.20;            // 20% = 0.20
const cpaPerPedido = 15000;            // $ por intento
const cancelacionPreEnvio = 0.20;      // 20% = 0.20
const tasaDevolucion = 0.20;           // 20% = 0.20
const fleteBase = 20000;               // $ de ida
const comisionRecaudo = 0.01;          // 1% = 0.01
const otrosGastos = 3700;              // $ por envío (incluye seguro)

// Variables derivadas (base 100 intentos para cálculos)
const intentosTotales = 100;
const pedidosEnviados = intentosTotales * (1 - cancelacionPreEnvio);      // 80
const pedidosEntregados = pedidosEnviados * (1 - tasaDevolucion);        // 64
const pedidosDevueltos = pedidosEnviados * tasaDevolucion;               // 16
```

---

### PASO 2: CALCULAR COSTOS FIJOS TOTALES (CF)

**CRÍTICO:** Los costos se multiplican por diferentes bases según su naturaleza.

```javascript
const costosFijos = {
  // CPA se paga por CADA INTENTO generado (100%)
  cpaTotal: cpaPerPedido * intentosTotales,
  
  // Otros gastos + Seguro se pagan por CADA ENVÍO (80%)
  otrosGastosTotal: otrosGastos * pedidosEnviados,
  
  // Producto se paga solo por ENTREGAS EXITOSAS (64%)
  productoTotal: costoProducto * pedidosEntregados,
  
  // Flete de ida se paga por CADA ENVÍO (80%)
  fleteEnvioTotal: fleteBase * pedidosEnviados,
  
  // Flete de devolución = 1.5x del flete base, por DEVOLUCIONES (16%)
  // IMPORTANTE: No es 100% del flete, es 1.5x
  fleteDevolucionTotal: (fleteBase * 1.5) * pedidosDevueltos
};

const costosFijosTotal = 
  costosFijos.cpaTotal +
  costosFijos.otrosGastosTotal +
  costosFijos.productoTotal +
  costosFijos.fleteEnvioTotal +
  costosFijos.fleteDevolucionTotal;

// Resultado esperado: $4,509,600
```

**Desglose para validación:**
```
CPA (100 × $15,000) = $1,500,000
Otros+Seguro (80 × $3,700) = $296,000
Producto (64 × $9,900) = $633,600
Flete envío (80 × $20,000) = $1,600,000
Flete devolución (16 × $30,000) = $480,000
─────────────────────────────
TOTAL = $4,509,600
```

---

### PASO 3: ECUACIÓN MAESTRA - DESPEJAR PRECIO (P)

**Objetivo:** Encontrar el Precio de Venta (P) que garantice el margen deseado.

#### Ecuación conceptual:
```
Ingreso Neto = Costos Fijos + Ganancia Deseada

Donde:
- Ingreso Bruto = P × Entregados
- Comisión = P × Enviados × 1%
- Ingreso Neto = Ingreso Bruto - Comisión
- Ganancia Deseada = Margen × P × Entregados
```

#### Ecuación completa:
```
(P × Entregados) - (P × Enviados × Comisión%) = CF + (Margen × P × Entregados)
```

#### Despejar P:
```
P × Entregados - P × Enviados × 0.01 = CF + Margen × P × Entregados

P × Entregados - P × Enviados × 0.01 - Margen × P × Entregados = CF

P × (Entregados - Enviados × 0.01 - Margen × Entregados) = CF

P = CF / (Entregados - Enviados × 0.01 - Margen × Entregados)

P = CF / (Entregados × (1 - Margen) - Enviados × 0.01)
```

#### En código:
```javascript
function calcularPrecioVenta(CF, margen, entregados, enviados, comisionRecaudo) {
  const denominador = 
    (entregados * (1 - margen)) - 
    (enviados * comisionRecaudo);
  
  const precioVenta = CF / denominador;
  
  return precioVenta;
}

// Aplicar
const precioCalculado = calcularPrecioVenta(
  costosFijosTotal,
  margenDeseado,
  pedidosEntregados,
  pedidosEnviados,
  comisionRecaudo
);

// Resultado esperado: $89,476
```

---

### PASO 4: VALIDACIÓN DEL RESULTADO

**Siempre validar que el margen real coincida con el deseado:**

```javascript
function validarCalculo(precioVenta, CF, margen, entregados, enviados, comisionRecaudo) {
  // Ingresos
  const ingresoBruto = precioVenta * entregados;
  const comisionTotal = precioVenta * enviados * comisionRecaudo;
  const ingresoNeto = ingresoBruto - comisionTotal;
  
  // Ganancia
  const gananciaBruta = ingresoNeto - CF;
  const gananciaPorUnidad = gananciaBruta / entregados;
  const margenReal = gananciaPorUnidad / precioVenta;
  
  // Validación
  console.log(`Margen esperado: ${margen * 100}%`);
  console.log(`Margen real: ${(margenReal * 100).toFixed(2)}%`);
  console.log(`Diferencia: ${Math.abs(margenReal - margen) * 100}.toFixed(4)}%`);
  
  if (Math.abs(margenReal - margen) < 0.0001) {
    console.log("✅ VALIDACIÓN EXITOSA");
    return true;
  } else {
    console.log("❌ ERROR EN CÁLCULO");
    return false;
  }
}
```

---

## 🎯 TABLA DE REFERENCIA

### Multiplicadores por tipo de costo:

| Costo | Multiplicado por | Cantidad | Ejemplo |
|-------|------------------|----------|---------|
| **CPA** | Intentos totales | 100 | $15,000 × 100 = $1,500,000 |
| **Otros gastos** | Enviados | 80 | $3,700 × 80 = $296,000 |
| **Producto** | Entregados | 64 | $9,900 × 64 = $633,600 |
| **Flete envío** | Enviados | 80 | $20,000 × 80 = $1,600,000 |
| **Flete devolución** | Devueltos (×1.5) | 16 | $30,000 × 16 = $480,000 |

---

## ⚠️ ERRORES COMUNES A EVITAR

### ❌ Error 1: Aplicar comisión solo sobre entregados
```javascript
// INCORRECTO
comisionTotal = precioVenta * pedidosEntregados * comisionRecaudo;

// CORRECTO
comisionTotal = precioVenta * pedidosEnviados * comisionRecaudo;
```
**Razón:** La transportadora cobra sobre la guía generada (enviados), no solo sobre entregas exitosas.

---

### ❌ Error 2: Usar 100% del flete para devoluciones
```javascript
// INCORRECTO
fleteDevolucionTotal = fleteBase * pedidosDevueltos;

// CORRECTO
fleteDevolucionTotal = (fleteBase * 1.5) * pedidosDevueltos;
```
**Razón:** 1.0 cubre flete de ida perdido + 0.5 cubre logística inversa.

---

### ❌ Error 3: Multiplicar "Otros gastos" por entregados en lugar de enviados
```javascript
// INCORRECTO
otrosGastosTotal = otrosGastos * pedidosEntregados;

// CORRECTO
otrosGastosTotal = otrosGastos * pedidosEnviados;
```
**Razón:** Empaque, seguro y otros se pagan cuando sale de bodega, no cuando llega.

---

### ❌ Error 4: Calcular margen sobre costo en lugar de sobre precio
```javascript
// INCORRECTO - Esto es MARKUP
margen = (precioVenta - costo) / costo;

// CORRECTO - Esto es MARGEN
margen = (precioVenta - costo) / precioVenta;
```
**Razón:** El usuario solicita 20% margen (sobre precio), no 20% markup (sobre costo).

---

## 🧪 PRUEBA DE HUMO (SMOKE TEST)

Ejecutar con estos datos para validar:

```javascript
const testData = {
  costoProducto: 9900,
  margenDeseado: 0.20,
  cpaPerPedido: 15000,
  cancelacionPreEnvio: 0.20,
  tasaDevolucion: 0.20,
  fleteBase: 20000,
  comisionRecaudo: 0.01,
  otrosGastos: 3700
};

const resultado = calcularPrecio(testData);

// DEBE ser exactamente (±$1):
// precioVenta = $89,476
// gananciaPorUnidad = $17,895
// margenReal = 20.00%
```

**Si el resultado NO es $89.476, hay un bug en la implementación.**

---

## 📊 VARIABLES PARA DASHBOARD

Una vez calculado el precio, mostrar:

```javascript
const metricas = {
  // Precios
  precioVentaSugerido: $89,476,
  
  // Rentabilidad
  utilidadNetaPorVenta: $17,895,
  efectividadFinal: 0.64,  // 64 entregados / 100 intentos
  
  // Desglose de costos (por 100 intentos)
  costosLogisticosReales: {
    fleteRecaudo: $20,892,  // Flete + Seguro - Devoluciones
    perdidaPorDevolucion: -$30,000  // Costo neto de devoluciones
  },
  
  // Embudo de efectividad
  confirmacionNoCancel: 0.80,  // 80%
  entregaFinalNoDevolución: 0.64  // 64%
};
```

---

## 🔄 VARIABLES DE ENTRADA QUE ACEPTA

```javascript
const inputsDelUsuario = {
  // META Y PRODUCTO
  costoProducto: Number,           // $ positivo
  margenNetoDeseado: Number,       // % (0-100), convertir a decimal
  
  // PUBLICIDAD
  cpaPorPedido: Number,            // $ positivo
  cancelacionPreEnvio: Number,     // % (0-100), convertir a decimal
  
  // LOGÍSTICA Y RECAUDO
  fleteBase: Number,               // $ positivo
  comisionRecaudo: Number,         // % (0-100), convertir a decimal
  tasaDevolucion: Number,          // % (0-100), convertir a decimal
  
  // OPERACIONAL
  otrosEmpaqueYPlat: Number        // $ positivo (puede incluir seguro)
};
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] CPA multiplica por **intentos totales** (100)
- [ ] Otros gastos multiplica por **enviados** (80)
- [ ] Producto multiplica por **entregados** (64)
- [ ] Flete envío multiplica por **enviados** (80)
- [ ] Flete devolución es **1.5x** el flete base
- [ ] Flete devolución multiplica por **devueltos** (16)
- [ ] Comisión se calcula sobre **ENVIADOS × Precio × 1%**
- [ ] Margen se calcula sobre **PRECIO**, no sobre costo
- [ ] Validación: precio $89.476 ± $1 con datos de prueba
- [ ] Validación: margen real = 20.00% ± 0.01%

---

## 📞 VALIDACIÓN CON EL CREADOR

Una vez implementado, ejecutar con los datos de prueba y confirmar que:

```
Entrada: Costo $9.900, Margen 20%, CPA $15k, Otros $3.700
Salida esperada: Precio $89.476, Ganancia $17.895 por unidad
```

Si coincide exacto, **la implementación es correcta.**

---

**Documento preparado por:** Análisis técnico verificado  
**Última actualización:** Febrero 12, 2026
