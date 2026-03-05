import { supabase } from '@/lib/supabase';
import { 
    ShopifyCliente, 
    ContactListResponse, 
    ContactDownloadAudit 
} from '@/types/contacts.types';

/**
 * Servicio Avanzado para la gestión de contactos.
 * Sigue el RF: MÓDULO CONTACTOS CON DESCARGO DE RESPONSABILIDAD (GDPR Compliance).
 */
export const contactService = {
    /**
     * Obtiene la lista de contactos sincronizados para una tienda.
     * Solo devuelve datos si el módulo está habilitado.
     */
    async getContacts(tienda_id: string, filters: { 
        page?: number, 
        limit?: number, 
        search?: string, 
        pais?: string 
    }): Promise<ContactListResponse> {
        const { page = 1, limit = 20, search, pais } = filters;
        
        if (!tienda_id) throw new Error('tienda_id es requerido');

        // 1. Verificar si el módulo está habilitado para esta tienda
        const { data: acceptance, error: accError } = await supabase
            .from('contact_module_acceptance' as any)
            .select('*')
            .eq('tienda_id', tienda_id)
            .eq('estado', 'activo')
            .maybeSingle();

        if (accError) {
            console.error('Error verificando aceptación de módulo:', accError);
            throw accError;
        }

        const isEnabled = !!acceptance;

        if (!isEnabled) {
            return {
                contacts: [],
                total: 0,
                is_module_enabled: false
            };
        }

        // 2. Obtener los contactos mediante paginación y filtros
        let query = supabase
            .from('shopify_clientes' as any)
            .select('*', { count: 'exact' })
            .eq('tienda_id', tienda_id);

        if (search) {
            query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%,telefono.ilike.%${search}%`);
        }

        if (pais) {
            query = query.eq('pais', pais);
        }

        // Aplicar paginación
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, count, error } = await query
            .order('ultima_compra_fecha', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Error fetching contacts:', error);
            throw error;
        }

        return {
            contacts: ((data as any[]) || []) as ShopifyCliente[],
            total: count || 0,
            is_module_enabled: true,
            acceptance_date: (acceptance as any)?.aceptado_en
        };
    },

    /**
     * Registra la aceptación del módulo de contactos.
     */
    async enableModule(tienda_id: string, user_id: string): Promise<boolean> {
        const { error } = await supabase
            .from('contact_module_acceptance' as any)
            .upsert({
                tienda_id,
                user_id,
                aceptado_en: new Date().toISOString(),
                estado: 'activo'
                // ip_address y user_agent se podrían capturar aquí si fuera necesario
            }, { onConflict: 'tienda_id,user_id' });

        if (error) {
            console.error('Error enabling contact module:', error);
            throw error;
        }

        return true;
    },

    /**
     * Registra una auditoría de descarga de datos personales.
     */
    async logDownload(audit: Partial<ContactDownloadAudit>): Promise<void> {
        const { error } = await supabase
            .from('contact_downloads' as any)
            .insert([{
                ...audit,
                descargado_en: new Date().toISOString()
            }]);

        if (error) {
            console.error('Error logging download:', error);
            // No bloqueamos el flujo si falla el log, pero lo reportamos
        }
    },

    /**
     * Revoca el acceso al módulo de contactos (Zona Peligrosa).
     */
    async revokeModule(tienda_id: string, user_id: string): Promise<boolean> {
        const { error } = await supabase
            .from('contact_module_acceptance' as any)
            .update({ 
                estado: 'revocado',
                revocado_en: new Date().toISOString()
            })
            .eq('tienda_id', tienda_id)
            .eq('user_id', user_id);

        if (error) {
            console.error('Error revoking module:', error);
            throw error;
        }

        return true;
    },

    /**
     * Verifica si el módulo está habilitado y retorna la fecha de aceptación.
     */
    async checkModuleStatus(tienda_id: string): Promise<{ isEnabled: boolean, acceptanceDate?: string }> {
        if (!tienda_id) return { isEnabled: false };

        const { data, error } = await supabase
            .from('contact_module_acceptance' as any)
            .select('aceptado_en')
            .eq('tienda_id', tienda_id)
            .eq('estado', 'activo')
            .maybeSingle();

        if (error) {
            console.error('Error checking module status:', error);
            return { isEnabled: false };
        }

        return {
            isEnabled: !!data,
            acceptanceDate: (data as any)?.aceptado_en
        };
    }
};
