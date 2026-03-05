import React from 'react';
import { AuditLogsList } from '../../components/admin/AuditLogsList';
import { History } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '0 var(--main-padding)', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="dc-admin-header-row" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }} className="dc-admin-header-container">
                    <div style={{ flex: '1', minWidth: '280px' }} className="dc-admin-header-text">
                        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: 'var(--ls-h)', fontFamily: 'var(--font-headings)' }}>
                            Logs de Auditoría
                        </h1>
                        <p style={{ marginTop: '8px', fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            Registro histórico de todas las acciones del sistema.
                        </p>
                    </div>
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

            <AuditLogsList />
        </div>
    );
};
