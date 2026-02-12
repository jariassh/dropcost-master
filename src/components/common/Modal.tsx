import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { ModalSize } from '@/types/common.types';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: ModalSize;
    children: ReactNode;
    footer?: ReactNode;
    /** Si false, no se cierra al hacer clic fuera */
    closeOnOverlay?: boolean;
}

const sizeStyles: Record<ModalSize, string> = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
};

export function Modal({
    isOpen,
    onClose,
    title,
    size = 'md',
    children,
    footer,
    closeOnOverlay = true,
}: ModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Cerrar con Escape
    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ animation: 'fadeIn 200ms ease-out' }}
        >
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-[var(--overlay-bg)] backdrop-blur-sm"
                onClick={closeOnOverlay ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Contenido del modal */}
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
                className={`
          relative w-full ${sizeStyles[size]}
          bg-[var(--card-bg)] rounded-2xl
          shadow-[var(--shadow-xl)] p-8
          ${size === 'sm' ? 'p-6' : ''}
        `.trim()}
                style={{ animation: 'scaleIn 200ms ease-out' }}
            >
                {/* Cabecera */}
                {title && (
                    <div className="flex items-center justify-between mb-6">
                        <h3 id="modal-title" className="text-xl font-semibold text-[var(--text-primary)]">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                            aria-label="Cerrar modal"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Cuerpo */}
                <div className="mb-6">{children}</div>

                {/* Footer */}
                {footer && (
                    <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border-color)]">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
