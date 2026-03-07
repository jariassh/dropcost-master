import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customCodeService, CustomCodeSnippet } from '@/services/customCodeService';

/**
 * Hook para inyectar fragmentos de código dinámicamente según la ruta.
 * Inspirado en la lógica de Elementor/WordPress para SPAs.
 */
export function useCustomCode() {
    const location = useLocation();

    // Obtener fragmentos activos de la base de datos
    const { data: snippets = [] } = useQuery({
        queryKey: ['activeCustomCode'],
        queryFn: () => customCodeService.getActiveSnippets(),
        staleTime: 1000 * 60 * 10, // 10 minutos
    });

    useEffect(() => {
        if (!snippets.length) return;

        const path = location.pathname;
        
        // Determinar qué fragmentos deben inyectarse en esta ruta
        const filteredSnippets = snippets.filter(snippet => {
            const rules = snippet.apply_to || [];
            if (rules.includes('all')) return true;
            
            if (rules.includes('landing') && path === '/') return true;
            if (rules.includes('auth') && (path.startsWith('/login') || path.startsWith('/registro') || path.startsWith('/2fa') || path.startsWith('/verificar-email') || path.startsWith('/recuperar-contrasena'))) return true;
            if (rules.includes('panel') && (path.startsWith('/dashboard') || path.startsWith('/mis-costeos') || path.startsWith('/billetera') || path.startsWith('/referidos') || path.startsWith('/configuracion'))) return true;
            if (rules.includes('admin') && path.startsWith('/admin')) return true;
            if (rules.includes('checkout') && (path.startsWith('/pricing') || path.startsWith('/payment'))) return true;

            return false;
        });

        // Inyectar fragmentos
        const containers = {
            head: injectGroup(filteredSnippets.filter(s => s.location === 'head'), 'dc-custom-head', document.head),
            body_start: injectGroup(filteredSnippets.filter(s => s.location === 'body_start'), 'dc-custom-body-start', document.body, true),
            body_end: injectGroup(filteredSnippets.filter(s => s.location === 'body_end'), 'dc-custom-body-end', document.body, false)
        };

        return () => {
            // Limpiar al desmontar o cambiar de ruta
            Object.values(containers).forEach(container => container?.remove());
        };
    }, [snippets, location.pathname]);
}

/**
 * Inyecta un grupo de fragmentos en un contenedor específico
 */
function injectGroup(snippets: CustomCodeSnippet[], containerId: string, parent: HTMLElement, atStart: boolean = false): HTMLElement | null {
    if (!snippets.length) {
        document.getElementById(containerId)?.remove();
        return null;
    }

    // Limpieza previa
    document.getElementById(containerId)?.remove();

    const container = document.createElement('div');
    container.id = containerId;
    container.style.display = 'none';

    // Ordenar por prioridad
    const sorted = [...snippets].sort((a, b) => b.priority - a.priority);

    sorted.forEach(snippet => {
        const template = document.createElement('template');
        template.innerHTML = snippet.code;
        const nodes = Array.from(template.content.childNodes);

        nodes.forEach(node => {
            if (node.nodeName === 'SCRIPT') {
                const oldScript = node as HTMLScriptElement;
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.textContent = oldScript.textContent;
                container.appendChild(newScript);
            } else if (node.nodeName === 'NOSCRIPT') {
                const ns = document.createElement('noscript');
                ns.innerHTML = (node as HTMLElement).innerHTML;
                container.appendChild(ns);
            } else {
                container.appendChild(node.cloneNode(true));
            }
        });
    });

    if (atStart && parent.firstChild) {
        parent.insertBefore(container, parent.firstChild);
    } else {
        parent.appendChild(container);
    }

    return container;
}
