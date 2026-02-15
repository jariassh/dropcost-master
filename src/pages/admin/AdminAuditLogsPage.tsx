import React from 'react';
import { AuditLogsList } from '../../components/admin/AuditLogsList';
import { History } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                        Logs de Auditoría
                    </h1>
                    <p style={{ marginTop: '8px', fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Registro histórico de todas las acciones críticas realizadas en el sistema.
                    </p>
                </div>
                <div style={{
                    padding: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)'
                }}>
                    <History size={24} />
                </div>
            </div>

            <AuditLogsList />
        </div>
    );
};
