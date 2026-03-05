import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    highlight?: string;
    description?: string;
    icon: LucideIcon;
    actions?: React.ReactNode;
    isMobile?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    highlight,
    description,
    icon: Icon,
    actions,
    isMobile = false
}) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '20px' : '0',
            marginBottom: '32px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: 'var(--color-primary)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 8px 16px rgba(var(--color-primary-rgb, 0, 102, 255), 0.2)'
                }}>
                    <Icon size={24} />
                </div>
                <div>
                    <h1 style={{
                        fontSize: isMobile ? '24px' : '32px',
                        fontWeight: 600,
                        letterSpacing: '-0.02em',
                        margin: 0,
                        color: 'var(--text-primary)'
                    }}>
                        {title} {highlight && <span style={{ color: 'var(--color-primary)' }}>{highlight}</span>}
                    </h1>
                    {description && (
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '14px',
                            marginTop: '4px',
                            marginRight: 0,
                            marginBottom: 0,
                            marginLeft: 0
                        }}>
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {actions && (
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    width: isMobile ? '100%' : 'auto'
                }}>
                    {actions}
                </div>
            )}
        </div>
    );
};
