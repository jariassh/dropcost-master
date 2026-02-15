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

    return (
        <div ref={containerRef} className={`relative flex flex-col gap-1.5 w-full ${className}`}>
            {label && (
                <label className="text-sm font-medium text-[var(--text-primary)]">
                    {label} {required && <span className="text-[var(--color-error)]">*</span>}
                </label>
            )}

            <button
                type="button"
                disabled={disabled || isLoading}
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all duration-200 text-left
          ${disabled ? 'bg-[var(--bg-secondary)] cursor-not-allowed opacity-60' : 'bg-[var(--card-bg)] cursor-pointer hover:border-[var(--color-primary)]'}
          ${error ? 'border-[var(--color-error)]' : isOpen ? 'border-[var(--color-primary)] ring-4 ring-[var(--color-primary)] ring-opacity-10' : 'border-[var(--border-color)]'}
        `}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {paisSeleccionado ? (
                        <>
                            <span className="text-xl leading-none flex-shrink-0">{paisSeleccionado.bandera}</span>
                            <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                                {paisSeleccionado.nombre_es}
                                {showTelefono && <span className="ml-2 text-[var(--text-tertiary)] font-normal">({paisSeleccionado.codigo_telefonico})</span>}
                                {showMoneda && <span className="ml-2 text-[var(--color-success)] font-normal text-xs uppercase">[{paisSeleccionado.moneda_codigo}]</span>}
                            </span>
                        </>
                    ) : (
                        <span className="text-sm text-[var(--text-tertiary)] truncate">
                            {isLoading ? 'Cargando países...' : placeholder}
                        </span>
                    )}
                </div>
                <ChevronDown
                    size={18}
                    className={`text-[var(--text-tertiary)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 z-[1000] mt-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-[var(--shadow-xl)] p-2 flex flex-col animate-[scaleIn_150ms_ease-out]">
                    <div className="relative mb-2">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar por nombre, código o moneda..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg outline-none text-[var(--text-primary)]"
                        />
                        {busqueda && (
                            <button
                                onClick={() => setBusqueda("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
                        {paisesFiltrados.map((p) => (
                            <button
                                key={p.codigo_iso_2}
                                onClick={() => {
                                    onChange(p.codigo_iso_2);
                                    setIsOpen(false);
                                    setBusqueda("");
                                }}
                                className={`
                  flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-all
                  ${value === p.codigo_iso_2 ? 'bg-[var(--color-primary)] bg-opacity-10 text-[var(--color-primary)]' : 'hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]'}
                `}
                            >
                                <span className="text-xl flex-shrink-0">{p.bandera}</span>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className={`text-sm ${value === p.codigo_iso_2 ? 'font-semibold' : 'font-medium'} truncate`}>
                                        {p.nombre_es}
                                    </span>
                                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
                                        <span>{p.codigo_iso_2}</span>
                                        {showTelefono && <span>• {p.codigo_telefonico}</span>}
                                        {showMoneda && <span>• {p.moneda_codigo} ({p.moneda_simbolo})</span>}
                                    </div>
                                </div>
                                {value === p.codigo_iso_2 && <Check size={14} className="text-[var(--color-primary)]" />}
                            </button>
                        ))}
                        {paisesFiltrados.length === 0 && (
                            <div className="py-6 text-center text-[var(--text-tertiary)] text-sm">
                                No se encontraron países
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <p className="text-xs text-[var(--color-error)] mt-1 animate-fadeIn">
                    {error}
                </p>
            )}

            <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
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
