# Integración - Sistema de Referidos a DropCost Master
## Roadmap y Secuencia de Implementación

**Versión:** 1.0  
**Fecha:** Febrero 2026

---

## 1. Ubicación en Timeline de Desarrollo

```
FASE 1: Autenticación (Sem 1-2) ✅
FASE 2: Simulador (Sem 3-5) ✅
FASE 3: Tiendas (Sem 5) ✅
FASE 4: Integraciones (Sem 6-7) ✅
FASE 5: Dashboard (Sem 8-9) ✅
FASE 6: Regional (Sem 10) ✅
FASE 7: Config + Admin (Sem 11-12) ✅

🔴 FASE 8: SISTEMA DE REFERIDOS (Sem 13-14) ← NUEVO
├─ RF-064 a RF-078 (15 nuevos requerimientos)
├─ 5 tablas BD nuevas
├─ 6 endpoints API nuevos
└─ Panel Admin + UI usuario

FASE 9: Testing + Deploy (Sem 15-16)
```

---

## 2. Dependencias Previas

**Antes de implementar Sistema de Referidos, se REQUIERE:**

✅ **Autenticación completada** (RF-001 a RF-006)
- Login, registro, 2FA funcionales
- JWT tokens activos
- Sessions manejadas

✅ **Planes implementados** (RF-037 a RF-041)
- Plans creados (Básico, Pro, Enterprise)
- Cambio de planes funcionando
- Webhook de pago integrado

✅ **Pasarela de Pago** (Mercado Pago o Stripe)
- Pagos procesados
- Webhooks de confirmación
- Transacciones registradas

✅ **Admin Panel básico** (RF-042 a RF-050)
- Gestión usuarios
- Gestión planes
- Acceso admin implementado

---

## 3. Nuevos Requerimientos (RF-064 a RF-078)

| RF | Nombre | Complejidad |
|----|--------|-------------|
| RF-064 | Crear Líder de Comunidad (Admin) | Media |
| RF-065 | Editar Código de Referido | Media |
| RF-066 | Panel Líder Detallado | Alta |
| RF-067 | Landing Registro con Código | Media |
| RF-068 | Validar Código en Registro | Media |
| RF-069 | Guardar Referido en Registro | Baja |
| RF-070 | Pantalla "Mi Código de Referido" | Media |
| RF-071 | Wallet de Referidos | Alta |
| RF-072 | Flujo Retiro de Comisión | Alta |
| RF-073 | Cron Job - Procesar Retiros | Alta |
| RF-074 | Tabla Referidos en Admin | Baja |
| RF-075 | Webhook Pago - Generar Comisión | Alta |
| RF-076 | Validar Disponibilidad Código | Media |
| RF-077 | Datos Bancarios para Retiro | Media |
| RF-078 | Notificaciones Referidos | Baja |

---

## 4. Estructura de Carpetas

```
src/
├── components/
│   ├── referidos/
│   │   ├── CodigoReferido.tsx
│   │   ├── WalletReferidos.tsx
│   │   ├── RetiroModal.tsx
│   │   ├── LandinReferido.tsx
│   │   └── TablaLideres.tsx
│   │
│   └── ... (existentes)
│
├── pages/
│   ├── registro.tsx (ACTUALIZAR - agregar lógica referido)
│   ├── referidos/
│   │   ├── mi-codigo.tsx
│   │   └── mi-wallet.tsx
│   │
│   └── admin/
│       └── referidos/ (NUEVO)
│           ├── index.tsx
│           ├── [lider_id].tsx
│           └── crear.tsx
│
├── services/
│   ├── referidosService.ts (NUEVO)
│   └── ...
│
├── store/
│   ├── referidosStore.ts (NUEVO - Zustand)
│   └── ...
│
├── hooks/
│   ├── useReferidos.ts (NUEVO)
│   └── ...
│
├── types/
│   ├── referidos.ts (NUEVO)
│   └── ...
│
└── supabase/
    └── functions/
        ├── referidos/
        │   ├── crear-lider.ts
        │   ├── validar-codigo.ts
        │   ├── procesar-retiro-cron.ts
        │   └── generar-comision.ts (webhook)
        │
        └── ... (existentes)
```

---

## 5. Tablas BD Nuevas

```sql
-- 5 tablas nuevas (ver especificación requerimientos)
1. referidos_lideres
2. referidos_usuarios
3. comisiones_referidos
4. wallet_referidos
5. retiros_referidos
+ 1 tabla nueva: wallet_movimientos

-- Actualizar tabla existente
ALTER TABLE users ADD COLUMN codigo_referido_personal VARCHAR;
```

---

## 6. Cambios en Tablas Existentes

### Tabla: users
```sql
ALTER TABLE users ADD COLUMN (
  codigo_referido_personal VARCHAR UNIQUE,
  wallet_saldo NUMERIC DEFAULT 0
);
```

### Tabla: registros (al registrarse)
```sql
-- Agregar columna al procesar registro
referido_codigo VARCHAR, -- Qué código usó para registrarse
referido_lider_id UUID, -- ID del líder que lo refirió
```

---

## 7. Endpoints API Nuevos (6 totales)

```
POST /api/referidos/crear-lider
PUT /api/referidos/{lider_id}/editar-codigo
GET /api/referidos/validar?ref=ivan_caicedo
GET /api/referidos/usuario/mi-codigo
GET /api/referidos/usuario/wallet
POST /api/referidos/usuario/solicitar-retiro
GET /api/referidos/codigo-disponible?codigo=...
```

---

## 8. Modificaciones a Endpoints Existentes

### POST /auth/register (ACTUALIZAR)
```
Nuevo parámetro optional:
- codigo_referido: "ivan_caicedo"

Lógica nueva:
1. Validar código si existe
2. Si válido: guardar en tabla referidos_usuarios
3. Aplicar descuento automáticamente
4. Crear wallet si no existe
```

### POST /pagos/webhook-mercadopago (ACTUALIZAR)
```
Nueva lógica:
1. Procesar pago normalmente
2. Verificar si usuario tiene referido_codigo
3. Si tiene: generar comisión
   - Calcular: monto × porcentaje_comisión / 100
   - Crear registro comisiones_referidos
   - Actualizar wallet.saldo
```

---

## 9. Cron Jobs (Background Tasks)

### 1. Procesar Retiros (Semanal)

```
Frecuencia: Viernes 10:00 AM
Función: referidos/procesar-retiro-cron

Pasos:
1. GET retiros con estado='solicitado'
2. Para cada retiro:
   - Llamar Transfer Wise API
   - Crear transferencia
   - Actualizar estado → 'procesado'
   - Restar de wallet empresa
3. Enviar email confirmación
```

### 2. Generar Reporte Comisiones (Diario)

```
Frecuencia: Cada medianoche (opcional)
Acción: Calcular comisiones pendientes por cobrar
```

---

## 10. Integraciones Externas

### Transfer Wise API
```
Endpoint: https://api.transferwise.com/v1/transfers
Parámetros: API key (en variables entorno)
Uso: Procesar retiros automáticamente
```

---

## 11. Orden de Desarrollo Recomendado

### Semana 1: Base de Datos + APIs
- [ ] Crear 5 tablas BD nuevas
- [ ] Implementar RLS policies
- [ ] Crear 6 endpoints API básicos
- [ ] Testing BD + endpoints

### Semana 2: Panel Admin
- [ ] Crear página admin referidos
- [ ] Panel detallado líder
- [ ] Editar código de referido
- [ ] Tabla líderes

### Semana 2-3: Landing Registro
- [ ] Actualizar página registro
- [ ] Mostrar nombre líder
- [ ] Validar código en tiempo real
- [ ] Aplicar descuento automático

### Semana 3: Wallet Usuario
- [ ] Pantalla "Mi código de referido"
- [ ] Pantalla "Mi wallet"
- [ ] Mostrar movimientos
- [ ] Botón retiro

### Semana 3-4: Retiros + Cron
- [ ] Modal solicitar retiro
- [ ] Integración Transfer Wise
- [ ] Cron job procesar (viernes)
- [ ] Emails confirmación

### Semana 4: Testing + Polish
- [ ] Tests unitarios (validaciones)
- [ ] Tests E2E (flujo completo)
- [ ] Testing manual
- [ ] Bug fixes

### Semana 4-5: Launch
- [ ] Deploy staging
- [ ] Testing final
- [ ] Onboarding primer líder (Ivan Caicedo)
- [ ] Deploy producción

---

## 12. Cambios en Página Registro

**ANTES:**
```
Registro
├─ Email: [____]
├─ Contraseña: [____]
├─ Nombre: [____]
└─ [Crear cuenta]
```

**DESPUÉS:**
```
┌─────────────────────────────────────┐
│ ✅ Invitado por: Comunidad Ivan... │  ← NUEVO
└─────────────────────────────────────┘

Registro
├─ Email: [____]
├─ Contraseña: [____]
├─ Nombre: [____]
├─ Código referido: ivan_caicedo (pre-llenado) ← NUEVO
│  └─ Descuento 15% aplicado: -$7.500 ← NUEVO
└─ [Crear cuenta]
```

---

## 13. Cambios en Flujo de Pago

**ANTES:**
```
Cliente paga $50.000
  ↓ Webhook
BD: usuario.plan_id = "pro"
Fin
```

**DESPUÉS:**
```
Cliente paga $50.000 (usuario tiene referido_codigo)
  ↓ Webhook
1. BD: usuario.plan_id = "pro"
2. Comisión = $50.000 × 25% = $12.500
3. Crear registro comisiones_referidos
4. wallet_lider.saldo += $12.500
5. Email notificación al líder
Fin
```

---

## 14. Seguridad & Compliance

### Validaciones
- ✅ Código único
- ✅ Usuario solo puede tener 1 referidor
- ✅ Líder debe tener cuenta bancaria verificada
- ✅ Retiro >= $10.000 mínimo

### KYC (Conoce a tu Cliente)
- Cédula/DNI
- Comprobante domicilio
- Verificación bancaria (micro-depósito)

### Anti-Fraude
- Limits por retiro
- Limites diarios/mensuales
- Alertas cambio cuenta

---

## 15. Documentación a Actualizar

### Especificación General del Proyecto
- [ ] Agregar RFs 064-078 a especificación general
- [ ] Actualizar arquitectura técnica
- [ ] Actualizar diagrama BD (tablas nuevas)

### Documentación de Usuario
- [ ] FAQ: ¿Cómo funciona el sistema de referidos?
- [ ] Tutorial: Cómo compartir tu código
- [ ] Tutorial: Cómo retirar comisiones
- [ ] Video: Flujo completo (opcional)

### Documentación Técnica
- [ ] API Docs: Endpoints nuevos
- [ ] Descripción tablas BD nuevas
- [ ] Flujo webhook pago → comisión

---

## 16. Matriz de Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|-----------|
| Usuario se registra sin código válido | Baja | Permitir registro sin referido |
| Comisión no se genera en webhook | Media | Tests exhaustivos webhook |
| Transfer Wise API falla | Baja | Fallback a pago manual |
| Usuario falsifica datos bancarios | Baja | KYC + verificación micro-depósito |
| Retiro demora >3 días | Media | Comunicar delays en email |

---

## 17. Go-Live Checklist

- [ ] Todas las tablas BD creadas
- [ ] Todos los endpoints API funcionan
- [ ] Panel admin operacional
- [ ] Landing registro con referido funciona
- [ ] Wallet usuario funciona
- [ ] Retiros procesan automáticamente
- [ ] Transfer Wise integrado
- [ ] Emails se envían correctamente
- [ ] Tests unitarios pasan (>80% coverage)
- [ ] Tests E2E pasan (flujo completo)
- [ ] Admin ha testeado con datos reales
- [ ] Documentación actualizada
- [ ] Deploy a staging ✅
- [ ] Deploy a producción ✅

---

## 18. Post-Launch (Primeros 30 días)

**Día 1-7:**
- Monitorear errores en Sentry
- Feedback usuarios sobre referidos
- Verificar que Transfer Wise procesa bien
- Bug fixes críticos

**Día 8-14:**
- Contactar a Ivan Caicedo con info
- Proponer partnership oficial
- Ofrecer datos dashboard
- Preparar contenido colaborativo

**Día 15-30:**
- Ivan comienza a promocionar código
- Monitorear tasa de referidos
- Validar ROI modelo
- Escalar a más líderes (Melina Soto, etc)

---

**Fin Documento de Integración - Sistema de Referidos**
