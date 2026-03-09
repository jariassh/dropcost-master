/**
 * Simulator financial calculations — pure functions.
 *
 * Fórmula COD Dropshipping:
 *   Por cada venta efectiva (entregada), se amortizan:
 *   - CPA × (pedidos/entregas)           → publicidad se paga SIEMPRE
 *   - ProductCost × 1                    → solo unidades entregadas
 *   - Flete × (enviados/entregas)        → logística de todos los envíos
 *   - OtrosCostos × (enviados/entregas)  → empaque, seguro, etc.
 *   - Flete × 1.5 × (devueltos/entregas) → logística inversa (ida + 50% retorno)
 *
 *   PrecioSugerido = CostosTotalesPerSale / (1 - comisión% - margen%)
 *   UtilidadNeta   = PrecioSugerido × margen%
 */

import type { SimulatorInputs, SimulatorResults, CostBreakdown, EffectivenessFunnel, VolumeTableRow } from '@/types/simulator';

/** Banker's rounding (ROUND_HALF_UP) to 2 decimal places. */
export function roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}


/** Calculate the suggested selling price and all derived metrics. */
export function calculateSuggestedPrice(inputs: SimulatorInputs, manualPrice: number | null = null): SimulatorResults {
    const {
        productCost,
        desiredMarginPercent,
        shippingCost,
        collectionCommissionPercent,
        returnRatePercent,
        otherExpenses,
        averageCpa,
        preCancellationPercent,
    } = inputs;

    // ─── Rates ───
    const confirmationRate = 1 - preCancellationPercent / 100;
    const deliveryRate = 1 - returnRatePercent / 100;
    const effectivenessRate = confirmationRate * deliveryRate;
    const commissionRate = collectionCommissionPercent / 100;
    const marginRate = desiredMarginPercent / 100;

    // ─── Per-delivery multipliers ───
    const ordersPerDelivery = 1 / effectivenessRate;
    const shippedPerDelivery = 1 / deliveryRate;
    const returnsPerDelivery = (returnRatePercent / 100) / deliveryRate;

    const denominator = (1 - marginRate) - (shippedPerDelivery * commissionRate);

    if (effectivenessRate <= 0) {
        return buildEmptyResults();
    }

    // ─── Fixed costs per effective sale ───
    const cpaCostPerSale = averageCpa * ordersPerDelivery;
    const productCostPerSale = productCost; // only delivered units
    const freightCostPerSale = shippingCost * shippedPerDelivery;
    const otherCostPerSale = otherExpenses * shippedPerDelivery;
    const returnLossPerSale = shippingCost * 1.5 * returnsPerDelivery;

    const totalFixedCost = cpaCostPerSale + productCostPerSale + freightCostPerSale + otherCostPerSale + returnLossPerSale;

    // ─── Price determination ───
    let finalPrice: number;
    let netProfitPerSale: number;

    const rawSuggestedPrice = denominator > 0 ? totalFixedCost / denominator : 0;
    const suggestedPrice = roundCurrency(rawSuggestedPrice);

    if (manualPrice !== null && manualPrice >= 0) {
        finalPrice = manualPrice;
        // Recalculate profit based on manual price
        // Revenue - (FixedCosts + VariableCommission)
        const totalCommission = finalPrice * commissionRate * shippedPerDelivery;
        netProfitPerSale = finalPrice - totalFixedCost - totalCommission;
    } else {
        finalPrice = suggestedPrice;
        // Calculated profit might slighty vary due to rounding, so we recalc:
        const totalCommission = finalPrice * commissionRate * shippedPerDelivery;
        netProfitPerSale = finalPrice - totalFixedCost - totalCommission;
    }

    // Commission is paid on ALL shipped orders, amortized per effective sale
    const commissionPerSale = finalPrice * commissionRate * shippedPerDelivery;

    // ─── Cost breakdown (per effective sale) ───
    const costBreakdown: CostBreakdown = {
        productCost: roundCurrency(productCostPerSale),
        shippingCost: roundCurrency(freightCostPerSale),
        collectionCommission: roundCurrency(commissionPerSale),
        returnCost: roundCurrency(returnLossPerSale),
        otherExpenses: roundCurrency(otherCostPerSale),
        cpa: roundCurrency(cpaCostPerSale),
        netMargin: roundCurrency(netProfitPerSale),
        totalPrice: roundCurrency(finalPrice),
    };

    // ─── Embudo de efectividad (base 100 pedidos) ───
    const baseOrders = 100;
    const afterCancellation = Math.round(baseOrders * confirmationRate);
    const afterReturns = Math.round(afterCancellation * deliveryRate);

    const effectivenessFunnel: EffectivenessFunnel = {
        totalOrders: baseOrders,
        afterPreCancellation: afterCancellation,
        afterReturns,
        effectiveOrders: afterReturns,
    };

    return {
        suggestedPrice: finalPrice,
        originalSuggestedPrice: suggestedPrice,
        netProfitPerSale: roundCurrency(netProfitPerSale),
        finalEffectivenessPercent: Math.round(effectivenessRate * 100),
        costBreakdown,
        effectivenessFunnel,
    };
}

/**
 * Calculate volume price table.
 * Unit 1 = Full Price (from suggested calculation).
 * Units N = Calculated based on margin reduction.
 */
export function calculateVolumeTable(
    suggestedPrice: number,
    supplierCost: number,
    originalMarginValue: number,
    marginPercent: number,
    maxUnits: number = 5,
): VolumeTableRow[] {
    const rows: VolumeTableRow[] = [];
    const unit1Profit = originalMarginValue;
    
    // Cost of adding one more unit = Supplier Cost + (OriginalProfit * Margin%)
    // This assumes Shipping/CPA are covered by the first unit's price model.
    const additionalUnitPrice = supplierCost + (originalMarginValue * marginPercent / 100);
    const additionalUnitProfit = originalMarginValue * marginPercent / 100;

    for (let qty = 1; qty <= maxUnits; qty++) {
        if (qty === 1) {
            rows.push({
                quantity: 1,
                totalPrice: roundCurrency(suggestedPrice),
                pricePerUnit: roundCurrency(suggestedPrice),
                savingsPerUnit: 0,
                totalProfit: roundCurrency(unit1Profit),
            });
        } else {
            const extraUnits = qty - 1;
            // Calculations with raw float first
            const rawTotalPrice = suggestedPrice + additionalUnitPrice * extraUnits;
            const totalPrice = roundCurrency(rawTotalPrice);
            
            const pricePerUnit = roundCurrency(totalPrice / qty);
            const savingsPerUnit = roundCurrency(suggestedPrice - pricePerUnit);
            
            // Profit calculation is tricky when we round the Total Price.
            // Best to reverse calculate profit from the rounded Total Price.
            // Profit(N) = TotalPrice(N) - (Cost(1) + SupplierCost*(N-1))? No.
            // Simplified logic as per original: 
            // Profit = Unit1Profit + ExtraProfit
            // But we must respect the new TotalPrice.
            // CostBase = RawTotal - RawProfit.
            // NewProfit = RoundedTotal - CostBase.
            
            const costBase = rawTotalPrice - (unit1Profit + additionalUnitProfit * extraUnits);
            const totalProfit = roundCurrency(totalPrice - costBase);

            rows.push({ quantity: qty, totalPrice, pricePerUnit, savingsPerUnit, totalProfit });
        }
    }

    return rows;
}

/**
 * Recalculate full results for a specific Volume scenario (Quantity N).
 * Used when Manual Volume Price is active or to show breakdown.
 */
export function calculateVolumeMetrics(
    inputs: SimulatorInputs,
    quantity: number,
    manualTotalPrice: number | null
): SimulatorResults {
    // We treat this as a "Single Unit Sale" of a "Bundle Product".
    // Bundle Product Cost = ProductCost * Qty.
    // Shipping, CPA, etc. remain per Order.
    
    // We can reuse calculateSuggestedPrice but override ProductCost.
    // However, calculateSuggestedPrice determines the Price.
    
    if (!manualTotalPrice) return buildEmptyResults(); // Should ideally not happen or rely on default

    const bundleInputs: SimulatorInputs = {
        ...inputs,
        productCost: inputs.productCost * quantity,
        // Other costs (shipping, CPA) stay the same per order
    };

    return calculateSuggestedPrice(bundleInputs, manualTotalPrice);
}

function buildEmptyResults(): SimulatorResults {
    return {
        suggestedPrice: 0,
        originalSuggestedPrice: 0,
        netProfitPerSale: 0,
        finalEffectivenessPercent: 0,
        costBreakdown: {
            productCost: 0, shippingCost: 0, collectionCommission: 0,
            returnCost: 0, otherExpenses: 0, cpa: 0, netMargin: 0, totalPrice: 0,
        },
        effectivenessFunnel: {
            totalOrders: 0, afterPreCancellation: 0, afterReturns: 0, effectiveOrders: 0,
        },
    };

}

/**
 * CPA and Viability Calculations (RF_CPA_ANALISIS_VIABILIDAD)
 */

export function calculateCPA(gastoMeta: number, numeroVentas: number): number {
    if (numeroVentas === 0) return 0;
    return gastoMeta / numeroVentas;
}

export interface ViabilityData {
    status: 'viable' | 'breakeven' | 'no_viable';
    ganancia: number;
    rentabilidad: number;
    color: string;
}

export function calculateViability(cpa: number, margenNeto: number): ViabilityData {
    const ganancia = margenNeto - cpa;
    const rentabilidad = cpa > 0 ? (ganancia / cpa) * 100 : 0;

    let status: 'viable' | 'breakeven' | 'no_viable' = 'viable';
    let color = 'var(--color-success)';

    if (ganancia < 0) {
        status = 'no_viable';
        color = 'var(--color-error)';
    } else if (ganancia === 0) {
        status = 'breakeven';
        color = 'var(--color-warning)';
    }

    return {
        status,
        ganancia: roundCurrency(ganancia),
        rentabilidad: roundCurrency(rentabilidad),
        color
    };
}

export interface Recommendation {
    title: string;
    message: string;
    subMessage: string;
    color: string;
}

export function getViabilityRecommendation(viability: ViabilityData): Recommendation {
    switch (viability.status) {
        case 'viable':
            return {
                title: '🟢 VIABLE',
                message: `Este producto es viable. Ganas ${viability.ganancia} por cada venta.`,
                subMessage: `Rentabilidad: ${viability.rentabilidad}% - Recomendamos escalar publicidad.`,
                color: viability.color
            };

        case 'breakeven':
            return {
                title: '🟡 BREAK-EVEN',
                message: `No ganas ni pierdes (${viability.ganancia} por venta).`,
                subMessage: 'Considera reducir gastos de publicidad o negociar precio del producto.',
                color: viability.color
            };

        case 'no_viable':
            return {
                title: '🔴 NO VIABLE',
                message: `Este producto NO es viable. Pierdes ${Math.abs(viability.ganancia)} por cada venta.`,
                subMessage: 'No recomendamos escalar. Considera pausar esta campaña.',
                color: viability.color
            };
        default:
            return {
                title: 'ANÁLISIS',
                message: 'Ingresa datos para analizar',
                subMessage: '',
                color: 'var(--text-tertiary)'
            };
    }
}

/**
 * Tesla Simulator - Strategies and Gold Rules (Phase 2)
 */

export type StrategicProfile = 'conservative' | 'balanced' | 'scaling';

export interface StrategyScenario {
    id: StrategicProfile;
    label: string;
    description: string;
    maxCpa: number;
    projectedProfit: number;
    healthScore: number; // 0 to 100
}

export const STRATEGY_CONFIG = {
    conservative: {
        label: 'Conservador',
        description: 'Maximiza el profit libre. CPA meta 30% del margen.',
        cpaMultiplier: 0.30
    },
    balanced: {
        label: 'Equilibrado',
        description: 'Crecimiento estable. CPA meta 45% del margen.',
        cpaMultiplier: 0.45
    },
    scaling: {
        label: 'Escalamiento',
        description: 'Máximo volumen. CPA meta 65% del margen.',
        cpaMultiplier: 0.65
    }
};

/**
 * Calculates CPA limits for different strategic profiles based on the net margin pre-ad.
 */
export function calculateStrategies(margenNetoPreAd: number): StrategyScenario[] {
    return (Object.entries(STRATEGY_CONFIG) as [StrategicProfile, typeof STRATEGY_CONFIG.conservative][]).map(([id, config]) => {
        const maxCpa = roundCurrency(margenNetoPreAd * config.cpaMultiplier);
        const projectedProfit = roundCurrency(margenNetoPreAd - maxCpa);
        
        return {
            id,
            label: config.label,
            description: config.description,
            maxCpa,
            projectedProfit,
            healthScore: Math.round((projectedProfit / margenNetoPreAd) * 100)
        };
    });
}

export interface GoldRuleResult {
    ruleId: string;
    passed: boolean;
    label: string;
    message: string;
    severity: 'success' | 'warning' | 'error';
}

/**
 * Calculates CPA scenarios for the "Ad Calculator" section.
 * Scenarios: 35%, 40%, 50% of the Gross Margin (Precio - Costos Directos).
 */
export interface AdScenario {
    percent: number;
    budget: number;
    maxCpa: number;
    operationalMargin: number;
}

export function calculateAdScenarios(results: SimulatorResults, dailyOrders: number = 10): AdScenario[] {
    const { suggestedPrice, costBreakdown } = results;
    // Gross Margin per effective sale (Price - Product - Logistics)
    const grossMarginPerSale = costBreakdown.netMargin + costBreakdown.cpa;
    const totalGrossMargin = grossMarginPerSale * dailyOrders;

    return [35, 40, 50].map(percent => {
        const rate = percent / 100;
        const totalBudget = totalGrossMargin * rate;
        const operationalMargin = totalGrossMargin - totalBudget;
        
        return {
            percent,
            budget: roundCurrency(totalBudget),
            maxCpa: roundCurrency(totalBudget / dailyOrders),
            operationalMargin: roundCurrency(operationalMargin)
        };
    });
}

/**
 * Calculates a detailed sales simulation for the "Sales Simulation" section.
 * Base on daily orders and considering leakage (cancellations and returns).
 */
export interface SalesSimulation {
    totalOrders: number;
    totalRevenue: number;
    cancelledOrders: number;
    cancellationLoss: number;
    shippedOrders: number;
    shippedRevenue: number;
    returnedOrders: number;
    returnCosts: number;
    effectiveOrders: number;
    deliveredRevenue: number;
    grossMarginReal: number;
}

export function calculateSalesSimulation(inputs: SimulatorInputs, results: SimulatorResults, dailyOrders: number = 10): SalesSimulation {
    const { preCancellationPercent, returnRatePercent, productCost, shippingCost, collectionCommissionPercent } = inputs;
    const { suggestedPrice } = results;

    const cancelledCount = Math.round(dailyOrders * (preCancellationPercent / 100));
    const shippedCount = dailyOrders - cancelledCount;
    
    const returnedCount = Math.round(shippedCount * (returnRatePercent / 100));
    const deliveredCount = shippedCount - returnedCount;

    const totalRevenue = dailyOrders * suggestedPrice;
    const shippedRevenue = shippedCount * suggestedPrice;
    const deliveredRevenue = deliveredCount * suggestedPrice;

    // Costs
    const productCosts = deliveredCount * productCost;
    const shippingCosts = shippedCount * shippingCost; // All shipments pay
    const returnLogisticsCosts = returnedCount * (shippingCost * 0.5); // Reverse logistics
    const commissions = deliveredRevenue * (collectionCommissionPercent / 100);

    const grossMarginReal = deliveredRevenue - productCosts - shippingCosts - returnLogisticsCosts - commissions;

    return {
        totalOrders: dailyOrders,
        totalRevenue: roundCurrency(totalRevenue),
        cancelledOrders: cancelledCount,
        cancellationLoss: roundCurrency(cancelledCount * suggestedPrice),
        shippedOrders: shippedCount,
        shippedRevenue: roundCurrency(shippedRevenue),
        returnedOrders: returnedCount,
        returnCosts: roundCurrency(returnLogisticsCosts),
        effectiveOrders: deliveredCount,
        deliveredRevenue: roundCurrency(deliveredRevenue),
        grossMarginReal: roundCurrency(grossMarginReal)
    };
}

/**
 * Validates the "Gold Rules" of dropshipping for the current setup.
 */
export function validateGoldRules(inputs: SimulatorInputs, results: SimulatorResults): GoldRuleResult[] {
    const rules: GoldRuleResult[] = [];
    const { suggestedPrice, costBreakdown } = results;

    // Rule 1: Regla del 50% (Costo Total / Precio <= 50%)
    const totalCostsPerSale = suggestedPrice - costBreakdown.netMargin - costBreakdown.cpa;
    const totalCostRatio = suggestedPrice > 0 ? (totalCostsPerSale / suggestedPrice) : 0;
    
    rules.push({
        ruleId: 'cost_50',
        passed: totalCostRatio <= 0.5,
        label: 'Regla del 50%',
        message: totalCostRatio <= 0.5 
            ? 'Costo total equilibrado (máx 50% del precio).' 
            : 'Costos muy altos. Superas el 50% del precio de venta.',
        severity: totalCostRatio <= 0.5 ? 'success' : 'warning'
    });

    // Rule 2: Regla del 40% (Margen Bruto >= 40%)
    const grossMargin = costBreakdown.netMargin + costBreakdown.cpa;
    const grossMarginRatio = suggestedPrice > 0 ? (grossMargin / suggestedPrice) : 0;
    
    rules.push({
        ruleId: 'margin_40',
        passed: grossMarginRatio >= 0.4,
        label: 'Regla del 40%',
        message: grossMarginRatio >= 0.4
            ? `Margen bruto saludable del ${(grossMarginRatio * 100).toFixed(0)}%.`
            : `Margen bruto bajo (${(grossMarginRatio * 100).toFixed(0)}%). Idealmente > 40%.`,
        severity: grossMarginRatio >= 0.4 ? 'success' : (grossMarginRatio >= 0.25 ? 'warning' : 'error')
    });

    // Rule 3: Regla del 35% (Pauta <= 35% del Margen Bruto)
    const cpaRatio = grossMargin > 0 ? costBreakdown.cpa / grossMargin : 0;
    rules.push({
        ruleId: 'ads_35',
        passed: cpaRatio <= 0.35,
        label: 'Regla del 35%',
        message: cpaRatio <= 0.35
            ? 'Inversión en pauta óptima (máx 35% del margen).'
            : 'Gasto publicitario excesivo sobre el margen bruto.',
        severity: cpaRatio <= 0.35 ? 'success' : 'warning'
    });

    return rules;
}

