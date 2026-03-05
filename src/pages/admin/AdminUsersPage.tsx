import React from 'react';
import { UserList } from '../../components/admin/UserList';

export const AdminUsersPage: React.FC = () => {
    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 var(--main-padding)', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="dc-admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        Usuarios
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Administra los usuarios registrados, sus roles y planes activos.
                    </p>
                </div>
            </div>

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
