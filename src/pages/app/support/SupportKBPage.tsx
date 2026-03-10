
import React, { useState, useEffect } from 'react';
import {
    Search, HelpCircle, Book, MessageSquare,
    ChevronRight, ExternalLink, LifeBuoy, Sparkles, ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { wikiService, WikiArticle } from '@/services/wikiService';

const categories = [
    { id: 'simulador', name: 'Simulador Financiero', icon: <Book size={20} />, count: 0 },
    { id: 'plataforma', name: 'Plataforma & Cuenta', icon: <Search size={20} />, count: 0 },
    { id: 'finanzas', name: 'Pagos & Créditos', icon: <HelpCircle size={20} />, count: 0 },
];

export function SupportKBPage() {
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [activeArticle, setActiveArticle] = useState<WikiArticle | null>(null);
    const [articles, setArticles] = useState<WikiArticle[]>([]);

    useEffect(() => {
        const allArticles = wikiService.getPublicArticles();
        setArticles(allArticles);

        // Soporte para navegación directa via URL: /soporte?article=id
        const params = new URLSearchParams(window.location.search);
        const articleId = params.get('article');
        if (articleId) {
            const art = allArticles.find(a => a.id === articleId);
            if (art) setActiveArticle(art);
        }
    }, []);

    const filteredArticles = articles.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? a.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    if (activeArticle) {
        return (
            <ArticleView
                article={activeArticle}
                onBack={() => {
                    setActiveArticle(null);
                    window.history.pushState({}, '', window.location.pathname);
                }}
            />
        );
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', color: 'var(--text-primary)' }}>
            {/* Header decorativo */}
            <div style={{
                textAlign: 'center', padding: '64px 20px',
                background: 'linear-gradient(180deg, rgba(0,102,255,0.05) 0%, transparent 100%)',
                borderRadius: '32px', marginBottom: '40px'
            }}>
                <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                    Centro de Ayuda & Base de Conocimiento
                </h1>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '18px', maxWidth: '600px', margin: '0 auto 32px' }}>
                    Todo lo que necesitas saber sobre DropCost Master, desde conceptos financieros hasta gestión diaria.
                </p>

                {/* Barra de búsqueda Premium */}
                <div style={{
                    maxWidth: '600px', margin: '0 auto', position: 'relative',
                    backgroundColor: 'var(--card-bg)', borderRadius: '16px',
                    border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                    display: 'flex', alignItems: 'center', padding: '0 20px'
                }}>
                    <Search color="var(--text-tertiary)" size={20} />
                    <input
                        type="text"
                        placeholder="Busca por función, cálculo o error..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: 1, padding: '18px 12px', background: 'none', border: 'none',
                            outline: 'none', color: 'var(--text-primary)', fontSize: '16px'
                        }}
                    />
                </div>
            </div>

            {/* Categorías */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '64px' }}>
                {categories.map((cat) => (
                    <div
                        key={cat.id}
                        onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                        style={{
                            padding: '24px', backgroundColor: 'var(--card-bg)',
                            borderRadius: '24px', border: selectedCategory === cat.id ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                            cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            display: 'flex', flexDirection: 'column', gap: '16px'
                        }}
                    >
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            backgroundColor: 'rgba(0,102,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-primary)'
                        }}>
                            {cat.icon}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{cat.name}</h3>
                            <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                                {articles.filter(a => a.category === cat.id).length} artículos
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Listado de Artículos */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 700 }}>
                        {selectedCategory ? `Artículos: ${categories.find(c => c.id === selectedCategory)?.name}` : 'Artículos Populares'}
                    </h2>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                    {filteredArticles.length > 0 ? filteredArticles.map((art) => (
                        <div
                            key={art.id}
                            onClick={() => {
                                setActiveArticle(art);
                                // Actualizar URL sin recargar para que sea compartible
                                window.history.pushState({}, '', `?article=${art.id}`);
                            }}
                            style={{
                                padding: '16px 20px', backgroundColor: 'var(--card-bg)',
                                borderRadius: '16px', border: '1px solid var(--border-color)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card-bg)'; }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <MessageSquare size={18} color="var(--text-tertiary)" />
                                <div>
                                    <div style={{ fontWeight: 600 }}>{art.title}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{art.excerpt}</div>
                                </div>
                            </div>
                            <ChevronRight size={18} color="var(--text-tertiary)" />
                        </div>
                    )) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                            No se encontraron artículos que coincidan con tu búsqueda.
                        </div>
                    )}
                </div>
            </div>

            {/* Call to action Footer */}
            <div style={{
                marginTop: '80px', padding: '40px',
                backgroundColor: 'var(--bg-tertiary)', borderRadius: '32px',
                textAlign: 'center', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '24px'
            }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '20px',
                    backgroundColor: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', boxShadow: '0 8px 24px rgba(0,102,255,0.3)'
                }}>
                    <LifeBuoy size={32} />
                </div>
                <div>
                    <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>¿Aún tienes dudas?</h3>
                    <p style={{ color: 'var(--text-tertiary)' }}>Nuestro Drop Assistant está disponible 24/7 para ayudarte en tiempo real.</p>
                </div>
                <button
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-drop-assistant'));
                    }}
                    style={{
                        padding: '12px 32px', backgroundColor: 'var(--color-primary)',
                        color: 'white', border: 'none', borderRadius: '12px',
                        fontWeight: 600, fontSize: '15px', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,102,255,0.2)'
                    }}
                >
                    Hablar con el Asistente
                </button>
            </div>
        </div>
    );
}

function ArticleView({ article, onBack }: { article: WikiArticle, onBack: () => void }) {
    const [content, setContent] = useState<string>('Cargando...');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        wikiService.getArticleContent(article.contentPath)
            .then(text => setContent(text))
            .finally(() => setLoading(false));
    }, [article]);

    const formatText = (text: string) => {
        // Regex que busca negritas **texto**, *texto* o enlaces [texto](url)
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g);

        return parts.map((part, pi) => {
            // Manejar Negritas (Soporta ** y *)
            if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('*') && part.endsWith('*'))) {
                const content = part.startsWith('**') ? part.slice(2, -2) : (part.startsWith('*') ? part.slice(1, -1) : part);
                return <strong key={pi} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{content}</strong>;
            }

            // Manejar Enlaces [texto](url)
            const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
            if (linkMatch) {
                const [_, linkText, linkUrl] = linkMatch;
                return (
                    <a
                        key={pi}
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: 'var(--color-primary)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            borderBottom: '1px solid transparent',
                            transition: 'border-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = 'var(--color-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = 'transparent'}
                    >
                        {linkText} <ExternalLink size={12} style={{ display: 'inline', marginLeft: '2px', verticalAlign: 'middle' }} />
                    </a>
                );
            }

            return part;
        });
    };

    const renderContent = () => {
        if (loading) return <div style={{ color: 'var(--text-tertiary)' }}>Cargando contenido...</div>;

        return content.split('\n').map((line, i) => {
            const trimmedLine = line.trim();

            // Titulares
            if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '32px', fontWeight: 800, margin: '32px 0 16px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{formatText(line.substring(2))}</h1>;
            if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '24px', fontWeight: 700, margin: '24px 0 12px', color: 'var(--text-primary)' }}>{formatText(line.substring(3))}</h2>;
            if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: '20px', fontWeight: 700, margin: '20px 0 10px', color: 'var(--text-primary)' }}>{formatText(line.substring(4))}</h3>;

            // Listas desordenadas (+ soportar asteriscos)
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                const bulletChar = line.trim().startsWith('- ') ? '- ' : '* ';
                return (
                    <li key={i} style={{ marginLeft: '24px', marginBottom: '10px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        {formatText(line.trim().substring(bulletChar.length))}
                    </li>
                );
            }

            // Listas numeradas (ej: 1. Texto)
            if (/^\d+\.\s/.test(trimmedLine)) {
                const content = trimmedLine.replace(/^\d+\.\s/, '');
                return (
                    <div key={i} style={{ display: 'flex', gap: '12px', marginLeft: '4px', marginBottom: '10px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)', minWidth: '20px' }}>{trimmedLine.match(/^\d+/)?.[0]}.</span>
                        <span>{formatText(content)}</span>
                    </div>
                );
            }

            if (trimmedLine === '') return <div key={i} style={{ height: '8px' }} />;

            // Párrafos normales
            return (
                <p key={i} style={{ marginBottom: '16px', lineHeight: '1.7', color: 'var(--text-secondary)', fontSize: '16px' }}>
                    {formatText(line)}
                </p>
            );
        });
    };

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', color: 'var(--text-primary)' }}>
            <button
                onClick={onBack}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px', background: 'none',
                    border: 'none', color: 'var(--color-primary)', cursor: 'pointer',
                    fontWeight: 600, marginBottom: '32px'
                }}
            >
                <ArrowLeft size={18} /> Volver al Centro de Ayuda
            </button>
            <div style={{ padding: '48px', backgroundColor: 'var(--card-bg)', borderRadius: '32px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                {renderContent()}
            </div>
        </div>
    );
}
