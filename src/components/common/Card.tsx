import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
    noPadding?: boolean;
}

export function Card({
    hoverable = false,
    noPadding = false,
    children,
    className = '',
    style,
    ...props
}: CardProps) {
    return (
        <div
            className={className}
            style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 300ms ease',
                padding: noPadding ? 0 : '24px',
                cursor: hoverable ? 'pointer' : 'default',
                ...style,
            }}
            onMouseEnter={(e) => {
                if (!hoverable) return;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={(e) => {
                if (!hoverable) return;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
            {...props}
        >
            {children}
        </div>
    );
}
