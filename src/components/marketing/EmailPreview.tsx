import React from 'react';
import { Mail, Smartphone, Zap, CheckCircle2, ChevronDown, Layout, Type, Tag, Eye } from 'lucide-react';
// @ts-ignore
import * as mjmlModule from 'mjml-browser';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';
import { useAuthStore } from '@/store/authStore';

const mjml2html = (mjmlModule as any).default || mjmlModule;

interface EmailPreviewProps {
    template: {
        name?: string;
        subject?: string;
        html_content?: string;
        mjml_content?: string;
        sender_name?: string;
        sender_prefix?: string;
        variables?: string[];
    };
    device?: 'mobile' | 'tablet' | 'pc';
    showMockHeader?: boolean;
}

const deviceWidths = {
    mobile: '375px',
    tablet: '768px',
    pc: '100%|max-w-[1000px]'
};

export const EmailPreview: React.FC<EmailPreviewProps> = ({
    template,
    device = 'pc',
    showMockHeader = true
}) => {
    const { config: globalConfig } = useGlobalConfig();
    const { user } = useAuthStore();

    const renderPreview = (content: string) => {
        if (!content) return '';
        let rendered = content;

        const fmtDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;

        const fallbacks: Record<string, string> = {
            color_primary: globalConfig?.color_primary || '#0066FF',
            color_primary_dark: globalConfig?.color_primary_dark || '#0052cc',
            color_primary_light: globalConfig?.color_primary_light || '#e6f0ff',
            color_success: globalConfig?.color_success || '#10B981',
            color_warning: globalConfig?.color_warning || '#F59E0B',
            color_error: globalConfig?.color_error || '#EF4444',
            color_neutral: globalConfig?.color_neutral || '#6B7280',
            app_url: (globalConfig as any)?.site_url || window.location.origin,
            empresa: globalConfig?.nombre_empresa || 'DropCost Master',
            nombres: user?.nombres || 'Usuario',
            apellidos: user?.apellidos || 'Ejemplo',
            email: user?.email || 'usuario@ejemplo.com',
            fecha_actualizacion: fmtDate(new Date()),
            codigo_2fa: '123456',
            "2fa_code": '123456',
            expira_en: '05 Minutos'
        };

        Object.entries(fallbacks).forEach(([key, val]) => {
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
            rendered = rendered.replace(regex, val);
        });

        return rendered;
    };

    const getProcessedHtml = () => {
        if (!template) return '';

        let contentToRender = template.mjml_content
            ? renderPreview(template.mjml_content)
            : renderPreview(template.html_content || '');

        if (template.mjml_content) {
            try {
                const { html } = mjml2html(contentToRender, { validationLevel: 'skip' });
                contentToRender = html;
            } catch (e) {
                console.error('MJML Preview Error:', e);
            }
        }

        return contentToRender;
    };

    const dw = device === 'pc' ? '1000px' : deviceWidths[device];

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-tertiary)',
            padding: device === 'mobile' ? '0' : '20px',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            height: '75vh',
            overflow: 'hidden',
            width: '100%'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                maxWidth: dw,
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden',
                height: '100%',
                transition: 'max-width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                margin: '0 auto'
            }}>
                {showMockHeader && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '20px 24px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Previsualización</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff5f56' }}></div>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27c93f' }}></div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, minWidth: '50px', paddingTop: '1px' }}>De:</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>
                                        {template.sender_name || globalConfig?.nombre_empresa || 'DropCost'}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                                        {template.sender_prefix || 'contacto'}@{(globalConfig as any)?.email_domain || 'dropcost.com'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, minWidth: '50px', paddingTop: '1px' }}>Asunto:</span>
                                <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600, lineHeight: '1.4' }}>{renderPreview(template.subject || '(Sin Asunto)')}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div
                    style={{
                        padding: device === 'mobile' ? '10px' : '0',
                        backgroundColor: '#ffffff',
                        flex: 1,
                        overflow: 'hidden'
                    }}
                >
                    <iframe
                        srcDoc={getProcessedHtml()}
                        title="Email Content"
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            display: 'block',
                            backgroundColor: '#fff'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
