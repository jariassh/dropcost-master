/**
 * Slider - Input range estilizado con valor editable, labels min/max.
 * Thumb azul #0066FF, track con progreso coloreado.
 * Numeric input displayed inline with label (top-right), bidirectional sync with slider.
 * Uses type=number with native min/max to prevent out-of-range values.
 */
import { useState, useEffect, useRef } from 'react';

interface SliderProps {
    min: number;
    max: number;
    value: number;
    onChange: (value: number) => void;
    label?: string;
    suffix?: string;
    step?: number;
    /** Texto a mostrar debajo del min */
    minLabel?: string;
    /** Texto a mostrar debajo del max */
    maxLabel?: string;
    /** Texto a mostrar debajo del centro */
    midLabel?: string;
    disabled?: boolean;
}

export function Slider({
    min,
    max,
    value,
    onChange,
    label,
    suffix = '%',
    step = 1,
    minLabel,
    maxLabel,
    midLabel,
    disabled = false,
}: SliderProps) {
    const percentage = ((value - min) / (max - min)) * 100;

    // Local state for the editable input (allows intermediate typing)
    const [localValue, setLocalValue] = useState<string>(String(value));
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync local input when slider value changes externally (not while user is typing)
    useEffect(() => {
        if (!isFocused) {
            setLocalValue(String(value));
        }
    }, [value, isFocused]);

    /** Handle typed number: clamp immediately so out-of-range is rejected */
    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const raw = e.target.value;

        // Allow empty (user is clearing to retype)
        if (raw === '') {
            setLocalValue('');
            return;
        }

        const parsed = parseInt(raw, 10);
        if (isNaN(parsed)) return;

        // Prevent typing a value that exceeds max (reject the keystroke)
        if (parsed > max) {
            setLocalValue(String(max));
            onChange(max);
            return;
        }

        // Accept value — if >= min, update slider immediately
        setLocalValue(String(parsed));
        if (parsed >= min) {
            onChange(parsed);
        }
    }

    /** On blur: clamp to valid range and sync */
    function handleInputBlur() {
        setIsFocused(false);
        const parsed = parseInt(localValue, 10);
        if (isNaN(parsed) || localValue === '') {
            setLocalValue(String(value));
            return;
        }
        const clamped = Math.min(max, Math.max(min, parsed));
        setLocalValue(String(clamped));
        onChange(clamped);
    }

    /** Select all text on focus for easy overwrite */
    function handleInputFocus() {
        setIsFocused(true);
        setTimeout(() => inputRef.current?.select(), 0);
    }

    // Width: fits max value digits comfortably
    const maxDigits = String(max).length;
    const inputWidth = Math.max(36, maxDigits * 11 + 12);

    return (
        <div style={{ width: '100%' }}>
            {/* Label row: label left, editable value + suffix badge right */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                }}
            >
                {label && (
                    <span
                        style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                        }}
                    >
                        {label}
                    </span>
                )}
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0',
                        borderRadius: '6px',
                        backgroundColor: 'var(--slider-badge-bg, rgba(0,0,0,0.08))',
                        border: isFocused
                            ? '1.5px solid var(--color-primary)'
                            : '1.5px solid transparent',
                        transition: 'border-color 150ms ease',
                        padding: '2px 8px 2px 4px',
                    }}
                >
                    <input
                        ref={inputRef}
                        type="number"
                        min={min}
                        max={max}
                        step={step}
                        value={localValue}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        disabled={disabled}
                        style={{
                            width: `${inputWidth}px`,
                            padding: '2px 2px',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            textAlign: 'right',
                            fontFamily: 'inherit',
                            MozAppearance: 'textfield',
                            appearance: 'textfield' as never,
                        }}
                    />
                    <span
                        style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            userSelect: 'none',
                            marginLeft: '2px',
                        }}
                    >
                        {suffix}
                    </span>
                </div>
            </div>

            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                {/* Track background */}
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '4px',
                        borderRadius: '9999px',
                        backgroundColor: 'var(--border-color)',
                    }}
                />
                {/* Track fill */}
                <div
                    style={{
                        position: 'absolute',
                        width: `${percentage}%`,
                        height: '4px',
                        borderRadius: '9999px',
                        backgroundColor: disabled ? 'var(--text-tertiary)' : 'var(--color-primary)',
                        transition: 'width 50ms ease',
                    }}
                />
                {/* Native input overlay */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(Number(e.target.value))}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '28px',
                        margin: 0,
                        opacity: 0,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        zIndex: 2,
                    }}
                />
                {/* Visual thumb */}
                <div
                    style={{
                        position: 'absolute',
                        left: `calc(${percentage}% - 10px)`,
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: disabled ? 'var(--text-tertiary)' : 'var(--color-primary)',
                        boxShadow: '0 2px 6px rgba(0,102,255,0.3)',
                        transition: 'left 50ms ease',
                        pointerEvents: 'none',
                    }}
                />
            </div>

            {/* Labels */}
            {(minLabel || maxLabel || midLabel) && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '6px',
                        fontSize: '12px',
                        color: 'var(--text-tertiary)',
                    }}
                >
                    <span>{minLabel || min}</span>
                    {midLabel && <span>{midLabel}</span>}
                    <span>{maxLabel || max}</span>
                </div>
            )}

            {/* Hide number input spinners */}
            <style>{`
                input[type=number]::-webkit-outer-spin-button,
                input[type=number]::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
            `}</style>
        </div>
    );
}
