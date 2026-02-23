import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper: disparar trigger de email (Esperar respuesta para depuración)
async function dispararTrigger(supabaseUrl: string, serviceKey: string, codigo_evento: string, datos: Record<string, string>) {
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/email-trigger-dispatcher`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              'Authorization': `Bearer ${serviceKey}` 
            },
            body: JSON.stringify({ codigo_evento, datos }),
        });
        
        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`[email-trigger] Dispatcher respondió error (${response.status}):`, errorBody);
          return { success: false, status: response.status, error: errorBody };
        }
        
        const result = await response.json();
        return { success: true, ...result };
    } catch (e) {
        console.error(`[email-trigger] Error disparando ${codigo_evento}:`, e);
        return { success: false, error: e.message };
    }
}

console.log("Edge Function auth-2fa iniciada")

serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Inicializar cliente con el token del usuario (para verificar identidad)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')!

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Obtener usuario autenticado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('No autorizado o sesión expirada')

    // 2. Inicializar cliente con Service Role para operaciones privilegiadas
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    console.log(`[auth-2fa] Body recibido:`, JSON.stringify(body))
    const { action, code } = body
    console.log(`[auth-2fa] Acción: ${action} | Código: ${code ? '***' : 'N/A'}`)

    // ACCIÓN: SOLICITAR CÓDIGO
    if (action === 'request') {
      console.log(`Solicitando código 2FA para usuario: ${user.id}`);
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min

      // Guardar en la tabla auth_codes
      const { error: dbError } = await adminClient
        .from('auth_codes')
        .insert({
          user_id: user.id,
          code_hash: otp,
          expires_at: expiresAt
        })

      if (dbError) {
          console.error("Error insertando código en DB:", dbError);
          throw dbError;
      }
      
      console.log("Código insertado en DB, enviando email...");

      console.log("Código insertado en DB, disparando trigger de email...");
      
      const { context } = body;
      const trigger_code = (context === 'activation') ? '2FA_SOLICITUD_ACTIVACION' : 'AUTH_2FA';

      // Enviar email usando el disparador centralizado
      await dispararTrigger(supabaseUrl, supabaseServiceKey, trigger_code, {
        usuario_id: user.id,
        usuario_email: user.email ?? '',
        usuario_nombre: user.user_metadata?.nombres || user.email?.split('@')[0] || '',
        codigo_2fa: otp,
        // Proporcionamos ambas por si acaso
        codigo: otp,
        "2fa_code": otp, 
        expira_en: '5 minutos'
      });

      console.log("Trigger 2FA disparado correctamente");

      return new Response(JSON.stringify({ success: true, message: 'Código generado y enviado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ACCIÓN: VERIFICAR CÓDIGO Y ACTIVAR (Proceso de activación)
    if (action === 'verify') {
      const inputCode = String(code).trim();
      console.log(`[VERIFY] User: ${user.id}, Code: ${inputCode}`);

      if (!inputCode) throw new Error('Código es requerido');

      try {
        // Buscar el código más reciente válido
        const { data: codeData, error: fetchError } = await adminClient
          .from('auth_codes')
          .select('*')
          .eq('user_id', user.id)
          .eq('code_hash', inputCode)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (fetchError) {
             console.error("[VERIFY] DB Error:", fetchError);
             return new Response(JSON.stringify({ 
                 success: false, 
                 error: `Error DB: ${fetchError.message || JSON.stringify(fetchError)}`,
                 details: fetchError
             }), {
                status: 200, // Return 200 to show JSON content
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
             });
        }

        if (!codeData) {
          console.log("[VERIFY] Code not found or expired.");
          // Debug: Check if any code exists for this user
          const { count } = await adminClient.from('auth_codes').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
          console.log(`[VERIFY] Total codes for user: ${count}`);

          return new Response(JSON.stringify({ success: false, error: 'Código inválido o ya expiró' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        console.log("[VERIFY] Code valid. Activating 2FA...");

        // 1. Activar en la tabla public.users
        const { error: updateError } = await adminClient
          .from('users')
          .update({ "2fa_habilitado": true })
          .eq('id', user.id)

        if (updateError) {
            console.error("[VERIFY] Update user error:", updateError);
            throw updateError;
        }

        // 2. Limpiar códigos del usuario
        await adminClient.from('auth_codes').delete().eq('user_id', user.id)

        // EMAIL TRIGGER: 2FA_ACTIVADO
        dispararTrigger(supabaseUrl, supabaseServiceKey, '2FA_ACTIVADO', {
            usuario_id: user.id,
            usuario_email: user.email ?? '',
            usuario_nombre: user.user_metadata?.nombres || user.email?.split('@')[0] || '',
        });

        console.log("[VERIFY] 2FA Activated successfully.");
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      } catch (err) {
          console.error("[VERIFY] Exception:", err);
          return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
      }
    }

    // ACCIÓN: VERIFICAR CÓDIGO LOGIN (Solo validar, no activar)
    if (action === 'verify_login') {
        const inputCode = String(code).trim();
        console.log(`[LOGIN] Verify 2FA for: ${user.id}`);
        
        if (!inputCode) throw new Error('Código es requerido');
  
        try {
            // Buscar el código más reciente válido
            const { data: codeData, error: fetchError } = await adminClient
            .from('auth_codes')
            .select('*')
            .eq('user_id', user.id)
            .eq('code_hash', inputCode)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
    
            if (fetchError) {
                console.error("[LOGIN] DB Error:", fetchError);
                return new Response(JSON.stringify({ 
                    success: false, 
                    error: `Error DB: ${fetchError.message || JSON.stringify(fetchError)}`,
                    details: fetchError
                }), {
                   status: 200, 
                   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
           }
    
            if (!codeData) {
                console.log("[LOGIN] Code not found or expired.");
                return new Response(JSON.stringify({ success: false, error: 'Código inválido o ya expiró' }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
    
            // 1. Limpiar códigos del usuario (éxito)
            await adminClient.from('auth_codes').delete().eq('user_id', user.id)
            
            console.log("[LOGIN] Success.");
            return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })

        } catch (err) {
            console.error("[LOGIN] Exception:", err);
            return new Response(JSON.stringify({ success: false, error: err.message }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
      }

    // ACCIÓN: DESACTIVAR
    if (action === 'disable') {
      const { error: updateError } = await adminClient
        .from('users')
        .update({ "2fa_habilitado": false })
        .eq('id', user.id)

      if (updateError) throw updateError

      // EMAIL TRIGGER: 2FA_DESACTIVADO
      dispararTrigger(supabaseUrl, supabaseServiceKey, '2FA_DESACTIVADO', {
          usuario_id: user.id,
          usuario_email: user.email ?? '',
          usuario_nombre: user.user_metadata?.nombres || user.email?.split('@')[0] || '',
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ACCIÓN: SOLICITAR CAMBIO DE EMAIL (OTP al correo nuevo)
    if (action === 'request_email_change') {
      const { new_email } = body;
      if (!new_email) throw new Error('El nuevo correo es requerido');
      
      console.log(`Solicitando cambio de email para usuario ${user.id} a: ${new_email}`);

      // 1. Validar que no sea el mismo correo
      if (user.email === new_email) {
          throw new Error('El nuevo correo debe ser diferente al actual');
      }

      // 2. Validar que el correo no esté en uso por otro usuario (opcional pero recomendado)
      const { data: existingUser } = await adminClient
          .from('users')
          .select('id')
          .eq('email', new_email)
          .maybeSingle();
      
      if (existingUser) {
          throw new Error('Este correo ya está registrado por otro usuario');
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min para cambio email

      // Guardar en la tabla auth_codes con metadatos
      const { error: dbError } = await adminClient
        .from('auth_codes')
        .insert({
          user_id: user.id,
          code_hash: otp,
          expires_at: expiresAt,
          metadata: { action: 'email_change', new_email }
        })

      if (dbError) throw dbError;
      
      // Enviar email al NUEVO correo
      console.log(`[auth-2fa] Disparando trigger AUTH_EMAIL_CHANGE_CODE hacia: ${new_email}`);
      const triggerResult = await dispararTrigger(supabaseUrl, supabaseServiceKey, 'AUTH_EMAIL_CHANGE_CODE', {
        usuario_id: user.id,
        usuario_nombre: user.user_metadata?.nombres || user.email?.split('@')[0] || '',
        email_nuevo: new_email,
        email_anterior: user.email ?? '',
        codigo_2fa: otp,
        codigo: otp,
        expira_en: '10 minutos'
      });

      console.log(`[auth-2fa] Resultado del dispatcher:`, JSON.stringify(triggerResult));

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Código generado. Estado del envío: ${triggerResult.success ? 'Enviado' : 'Fallo Dispatcher'}`,
        debug_dispatcher: triggerResult 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ACCIÓN: VERIFICAR Y CONFIRMAR CAMBIO DE EMAIL
    if (action === 'verify_email_change') {
        const inputCode = String(code).trim();
        
        if (!inputCode) throw new Error('Código es requerido');
  
        // 1. Buscar el código válido para cambio de email
        const { data: codeData, error: fetchError } = await adminClient
            .from('auth_codes')
            .select('*')
            .eq('user_id', user.id)
            .eq('code_hash', inputCode)
            .contains('metadata', { action: 'email_change' })
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
    
        if (fetchError || !codeData) {
            return new Response(JSON.stringify({ success: false, error: 'Código inválido o ya expiró' }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const newEmail = codeData.metadata?.new_email;
        if (!newEmail) throw new Error('No se encontró el nuevo correo en la solicitud');

        // 2. Ejecutar cambio en AUTH (Admin)
        const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(user.id, {
            email: newEmail,
            email_confirm: true
        });

        if (authUpdateError) throw authUpdateError;

        // 3. Sincronizar tabla public.users (por si el trigger tarda o falla)
        await adminClient
            .from('users')
            .update({ email: newEmail })
            .eq('id', user.id);
    
        // 4. Limpiar códigos del usuario
        await adminClient.from('auth_codes').delete().eq('user_id', user.id)
        
        // 5. Trigger final de confirmación (Notificación de éxito)
        dispararTrigger(supabaseUrl, supabaseServiceKey, 'EMAIL_CAMBIADO', {
            usuario_id: user.id,
            usuario_nombre: user.user_metadata?.nombres || user.email?.split('@')[0] || '',
            email_nuevo: newEmail,
            email_anterior: user.email ?? '',
            fecha_cambio: new Date().toISOString().split('T')[0]
        });

        return new Response(JSON.stringify({ success: true, message: 'Correo actualizado correctamente' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    throw new Error('Acción no reconocida')

  } catch (error) {
    console.error("Error en Edge Function:", error.message)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
