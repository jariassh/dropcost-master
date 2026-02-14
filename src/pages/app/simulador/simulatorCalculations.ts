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

/** Round to nearest 100 COP */
export function roundTo100(value: number): number {
    return Math.round(value / 100) * 100;
}

/** Banker's rounding (ROUND_HALF_UP) to 2 decimal places. Used for internal precision before final round. */
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
    const suggestedPrice = roundTo100(rawSuggestedPrice);

    if (manualPrice !== null && manualPrice > 0) {
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
        productCost: Math.round(productCostPerSale),
        shippingCost: Math.round(freightCostPerSale),
        collectionCommission: Math.round(commissionPerSale),
        returnCost: Math.round(returnLossPerSale),
        otherExpenses: Math.round(otherCostPerSale),
        cpa: Math.round(cpaCostPerSale),
        netMargin: Math.round(netProfitPerSale),
        totalPrice: Math.round(finalPrice),
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
        netProfitPerSale: Math.round(netProfitPerSale),
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
                totalPrice: roundTo100(suggestedPrice),
                pricePerUnit: roundTo100(suggestedPrice),
                savingsPerUnit: 0,
                totalProfit: roundTo100(unit1Profit),
            });
        } else {
            const extraUnits = qty - 1;
            // Calculations with raw float first
            const rawTotalPrice = suggestedPrice + additionalUnitPrice * extraUnits;
            const totalPrice = roundTo100(rawTotalPrice);
            
            const pricePerUnit = roundTo100(totalPrice / qty);
            const savingsPerUnit = roundTo100(suggestedPrice - pricePerUnit);
            
            // Profit calculation is tricky when we round the Total Price.
            // Best to reverse calculate profit from the rounded Total Price.
            // Profit(N) = TotalPrice(N) - (Cost(1) + SupplierCost*(N-1))? No.
            // Simplified logic as per original: 
            // Profit = Unit1Profit + ExtraProfit
            // But we must respect the new TotalPrice.
            // CostBase = RawTotal - RawProfit.
            // NewProfit = RoundedTotal - CostBase.
            
            const costBase = rawTotalPrice - (unit1Profit + additionalUnitProfit * extraUnits);
            const totalProfit = roundTo100(totalPrice - costBase);

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

