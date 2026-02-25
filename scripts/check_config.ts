import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function checkConfig() {
    const envContent = fs.readFileSync('.env', 'utf8');
    const env: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1');
        }
    });

    const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

    console.log('--- Configuración Global ---');
    const { data: config, error } = await supabase
        .from('configuracion_global')
        .select('email_domain, email_contacto')
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Config:', JSON.stringify(config, null, 2));
    }
}

checkConfig();
