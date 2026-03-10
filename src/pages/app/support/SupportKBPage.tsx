
import React, { useState, useEffect } from 'react';
import {
    Search, HelpCircle, Book, MessageSquare,
    ChevronRight, ExternalLink, LifeBuoy, Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const categories = [
    { id: 'simulador', name: 'Simulador Financiero', icon: <Book size={20} />, count: 12 },
    { id: 'ofertas', name: 'Creador de Ofertas', icon: <Sparkles size={20} />, count: 8 },
    { id: 'plataforma', name: 'Plataforma & Cuenta', icon: <Search size={20} />, count: 15 },
    { id: 'cobros', name: 'Pagos & Créditos', icon: <HelpCircle size={20} />, count: 6 },
];

export function SupportKBPage() {
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', color: 'var(--text-primary)' }}>
            {/* Header decorativo */}
            <div style={{
                textAlign: 'center', padding: '64px 20px',
                background: 'linear-gradient(180deg, rgba(0,102,255,0.05) 0%, transparent 100%)',
                borderRadius: '32px', marginBottom: '40px'
            }}>
                <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                    Centro de Ayuda & Base de Conocimiento
                </h1>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '18px', maxWidth: '600px', margin: '0 auto 32px' }}>
                    Todo lo que necesitas saber sobre DropCost Master, desde cálculos matemáticos hasta gestión de tiendas.
                </p>

                {/* Barra de búsqueda Premium */}
                <div style={{
                    maxWidth: '600px', margin: '0 auto', position: 'relative',
                    backgroundColor: 'var(--card-bg)', borderRadius: '16px',
                    border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                    display: 'flex', alignItems: 'center', padding: '0 20px'
                }}>
                    <Search color="var(--text-tertiary)" size={20} />
                    <input
                        type="text"
                        placeholder="Busca por función, cálculo o error..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: 1, padding: '18px 12px', background: 'none', border: 'none',
                            outline: 'none', color: 'var(--text-primary)', fontSize: '16px'
                        }}
                    />
                </div>
            </div>

            {/* Categorías */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '64px' }}>
                {categories.map((cat) => (
                    <div
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        style={{
                            padding: '24px', backgroundColor: 'var(--card-bg)',
                            borderRadius: '24px', border: '1px solid var(--border-color)',
                            cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            display: 'flex', flexDirection: 'column', gap: '16px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-6px)';
                            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)';
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                    >
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            backgroundColor: 'rgba(0,102,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-primary)'
                        }}>
                            {cat.icon}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{cat.name}</h3>
                            <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>{cat.count} artículos</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Artículos Populares */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Artículos Populares</h2>
                    <button style={{
                        background: 'none', border: 'none', color: 'var(--color-primary)',
                        fontWeight: 600, cursor: 'pointer', fontSize: '14px'
                    }}>
                        Ver todo
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                    {[
                        "Cómo funciona el motor de costeo avanzado",
                        "Integración de tiendas con Shopify y Dropi",
                        "Estrategias de escala para campañas Meta Ads",
                        "Gestión de Billetera y Retiros de Comisiones",
                        "Configuración de Seguridad y 2FA"
                    ].map((title, i) => (
                        <div
                            key={i}
                            style={{
                                padding: '16px 20px', backgroundColor: 'var(--card-bg)',
                                borderRadius: '16px', border: '1px solid var(--border-color)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card-bg)'; }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <MessageSquare size={18} color="var(--text-tertiary)" />
                                <span style={{ fontWeight: 500 }}>{title}</span>
                            </div>
                            <ChevronRight size={18} color="var(--text-tertiary)" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Call to action Footer */}
            <div style={{
                marginTop: '80px', padding: '40px',
                backgroundColor: 'var(--bg-tertiary)', borderRadius: '32px',
                textAlign: 'center', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '24px'
            }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '20px',
                    backgroundColor: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', boxShadow: '0 8px 24px rgba(0,102,255,0.3)'
                }}>
                    <LifeBuoy size={32} />
                </div>
                <div>
                    <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>¿Aún tienes dudas?</h3>
                    <p style={{ color: 'var(--text-tertiary)' }}>Nuestro Drop Assistant está disponible 24/7 para ayudarte en tiempo real.</p>
                </div>
                <button
                    style={{
                        padding: '12px 32px', backgroundColor: 'var(--color-primary)',
                        color: 'white', border: 'none', borderRadius: '12px',
                        fontWeight: 600, fontSize: '15px', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,102,255,0.2)'
                    }}
                >
                    Hablar con el Asistente
                </button>
            </div>
        </div>
    );
}
