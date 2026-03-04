import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface LaunchpadState {
    isComplete: boolean;
    progress: number;
    currentStep: number;
    isLoading: boolean;
    tiendaId: string | null;
    fetchStatus: (userId: string, tiendaId?: string | null) => Promise<void>;
    setComplete: (complete: boolean) => void;
    setCurrentStep: (step: number) => void;
}

export const useLaunchpadStore = create<LaunchpadState>((set) => ({
    isComplete: false, 
    progress: 0,
    currentStep: 0,
    isLoading: true,
    tiendaId: null,

    fetchStatus: async (userId: string, tiendaId?: string | null) => {
        const targetTiendaId = tiendaId || null;
        
        // Reset state ONLY if switching stores or initial load to avoid UI jumps
        set((state) => ({ 
            isLoading: true,
            tiendaId: targetTiendaId,
            // Si cambiamos de tienda, reseteamos progreso para evitar ver el 100% de la anterior
            progress: targetTiendaId !== state.tiendaId ? 0 : state.progress,
            isComplete: targetTiendaId !== state.tiendaId ? false : state.isComplete
        }));

        try {
            // 1. Check explicit progress record for this user + tienda
            let progressQuery = supabase
                .from('onboarding_progress' as any)
                .select('*')
                .eq('user_id', userId);
            
            if (targetTiendaId) {
                progressQuery = progressQuery.eq('tienda_id', targetTiendaId);
            } else {
                progressQuery = progressQuery.is('tienda_id', null);
            }

            const { data: progressData } = await progressQuery.maybeSingle();

            // 2. Technical Checks (Ground Truth)
            const { data: userData } = await supabase
                .from('users' as any)
                .select('estado_suscripcion, plan_id')
                .eq('id', userId)
                .single();
            
            // Check Store
            let storeCheckQuery = supabase
                .from('tiendas' as any)
                .select('id')
                .eq('usuario_id', userId)
                .eq('active', true);
            
            if (targetTiendaId) {
                storeCheckQuery = storeCheckQuery.eq('id', targetTiendaId);
            }

            const { data: storesData } = await storeCheckQuery;
            const stores = (storesData as any[]) || [];
            const hasStore = stores.length > 0;
            const activeTiendaId = targetTiendaId || (stores[0] as any)?.id || null;

            // Check Meta via Integraciones (Global)
            const { data: metaIntegrations } = await supabase
                .from('integraciones' as any)
                .select('id')
                .eq('tipo', 'meta_ads')
                .eq('usuario_id', userId)
                .eq('estado', 'conectado');
            
            const hasMeta = (metaIntegrations?.length || 0) > 0;

            // Check Ad Accounts (Store Specific)
            let hasAdAccounts = false;
            if (activeTiendaId) {
                const { count } = await supabase
                    .from('tiendas_meta_ads' as any)
                    .select('*', { count: 'exact', head: true })
                    .eq('tienda_id', activeTiendaId);
                hasAdAccounts = (count || 0) > 0;
            }

            // Check Shopify (Store Specific)
            let hasShopify = false;
            if (activeTiendaId) {
                const { data } = await supabase
                    .from('integraciones' as any)
                    .select('id')
                    .eq('tipo', 'shopify')
                    .eq('tienda_id', activeTiendaId)
                    .eq('estado', 'conectado');
                hasShopify = (data?.length || 0) > 0;
            }

            // Logic (NEW ORDER: 0:Plan, 1:Tienda, 2:Meta, 3:Cuentas, 4:Shopify)
            const hasPlan = !!(userData && (userData as any).plan_id !== 'plan_free');

            let techProgress = 0;
            let techStep = 0;

            if (hasPlan) { 
                techProgress = 20; techStep = 1; 
                if (hasStore) { 
                    techProgress = 40; techStep = 2; 
                    if (hasMeta) { 
                        techProgress = 60; techStep = 3; 
                        // These two require a specific store context
                        if (targetTiendaId && hasAdAccounts) { 
                            techProgress = 80; techStep = 4; 
                            if (hasShopify) { 
                                techProgress = 100; techStep = 5; 
                            }
                        }
                    }
                }
            }

            const row = progressData as any;
            let finalProgress = techProgress;
            let finalStep = techStep;
            let finalComplete = techProgress === 100;

            if (row) {
                finalProgress = Math.max(row.porcentaje_completado || 0, techProgress);
                finalStep = Math.max(row.paso_actual || 0, techStep);
                finalComplete = row.completado || finalProgress === 100;
            }

            set({
                isComplete: finalComplete,
                progress: finalProgress,
                currentStep: finalStep >= 5 ? 4 : finalStep,
                tiendaId: activeTiendaId,
                isLoading: false
            });
        } catch (err) {
            console.error('Error fetching launchpad status:', err);
            set({ isLoading: false });
        }
    },

    setComplete: (complete: boolean) => set({ isComplete: complete }),
    setCurrentStep: (step: number) => set({ currentStep: step })
}));
