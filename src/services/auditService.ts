import { supabase } from '@/lib/supabase';
import { AuditLog, AuditFilters, AuditAction } from '../types/audit.types';

export const auditService = {
  /**
   * Registra un evento en el log de auditoría
   */
  async recordLog(log: Omit<AuditLog, 'id' | 'created_at' | 'usuario'>) {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          usuario_id: log.usuario_id,
          entidad: log.entidad,
          entidad_id: log.entidad_id,
          accion: log.accion,
          detalles: log.detalles,
          ip_address: log.ip_address,
          user_agent: log.user_agent
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error recording audit log:', error);
    }
  },

  /**
   * Obtiene los logs de auditoría con filtros y paginación
   */
  async getLogs(filters: AuditFilters, page = 1, pageSize = 20) {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          usuario:usuarios(nombres, apellidos, email)
        `, { count: 'exact' });

      // Aplicar filtros
      if (filters.usuario_id) {
        query = query.eq('usuario_id', filters.usuario_id);
      }
      if (filters.entidad) {
        query = query.eq('entidad', filters.entidad);
      }
      if (filters.accion) {
        query = query.eq('accion', filters.accion);
      }
      if (filters.fechaInicio) {
        query = query.gte('created_at', `${filters.fechaInicio}T00:00:00`);
      }
      if (filters.fechaFin) {
        query = query.lte('created_at', `${filters.fechaFin}T23:59:59.999`);
      }

      // Ordenar por fecha descendente
      query = query.order('created_at', { ascending: false });

      // Paginación
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as AuditLog[],
        count: count || 0
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return { data: [], count: 0 };
    }
  }
};
