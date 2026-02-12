/**
 * Hook para gestionar tema oscuro/claro.
 * Persiste preferencia en localStorage.
 * Aplica atributo data-theme en document.documentElement.
 */
import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'dropcost-theme';

function getInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'dark';

    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
    }

    // Preferencia del sistema operativo
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
    }, []);

    const isDark = theme === 'dark';

    return { theme, isDark, toggleTheme, setTheme };
}
