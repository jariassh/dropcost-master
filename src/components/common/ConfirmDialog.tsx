import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
    onConfirm,
    onCancel,
    isLoading = false,
}: ConfirmDialogProps) {
    const isDanger = variant === 'danger';
    const color = isDanger ? '#EF4444' : 'var(--color-primary)';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            size="sm"
            closeOnOverlay={!isLoading}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '16px 8px 8px 8px'
                }}
            >
                {/* Icon Decorator */}
                <div
                    style={{
                        marginBottom: '32px',
                        padding: '24px',
                        borderRadius: '50%',
                        backgroundColor: `${color}20`,
                        color: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '84px',
                        height: '84px'
                    }}
                >
                    {isDanger ? <AlertTriangle size={42} strokeWidth={2} /> : <HelpCircle size={42} strokeWidth={2} />}
                </div>

                {/* Content */}
                <h3
                    style={{
                        fontSize: '24px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        marginBottom: '16px',
                        letterSpacing: '-0.02em'
                    }}
                >
                    {title}
                </h3>
                <p
                    style={{
                        fontSize: '15px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.6',
                        maxWidth: '280px',
                        margin: '0 auto 40px auto'
                    }}
                >
                    {description}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isLoading}
                        fullWidth
                        style={{ height: '48px', borderRadius: '12px', fontWeight: 700 }}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={isDanger ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        isLoading={isLoading}
                        fullWidth
                        style={{
                            height: '48px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            boxShadow: isDanger ? '0 4px 14px rgba(239, 68, 68, 0.4)' : undefined
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
