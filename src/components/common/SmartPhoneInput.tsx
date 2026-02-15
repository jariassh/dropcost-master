import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Phone } from 'lucide-react';
import { cargarPaises, Pais } from '@/services/paisesService';

interface SmartPhoneInputProps {
    value: string;
    onChange: (fullValue: string, iso: string) => void;
    error?: string;
    label?: string;
}

export function SmartPhoneInput({ value, onChange, error, label }: SmartPhoneInputProps) {
    const [allPaises, setAllPaises] = useState<Pais[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<Pais | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load countries on mount
    useEffect(() => {
        cargarPaises().then(data => {
            setAllPaises(data);

            // Set default (Colombia)
            const co = data.find(p => p.codigo_iso_2 === 'CO') || data[0];
            setSelectedCountry(co);

            // If initial value exists (+57...), try to set country
            if (value && value.startsWith('+')) {
                for (let i = 4; i >= 1; i--) {
                    const prefix = '+' + value.substring(1, 1 + i);
                    const country = data.find(p => p.codigo_telefonico === prefix);
                    if (country) {
                        setSelectedCountry(country);
                        setPhoneNumber(value.substring(1 + i));
                        break;
                    }
                }
            }
        });
    }, []);

    const filteredCountries = useMemo(() => {
        const s = search.toLowerCase();
        return allPaises.filter(c =>
            c.nombre_es.toLowerCase().includes(s) ||
            c.codigo_telefonico.includes(s) ||
            c.codigo_iso_2.toLowerCase().includes(s)
        );
    }, [allPaises, search]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;

        // 1. Permitir el símbolo "+" solo al inicio para que el usuario pueda escribir el código
        if (val === '+') {
            setPhoneNumber('+');
            return;
        }

        // 2. Detección inteligente si empieza por +
        if (val.startsWith('+')) {
            const numericPart = val.substring(1).replace(/\D/g, '');

            // Buscar coincidencia de código más larga primero (1 a 3 dígitos)
            let bestMatch: Pais | null = null;
            let codeFound = "";

            for (let i = Math.min(numericPart.length, 3); i >= 1; i--) {
                const sub = '+' + numericPart.substring(0, i);
                const found = allPaises.find(c => c.codigo_telefonico === sub);
                if (found) {
                    bestMatch = found;
                    codeFound = sub;
                    break;
                }
            }

            if (bestMatch) {
                // ¡Encontrado! Cambiamos el selector y dejamos solo el resto en el input
                setSelectedCountry(bestMatch);
                const rest = numericPart.substring(codeFound.length - 1);
                setPhoneNumber(rest);
                onChange(`${bestMatch.codigo_telefonico}${rest}`, bestMatch.codigo_iso_2);
            } else {
                // Aún no hay match (ej: escribió +5), dejamos que siga escribiendo con el +
                setPhoneNumber('+' + numericPart.substring(0, 12)); // Limitar longitud
            }
            return;
        }

        // 3. Comportamiento normal (solo números)
        const numeric = val.replace(/\D/g, '').substring(0, 12); // Máximo 12 dígitos para el número local
        setPhoneNumber(numeric);
        if (selectedCountry) {
            onChange(`${selectedCountry.codigo_telefonico}${numeric}`, selectedCountry.codigo_iso_2);
        }
    };

    const selectCountry = (c: Pais) => {
        setSelectedCountry(c);
        setIsOpen(false);
        setSearch('');
        onChange(`${c.codigo_telefonico}${phoneNumber}`, c.codigo_iso_2);
    };

    return (
        <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', position: 'relative' }}>
            {label && (
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {label}
                </label>
            )}

            <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-primary)',
                border: `1.5px solid ${error ? 'var(--color-error)' : 'var(--border-color)'}`,
                borderRadius: '10px',
                overflow: 'visible',
                transition: 'all 200ms ease',
                position: 'relative'
            }}>
                {/* Selector de País */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '12px 14px',
                        border: 'none',
                        borderRight: '1.5px solid var(--border-color)',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        flexShrink: 0,
                        minWidth: '105px'
                    }}
                >
                    {selectedCountry ? (
                        <>
                            <span style={{ fontSize: '20px', lineHeight: 1 }}>{selectedCountry.bandera}</span>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>{selectedCountry.codigo_telefonico}</span>
                        </>
                    ) : (
                        <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>...</span>
                    )}
                    <ChevronDown size={14} style={{ color: 'var(--text-tertiary)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
                </button>

                {/* Input de Teléfono */}
                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        placeholder="300 123 4567"
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            outline: 'none',
                        }}
                    />
                </div>

                {/* Dropdown del Selector */}
                {isOpen && (
                    <div
                        ref={dropdownRef}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '8px',
                            width: '300px',
                            backgroundColor: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            boxShadow: 'var(--shadow-xl)',
                            zIndex: 1000,
                            padding: '8px',
                            animation: 'scaleIn 150ms ease-out'
                        }}
                    >
                        {/* Buscador */}
                        <div style={{
                            position: 'relative',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-tertiary)' }} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Buscar país o código..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 8px 8px 32px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Lista de Países */}
                        <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {filteredCountries.map((c) => (
                                <button
                                    key={`${c.codigo_iso_2}-${c.codigo_telefonico}`}
                                    onClick={() => selectCountry(c)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: selectedCountry?.codigo_iso_2 === c.codigo_iso_2 ? 'rgba(0, 102, 255, 0.08)' : 'transparent',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background-color 150ms'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = selectedCountry?.codigo_iso_2 === c.codigo_iso_2 ? 'rgba(0, 102, 255, 0.08)' : 'transparent')}
                                >
                                    <span style={{ fontSize: '20px' }}>{c.bandera}</span>
                                    <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {c.nombre_es}
                                    </span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                                        {c.codigo_telefonico}
                                    </span>
                                </button>
                            ))}
                            {filteredCountries.length === 0 && (
                                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                                    No se encontraron países
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p style={{ fontSize: '12px', color: 'var(--color-error)', margin: 0 }}>
                    {error}
                </p>
            )}
        </div>
    );
}
