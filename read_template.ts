import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://wauqudcethbrebrdacqi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdXF1ZGNldGhicmVicmRhY3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTc1NDgsImV4cCI6MjA4NjU5MzU0OH0.JVeOk4XUjLNVRinB6Vvz0a9BdGUz32T24CY1hlgJuC4')

async function check() {
  const { data: trigger } = await supabase.from('email_triggers').select('id').eq('codigo_evento', 'USUARIO_OLVIDO_CONTRASENA').single()
  if (!trigger) return console.log('No trigger found')
  
  const { data: assoc } = await supabase.from('email_plantillas_triggers').select('plantilla_id').eq('trigger_id', trigger.id).limit(1).single()
  if (!assoc) return console.log('No association found')
  
  const { data: template } = await supabase.from('email_templates').select('slug, name, html_content').eq('id', assoc.plantilla_id).single()
  console.log('TEMPLATE:', template.slug, template.name)
  console.log('HTML:', template.html_content)
}
check()
