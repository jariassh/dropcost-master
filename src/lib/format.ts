/**
 * Format a number as currency.
 * Uses 'es-CO' locale to enforce dots for thousands separator as requested.
 * @param amount - The number to format
 * @param currency - The currency code (default: 'USD')
 * @returns Formatted string (e.g. "$ 1.000,00" or "$ 29,99")
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
};

/**
 * Format a number with thousands separator (dots).
 * @param value - The number to format
 * @returns Formatted string (e.g. "1.000")
 */
export const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('es-CO').format(value);
};
