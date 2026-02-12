import type { BadgeVariant } from '@/types/common.types';

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-[#D1FAE5] text-[#065F46]',
    warning: 'bg-[#FEF3C7] text-[#92400E]',
    error: 'bg-[#FEE2E2] text-[#991B1B]',
    info: 'bg-[#E0E7FF] text-[#3730A3]',
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
