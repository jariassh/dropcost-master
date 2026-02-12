import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import type { AlertType } from '@/types/common.types';

interface AlertProps {
    type: AlertType;
    children: React.ReactNode;
    dismissible?: boolean;
    onDismiss?: () => void;
}

const iconMap: Record<AlertType, React.ReactNode> = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
};

const colorMap: Record<AlertType, { bg: string; border: string; text: string; icon: string }> = {
    success: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', icon: '#10B981' },
    error: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', icon: '#EF4444' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', icon: '#F59E0B' },
    info: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', icon: '#3B82F6' },
};

export function Alert({ type, children, dismissible = false, onDismiss }: AlertProps) {
    const colors = colorMap[type];

    return (
        <div
            role="alert"
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '10px',
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                fontSize: '14px',
                lineHeight: '1.5',
                animation: 'slideDown 300ms ease-out',
            }}
        >
            <span style={{ color: colors.icon, flexShrink: 0, marginTop: '1px' }}>
                {iconMap[type]}
            </span>
            <div style={{ flex: 1 }}>{children}</div>
            {dismissible && onDismiss && (
                <button
                    onClick={onDismiss}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: colors.text,
                        opacity: 0.5,
                        flexShrink: 0,
                        padding: '2px',
                        display: 'flex',
                    }}
                    aria-label="Cerrar alerta"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
}
