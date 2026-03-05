import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const sb = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: { session }, error: authError } = await sb.auth.signInWithPassword({
        email: 'test@example.com', // wait, I don't know the user's password.
    });

    const { data, error } = await sb.from('tiendas').select('*').eq('nombre', 'Tienda Chile');
    // If not authenticated, we can use the service role key if we export it
    console.log('Tienda:', data);
    
    if (data && data.length > 0) {
        const id = data[0].id;
        const res = await sb.rpc('get_dashboard_pro_data', { p_tienda_id: id });
        console.log('RPC Res:', JSON.stringify(res.data, null, 2));
    }
}
run();
