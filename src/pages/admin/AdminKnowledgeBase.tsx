
import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Edit2, Trash2, Eye,
    Save, X, FileText, Globe, Lock,
    CheckCircle2, AlertCircle
} from 'lucide-react';

/* --- Mock Logic --- */
interface Article {
    id: string;
    title: string;
    category: string;
    content: string;
    is_public: boolean;
    updated_at: string;
}

export function AdminKnowledgeBase() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentArticle, setCurrentArticle] = useState<Partial<Article>>({});
    const [isLoading, setIsLoading] = useState(false);

    const categories = ['simulador', 'ofertas', 'campañas', 'plataforma', 'créditos', 'referidos'];

    const handleSave = () => {
        // Logic to save to Supabase
        setIsEditing(false);
        setCurrentArticle({});
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Gestión de Conocimiento (RAG)</h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Administra los artículos que alimentan al Drop Assistant y la página de soporte.</p>
                </div>
                <button
                    onClick={() => { setIsEditing(true); setCurrentArticle({ is_public: false }); }}
                    style={{
                        padding: '10px 20px', backgroundColor: 'var(--color-primary)',
                        color: 'white', border: 'none', borderRadius: '12px',
                        fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                    }}
                >
                    <Plus size={18} /> Nuevo Artículo
                </button>
            </div>

            {/* Editor Modal / Overlay */}
            {isEditing && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)', zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '24px'
                }}>
                    <div style={{
                        maxWidth: '800px', width: '100%', backgroundColor: 'var(--card-bg)',
                        borderRadius: '24px', border: '1px solid var(--card-border)',
                        boxShadow: '0 32px 64px rgba(0,0,0,0.2)',
                        display: 'flex', flexDirection: 'column', maxHeight: '90vh'
                    }}>
                        <div style={{
                            padding: '24px 32px', borderBottom: '1px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                                {currentArticle.id ? 'Editar Artículo' : 'Crear Artículo'}
                            </h2>
                            <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Título del Artículo</label>
                                    <input
                                        type="text"
                                        value={currentArticle.title || ''}
                                        onChange={(e) => setCurrentArticle({ ...currentArticle, title: e.target.value })}
                                        style={{
                                            width: '100%', padding: '12px 16px', borderRadius: '12px',
                                            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                            color: 'var(--text-primary)', outline: 'none'
                                        }}
                                        placeholder="Ej: Cómo configurar RLS"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Categoría</label>
                                    <select
                                        value={currentArticle.category || ''}
                                        onChange={(e) => setCurrentArticle({ ...currentArticle, category: e.target.value })}
                                        style={{
                                            width: '100%', padding: '12px 16px', borderRadius: '12px',
                                            backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                            color: 'var(--text-primary)', outline: 'none'
                                        }}
                                    >
                                        <option value="">Selecciona...</option>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Contenido (Markdown soportado)</label>
                                <textarea
                                    value={currentArticle.content || ''}
                                    onChange={(e) => setCurrentArticle({ ...currentArticle, content: e.target.value })}
                                    style={{
                                        width: '100%', height: '300px', padding: '16px', borderRadius: '12px',
                                        backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace',
                                        resize: 'none'
                                    }}
                                    placeholder="Escribe el conocimiento técnico aquí..."
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input
                                    type="checkbox"
                                    checked={currentArticle.is_public || false}
                                    onChange={(e) => setCurrentArticle({ ...currentArticle, is_public: e.target.checked })}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    Hacer público en el Centro de Ayuda (/soporte)
                                </span>
                            </div>
                        </div>

                        <div style={{
                            padding: '24px 32px', borderTop: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-secondary)', borderRadius: '0 0 24px 24px',
                            display: 'flex', justifyContent: 'flex-end', gap: '12px'
                        }}>
                            <button onClick={() => setIsEditing(false)} style={{
                                padding: '10px 20px', borderRadius: '12px', fontWeight: 600,
                                background: 'none', border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)', cursor: 'pointer'
                            }}>
                                Cancelar
                            </button>
                            <button onClick={handleSave} style={{
                                padding: '10px 24px', borderRadius: '12px', fontWeight: 600,
                                backgroundColor: 'var(--color-primary)', border: 'none',
                                color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                            }}>
                                <Save size={18} /> Guardar Conocimiento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Listado de Artículos Table */}
            <div style={{
                backgroundColor: 'var(--card-bg)', borderRadius: '24px',
                border: '1px solid var(--card-border)', overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Artículo</th>
                            <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Categoría</th>
                            <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Estado</th>
                            <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Última Act.</th>
                            <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {articles.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '48px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                        <FileText size={48} color="var(--border-color)" />
                                        <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>No hay artículos registrados aún.</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            articles.map((art) => (
                                <tr key={art.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    {/* Data Rows */}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

