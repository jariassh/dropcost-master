import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { action, email, data } = await req.json()

    if (action === 'reset_password') {
      // 1. Generar link de recuperación usando Service Role
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/reset-password`
        }
      })

      if (linkError) throw linkError

      const resetLink = linkData.properties.action_link

      // 2. Enviar via Resend
      const resendKey = Deno.env.get('RESEND_API_KEY')
      if (!resendKey) throw new Error('RESEND_API_KEY no configurada')

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Soporte DropCost <soporte@dropcost.jariash.com>',
          to: [email],
          subject: 'Restablece tu contraseña en DropCost Master',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
              <h2 style="color: #0066FF; text-align: center;">Recuperación de Contraseña</h2>
              <p>Hola,</p>
              <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>DropCost Master</strong>.</p>
              <p>Haz clic en el siguiente botón para elegir una nueva contraseña:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #0066FF; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                  Restablecer Contraseña
                </a>
              </div>
              <p style="font-size: 13px; color: #666;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
              <p style="font-size: 11px; color: #0066FF; word-break: break-all;">${resetLink}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #999; text-align: center;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
            </div>
          `
        })
      })

      if (!res.ok) throw new Error(`Resend error: ${await res.text()}`)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'welcome_confirmation') {
        // Para registros, Supabase ya envía el correo si está activado.
        // Si quisiéramos personalizarlo 100%, tendríamos que desactivar el de Supabase
        // y generar el link aquí de tipo 'signup'.
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: 'signup',
            email: email,
            options: {
              redirectTo: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/login`
            }
          })
    
          if (linkError) throw linkError
    
          const confirmLink = linkData.properties.action_link
          const nombres = data?.nombres || 'Usuario';

          const resendKey = Deno.env.get('RESEND_API_KEY')
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Bienvenida DropCost <bienvenida@dropcost.jariash.com>',
              to: [email],
              subject: `¡Bienvenido a DropCost Master, ${nombres}! Confirma tu cuenta`,
              html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
                  <h2 style="color: #0066FF; text-align: center;">¡Bienvenido a la Familia DropCost!</h2>
                  <p>Hola <strong>${nombres}</strong>,</p>
                  <p>Estamos muy emocionados de tenerte con nosotros. Has dado el primer paso para profesionalizar tus costos y maximizar tus ganancias.</p>
                  <p>Por favor, confirma tu correo electrónico haciendo clic en el botón de abajo:</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${confirmLink}" style="background-color: #0066FF; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                      Confirmar mi Cuenta
                    </a>
                  </div>
                  <p style="font-size: 12px; color: #999; text-align: center;">Si no creaste esta cuenta, simplemente ignora este mensaje.</p>
                </div>
              `
            })
          })

          if (!res.ok) throw new Error(`Resend error: ${await res.text()}`)

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
    }

    throw new Error('Acción no permitida')

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
