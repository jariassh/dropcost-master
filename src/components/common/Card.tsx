import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
    noPadding?: boolean;
    title?: string;
}

export function Card({
    hoverable = false,
    noPadding = false,
    title,
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
                borderRadius: '16px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 300ms ease',
                padding: noPadding ? 0 : '24px',
                cursor: hoverable ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                gap: title ? '20px' : '0',
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
            {title && (
                <div style={{
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '16px',
                    marginBottom: noPadding ? '16px' : '0'
                }}>
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: 0
                    }}>
                        {title}
                    </h3>
                </div>
            )}
            {children}
        </div>
    );
}
