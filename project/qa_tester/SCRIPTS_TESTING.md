# Scripts de Testing - Cypress

## Dashboard - Happy Path (Mocked Data)
Este script servirá para validar la lógica del dashboard una vez que el servicio esté conectado.

```typescript
// cypress/e2e/dashboard_smoke.cy.ts

describe('Dashboard Operacional - Smoke Test', () => {
  beforeEach(() => {
    // Interceptar llamadas a Supabase y devolver mock data
    cy.intercept('GET', '**/rest/v1/dashboard_metrics*', {
      statusCode: 200,
      body: [
        {
          fecha: '2026-02-25',
          ganancia_neta: 450,
          ventas_totales: 800,
          gastos_ads: 150
        }
      ]
    });

    cy.visit('/app/dashboard');
  });

  it('Debe mostrar los KPIs principales con datos mockeados', () => {
    cy.get('[data-testid="kpi-ganancia"]').should('contain', '$450');
    cy.get('[data-testid="kpi-ventas"]').should('contain', '$800');
    cy.get('[data-testid="kpi-gastos"]').should('contain', '$150');
  });
});
```

---

## Cómo ejecutar los tests
1. Asegurarse de que el entorno de desarrollo esté corriendo.
2. Ejecutar: `npx cypress open`
3. Seleccionar el spec `dashboard_smoke.cy.ts`.
