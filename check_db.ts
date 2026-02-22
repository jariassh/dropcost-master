import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const { data: triggers } = await supabase.from('email_triggers').select('codigo_evento, nombre')
console.log('TRIGGERS:', triggers)

const { data: associations } = await supabase
    .from('email_plantillas_triggers')
    .select('*, email_triggers(codigo_evento), email_templates(slug)')

console.log('ASSOCIATIONS:', associations)
