# Checklist de Migración 100% Espejo: Staging -> Producción
**Proyecto:** DropCost Master
**Responsable:** Product Manager
**Objetivo:** Cero errores, cero "remiendos", paridad total.

---

## I. INFRAESTRUCTURA Y ESQUEMA (DBSync)
Antes de mover datos, el "contenedor" debe ser idéntico.

- [ ] **Tablas y Columnas**:
    - [ ] Verificar `ultima_actividad` y `session_token` en `public.users`.
    - [ ] **Ventas e Integraciones**: Verificar `data_shopify_orders`, `data_meta_ads` y `dashboard_metrics`.
    - [ ] **Sincronización Dropi**: Verificar campos de Dropi en `data_shopify_orders` (ej: `dropi_order_id`, `dropi_status`).
    - [ ] **Configuración**: Verificar nuevas columnas en `costeos` y `ofertas` (ej: `meta_campaign_id`).
    - [ ] **Correos y Remitentes**: Verificar que TODAS las plantillas en `email_templates` conserven sus campos `sender_name` y `sender_prefix` (no dejarlos en null o en valores por defecto).
    - [ ] **Historial**: Verificar `configuracion_global_historial` y `audit_logs`.
- [ ] **Constraints y Relaciones**:
    - [ ] `UNIQUE(usuario_id)` en `referidos_usuarios`.
    - [ ] `ON DELETE CASCADE` en todas las FKeys críticas (tiendas, costeos, referidos).
- [ ] **Índices de Performance**:
    - [ ] `idx_users_rol`, `idx_tiendas_usuario`, `idx_costeos_tienda`.
    - [ ] Índices en `audit_logs` (created_at).
    - [ ] Índices de búsqueda `idx_users_search_trgm` (Requiere extensión `pg_trgm`).
    - [ ] Índices masivos en `orders`, `wallet_transactions`, `referidos_usuarios`.

---

## II. LÓGICA DE NEGOCIO (EL "MOTOR")
Lo que falló en Staging: funciones y automatizaciones.

- [ ] **Funciones SQL (RPC)**:
    - [ ] `record_user_activity` (Captura IP y Actividad).
    - [ ] `check_and_promote_to_leader` (Promoción automática).
    - [ ] `handle_new_user_referral` (Vinculación de referidos).
    - [ ] `get_my_lider_id` / `get_my_level2_user_ids`.
    - [ ] `calculate_kpis` / `get_dashboard_pro_data` (Motor del Dashboard).
    - [ ] `is_admin` (Bypass de RLS).
- [ ] **Triggers de Automatización**:
    - [ ] `on_auth_user_created_referral` (Vínculo inmediato).
    - [ ] `on_leader_changed_sync_metadata` (Inyecta `lider_id` en JWT).
    - [ ] `tr_sync_user_role` (Cambio de rol cliente -> lider).
    - [ ] `handle_auth_user_update` (Sincronización `email_verificado`).
    - [ ] `handle_user_confirmation_sync` (Sincronización automática de `email_confirmed_at` -> `email_verificado`).
    - [ ] `on_auth_user_created` (Creación de perfil en `public.users`).

---

## III. DATOS E INTEGRIDAD (DATA FLOW)
Migración de la información real del usuario.

- [ ] **Migración de Usuarios (Auth + Public)**:
    - [ ] Usuarios `auth.users` deben conservar sus UUIDs.
    - [ ] `raw_user_meta_data` debe contener `lider_id` y `rol` correctos.
- [ ] **Red de Referidos e Integridad**:
    - [ ] `referidos_lideres` (Clicks, Comisiones, Códigos).
    - [ ] `referidos_usuarios` (Vinculación exacta de Nivel 1 y Nivel 2).
- [ ] **Integraciones y Ventas**:
    - [ ] `integraciones` (Tokens encriptados de Shopify/Meta).
    - [ ] `data_shopify_orders` y `data_meta_ads` (Historial de ventas y gasto publicitario).
    - [ ] **Sincronización Dropi**: Asegurar que los pedidos vinculados a Dropi conserven su `guia_rastreo`.
    - [ ] `dashboard_metrics` (KPIs ya calculados).
- [ ] **Almacenamiento (Storage)**:
    - [ ] Asegurar existencia del bucket para subida de **Excels de Dropi**.
    - [ ] Políticas RLS del bucket para que el usuario solo suba sus propios archivos.
- [ ] **Operativo**:
    - [ ] `costeos` y `ofertas`.
    - [ ] `tiendas` vinculadas a cada usuario.

---

## IV. CONFIGURACIÓN Y SEGURIDAD (SHIELD)
Lo que permite que la App funcione en la nube.

- [ ] **Secrets y Variables**:
    - [ ] `RESEND_API_KEY` configurada en Edge Functions de Producción.
    - [ ] `MERCADOPAGO_ACCESS_TOKEN` (Producción, no Sandbox).
    - [ ] Llaves de `Wise` y otras pasarelas.
- [ ] **Políticas RLS (Row Level Security)**:
    - [ ] Revisión manual de `dc_admin_referral_view`, `dc_lideres_self_view`.
    - [ ] Asegurar que `is_admin()` otorga acceso total en el nuevo esquema.
- [ ] **Edge Functions**:
    - [ ] Deploy de `auth-register` (Versión optimizada con `Promise.all`).
    - [ ] Deploy de triggers de email (`email-trigger-dispatcher`).
    - [ ] Configuración de CORS y dominios permitidos.

---

## V. VALIDACIÓN FINAL (SMOKE TEST)
Pruebas post-despliegue hechas por agentes.

- [ ] **QA Test**: Login con usuario real -> Verificar que `ultima_actividad` se actualizó.
- [ ] **QA Test**: Ver los 2 niveles de referidos (Jonathan -> Rodrigo -> Jarid).
- [ ] **QA Test**: Dashboard Dashboard -> Verificar que las gráficas muestran datos de Meta Ads, Shopify y Dropi.
- [ ] **QA Test**: Sincronizar Envios -> Subir un Excel de prueba de Dropi y confirmar que se procesa sin errores.
- [ ] **QA Test**: Simular un costeo y validar precisión de 2 decimales.
- [ ] **QA Test**: Enviar email de bienvenida desde el detalle de usuario administrativo.

---
**NOTA PM:** Este checklist ES la biblia para el paso a producción. No se autoriza el merge a `main` hasta que cada item tenga su [X].
