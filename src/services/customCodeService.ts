import { supabase } from '@/lib/supabase';

export interface CustomCodeSnippet {
    id: string;
    name: string;
    code: string;
    location: 'head' | 'body_start' | 'body_end';
    status: boolean;
    apply_to: string[]; // e.g. ["all"], ["landing"], ["admin"]
    priority: number;
    created_at?: string;
    updated_at?: string;
}

export const customCodeService = {
    /**
     * Obtiene todos los fragmentos (solo para admins)
     */
    async getAllSnippets(): Promise<CustomCodeSnippet[]> {
        const { data, error } = await (supabase as any)
            .from('custom_code_snippets')
            .select('*')
            .order('priority', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Obtiene solo los fragmentos activos para el sitio
     */
    async getActiveSnippets(): Promise<CustomCodeSnippet[]> {
        const { data, error } = await (supabase as any)
            .from('custom_code_snippets')
            .select('*')
            .eq('status', true)
            .order('priority', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Crea o actualiza un fragmento
     */
    async saveSnippet(snippet: Partial<CustomCodeSnippet>): Promise<void> {
        const { error } = await (supabase as any)
            .from('custom_code_snippets')
            .upsert({
                ...snippet,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
    },

    /**
     * Elimina un fragmento
     */
    async deleteSnippet(id: string): Promise<void> {
        const { error } = await (supabase as any)
            .from('custom_code_snippets')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
