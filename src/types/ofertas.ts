/**
 * Types for the Ofertas Irresistibles module.
 * Ref: /docs/ESPECIFICACION_REQUERIMIENTOS_OFERTAS.md (RF-051 to RF-063)
 */

/** Available offer strategy types */
export type StrategyType = 'descuento' | 'bundle' | 'obsequio';

/** Gift/bonus type options */
export type GiftType = 'muestra_gratis' | 'complemento' | 'otro_producto' | 'cupon_descuento';

/** Discount strategy configuration */
export interface DiscountConfig {
    /** Discount percentage (1-50) */
    discountPercent: number;
    /** Calculated: offer price after discount */
    offerPrice: number;
    /** Calculated: new profit after discount */
    newProfit: number;
    /** Calculated: new margin percentage */
    newMarginPercent: number;
}

/** Bundle strategy configuration */
export interface BundleConfig {
    /** Number of units in bundle (2-10) */
    quantity: number;
    /** Margin percentage for units 2+ (10-100) */
    marginPercent: number;
    /** Whether it was pre-defined from the costeo volume strategy */
    usePredefinedTable: boolean;
    /** Generated price table for the bundle */
    priceTable: BundleTableRow[];
}

/** A single row in the bundle price table */
export interface BundleTableRow {
    /** Number of units */
    quantity: number;
    /** Total price for this option */
    totalPrice: number;
    /** Price per unit */
    pricePerUnit: number;
    /** Client savings per unit vs single unit price */
    savingsPerUnit: number;
    /** Seller total profit */
    totalProfit: number;
}

/** Gift strategy configuration */
export interface GiftConfig {
    /** Type of gift */
    giftType: GiftType;
    /** Cost of the gift in COP */
    giftCost: number;
    /** Description of the gift (max 100 chars) */
    description: string;
    /** Calculated: perceived value (product price + gift cost) */
    perceivedValue: number;
    /** Calculated: new profit after deducting gift cost */
    newProfit: number;
}

/** Complete offer record */
export interface Oferta {
    id: string;
    userId: string;
    storeId: string;
    costeoId: string;
    productName: string;
    strategyType: StrategyType;

    /** Strategy-specific configuration (only one is defined) */
    discountConfig?: DiscountConfig;
    bundleConfig?: BundleConfig;
    giftConfig?: GiftConfig;

    /** Estimated profit (depends on strategy) */
    estimatedProfit: number;
    /** Estimated margin percentage */
    estimatedMarginPercent: number;

    createdAt: string;
}

/** Strategy metadata for UI display */
export interface StrategyInfo {
    type: StrategyType;
    label: string;
    icon: string;
    description: string;
    recommended?: boolean;
}

/** Summary of available strategies for UI */
export const STRATEGIES: StrategyInfo[] = [
    {
        type: 'descuento',
        label: 'Descuento en Precio',
        icon: '💰',
        description: 'Reduce precio de venta directamente',
    },
    {
        type: 'bundle',
        label: 'Bundle con Margen Variable',
        icon: '📦',
        description: 'Mantén ganancia con más unidades',
        recommended: true,
    },
    {
        type: 'obsequio',
        label: 'Obsequios o Complementos',
        icon: '🎁',
        description: 'Agrega valor gratis al cliente',
    },
];
