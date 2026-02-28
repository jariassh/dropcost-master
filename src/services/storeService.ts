/**
 * Servicio para la gestión de tiendas en Supabase.
 */
import { supabase } from '@/lib/supabase';
import type { Tienda, TiendaInsert, TiendaUpdate } from '@/types/store.types';
import { auditService } from './auditService';
import { encryptionUtils } from '@/utils/encryptionUtils';

export const storeService = {
    /**
     * Obtiene todas las tiendas vinculadas a un usuario específico.
     */
    async getTiendas(userId: string): Promise<Tienda[]> {
        const { data, error } = await supabase
            .from('tiendas')
            .select('*')
            .eq('usuario_id', userId)
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
                detalles: { nombre: data.nombre, pais: data.pais }
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
        // 1. Obtener datos antes de borrar para el log
        const { data: tienda } = await supabase
            .from('tiendas')
            .select('nombre, pais')
            .eq('id', id)
            .single();

        const { error } = await supabase
            .from('tiendas')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error al eliminar tienda:', error);
            throw new Error('No se pudo eliminar la tienda');
        }

        // Log Auditoría
        auditService.recordLog({
            accion: 'DELETE_STORE',
            entidad: 'STORE',
            entidadId: id,
            detalles: { 
                id, 
                nombre: tienda?.nombre || 'Tienda eliminada',
                pais: tienda?.pais 
            }
        });
    },

    /**
     * Guarda o actualiza la integración de Shopify para una tienda.
     */
    async upsertShopifyIntegration(tiendaId: string, data: { access_token?: string, shop_url?: string, status: 'conectado' | 'desconectado' | 'error' }) {
        const { data: existing } = await supabase
            .from('integraciones')
            .select('id')
            .eq('tienda_id', tiendaId)
            .eq('tipo', 'shopify')
            .maybeSingle();

        // Encriptar token si existe
        const encryptedToken = data.access_token ? encryptionUtils.encrypt(data.access_token) : null;

        const integrationData = {
            tienda_id: tiendaId,
            tipo: 'shopify',
            estado: data.status,
            credenciales_encriptadas: encryptedToken,
            config_sync: {
                shop_url: data.shop_url,
                backfill_status: 'pending'
            },
            ultima_sincronizacion: null
        };

        if (existing) {
            const { error } = await supabase
                .from('integraciones')
                .update(integrationData)
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('integraciones')
                .insert(integrationData);
            if (error) throw error;
        }
    }
};
