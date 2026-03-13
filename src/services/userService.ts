import { supabase } from '@/lib/supabase';
import { User, UserFilters, PaginatedUsersResponse, SubscriptionStatus } from '../types/user.types';

export const userService = {
    /**
     * Obtiene la lista de usuarios con paginación y filtros desde Supabase
     */
    async fetchUsers(
        page: number = 1,
        pageSize: number = 10,
        filters?: UserFilters
    ): Promise<PaginatedUsersResponse> {
        let query = supabase
            .from('users')
            .select('*', { count: 'exact' });

        // Apply filters
        if (filters) {
            if (filters.search) {
                const search = `%${filters.search.toLowerCase()}%`;
                query = query.or(`email.ilike.${search},nombres.ilike.${search},apellidos.ilike.${search}`);
            }

            if (filters.status && filters.status !== 'all') {
                if (filters.status === 'sin_verificar') {
                    query = query.eq('rol', 'suscriptor');
                } else if (filters.status === 'activa') {
                    // Clientes premium son aquellos con rol 'cliente'
                    query = query.eq('rol', 'cliente');
                } else if (filters.status === 'usuario' as any) {
                    // Usuarios free son aquellos con rol 'usuario'
                    query = query.eq('rol', 'usuario');
                } else {
                    query = query.eq('estado_suscripcion', filters.status);
                }
            }

            if (filters.role && filters.role !== 'all') {
                query = query.eq('rol', filters.role);
            }

            if (filters.plan && filters.plan !== 'all') {
                query = query.eq('plan_id', filters.plan);
            }
        }

        // Pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await query
            .order('fecha_registro', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Error fetching users from Supabase:', error);
            return {
                data: [],
                count: 0,
                page,
                pageSize,
                totalPages: 0
            };
        }

        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / pageSize);

        return {
            data: data as unknown as User[],
            count: totalCount,
            page,
            pageSize,
            totalPages
        };
    },

    /**
     * Obtiene un usuario por su ID
     */
    async getUserById(id: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching user by ID:', error);
            return null;
        }

        return data as unknown as User;
    },

    /**
     * Actualiza el estado de suscripción de un usuario
     */
    async updateUserStatus(id: string, status: SubscriptionStatus): Promise<boolean> {
        const { error } = await supabase
            .from('users')
            .update({ estado_suscripcion: status })
            .eq('id', id);

        if (error) {
            console.error('Error updating user status:', error);
            return false;
        }

        return true;
    },

    /**
     * Busca usuarios de forma rápida por email o nombres
     */
    async searchUsers(query: string): Promise<User[]> {
        const search = `%${query.toLowerCase()}%`;
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`email.ilike.${search},nombres.ilike.${search},apellidos.ilike.${search}`)
            .limit(5);

        if (error) {
            console.error('Error searching users:', error);
            return [];
        }

        return data as unknown as User[];
    },

    /**
     * Actualiza los datos de un usuario por su ID
     */
    async updateUser(id: string, data: Partial<User>): Promise<boolean> {
        const { error } = await supabase
            .from('users')
            .update(data)
            .eq('id', id);

        if (error) {
            console.error('Error updating user:', error);
            return false;
        }

        return true;
    },

    /**
     * Envía un correo de restablecimiento de contraseña
     */
    async sendPasswordResetEmail(email: string): Promise<boolean> {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            console.error('Error sending password reset email:', error);
            return false;
        }

        return true;
    },

    /**
     * Elimina un usuario que no ha verificado su email.
     * Esta acción es irreversible y limpia la base de datos de registros basura.
     */
    async deleteUnverifiedUser(id: string): Promise<{ success: boolean; error?: string }> {
        // En una implementación real, esto debería llamar a una Edge Function 
        // para eliminar también de auth.users si es necesario.
        // Por ahora eliminamos el perfil de la tabla public.users.
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id)
            .eq('email_verificado', false); // Seguridad extra

        if (error) {
            console.error('Error deleting unverified user:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    },

    /**
     * Obtiene los roles únicos de los usuarios registrados
     */
    async getUniqueRoles(): Promise<string[]> {
        const { data, error } = await supabase
            .from('users')
            .select('rol');

        if (error) {
            console.error('Error fetching unique roles:', error);
            return [];
        }

        const roles = data.map((u: any) => u.rol).filter(Boolean);
        return [...new Set(roles)] as string[];
    }
};
