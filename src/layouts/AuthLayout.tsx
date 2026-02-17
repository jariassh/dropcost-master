/**
 * Layout de autenticación — Dos columnas.
 * Izquierda: gradiente azul con branding DropCost Master.
 * Derecha: formulario (children vía Outlet).
 */
import { Outlet } from 'react-router-dom';
import { BarChart3, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';
import { configService, GlobalConfig } from '@/services/configService';
import { useState, useEffect } from 'react';

export function AuthLayout() {
    const { isDark, toggleTheme } = useTheme();
    const { applyConfig } = useGlobalConfig();
    const [logos, setLogos] = useState<{ light: string | null; dark: string | null }>({ light: null, dark: null });

    useEffect(() => {
        configService.getConfig().then(config => {
            setLogos({
                light: config.logo_principal_url || null,
                dark: config.logo_variante_url || null
            });
        });
    }, []);

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* ─── Panel Izquierdo: Branding ─── */}
            <div
                className="hidden lg:flex"
                style={{
                    width: '55%',
                    background: 'linear-gradient(135deg, #0066FF 0%, #003D99 50%, #0F172A 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '40px 48px',
                }}
            >
                {/* Logo */}
                <div className="flex items-center gap-3">
                    {logos.dark || logos.light ? (
                        <img
                            src={logos.dark || logos.light || ''}
                            alt="DropCost Master"
                            className="h-10 object-contain"
                        />
                    ) : (
                        <>
                            <div
                                style={{
                                    width: '40px', height: '40px',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    borderRadius: '10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <BarChart3 size={24} color="#fff" />
                            </div>
                            <span style={{ color: '#fff', fontSize: '20px', fontWeight: 700 }}>
                                DropCost Master
                            </span>
                        </>
                    )}
                </div>

                {/* Texto principal */}
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        maxWidth: '480px',
                        marginLeft: '16px',
                    }}
                >
                    <h1
                        style={{
                            fontSize: 'clamp(32px, 4vw, 48px)',
                            fontWeight: 700,
                            color: '#fff',
                            lineHeight: 1.15,
                            marginBottom: '20px',
                        }}
                    >
                        Optimiza tus costos con precisión
                    </h1>
                    <p
                        style={{
                            fontSize: '17px',
                            color: 'rgba(191, 219, 254, 0.8)',
                            lineHeight: 1.7,
                            maxWidth: '420px',
                        }}
                    >
                        Descubre el potencial total de tus operaciones logísticas con seguimiento en tiempo real,
                        gestión automatizada de gastos e insights basados en datos.
                    </p>

                    {/* Feature cards */}
                    <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <FeatureCard
                            icon={<BarChart3 size={20} />}
                            title="Analítica en Tiempo Real"
                            description="Monitorea cada transacción al instante"
                        />
                        <FeatureCard
                            icon={<ShieldCheck size={20} />}
                            title="Datos Seguros"
                            description="Encriptación empresarial para todos tus registros"
                        />
                    </div>
                </div>

                {/* Footer */}
                <p style={{ fontSize: '13px', color: 'rgba(147, 197, 253, 0.4)' }}>
                    © {new Date().getFullYear()} DropCost Master. Impulsado por logística inteligente.
                </p>

                {/* Decoración de fondo */}
                <div
                    style={{
                        position: 'absolute', top: '-80px', right: '-80px',
                        width: '320px', height: '320px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '50%', filter: 'blur(60px)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute', bottom: '-120px', left: '-60px',
                        width: '380px', height: '380px',
                        background: 'rgba(96,165,250,0.08)',
                        borderRadius: '50%', filter: 'blur(60px)',
                    }}
                />
            </div>

            {/* ─── Panel Derecho: Formulario ─── */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '32px 40px',
                    backgroundColor: 'var(--bg-primary)',
                    overflowY: 'auto',
                    position: 'relative',
                }}
            >
                {/* Toggle tema */}
                <button
                    onClick={toggleTheme}
                    aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '24px',
                        padding: '10px',
                        borderRadius: '12px',
                        background: 'none',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 200ms ease',
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
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <div style={{ width: '100%', maxWidth: '420px' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px 18px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.1)',
            }}
        >
            <div
                style={{
                    width: '40px', height: '40px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', flexShrink: 0,
                }}
            >
                {icon}
            </div>
            <div>
                <p style={{ color: '#fff', fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{title}</p>
                <p style={{ color: 'rgba(191,219,254,0.6)', fontSize: '12px' }}>{description}</p>
            </div>
        </div>
    );
}
