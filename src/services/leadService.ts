import { supabase } from '@/lib/supabase';

export interface Lead {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    pais: string;
    conversacion: any[];
    created_at: string;
    updated_at: string;
}

export const leadService = {
    async getLeads() {
        // En un escenario real con muchos leads usaríamos paginación, 
        // pero para el MVP traemos los últimos 1000 para los stats.
        const { data, error } = await supabase
            .from('consultas_anonimas')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1000);

        if (error) throw error;
        return data as Lead[];
    },

    async fetchLeads(page: number = 1, pageSize: number = 10, search: string = '') {
        let query = supabase
            .from('consultas_anonimas')
            .select('*', { count: 'exact' });

        if (search) {
            query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%,telefono.ilike.%${search}%`);
        }

        const { data, count, error } = await query
            .order('updated_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) throw error;

        return {
            data: data as Lead[],
            count: count || 0,
            totalPages: Math.ceil((count || 0) / pageSize)
        };
    },

    async getLeadById(id: string) {
        const { data, error } = await supabase
            .from('consultas_anonimas')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Lead;
    },

    async deleteLead(id: string) {
        const { error } = await supabase
            .from('consultas_anonimas')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
