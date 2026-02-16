/**
 * Layout principal de la aplicación.
 * Sidebar colapsable (íconos / íconos+labels) que EMPUJA el contenido.
 * Header con toggle tema, notificaciones y dropdown usuario premium.
 */
import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { Tooltip } from '@/components/common/Tooltip';
import { StoreSelector } from '@/components/layout/StoreSelector';
import { useStoreStore } from '@/store/useStoreStore';
import { useSessionEnforcer } from '@/hooks/useSessionEnforcer';

const SIDEBAR_OPEN = 240;
const SIDEBAR_COLLAPSED = 72;

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', active: false }, // Próximamente
    { to: '/simulador', icon: Calculator, label: 'Simulador', active: true },
    { to: '/ofertas', icon: Gift, label: 'Ofertas Irresistibles', active: true },
    { to: '/referidos', icon: Share2, label: 'Sistema de Referidos', active: true },
    { to: '/billetera', icon: Wallet, label: 'Billetera / Wallet', active: true },
    { to: '/configuracion', icon: Settings, label: 'Configuración', active: true },
    { to: '/analisis-regional', icon: Map, label: 'Análisis Regional', active: false },
    { to: '/acortador', icon: Link2, label: 'Acortador URL', active: false },
    { to: '/capacitacion', icon: GraduationCap, label: 'Capacitación', active: false },
    { to: '/historial', icon: HistoryIcon, label: 'Historial de Actividad', active: true },
];

const adminLink = { to: '/admin', icon: ShieldAlert, label: 'Panel Administración' };


export function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const { isDark, toggleTheme } = useTheme();
    const { user, logout } = useAuthStore();
    const { unreadCount, fetchNotifications } = useNotificationStore();
    const { tiendaActual } = useStoreStore();
    const navigate = useNavigate();

    // Enforce single session
    useSessionEnforcer();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

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
                    overflow: 'hidden',
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
                        padding: effectivelyCollapsed ? '0' : '0 16px 0 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        height: '64px',
                        transition: 'padding 250ms ease',
                    }}
                >
                    {!effectivelyCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px', whiteSpace: 'nowrap' }}>
                                DropCost<span style={{ color: 'var(--color-primary)' }}>Master</span>
                            </span>
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
                            padding: '8px',
                            borderRadius: '88px',
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.4)',
                            cursor: 'pointer',
                            display: 'flex',
                            transition: 'color 150ms',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                        aria-label={effectivelyCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                    >
                        {window.innerWidth < 1024 ? <X size={20} /> : (effectivelyCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />)}
                    </button>
                </div>

                {/* Selector de Tienda */}
                <div style={{ marginTop: '16px' }}>
                    <StoreSelector collapsed={effectivelyCollapsed} />
                </div>

                {/* Navegación */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', padding: effectivelyCollapsed ? '4px 8px 12px' : '0 12px 16px' }}>
                    {/* Módulos Activos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {navItems.filter(i => i.active).map((item) => {
                            const isRestricted = !tiendaActual && (item.to === '/simulador' || item.to === '/ofertas');

                            return (
                                <SidebarNavItem
                                    key={item.to}
                                    {...item}
                                    collapsed={effectivelyCollapsed}
                                    end={item.to === '/'}
                                    onClick={() => setMobileOpen(false)}
                                    disabled={isRestricted}
                                    tooltip={isRestricted ? "Selecciona o crea una tienda para acceder" : undefined}
                                />
                            );
                        })}
                    </div>

                    {/* Módulos Próximamente */}
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {!effectivelyCollapsed && (
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: '14px', marginBottom: '8px' }}>
                                Próximamente
                            </span>
                        )}
                        {navItems.filter(i => !i.active).map((item) => (
                            <SidebarNavItem key={item.to} {...item} collapsed={effectivelyCollapsed} disabled onClick={() => setMobileOpen(false)} />
                        ))}
                    </div>

                    {/* Admin section - Solo si es admin */}
                    {(user?.rol === 'admin' || user?.rol === 'superadmin') && (
                        <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <SidebarNavItem
                                {...adminLink}
                                collapsed={effectivelyCollapsed}
                                onClick={() => setMobileOpen(false)}
                                style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#EF4444'
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
                }}
                className="max-lg:!ml-0"
            >
                {/* Header */}
                <header
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 28px',
                        height: '64px',
                        backgroundColor: 'var(--bg-primary)',
                        borderBottom: '1px solid var(--border-color)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Hamburger — solo visible en mobile */}
                        <button
                            onClick={() => setMobileOpen((v) => !v)}
                            className="flex lg:hidden items-center justify-center dc-hamburger-button"
                            aria-label="Menú"
                        >
                            <Menu size={20} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Toggle tema */}
                        <HeaderButton onClick={toggleTheme} label={isDark ? 'Modo claro' : 'Modo oscuro'}>
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </HeaderButton>

                        {/* Notificaciones */}
                        <div style={{ position: 'relative' }}>
                            <HeaderButton
                                onClick={() => setNotificationsOpen(v => !v)}
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
                                onClick={() => setUserMenuOpen((v) => !v)}
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
                                        backgroundColor: 'var(--color-primary)',
                                        borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontSize: '13px', fontWeight: 700,
                                    }}
                                >
                                    {user?.nombres?.[0] || 'U'}
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
                                                    background: 'linear-gradient(135deg, #0066FF, #003D99)',
                                                    borderRadius: '50%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#fff', fontSize: '20px', fontWeight: 700,
                                                    margin: '0 auto 12px',
                                                    boxShadow: '0 4px 12px rgba(0,102,255,0.3)',
                                                }}
                                            >
                                                {user?.nombres?.[0] || 'U'}
                                            </div>
                                            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                                                {user?.nombres || 'Usuario'} {user?.apellidos || ''}
                                            </p>
                                            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '0 0 12px' }}>
                                                {user?.email || 'usuario@ejemplo.com'}
                                            </p>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    color: '#fff',
                                                    background: 'linear-gradient(135deg, #0066FF, #003D99)',
                                                    padding: '4px 14px',
                                                    borderRadius: '20px',
                                                    letterSpacing: '0.05em',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {user?.plan?.name || (user?.planId === 'plan_free' ? 'Plan Gratis' : user?.planId === 'plan_pro' ? 'Plan Pro' : user?.planId === 'plan_enterprise' ? 'Plan Enterprise' : 'Plan Básico')}
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
                                                onClick={() => { setUserMenuOpen(false); navigate('/billetera'); }}
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
    icon, label, onClick, danger = false,
}: {
    icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px', fontSize: '14px', fontWeight: 500,
                color: danger ? 'var(--color-error)' : 'var(--text-primary)',
                background: 'none', border: 'none', borderRadius: '10px',
                cursor: 'pointer', transition: 'background-color 150ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
            {icon}
            {label}
        </button>
    );
}

interface SidebarNavItemProps {
    to: string;
    icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
    label: string;
    collapsed: boolean;
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
                    <Icon size={18} style={{ flexShrink: 0 }} />
                    {!collapsed && label}
                </div>
            </Tooltip>
        );
    }

    return (
        <NavLink
            to={to}
            end={end}
            onClick={onClick}
            title={collapsed ? label : undefined}
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
            <Icon size={18} style={{ flexShrink: 0 }} />
            {!collapsed && label}
        </NavLink>
    );
}
