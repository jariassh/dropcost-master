
import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Trash2, History, CreditCard, Sparkles, MessageCircle, AlertTriangle, BrainCircuit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast, Spinner, Tooltip } from '@/components/common';
import type { SimulatorInputs, SimulatorResults } from '@/types/simulator';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

interface Thread {
    id: string;
    title: string;
    created_at: string;
}

interface MentorAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    inputs: SimulatorInputs;
    results: SimulatorResults | null;
    tiendaId: string;
    costeoId?: string;
}

export function MentorAssistant({
    isOpen,
    onClose,
    inputs,
    results,
    tiendaId,
    costeoId
}: MentorAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoadingThreads, setIsLoadingThreads] = useState(false);
    const [researchDepth, setResearchDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
    const [view, setView] = useState<'chat' | 'history'>('chat');
    const [credits, setCredits] = useState<number>(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    const CREDIT_COSTS = {
        quick: 5,
        standard: 15,
        deep: 50
    };

    useEffect(() => {
        if (isOpen) {
            fetchThreads();
            fetchCredits();
        }
    }, [isOpen, tiendaId, costeoId]);

    const fetchCredits = async () => {
        try {
            const { data, error } = await supabase
                .from('user_credits')
                .select('credits')
                .single();
            if (!error && data) setCredits(data.credits);
        } catch (e) {
            console.error('Error fetching credits:', e);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchThreads = async () => {
        setIsLoadingThreads(true);
        try {
            const { data, error } = await (supabase as any)
                .from('ia_threads')
                .select('*')
                .eq('tienda_id', tiendaId)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setThreads(data || []);
        } catch (error) {
            console.error('Error fetching threads:', error);
        } finally {
            setIsLoadingThreads(false);
        }
    };

    const fetchMessages = async (threadId: string) => {
        try {
            const { data, error } = await (supabase as any)
                .from('ia_messages')
                .select('*')
                .eq('thread_id', threadId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
            setActiveThreadId(threadId);
            setView('chat');
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Error al cargar la conversación');
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isSending) return;

        const userMsg = input;
        setInput('');
        setIsSending(true);

        const tempId = Date.now().toString();
        const optimisticMessages: Message[] = [
            ...messages,
            { id: tempId, role: 'user', content: userMsg, created_at: new Date().toISOString() }
        ];
        setMessages(optimisticMessages);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ia-mentor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    threadId: activeThreadId,
                    message: userMsg,
                    researchDepth,
                    costeoData: { ...inputs, results, tienda_id: tiendaId, id: costeoId }
                })
            });

            const data = await response.json();
            if (data.error || response.status === 402) {
                if (response.status === 402) toast.error('Créditos insuficientes');
                else toast.error(data.error || 'Error al conectar');
                setIsSending(false);
                return;
            }

            setMessages([
                ...optimisticMessages,
                { id: Date.now() + 1 + '', role: 'assistant', content: data.content, created_at: new Date().toISOString() }
            ]);

            if (!activeThreadId) {
                setActiveThreadId(data.threadId);
                fetchThreads();
            }
            fetchCredits();
        } catch (error: any) {
            console.error('Error in AI Chat:', error);
            toast.error(error.message || 'Error al conectar');
        } finally {
            setIsSending(false);
        }
    };

    const deleteThread = async (id: string) => {
        try {
            const { error } = await (supabase as any).from('ia_threads').delete().eq('id', id);
            if (error) throw error;
            setThreads(threads.filter(t => t.id !== id));
            if (activeThreadId === id) {
                setActiveThreadId(null);
                setMessages([]);
            }
            toast.success('Conversación eliminada');
        } catch (error) {
            console.error('Error deleting thread:', error);
            toast.error('No se pudo eliminar');
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, right: 0, width: '460px', height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '-20px 0 50px rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            {/* Header */}
            <div style={{
                padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(to right, rgba(255,255,255,0.02), transparent)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)'
                    }}>
                        <BrainCircuit size={24} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#fff', letterSpacing: '0.02em' }}>DropGuru AI</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Mentor Financiero Activo</p>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setView(view === 'chat' ? 'history' : 'chat')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <History size={18} />
                    </button>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {view === 'history' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conversaciones</h4>
                            <button onClick={() => { setActiveThreadId(null); setMessages([]); setView('chat'); }} style={{ padding: '8px 14px', borderRadius: '10px', backgroundColor: '#6366F1', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 650, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}>
                                <Sparkles size={14} /> Nuevo Chat
                            </button>
                        </div>
                        {isLoadingThreads ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Spinner /></div>
                        ) : threads.map(thread => (
                            <div key={thread.id} onClick={() => fetchMessages(thread.id)} style={{ padding: '16px', borderRadius: '14px', backgroundColor: activeThreadId === thread.id ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.02)', border: activeThreadId === thread.id ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }}>
                                <p style={{ fontSize: '13px', fontWeight: activeThreadId === thread.id ? 650 : 500, margin: '0 0 4px 0', color: activeThreadId === thread.id ? '#818CF8' : '#fff' }}>{thread.title}</p>
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{new Date(thread.created_at).toLocaleDateString()}</p>
                                <button onClick={(e) => { e.stopPropagation(); deleteThread(thread.id); }} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#EF4444', opacity: 0.4, cursor: 'pointer' }}><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {messages.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                                <div style={{ width: '70px', height: '70px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(255,255,255,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <BrainCircuit size={40} color="#6366F1" />
                                </div>
                                <h4 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px', color: '#fff' }}>¿Qué analizamos hoy?</h4>
                                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Soy tu mentor experto. Analizaré la viabilidad de tu producto, optimizaré tu rentabilidad y te guiaré para escalar tu negocio.</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '32px' }}>
                                    {['¿Es viable este producto?', 'Dame una estrategia de CPA', '¿Cómo mejoro mi margen?'].map(q => (
                                        <button key={q} onClick={() => setInput(q)} style={{ padding: '10px 16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', transition: 'all 0.2s' }}>{q}</button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                    <div style={{ maxWidth: '85%', padding: '14px 18px', borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', backgroundColor: msg.role === 'user' ? '#6366F1' : 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', lineHeight: 1.6, boxShadow: msg.role === 'user' ? '0 10px 20px rgba(99, 102, 241, 0.2)' : 'none', border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        {msg.content}
                                    </div>
                                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '6px', padding: '0 8px' }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            ))
                        )}
                        {isSending && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px' }}>
                                <Spinner size="sm" />
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>DropGuru está procesando datos expertos...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div style={{ padding: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'transparent' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    {(['quick', 'standard', 'deep'] as const).map(d => (
                        <button key={d} onClick={() => setResearchDepth(d)} style={{ flex: 1, padding: '8px', borderRadius: '10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: researchDepth === d ? '#6366F1' : 'rgba(255,255,255,0.03)', color: researchDepth === d ? '#fff' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }}>
                            {d === 'quick' ? 'Flash' : d === 'standard' ? 'Smart' : 'Deep Guru'}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '12px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '18px', padding: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="Pregunta lo que sea..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '14px', padding: '8px', resize: 'none', maxHeight: '120px', minHeight: '40px' }} />
                    <button onClick={handleSendMessage} disabled={!input.trim() || isSending} style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: input.trim() ? '#6366F1' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', boxShadow: input.trim() ? '0 8px 15px rgba(99, 102, 241, 0.3)' : 'none' }}>
                        {isSending ? <Spinner size="sm" /> : <Send size={20} />}
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <CreditCard size={12} color="#818CF8" />
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{credits} CR</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Consumo: {CREDIT_COSTS[researchDepth]} CR</span>
                        <Tooltip content="Análisis avanzado consume más créditos">
                            <AlertTriangle size={12} color="rgba(255,255,255,0.2)" />
                        </Tooltip>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

function Info({ size, color }: { size: number, color: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
        </svg>
    );
}
