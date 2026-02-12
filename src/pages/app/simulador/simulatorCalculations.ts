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
export function calculateSuggestedPrice(inputs: SimulatorInputs): SimulatorResults {
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

    const denominator = 1 - commissionRate - marginRate;

    if (effectivenessRate <= 0 || denominator <= 0) {
        return buildEmptyResults();
    }

    // ─── Per-delivery multipliers ───
    const ordersPerDelivery = 1 / effectivenessRate;
    const shippedPerDelivery = 1 / deliveryRate;
    const returnsPerDelivery = (returnRatePercent / 100) / deliveryRate;

    // ─── Fixed costs per effective sale ───
    const cpaCostPerSale = roundCurrency(averageCpa * ordersPerDelivery);
    const productCostPerSale = roundCurrency(productCost); // solo unidades entregadas
    const freightCostPerSale = roundCurrency(shippingCost * shippedPerDelivery);
    const otherCostPerSale = roundCurrency(otherExpenses * shippedPerDelivery);
    const returnLossPerSale = roundCurrency(shippingCost * 1.5 * returnsPerDelivery);

    const totalFixedCost = cpaCostPerSale + productCostPerSale + freightCostPerSale + otherCostPerSale + returnLossPerSale;

    // ─── Price & profit ───
    const suggestedPrice = roundCurrency(totalFixedCost / denominator);
    const netProfitPerSale = roundCurrency(suggestedPrice * marginRate);
    const commissionPerSale = roundCurrency(suggestedPrice * commissionRate);

    // ─── Cost breakdown (per effective sale) ───
    const costBreakdown: CostBreakdown = {
        productCost: productCostPerSale,
        shippingCost: freightCostPerSale,
        collectionCommission: commissionPerSale,
        returnCost: returnLossPerSale,
        otherExpenses: otherCostPerSale,
        cpa: cpaCostPerSale,
        netMargin: netProfitPerSale,
        totalPrice: suggestedPrice,
    };

    // ─── Embudo de efectividad (base 100 pedidos) ───
    const baseOrders = 100;
    const afterCancellation = roundCurrency(baseOrders * confirmationRate);
    const afterReturns = roundCurrency(afterCancellation * deliveryRate);

    const effectivenessFunnel: EffectivenessFunnel = {
        totalOrders: baseOrders,
        afterPreCancellation: afterCancellation,
        afterReturns,
        effectiveOrders: afterReturns,
    };

    return {
        suggestedPrice,
        netProfitPerSale: netProfitPerSale,
        finalEffectivenessPercent: roundCurrency(effectivenessRate * 100),
        costBreakdown,
        effectivenessFunnel,
    };
}

/**
 * Calculate volume price table for 1-N units.
 * Unit 1 = full original price.
 * Units 2+ = supplierCost + (originalMarginValue × marginPercent / 100).
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
    const additionalUnitPrice = roundCurrency(supplierCost + (originalMarginValue * marginPercent / 100));
    const additionalUnitProfit = roundCurrency(originalMarginValue * marginPercent / 100);

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
            const totalPrice = roundCurrency(suggestedPrice + additionalUnitPrice * extraUnits);
            const pricePerUnit = roundCurrency(totalPrice / qty);
            const savingsPerUnit = roundCurrency(suggestedPrice - pricePerUnit);
            const totalProfit = roundCurrency(unit1Profit + additionalUnitProfit * extraUnits);

            rows.push({ quantity: qty, totalPrice, pricePerUnit, savingsPerUnit, totalProfit });
        }
    }

    return rows;
}

function buildEmptyResults(): SimulatorResults {
    return {
        suggestedPrice: 0,
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
