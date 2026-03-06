import { useAuthStore } from '@/store/authStore';
import { PlanLimits } from '@/types/plans.types';

export const subscriptionService = {
    /**
     * Obtiene los límites del plan actual del usuario autenticado.
     */
    getLimits(): PlanLimits | null {
        // En un entorno real, el objeto plan y limits deberían estar en el store de auth.
        // authService.getCurrentUser() recupera estos datos de la tabla users (via FK a plans).
        const user = useAuthStore.getState().user;
        if (!user || !user.plan) return null;
        
        return user.plan.limits as PlanLimits;
    },

    canConnectMetaAds(): boolean {
        const limits = this.getLimits();
        if (!limits) return false;
        return !!limits.meta_ads_enabled;
    },

    /**
     * Verifica si el usuario tiene acceso al Dashboard Operacional.
     */
    isDashboardEnabled(): boolean {
        const limits = this.getLimits();
        if (!limits) return false;
        return !!limits.dashboard_enabled;
    },

    /**
     * Verifica si el usuario tiene acceso al Sincronizador de Pedidos Dropi.
     */
    isDropiSyncEnabled(): boolean {
        const limits = this.getLimits();
        if (!limits) return false;
        return !!limits.dropi_sync_enabled;
    },

    /**
     * Verifica si el usuario tiene acceso al Módulo de Contactos.
     */
    isContactsEnabled(): boolean {
        const limits = this.getLimits();
        if (!limits) return false;
        return !!limits.access_contacts;
    },

    /**
     * Verifica si el usuario puede añadir una cuenta publicitaria más a una tienda específica.
     * @param tiendaId ID de la tienda
     * @param currentStoreAccountsCount Número actual de cuentas vinculadas a la tienda
     */
    canAddMetaAccountToStore(currentStoreAccountsCount: number): boolean {
        const limits = this.getLimits();
        if (!limits) return false;
        
        const limit = limits.meta_accounts_per_store || 0;
        return currentStoreAccountsCount < limit;
    },

    /**
     * Verifica si el usuario ha alcanzado el límite total de cuentas de Meta Ads en su plan.
     * @param currentTotalAccountsCount Número total de cuentas vinculadas en todas sus tiendas
     */
    canAddMoreMetaAccountsTotal(currentTotalAccountsCount: number): boolean {
        const limits = this.getLimits();
        if (!limits) return false;
        
        const totalLimit = limits.total_meta_accounts || 0;
        return currentTotalAccountsCount < totalLimit;
    },

    /**
     * Obtiene el límite de cuentas por tienda para mostrar en la UI.
     */
    getStoreMetaLimit(): number {
        return this.getLimits()?.meta_accounts_per_store || 0;
    },

    /**
     * Obtiene el límite total de cuentas para mostrar en la UI.
     */
    getTotalMetaLimit(): number {
        return this.getLimits()?.total_meta_accounts || 0;
    }
};
