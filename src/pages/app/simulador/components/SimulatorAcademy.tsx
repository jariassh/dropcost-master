import { useState } from 'react';
import { X, BookOpen, Target, BarChart3, TrendingUp, ShieldCheck, ChevronRight, Info } from 'lucide-react';

interface AcademyTab {
    id: string;
    label: string;
    icon: any;
    title: string;
    description: string;
    points: { title: string; text: string }[];
}

const ACADEMY_TABS: AcademyTab[] = [
    {
        id: 'philosophy',
        label: 'Metodología',
        icon: ShieldCheck,
        title: 'Filosofía del Costeo Real',
        description: 'En el dropshipping COD (Pago Contra Entrega), el mayor error es no amortizar las pérdidas logísticas. Nuestra metodología protege tu bolsillo.',
        points: [
            { title: 'Amortización de Devoluciones', text: 'No solo pierdes el flete de ida. El flete de retorno suele costar el 50% adicional. Lo cargamos preventivamente a cada venta exitosa.' },
            { title: 'El Factor CPA Real', text: 'Si tienes un 20% de devoluciones, significa que por cada 100 pedidos entregas 80. Tu CPA real no es lo que pagas por pedido, sino lo que pagas por entrega efectiva.' },
            { title: 'Gasto Invisible', text: 'Cargamos costos operativos (empaque, personal, seguros) proporcionalmente a la efectividad de tu tienda.' }
        ]
    },
    {
        id: 'pricing',
        label: 'Precio Sugerido',
        icon: Target,
        title: '¿Cómo calculamos el Precio?',
        description: 'El precio sugerido no es al azar. Es el punto matemático exacto donde recuperas toda tu inversión y obtienes el margen que deseas.',
        points: [
            { title: 'El Denominador Crítico', text: 'Usamos una fórmula que descuenta primero las comisiones de recaudo y tu margen deseado del total del ingreso, blindando tu utilidad.' },
            { title: 'Margen de Seguridad', text: 'El sistema calcula el precio considerando que cada unidad vendida debe "pagar" su porción de la publicidad gastada en los pedidos que se cancelarán.' },
            { title: 'Ajuste Manual', text: 'Si bajas el precio por debajo del sugerido, ves en tiempo real cómo tu margen neto se reduce para absorber esa diferencia.' }
        ]
    },
    {
        id: 'matrix',
        label: 'Escalamiento',
        icon: TrendingUp,
        title: 'Matriz de Escalamiento Pauta',
        description: 'La diferencia entre un negocio que crece y uno que quiebra es saber cuánto puedes pagar por una venta (CPA Máximo).',
        points: [
            { title: 'CPA de Salida', text: 'Es el valor base que Meta Ads te cobra. Nuestra matriz te dice hasta dónde puedes subir ese valor sin entrar en pérdidas.' },
            { title: 'Escenario Moderado (40%)', text: 'Es el estándar ideal. Inviertes el 40% de tu margen bruto en anuncios y te quedas con el 60% para ti.' },
            { title: 'Presupuesto vs Volumen', text: 'Al mover el volumen de pedidos, recalculamos la inversión diaria recomendada. A más volumen, tu presupuesto debe subir proporcionalmente para mantener el CPA.' }
        ]
    },
    {
        id: 'simulation',
        label: 'Operación Diaria',
        icon: BarChart3,
        title: 'Simulación de Flujo de Caja',
        description: 'Vender no es lo mismo que cobrar. El simulador diario te muestra la realidad transaccional de tu operación.',
        points: [
            { title: 'Fuga de Dinero', text: 'Visualizamos cuántos pedidos se quedan en el camino (cancelaciones) y cuántos regresan a bodega (devoluciones).' },
            { title: 'Profit vs Revenue', text: 'Diferenciamos claramente entre el dinero que "viste pasar" (ingresos totales) y el dinero que realmente llegó a tu banco (profit neto).' },
            { title: 'Efecto Embudo', text: 'El gráfico de efectividad te muestra gráficamente dónde estás perdiendo eficiencia operativa.' }
        ]
    }
];

interface SimulatorAcademyProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SimulatorAcademy({ isOpen, onClose }: SimulatorAcademyProps) {
    const [activeTab, setActiveTab] = useState(ACADEMY_TABS[0].id);

    if (!isOpen) return null;

    const currentTab = ACADEMY_TABS.find(t => t.id === activeTab) || ACADEMY_TABS[0];

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                width: '90%', maxWidth: '1000px', height: '80vh', backgroundColor: 'var(--bg-primary)',
                borderRadius: '24px', border: '1px solid var(--border-color)', display: 'flex', overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>

                {/* 🧭 SIDEBAR TABS */}
                <div style={{
                    width: '280px', borderRight: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)',
                    display: 'flex', flexDirection: 'column', padding: '32px 16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <BookOpen size={20} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-headings)' }}>Metodología</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {ACADEMY_TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
                                    border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                                    backgroundColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                                    color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)'
                                }}
                            >
                                <tab.icon size={18} style={{ opacity: activeTab === tab.id ? 1 : 0.7 }} />
                                <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-body)' }}>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div style={{ marginTop: 'auto', padding: '20px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', marginBottom: '8px' }}>
                            <Info size={14} />
                            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pro Tip</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4', fontFamily: 'var(--font-body)' }}>
                            Usa el simulador para testear tus límites. Si el profit proyectado es &lt; 15%, el producto es de alto riesgo.
                        </p>
                    </div>
                </div>

                {/* 📄 CONTENT AREA */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto' }}>

                    <button onClick={onClose} style={{
                        position: 'absolute', top: '24px', right: '24px', width: '40px', height: '40px', borderRadius: '50%',
                        backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s',
                        zIndex: 10
                    }}>
                        <X size={20} />
                    </button>

                    <div style={{ padding: '64px 48px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-primary)', marginBottom: '16px' }}>
                            <currentTab.icon size={24} />
                            <span style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Módulo de Aprendizaje</span>
                        </div>

                        <h2 style={{ fontSize: '32px', fontWeight: 850, color: 'var(--text-primary)', marginBottom: '16px', fontFamily: 'var(--font-headings)' }}>{currentTab.title}</h2>
                        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '40px', maxWidth: '600px', fontFamily: 'var(--font-body)' }}>
                            {currentTab.description}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {currentTab.points.map((point, i) => (
                                <div key={i} style={{
                                    padding: '24px', borderRadius: '20px', backgroundColor: 'var(--card-bg)',
                                    border: '1px solid var(--border-color)', display: 'flex', gap: '20px'
                                }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(0, 102, 255, 0.1)',
                                        color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '12px', fontWeight: 900, flexShrink: 0
                                    }}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', fontFamily: 'var(--font-headings)' }}>{point.title}</h4>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0, fontFamily: 'var(--font-body)' }}>{point.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    const nextIdx = (ACADEMY_TABS.findIndex(t => t.id === activeTab) + 1) % ACADEMY_TABS.length;
                                    setActiveTab(ACADEMY_TABS[nextIdx].id);
                                }}
                                style={{
                                    padding: '12px 24px', borderRadius: '12px', backgroundColor: 'var(--color-primary)',
                                    color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 16px rgba(0, 102, 255, 0.2)'
                                }}
                            >
                                Siguiente Lección <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
