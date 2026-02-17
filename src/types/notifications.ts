/**
 * Tipos para el sistema de notificaciones.
 * Ref: /docs/DropCost_Master_Especificacion_Requerimientos.md §7.3
 */

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'alert';

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    link?: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}
