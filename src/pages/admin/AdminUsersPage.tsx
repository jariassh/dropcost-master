import React from 'react';
import { UserList } from '../../components/admin/UserList';
import { PageHeader } from '@/components/common/PageHeader';
import { Users } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 var(--main-padding)', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <PageHeader
                title="Usuarios"
                description="Administra los usuarios registrados, sus roles y planes activos."
                icon={Users}
            />

            <style>{`
                @media (max-width: 767px) {
                    .dc-admin-header-row {
                        text-align: center !important;
                        margin-bottom: 8px;
                    }
                    .dc-admin-header-row h1 {
                        font-size: 22px !important;
                    }
                }
            `}</style>

            <UserList />
        </div>
    );
};
