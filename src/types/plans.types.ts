export interface PlanLimits {
    stores: number;
    costeos_limit?: number; // -1 for infinite
    offers_limit?: number; // -1 for infinite
    can_duplicate_costeos?: boolean;
    can_delete_costeos?: boolean;
    can_delete_offers?: boolean;
    access_wallet?: boolean;
    access_referrals?: boolean;
    can_delete_stores?: boolean;
    [key: string]: number | boolean | undefined;
}

export interface Plan {
    id: string;
    slug: string; // Unique identifier (e.g. 'plan_pro')
    name: string;
    description: string;
    price_monthly: number;
    price_semiannual: number;
    currency: string;
    features: string[]; // JSON array of strings
    limits: PlanLimits;
    is_active: boolean;
    is_public: boolean; // Controls visibility in Pricing Page
    created_at?: string;
    updated_at?: string;
}

export interface PlanInput {
    slug: string;
    name: string;
    description: string;
    price_monthly: number;
    price_semiannual: number;
    features: string[];
    limits: PlanLimits;
    is_active: boolean;
    is_public: boolean;
}
