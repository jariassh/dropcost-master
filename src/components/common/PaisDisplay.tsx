import React from 'react';
import { Pais } from '@/services/paisesService';

interface PaisDisplayProps {
    pais?: Pais | null;
    showCode?: boolean;
    showFlag?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function PaisDisplay({
    pais,
    showCode = false,
    showFlag = true,
    className = "",
    size = 'md'
}: PaisDisplayProps) {
    if (!pais) return null;

    const sizeClasses = {
        sm: 'text-xs gap-1.5',
        md: 'text-sm gap-2',
        lg: 'text-base gap-2.5'
    };

    const flagSizes = {
        sm: 'w-4 h-2.5',
        md: 'w-5 h-3',
        lg: 'w-6 h-4'
    };

    return (
        <div className={`inline-flex items-center ${sizeClasses[size]} ${className}`}>
            {showFlag && (
                <div className={`${flagSizes[size]} flex-shrink-0 overflow-hidden rounded-sm shadow-sm border border-[var(--border-color)] bg-[var(--bg-secondary)]`}>
                    <img
                        src={`https://flagcdn.com/w40/${pais.codigo_iso_2.toLowerCase()}.png`}
                        alt={pais.nombre_es}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <span className="font-medium text-[var(--text-primary)] truncate">
                {pais.nombre_es}
                {showCode && (
                    <span className="ml-1.5 text-[var(--text-tertiary)] font-normal uppercase">
                        ({pais.codigo_iso_2})
                    </span>
                )}
            </span>
        </div>
    );
}
