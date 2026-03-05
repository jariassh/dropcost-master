import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const sb = createClient(supabaseUrl, supabaseKey);

async function run() {
    // try to get definition from pg_proc
    const query = `
        SELECT prosrc
        FROM pg_proc
        WHERE proname = 'get_dashboard_pro_data';
    `;
    
    // Instead of raw query, try to use rpc to execute a query, or if not possible just get data
    const res = await sb.from('costeos').select('meta_spend, tienda_id').not('meta_spend', 'is', null).limit(10);
    console.log('Costeos with meta_spend:', res.data);
}
run();
