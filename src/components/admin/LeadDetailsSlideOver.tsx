import React, { useState } from 'react';
import { X, User, Bot, Calendar, MessageSquare, ChevronLeft, ChevronRight, Clock, Mail, Phone, Globe, Zap } from 'lucide-react';
import { SlideOver, Card } from '../common';
import { Lead } from '@/services/leadService';
import { AIStatsDropdown } from './AIStatsDropdown';

interface LeadDetailsSlideOverProps {
    lead: Lead | null;
    isOpen: boolean;
    onClose: () => void;
}

interface ChatSession {
    id: number;
    messages: any[];
    startTime: string;
}

export const LeadDetailsSlideOver: React.FC<LeadDetailsSlideOverProps> = ({ lead, isOpen, onClose }) => {
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

    if (!lead) return null;

    // Lógica para agrupar mensajes por sesiones (gap > 30 min)
    const getSessions = (conversacion: any[]): ChatSession[] => {
        if (!Array.isArray(conversacion)) return [];

        const sessions: ChatSession[] = [];
        let currentMessages: any[] = [];
        let lastTime: number | null = null;
        const thirtyMinutes = 30 * 60 * 1000;

        // Filtrar mensajes de sistema y metadatos
        const actualMessages = conversacion.filter(m => m.role === 'user' || m.role === 'assistant');

        actualMessages.forEach((msg, idx) => {
            const currentTime = msg.timestamp ? new Date(msg.timestamp).getTime() : 0;

            if (lastTime && (currentTime - lastTime) > thirtyMinutes) {
                if (currentMessages.length > 0) {
                    sessions.push({
                        id: sessions.length + 1,
                        messages: currentMessages,
                        startTime: currentMessages[0].timestamp || lead.created_at
                    });
                }
                currentMessages = [msg];
            } else {
                currentMessages.push(msg);
            }
            lastTime = currentTime;
        });

        if (currentMessages.length > 0) {
            sessions.push({
                id: sessions.length + 1,
                messages: currentMessages,
                startTime: currentMessages[0].timestamp || lead.created_at
            });
        }

        return sessions.reverse(); // Mostrar la más reciente primero
    };

    const sessions = getSessions(lead.conversacion);

    const renderAdminMessageContent = (content: string) => {
        const buttonRegex = /\[BOTON:\s*([^|]+)\|\s*([^\]]+)\]/;
        const match = content.match(buttonRegex);

        if (match) {
            const textBefore = content.substring(0, match.index);
            const buttonText = match[1].trim();
            const buttonUrl = match[2].trim();

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <span dangerouslySetInnerHTML={{ __html: textBefore.replace(/\n/g, '<br/>') }} />
                    <a 
                        href={buttonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            alignSelf: 'flex-start',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            padding: '10px 18px',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        {buttonText} <ChevronRight size={14} />
                    </a>
                </div>
            );
        }

        return <span dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />;
    };

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={() => {
                onClose();
                setSelectedSession(null);
            }}
            title={selectedSession ? `Chat - Sesión ${selectedSession.id}` : `Perfil de Lead: ${lead.nombre}`}
        >
            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>

                {/* Cabecera del Lead */}
                {!selectedSession && (
                    <div style={{
                        padding: '24px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '20px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                            background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)'
                        }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{
                                width: '70px', height: '70px', borderRadius: '18px',
                                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: '28px', fontWeight: 800,
                                boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)'
                            }}>
                                {(lead.nombre || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{lead.nombre || 'Sin nombre'}</h3>
                                <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Mail size={14} /> <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{lead.email}</span>
                                </p>
                            </div>
                        </div>

                        <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
                            <div style={{
                                padding: '12px 16px', backgroundColor: 'var(--bg-primary)',
                                borderRadius: '14px', border: '1px solid var(--border-color)',
                                display: 'flex', alignItems: 'center', gap: '12px'
                            }}>
                                <div style={{ color: '#6366F1', padding: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px' }}>
                                    <Phone size={16} />
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Teléfono</span>
                                    <span style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>{lead.telefono}</span>
                                </div>
                            </div>
                            <div style={{
                                padding: '12px 16px', backgroundColor: 'var(--bg-primary)',
                                borderRadius: '14px', border: '1px solid var(--border-color)',
                                display: 'flex', alignItems: 'center', gap: '12px'
                            }}>
                                <div style={{ color: '#10B981', padding: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px' }}>
                                    <Globe size={16} />
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Ubicación</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                        {lead.pais && <img src={`https://flagcdn.com/w40/${lead.pais.toLowerCase()}.png`} alt={lead.pais} style={{ width: '18px', height: '13px', borderRadius: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />}
                                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{lead.pais || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Listado de Sesiones o Chat Detallado */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {selectedSession ? (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
                            <button
                                onClick={() => setSelectedSession(null)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: 'none', border: 'none', color: '#6366F1',
                                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                    padding: '0 0 12px 0'
                                }}
                            >
                                <ChevronLeft size={16} /> Volver a todas las conversaciones
                            </button>

                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '16px',
                                backgroundColor: 'var(--bg-primary)',
                                borderRadius: '16px',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px'
                            }} className="dc-scrollbar">
                                {selectedSession.messages.map((msg, idx) => {
                                    const contentParts = msg.role === 'assistant' 
                                        ? msg.content.split(/\[SPLIT\]|\s+\/\s+|&/).map((s: string) => s.trim()).filter((s: string) => s !== '')
                                        : [msg.content];

                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                                maxWidth: '85%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '6px'
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex', gap: '8px',
                                                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                                fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600
                                            }}>
                                                {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                                {msg.role === 'user' ? (lead.nombre || 'Visitante') : 'Drop Assistant'}
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {contentParts.map((part: string, partIdx: number) => (
                                                    <div key={`${idx}-${partIdx}`} style={{
                                                        padding: '12px 16px',
                                                        borderRadius: msg.role === 'user' 
                                                            ? '18px 18px 2px 18px' 
                                                            : (msg.ai_stats && partIdx === contentParts.length - 1 ? '18px 18px 0 0' : '18px 18px 18px 2px'),
                                                        backgroundColor: msg.role === 'user' ? 'rgba(99, 102, 241, 0.1)' : 'var(--card-bg)',
                                                        color: 'var(--text-primary)',
                                                        border: '1px solid ' + (msg.role === 'user' ? 'rgba(99, 102, 241, 0.2)' : 'var(--border-color)'),
                                                        borderBottom: (msg.ai_stats && partIdx === contentParts.length - 1) ? 'none' : undefined,
                                                        fontSize: '14px',
                                                        lineHeight: '1.5'
                                                    }}>
                                                        {renderAdminMessageContent(part)}
                                                    </div>
                                                ))}
                                            </div>

                                            {msg.ai_stats ? (
                                                <AIStatsDropdown stats={msg.ai_stats} />
                                            ) : (
                                                msg.role === 'assistant' && <div style={{fontSize: '9px', opacity: 0.5}}>(Sin datos de consumo)</div>
                                            )}
                                            {msg.timestamp && (
                                                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                borderBottom: '1px solid var(--border-color)', paddingBottom: '12px'
                            }}>
                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
                                        <MessageSquare size={16} />
                                    </div>
                                    Historial de Sesiones
                                </h4>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-secondary)', padding: '2px 10px', borderRadius: '12px' }}>
                                    {sessions.length} total
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {sessions.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                                        No hay conversaciones registradas aún.
                                    </div>
                                ) : (
                                    sessions.map((session) => {
                                        // Calcular tokens acumulados de la sesión
                                        const sessionStats = session.messages.reduce((acc: any, msg: any) => {
                                            if (msg.ai_stats) {
                                                const g = msg.ai_stats.gemini || {};
                                                const o = msg.ai_stats.ollama || {};
                                                acc.geminiIn += (g.in ?? 0);
                                                acc.geminiOut += (g.out ?? 0);
                                                acc.geminiTotal += (g.total ?? 0);
                                                acc.ollamaIn += (o.in ?? 0);
                                                acc.ollamaOut += (o.out ?? 0);
                                                acc.ollamaTotal += (o.total ?? 0);
                                                acc.hasEstimated = acc.hasEstimated || msg.ai_stats.estimated;
                                                if (msg.ai_stats.model) acc.model = msg.ai_stats.model;
                                            }
                                            return acc;
                                        }, { geminiIn: 0, geminiOut: 0, geminiTotal: 0, ollamaIn: 0, ollamaOut: 0, ollamaTotal: 0, hasEstimated: false, model: 'IA' });

                                        return (
                                        <div
                                            key={session.id}
                                            onClick={() => setSelectedSession(session)}
                                            style={{
                                                padding: '16px 20px',
                                                backgroundColor: 'var(--bg-secondary)',
                                                borderRadius: '16px',
                                                border: '1px solid var(--border-color)',
                                                cursor: 'pointer',
                                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '12px',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = '#6366F1';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {/* Fila 1: Info sesión */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                    <div style={{
                                                        width: '44px', height: '44px', borderRadius: '12px',
                                                        backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        <MessageSquare size={20} />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Sesión #{session.id}</div>
                                                        <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Calendar size={12} /> {new Date(session.startTime).toLocaleDateString()}
                                                            <span style={{ margin: '0 4px' }}>•</span>
                                                            <Clock size={12} /> {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                                                        {session.messages.length} msgs
                                                    </span>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                                                        <ChevronRight size={16} style={{ color: '#6366F1' }} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Fila 2: Desglose de tokens */}
                                            <div style={{
                                                borderTop: '1px solid var(--border-color)',
                                                paddingTop: '10px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '6px',
                                                fontSize: '11px',
                                                fontFamily: 'monospace'
                                            }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ color: '#6366F1', fontWeight: 'bold' }}>[G] <span style={{ fontWeight: 600 }}>{sessionStats.model}</span></span>
                                                    <span style={{ opacity: 0.8, color: 'var(--text-secondary)', paddingLeft: '20px' }}>
                                                        In: {sessionStats.geminiIn.toLocaleString()} | Out: {sessionStats.hasEstimated ? '~' : ''}{sessionStats.geminiOut.toLocaleString()} | Tot: {sessionStats.hasEstimated ? '~' : ''}{sessionStats.geminiTotal.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>[O] <span style={{ fontWeight: 600 }}>Ollama</span></span>
                                                    <span style={{ opacity: 0.8, color: 'var(--text-secondary)', paddingLeft: '20px' }}>
                                                        In: {sessionStats.ollamaIn.toLocaleString()} | Out: {sessionStats.ollamaOut.toLocaleString()} | Tot: {sessionStats.ollamaTotal.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </SlideOver>
    );
};
