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
    Info,
    X,
    MessageSquare,
    Facebook,
    Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getReferralStats, getReferredUsers, getLevel2ReferredUsers, getReferredUserDetails, ReferralStats, ReferredUser, ReferredUserDetails } from '@/services/referralService';
import { Spinner } from '@/components/common/Spinner';

export function ReferidosPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
    const [level2Users, setLevel2Users] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'nivel1' | 'nivel2'>('nivel1');
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showEduBanner, setShowEduBanner] = useState(true);
    const [selectedUser, setSelectedUser] = useState<ReferredUser | null>(null);
    const [userDetails, setUserDetails] = useState<ReferredUserDetails | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const navigate = useNavigate();
    const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
    const isTrueLider = user?.rol === 'lider';
    const canSeeLevel2 = isTrueLider || isAdmin;
    const hasAccess = user?.plan?.limits?.access_referrals;

    // Default to restricted if flag is missing, unless admin
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
            } catch (err) {
                console.error('Error loading referral data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();

        // Check onboarding
        const hasSeenOnboarding = localStorage.getItem('dropcost_referral_onboarding');
        if (!hasSeenOnboarding) {
            setShowOnboarding(true);
        }
    }, [isRestricted, canSeeLevel2]);

    if (isRestricted) {
        return (
            <div style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.5s' }}>
                <div style={{
                    width: '80px', height: '80px', margin: '0 auto 24px',
                    borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#f59e0b'
                }}>
                    <Lock size={40} />
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>Funcionalidad Premium</h1>
                <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
                    Gana comisiones invitando a otros dropshippers.
                    <br />El Sistema de Referidos es un beneficio exclusivo para miembros Pro y Enterprise.
                </p>
                <button
                    onClick={() => navigate('/pricing')}
                    style={{
                        padding: '14px 32px', borderRadius: '12px', border: 'none',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 10px 20px -5px rgba(245, 158, 11, 0.4)',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    Actualizar Plan para Ganar
                </button>
            </div>
        );
    }

    const referralCode = stats?.referralCode || user?.codigoReferido || user?.id?.split('-')[0] || '';
    const referralLink = `${window.location.origin}/registro?ref=${referralCode}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}><Spinner /></div>;

    const totalReferred = stats?.totalReferred || 0;

    // RF-073 to RF-077: Dynamic Copywriting
    const copy = {
        title: '¡Haz crecer tu red y tus ingresos!',
        description: `Gana ${stats?.commissionLevel1}% de cada suscripción que tus amigos paguen (hasta ${stats?.meses_vigencia_comision || 12} meses). {isLider && \`¡Y \${stats?.commissionLevel2}% extra por los amigos de tus amigos!\`}`,
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

    const progressToLider = stats ? Math.min(100, (stats.totalReferred / stats.minReferredForLeader) * 100) : 0;

    const getStatusBadge = (r: ReferredUser) => {
        if (!r.emailVerificado) {
            return (
                <span style={{
                    padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444'
                }}>
                    SIN VERIFICAR
                </span>
            );
        }

        if (r.planId === 'plan_free' || !r.planId) {
            return (
                <span style={{
                    padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6'
                }}>
                    USUARIO GRATIS
                </span>
            );
        }

        if (r.estadoSuscripcion === 'activa') {
            return (
                <span style={{
                    padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)'
                }}>
                    SUSCRIPCIÓN ACTIVA ⭐
                </span>
            );
        }

        return (
            <span style={{
                padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                backgroundColor: 'rgba(107, 114, 128, 0.1)', color: '#6B7280'
            }}>
                INACTIVO
            </span>
        );
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {copy.title}
                        {isTrueLider && <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>LÍDER ⭐</span>}
                    </h1>
                    <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: '15px' }}>
                        {copy.description}
                    </p>
                </div>

                {!isTrueLider && (
                    <div style={{ textAlign: 'right', maxWidth: '200px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            TU CAMINO A LÍDER ({stats?.totalReferred}/{stats?.minReferredForLeader})
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ width: `${progressToLider}%`, height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '10px' }}></div>
                        </div>
                        <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px', lineHeight: 1.3 }}>
                            Llega a {stats?.minReferredForLeader} referidos para desbloquear el <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Nivel 2</span>.
                        </p>
                    </div>
                )}
            </div>

            {/* Enlace de Referido */}
            <div style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '32px',
                background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(0, 102, 255, 0.03) 100%)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h3 style={{ margin: '0 0 16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LinkIcon size={18} color="var(--color-primary)" />
                        Tu Enlace Personal
                    </h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
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
                            fontWeight: 500,
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
                                transition: 'all 0.2s',
                                boxShadow: copied ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 4px 12px rgba(0, 102, 255, 0.2)'
                            }}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copied ? '¡Copiado!' : 'Copiar'}
                        </button>
                        <a
                            href={`https://wa.me/?text=${encodeURIComponent(`¡Hola! Te recomiendo DropCost Master, la herramienta que uso para mis costeos de Dropshipping. Regístrate aquí: ${referralLink}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                backgroundColor: '#25D366',
                                color: '#fff',
                                borderRadius: '12px',
                                width: '45px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)'
                            }}
                            title="Compartir en WhatsApp"
                        >
                            <MessageSquare size={20} />
                        </a>
                        <a
                            href={`mailto:?subject=Invitación a DropCost Master&body=${encodeURIComponent(`¡Hola! Te recomiendo DropCost Master, la herramienta que uso para mis costeos de Dropshipping. Regístrate aquí: ${referralLink}`)}`}
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)',
                                borderRadius: '12px',
                                width: '45px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                                border: '1px solid var(--border-color)',
                                transition: 'all 0.2s'
                            }}
                            title="Compartir por Email"
                        >
                            <Mail size={20} />
                        </a>
                    </div>
                </div>
                <LinkIcon
                    size={140}
                    style={{ position: 'absolute', right: '-30px', bottom: '-30px', color: 'rgba(0, 102, 255, 0.04)', transform: 'rotate(-15deg)' }}
                />
            </div>

            {/* Banner Educativo Permanente RF-079 */}
            {showEduBanner && (
                <div style={{
                    backgroundColor: 'rgba(0, 102, 255, 0.05)',
                    borderLeft: '4px solid var(--color-primary)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    marginBottom: '32px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    position: 'relative'
                }}>
                    <Info size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            ¿Por qué las comisiones duran {stats?.meses_vigencia_comision || 12} meses?
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Tu valor está en la recomendación inicial. Después de ese tiempo, son clientes de DropCost que decidieron quedarse por el valor de la herramienta.
                            Sin obligaciones infinitas, solo recomendaciones honestas.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowEduBanner(false)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px' }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Estadísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <StatsCard
                    label="Interés Generado"
                    value={stats?.totalClicks || 0}
                    icon={<TrendingUp size={20} />}
                    color="var(--color-primary)"
                    suffix="clics en tu enlace"
                />
                <StatsCard
                    label="Amigos Registrados"
                    value={stats?.totalReferred || 0}
                    icon={<Users2 size={20} />}
                    color="var(--color-success)"
                    suffix="en tu primer nivel"
                />
                <StatsCard
                    label="Ganancias Totales"
                    value={`$${(stats?.totalEarned || 0).toLocaleString()}`}
                    icon={<DollarSign size={20} />}
                    color="#f59e0b"
                    suffix="disponibles para retirar"
                />
            </div>

            {/* Tabs para Líderes */}
            {canSeeLevel2 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button
                        onClick={() => setActiveTab('nivel1')}
                        style={{
                            padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer',
                            backgroundColor: activeTab === 'nivel1' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                            color: activeTab === 'nivel1' ? '#fff' : 'var(--text-secondary)',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === 'nivel1' ? '0 4px 12px rgba(0, 102, 255, 0.2)' : 'none'
                        }}
                    >
                        Amigos Directos (Nivel 1)
                    </button>
                    <button
                        onClick={() => setActiveTab('nivel2')}
                        style={{
                            padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer',
                            backgroundColor: activeTab === 'nivel2' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                            color: activeTab === 'nivel2' ? '#fff' : 'var(--text-secondary)',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === 'nivel2' ? '0 4px 12px rgba(0, 102, 255, 0.2)' : 'none'
                        }}
                    >
                        Red de Amigos (Nivel 2)
                    </button>
                </div>
            )}

            {/* Listado de Referidos */}
            <div style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                        {activeTab === 'nivel1' ? 'Tus Referidos Directos' : 'Red Secundaria'}
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                        {(activeTab === 'nivel1' ? referredUsers : level2Users).length} {(activeTab === 'nivel1' ? referredUsers : level2Users).length === 1 ? 'amigo' : 'amigos'} en total
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', backgroundColor: 'var(--bg-tertiary)' }}>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {activeTab === 'nivel1' ? 'Tipo de Plan' : 'Invitado Por'}
                                </th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registro</th>
                                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detalles</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(activeTab === 'nivel1' ? referredUsers : level2Users).length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '60px 48px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                        <div style={{ marginBottom: '16px', opacity: 0.5 }}><Users size={48} strokeWidth={1.5} /></div>
                                        <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                            {activeTab === 'nivel1' ? '¡Tu red está esperando!' : 'Aún no hay actividad en tu Nivel 2'}
                                        </div>
                                        <p style={{ margin: 0, fontSize: '14px', maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
                                            {activeTab === 'nivel1'
                                                ? 'Comparte tu link con otros dropshippers y empieza a generar ingresos pasivos hoy mismo.'
                                                : 'Cuando tus amigos directos empiecen a invitar gente, verás tu red crecer aquí.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                (activeTab === 'nivel1' ? referredUsers : level2Users).map((r) => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {/* Avatar con gradiente y sombra */}
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '12px',
                                                    background: 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    fontSize: '14px',
                                                    flexShrink: 0,
                                                    boxShadow: '0 4px 10px rgba(0, 102, 255, 0.15)'
                                                }}>
                                                    {(r.nombres?.charAt(0) || '')}{(r.apellidos?.charAt(0) || r.email.charAt(0)).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                        {r.nombres ? `${r.nombres} ${r.apellidos}` : 'Nuevo Miembro'}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                                        {r.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            {activeTab === 'nivel1' ? (
                                                getStatusBadge(r)
                                            ) : (
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <ArrowRight size={14} color="var(--color-primary)" />
                                                    {r.referenteDe || 'N/A'}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {new Date(r.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <button
                                                onClick={() => handleOpenDetails(r)}
                                                style={{
                                                    background: 'rgba(0, 102, 255, 0.05)',
                                                    border: 'none',
                                                    color: 'var(--color-primary)',
                                                    padding: '6px 12px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {activeTab === 'nivel1' ? 'Detalles' : 'Referente'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <OnboardingModal
                isOpen={showOnboarding}
                onClose={closeOnboarding}
                stats={stats}
            />

            <DetailsModal
                isOpen={showDetailsModal}
                onClose={closeDetailsModal}
                user={selectedUser}
                details={userDetails}
                isLoading={isDetailsLoading}
                commissionRate={stats?.commissionLevel2 || 5}
            />
        </div>
    );
}

function StatsCard({ label, value, icon, color, suffix }: { label: string, value: string | number, icon: React.ReactNode, color: string, suffix?: string }) {
    return (
        <div style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ backgroundColor: `${color}15`, color, padding: '8px', borderRadius: '10px' }}>{icon}</div>
            </div>
            <div>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>{value}</div>
                {suffix && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{suffix}</div>}
            </div>
        </div>
    );
}

function OnboardingModal({ isOpen, onClose, stats }: { isOpen: boolean, onClose: () => void, stats: ReferralStats | null }) {
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
                borderRadius: '24px', padding: '40px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                animation: 'slideUp 0.4s ease-out'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '20px',
                        backgroundColor: 'rgba(0, 102, 255, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-primary)', margin: '0 auto 20px'
                    }}>
                        <Users2 size={32} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
                        Bienvenido a Referidos DropCost
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>
                        Esto NO es un programa de multinivel. Es simple comisión por recomendación honesta.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                    <ModalItem
                        icon={<TrendingUp size={18} />}
                        title="Recomienda y Gana"
                        desc={`Comparte DropCost con otros Dropshippers y gana un ${stats?.commissionLevel1 || 15}% mensual.`}
                    />
                    <ModalItem
                        icon={<Lock size={18} />}
                        title="Sin Trucos"
                        desc="No hay que pagar para activar, ni 'reclutar' para cobrar. Recomiendas una herramienta que usas."
                    />
                    <ModalItem
                        icon={<CreditCard size={18} />}
                        title={`Vigencia de ${stats?.meses_vigencia_comision || 12} meses`}
                        desc={`Ganarás comisiones por cada referido durante ${stats?.meses_vigencia_comision || 12} meses. Valoramos tu recomendación inicial.`}
                    />
                </div>

                <button
                    onClick={onClose}
                    style={{
                        width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                        backgroundColor: 'var(--color-primary)', color: '#fff',
                        fontSize: '16px', fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 8px 16px rgba(0, 102, 255, 0.2)'
                    }}
                >
                    ¡Entendido, empezar!
                </button>
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

function DetailsModal({ isOpen, onClose, user, details, isLoading, commissionRate }: {
    isOpen: boolean,
    onClose: () => void,
    user: ReferredUser | null,
    details: ReferredUserDetails | null,
    isLoading: boolean,
    commissionRate: number
}) {
    if (!isOpen) return null;

    const color = user?.emailVerificado ? 'var(--color-success)' : '#6B7280';

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'var(--card-bg)',
                maxWidth: '500px', width: '100%',
                borderRadius: '24px', padding: '32px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                >
                    <X size={20} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '20px',
                        background: 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 800, fontSize: '24px', margin: '0 auto 16px',
                        boxShadow: '0 10px 20px rgba(0, 102, 255, 0.2)'
                    }}>
                        {(user?.nombres?.charAt(0) || '')}{(user?.apellidos?.charAt(0) || (user?.email || '').charAt(0)).toUpperCase()}
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {user?.nombres ? `${user.nombres} ${user.apellidos}` : 'Nuevo Miembro'}
                    </h2>
                    <div style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>{user?.email}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <span style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                            backgroundColor: user?.planId === 'plan_free' ? 'var(--bg-tertiary)' : 'rgba(16, 185, 129, 0.1)',
                            color: user?.planId === 'plan_free' ? 'var(--text-tertiary)' : 'var(--color-success)'
                        }}>
                            {(user?.planId || 'GRATIS').toUpperCase()}
                        </span>
                        <span style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                            backgroundColor: user?.emailVerificado ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: user?.emailVerificado ? 'var(--color-success)' : '#EF4444'
                        }}>
                            {user?.emailVerificado ? 'VERIFICADO' : 'SIN VERIFICAR'}
                        </span>
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Spinner /></div>
                ) : (
                    <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '16px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Directos Traídos</div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)' }}>{details?.referralsCount || 0}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Tu Nivel 2</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Impacto en Red</div>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)' }}>
                                ${((details?.commissionsEarned || 0) * (commissionRate / 100)).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Ganas el {commissionRate}%</div>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.5 }}>
                    Este usuario se registró el {user?.createdAt && new Date(user.createdAt).toLocaleDateString()}.
                    {details && details.referralsCount > 0 && <span style={{ display: 'block', marginTop: '8px', color: 'var(--color-primary)', fontWeight: 600 }}>🚀 ¡Este usuario está ayudando a crecer tu red!</span>}
                </div>

                <button
                    onClick={onClose}
                    style={{
                        width: '100%', padding: '14px', borderRadius: '12px',
                        backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
                        fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginTop: '24px',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
}
