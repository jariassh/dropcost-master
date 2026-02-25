import { useEffect, useCallback } from 'react';
import { configService, GlobalConfig } from '@/services/configService';
import { useTheme } from './useTheme';

export function useGlobalConfig() {
    const { theme } = useTheme();

    const applyConfig = useCallback(async (customConfig?: GlobalConfig) => {
        try {
            const config = customConfig || await configService.getConfig();
            if (!config) return;

            // 1. Aplicar Colores (Variables CSS)
            const root = document.documentElement;
            const isDark = theme === 'dark';

            const setProp = (name: string, value?: string) => {
                if (value) root.style.setProperty(name, value);
                else root.style.removeProperty(name);
            };

            // Colores de marca
            setProp('--color-primary', config.color_primary);
            setProp('--color-primary-dark', config.color_primary_dark);
            setProp('--color-primary-light', config.color_primary_light);

            // Semánticos
            setProp('--color-success', config.color_success);
            setProp('--color-error', config.color_error);
            setProp('--color-warning', config.color_warning);
            setProp('--color-neutral', config.color_neutral);

            // Fondos y Textos (Dependientes del Tema)
            if (isDark) {
                setProp('--bg-primary', config.dark_bg_primary);
                setProp('--bg-secondary', config.dark_bg_secondary);
                setProp('--bg-tertiary', config.dark_bg_tertiary);
                setProp('--card-bg', config.dark_card_bg);
                setProp('--card-border', config.dark_card_border);
                setProp('--text-primary', config.dark_text_primary);
                setProp('--text-secondary', config.dark_text_secondary);
                setProp('--text-tertiary', config.dark_text_tertiary);
                setProp('--border-color', config.dark_border);
                setProp('--border-color-hover', config.dark_border_hover);
            } else {
                setProp('--bg-primary', config.color_bg_primary);
                setProp('--bg-secondary', config.color_bg_secondary);
                setProp('--bg-tertiary', config.color_bg_tertiary);
                setProp('--card-bg', config.color_card_bg);
                setProp('--card-border', config.color_card_border);
                setProp('--text-primary', config.color_text_primary);
                setProp('--text-secondary', config.color_text_secondary);
                setProp('--text-tertiary', config.color_text_tertiary);
                setProp('--border-color', config.color_border);
                setProp('--border-color-hover', config.color_border_hover);
            }

            // Texto Inverso
            setProp('--text-inverse', config.color_text_inverse);

            // Sidebar / Navegación
            setProp('--sidebar-bg', config.color_sidebar_bg);
            setProp('--sidebar-text', config.color_sidebar_text);
            setProp('--sidebar-active', config.color_sidebar_active);

            // Administración
            setProp('--color-admin-panel-link', config.color_admin_panel_link);
            setProp('--color-admin-sidebar-active', config.color_admin_sidebar_active);
            setProp('--color-admin-sidebar-return', config.color_admin_sidebar_return);

            // 2. Aplicar SEO (Metadatos)
            if (config.meta_title) document.title = config.meta_title;
            
            // Meta Description
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', config.meta_description || '');

            // Meta Keywords
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
                metaKeywords = document.createElement('meta');
                metaKeywords.setAttribute('name', 'keywords');
                document.head.appendChild(metaKeywords);
            }
            metaKeywords.setAttribute('content', config.meta_keywords || '');

            // Robots
            let metaRobots = document.querySelector('meta[name="robots"]');
            if (!metaRobots) {
                metaRobots = document.createElement('meta');
                metaRobots.setAttribute('name', 'robots');
                document.head.appendChild(metaRobots);
            }
            const robotsVal = `${config.permitir_indexacion ? 'index' : 'noindex'}, ${config.permitir_seguimiento ? 'follow' : 'nofollow'}`;
            metaRobots.setAttribute('content', robotsVal);

            // Favicon (Actualización táctica para forzar al navegador)
            if (config.favicon_url) {
                const head = document.head || document.getElementsByTagName('head')[0];
                
                // 1. Eliminar cualquier favicon existente (incluyendo el nuestro de index.html)
                const existingLinks = document.querySelectorAll("link[rel*='icon']");
                existingLinks.forEach(el => el.remove());

                // 2. Crear uno nuevo con un query param de tiempo para romper caché
                const newLink = document.createElement('link');
                newLink.id = 'dynamic-favicon';
                newLink.rel = 'icon';
                newLink.type = config.favicon_url.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon';
                
                // Añadir cache-buster
                const separator = config.favicon_url.includes('?') ? '&' : '?';
                newLink.href = `${config.favicon_url}${separator}t=${Date.now()}`;
                
                head.appendChild(newLink);
            }

            // 3. Inyectar Scripts de Tracking (HEAD)
            // ... (rest of injection logic stays same)
            // Note: to keep replacement simple and avoid context mess, I'll resume from the original injection code

            // 3. Inyectar Scripts de Tracking (HEAD)
            if (config.codigo_head) {
                const headContainerId = 'dc-tracking-head';
                let headContainer = document.getElementById(headContainerId);
                if (headContainer) headContainer.remove();
                
                headContainer = document.createElement('div');
                headContainer.id = headContainerId;
                headContainer.innerHTML = config.codigo_head;
                
                // Ejecutar scripts manualmente si es necesario (dangerouslySetInnerHTML no siempre los ejecuta)
                const scripts = headContainer.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                    document.head.appendChild(newScript);
                });
            }

            // 4. Inyectar Scripts de Tracking (FOOTER)
            if (config.codigo_footer) {
                const footerContainerId = 'dc-tracking-footer';
                let footerContainer = document.getElementById(footerContainerId);
                if (footerContainer) footerContainer.remove();
                
                footerContainer = document.createElement('div');
                footerContainer.id = footerContainerId;
                footerContainer.innerHTML = config.codigo_footer;
                
                const scripts = footerContainer.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                    document.body.appendChild(newScript);
                });
            }

        } catch (error) {
            console.error('Error applying global config:', error);
        }
    }, [theme]);

    useEffect(() => {
        applyConfig();
    }, [applyConfig, theme]);

    return { applyConfig };
}
