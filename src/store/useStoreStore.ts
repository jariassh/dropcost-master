/**
 * Store de Zustand para gestionar el estado de las tiendas globalmente.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoreState, Tienda, TiendaInsert, TiendaUpdate } from '@/types/store.types';
import { storeService } from '@/services/storeService';

export const useStoreStore = create<StoreState>()(
    persist(
        (set, get) => ({
            tiendas: [],
            tiendaActual: null,
            isLoading: false,
            error: null,

            fetchTiendas: async () => {
                set({ isLoading: true, error: null });
                try {
                    const tiendas = await storeService.getTiendas();
                    set({ tiendas, isLoading: false });

                    // Si no hay tienda seleccionada y hay tiendas disponibles, seleccionar la primera
                    if (!get().tiendaActual && tiendas.length > 0) {
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
