import React, { useState, useEffect } from 'react';
import {
    BarChart3, Zap, ShieldCheck, Gift, ArrowRight,
    Loader2, Check, ChevronDown, ChevronUp, TrendingDown, TrendingUp, Star
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { PlanCard } from '@/components/plans/PlanCard';
import { plansService } from '@/services/plansService';
import { Plan } from '@/types/plans.types';
import { convertPrice, getDisplayCurrency, fetchExchangeRates } from '@/utils/currencyUtils';

/**
 * LandingPage: Página de inicio principal para usuarios no autenticados.
 * Optimizada para conversión con animaciones de scroll y diseño premium.
 * Se corrigió un error de visibilidad donde el contenido se mantenía invisible.
 */
export function LandingPage() {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const sliderRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [autoScrollActive, setAutoScrollActive] = useState(true);
    const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'semiannual'>('monthly');
    const [detectedCountry, setDetectedCountry] = useState<any>(null);
    const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);

    // Escuchar detección de país desde el Layout
    useEffect(() => {
        const handleCountryDetected = async (e: any) => {
            const pais = e.detail;
            setDetectedCountry(pais);

            // Cargar tasas si el país tiene moneda diferente a USD
            if (pais.moneda_codigo !== 'USD') {
                const rates = await fetchExchangeRates('USD');
                setExchangeRates(rates);
            }
        };

        window.addEventListener('countryDetected', handleCountryDetected);
        return () => window.removeEventListener('countryDetected', handleCountryDetected);
    }, []);

    // SEO useEffect
    useEffect(() => {
        document.title = 'DropCost Master - Maximiza tu Rentabilidad en Dropshipping COD';
        const meta = document.querySelector('meta[name="description"]');
        const content = 'Calcula tu margen real, optimiza tus fletes y escala tus ventas de dropshipping COD con precisión matemática. Deja de perder dinero por cada venta.';
        if (meta) {
            meta.setAttribute('content', content);
        } else {
            const newMeta = document.createElement('meta');
            newMeta.name = 'description';
            newMeta.content = content;
            document.head.appendChild(newMeta);
        }
    }, []);

    // Intersection Observer logic - Depende de loadingPlans para detectar elementos dinámicos
    useEffect(() => {
        // Pequeño delay para asegurar que el DOM se ha actualizado tras el renderizado de React
        const timer = setTimeout(() => {
            const revealElements = document.querySelectorAll('.reveal');

            // Si no hay IntersectionObserver, revelamos todo
            if (!('IntersectionObserver' in window)) {
                revealElements.forEach(el => el.classList.add('revealed'));
                return;
            }

            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                    }
                });
            }, observerOptions);

            revealElements.forEach(el => observer.observe(el));

            return () => {
                revealElements.forEach(el => observer.unobserve(el));
            };
        }, 100);

        return () => clearTimeout(timer);
    }, [loadingPlans]);

    // Carga de planes con fallback robusto
    useEffect(() => {
        const fetchPlans = async () => {
            setLoadingPlans(true);
            try {
                // Intentamos traer planes públicos y activos
                const data = await plansService.getPlans(true, true);
                if (data && data.length > 0) {
                    setPlans(data);
                    setLoadingPlans(false);
                    return;
                }
            } catch (error) {
                console.error("Error fetching plans from DB, using fallback:", error);
            }

            // Fallback estático sincronizado con el diseño (USD orientativo o COP ajustado)
            setPlans([
                {
                    id: 'fb-1',
                    slug: 'starter',
                    name: 'PLAN STARTER',
                    price_monthly: 10,
                    description: 'Ideal para probar DropCost y aprender cómo calcular tus costeos.',
                    features: ['Hasta 1 Tienda', '50 Costeos', 'Duplicar Ofertas', 'Duplicar Costeos', '⛔ 0 Ofertas'],
                    limits: { stores: 1 }
                } as any,
                {
                    id: 'fb-2',
                    slug: 'pro',
                    name: 'PLAN PRO',
                    price_monthly: 25,
                    description: 'Perfecto para dropshippers activos que manejan múltiples tiendas.',
                    features: ['Hasta 5 Tiendas', '250 Costeos', '250 Ofertas', 'Sistema de Referidos', 'Billetera y Retiros'],
                    limits: { stores: 5 }
                } as any,
                {
                    id: 'fb-3',
                    slug: 'enterprise',
                    name: 'PLAN ENTERPRISE',
                    price_monthly: 40,
                    description: 'La solución completa para equipos y empresas en crecimiento.',
                    features: ['Tiendas Ilimitadas', 'Costeos Ilimitados', 'Ofertas Ilimitadas', 'Soporte VIP'],
                    limits: { stores: 999 }
                } as any
            ]);
            setLoadingPlans(false);
        };

        fetchPlans();
    }, []);

    return (
        <div style={{ overflowX: 'hidden' }}>
            <style>{`
                .reveal {
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
                }
                .reveal.revealed {
                    opacity: 1;
                    transform: translateY(0);
                }
                .pulse-green {
                    position: relative;
                }
                .pulse-green::after {
                    content: '';
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background-color: #10B981;
                    border-radius: 50%;
                    top: -2px;
                    right: -2px;
                    animation: pulse-ring 2s infinite;
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); opacity: 0.8; }
                    50% { transform: scale(1.5); opacity: 0; }
                    100% { transform: scale(0.8); opacity: 0; }
                }
                @keyframes scroll-infinite {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(calc(-50% - 12px)); }
                }
                .testimonial-slider:hover {
                    animation-play-state: paused;
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @media (max-width: 768px) {
                    .hero-grid { grid-template-columns: 1fr !important; text-align: center; }
                    .hero-content { align-items: center !important; }
                }
                .feature-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    border: 1px solid var(--border-color) !important;
                }
                .feature-card:hover {
                    transform: translateY(-12px) !important;
                    border-color: var(--color-primary) !important;
                    box-shadow: 0 10px 40px rgba(0, 102, 255, 0.2), 0 0 20px rgba(0, 102, 255, 0.1) !important;
                    background-color: var(--bg-primary);
                }
                .feature-card:hover .icon-container {
                    background-color: rgba(0, 102, 255, 0.1) !important;
                    transform: scale(1.1);
                }
                .icon-container {
                    transition: all 0.3s ease;
                }
                .testimonial-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    border: 1px solid var(--border-color) !important;
                }
                .testimonial-card:hover {
                    transform: translateY(-12px) !important;
                    border-color: var(--color-primary) !important;
                    box-shadow: 0 10px 40px rgba(0, 102, 255, 0.2), 0 0 20px rgba(0, 102, 255, 0.1) !important;
                    background-color: var(--bg-primary);
                }
                .hero-btn-primary {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                .hero-btn-primary:hover {
                    transform: scale(1.05);
                    box-shadow: 0 12px 32px rgba(0, 102, 255, 0.45) !important;
                    filter: brightness(1.1);
                }
                .hero-btn-secondary {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                .hero-btn-secondary:hover {
                    transform: scale(1.05);
                    background-color: var(--bg-primary) !important;
                    border-color: var(--color-primary) !important;
                    color: var(--color-primary) !important;
                }
            `}</style>

            {/* HERO SECTION - Initial reveal for better UX */}
            <section style={{
                padding: '120px var(--main-padding) 80px',
                background: 'radial-gradient(circle at top right, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
                position: 'relative'
            }}>
                <div className="hero-grid" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '64px', alignItems: 'center' }}>
                    <div className="reveal revealed hero-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ marginBottom: '24px', padding: '8px 16px', borderRadius: '100px', backgroundColor: 'rgba(0, 102, 255, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(0, 102, 255, 0.2)', fontWeight: 700, fontSize: '14px' }}>
                            🎉 Únete a la nueva era del COD
                        </div>
                        <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.03em' }}>
                            Vende más, <br />
                            <span style={{ color: 'var(--color-primary)' }}>gana de verdad.</span>
                        </h1>
                        <p style={{ fontSize: '20px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '40px', maxWidth: '500px' }}>
                            La única herramienta diseñada por dropshippers para resolver la falta de rentabilidad del COD. Deja de adivinar y empieza a escalar.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                            <a href="#pricing" className="hero-btn-primary" style={{ padding: '16px 32px', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '12px', fontWeight: 700, textDecoration: 'none', fontSize: '18px', boxShadow: '0 8px 24px rgba(0, 102, 255, 0.3)' }}>Comenzar Ahora</a>
                            <a href="#comparison" className="hero-btn-secondary" style={{ padding: '16px 32px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: '12px', fontWeight: 700, textDecoration: 'none', fontSize: '18px', border: '1px solid var(--border-color)' }}>Ver Simulador</a>
                        </div>
                    </div>
                    {/* Hero Image / Mockup */}
                    <div className="reveal revealed" style={{ position: 'relative' }}>
                        <div style={{
                            position: 'absolute',
                            top: '-20px',
                            left: '-20px',
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'var(--color-primary)',
                            borderRadius: '24px',
                            opacity: 0.1,
                            zIndex: 0
                        }}></div>
                        <img
                            src="/hero_dashboard_mockup.png"
                            alt="DropCost Master Dashboard"
                            style={{
                                width: '100%',
                                borderRadius: '24px',
                                boxShadow: '0 32px 64px rgba(0,0,0,0.2)',
                                position: 'relative',
                                zIndex: 1,
                                border: '1px solid var(--border-color)'
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* SECCIÓN DE COMPARATIVA - SUSTITUYE INTEGRACIONES */}


            {/* COMPARISON CALCULATOR */}
            <ComparisonSection visible={showBreakdown} setVisible={setShowBreakdown} />

            {/* FEATURES GRID */}
            <section style={{ padding: '100px var(--main-padding)', backgroundColor: 'var(--bg-secondary)' }} id="features">
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="reveal" style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '24px' }}>Todo lo que necesitas para escalar</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                            Hemos automatizado lo que antes te tomaba horas en Excel. Control total en un solo panel.
                        </p>
                    </div>
                    <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                        <FeatureItem
                            icon={<BarChart3 size={32} />}
                            title="Simulador ROI"
                            description="Calcula el margen real considerando fletes, CPA y el impacto real de las devoluciones."
                        />
                        <FeatureItem
                            icon={<Zap size={32} />}
                            title="Estrategia de Ofertas"
                            description="Crea Bundles, Descuentos y Regalos con un clic, viendo cómo afectan tu utilidad neta."
                        />
                        <FeatureItem
                            icon={<ShieldCheck size={32} />}
                            title="Control de Devoluciones"
                            description="Proyecta el escenario pesimista y optimista de efectividad para no llevarte sorpresas."
                        />
                        <FeatureItem
                            icon={<Gift size={32} />}
                            title="Sistema de Referidos"
                            description="Gana comisiones recurrentes por cada usuario que refieras. Crea tu propia red de ingresos."
                        />
                        <FeatureItem
                            icon={<TrendingUp size={32} />}
                            title="Billetera Virtual"
                            description="Gestiona tus ganancias y solicita retiros de forma transparente y segura."
                        />
                        <FeatureItem
                            icon={<ArrowRight size={32} />}
                            title="Gestión Multi-Tienda"
                            description="Controla múltiples tiendas de dropshipping desde un solo panel centralizado."
                        />
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section style={{ padding: '100px var(--main-padding)', backgroundColor: 'var(--bg-primary)' }} id="testimonials">
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="reveal" style={{ textAlign: 'center', marginBottom: '64px' }}>
                        <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '16px' }}>Historias de Éxito Real</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>Expertos que pasaron de adivinar a ganar con números.</p>
                    </div>
                    <div style={{ position: 'relative' }}>
                        {/* Botones de navegación */}
                        <button
                            onClick={() => {
                                if (sliderRef.current) {
                                    sliderRef.current.scrollBy({ left: -400, behavior: 'smooth' });
                                    setAutoScrollActive(false);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                left: '-20px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 10,
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
                        </button>

                        <button
                            onClick={() => {
                                if (sliderRef.current) {
                                    sliderRef.current.scrollBy({ left: 400, behavior: 'smooth' });
                                    setAutoScrollActive(false);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                right: '-20px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 10,
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <ArrowRight size={20} />
                        </button>

                        <div
                            ref={sliderRef}
                            className="hide-scrollbar"
                            onMouseDown={(e) => {
                                setIsDragging(true);
                                setStartX(e.pageX - (sliderRef.current?.offsetLeft || 0));
                                setScrollLeft(sliderRef.current?.scrollLeft || 0);
                                setAutoScrollActive(false);
                            }}
                            onMouseLeave={() => setIsDragging(false)}
                            onMouseUp={() => setIsDragging(false)}
                            onMouseMove={(e) => {
                                if (!isDragging) return;
                                e.preventDefault();
                                const x = e.pageX - (sliderRef.current?.offsetLeft || 0);
                                const walk = (x - startX) * 2;
                                if (sliderRef.current) {
                                    sliderRef.current.scrollLeft = scrollLeft - walk;
                                }
                            }}
                            style={{
                                position: 'relative',
                                overflowX: 'auto',
                                padding: '20px 0',
                                cursor: isDragging ? 'grabbing' : 'grab'
                            }}
                        >
                            <div className={autoScrollActive ? "testimonial-slider" : ""} style={{
                                display: 'flex',
                                gap: '24px',
                                width: 'max-content',
                                animation: autoScrollActive ? 'scroll-infinite 80s linear infinite' : 'none'
                            }}>
                                {/* Duplicate set for infinite loop (Added more variety and ratings) */}
                                {[...Array(3)].map((_, setIdx) => (
                                    <React.Fragment key={setIdx}>
                                        <TestimonialCard
                                            name="Andrés Mendoza"
                                            location="Bogotá, Colombia"
                                            countryCode="co"
                                            content="Antes vendía 50 cremas diarias y pensaba que era rico. DropCost me mostró que perdía $3.000 por cada una. Ajusté mi oferta y ahora gano $12k netos por venta."
                                            image="https://i.pravatar.cc/150?u=andres_man"
                                            revenue="+450% Utilidad"
                                            rating={5}
                                        />
                                        <TestimonialCard
                                            name="Karla Ruiz"
                                            location="Ciudad de México, México"
                                            countryCode="mx"
                                            content="El sistema de Bundles es increíble. Logré subir mi ticket promedio de $60k a $110k en una semana sin aumentar mi gasto. Imprescindible para escalar."
                                            image="https://i.pravatar.cc/150?u=karla_woman"
                                            revenue="AOV x2"
                                            rating={4.5}
                                        />
                                        <TestimonialCard
                                            name="Mateo Silva"
                                            location="Quito, Ecuador"
                                            countryCode="ec"
                                            content="Lo que más valoro es la proyección de devoluciones. En el COD es el asesino silencioso de márgenes. Hoy escalo productos con seguridad total."
                                            image="https://i.pravatar.cc/150?u=mateo_man"
                                            revenue="Risk Control"
                                            rating={4}
                                        />
                                        <TestimonialCard
                                            name="Santiago Giraldo"
                                            location="Medellín, Colombia"
                                            countryCode="co"
                                            content="La claridad financiera que me da DropCost Master no tiene precio. Sé exactamente cuánto puedo invertir en Ads sin quemar mi capital."
                                            image="https://i.pravatar.cc/150?u=santiago"
                                            revenue="Scale Easy"
                                            rating={5}
                                        />
                                        <TestimonialCard
                                            name="Valeria Correa"
                                            location="Guayaquil, Ecuador"
                                            countryCode="ec"
                                            content="El simulador de ofertas me ayudó a entender que el Bundle 3x2 es el más rentable para mi nicho. Mis ganancias subieron un 40% este mes."
                                            image="https://i.pravatar.cc/150?u=valeria"
                                            revenue="+40% Ganancia"
                                            rating={4.5}
                                        />
                                        <TestimonialCard
                                            name="Diego Portilla"
                                            location="Guadalajara, México"
                                            countryCode="mx"
                                            content="Mis clientes de Dropshipping ahora tienen reportes reales. No solo ventas en Shopify, sino utilidad neta en el bolsillo."
                                            image="https://i.pravatar.cc/150?u=diego"
                                            revenue="ROI Focus"
                                            rating={5}
                                        />
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PRICING SECTION */}
            <LocalPricingSection
                plans={plans}
                loading={loadingPlans}
                billingCycle={billingCycle}
                setBillingCycle={setBillingCycle}
                detectedCountry={detectedCountry}
                exchangeRates={exchangeRates}
            />

            {/* FAQ SECTION */}
            <section style={{ padding: '100px var(--main-padding)', backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 className="reveal" style={{ fontSize: '36px', fontWeight: 800, textAlign: 'center', marginBottom: '48px' }}>Preguntas Frecuentes</h2>
                    <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <FAQItem
                            question="¿Qué es DropCost Master?"
                            answer="Es la herramienta definitiva para dropshippers en Latinoamérica. Te permite calcular la rentabilidad real de tu operación considerando costos de producto, fletes, publicidad y, lo más importante, el impacto de las devoluciones en tu flujo de caja."
                            isOpen={openFAQIndex === 0}
                            onToggle={() => setOpenFAQIndex(openFAQIndex === 0 ? null : 0)}
                        />
                        <FAQItem
                            question="¿Cómo funciona el simulador de costes?"
                            answer="Solo debes ingresar tus costos operativos básicos y el simulador calculará automáticamente tu punto de equilibrio, margen de contribución y utilidad neta. Es la forma más rápida de saber si un producto vale la pena escalar o no."
                            isOpen={openFAQIndex === 1}
                            onToggle={() => setOpenFAQIndex(openFAQIndex === 1 ? null : 1)}
                        />
                        <FAQItem
                            question="¿Qué son las 3 estrategias de ofertas?"
                            answer="Nuestra plataforma te permite crear ofertas irresistibles (Bundles) basadas en 3 estrategias probadas de e-commerce. El sistema calcula el margen exacto para cada combo, asegurando que tus promociones siempre sean rentables."
                            isOpen={openFAQIndex === 2}
                            onToggle={() => setOpenFAQIndex(openFAQIndex === 2 ? null : 2)}
                        />
                        <FAQItem
                            question="¿Cómo funciona el programa de referidos?"
                            answer="Contamos con un sistema robusto de 2 niveles: obtienes hasta un 15% de comisión mensual por tus referencias directas y un 5% adicional por las referencias indirectas (Nivel 2). Tus enlaces tienen 90 días de permanencia (cookies) y las comisiones duran hasta 6 meses por referido activo."
                            isOpen={openFAQIndex === 3}
                            onToggle={() => setOpenFAQIndex(openFAQIndex === 3 ? null : 3)}
                        />
                        <FAQItem
                            question="¿Qué puedo hacer en mi Billetera virtual?"
                            answer="Desde tu billetera puedes gestionar tus retiros y ver en tiempo real las ganancias acumuladas por tus comisiones de referidos en ambos niveles. Es un centro de control transparente para tu dinero extra."
                            isOpen={openFAQIndex === 4}
                            onToggle={() => setOpenFAQIndex(openFAQIndex === 4 ? null : 4)}
                        />
                        <FAQItem
                            question="¿Puedo gestionar varias tiendas a la vez?"
                            answer="Sí, DropCost Master es multitienda. Puedes crear y gestionar diferentes perfiles de tienda, cada uno con su propia configuración y moneda local según el país donde operes."
                            isOpen={openFAQIndex === 5}
                            onToggle={() => setOpenFAQIndex(openFAQIndex === 5 ? null : 5)}
                        />
                        <FAQItem
                            question="¿Qué monedas están disponibles?"
                            answer="Soportamos las principales monedas de Latinoamérica (COP, MXN, USD, etc.). El sistema adapta los formatos y cálculos a la moneda que selecciones para tu tienda."
                            isOpen={openFAQIndex === 6}
                            onToggle={() => setOpenFAQIndex(openFAQIndex === 6 ? null : 6)}
                        />
                        <FAQItem
                            question="¿Mi cuenta está segura?"
                            answer="Totalmente. Implementamos seguridad de autenticación en dos pasos (2FA) para proteger tu acceso y asegurar que solo tú puedas gestionar tus datos financieros y retiros."
                            isOpen={openFAQIndex === 7}
                            onToggle={() => setOpenFAQIndex(openFAQIndex === 7 ? null : 7)}
                        />
                        <FAQItem
                            question="¿Puedo ver mis movimientos anteriores?"
                            answer="Sí, contamos con un Historial de Actividades detallado donde puedes auditar cada cambio, simulación o acción relevante realizada en tu cuenta para un control total."
                            isOpen={openFAQIndex === 8}
                            onToggle={() => setOpenFAQIndex(openFAQIndex === 8 ? null : 8)}
                        />
                        <FAQItem
                            question="¿Existen contratos de permanencia en los planes?"
                            answer="No. No tenemos contratos forzosos. Puedes cancelar tu suscripción en cualquier momento desde tu panel de configuración sin complicaciones."
                            isOpen={openFAQIndex === 9}
                            onToggle={() => setOpenFAQIndex(openFAQIndex === 9 ? null : 9)}
                        />
                    </div>
                </div>
            </section>

        </div>
    );
}

// HELPER COMPONENTS

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <Card
            className="feature-card"
            style={{
                padding: '32px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                height: '100%'
            }}
        >
            <div className="icon-container" style={{ color: 'var(--color-primary)', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', alignSelf: 'flex-start' }}>
                {icon}
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</p>
        </Card>
    );
}

function TestimonialCard({ name, location, countryCode, content, image, revenue, rating = 5 }: {
    name: string;
    location: string;
    countryCode: string;
    content: string;
    image: string;
    revenue: string;
    rating?: number;
}) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
        <Card
            className="testimonial-card"
            style={{
                padding: '32px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                position: 'relative',
                minWidth: '350px',
                maxWidth: '450px',
                userSelect: 'none'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '4px', color: '#F59E0B' }}>
                    {[...Array(5)].map((_, i) => {
                        if (i < fullStars) {
                            return <Star key={i} size={18} fill="#F59E0B" stroke="#F59E0B" />;
                        } else if (i === fullStars && hasHalfStar) {
                            return (
                                <div key={i} style={{ position: 'relative', width: '18px', height: '18px' }}>
                                    <Star size={18} stroke="#F59E0B" fill="none" style={{ position: 'absolute' }} />
                                    <div style={{ width: '50%', overflow: 'hidden', position: 'absolute' }}>
                                        <Star size={18} fill="#F59E0B" stroke="#F59E0B" />
                                    </div>
                                </div>
                            );
                        } else {
                            return <Star key={i} size={18} stroke="#F59E0B" fill="none" />;
                        }
                    })}
                </div>
                <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10B981',
                    padding: '4px 10px',
                    borderRadius: '100px',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                    {revenue}
                </div>
            </div>
            <p style={{ fontSize: '17px', lineHeight: 1.7, color: 'var(--text-primary)', flex: 1, fontWeight: 500 }}>
                "{content}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <img src={image} alt={name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>{name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {location}
                        <img
                            src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`}
                            alt={location}
                            style={{ width: '16px', height: '11px', borderRadius: '2px', objectFit: 'cover' }}
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
}

function ComparisonItem({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
    return (
        <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: bold ? 800 : 600, color: color || 'var(--text-primary)' }}>{value}</span>
        </li>
    );
}

function FAQItem({ question, answer, isOpen, onToggle }: { question: string; answer: string, isOpen: boolean, onToggle: () => void }) {
    return (
        <Card style={{
            padding: '24px',
            cursor: 'pointer',
            border: isOpen ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            transition: 'all 0.3s ease',
            boxShadow: isOpen ? '0 4px 20px rgba(0, 102, 255, 0.08)' : 'none'
        }} onClick={onToggle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: isOpen ? 'var(--color-primary)' : 'var(--text-primary)' }}>{question}</h4>
                {isOpen ? <ChevronUp size={20} color="var(--color-primary)" /> : <ChevronDown size={20} />}
            </div>

            <div className={`faq-accordion-content ${isOpen ? 'open' : ''}`}>
                <div className="faq-accordion-inner">
                    <p style={{ marginTop: '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{answer}</p>
                </div>
            </div>
        </Card>
    );
}

function ComparisonSection({ visible, setVisible }: { visible: boolean; setVisible: (v: boolean) => void }) {
    return (
        <section style={{ padding: '100px var(--main-padding)', backgroundColor: 'var(--bg-primary)' }} id="comparison">
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div className="reveal" style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '24px' }}>Excel vs DropCost Master</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                        ¿Sabías que el 80% de los dropshippers COD pierden dinero sin saberlo? Mira la diferencia real.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                    <div className="reveal">
                        <Card style={{ padding: '32px', border: '2px solid #EF4444', height: '100%', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: '#EF4444' }}>
                                <TrendingDown size={32} />
                                <h3 style={{ fontSize: '24px', fontWeight: 800 }}>El "Ojímetro"</h3>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <ComparisonItem label="Precio de venta" value="$59.900" />
                                <ComparisonItem label="Costo Producto" value="$18.000" />
                                <ComparisonItem label="CPA Ads (Estimado)" value="$12.000" />
                                <ComparisonItem label="Flete promedio" value="$16.000" />
                                <div style={{ borderTop: '1px dashed var(--border-color)', margin: '8px 0' }}></div>
                                <ComparisonItem label="Utilidad APARENTE" value="+$13.900" color="#10B981" bold />
                                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px', marginTop: '16px' }}>
                                    <p style={{ fontSize: '14px', color: '#EF4444', fontWeight: 700 }}>¡Peligro! Ignoras el 30% de devoluciones.</p>
                                    <p style={{ fontSize: '18px', color: '#EF4444', fontWeight: 800, marginTop: '4px' }}>Resultado Real: -$3.180</p>
                                </div>
                            </ul>
                        </Card>
                    </div>

                    <div className="reveal">
                        <Card style={{ padding: '32px', border: '2px solid var(--color-primary)', height: '100%', backgroundColor: 'rgba(0, 102, 255, 0.02)', position: 'relative', overflow: 'visible' }}>
                            <div style={{
                                position: 'absolute',
                                top: '-15px',
                                right: '20px',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                padding: '6px 20px',
                                borderRadius: '30px',
                                fontSize: '13px',
                                fontWeight: 800,
                                boxShadow: '0 4px 12px rgba(0, 102, 255, 0.3)',
                                zIndex: 10
                            }}>RECOMENDADO</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--color-primary)' }}>
                                <TrendingUp size={32} />
                                <h3 style={{ fontSize: '24px', fontWeight: 800 }}>DropCost Master</h3>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <ComparisonItem label="Precio Sugerido" value="$90.396" bold color="var(--color-primary)" />
                                <ComparisonItem label="Costo Producto" value="$18.000" />
                                <ComparisonItem label="CPA Real trackeado" value="$12.000" />
                                <ComparisonItem label="Fletes + Devs (Real)" value="$24.800" />
                                <div style={{ borderTop: '1px dashed var(--border-color)', margin: '8px 0' }}></div>
                                <ComparisonItem label="Utilidad NETA (20%)" value="+$18.079" color="#10B981" bold />
                                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', marginTop: '16px' }}>
                                    <p style={{ fontSize: '14px', color: '#10B981', fontWeight: 700 }}>Incluye impacto de devoluciones real.</p>
                                    <p style={{ fontSize: '18px', color: '#10B981', fontWeight: 800, marginTop: '4px' }}>Rentabilidad Matemática</p>
                                </div>
                            </ul>
                        </Card>
                    </div>
                </div>

                <div className="reveal" style={{ marginTop: '48px', textAlign: 'center' }}>
                    <button
                        onClick={() => setVisible(!visible)}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {visible ? 'Ocultar Desglose ROI' : 'Ver Desglose ROI Anual'}
                        {visible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {visible && (
                        <div className="reveal revealed" style={{ marginTop: '24px', padding: '32px', textAlign: 'left', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px' }}>
                            <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>Proyección Financiera Anual (Ejemplo 50 ventas/día)</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                                <div style={{ padding: '24px', backgroundColor: 'var(--bg-primary)', borderRadius: '16px' }}>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Pérdida con Excel</p>
                                    <p style={{ fontSize: '28px', fontWeight: 900, color: '#EF4444', margin: '8px 0' }}>-$57.240.000 /año</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Dinero que dejas de percibir por un costeo incorrecto.</p>
                                </div>
                                <div style={{ padding: '24px', backgroundColor: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--color-primary)' }}>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Utilidad con DropCost</p>
                                    <p style={{ fontSize: '28px', fontWeight: 900, color: '#10B981', margin: '8px 0' }}>+$325.422.000 /año</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Resultado de escalar con un margen del 20% real.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function LocalPricingSection({
    plans,
    loading,
    billingCycle,
    setBillingCycle,
    detectedCountry,
    exchangeRates
}: {
    plans: Plan[],
    loading: boolean,
    billingCycle: 'monthly' | 'semiannual',
    setBillingCycle: (v: 'monthly' | 'semiannual') => void,
    detectedCountry: any,
    exchangeRates: Record<string, number> | null
}) {
    if (loading) {
        return (
            <div style={{ padding: '100px', textAlign: 'center' }}>
                <Loader2 className="spinner" size={48} color="var(--color-primary)" />
                <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Cargando planes...</p>
            </div>
        );
    }

    if (!plans || plans.length === 0) return null;

    return (
        <section id="pricing" style={{ padding: '100px var(--main-padding)', backgroundColor: 'var(--bg-secondary)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                <h2 className="reveal" style={{ fontSize: '48px', fontWeight: 900, marginBottom: '24px' }}>Planes que Escalan Contigo</h2>
                <p className="reveal" style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '40px', maxWidth: '600px', margin: '0 auto' }}>
                    Sin contratos forzosos. Cancela cuando quieras.
                </p>

                <div className="reveal pricing-toggle-container">
                    <button
                        className={`pricing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                        onClick={() => setBillingCycle('monthly')}
                    >
                        Pago Mensual
                    </button>
                    <button
                        className={`pricing-toggle-btn ${billingCycle === 'semiannual' ? 'active' : ''}`}
                        onClick={() => setBillingCycle('semiannual')}
                    >
                        Semestral <span className="save-badge">AHORRA 15%</span>
                    </button>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '24px',
                    flexWrap: 'wrap',
                    padding: '20px'
                }}>
                    {plans.map((plan) => {
                        // Calcular precio base con descuento si es semestral
                        let basePrice = plan.price_monthly;
                        if (billingCycle === 'semiannual' && plan.price_monthly > 0) {
                            basePrice = plan.price_monthly * 0.85;
                        }

                        // Lógica de conversión dinámica
                        let displayPrice = basePrice;
                        let displayCurrency = 'USD';
                        let displayLocale = 'en-US';

                        if (detectedCountry && exchangeRates) {
                            displayCurrency = getDisplayCurrency(detectedCountry.codigo_iso_2, detectedCountry.moneda_codigo);
                            displayPrice = convertPrice(basePrice, displayCurrency, exchangeRates);
                            displayLocale = detectedCountry.codigo_iso_2 === 'CO' ? 'es-CO' :
                                detectedCountry.codigo_iso_2 === 'MX' ? 'es-MX' :
                                    detectedCountry.codigo_iso_2 === 'ES' ? 'es-ES' :
                                        detectedCountry.codigo_iso_2 === 'CL' ? 'es-CL' :
                                            detectedCountry.codigo_iso_2 === 'PE' ? 'es-PE' : 'es-' + detectedCountry.codigo_iso_2;
                        } else if (!detectedCountry) {
                            // Si no se ha detectado país aún, mostramos COP por defecto (Colombia es el mercado principal)
                            displayCurrency = 'COP';
                            displayLocale = 'es-CO';
                            // Tasa aproximada manual si no hay rates aún para el primer render
                            displayPrice = basePrice * 4000;
                        }

                        return (
                            <div key={plan.id} style={{ display: 'flex', maxWidth: '350px', width: '100%' }}>
                                <PlanCard
                                    plan={plan}
                                    period={billingCycle}
                                    displayedPrice={new Intl.NumberFormat(displayLocale, {
                                        style: 'currency',
                                        currency: displayCurrency,
                                        maximumFractionDigits: 0
                                    }).format(displayPrice)}
                                    onSelect={() => window.location.href = '/registro'}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
