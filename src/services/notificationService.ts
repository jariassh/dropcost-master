/**
 * Servicio para el sistema de notificaciones.
 * Ref: /docs/DropCost_Master_Especificacion_Requerimientos.md §7.3
 */

import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types/notifications';

/**
 * Obtiene las notificaciones del usuario actual.
 */
export async function fetchNotifications(): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.is_read,
        link: n.link,
        metadata: n.metadata,
        createdAt: n.created_at
    }));
}

/**
 * Marca una notificación como leída.
 */
export async function markAsRead(id: string): Promise<boolean> {
    const { error } = await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

    if (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
    return true;
}

/**
 * Marca todas las notificaciones como leídas.
 */
export async function markAllAsRead(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
    }
    return true;
}

/**
 * Elimina una notificación.
 */
export async function deleteNotification(id: string): Promise<boolean> {
    const { error } = await (supabase as any)
        .from('notifications')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting notification:', error);
        return false;
    }
    return true;
}
