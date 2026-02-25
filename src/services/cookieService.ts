/**
 * Servicio para gestionar el consentimiento de cookies y preferencias de privacidad.
 */

export interface CookiePreferences {
    necessarias: boolean;
    analisis: boolean;
    marketing: boolean;
    timestamp: number;
}

const STORAGE_KEY = 'dropcost_cookie_consent';

export const cookieService = {
    /**
     * Obtiene las preferencias guardadas o null si no hay consentimiento.
     */
    getPreferences(): CookiePreferences | null {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    },

    /**
     * Guarda las preferencias de consentimiento.
     */
    setPreferences(prefs: Partial<CookiePreferences>) {
        const current = this.getPreferences() || {
            necessarias: true,
            analisis: false,
            marketing: false,
            timestamp: Date.now()
        };

        const updated: CookiePreferences = {
            ...current,
            ...prefs,
            necessarias: true, // Siempre obligatorias
            timestamp: Date.now()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        
        // Disparar evento para que otros componentes reaccionen
        window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: updated }));
    },

    /**
     * Acepta todas las cookies.
     */
    acceptAll() {
        this.setPreferences({
            analisis: true,
            marketing: true
        });
    },

    /**
     * Rechaza cookies opcionales.
     */
    rejectAll() {
        this.setPreferences({
            analisis: false,
            marketing: false
        });
    }
};
