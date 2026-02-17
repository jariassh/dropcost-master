import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { configService } from '@/services/configService';
import {
    Users,
    CreditCard,
    Ticket,
    History,
    Settings,
    LayoutDashboard,
    PanelLeftClose,
    PanelLeftOpen,
    UserCircle,
    LogOut,
    Sun,
    Moon,
    Bell,
    ChevronDown,
    ArrowLeft,
    ShieldCheck,
    Megaphone,
    PieChart,
    Link2,
    Share,
    Menu,
    X,
    Mail,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';

const SIDEBAR_OPEN = 260;
const SIDEBAR_COLLAPSED = 72;

const adminNavItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard', end: true },
    { to: '/admin/users', icon: Users, label: 'Gestión Usuarios' },
    { to: '/admin/traffic', icon: PieChart, label: 'Análisis de Tráfico', disabled: true },
    { to: '/admin/shortener', icon: Link2, label: 'Acortador de Enlaces', disabled: true },
    { to: '/admin/ads', icon: Megaphone, label: 'Ads & Creatividades', disabled: true },
    { to: '/admin/plans', icon: CreditCard, label: 'Planes y Membresías' },
    { to: '/admin/referrals', icon: Share, label: 'Sistema de Referidos' },
    { to: '/admin/withdrawals', icon: CreditCard, label: 'Gestión de Retiros' },
    { to: '/admin/promo-codes', icon: Ticket, label: 'Códigos Promocionales', disabled: true },
    { to: '/admin/logs', icon: History, label: 'Logs de Auditoría' },
    { to: '/admin/settings', icon: Settings, label: 'Ajustes Globales' },
    { to: '/admin/email-templates', icon: Mail, label: 'Plantillas de Email' },
];

export function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { isDark, toggleTheme } = useTheme();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [logos, setLogos] = useState<{ light: string | null; dark: string | null }>({ light: null, dark: null });

    useEffect(() => {
        configService.getConfig().then(config => {
            setLogos({
                light: config.logo_principal_url || null,
                dark: config.logo_variante_url || null
            });
        });
    }, []);

    // Apply global configuration (SEO, Colors, Tracking)
    useGlobalConfig();

    const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_OPEN;
    // En móvil (drawer abierto), siempre mostramos el contenido completo
    const effectivelyCollapsed = collapsed && !mobileOpen;

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', '--sidebar-width': `${sidebarWidth}px` } as any}>
            {/* ─── Admin Sidebar ─── */}
            <aside
                style={{
                    position: 'fixed',
                    top: 0,
                    left: undefined,
                    bottom: 0,
                    width: mobileOpen ? '280px' : `${sidebarWidth}px`,
                    backgroundColor: '#111827', // Darker for Admin
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 50,
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    ...(mobileOpen ? { left: 0 } : {})
                }}
                className={`lg:left-0 ${!mobileOpen ? 'max-lg:-left-full' : ''}`}
            >
                {/* Admin Badge/Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: effectivelyCollapsed ? 'center' : 'space-between',
                        padding: effectivelyCollapsed ? '0' : '0 16px 0 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        height: '64px',
                        background: 'linear-gradient(90deg, #1F2937, #111827)',
                    }}
                >
                    {!effectivelyCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {logos.dark || logos.light ? (
                                <img
                                    src={logos.dark || logos.light || ''}
                                    alt="Admin"
                                    style={{
                                        height: '32px',
                                        width: 'auto',
                                        maxWidth: '180px',
                                        objectFit: 'contain'
                                    }}
                                />
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div
                                        style={{
                                            width: '32px', height: '32px',
                                            backgroundColor: '#EF4444',
                                            borderRadius: '8px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}
                                    >
                                        <ShieldCheck size={18} color="#fff" />
                                    </div>
                                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em' }}>
                                        ADMIN<span style={{ color: '#EF4444' }}>PANEL</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => {
                            if (window.innerWidth < 1024) {
                                setMobileOpen(false);
                            } else {
                                setCollapsed((v) => !v);
                            }
                        }}
                        style={{
                            padding: '8px', borderRadius: '8px', background: 'none', border: 'none',
                            color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex'
                        }}
                        aria-label={effectivelyCollapsed ? 'Expandir' : 'Cerrar'}
                    >
                        {window.innerWidth < 1024 ? <X size={18} /> : (effectivelyCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />)}
                    </button>
                </div>

                {/* Return to App */}
                <div style={{ padding: effectivelyCollapsed ? '12px 8px' : '16px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <button
                        onClick={() => {
                            navigate('/');
                            setMobileOpen(false);
                        }}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: effectivelyCollapsed ? 'center' : 'flex-start',
                            gap: '12px',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            transition: 'background 150ms'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    >
                        <ArrowLeft size={18} />
                        {!effectivelyCollapsed && "Volver a la App"}
                    </button>
                </div>

                {/* Admin Nav */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', padding: effectivelyCollapsed ? '12px 8px' : '16px 12px' }}>
                    {adminNavItems.map((item) => (
                        <AdminSidebarNavItem
                            key={item.to}
                            {...item}
                            collapsed={effectivelyCollapsed}
                            onClick={() => setMobileOpen(false)}
                        />
                    ))}
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

            {/* Main Content */}
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
                {/* Same Header as App but maybe styled differently */}
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
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="flex lg:hidden items-center justify-center dc-hamburger-button"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Panel de Administración</h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HeaderButton onClick={toggleTheme} label={isDark ? 'Modo claro' : 'Modo oscuro'}>
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </HeaderButton>
                        <HeaderButton label="Notificaciones">
                            <Bell size={18} />
                        </HeaderButton>

                        <div style={{ position: 'relative', marginLeft: '4px' }}>
                            <button
                                onClick={() => setUserMenuOpen((v) => !v)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <div style={{ width: '34px', height: '34px', backgroundColor: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 700 }}>
                                    {user?.nombres?.[0] || 'A'}
                                </div>
                                <ChevronDown size={14} color="var(--text-tertiary)" />
                            </button>
                            {userMenuOpen && (
                                <>
                                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setUserMenuOpen(false)} />
                                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '10px', width: '220px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden' }}>
                                        <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                                            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Admin</p>
                                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{user?.email}</p>
                                        </div>
                                        <div style={{ padding: '4px' }}>
                                            <button
                                                onClick={handleLogout}
                                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', fontSize: '14px', color: 'var(--color-error)', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <LogOut size={16} /> Cerrar Sesión
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main style={{ flex: 1, padding: 'var(--main-padding)', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

function AdminSidebarNavItem({ to, icon: Icon, label, collapsed, disabled, end, onClick }: any) {
    const [hovered, setHovered] = useState(false);

    if (disabled) {
        return (
            <div
                style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: collapsed ? '12px' : '10px 14px',
                    borderRadius: '10px', fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.2)',
                    cursor: 'not-allowed', position: 'relative'
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <Icon size={18} />
                {!collapsed && label}
                {hovered && !collapsed && (
                    <div style={{ position: 'absolute', left: '100%', marginLeft: '10px', backgroundColor: '#1F2937', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', zIndex: 100, whiteSpace: 'nowrap' }}>
                        Próximamente
                    </div>
                )}
            </div>
        );
    }

    return (
        <NavLink
            to={to}
            end={end}
            onClick={onClick}
            style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '12px', padding: collapsed ? '12px' : '10px 14px',
                borderRadius: '10px', fontSize: '14px', fontWeight: isActive ? 600 : 500,
                textDecoration: 'none', transition: 'all 150ms ease',
                backgroundColor: isActive ? '#EF4444' : hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: isActive ? '#fff' : hovered ? '#fff' : 'rgba(255,255,255,0.6)',
            })}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <Icon size={18} />
            {!collapsed && label}
        </NavLink>
    );
}

function HeaderButton({ onClick, label, children }: any) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '8px', borderRadius: '10px', color: 'var(--text-secondary)', background: 'none',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
            {children}
        </button>
    );
}
