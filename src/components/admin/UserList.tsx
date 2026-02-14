import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { User, UserFilters, SubscriptionStatus } from '../../types/user.types';
import { UserStatusBadge } from './UserStatusBadge';
import { UserDetailSlideOver } from './UserDetailSlideOver';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';

export const UserList: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<UserFilters>({
        search: '',
        status: 'all',
    });
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await userService.fetchUsers(page, 10, filters);
            setUsers(response.data);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [filters, page]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
        setPage(1); // Reset page on filter change
    };

    const handleStatusChange = (value: string) => {
        setFilters(prev => ({ ...prev, status: value as SubscriptionStatus | 'all' }));
        setPage(1);
    };

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
        setIsSlideOverOpen(true);
    };

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Filtros y Búsqueda */}
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="w-full md:w-1/3">
                    <Input
                        placeholder="Buscar por nombre o email..."
                        value={filters.search}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="w-full md:w-1/4">
                    <Select
                        label="Estado"
                        value={filters.status || 'all'}
                        onChange={(value) => handleStatusChange(value)}
                        options={[
                            { value: 'all', label: 'Todos los estados' },
                            { value: 'activa', label: 'Activa' },
                            { value: 'cancelada', label: 'Cancelada' },
                            { value: 'suspendida', label: 'Suspendida' },
                            { value: 'pendiente', label: 'Pendiente' },
                        ]}
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Usuario
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rol
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado Plan
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha Registro
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center">
                                    <Spinner size="lg" />
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                    No se encontraron usuarios.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                    {user.nombres.charAt(0)}{user.apellidos.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.nombres} {user.apellidos}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-900 capitalize">{user.rol}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <UserStatusBadge status={user.estado_suscripcion} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.fecha_registro).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleUserClick(user)}
                                        >
                                            Ver Detalles
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Mostrando página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span>
                        </p>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

            <UserDetailSlideOver
                user={selectedUser}
                isOpen={isSlideOverOpen}
                onClose={() => setIsSlideOverOpen(false)}
            />
        </div>
    );
};
