import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    // Leer .env manualmente
    const envContent = fs.readFileSync('.env', 'utf8');
    const env: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length) {
            env[key.trim()] = values.join('=').trim().replace(/^"(.*)"$/, '$1');
        }
    });

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Faltan credenciales en .env');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Ejecutando migración: Agregar columna metadata a auth_codes...');

    // Nota: El cliente de JS no permite ALTER TABLE directamente fácilmente a menos que usemos RPC o SQL directo.
    // Como no tenemos un endpoint de RPC para SQL, lo mejor es avisar al usuario o intentar via CLI si es posible.
    // Sin embargo, podemos intentar una query cruda si el cliente lo soporta (no suele en supabase-js).
    
    console.log('Por favor, ejecuta el siguiente SQL en el editor de Supabase:');
    console.log('ALTER TABLE public.auth_codes ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\'::jsonb;');
}

runMigration();
