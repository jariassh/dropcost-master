import { supabase } from '@/lib/supabase';
import type { Oferta } from '@/types/ofertas';

export const ofertaService = {
    async getOfertas(tiendaId: string, userId: string): Promise<Oferta[]> {
        const { data, error } = await supabase
            .from('ofertas')
            .select('*')
            .eq('tienda_id', tiendaId)
            .eq('usuario_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching ofertas:', error);
            throw error;
        }

        return (data || []).map(this.mapToOferta);
    },

    async createOferta(oferta: Omit<Oferta, 'id' | 'createdAt'>): Promise<Oferta> {
        const { data, error } = await supabase
            .from('ofertas')
            .insert([{
                usuario_id: oferta.userId,
                tienda_id: oferta.storeId,
                costeo_id: oferta.costeoId,
                nombre_producto: oferta.productName,
                tipo_estrategia: oferta.strategyType,
                ganancia_estimada: oferta.estimatedProfit,
                margen_estimado_porcentaje: oferta.estimatedMarginPercent,
                configuracion_json: {
                    discountConfig: oferta.discountConfig,
                    bundleConfig: oferta.bundleConfig,
                    giftConfig: oferta.giftConfig
                } as any
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating oferta:', error);
            throw error;
        }

        return this.mapToOferta(data);
    },

    async deleteOferta(id: string): Promise<void> {
        const { error } = await supabase
            .from('ofertas')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting oferta:', error);
            throw error;
        }
    },

    async getOfertasCount(usuarioId: string): Promise<number> {
        const { count, error } = await supabase
            .from('ofertas')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', usuarioId);

        if (error) {
            console.error('Error getting ofertas count:', error);
            return 0;
        }

        return count || 0;
    },

    mapToOferta(dbRow: any): Oferta {
        return {
            id: dbRow.id,
            userId: dbRow.usuario_id,
            storeId: dbRow.tienda_id,
            costeoId: dbRow.costeo_id,
            productName: dbRow.nombre_producto,
            strategyType: dbRow.tipo_estrategia,
            discountConfig: dbRow.configuracion_json?.discountConfig,
            bundleConfig: dbRow.configuracion_json?.bundleConfig,
            giftConfig: dbRow.configuracion_json?.giftConfig,
            estimatedProfit: dbRow.ganancia_estimada,
            estimatedMarginPercent: dbRow.margen_estimado_porcentaje,
            createdAt: dbRow.created_at
        };
    }
};
