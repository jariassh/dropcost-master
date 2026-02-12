/**
 * Design tokens para DropCost Master.
 * Fuente de verdad para colores, tipografía, espaciado, radios y sombras.
 * Ref: /docs/DISEÑO_UIUX.md sección 1.
 *
 * Uso: importar como referencia para valores exactos.
 * La estilización real usa clases Tailwind + CSS variables.
 */

// Paleta de colores extraída de /docs/DISEÑO_UIUX.md §1.1
export const Colors = {
    // Primarios
    primary: '#0066FF',
    primaryDark: '#003D99',
    primaryLight: '#E6F0FF',

    // Secundarios / Estados
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    neutral: '#6B7280',

    // Neutros
    white: '#FFFFFF',
    grayLight: '#F3F4F6',
    grayMedium: '#D1D5DB',
    grayDark: '#1F2937',
    black: '#111827',

    // Dark Mode
    darkBgPrimary: '#0F172A',
    darkBgSecondary: '#1E293B',
    darkTextPrimary: '#F1F5F9',
    darkTextSecondary: '#94A3B8',

    // Badges
    successBg: '#D1FAE5',
    successText: '#065F46',
    warningBg: '#FEF3C7',
    warningText: '#92400E',
    errorBg: '#FEE2E2',
    errorText: '#991B1B',
    infoBg: '#E0E7FF',
    infoText: '#3730A3',
} as const;

// Tipografía — /docs/DISEÑO_UIUX.md §1.2
export const Typography = {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: { size: '32px', weight: 700, lineHeight: 1.2 },
    h2: { size: '28px', weight: 700, lineHeight: 1.3 },
    h3: { size: '24px', weight: 600, lineHeight: 1.3 },
    h4: { size: '20px', weight: 600, lineHeight: 1.4 },
    bodyLarge: { size: '16px', weight: 400, lineHeight: 1.5 },
    body: { size: '14px', weight: 400, lineHeight: 1.5 },
    caption: { size: '12px', weight: 500, lineHeight: 1.4 },
    mono: { size: '13px', weight: 400, lineHeight: 1.5 },
} as const;

// Espaciado (escala 4px) — /docs/DISEÑO_UIUX.md §1.3
export const Spacing = {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
} as const;

// Radios — /docs/DISEÑO_UIUX.md §1.4
export const Radii = {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
} as const;

// Sombras — /docs/DISEÑO_UIUX.md §1.5
export const Shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
} as const;

// Breakpoints — /docs/DISEÑO_UIUX.md §5.1
export const Breakpoints = {
    mobile: '0px',
    tablet: '641px',
    desktop: '1025px',
    wide: '1601px',
} as const;

// Transiciones — /docs/DISEÑO_UIUX.md §1.6
export const Transitions = {
    fast: 'all 150ms ease-out',
    normal: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 500ms ease-out',
} as const;
