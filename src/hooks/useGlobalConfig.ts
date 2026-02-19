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

            // Colores de marca (Suelen ser los mismos para ambos temas o el usuario los ajusta)
            if (config.color_primary) root.style.setProperty('--color-primary', config.color_primary);
            if (config.color_primary_dark) root.style.setProperty('--color-primary-dark', config.color_primary_dark);
            if (config.color_primary_light) root.style.setProperty('--color-primary-light', config.color_primary_light);

            // Semánticos
            if (config.color_success) root.style.setProperty('--color-success', config.color_success);
            if (config.color_error) root.style.setProperty('--color-error', config.color_error);
            if (config.color_warning) root.style.setProperty('--color-warning', config.color_warning);
            if (config.color_neutral) root.style.setProperty('--color-neutral', config.color_neutral);

            // Fondos y Textos (Dependientes del Tema)
            if (isDark) {
                // MODO OSCURO: Usar variables dark_
                if (config.dark_bg_primary) root.style.setProperty('--bg-primary', config.dark_bg_primary);
                if (config.dark_bg_secondary) root.style.setProperty('--bg-secondary', config.dark_bg_secondary);
                if (config.dark_bg_tertiary) root.style.setProperty('--bg-tertiary', config.dark_bg_tertiary);
                if (config.dark_card_bg) root.style.setProperty('--card-bg', config.dark_card_bg);
                if (config.dark_card_border) root.style.setProperty('--card-border', config.dark_card_border);
                
                if (config.dark_text_primary) root.style.setProperty('--text-primary', config.dark_text_primary);
                if (config.dark_text_secondary) root.style.setProperty('--text-secondary', config.dark_text_secondary);
                if (config.dark_text_tertiary) root.style.setProperty('--text-tertiary', config.dark_text_tertiary);
                
                if (config.dark_border) root.style.setProperty('--border-color', config.dark_border);
                if (config.dark_border_hover) root.style.setProperty('--border-color-hover', config.dark_border_hover);
            } else {
                // MODO CLARO: Usar variables estándar
                if (config.color_bg_primary) root.style.setProperty('--bg-primary', config.color_bg_primary);
                if (config.color_bg_secondary) root.style.setProperty('--bg-secondary', config.color_bg_secondary);
                if (config.color_bg_tertiary) root.style.setProperty('--bg-tertiary', config.color_bg_tertiary);
                if (config.color_card_bg) root.style.setProperty('--card-bg', config.color_card_bg);
                if (config.color_card_border) root.style.setProperty('--card-border', config.color_card_border);
                
                if (config.color_text_primary) root.style.setProperty('--text-primary', config.color_text_primary);
                if (config.color_text_secondary) root.style.setProperty('--text-secondary', config.color_text_secondary);
                if (config.color_text_tertiary) root.style.setProperty('--text-tertiary', config.color_text_tertiary);
                
                if (config.color_border) root.style.setProperty('--border-color', config.color_border);
                if (config.color_border_hover) root.style.setProperty('--border-color-hover', config.color_border_hover);
            }

            // Texto Inverso (Suele ser blanco siempre)
            if (config.color_text_inverse) root.style.setProperty('--text-inverse', config.color_text_inverse);

            // Sidebar / Navegación
            if (config.color_sidebar_bg) root.style.setProperty('--sidebar-bg', config.color_sidebar_bg);
            if (config.color_sidebar_text) root.style.setProperty('--sidebar-text', config.color_sidebar_text);
            if (config.color_sidebar_active) root.style.setProperty('--sidebar-active', config.color_sidebar_active);

            // Administración
            if (config.color_admin_panel_link) root.style.setProperty('--color-admin-panel-link', config.color_admin_panel_link);
            if (config.color_admin_sidebar_active) root.style.setProperty('--color-admin-sidebar-active', config.color_admin_sidebar_active);
            if (config.color_admin_sidebar_return) root.style.setProperty('--color-admin-sidebar-return', config.color_admin_sidebar_return);

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
    }, []);

    useEffect(() => {
        applyConfig();
    }, [applyConfig, theme]);

    return { applyConfig };
}
