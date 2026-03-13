
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    MessageCircle, Send, X, Bot, Sparkles, Minus,
    Settings, Shield, ChevronLeft, User, HelpCircle,
    BrainCircuit, AlertCircle, ChevronDown, Check,
    Zap, Brain, Crown, CreditCard, Trash2, ShieldCheck, MessageSquare, Info, Filter, ArrowRight, Maximize2, Copy, ExternalLink
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { RechargeModal } from './RechargeModal';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { SmartPhoneInput } from '@/components/common/SmartPhoneInput';
import { affiliateService } from '@/services/affiliateService';
// Páginas donde Drop Analyst (Mentoría) está disponible
// Solo en contextos de análisis de negocio y números
const ANALYST_PAGES = [
    '/dashboard',       // Dashboard KPIs y métricas
    '/mis-costeos',     // Tabla de costeos + Simulador individual (/mis-costeos/:id)
    '/ofertas',         // Creador de ofertas
    '/configuracion/tiendas'  // Gestión de tienda (métricas por tienda)
];

const PAGE_SUGGESTIONS: Record<string, { soporte: string[], mentoria?: string[] }> = {
    '/dashboard': {
        soporte: ["¿Cómo descargo mis reportes?", "¿Qué significa este gráfico?"],
        mentoria: ["¿Cómo interpreto mi ROAS Real?", "¿Por qué bajó mi utilidad hoy?"]
    },
    '/mis-costeos': {
        soporte: ["¿Cómo edito un costeo?", "¿Cómo elimino un registro?"],
        mentoria: ["¿Es viable este producto?", "Dame una estrategia de CPA", "¿Cómo mejoro mi margen?"]
    },
    '/ofertas': {
        soporte: ["¿Cómo activo una oferta?", "¿Cómo veo el historial?"],
        mentoria: ["¿Qué bundle me recomiendas crear?", "¿Cómo aumento mi Ticket Promedio?"]
    },
    '/billetera': {
        soporte: ["¿Cómo retiro mis comisiones?", "¿Cómo recargo DropCredits?"],
    },
    '/configuracion': {
        soporte: ["¿Cómo activo el 2FA?", "¿Cómo gestiono mis tiendas?"],
    },
    'landing': {
        soporte: ["¿Qué planes tienen?", "¿Cómo conecto mi tienda?", "¿Qué es DropCost Master?"],
    },
};

/* --- Tipos --- */
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatWidgetProps {
    initialRole?: 'soporte' | 'mentoría';
}

export function ChatWidget({ initialRole = 'soporte' }: ChatWidgetProps) {
    const { user, isAuthenticated } = useAuthStore();
    const { isDark } = useTheme();
    const location = useLocation();

    // Determinar si la página actual permite Mentoría
    const showMentorTab = useMemo(() => {
        return ANALYST_PAGES.some(p => location.pathname.startsWith(p));
    }, [location.pathname]);

    /* --- Estados --- */
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [view, setView] = useState<'chat' | 'contact' | 'settings'>(
        isAuthenticated ? 'chat' : 'contact'
    );
    const [selectedRole, setSelectedRole] = useState<'soporte' | 'mentoría'>(initialRole);
    const [aceptaTerminos, setAceptaTerminos] = useState(false);
    const [contact, setContact] = useState({ nombre: '', email: '', telefono: '', pais: '' });

    const userName = useMemo(() => {
        if (user?.nombres) return user.nombres.split(' ')[0];
        if (contact.nombre) return contact.nombre.split(' ')[0];
        return '';
    }, [user, contact.nombre]);

    // Determinar sugerencias actuales basadas en página Y rol seleccionado
    const suggestions = useMemo(() => {
        if (location.pathname === '/soporte') return [];

        // Encontrar la clave de sugerencias actual
        let currentKey = location.pathname === '/' || location.pathname === ''
            ? 'landing'
            : Object.keys(PAGE_SUGGESTIONS).find(k => location.pathname.startsWith(k));

        if (!currentKey) return [];

        const pageData = PAGE_SUGGESTIONS[currentKey];

        // Si el rol es mentoría y hay sugerencias específicas de mentoría, usarlas
        if (selectedRole === 'mentoría' && pageData.mentoria) {
            return pageData.mentoria;
        }

        // Por defecto (o si no hay versión de mentoría), usar soporte
        return pageData.soporte || [];
    }, [location.pathname, selectedRole]);

    // Si el usuario navega a una página sin mentoría, forzar soporte
    useEffect(() => {
        if (!showMentorTab && selectedRole === 'mentoría') {
            setSelectedRole('soporte');
        }
    }, [showMentorTab, selectedRole]);

    // Listener para eventos globales de apertura (desde Wiki u otros componentes)
    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            setIsMinimized(false);
        };
        window.addEventListener('open-drop-assistant', handleOpen);
        return () => window.removeEventListener('open-drop-assistant', handleOpen);
    }, []);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Encantado de saludarte, soy Max del equipo de DropCost y estaré encantado de ayudarte el día de hoy.',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
    const [optIn, setOptIn] = useState(true);
    const [isContactFilled, setIsContactFilled] = useState(false);

    // Configuración de Mentoría (Estilo Gemini)
    const [researchDepth, setResearchDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
    const [isLevelMenuOpen, setIsLevelMenuOpen] = useState(false);
    const [credits, setCredits] = useState<number>(0);
    const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
    const [contactError, setContactError] = useState<string | null>(null);
    const [isValidatingEmail, setIsValidatingEmail] = useState(false);
    const [isDisposableEmail, setIsDisposableEmail] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);

    // Dominios de correo basura o prohibidos (Capa local rápida)
    const BANNED_DOMAINS = [
        'mail.com', 'test.com', 'example.com', 'tempmail.com', 'junk.com', 'demo.com', 
        'asdf.com', 'qwerty.com', 'bigonla.com', '1secmail.com', 'guerrillamail.com',
        'sharklasers.com', 'getnada.com', 'dispostable.com', 'yopmail.com'
    ];
    const MAJOR_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com', 'me.com', 'msn.com'];

    // Helper para detectar teclado "limpiado" o patrones basura
    const isKeyboardMash = (str: string) => {
        // Patrones de secuencias y repeticiones
        const patterns = [/asdf/i, /sdsd/i, /qwerty/i, /1234/i, /zxcv/i, /(.)\1{3,}/];
        if (patterns.some(p => p.test(str))) return true;
        
        // Detectar demasiados números mezclados (típico de temp-mail como semfo9291)
        const numbers = str.replace(/[^0-9]/g, '').length;
        if (numbers > 4 && str.length < 15) return true;
        
        return false;
    };

    // Validar si el contacto es válido para habilitar el chat
    const isContactValid = useMemo(() => {
        const nombreTrim = contact.nombre.trim();
        // Exigir al menos 2 palabras (Nombre y Apellido) y que no sea keyboard mash
        if (!nombreTrim || nombreTrim.split(/\s+/).length < 2) return false;
        if (isKeyboardMash(nombreTrim)) return false;
        
        // Validar Email
        const email = contact.email.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return false;
        if (isKeyboardMash(email.split('@')[0])) return false;
        
        const domain = email.split('@')[1];
        if (BANNED_DOMAINS.includes(domain) || isDisposableEmail) return false;
        if (isValidatingEmail || !emailTouched) return false;

        // Validar Teléfono (parte numérica)
        const numericPhone = contact.telefono.replace(/\D/g, '');
        // El prefijo suele ser 2-3 dígitos, el número mínimo 7-8. Total mínimo 9-10.
        if (numericPhone.length < 9) return false;

        if (!aceptaTerminos) return false;

        return true;
    }, [contact, aceptaTerminos]);

    const CREDIT_COSTS = {
        quick: 1,
        standard: 4,
        deep: 9
    };

    const levelInfo = {
        quick: { label: 'Rápido', sub: 'Respuesta veloz', icon: <Zap size={14} />, cost: 1 },
        standard: { label: 'Pensar', sub: 'Análisis detallado', icon: <Brain size={14} />, cost: 4 },
        deep: { label: 'Pro', sub: 'Investigación profunda (3.1 Pro)', icon: <Crown size={14} />, cost: 9 }
    };

    const scrollRef = useRef<HTMLDivElement>(null);

    const validateEmailDomain = async (email: string) => {
        if (!email || !email.includes('@')) return;
        
        const domain = email.split('@')[1];
        
        // Check de dominio sospechoso manual (si es corto y no es de los grandes)
        if (domain.length < 5 && !MAJOR_DOMAINS.includes(domain)) {
            setContactError('Ingresa un correo con un dominio válido.');
            setIsDisposableEmail(true);
            return;
        }

        if (BANNED_DOMAINS.includes(domain) || isKeyboardMash(domain)) {
            setContactError('El dominio de este correo no parece real.');
            setIsDisposableEmail(true);
            return;
        }

        setIsValidatingEmail(true);
        setEmailTouched(true);
        try {
            const response = await fetch(`https://disify.com/api/domain/${domain}`);
            const data = await response.json();
            
            if (data.disposable) {
                setContactError('Los correos temporales o desechables no están permitidos.');
                setIsDisposableEmail(true);
            } else {
                setContactError(null);
                setIsDisposableEmail(false);
            }
        } catch (error) {
            console.warn("Error validando dominio:", error);
            // Si la API falla, permitimos por defecto para no bloquear al usuario
        } finally {
            setIsValidatingEmail(false);
        }
    };

    /* --- Efectos --- */
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    useEffect(() => {
        if (user) {
            setOptIn(user.ai_learning_opt_in ?? true);
            refreshCredits();
            setView('chat');
        } else {
            setView('contact');
        }
    }, [user]);

    // Personalizar saludo inicial cuando el nombre esté disponible
    useEffect(() => {
        if (userName && messages.length === 1 && messages[0].id === '1') {
            setMessages([
                {
                    id: '1',
                    role: 'assistant',
                    content: `Encantado de saludarte ${userName}, soy Max del equipo de DropCost y estaré encantado de ayudarte el día de hoy.`,
                    timestamp: new Date()
                }
            ]);
        }
    }, [userName]);

    // Leer créditos IA desde tabla dedicada (user_credits)
    const refreshCredits = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('user_credits')
            .select('credits')
            .eq('usuario_id', user.id)
            .maybeSingle();
        setCredits(data?.credits ?? 0);
    };

    /* --- Manejadores --- */
    const handleToggleOptIn = async () => {
        if (!user) return;
        const newVal = !optIn;
        const now = new Date().toISOString();

        setOptIn(newVal);

        try {
            // 1. Actualizar perfil básico
            await supabase.from('users').update({ ai_learning_opt_in: newVal }).eq('id', user.id);

            // 2. Upsert en tabla de preferencias detallada
            await (supabase as any).from('user_sharing_preferences').upsert({
                usuario_id: user.id,
                compartir_anonimo: newVal,
                fecha_opt_in: newVal ? now : null,
                updated_at: now
            }, { onConflict: 'usuario_id' });

        } catch (error) {
            console.error("Error al actualizar preferencias de IA:", error);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
        if (e) e.preventDefault();
        const textToSend = overrideText || inputValue;
        if (!textToSend.trim() || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: textToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        // Simulamos un retraso humano de 5-8 segundos solicitado por el usuario
        const delay = Math.floor(Math.random() * 3000) + 5000;

        try {
            // Llamada a la Edge Function
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drop-assistant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { 'Authorization': `Bearer ${session?.access_token}` } : {})
                },
                body: JSON.stringify({
                    message: userMsg.content,
                    roleSelected: selectedRole,
                    depth: selectedRole === 'mentoría' ? researchDepth : 'standard',
                    threadId: currentThreadId,
                    contactData: !isAuthenticated ? { ...contact, acepta_terminos: aceptaTerminos } : null,
                    isAnonymous: !isAuthenticated,
                    context: {
                        page: window.location.pathname,
                        is_demo: !isAuthenticated,
                        app_url: window.location.origin,
                        referral_code: affiliateService.getAffiliateId() || 'jariash'
                    }
                })
            });

            const data = await response.json();

            if (response.status === 402) {
                setIsTyping(false);
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: '⚠️ No tienes créditos suficientes para esta consulta en modo ' + levelInfo[researchDepth].label + '. Por favor, recarga tu billetera.',
                    timestamp: new Date()
                }]);
                return;
            }

            // Procesamos la respuesta (posibles múltiples mensajes ráfaga con separadores [SPLIT] o /)
            const fullReply = data.reply || data.error || 'Lo siento, tuve un problema procesando tu consulta.';
            
            // Soportamos ambos: el técnico [SPLIT] y el sugerido '/' para separar respuestas de preguntas
            // Usamos un regex que requiere espacios alrededor del slash para evitar romper URLs (http://)
            const messageParts = fullReply
                .split(/\[SPLIT\]|\s+\/\s+/)
                .map((s: string) => s.trim())
                .filter((s: string) => s !== '');

            // Función recursiva para enviar mensajes secuencialmente con delay
            const sendSequentially = (index: number) => {
                if (index >= messageParts.length) {
                    setIsTyping(false);
                    if (data.threadId) setCurrentThreadId(data.threadId);
                    if (selectedRole === 'mentoría') refreshCredits();
                    return;
                }

                // Determinamos el delay para este mensaje
                // El primero tiene el delay inicial largo, los siguientes son más cortos (ráfaga humana)
                const currentDelay = index === 0 ? delay : Math.floor(Math.random() * 1500) + 1500;

                setTimeout(() => {
                    const assistantMsg: Message = {
                        id: (Date.now() + index).toString(),
                        role: 'assistant',
                        content: messageParts[index],
                        timestamp: new Date()
                    };
                    
                    setMessages(prev => [...prev, assistantMsg]);
                    
                    // Si quedan más mensajes, activamos el typing de nuevo antes del siguiente
                    if (index + 1 < messageParts.length) {
                        setIsTyping(true);
                        sendSequentially(index + 1);
                    } else {
                        setIsTyping(false);
                        if (data.threadId) setCurrentThreadId(data.threadId);
                        if (selectedRole === 'mentoría') refreshCredits();
                    }
                }, currentDelay);
            };

            sendSequentially(0);

        } catch (error) {
            setIsTyping(false);
            console.error("Chat Error:", error);
        }
    };

    const renderMessageContent = (content: string) => {
        // Regex para detectar botones: [BOTON: Texto | URL]
        const buttonRegex = /\[BOTON:\s*([^|]+)\|\s*([^\]]+)\]/g;

        if (!content.includes('[BOTON:')) return content;

        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = buttonRegex.exec(content)) !== null) {
            // Texto previo al botón
            if (match.index > lastIndex) {
                parts.push(content.substring(lastIndex, match.index));
            }

            const buttonText = match[1].trim();
            const buttonUrl = match[2].trim();

            parts.push(
                <div key={match.index} style={{ margin: '12px 0' }}>
                    <a
                        href={buttonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            backgroundColor: '#6366F1',
                            color: 'white',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            fontWeight: 700,
                            fontSize: '14px',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                        }}
                    >
                        <ExternalLink size={16} />
                        {buttonText}
                    </a>
                </div>
            );
            lastIndex = buttonRegex.lastIndex;
        }

        // Texto restante
        if (lastIndex < content.length) {
            parts.push(content.substring(lastIndex));
        }

        return parts;
    };

    const animations = `
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes dotTyping {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        @keyframes assistantFadeIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(99, 102, 241, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
    `;

    if (!isOpen) {
        return (
            <>
                <style>{animations}</style>
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        position: 'fixed', bottom: '24px', right: '24px',
                        width: '64px', height: '64px', borderRadius: '16px',
                        backgroundColor: '#6366F1', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)', border: 'none',
                        cursor: 'pointer', zIndex: 1000, animation: 'pulse 2s infinite'
                    }}
                >
                    <Sparkles size={32} />
                </button>
            </>
        );
    }

    return (
        <div style={{
            position: 'fixed', bottom: '24px', right: '24px',
            width: isMinimized ? '260px' : '400px',
            height: isMinimized ? '56px' : '700px',
            maxWidth: 'calc(100vw - 48px)',
            maxHeight: 'calc(100vh - 48px)',
            backgroundColor: 'var(--card-bg)',
            borderRadius: '24px',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 12px 64px rgba(0,0,0,0.2)',
            zIndex: 1001, overflow: 'hidden',
            border: '1px solid var(--card-border)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            animation: 'slideUp 0.5s ease-out'
        }}>
            <style>{animations}</style>

            {/* Header */}
            <div
                onClick={() => isMinimized && setIsMinimized(false)}
                style={{
                    padding: isMinimized ? '10px 20px' : '16px 20px',
                    background: 'linear-gradient(90deg, #6366F1, #4F46E5)',
                    color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0,
                    cursor: isMinimized ? 'pointer' : 'default'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Sparkles size={22} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                            {selectedRole === 'mentoría' ? 'Max (Mentor)' : 'Max'}
                        </h4>
                        {!isMinimized && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
                                <span style={{ fontSize: '11px', opacity: 0.8 }}>Agente Premium</span>
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isAuthenticated && !isMinimized && (
                        <button
                            onClick={() => setView(v => v === 'settings' ? 'chat' : 'settings')}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '4px' }}
                        >
                            <Settings size={18} />
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMinimized(!isMinimized);
                        }}
                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
                        title={isMinimized ? "Expandir" : "Minimizar"}
                    >
                        {isMinimized ? <Copy size={16} /> : <Minus size={18} />}
                    </button>
                    {!isMinimized && (
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Role Selector Header — Solo si hay mentoría disponible */}
                    {isAuthenticated && view === 'chat' && showMentorTab && (
                        <div style={{
                            padding: '12px 16px',
                            backgroundColor: 'var(--bg-secondary)',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex', gap: '8px'
                        }}>
                            <button
                                onClick={() => setSelectedRole('soporte')}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                                    border: '1px solid ' + (selectedRole === 'soporte' ? '#6366F1' : 'var(--border-color)'),
                                    backgroundColor: selectedRole === 'soporte' ? 'rgba(99, 102, 241, 0.1)' : 'var(--card-bg)',
                                    color: selectedRole === 'soporte' ? '#6366F1' : 'var(--text-secondary)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s'
                                }}
                            >
                                <Sparkles size={14} /> Soporte
                            </button>
                            <button
                                onClick={() => setSelectedRole('mentoría')}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                                    border: '1px solid ' + (selectedRole === 'mentoría' ? '#6366F1' : 'var(--border-color)'),
                                    backgroundColor: selectedRole === 'mentoría' ? 'rgba(99, 102, 241, 0.1)' : 'var(--card-bg)',
                                    color: selectedRole === 'mentoría' ? '#6366F1' : 'var(--text-secondary)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s'
                                }}
                            >
                                <Sparkles size={14} /> Mentoría
                            </button>
                        </div>
                    )}

                    {/* Level Selector (Gemini Style) */}
                    {isAuthenticated && view === 'chat' && selectedRole === 'mentoría' && (
                        <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setIsLevelMenuOpen(!isLevelMenuOpen)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px',
                                            borderRadius: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                                            cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600
                                        }}
                                    >
                                        {levelInfo[researchDepth].label} <ChevronDown size={14} />
                                    </button>

                                    {isLevelMenuOpen && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, marginTop: '8px', width: '240px',
                                            backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, padding: '8px', overflow: 'hidden'
                                        }}>
                                            <p style={{ margin: '8px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Max - Inteligencia Artificial</p>
                                            {(['quick', 'standard', 'deep'] as const).map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => { setResearchDepth(level); setIsLevelMenuOpen(false); }}
                                                    style={{
                                                        width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        backgroundColor: researchDepth === level ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                                        border: 'none', cursor: 'pointer', borderRadius: '10px', textAlign: 'left', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ color: researchDepth === level ? '#6366F1' : 'var(--text-tertiary)' }}>
                                                            {levelInfo[level].icon}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{levelInfo[level].label}</div>
                                                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{levelInfo[level].sub}</div>
                                                        </div>
                                                    </div>
                                                    {researchDepth === level && <Check size={16} color="#6366F1" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                    <CreditCard size={12} color="#6366F1" />
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#6366F1' }}>{credits} CR</span>
                                    <div style={{ width: '1px', height: '12px', backgroundColor: 'rgba(99, 102, 241, 0.2)' }} />
                                    <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-tertiary)' }}>-{levelInfo[researchDepth].cost}</span>
                                    <button
                                        onClick={() => setIsRechargeModalOpen(true)}
                                        style={{
                                            marginLeft: '4px', fontSize: '10px', fontWeight: 700, color: '#6366F1',
                                            textDecoration: 'none', borderBottom: '1px solid #6366F1', cursor: 'pointer',
                                            background: 'none', border: 'none', borderBottomWidth: '1px', padding: 0
                                        }}
                                    >
                                        Recargar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chat Messages */}
                    {view === 'chat' && (
                        <div
                            ref={scrollRef}
                            style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-primary)' }}
                        >
                            {messages.length > 1 ? (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        style={{
                                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '85%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                            animation: 'assistantFadeIn 0.3s ease-out'
                                        }}
                                    >
                                        <div style={{
                                            padding: '12px 16px',
                                            borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                                            backgroundColor: msg.role === 'user' ? '#6366F1' : 'var(--card-bg)',
                                            color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                            border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                                            fontSize: '14px',
                                            lineHeight: '1.5',
                                            boxShadow: msg.role === 'assistant' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {renderMessageContent(msg.content)}
                                        </div>
                                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    padding: '20px',
                                    gap: '16px',
                                    animation: 'assistantFadeIn 0.5s ease-out'
                                }}>
                                    <div style={{
                                        width: '64px', height: '64px', borderRadius: '20px',
                                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#6366F1', marginBottom: '4px'
                                    }}>
                                        {selectedRole === 'mentoría' ? <Brain size={32} /> : <Sparkles size={32} />}
                                    </div>
                                    <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                        {selectedRole === 'mentoría' ? '¿Qué analizamos hoy?' : `¿En qué puedo ayudarte${userName ? `, ${userName}` : ''}?`}
                                    </h2>
                                    <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', maxWidth: '300px', margin: 0, lineHeight: '1.4' }}>
                                        {selectedRole === 'mentoría'
                                            ? 'Soy Max, tu mentor experto. Analizaré la viabilidad de tu producto y optimizaré tu rentabilidad.'
                                            : 'Soy Max, del equipo de DropCost. Resuelvo tus dudas sobre la plataforma y logística en segundos.'}
                                    </p>

                                    {suggestions.length > 0 && (
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px',
                                            width: '100%',
                                            marginTop: '8px'
                                        }}>
                                            {suggestions.map((s, si) => (
                                                <button
                                                    key={si}
                                                    onClick={() => handleSendMessage(undefined, s)}
                                                    style={{
                                                        padding: '14px 20px',
                                                        borderRadius: '16px',
                                                        backgroundColor: 'var(--bg-secondary)',
                                                        border: '1px solid var(--border-color)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '14px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        textAlign: 'center',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
                                                        e.currentTarget.style.borderColor = '#6366F1';
                                                        e.currentTarget.style.color = '#6366F1';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                                        e.currentTarget.style.color = 'var(--text-primary)';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {isTyping && (
                                <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '6px', padding: '12px 20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '18px 18px 18px 2px' }}>
                                    {[0, 1, 2].map((i) => (
                                        <div key={i} style={{ width: '6px', height: '6px', backgroundColor: 'var(--text-tertiary)', borderRadius: '50%', animation: `dotTyping 1s infinite ${i * 0.2}s` }} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Contact View */}
                    {view === 'contact' && (
                        <div style={{ flex: 1, padding: '32px 24px', overflowY: 'auto', textAlign: 'center' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '20px', backgroundColor: 'rgba(0,102,255,0.1)',
                                color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <User size={32} />
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 800 }}>Dinos quién eres</h3>
                            <p style={{ margin: '0 0 24px 0', color: 'var(--text-tertiary)', fontSize: '14px' }}>Completa tus datos para que nuestro equipo pueda contactarte si es necesario.</p>

                            <form
                                onSubmit={(e) => { e.preventDefault(); setIsContactFilled(true); setView('chat'); }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                            >
                                <input
                                    type="text" placeholder="Nombre completo (Nombre y Apellido)" required
                                    value={contact.nombre} 
                                    onChange={(e) => {
                                        setContact({ ...contact, nombre: e.target.value });
                                        setContactError(null);
                                    }}
                                    onBlur={() => {
                                        const trimmed = contact.nombre.trim();
                                        if (trimmed && trimmed.split(/\s+/).length < 2) {
                                            setContactError('Por favor ingresa tu nombre y apellido real.');
                                        } else if (isKeyboardMash(trimmed)) {
                                            setContactError('Parece que el nombre no es real. Por favor corrígelo.');
                                        } else if (trimmed.length < 4) {
                                            setContactError('Nombre demasiado corto.');
                                        }
                                    }}
                                    style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid ' + (contactError?.includes('nombre') ? '#ef4444' : 'var(--border-color)'), backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
                                />
                                <input
                                    type="email" 
                                    placeholder="Correo electrónico (ej: juan@gmail.com)" 
                                    required
                                    value={contact.email} 
                                    onChange={(e) => {
                                        setContact({ ...contact, email: e.target.value.toLowerCase().replace(/\s/g, '') });
                                        setContactError(null);
                                        setIsDisposableEmail(false);
                                        setEmailTouched(false);
                                    }}
                                    onBlur={() => validateEmailDomain(contact.email)}
                                    style={{ 
                                        padding: '12px 16px', 
                                        borderRadius: '12px', 
                                        border: '1.5px solid ' + (isDisposableEmail ? '#ef4444' : 'var(--border-color)'), 
                                        backgroundColor: 'var(--bg-primary)', 
                                        color: 'var(--text-primary)', 
                                        outline: 'none', 
                                        transition: 'border-color 0.2s' 
                                    }}
                                />
                                <div style={{ textAlign: 'left' }}>
                                    <SmartPhoneInput
                                        value={contact.telefono}
                                        onChange={(fullValue, iso) => {
                                            setContact({ ...contact, telefono: fullValue, pais: iso });
                                            setContactError(null);
                                        }}
                                    />
                                    <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px', marginLeft: '4px' }}>
                                        Ingresa un número de WhatsApp válido para contacto directo.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', textAlign: 'left', marginTop: '4px' }}>
                                    <input
                                        type="checkbox"
                                        required
                                        id="terminos-chat"
                                        checked={aceptaTerminos}
                                        onChange={(e) => setAceptaTerminos(e.target.checked)}
                                        style={{ marginTop: '4px', cursor: 'pointer', accentColor: '#6366F1' }}
                                    />
                                    <label htmlFor="terminos-chat" style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', cursor: 'pointer' }}>
                                        Acepto los <a href="/terminos" target="_blank" style={{ color: '#6366F1', textDecoration: 'none' }}>Términos y Condiciones</a> y la <a href="/privacidad" target="_blank" style={{ color: '#6366F1', textDecoration: 'none' }}>Política de Privacidad</a> para la protección de mis datos.
                                    </label>
                                </div>
                                {contactError && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', color: '#ef4444', fontSize: '12px', textAlign: 'left' }}>
                                        <AlertCircle size={14} /> {contactError}
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={!isContactValid || isValidatingEmail}
                                    style={{ 
                                        marginTop: '12px', 
                                        padding: '14px', 
                                        borderRadius: '12px', 
                                        backgroundColor: (isContactValid && !isValidatingEmail) ? '#6366F1' : 'var(--border-color)', 
                                        color: (isContactValid && !isValidatingEmail) ? 'white' : 'var(--text-tertiary)', 
                                        border: 'none', 
                                        fontWeight: 700, 
                                        cursor: (isContactValid && !isValidatingEmail) ? 'pointer' : 'not-allowed', 
                                        boxShadow: (isContactValid && !isValidatingEmail) ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none',
                                        transition: 'all 0.3s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {isValidatingEmail ? (
                                        <>
                                            <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'assistantFadeIn 0.8s linear infinite' }} />
                                            Validando...
                                        </>
                                    ) : 'Empezar a Chatear'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Settings View */}
                    {view === 'settings' && (
                        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                                <button onClick={() => setView('chat')} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                    <ChevronLeft size={20} />
                                </button>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Privacidad & IA</h3>
                            </div>

                            <div style={{
                                padding: '20px', backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '16px', border: '1px solid var(--border-color)',
                                display: 'flex', flexDirection: 'column', gap: '16px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600 }}>Entrenamiento Anónimo</h4>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.4' }}>
                                            Permite que nuestro modelo aprenda de tus consultas (omitiendo datos sensibles) para mejorar tu experiencia.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleToggleOptIn}
                                        style={{
                                            width: '40px', height: '24px', borderRadius: '12px',
                                            backgroundColor: optIn ? '#6366F1' : 'var(--border-color)',
                                            position: 'relative', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                            flexShrink: 0
                                        }}
                                    >
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '50%',
                                            backgroundColor: 'white', position: 'absolute', top: '3px',
                                            left: optIn ? '19px' : '3px', transition: 'all 0.2s'
                                        }} />
                                    </button>
                                </div>
                                <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                                    <Shield size={14} />
                                    <span>Tus datos financieros nunca se comparten.</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    {view === 'chat' && (
                        <form
                            onSubmit={handleSendMessage}
                            style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}
                        >
                            <input
                                type="text"
                                placeholder="Escribe tu mensaje..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                style={{
                                    flex: 1, padding: '12px 16px', borderRadius: '24px',
                                    border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)', outline: 'none', fontSize: '14px'
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isTyping}
                                style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    backgroundColor: inputValue.trim() ? '#6366F1' : 'var(--border-color)',
                                    color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: inputValue.trim() ? 'pointer' : 'default', transition: 'all 0.2s'
                                }}
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    )}

                    {/* Footer Info */}
                    {view === 'chat' && (
                        <div style={{ padding: '8px 16px', backgroundColor: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', gap: '8px', flexShrink: 0 }}>
                             <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Max v2.0 • Powered by DropCost Master</span>
                        </div>
                    )}
                </>
            )}

            <RechargeModal
                isOpen={isRechargeModalOpen}
                onClose={() => setIsRechargeModalOpen(false)}
                onSuccess={(newBalance) => setCredits(newBalance)}
            />
        </div>
    );
}
