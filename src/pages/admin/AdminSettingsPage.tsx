import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Spinner } from '@/components/common/Spinner';
import { Toggle } from '@/components/common/Toggle';
import { Alert, useToast, CodeEditor } from '@/components/common';
import {
    Search,
    Palette,
    Code,
    Info,
    ExternalLink,
    MapPin,
    Save,
    RotateCcw,
    AlertCircle,
    Eye,
    Globe,
    Hash,
    Upload,
    X,
    Layout,
    Type,
    Building2,
    Mail,
    Phone,
    Instagram,
    Linkedin,
    Youtube,
    FileText,
    Shield,
    AlignLeft
} from 'lucide-react';
import { configService, GlobalConfig } from '@/services/configService';
import { storageService } from '@/services/storageService';
import { useTheme } from '@/hooks/useTheme';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';

export function AdminSettingsPage() {
    const [config, setConfig] = useState<GlobalConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('seo');
    const toast = useToast();
    const { isDark } = useTheme();
    const { applyConfig } = useGlobalConfig();

    useEffect(() => {
        loadConfig();
    }, []);

    // Efecto Premium: Aplicar cambios de SEO/Branding en tiempo real (Vista Previa)
    useEffect(() => {
        if (config) {
            applyConfig(config);
        }
    }, [config, applyConfig]);

    async function loadConfig() {
        try {
            setIsLoading(true);
            const data = await configService.getConfig();
            // console.log('>>> CONFIG LOADED FROM DB:', data);

            // Aseguramos que las llaves nuevas existan para que React las rastree
            const sanitized = {
                ...data,
                logo_variante_url: data.logo_variante_url || '',
                logo_footer_url: data.logo_footer_url || '',
                site_url: data.site_url || '',

            };

            setConfig(sanitized);
        } catch (error) {
            toast.error('Error', 'No se pudo cargar la configuración global.');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        if (!config) return;
        try {
            setIsSaving(true);
            // Creamos una copia local para asegurar que enviamos lo que el usuario ve
            const payload = { ...config };
            // console.log('>>> ENVIANDO A GUARDAR:', payload);

            const updated = await configService.updateConfig(payload);

            // Si llegamos aquí, la DB aceptó el cambio
            setConfig(updated);
            await applyConfig(updated);
            toast.success('¡Guardado!', 'La configuración global se ha actualizado correctamente.');
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error('Error de Guardado', error.message || 'Hubo un problema al guardar los cambios.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleReset() {
        if (!window.confirm('¿Estás seguro de que deseas restaurar los valores por defecto?')) return;
        try {
            setIsSaving(true);
            await configService.resetToDefaults();
            await loadConfig();
            await applyConfig(); // Volver a los defaults en la pestaña
            toast.success('Restaurado', 'Se han restablecido los valores por defecto.');
        } catch (error) {
            toast.error('Error', 'No se pudieron restaurar los valores.');
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) return <div className="flex justify-center p-24"><Spinner size="lg" /></div>;

    const tabs = [
        { id: 'seo', label: 'SEO & Metadatos', icon: Search },
        { id: 'branding', label: 'Branding & Diseño', icon: Palette },
        { id: 'tracking', label: 'Tracking & Scripts', icon: Code },
        { id: 'info', label: 'Información Base', icon: Info },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Header Section - Same as Dashboard */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                        Administración Global
                    </h1>
                    <p style={{ marginTop: '8px', fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Gestiona la identidad visual, SEO y scripts estructurales de la plataforma.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={handleReset}
                        disabled={isSaving}
                        leftIcon={<RotateCcw size={16} />}
                    >
                        Restaurar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        isLoading={isSaving}
                        leftIcon={<Save size={16} />}
                    >
                        Guardar Cambios
                    </Button>
                </div>
            </div>


            {/* Navigation Tabs - Underline style inspired by User Settings */}
            <div
                style={{
                    display: 'flex',
                    gap: '32px',
                    borderBottom: '1px solid var(--border-color)',
                    padding: '0 4px',
                    width: '100%',
                    overflowX: 'auto'
                }}
                className="no-scrollbar"
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 0 16px 0',
                                borderBottom: `2px solid ${isActive ? 'var(--color-primary)' : 'transparent'}`,
                                color: isActive ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                fontSize: '14px',
                                fontWeight: isActive ? 600 : 500,
                                transition: 'all 200ms ease',
                                backgroundColor: 'transparent',
                                borderTop: 'none',
                                borderLeft: 'none',
                                borderRight: 'none',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                marginBottom: '-1px'
                            }}
                        >
                            <tab.icon size={18} style={{ opacity: isActive ? 1 : 0.7 }} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Main Content Areas - Replicating Dashboard Card Structure */}
            <div className="animate-in fade-in duration-500">
                {activeTab === 'seo' && config && (
                    <SectionSEO config={config} setConfig={setConfig} isDark={isDark} />
                )}
                {activeTab === 'branding' && config && (
                    <SectionBranding config={config} setConfig={setConfig} />
                )}
                {activeTab === 'tracking' && config && (
                    <SectionTracking config={config} setConfig={setConfig} />
                )}
                {activeTab === 'info' && config && (
                    <SectionInfo config={config} setConfig={setConfig} />
                )}
            </div>
        </div>
    );
}

function ClearButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                color: 'var(--text-tertiary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-error)';
                e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-tertiary)';
                e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Limpiar campo"
            type="button"
        >
            <X size={16} />
        </button>
    );
}

function SectionSEO({ config, setConfig, isDark }: any) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card title="Meta Contenido">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <Input
                            label="Título Meta"
                            value={config.meta_title}
                            onChange={(e) => setConfig((prev: any) => ({ ...prev, meta_title: e.target.value }))}
                            placeholder="DropCost Master..."
                            helperText={`${config.meta_title?.length || 0}/60 caracteres`}
                            rightElement={config.meta_title ? <ClearButton onClick={() => setConfig((prev: any) => ({ ...prev, meta_title: '' }))} /> : null}
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[var(--text-primary)]">Descripción Meta</label>
                            <textarea
                                value={config.meta_description}
                                onChange={(e) => setConfig((prev: any) => ({ ...prev, meta_description: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '16px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    outline: 'none',
                                    minHeight: '120px',
                                    resize: 'none',
                                    transition: 'all 200ms ease'
                                }}
                                className="focus:ring-2 focus:ring-[var(--color-primary)] shadow-inner"
                                placeholder="..."
                            />
                            <p className="text-[11px] text-[var(--text-tertiary)] text-right px-1">
                                {config.meta_description?.length || 0}/160 caracteres
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <Input
                                label="URL del Sitio"
                                value={config.site_url}
                                onChange={(e) => setConfig((prev: any) => ({ ...prev, site_url: e.target.value }))}
                                placeholder="https://dropcostmaster.com"
                                leftIcon={<Globe size={16} />}
                                rightElement={config.site_url ? <ClearButton onClick={() => setConfig((prev: any) => ({ ...prev, site_url: '' }))} /> : null}
                            />

                        </div>

                        <Input
                            label="Palabras Clave"
                            value={config.meta_keywords}
                            onChange={(e) => setConfig((prev: any) => ({ ...prev, meta_keywords: e.target.value }))}
                            leftIcon={<Hash size={16} />}
                            rightElement={config.meta_keywords ? <ClearButton onClick={() => setConfig((prev: any) => ({ ...prev, meta_keywords: '' }))} /> : null}
                        />
                    </div>
                </Card>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Card title="Vista Previa de Búsqueda">
                        <div
                            style={{
                                padding: '32px',
                                borderRadius: '16px',
                                border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                                backgroundColor: isDark ? '#1a1c1e' : '#ffffff',
                                transition: 'all 200ms ease'
                            }}
                            className="shadow-sm"
                        >
                            <div className={`text-lg font-medium mb-2 truncate ${isDark ? 'text-[#8ab4f8]' : 'text-[#1a0dab]'}`}>
                                {config.meta_title || 'Título de ejemplo'}
                            </div>
                            <div className={`text-xs mb-2 truncate ${isDark ? 'text-[#34a853]' : 'text-[#006621]'}`}>
                                {config.site_url || 'https://dropcostmaster.com'}
                            </div>
                            <div className={`text-sm leading-relaxed ${isDark ? 'text-[#bdc1c6]' : 'text-[#4d5156]'} line-clamp-2`}>
                                {config.meta_description || 'Descripción ejemplo...'}
                            </div>
                        </div>
                    </Card>

                    <Card title="Configuración de Robots">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px' }}>
                            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all">
                                <div>
                                    <p className="text-sm font-bold text-[var(--text-primary)]">Permitir Indexación (Index)</p>
                                    <p className="text-[11px] text-[var(--text-secondary)]">Indica a los buscadores si pueden mostrar tu sitio.</p>
                                </div>
                                <Toggle
                                    checked={config.permitir_indexacion}
                                    onChange={(checked) => setConfig((prev: any) => ({ ...prev, permitir_indexacion: checked }))}
                                />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all">
                                <div>
                                    <p className="text-sm font-bold text-[var(--text-primary)]">Seguir Enlaces (Follow)</p>
                                    <p className="text-[11px] text-[var(--text-secondary)]">Indica si los buscadores deben rastrear los links internos.</p>
                                </div>
                                <Toggle
                                    checked={config.permitir_seguimiento}
                                    onChange={(checked) => setConfig((prev: any) => ({ ...prev, permitir_seguimiento: checked }))}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card title="Social Media Image (OG:Image)">
                        <div className="space-y-4">
                            <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                                Imagen para redes sociales (1200x630px recomendado).
                            </p>
                            <AssetUploader
                                value={config.og_image_url}
                                onUpload={(url) => setConfig((prev: any) => ({ ...prev, og_image_url: url }))}
                                path="og-image.png"
                                layout="column"
                            />
                            {config.og_image_url && (
                                <div
                                    style={{ marginTop: '8px' }}
                                    className="aspect-video rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-tertiary)] shadow-sm w-full"
                                >
                                    <img src={config.og_image_url} alt="OG" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function SectionBranding({ config, setConfig }: any) {
    // Definición unificada de colores para la tabla
    const allColorGroups = [
        // MARCA & CORE
        {
            category: 'Identidad de Marca',
            colors: [
                { key: 'color_primary', label: 'Primario' },
                { key: 'color_primary_dark', label: 'P. Oscuro (hover)' },
                { key: 'color_primary_light', label: 'P. Claro (suave)' },
                { key: 'color_text_inverse', label: 'Texto Inverso' },
            ]
        },
        {
            category: 'Estados y Semántica',
            colors: [
                { key: 'color_success', label: 'Éxito' },
                { key: 'color_warning', label: 'Aviso' },
                { key: 'color_error', label: 'Error' },
                { key: 'color_neutral', label: 'Neutral' },
            ]
        },
        {
            category: 'Navegación (Sidebar)',
            colors: [
                { key: 'color_sidebar_bg', label: 'Fondo Sidebar' },
                { key: 'color_sidebar_text', label: 'Texto Sidebar' },
                { key: 'color_sidebar_active', label: 'Item Activo' },
            ]
        },
        {
            category: 'Administración',
            colors: [
                { key: 'color_admin_panel_link', label: 'Acceso Admin (App)' },
                { key: 'color_admin_sidebar_active', label: 'Activo Admin' },
                { key: 'color_admin_sidebar_return', label: 'Botón Retorno' },
            ]
        },
        // TEMA CLARO
        {
            category: 'Tema Claro: Fondos',
            colors: [
                { key: 'color_bg_primary', label: 'Fondo Principal' },
                { key: 'color_bg_secondary', label: 'Fondo Secundario' },
                { key: 'color_bg_tertiary', label: 'Fondo Terciario' },
                { key: 'color_card_bg', label: 'Fondo Tarjetas' },
                { key: 'color_card_border', label: 'Borde Tarjetas' },
            ]
        },
        {
            category: 'Tema Claro: Texto',
            colors: [
                { key: 'color_text_primary', label: 'Texto Principal' },
                { key: 'color_text_secondary', label: 'Texto Secundario' },
                { key: 'color_text_tertiary', label: 'Texto Terciario' },
            ]
        },
        {
            category: 'Tema Claro: Bordes',
            colors: [
                { key: 'color_border', label: 'Borde Base' },
                { key: 'color_border_hover', label: 'Borde Hover' },
            ]
        },
        // TEMA OSCURO
        {
            category: 'Tema Oscuro: Fondos',
            colors: [
                { key: 'dark_bg_primary', label: 'Fondo Principal (D)' },
                { key: 'dark_bg_secondary', label: 'Fondo Secundario (D)' },
                { key: 'dark_bg_tertiary', label: 'Fondo Terciario (D)' },
                { key: 'dark_card_bg', label: 'Fondo Tarjetas (D)' },
                { key: 'dark_card_border', label: 'Borde Tarjetas (D)' },
            ]
        },
        {
            category: 'Tema Oscuro: Texto',
            colors: [
                { key: 'dark_text_primary', label: 'Texto Principal (D)' },
                { key: 'dark_text_secondary', label: 'Texto Secundario (D)' },
                { key: 'dark_text_tertiary', label: 'Texto Terciario (D)' },
            ]
        },
        {
            category: 'Tema Oscuro: Bordes',
            colors: [
                { key: 'dark_border', label: 'Borde Base (D)' },
                { key: 'dark_border_hover', label: 'Borde Hover (D)' },
            ]
        }
    ];

    // Helpers para estilos de categoría
    const getCategoryBadgeStyle = (cat: string) => {
        if (cat.includes('Tema Claro')) return { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' };
        if (cat.includes('Tema Oscuro')) return { bg: '#1e293b', text: '#cbd5e1', border: '#334155' };
        if (cat.includes('Marca')) return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
        return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="Activos Visuales">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-[var(--text-primary)]">Logo Principal (Modo Claro)</label>
                            <AssetUploader
                                value={config.logo_principal_url}
                                onUpload={(url) => setConfig((prev: any) => ({ ...prev, logo_principal_url: url }))}
                                path="logo-principal.png"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-[var(--text-primary)]">Logo Variante (Modo Oscuro / Sidebar)</label>
                            <AssetUploader
                                value={config.logo_variante_url}
                                onUpload={(url) => setConfig((prev: any) => ({ ...prev, logo_variante_url: url }))}
                                path="logo-variante.png"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-[var(--text-primary)]">Favicon</label>
                            <AssetUploader
                                value={config.favicon_url}
                                onUpload={(url) => setConfig((prev: any) => ({ ...prev, favicon_url: url }))}
                                path="favicon.ico"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-[var(--text-primary)]">Logo Footer</label>
                            <AssetUploader
                                value={config.logo_footer_url}
                                onUpload={(url) => setConfig((prev: any) => ({ ...prev, logo_footer_url: url }))}
                                path="logo-footer.png"
                            />
                        </div>
                    </div>
                </Card>

                <Card title="Vista Previa Logos">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full items-center">
                        <div className="flex flex-col gap-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 text-center tracking-widest">Fondo Claro</span>
                            <div className="p-6 bg-white rounded-xl border border-slate-200 flex items-center justify-center min-h-[120px] shadow-sm">
                                {config.logo_principal_url ? <img src={config.logo_principal_url} alt="Light" className="max-h-12 object-contain" /> : <div className="text-slate-200 uppercase font-black italic">Logo Vacío</div>}
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <span className="text-[10px] uppercase font-bold text-slate-500 text-center tracking-widest">Fondo Oscuro</span>
                            <div className="p-6 bg-[#0f172a] rounded-xl border border-slate-800 flex items-center justify-center min-h-[120px] shadow-sm">
                                {config.logo_variante_url ? (
                                    <img src={config.logo_variante_url} alt="Dark" className="max-h-12 object-contain" />
                                ) : (
                                    <div className="text-slate-700 uppercase font-black italic">Logo Vacío</div>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
                    Administración de Colores
                </h3>
                <Card noPadding>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>Color</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Variable (Key)</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Código</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Categoría</th>
                                </tr>
                            </thead>
                            <tbody style={{ backgroundColor: 'var(--card-bg)' }}>
                                {allColorGroups.map(group => (
                                    group.colors.map((c: any) => {
                                        const style = getCategoryBadgeStyle(group.category);
                                        const currentColor = (config as any)[c.key] || '#000000';

                                        return (
                                            <tr
                                                key={c.key}
                                                style={{
                                                    borderBottom: '1px solid var(--border-color)',
                                                    transition: 'background-color 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                className="group"
                                            >
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div className="relative flex items-center justify-center w-10 h-10 group-hover:scale-110 transition-transform">
                                                        <input
                                                            type="color"
                                                            value={currentColor}
                                                            onChange={(e) => setConfig((prev: any) => ({ ...prev, [c.key]: e.target.value }))}
                                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                                        />
                                                        <div
                                                            className="w-8 h-8 rounded-lg shadow-sm border border-[var(--border-color)] ring-2 ring-transparent group-hover:ring-[var(--border-color)] transition-all"
                                                            style={{ backgroundColor: currentColor }}
                                                        />
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {c.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <span
                                                        className="inline-flex items-center justify-center font-mono text-[11px] rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] select-all hover:border-[var(--color-primary)] transition-colors cursor-copy"
                                                        style={{ padding: '6px 16px' }}
                                                        onClick={() => navigator.clipboard.writeText(c.key)}
                                                        title="Copiar variable"
                                                    >
                                                        {c.key}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <span className="text-xs font-mono text-[var(--text-secondary)] uppercase select-all font-medium">
                                                        {currentColor}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                    <span
                                                        className="inline-flex items-center rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm"
                                                        style={{
                                                            backgroundColor: style.bg,
                                                            color: style.text,
                                                            border: `1px solid ${style.border}`,
                                                            minWidth: '100px',
                                                            justifyContent: 'center',
                                                            padding: '6px 14px'
                                                        }}
                                                    >
                                                        {group.category}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px 20px',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '12px',
                            marginTop: '24px',
                            border: '1px dashed var(--border-color)'
                        }}
                    >
                        <AlertCircle size={16} className="text-[var(--text-tertiary)]" />
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                            Estos valores se sincronizan automáticamente con las variables CSS del sistema (<code>:root</code>). Los cambios se reflejarán instantáneamente en la vista previa, pero requieren "Guardar" para persistir.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function SectionTracking({ config, setConfig }: any) {
    const toast = useToast();

    /**
     * Formatea el código (HTML/JS) con indentación simple
     */
    const formatCode = (key: 'codigo_head' | 'codigo_footer') => {
        const code = config[key];
        if (!code) return;

        try {
            let formatted = '';
            let pad = 0;
            const lines = code
                .replace(/>\s*</g, '>\n<') // Romper líneas entre etiquetas
                .split('\n');

            lines.forEach((line: string) => {
                let indent = 0;
                const trimmed = line.trim();
                if (!trimmed) return;

                // Disminuir indentación si es etiqueta de cierre
                if (trimmed.match(/^<\//)) {
                    pad = Math.max(0, pad - 1);
                }

                indent = pad;

                // Aumentar indentación si es etiqueta de apertura pero no autocierre
                if (trimmed.match(/^<[^/].*[^/]>|(?=<!)/) && !trimmed.match(/\/>$/) && !trimmed.match(/^<.*>.*<\/.*>$/)) {
                    pad += 1;
                }

                formatted += '  '.repeat(indent) + trimmed + '\n';
            });

            setConfig((prev: any) => ({ ...prev, [key]: formatted.trim() }));
            toast.success('Formato aplicado', 'El código se ha reordenado correctamente.');
        } catch (error) {
            console.error('Error formatting code:', error);
            toast.error('Error', 'No se pudo formatear el código.');
        }
    };

    const FormatButton = ({ onClick }: { onClick: () => void }) => (
        <button
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                transition: 'all 200ms ease'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.color = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
            title="Auto-formatear código"
        >
            <AlignLeft size={16} />
        </button>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <Card
                title="Inyección en HEAD"
                description="Ideal para Píxeles, Tag Manager y Analytics."
                headerAction={<FormatButton onClick={() => formatCode('codigo_head')} />}
            >
                <div className="space-y-4">
                    <CodeEditor
                        value={config.codigo_head || ''}
                        onChange={(val) => setConfig((prev: any) => ({ ...prev, codigo_head: val }))}
                        language="html"
                        placeholder="<!-- Meta Pixel -->"
                        minHeight="260px"
                    />
                </div>
            </Card>

            <Card
                title="Inyección en FOOTER"
                description="Ideal para Widgets de Chat y scripts de carga diferida."
                headerAction={<FormatButton onClick={() => formatCode('codigo_footer')} />}
            >
                <div className="space-y-4">
                    <CodeEditor
                        value={config.codigo_footer || ''}
                        onChange={(val) => setConfig((prev: any) => ({ ...prev, codigo_footer: val }))}
                        language="html"
                        placeholder="<script>...</script>"
                        minHeight="220px"
                    />
                </div>
            </Card>
        </div>
    );
}

function SectionInfo({ config, setConfig }: any) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="Datos de Contacto">
                    <div className="grid grid-cols-1 gap-6">
                        <Input
                            label="Nombre de la Empresa"
                            value={config.nombre_empresa}
                            onChange={(e) => setConfig((prev: any) => ({ ...prev, nombre_empresa: e.target.value }))}
                            leftIcon={<Building2 size={16} />}
                            rightElement={config.nombre_empresa ? <ClearButton onClick={() => setConfig((prev: any) => ({ ...prev, nombre_empresa: '' }))} /> : null}
                        />
                        <Input
                            label="Email Soporte"
                            value={config.email_contacto}
                            onChange={(e) => setConfig((prev: any) => ({ ...prev, email_contacto: e.target.value }))}
                            leftIcon={<Mail size={16} />}
                            rightElement={config.email_contacto ? <ClearButton onClick={() => setConfig((prev: any) => ({ ...prev, email_contacto: '' }))} /> : null}
                        />
                        <Input
                            label="Línea Teléfono/Whatsapp"
                            value={config.telefono}
                            onChange={(e) => setConfig((prev: any) => ({ ...prev, telefono: e.target.value }))}
                            leftIcon={<Phone size={16} />}
                            rightElement={config.telefono ? <ClearButton onClick={() => setConfig((prev: any) => ({ ...prev, telefono: '' }))} /> : null}
                        />
                    </div>
                </Card>

                <Card title="Redes Sociales">
                    <div className="grid grid-cols-1 gap-6">
                        <Input
                            label="Instagram"
                            value={config.instagram_url}
                            onChange={(e) => setConfig((prev: any) => ({ ...prev, instagram_url: e.target.value }))}
                            placeholder="https://..."
                            leftIcon={<Instagram size={16} />}
                            rightElement={config.instagram_url ? <ClearButton onClick={() => setConfig((prev: any) => ({ ...prev, instagram_url: '' }))} /> : null}
                        />
                        <Input
                            label="LinkedIn"
                            value={config.linkedin_url}
                            onChange={(e) => setConfig((prev: any) => ({ ...prev, linkedin_url: e.target.value }))}
                            placeholder="https://..."
                            leftIcon={<Linkedin size={16} />}
                            rightElement={config.linkedin_url ? <ClearButton onClick={() => setConfig((prev: any) => ({ ...prev, linkedin_url: '' }))} /> : null}
                        />
                        <Input
                            label="YouTube"
                            value={config.youtube_url}
                            onChange={(e) => setConfig((prev: any) => ({ ...prev, youtube_url: e.target.value }))}
                            placeholder="https://..."
                            leftIcon={<Youtube size={16} />}
                            rightElement={config.youtube_url ? <ClearButton onClick={() => setConfig((prev: any) => ({ ...prev, youtube_url: '' }))} /> : null}
                        />
                    </div>
                </Card>
            </div>

            <Card title="Recursos Legales">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input
                        label="Términos y Condiciones"
                        value={config.terminos_condiciones_url}
                        onChange={(e) => setConfig((prev: any) => ({ ...prev, terminos_condiciones_url: e.target.value }))}
                        placeholder="https://..."
                        leftIcon={<FileText size={16} />}
                        rightElement={config.terminos_condiciones_url ? <ClearButton onClick={() => setConfig((prev: any) => ({ ...prev, terminos_condiciones_url: '' }))} /> : null}
                    />
                    <Input
                        label="Política de Privacidad"
                        value={config.politica_privacidad_url}
                        onChange={(e) => setConfig((prev: any) => ({ ...prev, politica_privacidad_url: e.target.value }))}
                        placeholder="https://..."
                        leftIcon={<Shield size={16} />}
                        rightElement={config.politica_privacidad_url ? <ClearButton onClick={() => setConfig((prev: any) => ({ ...prev, politica_privacidad_url: '' }))} /> : null}
                    />
                </div>
            </Card>
        </div>
    );
}

function AssetUploader({
    value,
    onUpload,
    path,
    accept = ".png,.jpg,.jpeg,.svg,.webp,.ico",
    layout = 'row'
}: {
    value: string,
    onUpload: (url: string) => void,
    path: string,
    accept?: string,
    layout?: 'row' | 'column'
}) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tamaño (ej. 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Archivo muy grande', 'El tamaño máximo permitido es 2MB.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        try {
            setIsUploading(true);
            const url = await storageService.uploadBrandingFile(file, path);
            onUpload(url);
            toast.success('¡Completado!', 'El archivo se ha subido correctamente.');
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('Error de subida', 'No se pudo subir el archivo. Asegúrate de que el bucket "branding" existe y es público en Supabase.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    const clearButton = value ? (
        <ClearButton onClick={() => onUpload('')} />
    ) : null;

    return (
        <div style={{ display: 'flex', flexDirection: layout === 'column' ? 'column' : 'row', alignItems: layout === 'column' ? 'stretch' : 'center', gap: '12px', width: '100%' }}>
            <div style={{ flex: 1 }}>
                <Input
                    value={value || ''}
                    onChange={(e) => onUpload(e.target.value)}
                    placeholder="https://..."
                    leftIcon={<Globe size={16} />}
                    rightElement={clearButton}
                />
            </div>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept={accept}
                onChange={handleFileChange}
                disabled={isUploading}
            />

            <div style={{ width: layout === 'column' ? '100%' : 'auto' }}>
                <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    isLoading={isUploading}
                    leftIcon={<Upload size={16} />}
                    className={layout === 'column' ? 'w-full' : ''}
                    style={layout === 'column' ? { width: '100%', justifyContent: 'center' } : {}}
                >
                    Subir
                </Button>
            </div>
        </div>
    );
}
