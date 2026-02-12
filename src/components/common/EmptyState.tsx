/**
 * EmptyState - Estado vacío genérico con icono, título, descripción y CTA.
 */
import type { ReactNode } from 'react';

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '64px 24px',
                textAlign: 'center',
            }}
        >
            <div
                style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                    opacity: 0.6,
                }}
            >
                {icon}
            </div>

            <h3
                style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '8px',
                }}
            >
                {title}
            </h3>

            <p
                style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    maxWidth: '400px',
                    lineHeight: 1.6,
                    marginBottom: action ? '24px' : '0',
                }}
            >
                {description}
            </p>

            {action && (
                <button
                    onClick={action.onClick}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: 'var(--color-primary)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                        e.currentTarget.style.transform = 'none';
                    }}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
