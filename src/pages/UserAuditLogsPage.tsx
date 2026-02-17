import React from 'react';
import { AuditLogsList } from '@/components/admin/AuditLogsList';
import { useAuthStore } from '@/store/authStore';
import { History } from 'lucide-react';
import { PremiumFeatureGuard } from '@/components/common/PremiumFeatureGuard';

const UserAuditLogsPage: React.FC = () => {
    const { user } = useAuthStore();

    return (
        <PremiumFeatureGuard
            featureKey="view_activity_history"
            title="Historial de Actividad Premium"
            description={
                <>
                    El acceso al registro detallado de actividad está disponible para planes superiores.
                    <br />Mejora tu seguridad y control monitoreando cada acción en tu cuenta.
                </>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        padding: '12px',
                        borderRadius: '16px',
                        backgroundColor: 'var(--color-primary)',
                        color: '#FFF',
                        boxShadow: '0 8px 16px rgba(0,102,255,0.2)'
                    }}>
                        <History size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Historial de Actividad</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>
                            Revisa el registro cronológico de todas las acciones realizadas en tu cuenta.
                        </p>
                    </div>
                </div>

                <AuditLogsList userId={user?.id} hideUser={true} />
            </div>
        </PremiumFeatureGuard>
    );
};


export default UserAuditLogsPage;
