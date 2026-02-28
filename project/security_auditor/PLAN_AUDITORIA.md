# Plan de Auditoría de Seguridad - DropCost Master

**Fecha:** 26 de febrero de 2026
**Auditor:** Antigravity Security
**Estado:** borrador / fase de diagnóstico

## 1. Alcance de la Auditoría
El alcance inicial se centra en el **Dashboard Operacional (Fase 1)** y el sistema de **Autenticación/Autorización** existente.

- **Servicios:** supbase.auth, Edge Functions de integraciones.
- **Base de Datos:** Políticas RLS en tablas de `users`, `tiendas`, `integraciones`, `data_shopify_orders`, `data_meta_ads` y `dashboard_metrics`.
- **Integraciones:** Manejo de tokens de terceros (Shopify, Meta Ads).
- **Frontend:** Manejo de sesiones, sanitización de inputs y protección XSS.

## 2. Metodología
- **Revisión de Código Estática:** Análisis del `authService.ts` y Edge Functions.
- **Auditoría de Esquema DB:** Validación de políticas RLS programáticas.
- **Testing Dinámico:** Simulación de intentos de acceso no autorizado entre tiendas/usuarios.
- **Validación de Encriptación:** Revisión de algoritmos de protección para secrets.

## 3. Riesgos Iniciales Detectados
| Riesgo | Descripción | Severidad |
|--------|-------------|-----------|
| **Fuga de Credenciales** | Tokens de Shopify/Meta almacenados sin encriptación activa (pendientes de implementación). | ALTA 🔴 |
| **Bypass de RLS** | Posibilidad de acceder a métricas de otras tiendas si las políticas no son estrictas. | CRÍTICA 🔴 |
| **Manipulación de Claims** | Dependencia crítica de los metadatos del JWT para el RLS "Nuclear". | MEDIA 🟡 |
| **Sesión Única** | El cumplimiento de sesión única depende parcialmente del frontend. | BAJA 🟢 |

## 4. Próximos Pasos Inmediatos
1. Ejecutar tests de aislamiento de datos (RLS Validation).
2. Auditar el flujo de conexión de Shopify una vez se inicie la implementación.
3. Validar que no existan variables de entorno sensibles expuestas en el cliente.
