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
                    marginBottom: '24px',
                    color: 'var(--text-tertiary)',
                    opacity: 0.8,
                }}
            >
                {icon}
            </div>

            <h3
                style={{
                    fontSize: '18px',
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
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: 'var(--color-primary)',
                        border: 'none',
                        borderRadius: '10px', // Standard radius
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                        boxShadow: '0 2px 8px rgba(0, 102, 255, 0.2)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 102, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 102, 255, 0.2)';
                    }}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
