import { supabase } from '@/lib/supabase';

export interface AdminStats {
    totalUsers: number;
    activeSubscriptions: number;
    activeCoupons: number;
    systemAlerts: number;
    recentUsers: any[];
}

export const adminService = {
    /**
     * Obtiene estadísticas globales para el dashboard de administración
     */
    async getDashboardStats(): Promise<AdminStats> {
        try {
            // Usuarios Totales
            const { count: totalUsers, error: usersError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            if (usersError) console.error('AdminService: Error al contar usuarios:', usersError);

            // Suscripciones Activas (Excluyendo Plan Gratis y planes inactivos)
            const { count: activeSubs, error: subsError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('estado_suscripcion', 'activa')
                .neq('plan_id', 'plan_free');

            if (subsError) console.error('AdminService: Error al contar suscripciones:', subsError);

            // Usuarios Recientes (últimos 5)
            const { data: recentUsers, error: recentError } = await supabase
                .from('users')
                .select('*')
                .order('fecha_registro', { ascending: false })
                .limit(5);

            if (recentError) console.error('AdminService: Error al obtener usuarios recientes:', recentError);

            // Nota: Cupones y Alertas aún no tienen tablas dedicadas, 
            // devolveremos 0 por ahora o datos de placeholder controlados
            return {
                totalUsers: totalUsers || 0,
                activeSubscriptions: activeSubs || 0,
                activeCoupons: 0,
                systemAlerts: 0,
                recentUsers: recentUsers || []
            };
        } catch (error) {
            console.error('Error al obtener estadísticas de admin:', error);
            return {
                totalUsers: 0,
                activeSubscriptions: 0,
                activeCoupons: 0,
                systemAlerts: 0,
                recentUsers: []
            };
        }
    }
};
