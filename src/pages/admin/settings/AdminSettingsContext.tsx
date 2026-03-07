import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/common';
import { configService, GlobalConfig } from '@/services/configService';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';

interface AdminSettingsContextType {
    config: GlobalConfig | null;
    setConfig: React.Dispatch<React.SetStateAction<GlobalConfig | null>>;
    isSaving: boolean;
    handleSave: () => Promise<void>;
    handleReset: () => void;
    isLoading: boolean;
}

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined);

export function AdminSettingsProvider({ children }: { children: React.ReactNode }) {
    const { config: remoteConfig, isLoading, applyConfig } = useGlobalConfig();
    const [config, setConfig] = useState<GlobalConfig | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();
    const queryClient = useQueryClient();

    // Sincronizar estado local con remoto al cargar o resetear
    useEffect(() => {
        if (remoteConfig) {
            setConfig(prev => {
                // Si el ID cambia o es la primera vez, reemplazamos todo
                // De lo contrario, mantenemos el estado local actual (para no perder cambios al navegar entre tabs)
                if (!prev || prev.id !== remoteConfig.id) {
                    return {
                        ...remoteConfig,
                        font_family_primary: remoteConfig.font_family_primary || 'Poppins',
                        font_family_secondary: remoteConfig.font_family_secondary || 'Inter',
                        font_family_accent: remoteConfig.font_family_accent || 'Lora',
                        font_family_mono: remoteConfig.font_family_mono || 'JetBrains Mono',
                        font_size_base: remoteConfig.font_size_base || '14px',
                        font_size_h1: remoteConfig.font_size_h1 || '36px',
                        font_size_h2: remoteConfig.font_size_h2 || '28px',
                        font_size_h3: remoteConfig.font_size_h3 || '20px',
                        font_size_h4: remoteConfig.font_size_h4 || '16px',
                        font_size_small: remoteConfig.font_size_small || '12px',
                        font_size_tiny: remoteConfig.font_size_tiny || '11px',
                        font_letter_spacing_h: remoteConfig.font_letter_spacing_h || '0px',
                        font_letter_spacing_labels: remoteConfig.font_letter_spacing_labels || '0.5px',
                        font_line_height_base: remoteConfig.font_line_height_base || '1.6',
                        font_line_height_headings: remoteConfig.font_line_height_headings || '1.25',
                        font_line_height_small: remoteConfig.font_line_height_small || '1.4',
                        font_line_height_mono: remoteConfig.font_line_height_mono || '1.5',
                    } as GlobalConfig;
                }
                return prev;
            });
        }
    }, [remoteConfig]);

    // Vista previa en tiempo real
    useEffect(() => {
        if (config) {
            applyConfig(config);
        }
    }, [config, applyConfig]);

    async function handleSave() {
        if (!config) return;
        try {
            setIsSaving(true);
            const updated = await configService.updateConfig(config);
            queryClient.invalidateQueries({ queryKey: ['globalConfig'] });
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

    function handleReset() {
        if (!window.confirm('¿Estás seguro de que deseas descartar los cambios no guardados?')) return;
        if (remoteConfig) {
            setConfig({ ...remoteConfig });
            toast.success('Cambios descartados', 'Se han restaurado los últimos valores guardados.');
        }
    }

    return (
        <AdminSettingsContext.Provider value={{ config, setConfig, isSaving, handleSave, handleReset, isLoading }}>
            {children}
        </AdminSettingsContext.Provider>
    );
}

export function useAdminSettings() {
    const context = useContext(AdminSettingsContext);
    if (!context) {
        throw new Error('useAdminSettings must be used within an AdminSettingsProvider');
    }
    return context;
}
