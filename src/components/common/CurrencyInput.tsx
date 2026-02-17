import React, { useState, useEffect } from 'react';
import { Input } from './Input';

interface CurrencyInputProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
    value: number;
    onChange: (value: number) => void;
    allowDecimals?: boolean;
    prefix?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
    value,
    onChange,
    allowDecimals = true,
    prefix = '$',
    onBlur,
    onFocus,
    ...props
}) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Initial sync
    useEffect(() => {
        if (!isFocused) {
            // When not focused, format nicely
            // If value is 0, we can show '0' or '' depending on preference. 
            // User complained about '0' leading when writing.
            // If value is 0 and we are not writing, '0' is fine.
            // But if we want to clear it, we can.
            // Let's standard format.
            setDisplayValue(formatNumber(value));
        }
    }, [value, isFocused]);

    const formatNumber = (num: number): string => {
        if (num === 0 && !allowDecimals) return ''; // Cleaner for integers if 0
        // Use 'es-CO' for dots as thousands separator, key request from user
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: allowDecimals ? 2 : 0,
            maximumFractionDigits: allowDecimals ? 2 : 0,
        }).format(num);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let raw = e.target.value;

        // Strip prefix if present (though usually prefix is outside input visually, here we assume it might be typed?)
        // Actually, let's just handle raw input numbers/dots/commas.

        // Remove everything that is not a digit or a comma/dot (decimal separator)
        // We will assume comma is decimal separator for 'es-CO' style input, but we should handle dot too if user types it.

        // normalize: replace dot with nothing (unless it is decimal?) 
        // Logic: 
        // 1. Remove all non-numeric chars except last occurring ',' or '.' if allowDecimals

        // Simpler approach for "puntos de mil":
        // Users type digits. We format on the fly.

        // Remove formatting characters (dots)
        const cleanVal = raw.replace(/\./g, '');

        // Replace comma with dot for parsing
        const normalized = cleanVal.replace(/,/g, '.');

        // Check valid number
        // Regex allows digits and one dot
        if (!/^\d*\.?\d*$/.test(normalized)) {
            // Invalid character entered
            return;
        }

        // Prevent multiple leading zeros
        if (normalized.length > 1 && normalized.startsWith('0') && !normalized.startsWith('0.')) {
            // '05' -> '5'
            // We just parse and re-set
        }

        const numericValue = normalized === '' || normalized === '.' ? 0 : parseFloat(normalized);

        // Update parent
        onChange(numericValue);

        // Update display ONLY if we are formatting on the fly?
        // No, formatting on the fly with cursor position is hard.
        // User asked: "los input al momento de escribir se me queda el 0 delante"
        // If we just pass the raw value properly, typical inputs handle this.
        // But user wants "puntos de mil" (1.000). This requires text input control.

        // Strategy:
        // Let user type freely. Format on blur?
        // OR Format as you type? User said "adicional necesito que se formatee...".
        // Format as you type is tricky for cursor jumping.
        // Given constraints, I will simply update `displayValue` to `raw` while focused,
        // but removing the leading zero if `raw` becomes `05`.

        if (normalized.startsWith('0') && normalized.length > 1 && !normalized.includes('.')) {
            setDisplayValue(normalized.substring(1));
        } else {
            setDisplayValue(raw);
        }
    };

    // Better Strategy for "Format as you type" with dots:
    // It's complex without a library like 'react-number-format'. 
    // I will stick to "Format on Blur" for the dots, but "Remove leading zero" instantly.
    // User specifically asked "se formatee con puntos de mil". This usually implies visual formatting.
    // I'll try a simple valid implementation: 
    // On Change -> Update parent number. Update Display to raw input (cleaned of leading zeros).
    // On Blur -> Format beautifully with dots and decimals.

    // RE-READING USER REQUEST: "los input al momento de escribir se me queda el 0 delante... adicional necesito que se formatee con puntos de mil"
    // He might want "1.000" WHILE typing "1000".

    // I will try to support basic thousands separator injection on change.

    const handleRawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;

        // 1. Strip all non-numeric chars (keep comma/dot for decimal if allowed)
        // If decimals allowed, we accept ONE decimal separator.
        // Assuming user types '.' or ',' for decimal.

        // Let's assume strict: '.' for thousands, ',' for decimals (standard Colombia).

        // Remove dots (thousands)
        let clean = val.replace(/\./g, '');

        // Replace decimal comma with dot for calculation
        let numberStr = clean.replace(',', '.');

        // Handle leading zeros: '05' -> '5'
        if (numberStr.length > 1 && numberStr.startsWith('0') && !numberStr.startsWith('0.')) {
            numberStr = numberStr.substring(1);
            clean = clean.substring(1); // update clean string too
        }

        if (clean === '') {
            setDisplayValue('');
            onChange(0);
            return;
        }

        // Validate structure (numbers only, max one decimal separator)
        if (allowDecimals) {
            const parts = numberStr.split('.');
            if (parts.length > 2) return; // limit to one decimal
        } else {
            // Integers only
            if (numberStr.includes('.')) return;
        }

        // Check for non-digits (excluding the one decimal dot we tracked)
        if (/[^\d.]/.test(numberStr)) return;

        // Update Parent
        const num = parseFloat(numberStr);
        onChange(isNaN(num) ? 0 : num);

        // Update Display with formatting
        // Integer part formatted with dots
        const parts = numberStr.split('.');
        let integerPart = parts[0];
        let decimalPart = parts.length > 1 ? ',' + parts[1] : '';

        // Add thousands separator to integer part
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        setDisplayValue(formattedInteger + decimalPart);
    };

    return (
        <div style={{ position: 'relative' }}>
            {prefix && <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                fontSize: '14px',
                pointerEvents: 'none'
            }}>{prefix}</span>}

            <Input
                {...props}
                value={displayValue}
                onChange={handleRawChange}
                onFocus={(e) => {
                    setIsFocused(true);
                    if (displayValue === '0' || displayValue === '0,00') {
                        setDisplayValue(''); // Clear on focus if zero
                    }
                    if (onFocus) onFocus(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    // Start 0 handling
                    if (value === 0) setDisplayValue('');
                    else setDisplayValue(formatNumber(value)); // Ensure standard format on blur
                    if (onBlur) onBlur(e);
                }}
                style={{
                    ...props.style,
                    paddingLeft: prefix ? '24px' : '12px'
                }}
                placeholder="0"
            />
        </div>
    );
};
