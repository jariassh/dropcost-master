import React from 'react';
import { X, User, Bot, Clock, Calendar } from 'lucide-react';
import { Modal, Card } from '../common';
import { Lead } from '@/services/leadService';

interface LeadChatModalProps {
    lead: Lead | null;
    isOpen: boolean;
    onClose: () => void;
}

export const LeadChatModal: React.FC<LeadChatModalProps> = ({ lead, isOpen, onClose }) => {
    if (!lead) return null;

    const conversacion = Array.isArray(lead.conversacion) ? lead.conversacion : [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Conversación con ${lead.nombre}`}
            size="lg"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh' }}>
                {/* Lead Info Header */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    alignItems: 'center'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 600
                    }}>
                        {lead.nombre.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{lead.nombre}</h4>
                            {lead.pais && (
                                <img
                                    src={`https://flagcdn.com/w40/${lead.pais.toLowerCase()}.png`}
                                    alt={lead.pais}
                                    style={{ width: '16px', height: '11px', borderRadius: '1px' }}
                                />
                            )}
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>{lead.email} • {lead.telefono}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            <Calendar size={14} />
                            {new Date(lead.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {/* Chat History */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    minHeight: '400px'
                }} className="dc-scrollbar">
                    {conversacion.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                            No hay mensajes registrados en esta conversación.
                        </div>
                    ) : (
                        conversacion.map((msg: any, idx: number) => (
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
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: 'var(--text-tertiary)',
                                    marginBottom: '2px'
                                }}>
                                    {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                    {msg.role === 'user' ? 'Visitante' : 'Asistente IA'}
                                </div>
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                                    backgroundColor: msg.role === 'user' ? 'rgba(99, 102, 241, 0.1)' : 'var(--card-bg)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid ' + (msg.role === 'user' ? 'rgba(99, 102, 241, 0.2)' : 'var(--border-color)'),
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
};
