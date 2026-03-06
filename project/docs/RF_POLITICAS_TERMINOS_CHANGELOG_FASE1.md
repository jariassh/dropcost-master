# REQUISITO FUNCIONAL: TÉRMINOS, PRIVACIDAD, CHANGELOG + NOTIFICACIONES
**DropCost Master**  
**Versión:** 1.0  
**Estado:** Especificación Final  
**Fecha:** 26 de febrero de 2026

---

## I. DESCRIPCIÓN GENERAL

Sistema completo de gestión de Términos y Condiciones + Política de Privacidad con:
- Versionado automático
- Historial de cambios
- Sistema de notificación por email
- Implementación en 3 fases (Backend → Plantilla → Deploy)

---

## II. ESTRUCTURA GENERAL

```
FASE 1: BACKEND + BD (THIS DOCUMENT)
├─ Tabla policy_versions
├─ Edge Function notificación
├─ Trigger logic
└─ SIN enviar emails aún

FASE 2: PLANTILLA EMAIL (SEPARATE)
├─ Template MJML
├─ Prueba en editor
└─ Validación

FASE 3: DEPLOY
├─ Guardar versión actual como v1.0
├─ Crear v2.0 con nuevos documentos
├─ Activar trigger
├─ Enviar notificaciones
└─ Publicar
```

---

## III. FASE 1: BACKEND + DATABASE

### 3.1 Tablas BD Requeridas

**Tabla: policy_versions**

```sql
CREATE TABLE policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  tipo VARCHAR(50) NOT NULL, -- 'terminos' | 'privacidad'
  version VARCHAR(10) NOT NULL, -- 'v1.0', 'v2.0', etc
  
  -- Contenido
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL, -- HTML completo
  resumen_cambios TEXT, -- Lista de cambios (v1.0 vs v2.0)
  
  -- Metadatos
  fecha_publicacion TIMESTAMP DEFAULT NOW(),
  fecha_efectiva TIMESTAMP, -- Cuándo entra en vigor
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'borrador', -- 'borrador' | 'actual' | 'archivada'
  
  -- Notificación
  usuarios_notificados BOOLEAN DEFAULT false,
  fecha_notificacion TIMESTAMP,
  cantidad_notificados INT DEFAULT 0,
  
  -- Auditoría
  creado_por UUID REFERENCES auth.users(id),
  actualizado_en TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_tipo_version UNIQUE(tipo, version),
  CONSTRAINT valid_version CHECK (version ~ '^v[0-9]+\.[0-9]+$')
);

CREATE INDEX idx_policy_tipo ON policy_versions(tipo);
CREATE INDEX idx_policy_estado ON policy_versions(estado);
CREATE INDEX idx_policy_fecha ON policy_versions(fecha_publicacion);
```

**Tabla: policy_notifications_log**

```sql
CREATE TABLE policy_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  policy_version_id UUID NOT NULL REFERENCES policy_versions(id),
  
  -- Usuario notificado
  user_id UUID NOT NULL REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  
  -- Envío
  enviado_en TIMESTAMP DEFAULT NOW(),
  estado_envio VARCHAR(50), -- 'enviado' | 'fallido' | 'rebotado'
  
  -- Auditoría
  ip_address VARCHAR(255),
  user_agent TEXT
);

CREATE INDEX idx_notifications_policy ON policy_notifications_log(policy_version_id);
CREATE INDEX idx_notifications_user ON policy_notifications_log(user_id);
CREATE INDEX idx_notifications_fecha ON policy_notifications_log(enviado_en);
```

---

### 3.2 Edge Functions Requeridas

**FUNCIÓN 1: obtener-version-actual**

```
GET /api/politicas/obtener/[tipo]

Parámetros:
- tipo: 'terminos' | 'privacidad'

Lógica:
1. SELECT FROM policy_versions 
   WHERE tipo = [tipo] AND estado = 'actual'
2. Retornar contenido HTML completo

Response:
{
  "version": "v2.0",
  "titulo": "Términos y Condiciones",
  "contenido": "<html>...</html>",
  "fecha_publicacion": "2026-02-26T00:00:00Z",
  "estado": "actual"
}

RLS: Public (cualquiera puede ver)
```

---

**FUNCIÓN 2: obtener-changelog**

```
GET /api/politicas/changelog/[tipo]

Parámetros:
- tipo: 'terminos' | 'privacidad'

Lógica:
1. SELECT FROM policy_versions 
   WHERE tipo = [tipo]
   ORDER BY fecha_publicacion DESC
2. Retornar todas las versiones con resumen

Response:
{
  "tipo": "terminos",
  "versiones": [
    {
      "version": "v2.0",
      "fecha": "2026-02-26T00:00:00Z",
      "estado": "actual",
      "cambios": "Agregado Módulo Contactos, actualizada Sección 7...",
      "usuarios_notificados": false
    },
    {
      "version": "v1.0",
      "fecha": "2026-02-23T00:00:00Z",
      "estado": "archivada",
      "cambios": "Versión inicial"
    }
  ]
}

RLS: Public
```

---

**FUNCIÓN 3: guardar-version-borrador** (Admin only)

```
POST /api/politicas/guardar-borrador

Request:
{
  "tipo": "terminos" | "privacidad",
  "version": "v2.0",
  "titulo": "Términos y Condiciones",
  "contenido": "<html>...</html>",
  "resumen_cambios": "- Agregado Módulo Contactos..."
}

Lógica:
1. Validar que tipo es válido
2. Validar que version NO existe aún
3. INSERT INTO policy_versions (estado = 'borrador')
4. Retornar id de versión para referencia

Response:
{
  "success": true,
  "policy_version_id": "uuid",
  "mensaje": "Borrador guardado. ID: uuid"
}

Validación:
- Solo Admin puede hacer esto
- Version no puede duplicarse
- Contenido no vacío

RLS: Admin only
```

---

**FUNCIÓN 4: preparar-notificacion** (CRITICAL - SIN ENVIAR EMAILS AÚN)

```
POST /api/politicas/preparar-notificacion

Request:
{
  "policy_version_id": "uuid",
  "tipo": "terminos" | "privacidad"
}

Lógica:
1. Validar que policy_version_id existe y estado = 'borrador'
2. Cambiar estado de 'borrador' → 'listo_notificar' (NUEVO estado)
3. NO cambiar a 'actual' aún
4. Obtener lista de usuarios: SELECT DISTINCT user_id FROM tiendas
5. Crear registros EN MEMORIA (no guardar aún):
   └─ Para cada usuario: { user_id, email, template_data }
6. Retornar confirmación SIN ENVIAR EMAILS

Response:
{
  "success": true,
  "status": "listo_notificar",
  "usuarios_a_notificar": 342,
  "tipo": "terminos",
  "version": "v2.0",
  "mensaje": "Sistema listo para enviar notificaciones. PASO SIGUIENTE: Crear plantilla MJML"
}

IMPORTANTE:
└─ En este punto: NO se han enviado emails
└─ Solo se preparó la lista de usuarios
└─ Estado = 'listo_notificar' (NO 'actual' aún)

RLS: Admin only
```

---

**FUNCIÓN 5: enviar-notificaciones** (FASE 2 - DESPUÉS de plantilla)

```
POST /api/politicas/enviar-notificaciones

Request:
{
  "policy_version_id": "uuid",
  "template_mjml": "..." (enviada por admin)
}

Lógica:
1. Validar que policy_version_id existe y estado = 'listo_notificar'
2. Validar que template_mjml es válido
3. Para CADA usuario registrado:
   ├─ Compilar template MJML con datos:
   │  ├─ nombre usuario
   │  ├─ tipo (terminos | privacidad)
   │  ├─ version (v2.0)
   │  ├─ cambios resumen
   │  ├─ link a changelog
   │  └─ fecha efectiva
   ├─ Enviar vía Resend (o email service)
   ├─ Guardar en policy_notifications_log:
   │  ├─ user_id
   │  ├─ email
   │  ├─ estado_envio
   │  ├─ timestamp
   │  └─ ip_address
   └─ Logging de fallos (reintentos)
4. Al finalizar:
   └─ UPDATE policy_versions SET usuarios_notificados = true
   └─ UPDATE policy_versions SET fecha_notificacion = NOW()
   └─ UPDATE policy_versions SET cantidad_notificados = X

Response:
{
  "success": true,
  "status": "notificaciones_enviadas",
  "total_enviados": 342,
  "fallidos": 0,
  "mensaje": "Notificaciones enviadas. PASO SIGUIENTE: Actualizar a estado 'actual'"
}

RLS: Admin only
```

---

**FUNCIÓN 6: activar-version** (FASE 3 - DESPUÉS de notificaciones)

```
POST /api/politicas/activar-version

Request:
{
  "policy_version_id": "uuid"
}

Lógica:
1. Validar que policy_version_id existe
2. Validar que estado = 'notificaciones_enviadas' (o listo_notificar si sin emails)
3. UPDATE policy_versions:
   ├─ SET estado = 'actual'
   ├─ SET fecha_efectiva = NOW()
   └─ Cambiar versión anterior de 'actual' → 'archivada'
4. Verificar que solo UNA versión es 'actual' por tipo

Response:
{
  "success": true,
  "status": "actual",
  "mensaje": "Versión v2.0 de terminos ahora es la ACTUAL"
}

RLS: Admin only
```

---

### 3.3 Estados de Versión

```
FLUJO DE ESTADOS (IMPORTANTE):

Borrador
   ↓ (admin guarda)
Listo Notificar
   ↓ (admin prepara notificación)
Notificaciones Preparadas (EN MEMORIA, no guardadas)
   ↓ (admin aprueba plantilla + envía)
Notificaciones Enviadas
   ↓ (auditoría: verificar emails enviados)
Actual
   ↓ (después de validación)
Archivada

ESTADO INTERMEDIARIO:
└─ 'listo_notificar' = seguro, NO envía emails aún
└─ Permite validar datos ANTES de comprometer
```

---

## IV. NUEVOS DOCUMENTOS - ESTRUCTURA

### 4.1 TÉRMINOS Y CONDICIONES v2.0

**Mantener estructura actual (13 secciones) + Agregar:**

```
Sección 14: MÓDULO CONTACTOS

14.1 Descripción del Módulo
- Qué es: herramienta de gestión de contactos de clientes
- Cómo funciona: sincroniza datos de órdenes Shopify
- Responsabilidad: usuario es controller de datos

14.2 Responsabilidad del Usuario
- Usuario es responsable del tratamiento de datos
- Usuario debe cumplir GDPR/leyes locales
- Usuario debe informar a sus clientes
- Usuario debe responder a ARPA/GDPR requests

14.3 Limitaciones de DropCost
- DropCost es intermediario, no controller
- DropCost no es responsable de uso posterior
- DropCost no responde a requests de clientes de usuario
- Datos descargados = fuera de scope DropCost

14.4 Uso Aceptable
- Solo para relación comercial directa
- NO vender a terceros
- NO spam
- NO violación de privacidad

14.5 Cese de Servicio
- Si usuario cancela: datos se eliminan en 30 días
- Datos descargados ANTES: responsabilidad usuario
```

---

### 4.2 POLÍTICA PRIVACIDAD v2.0

**Mantener estructura actual (11 secciones) + Expandir/Agregar:**

```
EXPANDIR Sección 7: Sus Derechos

7.1 Derechos GDPR (ya existe)
- Acceder, Rectificar, Eliminar, Exportar, Limitar, etc.

NUEVA SUBSECCIÓN 7.2: Módulo Contactos - Responsabilidad

7.2 Módulo Contactos - Responsabilidad del Usuario

Si habilitas el Módulo de Contactos en DropCost:

El usuario (propietario de tienda) acepta ser responsable 
del tratamiento de datos de sus clientes descargados desde 
DropCost Master. Esto incluye:

- Almacenamiento seguro de los datos
- Cumplimiento de leyes locales (GDPR si aplica, CCPA, etc)
- Respuesta a solicitudes de acceso/eliminación de clientes
- No usar datos para fines distintos a relación comercial directa
- Informar a clientes que datos se procesan vía DropCost

DropCost Master actúa como intermediario de datos, 
NO como responsable del tratamiento. El usuario es quien 
contrata directamente con sus clientes y debe informarles 
que sus datos se procesan a través de esta plataforma.

Descargo de Responsabilidad:
- DropCost no es responsable de mal uso de datos descargados
- DropCost no responde a requests GDPR de clientes finales
- Datos descargados están fuera del scope de DropCost
- Usuario asume riesgos legales de regulaciones locales

Auditoría:
- DropCost guarda registro de fecha/hora de aceptación 
  de esta responsabilidad
- DropCost guarda log de descargas (fecha, formato, cantidad)
- Esto es para transparencia legal
```

---

## V. CHANGELOG - PÁGINA DEDICADA

**Crear página: /politicas/changelog**

```
Estructura:

┌─────────────────────────────────────────┐
│ 📜 HISTORIAL DE CAMBIOS                 │
│ Términos y Condiciones + Política       │
└─────────────────────────────────────────┘

VERSIONES - TÉRMINOS Y CONDICIONES:

v2.0 - 26 de febrero de 2026 (ACTUAL)
├─ ✨ NUEVA: Sección 14 - Módulo Contactos
├─ 📝 ACTUALIZADA: Limitaciones de responsabilidad
├─ 🔄 MEJORADA: Claridad sobre datos descargados
├─ Usuarios notificados: ✅ Sí (26 feb 11:00 AM)
└─ Cantidad notificados: 342 usuarios
   [Ver versión anterior ▼]

v1.0 - 23 de febrero de 2026 (ARCHIVADA)
└─ 📅 Versión inicial de plataforma
   [Ver versión completa ▼]

─────────────────────────────────────────

VERSIONES - POLÍTICA PRIVACIDAD:

v2.0 - 26 de febrero de 2026 (ACTUAL)
├─ ✨ NUEVA: Sección 7.2 - Módulo Contactos
├─ 📝 ACTUALIZADA: Responsabilidad usuario
├─ 🔄 MEJORADA: Claridad GDPR
├─ Usuarios notificados: ✅ Sí (26 feb 11:00 AM)
└─ Cantidad notificados: 342 usuarios
   [Ver versión anterior ▼]

v1.0 - 23 de febrero de 2026 (ARCHIVADA)
└─ 📅 Versión inicial de plataforma
   [Ver versión completa ▼]

─────────────────────────────────────────

COMPARATIVA DE CAMBIOS (v1.0 vs v2.0):

Términos y Condiciones:
┌─────────────────────────────────────────┐
│ - Sección 14 agregada (Módulo Contactos)│
│ - Párrafo 3 actualizado en Sección 8    │
│ - Nota legal en Sección 13 mejorada     │
└─────────────────────────────────────────┘

Política Privacidad:
┌─────────────────────────────────────────┐
│ - Nueva subsección 7.2 (Módulo)         │
│ - Aclaraciones GDPR en Sección 3        │
│ - Contacto actualizado en Sección 11    │
└─────────────────────────────────────────┘
```

---

## VI. NOTIFICACIÓN POR EMAIL - VARIABLES TEMPLATE

**Email debe contener estas variables (MJML):**

```
Básicas:
- {{ usuario_nombre }}
- {{ usuario_email }}

Política:
- {{ tipo }} (terminos | privacidad)
- {{ version }} (v2.0)
- {{ fecha_publicacion }} (26 de febrero de 2026)
- {{ fecha_efectiva }} (cuando entra en vigor)

Cambios:
- {{ cambios_resumen }} (lista de cambios principales)
- {{ url_changelog }} (link a página changelog)
- {{ url_documento_actual }} (link a nuevo documento)
- {{ url_version_anterior }} (link a versión v1.0)

Branding:
- {{ logo_url }}
- {{ empresa_nombre }} (DropCost Master)
- {{ empresa_email }} (soporte@...)
- {{ empresa_sitio }} (https://dropcost.jariash.com)
```

---

## VII. CHECKLIST FASE 1 (Backend)

- [ ] Tabla `policy_versions` creada
- [ ] Tabla `policy_notifications_log` creada
- [ ] Edge Function 1: `obtener-version-actual` ✅
- [ ] Edge Function 2: `obtener-changelog` ✅
- [ ] Edge Function 3: `guardar-version-borrador` ✅
- [ ] Edge Function 4: `preparar-notificacion` ✅ (SIN EMAILS)
- [ ] Edge Function 5: `enviar-notificaciones` (placeholder, esperar plantilla)
- [ ] Edge Function 6: `activar-version` ✅
- [ ] Página /politicas/changelog creada ✅
- [ ] Nuevos documentos (Términos v2.0 + Privacidad v2.0) listos para Fase 2

---

## VIII. FLUJO FASE 1 → FASE 2 → FASE 3

```
FASE 1 (Ahora): Backend + BD
├─ ✅ Crear tablas
├─ ✅ Crear Edge Functions
├─ ✅ Documento: Términos v2.0 + Privacidad v2.0
└─ ✅ Página changelog

FASE 2 (Próximo): Plantilla MJML
├─ Admin copia plantilla en editor
├─ Admin personaliza con variables
├─ Admin testea email
└─ Admin aprueba

FASE 3 (Final): Deploy
├─ ejecutar: preparar-notificacion (list usuarios en memoria)
├─ ejecutar: enviar-notificaciones (con plantilla MJML)
├─ Validar: policy_notifications_log tiene registros
├─ ejecutar: activar-version (cambiar estado a 'actual')
└─ ✅ LIVE
```

---

## IX. IMPORTANTE - NO REGRESIÓN

**CRÍTICO:**

```
❌ NO cambiar estado a 'actual' hasta Fase 3
❌ NO enviar emails sin plantilla MJML validada
❌ NO cambiar versión anterior a 'archivada' hasta activar

✅ SÓLO cuando:
├─ Fase 1 terminada (todas tablas + functions)
├─ Fase 2 terminada (plantilla MJML aprobada)
├─ Admin manualmente ejecuta: preparar-notificacion
├─ Admin manualmente ejecuta: enviar-notificaciones
├─ Admin verifica: policy_notifications_log (emails enviados)
└─ Admin ejecuta: activar-version
```

---

**FASE 1 LISTA PARA IMPLEMENTAR** ✅

**PRÓXIMO: Esperar plantilla MJML (Fase 2)**

