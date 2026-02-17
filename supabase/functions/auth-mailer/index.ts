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

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) throw new Error('RESEND_API_KEY no configurada')

    /**
     * Función interna para enviar vía email-service (evitamos fetch externo si podemos, 
     * pero para mantener desacoplamiento usaremos la misma lógica de renderizado)
     */
    const sendEmail = async (slug: string, to: string, vars: any) => {
        // En lugar de hacer un fetch a sí mismo (re-entrada), usamos la base directamente
        const { data: template } = await adminClient
            .from('email_templates')
            .select('*')
            .eq('slug', slug)
            .maybeSingle()
        
        if (!template) throw new Error(`Plantilla no encontrada: ${slug}`)

        const render = (str: string, v: any) => str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => v[k] || _)
        
        let fromEmail = 'Soporte DropCost <soporte@dropcost.jariash.com>'
        if (slug === 'welcome') fromEmail = 'Bienvenida DropCost <bienvenida@dropcost.jariash.com>'

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: fromEmail,
                to: [to],
                subject: render(template.subject, vars),
                html: render(template.html_content, vars),
            })
        })
        if (!res.ok) throw new Error(await res.text())
        return await res.json()
    }

    if (action === 'reset_password') {
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: { redirectTo: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/reset-password` }
      })
      if (linkError) throw linkError

      await sendEmail('password_reset', email, { link: linkData.properties.action_link })

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'welcome_confirmation') {
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: 'signup',
            email: email,
            options: { redirectTo: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/login` }
          })
    
          if (linkError) throw linkError
    
          await sendEmail('welcome', email, { 
              nombres: data?.nombres || 'Usuario',
              link: linkData.properties.action_link 
          })

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
