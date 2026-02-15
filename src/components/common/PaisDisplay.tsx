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
        sm: 'text-base',
        md: 'text-xl',
        lg: 'text-2xl'
    };

    return (
        <div className={`inline-flex items-center ${sizeClasses[size]} ${className}`}>
            {showFlag && (
                <span className={`${flagSizes[size]} leading-none`}>
                    {pais.bandera}
                </span>
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
