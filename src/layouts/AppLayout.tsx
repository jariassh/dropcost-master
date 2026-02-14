/**
 * Layout principal de la aplicación.
 * Sidebar colapsable (íconos / íconos+labels) que EMPUJA el contenido.
 * Header con toggle tema, notificaciones y dropdown usuario premium.
 */
import { useState } from 'react';
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
    UserCircle,
    Gift,
    Share2,
    Wallet,
    Link2,
    PieChart,
    GraduationCap,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { Tooltip } from '@/components/common/Tooltip';

const SIDEBAR_OPEN = 240;
const SIDEBAR_COLLAPSED = 72;

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', active: true },
    { to: '/simulador', icon: Calculator, label: 'Simulador', active: true },
    { to: '/ofertas', icon: Gift, label: 'Ofertas Irresistibles', active: true },
    { to: '/analisis-regional', icon: Map, label: 'Análisis Regional', active: false },
    { to: '/referidos', icon: Share2, label: 'Sistema de Referidos', active: false },
    { to: '/capacitacion', icon: GraduationCap, label: 'Centro de Capacitación', active: false },
    { to: '/billetera', icon: Wallet, label: 'Billetera / Wallet', active: false },
    { to: '/configuracion', icon: Settings, label: 'Configuración', active: false },
];

const adminLink = { to: '/admin', icon: ShieldAlert, label: 'Panel Administración' };


export function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { isDark, toggleTheme } = useTheme();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_OPEN;

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
            {/* ─── Sidebar ─── */}
            <aside
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${sidebarWidth}px`,
                    backgroundColor: 'var(--sidebar-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 40,
                    transition: 'width 250ms ease',
                    overflow: 'hidden',
                }}
                className={mobileOpen ? '' : 'max-lg:hidden'}
            >
                {/* Logo + Toggle */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'space-between',
                        padding: collapsed ? '0' : '0 16px 0 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        height: '64px',
                        transition: 'padding 250ms ease',
                    }}
                >
                    {!collapsed && (
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
                        onClick={() => setCollapsed((v) => !v)}
                        style={{
                            padding: '8px',
                            borderRadius: '8px',
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.4)',
                            cursor: 'pointer',
                            display: 'flex',
                            transition: 'color 150ms',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                        aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                    >
                        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                </div>

                {/* Navegación */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', padding: collapsed ? '12px 8px' : '16px 12px' }}>
                    {/* Módulos Activos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {navItems.filter(i => i.active).map((item) => (
                            <SidebarNavItem key={item.to} {...item} collapsed={collapsed} end={item.to === '/'} onClick={() => setMobileOpen(false)} />
                        ))}
                    </div>

                    {/* Módulos Próximamente */}
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {!collapsed && (
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: '14px', marginBottom: '8px' }}>
                                Próximamente
                            </span>
                        )}
                        {navItems.filter(i => !i.active).map((item) => (
                            <SidebarNavItem key={item.to} {...item} collapsed={collapsed} disabled onClick={() => setMobileOpen(false)} />
                        ))}
                    </div>

                    {/* Admin section - Solo si es admin */}
                    {(user?.rol === 'admin' || user?.rol === 'superadmin') && (
                        <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <SidebarNavItem
                                {...adminLink}
                                collapsed={collapsed}
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
                    marginLeft: `${sidebarWidth}px`,
                    transition: 'margin-left 250ms ease',
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
                            className="lg:hidden"
                            style={{
                                padding: '8px', borderRadius: '8px',
                                color: 'var(--text-secondary)', background: 'none', border: 'none',
                                cursor: 'pointer',
                            }}
                            aria-label="Menú"
                        >
                            <PanelLeftOpen size={20} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Toggle tema */}
                        <HeaderButton onClick={toggleTheme} label={isDark ? 'Modo claro' : 'Modo oscuro'}>
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </HeaderButton>

                        {/* Notificaciones */}
                        <HeaderButton label="Notificaciones">
                            <Bell size={18} />
                            <span
                                style={{
                                    position: 'absolute', top: '6px', right: '6px',
                                    width: '8px', height: '8px',
                                    backgroundColor: 'var(--color-error)',
                                    borderRadius: '50%',
                                }}
                            />
                        </HeaderButton>

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
                                                Plan Pro
                                            </span>
                                        </div>

                                        {/* Acciones */}
                                        <div style={{ padding: '8px', borderTop: '1px solid var(--border-color)' }}>
                                            <DropdownItem
                                                icon={<UserCircle size={17} />}
                                                label="Mi Perfil"
                                                onClick={() => { setUserMenuOpen(false); navigate('/perfil'); }}
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
                        padding: '28px 32px',
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
    style: customStyle,
}: SidebarNavItemProps) {
    const [hovered, setHovered] = useState(false);

    if (disabled) {
        return (
            <Tooltip content="Próximamente disponible" position="right" delay={100}>
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
