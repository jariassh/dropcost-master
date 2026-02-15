import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { buscarPaises, Pais } from '@/services/paisesService';

interface InputPaisAutocompletadoProps {
    onSelect: (pais: Pais) => void;
    placeholder?: string;
    label?: string;
    className?: string;
}

export function InputPaisAutocompletado({
    onSelect,
    placeholder = "Escribe el nombre de un país...",
    label,
    className = ""
}: InputPaisAutocompletadoProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Pais[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            const filtered = await buscarPaises(query);
            setResults(filtered.slice(0, 10)); // Limit to top 10 results
            setIsOpen(true);
        }, 200);

        return () => clearTimeout(timer);
    }, [query]);

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
                    {label}
                </label>
            )}

            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-11 pr-10 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)] focus:ring-opacity-10 transition-all text-sm"
                />
                {query && (
                    <button
                        onClick={() => { setQuery(""); setResults([]); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-[1000] mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-[var(--shadow-xl)] overflow-hidden animate-[scaleIn_150ms_ease-out]">
                    {results.map((p) => (
                        <button
                            key={p.codigo_iso_2}
                            onClick={() => {
                                onSelect(p);
                                setQuery("");
                                setIsOpen(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--bg-secondary)] text-left transition-colors"
                        >
                            <span className="text-xl">{p.bandera}</span>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-[var(--text-primary)]">
                                    {p.nombre_es}
                                </span>
                                <span className="text-[11px] text-[var(--text-tertiary)]">
                                    {p.region} • {p.moneda_codigo}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
