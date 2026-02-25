import { type InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    rightElement?: React.ReactNode;
    showPasswordToggle?: boolean;
    children?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            rightElement,
            showPasswordToggle = false,
            type = 'text',
            id,
            className = '',
            disabled,
            children,
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);

        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
        const isPassword = type === 'password';
        const resolvedType = isPassword && showPassword ? 'text' : type;
        const hasError = Boolean(error);
        const hasRightAddon = rightIcon || rightElement || (isPassword && showPasswordToggle);

        const borderColor = hasError ? 'var(--color-error)' : 'var(--border-color)';
        const focusBorderColor = hasError ? 'var(--color-error)' : 'var(--color-primary)';
        const focusRingColor = hasError ? 'rgba(239,68,68,0.15)' : 'rgba(0,102,255,0.15)';

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                {label && (
                    <label
                        htmlFor={inputId}
                        style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                        }}
                    >
                        {label}
                    </label>
                )}
                <div style={{ position: 'relative' }}>
                    {leftIcon && (
                        <span
                            style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                pointerEvents: 'none',
                                zIndex: 1,
                            }}
                        >
                            {leftIcon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        type={resolvedType}
                        disabled={disabled}
                        className={className}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            paddingLeft: leftIcon ? '44px' : '16px',
                            paddingRight: hasRightAddon ? '44px' : '16px',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            borderRadius: '10px',
                            backgroundColor: disabled ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            border: `1.5px solid ${borderColor}`,
                            outline: 'none',
                            transition: 'all 200ms ease',
                            opacity: disabled ? 0.5 : 1,
                            cursor: disabled ? 'not-allowed' : 'text',
                            boxShadow: 'none',
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = focusBorderColor;
                            e.target.style.boxShadow = `0 0 0 4px ${focusRingColor}`;
                            props.onFocus?.(e);
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = borderColor;
                            e.target.style.boxShadow = 'none';
                            props.onBlur?.(e);
                        }}
                        {...props}
                    />
                    {isPassword && showPasswordToggle && (
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            style={{
                                position: 'absolute',
                                right: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-tertiary)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 150ms ease',
                                zIndex: 2
                            }}
                            tabIndex={-1}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            onMouseEnter={(e) => {
                                (e.target as HTMLElement).style.color = 'var(--text-secondary)';
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLElement).style.color = 'var(--text-tertiary)';
                            }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}
                    {(rightIcon || rightElement) && !isPassword && (
                        <span
                            style={{
                                position: 'absolute',
                                right: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                pointerEvents: rightElement ? 'auto' : 'none',
                                zIndex: 2
                            }}
                        >
                            {rightElement || rightIcon}
                        </span>
                    )}
                    {children}
                </div>
                {error && (
                    <p style={{ fontSize: '12px', color: 'var(--color-error)', margin: 0 }}>
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
