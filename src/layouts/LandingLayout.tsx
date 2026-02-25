import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import {
    Menu, X, Sun, Moon, Instagram, Twitter,
    Linkedin, Mail, ArrowRight,
    ShieldCheck
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { configService, GlobalConfig } from '@/services/configService';
import { CookieBanner } from '@/components/common/CookieBanner';
import { CookiePreferencesModal } from '@/components/common/CookiePreferencesModal';

/**
 * LandingLayout: Layout para la página de ventas.
 * Incluye un Header con Glassmorphism y un Footer comercial dinámico.
 */
export function LandingLayout() {
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [config, setConfig] = useState<GlobalConfig | null>(null);

    // Inyectar FontAwesome para iconos reales (WhatsApp)
    useEffect(() => {
        if (!document.getElementById('fontawesome-cdn')) {
            const link = document.createElement('link');
            link.id = 'fontawesome-cdn';
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
            document.head.appendChild(link);
        }
    }, []);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await configService.getConfig();
                setConfig(data);
            } catch (error) {
                console.error('Error fetching landing config:', error);
            }
        };
        fetchConfig();
    }, []);

    // Geolocalización por IP
    const [userCountry, setUserCountry] = useState<any>(null);

    useEffect(() => {
        const detectCountry = async () => {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                if (data.country_code) {
                    const { obtenerPaisPorCodigo } = await import('@/services/paisesService');
                    const pais = await obtenerPaisPorCodigo(data.country_code);
                    if (pais) {
                        setUserCountry(pais);
                        // Emitir evento para que otros componentes (como LandingPage) se enteren
                        window.dispatchEvent(new CustomEvent('countryDetected', { detail: pais }));
                    }
                }
            } catch (error) {
                console.error('Error detecting country:', error);
            }
        };
        detectCountry();
    }, []);

    // RGB Background fallback
    const headerBg = theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)';

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            transition: 'background-color 0.3s, color 0.3s'
        }}>
            {/* HEADER */}
            <header style={{
                position: 'fixed',
                top: 0,
                width: '100%',
                backgroundColor: headerBg,
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--border-color)',
                zIndex: 1000,
                padding: '0 var(--main-padding)'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                        {/* Logo dinámico: Usa variante para tema oscuro */}
                        {theme === 'dark' && config?.logo_variante_url ? (
                            <img
                                src={config.logo_variante_url}
                                alt="Logo"
                                style={{ height: '42px', objectFit: 'contain' }}
                            />
                        ) : config?.logo_principal_url ? (
                            <img
                                src={config.logo_principal_url}
                                alt="Logo"
                                style={{ height: '42px', objectFit: 'contain' }}
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    backgroundColor: 'var(--color-primary)',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 8px 16px rgba(0, 102, 255, 0.2)'
                                }}>
                                    <div style={{ width: '20px', height: '20px', border: '3px solid white', borderRadius: '4px' }}></div>
                                </div>
                                <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                                    DropCost <span style={{ color: 'var(--color-primary)' }}>Master</span>
                                </span>
                            </div>
                        )}
                    </Link>

                    {/* Desktop Nav */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="desktop-view">
                        <NavLink href="#features">Funciones</NavLink>
                        <NavLink href="#comparison">Excel vs Nos</NavLink>
                        <NavLink href="#pricing">Planes</NavLink>
                        <NavLink href="#testimonials">Testimonios</NavLink>

                        {userCountry && (
                            <div
                                title={`País detectado: ${userCountry.nombre_es}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px 12px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                <img
                                    src={`https://flagcdn.com/w40/${userCountry.codigo_iso_2.toLowerCase()}.png`}
                                    alt={userCountry.nombre_es}
                                    style={{ height: '14px', borderRadius: '2px', objectFit: 'cover' }}
                                />
                                <span className="desktop-view" style={{ fontSize: '12px' }}>{userCountry.codigo_iso_2}</span>
                            </div>
                        )}

                        <button
                            onClick={toggleTheme}
                            title="Cambiar Tema"
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                padding: '8px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <Link
                            to="/login"
                            style={{
                                color: 'var(--text-primary)',
                                textDecoration: 'none',
                                fontSize: '15px',
                                fontWeight: 600,
                                opacity: 0.8,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-primary)';
                                e.currentTarget.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-primary)';
                                e.currentTarget.style.opacity = '0.8';
                            }}
                        >
                            Iniciar Sesión
                        </Link>

                        <a
                            href="#pricing"
                            style={{
                                padding: '10px 24px',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                borderRadius: '10px',
                                fontWeight: 700,
                                textDecoration: 'none',
                                fontSize: '14px',
                                boxShadow: '0 4px 12px rgba(0, 102, 255, 0.2)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 102, 255, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 102, 255, 0.2)';
                            }}
                        >
                            Ver Planes
                        </a>
                    </nav>

                    {/* Mobile Button */}
                    <button
                        className="mobile-toggle"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
                    >
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div style={{
                        position: 'absolute',
                        top: '80px',
                        left: 0,
                        width: '100%',
                        backgroundColor: 'var(--bg-primary)',
                        padding: '24px',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
                        zIndex: 999
                    }}>
                        <a href="#features" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Funciones</a>
                        <a href="#comparison" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Excel vs Nos</a>
                        <a href="#pricing" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Planes</a>
                        <a href="#testimonials" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Testimonios</a>
                        <button onClick={toggleTheme} style={{ background: 'var(--bg-secondary)', border: 'none', padding: '12px', borderRadius: '12px', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Modo {theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <Link to="/login" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Iniciar Sesión</Link>
                        <Link to="/registro" onClick={() => setIsMenuOpen(false)} style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '16px', borderRadius: '12px', textAlign: 'center', textDecoration: 'none', fontWeight: 700, boxShadow: '0 4px 12px rgba(0, 102, 255, 0.2)' }}>Empezar Ahora</Link>
                    </div>
                )}
            </header>

            <main style={{ paddingTop: '80px' }}>
                <Outlet />
            </main>

            {/* FOOTER */}
            <footer style={{
                backgroundColor: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border-color)',
                padding: '80px var(--main-padding) 40px'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '48px',
                        marginBottom: '64px'
                    }}>
                        {/* Column 1: Brand */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                {/* Unificamos lógica con el header: Variante para Dark, Principal para Light */}
                                {theme === 'dark' && config?.logo_variante_url ? (
                                    <img src={config.logo_variante_url} alt="Logo" style={{ height: '36px', objectFit: 'contain' }} />
                                ) : config?.logo_principal_url ? (
                                    <img src={config.logo_principal_url} alt="Logo" style={{ height: '36px', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            backgroundColor: 'var(--color-primary)',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <div style={{ width: '16px', height: '16px', border: '2px solid white', borderRadius: '3px' }}></div>
                                        </div>
                                        <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                                            DropCost <span style={{ color: 'var(--color-primary)' }}>Master</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px', maxWidth: '320px' }}>
                                La plataforma definitiva para optimizar tu rentabilidad en el dropshipping COD. Diseñada para que escales con números reales, no con supuestos.
                            </p>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <SocialIcon icon={<Instagram size={20} />} href={config?.instagram_url} />
                                <SocialIcon icon={<Twitter size={20} />} href={config?.twitter_url} />
                                <SocialIcon icon={<Linkedin size={20} />} href={config?.linkedin_url} />
                                <SocialIcon icon={<i className="fa-brands fa-whatsapp" style={{ fontSize: '20px', color: '#25D366' }}></i>} href={config?.telefono ? `https://wa.me/${config.telefono.replace(/\D/g, '')}` : undefined} />
                            </div>
                        </div>

                        {/* Column 2: Product */}
                        <div>
                            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px' }}>Producto</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <FooterLink href="#features">Funciones</FooterLink>
                                <FooterLink href="#comparison">Excel vs Nos</FooterLink>
                                <FooterLink href="#pricing">Planes</FooterLink>
                                <FooterLink href="/registro">Registrarse</FooterLink>
                            </div>
                        </div>

                        {/* Column 3: Soporte */}
                        <div>
                            <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px' }}>Soporte</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <FooterLink href={`mailto:${config?.email_contacto || 'soporte@dropcost.com'}`} icon={<Mail size={16} />}>Email de Soporte</FooterLink>
                                <FooterLink href={config?.telefono ? `https://wa.me/${config.telefono.replace(/\D/g, '')}` : '#'} icon={<i className="fa-brands fa-whatsapp" style={{ fontSize: '18px', color: '#25D366' }}></i>}>WhatsApp Directo</FooterLink>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '32px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '24px'
                    }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                            © {new Date().getFullYear()} DropCost Master. Todos los derechos reservados.
                        </div>
                        <div style={{ display: 'flex', gap: '32px' }}>
                            <FooterLink href={config?.terminos_condiciones_url || "/terminos"}>Términos</FooterLink>
                            <FooterLink href={config?.politica_privacidad_url || "/privacidad"}>Privacidad</FooterLink>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <img src="https://img.icons8.com/color/48/000000/mercado-pago.png" alt="Mercado Pago" style={{ height: '24px', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                            <img src="https://img.icons8.com/color/48/000000/visa.png" alt="Visa" style={{ height: '24px', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                            <img src="https://img.icons8.com/color/48/000000/mastercard.png" alt="Mastercard" style={{ height: '24px', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '11px',
                                fontWeight: 800,
                                color: 'var(--success)',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                letterSpacing: '0.05em'
                            }}>
                                <ShieldCheck size={14} /> SSL SECURE
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            <style>{`
                .desktop-view { display: none; }
                .mobile-toggle { display: block; }
                @media (min-width: 992px) {
                    .desktop-view { display: flex; }
                    .mobile-toggle { display: none; }
                }
            `}</style>
            <CookieBanner />
            <CookiePreferencesModal />
        </div>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            style={{
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: 600,
                opacity: 0.8,
                transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-primary)';
                e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.opacity = '0.8';
            }}
        >
            {children}
        </a>
    );
}

function SocialIcon({ icon, href }: { icon: React.ReactNode; href?: string }) {
    const hasLink = href && href !== '' && href !== '#';
    return (
        <a
            href={hasLink ? href : undefined}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: hasLink ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                transition: 'all 0.2s',
                opacity: hasLink ? 1 : 0.5,
                cursor: hasLink ? 'pointer' : 'default'
            }}
            onMouseEnter={(e) => {
                if (!hasLink) return;
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.color = 'var(--color-primary)';
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 102, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
                if (!hasLink) return;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {icon}
        </a>
    );
}

function FooterLink({ href, children, icon }: { href: string; children: React.ReactNode; icon?: React.ReactNode }) {
    const isExt = href.startsWith('http') || href.startsWith('mailto:');

    return (
        <a
            href={href}
            target={isExt ? "_blank" : undefined}
            rel={isExt ? "noopener noreferrer" : undefined}
            style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
            {icon && icon}
            {children}
        </a>
    );
}
