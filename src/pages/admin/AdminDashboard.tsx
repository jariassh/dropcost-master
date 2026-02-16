import React, { useEffect, useState } from 'react';
import { Card } from '@/components/common/Card';
import { Users, CreditCard, Ticket, ShieldAlert } from 'lucide-react';
import { adminService, AdminStats } from '@/services/adminService';
import { Spinner } from '@/components/common/Spinner';

import { supabase } from '@/lib/supabase';
import { UserStatusBadge } from '@/components/admin/UserStatusBadge';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [metaStatus, setMetaStatus] = useState<'operativo' | 'pendiente' | 'error'>('pendiente');

    useEffect(() => {
        const fetchStats = async () => {
            const data = await adminService.getDashboardStats();
            setStats(data);

            // Simular verificación de Meta Ads (en el futuro será una query real)
            const { data: metaTokens } = await supabase.from('integraciones').select('id').eq('tipo', 'meta_ads').limit(1);
            setMetaStatus(metaTokens && metaTokens.length > 0 ? 'operativo' : 'pendiente');

            setLoading(false);
        };
        fetchStats();
    }, []);

    const statCards = [
        { label: 'Usuarios Totales', value: stats?.totalUsers.toString() || '0', icon: Users, color: '#3B82F6' },
        { label: 'Suscripciones Activas', value: stats?.activeSubscriptions.toString() || '0', icon: CreditCard, color: '#10B981' },
        { label: 'Cupones Activos', value: stats?.activeCoupons.toString() || '0', icon: Ticket, color: '#F59E0B' },
        { label: 'Alertas Sistema', value: stats?.systemAlerts.toString() || '0', icon: ShieldAlert, color: '#6B7280' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Header Section */}
            <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                    Panel de Administración
                </h1>
                <p style={{ marginTop: '8px', fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Resumen global del estado de DropCost Master y herramientas de gestión.
                </p>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                {statCards.map((stat) => (
                    <Card key={stat.label} hoverable>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div
                                style={{
                                    backgroundColor: `${stat.color}15`,
                                    color: stat.color,
                                    padding: '12px',
                                    borderRadius: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <stat.icon size={24} strokeWidth={2.5} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                                    {stat.label}
                                </p>
                                <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                                    {stat.value}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Secondary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }} className="max-lg:grid-cols-1">
                <Card title="Usuarios Recientes">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {!stats || stats.recentUsers.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)' }}>
                                <Users size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                                <p style={{ fontSize: '14px' }}>No hay usuarios recientes.</p>
                            </div>
                        ) : (
                            stats.recentUsers.map((user: any) => (
                                <div key={user.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '14px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontSize: '14px',
                                            fontWeight: 700
                                        }}>
                                            {user.nombres?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                                {user.nombres} {user.apellidos}
                                            </p>
                                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
                                                {user.plan_id === 'plan_pro' ? 'Plan Pro' :
                                                    user.plan_id === 'plan_enterprise' ? 'Plan Enterprise' :
                                                        'Plan Gratis'} • {new Date(user.fecha_registro).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <UserStatusBadge
                                        status={user.estado_suscripcion}
                                        planId={user.plan_id}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                <Card title="Estado del Sistema">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {[
                            { name: 'API Gateway (Edge)', status: 'Operativo', type: 'success' },
                            { name: 'Database (PostgreSQL)', status: 'Conectado', type: 'success' },
                            { name: 'Pasarela (Mercado Pago)', status: 'Activa', type: 'success' },
                            { name: 'Integración Meta Ads', status: metaStatus === 'operativo' ? 'Sincronizado' : 'Pendiente', type: metaStatus === 'operativo' ? 'success' : 'warning' },
                            { name: 'Storage (Assets)', status: 'Operativo', type: 'success' },
                        ].map((item) => (
                            <div key={item.name} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px',
                                borderRadius: '14px',
                                backgroundColor: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-color)'
                            }}>
                                <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: item.type === 'success' ? 'var(--color-success)' : 'var(--color-warning)'
                                    }} />
                                    <span style={{
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        color: item.type === 'success' ? 'var(--color-success)' : 'var(--color-warning)'
                                    }}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div >
        </div >
    );
};
