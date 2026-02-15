/** Tipos para el módulo de auditoría */

export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'CREATE_STORE' 
  | 'UPDATE_STORE' 
  | 'DELETE_STORE'
  | 'CREATE_COSTEO'
  | 'UPDATE_COSTEO'
  | 'DELETE_COSTEO'
  | 'CHANGE_PLAN'
  | 'UPDATE_PROFILE'
  | 'ENABLE_2FA'
  | 'DISABLE_2FA'
  | 'ADMIN_UPDATE_USER'
  | 'ADMIN_DELETE_USER';

export interface AuditLog {
  id: string;
  usuario_id: string;
  accion: AuditAction;
  entidad: 'USER' | 'STORE' | 'COSTEO' | 'SUBSCRIPTION' | 'SYSTEM';
  entidad_id?: string;
  detalles?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  // Join con usuario para mostrar nombre en admin
  usuario?: {
    nombres: string;
    apellidos: string;
    email: string;
  };
}

export interface AuditFilters {
  usuario_id?: string;
  accion?: AuditAction;
  entidad?: string;
  fechaInicio?: string;
  fechaFin?: string;
}
