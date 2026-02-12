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
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#0066FF',
};

// ─── Toast individual ───
function ToastItem({ toast }: { toast: ToastMessage }) {
    const { removeToast } = useToastStore();
    const Icon = iconMap[toast.type];

    useEffect(() => {
        const duration = toast.duration || 5000;
        const timer = setTimeout(() => removeToast(toast.id), duration);
        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, removeToast]);

    return (
        <div
            className="flex items-start gap-3 min-w-[320px] max-w-[400px] p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-[var(--shadow-lg)] border-l-4"
            style={{
                borderLeftColor: colorMap[toast.type],
                animation: 'slideUp 200ms ease-out',
            }}
        >
            <Icon size={20} style={{ color: colorMap[toast.type], flexShrink: 0, marginTop: 1 }} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{toast.title}</p>
                {toast.description && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{toast.description}</p>
                )}
            </div>
            <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex-shrink-0"
                aria-label="Cerrar notificación"
            >
                <X size={14} />
            </button>
        </div>
    );
}

// ─── Contenedor de Toasts ───
export function ToastContainer() {
    const { toasts } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3" aria-live="polite">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </div>
    );
}
