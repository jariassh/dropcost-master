import { useQuery } from '@tanstack/react-query';
import { storeService } from '@/services/storeService';
import { useAuthStore } from '@/store/authStore';

export function useStores() {
    const user = useAuthStore((s) => s.user);

    return useQuery({
        queryKey: ['stores', user?.id],
        queryFn: () => storeService.getTiendas(user!.id),
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
}
