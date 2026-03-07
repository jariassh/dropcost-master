import { useQuery } from '@tanstack/react-query';
import { 
    getMarketingStats, 
    getCampaigns, 
    getSegments, 
    getEmailTriggers, 
    getGlobalEmailHistory,
    getTemplates,
    deleteSegment,
    saveSegment
} from '@/services/marketingService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook para obtener las estadísticas generales de marketing
 */
export function useMarketingStats(tiendaId: string, userId: string) {
    return useQuery({
        queryKey: ['marketing-stats', tiendaId, userId],
        queryFn: () => getMarketingStats(tiendaId, userId),
        enabled: !!tiendaId && !!userId,
        staleTime: 1000 * 60 * 5, 
    });
}

/**
 * Hook para obtener las campañas de email
 */
export function useMarketingCampaigns(tiendaId: string, userId: string) {
    return useQuery({
        queryKey: ['marketing-campaigns', tiendaId, userId],
        queryFn: () => getCampaigns(tiendaId, userId),
        enabled: !!tiendaId && !!userId,
        staleTime: 1000 * 60 * 2, 
    });
}

/**
 * Hook para obtener los segmentos (Smart Lists)
 */
export function useMarketingSegments(tiendaId: string, userId: string) {
    return useQuery({
        queryKey: ['marketing-segments', tiendaId, userId],
        queryFn: () => getSegments(tiendaId, userId),
        enabled: !!tiendaId && !!userId,
        staleTime: 1000 * 60 * 10, 
    });
}

/**
 * Hook para obtener los triggers de automatización
 */
export function useEmailTriggers() {
    return useQuery({
        queryKey: ['marketing-triggers'],
        queryFn: () => getEmailTriggers(),
        staleTime: 1000 * 60 * 15,
    });
}

/**
 * Hook para obtener el historial global de envíos
 */
export function useEmailHistory(limit = 200) {
    return useQuery({
        queryKey: ['marketing-history', limit],
        queryFn: () => getGlobalEmailHistory(limit),
        staleTime: 1000 * 60 * 1,
    });
}

/**
 * Hook para obtener las plantillas de email
 */
export function useMarketingTemplates() {
    return useQuery({
        queryKey: ['marketing-templates'],
        queryFn: () => getTemplates(),
        staleTime: 0, 
    });
}

/**
 * Hook para eliminar un segmento
 */
export function useDeleteSegment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteSegment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing-segments'] });
            queryClient.invalidateQueries({ queryKey: ['marketing-stats'] });
        },
    });
}

/**
 * Hook para guardar o actualizar un segmento
 */
export function useSaveSegment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (segment: any) => saveSegment(segment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing-segments'] });
            queryClient.invalidateQueries({ queryKey: ['marketing-stats'] });
        },
    });
}
