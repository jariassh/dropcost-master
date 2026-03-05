import React, { type HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
    noPadding?: boolean;
    title?: string;
    icon?: ReactNode;
    headerAction?: ReactNode;
    description?: string | ReactNode;
}

export function Card({
    hoverable = false,
    noPadding = false,
    title,
    description,
    icon,
    headerAction,
    children,
    className = '',
    style,
    ...props
}: CardProps) {
    const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return (
        <div
            className={className}
            style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 300ms ease',
                padding: noPadding ? 0 : isMobile ? '20px 16px' : '24px',
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
                    marginBottom: noPadding ? '16px' : '0',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    gap: isMobile ? '16px' : '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {icon && (
                            <div style={{
                                padding: '8px',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-primary)'
                            }}>
                                {icon}
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{
                                fontSize: isMobile ? '16px' : 'var(--fs-card-title)',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                margin: 0,
                                letterSpacing: 'var(--ls-h)',
                                lineHeight: 1.3
                            }}>
                                {title}
                            </h3>
                            {description && (
                                <p style={{
                                    fontSize: '12px',
                                    color: 'var(--text-tertiary)',
                                    margin: '4px 0 0',
                                    fontWeight: 400,
                                    lineHeight: '1.4'
                                }}>
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                    {headerAction && (
                        <div style={{ width: isMobile ? '100%' : 'auto' }}>
                            {headerAction}
                        </div>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}
