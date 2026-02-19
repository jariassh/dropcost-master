/**
 * Sistema de Toast (notificaciones temporales)
 * - Componente Toast renderiza las notificaciones
 * - Hook useToast expone métodos para mostrar toasts
 * - Store interno con Zustand para gestión de estado
 */
import { useEffect } from 'react';
import { create } from 'zustand';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { AlertType, ToastMessage } from '@/types/common.types';

// ─── Store interno para toasts ───
interface ToastStore {
    toasts: ToastMessage[];
    addToast: (toast: Omit<ToastMessage, 'id'>) => void;
    removeToast: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
        }));
    },
    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }));
    },
}));

// ─── Hook público ───
export function useToast() {
    const { addToast, removeToast } = useToastStore();

    return {
        success: (title: string, description?: string) =>
            addToast({ type: 'success', title, description, duration: 5000 }),
        error: (title: string, description?: string) =>
            addToast({ type: 'error', title, description, duration: 7000 }),
        warning: (title: string, description?: string) =>
            addToast({ type: 'warning', title, description, duration: 5000 }),
        info: (title: string, description?: string) =>
            addToast({ type: 'info', title, description, duration: 5000 }),
        dismiss: removeToast,
    };
}

// ─── Ícono por tipo ───
const iconMap: Record<AlertType, React.ElementType> = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const colorMap: Record<AlertType, string> = {
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    warning: 'var(--color-warning)',
    info: 'var(--color-primary)',
};

// ─── Toast individual ───
function ToastItem({ toast }: { toast: ToastMessage }) {
    const { removeToast } = useToastStore();
    const Icon = iconMap[toast.type];
    const color = colorMap[toast.type];

    useEffect(() => {
        const duration = toast.duration || 5000;
        const timer = setTimeout(() => removeToast(toast.id), duration);
        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, removeToast]);

    return (
        <div
            style={{
                display: 'flex',
                gap: '16px',
                minWidth: '340px',
                maxWidth: '480px',
                padding: '18px 24px',
                borderRadius: '12px',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderLeft: `5px solid ${color}`,
                boxShadow: '0 12px 40px -8px rgba(0,0,0,0.15)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                position: 'relative',
                overflow: 'hidden',
                alignItems: 'start',
                pointerEvents: 'auto',
                transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                animation: 'scaleIn 450ms cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
        >
            {/* Background Glow Extra Sutil */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.03,
                    backgroundColor: color,
                    pointerEvents: 'none'
                }}
            />

            {/* Icon Column */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    minWidth: '40px',
                    borderRadius: '50%',
                    backgroundColor: `${color}15`,
                    color: color,
                    marginTop: '2px'
                }}
            >
                <Icon size={20} strokeWidth={2.5} />
            </div>

            {/* Content Column */}
            <div style={{ flex: 1, minWidth: 0, paddingRight: '22px' }}>
                <p
                    style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        lineHeight: '1.4',
                        letterSpacing: '-0.01em',
                        margin: 0
                    }}
                >
                    {toast.title}
                </p>
                {toast.description && (
                    <p
                        style={{
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            marginTop: '6px',
                            fontWeight: 500,
                            lineHeight: '1.5',
                            margin: '6px 0 0 0',
                            opacity: 0.9
                        }}
                    >
                        {toast.description}
                    </p>
                )}
            </div>

            {/* Close Button */}
            <button
                onClick={() => removeToast(toast.id)}
                style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '6px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-tertiary)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.6
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-tertiary)';
                    e.currentTarget.style.opacity = '0.6';
                }}
                aria-label="Cerrar notificación"
            >
                <X size={16} strokeWidth={2.5} />
            </button>
        </div>
    );
}

// ─── Contenedor de Toasts ───
export function ToastContainer() {
    const { toasts } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                alignItems: 'flex-end',
                pointerEvents: 'none'
            }}
            aria-live="polite"
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </div>
    );
}
