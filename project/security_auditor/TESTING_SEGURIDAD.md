# Plan de Testing de Seguridad - DropCost Master

## Test 1: Aislamiento de Tiendas (Multi-tenancy)
**Caso:** El Usuario A intenta acceder a los costesos de una tienda que pertenece al Usuario B.
**Metodología:**
1. Autenticar como Usuario A.
2. Intentar ejecutar `SELECT * FROM costeos WHERE tienda_id = [ID_TIENDA_B]`.
3. El resultado debe ser un array vacío o error de acceso.
**Resultado Esperado:** ✅ Pasa (Aislamiento por RLS).

## Test 2: Acceso Admin a Datos de Usuario
**Caso:** Un usuario con rol 'cliente' intenta acceder a la tabla `audit_logs` completa.
**Metodología:**
1. Autenticar como Usuario con rol 'cliente'.
2. Intentar consultar `audit_logs`.
3. El sistema debe denegar el acceso o mostrar solo logs propios si aplica.
**Resultado Esperado:** ✅ Pasa (is_admin validation en RLS).

## Test 3: Prevención de Registro Directo en Tablas Críticas
**Caso:** Intentar insertar datos en `dashboard_metrics` sin pasar por el flujo de sistema.
**Metodología:**
1. Intentar `INSERT` directo vía API con token de usuario estándar.
2. Las políticas RLS deben validar que el usuario es dueño de la `tienda_id`.
**Resultado Esperado:** ✅ Pasa (Restricción por RLS).

## Resumen de Tests de Diagnóstico
- **Total:** 3
- **Pasados:** En proceso de validación técnica ⏳
- **Fallidos:** 0
