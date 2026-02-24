/**
 * Página de Política de Privacidad.
 * Ruta pública: /privacidad
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export function PrivacidadPage() {
    const lastUpdate = '23 de febrero de 2026';

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
                        to="/login"
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
                        <Shield size={20} color="var(--color-primary)" />
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
                    Política de Privacidad
                </h1>
                <p style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    marginBottom: '48px',
                }}>
                    Última actualización: {lastUpdate}
                </p>

                <Section title="1. Información que Recopilamos">
                    <p>Recopilamos la siguiente información cuando usted utiliza DropCost Master:</p>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '16px 0 8px' }}>
                        Información proporcionada por el usuario:
                    </h3>
                    <ul>
                        <li>Nombre y apellidos</li>
                        <li>Dirección de correo electrónico</li>
                        <li>Número de teléfono</li>
                        <li>País de residencia</li>
                        <li>Información de costeos, ofertas y configuraciones de negocio</li>
                    </ul>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '16px 0 8px' }}>
                        Información recopilada automáticamente:
                    </h3>
                    <ul>
                        <li>Dirección IP</li>
                        <li>Tipo de navegador y dispositivo</li>
                        <li>Páginas visitadas y tiempo de uso</li>
                        <li>Datos de rendimiento y errores técnicos</li>
                    </ul>
                </Section>

                <Section title="2. Uso de la Información">
                    <p>Utilizamos su información para:</p>
                    <ul>
                        <li>Proveer, mantener y mejorar nuestros servicios.</li>
                        <li>Procesar sus pagos y gestionar su suscripción.</li>
                        <li>Enviarle comunicaciones relacionadas con su cuenta (confirmaciones, alertas de seguridad, actualizaciones).</li>
                        <li>Gestionar el programa de referidos y calcular comisiones.</li>
                        <li>Analizar patrones de uso para mejorar la experiencia del usuario.</li>
                        <li>Prevenir fraudes y garantizar la seguridad de la Plataforma.</li>
                    </ul>
                </Section>

                <Section title="3. Almacenamiento y Seguridad">
                    <p>
                        Sus datos se almacenan en servidores seguros proporcionados por Supabase (infraestructura
                        en la nube con certificación SOC 2). Implementamos las siguientes medidas de seguridad:
                    </p>
                    <ul>
                        <li>Cifrado en tránsito (TLS/SSL) y en reposo (AES-256).</li>
                        <li>Contraseñas almacenadas con hash seguro (bcrypt).</li>
                        <li>Autenticación de dos factores (2FA) opcional.</li>
                        <li>Aislamiento de datos por tienda (Row Level Security).</li>
                        <li>Tokens de API encriptados para integraciones externas.</li>
                    </ul>
                </Section>

                <Section title="4. Compartir Información">
                    <p>No vendemos su información personal a terceros. Solo compartimos datos con:</p>
                    <ul>
                        <li><strong>Procesadores de pago</strong> (Mercado Pago): para procesar sus transacciones.</li>
                        <li><strong>Servicios de email</strong> (Resend): para enviar comunicaciones transaccionales.</li>
                        <li><strong>Proveedores de infraestructura</strong> (Supabase, Cloudflare): para alojar y proteger la Plataforma.</li>
                        <li><strong>Autoridades legales</strong>: cuando sea requerido por ley o proceso judicial.</li>
                    </ul>
                </Section>

                <Section title="5. Cookies y Tecnologías Similares">
                    <p>
                        Utilizamos almacenamiento local del navegador (localStorage) para mantener su sesión activa
                        y preferencias de interfaz (tema claro/oscuro). No utilizamos cookies de tracking de terceros
                        ni publicidad.
                    </p>
                </Section>

                <Section title="6. Retención de Datos">
                    <ul>
                        <li><strong>Cuenta activa:</strong> Sus datos se mantienen mientras su cuenta esté activa.</li>
                        <li><strong>Cuenta cancelada:</strong> Los datos se retienen por 30 días tras la cancelación para permitir reactivación.</li>
                        <li><strong>Datos financieros:</strong> Los registros de transacciones se mantienen por el período legal requerido (mínimo 5 años).</li>
                        <li><strong>Logs de auditoría:</strong> Se mantienen por 12 meses con fines de seguridad.</li>
                    </ul>
                </Section>

                <Section title="7. Sus Derechos">
                    <p>Usted tiene derecho a:</p>
                    <ul>
                        <li><strong>Acceder</strong> a sus datos personales almacenados.</li>
                        <li><strong>Rectificar</strong> información inexacta o desactualizada.</li>
                        <li><strong>Eliminar</strong> su cuenta y datos asociados.</li>
                        <li><strong>Exportar</strong> sus datos en un formato legible.</li>
                        <li><strong>Limitar</strong> el procesamiento de sus datos en ciertos casos.</li>
                        <li><strong>Retirar</strong> su consentimiento en cualquier momento.</li>
                    </ul>
                    <p>
                        Para ejercer estos derechos, contáctenos a través del correo de soporte
                        o desde la sección de Configuración de su cuenta.
                    </p>
                </Section>

                <Section title="8. Protección de Menores">
                    <p>
                        DropCost Master no está dirigido a menores de 18 años. No recopilamos
                        intencionalmente información de menores. Si detectamos una cuenta de un menor,
                        procederemos a eliminarla y sus datos asociados.
                    </p>
                </Section>

                <Section title="9. Transferencias Internacionales">
                    <p>
                        Sus datos pueden ser procesados en servidores ubicados fuera de su país de residencia.
                        En estos casos, nos aseguramos de que los proveedores cumplan con estándares de
                        protección de datos equivalentes o superiores a los de su jurisdicción.
                    </p>
                </Section>

                <Section title="10. Cambios en esta Política">
                    <p>
                        Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos
                        cualquier cambio significativo por correo electrónico. La versión actualizada
                        siempre estará disponible en esta página con la fecha de última modificación.
                    </p>
                </Section>

                <Section title="11. Contacto">
                    <p>
                        Para consultas sobre privacidad o para ejercer sus derechos sobre sus datos,
                        contáctenos a través del correo electrónico de soporte disponible en la Plataforma.
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
                    <Link
                        to="/terminos"
                        style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
                    >
                        ← Términos y Condiciones
                    </Link>
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
