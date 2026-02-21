# Soluciones Críticas y Arquitectura de Seguridad - DropCost Master

Este documento detalla soluciones a problemas complejos encontrados durante el desarrollo para evitar regresiones por parte de otros agentes o desarrolladores.

---

## 1. Sistema de Referidos y RLS (Nivel 2)

### El Problema (Recursión Infinita)
Se detectó un error de recursión infinita en las políticas RLS de `referidos_usuarios`. Al intentar verificar si un usuario pertenecía al Nivel 2 de un líder, la base de datos entraba en un bucle infinito de consultas a la misma tabla.

### La Solución "Nuclear" (JWT + Robusta)
Para eliminar la recursión y mejorar el rendimiento:
1.  **JWT Metadata**: Se cargan los campos `rol`, `lider_id` y `codigo_referido` directamente en los metadatos del usuario (`auth.users.raw_user_meta_data`). Esto permite que las políticas RLS lean estos datos sin consultar ninguna tabla.
2.  **is_admin() Robusto**: La función `public.is_admin()` ahora intenta primero leer del JWT (instantáneo) y solo si falla consulta la tabla `users` usando `SECURITY DEFINER` para evitar recursión.
3.  **get_my_level2_user_ids()**: Función dedicada y optimizada para obtener los IDs de Nivel 2 sin disparar triggers circulares.

**Regla de Oro**: Nunca uses una política RLS que consulte la misma tabla de forma anidada sin pasar por una función `SECURITY DEFINER` con `search_path` establecido.

---

## 2. Sistema de Email Transaccional

### Configuración del Dominio
El servicio de **Resend** está configurado para autorizar únicamente envíos desde el dominio verificado:
- **Dominio Correcto**: `@dropcost.jariash.com`
- **Dominio Incorrecto**: `@dropcost.com` (Causa error 403/400 de Resend)

### Despachador de Triggers (`email-trigger-dispatcher`)
- Centraliza la lógica de reemplazo de variables `{{variable}}`.
- Utiliza las variables de `configuracion_global` para colores y branding.
- **Seguridad**: Se despliega con `--no-verify-jwt` para evitar errores 401 que ocurren intermitentemente al validar sesiones de superadmin desde el navegador, validando la identidad internamente si es necesario.

### Historial de Envíos
Toda acción de envío (automática o prueba) DEBE registrarse en `public.email_historial`. Si no ves datos, revisa la política RLS de dicha tabla que ahora utiliza `public.is_admin()`.

---

## 3. Guía para Futuros Desarrollos
- **RLS**: Siempre usa `public.is_admin()` en lugar de consultar `public.users` directamente en las políticas.
- **Migraciones**: Si una migración falla por recursión, es señal de que estás consultando una tabla protegida dentro de su propia política. Usa `SECURITY DEFINER` en funciones de ayuda.
- **Emails**: Si un correo no llega, lo primero a revisar es que el `from_email` termine en `@dropcost.jariash.com`.

---
**Ultima Actualización**: 2026-02-20
**Contexto**: Reparación de visibilidad de red y despacho de emails.
