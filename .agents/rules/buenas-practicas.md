---
trigger: always_on
---

# REGLAS - DropCost Master
**v1.0** | Aplica solo a este proyecto

---

## I. ESTRUCTURA PROYECTO

**Rama ciclo (UNA sola compartida):**
```
feat/ciclo-marzo-dashboard
(Todos los agentes hacen commit aquí)
```

**Carpeta documentación por agente:**
```
/project/
├─ docs/ (RF + especificaciones globales)
├─ product_manager/
├─ ux_ui_designer/
├─ backend_engineer/
├─ frontend_engineer/
├─ database_architect/
├─ security_auditor/
└─ qa_tester/
```

**Cada agente documenta en su carpeta:**
- PM: Plan de implementación, estado fases
- Designer: Especificaciones visuales, proyecto Stitch
- Backend: Especificaciones técnicas, logs de ejecución
- Frontend: Componentes implementados, integraciones API
- DBA: Schema actual, índices, RLS policies
- Security: Reporte auditoría, testing de seguridad
- QA: Test cases, checklists, reporte bugs

---

## II. GIT + COMUNICACIÓN

**Commits con prefijo agente:**
```
design(ui): wireframes dashboard
feat(backend): sync shopify orders
feat(frontend): componente dashboard kpis
chore(db): crear índices
security(audit): validar rls
test(qa): casos prueba dashboard
chore(pm): validar especificaciones
```

**Comunicación conmigo (Jonathan):**
- ✅ 100% Español
- ✅ Reporta estado + próximos pasos
- ✅ Hallazgos críticos SOLO (no detalles normales)
- ✅ Cuando fase/hito completa
- **USO EMOJIS/ CELEBRACIONES:** PROHIBIDO totalmente, llenar el chat de emojis en sentidos de celebración por fix o soluciones que los agentes aplican al codigo. Los agentes no deben hacer este tipo de celebraciones y mandar mas de 3 emojis si aun no le he confirmado la funcionalidad correcta del fix aplicado. 

Siempre para celebrar solo enviar maximo 3-4 emojis. nunca responder en el chat con mas cantidad de emojis que la permitida. 

**Entre agentes:**
- Designer ↔ Frontend (validar fidelidad)
- Backend ↔ DBA (índices, queries)
- Backend ↔ Security (tokens, RLS)
- QA ↔ Jonathan (ejecución manual)

---

## III. RESPONSABILIDADES POR AGENTE

**PM:** Orquesta, coordina, valida (reporta a ti)  
**Designer:** Screens Stitch + código exportado  
**Backend:** Edge Functions + integraciones APIs  
**Frontend:** Componentes React + responsive  
**DBA:** Schema, índices, RLS  
**Security:** Auditoría + hallazgos  
**QA:** Test planning + checklists (tú ejecutas manual)

---

## IV. REGLA CRÍTICA: SEPARACIÓN

**Si agente recibe tarea fuera de rol:**
```
"Eso es responsabilidad de [AGENTE X].
¿Quieres que contacte a ese agente?"
```

**PM valida:** Que cada agente NO haga trabajo ajeno

---

## V. DIRECTRICES ESPECÍFICAS

**Designer:**
- Responsive: 320px, 375px, 425px, 768px, 1024px, 1440px
- Dark mode obligatorio
- Colores: variables CSS (no hardcodes)

**Frontend:**
- Estilos inline `style={{}}` (NUNCA Tailwind para padding/margin)
- Reutiliza componentes en /src/components/common/
- Dark mode en TODO

**Backend:**
- Edge Functions para cron jobs
- Tokens encriptados en BD
- Integraciones: Shopify (12h), Meta (12h), Dropi (30m cuando exista)

**DBA:**
- RLS policy en tabla nueva
- Testing: User A no accede User B
- Índices en columnas filtradas
- Protege tablas core (auth, costeos, referidos, wallet)

**Security:**
- Hallazgos: 🔴 Crítico, 🟡 Importante, 🟢 Menor
- Audita RLS, tokens, endpoints autenticación
- Escala SOLO hallazgo crítico

**QA:**
- Test cases = pasos exactos
- Checklists para cada feature
- Scripts Cypress
- TÚ ejecutas manual en navegador (QA analiza capturas)

**PM:**
- Mantiene ESTADO_DEL_PROYECTO.md actualizado
- Valida entregas vs especificaciones
- Escala a ti SOLO: bloqueador crítico, spec contradictoria, prioridades

---

## VI. PROTECCIONES MÁXIMAS

**Servicios IRONCLAD (no tocar sin preguntar):**
```
🔒 authService (login, 2FA, JWT)
🔒 costeoService (cálculos financieros)
🔒 referralService (comisiones)
🔒 walletService (billetera)
🔒 RLS policies
🔒 Email dispatchers
```

**Si encuentras mejora:**
1. Documenta issue
2. Propone solución + impacto
3. Espera aprobación PM
4. Implementa con validación

---

## VII. CÁLCULOS FINANCIEROS (EXACTITUD)

**Fórmula:** (Costo + Flete + CPA + Margen) / (1 - %Devoluciones)  
**Precisión:** 2 decimales, redondeo bancario  
**Testing:** Mínimo 10 casos (normal, extremos, edge)

---

## VIII. MULTITENANCY (CORE)

**Aislamiento:** User A NUNCA ve tiendas/datos User B  
**Filtro:** tienda_id + usuario_id TODA query  
**RLS:** TODA tabla nueva incluye policy  
**Testing:** Verifica aislamiento

---

## IX. CHECKLIST ANTES DE MERGEAR

```
[ ] Agente hizo solo su responsabilidad?
[ ] Respetó idioma (código inglés, docs español)?
[ ] Documentó en su carpeta /project/[agente]/?
[ ] Commits con prefijo agente?
[ ] RLS en queries + tablas?
[ ] Tokens encriptados?
[ ] Tests >70% crítico?
[ ] Mocks para dependencias?
[ ] Responsive OK (si aplica)?
[ ] Dark mode OK (si aplica)?
[ ] Cero console.logs?
[ ] Rama ciclo (no individual)?
```

**SIN TODO ✓: NO MERGEAR**

---

**APLICA A ESTE PROYECTO. PUNTO.**