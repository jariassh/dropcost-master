/**
 * Página del Sistema de Referidos.
 */
import React, { useState, useEffect } from 'react';
import {
    Users,
    Link as LinkIcon,
    Copy,
    Check,
    DollarSign,
    TrendingUp,
    CreditCard,
    ArrowRight,
    Users2
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getReferralStats, getReferredUsers, ReferralStats, ReferredUser } from '@/services/referralService';
import { Spinner } from '@/components/common/Spinner';

export function ReferidosPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [s, u] = await Promise.all([
                    getReferralStats(),
                    getReferredUsers()
                ]);
                setStats(s);
                setReferredUsers(u);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const referralCode = stats?.referralCode || user?.codigoReferido || user?.id?.split('-')[0] || '';
    const referralLink = `${window.location.origin}/registro?ref=${referralCode}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}><Spinner /></div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Sistema de Referidos
                </h1>
                <p style={{ color: 'var(--text-tertiary)', margin: 0 }}>
                    Invita a otros Dropshippers y gana comisiones recurrentes por cada suscripción.
                </p>
            </div>

            {/* Enlace de Referido */}
            <div style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '32px',
                background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(0, 102, 255, 0.03) 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h3 style={{ margin: '0 0 16px', fontWeight: 700 }}>Tu Enlace de Invitación</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{
                            flex: 1,
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            fontSize: '14px',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {referralLink}
                        </div>
                        <button
                            onClick={handleCopy}
                            style={{
                                backgroundColor: copied ? 'var(--color-success)' : 'var(--color-primary)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '0 20px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copied ? 'Copiado' : 'Copiar'}
                        </button>
                    </div>
                </div>
                <LinkIcon
                    size={120}
                    style={{ position: 'absolute', right: '-20px', bottom: '-20px', color: 'rgba(0, 102, 255, 0.05)', transform: 'rotate(-15deg)' }}
                />
            </div>

            {/* Estadísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <StatsCard
                    label="Clicks en Enlace"
                    value={stats?.totalClicks || 0}
                    icon={<TrendingUp size={20} />}
                    color="var(--color-primary)"
                />
                <StatsCard
                    label="Usuarios Registrados"
                    value={stats?.totalReferred || 0}
                    icon={<Users2 size={20} />}
                    color="var(--color-success)"
                />
                <StatsCard
                    label="Ganancias Totales"
                    value={`$${(stats?.totalEarned || 0).toLocaleString()}`}
                    icon={<DollarSign size={20} />}
                    color="#f59e0b"
                />
            </div>

            {/* Listado de Referidos */}
            <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Usuarios Invitados</h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                        Mostrando {referredUsers.length} registros
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)' }}>Usuario / Email</th>
                                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)' }}>Estado</th>
                                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)' }}>F. Registro</th>
                                <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)' }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {referredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                        <div style={{ marginBottom: '12px' }}><Users size={40} strokeWidth={1.5} /></div>
                                        Aún no tienes usuarios referidos. ¡Comparte tu enlace para empezar a ganar!
                                    </td>
                                </tr>
                            ) : (
                                referredUsers.map((r) => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontWeight: 600 }}>{r.email}</div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                                backgroundColor: r.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: r.status === 'completed' ? 'var(--color-success)' : '#f59e0b'
                                            }}>
                                                {r.status === 'completed' ? 'CLIENTE ACTIVO' : 'PENDIENTE'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {new Date(r.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <button style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                                                Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) {
    return (
        <div style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600 }}>{label}</div>
                <div style={{ color }}>{icon}</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{value}</div>
        </div>
    );
}
