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
  | 'SUBSCRIPTION_CHANGE'
  | 'UPDATE_PROFILE'
  | 'ENABLE_2FA'
  | 'DISABLE_2FA'
  | 'ADMIN_UPDATE_USER'
  | 'ADMIN_DELETE_USER';

export interface AuditLog {
  id: string;
  usuario_id: string | null;
  accion: AuditAction | string;
  entidad: 'USER' | 'STORE' | 'COSTEO' | 'SUBSCRIPTION' | 'SYSTEM' | string;
  entidad_id?: string | null;
  detalles?: Record<string, any> | any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  // Join con usuario para mostrar nombre en admin
  usuario?: {
    nombres: string;
    apellidos: string;
    email: string;
    pais: string;
  };
}

export interface AuditFilters {
  usuario_id?: string;
  accion?: AuditAction | string;
  entidad?: string;
  fechaInicio?: string;
  fechaFin?: string;
}
