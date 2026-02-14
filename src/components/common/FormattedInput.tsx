import { useState, useEffect, useRef } from 'react';
import { Input } from './Input';

interface FormattedInputProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Keeping original signature style for compatibility
}

export function FormattedInput({ value, onChange, onFocus, onBlur, ...props }: FormattedInputProps) {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Format number to "1.000.000"
    const formatNumber = (num: number) => {
        if (isNaN(num)) return '';
        return num.toLocaleString('es-CO');
    };

    // Initialize display value
    useEffect(() => {
        if (!isFocused) {
            setDisplayValue(value === 0 ? '' : formatNumber(value));
        }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;

        // Remove all non-numeric characters (except maybe decimal point if needed, but assuming integers for inputs mostly)
        // COP inputs are usually integers. If decimal needed, logic gets complex.
        // Assuming integer for now based on "punto de mil" request.
        const numericString = raw.replace(/\D/g, '');

        const numValue = numericString === '' ? 0 : parseInt(numericString, 10);

        // Update display with formatted version
        setDisplayValue(numericString === '' ? '' : parseInt(numericString, 10).toLocaleString('es-CO'));

        // Propagate number to parent
        // Mocking an event object to maintain interface compatibility
        const syntheticEvent = {
            ...e,
            target: {
                ...e.target,
                value: numValue.toString() // Parent expects stringified number or handles it
            }
        } as React.ChangeEventHandler<HTMLInputElement> | any;

        // Custom change handler compatible with parent's expectation
        // Parent SimuladorForm uses: const raw = e.target.value; then parses it.
        // So we must pass the *raw number string* in e.target.value for parent to parse correctly
        // OR we change parent logic.
        // Easier to change parent logic to accept number directly, but SimuladorForm expects ChangeEvent.

        // Let's adapt:
        // We pass the string "123" (numeric) to parent.
        const customEvent = {
            target: { value: numericString }
        } as React.ChangeEvent<HTMLInputElement>;

        onChange(customEvent);
    };

    return (
        <Input
            {...props}
            type="text"
            value={displayValue}
            onChange={handleChange}
            onFocus={(e) => {
                setIsFocused(true);
                if (onFocus) onFocus(e);
            }}
            onBlur={(e) => {
                setIsFocused(false);
                // Ensure proper formatting on blur
                setDisplayValue(value === 0 ? '' : formatNumber(value));
                if (onBlur) onBlur(e);
            }}
        />
    );
}
