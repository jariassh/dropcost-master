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
    const { email, password, nombres, apellidos, pais, telefono, referred_by } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Create user (email_confirm: false keeps them unverified)
    // IMPORTANT: admin.createUser usually DOES NOT send the default Supabase email
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { nombres, apellidos, pais, telefono, referred_by, rol: 'cliente' },
      email_confirm: false // Keep them as unverified so they MUST click our link
    })

    if (authError) throw authError

    const userId = authUser.user.id

    // 2. Generar link de verificación (signup)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/login?verified=true`
      }
    })

    const verificationLink = linkError ? '' : linkData.properties.action_link

    // 3. Enviar Bienvenida Directamente
    console.log(`[auth-register] Enviando Bienvenida directa para: ${userId}`);
    let welcomeRes = null;
    let welcomeErr = null;
    try {
      const resp = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/email-trigger-dispatcher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        },
        body: JSON.stringify({
          codigo_evento: 'USUARIO_REGISTRADO',
          targetId: userId,
          datos: {
            usuario_id: userId,
            usuario_nombre: `${nombres} ${apellidos}`.trim(),
            nombres: `${nombres} ${apellidos}`.trim(),
            usuario_email: email,
            email: email,
            fecha_registro: new Date().toISOString().split('T')[0],
            codigo_referido: referred_by || '',
            verification_link: verificationLink,
            reset_link: verificationLink, // Por si acaso
            link: verificationLink
          }
        })
      });
      welcomeRes = await resp.json();
    } catch (e: any) {
      welcomeErr = { message: e.message };
    }

    // 3. Enviar Referido Directamente
    let refRes = null;
    let refErr = null;
    if (referred_by) {
      try {
        const resp = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/email-trigger-dispatcher`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          },
          body: JSON.stringify({
            codigo_evento: 'REFERIDO_REGISTRADO',
            refersToUserId: userId,
            datos: {
              usuario_id: userId,
              referido_nombre: `${nombres} ${apellidos}`.trim(),
              referido_email: email,
              codigo_referido: referred_by,
              fecha_registro: new Date().toISOString().split('T')[0],
            }
          })
        });
        refRes = await resp.json();
      } catch (e: any) {
        refErr = { message: e.message };
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        debug: {
          welcome: welcomeErr ? { error: welcomeErr.message } : welcomeRes,
          referral: referred_by ? (refErr ? { error: refErr.message } : refRes) : 'none'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('[auth-register] Error crítico:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
