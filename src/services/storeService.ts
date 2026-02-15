/**
 * Servicio para la gestión de tiendas en Supabase.
 */
import { supabase } from '@/lib/supabase';
import type { Tienda, TiendaInsert, TiendaUpdate } from '@/types/store.types';
import { auditService } from './auditService';

export const storeService = {
    /**
     * Obtiene todas las tiendas vinculadas al usuario actual.
     */
    async getTiendas(): Promise<Tienda[]> {
        const { data, error } = await supabase
            .from('tiendas')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al obtener tiendas:', error);
            throw new Error('No se pudieron cargar las tiendas');
        }

        return data || [];
    },

    /**
     * Crea una nueva tienda.
     */
    async createTienda(tienda: TiendaInsert): Promise<Tienda> {
        const { data, error } = await supabase
            .from('tiendas')
            .insert(tienda)
            .select()
            .single();

        if (error) {
            console.error('Error al crear tienda:', error);
            throw new Error('No se pudo crear la tienda');
        }

        if (data) {
            auditService.recordLog({
                accion: 'CREATE_STORE',
                entidad: 'STORE',
                entidadId: data.id,
                detalles: { nombre: data.nombre, pais: data.pais_id }
            });
        }

        return data;
    },

    /**
     * Actualiza los datos de una tienda.
     */
    async updateTienda(id: string, cambios: TiendaUpdate): Promise<Tienda> {
        const { data, error } = await supabase
            .from('tiendas')
            .update(cambios)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error al actualizar tienda:', error);
            throw new Error('No se pudo actualizar la tienda');
        }

        if (data) {
            auditService.recordLog({
                accion: 'UPDATE_STORE',
                entidad: 'STORE',
                entidadId: data.id,
                detalles: cambios
            });
        }

        return data;
    },

    /**
     * Elimina una tienda (marcar como inactiva o borrado físico).
     * Según políticas RLS, solo el dueño puede borrar.
     */
    async deleteTienda(id: string): Promise<void> {
        const { error } = await supabase
            .from('tiendas')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error al eliminar tienda:', error);
            throw new Error('No se pudo eliminar la tienda');
        }

        // Log Auditoría: Tienda eliminada
        auditService.recordLog({
            accion: 'DELETE_STORE',
            entidad: 'STORE',
            entidadId: id
        });
    }
};
