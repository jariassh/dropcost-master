import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wauqudcethbrebrdacqi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdXF1ZGNldGhicmVicmRhY3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTc1NDgsImV4cCI6MjA4NjU5MzU0OH0.JVeOk4XUjLNVRinB6Vvz0a9BdGUz32T24CY1hlgJuC4'
)

async function list() {
  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('id, name, slug, status')
    .order('slug')

  if (error) { console.error('ERROR:', error.message); return; }
  
  console.log(`\nPLANTILLAS EN DB (${templates?.length ?? 0}):\n`)
  for (const t of templates ?? []) {
    console.log(`  slug: "${t.slug}" | name: "${t.name}" | status: ${t.status}`)
  }
}

list()
