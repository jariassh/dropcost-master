import { supabase } from '@/lib/supabase';
import { AuditLog, AuditFilters, AuditAction } from '../types/audit.types';

export const auditService = {
  /**
   * Registra un evento en el log de auditoría
   */
  async recordLog(log: Omit<AuditLog, 'id' | 'created_at' | 'usuario' | 'usuario_id' | 'ip_address' | 'user_agent'> & { usuario_id?: string | null, ip_address?: string | null, user_agent?: string | null }) {
    try {
      // 1. Si no viene usuario_id explícito, intentar obtenerlo de la sesión
      let userId = log.usuario_id;
      if (!userId) {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      }

      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          usuario_id: userId,
          entidad: log.entidad,
          entidad_id: log.entidad_id,
          accion: log.accion,
          detalles: log.detalles,
          ip_address: log.ip_address,
          user_agent: log.user_agent || navigator.userAgent // Fallback to current browser UA
        }]);

      if (error) {
          console.error('Supabase Audit Log Error:', error);
          throw error;
      };
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
        .select('*', { count: 'exact' });

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

      const { data: logs, error, count } = await query;

      if (error) throw error;
      
      // Enriquecer logs con datos de usuario manualmente si el JOIN falla
      // Esto es robusto ante falta de FK
      const auditLogs = logs as unknown as AuditLog[];
      if (auditLogs && auditLogs.length > 0) {
        // cast to any to allow filter(Boolean) without strict null check issues in quick fix
        const userIds = [...new Set(auditLogs.map(l => l.usuario_id).filter((id): id is string => !!id))];
        
        if (userIds.length > 0) {
            const { data: users, error: userError } = await supabase
                .from('users')
                .select('id, nombres, apellidos, email')
                .in('id', userIds);
            
            if (userError) {
                console.error('Error fetching users for logs:', userError);
            }

            if (users) {
                auditLogs.forEach(log => {
                    const user = users.find((u: { id: string }) => u.id === log.usuario_id);
                    if (user) {
                        log.usuario = {
                            nombres: user.nombres || '',
                            apellidos: user.apellidos || '',
                            email: user.email || ''
                        };
                    } else {
                        // Intento de fallback por si hay discrepancia de tipos
                        const userSoft = users.find((u: { id: string }) => String(u.id) === String(log.usuario_id));
                        if (userSoft) {
                             log.usuario = {
                                nombres: userSoft.nombres || '',
                                apellidos: userSoft.apellidos || '',
                                email: userSoft.email || ''
                            };
                        }
                    }
                });
            }
        }
      }

      return {
        data: auditLogs,
        count: count || 0
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return { data: [], count: 0 };
    }
  }
};
