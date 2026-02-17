/**
 * Select - Dropdown estilizado con chevron y soporte para items con detalles.
 * Usa un menú custom en lugar del select nativo para mayor control visual.
 */
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
    /** Detalles opcionales mostrados debajo del label */
    details?: string;
}

interface SelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    error?: string;
}

export function Select({
    options,
    value,
    onChange,
    placeholder = 'Seleccionar...',
    label,
    disabled = false,
    error,
}: SelectProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => o.value === value);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            {label && (
                <label
                    style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        marginBottom: '8px',
                    }}
                >
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setOpen((v) => !v)}
                disabled={disabled}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: selected ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    backgroundColor: disabled ? 'var(--bg-secondary)' : 'var(--card-bg)',
                    border: `1px solid ${error ? 'var(--color-error)' : open ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'border-color 150ms, box-shadow 150ms',
                    boxShadow: open ? '0 0 0 3px rgba(0, 102, 255, 0.1)' : 'none',
                    textAlign: 'left',
                    opacity: disabled ? 0.5 : 1,
                }}
            >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    style={{
                        flexShrink: 0,
                        color: 'var(--text-tertiary)',
                        transform: open ? 'rotate(180deg)' : 'none',
                        transition: 'transform 150ms',
                    }}
                />
            </button>

            {error && (
                <p style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '4px' }}>{error}</p>
            )}

            {/* Dropdown menu */}
            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 50,
                        maxHeight: '280px',
                        overflowY: 'auto',
                        animation: 'slideDown 150ms ease-out',
                    }}
                >
                    {options.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                            Sin opciones disponibles
                        </div>
                    ) : (
                        options.map((option) => {
                            const isSelected = option.value === value;

                            return (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '2px',
                                        padding: '12px 16px',
                                        fontSize: '14px',
                                        fontWeight: isSelected ? 600 : 400,
                                        color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)',
                                        backgroundColor: isSelected ? 'var(--bg-secondary)' : 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background-color 100ms',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <span>{option.label}</span>
                                    {option.details && (
                                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                                            {option.details}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
