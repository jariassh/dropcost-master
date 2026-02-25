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
    console.log(`[auth-password-reset] INICIO - Procesando recuperación para: ${email}`);

    if (!email) {
      console.error('[auth-password-reset] ERROR: Email no proporcionado en el body');
      throw new Error('Email es requerido')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Obtener datos del usuario por email usando la API de Admin
    console.log(`[auth-password-reset] Paso 1: Buscando usuario en Auth...`);
    const { data: { users }, error: fetchError } = await supabaseAdmin.auth.admin.listUsers()
    const targetUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (fetchError || !targetUser) {
      console.warn(`[auth-password-reset] ADVERTENCIA: Email no encontrado en Auth: ${email}`, fetchError);
      return new Response(
        JSON.stringify({ success: true, message: 'Si el correo existe, recibirás un enlace pronto.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    console.log(`[auth-password-reset] Usuario encontrado: ID=${targetUser.id}`);

    // 2. Obtener URL del sitio desde la configuración global
    console.log(`[auth-password-reset] Paso 2: Obteniendo site_url de configuracion_global...`);
    const { data: config, error: configError } = await supabaseAdmin
      .from('configuracion_global')
      .select('site_url')
      .limit(1)
      .maybeSingle();
      
    if (configError) console.error(`[auth-password-reset] Error al leer config:`, configError);
    
    const appUrl = config?.site_url || 'https://app.dropcost.com';
    console.log(`[auth-password-reset] URL de la app detectada: ${appUrl}`);

    // 3. Generar el enlace de recuperación manualmente
    console.log(`[auth-password-reset] Paso 3: Generando action_link de recuperación...`);
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: { 
        redirectTo: `${appUrl.replace(/\/+$/, '')}/actualizar-contrasena` 
      }
    })

    if (linkError) {
      console.error(`[auth-password-reset] ERROR al generar link:`, linkError);
      throw linkError;
    }

    const resetLink = linkData.properties.action_link
    console.log(`[auth-password-reset] Link generado exitosamente`);

    // 4. Disparar el trigger de email personalizado
    const dispatcherPayload = {
      codigo_evento: 'USUARIO_OLVIDO_CONTRASENA',
      targetId: targetUser.id,
      datos: {
        usuario_id: targetUser.id,
        nombres: `${targetUser.user_metadata?.nombres || ''} ${targetUser.user_metadata?.apellidos || ''}`.trim(),
        usuario_email: email,
        reset_link: resetLink,
        link: resetLink,
        horas_validez: '24'
      }
    };

    console.log(`[auth-password-reset] Paso 4: Llamando a email-trigger-dispatcher...`);
    console.log(`[auth-password-reset] Payload para dispatcher:`, JSON.stringify(dispatcherPayload));
    
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
      console.error(`[auth-password-reset] ERROR en Dispatcher - Status: ${dispatcherRes.status}`);
      console.error(`[auth-password-reset] Body del error del Dispatcher:`, errorBody);
      throw new Error(`Dispatcher falló con código ${dispatcherRes.status}: ${errorBody}`);
    }

    const dispatcherData = await dispatcherRes.json();
    console.log(`[auth-password-reset] ÉXITO: Email enviado via dispatcher`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Enlace enviado correctamente.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('[auth-password-reset] Error detallado:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 // Cambiamos a 200 para que resData contenga el error en el frontend
      }
    )
  }
})
