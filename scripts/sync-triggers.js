import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
    if (line.trim().startsWith('#')) return;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const stagingUrl = env['VITE_SUPABASE_URL'];
const stagingKey = env['VITE_SUPABASE_ANON_KEY'];
const stagingSupabase = createClient(stagingUrl, stagingKey);

async function main() {
    console.log("Reading templates from output...");
    const outputPath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\8b6804e4-03e5-4d7b-8acc-ea64561679f3\\.system_generated\\steps\\970\\output.txt';
    let content = fs.readFileSync(outputPath, 'utf8');
    try {
        content = JSON.parse(content);
    } catch (e) { }

    const firstBracket = content.indexOf('[');
    const lastBracket = content.lastIndexOf(']');
    let templatesJSON = content.substring(firstBracket, lastBracket + 1);
    const templates = JSON.parse(templatesJSON);

    // Fetch all triggers from Staging
    const { data: triggers, error } = await stagingSupabase.from('email_triggers').select('*');
    if (error) {
        console.error("Error fetching triggers:", error);
        return;
    }

    const triggerMap = {};
    triggers.forEach(t => triggerMap[t.codigo_evento] = t.id);

    console.log(`Found ${templates.length} templates. Setting up triggers...`);

    // Using service role? Wait, we can't insert into email_plantillas_triggers with ANON key if RLS blocks it.
    // Instead we dump the SQL and execute it manually
    let sql = 'BEGIN;\n';

    for (const t of templates) {
        if (!t.trigger_event) continue;

        const stagingTriggerId = triggerMap[t.trigger_event];
        if (stagingTriggerId) {
            // we have the match
            sql += `INSERT INTO public.email_plantillas_triggers (plantilla_id, trigger_id, activo, fecha_asociacion) VALUES ('${t.id}', '${stagingTriggerId}', true, now()) ON CONFLICT DO NOTHING;\n`;
        } else {
            console.log("No staging trigger found for event:", t.trigger_event);
        }
    }
    sql += 'COMMIT;\n';
    fs.writeFileSync('scripts/sync-triggers.sql', sql, 'utf8');
    console.log("Generated scripts/sync-triggers.sql!");
}

main().catch(console.error);
