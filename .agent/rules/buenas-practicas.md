---
trigger: always_on
---

DIRECTRICES DropCost Master - WORKSPACE SPECIFIC
Proyecto: Aplicación de costeo para dropshippers COD (Pago Contra Entrega) en Latinoamérica.
Stack: React + Supabase serverless + TypeScript. Multitenancy (tiendas independientes).

I. DISEÑO: TOKENIZACIÓN ATÓMICA (DropCost Vibe)
Paleta Principal: Azul #0066FF (primario), Verde #10B981 (éxito), Rojo #EF4444 (error), Gris #6B7280 (neutro).
Sin Magic Numbers: Nunca hardcodees colores/tamaños. Usa variables (Colors.primary, Spacing.lg).
Tipografía: Inter font. H1=32px bold, Body=14px regular.
Componentización: Si reutilizable 2+ veces o >20 líneas, extrae componente.
Estados: Todo componente maneja Loading, Error, Empty, DataOverflow.
Dark Mode: Toggle siempre soportado (CSS variables + localStorage).

II. SEGURIDAD (CRÍTICO - Datos financieros + Integraciones)
Secretos: NUNCA en código. Variables entorno (process.env/Deno.env).
Validación: Frontend + Backend siempre. Usa Zod para schemas.
SQL: Queries PARAMETRIZADAS siempre. Sin concatenación strings.
Datos Sensibles: Encriptados en reposo (tokens API, passwords hashed con bcrypt).
Logs: NUNCA loguees passwords, tokens, números tarjeta, CVV. Sanitiza datos.
RLS: Row Level Security en BD (usuario solo ve sus tiendas). Testa antes deploy.
JWT: Tokens con expiración 30d. Refresh tokens en httpOnly cookies.
2FA: Código email 10 minutos validez. Reintentos limitados (máx 3).
HTTPS: Obligatorio. Headers seguridad (CSP, X-Frame-Options, etc).

III. AISLAMIENTO MULTITENANCY (THE CORE)
Filtro tienda_id: TODA query filtra por tienda_id Y usuario_id. Nunca SELECT sin WHERE.
RLS Validation: Cada tabla nueva → RLS policy antes de usar.
Tests Aislamiento: Validar User A NO ve costeos/tiendas de User B.
Admin Exception: Solo admin role puede ver todo. Verificar role en backend.

IV. CÁLCULOS FINANCIEROS (Exactitud crítica)
Fórmula Costeo: (CostoProducto + Flete + OtrosGastos + CPA + Margen) / (1 - Devoluciones%).
Unit Tests: TODOS los casos (positivos, negativos, edge cases con devoluciones 100%, margen 0).
Precisión: Usar números con 2 decimales. Redondeo bancario (ROUND_HALF_UP).
Validación Input: Margen >0, Costo >0, no NaN/Infinity.

V. INTEGRACIONES EXTERNAS (Meta, Dropi, Shopify, Pasarelas)
Tokens Encriptados: Guardar siempre encriptados en BD (AES-256).
Sync Automático: Meta (1h), Dropi (30min), Shopify (1h).
Fallback CSV: Si integración falla, usuario puede subir CSV manualmente.
Webhook Validación: Validar firma webhook antes procesar (Meta, Stripe, Mercado Pago).
Reintentos: Implementar exponential backoff para fallas temporales.
Mocks Tests: Todos endpoints externos mocked en tests (no llamadas reales).

VI. PERFORMANCE (Dashboard debe cargar <3s)
Índices BD: tienda_id, usuario_id, fecha en todas las queries de filtrado.
Caching: KPIs/Regiones (cambian poco) → cachear 1h. Invalidar manual si es necesario.
Paginación: Costeos/usuarios >50 rows → obligatoria. Limit/offset en queries.
Lazy Load: Dashboard cards <fold se cargan con observer.
API Pagination: GET /costeos?limit=20&skip=0. Total count en response.
Lighthouse: >80 score. Bundle <500KB gzip.

VII. TESTING ESPECÍFICO DropCost
Critical Flows: (1) Registro → Crear tienda → Costeo, (2) Conectar Meta Ads, (3) Cambiar plan.
Cálculos: Unit tests completos para calcularPrecio (mínimo 10 casos).
Aislamiento: Tests verifican User A no ve tienda User B.
Integraciones: Mock Meta/Dropi/Shopify. Webhook tests con sig validation.
E2E: 5 flujos críticos mínimo en Playwright.
Coverage: >70% código crítico (auth, simulador, dashboard, integraciones).

VIII. DATOS Y OBSERVABILIDAD
Logs Estructurados: { timestamp, level, userId, tiendaId, feature, message }.
Errores Críticos: Auth fails → Sentry. Cálculos erróneos → investigation.
Performance: Log queries >200ms. API calls >500ms.
Auditoría: Log cambios a datos críticos (plan changes, costeos editados).
Retention: Logs 30 días, alertas activas 24/7.

IX. FLUJOS USUARIO ESPECÍFICOS
Onboarding: 3 pasos (crear tienda → dato referencia → primer costeo).
Dashboard: Selector tienda siempre visible. Filtro fecha por defecto últimos 30 días.
Costeo: Guardar siempre con tienda_id + id_campana_meta (puede ser NULL).
Config Tienda: Edit nombre/logo (país read-only). Gestionar integraciones. Ver estadísticas.

X. DEPLOYMENT Y DATOS
Ambiente Staging: Copia anónima de producción. Testear integraciones antes prod.
Backups: Diarios (7d), semanales (4w), mensuales (12m). Validar restore.
RTO/RPO: Máximo 2h recuperar, máximo 24h sin perder datos.
Variables Env: Todos los secretos en variables, NUNCA hardcoded.
Migraciones: Rollback plan siempre. Test en staging primero.

XI. NOMENCLATURA PROYECTO
Código: Inglés (calcularPrecio, fetchMetaData, tiendaId).
APIs: Inglés (POST /simulador/calcular-precio, GET /tiendas).
BD: snake_case inglés (data_meta_ads, costeos, integraciones, no costos).
Comments: Lógica negocio en español si es clara, técnico en inglés.
Commits: feat(simulador), fix(auth), docs(api).

META: Para DropCost, prioridad: (1) Seguridad, (2) Exactitud cálculos, (3) Aislamiento tiendas, (4) Performance, (5) Testing.