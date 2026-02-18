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
    onBlur, // Extract onBlur to wrap it
    onFocus, // Extract onFocus to wrap it
    style, // Extract style to merge
    ...props
}) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Sync external value to display when not focused
    useEffect(() => {
        if (!isFocused) {
            setDisplayValue(formatNumber(value));
        }
    }, [value, isFocused, allowDecimals]);

    const formatNumber = (num: number): string => {
        if ((num === 0 || isNaN(num)) && !isFocused) return '';
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: allowDecimals ? 2 : 0,
            maximumFractionDigits: allowDecimals ? 2 : 0,
        }).format(num);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;

        // Allow only numbers, dots and commas
        if (!/^[\d,.]*$/.test(raw)) return;

        setDisplayValue(raw);

        // Parse logic for parent state
        // Remove dots (thousands) and replace comma with dot (decimal)
        const clean = raw.replace(/\./g, '').replace(',', '.');
        const num = parseFloat(clean);

        if (!isNaN(num)) {
            onChange(num);
        } else if (raw === '') {
            onChange(0);
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        // Force format on blur
        setDisplayValue(formatNumber(value));
        if (onBlur) onBlur(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        // On focus, show raw number without thousands separators for easier editing? 
        // Or keep it? The previous complex logic suggests user wants to fetch '1.000'.
        // Let's try to keep it simple: if 0, clear. If not, keep current string until edit.
        if (value === 0) setDisplayValue('');
        else {
            // Optional: Strip formatting on focus for easier editing?
            // Users often prefer editing "1000" over "1.000". 
            // Let's strip thousands separators but keep decimal comma.
            const raw = value.toString().replace('.', ',');
            setDisplayValue(raw);
        }
        if (onFocus) onFocus(e);
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {prefix && (
                <span style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    pointerEvents: 'none',
                    zIndex: 10
                }}>
                    {prefix}
                </span>
            )}

            <Input
                {...props}
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={{
                    ...style,
                    paddingLeft: prefix ? '32px' : '16px' // Adjust padding for prefix
                }}
            />
        </div>
    );
};
