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
                padding: 'clamp(12px, 4vw, 32px)',
                animation: 'fadeIn 300ms ease',
            }}
        >
            {/* Header with Skip button */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '24px'
            }}>
                <div style={{ flex: 1 }}>
                    <Sparkles size={32} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                        ¿Qué tipo de oferta te conviene?
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                        Conoce las 3 estrategias disponibles y elige la que mejor se adapte a tu producto
                    </p>
                </div>
                <button
                    onClick={onComplete}
                    style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--text-tertiary)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        marginTop: '4px'
                    }}
                >
                    Saltar
                </button>
            </div>

            {/* Slide card */}
            <div
                key={slide.type}
                style={{
                    padding: '24px',
                    borderRadius: '24px',
                    backgroundColor: 'var(--card-bg)',
                    border: slide.recommended
                        ? '2px solid var(--color-primary)'
                        : '1px solid var(--card-border)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    animation: 'slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Recommended Badge - Positioned Absolute Top-Right */}
                {slide.recommended && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            padding: '6px 14px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 900,
                            backgroundColor: 'var(--color-primary)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 4px 12px rgba(0, 102, 255, 0.3)',
                            zIndex: 1,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        <Sparkles size={12} fill="white" /> Recomendado
                    </div>
                )}

                {/* Centered Header Layout (Vertical Stack) */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    marginBottom: '32px',
                    paddingTop: '16px' // Espacio extra para el badge
                }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '20px',
                        backgroundColor: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '40px',
                        marginTop: '12px', // Baja el icono un poco más
                        marginBottom: '20px',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        {slide.icon}
                    </div>
                    <div style={{ maxWidth: '400px' }}>
                        <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.01em' }}>
                            {slide.title}
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', fontWeight: 500, lineHeight: 1.5 }}>
                            {slide.subtitle}
                        </p>
                    </div>
                </div>

                {/* What is it */}
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
                    {slide.whatIs}
                </p>

                {/* Advantages & Disadvantages */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                    <div style={{
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                        border: '1px solid rgba(16, 185, 129, 0.1)'
                    }}>
                        <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-success)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            ✅ Ventajas
                        </p>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: '12px'
                        }}>
                            {slide.advantages.map((a) => (
                                <p key={a} style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <span style={{ color: 'var(--color-success)', flexShrink: 0 }}>•</span>
                                    <span>{a}</span>
                                </p>
                            ))}
                        </div>
                    </div>
                    <div style={{
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.1)'
                    }}>
                        <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-error)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            ⚠️ Desventajas
                        </p>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: '12px'
                        }}>
                            {slide.disadvantages.map((d) => (
                                <p key={d} style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <span style={{ color: 'var(--color-error)', flexShrink: 0 }}>•</span>
                                    <span>{d}</span>
                                </p>
                            ))}
                        </div>
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

            {/* Navigation Refined */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                    marginTop: '32px',
                }}
            >
                {/* Dots in center */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            style={{
                                width: i === current ? '32px' : '10px',
                                height: '8px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: i === current ? 'var(--color-primary)' : 'var(--border-color)',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: i === current ? '0 2px 8px rgba(0, 102, 255, 0.2)' : 'none'
                            }}
                        />
                    ))}
                </div>

                {/* Actions Row */}
                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    {current > 0 ? (
                        <button
                            onClick={() => setCurrent(current - 1)}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '14px 20px',
                                fontSize: '14px',
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <ChevronLeft size={18} /> Anterior
                        </button>
                    ) : (
                        <div style={{ flex: 1 }} />
                    )}

                    {current < SLIDES.length - 1 ? (
                        <button
                            onClick={() => setCurrent(current + 1)}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '14px 20px',
                                fontSize: '14px',
                                fontWeight: 800,
                                color: '#fff',
                                backgroundColor: 'var(--color-primary)',
                                border: 'none',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 6px 16px rgba(0, 102, 255, 0.2)'
                            }}
                        >
                            Siguiente <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                onSelectStrategy?.(slide.type);
                                onComplete();
                            }}
                            style={{
                                flex: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '14px 24px',
                                fontSize: '15px',
                                fontWeight: 900,
                                color: '#fff',
                                background: 'linear-gradient(135deg, #0066FF 0%, #003D99 100%)',
                                border: 'none',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                boxShadow: '0 8px 20px rgba(0, 61, 153, 0.3)',
                                transition: 'all 0.2s'
                            }}
                        >
                            ¡Empezar ahora! <Sparkles size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
