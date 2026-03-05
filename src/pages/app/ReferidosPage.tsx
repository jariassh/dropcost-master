
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
    Users2,
    Lock,
    X,
    History
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { StatsCard } from '@/components/common/StatsCard';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
    getReferralStats,
    getReferredUsers,
    getLevel2ReferredUsers,
    getReferredUserDetails,
    getCommissionHistory,
    ReferralStats,
    ReferredUser,
    ReferredUserDetails
} from '@/services/referralService';
import { Spinner } from '@/components/common/Spinner';
import { fetchExchangeRates, getDisplayCurrency } from '@/utils/currencyUtils';
import { formatCurrency } from '@/lib/format';
import { obtenerPaisPorCodigo } from '@/services/paisesService';
import { PremiumFeatureGuard } from '@/components/common/PremiumFeatureGuard';
import { formatDisplayDate } from '@/utils/dateUtils';

export function ReferidosPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
    const [level2Users, setLevel2Users] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'nivel1' | 'nivel2'>('nivel1');
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Details Modal State
    const [selectedUser, setSelectedUser] = useState<ReferredUser | null>(null);
    const [userDetails, setUserDetails] = useState<ReferredUserDetails | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // History Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [targetCurrency, setTargetCurrency] = useState('USD');
    const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);

    const navigate = useNavigate();
    const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
    const isTrueLider = user?.rol === 'lider';
    const canSeeLevel2 = isTrueLider || isAdmin;
    const hasAccess = user?.plan?.limits?.access_referrals;

    const isRestricted = !isAdmin && !hasAccess;

    useEffect(() => {
        if (isRestricted) return;

        const loadData = async () => {
            setIsLoading(true);
            try {
                const [s, u] = await Promise.all([
                    getReferralStats(),
                    getReferredUsers()
                ]);
                setStats(s);
                setReferredUsers(u);

                if (canSeeLevel2) {
                    const l2 = await getLevel2ReferredUsers();
                    setLevel2Users(l2);
                }

                if (user?.pais) {
                    const paisInfo = await obtenerPaisPorCodigo(user.pais);
                    if (paisInfo) {
                        const currency = getDisplayCurrency(user.pais, paisInfo.moneda_codigo);
                        setTargetCurrency(currency);
                        const rates = await fetchExchangeRates('USD');
                        setExchangeRates(rates);
                    }
                }
            } catch (err) {
                console.error('Error loading referral data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();

        const hasSeenOnboarding = localStorage.getItem('dropcost_referral_onboarding');
        if (!hasSeenOnboarding) {
            setShowOnboarding(true);
        }
    }, [isRestricted, canSeeLevel2, user]);

    if (isLoading && !isRestricted) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}><Spinner /></div>;

    const referralCode = stats?.referralCode || user?.codigoReferido || user?.id?.split('-')[0] || '';
    const referralLink = `${window.location.origin}/?ref=${referralCode}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const totalReferred = stats?.totalReferred || 0;

    const copy = {
        title: '¡Haz crecer tu red y tus ingresos!',
        description: `Gana ${stats?.commissionLevel1}% de cada suscripción que tus amigos paguen (hasta ${stats?.meses_vigencia_comision || 12} meses). ${isTrueLider ? `¡Y ${stats?.commissionLevel2}% extra por los amigos de tus amigos!` : ''}`,
        motivation: `Refiere a ${stats?.minReferredForLeader} amigos y desbloquea el Nivel 2 de comisiones.`
    };

    if (totalReferred === 0) {
        copy.title = 'Comparte DropCost con tu comunidad';
        copy.description = `¿Conoces Dropshippers que buscan optimizar costos? Refiérelos a DropCost y gana un ${stats?.commissionLevel1}% mensual por cada uno durante ${stats?.meses_vigencia_comision || 12} meses.`;
    } else if (totalReferred >= 1 && totalReferred < 10) {
        copy.title = 'Estás en el camino correcto 📈';
        copy.description = `Felicidades, ya tienes ${totalReferred} ${totalReferred === 1 ? 'referido' : 'referidos'}. Estás generando ingresos pasivos reales por ${stats?.meses_vigencia_comision || 12} meses.`;
    } else if (totalReferred >= 40 && totalReferred < 50) {
        copy.title = '¡Casi eres Líder de tu comunidad! 🚀';
        copy.description = `Faltan solo ${stats!.minReferredForLeader - totalReferred} amigos para alcanzar el rango de Líder y desbloquear comisiones de Nivel 2.`;
    } else if (isTrueLider && totalReferred >= 100) {
        copy.title = 'Liderando la optimización en tu comunidad 👑';
        copy.description = `Llevas un impacto real en ${totalReferred} dropshippers. Tu red está recibiendo comisiones de hasta ${stats?.meses_vigencia_comision || 12} meses por usuario.`;
    }

    const closeOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem('dropcost_referral_onboarding', 'true');
    };

    const handleOpenDetails = async (referredUser: ReferredUser) => {
        setSelectedUser(referredUser);
        setShowDetailsModal(true);
        setIsDetailsLoading(true);
        try {
            const details = await getReferredUserDetails(referredUser.id);
            setUserDetails(details);
        } catch (err) {
            console.error('Error fetching details:', err);
        } finally {
            setIsDetailsLoading(false);
        }
    };

    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        setSelectedUser(null);
        setUserDetails(null);
    };

    const handleOpenHistory = async () => {
        setShowHistoryModal(true);
        setHistoryLoading(true);
        try {
            const data = await getCommissionHistory();
            setHistory(data);
        } catch (e) {
            console.error(e);
        } finally {
            setHistoryLoading(false);
        }
    };

    const convertValue = (val: number) => {
        if (!exchangeRates || !targetCurrency || targetCurrency === 'USD') return formatCurrency(val, 'USD');
        const rate = exchangeRates[targetCurrency];
        if (!rate) return formatCurrency(val, 'USD');
        return formatCurrency(val * rate, targetCurrency);
    };

    const progressToLider = stats ? Math.min(100, (stats.totalReferred / stats.minReferredForLeader) * 100) : 0;

    const getVerificationBadge = (r: ReferredUser) => {
        if (r.emailVerificado) {
            return <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>VERIFICADO</span>;
        }
        return <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>SIN VERIFICAR</span>;
    };

    const getPlanBadge = (r: ReferredUser) => {
        const planMap: Record<string, { label: string, color: string, bg: string }> = {
            'plan_free': { label: 'GRATIS', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' },
            'plan_pro': { label: 'PRO', color: 'var(--color-primary)', bg: 'rgba(0, 102, 255, 0.1)' },
            'plan_enterprise': { label: 'ENTERPRISE', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' }
        };
        const config = planMap[r.planId || 'plan_free'] || planMap['plan_free'];
        return <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, backgroundColor: config.bg, color: config.color }}>{config.label}{r.estadoSuscripcion === 'activa' && ' ⭐'}</span>;
    };

    return (
        <PremiumFeatureGuard
            featureKey="access_referrals"
            title="Referidos Premium"
            description="Gana comisiones invitando a otros dropshippers. El Sistema de Referidos es un beneficio exclusivo para miembros Pro y Enterprise."
        >
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 4px' }}>
                <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            {copy.title}
                            {isTrueLider && (
                                <span style={{
                                    fontSize: '11px',
                                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                    color: '#000',
                                    padding: '5px 14px',
                                    borderRadius: '50px',
                                    fontWeight: 900,
                                    boxShadow: '0 4px 12px rgba(255, 165, 0, 0.2)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    LÍDER GOLD ⭐
                                </span>
                            )}
                        </h1>
                        <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: '16px', lineHeight: 1.5, maxWidth: '650px' }}>
                            {copy.description}
                        </p>
                    </div>
                    {!isTrueLider && (
                        <div style={{
                            padding: '20px',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '24px',
                            border: '1px solid var(--border-color)',
                            minWidth: '240px',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                PROGRESO A LÍDER
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-primary)' }}>{stats?.totalReferred}</span>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-tertiary)' }}>objetivo {stats?.minReferredForLeader}</span>
                            </div>
                            <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
                                <div style={{ width: `${progressToLider}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary) 0%, #6366f1 100%)', borderRadius: '10px', transition: 'width 1s ease-out' }}></div>
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.4 }}>
                                Desbloquea comisiones de <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>Nivel 2</span> alcanzando {stats?.minReferredForLeader} amigos.
                            </p>
                        </div>
                    )}
                </div>

                {/* Enlace de Referido */}
                <div style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '32px',
                    padding: 'clamp(20px, 5vw, 40px)',
                    marginBottom: '40px',
                    background: 'linear-gradient(145deg, var(--card-bg) 0%, rgba(0, 102, 255, 0.03) 100%)',
                    boxShadow: 'var(--shadow-xl)',
                    position: 'relative',
                    overflow: 'hidden',
                    borderLeft: '4px solid var(--color-primary)',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ margin: '0 0 8px', fontWeight: 900, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                                <LinkIcon size={24} color="var(--color-primary)" strokeWidth={2.5} />
                                Tu Enlace de Crecimiento
                            </h3>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: 0, fontWeight: 500 }}>
                                Comparte este enlace con tu comunidad y empieza a recibir comisiones automáticas.
                            </p>
                        </div>

                        <div className="referral-input-group" style={{
                            display: 'flex',
                            gap: '12px',
                            flexWrap: 'wrap',
                            alignItems: 'stretch',
                            backgroundColor: 'var(--bg-secondary)',
                            padding: '12px',
                            borderRadius: '24px',
                            border: '1px solid var(--border-color)',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <div className="referral-input-wrapper" style={{
                                flex: '1 1 300px',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <input
                                    readOnly
                                    id="referral-link-input"
                                    value={referralLink}
                                    style={{
                                        width: '100%',
                                        backgroundColor: 'var(--card-bg)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '16px',
                                        padding: '14px 20px',
                                        fontSize: '13px',
                                        color: 'var(--text-primary)',
                                        fontWeight: 700,
                                        boxShadow: 'var(--shadow-sm)',
                                        transition: 'all 0.2s ease',
                                        outline: 'none',
                                        cursor: 'text',
                                        fontFamily: 'monospace',
                                        boxSizing: 'border-box'
                                    }}
                                    onClick={(e) => {
                                        (e.target as HTMLInputElement).select();
                                    }}
                                />
                            </div>
                            <button
                                className="referral-copy-button"
                                onClick={handleCopy}
                                style={{
                                    backgroundColor: copied ? 'var(--color-success)' : 'var(--color-primary)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '16px',
                                    padding: '0 24px',
                                    minHeight: '50px',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    boxShadow: copied
                                        ? '0 8px 20px rgba(16, 185, 129, 0.2)'
                                        : '0 8px 20px rgba(0, 102, 255, 0.2)',
                                    flex: '1 1 auto',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                    e.currentTarget.style.filter = 'brightness(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.filter = 'none';
                                }}
                            >
                                {copied ? <Check size={16} strokeWidth={3} /> : <Copy size={16} strokeWidth={3} />}
                                {copied ? 'Copiado' : 'Copiar Enlace'}
                            </button>
                        </div>
                    </div>
                    <div style={{
                        position: 'absolute',
                        right: '-20px',
                        top: '-20px',
                        width: '150px',
                        height: '150px',
                        background: 'radial-gradient(circle, rgba(0, 102, 255, 0.05) 0%, transparent 70%)',
                        zIndex: 0
                    }} />
                </div>

                {/* Estadísticas */}
                <div className="stats-grid" style={{ marginBottom: '32px' }}>
                    <StatsCard
                        title="Interés Generado"
                        value={stats?.totalClicks || 0}
                        icon={<TrendingUp size={24} />}
                        color="var(--color-primary)"
                        subtitle="clics en tu enlace"
                    />
                    <StatsCard
                        title="Amigos Registrados"
                        value={stats?.totalReferred || 0}
                        icon={<Users2 size={24} />}
                        color="var(--color-success)"
                        subtitle="en tu primer nivel"
                    />
                    <div className="earnings-card">
                        <StatsCard
                            title="Ganancias Totales"
                            value={convertValue(stats?.totalEarned || 0)}
                            icon={<DollarSign size={24} />}
                            color="#f59e0b"
                            subtitle="disponibles para retirar - Ver Historial"
                            onClick={handleOpenHistory}
                        />
                    </div>
                </div>

                <style>{`
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 20px;
                    }

                    @media (max-width: 768px) {
                        .stats-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                        .earnings-card {
                            grid-column: span 2;
                        }
                    }

                    @media (max-width: 600px) {
                        .referral-input-group {
                            flex-direction: column !important;
                            padding: 16px !important;
                            gap: 16px !important;
                        }
                        
                        .referral-input-wrapper {
                            width: 100% !important;
                            flex: none !important;
                        }

                        .referral-copy-button {
                            width: 100% !important;
                            flex: none !important;
                            min-height: 56px !important;
                        }
                    }

                    @media (max-width: 480px) {
                        .stats-grid {
                            grid-template-columns: 1fr;
                        }
                        .earnings-card {
                            grid-column: span 1;
                        }
                    }

                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>

                {/* Tabs para Líderes (Existing Code) */}
                {canSeeLevel2 && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                        <button onClick={() => setActiveTab('nivel1')} style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'nivel1' ? 'var(--color-primary)' : 'var(--bg-tertiary)', color: activeTab === 'nivel1' ? '#fff' : 'var(--text-secondary)' }}>Amigos Directos (Nivel 1)</button>
                        <button onClick={() => setActiveTab('nivel2')} style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'nivel2' ? 'var(--color-primary)' : 'var(--bg-tertiary)', color: activeTab === 'nivel2' ? '#fff' : 'var(--text-secondary)' }}>Red de Amigos (Nivel 2)</button>
                    </div>
                )}

                {/* Listado de Referidos */}
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{activeTab === 'nivel1' ? 'Tus Referidos Directos' : 'Red Secundaria'}</h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 500 }}>{(activeTab === 'nivel1' ? referredUsers : level2Users).length} {(activeTab === 'nivel1' ? referredUsers : level2Users).length === 1 ? 'amigo' : 'amigos'} en total</div>
                </div>

                <Card noPadding style={{ boxShadow: 'var(--shadow-xl)', borderRadius: '24px', border: '1px solid var(--border-color)', overflow: 'hidden', backgroundColor: 'var(--card-bg)' }}>
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table style={{ width: '100%', minWidth: '940px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ padding: '20px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', width: '320px' }}>Usuario</th>
                                    <th style={{ padding: '20px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', width: '200px' }}>{activeTab === 'nivel1' ? 'Plan' : 'Invitado Por'}</th>
                                    <th style={{ padding: '20px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', width: '140px' }}>Estado</th>
                                    <th style={{ padding: '20px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', width: '160px' }}>Fecha</th>
                                    <th style={{ padding: '20px 24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', width: '120px' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(activeTab === 'nivel1' ? referredUsers : level2Users).length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '80px 48px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                            <div style={{ marginBottom: '20px', opacity: 0.3 }}><Users size={64} strokeWidth={1} /></div>
                                            <div style={{ fontWeight: 800, fontSize: '18px', marginBottom: '8px', color: 'var(--text-secondary)' }}>{activeTab === 'nivel1' ? '¡Tu red está esperando!' : 'Aún no hay actividad en tu Nivel 2'}</div>
                                            <p style={{ fontSize: '14px', margin: 0 }}>Comparte tu enlace para empezar a generar impacto.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    (activeTab === 'nivel1' ? referredUsers : level2Users).map((r, idx) => (
                                        <tr
                                            key={r.id}
                                            style={{
                                                borderBottom: idx === (activeTab === 'nivel1' ? referredUsers : level2Users).length - 1 ? 'none' : '1px solid var(--border-color)',
                                                transition: 'all 0.2s',
                                                backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,102,255,0.03)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)'}
                                        >
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                    <div style={{
                                                        width: '44px',
                                                        height: '44px',
                                                        borderRadius: '14px',
                                                        background: r.avatar_url ? 'transparent' : 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontWeight: 800,
                                                        fontSize: '15px',
                                                        flexShrink: 0,
                                                        boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {r.avatar_url ? (
                                                            <img
                                                                src={r.avatar_url}
                                                                alt={`${r.nombres} ${r.apellidos}`}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <>{(r.nombres?.charAt(0) || '')}{(r.apellidos?.charAt(0) || r.email.charAt(0)).toUpperCase()}</>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{r.nombres ? `${r.nombres} ${r.apellidos}` : 'Miembro DropCost'}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>{r.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                {activeTab === 'nivel1' ? getPlanBadge(r) : (
                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></div>
                                                        {r.referenteDe || 'N/A'}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>{getVerificationBadge(r)}</td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700 }}>{formatDisplayDate(r.createdAt).split(' ')[0]}</span>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{formatDisplayDate(r.createdAt).split(' ').slice(1).join(' ')}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => handleOpenDetails(r)}
                                                    style={{
                                                        background: 'var(--bg-secondary)',
                                                        border: '1px solid var(--border-color)',
                                                        color: 'var(--color-primary)',
                                                        padding: '8px 16px',
                                                        borderRadius: '10px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: 800,
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary)'; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                                                >
                                                    {activeTab === 'nivel1' ? 'Ver Perfil' : 'Referente'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <OnboardingModal isOpen={showOnboarding} onClose={closeOnboarding} stats={stats} />
                <DetailsModal
                    isOpen={showDetailsModal}
                    onClose={closeDetailsModal}
                    user={selectedUser}
                    details={userDetails}
                    isLoading={isDetailsLoading}
                    commissionRate={stats?.commissionLevel2 || 5}
                    convertValue={convertValue}
                />

                <CommissionHistoryModal
                    isOpen={showHistoryModal}
                    onClose={() => setShowHistoryModal(false)}
                    history={history}
                    isLoading={historyLoading}
                    convertValue={convertValue}
                />
            </div>
        </PremiumFeatureGuard>
    );
}

function CommissionHistoryModal({ isOpen, onClose, history, isLoading, convertValue }: any) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'var(--card-bg)',
                maxWidth: '600px', width: '100%',
                borderRadius: '24px', padding: '32px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                position: 'relative',
                maxHeight: '80vh',
                display: 'flex', flexDirection: 'column'
            }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                >
                    <X size={20} />
                </button>

                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={20} /> Historial de Comisiones
                </h2>

                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Spinner /></div>
                ) : history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                        <div style={{ marginBottom: '12px', opacity: 0.5 }}><DollarSign size={32} style={{ margin: '0 auto' }} /></div>
                        <p>Aún no hay comisiones registradas.</p>
                    </div>
                ) : (
                    <div style={{ overflowY: 'auto', paddingRight: '4px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '12px', fontSize: '12px', color: 'var(--text-tertiary)' }}>Fecha</th>
                                    <th style={{ padding: '12px', fontSize: '12px', color: 'var(--text-tertiary)' }}>Descripción</th>
                                    <th style={{ padding: '12px', fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'right' }}>Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((item: any) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {formatDisplayDate(item.date)}
                                        </td>
                                        <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                            {item.description}
                                        </td>
                                        <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-success)', fontWeight: 700, textAlign: 'right' }}>
                                            +{convertValue(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function OnboardingModal({ isOpen, onClose, stats }: { isOpen: boolean, onClose: () => void, stats: ReferralStats | null }) {
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ backgroundColor: 'var(--card-bg)', maxWidth: '600px', width: '100%', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'slideUp 0.4s ease-out' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '20px', backgroundColor: 'rgba(0, 102, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', margin: '0 auto 20px' }}><Users2 size={32} /></div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>Bienvenido a Referidos DropCost</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>Esto NO es un programa de multinivel. Es simple comisión por recomendación honesta.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                    <ModalItem icon={<TrendingUp size={18} />} title="Recomienda y Gana" desc={`Comparte DropCost con otros Dropshippers y gana un ${stats?.commissionLevel1 || 15}% mensual.`} />
                    <ModalItem icon={<Lock size={18} />} title="Sin Trucos" desc="No hay que pagar para activar, ni 'reclutar' para cobrar. Recomiendas una herramienta que usas." />
                    <ModalItem icon={<CreditCard size={18} />} title={`Vigencia de ${stats?.meses_vigencia_comision || 12} meses`} desc={`Ganarás comisiones por cada referido durante ${stats?.meses_vigencia_comision || 12} meses. Valoramos tu recomendación inicial.`} />
                </div>
                <button onClick={onClose} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 16px rgba(0, 102, 255, 0.2)' }}>¡Entendido, empezar!</button>
            </div>
        </div>
    );
}

function ModalItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flexShrink: 0, color: 'var(--color-primary)', marginTop: '2px' }}>{icon}</div>
            <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{desc}</div>
            </div>
        </div>
    );
}

function DetailsModal({ isOpen, onClose, user, details, isLoading, commissionRate, convertValue }: { isOpen: boolean, onClose: () => void, user: ReferredUser | null, details: ReferredUserDetails | null, isLoading: boolean, commissionRate: number, convertValue: (val: number) => string }) {
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ backgroundColor: 'var(--card-bg)', maxWidth: '500px', width: '100%', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={20} /></button>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        background: user?.avatar_url ? 'transparent' : 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '24px',
                        margin: '0 auto 16px',
                        boxShadow: '0 10px 20px rgba(0, 102, 255, 0.2)',
                        overflow: 'hidden'
                    }}>
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={`${user?.nombres} ${user?.apellidos}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <>{(user?.nombres?.charAt(0) || '')}{(user?.apellidos?.charAt(0) || (user?.email || '').charAt(0)).toUpperCase()}</>
                        )}
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>{user?.nombres ? `${user.nombres} ${user.apellidos}` : 'Nuevo Miembro'}</h2>
                    <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>{user?.email}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, backgroundColor: user?.planId === 'plan_free' ? 'var(--bg-tertiary)' : 'rgba(16, 185, 129, 0.1)', color: user?.planId === 'plan_free' ? 'var(--text-tertiary)' : 'var(--color-success)' }}>{(user?.planId || 'GRATIS').toUpperCase()}</span>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, backgroundColor: user?.emailVerificado ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: user?.emailVerificado ? 'var(--color-success)' : '#EF4444' }}>{user?.emailVerificado ? 'VERIFICADO' : 'SIN VERIFICAR'}</span>
                    </div>
                </div>
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Spinner /></div>
                ) : (
                    <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '16px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Directos Traídos</div><div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)' }}>{details?.referralsCount || 0}</div><div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Tu Nivel 2</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Impacto en Red</div><div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)' }}>{convertValue((details?.commissionsEarned || 0) * (commissionRate / 100))}</div><div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Ganas el {commissionRate}%</div></div>
                    </div>
                )}
                <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.5 }}>Este usuario se registró el {user?.createdAt && formatDisplayDate(user.createdAt)}.{details && details.referralsCount > 0 && <span style={{ display: 'block', marginTop: '8px', color: 'var(--color-primary)', fontWeight: 600 }}>🚀 ¡Este usuario está ayudando a crecer tu red!</span>}</div>
                <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginTop: '24px', border: '1px solid var(--border-color)' }}>Cerrar</button>
            </div>
        </div>
    );
}
