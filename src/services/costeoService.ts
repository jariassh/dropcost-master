/**
 * costeoService.ts - Gestión de costeos en Supabase.
 */
import { supabase } from '@/lib/supabase';
import type { SavedCosteo } from '@/types/simulator';
import { auditService } from './auditService';

export const costeoService = {
    /**
     * Lista todos los costeos de una tienda.
     */
    async listCosteos(tiendaId: string): Promise<SavedCosteo[]> {
        const { data, error } = await supabase
            .from('costeos')
            .select('*')
            .eq('tienda_id', tiendaId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error listing costeos:', error);
            throw new Error('No se pudieron cargar los costeos');
        }

        return (data as any) || [];
    },

    /**
     * Obtiene un costeo por ID.
     */
    async getCosteo(id: string): Promise<SavedCosteo> {
        const { data, error } = await supabase
            .from('costeos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error getting costeo:', error);
            throw new Error('No se pudo cargar el costeo');
        }

        return data as any;
    },

    /**
     * Crea un costeo vacío (consume cuota).
     */
    async createEmptyCosteo(nombreProducto: string, tiendaId: string): Promise<SavedCosteo> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { data, error } = await supabase
            .from('costeos')
            .insert({
                nombre_producto: nombreProducto,
                tienda_id: tiendaId,
                usuario_id: user.id,
                estado: 'vacio'
            } as any)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('Ya existe un costeo con este nombre en esta tienda');
            }
            console.error('Error creating empty costeo:', error);
            throw new Error('No se pudo crear el costeo');
        }

        auditService.recordLog({
            accion: 'CREATE_COSTEO_EMPTY',
            entidad: 'COSTEO',
            entidadId: data.id,
            detalles: { nombre: nombreProducto }
        });

        return data as any;
    },

    /**
     * Guarda los parámetros de un costeo.
     */
    async saveCosteo(id: string, updates: Partial<SavedCosteo>): Promise<SavedCosteo> {
        const { data, error } = await supabase
            .from('costeos')
            .update({
                ...updates,
                estado: 'guardado',
                updated_at: new Date().toISOString()
            } as any)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error saving costeo:', error);
            throw new Error('No se pudo guardar el costeo');
        }

        return data as any;
    },

    /**
     * Duplica un costeo existente (consume cuota).
     */
    async duplicateCosteo(costeo: SavedCosteo): Promise<SavedCosteo> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { id, created_at, updated_at, ...toClone } = costeo;

        const { data, error } = await supabase
            .from('costeos')
            .insert({
                ...toClone,
                nombre_producto: `${costeo.nombre_producto} (copia)`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            } as any)
            .select()
            .single();

        if (error) {
            console.error('Error duplicating costeo:', error);
            throw new Error('No se pudo duplicar el costeo');
        }

        return data as any;
    },

    /**
     * Elimina un costeo.
     */
    async deleteCosteo(id: string): Promise<void> {
        const { error } = await supabase
            .from('costeos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting costeo:', error);
            throw new Error('No se pudo eliminar el costeo');
        }

        auditService.recordLog({
            accion: 'DELETE_COSTEO',
            entidad: 'COSTEO',
            entidadId: id,
            detalles: { id }
        });
    },

    /**
     * Obtiene el uso de la cuota para una tienda/usuario.
     */
    async getStoreQuota(tiendaId: string): Promise<{ used: number; limit: number }> {
        const { count, error } = await supabase
            .from('costeos')
            .select('*', { count: 'exact', head: true })
            .eq('tienda_id', tiendaId);

        if (error) {
            console.error('Error getting quota:', error);
            throw new Error('No se pudo calcular la cuota');
        }

        // El límite debería venir del plan del usuario. 
        // Por ahora simularemos que recuperamos el plan del authStore o de una tabla de configuración.
        // Pero para el servicio, retornamos el conteo.
        return { used: count || 0, limit: 100 }; // Placeholder limit
    }
};
