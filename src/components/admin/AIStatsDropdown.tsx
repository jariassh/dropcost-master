import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AIStatsDropdownProps {
    stats: any;
}

export const AIStatsDropdown: React.FC<AIStatsDropdownProps> = ({ stats }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!stats) return null;

    // Adapt to both old and new format
    const modelName = stats.model || 'IA';
    const gemini = stats.gemini || { 
        in: stats.tokens_in || 0, 
        out: stats.tokens_out || 0, 
        total: (stats.tokens_in || 0) + (stats.tokens_out || 0) 
    };
    const ollama = stats.ollama || { 
        in: stats.ollama_in || 0, 
        out: stats.ollama_out || 0, 
        total: stats.ollama_total || stats.ollama_tokens || 0 
    };

    return (
        <div style={{ marginTop: '-6px', padding: '6px 8px 8px', border: '1px solid var(--border-color)', borderTop: 'none', borderRadius: '0 0 18px 18px', backgroundColor: 'var(--card-bg)' }}>
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    background: 'none', 
                    border: 'none', 
                    width: '100%',
                    textAlign: 'left',
                    padding: '4px 8px', 
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: '#6366F1',
                    fontWeight: 600
                }}
            >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <span>📊 Consumo IA</span>
            </button>
            
            {isExpanded && (
                <div style={{ 
                    marginTop: '4px', 
                    padding: '10px', 
                    fontSize: '11px', 
                    fontFamily: 'monospace',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0 0 12px 12px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    {/* Gemini/Gemma Stats */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ color: '#6366F1', fontWeight: 'bold' }}>[G]</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 600, color: '#6366F1' }}>{modelName}</span>
                            <div style={{ opacity: 0.8 }}>
                                In: {(gemini.in ?? 0).toLocaleString()} | 
                                Out: {stats.estimated ? '~' : ''}{(gemini.out ?? 0).toLocaleString()} | 
                                Tot: {stats.estimated ? '~' : ''}{(gemini.total ?? 0).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Ollama Stats - siempre visible */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>[O]</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 600, color: '#10b981' }}>Ollama (Context)</span>
                            <div style={{ opacity: 0.8 }}>
                                In: {(ollama.in ?? 0).toLocaleString()} | 
                                Out: {(ollama.out ?? 0).toLocaleString()} | 
                                Tot: {(ollama.total ?? 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
