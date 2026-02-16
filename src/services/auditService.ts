import { supabase } from '@/lib/supabase';
import type { AuditLog, AuditFilters } from '@/types/audit.types';
export type { AuditLog, AuditFilters };

/**
 * Obtiene los registros de actividad del usuario actual para el perfil.
 */
export async function fetchUserActivityLogs(limit = 20): Promise<AuditLog[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('audit_logs')
        .select(`
            *,
            usuario:users(nombres, apellidos, email)
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching user activity logs:', error);
        return [];
    }

    return (data || []) as AuditLog[];
}

/**
 * Obtiene logs con filtros (para el panel de administración).
 */
export async function getLogs(filters: AuditFilters, page = 1, pageSize = 20) {
    let query = supabase
        .from('audit_logs')
        .select(`
            *,
            usuario:users(nombres, apellidos, email)
        `, { count: 'exact' });

    if (filters.usuario_id) query = query.eq('usuario_id', filters.usuario_id);
    if (filters.entidad) query = query.eq('entidad', filters.entidad);
    if (filters.accion) query = query.eq('accion', filters.accion);
    if (filters.fechaInicio) query = query.gte('created_at', filters.fechaInicio);
    if (filters.fechaFin) query = query.lte('created_at', filters.fechaFin);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
    }

    return {
        data: (data || []) as AuditLog[],
        count: count || 0
    };
}

/**
 * Registra una acción de auditoría.
 */
export async function logUserActivity(accion: string, detalles: any = {}, entidad: any = 'SYSTEM', entidad_id: any = null) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('audit_logs').insert({
        usuario_id: user.id,
        accion,
        entidad,
        entidad_id,
        detalles
    });

    if (error) {
        console.error('Error creating audit log:', error);
    }
}

// Exportación como objeto para compatibilidad
export const auditService = {
    fetchUserActivityLogs,
    getLogs,
    logUserActivity,
    /**
     * Alias compatible con implementaciones anteriores.
     */
    async recordLog({ accion, detalles, entidad, entidad_id }: any) {
        return logUserActivity(accion, detalles, entidad || 'SYSTEM', entidad_id);
    }
};
