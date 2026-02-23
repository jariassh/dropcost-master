---
trigger: always_on
---

# DIRECTRICES DEL PROYECTO - DropCost Master
**Versión 1.0** | Reglas específicas + arquitectura global integrada

---

## I. FLUJO DE COMPONENTES UI (IRONCLAD)

**ANTES de crear CUALQUIER componente UI, ejecuta este checklist:**

```
1️⃣ ¿EXISTE EN src/components/?
   └─ SÍ → Úsalo. No crees duplicado.
   └─ NO → Continúa paso 2

2️⃣ ¿EXISTE REFERENCIA EN SOLICITUD?
   └─ SÍ (imagen, template, spec) → Úsala
   └─ NO → Continúa paso 3

3️⃣ ¿EXISTE EN DISEÑO_UIUX.md (Sección 2)?
   └─ SÍ → Síguelo línea por línea
   └─ NO → Continúa paso 4

4️⃣ CREAR COMPONENTE NUEVO:
   ├─ Seguir DISEÑO_UIUX.md exacto
   ├─ Variables CSS (NUNCA #FFFFFF hardcoded)
   ├─ Espaciado obligatorio: 4, 8, 12, 16, 24, 32px
   ├─ Dark mode funciona
   ├─ Guardar: src/components/common/[Nombre].tsx
   └─ Commit: feat(components): agregar [Nombre]
```

---

## II. REFERENCIAS COMPONENTES EXISTENTES

| Componente | Úsalo para | NUNCA duplicar |
|---|---|---|
| Button | Botones (primary, secondary, danger) | Sí |
| Input | Campos texto, email, número | Sí |
| Card | Contenedores, KPIs, costeos | Sí |
| Alert | Notificaciones (success, error, warning, info) | Sí |
| Modal | Diálogos, overlays, confirmaciones | Sí |
| Badge | Tags, estados, etiquetas | Sí |
| CountrySelect | Selector país | Sí |
| CurrencyInput | Input moneda | Modificar Input.tsx |

**Si necesitas variante (ej: Input con máscara):** Modifica componente existente, NO crees nuevo.

---

## III. ESTRUCTURA CARPETAS - RESPETA ESTO

```
src/
├── components/
│  ├── common/
│  │  ├── Button.tsx
│  │  ├── Input.tsx
│  │  ├── Card.tsx
│  │  ├── Alert.tsx
│  │  ├── Modal.tsx
│  │  ├── Badge.tsx
│  │  ├── CountrySelect.tsx
│  │  ├── CurrencyInput.tsx
│  │  ├── FormattedInput.tsx
│  │  ├── ConfirmDialog.tsx
│  │  ├── EmptyState.tsx
│  │  ├── PremiumFeatureGuard.tsx
│  │  └── index.ts (exports centralizados)
│  ├── admin/ (componentes admin-only)
│  └── layouts/ (MainLayout, AdminLayout)
├── hooks/ (custom hooks - lógica reutilizable)
├── services/ (lógica de negocio)
├── utils/ (helpers puros)
├── types/ (TypeScript interfaces)
├── pages/ (orquestadores)
└── styles/ (CSS global, variables)
```

**NUNCA crees carpeta nueva sin validación previa.**

---

## IV. PALETA DE COLORES - VARIABLES CSS OBLIGATORIO

**NUNCA hardcodees colores. SIEMPRE variables CSS:**

```css
:root {
  /* Colores - SIEMPRE variables */
  --primary: #0066FF;
  --success: #10B981;
  --error: #EF4444;
  --warning: #F59E0B;
  
  --bg-primary: #FFFFFF;
  --bg-secondary: #F9FAFB;
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --border-color: #E5E7EB;
}

[data-theme="dark"] {
  --bg-primary: #1F2937;
  --bg-secondary: #111827;
  --text-primary: #F9FAFB;
  --border-color: #374151;
}
```

**En React:**
```typescript
<button style={{ backgroundColor: 'var(--primary)' }}>Guardar</button>
// ✅ CORRECTO

<button style={{ backgroundColor: '#0066FF' }}>Guardar</button>
// ❌ INCORRECTO
```

---

## V. ESPACIADO OBLIGATORIO

Escala fija: **4, 8, 12, 16, 24, 32, 48, 64px**

```
Inputs padding:        12px 16px
Modal padding:         24px
Card padding:          16px
Button padding:        12px 24px
Border radius inputs:  10px
Border radius buttons: 8px
Border radius cards:   12px

Gap flex/grid:         12px o 16px
Margin entre grupos:   24px o 32px
```

**NUNCA 15px, 18px, 25px, etc. Solo de la escala.**

---

## VI. TIPOGRAFÍA OBLIGATORIA

```
H1: 32px, bold (700), line-height 1.2
H2: 28px, bold (700), line-height 1.3
H3: 24px, semibold (600), line-height 1.3
Body: 14px, regular (400), line-height 1.5
Caption: 12px, medium (500), line-height 1.4
```

---

## VII. DARK MODE OBLIGATORIO

Todo componente debe funcionar en dark mode.

```typescript
// ✅ CORRECTO
<div style={{
  backgroundColor: 'var(--bg-primary)',  // Cambia con tema
  color: 'var(--text-primary)',
  borderColor: 'var(--border-color)',
}}>
  Contenido
</div>

// ❌ INCORRECTO
<div style={{
  backgroundColor: '#FFFFFF',   // Hardcoded, no cambia
  color: '#1F2937',
}}>
  Contenido
</div>
```

---

## VIII. SEGURIDAD (CRÍTICO)

### Autenticación
- JWT con expiración 30 días
- Refresh tokens en httpOnly cookies
- 2FA obligatorio para cambios sensibles
- Código 2FA válido 10 minutos, máx 3 intentos

### Datos Sensibles
- NUNCA en logs: passwords, tokens, números tarjeta, CVV
- Encripción en reposo (AES-256)
- Passwords hasheados (bcrypt)

### Row Level Security (RLS)
TODA query filtra por tienda_id Y usuario_id.
```sql
-- ✅ CORRECTO
SELECT * FROM costeos WHERE tienda_id = ? AND usuario_id = ?

-- ❌ INCORRECTO
SELECT * FROM costeos -- Sin WHERE tienda_id
```

### Validación
Frontend + Backend SIEMPRE.
```typescript
// Backend SIEMPRE valida, no confíes en frontend
const { error, data } = CosteoSchema.safeParse(input);
if (error) throw new ValidationError(error);
```

---

## IX. CÁLCULOS FINANCIEROS (EXACTITUD CRÍTICA)

**Fórmula costeo:**
```
(CostoProducto + Flete + GastosAdicionales + CPA + Margen) / (1 - %Devoluciones)
```

**Tests obligatorios:**
- Costeo normal
- Con devoluciones 100%
- Margen 0%
- Valores extremos
- Precisión 2 decimales (redondeo bancario)

```typescript
// Tests
test('costeo con margen 30%', () => {
  expect(calcularCosteo({ costo: 100, margen: 0.3 }))
    .toBe(142.86);
});

test('costeo con devoluciones 50%', () => {
  expect(calcularCosteo({ costo: 100, devoluciones: 0.5 }))
    .toBe(200);
});
```

---

## X. INTEGRACIONES EXTERNAS

### Tokens Encriptados
```typescript
// ✅ CORRECTO
const encrypted = encrypt(apiKey, 'AES-256');
await db.integraciones.insert({ encrypted_key: encrypted });

// ❌ INCORRECTO
await db.integraciones.insert({ api_key: apiKey }); // Plaintext
```

### Webhooks Validados
Siempre valida firma antes de procesar.
```typescript
const isValid = validateWebhookSignature(payload, signature, secret);
if (!isValid) throw new Error('Invalid signature');
```

### Sync Automático
- Meta Ads: cada 1 hora
- Dropi: cada 30 minutos
- Shopify: cada 1 hora

### Fallback CSV
Si integración falla, usuario puede subir CSV manualmente.

---

## XI. MULTITENANCY (CORE)

**Aislamiento tiendas:**
```
Filtro obligatorio: tienda_id + usuario_id en TODA query
User A NUNCA ve tiendas/costeos de User B
Admin SOLO si rol='admin'
```

**Tests aislamiento:**
```typescript
test('User A no ve costeos de User B', async () => {
  const costeoA = await getCosteos(userA.id, tiendaA.id);
  const costeoB = await getCosteos(userB.id, tiendaB.id);
  
  expect(costeoA).not.toContain(costeoB);
});
```

---

## XII. PERFORMANCE

### Índices BD
```sql
CREATE INDEX idx_costeos_tienda_id ON costeos(tienda_id);
CREATE INDEX idx_costeos_usuario_id ON costeos(usuario_id);
CREATE INDEX idx_costeos_fecha ON costeos(fecha);
```

### Lazy Loading Components
```typescript
const AdminPanel = lazy(() => import('@/pages/AdminPanel'));

<Suspense fallback={<Loading />}>
  <AdminPanel />
</Suspense>
```

### Cache
- KPIs: cachear 1 hora
- Regiones: cachear 2 horas
- Invalidar manual si es necesario

---

## XIII. TESTING DROPCOST

### Critical Flows
1. Registro → Crear tienda → Primer costeo
2. Conectar Meta Ads → Sincronizar datos
3. Cambiar plan → Nuevo límite costeos

### Cálculos
Mínimo 10 casos (normal, extremos, edge cases)

### Aislamiento
Tests verifican User A no ve tienda User B

### Integraciones
Mock Meta, Dropi, Shopify. NUNCA llamadas reales.

### E2E
Mínimo 5 flujos críticos con Playwright

### Coverage
>70% código crítico (auth, simulador, dashboard)

---

## XIV. OBSERVABILIDAD DROPCOST

### Logs Críticos
```json
{
  "timestamp": "...",
  "level": "INFO",
  "userId": "...",
  "tiendaId": "...",
  "feature": "simulador",
  "action": "calcularCosteo",
  "message": "Costeo calculado exitosamente",
  "duration": "234ms"
}
```

### Errores a Trackear
- Auth fails → Sentry
- Cálculos erróneos → Investigation
- Integraciones Meta fallidas → Alert
- Queries >500ms → Performance log

---

## XV. VALIDACIÓN PRE-COMMIT

```
[ ] ¿Usé componente existente o lo repliqué exacto?
[ ] ¿Variables CSS, no hardcodes?
[ ] ¿Espaciado en escala (4,8,12,16...)?
[ ] ¿Tipografía sigue DISEÑO_UIUX.md?
[ ] ¿Dark mode funciona?
[ ] ¿Datos seguros (no hardcoded tokens)?
[ ] ¿RLS en queries BD (tienda_id + usuario_id)?
[ ] ¿Tests >70% si es crítico?
[ ] ¿Commit bien formado: feat(scope): mensaje?
[ ] ¿Sin console.logs?
```

**Sin esto: PR rechazada.**

---

## XVI. GIT WORKFLOW - ESPECÍFICO DROPCOST

### Ciclos de Desarrollo
Una rama por ciclo de trabajo (semana, sprint). Múltiples commits EN ESA rama.

```powershell
# Setup inicial
git clone https://github.com/[user]/dropcost-master.git
cd dropcost-master
git config user.name "Tu Nombre"
git config user.email "tu@email.com"

# Crear rama ciclo
git checkout develop
git pull origin develop
git checkout -b feat/ciclo-febrero-semana1

# Trabajar múltiples features EN ESA rama
# Feature 1: editar, commit
git add . ; git commit -m "feat(simulador): implementar costeo"

# Feature 2: editar, commit
git add . ; git commit -m "feat(referidos): nivel 2 comisiones"

# Si algo se rompe: fix EN MISMA rama
git add . ; git commit -m "fix(core): restaurar estado"

# Testing completo en staging

# Push rama ciclo
git push origin feat/ciclo-febrero-semana1

# Merge a develop (CICLO COMPLETO APROBADO)
git checkout develop
git pull origin develop
git merge feat/ciclo-febrero-semana1
git push origin develop

# Cleanup rama ciclo
git branch -d feat/ciclo-febrero-semana1
git push origin --delete feat/ciclo-febrero-semana1

# Siguiente ciclo: nueva rama
git checkout -b feat/ciclo-febrero-semana2
```

### Convención Commits DropCost
```
Formato: feat(scope): descripción

Scopes usados en DropCost:
- (simulador): cálculos, costeo, márgenes
- (auth): login, 2FA, JWT
- (referidos): comisiones, líderes
- (dashboard): KPIs, análisis
- (integraciones): Meta, Shopify, Dropi
- (admin): usuarios, planes, configuración
- (components): UI, reusables
- (db): migraciones, esquema
- (pagos): comisiones, retiros, pasarelas

Ejemplos:
✅ feat(simulador): implementar cálculo costeo con devoluciones
✅ feat(referidos): agregar ascenso automático a líder
✅ fix(auth): corregir reset password con 2FA
✅ test(dashboard): agregar tests KPIs
```

### NUNCA:
```
❌ Múltiples ramas feat/ sin mergear
❌ Commits genéricos: "fix", "update", "changes"
❌ Ramas huérfanas en repo
❌ Mergear una feature por una (usa ciclos)
❌ Push sin testing >70%
❌ Git stash, cherry-pick, rebase (complejidad innecesaria)
```

### Merge a Main - Milestones Solamente
```powershell
# MVP (Auth + Simulador + Tiendas)
# Beta (Core features estable)
# Release (QA completo, aprobado)

git checkout main
git pull origin main
git merge develop
git push origin main
git tag -a v1.0.0 -m "Release 1.0.0 MVP"
git push origin v1.0.0
```

---

## XVII. DEPLOYMENT

### Staging
Copia anónima de producción. Testea integraciones antes prod.

### Backups
- Diarios: 7 días
- Semanales: 4 semanas
- Mensuales: 12 meses

### RTO/RPO
- RTO (Recovery Time Objective): máximo 2 horas
- RPO (Recovery Point Objective): máximo 24 horas sin perder datos

---

## XVII. REGLAS CRÍTICAS

**IDIOMA:** Comunicación en Español | Código en Inglés | ❌ No mezclar

**NO REGRESIÓN:** SI FUNCIONA → PREGUNTAR antes de tocar
- Protocolo: Pausar → Preguntar → Entender → Proponer → Aprobación → Implementar
- 🔒 Protegidos: Auth, Cálculos, Emails, Pagos, Queries BD
- ❌ No: Limpiar código "raro" | Refactorizar sin razón | Cambios sin avisar
- Resultado: Cambios no autorizados = revertidos

---