# Conectando tu Tienda Shopify

Automatiza tu negocio sincronizando tus órdenes de venta directamente con DropCost Master. Sigue esta guía ajustada para configurar tu integración correctamente.

---

## Paso 1: Obtener Credenciales en el Panel de Desarrollador

Para que DropCost se comunique con tu tienda, necesitamos crear una "App Personalizada".

1. **Acceso al Dashboard**: Ve a tu Shopify > **Configuración** > **Apps y canales de venta** > **Desarrollar aplicaciones**.
2. **Dashboard de Desarrollador**: Selecciona **"Desarrollar apps en Dev Dashboard"**.
   - **Nota Importante**: Si es la primera vez que ingresas y no recibes el correo de verificación de Shopify, comunícate directamente con el soporte de Shopify para habilitar tu acceso.
   - Alternativamente, puedes intentar entrar directamente con la cuenta de tu tienda en [dev.shopify.com/dashboard](https://dev.shopify.com/dashboard). Para consultas técnicas adicionales, consulta la [documentación oficial](https://shopify.dev/docs).
3. **Crear App**: Una vez dentro, ubica y presiona el botón **"Crear App"**. Dale un nombre (ej: "DropCost Master") y confirma.

---

## Paso 2: Configurar Permisos y Generar el Token

El Token es la "llave" que permite a DropCost leer tus pedidos de forma segura.

1. **Configuración de la Admin API**: En la pestaña de **Configuración** de tu nueva app, busca "Admin API integration" y selecciona los siguientes permisos de lectura (**Scopes**):
   - `read_orders`
   - `read_all_orders`
   - `read_products`
   - `read_inventory`
2. **Instalación**: Guarda los cambios y presiona **"Instalar App"**.
3. **Tu Llave Maestra**: Al instalarla, se revelará el **Admin API access token** (empieza por `shpat_`). 
   - **CUIDADO**: Este token solo se muestra UNA VEZ. Cópialo y guárdalo en un lugar seguro.

---

## Paso 3: Vincular en DropCost Master

Ahora que tienes el token, vamos a conectarlo con tu cuenta:

1. Ve a DropCost Master > **Configuración** > **Tiendas** > **Gestionar Tienda**.
2. Identifica tu dominio técnico (ej: `tu-tienda.myshopify.com`). Lo encuentras en Shopify > **Configuración** > **Dominios**.
3. Pega tu **Dominio** y tu **Access Token** (`shpat_...`) en los campos correspondientes y guarda.

---

## Paso 4: Configurar los Webhooks (Tiempo Real)

Para que los pedidos lleguen al instante sin que tengas que hacer nada, configura los Webhooks:

1. En Shopify, ve a **Configuración** > **Notificaciones** > **Webhooks** (al final de la página).
2. Haz clic en **Crear Webhook**.
3. Configura los siguientes dos eventos (Versión JSON):
   - **Creación de pedido**: Pega la URL que te proporciona DropCost en la sección de gestión de tienda.
   - **Actualización de pedido**: Pega la misma URL.
4. Asegúrate de seleccionar la versión de la API más reciente.

### ✅ ¡Felicidades!
Tu tienda está vinculada. A partir de ahora, cada venta se reflejará automáticamente en tu Dashboard de KPIs para que analices tu rentabilidad real.
