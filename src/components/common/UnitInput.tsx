import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface UnitInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    helperText?: string;
}

export function UnitInput({ label, value, onChange, placeholder, helperText }: UnitInputProps) {
    const parseValue = (val: string) => {
        const numPart = parseFloat(val) || 0;
        // Solo extrae letras al final. Si es algo como "1.6", unitPart será ""
        const match = val.match(/[a-z%]+$/i);
        const unitPart = match ? match[0] : '';
        return { num: numPart, unit: unitPart };
    };

    const handleStep = (step: number) => {
        const { num, unit } = parseValue(value);
        let precision = 1;

        if (unit === 'rem' || unit === '') {
            precision = 0.1;
        } else if (unit === 'em') {
            if (num < 1 && num > -1) {
                precision = 0.005;
            } else {
                precision = 0.1;
            }
        } else if (unit === 'px') {
            precision = 1;
        }

        const newValue = (num + (step * precision)).toFixed(unit === 'px' ? 0 : 3);
        const formattedValue = parseFloat(newValue).toString() + unit;
        onChange(formattedValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleStep(1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleStep(-1);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            {label && (
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {label}
                </label>
            )}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    style={{
                        width: '100%',
                        padding: '12px 32px 12px 16px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        border: '1.5px solid var(--border-color)',
                        outline: 'none',
                        transition: 'all 200ms ease',
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = 'var(--color-primary)';
                        e.target.style.boxShadow = '0 0 0 4px rgba(0,102,255,0.15)';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-color)';
                        e.target.style.boxShadow = 'none';
                    }}
                />
                <div style={{
                    position: 'absolute',
                    right: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0',
                }}>
                    <button
                        type="button"
                        onClick={() => handleStep(1)}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '2px',
                            cursor: 'pointer',
                            color: 'var(--text-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ChevronUp size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleStep(-1)}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '2px',
                            cursor: 'pointer',
                            color: 'var(--text-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ChevronDown size={14} />
                    </button>
                </div>
            </div>
            {helperText && (
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
                    {helperText}
                </p>
            )}
        </div>
    );
}
