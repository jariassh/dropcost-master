import React from 'react';
import { Card, Input, Button, PageHeader, Select } from '@/components/common';
import { Palette, Save, RotateCcw, Type, Layout, AlertCircle } from 'lucide-react';
import { useAdminSettings } from '../AdminSettingsContext';
import { AssetUploader, ClearButton, UnitInput } from './SettingsHelpers';

type SelectOption = { value: string; label: string; details?: string };

const GOOGLE_FONT_OPTIONS: SelectOption[] = [
    { value: 'Poppins', label: 'Poppins', details: 'Sans Serif - Moderno y limpio' },
    { value: 'Inter', label: 'Inter', details: 'Sans Serif - Optimizado para UI' },
    { value: 'Lora', label: 'Lora', details: 'Serif - Contemporáneo' },
    { value: 'JetBrains Mono', label: 'JetBrains Mono', details: 'Monospace - Técnico y legible' },
    { value: 'Roboto', label: 'Roboto', details: 'Sans Serif - Estándar y legible' },
    { value: 'Montserrat', label: 'Montserrat', details: 'Sans Serif - Elegante y geométrico' },
    { value: 'Bebas Neue', label: 'Bebas Neue', details: 'Display - Impactante (Mayúsculas)' },
    { value: 'Oswald', label: 'Oswald', details: 'Sans Serif - Condensado y fuerte' },
    { value: 'Lato', label: 'Lato', details: 'Sans Serif - Amigable y equilibrado' },
    { value: 'Open Sans', label: 'Open Sans', details: 'Sans Serif - Versátil' },
    { value: 'Playfair Display', label: 'Playfair Display', details: 'Serif - Clásico y lujoso' },
    { value: 'Merriweather', label: 'Merriweather', details: 'Serif - Alta legibilidad' },
    { value: 'Raleway', label: 'Raleway', details: 'Sans Serif - Estilizado' },
    { value: 'Nunito', label: 'Nunito', details: 'Sans Serif - Redondeado y suave' },
    { value: 'Ubuntu', label: 'Ubuntu', details: 'Sans Serif - Distintivo' },
    { value: 'Quicksand', label: 'Quicksand', details: 'Sans Serif - Muy redondeado' },
    { value: 'Work Sans', label: 'Work Sans', details: 'Sans Serif - Profesional' },
    { value: 'Fira Sans', label: 'Fira Sans', details: 'Sans Serif - Técnico' },
    { value: 'Kanit', label: 'Kanit', details: 'Sans Serif - Moderno Thai' },
    { value: 'Rubik', label: 'Rubik', details: 'Sans Serif - Amigable' },
    { value: 'Anton', label: 'Anton', details: 'Display - Muy grueso' }
];

export function BrandingSectionPage() {
    const { config, setConfig, isSaving, handleSave, handleReset } = useAdminSettings();

    if (!config) return null;

    // Definición unificada de colores para la tabla
    const allColorGroups = [
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

    const getCategoryBadgeStyle = (cat: string) => {
        if (cat.includes('Tema Claro')) return { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' };
        if (cat.includes('Tema Oscuro')) return { bg: '#1e293b', text: '#cbd5e1', border: '#334155' };
        if (cat.includes('Marca')) return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
        return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' };
    };

    const actionButtons = (
        <div className="dc-branding-actions" style={{ display: 'flex', gap: '12px' }}>
            <Button
                variant="secondary"
                onClick={handleReset}
                disabled={isSaving}
                leftIcon={<RotateCcw size={16} />}
            >
                Descartar cambios
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
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', paddingBottom: '60px' }}>
            <PageHeader
                title="Branding & Diseño"
                description="Administra la identidad visual, tipografías y paleta de colores."
                icon={Palette}
                actions={actionButtons}
            />

            {/* Activos Visuales + Vista Previa */}
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
                                accept=".ico,.png,.svg"
                            />
                        </div>
                    </div>
                </Card>

                <Card title="Vista Previa de Logos">
                    <div className="grid grid-cols-2 gap-6 items-center">
                        <div className="flex flex-col gap-3">
                            <span className="text-[10px] uppercase font-bold text-slate-500 text-center tracking-widest">Fondo Claro</span>
                            <div className="p-6 bg-white rounded-xl border border-slate-200 flex items-center justify-center min-h-[120px] shadow-sm">
                                {config.logo_principal_url ? (
                                    <img src={config.logo_principal_url} alt="Light" className="max-h-12 object-contain" />
                                ) : (
                                    <div className="text-slate-300 uppercase font-black italic">Logo Vacío</div>
                                )}
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

            {/* Tipografía y Tamaños */}
            <Card title="Tipografía y Tamaños">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div className="space-y-6">
                            <h4 className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-body)', textTransform: 'none' }}>
                                <Type size={16} className="text-[var(--color-primary)]" /> Familias de Fuente
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Select
                                    label="Fuente Primaria (Cuerpo/Lectura)"
                                    options={GOOGLE_FONT_OPTIONS}
                                    value={config.font_family_primary || ''}
                                    onChange={(val) => setConfig((prev: any) => ({ ...prev, font_family_primary: val }))}
                                    placeholder="Seleccionar fuente..."
                                />
                                <Select
                                    label="Fuente Secundaria (Encabezados)"
                                    options={GOOGLE_FONT_OPTIONS}
                                    value={config.font_family_secondary || ''}
                                    onChange={(val) => setConfig((prev: any) => ({ ...prev, font_family_secondary: val }))}
                                    placeholder="Seleccionar fuente..."
                                />
                                <Select
                                    label="Fuente Accent (Citas/Destacados)"
                                    options={GOOGLE_FONT_OPTIONS}
                                    value={config.font_family_accent || ''}
                                    onChange={(val) => setConfig((prev: any) => ({ ...prev, font_family_accent: val }))}
                                    placeholder="Seleccionar fuente..."
                                />
                                <Select
                                    label="Fuente Mono (Código/Técnico)"
                                    options={GOOGLE_FONT_OPTIONS}
                                    value={config.font_family_mono || ''}
                                    onChange={(val) => setConfig((prev: any) => ({ ...prev, font_family_mono: val }))}
                                    placeholder="Seleccionar fuente..."
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-sm font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-body)', textTransform: 'none' }}>
                                <Layout size={16} className="text-[var(--color-primary)]" /> Escala de Tamaños
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <UnitInput label="Base (Body)" value={config.font_size_base || ''} onChange={(val) => setConfig((prev: any) => ({ ...prev, font_size_base: val }))} />
                                <UnitInput label="Título H1" value={config.font_size_h1 || ''} onChange={(val) => setConfig((prev: any) => ({ ...prev, font_size_h1: val }))} />
                                <UnitInput label="Título H2" value={config.font_size_h2 || ''} onChange={(val) => setConfig((prev: any) => ({ ...prev, font_size_h2: val }))} />
                                <UnitInput label="Título H3" value={config.font_size_h3 || ''} onChange={(val) => setConfig((prev: any) => ({ ...prev, font_size_h3: val }))} />
                                <UnitInput label="Pequeño (Label)" value={config.font_size_small || ''} onChange={(val) => setConfig((prev: any) => ({ ...prev, font_size_small: val }))} />
                                <UnitInput label="Diminuto (Cap)" value={config.font_size_tiny || ''} onChange={(val) => setConfig((prev: any) => ({ ...prev, font_size_tiny: val }))} />
                                <UnitInput label="Interletrado (H)" value={config.font_letter_spacing_h || ''} onChange={(val) => setConfig((prev: any) => ({ ...prev, font_letter_spacing_h: val }))} />
                                <UnitInput label="Line Height (B)" value={config.font_line_height_base || ''} onChange={(val) => setConfig((prev: any) => ({ ...prev, font_line_height_base: val }))} helperText="Cuerpo" />
                                <UnitInput label="Line Height (H)" value={config.font_line_height_headings || ''} onChange={(val) => setConfig((prev: any) => ({ ...prev, font_line_height_headings: val }))} helperText="Títulos" />
                                <UnitInput label="Line Height (S)" value={config.font_line_height_small || ''} onChange={(val) => setConfig((prev: any) => ({ ...prev, font_line_height_small: val }))} helperText="Labels" />
                                <UnitInput label="Line Height (M)" value={config.font_line_height_mono || ''} onChange={(val) => setConfig((prev: any) => ({ ...prev, font_line_height_mono: val }))} helperText="Código" />
                                <UnitInput label="Interletrado (L)" value={config.font_letter_spacing_labels || ''} onChange={(val) => setConfig((prev: any) => ({ ...prev, font_letter_spacing_labels: val }))} helperText="Labels/Tiny" />
                            </div>
                        </div>
                    </div>

                    {/* Vista Previa Premium */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h4 className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em] mb-2">Vista Previa Premium</h4>
                        <div
                            style={{
                                padding: '40px',
                                borderRadius: '24px',
                                background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '24px',
                                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.05)'
                            }}
                        >
                            <div className="space-y-4">
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: config.font_size_tiny, color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Categoría Destacada
                                </span>
                                <h1 style={{ fontFamily: 'var(--font-headings)', fontSize: config.font_size_h1, margin: 0, lineHeight: config.font_line_height_headings || '1.25', color: 'var(--text-primary)', fontWeight: 600, textTransform: (config.font_family_secondary === 'Bebas Neue' || config.font_family_secondary === 'Anton') ? 'uppercase' : 'none', letterSpacing: config.font_letter_spacing_h }}>
                                    Domina tu Costeo con Precisión
                                </h1>
                                <h3 style={{ fontFamily: 'var(--font-headings)', fontSize: config.font_size_h3, margin: 0, color: 'var(--text-secondary)', fontWeight: 600, lineHeight: config.font_line_height_headings || '1.25', letterSpacing: config.font_letter_spacing_h }}>
                                    La herramienta definitiva para Dropshippers
                                </h3>
                            </div>

                            <p style={{ fontFamily: 'var(--font-body)', fontSize: config.font_size_base, margin: 0, lineHeight: config.font_line_height_base || 1.6, color: 'var(--text-secondary)', maxWidth: '90%' }}>
                                Optimiza tus márgenes y escala tu negocio con datos reales en tiempo real.
                                DropCost Master te permite visualizar cada centavo de tu operación.
                            </p>

                            <div style={{ fontFamily: config.font_family_accent || 'Lora', fontSize: '16px', fontStyle: 'italic', color: 'var(--text-primary)', borderLeft: '4px solid var(--color-primary)', paddingLeft: '16px' }}>
                                "Este sistema ha transformado la rentabilidad de mi tienda desde el primer día."
                            </div>

                            <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.2)', fontFamily: config.font_family_mono || 'JetBrains Mono', fontSize: '12px', color: 'var(--color-primary-light)', width: 'fit-content' }}>
                                GET /api/v1/profits/sync
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button style={{ padding: '12px 24px', borderRadius: '12px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 600, fontSize: config.font_size_small, fontFamily: 'var(--font-body)' }}>
                                    Comenzar ahora
                                </button>
                                <button style={{ padding: '12px 24px', borderRadius: '12px', backgroundColor: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 600, fontSize: config.font_size_small, fontFamily: 'var(--font-body)' }}>
                                    Ver demo
                                </button>
                            </div>

                            <div className="flex justify-between items-center pt-8 border-t border-[var(--border-color)] opacity-60">
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: config.font_size_tiny, color: 'var(--text-tertiary)' }}>
                                    © 2026 DropCost Master
                                </span>
                                <div className="flex gap-4">
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: config.font_size_tiny, color: 'var(--text-tertiary)' }}>Privacidad</span>
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: config.font_size_tiny, color: 'var(--text-tertiary)' }}>Términos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Administración de Colores */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: 'var(--ls-h)', fontFamily: 'var(--font-headings)' }}>
                    Administración de Colores
                </h3>
                <Card noPadding>
                    <div style={{ overflowX: 'auto', overflowY: 'hidden', borderRadius: '16px' }}>
                        <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize', letterSpacing: '0.05em', width: '80px' }}>Color</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize', letterSpacing: '0.05em' }}>Nombre</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize', letterSpacing: '0.05em' }}>Variable (Key)</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize', letterSpacing: '0.05em' }}>Código</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize', letterSpacing: '0.05em', textAlign: 'right' }}>Categoría</th>
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
                                                style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s ease' }}
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
                </Card>
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px 20px',
                    marginTop: '16px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '12px',
                    border: '1px dashed var(--border-color)'
                }}
            >
                <AlertCircle size={16} className="text-[var(--text-tertiary)]" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    Estos valores se sincronizan automáticamente con las variables CSS del sistema (<code>:root</code>). Los cambios se reflejarán instantáneamente en la vista previa, pero requieren "Guardar" para persistir.
                </p>
            </div>

            <style>{`
                @media (max-width: 640px) {
                    .dc-branding-actions {
                        flex-direction: column !important;
                        width: 100%;
                    }
                    .dc-branding-actions button {
                        width: 100% !important;
                        justify-content: center !important;
                    }
                }
            `}</style>
        </div>
    );
}
