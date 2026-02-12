# Arquitectura Técnica - DropCost Master

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Stack Recomendado para Hostinger Compartido**

---

## 1. Visión General de la Arquitectura

DropCost Master utiliza una arquitectura **serverless/edge-first** optimizada para hospedaje compartido económico sin VPS. El frontend es estático, el backend usa funciones serverless, y la base de datos es externa administrada.

```
┌─────────────────────┐
│   Frontend (React)  │
│  Hostinger/Vercel   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Supabase Edge Fn   │
│  (Serverless APIs)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Supabase         │
│  (PostgreSQL + RLS)│
└─────────────────────┘
```

---

## 2. Frontend

### 2.1 Stack Frontend
- **Framework:** React 18+ con TypeScript
- **Bundler:** Vite (más rápido que CRA)
- **CSS:** Tailwind CSS v3
- **State Management:** TanStack Query (React Query) + Zustand
- **Formularios:** React Hook Form + Zod (validación)
- **Gráficos:** Recharts (ligero) o Chart.js
- **Mapa:** Leaflet (mapas interactivos)
- **UI Components:** Headless UI + Radix UI
- **HTTP Client:** Axios o Fetch API

### 2.2 Características Frontend
- **Responsivo:** Mobile-first con Tailwind
- **Dark/Light Mode:** CSS variables + LocalStorage
- **Offline Support:** Service Workers básico (caché)
- **PWA:** Manifest + icons para instalación
- **Build Output:** HTML/CSS/JS estáticos

### 2.3 Estructura de Carpetas
```
src/
├── components/
│   ├── auth/
│   ├── simulador/
│   ├── dashboard/
│   ├── analisisRegional/
│   ├── configuracion/
│   ├── admin/
│   └── common/
├── pages/
├── hooks/
├── services/ (API calls)
├── store/ (Zustand)
├── types/ (TypeScript)
├── styles/ (Tailwind config)
├── utils/
└── App.tsx
```

### 2.4 Deploy Frontend
- **Opción 1:** Vercel (recomendado, gratis, CI/CD automático)
- **Opción 2:** Hostinger (subir carpeta `dist/` vía FTP)
- **Dominio:** Apunta DNS a servidor donde esté alojado

---

## 3. Backend Serverless

### 3.1 Stack Backend
- **Runtime:** Node.js 18+ (Supabase Edge Functions)
- **Framework:** Express.js (en caso necesario) O endpoints simples en Supabase
- **TypeScript:** Tipado fuerte
- **Autenticación:** Supabase Auth (JWT)
- **Validación:** Zod o Joi

### 3.2 Arquitectura de Funciones

Las funciones serverless manejan:
- Autenticación y 2FA
- Lógica de negocio (cálculos de costeo)
- Integraciones (Meta, Dropi, Shopify)
- Generación de reportes
- Notificaciones
- Admin operations

### 3.3 Estructura Supabase Functions
```
supabase/
├── functions/
│   ├── auth/
│   │   ├── register/
│   │   ├── login/
│   │   ├── verify-email/
│   │   ├── 2fa-verify/
│   │   └── password-reset/
│   ├── simulador/
│   │   ├── calcular-precio/
│   │   ├── guardar-costeo/
│   │   ├── duplicar-costeo/
│   │   └── eliminar-costeo/
│   ├── tiendas/
│   │   ├── crear-tienda/
│   │   ├── editar-tienda/
│   │   └── eliminar-tienda/
│   ├── integraciones/
│   │   ├── conectar-meta/
│   │   ├── conectar-dropi/
│   │   ├── conectar-shopify/
│   │   ├── sincronizar-datos/
│   │   └── subir-csv/
│   ├── dashboard/
│   │   ├── obtener-kpis/
│   │   ├── obtener-tendencias/
│   │   └── recomendacion-ia/
│   ├── admin/
│   │   ├── gestionar-usuarios/
│   │   ├── gestionar-planes/
│   │   ├── codigos-promocionales/
│   │   └── logs-actividad/
│   └── utilidades/
│       ├── enviar-email/
│       ├── exportar-pdf/
│       └── exportar-excel/
```

### 3.4 Configuración Supabase
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
```

---

## 4. Base de Datos

### 4.1 Stack BD
- **DBMS:** PostgreSQL (Supabase managed)
- **ORM/Query:** Supabase JavaScript SDK (JS) + Raw SQL
- **Migraciones:** Supabase migrations o Prisma
- **Backups:** Automáticos diarios (Supabase)

### 4.2 Esquema Principal

#### Tabla: users
```sql
id (UUID, PK)
email (VARCHAR, UNIQUE)
password_hash (VARCHAR)
nombres (VARCHAR)
apellidos (VARCHAR)
telefono (VARCHAR)
pais (VARCHAR)
plan_id (FK → plans)
estado_suscripcion (ENUM: activa, cancelada, suspendida)
email_verificado (BOOLEAN)
2fa_habilitado (BOOLEAN)
fecha_registro (TIMESTAMP)
ultima_actividad (TIMESTAMP)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### Tabla: tiendas
```sql
id (UUID, PK)
usuario_id (FK → users)
nombre (VARCHAR)
logo_url (VARCHAR)
pais (VARCHAR)
fecha_creacion (TIMESTAMP)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### Tabla: costeos
```sql
id (UUID, PK)
tienda_id (FK → tiendas)
nombre_producto (VARCHAR)
id_campana_meta (VARCHAR)
margen_deseado (NUMERIC)
costo_producto (NUMERIC)
flete_base (NUMERIC)
comision_recaudo (NUMERIC)
tasa_devoluciones (NUMERIC)
otros_gastos (NUMERIC)
cpa_promedio (NUMERIC)
cancelacion_pre_envio (NUMERIC)
precio_sugerido (NUMERIC)
utilidad_neta (NUMERIC)
efectividad_final (NUMERIC)
fecha_costeo (TIMESTAMP)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### Tabla: integraciones
```sql
id (UUID, PK)
tienda_id (FK → tiendas)
tipo (ENUM: meta_ads, dropi, shopify)
estado (ENUM: conectada, desconectada)
token_encriptado (VARCHAR) -- encriptado
fecha_ultima_sincronizacion (TIMESTAMP)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### Tabla: data_meta_ads
```sql
id (UUID, PK)
tienda_id (FK → tiendas)
id_campana (VARCHAR)
cpa_real (NUMERIC)
impresiones (INTEGER)
clics (INTEGER)
conversiones (INTEGER)
gasto (NUMERIC)
fecha (DATE)
created_at (TIMESTAMP)
```

#### Tabla: data_dropi
```sql
id (UUID, PK)
tienda_id (FK → tiendas)
id_orden (VARCHAR)
estado_envio (VARCHAR)
departamento (VARCHAR)
transportadora (VARCHAR)
fecha_envio (TIMESTAMP)
fecha_entrega (TIMESTAMP)
created_at (TIMESTAMP)
```

#### Tabla: data_shopify
```sql
id (UUID, PK)
tienda_id (FK → tiendas)
id_orden (VARCHAR)
fecha_venta (TIMESTAMP)
total (NUMERIC)
cancelada_pre_envio (BOOLEAN)
cantidad_articulos (INTEGER)
created_at (TIMESTAMP)
```

#### Tabla: planes
```sql
id (UUID, PK)
nombre (VARCHAR)
descripcion (TEXT)
precio_mensual (NUMERIC)
precio_anual (NUMERIC)
caracteristicas (JSONB)
estado (ENUM: activo, inactivo)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### Tabla: codigos_promocionales
```sql
id (UUID, PK)
codigo (VARCHAR, UNIQUE)
descuento_porcentaje (NUMERIC)
planes_aplicables (TEXT[])
usos_limites (INTEGER)
usos_actuales (INTEGER)
fecha_expiracion (TIMESTAMP)
created_at (TIMESTAMP)
```

### 4.3 Row Level Security (RLS)

Cada tabla debe tener políticas RLS para:
- Usuario solo ve sus datos (tiendas, costeos, integraciones)
- Admin ve todo
- Datos aislados por tienda_id

```sql
-- Ejemplo: costeos
CREATE POLICY "Users can view own tienda costeos"
ON costeos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tiendas 
    WHERE tiendas.id = costeos.tienda_id 
    AND tiendas.usuario_id = auth.uid()
  )
);
```

### 4.4 Índices
```sql
CREATE INDEX idx_costeos_tienda_id ON costeos(tienda_id);
CREATE INDEX idx_data_meta_ads_tienda_id ON data_meta_ads(tienda_id);
CREATE INDEX idx_data_dropi_tienda_id ON data_dropi(tienda_id);
CREATE INDEX idx_data_shopify_tienda_id ON data_shopify(tienda_id);
CREATE INDEX idx_integraciones_tienda_id ON integraciones(tienda_id);
CREATE INDEX idx_tiendas_usuario_id ON tiendas(usuario_id);
```

---

## 5. Autenticación y Seguridad

### 5.1 Flujo de Autenticación
1. **Registro:** Email + password → Hash con bcrypt → Token JWT
2. **Email Verification:** Link 24h → Confirm email
3. **Login:** Email + password → 2FA (código email)
4. **2FA:** Código temporal 10min → JWT con 2FA flag
5. **Sesiones:** JWT en localStorage + refresh token en httpOnly cookie

### 5.2 2FA
- **Fase 1:** Código enviado al email (10 minutos validez)
- **Fase 2:** Integración futura Google Authenticator (TOTP)

### 5.3 Seguridad API
- **HTTPS:** Obligatorio (Let's Encrypt gratis)
- **CORS:** Dominio frontend permitido
- **Rate Limiting:** 100 req/min por IP
- **Validación Inputs:** Zod en cada endpoint
- **SQL Injection:** Queries parametrizadas (Supabase SDK)
- **XSS:** Content-Security-Policy headers
- **CSRF:** SameSite cookies

### 5.4 Encriptación
```javascript
// Tokens de integración encriptados en BD
const crypto = require('crypto');

function encryptToken(token, secretKey) {
  const cipher = crypto.createCipher('aes-256-cbc', secretKey);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
```

---

## 6. Integraciones Externas

### 6.1 Meta Ads API
- **Endpoint:** Leer campañas, gastos, conversiones
- **Autenticación:** Access token OAuth2
- **Frecuencia Sync:** Cada hora (cron job con Supabase)
- **Datos Capturados:** CPA real, impresiones, clics, conversiones

### 6.2 Dropi API
- **Endpoint:** Estado envíos, órdenes
- **Autenticación:** API key
- **Frecuencia Sync:** Cada 30 minutos
- **Datos Capturados:** Estado envío, departamento, transportadora, devoluciones

### 6.3 Shopify API
- **Endpoint:** GraphQL API
- **Autenticación:** OAuth2 + API token
- **Frecuencia Sync:** Cada hora
- **Datos Capturados:** Órdenes, cancelaciones pre-envío, artículos vendidos

### 6.4 Carga CSV Manual
- **Ubicación:** Formulario en settings tienda
- **Validación:** Headers esperados, tipos de dato
- **Mapeo:** Usuario mapea columnas manualmente primera vez
- **Storage:** Archivo procesado en Supabase Storage

### 6.5 Pasarelas de Pago
- **Mercado Pago:** Webhook para confirmar pagos
- **PayPal:** IPN webhook
- **Stripe:** Webhook para eventos
- **Tokens:** NO almacenar, usar tokenización proveedor

```javascript
// Ejemplo: Webhook Mercado Pago
supabase.functions.create('mp-webhook', {
  method: 'POST',
  body: async (req) => {
    const { action, data } = await req.json();
    
    if (action === 'payment.created') {
      // Actualizar estado suscripción en BD
      await supabase
        .from('usuarios')
        .update({ estado_suscripcion: 'activa' })
        .eq('id', data.external_reference);
    }
  }
});
```

---

## 7. Crons y Jobs Asíncronos

### 7.1 Tareas Programadas
Usar **Supabase Cron Job** o **External Cron Service** (EasyCron gratis):

| Tarea | Frecuencia | Función |
|-------|-----------|---------|
| Sincronizar Meta Ads | Cada hora | `sync-meta-data` |
| Sincronizar Dropi | Cada 30 min | `sync-dropi-data` |
| Sincronizar Shopify | Cada hora | `sync-shopify-data` |
| Enviar notificaciones | Cada 5 min | `enviar-notificaciones` |
| Limpiar sesiones expiradas | Diario (2am) | `limpiar-sesiones` |
| Generar reportes | Semanal (lunes 8am) | `generar-reportes` |
| Renovar tokens | Diario | `renovar-tokens-integracion` |

### 7.2 Ejemplo: Cron con EasyCron
```
URL: https://your-project.supabase.co/functions/v1/sync-meta-data
Frecuencia: 0 * * * * (cada hora)
Autenticación: Authorization: Bearer SUPABASE_ANON_KEY
```

---

## 8. Almacenamiento de Archivos

### 8.1 Supabase Storage
- **Logos tiendas:** `/tiendas/{tienda_id}/logo`
- **Archivos CSV:** `/tiendas/{tienda_id}/csv-imports`
- **PDFs reportes:** `/usuarios/{user_id}/reportes`
- **Acceso:** Público (logos), Privado (reportes)

```javascript
// Subir logo tienda
const { data, error } = await supabase.storage
  .from('files')
  .upload(`tiendas/${tiendaId}/logo`, file, {
    cacheControl: '3600',
    upsert: true
  });
```

---

## 9. Generación de Reportes

### 9.1 PDF y Excel
- **Librería PDF:** PDFKit (Node.js)
- **Librería Excel:** ExcelJS (Node.js)
- **Ubicación Generación:** Supabase Edge Function
- **Storage:** Guardar en Supabase Storage con URL temporal

```javascript
// Función: generar-pdf
export async function generatePDF(costeoData) {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument();
  
  // Agregar contenido
  doc.fontSize(25).text('Reporte de Costeo', 100, 100);
  doc.fontSize(12).text(`Producto: ${costeoData.nombre_producto}`);
  
  // Retornar buffer
  return doc;
}
```

---

## 10. Notificaciones

### 10.1 Email
- **Proveedor:** SendGrid (200 emails/día gratis) o Resend
- **Templates:** Base de datos con HTML
- **Disparadores:** Registro, verificación, 2FA, cambio plan, etc

### 10.2 In-App
- **Sistema:** Toast notifications + Notification Center
- **Almacenamiento:** Tabla `notificaciones` en BD
- **Real-time:** Supabase Realtime (WebSocket)

```javascript
// Escuchar notificaciones en tiempo real
supabase
  .from(`notificaciones:usuario_id=eq.${userId}`)
  .on('INSERT', (payload) => {
    console.log('Nueva notificación:', payload.new);
  })
  .subscribe();
```

---

## 11. IA y Recomendaciones

### 11.1 Insights IA
- **Proveedor:** OpenAI API (GPT-4 o modelo más económico)
- **Endpoint:** `/functions/v1/generar-insights`
- **Input:** KPIs, parámetros costeo
- **Output:** Recomendación texto contextualizado
- **Caching:** Guardar insights 24h para evitar llamadas repetidas

```javascript
// Generar insight IA
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generarInsight(kpis) {
  const prompt = `Analiza estos KPIs y da una recomendación breve:
    CPA: ${kpis.cpa}
    Margen: ${kpis.margen}%
    Tasa entrega: ${kpis.tasa_entrega}%`;
    
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150
  });
  
  return response.choices[0].message.content;
}
```

---

## 12. Monitoreo y Logging

### 12.1 Logging
- **Proveedor:** Supabase Logs (integrado) + LogRocket (opcional)
- **Niveles:** ERROR, WARN, INFO, DEBUG
- **Storage:** Tabla `audit_logs` en BD

### 12.2 Monitoreo
- **Performance:** Vercel Analytics (frontend)
- **Uptime:** UptimeRobot (gratuito)
- **Errores:** Sentry (gratuito)

```env
SENTRY_DSN=your_sentry_dsn
```

---

## 13. Deployment

### 13.1 Frontend
```bash
# Build
npm run build

# Opción 1: Deploy Vercel
vercel deploy

# Opción 2: Deploy Hostinger FTP
# Subir carpeta 'dist' a public_html/
```

### 13.2 Backend (Supabase Functions)
```bash
# Deploy función
supabase functions deploy auth/register

# Ver logs
supabase functions logs auth/register
```

### 13.3 CI/CD
- **GitHub Actions** para auto-deploy en push a main
- Correr tests
- Build frontend
- Deploy a Vercel
- Deploy funciones a Supabase

```yaml
# .github/workflows/deploy.yml
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build
        run: npm run build
      - name: Deploy Vercel
        run: vercel deploy --prod
```

---

## 14. Variables de Entorno

### 14.1 Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE_URL=https://your-project.supabase.co/functions/v1
VITE_ENVIRONMENT=production
```

### 14.2 Backend (.env.local - Supabase)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_secret
DROPI_API_KEY=your_dropi_key
SHOPIFY_API_KEY=your_shopify_key
SENDGRID_API_KEY=your_sendgrid_key
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

---

## 15. Roadmap Técnico

| Fase | Duración | Tareas |
|------|----------|--------|
| **1. MVP** | 8 semanas | Auth, Simulador, Dashboard básico |
| **2. Integraciones** | 4 semanas | Meta, Dropi, Shopify (CSV primero) |
| **3. Admin Panel** | 3 semanas | Gestión usuarios, planes, reportes |
| **4. Análisis Regional** | 2 semanas | Mapas, benchmarks |
| **5. Pulido** | 2 semanas | Tests, optimización, documentación |

---

## 16. Consideraciones Finales

✅ **Ventajas de esta arquitectura:**
- Sin costo de VPS (Supabase tiene plan gratuito)
- Escalable automáticamente
- Seguridad gestionada
- Datos aislados por tienda
- Deploy simple con CI/CD

⚠️ **Limitaciones:**
- Supabase plan gratis tiene límites (límpieza BD 1 semana inactividad)
- Edge Functions limitadas en plan gratis
- CSV upload manual en fase 1

**Presupuesto Estimado:**
- **Desarrollo:** ~2-3 meses (equipo de 2-3 personas)
- **Hosting Anual:** $0-50 (Supabase gratuito + Vercel gratuito + SendGrid gratuito)
- **Escalado (10k+ usuarios):** ~$100-300/mes (Supabase Pro + APIs)

---

**Fin del Documento**
