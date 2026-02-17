/**
 * OfertasEducation - Carousel educativo de 3 slides.
 * Tipos de oferta: Descuento, Bundle (recomendado), Obsequio.
 */
import { useState } from 'react';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface OfertasEducationProps {
    onComplete: () => void;
    onSelectStrategy?: (type: 'descuento' | 'bundle' | 'obsequio') => void;
}

interface Slide {
    type: 'descuento' | 'bundle' | 'obsequio';
    icon: string;
    title: string;
    subtitle: string;
    recommended?: boolean;
    whatIs: string;
    advantages: string[];
    disadvantages: string[];
    example: string;
    useCases: string[];
}

const SLIDES: Slide[] = [
    {
        type: 'descuento',
        icon: '💰',
        title: 'Descuento en Precio',
        subtitle: 'Reduce el precio de venta para atraer compradores',
        whatIs: 'Reduces el precio final para el cliente aplicando un porcentaje de descuento sobre el precio original.',
        advantages: ['Simple de implementar', 'Efecto inmediato en conversión', 'Fácil de comunicar'],
        disadvantages: ['Reduce tu margen directamente', 'Puede devaluar tu marca', 'No incentiva mayor volumen'],
        example: 'Producto a $49.900 → con 20% dto → $39.920. Tu ganancia baja de $12.000 a $2.000.',
        useCases: ['Liquidar stock', 'Competir en precio', 'Lanzamiento con tracción rápida'],
    },
    {
        type: 'bundle',
        icon: '📦',
        title: 'Bundle con Margen Variable',
        subtitle: 'Vende más unidades manteniendo tu ganancia',
        recommended: true,
        whatIs: 'El cliente compra múltiples unidades a un precio unitario menor. Tú mantienes ganancia porque el costo adicional es solo el del proveedor.',
        advantages: ['Mantienes o aumentas ganancia total', 'Aumentas ticket promedio', 'El cliente siente mayor ahorro'],
        disadvantages: ['Requiere stock', 'No aplica a todos los nichos'],
        example: '1 unidad: $49.900 (ganancia $12.000) → 2 unidades: $79.800 (ganancia $18.000). ¡50% más de ganancia!',
        useCases: ['Productos consumibles', 'Cosméticos', 'Productos familiares', 'Suplementos'],
    },
    {
        type: 'obsequio',
        icon: '🎁',
        title: 'Obsequio o Complemento',
        subtitle: 'Agrega valor sin bajar el precio',
        whatIs: 'Incluyes un regalo o complemento de bajo costo que aumenta el valor percibido del paquete sin modificar el precio.',
        advantages: ['No reduces precio', 'Aumenta valor percibido', 'Diferenciación competitiva'],
        disadvantages: ['Requiere gestión de inventario adicional', 'Costo del regalo sale de tu margen'],
        example: 'Crema ($49.900, margen $12.000) + muestra gratis ($2.000 costo) → Mismo precio, ganancia $10.000, cliente feliz.',
        useCases: ['Muestras de producto', 'Accesorios complementarios', 'Cupones para siguiente compra'],
    },
];

export function OfertasEducation({ onComplete, onSelectStrategy }: OfertasEducationProps) {
    const [current, setCurrent] = useState(0);
    const slide = SLIDES[current];

    return (
        <div
            style={{
                maxWidth: '720px',
                margin: '0 auto',
                padding: '32px',
                animation: 'fadeIn 300ms ease',
            }}
        >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <Sparkles size={32} style={{ color: 'var(--color-primary)', margin: '0 auto 12px' }} />
                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
                    ¿Qué tipo de oferta te conviene?
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Conoce las 3 estrategias disponibles y elige la que mejor se adapte a tu producto
                </p>
            </div>

            {/* Slide card */}
            <div
                key={slide.type}
                style={{
                    padding: '28px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--card-bg)',
                    border: slide.recommended
                        ? '2px solid var(--color-primary)'
                        : '1px solid var(--card-border)',
                    boxShadow: 'var(--shadow-md)',
                    animation: 'slideUp 250ms ease-out',
                }}
            >
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '36px' }}>{slide.icon}</span>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 700 }}>{slide.title}</h3>
                            {slide.recommended && (
                                <span
                                    style={{
                                        padding: '2px 10px',
                                        borderRadius: '9999px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        backgroundColor: 'var(--color-primary)',
                                        color: '#fff',
                                    }}
                                >
                                    ⭐ Recomendado
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{slide.subtitle}</p>
                    </div>
                </div>

                {/* What is it */}
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
                    {slide.whatIs}
                </p>

                {/* Advantages & Disadvantages */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-success)', marginBottom: '8px', textTransform: 'uppercase' }}>
                            ✅ Ventajas
                        </p>
                        {slide.advantages.map((a) => (
                            <p key={a} style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                • {a}
                            </p>
                        ))}
                    </div>
                    <div>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-error)', marginBottom: '8px', textTransform: 'uppercase' }}>
                            ⚠️ Desventajas
                        </p>
                        {slide.disadvantages.map((d) => (
                            <p key={d} style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                • {d}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Example */}
                <div
                    style={{
                        padding: '14px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-secondary)',
                        marginBottom: '16px',
                    }}
                >
                    <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>📊 Ejemplo</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{slide.example}</p>
                </div>

                {/* Use cases */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {slide.useCases.map((uc) => (
                        <span
                            key={uc}
                            style={{
                                padding: '4px 12px',
                                borderRadius: '9999px',
                                fontSize: '12px',
                                fontWeight: 500,
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            {uc}
                        </span>
                    ))}
                </div>
            </div>

            {/* Navigation */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '24px',
                }}
            >
                {/* Skip */}
                <button
                    onClick={onComplete}
                    style={{
                        fontSize: '13px',
                        color: 'var(--text-tertiary)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                    }}
                >
                    Saltar tutorial
                </button>

                {/* Dots */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            style={{
                                width: i === current ? '20px' : '8px',
                                height: '8px',
                                borderRadius: '9999px',
                                border: 'none',
                                backgroundColor: i === current ? 'var(--color-primary)' : 'var(--border-color)',
                                cursor: 'pointer',
                                transition: 'all 200ms ease',
                            }}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {current > 0 && (
                        <button
                            onClick={() => setCurrent(current - 1)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '10px 16px',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                            }}
                        >
                            <ChevronLeft size={14} /> Anterior
                        </button>
                    )}
                    {current < SLIDES.length - 1 ? (
                        <button
                            onClick={() => setCurrent(current + 1)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '10px 16px',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#fff',
                                backgroundColor: 'var(--color-primary)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                            }}
                        >
                            Siguiente <ChevronRight size={14} />
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                onSelectStrategy?.(slide.type);
                                onComplete();
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '10px 20px',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#fff',
                                background: 'linear-gradient(135deg, #0066FF 0%, #003D99 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                            }}
                        >
                            ¡Empezar! <Sparkles size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
