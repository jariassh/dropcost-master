# Documento Maestro Integral - DropCost Master
## Secciones Complementarias (APIs, Testing, Seguridad, Integraciones, Deployment, Monitoreo, Documentación Usuario, Lanzamiento, Riesgos, Contribución)

**Versión:** 1.0  
**Fecha:** Febrero 2026

---

## Tabla de Contenidos
1. [Especificación Técnica de APIs](#1-especificación-técnica-de-apis)
2. [Plan de Testing](#2-plan-de-testing)
3. [Guía de Seguridad](#3-guía-de-seguridad)
4. [Plan de Integraciones](#4-plan-de-integraciones)
5. [Guía de Deployment](#5-guía-de-deployment)
6. [Plan de Monitoreo](#6-plan-de-monitoreo)
7. [Documentación de Usuario](#7-documentación-de-usuario)
8. [Plan de Lanzamiento](#8-plan-de-lanzamiento)
9. [Matriz de Riesgos](#9-matriz-de-riesgos)
10. [Guía de Contribución](#10-guía-de-contribución)

---

# 1. Especificación Técnica de APIs

## 1.1 Autenticación

Todos los endpoints requieren **JWT token** en header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 1.2 Endpoints Críticos

### Auth Module

**POST /auth/register** - Registrar usuario
```json
Request: { "email": "user@example.com", "password": "Pass123!", "nombres": "Juan" }
Response: { "success": true, "data": { "userId": "uuid-123" } }
```

**POST /auth/login** - Iniciar sesión
```json
Response: { "requiresOTP": true, "sessionId": "session-123" }
```

**POST /auth/verify-2fa** - Verificar código 2FA
```json
Response: { "accessToken": "jwt-token", "refreshToken": "refresh-token" }
```

### Simulador Module

**POST /simulador/calcular-precio** - Calcular precio sugerido
```json
Request: {
  "tiendaId": "uuid",
  "nombreProducto": "Zapatilla",
  "margenDeseado": 25,
  "costoProducto": 35000,
  "flete": 14500,
  "comisionRecaudo": 3,
  "tasaDevoluciones": 20,
  "otrosGastos": 2500,
  "cpaPromedio": 18000,
  "cancelacionPreEnvio": 15
}
Response: {
  "precioSugerido": 125836,
  "utilidadNeta": 31459,
  "efectividadFinal": 68.0
}
```

**POST /simulador/guardar-costeo** - Guardar costeo
**POST /simulador/duplicar-costeo** - Duplicar costeo
**DELETE /simulador/costeo/{id}** - Eliminar costeo
**GET /simulador/costeos** - Listar costeos

### Tiendas Module

**POST /tiendas/crear** - Crear tienda
**GET /tiendas** - Listar tiendas
**PUT /tiendas/{id}** - Editar tienda
**DELETE /tiendas/{id}** - Eliminar tienda

### Dashboard Module

**GET /dashboard/kpis** - KPIs principales
```json
Response: {
  "cpaReal": { "valor": 8.42, "variacion": -12 },
  "tasaEntregaNeta": { "valor": 72.4, "variacion": -2.1 },
  "margenReal": { "valor": 25.8, "variacion": 4.5 },
  "numeroPedidos": 1250
}
```

**GET /dashboard/tendencias-cpa** - Gráfico tendencias
**GET /dashboard/insights-ia** - Insights IA

### Integraciones Module

**POST /integraciones/conectar-meta** - OAuth2 Meta
**POST /integraciones/conectar-dropi** - Conectar Dropi
**POST /integraciones/conectar-shopify** - OAuth2 Shopify
**POST /integraciones/subir-csv** - Cargar archivo CSV
**GET /integraciones/{tiendaId}** - Estado integraciones

### Admin Module

**GET /admin/usuarios** - Listar usuarios (admin only)
**GET /admin/planes** - Listar planes
**POST /admin/codigos-promo** - Crear código promocional
**GET /admin/logs-actividad** - Ver logs actividad

## 1.3 Códigos de Error

| Código | HTTP | Descripción |
|--------|------|-------------|
| INVALID_CREDENTIALS | 401 | Credenciales inválidas |
| EMAIL_NOT_VERIFIED | 401 | Email no verificado |
| OTP_EXPIRED | 401 | Código 2FA expirado |
| UNAUTHORIZED | 403 | Acceso no permitido |
| NOT_FOUND | 404 | Recurso no existe |
| VALIDATION_ERROR | 400 | Parámetros inválidos |
| RATE_LIMIT_EXCEEDED | 429 | Demasiadas solicitudes |

## 1.4 Rate Limiting

```
100 requests / 60 segundos por IP
500 requests / 60 segundos por usuario autenticado
Login: 5 intentos / 15 minutos
```

---

# 2. Plan de Testing

## 2.1 Estrategia General

| Nivel | Cobertura | Herramienta |
|-------|-----------|-------------|
| Unit | 70%+ | Vitest + React Testing Library |
| Integration | 50%+ | Vitest + Supertest |
| E2E | 30%+ (críticos) | Playwright |
| Performance | - | Lighthouse |
| Security | - | OWASP ZAP |

## 2.2 Casos de Prueba Críticos

**Autenticación:**
- Registro con email válido ✓
- Registro con email duplicado → Error
- Verificación email funciona
- Login con credenciales válidas
- 2FA código válido
- 2FA código expirado → Error
- Logout invalida sesión

**Simulador:**
- Cálculo precio con parámetros válidos
- Margen afecta correctamente
- Guardar costeo crea registro
- Duplicar costeo copia con nuevo ID campaña
- Eliminar costeo remueve de BD

**Dashboard:**
- KPIs calculan correctamente
- Filtro fecha actualiza datos
- Gráfico CPA renderiza
- Carga <3 segundos
- Responsive en mobile

**Análisis Regional:**
- Regiones muestran datos correctos
- Mapa renderiza correctamente
- Colores corresponden a riesgo

## 2.3 Flujos E2E Críticos

**Flujo 1: Usuario nuevo → Primer costeo**
```
Register → Verify email → Login 2FA → Create tienda → Create costeo → See en dashboard
```

**Flujo 2: Conectar Meta Ads**
```
Config > Tiendas > Conectar Meta → OAuth2 → Dashboard actualiza → Datos Meta visibles
```

**Flujo 3: Cambiar plan**
```
Membresía → Select plan pro → Pagar → Plan actualiza → Email factura
```

## 2.4 Ejecución

```bash
# Antes de push
npm run test:unit
npm run test:integration
npm run lint
npm run build

# Antes de merge PR
npm run test:coverage    # >70%
npm run test:e2e        # Flujos críticos

# Pre-deploy
npm run test:all
npm run test:performance
npm run test:security
```

## 2.5 Performance Benchmarks

| Métrica | Target |
|---------|--------|
| LCP (Largest Contentful Paint) | <2.5s |
| FID (First Input Delay) | <100ms |
| CLS (Cumulative Layout Shift) | <0.1 |
| Bundle Size | <500KB |
| API Response (p95) | <200ms |

---

# 3. Guía de Seguridad

## 3.1 Arquitectura Seguridad

```
Cliente (HTTPS + CSP) 
  ↓ JWT Token
API Gateway (Rate limit + WAF)
  ↓
Edge Functions (Validación + Sanitización)
  ↓
PostgreSQL (RLS + Encryption)
```

## 3.2 Autenticación

**Password Hashing:**
```javascript
const hashedPassword = await bcrypt.hash(password, 12);
```

**JWT Token:**
```javascript
const token = sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' });
```

**2FA Email:**
- Código 6 dígitos + validez 10 minutos
- Reintentos limitados
- Invalidar después de 3 errores

## 3.3 Autorización (RLS)

```sql
CREATE POLICY "Users see own tiendas"
ON tiendas FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Users see own costeos"
ON costeos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tiendas
    WHERE tiendas.id = costeos.tienda_id
    AND tiendas.usuario_id = auth.uid()
  )
);
```

## 3.4 Validación Inputs (Zod)

```typescript
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[!@#$]/),
  nombres: z.string().min(2).max(50),
  pais: z.string().length(2)
});

const validated = RegisterSchema.parse(body);
```

## 3.5 Encriptación de Datos

**Tokens de integración:**
```javascript
function encryptToken(token) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  return iv.toString('hex') + ':' + cipher.update(token, 'utf8', 'hex') + cipher.final('hex');
}
```

## 3.6 Headers de Seguridad

```javascript
// HTTPS + HSTS
res.setHeader('Strict-Transport-Security', 'max-age=31536000');

// CSP
res.setHeader('Content-Security-Policy', "default-src 'self'; ...");

// Otros
res.setHeader('X-Frame-Options', 'DENY');
res.setHeader('X-Content-Type-Options', 'nosniff');
```

## 3.7 Rate Limiting

```javascript
const limiter = rateLimit({ windowMs: 15*60*1000, max: 5 });
app.post('/auth/login', limiter, loginHandler);
```

## 3.8 Compliance

**GDPR (Europa):** Privacy Policy, derecho olvido, consentimiento datos
**LGPD (Brasil):** Privacy Policy, opt-out marketing
**PCI DSS:** No almacenar tarjetas (tokenización), HTTPS obligatorio

---

# 4. Plan de Integraciones

## 4.1 Meta Ads Integration

**OAuth2 Flow:**
```
Usuario → Click conectar → Facebook auth → Code callback → Backend canjea token → Guardar encriptado
```

**Sync automático cada hora:**
```javascript
// Obtener campaña y insights
const campaigns = await fetch('https://graph.facebook.com/v18.0/{accountId}/campaigns', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Calcular CPA = spend / conversions
// Guardar en data_meta_ads
```

## 4.2 Dropi Integration

**Conectar:**
```javascript
// Validar API key con test request
// Guardar token encriptado
```

**Sync cada 30 min:**
```javascript
// GET /api/v2/shipments
// Procesar estado envío, departamento, transportadora
// Calcular tasa devoluciones real
```

## 4.3 Shopify Integration

**GraphQL API:**
```javascript
// Query órdenes
// Capturar: id, fecha, total, cancelada
// Calcular % cancelaciones pre-envío
```

## 4.4 Pasarelas de Pago

**Mercado Pago:**
- Crear preferencia de pago
- Webhook para pagos aprobados
- Actualizar estado suscripción

**Stripe (alternativa):**
- Checkout sessions
- Webhook para confirmación
- Prorrateo automático

## 4.5 Email (SendGrid)

```javascript
sgMail.send({
  to: email,
  from: 'noreply@dropcostmaster.com',
  subject: 'Verifica tu email',
  html: `Tu código: ${code}`
});
```

---

# 5. Guía de Deployment

## 5.1 Pre-Deployment Checklist

- [ ] Tests pasando 100%
- [ ] Code review completado
- [ ] Variables de entorno configuradas
- [ ] Backups configurados
- [ ] Certificado SSL válido
- [ ] Logs y monitoreo activos
- [ ] Alertas configuradas

## 5.2 Frontend Deploy

**Opción 1: Vercel (Recomendado)**
```bash
vercel deploy --prod
```

**Opción 2: Hostinger (FTP)**
```bash
npm run build
# Subir dist/ a public_html/ via FTP
```

## 5.3 Backend Deploy

```bash
# Deploy Supabase Edge Functions
supabase functions deploy auth/register
supabase functions deploy simulador/calcular-precio
# ... etc
```

## 5.4 Database Deploy

```bash
# Migrar BD
supabase db push

# Verificar
supabase migration list
```

## 5.5 Environment Variables

**Frontend:**
```env
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_API_BASE_URL=https://api.dropcostmaster.com
```

**Backend:**
```env
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
META_APP_ID=...
META_APP_SECRET=...
JWT_SECRET=...
ENCRYPTION_KEY=...
```

## 5.6 Post-Deployment

```bash
# Health check
curl https://api.dropcostmaster.com/health

# Verificar frontend
curl https://dropcostmaster.com

# Test flujos críticos
# - Login
# - Crear costeo
# - Dashboard
```

---

# 6. Plan de Monitoreo

## 6.1 Herramientas

| Aspecto | Herramienta | Métrica |
|---------|-------------|--------|
| Uptime | UptimeRobot | 99.5%+ |
| Errores | Sentry | <10 errores/hora |
| Performance | Vercel Analytics | FCP <2.5s |
| Base de Datos | Supabase Dashboard | Pool usage |

## 6.2 Alertas

| Condición | Severidad | Acción |
|-----------|-----------|--------|
| Uptime <95% | CRÍTICA | Llamada on-call |
| Error rate >1% | ALTA | Email + Slack |
| Response >1s | MEDIA | Slack |
| DB pool >90% | MEDIA | Slack + check |

## 6.3 Mantenimiento Preventivo

| Tarea | Frecuencia |
|-------|-----------|
| Revisar logs | Diario |
| Revisar performance | Semanal |
| Actualizar dependencias | Mensual |
| Audit seguridad | Trimestral |
| Disaster recovery test | Semestral |

## 6.4 Backup y Recuperación

**Supabase:** Diarios (7 días), semanales (4 semanas), mensuales (12 meses)

**RTO/RPO:**
- RTO: Máximo 2 horas para recuperar servicio
- RPO: Máximo 24 horas sin perder datos

## 6.5 Troubleshooting

**API lenta:**
```sql
-- Revisar índices
SELECT * FROM pg_stat_user_indexes;

-- Revisar queries lenta
EXPLAIN ANALYZE SELECT ...;
```

**Alta tasa 401:**
- Revisar JWT expiración
- Validar tokens refresh
- Revisar RLS policies

**OOM (Out of Memory):**
- Revisar memory leaks
- Agregar LIMIT/pagination
- Escalar recursos

---

# 7. Documentación de Usuario

## 7.1 Guía Inicio Rápido

**Paso 1: Crear cuenta**
1. Ir a dropcostmaster.com
2. Clic "Crear Cuenta"
3. Llenar formulario
4. Verificar email
5. Listo

**Paso 2: Crear tienda**
1. Configuración > Tiendas
2. "+ Nueva Tienda"
3. Ingresar datos
4. Guardar

**Paso 3: Primer costeo**
1. Ir a Simulador
2. Llenar parámetros
3. Calcular precio
4. Guardar costeo

## 7.2 FAQs

**¿Cuánto cuesta?**
> Planes desde $50.000 COP/mes. 7 días gratis.

**¿Cómo se calcula el precio?**
> Fórmula: (Costo + Flete + CPA + Margen) / (1 - Devoluciones%)

**¿Cómo conecto Meta Ads?**
> Configuración > Tiendas > Conectar Meta Ads > Autoriza en Facebook

**¿Con qué frecuencia se sincronizan datos?**
> Meta Ads: cada hora, Dropi: 30 minutos, Shopify: cada hora

**¿Qué es el semáforo de viabilidad?**
> Verde: Rentable, escala. Amarillo: Márgenes ajustados. Rojo: No viable.

## 7.3 Videos Tutoriales (Specs)

1. **01-Inicio Rápido (3min)** - Crear cuenta → Tienda → Costeo
2. **02-Simulador (5min)** - Explicar campos y cálculos
3. **03-Meta Ads (4min)** - OAuth2 y datos en dashboard
4. **04-Análisis Regional (4min)** - Mapa y benchmarks
5. **05-Cambiar Plan (3min)** - Métodos pago y prorrateo

---

# 8. Plan de Lanzamiento

## 8.1 Pre-Lanzamiento (2 semanas antes)

- [ ] Testing exhaustivo en staging
- [ ] Monitoring y alertas configuradas
- [ ] Backups configurados
- [ ] Equipo on-call establecido
- [ ] Documentación completada
- [ ] Beta testing (20-30 usuarios)
- [ ] Security audit final
- [ ] Performance testing

## 8.2 Lanzamiento (Día 1)

**Pre-lanzamiento:**
- Deploy a producción
- Health checks
- Equipo en standby

**Go live:**
- Tests finales
- Invitar beta users
- Monitorear activamente

## 8.3 Comunicación

**Email:**
- Asunto: "DropCost Master está disponible 🚀"
- Contenido: Qué es, cómo funciona, link
- CTA: "Comienza gratis 7 días"

**In-App:**
- "Bienvenido a DropCost Master"
- Link a tutoriales

**Social Media:**
- Anuncio lanzamiento
- Link y descripción

## 8.4 Post-Lanzamiento

**Primeras 2 semanas:**
- Monitor 24/7 errores
- Response time <200ms
- No downtime
- Feedback recopilado

**Métricas de éxito:**
- 100+ signups mes 1
- 5%+ conversión a pagos
- Uptime 99%+
- NPS 30+

## 8.5 Growth (3 meses)

**Adquisición:**
- Outreach a influencers dropshipping
- Content marketing
- Ads Meta/Google
- Referidos con descuentos
- Partnerships

**Retention:**
- Email nurturing
- Onboarding mejorado
- Webinars
- Feature releases mensuales

---

# 9. Matriz de Riesgos

## 9.1 Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|-----------|
| Fallo Supabase | Baja | Crítico | Multi-region backup |
| Ataque DDoS | Media | Alto | CloudFlare, rate limiting |
| Data breach | Baja | Crítico | Encriptación, audits |
| Bug cálculos | Media | Alto | Unit tests exhaustivos |
| Lentitud dashboard | Media | Medio | Caching, índices |
| Fallo integraciones | Media | Medio | Fallback CSV, reintentos |
| Pérdida datos | Baja | Crítico | Backups 3x/día |

## 9.2 Riesgos Comerciales

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|-----------|
| Baja adopción | Media | MVP sólido, marketing |
| Competencia | Media | Diferenciación |
| Cambios regulación | Baja | Legal counsel |
| Churn alto | Media | Onboarding, customer success |
| Precios mal | Media | Market research |

## 9.3 Plan Respuesta Incidentes

**Si error crítico:**
1. Detectar (1 min)
2. Alertar on-call (1 min)
3. Asesar (5 min)
4. Revertir o hotfix
5. Comunicar usuarios
6. Root cause analysis

**Si downtime BD:**
1. Restaurar backup (5 min)
2. Validar integridad (10 min)
3. Sincronizar si falta
4. Notificar usuarios

---

# 10. Guía de Contribución

## 10.1 Setup Local

```bash
# Frontend
git clone repo
cd frontend
npm install
cp .env.example .env.local
npm run dev

# Backend
cd supabase/functions
supabase start
supabase functions serve
supabase db push
```

## 10.2 Git Workflow

**Commits:**
```
feat(auth): agregar 2FA
fix(simulador): corregir cálculo
refactor(dashboard): mejorar performance
docs(api): actualizar endpoints
test(auth): agregar tests
```

**PR Workflow:**
1. Crear rama `feat/nueva-feature`
2. Commits pequeños
3. Push a GitHub
4. Abrir PR con descripción
5. Tests + review
6. Merge a main (auto deploy)

## 10.3 Testing Requerimientos

```bash
npm run test:unit        # >70%
npm run test:integration
npm run test:coverage
npm run lint
npm run build
```

## 10.4 Standards Código

**React Components:**
```typescript
interface Props {
  title: string;
  value: string | number;
}

export const Component: React.FC<Props> = ({ title, value }) => {
  return <div>{/* JSX */}</div>;
};
```

**Backend Functions:**
```typescript
serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("", { status: 405 });
  
  try {
    const body = await req.json();
    // Validar
    // Procesar
    // Retornar
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
```

## 10.5 Performance Tips

```javascript
// Lazy load
const Dashboard = lazy(() => import('./Dashboard'));

// Memoizar
const Component = memo(({ data }) => <div>{data}</div>);

// useCallback
const handleClick = useCallback(() => {}, []);

// useEffect cleanup
useEffect(() => {
  return () => { /* cleanup */ };
}, []);
```

## 10.6 Documentación Código

```javascript
/**
 * Calcula el precio de venta sugerido
 * @param {Object} params - Parámetros entrada
 * @param {number} params.costoProducto - Costo COP
 * @param {number} params.margenDeseado - Margen %
 * @returns {Object} { precioSugerido, utilidadNeta }
 * @example calcularPrecio({ costoProducto: 35000, margenDeseado: 25 })
 */
export function calcularPrecio(params) { }
```

---

## Resumen Final

Este documento maestro contiene:

✅ **10 secciones completas** de especificación técnica
✅ **APIs documentadas** con ejemplos
✅ **Plan testing** con casos críticos
✅ **Guía seguridad** con implementaciones
✅ **Integraciones** Meta, Dropi, Shopify, pasarelas
✅ **Deployment** frontend, backend, BD
✅ **Monitoreo** con herramientas y alertas
✅ **Documentación usuario** con FAQs y videos
✅ **Plan lanzamiento** con timeline
✅ **Matriz riesgos** con mitigaciones
✅ **Guía contribución** para futuros devs

**Total:** ~300KB de documentación técnica lista para comenzar desarrollo.
