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
            className="flex items-center gap-3 min-w-[340px] max-w-[420px] p-4 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[var(--border-color)] bg-[var(--card-bg)] backdrop-blur-md"
            style={{
                borderLeft: `4px solid ${colorMap[toast.type]}`,
                animation: 'slideDown 300ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
        >
            <Icon size={22} style={{ color: colorMap[toast.type], flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">{toast.title}</p>
                {toast.description && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{toast.description}</p>
                )}
            </div>
            <button
                onClick={() => removeToast(toast.id)}
                className="p-1.5 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] transition-colors cursor-pointer flex-shrink-0"
                aria-label="Cerrar notificación"
            >
                <X size={16} />
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
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 items-center pointer-events-none"
            aria-live="polite"
        >
            <div className="pointer-events-auto flex flex-col gap-3">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} />
                ))}
            </div>
        </div>
    );
}
