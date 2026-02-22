import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      throw new Error('Email es requerido')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Obtener datos del usuario por email
    // Usamos admin para saltar RLS
    const { data: { users }, error: fetchError } = await supabaseAdmin.auth.admin.listUsers()
    const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (fetchError || !targetUser) {
      // Por seguridad, no revelamos si el email no existe, pero retornamos éxito falso interno
      console.warn(`[auth-password-reset] Email no encontrado: ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Si el correo existe, recibirás un enlace pronto.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 2. Generar el enlace de recuperación manualmente
    // Tipo 'recovery' es para restablecer contraseña
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: { 
        redirectTo: `${new URL(req.url).origin}/actualizar-contrasena` 
      }
    })

    if (linkError) throw linkError

    const resetLink = linkData.properties.action_link

    // 3. Disparar el trigger de email personalizado
    console.log(`[auth-password-reset] Disparando email USUARIO_OLVIDO_CONTRASENA para: ${email}`);
    
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/email-trigger-dispatcher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      },
      body: JSON.stringify({
        codigo_evento: 'USUARIO_OLVIDO_CONTRASENA',
        targetId: targetUser.id,
        datos: {
          usuario_id: targetUser.id,
          usuario_nombre: `${targetUser.user_metadata?.nombres || ''} ${targetUser.user_metadata?.apellidos || ''}`.trim(),
          usuario_email: email,
          reset_link: resetLink,
          horas_validez: '24'
        }
      })
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Enlace enviado correctamente.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('[auth-password-reset] Error crítico:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
