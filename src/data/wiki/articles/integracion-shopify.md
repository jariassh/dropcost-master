
# Conectando tu Tienda Shopify

Automatiza tu negocio sincronizando tus órdenes de venta directamente con DropCost Master. Sigue esta guía detallada para configurar tu integración en minutos.

## Fase 1: Creación de la App en Shopify
Para que DropCost se comunique con tu tienda, necesitamos crear un "puente" seguro llamado App Personalizada.

1. **Acceso al Panel de Desarrollador**: Ve a tu Shopify > **Configuración** > **Apps y canales de venta** > **Desarrollar aplicaciones**. Si es tu primera vez, es posible que debas aceptar los términos de uso. También puedes acceder directamente en [dev.shopify.com/dashboard](https://dev.shopify.com/dashboard).
2. **Crear nueva App**: Haz clic en el botón **"Crear una app"**.
3. **Identificación**: Dale un nombre descriptivo, por ejemplo: **"DropCost Master Connector"**. Esto te ayudará a identificar la conexión en el futuro.
4. **Configurar Permisos (Scopes)**: En la pestaña de **Configuración** de tu nueva app, busca el apartado de **Acceso** (o Admin API integration). Debes seleccionar los siguientes permisos de lectura para que el sistema funcione:
   - `read_orders`
   - `read_all_orders`
   - `read_products`
   - `read_inventory`
   - `read_analytics`
5. **Publicar e Instalar**: Una vez seleccionados los permisos, dale clic en **Publicar**. Luego, en el panel izquierdo, presiona el botón **"Instalar App"** y confirma la instalación en tu tienda.

## Fase 2: Generación del Token de Acceso
El Token es la "llave" maestra que permite a DropCost leer la data de tus pedidos.

1. **Obtener Credenciales**: Dentro de tu App en el [Dev Dashboard](https://dev.shopify.com/dashboard), ve a la pestaña de **Configuración**. Allí verás tu **Client ID** y tu **Client Secret**.
2. **Extraer el Token (shpat_***)**: Tienes dos caminos:
   - **Manual**: Usando herramientas como Postman siguiendo la [documentación de Shopify](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant).
   - **Asistente DropCost (Recomendado)**: Usa nuestra herramienta interna pegando tu Client ID y Secret. Generaremos el token por ti y **no guardaremos tus credenciales** en ninguna parte (somos 100% transparentes con tu seguridad).
3. **Vincular en DropCost**: Una vez tengas tu token (que empieza por `shpat_`), ve a nuestra plataforma: **Configuración** > **Tiendas** > **Gestionar tienda** y pega el código en el campo **Access Token**.

## Fase 3: Dominio y Webhooks
Para que los pedidos lleguen "en tiempo real", debemos configurar las notificaciones automáticas.

1. **Tu Dominio Shopify**: Ve a Shopify > **Configuración** > **Dominios**. Identifica tu dominio técnico que termina en `.myshopify.com` (ej: `mi-tienda.myshopify.com`). Copia solo el identificador y pégalo en el campo **Dominio Shopify** de nuestra app.
2. **Activar Webhooks**: Al guardar la configuración anterior en DropCost, el sistema te entregará un **Enlace de Webhook** único.
3. **Configurar Notificaciones en Shopify**:
   - Ve a Shopify > **Configuración** > **Notificaciones** > **Webhooks** (al final de la página).
   - Haz clic en **Crear Webhook**.
   - Crea dos notificaciones estrictamente necesarias:
     - **Creación de pedido**: Formato JSON, pega tu URL de DropCost y elige la versión de API más reciente.
     - **Cancelación de pedido**: Repite el proceso con la misma URL.

### ✅ ¡Listo!
Tu tienda ahora está 100% sincronizada. Cada vez que entre un pedido o se cancele, DropCost Master lo procesará en tiempo real para actualizar tu Dashboard de utilidades.
