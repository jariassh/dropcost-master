# Plan de Implementación - DropCost Master

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Enfoque:** Desarrollo con herramientas IA (Claude, Claude Code, etc)

---

## 1. Resumen Ejecutivo

Este plan proporciona un **roadmap de referencia** para desarrollar DropCost Master usando herramientas IA. Las duraciones son estimadas basadas en:
- Especificación completa disponible
- Stack tecnológico definido (React + Supabase serverless)
- Uso de IA para aceleración de desarrollo
- Iteraciones de testing y refinamiento

**Duración Total Estimada:** 12-16 semanas (referencia)

---

## 2. Fases de Desarrollo

### Fase 1: Preparación e Infraestructura (Semanas 1-2)

#### Objetivos
- Configurar proyecto base
- Infraestructura lista
- Ambiente de desarrollo

#### Tareas

**Semana 1:**

| Tarea | Duración | Herramientas IA | Descripción |
|-------|----------|-----------------|-------------|
| Crear proyecto React + Vite | 2h | Claude Code | Generar estructura inicial, configs |
| Setup Tailwind CSS | 1h | Claude | Configurar archivo tailwind.config.js |
| Crear carpetas base | 1h | Claude Code | Organizar src/ estructura |
| Setup TypeScript | 2h | Claude Code | Configurar tsconfig, types base |
| Crear .env.example | 1h | Claude | Documentar variables requeridas |

**Semana 2:**

| Tarea | Duración | Herramientas IA | Descripción |
|-------|----------|-----------------|-------------|
| Crear proyecto Supabase | 1h | Manual + Claude (documentación) | Setup en supabase.com |
| Crear esquema BD inicial | 3h | Claude Code | SQL para tablas principales |
| Configurar RLS básico | 2h | Claude Code | Políticas seguridad rows |
| Crear JWT y autenticación local | 2h | Claude Code | Lógica tokens JWT |
| Setup GitHub + CI/CD workflow | 2h | Claude Code | GitHub Actions básico |
| Deploy prueba Vercel | 1h | Manual | Conectar repo a Vercel |

**Deliverables:**
- ✅ Repo GitHub con estructura base
- ✅ Proyecto Supabase configurado
- ✅ Vercel deployment activo
- ✅ Variables de entorno documentadas

---

### Fase 2: Autenticación y Gestión de Usuarios (Semanas 3-5)

#### Objetivos
- Sistema de login/registro completo
- Email verification
- 2FA por código email
- Recuperación de contraseña

#### Tareas

**Semana 3: UI/UX Autenticación**

| Tarea | Duración | Herramientas IA |
|-------|----------|-----------------|
| Componente Button (todas variantes) | 3h | Claude Code |
| Componente Input text | 2h | Claude Code |
| Componente Card base | 2h | Claude Code |
| Pantalla Login UI | 3h | Claude Code (from Figma specs) |
| Pantalla Registro UI | 3h | Claude Code |
| Pantalla Verify Email UI | 2h | Claude Code |

**Semana 4: Backend Autenticación**

| Tarea | Duración | Herramientas IA |
|-------|----------|-----------------|
| Función register (Supabase) | 3h | Claude Code |
| Función login (Supabase) | 2h | Claude Code |
| Función verify-email (Supabase) | 2h | Claude Code |
| Función send-2fa-code | 2h | Claude Code |
| Función verify-2fa (Supabase) | 2h | Claude Code |
| Setup SendGrid integration | 2h | Claude Code |

**Semana 5: Integración + Testing**

| Tarea | Duración | Herramientas IA |
|-------|----------|-----------------|
| Conectar frontend → backend | 4h | Claude Code |
| Tests autenticación (login flow) | 3h | Claude Code |
| Manejo errores y validaciones | 2h | Claude Code |
| Tokens JWT + localStorage | 2h | Claude Code |
| Recuperación contraseña UI + backend | 3h | Claude Code |
| Testing E2E (manual) | 2h | Manual |

**Deliverables:**
- ✅ Registro y login funcional
- ✅ Email verification working
- ✅ 2FA por código email
- ✅ Recuperación contraseña
- ✅ Tests básicos pasando

---

### Fase 3: Core App - Simulador Financiero (Semanas 6-9)

#### Objetivos
- Simulador de costeo completo
- Guardar/duplicar/eliminar costeos
- Gestión de tiendas
- Integraciones de datos

#### Tareas

**Semana 6: UI Simulador**

| Tarea | Duración | Herramientas IA |
|-------|----------|-----------------|
| Componentes formulario (inputs, selects) | 3h | Claude Code |
| Pantalla Simulador Principal | 4h | Claude Code |
| Componente Card Resultados | 2h | Claude Code |
| Gráfico Desglose Precio (chart) | 2h | Claude Code + Recharts |
| Modal Guardar Costeo | 2h | Claude Code |

**Semana 7: Backend Simulador + Lógica**

| Tarea | Duración | Herramientas IA |
|-------|----------|-----------------|
| Función calcular-precio | 4h | Claude Code (matemáticas complejas) |
| Función guardar-costeo | 2h | Claude Code |
| Función duplicar-costeo | 2h | Claude Code |
| Función eliminar-costeo | 1h | Claude Code |
| Tests cálculos financieros | 3h | Claude Code |

**Semana 8: Gestión Tiendas + Integraciones**

| Tarea | Duración | Herramientas IA |
|-------|----------|-----------------|
| Pantalla Mi Tiendas | 3h | Claude Code |
| Modal Crear Tienda | 2h | Claude Code |
| Panel Gestionar Tienda | 3h | Claude Code |
| Función crear-tienda (backend) | 2h | Claude Code |
| Función editar-tienda (backend) | 1h | Claude Code |
| Función eliminar-tienda (backend) | 1h | Claude Code |

**Semana 9: Carga de Datos**

| Tarea | Duración | Herramientas IA |
|-------|----------|-----------------|
| Componente CSV upload | 3h | Claude Code |
| Parser CSV + validación | 3h | Claude Code |
| Almacenar datos en Supabase | 2h | Claude Code |
| Testing flujo completo | 2h | Manual |

**Deliverables:**
- ✅ Simulador financiero funcional
- ✅ Gestión tiendas completa
- ✅ CSV upload working
- ✅ Datos aislados por tienda

---

### Fase 4: Dashboard Ejecutivo (Semanas 10-12)

#### Objetivos
- Dashboard con KPIs
- Gráficos y análisis
- Filtros de fecha
- Recomendaciones IA

#### Tareas

**Semana 10: Dashboard UI**

| Tarea | Duración | Herramientas IA |
|-------|----------|-----------------|
| Layout base Dashboard | 2h | Claude Code |
| Componentes KPI cards | 2h | Claude Code |
| Componente Filtro Fechas | 2h | Claude Code |
| Semáforo Viabilidad | 2h | Claude Code |
| Componente Selector Tienda (dropdown) | 2h | Claude Code |

**Semana 11: Backend Dashboard + Gráficos**

| Tarea | Duración | Herramientas IA |
|-------|----------|-----------------|
| Función obtener-kpis | 4h | Claude Code |
| Función tendencias-cpa | 2h | Claude Code |
| Gráfico tendencias (Recharts) | 2h | Claude Code |
| Simulador Rentabilidad (slider interactivo) | 2h | Claude Code |
| Exportar reportes PDF | 3h | Claude Code + PDFKit |

**Semana 12: IA Insights + Pulido**

| Tarea | Duración | Herramientas IA |
|-------|----------|-----------------|
| Integración OpenAI para insights | 3h | Claude Code |
| Caching insights 24h | 2h | Claude Code |
| Testing dashboard completo | 2h | Manual |
| Optimizaciones performance | 2h | Claude Code |

**Deliverables:**
- ✅ Dashboard ejecutivo completo
- ✅ KPIs en tiempo real
- ✅ Gráficos funcionales
- ✅ Insights IA contextualizados

---

### Fase 5: Análisis Regional (Semanas 13-14)

#### Objetivos
- Tarjetas por región
- Tabla benchmarks transportadoras
- Mapa de riesgo interactivo

#### Tareas

**Semana 13: UI + Datos Regionales**

| Tarea | Duración | Herramientas IA |
|-------|----------|-----------------|
| Pantalla Análisis Regional | 3h | Claude Code |
| Tarjetas regiones (componentes) | 2h | Claude Code |
| Tabla benchmarks | 2h | Claude Code |
| Componente Mapa (Leaflet) | 3h | Claude Code |
| Testing mapas responsivos | 1h | Manual |

**Semana 14: Backend Regional + Configuración**

| Tarea | Duración | Herramientas IA |
|-------|----------|-----------------|
| Función obtener-datos-regiones | 3h | Claude Code |
| Seed data regiones por país | 2h | Claude Code |
| Colores mapa según riesgo | 2h | Claude Code |
| Validar datos Dropi | 2h | Manual |

**Deliverables:**
- ✅ Análisis regional funcional
- ✅ Mapa interactivo
- ✅ Datos por región y transportadora

---

### Fase 6: Configuración y Admin (Semanas 15-16)

#### Objetivos
- Configuración usuario completa
- Panel admin básico
- Gestión planes y códigos promo

#### Tareas

**Semana 15: Configuración Usuario**

| Tarea | Duración | Herramientas IA |
|-------|----------|-----------------|
| Pantalla Mi Perfil | 3h | Claude Code |
| Pantalla Membresía | 3h | Claude Code |
| Gestión métodos pago (UI) | 2h | Claude Code |
| Funciones backend config | 3h | Claude Code |

**Semana 16: Admin Panel Básico**

| Tarea | Duración | Herramientas IA |
|-------|----------|-----------------|
| Pantalla Usuarios (admin) | 3h | Claude Code |
| Pantalla Planes (admin) | 2h | Claude Code |
| Pantalla Códigos Promocionales | 2h | Claude Code |
| Funciones backend admin | 3h | Claude Code |
| Testing RBAC | 2h | Manual |

**Deliverables:**
- ✅ Configuración usuario completa
- ✅ Admin panel operacional
- ✅ Gestión planes y códigos

---

## 3. Integraciones Externas (Paralelo a Fases 3-5)

### Meta Ads Integration
**Duración:** 3-4 semanas (semanas 8-11)

| Tarea | Duración |
|-------|----------|
| Configurar OAuth2 Meta | 2h |
| Función conectar-meta | 3h |
| Función sincronizar datos Meta | 3h |
| Tests integración | 2h |

### Dropi Integration
**Duración:** 2-3 semanas (semanas 9-11)

| Tarea | Duración |
|-------|----------|
| Configurar API Dropi | 2h |
| Función conectar-dropi | 2h |
| Función sync envíos | 3h |
| Tests | 1h |

### Shopify Integration
**Duración:** 2-3 semanas (semanas 9-11)

| Tarea | Duración |
|-------|----------|
| Configurar OAuth2 Shopify | 2h |
| Función conectar-shopify | 2h |
| Función sync órdenes | 3h |
| Tests | 1h |

---

## 4. Testing y QA

### Unit Tests
- **Timing:** En paralelo durante desarrollo (Fases 2-6)
- **Cobertura:** Mínimo 70% funciones críticas
- **Framework:** Vitest + React Testing Library

### Integration Tests
- **Timing:** Semana 17 (posterior a Fase 6)
- **Casos:** Flows completos (registro → costeo → dashboard)

### E2E Tests
- **Timing:** Semana 17
- **Framework:** Playwright
- **Escenarios:** 10+ critical user flows

### Performance Testing
- **Timing:** Semana 17
- **Tools:** Lighthouse, Web Vitals

---

## 5. Timeline Visual

```
Semana  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17
────────────────────────────────────────────────────────

Fase 1: Prep & Infra
[==]

Fase 2: Auth
   [===============]

Fase 3: Simulador
         [==============]

Fase 4: Dashboard
            [==============]

Fase 5: Regional
                  [====]

Fase 6: Config & Admin
                      [====]

Integraciones (paralelo)
         [=======================]

Testing & Optimización
                        [==]

[Deploy/Soft Launch]
                           ↓
```

---

## 6. Milestones y Entregas

| Milestone | Semana | Descripción |
|-----------|--------|-------------|
| **MVP Auth** | 5 | Login/registro/2FA funcional |
| **MVP Core** | 9 | Simulador + tiendas + CSV |
| **MVP Dashboards** | 12 | Dashboard ejecutivo completo |
| **Alpha Complete** | 14 | Análisis regional listo |
| **Beta Ready** | 16 | Config + Admin básico |
| **Production Ready** | 17 | Tests + optimizaciones |

---

## 7. Herramientas IA por Tarea

### Claude (Chat)
- Explicaciones conceptuales
- Debugging de problemas
- Documentación
- Arquitectura decisions
- SQL queries complejas

### Claude Code
- Generar componentes React
- Funciones Supabase
- Lógica JavaScript/TypeScript
- Configuración tooling
- Tests unitarios
- Integración APIs

### Cline (VS Code Extension)
- Asistente desarrollo local
- Cambios en tiempo real
- Refactoring automático
- Fixes de errores

### Uso Recomendado
```
Tarea simple (input/componente):
  → Claude Code: 5 minutos

Tarea compleja (integración):
  → Claude Code (draft) + Claude (revisar) + Cline (refinar): 30 minutos

Debugging:
  → Cline (analizar error) + Claude (explicación): 15 minutos
```

---

## 8. Workflow Desarrollo Recomendado

### Flujo Diario
1. **Especificación:** Revisar requirements del día
2. **Prompt a IA:** "Genera componente X basado en archivo Y"
3. **Generación:** Claude Code crea el código
4. **Revisión:** Revisar output, ajustes manuales si es necesario
5. **Testing:** Tests unitarios automáticos
6. **Commit:** Push a GitHub (desencadena CI/CD)

### Checklist por Componente
- [ ] Especificación completa en doc
- [ ] Prompt claro a IA
- [ ] Código generado y revisado
- [ ] Tests unitarios writing
- [ ] Integración con API/backend
- [ ] Tests E2E si es critical path
- [ ] Documentación actualizada
- [ ] Commit y push

### Ejemplo Real
```
Tarea: Crear componente DashboardCard

1. Claude Code:
   "Genera componente React TypeScript DashboardCard basado en:
    - Figma specs: padding 24px, border-radius 12px
    - Props: title, value, icon, trend, trendValue
    - Responsive: mobile 1 col, desktop 3 cols
    - Dark mode support
    
    Usa Tailwind CSS siguiendo variables en tema.ts"

2. Claude Code genera: DashboardCard.tsx (~50 líneas)

3. Revisar:
   - Coincide con Figma ✓
   - TypeScript correcto ✓
   - Tailwind classes ok ✓
   - Responsive ✓

4. Implementar en Dashboard.tsx

5. Tests: 
   "Escribe tests para DashboardCard validando:
    - Props rendering
    - Trend indicator color (green/red)"

6. Commit
```

---

## 9. Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|--------|-----------|
| Cambios scope mid-proyecto | Alta | Alto | Congelar requirements semana 1 |
| Problemas Supabase RLS | Media | Alto | Testing temprano (semana 2) |
| Integraciones APIs complejas | Media | Medio | Pruebas en sandbox primera |
| Performance dashboard | Media | Medio | Optimizar semana 15 |
| Bugs en cálculos financieros | Media | Crítico | Tests exhaustivos (semana 7) |

---

## 10. Recursos Necesarios

### Subscripciones/APIs
| Recurso | Costo | Uso |
|---------|-------|-----|
| Supabase (Pro) | $25/mes | BD, Auth, Storage |
| Vercel (Pro) | $20/mes | Frontend hosting |
| OpenAI API | $0-20/mes | Insights IA |
| SendGrid | Gratis (200/día) | Emails |
| GitHub Pro | $4/mes | Repo privado |
| **Total** | **~$50/mes** | |

### Hardware/Software
- Laptop dev (cualquiera con 8GB RAM)
- Editor: VS Code (gratis)
- Git (gratis)
- Herramientas IA: Claude, Claude Code, Cline (subscripciones separadas)

---

## 11. Documentación Por Entregar

| Documento | Timing | Responsable |
|-----------|--------|-------------|
| README.md (setup) | Semana 1 | Dev |
| Especificación Requerimientos | ✅ Completado | - |
| Arquitectura Técnica | ✅ Completado | - |
| Diseño UI/UX | ✅ Completado | - |
| API Documentation | Semana 6 | Dev |
| Database Schema Docs | Semana 2 | Dev |
| Testing Strategy | Semana 8 | Dev |
| Deployment Guide | Semana 16 | Dev |
| User Manual | Semana 17 | Dev |

---

## 12. Post-Lanzamiento (Semanas 18+)

### Monitoreo Inicial
- Logs y errores en Sentry
- Feedback usuarios
- Performance metrics
- Bug fixes críticos

### Mejoras v1.1
- Optimizaciones basadas en feedback
- Features secundarias faltantes
- Documentación usuario
- Onboarding mejorado

### Roadmap v2.0
- Más integraciones
- Mobile app nativa
- Advanced analytics
- Multi-idioma

---

## 13. Dependencias Externas

### Antes de Comenzar
- [ ] Figma design system completo (para UI)
- [ ] Especificación requerimientos aprobada
- [ ] Acceso a Supabase, Vercel, GitHub
- [ ] API keys Meta, Dropi, Shopify (sandbox)
- [ ] OpenAI key para IA

### Durante Desarrollo
- [ ] Documentación Meta Ads API
- [ ] Documentación Dropi API
- [ ] Documentación Shopify API
- [ ] Soporte Supabase (si surgen issues)

---

## 14. Métricas de Éxito

### Técnicas
- ✅ 70%+ test coverage
- ✅ Lighthouse score 80+
- ✅ Tiempo carga <3s (dashboard)
- ✅ 0 errores críticos en producción

### Funcionales
- ✅ Todos los RFs de especificación implementados
- ✅ Integraciones Meta/Dropi/Shopify funcionando
- ✅ Dashboard actualiza en tiempo real
- ✅ Exportación reportes PDF/Excel

### UX
- ✅ Responsivo en todos los viewports
- ✅ Dark mode funcional
- ✅ Accesibilidad WCAG 2.1 AA
- ✅ <10 bugs reportados semana 1 post-launch

---

## 15. Entregables Finales

### Código
- Repositorio GitHub limpio con buenas prácticas
- Frontend React optimizado
- Supabase Edge Functions testeadas
- CI/CD pipeline configurado

### Documentación
- README con instrucciones setup
- Guía API endpoints
- Database schema ERD
- Diagrama arquitectura

### Deployment
- Vercel (frontend) en producción
- Supabase (BD) en producción
- Variables entorno configuradas
- Backups automáticos activos

### QA
- Suite tests unitarios
- Suite tests integración
- Suite E2E tests
- Performance validated

---

## 16. Próximos Pasos

1. **Semana 1:** Comenzar Fase 1 (Prep & Infra)
2. **Semana 2:** Completar setup Supabase
3. **Semana 3:** Comience Fase 2 (Auth UI)
4. **Semana 17:** Testing y optimizaciones finales
5. **Semana 18:** Soft launch / beta testing

---

**Fin del Plan de Implementación**

Este plan es de **referencia flexible**. Ajustar duraciones según:
- Velocidad de iteración con IA
- Complejidad de integraciones encontradas
- Scope changes
- Cambios prioridades

**Consejo:** Cada semana, revisar avance y ajustar plan si es necesario.
