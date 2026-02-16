import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, ChevronRight, User as UserIcon, Globe } from 'lucide-react';
import { userService } from '../../services/userService';
import { plansService } from '../../services/plansService';
import { User, UserFilters, SubscriptionStatus } from '../../types/user.types';
import { Plan } from '../../types/plans.types';
import { UserStatusBadge } from './UserStatusBadge';
import { UserPlanBadge } from './UserPlanBadge';
import { UserDetailSlideOver } from './UserDetailSlideOver';
import { Button, Spinner, Card } from '../common';

export const UserList: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<UserFilters>({
        search: '',
        status: 'all',
        plan: 'all'
    });
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [plans, setPlans] = useState<Plan[]>([]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await userService.fetchUsers(page, 10, filters);
            setUsers(response.data);
            setTotalPages(response.totalPages);
            setTotalCount(response.count);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [filters, page]);

    useEffect(() => {
        plansService.getPlans(false).then(setPlans);
    }, []);

    // Sync selected user when users list is updated (e.g. after plan change)
    useEffect(() => {
        if (selectedUser) {
            const updatedUser = users.find(u => u.id === selectedUser.id);
            if (updatedUser) {
                setSelectedUser(updatedUser);
            }
        }
    }, [users]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
        setPage(1);
    };

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
        setIsSlideOverOpen(true);
    };

    const formatLastActivity = (date?: string) => {
        if (!date) return 'N/A';
        const now = new Date();
        const activityDate = new Date(date);
        const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / 60000);

        if (diffInMinutes < 1) return 'Justo ahora';
        if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `Hace ${diffInHours} horas`;
        return activityDate.toLocaleDateString();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '600px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email..."
                            value={filters.search}
                            onChange={handleSearchChange}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 42px',
                                backgroundColor: 'var(--bg-primary)',
                                border: '1.5px solid var(--border-color)',
                                borderRadius: '12px',
                                fontSize: '14px',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                transition: 'all 0.2s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>

                    <select
                        className="dc-input"
                        style={{
                            padding: '10px 16px',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '12px',
                            fontSize: '14px',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            outline: 'none',
                            flex: '1 1 auto',
                            minWidth: '150px'
                        }}
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="activa">Activos</option>
                        <option value="suspendida">Suspendidos</option>
                        <option value="pendiente">Pendientes</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }} className="w-full sm:w-auto">
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {totalCount > 0 ? `${(page - 1) * 10 + 1}-${Math.min(page * 10, totalCount)} de ${totalCount}` : '0 usuarios'}
                    </p>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            style={{
                                padding: '8px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                backgroundColor: 'var(--bg-primary)',
                                color: page === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                cursor: page === 1 ? 'default' : 'pointer',
                                opacity: page === 1 ? 0.5 : 1
                            }}
                        >
                            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            style={{
                                padding: '8px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                backgroundColor: 'var(--bg-primary)',
                                color: page === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                cursor: page === totalPages ? 'default' : 'pointer',
                                opacity: page === totalPages ? 0.5 : 1
                            }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <Button onClick={() => { }} style={{ borderRadius: '12px', padding: '0 20px', height: '44px' }} className="w-full sm:w-auto">
                        <Plus size={18} style={{ marginRight: '8px' }} /> Crear Usuario
                    </Button>
                </div>
            </div>

            {/* Table Card */}
            <Card noPadding style={{ overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rol</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actividad</th>
                                <th style={{ padding: '16px 24px' }}></th>
                            </tr>
                        </thead>
                        <tbody style={{ backgroundColor: 'var(--card-bg)' }}>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '60px', textAlign: 'center' }}>
                                        <Spinner size="lg" />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                        No se encontraron usuarios que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr
                                        key={user.id}
                                        onClick={() => handleUserClick(user)}
                                        style={{
                                            borderBottom: '1px solid var(--border-color)',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <div style={{
                                                        width: '42px',
                                                        height: '42px',
                                                        borderRadius: '12px',
                                                        background: 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontWeight: 700,
                                                        fontSize: '14px',
                                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                                    }}>
                                                        {user.nombres.charAt(0)}{user.apellidos.charAt(0)}
                                                    </div>
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '-2px',
                                                        right: '-2px',
                                                        width: '12px',
                                                        height: '12px',
                                                        backgroundColor: '#10B981',
                                                        border: '2px solid var(--card-bg)',
                                                        borderRadius: '50%'
                                                    }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.nombres} {user.apellidos}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'capitalize' }}>
                                                <UserIcon size={14} style={{ color: 'var(--color-primary)' }} />
                                                {user.rol}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <UserPlanBadge planId={user.plan_id || ''} plans={plans} />
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <UserStatusBadge status={user.estado_suscripcion || 'pendiente'} planId={user.plan_id} />
                                        </td>
                                        <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                            {formatLastActivity(user.ultima_actividad)}
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <UserDetailSlideOver
                user={selectedUser}
                isOpen={isSlideOverOpen}
                onClose={() => setIsSlideOverOpen(false)}
                onUserUpdate={fetchUsers}
                plans={plans}
            />
        </div>
    );
};
