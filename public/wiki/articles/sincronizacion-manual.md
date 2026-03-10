# Sincronización Manual de Pedidos (Dropi)

Para que DropCost Master pueda mostrarte una comparación real entre tus gastos proyectados y tu rentabilidad real, es necesario alimentar el sistema con los datos de logística de tus pedidos.

---

## 1. El Proceso de Sincronización

Aunque contamos con sincronizadores automáticos en desarrollo, la forma más precisa de actualizar tus estados logísticos actualmente es mediante la importación de archivos.

### Paso 1: Exportar desde Dropi
1. Ingresa a tu panel de **Dropi**.
2. Dirígete a la sección **"Mis Pedidos"**.
3. Selecciona el rango de fechas que deseas sincronizar.
4. Exporta el reporte específicamente con la opción: **"Órdenes (Una orden por fila)"**. 
   * *Este es el formato que contiene la información técnica necesaria para vincular tus datos correctamente con Shopify.*

### Paso 2: Subir a DropCost Master
1. En DropCost, ve a **Sincronizar** en el menú lateral.
2. Arrastra y suelta el archivo Excel exportado de Dropi o haz clic para buscarlo.
3. El sistema procesará el archivo y te llevará a la pantalla de **Mapeo**.

---

> [!IMPORTANT]
> **Privacidad de Datos**: Este proceso de sincronización **NO almacena información de contacto** (nombres, teléfonos o correos) de tus clientes. El sistema solo procesa IDs de órdenes y datos financieros. La información de contacto solo será visible si tienes el **Módulo de Contactos** activado previa aceptación del descargo de responsabilidad. Te invitamos a revisar nuestra [Política de Privacidad](/privacidad) y [Términos y Condiciones](/terminos).

---

## 2. Mapeo de Columnas

Esta es la parte más importante para asegurar que los datos se crucen correctamente. Debes vincular las columnas de tu Excel con los campos de DropCost.

### Campos Críticos:
*   **ID de Orden de Tienda (Shopify Order ID)**: Es el campo obligatorio. Permite al sistema saber exactamente qué orden de Shopify corresponde a cada registro de Dropi.
*   **Estatus (Estado Logística)**: Crucial para saber si el pedido fue entregado, devuelto o está en camino.
*   **Precio Flete y Comisión**: Estos valores permiten al sistema calcular tu **Ganancia Neta Real**, restando los costos de envío y las comisiones de recaudo que efectivamente te cobraron.

### Protección de Datos:
Al final del mapeo, verás la opción **"No actualizar valores vacíos"**. Te recomendamos mantenerla activa para evitar que, si una celda en tu Excel está vacía, se borre información que ya tenías guardada en el sistema.

---

## 3. Resultados de la Sincronización

Una vez finalizada, verás un resumen con:
*   **Coincidencias**: Cuántas órdenes se encontraron con éxito.
*   **Actualizadas**: Cuántas órdenes cambiaron su estado o valores financieros.
*   **Sin Match**: Cuántas filas del Excel no correspondían a ninguna orden de Shopify en tu cuenta.

> [!TIP]
> Realiza esta sincronización al menos 2 veces por semana para ver cómo evoluciona tu ROAS Real vs. tu ROAS Costeado en el Dashboard de KPIs.
