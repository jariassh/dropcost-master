export type UserRole = 'cliente' | 'lider' | 'admin' | 'superadmin';
export type SubscriptionStatus = 'activa' | 'cancelada' | 'suspendida' | 'pendiente' | 'trial' | 'inactiva';

export interface User {
    id: string;
    email: string;
    nombres: string;
    apellidos: string;
    rol: UserRole;
    estado_suscripcion: SubscriptionStatus | null;
    telefono?: string;
    pais?: string;
    email_verificado: boolean;
    "2fa_habilitado": boolean;

    // Referral System Fields
    codigo_referido_personal?: string;
    wallet_saldo?: number;

    fecha_registro: string;
    ultima_actividad?: string;
    plan_id?: string; // ID del plan suscrito
}

export interface UserFilters {
    search?: string;
    status?: SubscriptionStatus | 'all';
    role?: UserRole | 'all';
    plan?: string | 'all';
}

export interface PaginatedUsersResponse {
    data: User[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
