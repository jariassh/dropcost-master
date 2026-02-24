import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { cargarPaises, Pais } from '@/services/paisesService';

export interface SelectPaisProps {
    value?: string; // ISO-2 code
    onChange: (iso: string) => void;
    placeholder?: string;
    showTelefono?: boolean;
    showMoneda?: boolean;
    disabled?: boolean;
    label?: string;
    error?: string;
    helperText?: string;
    required?: boolean;
    className?: string;
}

export function SelectPais({
    value,
    onChange,
    placeholder = "Selecciona un país",
    showTelefono = false,
    showMoneda = false,
    disabled = false,
    label,
    error,
    helperText,
    required = false,
    className = ""
}: SelectPaisProps) {
    const [paises, setPaises] = useState<Pais[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        cargarPaises().then(data => {
            setPaises(data);
            setIsLoading(false);
        });
    }, []);

    const paisSeleccionado = useMemo(() =>
        paises.find(p => p.codigo_iso_2.toUpperCase() === value?.toUpperCase()),
        [paises, value]
    );

    const paisesFiltrados = useMemo(() => {
        if (!busqueda) return paises;
        const term = busqueda.toLowerCase();
        return paises.filter(p =>
            p.nombre_es.toLowerCase().includes(term) ||
            p.nombre_en.toLowerCase().includes(term) ||
            p.codigo_iso_2.toLowerCase().includes(term) ||
            (showTelefono && p.codigo_telefonico.includes(term)) ||
            (showMoneda && (p.moneda_codigo.toLowerCase().includes(term) || p.moneda_nombre.toLowerCase().includes(term)))
        );
    }, [paises, busqueda, showTelefono, showMoneda]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const borderColor = error ? 'var(--color-error)' : 'var(--border-color)';
    const focusRingColor = error ? 'rgba(239,68,68,0.15)' : 'rgba(0,102,255,0.15)';

    return (
        <div ref={containerRef} className={className} style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', position: 'relative' }}>
            {label && (
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
                </label>
            )}

            <button
                type="button"
                disabled={disabled || isLoading}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: disabled ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                    border: `1.5px solid ${isOpen ? 'var(--color-primary)' : borderColor}`,
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'all 200ms ease',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    boxShadow: isOpen ? `0 0 0 4px ${focusRingColor}` : 'none',
                    textAlign: 'left'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
                    {paisSeleccionado ? (
                        <>
                            <div style={{ width: '22px', height: '14px', flexShrink: 0, overflow: 'hidden', borderRadius: '2px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                                <img
                                    src={`https://flagcdn.com/w40/${paisSeleccionado.codigo_iso_2.toLowerCase()}.png`}
                                    alt={paisSeleccionado.nombre_es}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            <span style={{ fontSize: '14px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {paisSeleccionado.nombre_es}
                                {showTelefono && <span style={{ marginLeft: '8px', color: 'var(--text-tertiary)', fontWeight: 400 }}>({paisSeleccionado.codigo_telefonico})</span>}
                                {showMoneda && <span style={{ marginLeft: '8px', color: 'var(--color-success)', fontWeight: 600, fontSize: '12px' }}>[{paisSeleccionado.moneda_codigo}]</span>}
                            </span>
                        </>
                    ) : (
                        <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                            {isLoading ? 'Cargando países...' : placeholder}
                        </span>
                    )}
                </div>
                <ChevronDown
                    size={14}
                    style={{
                        color: 'var(--text-tertiary)',
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 200ms',
                        marginLeft: '8px'
                    }}
                />
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
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'scaleIn 150ms ease-out'
                }}>
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar país..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 32px',
                                fontSize: '13px',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                outline: 'none',
                                color: 'var(--text-primary)'
                            }}
                        />
                        {busqueda && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setBusqueda(""); }}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }} className="custom-scrollbar">
                        {paisesFiltrados.map((p) => (
                            <button
                                key={p.codigo_iso_2}
                                onClick={() => {
                                    onChange(p.codigo_iso_2);
                                    setIsOpen(false);
                                    setBusqueda("");
                                }}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: value === p.codigo_iso_2 ? 'rgba(0, 102, 255, 0.08)' : 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background-color 150ms'
                                }}
                                onMouseEnter={(e) => {
                                    if (value !== p.codigo_iso_2) {
                                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = value === p.codigo_iso_2 ? 'rgba(0, 102, 255, 0.08)' : 'transparent';
                                }}
                            >
                                <div style={{ width: '22px', height: '14px', flexShrink: 0, overflow: 'hidden', borderRadius: '2px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                                    <img
                                        src={`https://flagcdn.com/w40/${p.codigo_iso_2.toLowerCase()}.png`}
                                        alt={p.nombre_es}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        loading="lazy"
                                    />
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: value === p.codigo_iso_2 ? 600 : 500 }}>
                                        {p.nombre_es}
                                    </span>
                                    {(showTelefono || showMoneda) && (
                                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', gap: '8px' }}>
                                            {showTelefono && <span>{p.codigo_telefonico}</span>}
                                            {showMoneda && <span>{p.moneda_codigo}</span>}
                                        </div>
                                    )}
                                </div>
                                {value === p.codigo_iso_2 && <Check size={14} style={{ color: 'var(--color-primary)' }} />}
                            </button>
                        ))}
                        {paisesFiltrados.length === 0 && (
                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                                No se encontraron países
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <p style={{ fontSize: '12px', color: 'var(--color-error)', margin: 0, marginTop: '2px' }}>
                    {error}
                </p>
            )}

            {helperText && !error && (
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0, marginTop: '2px', fontStyle: 'italic' }}>
                    {helperText}
                </p>
            )}

            <style>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95) translateY(-4px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--border-color);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--text-tertiary);
                }
            `}</style>
        </div>
    );
}
