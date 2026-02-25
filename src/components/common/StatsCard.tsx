import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: string;
    subtitle?: string;
    action?: React.ReactNode;
    currency?: string;
    onClick?: () => void;
    className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon,
    color = 'var(--color-primary)',
    subtitle,
    action,
    currency,
    onClick,
    className = ''
}) => {
    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: 'var(--card-bg)',
                borderRadius: '20px',
                padding: '24px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
            className={className}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{
                    width: '44px', height: '44px',
                    backgroundColor: `${color}15`,
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: color
                }}>
                    {/* Render icon whether it's a component or node */}
                    {React.isValidElement(icon) ? icon : (icon as any)}
                </div>

                {action ? (
                    <div>
                        {action}
                    </div>
                ) : currency ? (
                    <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase'
                    }}>
                        {currency}
                    </div>
                ) : null}
            </div>
            <div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{title}</p>
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {typeof value === 'number' && currency ? formatCurrency(value, currency) : value}
                </h2>
                {subtitle && (
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>{subtitle}</p>
                )}
            </div>
        </div>
    );
};
