import React, { useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Shield, Lock, Eye, AlertCircle } from 'lucide-react';

export default function CookiesPage() {
    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = 'Política de Cookies - DropCost Master';
    }, []);

    return (
        <div style={{
            padding: '120px var(--main-padding) 80px',
            backgroundColor: 'var(--bg-secondary)',
            minHeight: '100vh'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '12px',
                        backgroundColor: 'rgba(0, 102, 255, 0.1)',
                        color: 'var(--color-primary)',
                        borderRadius: '16px',
                        marginBottom: '24px'
                    }}>
                        <Shield size={32} />
                    </div>
                    <h1 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '16px', color: 'var(--text-primary)' }}>Política de Cookies</h1>
                    <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Transparencia total sobre cómo protegemos tu privacidad.</p>
                </div>

                <Card style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <section>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AlertCircle size={24} color="var(--color-primary)" />
                            1. ¿Qué son las Cookies?
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            Las cookies son pequeños archivos de texto que los sitios web almacenan en tu ordenador o dispositivo móvil cuando los visitas. Se utilizan ampliamente para que los sitios web funcionen, o funcionen de manera más eficiente, así como para proporcionar información a los propietarios del sitio.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Lock size={24} color="var(--color-primary)" />
                            2. ¿Cómo usamos las Cookies?
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                            En **DropCost Master**, utilizamos cookies por diversos motivos que se detallan a continuación:
                        </p>
                        <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '20px' }}>
                            <li><strong>Necesarias:</strong> Esenciales para el funcionamiento del sitio, como la gestión de sesiones y seguridad.</li>
                            <li><strong>De Análisis:</strong> Nos permiten medir el rendimiento del sitio y ver qué secciones son más populares para mejorar tu experiencia.</li>
                            <li><strong>De Marketing:</strong> Utilizadas para mostrarte anuncios relevantes y medir el impacto de nuestras campañas publicitarias en redes sociales.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Eye size={24} color="var(--color-primary)" />
                            3. Control de tus Preferencias
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            Puedes cambiar tus preferencias de cookies en cualquier momento a través de nuestro centro de configuración. Ten en cuenta que la desactivación de ciertas cookies puede afectar la funcionalidad de algunas partes del sitio.
                        </p>
                    </section>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '12px', color: 'var(--text-primary)' }}>Nombre</th>
                                <th style={{ padding: '12px', color: 'var(--text-primary)' }}>Propósito</th>
                                <th style={{ padding: '12px', color: 'var(--text-primary)' }}>Duración</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>`dropcost_session`</td>
                                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>Sesión de usuario</td>
                                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>30 días</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>`dropcost_cookie_consent`</td>
                                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>Preferencias de privacidad</td>
                                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>1 año</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>`_ga`</td>
                                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>Google Analytics</td>
                                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>2 años</td>
                            </tr>
                        </tbody>
                    </table>
                </Card>
            </div>
        </div>
    );
}
