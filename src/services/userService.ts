import { User, UserFilters, PaginatedUsersResponse, SubscriptionStatus } from '../types/user.types';

// Mock data for development until backend is fully connected
const MOCK_USERS: User[] = Array.from({ length: 25 }, (_, i) => ({
    id: `user-${i + 1}`,
    email: `usuario${i + 1}@ejemplo.com`,
    nombres: `Nombre${i + 1}`,
    apellidos: `Apellido${i + 1}`,
    rol: i === 0 ? 'superadmin' : i < 3 ? 'admin' : 'cliente',
    estado_suscripcion: i % 5 === 0 ? 'suspendida' : i % 7 === 0 ? 'cancelada' : 'activa',
    telefono: `+57 300 123 45${i.toString().padStart(2, '0')}`,
    pais: 'CO',
    email_verificado: true,
    "2fa_habilitado": i % 3 === 0,
    codigo_referido_personal: i % 2 === 0 ? `ref_user_${i + 1}` : undefined,
    wallet_saldo: i % 4 === 0 ? Math.floor(Math.random() * 500000) : 0,
    fecha_registro: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    ultima_actividad: new Date(Date.now() - Math.random() * 100000000).toISOString(),
}));

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const userService = {
    /**
     * Obtiene la lista de usuarios con paginación y filtros
     */
    async fetchUsers(
        page: number = 1,
        pageSize: number = 10,
        filters?: UserFilters
    ): Promise<PaginatedUsersResponse> {
        await delay(800); // Simulate network latency

        let filteredUsers = [...MOCK_USERS];

        // Apply filters
        if (filters) {
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                filteredUsers = filteredUsers.filter(user =>
                    user.email.toLowerCase().includes(searchLower) ||
                    user.nombres.toLowerCase().includes(searchLower) ||
                    user.apellidos.toLowerCase().includes(searchLower)
                );
            }

            if (filters.status && filters.status !== 'all') {
                filteredUsers = filteredUsers.filter(user => user.estado_suscripcion === filters.status);
            }

            if (filters.role && filters.role !== 'all') {
                filteredUsers = filteredUsers.filter(user => user.rol === filters.role);
            }
        }

        // Pagination
        const totalCount = filteredUsers.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        const startIndex = (page - 1) * pageSize;
        const paginatedData = filteredUsers.slice(startIndex, startIndex + pageSize);

        return {
            data: paginatedData,
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
        await delay(500);
        return MOCK_USERS.find(user => user.id === id) || null;
    },

    /**
     * Actualiza el estado de suscripción de un usuario
     */
    async updateUserStatus(id: string, status: SubscriptionStatus): Promise<boolean> {
        await delay(600);
        const userIndex = MOCK_USERS.findIndex(u => u.id === id);
        if (userIndex !== -1) {
            MOCK_USERS[userIndex].estado_suscripcion = status;
            return true;
        }
        return false;
    }
};
