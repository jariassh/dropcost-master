/**
 * Utility functions for currency conversion and formatting.
 * Uses Open Exchange Rates API (free tier) for real-time rates.
 */

const API_URL = 'https://open.er-api.com/v6/latest';
const CACHE_KEY = 'exchange_rates_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface ExchangeRatesResponse {
    result: string;
    provider: string;
    documentation: string;
    terms_of_use: string;
    time_last_update_unix: number;
    time_last_update_utc: string;
    time_next_update_unix: number;
    time_next_update_utc: string;
    base_code: string;
    rates: Record<string, number>;
}

interface CachedRates {
    timestamp: number;
    data: ExchangeRatesResponse;
}

/**
 * Fetches exchange rates for a given base currency.
 * Tries to use cached data first.
 * @param baseCurrency The base currency code (e.g., 'USD', 'COP')
 */
export const fetchExchangeRates = async (baseCurrency: string = 'USD'): Promise<Record<string, number> | null> => {
    try {
        const cacheKey = `${CACHE_KEY}_${baseCurrency}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            const parsed: CachedRates = JSON.parse(cached);
            const now = Date.now();
            if (now - parsed.timestamp < CACHE_DURATION) {
                // Return cached rates if valid
                return parsed.data.rates;
            }
        }

        // Fetch fresh rates
        const response = await fetch(`${API_URL}/${baseCurrency}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch rates for ${baseCurrency}`);
        }

        const data: ExchangeRatesResponse = await response.json();
        
        // Cache the result
        const toCache: CachedRates = {
            timestamp: Date.now(),
            data
        };
        localStorage.setItem(cacheKey, JSON.stringify(toCache));

        return data.rates;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        return null;
    }
};

/**
 * Converts an amount from one currency to another using provided rates.
 * @param amount Amount to convert
 * @param targetCurrency Target currency code
 * @param rates Dictionary of exchange rates (relative to base currency)
 */
export const convertPrice = (amount: number, targetCurrency: string, rates: Record<string, number> | null): number => {
    if (!rates || !rates[targetCurrency]) {
        // Fallback: return original amount if conversion not possible
        console.warn(`Conversion rate not found for ${targetCurrency}`);
        return amount;
    }
    return amount * rates[targetCurrency];
};

/**
 * Gets the preferred display currency for a given country code.
 * Defaults to USD for unsupported or unstable currencies.
 * @param countryCode - ISO 2 character country code (e.g. 'CO', 'US')
 * @param currencyCode - The official currency code of the country (e.g. 'COP', 'USD')
 * @returns The currency code to use for display
 */
export const getDisplayCurrency = (countryCode: string, currencyCode: string): string => {
    // List of currencies we explicitly support
    const SUPPORTED_CURRENCIES = ['COP', 'USD', 'MXN', 'PEN', 'CLP', 'EUR', 'BRL'];

    // Special cases
    if (countryCode === 'VE') return 'USD'; // Venezuela -> USD
    if (countryCode === 'AR') return 'USD'; // Argentina -> USD (often preferred for SaaS)

    if (SUPPORTED_CURRENCIES.includes(currencyCode)) {
        return currencyCode;
    }

    return 'USD';
};

/**
 * Formats a number as currency using smart compact notation.
 * - < 1.000.000: Full number with thousands separators and 2 decimals.
 * - >= 1.000.000 and < 1.000.000.000: Compact format with "M" and 2 decimals.
 * - >= 1.000.000.000: Compact format with "B" and 2 decimals.
 * @param value The amount to format
 * @param currency The currency code (e.g. 'COP', 'USD')
 * @param locale The locale (e.g. 'es-CO', 'en-US')
 * @returns Formatted currency string
 */
export const formatSmartCurrency = (value: number, currency: string = 'COP', locale: string = 'es-CO'): string => {
    const isNegative = value < 0;
    const absValue = Math.abs(value);

    const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    if (absValue < 1000000) {
        return formatter.format(value);
    }

    // Extract currency symbol manually since compact notation in simple Intl formatter might not use standard letters (M/B) in all locales
    const parts = formatter.formatToParts(1);
    let currencySymbol = '$';
    parts.forEach(p => {
        if (p.type === 'currency') currencySymbol = p.value;
    });

    const numFormatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const signStr = isNegative ? '-' : '';

    if (absValue >= 1000000000) {
        return `${signStr}${currencySymbol}${numFormatter.format(absValue / 1000000000)}B`;
    }

    return `${signStr}${currencySymbol}${numFormatter.format(absValue / 1000000)}M`;
};

