/**
 * Servicio para gestionar la persistencia de afiliados (Cookies/Storage).
 * Implementa 90 días de duración y Last Click Wins.
 */

const STORAGE_KEY = 'dc_affiliate_id';
const EXPIRY_KEY = 'dc_affiliate_expiry';
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export const affiliateService = {
    /**
     * Guarda el ID del afiliado y establece su fecha de expiración.
     */
    setAffiliateId: (id: string) => {
        if (!id) return;
        
        const expiry = Date.now() + NINETY_DAYS_MS;
        localStorage.setItem(STORAGE_KEY, id);
        localStorage.setItem(EXPIRY_KEY, expiry.toString());
    },

    /**
     * Obtiene el ID del afiliado si no ha expirado.
     */
    getAffiliateId: (): string | null => {
        const id = localStorage.getItem(STORAGE_KEY);
        const expiry = localStorage.getItem(EXPIRY_KEY);

        if (!id || !expiry) return null;

        // Verificar si ha expirado
        if (Date.now() > parseInt(expiry, 10)) {
            affiliateService.clearAffiliateId();
            return null;
        }

        return id;
    },

    /**
     * Limpia los datos de afiliado.
     */
    clearAffiliateId: () => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(EXPIRY_KEY);
    },

    /**
     * Verifica si el clic ya fue contado para un código específico en este navegador.
     */
    isClickCounted: (refCode: string): boolean => {
        const countedClicks = JSON.parse(localStorage.getItem('dc_counted_clicks') || '{}');
        return !!countedClicks[refCode.toLowerCase()];
    },

    /**
     * Marca un código como contado para evitar incrementos duplicados.
     */
    markClickAsCounted: (refCode: string) => {
        const countedClicks = JSON.parse(localStorage.getItem('dc_counted_clicks') || '{}');
        countedClicks[refCode.toLowerCase()] = Date.now();
        localStorage.setItem('dc_counted_clicks', JSON.stringify(countedClicks));
    }
};
