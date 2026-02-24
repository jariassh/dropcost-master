/**
 * Página de Términos y Condiciones.
 * Ruta pública: /terminos
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export function TerminosPage() {
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
                        <FileText size={20} color="var(--color-primary)" />
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
                    Términos y Condiciones
                </h1>
                <p style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    marginBottom: '48px',
                }}>
                    Última actualización: {lastUpdate}
                </p>

                <Section title="1. Aceptación de los Términos">
                    <p>
                        Al acceder y utilizar DropCost Master (en adelante, "la Plataforma"), usted acepta estar sujeto
                        a estos Términos y Condiciones de uso. Si no está de acuerdo con alguna parte de estos términos,
                        no debe utilizar la Plataforma.
                    </p>
                </Section>

                <Section title="2. Descripción del Servicio">
                    <p>
                        DropCost Master es una calculadora de costeo y gestión para negocios de Dropshipping.
                        La Plataforma ofrece herramientas de simulación de costos, gestión de ofertas,
                        análisis de márgenes, sistema de referidos y otras funcionalidades según el plan contratado.
                    </p>
                </Section>

                <Section title="3. Registro y Cuenta de Usuario">
                    <p>Para utilizar la Plataforma, usted debe:</p>
                    <ul>
                        <li>Ser mayor de 18 años o tener la capacidad legal para contratar.</li>
                        <li>Proporcionar información veraz, completa y actualizada durante el registro.</li>
                        <li>Mantener la confidencialidad de su contraseña y credenciales de acceso.</li>
                        <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta.</li>
                    </ul>
                    <p>
                        Usted es responsable de todas las actividades que ocurran bajo su cuenta.
                    </p>
                </Section>

                <Section title="4. Planes y Pagos">
                    <p>
                        La Plataforma ofrece diferentes planes de suscripción con distintos niveles de funcionalidad.
                        Los precios están sujetos a cambios con previo aviso. Los pagos se procesan a través de
                        Mercado Pago u otros procesadores de pago autorizados.
                    </p>
                    <ul>
                        <li>Las suscripciones se renuevan automáticamente al final de cada período.</li>
                        <li>Puede cancelar su suscripción en cualquier momento desde su configuración.</li>
                        <li>No se realizan reembolsos por períodos parciales ya consumidos.</li>
                        <li>El acceso a funcionalidades premium se activa inmediatamente tras confirmar el pago.</li>
                    </ul>
                </Section>

                <Section title="5. Programa de Referidos">
                    <p>
                        La Plataforma ofrece un programa de referidos que permite a los usuarios ganar comisiones
                        por referir nuevos usuarios que adquieran un plan de pago. Las condiciones del programa son:
                    </p>
                    <ul>
                        <li>Las comisiones se calculan como un porcentaje del pago del referido.</li>
                        <li>Las comisiones se acreditan en la billetera virtual del referente.</li>
                        <li>Los retiros están sujetos a un monto mínimo y verificación de identidad.</li>
                        <li>DropCost Master se reserva el derecho de modificar los porcentajes y condiciones del programa.</li>
                        <li>El abuso del sistema de referidos (cuentas ficticias, auto-referidos, etc.) resultará en la cancelación de comisiones y posible suspensión de la cuenta.</li>
                    </ul>
                </Section>

                <Section title="6. Uso Aceptable">
                    <p>Usted se compromete a no:</p>
                    <ul>
                        <li>Utilizar la Plataforma para actividades ilegales o no autorizadas.</li>
                        <li>Intentar acceder a cuentas, datos o funcionalidades de otros usuarios.</li>
                        <li>Realizar ingeniería inversa, descompilar o desensamblar cualquier parte de la Plataforma.</li>
                        <li>Utilizar bots, scripts automatizados u otros medios para acceder al servicio.</li>
                        <li>Compartir o redistribuir su acceso con terceros sin autorización.</li>
                    </ul>
                </Section>

                <Section title="7. Propiedad Intelectual">
                    <p>
                        Todo el contenido de la Plataforma, incluyendo pero no limitado a diseños, código fuente,
                        textos, gráficos, logos e interfaces, es propiedad de DropCost Master o sus licenciantes
                        y está protegido por leyes de propiedad intelectual.
                    </p>
                    <p>
                        Los datos e información que usted ingrese (costeos, ofertas, configuraciones) son de su propiedad.
                        DropCost Master no reclamará derechos sobre estos datos.
                    </p>
                </Section>

                <Section title="8. Limitación de Responsabilidad">
                    <p>
                        DropCost Master proporciona las herramientas de cálculo y simulación "tal cual".
                        No garantizamos la exactitud de los cálculos en contextos específicos de negocio.
                        Los resultados son orientativos y la decisión final de precios corresponde al usuario.
                    </p>
                    <p>
                        En la máxima medida permitida por la ley, DropCost Master no será responsable de
                        daños directos, indirectos, incidentales o consecuenciales derivados del uso de la Plataforma.
                    </p>
                </Section>

                <Section title="9. Disponibilidad del Servicio">
                    <p>
                        Nos esforzamos por mantener la Plataforma disponible de forma continua, pero no garantizamos
                        disponibilidad ininterrumpida. Podemos realizar mantenimientos programados con previo aviso.
                        No seremos responsables por interrupciones causadas por factores fuera de nuestro control.
                    </p>
                </Section>

                <Section title="10. Modificaciones">
                    <p>
                        Nos reservamos el derecho de modificar estos Términos en cualquier momento, notificando
                        a los usuarios registrados por correo electrónico. El uso continuado de la Plataforma
                        tras la modificación constituye aceptación de los nuevos términos.
                    </p>
                </Section>

                <Section title="11. Terminación">
                    <p>
                        Podemos suspender o cancelar su acceso a la Plataforma si incumple estos Términos.
                        Usted puede cancelar su cuenta en cualquier momento desde su configuración.
                        Tras la cancelación, sus datos se mantendrán por 30 días antes de ser eliminados.
                    </p>
                </Section>

                <Section title="12. Ley Aplicable">
                    <p>
                        Estos Términos se rigen por las leyes de la República de Colombia.
                        Cualquier disputa será resuelta preferiblemente mediante mediación.
                        De no llegar a acuerdo, se someterá a los tribunales competentes de la ciudad de Medellín.
                    </p>
                </Section>

                <Section title="13. Contacto">
                    <p>
                        Si tiene preguntas sobre estos Términos, contáctenos a través del correo
                        electrónico de soporte disponible en la Plataforma.
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
                        to="/privacidad"
                        style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
                    >
                        Política de Privacidad →
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
