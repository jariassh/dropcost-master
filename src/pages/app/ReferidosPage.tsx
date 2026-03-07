
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
import { Card, StatsCard, PageHeader } from '@/components/common';
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
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        title: 'Â¡Haz crecer tu red y tus ingresos!',
        description: `Gana ${stats?.commissionLevel1}% de cada suscripción que tus amigos paguen (hasta ${stats?.meses_vigencia_comision || 12} meses). ${isTrueLider ? `Â¡Y ${stats?.commissionLevel2}% extra por los amigos de tus amigos!` : ''}`,
        motivation: `Refiere a ${stats?.minReferredForLeader} amigos y desbloquea el Nivel 2 de comisiones.`
    };

    if (totalReferred === 0) {
        copy.title = 'Comparte DropCost con tu comunidad';
        copy.description = `Â¿Conoces Dropshippers que buscan optimizar costos? Refiérelos a DropCost y gana un ${stats?.commissionLevel1}% mensual por cada uno durante ${stats?.meses_vigencia_comision || 12} meses.`;
    } else if (totalReferred >= 1 && totalReferred < 10) {
        copy.title = 'Estás en el camino correcto ð';
        copy.description = `Felicidades, ya tienes ${totalReferred} ${totalReferred === 1 ? 'referido' : 'referidos'}. Estás generando ingresos pasivos reales por ${stats?.meses_vigencia_comision || 12} meses.`;
    } else if (totalReferred >= 40 && totalReferred < 50) {
        copy.title = 'Â¡Casi eres Líder de tu comunidad! ð';
        copy.description = `Faltan solo ${stats!.minReferredForLeader - totalReferred} amigos para alcanzar el rango de Líder y desbloquear comisiones de Nivel 2.`;
    } else if (isTrueLider && totalReferred >= 100) {
        copy.title = 'Liderando la optimización en tu comunidad ð';
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
            return <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>VERIFICADO</span>;
        }
        return <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>SIN VERIFICAR</span>;
    };

    const getPlanBadge = (r: ReferredUser) => {
        const planMap: Record<string, { label: string, color: string, bg: string }> = {
            'plan_free': { label: 'GRATIS', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' },
            'plan_pro': { label: 'PRO', color: 'var(--color-primary)', bg: 'rgba(0, 102, 255, 0.1)' },
            'plan_enterprise': { label: 'ENTERPRISE', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' }
        };
        const config = planMap[r.planId || 'plan_free'] || planMap['plan_free'];
        return <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, backgroundColor: config.bg, color: config.color }}>{config.label}{r.estadoSuscripcion === 'activa' && ' â­'}</span>;
    };

    return (
        <PremiumFeatureGuard
            featureKey="access_referrals"
            title="Referidos Premium"
            description="Gana comisiones invitando a otros dropshippers. El Sistema de Referidos es un beneficio exclusivo para miembros Pro y Enterprise."
        >
            <div className="referidos-page-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
                <PageHeader
                    title={copy.title}
                    highlight={isTrueLider ? "LÃDER GOLD ð" : ""}
                    description={copy.description}
                    icon={Users}
                    isMobile={isMobile}
                    actions={!isTrueLider && (
                        <div className="path-to-leader" style={{ textAlign: isMobile ? 'left' : 'right', minWidth: '200px', width: isMobile ? '100%' : 'auto' }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                TU CAMINO A LÃDER ({stats?.totalReferred}/{stats?.minReferredForLeader})
                            </div>
                            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ width: `${progressToLider}%`, height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '10px' }}></div>
                            </div>
                            <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px', lineHeight: 1.3 }}>Llega a {stats?.minReferredForLeader} referidos para desbloquear el <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Nivel 2</span>.</p>
                        </div>
                    )}
                />

                {/* Enlace de Referido */}
                <div className="referral-link-card" style={{
                    backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '24px', marginBottom: '32px',
                    background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(0, 102, 255, 0.03) 100%)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h3 style={{ margin: '0 0 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <LinkIcon size={18} color="var(--color-primary)" /> Tu Enlace Personal
                        </h3>
                        <div className="referral-link-row" style={{ display: 'flex', gap: '12px' }}>
                            <div className="referral-link-display" style={{ flex: 1, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {referralLink}
                            </div>
                            <button className="referral-copy-btn" onClick={handleCopy} style={{ backgroundColor: copied ? 'var(--color-success)' : 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '12px', padding: '0 20px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                                {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'Â¡Copiado!' : 'Copiar'}
                            </button>
                        </div>
                    </div>
                    <LinkIcon size={140} style={{ position: 'absolute', right: '-30px', bottom: '-40px', color: 'rgba(0, 102, 255, 0.04)', transform: 'rotate(-15deg)', opacity: 0.5 }} />
                </div>

                {/* Estadísticas */}
                <div className="referidos-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
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
                    <div className="referidos-earnings-card">
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

                {/* Tabs para Líderes (Existing Code) */}
                {canSeeLevel2 && (
                    <div className="referidos-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                        <button onClick={() => setActiveTab('nivel1')} style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'nivel1' ? 'var(--color-primary)' : 'var(--bg-tertiary)', color: activeTab === 'nivel1' ? '#fff' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Amigos Directos (Nivel 1)</button>
                        <button onClick={() => setActiveTab('nivel2')} style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'nivel2' ? 'var(--color-primary)' : 'var(--bg-tertiary)', color: activeTab === 'nivel2' ? '#fff' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Red de Amigos (Nivel 2)</button>
                    </div>
                )}

                {/* Listado de Referidos */}
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{activeTab === 'nivel1' ? 'Tus Referidos Directos' : 'Red Secundaria'}</h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 500 }}>{(activeTab === 'nivel1' ? referredUsers : level2Users).length} {(activeTab === 'nivel1' ? referredUsers : level2Users).length === 1 ? 'amigo' : 'amigos'} en total</div>
                </div>

                <style>{`
                    @media (max-width: 767px) {
                        .referidos-page-container {
                            padding: 16px !important;
                        }
                        .referidos-header {
                            flex-direction: column !important;
                            gap: 20px !important;
                        }
                        .referidos-header h1 {
                            font-size: 32px !important;
                            font-weight: 900 !important;
                            line-height: 1.1 !important;
                        }
                        .path-to-leader {
                            text-align: left !important;
                            width: 100% !important;
                            max-width: none !important;
                        }
                        .referral-link-card {
                            border-radius: 32px !important;
                            padding: 24px 20px !important;
                        }
                        .referidos-stats-grid {
                            grid-template-columns: repeat(2, 1fr) !important;
                            gap: 12px !important;
                        }
                        .referidos-earnings-card {
                            grid-column: span 2;
                        }
                        .referral-link-row {
                            flex-direction: column !important;
                        }
                        .referral-copy-btn {
                            width: 100% !important;
                            justify-content: center !important;
                            padding: 12px 20px !important;
                        }
                    }
                    @media (max-width: 480px) {
                        .referidos-stats-grid {
                            grid-template-columns: 1fr !important;
                        }
                        .referidos-earnings-card {
                            grid-column: span 1;
                        }
                    }
                `}</style>

                <Card noPadding style={{ boxShadow: 'var(--shadow-lg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '300px' }}>Usuario</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '150px' }}>{activeTab === 'nivel1' ? 'Plan' : 'Invitado Por'}</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '160px' }}>Verificación</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '150px' }}>Registro</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '130px' }}>Detalles</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(activeTab === 'nivel1' ? referredUsers : level2Users).length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '60px 48px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                            <div style={{ marginBottom: '16px', opacity: 0.5 }}><Users size={48} strokeWidth={1.5} /></div>
                                            <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: 'var(--text-secondary)' }}>{activeTab === 'nivel1' ? 'Â¡Tu red está esperando!' : 'Aún no hay actividad en tu Nivel 2'}</div>
                                        </td>
                                    </tr>
                                ) : (
                                    (activeTab === 'nivel1' ? referredUsers : level2Users).map((r) => (
                                        <tr
                                            key={r.id}
                                            style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '12px',
                                                        background: r.avatar_url ? 'transparent' : 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontWeight: 600,
                                                        fontSize: '14px',
                                                        flexShrink: 0,
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
                                                    <div style={{ overflow: 'hidden', flex: 1 }}>
                                                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nombres ? `${r.nombres} ${r.apellidos}` : 'Nuevo Miembro'}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>{activeTab === 'nivel1' ? getPlanBadge(r) : <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><ArrowRight size={14} color="var(--color-primary)" /> {r.referenteDe || 'N/A'}</div>}</td>
                                            <td style={{ padding: '16px 24px' }}>{getVerificationBadge(r)}</td>
                                            <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDisplayDate(r.createdAt)}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <button onClick={() => handleOpenDetails(r)} style={{ background: 'rgba(0, 102, 255, 0.05)', border: 'none', color: 'var(--color-primary)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                                                    {activeTab === 'nivel1' ? 'Detalles' : 'Referente'}
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

                <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                        <td style={{ padding: '12px', fontSize: '13px', color: 'var(--color-success)', fontWeight: 600, textAlign: 'right' }}>
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
                    <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Bienvenido a Referidos DropCost</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>Esto NO es un programa de multinivel. Es simple comisión por recomendación honesta.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                    <ModalItem icon={<TrendingUp size={18} />} title="Recomienda y Gana" desc={`Comparte DropCost con otros Dropshippers y gana un ${stats?.commissionLevel1 || 15}% mensual.`} />
                    <ModalItem icon={<Lock size={18} />} title="Sin Trucos" desc="No hay que pagar para activar, ni 'reclutar' para cobrar. Recomiendas una herramienta que usas." />
                    <ModalItem icon={<CreditCard size={18} />} title={`Vigencia de ${stats?.meses_vigencia_comision || 12} meses`} desc={`Ganarás comisiones por cada referido durante ${stats?.meses_vigencia_comision || 12} meses. Valoramos tu recomendación inicial.`} />
                </div>
                <button onClick={onClose} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 16px rgba(0, 102, 255, 0.2)' }}>Â¡Entendido, empezar!</button>
            </div>
        </div>
    );
}

function ModalItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flexShrink: 0, color: 'var(--color-primary)', marginTop: '2px' }}>{icon}</div>
            <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</div>
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
                        fontWeight: 600,
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
                    <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{user?.nombres ? `${user.nombres} ${user.apellidos}` : 'Nuevo Miembro'}</h2>
                    <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>{user?.email}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, backgroundColor: user?.planId === 'plan_free' ? 'var(--bg-tertiary)' : 'rgba(16, 185, 129, 0.1)', color: user?.planId === 'plan_free' ? 'var(--text-tertiary)' : 'var(--color-success)' }}>{(user?.planId || 'GRATIS').toUpperCase()}</span>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, backgroundColor: user?.emailVerificado ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: user?.emailVerificado ? 'var(--color-success)' : '#EF4444' }}>{user?.emailVerificado ? 'VERIFICADO' : 'SIN VERIFICAR'}</span>
                    </div>
                </div>
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Spinner /></div>
                ) : (
                    <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '16px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Directos Traídos</div><div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-primary)' }}>{details?.referralsCount || 0}</div><div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Tu Nivel 2</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Impacto en Red</div><div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-success)' }}>{convertValue((details?.commissionsEarned || 0) * (commissionRate / 100))}</div><div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Ganas el {commissionRate}%</div></div>
                    </div>
                )}
                <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.5 }}>Este usuario se registró el {user?.createdAt && formatDisplayDate(user.createdAt)}.{details && details.referralsCount > 0 && <span style={{ display: 'block', marginTop: '8px', color: 'var(--color-primary)', fontWeight: 600 }}>ð Â¡Este usuario está ayudando a crecer tu red!</span>}</div>
                <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: '24px', border: '1px solid var(--border-color)' }}>Cerrar</button>
            </div>
        </div>
    );
}
