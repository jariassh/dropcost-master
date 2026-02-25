/**
 * Store de Zustand para gestionar el estado de las tiendas globalmente.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoreState, Tienda, TiendaInsert, TiendaUpdate } from '@/types/store.types';
import { storeService } from '@/services/storeService';

import { useAuthStore } from '@/store/authStore';

export const useStoreStore = create<StoreState>()(
    persist(
        (set, get) => ({
            tiendas: [],
            tiendaActual: null,
            isLoading: false,
            error: null,

            fetchTiendas: async () => {
                const { user } = useAuthStore.getState();
                if (!user) return;

                set({ isLoading: true, error: null });
                try {
                    const tiendas = await storeService.getTiendas(user.id);
                    set({ tiendas, isLoading: false });

                    // Sincronizar tiendaActual
                    const currentTienda = get().tiendaActual;
                    
                    if (tiendas.length === 0) {
                        // Si no hay tiendas, nada debe estar seleccionado
                        set({ tiendaActual: null });
                    } else if (!currentTienda || !tiendas.find(t => t.id === currentTienda.id)) {
                        // Si no hay seleccionada o la que estaba ya no existe, elegir la primera
                        set({ tiendaActual: tiendas[0] });
                    }
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                }
            },

            setTiendaActual: (tienda: Tienda) => {
                set({ tiendaActual: tienda });
            },

            crearTienda: async (tienda: TiendaInsert) => {
                // Validación de límites del plan (Double Check)
                const { user } = useAuthStore.getState();
                const currentTiendas = get().tiendas;
                const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
                const storeLimit = user?.plan?.limits?.stores ?? 0;

                if (!isAdmin && currentTiendas.length >= storeLimit) {
                    set({ error: `Has alcanzado el límite de ${storeLimit} tiendas de tu plan actual.`, isLoading: false });
                    return false;
                }

                set({ isLoading: true, error: null });
                try {
                    const nuevaTienda = await storeService.createTienda(tienda);
                    set((state) => ({
                        tiendas: [nuevaTienda, ...state.tiendas],
                        tiendaActual: state.tiendaActual || nuevaTienda,
                        isLoading: false
                    }));
                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            actualizarTienda: async (id: string, cambios: TiendaUpdate) => {
                set({ isLoading: true, error: null });
                try {
                    const tiendaActualizada = await storeService.updateTienda(id, cambios);
                    set((state) => ({
                        tiendas: state.tiendas.map(t => t.id === id ? tiendaActualizada : t),
                        tiendaActual: state.tiendaActual?.id === id ? tiendaActualizada : state.tiendaActual,
                        isLoading: false
                    }));
                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },

            eliminarTienda: async (id: string) => {
                set({ isLoading: true, error: null });
                try {
                    await storeService.deleteTienda(id);
                    set((state) => {
                        const nuevasTiendas = state.tiendas.filter(t => t.id !== id);
                        return {
                            tiendas: nuevasTiendas,
                            tiendaActual: state.tiendaActual?.id === id
                                ? (nuevasTiendas.length > 0 ? nuevasTiendas[0] : null)
                                : state.tiendaActual,
                            isLoading: false
                        };
                    });
                    return true;
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    return false;
                }
            },
        }),
        {
            name: 'dropcost-store-storage',
            partialize: (state) => ({ tiendaActual: state.tiendaActual }), // Solo persistir la tienda seleccionada
        }
    )
);
