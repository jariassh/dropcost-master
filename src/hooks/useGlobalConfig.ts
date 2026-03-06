import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { configService, GlobalConfig } from '@/services/configService';
import { useTheme } from './useTheme';

const loadGoogleFont = (fontName?: string) => {
    if (!fontName || ['Inter', 'system-ui', 'sans-serif', 'serif', 'monospace'].includes(fontName)) return;

    // Normalizar ID para evitar duplicados
    const fontId = `gfont-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(fontId)) return;

    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    // Importamos un rango amplio de pesos para asegurar compatibilidad
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
    document.head.appendChild(link);
};

export function useGlobalConfig() {
    const { theme } = useTheme();

    const applyConfig = useCallback(async (config: GlobalConfig) => {
        try {
            if (!config) return;

            // 1. Cargar Fuentes DinÃ¡micamente
            loadGoogleFont(config.font_family_primary); // RF Secondary -> Body
            loadGoogleFont(config.font_family_secondary); // RF Primary -> Headings
            loadGoogleFont(config.font_family_accent); // RF Accent -> Lora
            loadGoogleFont(config.font_family_mono); // RF Mono -> JetBrains

            // 2. Aplicar Colores (Variables CSS)
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

            // SemÃ¡nticos
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

            // Sidebar / NavegaciÃ³n
            setProp('--sidebar-bg', config.color_sidebar_bg);
            setProp('--sidebar-text', config.color_sidebar_text);
            setProp('--sidebar-active', config.color_sidebar_active);

            // AdministraciÃ³n
            setProp('--color-admin-panel-link', config.color_admin_panel_link);
            setProp('--color-admin-sidebar-active', config.color_admin_sidebar_active);
            setProp('--color-admin-sidebar-return', config.color_admin_sidebar_return);

            // 2. Aplicar TipografÃ­a (Variables CSS)
            setProp('--font-body', config.font_family_primary || 'Poppins');
            setProp('--font-headings', config.font_family_secondary || 'Inter');
            setProp('--font-accent', config.font_family_accent || 'Lora');
            setProp('--font-mono', config.font_family_mono || 'JetBrains Mono');
            
            setProp('--fs-base', config.font_size_base);
            setProp('--fs-h1', config.font_size_h1);
            setProp('--fs-h2', config.font_size_h2);
            setProp('--fs-h3', config.font_size_h3);
            setProp('--fs-h4', config.font_size_h4);
            setProp('--fs-small', config.font_size_small);
            setProp('--fs-tiny', config.font_size_tiny);
            setProp('--ls-h', config.font_letter_spacing_h);
            setProp('--ls-labels', config.font_letter_spacing_labels || '0.5px');
            setProp('--lh-base', config.font_line_height_base || '1.6');
            setProp('--lh-headings', config.font_line_height_headings || '1.2');
            setProp('--lh-small', config.font_line_height_small || '1.4');
            setProp('--lh-mono', config.font_line_height_mono || '1.5');

            // 3. Aplicar SEO (Metadatos)
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

            // Favicon
            if (config.favicon_url) {
                const head = document.head || document.getElementsByTagName('head')[0];
                const existingLinks = document.querySelectorAll("link[rel*='icon']");
                existingLinks.forEach(el => el.remove());

                const newLink = document.createElement('link');
                newLink.id = 'dynamic-favicon';
                newLink.rel = 'icon';
                newLink.type = config.favicon_url.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon';
                const separator = config.favicon_url.includes('?') ? '&' : '?';
                newLink.href = `${config.favicon_url}${separator}t=${Date.now()}`;
                head.appendChild(newLink);
            }

            // 3. Inyectar Scripts de Tracking (HEAD)
            if (config.codigo_head) {
              const headContainerId = 'dc-tracking-head';
              let headContainer = document.getElementById(headContainerId);
              if (headContainer) headContainer.remove();
              
              headContainer = document.createElement('div');
              headContainer.id = headContainerId;
              headContainer.innerHTML = config.codigo_head;
              
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

    // React Query para obtener la configuraciÃ³n (cachÃ© de 30 min)
    const { data: config, isLoading } = useQuery({
        queryKey: ['globalConfig'],
        queryFn: () => configService.getConfig(),
        staleTime: 1000 * 60 * 30, 
    });

    useEffect(() => {
        if (config) {
            applyConfig(config);
        }
    }, [config, applyConfig, theme]);

    return { config, isLoading, applyConfig };
}
