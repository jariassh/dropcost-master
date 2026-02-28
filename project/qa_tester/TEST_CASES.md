# Test Cases - Dashboard Operacional

## TC-001: Consistencia Estética Dashboard (Fase 1)
**ID:** TC-001  
**Módulo:** UI/UX  
**Descripción:** Verificar que el diseño del dashboard sigue los lineamientos premium y visuales.

**Precondiciones:**
- Mockups o implementación inicial disponible.

**Pasos:**
1. Visualizar la página del dashboard en Light Mode.
2. Visualizar la página del dashboard en Dark Mode.
3. Verificar uso de variables CSS (`var(--primary)`, etc.).
4. Verificar espaciados (múltiplos de 4px).

**Resultado esperado:**
- Diseño limpio, premium y sin colores hardcodeados.
- Contraste adecuado en ambos modos.

---

## TC-002: Aislamiento RLS - Dashboard Metrics
**ID:** TC-002  
**Módulo:** Seguridad / BD  
**Descripción:** Verificar que un usuario no puede ver métricas de otra tienda/usuario.

**Pasos:**
1. Ejecutar query sobre `dashboard_metrics` como Usuario A.
2. Intentar acceder a registros de Usuario B / Tienda B.

**Resultado esperado:**
- La query solo retorna datos pertenecientes a la `tienda_id` del usuario autenticado.
