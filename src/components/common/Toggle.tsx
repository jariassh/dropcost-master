/**
 * Toggle - Switch toggle on/off estilizado.
 */

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
    return (
        <label
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                style={{
                    position: 'relative',
                    width: '44px',
                    height: '24px',
                    borderRadius: '9999px',
                    border: 'none',
                    padding: 0,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    backgroundColor: checked ? 'var(--color-primary)' : 'var(--border-color)',
                    transition: 'background-color 200ms ease',
                    flexShrink: 0,
                }}
            >
                <span
                    style={{
                        position: 'absolute',
                        top: '2px',
                        left: checked ? '22px' : '2px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        transition: 'left 200ms ease',
                    }}
                />
            </button>

            {label && (
                <span
                    style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                    }}
                >
                    {label}
                </span>
            )}
        </label>
    );
}
