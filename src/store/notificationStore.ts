/**
 * Store de notificaciones con Zustand.
 * Gestiona el estado de las alertas y mensajes del sistema.
 */
import { create } from 'zustand';
import type { Notification, NotificationState } from '@/types/notifications';
import * as notificationService from '@/services/notificationService';

interface NotificationActions {
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
}

export const useNotificationStore = create<NotificationState & NotificationActions>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await notificationService.fetchNotifications();
            set({
                notifications: data,
                unreadCount: data.filter(n => !n.isRead).length,
                isLoading: false
            });
        } catch (err) {
            set({ isLoading: false, error: 'Error al cargar notificaciones' });
        }
    },

    markAsRead: async (id: string) => {
        const success = await notificationService.markAsRead(id);
        if (success) {
            const updated = get().notifications.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            );
            set({
                notifications: updated,
                unreadCount: updated.filter(n => !n.isRead).length
            });
        }
    },

    markAllAsRead: async () => {
        const success = await notificationService.markAllAsRead();
        if (success) {
            const updated = get().notifications.map(n => ({ ...n, isRead: true }));
            set({
                notifications: updated,
                unreadCount: 0
            });
        }
    },

    deleteNotification: async (id: string) => {
        const success = await notificationService.deleteNotification(id);
        if (success) {
            const updated = get().notifications.filter(n => n.id !== id);
            set({
                notifications: updated,
                unreadCount: updated.filter(n => !n.isRead).length
            });
        }
    },

    // Para uso interno del frontend (optimistic updates o alertas temporales)
    addNotification: (notification) => {
        const newNotification: Notification = {
            ...notification,
            id: Math.random().toString(36).substring(7),
            isRead: false,
            createdAt: new Date().toISOString()
        };
        const updated = [newNotification, ...get().notifications];
        set({
            notifications: updated,
            unreadCount: updated.filter(n => !n.isRead).length
        });
    }
}));
