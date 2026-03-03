import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configService } from '@/services/configService';

export function useEmailTemplates() {
    const queryClient = useQueryClient();

    const { data: templates = [], isLoading, refetch } = useQuery({
        queryKey: ['email-templates'],
        queryFn: () => configService.getEmailTemplates(),
        staleTime: 1000 * 60 * 5, // 5 minutos
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: any }) => 
            configService.updateEmailTemplate(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
        },
    });

    const createMutation = useMutation({
        mutationFn: (template: any) => configService.createEmailTemplate(template),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => configService.deleteEmailTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
        },
    });

    return {
        templates,
        isLoading,
        refetch,
        updateTemplate: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        createTemplate: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        deleteTemplate: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
    };
}
