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
    const color = colorMap[toast.type];

    useEffect(() => {
        const duration = toast.duration || 5000;
        const timer = setTimeout(() => removeToast(toast.id), duration);
        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, removeToast]);

    return (
        <div
            className="group relative flex gap-4 min-w-[320px] max-w-[420px] p-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-[var(--border-color)] bg-[var(--card-bg)] backdrop-blur-xl transition-all duration-300 pointer-events-auto overflow-hidden"
            style={{
                borderLeft: `3px solid ${color}`,
                animation: 'scaleIn 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
        >
            {/* Background Glow */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundColor: color }}
            />

            {/* Icon Column */}
            <div
                className="flex items-center justify-center w-10 h-10 min-w-[40px] rounded-full"
                style={{
                    backgroundColor: `${color}15`,
                    color: color
                }}
            >
                <Icon size={20} strokeWidth={2.5} />
            </div>

            {/* Content Column */}
            <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-[14px] font-bold text-[var(--text-primary)] leading-snug tracking-tight">
                    {toast.title}
                </p>
                {toast.description && (
                    <p className="text-[12px] text-[var(--text-secondary)] mt-1 font-medium leading-relaxed">
                        {toast.description}
                    </p>
                )}
            </div>

            {/* Close Button */}
            <button
                onClick={() => removeToast(toast.id)}
                className="absolute top-3 right-3 p-1 rounded-md opacity-0 group-hover:opacity-100 bg-transparent hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                aria-label="Cerrar notificación"
            >
                <X size={14} strokeWidth={3} />
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
            className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 items-end pointer-events-none"
            aria-live="polite"
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </div>
    );
}
