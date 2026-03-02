import type { Database } from './supabase';

export type Integracion = Database['public']['Tables']['integraciones']['Row'];

export interface MetaBusinessManager {
    id: string;
    name: string;
}

export interface MetaAdAccount {
    id: string;
    account_id: string;
    name: string;
    business?: {
        id: string;
        name: string;
    };
}

export interface MetaAccountsResponse {
    business_managers: MetaBusinessManager[];
    ad_accounts: MetaAdAccount[];
}

export interface MetaSelectionData {
    tienda_id: string;
    meta_business_id?: string;
    meta_ad_account_id: string;
    meta_ad_account_name: string;
}
