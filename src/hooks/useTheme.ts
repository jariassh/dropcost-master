/**
 * Hook para gestionar tema oscuro/claro.
 * Persiste preferencia en localStorage.
 * Aplica atributo data-theme en document.documentElement.
 */
import { useEffect, useCallback } from 'react';
import { useThemeStore } from '@/store/themeStore';

export function useTheme() {
    const { theme, toggleTheme, setTheme } = useThemeStore();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Sincronizar con clase 'dark' de Tailwind para componentes que usen clases dark:
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const isDark = theme === 'dark';

    return { theme, isDark, toggleTheme, setTheme };
}
