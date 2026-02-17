import type { BadgeVariant } from '@/types/common.types';

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

const getVariantColors = (v: BadgeVariant) => {
    switch (v) {
        case 'success':
        case 'pill-success':
        case 'modern-success':
            return { bg: 'var(--color-success-light)', text: 'var(--color-success)', border: 'var(--color-success)' };
        case 'error':
        case 'pill-error':
        case 'modern-error':
            return { bg: 'var(--color-error-light)', text: 'var(--color-error)', border: 'var(--color-error)' };
        case 'warning':
        case 'pill-warning':
        case 'modern-warning':
            return { bg: 'var(--color-warning-light)', text: 'var(--color-warning)', border: 'var(--color-warning)' };
        case 'pill-purple':
            return { bg: 'rgba(139, 92, 246, 0.1)', text: 'rgb(139, 92, 246)', border: 'rgba(139, 92, 246, 0.2)' };
        case 'pill-secondary':
            return { bg: 'var(--bg-secondary)', text: 'var(--text-secondary)', border: 'var(--border-color)' };
        default:
            return { bg: 'var(--color-primary-light)', text: 'var(--color-primary)', border: 'var(--color-primary)' };
    }
};

export function Badge({ variant = 'info', children, className = '' }: BadgeProps) {
    const colors = getVariantColors(variant);

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}33`,
                lineHeight: 1,
                whiteSpace: 'nowrap'
            }}
            className={className}
        >
            {children}
        </span>
    );
}
