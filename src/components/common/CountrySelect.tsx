import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cargarPaises, Pais } from '@/services/paisesService';

interface CountrySelectProps {
    value?: string; // ISO-2
    onChange: (iso: string) => void;
    label?: string;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
}

export function CountrySelect({
    value,
    onChange,
    label,
    placeholder = 'Seleccionar país...',
    error,
    disabled = false
}: CountrySelectProps) {
    const [paises, setPaises] = useState<Pais[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        cargarPaises().then(setPaises);
    }, []);

    const selectedPais = useMemo(() =>
        paises.find(p => p.codigo_iso_2.toUpperCase() === value?.toUpperCase()),
        [paises, value]);

    const filteredPaises = useMemo(() => {
        const s = search.toLowerCase();
        return paises.filter(p =>
            p.nombre_es.toLowerCase().includes(s) ||
            p.codigo_iso_2.toLowerCase().includes(s) ||
            p.moneda_codigo.toLowerCase().includes(s) ||
            p.moneda_nombre.toLowerCase().includes(s)
        );
    }, [paises, search]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', position: 'relative' }}>
            {label && (
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '12px 16px',
                    backgroundColor: disabled ? 'var(--bg-secondary)' : 'var(--card-bg)',
                    border: `1.5px solid ${error ? 'var(--color-error)' : isOpen ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    borderRadius: '10px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 200ms ease',
                    textAlign: 'left',
                    opacity: disabled ? 0.6 : 1,
                    boxShadow: isOpen ? '0 0 0 3px rgba(0, 102, 255, 0.1)' : 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, overflow: 'hidden' }}>
                    {selectedPais ? (
                        <>
                            <img
                                src={`https://flagcdn.com/w40/${selectedPais.codigo_iso_2.toLowerCase()}.png`}
                                alt={selectedPais.nombre_es}
                                style={{ width: '22px', borderRadius: '3px', flexShrink: 0 }}
                            />
                            <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {selectedPais.nombre_es}
                            </span>
                        </>
                    ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>{placeholder}</span>
                    )}
                </div>
                <ChevronDown size={18} style={{ color: 'var(--text-tertiary)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms', flexShrink: 0 }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '8px',
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 1000,
                    padding: '8px',
                    maxHeight: '320px',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'scaleIn 150ms ease-out'
                }}>
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar país..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 36px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {filteredPaises.map((p) => (
                            <button
                                key={p.codigo_iso_2}
                                onClick={() => {
                                    onChange(p.codigo_iso_2);
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: value === p.codigo_iso_2 ? 'rgba(0, 102, 255, 0.08)' : 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 150ms'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = value === p.codigo_iso_2 ? 'rgba(0, 102, 255, 0.08)' : 'transparent')}
                            >
                                <img
                                    src={`https://flagcdn.com/w40/${p.codigo_iso_2.toLowerCase()}.png`}
                                    alt={p.nombre_es}
                                    style={{ width: '20px', borderRadius: '2px' }}
                                />
                                <span style={{ flex: 1, fontSize: '13px', color: value === p.codigo_iso_2 ? 'var(--color-primary)' : 'var(--text-primary)', fontWeight: value === p.codigo_iso_2 ? 600 : 400 }}>
                                    {p.nombre_es}
                                </span>
                                {value === p.codigo_iso_2 && <Check size={14} style={{ color: 'var(--color-primary)' }} />}
                            </button>
                        ))}
                        {filteredPaises.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                                No se encontraron resultados
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <p style={{ fontSize: '12px', color: 'var(--color-error)', margin: '4px 0 0' }}>
                    {error}
                </p>
            )}

            <style>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
