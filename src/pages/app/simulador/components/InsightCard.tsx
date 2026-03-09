import { ArrowRight, Lightbulb, Sparkles, X } from 'lucide-react';

interface InsightCardProps {
    onConsult: () => void;
    onClose: () => void;
    netProfit: number;
    suggestedPrice: number;
}

export function InsightCard({ onConsult, onClose, netProfit, suggestedPrice }: InsightCardProps) {
    const marginPct = (netProfit / (suggestedPrice || 1)) * 100;

    const getInsight = () => {
        if (netProfit <= 0) return "Cuidado financiero detectado. Tu configuración actual genera pérdidas por cada venta. Consulta al analista para ver dónde recortar.";
        if (marginPct < 15) return "Tu margen de contribución es saldable, pero ajustado. Considera aumentar el precio un 5% o buscar un proveedor más económico.";
        if (marginPct >= 15 && marginPct < 30) return "¡Números saludables! Tienes espacio para escalar moderadamente en pauta. ¿Quieres ver proyecciones de inversión?";
        return "¡Producto estrella! Tienes un margen excepcional. Recomendamos escalamiento agresivo y creación de ofertas de 'Lleva 3' para maximizar facturación.";
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: '100px', // Adjusted to not overlap the app header
                right: '28px',
                width: '380px',
                padding: '20px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(15, 23, 42, 0.9) 100%)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                display: 'flex',
                gap: '16px',
                zIndex: 100,
                animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
        >
            {/* Close Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = '#EF4444';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#94A3B8';
                }}
            >
                <X size={14} />
            </button>

            <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#6366F1', flexShrink: 0,
                marginTop: '4px'
            }}>
                <Lightbulb size={20} />
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>DROP ANALYST INSIGHT</span>
                    <Sparkles size={8} color="#6366F1" />
                </div>
                <p style={{ fontSize: '11.5px', color: '#E2E8F0', lineHeight: '1.5', margin: 0, fontWeight: 500, paddingRight: '20px' }}>
                    "{getInsight()}"
                </p>
                <button
                    onClick={onConsult}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '12px',
                        color: '#6366F1',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                    }}
                >
                    Consultar DROP ANALYST <ArrowRight size={12} />
                </button>
            </div>

            <style>
                {`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                `}
            </style>
        </div>
    );
}
