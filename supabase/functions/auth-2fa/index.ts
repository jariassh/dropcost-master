import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { action, code } = await req.json()

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

      // --- ENVÍO DE EMAIL CON RESEND ---
      const resendKey = Deno.env.get('RESEND_API_KEY')
      if (resendKey) {
        try {
            console.log("Enviando via Resend...");
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'Security <security@dropcost.jariash.com>',
                    to: [user.email],
                    subject: `${otp} es tu código de verificación 2FA`,
                    html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #0066FF;">Activa tu Seguridad de Dos Factores</h2>
                        <p>Hola,</p>
                        <p>Has solicitado activar el 2FA en DropCost Master. Usa el siguiente código para confirmar tu identidad:</p>
                        <div style="background: #f4f7ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0066FF;">${otp}</span>
                        </div>
                        <p style="font-size: 12px; color: #666;">Este código expirará en 5 minutos. Si no solicitaste esto, ignora este correo.</p>
                    </div>
                    `
                })
            })

            if (!res.ok) {
                const errorText = await res.text()
                console.error("Resend API Error:", errorText)
                // No lanzar error para no bloquear el flujo si solo falla el email (opcional, pero mejor mostrar error)
                throw new Error(`Error enviando email: ${errorText}`)
            }

            const resData = await res.json()
            console.log("Resend response:", resData)

        } catch (emailError) {
             console.error("Fallo envío email:", emailError)
             // Limpiar código generado si falla el envío para no dejar estados zombie
             await adminClient.from('auth_codes').delete().eq('code_hash', otp)
             throw new Error("No se pudo enviar el correo de verificación. Verifica configuración SMTP/Resend.") 
        }
      } else {
        console.log("AVISO: RESEND_API_KEY no configurada. Código generado:", otp)
        // Opcionalmente lanzar error en producción si se requiere email
        // throw new Error("Servicio de correo no configurado (RESEND_API_KEY faltante)")
      }

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

      return new Response(JSON.stringify({ success: true }), {
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
