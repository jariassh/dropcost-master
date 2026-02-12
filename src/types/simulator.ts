/**
 * Types for the Simulador Financiero COD module.
 * Ref: /docs/DropCost_Master_Especificacion_Requerimientos.md §3.2 (RF-007 to RF-013)
 */

/** Input parameters for the financial simulator */
export interface SimulatorInputs {
    /** Product name */
    productName: string;
    /** Desired net margin percentage (0-100) */
    desiredMarginPercent: number;
    /** Supplier product cost */
    productCost: number;
    /** Base shipping cost */
    shippingCost: number;
    /** Carrier collection commission percentage (0-100) */
    collectionCommissionPercent: number;
    /** Return rate percentage (0-100) */
    returnRatePercent: number;
    /** Other expenses (platform fees, packaging, etc.) */
    otherExpenses: number;
    /** Average CPA from Meta Ads */
    averageCpa: number;
    /** Pre-shipment cancellation percentage (0-100) */
    preCancellationPercent: number;
}

/** Calculated results from the simulator */
export interface SimulatorResults {
    /** Suggested selling price */
    suggestedPrice: number;
    /** Net profit per sale */
    netProfitPerSale: number;
    /** Final effectiveness percentage */
    finalEffectivenessPercent: number;
    /** Breakdown of costs */
    costBreakdown: CostBreakdown;
    /** Effectiveness funnel data */
    effectivenessFunnel: EffectivenessFunnel;
}

/** Detailed cost breakdown for the price */
export interface CostBreakdown {
    productCost: number;
    shippingCost: number;
    collectionCommission: number;
    returnCost: number;
    otherExpenses: number;
    cpa: number;
    netMargin: number;
    totalPrice: number;
}

/** Effectiveness funnel visualization data */
export interface EffectivenessFunnel {
    /** Total orders */
    totalOrders: number;
    /** After pre-cancellation */
    afterPreCancellation: number;
    /** After returns */
    afterReturns: number;
    /** Final effective orders */
    effectiveOrders: number;
}

/** Volume strategy configuration (RF-062) */
export interface VolumeStrategy {
    /** Whether the volume table is activated */
    enabled: boolean;
    /** Margin percentage for units 2+ (10-100) */
    marginPercent: number;
    /** Generated price table */
    priceTable: VolumeTableRow[];
}

/** A single row in the volume price table */
export interface VolumeTableRow {
    /** Number of units */
    quantity: number;
    /** Total price for this quantity */
    totalPrice: number;
    /** Price per unit at this quantity */
    pricePerUnit: number;
    /** Savings per unit compared to single unit price */
    savingsPerUnit: number;
    /** Total seller profit for this quantity */
    totalProfit: number;
}

/** A saved costeo record */
export interface SavedCosteo {
    id: string;
    /** Associated store ID */
    storeId: string;
    /** Product name */
    productName: string;
    /** Meta campaign ID (optional) */
    metaCampaignId?: string;
    /** All input parameters */
    inputs: SimulatorInputs;
    /** Calculated results */
    results: SimulatorResults;
    /** Volume strategy (if enabled) */
    volumeStrategy?: VolumeStrategy;
    /** Creation date ISO string */
    createdAt: string;
    /** Last update date ISO string */
    updatedAt: string;
}
