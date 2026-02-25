
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Faltan variables de entorno VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('Insertando triggers de seguridad...');
  
  const triggers = [
    {
      nombre_trigger: 'Seguridad - Código de Cambio de Email',
      descripcion: 'Se envía al nuevo correo cuando el usuario solicita cambiar su dirección de email.',
      codigo_evento: 'AUTH_EMAIL_CHANGE_CODE',
      categoria: 'usuario',
      variables_disponibles: ["${usuario_nombre}", "${email_nuevo}", "${email_anterior}", "${codigo}", "${expira_en}"],
      tipo_disparador: 'automatico',
      tabla_origen: 'auth_codes',
      evento_tipo: 'INSERT'
    },
    {
      nombre_trigger: 'Seguridad - Código 2FA',
      descripcion: 'Código de verificación para inicio de sesión o acciones sensibles.',
      codigo_evento: 'AUTH_2FA',
      categoria: 'usuario',
      variables_disponibles: ["${usuario_nombre}", "${usuario_email}", "${codigo}", "${expira_en}"],
      tipo_disparador: 'automatico',
      tabla_origen: 'auth_codes',
      evento_tipo: 'INSERT'
    }
  ];

  for (const t of triggers) {
    const { error } = await supabase
      .from('email_triggers')
      .upsert(t, { onConflict: 'codigo_evento' });

    if (error) {
      console.error(`Error al insertar ${t.codigo_evento}:`, error);
    } else {
      console.log(`Trigger ${t.codigo_evento} insertado/actualizado.`);
    }
  }
}

run();
