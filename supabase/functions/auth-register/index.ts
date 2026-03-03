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

    // 3. Paralelizar envío de correos (Bienvenida y Referido)
    console.log(`[auth-register] Disparando correos en paralelo para: ${userId}`);
    
    const emailPromises = [];

    // Promesa de Bienvenida
    const welcomePromise = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/email-trigger-dispatcher`, {
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
          reset_link: verificationLink,
          link: verificationLink,
          horas_validez: '24'
        }
      })
    }).then(res => res.json()).catch(e => ({ error: e.message }));

    emailPromises.push(welcomePromise);

    // Promesa de Referido (si aplica)
    let referralPromise = Promise.resolve('none');
    if (referred_by) {
      referralPromise = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/email-trigger-dispatcher`, {
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
      }).then(res => res.json()).catch(e => ({ error: e.message }));
      emailPromises.push(referralPromise);
    }

    const [welcomeResult, referralResult] = await Promise.all([
      welcomePromise,
      referralPromise
    ]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        debug: {
          welcome: welcomeResult,
          referral: referralResult
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
