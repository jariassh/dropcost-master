# Especificación de Requerimientos - Sistema de Triggers y Plantillas Email
## DropCost Master

**Versión:** 2.0 (Finalizado con 19 eventos automáticos)  
**Fecha:** Febrero 2026  
**Requerimientos:** RF-161 a RF-167  
**Implementador:** Antigravity

---

## 1. Resumen Ejecutivo

Sistema de **disparo automático de emails** basado en cambios en base de datos.

**Lógica:**
```
Cambio en BD ocurre → Se detecta evento → Busca plantilla asociada → Si existe → Envía email
                                                                    → Si NO existe → No envía
```

**Características:**
- 19 triggers automáticos (se disparan por cambios en BD)
- Panel admin para crear/editar plantillas
- Selector de trigger al crear plantilla
- Sistema que dispara email automáticamente

---

## 2. Lista de 19 Triggers (Eventos Automáticos)

### USUARIO (10 eventos)

```
1. USUARIO_REGISTRADO
   Cuándo: Usuario se crea en tabla users (INSERT)
   Cambio BD: INSERT en users
   Variables disponibles: ${usuario_nombre}, ${usuario_email}, ${fecha_registro}, ${codigo_referido}
   Ejemplo: "Bienvenido ${usuario_nombre}, tu código referido es ${codigo_referido}"

2. USUARIO_OLVIDO_CONTRASENA
   Cuándo: Se genera token de reset (INSERT en password_resets)
   Cambio BD: INSERT en password_resets
   Variables disponibles: ${usuario_nombre}, ${usuario_email}, ${reset_link}, ${expira_en}
   Ejemplo: "Haz clic aquí para cambiar tu contraseña: ${reset_link}"

3. 2FA_CODIGO_CONFIRMACION
   Cuándo: Se genera código 2FA (INSERT en 2fa_codes)
   Cambio BD: INSERT en 2fa_codes
   Variables disponibles: ${usuario_nombre}, ${codigo_2fa}, ${expira_en}, ${intentos_restantes}
   Ejemplo: "Tu código 2FA es: ${codigo_2fa} (válido por 10 minutos)"

4. 2FA_ACTIVADO
   Cuándo: Usuario activa 2FA (UPDATE users.dos_factor_activo = true)
   Cambio BD: UPDATE en users (dos_factor_activo: false → true)
   Variables disponibles: ${usuario_nombre}, ${fecha_activacion}, ${dispositivo}
   Ejemplo: "Autenticación en 2 pasos ACTIVADA el ${fecha_activacion}"

5. 2FA_DESACTIVADO
   Cuándo: Usuario desactiva 2FA (UPDATE users.dos_factor_activo = false)
   Cambio BD: UPDATE en users (dos_factor_activo: true → false)
   Variables disponibles: ${usuario_nombre}, ${fecha_desactivacion}
   Ejemplo: "Autenticación en 2 pasos DESACTIVADA"

6. PERFIL_ACTUALIZADO
   Cuándo: Usuario actualiza perfil (UPDATE en users)
   Cambio BD: UPDATE en users (nombre, teléfono, país, etc)
   Variables disponibles: ${usuario_nombre}, ${campo_modificado}, ${valor_nuevo}, ${fecha_actualizacion}
   Ejemplo: "Tu perfil fue actualizado. ${campo_modificado}: ${valor_nuevo}"

7. EMAIL_CAMBIADO
   Cuándo: Usuario cambia email (UPDATE users.email + verifica con 2FA)
   Cambio BD: UPDATE en users (email: viejo@email.com → nuevo@email.com)
   Variables disponibles: ${usuario_nombre}, ${email_anterior}, ${email_nuevo}, ${link_confirmacion}
   Ejemplo: "Confirma tu nuevo email: ${email_nuevo}. Haz clic: ${link_confirmacion}"

8. SUSCRIPCION_ACTIVADA
   Cuándo: Usuario activa suscripción a plan (INSERT en subscriptions)
   Cambio BD: INSERT en subscriptions con status='activa'
   Variables disponibles: ${usuario_nombre}, ${plan_nombre}, ${precio_plan}, ${fecha_vencimiento}, ${fecha_proximo_cobro}
   Ejemplo: "Plan ${plan_nombre} activado. Próximo cobro: ${fecha_proximo_cobro}"

9. SUSCRIPCION_POR_VENCER
   Cuándo: Cron job detecta suscripción venciendo en 3 días
   Cambio BD: Generado por cron (no es INSERT/UPDATE directo)
   Variables disponibles: ${usuario_nombre}, ${dias_restantes}, ${plan_nombre}, ${fecha_vencimiento}
   Ejemplo: "Tu suscripción vence en ${dias_restantes} días (${fecha_vencimiento})"

10. SUSCRIPCION_VENCIDA
    Cuándo: Cron job detecta suscripción vencida (UPDATE subscriptions.status)
    Cambio BD: UPDATE subscriptions (status: 'activa' → 'vencida')
    Variables disponibles: ${usuario_nombre}, ${plan_nombre}, ${fecha_vencimiento}
    Ejemplo: "Tu suscripción a ${plan_nombre} ha vencido. Renueva aquí para seguir usando DropCost"
```

---

### REFERIDOS (7 eventos)

```
11. REFERIDO_REGISTRADO
    Cuándo: Usuario se registra con código referido (INSERT en referidos_usuarios)
    Cambio BD: INSERT en referidos_usuarios (lider_id + usuario_id)
    Variables disponibles: ${usuario_nombre}, ${lider_nombre}, ${comision_nivel_1}%, ${codigo_referido}
    Ejemplo: "Bienvenido ${usuario_nombre}, fuiste referido por ${lider_nombre}"

12. REFERIDO_PRIMER_PAGO
    Cuándo: Referido hace su primer pago (UPDATE subscriptions.status = 'activa' para referido)
    Cambio BD: INSERT en subscriptions + INSERT en comisiones_referidos
    Variables disponibles: ${usuario_nombre}, ${lider_nombre}, ${comision_ganada}, ${monto_pago}, ${fecha_pago}
    Ejemplo: "${lider_nombre}, ${usuario_nombre} hizo su primer pago de ${monto_pago}. ¡Ganaste ${comision_ganada}!"

13. LIDER_ASCENDIDO
    Cuándo: Usuario alcanza 50 referidos activos (UPDATE users.rol = 'lider')
    Cambio BD: UPDATE users (rol: 'usuario' → 'lider')
    Variables disponibles: ${usuario_nombre}, ${total_referidos}, ${comision_nivel_2}%, ${fecha_ascenso}
    Ejemplo: "¡Felicidades ${usuario_nombre}! Eres ahora Líder de Comunidad. Ganas ${comision_nivel_2}% en Nivel 2"

14. REFERIDO_CANCELO_SUSCRIPCION
    Cuándo: Referido cancela su suscripción (UPDATE subscriptions.status = 'cancelada')
    Cambio BD: UPDATE subscriptions (status: 'activa' → 'cancelada')
    Variables disponibles: ${lider_nombre}, ${referido_nombre}, ${comisiones_perdidas}, ${fecha_cancelacion}
    Ejemplo: "${referido_nombre} canceló su suscripción. Perdiste futuras comisiones (${comisiones_perdidas} acumuladas)"

15. PROXIMO_REFERIDO_PARA_LIDER
    Cuándo: Usuario alcanza múltiplos de 10 referidos antes de ser Líder (40/50, 60/70, etc)
    Cambio BD: Detectado por cron al contar referidos activos
    Variables disponibles: ${usuario_nombre}, ${referidos_actuales}, ${referidos_faltantes}, ${progreso}%
    Ejemplo: "¡Casi allá! Tienes ${referidos_actuales}/50 referidos. Te faltan ${referidos_faltantes}"

16. COMISION_PROXIMA_EXPIRAR
    Cuándo: Cron job detecta comisión venciendo en 30 días (UPDATE referidos_usuarios detecta proximidad)
    Cambio BD: Generado por cron (no es INSERT/UPDATE directo, es verificación)
    Variables disponibles: ${lider_nombre}, ${referido_nombre}, ${dias_restantes}, ${comisiones_acumuladas}
    Ejemplo: "Tu comisión de ${referido_nombre} vence en ${dias_restantes} días. Total acumulado: ${comisiones_acumuladas}"

17. COMISION_EXPIRADA
    Cuándo: Cron job detecta comisión expirada (12 meses desde fecha_registro)
    Cambio BD: UPDATE referidos_usuarios (fecha_expiracion_comision <= NOW())
    Variables disponibles: ${lider_nombre}, ${referido_nombre}, ${comisiones_totales}, ${fecha_expiracion}
    Ejemplo: "${referido_nombre} se convirtió en cliente puro. Total comisiones ganadas: ${comisiones_totales}"
```

---

### PAGOS (2 eventos)

```
18. PAGO_COMISIONES_APROBADO
    Cuándo: Admin aprueba retiro de comisiones (INSERT en pagos_comisiones)
    Cambio BD: INSERT en pagos_comisiones (status='aprobado')
    Variables disponibles: ${usuario_nombre}, ${monto_retiro}, ${fecha_transferencia}, ${banco}, ${numero_cuenta}
    Ejemplo: "Tu retiro de ${monto_retiro} fue APROBADO. Se transferirá el ${fecha_transferencia} a ${banco}"

19. PAGO_COMISIONES_PROCESADO
    Cuándo: Admin marca pago como procesado (UPDATE pagos_comisiones.status = 'procesado')
    Cambio BD: UPDATE pagos_comisiones (status: 'aprobado' → 'procesado')
    Variables disponibles: ${usuario_nombre}, ${monto_recibido}, ${comprobante}, ${fecha_procesamiento}, ${referencia}
    Ejemplo: "Tu retiro de ${monto_recibido} fue PROCESADO ✅. Referencia: ${referencia}"
```

---

## 3. Base de Datos - Tabla Triggers

```sql
CREATE TABLE email_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  nombre_trigger VARCHAR UNIQUE NOT NULL,
  descripcion TEXT,
  codigo_evento VARCHAR(50) UNIQUE NOT NULL,
  
  -- Ejemplo: 'USUARIO_REGISTRADO', 'REFERIDO_PRIMER_PAGO', 'PAGO_COMISIONES_PROCESADO'
  
  -- Metadata
  categoria VARCHAR, -- 'usuario', 'referido', 'pago'
  variables_disponibles JSON, -- ["${usuario_nombre}", "${email}", ...]
  tipo_disparador VARCHAR, -- 'automatico'
  tabla_origen VARCHAR, -- 'users', 'subscriptions', 'referidos_usuarios', etc
  evento_tipo VARCHAR, -- 'INSERT', 'UPDATE', 'CRON'
  condicion TEXT, -- Descripción de qué cambio dispara (ej: "users.rol: usuario → lider")
  
  -- Control
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(codigo_evento)
);

-- INSERTS de los 19 triggers:

INSERT INTO email_triggers VALUES 
(gen_random_uuid(), 'Usuario Registrado', 'Enviar bienvenida a nuevo usuario', 'USUARIO_REGISTRADO', 'usuario', '["${usuario_nombre}", "${usuario_email}", "${codigo_referido}"]', 'automatico', 'users', 'INSERT', 'INSERT en tabla users', true, NOW()),
(gen_random_uuid(), 'Usuario Olvidó Contraseña', 'Enviar link para reset de contraseña', 'USUARIO_OLVIDO_CONTRASENA', 'usuario', '["${usuario_nombre}", "${reset_link}", "${expira_en}"]', 'automatico', 'password_resets', 'INSERT', 'INSERT en password_resets', true, NOW()),
(gen_random_uuid(), '2FA - Código Confirmación', 'Enviar código 2FA al usuario', '2FA_CODIGO_CONFIRMACION', 'usuario', '["${usuario_nombre}", "${codigo_2fa}", "${expira_en}"]', 'automatico', '2fa_codes', 'INSERT', 'INSERT en 2fa_codes', true, NOW()),
(gen_random_uuid(), '2FA Activado', 'Confirmar activación de 2FA', '2FA_ACTIVADO', 'usuario', '["${usuario_nombre}", "${fecha_activacion}"]', 'automatico', 'users', 'UPDATE', 'UPDATE dos_factor_activo: false → true', true, NOW()),
(gen_random_uuid(), '2FA Desactivado', 'Confirmar desactivación de 2FA', '2FA_DESACTIVADO', 'usuario', '["${usuario_nombre}", "${fecha_desactivacion}"]', 'automatico', 'users', 'UPDATE', 'UPDATE dos_factor_activo: true → false', true, NOW()),
(gen_random_uuid(), 'Perfil Actualizado', 'Notificar cambios en perfil', 'PERFIL_ACTUALIZADO', 'usuario', '["${usuario_nombre}", "${campo_modificado}", "${fecha_actualizacion}"]', 'automatico', 'users', 'UPDATE', 'UPDATE en campos: nombre, teléfono, país, etc', true, NOW()),
(gen_random_uuid(), 'Email Cambiado', 'Confirmar cambio de email', 'EMAIL_CAMBIADO', 'usuario', '["${usuario_nombre}", "${email_anterior}", "${email_nuevo}", "${link_confirmacion}"]', 'automatico', 'users', 'UPDATE', 'UPDATE email: viejo → nuevo', true, NOW()),
(gen_random_uuid(), 'Suscripción Activada', 'Confirmar activación de plan', 'SUSCRIPCION_ACTIVADA', 'usuario', '["${usuario_nombre}", "${plan_nombre}", "${precio_plan}", "${fecha_vencimiento}"]', 'automatico', 'subscriptions', 'INSERT', 'INSERT en subscriptions con status=activa', true, NOW()),
(gen_random_uuid(), 'Suscripción Por Vencer', 'Recordar vencimiento en 3 días', 'SUSCRIPCION_POR_VENCER', 'usuario', '["${usuario_nombre}", "${dias_restantes}", "${fecha_vencimiento}"]', 'automatico', 'subscriptions', 'CRON', 'Cron detecta vencimiento en 3 días', true, NOW()),
(gen_random_uuid(), 'Suscripción Vencida', 'Notificar suscripción vencida', 'SUSCRIPCION_VENCIDA', 'usuario', '["${usuario_nombre}", "${plan_nombre}", "${fecha_vencimiento}"]', 'automatico', 'subscriptions', 'UPDATE', 'UPDATE status: activa → vencida', true, NOW()),
(gen_random_uuid(), 'Referido Registrado', 'Notificar nuevo referido al líder', 'REFERIDO_REGISTRADO', 'referido', '["${usuario_nombre}", "${lider_nombre}", "${comision_nivel_1}"]', 'automatico', 'referidos_usuarios', 'INSERT', 'INSERT en referidos_usuarios', true, NOW()),
(gen_random_uuid(), 'Referido Primer Pago', 'Celebrar primer pago de referido', 'REFERIDO_PRIMER_PAGO', 'referido', '["${lider_nombre}", "${usuario_nombre}", "${comision_ganada}", "${monto_pago}"]', 'automatico', 'comisiones_referidos', 'INSERT', 'INSERT en comisiones_referidos para Nivel 1', true, NOW()),
(gen_random_uuid(), 'Líder Ascendido', 'Celebrar ascenso a Líder', 'LIDER_ASCENDIDO', 'referido', '["${usuario_nombre}", "${total_referidos}", "${comision_nivel_2}"]', 'automatico', 'users', 'UPDATE', 'UPDATE rol: usuario → lider (50 referidos)', true, NOW()),
(gen_random_uuid(), 'Referido Canceló Suscripción', 'Notificar pérdida de comisión', 'REFERIDO_CANCELO_SUSCRIPCION', 'referido', '["${lider_nombre}", "${referido_nombre}", "${comisiones_perdidas}"]', 'automatico', 'subscriptions', 'UPDATE', 'UPDATE status: activa → cancelada', true, NOW()),
(gen_random_uuid(), 'Próximo Referido Para Líder', 'Motivar a alcanzar 50 referidos', 'PROXIMO_REFERIDO_PARA_LIDER', 'referido', '["${usuario_nombre}", "${referidos_actuales}", "${referidos_faltantes}"]', 'automatico', 'referidos_usuarios', 'CRON', 'Cron verifica cada 10 referidos (40, 60, etc)', true, NOW()),
(gen_random_uuid(), 'Comisión Próxima Expirar', 'Recordar vencimiento de comisión', 'COMISION_PROXIMA_EXPIRAR', 'referido', '["${lider_nombre}", "${referido_nombre}", "${dias_restantes}"]', 'automatico', 'referidos_usuarios', 'CRON', 'Cron detecta 30 días antes de expiración', true, NOW()),
(gen_random_uuid(), 'Comisión Expirada', 'Notificar expiración de comisión', 'COMISION_EXPIRADA', 'referido', '["${lider_nombre}", "${referido_nombre}", "${comisiones_totales}"]', 'automatico', 'referidos_usuarios', 'UPDATE', 'UPDATE detecta fecha_expiracion_comision <= NOW()', true, NOW()),
(gen_random_uuid(), 'Pago Comisiones Aprobado', 'Confirmar aprobación de retiro', 'PAGO_COMISIONES_APROBADO', 'pago', '["${usuario_nombre}", "${monto_retiro}", "${fecha_transferencia}"]', 'automatico', 'pagos_comisiones', 'INSERT', 'INSERT en pagos_comisiones con status=aprobado', true, NOW()),
(gen_random_uuid(), 'Pago Comisiones Procesado', 'Confirmar procesamiento de pago', 'PAGO_COMISIONES_PROCESADO', 'pago', '["${usuario_nombre}", "${monto_recibido}", "${comprobante}"]', 'automatico', 'pagos_comisiones', 'UPDATE', 'UPDATE status: aprobado → procesado', true, NOW());
```

---

## 4. Base de Datos - Tabla Asociación Plantilla-Trigger

```sql
CREATE TABLE email_plantillas_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  plantilla_id UUID NOT NULL,
  trigger_id UUID NOT NULL,
  
  -- Múltiples plantillas pueden estar asociadas al mismo trigger
  -- Todas se enviarán cuando el trigger se dispare
  
  activo BOOLEAN DEFAULT true,
  fecha_asociacion TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (plantilla_id) REFERENCES email_plantillas(id) ON DELETE CASCADE,
  FOREIGN KEY (trigger_id) REFERENCES email_triggers(id) ON DELETE CASCADE,
  UNIQUE(plantilla_id, trigger_id) -- Una plantilla no puede asociarse 2 veces al mismo trigger
);
```

---

## 5. Base de Datos - Tabla Historial de Emails

```sql
CREATE TABLE email_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  plantilla_id UUID NOT NULL,
  trigger_id UUID NOT NULL,
  usuario_email VARCHAR NOT NULL,
  usuario_id UUID,
  
  asunto_enviado VARCHAR,
  contenido_html_enviado TEXT,
  
  estado ENUM('enviado', 'fallido', 'rebote') DEFAULT 'enviado',
  razon_error TEXT,
  
  fecha_envio TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (plantilla_id) REFERENCES email_plantillas(id),
  FOREIGN KEY (trigger_id) REFERENCES email_triggers(id),
  FOREIGN KEY (usuario_id) REFERENCES users(id),
  
  INDEX(usuario_id),
  INDEX(fecha_envio),
  INDEX(trigger_id)
);
```

---

## 6. Requerimientos Funcionales

### RF-161: Panel Admin - Listar Triggers Disponibles

**Ubicación:** Admin → Email → Triggers

**Mostrar 19 triggers agrupados por categoría:**
```
USUARIO (10)
├─ Usuario Registrado
├─ Usuario Olvidó Contraseña
├─ 2FA - Código Confirmación
├─ 2FA Activado
├─ 2FA Desactivado
├─ Perfil Actualizado
├─ Email Cambiado
├─ Suscripción Activada
├─ Suscripción Por Vencer
└─ Suscripción Vencida

REFERIDOS (7)
├─ Referido Registrado
├─ Referido Primer Pago
├─ Líder Ascendido
├─ Referido Canceló Suscripción
├─ Próximo Referido Para Líder
├─ Comisión Próxima Expirar
└─ Comisión Expirada

PAGOS (2)
├─ Pago Comisiones Aprobado
└─ Pago Comisiones Procesado
```

Cada trigger muestra:
- Nombre descriptivo
- Descripción
- Variables disponibles
- Cantidad de plantillas asociadas
- Tipo de disparador (automático)
- Tabla origen + Tipo evento (INSERT/UPDATE/CRON)

---

### RF-162: Panel Admin - Ver Detalles de Trigger

**Al hacer click en trigger, mostrar:**
- Nombre y descripción completa
- Código del evento
- Categoría
- Variables disponibles (copiables)
- Tabla origen (ej: subscriptions)
- Tipo evento (ej: UPDATE)
- Condición exacta (ej: "UPDATE status: activa → vencida")
- Plantillas asociadas (si las hay)
- Botón para crear nueva plantilla para este trigger

---

### RF-163: Crear Plantilla - Selector de Trigger

**Al crear/editar plantilla:**

```
SELECTOR TRIGGER (REQUERIDO):
┌─────────────────────────────────────┐
│ Selecciona evento que dispara email: │
│                                     │
│ [Seleccionar trigger ▼]             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ USUARIO (10)                    │ │
│ │ ├─ USUARIO_REGISTRADO           │ │
│ │ ├─ USUARIO_OLVIDO_CONTRASENA    │ │
│ │ ├─ 2FA_CODIGO_CONFIRMACION      │ │
│ │ └─ ... (7 más)                  │ │
│ │                                 │ │
│ │ REFERIDOS (7)                   │ │
│ │ ├─ REFERIDO_REGISTRADO          │ │
│ │ ├─ REFERIDO_PRIMER_PAGO         │ │
│ │ └─ ... (5 más)                  │ │
│ │                                 │
│ │ PAGOS (2)                       │ │
│ │ ├─ PAGO_COMISIONES_APROBADO     │ │
│ │ └─ PAGO_COMISIONES_PROCESADO    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Variables disponibles:              │
│ ${usuario_nombre}, ${email},        │
│ ${comision_nivel_1}, ...            │
│                                     │
│ [Copiar variables]                  │
└─────────────────────────────────────┘
```

---

### RF-164: Sistema Automático - Disparar Email por Cambio BD

**Backend Logic (concepto):**

```
FLUJO AUTOMÁTICO:

1. Cambio en BD:
   └─ INSERT en users (Usuario Registrado)
   └─ UPDATE subscriptions (Suscripción Activada)
   └─ UPDATE users.rol = 'lider' (Líder Ascendido)
   └─ CRON ejecuta (Suscripción Por Vencer)

2. Detectar cambio:
   └─ Trigger database (INSERT/UPDATE/DELETE)
   └─ O Cron job que verifica condiciones

3. Identificar evento:
   └─ Mapear cambio a código_evento
   └─ Ejemplo: UPDATE users.rol → "LIDER_ASCENDIDO"

4. Buscar plantillas:
   └─ SELECT FROM email_plantillas_triggers
   └─ WHERE trigger_id = [id del trigger]
   └─ AND activo = true

5. Preparar datos:
   └─ Recopilar variables: ${usuario_nombre}, ${email}, etc
   └─ Reemplazar en plantilla

6. Enviar email:
   └─ PARA CADA plantilla asociada:
   │  ├─ Reemplazar variables en asunto
   │  ├─ Reemplazar variables en contenido HTML
   │  ├─ Enviar email via SMTP
   │  └─ Registrar en email_historial
   └─ SI NO hay plantillas: Silencio (no hace nada)

7. Registrar historial:
   └─ INSERT en email_historial
   └─ Guardar asunto, contenido, estado, fecha
```

---

### RF-165: Panel Admin - Ver Historial de Emails

**Ubicación:** Admin → Email → Historial

```
TABLA HISTORIAL:

Filtros: [Trigger ▼] [Plantilla ▼] [Estado ▼] [Fecha ▼]

┌────────────────────────────────────────────────────────┐
│ Fecha      │ Trigger           │ Email      │ Estado   │
├────────────────────────────────────────────────────────┤
│ 15/2 10:30 │ USUARIO_REGISTRADO│ juan@...   │ ✅ Envío │
│ 15/2 10:25 │ REFERIDO_PAGO     │ maria@...  │ ✅ Envío │
│ 15/2 10:20 │ SUSCRIPCION_VENCID│ carlos@... │ ❌ Error │
│ 14/2 08:15 │ LIDER_ASCENDIDO   │ ana@...    │ ✅ Envío │
└────────────────────────────────────────────────────────┘

Click en fila → Ver detalles:
- Plantilla usada
- Asunto enviado
- Contenido HTML enviado
- Fecha/hora exacta
- Estado (éxito/error)
- Razón del error (si aplica)
```

---

## 7. API Endpoints

```
GET /api/admin/email/triggers
├─ Listar todos los 19 triggers disponibles
├─ Response: { triggers: [...] con categoría, variables, etc }
└─ Query: ?categoria=usuario (opcional)

GET /api/admin/email/triggers/{codigo_evento}
├─ Detalles de un trigger específico
├─ Ejemplo: /api/admin/email/triggers/USUARIO_REGISTRADO
└─ Response: { trigger, plantillas_asociadas: [...] }

POST /api/admin/email/plantillas
├─ Crear plantilla + asociar trigger
├─ Body: { nombre, asunto, contenido_html, trigger_id }
└─ Response: { plantilla_id, trigger_id }

PUT /api/admin/email/plantillas/{id}/trigger
├─ Cambiar/actualizar trigger asociado
├─ Body: { trigger_id }
└─ Response: { success }

POST /api/email/disparar-trigger (INTERNAL - Backend only)
├─ Disparar email cuando ocurre evento
├─ Body: { codigo_evento, datos: { usuario_id, email, ... } }
├─ Body ejemplo: { "codigo_evento": "USUARIO_REGISTRADO", "datos": { "usuario_nombre": "Juan", "usuario_email": "juan@..." } }
└─ Response: { exito: true, emails_enviados: 2, plantillas: ["Bienvenida", "Guía"] }

GET /api/admin/email/historial
├─ Ver historial de emails enviados
├─ Query: ?trigger=USUARIO_REGISTRADO&estado=enviado&fecha_desde=2026-02-01
└─ Response: { emails: [...], total: 1500, pagina: 1 }

GET /api/admin/email/historial/{id}
├─ Detalles completos de un email enviado
└─ Response: { plantilla_id, contenido_html, asunto, estado, fecha_envio }
```

---

## 8. Notas Importantes para Antigravity

```
⚠️ IMPORTANTE:

1. TODOS LOS DISPARADORES SON AUTOMÁTICOS
   └─ Se disparan cuando hay cambio en BD
   └─ Puede ser INSERT, UPDATE o CRON job
   └─ NO requieren intervención manual de admin
   └─ Excepto: datos que ingresa admin (ej: aprobar pago) 
      también dispara el trigger automáticamente

2. CRON JOBS (3 triggers):
   └─ SUSCRIPCION_POR_VENCER: Ejecutar diariamente, enviar si faltan 3 días
   └─ PROXIMO_REFERIDO_PARA_LIDER: Ejecutar diariamente, enviar cada 10 referidos
   └─ COMISION_PROXIMA_EXPIRAR: Ejecutar diariamente, enviar si faltan 30 días
   └─ COMISION_EXPIRADA: Ejecutar diariamente, enviar si fecha_expiracion <= NOW()

3. DATABASE TRIGGERS / EVENT LISTENERS (16 triggers):
   └─ INSERT, UPDATE listeners en tablas:
      ├─ users (USUARIO_REGISTRADO, 2FA_ACTIVADO, LIDER_ASCENDIDO, etc)
      ├─ password_resets (USUARIO_OLVIDO_CONTRASENA)
      ├─ 2fa_codes (2FA_CODIGO_CONFIRMACION)
      ├─ subscriptions (SUSCRIPCION_ACTIVADA, SUSCRIPCION_VENCIDA, REFERIDO_CANCELO)
      ├─ referidos_usuarios (REFERIDO_REGISTRADO)
      ├─ comisiones_referidos (REFERIDO_PRIMER_PAGO)
      └─ pagos_comisiones (PAGO_COMISIONES_APROBADO, PAGO_COMISIONES_PROCESADO)

4. PLANTILLAS OPCIONALES
   └─ Si NO hay plantilla para un trigger → No envía email
   └─ Si hay MÚLTIPLES plantillas → Envía TODAS
   └─ Admin controla qué triggers tienen plantillas activas

5. VARIABLES DINÁMICAS
   └─ Reemplazar ${variable} con valores reales antes de enviar
   └─ Validar que todas las variables existan en los datos disponibles
   └─ Si falta variable → Usar valor por defecto o no enviar

6. CONFIGURACIÓN DOMINIO
   └─ Usar VITE_APP_URL para URLs en emails (ej: links de reset)
   └─ Ejemplo: ${reset_link} = ${VITE_APP_URL}/reset-password?token=XXX
```

---

## 9. Checklist de Implementación

```
[ ] Tabla email_triggers creada con 19 triggers
[ ] Tabla email_plantillas_triggers creada
[ ] Tabla email_historial creada
[ ] Panel admin: Listar 19 triggers (RF-161)
[ ] Panel admin: Ver detalles de trigger (RF-162)
[ ] Selector trigger al crear plantilla (RF-163)
[ ] Database trigger listeners (INSERT/UPDATE) para 16 triggers
[ ] Cron jobs configurados para 3 triggers (suscripción, referido, comisión)
[ ] Función dispararTrigger() implementada
[ ] Reemplazo de variables ${...} funcionando
[ ] Panel admin: Ver historial de emails (RF-165)
[ ] API endpoints configurados (RF-167)
[ ] Testing: Usuario registra → Email "Usuario Registrado" enviado
[ ] Testing: Usuario sin plantilla asociada → No envía email
[ ] Testing: Multiple plantillas → Todas se envían
[ ] Testing: Variables se reemplazan correctamente
[ ] Testing: Historial registra cada email
[ ] Testing: Cron jobs ejecutan en horarios correctos
[ ] Testing: Links en emails usan dominio correcto (VITE_APP_URL)
```

---

## 10. Flujo Completo - Ejemplo Real

```
ESCENARIO: Usuario se registra

1. Usuario completa formulario de registro
   ├─ Nombre: "Juan Pérez"
   ├─ Email: "juan@example.com"
   ├─ Código referido: "ivan_caicedo"
   └─ Click [Registrar]

2. Backend INSERT en users
   ├─ new User {
   │  id: uuid,
   │  nombre: "Juan Pérez",
   │  email: "juan@example.com",
   │  lider_id: [id de Ivan],
   │  rol: "usuario",
   │  created_at: NOW()
   └─ }

3. Database trigger detecta INSERT en users
   ├─ Mapea a evento: USUARIO_REGISTRADO
   └─ Llama: dispararTrigger("USUARIO_REGISTRADO", {
      usuario_nombre: "Juan Pérez",
      usuario_email: "juan@example.com",
      codigo_referido: "ivan_caicedo",
      fecha_registro: NOW()
   })

4. dispararTrigger busca plantillas:
   ├─ SELECT email_plantillas_triggers
   ├─ WHERE trigger_id = [id USUARIO_REGISTRADO]
   └─ Resultado: [
      Plantilla 1: "Bienvenida DropCost Master",
      Plantilla 2: "Guía de Primeros Pasos"
   ]

5. Envía 2 emails:

   EMAIL 1: "Bienvenida DropCost Master"
   ├─ Asunto: "Bienvenido Juan Pérez"
   ├─ HTML: "<h1>Hola Juan Pérez, bienvenido a DropCost</h1>
   │         <p>Tu código referido es: ivan_caicedo</p>"
   ├─ Enviar a: juan@example.com
   └─ Registrar en email_historial (✅ Enviado)

   EMAIL 2: "Guía de Primeros Pasos"
   ├─ Asunto: "Guía rápida para Juan Pérez"
   ├─ HTML: "<h1>Primeros pasos en DropCost</h1>
   │         <p>Bienvenido Juan, aquí te mostramos...</p>"
   ├─ Enviar a: juan@example.com
   └─ Registrar en email_historial (✅ Enviado)

6. Admin ve en historial:
   ├─ 15/2 10:30 | USUARIO_REGISTRADO | juan@example.com | ✅ Enviado
   ├─ Plantilla: "Bienvenida DropCost Master"
   ├─ Asunto: "Bienvenido Juan Pérez"
   └─ Click [Ver detalles] → Ver contenido HTML, fecha exacta, estado
```

---

**FIN ESPECIFICACIÓN RF-161 a RF-167**

---

## 📊 RESUMEN FINAL

```
SISTEMA DE TRIGGERS + PLANTILLAS EMAIL - VERSIÓN 2.0:

✅ 19 TRIGGERS AUTOMÁTICOS (detectados por cambios en BD)

USUARIO (10):
├─ Usuario Registrado
├─ Usuario Olvidó Contraseña
├─ 2FA - Código Confirmación
├─ 2FA Activado
├─ 2FA Desactivado
├─ Perfil Actualizado
├─ Email Cambiado
├─ Suscripción Activada
├─ Suscripción Por Vencer (CRON)
└─ Suscripción Vencida

REFERIDOS (7):
├─ Referido Registrado
├─ Referido Primer Pago
├─ Líder Ascendido
├─ Referido Canceló Suscripción
├─ Próximo Referido Para Líder (CRON)
├─ Comisión Próxima Expirar (CRON)
└─ Comisión Expirada

PAGOS (2):
├─ Pago Comisiones Aprobado
└─ Pago Comisiones Procesado

✅ PANEL ADMIN:
├─ Ver 19 triggers disponibles
├─ Ver detalles de cada trigger
├─ Crear plantillas asociadas
├─ Ver historial de emails enviados

✅ LÓGICA CENTRAL:
└─ Evento ocurre → ¿Hay plantilla? → Sí → Envía | No → Silencio

✅ TODO AUTOMÁTICO:
└─ Se dispara por cambios en BD (INSERT/UPDATE/CRON)
└─ No requiere intervención manual (excepto datos que ingresa admin)
```
