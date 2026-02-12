import type { SpinnerSize } from '@/types/common.types';

interface SpinnerProps {
    size?: SpinnerSize;
    className?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-[3px]',
    lg: 'w-16 h-16 border-4',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
    return (
        <div
            role="status"
            aria-label="Cargando"
            className={`
        ${sizeStyles[size]}
        border-[var(--border-color)] border-t-[var(--color-primary)]
        rounded-full animate-spin
        ${className}
      `.trim()}
        >
            <span className="sr-only">Cargando...</span>
        </div>
    );
}
