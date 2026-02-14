import React from 'react';
import { UserList } from '../../components/admin/UserList';

export const AdminUsersPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Administra los usuarios registrados, sus roles y estados de suscripción.
                    </p>
                </div>
                {/* Aquí podrían ir botones de acción global como "Exportar CSV" o "Crear Usuario" en el futuro */}
            </div>

            <UserList />
        </div>
    );
};
