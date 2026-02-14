/** Tipos comunes reutilizables en toda la aplicación */

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type AlertType = 'success' | 'error' | 'warning' | 'info';
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'modern-success' | 'modern-warning' | 'modern-error' | 'modern-info' | 'pill-success' | 'pill-error' | 'pill-warning' | 'pill-info' | 'pill-purple';
export type SpinnerSize = 'sm' | 'md' | 'lg';
export type ModalSize = 'sm' | 'md' | 'lg';

export interface ToastMessage {
    id: string;
    type: AlertType;
    title: string;
    description?: string;
    duration?: number;
}

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

/** Tipo genérico para respuestas de API */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/** Paginación */
export interface PaginationParams {
    page: number;
    limit: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
