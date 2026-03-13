import React from 'react';
import { AuditLogsList } from '../../components/admin/AuditLogsList';
import { History } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';

export const AdminAuditLogsPage: React.FC = () => {
    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 var(--main-padding)', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <PageHeader
                title="Logs de Auditoría"
                description="Registro histórico de todas las acciones del sistema."
                icon={History}
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

            <AuditLogsList />
        </div>
    );
};
