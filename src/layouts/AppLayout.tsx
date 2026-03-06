/**
 * Layout principal de la aplicación.
 * Sidebar colapsable (íconos / íconos+labels) que EMPUJA el contenido.
 * Header con toggle tema, notificaciones y dropdown usuario premium.
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotificationStore } from '@/store/notificationStore';
import { NotificationPanel } from '@/components/layout/NotificationPanel';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    BarChart3,
    Calculator,
    Map,
    Settings,
    ShieldAlert,
    Bell,
    Sun,
    Moon,
    LogOut,
    ChevronDown,
    LayoutDashboard,
    PanelLeftClose,
    PanelLeftOpen,
    Menu,
    UserCircle,
    Gift,
    Share2,
    Wallet,
    Link2,
    PieChart,
    GraduationCap,
    History as HistoryIcon,
    X,
    UploadCloud,
    Clock,
    Users,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { Tooltip } from '@/components/common/Tooltip';
import { StoreSelector } from '@/components/layout/StoreSelector';
import { useStoreStore } from '@/store/useStoreStore';
import { useSessionEnforcer } from '@/hooks/useSessionEnforcer';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';
import { configService } from '@/services/configService';
import { subscriptionService } from '@/services/subscriptionService';
import { useLaunchpadStore } from '@/store/useLaunchpadStore';
import { Rocket, Target, CheckCircle2 } from 'lucide-react';

const SIDEBAR_OPEN = 240;
const SIDEBAR_COLLAPSED = 72;

const navItems = [
    { to: '/launchpad', icon: Rocket, label: 'Launchpad (Inicio)', active: true, isLaunchpad: true },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', active: true },
    { to: '/mis-costeos', icon: Calculator, label: 'Mis Costeos', active: true },
    { to: '/ofertas', icon: Gift, label: 'Creador de Ofertas', active: true },
    { to: '/contactos', icon: Users, label: 'Contactos', active: true },
    { to: '/referidos', icon: Share2, label: 'Sistema de Referidos', active: true },
    { to: '/billetera', icon: Wallet, label: 'Billetera / Wallet', active: true },
    { to: '/sincronizar', icon: UploadCloud, label: 'Sincronizar Envíos', active: true },

    {
        label: 'Configuraciones',
        icon: Settings,
        active: true,
        children: [
            { to: '/configuracion/perfil', label: 'Mi Perfil' },
            { to: '/configuracion/tiendas', label: 'Mis Tiendas' },
            { to: '/configuracion/integraciones', label: 'Integraciones' },
            { to: '/configuracion/seguridad', label: 'Seguridad' },
        ]
    },
    { to: '/analisis-regional', icon: Map, label: 'Análisis Regional', active: false },
    { to: '/capacitacion', icon: GraduationCap, label: 'Capacitación', active: false },
    { to: '/historial', icon: HistoryIcon, label: 'Historial Actividad', active: true },
];

const adminLink = { to: '/admin', icon: ShieldAlert, label: 'Panel Administración' };


export function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [openGroup, setOpenGroup] = useState<string | null>(null);
    const { isDark, toggleTheme } = useTheme();
    const { user, logout } = useAuthStore();
    const { unreadCount, fetchNotifications } = useNotificationStore();
    const { tiendaActual } = useStoreStore();
    const { isComplete, progress, fetchStatus, isLoading: isLaunchpadLoading } = useLaunchpadStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [logos, setLogos] = useState<{ light: string | null; dark: string | null }>({ light: null, dark: null });

    useEffect(() => {
        configService.getConfig().then(config => {
            setLogos({
                light: config.logo_principal_url || null,
                dark: config.logo_variante_url || null
            });
        });
    }, []);

    // Enforce single session
    useSessionEnforcer();

    // Apply global configuration (SEO, Colors, Tracking)
    useGlobalConfig();

    useEffect(() => {
        fetchNotifications();
        if (user) {
            fetchStatus(user.id, tiendaActual?.id);
        }
    }, [fetchNotifications, fetchStatus, user, tiendaActual?.id]);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Redirección Launchpad si no está completo o si el usuario quiere verlo como inicio
    useEffect(() => {
        // No redirigir si el componente está cargando o no se ha inicializado el usuario
        if (isLaunchpadLoading || !user) return;

        const isComplete_local = isComplete;
        const showLaunchpad = user?.preferencias?.mostrar_launchpad ?? true;
        const currentPath = location.pathname;
        const isPublicPage = ['/pricing', '/login', '/registro', '/verificar-email'].includes(currentPath);

        if (isPublicPage || currentPath === '/launchpad') return;

        // Caso 1: Obligatorio si no está completo y tiene menos del 40% de progreso
        if (!isComplete_local && progress < 40) {
            navigate('/launchpad');
            return;
        }

        // Caso 2: Redirección de "Inicio" (Landing Page)
        // Si el usuario entra al dominio raíz '/', decidir a dónde va
        if (currentPath === '/' || currentPath === '/dashboard') {
            if (showLaunchpad && currentPath === '/') {
                navigate('/launchpad');
            } else if (!showLaunchpad && currentPath === '/') {
                navigate('/dashboard');
            }
        }
    }, [isComplete, progress, isLaunchpadLoading, user, location.pathname, navigate]);

    const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_OPEN;
    // Si el drawer está abierto en móvil, forzamos que NO esté colapsado para mostrar textos
    const effectivelyCollapsed = collapsed && !mobileOpen;

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', '--sidebar-width': `${sidebarWidth}px` } as any}>
            {/* ─── Sidebar ─── */}
            <aside
                style={{
                    position: 'fixed',
                    top: 0,
                    left: undefined,
                    bottom: 0,
                    width: mobileOpen ? '280px' : `${sidebarWidth}px`,
                    backgroundColor: 'var(--sidebar-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 50,
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    ...(mobileOpen ? { left: 0 } : {})
                }}
                className={`lg:left-0 ${!mobileOpen ? 'max-lg:-left-full' : ''}`}
            >
                {/* Logo + Toggle */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: effectivelyCollapsed ? 'center' : 'space-between',
                        padding: effectivelyCollapsed ? '0' : '0 12px 0 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        height: '64px',
                        minHeight: '64px',
                        transition: 'padding 250ms ease',
                        boxSizing: 'border-box'
                    }}
                >
                    {!effectivelyCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Priorizamos el logo oscuro/variante para la sidebar que siempre es oscura */}
                            {logos.dark || logos.light ? (
                                <img
                                    src={logos.dark || logos.light || ''}
                                    alt="DropCost Master"
                                    style={{ maxHeight: '32px', objectFit: 'contain' }}
                                />
                            ) : (
                                <>
                                    <div
                                        style={{
                                            width: '32px', height: '32px', flexShrink: 0,
                                            backgroundColor: 'var(--color-primary)',
                                            borderRadius: '8px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <BarChart3 size={16} color="#fff" />
                                    </div>
                                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '16px', whiteSpace: 'nowrap' }}>
                                        DropCost<span style={{ color: 'var(--color-primary)' }}>Master</span>
                                    </span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Toggle collapse */}
                    <button
                        onClick={() => {
                            if (window.innerWidth < 1024) {
                                setMobileOpen(false);
                            } else {
                                setCollapsed((v) => !v);
                            }
                        }}
                        style={{
                            padding: '10px',
                            borderRadius: '12px',
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.6)',
                            cursor: 'pointer',
                            display: 'flex',
                            transition: 'all 150ms ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#fff';
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        aria-label={effectivelyCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                    >
                        {window.innerWidth < 1024 ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Selector de Tienda */}
                <div style={{ marginTop: '16px' }}>
                    <StoreSelector collapsed={effectivelyCollapsed} />
                </div>

                {/* Navegación - Con scroll si es necesario */}
                <nav style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: effectivelyCollapsed ? '4px 8px 12px' : '0 12px 16px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,0.1) transparent'
                }}>
                    {/* Módulos Activos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {navItems
                            .filter(i => {
                                if ((i as any).isLaunchpad) {
                                    const showLp = !isComplete ? true : (user?.preferencias?.mostrar_launchpad ?? true);
                                    if (!showLp) return false;
                                }
                                return i.active;
                            })
                            .map((item) => {
                                if (item.children) {
                                    return (
                                        <SidebarGroupItem
                                            key={item.label}
                                            {...item as any}
                                            collapsed={effectivelyCollapsed}
                                            isOpen={openGroup === item.label}
                                            onToggle={() => setOpenGroup(openGroup === item.label ? null : item.label)}
                                            onClickSub={() => setMobileOpen(false)}
                                        />
                                    );
                                }

                                const isRestrictedByStore = !tiendaActual && (item.to === '/mis-costeos' || item.to === '/ofertas');
                                const isRestrictedByFeature =
                                    (item.to === '/dashboard' && !subscriptionService.isDashboardEnabled()) ||
                                    (item.to === '/sincronizar' && !subscriptionService.isDropiSyncEnabled()) ||
                                    (item.to === '/contactos' && !subscriptionService.isContactsEnabled());

                                const isRestrictedBySubscription = user?.estadoSuscripcion !== 'activa' && item.to !== '/launchpad' && item.to !== '/configuracion' && item.to?.startsWith('/configuracion') === false && user?.rol !== 'admin' && user?.rol !== 'superadmin';

                                const isRestricted = isRestrictedByStore || isRestrictedBySubscription || (isRestrictedByFeature && user?.rol !== 'admin' && user?.rol !== 'superadmin');

                                let tooltip = undefined;
                                if (isRestrictedBySubscription) {
                                    tooltip = "Se requiere una suscripción activa para acceder";
                                } else if (isRestrictedByFeature && user?.rol !== 'admin' && user?.rol !== 'superadmin') {
                                    tooltip = "Este plan no incluye esta funcionalidad";
                                } else if (isRestrictedByStore) {
                                    tooltip = "Selecciona o crea una tienda para acceder";
                                }

                                return (
                                    <SidebarNavItem
                                        key={item.to}
                                        {...item as any}
                                        collapsed={effectivelyCollapsed}
                                        isDark={isDark}
                                        end={item.to === '/'}
                                        onClick={() => setMobileOpen(false)}
                                        disabled={isRestricted}
                                        tooltip={tooltip}
                                    />
                                );
                            })}
                    </div>

                    {/* Módulos Próximamente */}
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {!effectivelyCollapsed && (
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: '14px', marginBottom: '8px' }}>
                                Próximamente
                            </span>
                        )}
                        {navItems.filter(i => !i.active).map((item) => (
                            <SidebarNavItem
                                key={item.label}
                                to={(item as any).to || '#'}
                                icon={item.icon}
                                label={item.label}
                                collapsed={effectivelyCollapsed}
                                isDark={isDark}
                                disabled
                                onClick={() => setMobileOpen(false)}
                            />
                        ))}
                    </div>

                    {/* Admin section - Solo si es admin */}
                    {(user?.rol === 'admin' || user?.rol === 'superadmin') && (
                        <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <SidebarNavItem
                                {...adminLink}
                                collapsed={effectivelyCollapsed}
                                isDark={isDark}
                                onClick={() => setMobileOpen(false)}
                                style={{
                                    backgroundColor: 'color-mix(in srgb, var(--color-admin-panel-link) 10%, transparent)',
                                    color: 'var(--color-admin-panel-link)'
                                }}
                            />
                        </div>
                    )}
                </nav>
            </aside>

            {/* Overlay mobile */}
            {mobileOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 30, backgroundColor: 'rgba(0,0,0,0.5)' }}
                    className="lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ─── Contenido Principal ─── */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                    marginLeft: 'var(--sidebar-width, 0px)',
                    transition: 'margin-left 300ms ease',
                    backgroundColor: 'var(--bg-primary)',
                }}
                className="max-lg:!ml-0"
            >
                {/* Header */}
                <header
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: isMobile ? '0 12px' : '0 28px',
                        height: '64px',
                        minHeight: '64px',
                        backgroundColor: 'var(--bg-primary)',
                        borderBottom: '1px solid var(--border-color)',
                        boxSizing: 'border-box'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Hamburger — solo visible en mobile */}
                        <button
                            onClick={() => setMobileOpen((v) => !v)}
                            className="flex lg:hidden items-center justify-center dc-hamburger-button"
                            aria-label="Menú"
                        >
                            <Menu size={24} />
                        </button>

                        {/* Launchpad Progress Indicator - Always Visible if not complete, otherwise follows preferences */}
                        {progress > 0 && (!isComplete || user?.preferencias?.mostrar_launchpad !== false) && (
                            <div
                                onClick={() => navigate('/launchpad')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px',
                                    backgroundColor: 'var(--bg-secondary)', padding: isMobile ? '4px 10px' : '6px 16px',
                                    borderRadius: '12px', border: '1px solid var(--border-color)',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    marginLeft: isMobile ? '4px' : '12px',
                                    maxWidth: isMobile ? '160px' : 'none',
                                    flexShrink: 1
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 0 }}>
                                    {isComplete ? <CheckCircle2 size={16} color="var(--color-success)" /> : <Rocket size={16} color="var(--color-primary)" />}
                                    <span style={{ fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        {isMobile ? '' : 'LAUNCHPAD: '}
                                        <span style={{ color: isMobile ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: isMobile ? 800 : 400 }}>{progress}%</span>
                                    </span>
                                </div>
                                {!isMobile && (
                                    <div style={{
                                        width: '80px', height: '6px', backgroundColor: 'var(--bg-tertiary)',
                                        borderRadius: '3px', overflow: 'hidden', display: 'flex', flexShrink: 0
                                    }}>
                                        <div style={{
                                            width: `${progress}%`, height: '100%',
                                            backgroundColor: isComplete ? 'var(--color-success)' : 'var(--color-primary)',
                                            transition: 'width 0.5s ease-out'
                                        }} />
                                    </div>
                                )}
                                {!isComplete ? (
                                    <div style={{
                                        fontSize: '9px', fontWeight: 600, padding: '2px 8px',
                                        backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
                                        color: 'var(--color-primary)', borderRadius: '6px',
                                        textTransform: 'uppercase',
                                        display: isMobile ? 'none' : 'block'
                                    }}>
                                        Continuar
                                    </div>
                                ) : (
                                    <div style={{
                                        fontSize: '9px', fontWeight: 600, padding: '2px 8px',
                                        backgroundColor: 'rgba(var(--color-success-rgb), 0.1)',
                                        color: 'var(--color-success)', borderRadius: '6px',
                                        textTransform: 'uppercase',
                                        display: isMobile ? 'none' : 'block'
                                    }}>
                                        Completado
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Indicador de Hora del Sistema */}
                        <div className="max-md:hidden" style={{ marginRight: '8px' }}>
                            <ClockDisplay />
                        </div>

                        {/* Toggle tema */}
                        <HeaderButton onClick={toggleTheme} label={isDark ? 'Modo claro' : 'Modo oscuro'}>
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </HeaderButton>

                        {/* Notificaciones */}
                        <div style={{ position: 'relative' }}>
                            <HeaderButton
                                onClick={() => {
                                    setNotificationsOpen(!notificationsOpen);
                                    if (userMenuOpen) setUserMenuOpen(false);
                                }}
                                label="Notificaciones"
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <span
                                        style={{
                                            position: 'absolute', top: '6px', right: '6px',
                                            width: '8px', height: '8px',
                                            backgroundColor: 'var(--color-error)',
                                            borderRadius: '50%',
                                            border: '2px solid var(--bg-primary)',
                                        }}
                                    />
                                )}
                            </HeaderButton>

                            {notificationsOpen && (
                                <NotificationPanel onClose={() => setNotificationsOpen(false)} />
                            )}
                        </div>

                        {/* Avatar / menú usuario */}
                        <div style={{ position: 'relative', marginLeft: '4px' }}>
                            <button
                                onClick={() => {
                                    setUserMenuOpen(!userMenuOpen);
                                    if (notificationsOpen) setNotificationsOpen(false);
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '6px', borderRadius: '10px',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    transition: 'background-color 150ms',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                <div
                                    style={{
                                        width: '34px', height: '34px',
                                        backgroundColor: user?.avatarUrl ? 'transparent' : 'var(--color-primary)',
                                        borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontSize: '13px', fontWeight: 600,
                                        overflow: 'hidden'
                                    }}
                                >
                                    {user?.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt={user.nombres}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <>{user?.nombres?.[0] || 'U'}</>
                                    )}
                                </div>
                                <ChevronDown size={14} color="var(--text-tertiary)" />
                            </button>

                            {userMenuOpen && (
                                <>
                                    <div
                                        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                                        onClick={() => setUserMenuOpen(false)}
                                    />
                                    <div
                                        style={{
                                            position: 'absolute', right: 0, top: '100%', marginTop: '10px',
                                            width: '280px',
                                            backgroundColor: 'var(--card-bg)',
                                            border: '1px solid var(--card-border)',
                                            borderRadius: '16px',
                                            boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
                                            zIndex: 50,
                                            animation: 'slideDown 150ms ease-out',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {/* User info section — centrado y premium */}
                                        <div
                                            style={{
                                                padding: '24px 20px 20px',
                                                textAlign: 'center',
                                                background: isDark
                                                    ? 'linear-gradient(180deg, rgba(0,102,255,0.08) 0%, transparent 100%)'
                                                    : 'linear-gradient(180deg, rgba(0,102,255,0.04) 0%, transparent 100%)',
                                            }}
                                        >
                                            {/* Avatar grande */}
                                            <div
                                                style={{
                                                    width: '56px', height: '56px',
                                                    background: user?.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #0066FF, #003D99)',
                                                    borderRadius: '50%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#fff', fontSize: '20px', fontWeight: 600,
                                                    margin: '0 auto 12px',
                                                    boxShadow: '0 4px 12px rgba(0,102,255,0.3)',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {user?.avatarUrl ? (
                                                    <img
                                                        src={user.avatarUrl}
                                                        alt={user.nombres}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <>{user?.nombres?.[0] || 'U'}</>
                                                )}
                                            </div>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    color: '#fff',
                                                    background: user?.rol === 'superadmin'
                                                        ? 'linear-gradient(135deg, #4338CA, #312E81)'
                                                        : 'linear-gradient(135deg, #0066FF, #003D99)',
                                                    padding: '4px 14px',
                                                    borderRadius: '20px',
                                                    letterSpacing: '0.05em',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {user?.rol && user.rol !== 'cliente'
                                                    ? (user.rol === 'superadmin' ? 'Superadmin' : user.rol === 'lider' ? 'Líder ⭐' : user.rol.toUpperCase())
                                                    : (user?.plan?.name || 'Plan Gratis')}
                                            </span>
                                        </div>

                                        {/* Acciones */}
                                        <div style={{ padding: '8px', borderTop: '1px solid var(--border-color)' }}>
                                            <DropdownItem
                                                icon={<Settings size={17} />}
                                                label="Configuración"
                                                onClick={() => { setUserMenuOpen(false); navigate('/configuracion'); }}
                                            />
                                            <DropdownItem
                                                icon={<Wallet size={17} />}
                                                label="Mi Billetera"
                                                onClick={() => {
                                                    if (user?.estadoSuscripcion !== 'activa' && user?.rol !== 'admin' && user?.rol !== 'superadmin') {
                                                        return;
                                                    }
                                                    setUserMenuOpen(false);
                                                    navigate('/billetera');
                                                }}
                                                disabled={user?.estadoSuscripcion !== 'activa' && user?.rol !== 'admin' && user?.rol !== 'superadmin'}
                                            />
                                            <DropdownItem
                                                icon={<LogOut size={17} />}
                                                label="Cerrar sesión"
                                                onClick={handleLogout}
                                                danger
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main content */}
                <main
                    style={{
                        flex: 1,
                        padding: 'var(--main-padding)',
                        maxWidth: '1600px',
                        width: '100%',
                        margin: '0 auto',
                    }}
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

/* ─── Sub-componentes ─── */

function HeaderButton({
    onClick,
    label,
    children,
}: {
    onClick?: () => void;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            aria-label={label}
            style={{
                position: 'relative', padding: '8px', borderRadius: '10px',
                color: 'var(--text-secondary)', background: 'none', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
            }}
        >
            {children}
        </button>
    );
}

function DropdownItem({
    icon, label, onClick, danger = false, disabled = false,
}: {
    icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px', fontSize: '14px', fontWeight: 500,
                color: danger ? 'var(--color-error)' : 'var(--text-primary)',
                background: 'none', border: 'none', borderRadius: '10px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background-color 150ms',
                opacity: disabled ? 0.4 : 1,
            }}
            onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
            onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
            {icon}
            {label}
        </button>
    );
}

interface SidebarGroupItemProps {
    label: string;
    icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
    children: { to: string; label: string }[];
    collapsed: boolean;
    isOpen: boolean;
    onToggle: () => void;
    onClickSub: () => void;
}

function SidebarGroupItem({ label, icon: Icon, children, collapsed, isOpen, onToggle, onClickSub }: SidebarGroupItemProps) {
    const [hovered, setHovered] = useState(false);
    const location = useLocation();

    // Check if any child is active
    const isChildActive = children.some(child => location.pathname === child.to);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Tooltip content={label} position="right" delay={50} offset={12} disabled={!collapsed}>
                <button
                    onClick={collapsed ? undefined : onToggle}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'space-between',
                        gap: '12px',
                        padding: collapsed ? '12px' : '10px 14px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: isChildActive ? 600 : 500,
                        backgroundColor: isChildActive && !isOpen
                            ? 'var(--color-primary)'
                            : hovered ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: (isChildActive && !isOpen) || hovered ? '#fff' : 'rgba(255,255,255,0.7)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                        width: '100%',
                        textAlign: 'left'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Icon size={collapsed ? 22 : 18} style={{ flexShrink: 0 }} />
                        {!collapsed && <span>{label}</span>}
                    </div>
                    {!collapsed && (
                        <ChevronDown
                            size={14}
                            style={{
                                transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                                transition: 'transform 200ms ease',
                                opacity: 0.5
                            }}
                        />
                    )}
                </button>
            </Tooltip>

            {!collapsed && (
                <div style={{
                    maxHeight: isOpen ? `${children.length * 40}px` : '0',
                    overflow: 'hidden',
                    transition: 'max-height 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    paddingLeft: '16px'
                }}>
                    {children.map(child => (
                        <NavLink
                            key={child.to}
                            to={child.to}
                            onClick={onClickSub}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: isActive ? 600 : 400,
                                textDecoration: 'none',
                                color: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.5)',
                                transition: 'all 150ms ease',
                                borderLeft: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                                backgroundColor: isActive ? 'rgba(var(--color-primary-rgb), 0.05)' : 'transparent',
                            })}
                            className="hover-bg-subitem"
                        >
                            {child.label}
                        </NavLink>
                    ))}
                </div>
            )}

            <style>{`
                .hover-bg-subitem:hover {
                    color: #fff !important;
                    background-color: rgba(255,255,255,0.03);
                }
            `}</style>
        </div>
    );
}

interface SidebarNavItemProps {
    to: string;
    icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
    label: string;
    collapsed: boolean;
    isDark: boolean;
    end?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    tooltip?: string;
    style?: React.CSSProperties;
}

function SidebarNavItem({
    to,
    icon: Icon,
    label,
    collapsed,
    isDark,
    end,
    onClick,
    disabled,
    tooltip,
    style: customStyle,
}: SidebarNavItemProps) {
    const [hovered, setHovered] = useState(false);

    if (disabled) {
        return (
            <Tooltip content={tooltip || "Próximamente disponible"} position="right" delay={50} offset={-14}>
                <div
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: '12px',
                        padding: collapsed ? '12px' : '10px 14px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        cursor: 'not-allowed',
                        opacity: 0.4,
                        color: 'var(--sidebar-text)',
                        transition: 'all 150ms ease',
                        position: 'relative',
                        ...customStyle
                    }}
                >
                    <Icon size={collapsed ? 22 : 18} style={{ flexShrink: 0 }} />
                    {!collapsed && label}
                </div>
            </Tooltip>
        );
    }

    return (
        <Tooltip content={label} position="right" delay={50} offset={12} disabled={!collapsed}>
            <NavLink
                to={to}
                end={end}
                onClick={onClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: '12px',
                    padding: collapsed ? '12px' : '10px 14px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    textDecoration: 'none',
                    transition: 'all 150ms ease',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    backgroundColor: isActive
                        ? 'var(--color-primary)'
                        : hovered
                            ? 'rgba(255,255,255,0.08)'
                            : 'transparent',
                    color: isActive ? '#fff' : hovered ? '#fff' : 'var(--sidebar-text)',
                    transform: hovered && !isActive ? 'translateX(2px)' : 'none',
                    ...customStyle
                })}
            >
                <Icon size={collapsed ? 22 : 18} style={{ flexShrink: 0 }} />
                {!collapsed && label}
            </NavLink>
        </Tooltip>
    );
}
function ClockDisplay() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 30000); // 30s para precisión
        return () => clearInterval(timer);
    }, []);

    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Traducir o formatear zona para que se vea más limpia
    const readableZone = zone.split('/').pop()?.replace(/_/g, ' ') || zone;

    return (
        <Tooltip content={`Zona Horaria: ${zone}`} position="bottom">
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '10px',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: '1px solid var(--border-color)',
                    transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                }}
            >
                <Clock size={16} style={{ color: 'var(--color-primary)' }} />
                <span>
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: '6px', fontWeight: 500 }}>
                        {readableZone}
                    </span>
                </span>
            </div>
        </Tooltip>
    );
}
