import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper: disparar trigger de email (fire-and-forget)
async function dispararTrigger(supabaseUrl: string, serviceKey: string, codigo_evento: string, datos: Record<string, string>) {
    try {
        await fetch(`${supabaseUrl}/functions/v1/email-trigger-dispatcher`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
            body: JSON.stringify({ codigo_evento, datos }),
        });
    } catch (e) {
        console.error(`[email-trigger] Error disparando ${codigo_evento}:`, e);
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

      // --- ENVÍO DE EMAIL CON PLANTILLA DINÁMICA ---
      const resendKey = Deno.env.get('RESEND_API_KEY')
      if (resendKey) {
        try {
            console.log("Cargando plantilla 2FA...");
            const { data: template } = await adminClient
                .from('email_templates')
                .select('*')
                .eq('slug', '2fa')
                .maybeSingle()
            
            if (!template) throw new Error("Plantilla '2fa' no encontrada en la base de datos")

            const renderedSubject = template.subject.replace('{{codigo}}', otp)
            const renderedHtml = template.html_content.replace('{{codigo}}', otp)

            console.log("Enviando via Resend API...");
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'Seguridad DropCost <security@dropcost.jariash.com>',
                    to: [user.email],
                    subject: renderedSubject,
                    html: renderedHtml
                })
            })

            if (!res.ok) {
                const errorText = await res.text()
                console.error("Resend API Error:", errorText)
                throw new Error(`Error enviando email: ${errorText}`)
            }

            console.log("Email 2FA enviado correctamente");

        } catch (emailError) {
             console.error("Fallo envío email:", emailError)
             await adminClient.from('auth_codes').delete().eq('code_hash', otp)
             throw new Error(`No se pudo enviar el correo de verificación: ${emailError.message}`) 
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

    throw new Error('Acción no reconocida')

  } catch (error) {
    console.error("Error en Edge Function:", error.message)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
