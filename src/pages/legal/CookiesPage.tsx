/**
 * Página de Política de Cookies.
 * Ruta pública: /cookies
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie } from 'lucide-react';
import { useEffect } from 'react';

export default function CookiesPage() {
    const lastUpdate = '24 de febrero de 2026';

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = 'Política de Cookies - DropCost Master';
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
        }}>
            {/* Header */}
            <header style={{
                backgroundColor: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border-color)',
                padding: '16px 24px',
                position: 'sticky',
                top: 0,
                zIndex: 10,
            }}>
                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <Link
                        to="/"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--color-primary)',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: 600,
                        }}
                    >
                        <ArrowLeft size={18} />
                        Volver
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Cookie size={20} color="var(--color-primary)" />
                        <span style={{ fontSize: '16px', fontWeight: 700 }}>DropCost Master</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '48px 24px 64px',
            }}>
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    marginBottom: '8px',
                    lineHeight: 1.2,
                }}>
                    Política de Cookies
                </h1>
                <p style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    marginBottom: '48px',
                }}>
                    Última actualización: {lastUpdate}
                </p>

                <Section title="1. Introducción">
                    <p>
                        En <strong>DropCost Master</strong>, creemos en ser claros y abiertos sobre cómo recopilamos y utilizamos los datos relacionados con usted. En el espíritu de transparencia, esta política proporciona información detallada sobre cómo y cuándo utilizamos cookies en nuestro sitio web.
                    </p>
                    <p>
                        Esta Política de Cookies se aplica a cualquier producto o servicio de DropCost Master que se vincule a esta política o la incorpore por referencia.
                    </p>
                </Section>

                <Section title="2. Tipos de Cookies que utilizamos">
                    <p>
                        Utilizamos cookies y otras tecnologías para garantizar que todos los que usan DropCost Master tengan la mejor experiencia posible. Las categorizamos de la siguiente manera:
                    </p>
                    <ul style={{ marginTop: '12px' }}>
                        <li><strong>Esenciales:</strong> Son fundamentales para el funcionamiento técnico. Permiten la gestión de sesiones, seguridad (CSRF) y autenticación. Sin ellas, el servicio no puede funcionar correctamente.</li>
                        <li><strong>De Análisis (Analytics):</strong> Nos ayudan a entender cómo interactúan los usuarios con la plataforma (Google Analytics, Hotjar), permitiéndonos mejorar la interfaz y las funciones basándonos en datos reales.</li>
                        <li><strong>De Marketing y Conversión:</strong> Utilizadas para rastrear la eficacia de nuestras campañas (Pixel de Facebook) y asegurar que las promociones que ves sean relevantes para ti.</li>
                        <li><strong>De Preferencias:</strong> Recuerdan tus elecciones como el idioma seleccionado o tu preferencia de tema (Oscuro/Claro) para que no tengas que configurarlo en cada visita.</li>
                    </ul>
                </Section>

                <Section title="3. Inventario de Cookies y Almacenamiento Técnico">
                    <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '12px 8px', color: 'var(--text-primary)', fontWeight: 700 }}>Nombre / Clave</th>
                                    <th style={{ padding: '12px 8px', color: 'var(--text-primary)', fontWeight: 700 }}>Propósito</th>
                                    <th style={{ padding: '12px 8px', color: 'var(--text-primary)', fontWeight: 700 }}>Duración</th>
                                    <th style={{ padding: '12px 8px', color: 'var(--text-primary)', fontWeight: 700 }}>Tipo</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-primary)', fontWeight: 600 }}>sb-auth-token</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Sesión técnica de Supabase (Autenticación segura).</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Mantenida</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Propia (Supabase)</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-primary)', fontWeight: 600 }}>dropcost_cookie_consent</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Almacena tus preferencias de privacidad y consentimiento.</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>1 año</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Propia</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-primary)', fontWeight: 600 }}>dc_affiliate_id</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Rastreo de referidos para atribución de comisiones (Last Click).</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>90 días</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Propia</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-primary)', fontWeight: 600 }}>_ga / _gid</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Análisis estadístico de tráfico web anónimo.</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Hasta 2 años</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Terceros (Google)</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-primary)', fontWeight: 600 }}>2fa_verified_[id]</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Mantiene la validación del segundo factor de autenticación.</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>30 días</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Propia</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-primary)', fontWeight: 600 }}>_fbp</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Seguimiento de conversiones publicitarias.</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>90 días</td>
                                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Terceros (Meta)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Section>

                <Section title="4. Tus Derechos y Control">
                    <p>
                        Usted tiene el derecho de decidir si acepta o rechaza las cookies. Puede ejercer sus derechos de la siguiente manera:
                    </p>
                    <ul style={{ marginTop: '12px' }}>
                        <li><strong>Configuración Interna:</strong> Puede utilizar nuestro banner de cookies para revocar o cambiar sus preferencias en cualquier momento.</li>
                        <li><strong>Configuración del Navegador:</strong> La mayoría de los navegadores permiten controlar las cookies a través de sus ajustes. Puedes eliminarlas o bloquearlas directamente desde allí.</li>
                        <li><strong>Cumplimiento Legal:</strong> Operamos bajo estrictos estándares de cumplimiento con regulaciones como el GDPR (Europa) y protocolos de transparencia de datos.</li>
                    </ul>
                </Section>

                <Section title="5. Cambios en esta Política">
                    <p>
                        Es posible que actualicemos esta Política de Cookies de vez en cuando para reflejar, por ejemplo, cambios en las cookies que utilizamos o por otras razones operativas, legales o reglamentarias.
                    </p>
                </Section>

                <Section title="6. Contacto">
                    <p>
                        ¿Tienes dudas sobre tu privacidad o el uso de nuestras cookies? Nuestro equipo de cumplimiento legal está listo para ayudarte. Contáctenos a través de: <strong>legal@dropcost.jariash.com</strong>
                    </p>
                </Section>

                {/* Footer Links */}
                <div style={{
                    marginTop: '48px',
                    paddingTop: '24px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '14px',
                }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Link
                            to="/privacidad"
                            style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
                        >
                            ← Privacidad
                        </Link>
                        <Link
                            to="/terminos"
                            style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
                        >
                            Términos →
                        </Link>
                    </div>
                    <Link
                        to="/registro"
                        style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
                    >
                        Crear cuenta
                    </Link>
                </div>
            </main>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section style={{ marginBottom: '32px' }}>
            <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: '12px',
                color: 'var(--text-primary)',
            }}>
                {title}
            </h2>
            <div style={{
                fontSize: '15px',
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
            }}>
                {children}
            </div>
        </section>
    );
}
