export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'CREATE_STORE' 
  | 'UPDATE_STORE' 
  | 'DELETE_STORE' 
  | 'CREATE_COSTEO' 
  | 'UPDATE_COSTEO' 
  | 'DELETE_COSTEO' 
  | 'UPDATE_PROFILE' 
  | 'SUBSCRIPTION_CHANGE';

export interface AuditLog {
  id: string;
  usuario_id: string | null;
  entidad: 'USER' | 'STORE' | 'COSTEO' | 'SUBSCRIPTION' | 'SYSTEM';
  entidad_id: string | null;
  accion: AuditAction;
  detalles: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  usuario?: {
    nombres: string;
    apellidos: string;
    email: string;
  };
}

export interface AuditFilters {
  usuario_id?: string;
  entidad?: string;
  accion?: AuditAction;
  fechaInicio?: string;
  fechaFin?: string;
}
