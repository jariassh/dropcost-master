import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://wauqudcethbrebrdacqi.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdXF1ZGNldGhicmVicmRhY3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTc1NDgsImV4cCI6MjA4NjU5MzU0OH0.JVeOk4XUjLNVRinB6Vvz0a9BdGUz32T24CY1hlgJuC4')

async function check() {
  const { data, error } = await supabase.from('configuracion_global').select('favicon_url, logo_principal_url').limit(1).single()
  console.log('CONFIG:', data)
}
check()
