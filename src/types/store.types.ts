/**
 * Tipos para la gestión de tiendas (Multitenancy).
 */
import type { Database } from './supabase';

export type Tienda = Database['public']['Tables']['tiendas']['Row'];
export type TiendaInsert = Database['public']['Tables']['tiendas']['Insert'];
export type TiendaUpdate = Database['public']['Tables']['tiendas']['Update'];

export interface StoreState {
    tiendas: Tienda[];
    tiendaActual: Tienda | null;
    isLoading: boolean;
    error: string | null;

    // Acciones
    fetchTiendas: () => Promise<void>;
    setTiendaActual: (tienda: Tienda) => void;
    crearTienda: (tienda: TiendaInsert) => Promise<boolean>;
    actualizarTienda: (id: string, Cambios: TiendaUpdate) => Promise<boolean>;
    eliminarTienda: (id: string) => Promise<boolean>;
}
