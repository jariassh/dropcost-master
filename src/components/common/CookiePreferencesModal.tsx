import React, { useState, useEffect } from 'react';
import { cookieService, CookiePreferences } from '@/services/cookieService';
import { Modal } from '@/components/common/Modal';
import { Shield, ChevronRight, Check } from 'lucide-react';

export function CookiePreferencesModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [prefs, setPrefs] = useState<Partial<CookiePreferences>>({
        analisis: false,
        marketing: false
    });

    useEffect(() => {
        const handleOpen = () => {
            const current = cookieService.getPreferences() || { analisis: false, marketing: false };
            setPrefs(current);
            setIsOpen(true);
        };
        window.addEventListener('openCookieSettings', handleOpen);
        return () => window.removeEventListener('openCookieSettings', handleOpen);
    }, []);

    const handleSave = () => {
        cookieService.setPreferences(prefs);
        setIsOpen(false);
        // Recargar banner si es necesario o simplemente cerrar
        window.location.reload(); // Recargar para aplicar cambios de scripts
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title="Preferencias de Privacidad"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    En DropCost Master respetamos tu privacidad. Puedes elegir qué tipos de cookies permites.
                    Las cookies necesarias son imprescindibles para que el sitio funcione.
                </p>

                <PreferenceItem
                    title="Cookies Necesarias"
                    description="Esenciales para el inicio de sesión, seguridad y funciones básicas."
                    checked={true}
                    disabled={true}
                />

                <PreferenceItem
                    title="Cookies de Análisis"
                    description="Nos ayudan a entender cómo interactúas con el sitio para mejorar la velocidad y el contenido."
                    checked={prefs.analisis || false}
                    onChange={(val) => setPrefs(prev => ({ ...prev, analisis: val }))}
                />

                <PreferenceItem
                    title="Cookies de Marketing"
                    description="Permiten mostrarte anuncios relevantes y medir la eficacia de nuestras campañas."
                    checked={prefs.marketing || false}
                    onChange={(val) => setPrefs(prev => ({ ...prev, marketing: val }))}
                />

                <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: 'transparent',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-md)'
                        }}
                    >
                        Guardar Preferencias
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function PreferenceItem({ title, description, checked, disabled = false, onChange }: {
    title: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onChange?: (val: boolean) => void;
}) {
    return (
        <div
            style={{
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: checked ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                opacity: disabled ? 0.8 : 1,
                cursor: disabled ? 'default' : 'pointer'
            }}
            onClick={() => !disabled && onChange && onChange(!checked)}
        >
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>{title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{description}</div>
            </div>
            <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                border: '2px solid ' + (checked ? 'var(--color-primary)' : 'var(--border-color)'),
                backgroundColor: checked ? 'var(--color-primary)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
            }}>
                {checked && <Check size={16} />}
            </div>
        </div>
    );
}
