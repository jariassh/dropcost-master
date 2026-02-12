/**
 * Slider - Input range estilizado con valor visible, labels min/max.
 * Thumb azul #0066FF, track con progreso coloreado.
 * Value badge displayed inline with label (top-right).
 */

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

    return (
        <div style={{ width: '100%' }}>
            {/* Label row: label left, value badge right */}
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
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--slider-badge-bg, rgba(0,0,0,0.08))',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                    }}
                >
                    {value}{suffix}
                </span>
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
        </div>
    );
}
