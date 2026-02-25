import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function checkHistorial() {
    try {
        const envContent = fs.readFileSync('.env', 'utf8');
        const env: Record<string, string> = {};
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1');
                env[key] = value;
            }
        });

        const url = env.VITE_SUPABASE_URL;
        const key = env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
             console.error('Faltan variables de entorno en .env');
             return;
        }

        const supabase = createClient(url, key);

        console.log('--- Consultando Historial ---');
        const { data: historial, error: hError } = await supabase
            .from('email_historial')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (hError) {
            console.error('Error Historial:', hError);
        } else {
            historial?.forEach(h => {
                console.log(`[${h.created_at}] To: ${h.usuario_email} | Trigger: ${h.trigger_id} | Status: ${h.estado} | Error: ${h.razon_error}`);
            });
        }

        console.log('\n--- Consultando Trigger AUTH_EMAIL_CHANGE_CODE ---');
        const { data: trigger, error: tError } = await supabase
            .from('email_triggers')
            .select('*')
            .eq('codigo_evento', 'AUTH_EMAIL_CHANGE_CODE')
            .maybeSingle();
        
        if (tError) {
            console.error('Error Trigger:', tError);
        } else {
            console.log('Trigger Info:', JSON.stringify(trigger, null, 2));
        }

    } catch (err) {
        console.error('Error Fatal:', err);
    }
}

checkHistorial();
