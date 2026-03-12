# CONTEXTO MAESTRO - DROPCOST MASTER
**Versión de Estado:** 2026-03-12 | **Actualización:** Tiempo Real

Este documento sirve como el estado del arte y biblia técnica/funcional de **DropCost Master**, diseñado específicamente para dar contexto total a cualquier Agente IA (como Claude, Gemini, etc.) que asista en el desarrollo del proyecto.

---

## 1. DESCRIPCIÓN GENERAL DEL PRODUCTO
**DropCost Master** es una plataforma SaaS (Software as a Service) especializada en la gestión financiera y operativa para *Dropshippers* en Latinoamérica que operan con el modelo de pagos a contraentrega (Cash On Delivery - COD). El objetivo del sistema es resolver el principal dolor del e-commerce: ganar facturación pero perder dinero por falta de cálculo en fletes, CPA (Costo por Adquisición) y tasas de devoluciones.

La plataforma permite simular, proyectar ofertas, medir rentabilidad real al centavo, gestionar múltiples tiendas y ganar dinero refiriendo a otros usuarios.

---

## 2. ARQUITECTURA TÉCNICA (TECH STACK)
- **Frontend:** React 18 / Vite / TypeScript.
- **Estilos:** Custom CSS con variables CSS (diseño glassmorphism, temas claro y oscuro unificados), iconos de Lucide-React.
- **Manejo del Estado Global:** Zustand (Stores para Auth, Costeos, Dashboard, UI, AI).
- **Backend / Database:** Supabase (PostgreSQL).
- **Control de Acceso DB:** Row Level Security (RLS) estrictísimo por `usuario_id` y `tienda_id`.
- **Lógica de Servidor (Serverless):** Supabase Edge Functions (Deno / TypeScript).
- **Integraciones de Pagos:** MercadoPago (Suscripciones, Webhooks en Edge Functions).
- **Inteligencia Artificial:** Arquitectura dual. Gemini 2.5 Flash / Pro (Cerebro analítico) + Ollama Cloud (Sintetizador de contexto e hilos para optimización de tokens).
- **Reglas Arquitectónicas (Ironclad):**
  - **Inmutabilidad:** Todo se trata de manera inmutable en el frontend.
  - **División de Responsabilidades:** Carpetas exactas para `UI (pages/components)`, `Services (logica de llamadas)`, `Utils (helpers)`.
  - **Idioma (Spanglish Controlado):** Todo el código (variables, funciones) está en Inglés. Todos los comentarios, UI (front) y documentación están en Español. Nombres de las tablas de la BD en `snake_case` e inglés.

---

## 3. MÓDULOS DE USUARIO FINAL (CLIENTE)

### 3.1 Autenticación y Seguridad
- Registro, Login tradicional, y Magic Link.
- Integración Oauth (Google/GitHub/Discord).
- **2FA (Autenticación de Dos Factores):** Generación de QR (TOTP) y códigos de respaldo obligatorios para retirar fondos.

### 3.2 Dashboard Principal
- Tablero unificado de métricas, conversiones financieras, y performance global.
- Conecta datos simulados y reales (integraciones futuras/actuales).

### 3.3 Módulo de Costeos (Simulador de Viabilidad)
- **El corazón del sistema.** Permite registrar un producto con sus costos fijos y variables:
  - Precio de Venta (AOV).
  - Costo de Producto (Sourcing).
  - Costo de Flete Promedio.
  - CPA Ideal / Estimado de campañas de Facebook/Meta Ads.
  - **Tasa de Devoluciones:** % Proyectado de retornos (COD penalty).
- Con este ingreso, la app despliega reportes precisos: Punto de Equilibrio, Margen Inicial, Margen Descontando Devoluciones, y Utilidad Neta real por paquete entregado.

### 3.4 Creador de Ofertas (Estrategias)
Permite al usuario armar "Bundles" (Combos). 
- Permite proyectar el empuje de LTV y AOV.
- Tipos de Ofertas: Compras al por mayor, Lleva 3 paga 2, Añade un regalo.
- El sistema grafica en tiempo real cuánto "sacrifica" de margen para ganar volumen y si es financieramente viable.

### 3.5 Referidos (Affiliate System de 2 Niveles)
DropCost tiene un sistema piramidal pasivo de 2 niveles:
- **Nivel 1 (Directos):** 15% mensual recurrente.
- **Nivel 2 (Sub-referidos):** 5% mensual recurrente.
- El usuario recibe un link único `?ref=codigo`. Las cookies se propagan y duran 90 días (Last Click Wins).
- **Dashboard de Referidos:** Muestra clics del enlace, registros completados, usuarios con plan activo, y ganancias generadas.

### 3.6 Billetera y Pagos (Wallet)
- Rastrea en un libro contable (Ledger) cada centavo ganado por referidos o devuelto.
- Los usuarios pueden solicitar retiros de saldo hacia su propia cuenta bancaria. 
- Requiere KYC y token de 2FA activo.

### 3.7 Contactos y Leads
- Interfaz que recolecta la información de aquellos que dejan sus datos desde la Landing Page al chatear de manera anónima con el Agente AI.
- Central de mensajería (CRM Básico).

### 3.8 Configuración Multi-Tiendas
- Un usuario puede registrar N tiendas de dropshipping diferentes.
- Cada tienda funciona en un silo (Workspace). Si estoy activo en Tienda A, solo veo simuladores de Tienda A. No hay fuga de datos entre tiendas.

### 3.9 Drop Assistant (Inteligencia Artificial Multirrol)
Sincronizado vía Edge Function y WebSockets. El asistente carga en tres roles distintos:
- **TIPO 1: SUPPORT AGENT ("Drop Assistant"):** Atiende preguntas técnicas, cómo usar la plataforma, planes, bugs. Escala problemas humanos al equipo de soporte. Gratis para todos.
- **TIPO 2: MENTOR / ANALYST AGENT ("Drop Analyst"):** Da consultoría dura. Análisis financiero, viabilidad de producto, estrategias de pricing. Consume **DropCredits** (Sistema de tokens). Funciona integrado en Dashboard y Simulador.
- **TIPO 3: SELLER / SETTER (Bot Landing Page):** Atiende a los visitantes anónimos. Su meta es descubrir el dolor del lead en dos pasos, y "Cerrar" la venta ofreciendo el SaaS e inyectando un botón HTML directo hacia `/auth/register?ref=xxx` donde se respeta la cookie del afiliado. 

*(El procesamiento conversacional usa Ollama Cloud para resumir enormes cadenas de chat de manera silenciosa, entregando síntesis hiper limpios a Gemini para abaratar costos y potenciar respuestas).*

---

## 4. MÓDULOS DEL ADMINISTRADOR (SUPER ADMIN)
Hay usuarios con rol `admin` explícito. Tienen acceso al Sub-Directorio `/admin/`. Funciones exclusivas:

1. **Dashboard Admin:** KPIs globales del SaaS, MRR (Monthly Recurring Revenue), total active users.
2. **Gestión de Usuarios:** Cambiar roles, obligar actualización de contraseñas, ver logs detallados del usuario.
3. **Planes y Membresías (Pricing Config):** Interfaz para armar los planes (Starter, Pro, Enterprise). Configura límites exactos (limite tiendas, limite usuarios, max costeos), periodicidad y características públicas. El Front end lee la BD viva de aquí.
4. **Configuración Global de la App:** Editar nombre, logo, integración Meta API (Pixel), Google Analytics, variables de SMTP para Mailing.
5. **Auditoría Global de Seguridad:** Tabla inmutable con TODAS las transacciones del sistema (Ej: "Admin ID xyz forzó un cambio de plan al user XYZ").
6. **Aprobación de Retiros:** Panel de peticiones de dinero hechas desde las Billeteras de los usuarios, permite marcar como procesado e incluir el comprobante de transferencia bancario.
7. **Control del AI Prompt:** El admin puede entrar y ajustar los System Prompts (las instrucciones de comportamiento) de cada modelo de Agente directamente desde el front-end a la base de datos.
8. **Administración de Contactos/Central:** Gestión global de leads anónimos dejados en la landing page principal.

---

## 5. CARACTERÍSTICAS TÉCNICAS RECIENTES / RECIÉN IMPLEMENTADAS
- **Optimización de Interfaz del Chat:** Diseño glassmorphism pulido. Los sidebars ya no se aplastan entre ellos (z-index y spacing refactorizados). 
- **Persistencia de Bucle / Alzheimer AI Corregido:** En la Landing page, los leads anónimos sufren amnesia del chat. Se arregló guardando e inyectando un `conversation_history` en JSON B dentro de `consultas_anonimas`.
- **Bot Setter Honestidad:** Ya NO miente al decir "únete gratis a probar el simulador", sino que el bot lee nativamente qué planes existen en la DB de Supabase, y aclara "el registro es gratis, pero requieres un plan". Emite botones con links de referido precisos en base de los UTM parameters de los URLs `?ref`.
- **Integración Ollama:** Separación técnica para control de costes en API de terceros. 

---

## 6. FLUJO DE TRABAJO (GIT & AGENTES DE IA)
Este proyecto es co-programado con un "Agente Multirol". Existen carpetas dedicadas para la documentación interna:
- `/project/docs/`: Documentación Maestra y RFs (Requerimientos Funcionales).
- `/project/product_manager/`: Seguimiento de hitos y progreso.

**Flujo Git Estricto:**
- Todo se trabaja en ramas `feat/ciclo-mes-caracteristica` (ej. `feat/ciclo-marzo-dashboard`).
- Los commits deben ser Atómicos y en idioma español o spanglish reglado: `feat(frontend): mensaje de lo que se arregló`.
- Zero Console.Logs antes de proponer subidas al servidor.

---

## 7. PAUTAS FINALES PARA CLAUDE U OTRO AGENTE IA
1. Lee este documento cuidadosamente para entender en qué punto exacto estamos.
2. Si vas a interactuar con la Base de Datos, TODO tiene `RLS` (Row level security) en Supabase. NUNCA propongas queries SQL sin los filtros de `usuario_id` (o `auth.uid()`). 
3. Recuerda no mezclar Spanglish en la Interfaz.
4. Todo debe seguir los principios de UI **Premium**, oscuro ("Dark Mode / AMOLED"), gradientes sutiles y micro-animaciones en React.

*Fin del documento.*
