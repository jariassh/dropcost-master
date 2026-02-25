import { supabase } from '@/lib/supabase';
import type { AuditLog, AuditAction, AuditFilters } from '@/types/audit.types';

/**
 * Registra un nuevo evento en el log de auditoría
 */
export const recordLog = async (params: {
  accion: AuditAction | string;
  entidad: AuditLog['entidad'] | string;
  entidadId?: string;
  detalles?: Record<string, any>;
}): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('audit_logs').insert({
      usuario_id: user.id,
      accion: params.accion,
      entidad: params.entidad,
      entidad_id: params.entidadId,
      detalles: params.detalles || {},
      user_agent: navigator.userAgent
    });

    if (error) {
      console.error('AuditService: Error al registrar log:', error);
    }
  } catch (error) {
    console.error('AuditService: Excepción al registrar log:', error);
  }
};

/**
 * Registra una acción de auditoría (alias para compatibilidad).
 */
export const logUserActivity = async (accion: string, detalles: any = {}, entidad: any = 'SYSTEM', entidad_id: any = null) => {
    return recordLog({ 
        accion, 
        detalles, 
        entidad, 
        entidadId: entidad_id 
    });
};

/**
 * Obtiene los logs de auditoría con filtros (Solo para administradores)
 */
export const getLogs = async (filters: AuditFilters = {}, page = 1, limit = 50): Promise<{ data: AuditLog[], count: number }> => {
  try {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        usuario:users(nombres, apellidos, email, pais)
      `, { count: 'exact' });

    if (filters.usuario_id) query = query.eq('usuario_id', filters.usuario_id);
    if (filters.accion) query = query.eq('accion', filters.accion);
    if (filters.entidad) query = query.eq('entidad', filters.entidad);
    
    if (filters.fechaInicio) {
      query = query.gte('created_at', `${filters.fechaInicio}T00:00:00`);
    }
    if (filters.fechaFin) {
      query = query.lte('created_at', `${filters.fechaFin}T23:59:59.999`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: (data as any[]) || [],
      count: count || 0
    };
  } catch (error) {
    console.error('AuditService: Error al obtener logs:', error);
    return { data: [], count: 0 };
  }
};

/**
 * Obtiene los registros de actividad del usuario actual para el perfil.
 */
export const fetchUserActivityLogs = async (limit = 20): Promise<AuditLog[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('audit_logs')
            .select(`
                *,
                usuario:users(nombres, apellidos, email, pais)
            `)
            .eq('usuario_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return (data as unknown) as AuditLog[];
    } catch (error) {
        console.error('AuditService: Error al obtener actividad personal:', error);
        return [];
    }
};

export const auditService = {
  recordLog,
  logUserActivity,
  getLogs,
  fetchUserActivityLogs
};
