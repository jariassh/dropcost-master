import React from 'react';
import type { ReactNode } from 'react';

interface CompactEmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
}

export const CompactEmptyState: React.FC<CompactEmptyStateProps> = ({
    icon,
    title,
    description,
    className = "",
    style,
    children
}) => {
    return (
        <div
            className={`flex flex-col items-center justify-center p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] border-dashed rounded-xl text-center h-full ${className}`}
            style={style}
        >
            {icon && (
                <div className="p-3 bg-[var(--bg-primary)] rounded-full border border-[var(--border-color)] mb-3">
                    {icon}
                </div>
            )}
            <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
            {description && (
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{description}</p>
            )}
            {children}
        </div>
    );
};
