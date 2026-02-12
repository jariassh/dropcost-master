**ESPECIFICACIÓN DE REQUERIMIENTOS**

**DropCost Master**

*Aplicación de Costeo de Productos en Modalidad E-commerce con Dropshipping y Pago Contra Entrega*

**Versión 1.0**

Febrero 2026

## **Control del Documento**

| Versión | Fecha | Autor | Descripción |
| :---- | :---- | :---- | :---- |
| 1.0 | Feb 2026 | Equipo | Documento inicial |

# **1\. Introducción**

## **1.1 Propósito del Documento**

Este documento especifica los requerimientos funcionales, no funcionales y de datos para el desarrollo de DropCost Master, una aplicación web moderna de costeo de productos en modalidad e-commerce con dropshipping y pago contra entrega (COD).

## **1.2 Descripción General del Proyecto**

DropCost Master es una plataforma integral que permite a dropshippers y emprendedores del e-commerce en Latinoamérica:

* Simular y calcular precios de venta óptimos basados en costos operativos  
* Guardar múltiples costeos por tienda y campaña  
* Integrar datos reales de Meta Ads, Shopify y Dropi  
* Visualizar dashboards ejecutivos con análisis en tiempo real  
* Analizar rendimiento por región y transportadora  
* Tomar decisiones basadas en datos precisos

## **1.3 Público Objetivo**

Dropshippers y emprendedores del e-commerce en Latinoamérica que operan con COD (Pago Contra Entrega).

# **2\. Alcance**

## **2.1 Módulos Principales**

* Autenticación y Gestión de Usuarios  
* Simulador Financiero COD  
* Dashboard Ejecutivo  
* Análisis Regional  
* Gestión de Tiendas  
* Integraciones de Datos  
* Configuración de Usuario y Membresía  
* Panel de Administración

# **3\. Requerimientos Funcionales**

## **3.1 Autenticación y Gestión de Usuarios**

### **RF-001: Registro de Usuario**

Los usuarios pueden registrarse proporcionando nombre, apellido, correo electrónico y contraseña. El sistema enviará un correo de verificación. La contraseña debe cumplir con estándares de seguridad (mínimo 8 caracteres, combinación de mayúsculas, minúsculas, números y símbolos).

### **RF-002: Verificación de Email**

El usuario debe verificar su correo antes de activar su cuenta. Se enviará un enlace de verificación válido por 24 horas.

### **RF-003: Inicio de Sesión**

Los usuarios pueden iniciar sesión con correo y contraseña. El sistema debe mostrar intentos fallidos y bloquear tras 5 intentos fallidos por 15 minutos.

### **RF-004: Autenticación de Dos Factores (2FA)**

Se implementará 2FA mediante código enviado al correo electrónico. El código tiene validez de 10 minutos. Posteriormente se integrará Google Authenticator para códigos de un solo uso (OTP).

### **RF-005: Recuperación de Contraseña**

Los usuarios pueden solicitar recuperación de contraseña. Se enviará un enlace válido por 24 horas para establecer una nueva contraseña.

### **RF-006: Gestión de Sesiones**

El sistema debe manejar sesiones con expiración configurable (ej: 30 días). Los usuarios pueden cerrar sesión manualmente. Se debe permitir ver y cerrar sesiones activas en otros dispositivos.

## **3.2 Simulador Financiero COD**

### **RF-007: Datos de Referencia (Primera Vez)**

Al crear el primer costeo, el usuario ingresa datos de referencia:

* Margen neto deseado (%)  
* Costo del producto  
* Costo del flete base  
* Comisión por recaudo de transportadora (%)  
* Tasa de devoluciones (%)  
* Otros gastos (comisiones plataforma, empaques)  
* CPA Promedio (Meta Ads)  
* % de cancelación pre-envío

### **RF-008: Cálculo de Precio Sugerido**

El sistema calcula automáticamente el precio de venta sugerido considerando todos los parámetros ingresados, mostrando:

* Precio sugerido de venta  
* Utilidad neta por venta  
* Porcentaje de efectividad final

### **RF-009: Visualización de Análisis**

El simulador muestra múltiples vistas de análisis:

* Costos logísticos reales desglosados  
* Embudo de efectividad visual  
* Desglose porcentual del precio de venta (producto, marketing, logística, operación, neto)

### **RF-010: Guardar Costeos**

Los usuarios pueden guardar costeos. Al guardar, deben seleccionar o crear una tienda y proporcionar ID de campaña Meta (opcional). El costeo incluye producto, referencias de datos usadas, resultados y fecha.

### **RF-011: Duplicar Costeos**

Los usuarios pueden duplicar un costeo guardado. El ID de campaña puede modificarse para rastrear diferentes campañas del mismo producto.

### **RF-012: Eliminar Costeos**

Los usuarios pueden eliminar costeos con confirmación previa.

### **RF-013: Evolución de Parámetros**

Los valores de referencia iniciales pueden convertirse en valores calculados basados en data histórica recopilada. El usuario siempre puede editar manualmente cualquier parámetro.

## **3.3 Gestión de Tiendas**

### **RF-014: Crear Tienda**

Los usuarios pueden crear nuevas tiendas. Datos requeridos: nombre, logo, país de operación. Se puede crear una tienda al momento de guardar un primer costeo.

### **RF-015: Listar y Seleccionar Tiendas**

Se visualiza lista de tiendas registradas con nombre, logo y país. Buscador para localizar tiendas rápidamente. Selector para elegir tienda activa en simulador, dashboard y análisis.

### **RF-016: Editar Tienda**

Los usuarios pueden editar nombre y logo de una tienda. El país no es editable (dato histórico importante).

### **RF-017: Eliminar Tienda**

Los usuarios pueden eliminar una tienda con confirmación. Se eliminarán todos los costeos, integraciones y datos asociados.

### **RF-018: Aislamiento de Datos por Tienda**

Cada tienda gestiona su propia data de forma independiente. Las integraciones, costeos, reportes y análisis de una tienda no se mezclan con otras.

## **3.4 Integraciones de Datos**

### **RF-019: Integración Meta Ads**

Los usuarios pueden conectar Meta Ads para obtener CPA real y datos de campañas en tiempo real. Se identifica cada campaña por ID para correlacionar con costeos guardados.

### **RF-020: Integración Dropi**

Los usuarios pueden conectar Dropi para obtener estado de envíos y órdenes. El sistema calcula estadísticas de devoluciones promedio basadas en data real.

### **RF-021: Integración Shopify**

Los usuarios pueden conectar Shopify para obtener datos de ventas y cancelaciones pre-envío. Permite calcular % de cancelación más preciso.

### **RF-022: Carga de Datos CSV**

Si no hay integraciones disponibles, los usuarios pueden subir archivos CSV con data de Meta Ads, Dropi y Shopify. El sistema mapea columnas automáticamente.

### **RF-023: Gestión de Integraciones**

En configuración de tienda, el usuario puede conectar/desconectar integraciones, ver estado de sincronización y fecha de última actualización.

## **3.5 Dashboard Ejecutivo**

### **RF-024: Selector de Tienda**

El dashboard permite seleccionar la tienda a analizar. Los datos se actualizan automáticamente.

### **RF-025: KPIs Principales**

Se muestran tarjetas de KPIs:

* CPA Real (CPA\_R) con variación vs período anterior  
* Tasa de Entrega Neta con variación  
* Margen Real con variación  
* Factor de Markup  
* Número de Pedidos  
* Cantidad de Artículos Vendidos

### **RF-026: Semáforo de Viabilidad**

Se muestra indicador visual (verde/amarillo/rojo) según viabilidad de operación. Incluye recomendación de IA contextualizada a los números actuales.

### **RF-027: Gráfico de Tendencias CPA**

Gráfico de línea que muestra evolución de CPA en el período seleccionado.

### **RF-028: Simulador de Rentabilidad**

Widget interactivo que permite ajustar tasa de devolución (slider) y muestra utilidad neta proyectada en tiempo real.

### **RF-029: Filtros de Fecha**

Los usuarios pueden seleccionar rango de fechas personalizadas. Se proporciona opción rápida para últimos 30 días, últimos 60 días, este mes, etc.

## **3.6 Análisis Regional**

### **RF-030: Seleccionar Tienda**

El módulo permite elegir tienda para analizar sus regiones.

### **RF-031: Tarjetas de Regiones**

Se muestran tarjetas por región/departamento/estado según país. Cada tarjeta muestra:

* Nombre región  
* Bandeja/bandera país  
* Primer intento (% de entrega exitosa)  
* Incidencias (%)  
* Semáforo de estado (óptimo/estable/alerta)

### **RF-032: Tabla Benchmarks Transportadoras**

Tabla que muestra por cada región: transportadora clave, meta benchmark de entrega, incidencias, y estado del cumplimiento.

### **RF-033: Mapa de Riesgo Regional**

Mapa interactivo del país mostrando regiones coloreadas según riesgo logístico para COD:

* Verde: Zona segura para operar  
* Amarillo: Precaución recomendada  
* Rojo: No operar (afecta rentabilidad)

## **3.7 Configuración de Usuario**

### **RF-034: Mi Perfil**

Los usuarios pueden editar datos personales (nombres, apellidos, email, teléfono). El selector de teléfono debe mostrar bandera, nombre y código de país.

### **RF-035: Guardar Cambios de Perfil**

Los cambios se guardan con confirmación. Si hay cambio de email, se requiere verificación.

### **RF-036: Inactivar Cuenta**

Los usuarios pueden solicitar inactivación de cuenta con confirmación. Se requiere contraseña.

### **RF-037: Gestión de Métodos de Pago**

Los usuarios pueden agregar múltiples métodos de pago (tarjetas, cuentas bancarias, etc). Un método se marca como principal, los demás como alternos. Se puede eliminar métodos.

### **RF-038: Información de Membresía**

Se muestra plan activo, estado de suscripción, costo mensual/anual, fecha de renovación.

### **RF-039: Cambiar Plan**

Los usuarios pueden cambiar a otro plan. Se muestra comparativa de características y se aplica prorrateo.

### **RF-040: Gestión de Tiendas (desde Configuración)**

En configuración, el usuario ve todas sus tiendas en tabla con columnas: nombre, logo, país, acción. Puede agregar tienda, gestionar una tienda existente (editar logo/nombre, administrar integraciones, eliminar), y ver estadísticas de costeos.

### **RF-041: Tabla de Estadísticas de Costeos**

Por cada tienda se muestra tabla con: fecha costeo, nombre producto, ID campaña Meta, costeo realizado, ventas logradas, cantidad artículos, rentabilidad total.

## **3.8 Panel de Administración**

### **RF-042: Control de Usuarios**

Los administradores pueden listar usuarios registrados, ver detalles (email, plan, estado suscripción, fecha registro, última actividad), buscar, filtrar por plan/estado.

### **RF-043: Dashboards Financieros**

Dashboards internos que muestren: MRR (ingresos recurrentes mensuales), churn rate, lifetime value, número de usuarios activos, desglose por plan.

### **RF-044: Gestión de Integraciones de Pago**

Los administradores pueden configurar integraciones con pasarelas (Mercado Pago, PayPal, Stripe), gestionar API keys, ver transacciones.

### **RF-045: Gestión de Planes**

Los administradores pueden crear, editar y eliminar planes de membresía. Definir características, precio, período de facturación.

### **RF-046: Códigos Promocionales**

Los administradores pueden crear códigos de descuento especificando: descuento %, planes aplicables, límite de usos, fecha de expiración. Ver historial de uso.

### **RF-047: Programa de Referidos**

Los administradores pueden configurar programa de referidos: comisión por referido, beneficios (descuentos, meses gratis), límites, vigencia.

### **RF-048: Templates de Emails**

Los administradores pueden crear y editar templates para:

* Facturas y recibos  
* Bienvenida de cuenta  
* Verificación de email  
* Cambio de contraseña  
* Cancelación de membresía  
* Recordatorios de renovación

### **RF-049: Logs de Actividad**

Los administradores pueden ver logs detallados de actividades de usuarios: logins, cambios de plan, integraciones, costeos, etc. Filtrable por usuario, tipo, fecha.

### **RF-050: Sistema de Soporte/Tickets**

Los usuarios pueden crear tickets de soporte. Los administradores pueden responder, cambiar estado (abierto, en progreso, resuelto), asignar a equipo.

# **4\. Requerimientos No Funcionales**

## **4.1 Seguridad**

### **RNF-001: Cumplimiento PCI DSS**

No almacenar datos de tarjetas de crédito en servidores propios. Usar tokenización con proveedores de pago (Stripe, Mercado Pago, PayPal).

### **RNF-002: Encriptación en Tránsito**

Todo el tráfico debe ser HTTPS con certificado TLS válido (mínimo TLS 1.2).

### **RNF-003: Encriptación en Reposo**

Datos sensibles (API keys, tokens) deben estar encriptados en base de datos.

### **RNF-004: Validación y Sanitización de Inputs**

Prevenir inyecciones SQL, XSS, CSRF mediante validación y sanitización en frontend y backend.

### **RNF-005: Rate Limiting**

Implementar rate limiting para prevenir ataques de fuerza bruta, DDoS. Bloquear tras múltiples intentos fallidos.

### **RNF-006: Gestión de Credenciales**

API keys y credenciales deben almacenarse en variables de entorno, no en código. Rotación de credenciales cada 90 días.

### **RNF-007: Cumplimiento LGPD/GDPR**

Política de privacidad clara. Derecho a olvido (eliminación de datos). Consentimiento explícito para recopilación de datos. Cifrado de datos personales.

### **RNF-008: Monitoreo de Seguridad**

Logs de seguridad. Alertas para intentos de acceso no autorizados, cambios en datos sensibles. Auditoría de cambios.

## **4.2 Rendimiento**

### **RNF-009: Tiempo de Carga**

Página inicial debe cargar en menos de 3 segundos. Dashboards en menos de 2 segundos.

### **RNF-010: Disponibilidad**

SLA de 99.5% disponibilidad. Mantenimiento solo en horarios no pico (notificado 48 horas antes).

### **RNF-011: Escalabilidad**

Arquitectura debe soportar crecimiento hasta 10,000 usuarios activos concurrentes sin degradación.

### **RNF-012: Backup y Recuperación**

Backups automáticos diarios. Tiempo de recuperación ante desastres máximo 2 horas (RTO 2h, RPO 24h).

## **4.3 Usabilidad y Diseño**

### **RNF-013: Diseño Responsivo**

Aplicación debe adaptarse perfectamente a cualquier tamaño de pantalla (móvil, tablet, desktop). Principios mobile-first.

### **RNF-014: Estándares UI/UX**

Diseño moderno con excelente manejo de conceptos UI/UX. Consistencia visual, accesibilidad (WCAG 2.1 AA), navegación intuitiva.

### **RNF-015: Dark/Light Mode**

Aplicación debe soportar ambos temas. Usuario puede elegir o usar preferencia del sistema.

### **RNF-016: Onboarding e Tutoriales**

Guías interactivas y tutoriales para nuevos usuarios. Modo demo/sandbox para experimentar sin datos reales.

## **4.4 Integraciones**

### **RNF-017: Sincronización de Datos**

Integraciones deben sincronizarse automáticamente cada hora. Usuario puede forzar sincronización manual.

### **RNF-018: Renovación de Tokens**

Tokens de integración deben renovarse automáticamente. Usuario notificado si hay errores de sincronización.

# **5\. Especificaciones de Datos**

## **5.1 Entidades Principales**

### **Usuario**

Almacena información de usuarios: ID, email, contraseña (hash), nombre, apellido, teléfono, país, plan, estado suscripción, fecha registro, última actividad.

### **Tienda**

Información de tienda: ID, usuario\_id, nombre, logo (URL), país, fecha creación. Relación 1:N con usuario.

### **Costeo**

Registro de costeo: ID, tienda\_id, nombre\_producto, id\_campaña\_meta, margen\_deseado, costo\_producto, flete\_base, comisión\_recaudo, tasa\_devoluciones, otros\_gastos, cpa\_promedio, cancelación\_pre\_envío, precio\_sugerido, utilidad\_neta, efectividad\_final, fecha\_costeo.

### **Integración**

Credenciales de integración: ID, tienda\_id, tipo (meta\_ads/dropi/shopify), estado (conectada/desconectada), token (encriptado), fecha\_última\_sincronización.

### **Data Meta Ads**

Registros sincronizados: ID, tienda\_id, id\_campaña, cpa\_real, impresiones, clics, conversiones, gasto, fecha.

### **Data Dropi**

Información de envíos: ID, tienda\_id, id\_orden, estado\_envío, departamento, transportadora, fecha\_envío, fecha\_entrega.

### **Data Shopify**

Información de ventas: ID, tienda\_id, id\_orden, fecha\_venta, total, cancelada\_pre\_envío, cantidad\_artículos, fecha\_sincronización.

## **5.2 Aislamiento de Datos**

Cada tienda opera en silo de datos. Las consultas filtraran siempre por tienda\_id. Las integraciones son únicas por tienda.

# **6\. Roles y Permisos**

## **6.1 Cliente**

Acceso a: Simulador Financiero, Dashboard Ejecutivo, Análisis Regional, Gestión Tiendas, Integraciones, Configuración Personal. Sin acceso a módulo administración.

## **6.2 Admin/Super Admin**

Acceso total a todos los módulos incluyendo panel de administración: gestión usuarios, planes, integraciones pago, códigos promocionales, programa referidos, templates emails, logs.

# **7\. Requisitos Operacionales**

## **7.1 Exportación de Reportes**

Los usuarios pueden exportar reportes de costeos y dashboards en formato PDF y Excel.

## **7.2 Historial de Cambios**

Se mantiene auditoría de cambios en costeos y tiendas. Usuario puede ver historial y restaurar versiones anteriores.

## **7.3 Notificaciones**

Sistema de notificaciones en tiempo real para alertas críticas (CPA muy alto, efectividad baja, error en sincronización).

## **7.4 Búsqueda y Filtros**

Búsqueda avanzada y filtros en tablas de costeos (por fecha, producto, campaña, rentabilidad, etc).

## **7.5 Comparativa de Costeos**

Usuarios pueden comparar múltiples costeos del mismo producto o diferentes campañas, visualizando diferencias de parámetros y resultados.

# **8\. Consideraciones Legales y Normativas**

## **8.1 Política de Privacidad**

Documento claro explicando recopilación, uso y protección de datos del usuario.

## **8.2 Términos de Servicio**

Términos que regulan el uso de la plataforma, responsabilidades, limitaciones de responsabilidad.

## **8.3 LGPD/GDPR**

Cumplimiento de leyes de protección de datos personales en Latinoamérica y Europa.

## **8.4 Consentimiento de Datos**

Obtener consentimiento explícito del usuario para recopilación y procesamiento de datos.

# **9\. Próximos Pasos**

Este documento de especificación sirve como base para el desarrollo técnico de DropCost Master. Los equipos de diseño, backend y frontend deben utilizar estos requerimientos para crear la arquitectura, base de datos, APIs y componentes UI/UX de la aplicación.

Se recomienda revisión periódica de este documento a medida que evolucionen las necesidades del mercado y el feedback de usuarios.