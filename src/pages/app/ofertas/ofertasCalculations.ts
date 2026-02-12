/**
 * Ofertas calculations — pure functions.
 * Ref: /docs/ESPECIFICACION_REQUERIMIENTOS_OFERTAS.md §RF-055
 */

import type { BundleTableRow } from '@/types/ofertas';
import { roundCurrency } from '@/pages/app/simulador/simulatorCalculations';

export interface DiscountResult {
    originalPrice: number;
    discountAmount: number;
    offerPrice: number;
    originalProfit: number;
    newProfit: number;
    newMarginPercent: number;
    /** True if newMarginPercent < 5 */
    isLowMargin: boolean;
}

/**
 * Calculate discount strategy results.
 *
 * Precio oferta = Precio original × (1 - Descuento%)
 * Ganancia nueva ≈ Ganancia original - Descuento en valor
 */
export function calculateDiscount(
    originalPrice: number,
    originalProfit: number,
    discountPercent: number,
): DiscountResult {
    const discountAmount = roundCurrency(originalPrice * discountPercent / 100);
    const offerPrice = roundCurrency(originalPrice - discountAmount);
    const newProfit = roundCurrency(originalProfit - discountAmount);
    const newMarginPercent = offerPrice > 0
        ? roundCurrency((newProfit / offerPrice) * 100)
        : 0;

    return {
        originalPrice: roundCurrency(originalPrice),
        discountAmount,
        offerPrice,
        originalProfit: roundCurrency(originalProfit),
        newProfit,
        newMarginPercent,
        isLowMargin: newMarginPercent < 5,
    };
}

/**
 * Calculate bundle strategy table.
 *
 * Unit 1: full price with original margin.
 * Units 2+: supplierCost + (originalMargin × marginPercent / 100).
 */
export function calculateBundle(
    originalPrice: number,
    supplierCost: number,
    originalProfit: number,
    marginPercent: number,
    maxQuantity: number = 5,
): BundleTableRow[] {
    const rows: BundleTableRow[] = [];
    const additionalUnitPrice = roundCurrency(supplierCost + (originalProfit * marginPercent / 100));
    const additionalUnitProfit = roundCurrency(originalProfit * marginPercent / 100);

    for (let qty = 1; qty <= maxQuantity; qty++) {
        if (qty === 1) {
            rows.push({
                quantity: 1,
                totalPrice: roundCurrency(originalPrice),
                pricePerUnit: roundCurrency(originalPrice),
                savingsPerUnit: 0,
                totalProfit: roundCurrency(originalProfit),
            });
        } else {
            const extraUnits = qty - 1;
            const totalPrice = roundCurrency(originalPrice + additionalUnitPrice * extraUnits);
            const pricePerUnit = roundCurrency(totalPrice / qty);
            const savingsPerUnit = roundCurrency(originalPrice - pricePerUnit);
            const totalProfit = roundCurrency(originalProfit + additionalUnitProfit * extraUnits);

            rows.push({
                quantity: qty,
                totalPrice,
                pricePerUnit,
                savingsPerUnit,
                totalProfit,
            });
        }
    }

    return rows;
}

export interface GiftResult {
    originalPrice: number;
    giftCost: number;
    perceivedValue: number;
    originalProfit: number;
    newProfit: number;
    profitReduction: number;
    /** True if giftCost > originalProfit */
    exceedsMargin: boolean;
}

/**
 * Calculate gift strategy results.
 *
 * Valor percibido = Precio + Costo regalo.
 * Ganancia nueva = Ganancia original - Costo regalo.
 */
export function calculateGift(
    originalPrice: number,
    originalProfit: number,
    giftCost: number,
): GiftResult {
    const perceivedValue = roundCurrency(originalPrice + giftCost);
    const newProfit = roundCurrency(originalProfit - giftCost);
    const profitReduction = roundCurrency(giftCost);

    return {
        originalPrice: roundCurrency(originalPrice),
        giftCost: roundCurrency(giftCost),
        perceivedValue,
        originalProfit: roundCurrency(originalProfit),
        newProfit,
        profitReduction,
        exceedsMargin: giftCost > originalProfit,
    };
}
