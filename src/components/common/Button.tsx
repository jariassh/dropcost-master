import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { ButtonVariant, ButtonSize } from '@/types/common.types';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const variantMap: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
        backgroundColor: 'var(--color-primary)',
        color: '#FFFFFF',
        border: 'none',
    },
    secondary: {
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '1.5px solid var(--border-color)',
    },
    danger: {
        backgroundColor: 'var(--color-error)',
        color: '#FFFFFF',
        border: 'none',
    },
    ghost: {
        backgroundColor: 'transparent',
        color: 'var(--color-primary)',
        border: '1.5px solid transparent',
    },
};

const hoverBgMap: Record<ButtonVariant, string> = {
    primary: 'var(--color-primary-dark)',
    secondary: 'var(--border-color)',
    danger: '#DC2626',
    ghost: 'var(--color-primary-light)',
};

const sizeMap: Record<ButtonSize, React.CSSProperties> = {
    xs: { padding: '6px 12px', fontSize: '11px', gap: '4px' },
    sm: { padding: '8px 16px', fontSize: '12px', gap: '6px' },
    md: { padding: '12px 28px', fontSize: '14px', gap: '8px' },
    lg: { padding: '14px 32px', fontSize: '15px', gap: '10px' },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            fullWidth = false,
            disabled,
            leftIcon,
            rightIcon,
            children,
            className = '',
            style,
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || isLoading;
        const baseVariant = variantMap[variant];
        const baseSize = sizeMap[size];
        const hoverBg = hoverBgMap[variant];

        return (
            <button
                ref={ref}
                disabled={isDisabled}
                className={className}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    borderRadius: '10px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 200ms ease',
                    outline: 'none',
                    width: fullWidth ? '100%' : 'auto',
                    opacity: isDisabled ? 0.5 : 1,
                    transform: 'translateY(0)',
                    letterSpacing: '0.01em',
                    ...baseVariant,
                    ...baseSize,
                    ...style,
                }}
                onMouseEnter={(e) => {
                    if (isDisabled) return;
                    const el = e.currentTarget;
                    // Si el componente tiene un color de fondo personalizado o no es el default, usamos brillo
                    if (style?.backgroundColor) {
                        el.style.filter = 'brightness(0.9)';
                    } else {
                        el.style.backgroundColor = hoverBg;
                    }

                    if (variant === 'primary') {
                        el.style.transform = 'translateY(-2px)';
                        el.style.boxShadow = '0 6px 20px rgba(0,102,255,0.35)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (isDisabled) return;
                    const el = e.currentTarget;
                    if (style?.backgroundColor) {
                        el.style.filter = 'none';
                    } else {
                        el.style.backgroundColor = baseVariant.backgroundColor || '';
                    }
                    el.style.transform = 'translateY(0)';
                    el.style.boxShadow = 'none';
                }}
                onFocus={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0,102,255,0.2)';
                }}
                onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                }}
                {...props}
            >
                {isLoading ? (
                    <Loader2 size={size === 'sm' ? 14 : 18} style={{ animation: 'spin 700ms linear infinite' }} />
                ) : (
                    leftIcon
                )}
                {children}
                {!isLoading && rightIcon}
            </button>
        );
    }
);

Button.displayName = 'Button';
