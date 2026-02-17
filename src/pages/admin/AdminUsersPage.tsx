import React from 'react';
import { UserList } from '../../components/admin/UserList';

export const AdminUsersPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Usuarios</h1>
                    <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Administra los usuarios registrados, sus roles y planes activos.
                    </p>
                </div>
            </div>

            <UserList />
        </div>
    );
};
