import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            size="sm"
            closeOnOverlay={!isLoading}
            footer={
                <>
                    <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={isDanger ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col items-center text-center p-2">
                <div
                    className="mb-5 p-4 rounded-full shadow-sm"
                    style={{
                        backgroundColor: isDanger ? '#FEF2F2' : '#EFF6FF',
                        color: isDanger ? '#DC2626' : '#2563EB',
                        border: `1px solid ${isDanger ? '#FEE2E2' : '#DBEAFE'}`,
                    }}
                >
                    {isDanger ? <AlertTriangle size={32} strokeWidth={1.5} /> : <HelpCircle size={32} strokeWidth={1.5} />}
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                    {title}
                </h3>
                <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed max-w-[90%] mx-auto">
                    {description}
                </p>
            </div>
        </Modal>
    );
}
