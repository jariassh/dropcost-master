import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
    // skip comments
    if (line.trim().startsWith('#')) return;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const stagingUrl = env['VITE_SUPABASE_URL'];
const stagingKey = env['VITE_SUPABASE_ANON_KEY'];

const stagingSupabase = createClient(stagingUrl, stagingKey);

async function main() {
    console.log("Reading templates from output...");
    // Read the output.txt from the execute_sql step
    const outputPath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\8b6804e4-03e5-4d7b-8acc-ea64561679f3\\.system_generated\\steps\\970\\output.txt';
    let content = fs.readFileSync(outputPath, 'utf8');
    try {
        content = JSON.parse(content);
    } catch (e) {
        // Maybe it wasn't a JSON string wrapper
    }

    // Extract JSON part
    const firstBracket = content.indexOf('[');
    const lastBracket = content.lastIndexOf(']');

    if (firstBracket === -1 || lastBracket === -1) {
        console.error("Could not find boundaries in output");
        return;
    }

    let templatesJSON = content.substring(firstBracket, lastBracket + 1);
    let templates;
    try {
        templates = JSON.parse(templatesJSON);
    } catch (e) {
        console.error("Failed parsing JSON", e);
        return;
    }

    console.log(`Found ${templates.length} templates. Inserting into staging...`);

    for (const t of templates) {
        // Prepare the record, avoiding mismatch columns if any
        const record = {
            id: t.id,
            nombre: t.name || t.nombre || t.slug,
            slug: t.slug,
            subject: t.subject,
            content_mjml: t.mjml_content || t.content_mjml || null,
            content_html: t.html_content || t.content_html || null,
            created_at: t.created_at
        };

        const { data, error } = await stagingSupabase
            .from('email_templates')
            .upsert(record);

        if (error) {
            console.error(`Error inserting template ${t.slug}:`, error.message);
        } else {
            console.log(`Inserted template: ${t.slug}`);
        }
    }
    console.log("Done syncing email_templates!");
}

main().catch(console.error);
