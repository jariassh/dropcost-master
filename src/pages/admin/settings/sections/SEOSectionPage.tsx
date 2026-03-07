import React from 'react';
import { Card, Input, Toggle, Button, PageHeader } from '@/components/common';
import { Search, Save, RotateCcw, Globe, Hash, Building2, Mail, Phone, Instagram, Linkedin, Youtube, FileText, Shield } from 'lucide-react';
import { useAdminSettings } from '../AdminSettingsContext';
import { useTheme } from '@/hooks/useTheme';
import { AssetUploader, ClearButton } from './SettingsHelpers';

export function SEOSectionPage() {
    const { config, setConfig, isSaving, handleSave, handleReset } = useAdminSettings();
    const { isDark } = useTheme();

    if (!config) return null;

    const actionButtons = (
        <div className="dc-seo-actions" style={{ display: 'flex', gap: '12px' }}>
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
                title="SEO & Metadatos"
                description="Gestión de visibilidad y presencia en buscadores."
                icon={Search}
                actions={actionButtons}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Columna Izquierda */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Card title="Contenido Meta">
                        <div className="grid grid-cols-1 gap-6">
                            <Input
                                label="Título del Sitio (Meta Title)"
                                value={config.meta_title}
                                onChange={(e) => setConfig((prev: any) => ({ ...prev, meta_title: e.target.value }))}
                                placeholder="Nombre de tu marca..."
                                rightElement={config.meta_title ? <ClearButton onClick={() => setConfig((prev: any) => ({ ...prev, meta_title: '' }))} /> : null}
                                helperText="Recomendado: 50-60 caracteres."
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[var(--text-primary)]">Descripción (Meta Description)</label>
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
                                        resize: 'none'
                                    }}
                                    placeholder="Describe tu negocio..."
                                />
                                <p className="text-[11px] text-[var(--text-tertiary)]">Recomendado: 150-160 caracteres.</p>
                            </div>

                            <Input
                                label="URL del Sitio"
                                value={config.site_url}
                                onChange={(e) => setConfig((prev: any) => ({ ...prev, site_url: e.target.value }))}
                                placeholder="https://tu-dominio.com"
                                leftIcon={<Globe size={16} />}
                                rightElement={config.site_url ? <ClearButton onClick={() => setConfig((prev: any) => ({ ...prev, site_url: '' }))} /> : null}
                            />
                            <Input
                                label="Keywords"
                                value={config.meta_keywords}
                                onChange={(e) => setConfig((prev: any) => ({ ...prev, meta_keywords: e.target.value }))}
                                leftIcon={<Hash size={16} />}
                                rightElement={config.meta_keywords ? <ClearButton onClick={() => setConfig((prev: any) => ({ ...prev, meta_keywords: '' }))} /> : null}
                            />
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
                </div>

                {/* Columna Derecha */}
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

                    <Card title="Social Media Image (OG:Image)">
                        <div className="space-y-4">
                            <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                                Imagen para redes sociales (1200x630px recomendado).
                            </p>
                            <AssetUploader
                                value={config.og_image_url}
                                onUpload={(url) => setConfig((prev: any) => ({ ...prev, og_image_url: url }))}
                                path="og-image.png"
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

            {/* Información Base */}
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

            <style>{`
                @media (max-width: 640px) {
                    .dc-seo-actions {
                        flex-direction: column !important;
                        width: 100%;
                    }
                    .dc-seo-actions button {
                        width: 100% !important;
                        justify-content: center !important;
                    }
                }
            `}</style>
        </div>
    );
}
