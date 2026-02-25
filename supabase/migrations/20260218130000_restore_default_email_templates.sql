-- Restore Default Email Templates
-- This migration ensures essential templates exist to prevent login/system errors

INSERT INTO public.email_templates (name, slug, subject, html_content, description, status, trigger_event)
VALUES 
    (
        'Código de Verificación 2FA', 
        '2fa', 
        'Tu código de verificación - DropCost Master', 
        '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Código de Verificación</h2>
          <p>Hola,</p>
          <p>Tu código de verificación para acceder a DropCost Master es:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px;">
            {{code}}
          </div>
          <p>Este código expira en 10 minutos.</p>
          <p>Si no solicitaste este código, puedes ignorar este correo.</p>
        </div>', 
        'Plantilla para envío de códigos de doble factor de autenticación',
        'activo',
        'auth_2fa'
    ),
    (
        'Bienvenida a DropCost', 
        'bienvenida', 
        '¡Bienvenido a DropCost Master!', 
        '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>¡Bienvenido a DropCost Master, {{name}}!</h2>
          <p>Estamos muy contentos de que te hayas unido a nosotros.</p>
          <p>Con DropCost podrás calcular costos, gestionar tus tiendas y optimizar tu negocio de dropshipping como un profesional.</p>
          <p style="text-align: center; margin-top: 30px;">
            <a href="{{app_url}}" style="background-color: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ir a mi cuenta</a>
          </p>
        </div>', 
        'Correo de bienvenida para nuevos usuarios',
        'activo',
        'user_signup'
    ),
    (
        'Recuperar Contraseña', 
        'recuperar_password', 
        'Restablece tu contraseña - DropCost Master', 
        '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Restablecer Contraseña</h2>
            <p>Hola,</p>
            <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
            <p style="text-align: center; margin-top: 30px;">
                <a href="{{reset_link}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Restablecer Contraseña</a>
            </p>
            <p>Si no solicitaste este cambio, por favor ignora este correo.</p>
        </div>', 
        'Correo para proceso de recuperación de contraseña',
        'activo',
        'password_recovery'
    ),
    (
        'Nueva Tienda Creada', 
        'nueva_tienda', 
        'Confirmación de Nueva Tienda - {{store_name}}', 
        '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>¡Tu tienda ha sido creada!</h2>
            <p>Hola {{name}},</p>
            <p>Tu tienda <strong>{{store_name}}</strong> ha sido registrada exitosamente en DropCost Master.</p>
            <p>Ya puedes empezar a gestionar tus productos y calcular costos.</p>
            <p style="text-align: center; margin-top: 30px;">
                <a href="{{app_url}}/tiendas" style="background-color: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver mis Tiendas</a>
            </p>
        </div>', 
        'Confirmación al crear una nueva tienda',
        'activo',
        'store_created'
    )
ON CONFLICT (slug) DO UPDATE 
SET 
    html_content = EXCLUDED.html_content,
    subject = EXCLUDED.subject,
    status = 'activo';
