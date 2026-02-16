import React, { useEffect, useState } from 'react';
import { Card } from '@/components/common/Card';
import {
    Users,
    TrendingUp,
    DollarSign,
    Settings,
    Save,
    History,
    AlertCircle,
    CheckCircle2,
    Users2
} from 'lucide-react';
import { getReferralConfig, ReferralConfig, getAdminReferralStats, getAllReferredUsers, getAllLeaders } from '@/services/referralService';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/common/Spinner';

export function AdminReferralPage() {
    const [config, setConfig] = useState<ReferralConfig | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [allReferred, setAllReferred] = useState<any[]>([]);
    const [allLeaders, setAllLeaders] = useState<any[]>([]);
    const [activeListTab, setActiveListTab] = useState<'users' | 'leaders'>('users');
    const [showOnlyPromoted, setShowOnlyPromoted] = useState(false);

    // Form state (using strings for inputs to prevent NaN issues during typing)
    const [formData, setFormData] = useState({
        comision_nivel_1: '15',
        comision_nivel_2: '5',
        referidos_minimo_lider: '50',
        meses_vigencia_comision: '12'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [c, s, ur, l] = await Promise.all([
                getReferralConfig(),
                getAdminReferralStats(),
                getAllReferredUsers(),
                getAllLeaders()
            ]);

            if (c) {
                setConfig(c);
                setFormData({
                    comision_nivel_1: String(c.comision_nivel_1),
                    comision_nivel_2: String(c.comision_nivel_2),
                    referidos_minimo_lider: String(c.referidos_minimo_lider),
                    meses_vigencia_comision: String(c.meses_vigencia_comision)
                });
            }
            setStats(s);
            setAllReferred(ur);
            setAllLeaders(l);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const numericData = {
                comision_nivel_1: parseFloat(formData.comision_nivel_1) || 0,
                comision_nivel_2: parseFloat(formData.comision_nivel_2) || 0,
                referidos_minimo_lider: parseInt(formData.referidos_minimo_lider) || 0,
                meses_vigencia_comision: parseInt(formData.meses_vigencia_comision) || 0
            };

            const { error } = await supabase
                .from('sistema_referidos_config')
                .insert([{
                    ...numericData,
                    actualizado_por: user?.id
                }]);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Configuración actualizada correctamente' });

            // Reload data to ensure we have the latest version from DB
            await loadData();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Error al guardar configuración' });
        } finally {
            setIsSaving(false);
        }
    };

    const scrollToDetails = (tab: 'users' | 'leaders') => {
        setActiveListTab(tab);
        const element = document.getElementById('admin-referral-details');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}><Spinner /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Sistema de Referidos (V3)
                </h1>
                <p style={{ marginTop: '8px', fontSize: '15px', color: 'var(--text-secondary)' }}>
                    Monitoreo global y configuración dinámica del programa de referidos.
                </p>
            </div>

            {/* Global Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                <StatBox
                    label="Referidos Totales"
                    value={stats?.totalReferred || 0}
                    icon={<Users2 size={24} />}
                    color="#3B82F6"
                    onClick={() => scrollToDetails('users')}
                />
                <StatBox
                    label="Líderes Promovidos"
                    value={stats?.totalLeaders || 0}
                    icon={<TrendingUp size={24} />}
                    color="#10B981"
                    onClick={() => scrollToDetails('leaders')}
                />
                <StatBox
                    label="Comisiones Pagadas"
                    value={`$${(stats?.totalCommissionsPaid || 0).toLocaleString()}`}
                    icon={<DollarSign size={24} />}
                    color="#f59e0b"
                />
                <StatBox
                    label="Pendiente de Pago"
                    value={`$${(stats?.totalCommissionsPending || 0).toLocaleString()}`}
                    icon={<AlertCircle size={24} />}
                    color="#EF4444"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                {/* Configuration Form */}
                <Card title="Configuración del Sistema">
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    Comisión Nivel 1 (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.comision_nivel_1}
                                    onChange={e => setFormData({ ...formData, comision_nivel_1: e.target.value })}
                                    style={{
                                        padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)'
                                    }}
                                />
                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                    Porcentaje para el referente directo.
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    Comisión Nivel 2 (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={formData.comision_nivel_2}
                                    onChange={e => setFormData({ ...formData, comision_nivel_2: e.target.value })}
                                    style={{
                                        padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)'
                                    }}
                                />
                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                    Extra para Líderes por ventas de sus referidos.
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    Mínimo para ser Líder
                                </label>
                                <input
                                    type="number"
                                    value={formData.referidos_minimo_lider}
                                    onChange={e => setFormData({ ...formData, referidos_minimo_lider: e.target.value })}
                                    style={{
                                        padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)'
                                    }}
                                />
                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                    Cantidad de referidos para ascenso automático.
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    Vigencia (Meses)
                                </label>
                                <input
                                    type="number"
                                    value={formData.meses_vigencia_comision}
                                    onChange={e => setFormData({ ...formData, meses_vigencia_comision: e.target.value })}
                                    style={{
                                        padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)'
                                    }}
                                />
                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                    Duración de la comisión recurrente.
                                </span>
                            </div>
                        </div>

                        {message && (
                            <div style={{
                                padding: '12px 16px', borderRadius: '10px', fontSize: '14px',
                                display: 'flex', alignItems: 'center', gap: '10px',
                                backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: message.type === 'success' ? '#10B981' : '#EF4444',
                                border: `1px solid ${message.type === 'success' ? '#10B98133' : '#EF444433'}`
                            }}>
                                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                {message.text}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                            <button
                                type="button"
                                onClick={() => loadData()}
                                disabled={isSaving}
                                style={{
                                    padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border-color)',
                                    backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                style={{
                                    padding: '10px 24px', borderRadius: '10px', border: 'none',
                                    backgroundColor: 'var(--color-primary)', color: '#fff', cursor: 'pointer',
                                    fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                {isSaving ? <Spinner size="sm" /> : <Save size={18} />}
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </Card>

                {/* Audit / Last Updates */}
                <Card title="Últimas Actualizaciones">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {config ? (
                            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                    <Settings size={16} color="var(--color-primary)" />
                                    <span style={{ fontSize: '14px', fontWeight: 700 }}>Versión Actual</span>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span>Actualizado: {new Date(config.fecha_actualizacion).toLocaleString()}</span>
                                    <span>Por: {config.actualizado_por || 'Sistema'}</span>
                                </div>
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>No hay registros de cambios.</p>
                        )}
                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                            <History size={16} />
                            <span>Ver historial completo</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Detailed Tables Section */}
            <div id="admin-referral-details" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '2px' }}>
                    <button
                        onClick={() => setActiveListTab('users')}
                        style={{
                            padding: '12px 24px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                            background: 'none', border: 'none',
                            color: activeListTab === 'users' ? 'var(--color-primary)' : 'var(--text-tertiary)',
                            borderBottom: activeListTab === 'users' ? '3px solid var(--color-primary)' : '3px solid transparent',
                            transition: 'all 0.2s'
                        }}
                    >
                        Usuarios Referidos
                    </button>
                    <button
                        onClick={() => setActiveListTab('leaders')}
                        style={{
                            padding: '12px 24px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                            background: 'none', border: 'none',
                            color: activeListTab === 'leaders' ? 'var(--color-primary)' : 'var(--text-tertiary)',
                            borderBottom: activeListTab === 'leaders' ? '3px solid var(--color-primary)' : '3px solid transparent',
                            transition: 'all 0.2s'
                        }}
                    >
                        Red de Referentes (Afiliados y Líderes)
                    </button>
                </div>

                <Card>
                    <div style={{ overflowX: 'auto' }}>
                        {activeListTab === 'users' ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: 'var(--text-tertiary)' }}>Usuario</th>
                                        <th style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: 'var(--text-tertiary)' }}>Referente</th>
                                        <th style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: 'var(--text-tertiary)' }}>Plan / Estado</th>
                                        <th style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: 'var(--text-tertiary)' }}>Fecha Registro</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allReferred.length === 0 ? (
                                        <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No hay referidos registrados.</td></tr>
                                    ) : (
                                        allReferred.map(r => (
                                            <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ fontWeight: 600 }}>{r.nombre}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{r.email}</div>
                                                </td>
                                                <td style={{ padding: '16px', fontSize: '14px' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{r.referente}</span>
                                                </td>
                                                <td style={{ padding: '16px', fontSize: '13px' }}>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                                                            backgroundColor: r.planId === 'free' ? 'var(--bg-tertiary)' : 'rgba(16, 185, 129, 0.1)',
                                                            color: r.planId === 'free' ? 'var(--text-tertiary)' : 'var(--color-success)'
                                                        }}>
                                                            {r.planId?.toUpperCase() || 'GRATIS'}
                                                        </span>
                                                        {r.emailVerificado && <span style={{ color: '#10B981' }} title="Verificado">✓</span>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                    {new Date(r.fechaRegistro).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <div>
                                <div style={{ padding: '0 16px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        <input
                                            type="checkbox"
                                            checked={showOnlyPromoted}
                                            onChange={(e) => setShowOnlyPromoted(e.target.checked)}
                                        />
                                        Solo mostrar Líderes Promovidos (Nivel 2)
                                    </label>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                            <th style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: 'var(--text-tertiary)' }}>Usuario Afiliado</th>
                                            <th style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: 'var(--text-tertiary)' }}>Código</th>
                                            <th style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: 'var(--text-tertiary)' }}>Métricas</th>
                                            <th style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: 'var(--text-tertiary)' }}>Estado de Rango</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allLeaders.filter(l => !showOnlyPromoted || l.rol === 'lider').length === 0 ? (
                                            <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>{showOnlyPromoted ? 'No hay líderes promovidos aún.' : 'No hay actividad de referidos.'}</td></tr>
                                        ) : (
                                            allLeaders
                                                .filter(l => !showOnlyPromoted || l.rol === 'lider')
                                                .map(l => (
                                                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '16px' }}>
                                                            <div style={{ fontWeight: 700 }}>{l.nombre}</div>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{l.email}</div>
                                                        </td>
                                                        <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 700 }}>
                                                            {l.codigo}
                                                        </td>
                                                        <td style={{ padding: '16px' }}>
                                                            <div style={{ fontSize: '13px' }}>
                                                                <span style={{ fontWeight: 700 }}>{l.totalReferidos}</span> referidos
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                                                ${(l.totalComisiones || 0).toLocaleString()} generados
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '16px' }}>
                                                            <span style={{
                                                                padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800,
                                                                backgroundColor: l.rol === 'lider' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)',
                                                                color: l.rol === 'lider' ? 'var(--color-success)' : 'var(--text-tertiary)'
                                                            }}>
                                                                {l.rol === 'lider' ? 'LÍDER PROMOVIDO' : (l.rol?.toUpperCase() || 'AFILIADO')}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function StatBox({ label, value, icon, color, onClick }: { label: string, value: string | number, icon: React.ReactNode, color: string, onClick?: () => void }) {
    return (
        <Card hoverable onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                    backgroundColor: `${color}15`, color: color, padding: '12px', borderRadius: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {icon}
                </div>
                <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', margin: 0 }}>
                        {label}
                    </p>
                    <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                        {value}
                    </p>
                </div>
            </div>
        </Card>
    );
}
