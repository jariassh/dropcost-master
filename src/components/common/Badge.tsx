import type { BadgeVariant } from '@/types/common.types';

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    error: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    'modern-success': 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm',
    'modern-warning': 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm',
    'modern-error': 'bg-red-50 text-red-700 border border-red-200 shadow-sm',
    'modern-info': 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm',

};

export function Badge({ variant = 'info', children, className = '' }: BadgeProps) {
    return (
        <span
            className={`
        inline-flex items-center px-3 py-1 rounded-full
        text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `.trim()}
        >
            {children}
        </span>
    );
}
