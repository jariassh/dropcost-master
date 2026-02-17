import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Función para renderizar variables en un string: "Hola {{nombres}}" -> "Hola Juan"
 */
function renderTemplate(content: string, variables: Record<string, any>) {
  return content.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
    
    if (!resendApiKey) throw new Error('RESEND_API_KEY no configurada en las variables de entorno.')

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Leer el body (slug del template, email destino y variables)
    const { slug, to, variables = {} } = await req.json()

    if (!slug || !to) {
      throw new Error('Faltan parámetros obligatorios: slug y to.')
    }

    // 1. Buscar la plantilla en la base de datos
    const { data: template, error: templateError } = await adminClient
      .from('email_templates')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (templateError) throw templateError
    if (!template) throw new Error(`No se encontró la plantilla con el slug: ${slug}`)

    // 2. Renderizar contenido
    const renderedSubject = renderTemplate(template.subject, variables)
    const renderedHtml = renderTemplate(template.html_content, variables)

    // 3. Enviar vía Resend API
    console.log(`Enviando email de tipo "${slug}" a ${to}...`)
    
    // Determinamos el remitente basado en el tipo de correo
    let fromEmail = 'Soporte DropCost <soporte@dropcost.jariash.com>'
    if (slug === '2fa') fromEmail = 'Seguridad DropCost <security@dropcost.jariash.com>'
    if (slug === 'welcome') fromEmail = 'Bienvenida DropCost <bienvenida@dropcost.jariash.com>'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject: renderedSubject,
        html: renderedHtml,
      })
    })

    if (!res.ok) {
      const errorDetail = await res.text()
      throw new Error(`Error en Resend API: ${errorDetail}`)
    }

    const resData = await res.json()
    console.log('Email enviado correctamente:', resData.id)

    return new Response(JSON.stringify({ success: true, messageId: resData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Email Service Error:', error.message)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200, // Retornamos 200 para capturar el JSON de error en el front
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
