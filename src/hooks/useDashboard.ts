import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '@/services/dashboardService';
import { DashboardFilters } from '@/types/dashboard';

export function useDashboard(filters: DashboardFilters) {
    return useQuery({
        queryKey: ['dashboard', filters.tienda_id, filters], // La llave incluye los filtros
        queryFn: () => getDashboardMetrics(filters),
        enabled: !!filters.tienda_id,
        staleTime: 1000 * 60 * 3, // 3 Minutos de frescura antes de pedir una actualización silenciosa
    });
}
