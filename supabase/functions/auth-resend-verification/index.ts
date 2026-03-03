import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    console.log(`[auth-resend-verification] INICIO - Procesando reenvio para: ${email}`);

    if (!email) {
      console.error('[auth-resend-verification] ERROR: Email no proporcionado');
      throw new Error('Email es requerido')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Buscar usuario en Auth para obtener sus datos
    console.log(`[auth-resend-verification] Paso 1: Buscando usuario en Auth...`);
    const { data: { users }, error: fetchError } = await supabaseAdmin.auth.admin.listUsers()
    const targetUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (fetchError || !targetUser) {
      console.warn(`[auth-resend-verification] ADVERTENCIA: Email no encontrado: ${email}`, fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario no encontrado.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    console.log(`[auth-resend-verification] Usuario encontrado: ID=${targetUser.id}`);

    // Verificar si el email ya fue verificado
    if (targetUser.email_confirmed_at) {
      console.log(`[auth-resend-verification] Email ya verificado para: ${email}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Este email ya ha sido verificado.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 2. Obtener URL del sitio desde la configuracion global
    console.log(`[auth-resend-verification] Paso 2: Obteniendo site_url...`);
    const { data: config } = await supabaseAdmin
      .from('configuracion_global')
      .select('site_url')
      .limit(1)
      .maybeSingle();

    const appUrl = config?.site_url || 'https://app.dropcost.com';
    console.log(`[auth-resend-verification] URL de la app: ${appUrl}`);

    // 3. Generar link de verificacion de email (signup)
    console.log(`[auth-resend-verification] Paso 3: Generando link de verificacion...`);
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: `${appUrl.replace(/\/+$/, '')}/login?verified=true`
      }
    })

    if (linkError) {
      console.error(`[auth-resend-verification] ERROR al generar link:`, linkError);
      throw linkError;
    }

    const verificationLink = linkData.properties.action_link
    console.log(`[auth-resend-verification] Link generado exitosamente`);

    // 4. Obtener datos del perfil del usuario de la tabla users
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('nombres, apellidos')
      .eq('id', targetUser.id)
      .maybeSingle();

    const nombres = userProfile?.nombres
      || targetUser.user_metadata?.nombres
      || '';
    const apellidos = userProfile?.apellidos
      || targetUser.user_metadata?.apellidos
      || '';

    // 5. Disparar el trigger de email (USUARIO_REGISTRADO => plantilla de verificacion)
    console.log(`[auth-resend-verification] Paso 5: Llamando a email-trigger-dispatcher...`);
    const dispatcherPayload = {
      codigo_evento: 'USUARIO_REGISTRADO',
      targetId: targetUser.id,
      datos: {
        usuario_id: targetUser.id,
        usuario_nombre: `${nombres} ${apellidos}`.trim() || 'Usuario',
        nombres: `${nombres} ${apellidos}`.trim() || 'Usuario',
        usuario_email: email,
        email: email,
        fecha_registro: targetUser.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        verification_link: verificationLink,
        reset_link: verificationLink,
        link: verificationLink,
        horas_validez: '24'
      }
    };

    const dispatcherRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/email-trigger-dispatcher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      },
      body: JSON.stringify(dispatcherPayload)
    })

    if (!dispatcherRes.ok) {
      const errorBody = await dispatcherRes.text();
      console.error(`[auth-resend-verification] ERROR en Dispatcher - Status: ${dispatcherRes.status}`);
      console.error(`[auth-resend-verification] Body:`, errorBody);
      throw new Error(`Dispatcher fallo con codigo ${dispatcherRes.status}: ${errorBody}`);
    }

    const dispatcherData = await dispatcherRes.json();
    console.log(`[auth-resend-verification] Email de verificacion reenviado exitosamente`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email de verificacion reenviado correctamente.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('[auth-resend-verification] Error detallado:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})
