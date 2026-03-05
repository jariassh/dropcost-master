import { Tienda } from './store.types';

export interface ContactModuleAcceptance {
  id: string;
  tienda_id: string;
  user_id: string;
  aceptado_en: string;
  ip_address?: string;
  user_agent?: string;
  estado: 'activo' | 'revocado';
  revocado_en?: string;
}

export interface ContactDownloadAudit {
  id: string;
  tienda_id: string;
  user_id: string;
  formato: 'excel' | 'csv';
  cantidad_registros: number;
  descargado_en: string;
  ip_address?: string;
  hash_archivo?: string;
}

export interface ShopifyCliente {
  id: string;
  tienda_id: string;
  nombre?: string;
  email: string;
  telefono?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  numero_compras: number;
  total_compras_valor?: number;
  primera_compra_fecha?: string;
  ultima_compra_fecha?: string;
  cliente_shopify_id?: string;
  sincronizado_en: string;
}

export interface ContactListResponse {
  contacts: ShopifyCliente[];
  total: number;
  is_module_enabled: boolean;
  acceptance_date?: string;
}

// Extender interfaz de Tienda para el frontend
export interface TiendaWithContacts extends Tienda {
  contactos_modulo_habilitado: boolean;
  contactos_habilitado_en?: string;
}
