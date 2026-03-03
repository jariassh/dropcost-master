import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification } from '@/services/notificationService';
import { useAuthStore } from '@/store/authStore';

export function useNotifications() {
    const user = useAuthStore((s) => s.user);
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['notifications', user?.id],
        queryFn: () => fetchNotifications(),
        enabled: !!user?.id,
        staleTime: 1000 * 60, // 1 minuto de frescura
    });

    const markReadMutation = useMutation({
        mutationFn: (id: string) => markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        }
    });

    return {
        ...query,
        markAsRead: markReadMutation.mutate,
        markAllAsRead: markAllReadMutation.mutate,
        deleteNotification: deleteMutation.mutate
    };
}
