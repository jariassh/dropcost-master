import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, Button, Input, Toggle, Spinner, useToast, CodeEditor, Select, SelectOption } from '@/components/common';
import { customCodeService, CustomCodeSnippet } from '@/services/customCodeService';
import { Plus, Trash2, Edit2, Globe, FileText, Layout, Info, Save, X, CheckSquare, Square, Code, Settings2 } from 'lucide-react';

const LOCATION_OPTIONS: SelectOption[] = [
    { value: 'head', label: 'HEAD', details: 'Antes del cierre de </head>. Ideal para Píxeles.' },
    { value: 'body_start', label: 'BODY - Inicio', details: 'Justo después de abrir <body>. Necesario para GTM.' },
    { value: 'body_end', label: 'BODY - Final', details: 'Antes del cierre de </body>. Para chat y widgets.' },
];

const PAGE_OPTIONS = [
    { id: 'all', label: 'Todo el Sitio', description: 'Se inyectará en todas las páginas de la plataforma.' },
    { id: 'landing', label: 'Landing Page', description: 'Solo en la página de inicio pública.' },
    { id: 'auth', label: 'Auth (Login/Registro)', description: 'Solo en las páginas de acceso.' },
    { id: 'panel', label: 'User Panel', description: 'En el dashboard del dropshipper.' },
    { id: 'admin', label: 'Admin Dashboard', description: 'En este panel de administración.' },
    { id: 'checkout', label: 'Checkout / Planes', description: 'Solo en el proceso de pago/planes.' },
];

export interface CustomCodeManagerHandle {
    handleCreate: () => void;
}

export const CustomCodeManager = forwardRef<CustomCodeManagerHandle>((_, ref) => {
    const [snippets, setSnippets] = useState<CustomCodeSnippet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [currentSnippet, setCurrentSnippet] = useState<Partial<CustomCodeSnippet> | null>(null);
    const toast = useToast();

    useEffect(() => {
        loadSnippets();
    }, []);

    const loadSnippets = async () => {
        try {
            setIsLoading(true);
            const data = await customCodeService.getAllSnippets();
            setSnippets(data);
        } catch (error) {
            console.error('Error loading snippets:', error);
            toast.error('Error', 'No se pudieron cargar los fragmentos de código.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setCurrentSnippet({
            name: '',
            code: '',
            location: 'head',
            status: true,
            apply_to: ['all'],
            priority: 0
        });
        setEditMode(true);
    };

    useImperativeHandle(ref, () => ({ handleCreate }));

    const handleEdit = (snippet: CustomCodeSnippet) => {
        setCurrentSnippet({ ...snippet });
        setEditMode(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este fragmento?')) return;
        try {
            await customCodeService.deleteSnippet(id);
            toast.success('Eliminado', 'El fragmento ha sido eliminado.');
            loadSnippets();
        } catch (error) {
            toast.error('Error', 'No se pudo eliminar el fragmento.');
        }
    };

    const handleSave = async () => {
        if (!currentSnippet?.name || !currentSnippet?.code) {
            toast.error('Campos incompletos', 'El nombre y el código son obligatorios.');
            return;
        }

        try {
            setIsSaving(true);
            await customCodeService.saveSnippet(currentSnippet);
            toast.success('¡Guardado!', 'El fragmento de código ha sido guardado correctamente.');
            setEditMode(false);
            setCurrentSnippet(null);
            loadSnippets();
        } catch (error) {
            toast.error('Error', 'No se pudo guardar el fragmento.');
        } finally {
            setIsSaving(false);
        }
    };

    const togglePage = (pageId: string) => {
        if (!currentSnippet) return;
        const currentPages = currentSnippet.apply_to || [];

        let newPages: string[];
        if (pageId === 'all') {
            newPages = currentPages.includes('all') ? [] : ['all'];
        } else {
            const filtered = currentPages.filter(p => p !== 'all');
            newPages = filtered.includes(pageId)
                ? filtered.filter(p => p !== pageId)
                : [...filtered, pageId];
        }

        setCurrentSnippet({ ...currentSnippet, apply_to: newPages });
    };

    if (isLoading && snippets.length === 0) {
        return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
    }

    if (editMode && currentSnippet) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Settings2 style={{ color: 'var(--color-primary)' }} />
                        {currentSnippet.id ? 'Editar Fragmento' : 'Nuevo Fragmento'}
                    </h3>
                    <Button variant="secondary" onClick={() => setEditMode(false)} leftIcon={<X size={16} />}>
                        Cerrar Editor
                    </Button>
                </div>

                <div className="dc-editor-grid">
                    <div className="main-column">
                        <Card title="Configuración de Código">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <Input
                                    label="Nombre del Fragmento"
                                    placeholder="Ej: Google Tag Manager - Base"
                                    value={currentSnippet.name}
                                    onChange={(e) => setCurrentSnippet({ ...currentSnippet, name: e.target.value })}
                                />

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Contenido del Script (HTML/JS)</label>
                                    <CodeEditor
                                        value={currentSnippet.code || ''}
                                        onChange={(val) => setCurrentSnippet({ ...currentSnippet, code: val })}
                                        language="html"
                                        minHeight="440px"
                                    />
                                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic', paddingLeft: '4px', paddingTop: '2px' }}>
                                        Pega aquí el código que te proporciona GTM, Meta Pixel o cualquier otro servicio externo.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="side-column">
                        <Card title="Reglas de Inyección">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <Select
                                    label="Ubicación"
                                    options={LOCATION_OPTIONS}
                                    value={currentSnippet.location || 'head'}
                                    onChange={(val) => setCurrentSnippet({ ...currentSnippet, location: val as any })}
                                />

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Publicar Fragmento</p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Activar o pausar este script</p>
                                    </div>
                                    <Toggle
                                        checked={currentSnippet.status || false}
                                        onChange={(checked) => setCurrentSnippet({ ...currentSnippet, status: checked })}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Globe size={14} style={{ color: 'var(--color-primary)' }} /> Entornos donde se aplicará:
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {PAGE_OPTIONS.map(page => {
                                            const isSelected = currentSnippet.apply_to?.includes(page.id);
                                            return (
                                                <div
                                                    key={page.id}
                                                    onClick={() => togglePage(page.id)}
                                                    style={{
                                                        padding: '12px 16px',
                                                        borderRadius: '12px',
                                                        border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                                        backgroundColor: isSelected ? 'rgba(var(--color-primary-rgb, 0, 102, 255), 0.05)' : 'transparent',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        transition: 'all 200ms ease'
                                                    }}
                                                >
                                                    {isSelected ? <CheckSquare size={18} style={{ color: 'var(--color-primary)' }} /> : <Square size={18} style={{ color: 'var(--text-tertiary)' }} />}
                                                    <p style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{page.label}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handleSave}
                                    isLoading={isSaving}
                                    leftIcon={<Save size={18} />}
                                    style={{ marginTop: '8px' }}
                                >
                                    Guardar y Publicar
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>

                <style>{`
                    .dc-editor-grid {
                        display: grid;
                        grid-template-columns: 2fr 1fr;
                        gap: 32px;
                    }
                    @media (max-width: 1024px) {
                        .dc-editor-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-in fade-in duration-500">
            {/* Contenedor de lista */}
            <div>
                {snippets.length === 0 ? (
                    <Card>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', textAlign: 'center', gap: '32px', border: '2px dashed var(--border-color)', borderRadius: '16px', backgroundColor: 'transparent' }}>
                            <div style={{ padding: '24px', borderRadius: '9999px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                                <Layout size={28} className="text-[var(--text-tertiary)] opacity-40" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-lg font-bold text-[var(--text-primary)]">Sin fragmentos inyectados</h4>
                                <p className="text-sm text-[var(--text-tertiary)] max-w-sm mx-auto">Comienza a centralizar tus píxeles y códigos de seguimiento para tener una sola fuente de verdad.</p>
                            </div>
                            <Button variant="secondary" onClick={handleCreate} size="lg">Añadir Primer Fragmento</Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {snippets.map(snippet => (
                            <Card key={snippet.id} noPadding className="group overflow-hidden hover:shadow-2xl transition-all border hover:border-[var(--color-primary)]/50 relative">
                                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {/* Cabecera de la Tarjeta */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                                        <div style={{ display: 'flex', gap: '16px', minWidth: 0 }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: snippet.status ? 'rgba(var(--color-primary-rgb, 0, 102, 255), 0.1)' : 'var(--bg-tertiary)',
                                                color: snippet.status ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                                border: `1px solid ${snippet.status ? 'rgba(var(--color-primary-rgb, 0, 102, 255), 0.2)' : 'var(--border-color)'}`,
                                                transition: 'all 300ms ease'
                                            }}>
                                                <Code size={22} />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <h4 style={{
                                                    fontSize: '16px',
                                                    fontWeight: 700,
                                                    color: 'var(--text-primary)',
                                                    lineHeight: '1.2',
                                                    marginBottom: '8px'
                                                }} className="truncate">{snippet.name}</h4>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        padding: '2px 8px',
                                                        borderRadius: '6px',
                                                        backgroundColor: 'var(--bg-tertiary)',
                                                        color: 'var(--text-secondary)',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        border: '1px solid var(--border-color)'
                                                    }}>
                                                        {snippet.location.replace('_', ' ')}
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
                                                        <div style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            backgroundColor: snippet.status ? '#22c55e' : 'var(--text-tertiary)',
                                                            boxShadow: snippet.status ? '0 0 8px rgba(34, 197, 94, 0.4)' : 'none'
                                                        }} />
                                                        <span style={{
                                                            fontSize: '10px',
                                                            fontWeight: 800,
                                                            color: snippet.status ? '#22c55e' : 'var(--text-tertiary)',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em'
                                                        }}>
                                                            {snippet.status ? 'Activo' : 'Pausado'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                onClick={() => handleEdit(snippet)}
                                                style={{
                                                    padding: '8px',
                                                    borderRadius: '10px',
                                                    color: 'var(--text-tertiary)',
                                                    transition: 'all 200ms ease',
                                                    border: '1px solid var(--border-color)',
                                                    backgroundColor: 'var(--bg-primary)'
                                                }}
                                                className="hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--bg-secondary)]"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(snippet.id)}
                                                style={{
                                                    padding: '8px',
                                                    borderRadius: '10px',
                                                    color: 'var(--text-tertiary)',
                                                    transition: 'all 200ms ease',
                                                    border: '1px solid var(--border-color)',
                                                    backgroundColor: 'var(--bg-primary)'
                                                }}
                                                className="hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Sección de Destinos */}
                                    <div style={{
                                        padding: '16px',
                                        borderRadius: '16px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Globe size={14} style={{ color: 'var(--color-primary)' }} />
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Inyectado en:
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {snippet.apply_to.map(p => {
                                                const label = PAGE_OPTIONS.find(opt => opt.id === p)?.label || p;
                                                const isGlobal = p === 'all';
                                                return (
                                                    <span key={p} style={{
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        padding: '4px 10px',
                                                        borderRadius: '8px',
                                                        backgroundColor: isGlobal ? 'rgba(var(--color-primary-rgb, 0, 102, 255), 0.1)' : 'var(--bg-tertiary)',
                                                        color: isGlobal ? 'var(--color-primary)' : 'var(--text-primary)',
                                                        border: `1px solid ${isGlobal ? 'rgba(var(--color-primary-rgb, 0, 102, 255), 0.2)' : 'var(--border-color)'}`,
                                                        display: 'inline-flex',
                                                        alignItems: 'center'
                                                    }}>
                                                        {label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {snippet.status && (
                                    <div style={{
                                        height: '3px',
                                        width: '100%',
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        backgroundColor: 'var(--color-primary)',
                                        boxShadow: '0 -2px 10px rgba(var(--color-primary-rgb, 0, 102, 255), 0.5)'
                                    }} />
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Badge informativo debajo */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px 20px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '12px',
                    border: '1px dashed var(--border-color)'
                }}
            >
                <Info size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    Para Google Tag Manager, inyecta el script principal en el <strong>HEAD</strong> y el elemento noscript en el <strong>BODY - Inicio</strong>.
                    Esto garantiza la máxima precisión en el trackeo de eventos y conversiones.
                </p>
            </div>
        </div>
    );
});
