/**
 * Panel de Notificaciones (Glassmorphism dropdown).
 * Ref: /docs/DropCost_Master_Especificacion_Requerimientos.md §7.3
 */
import React, { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import {
    Bell,
    CheckCheck,
    X,
    Info,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    TrendingUp,
    Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { Spinner } from '@/components/common/Spinner';

interface NotificationPanelProps {
    onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
    const {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification
    } = useNotificationStore();

    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Semilla de prueba para demostración (solo si está vacío)
    useEffect(() => {
        if (!isLoading && notifications.length === 0) {
            addNotification({
                userId: 'dev',
                title: 'Bienvenido al sistema de notificaciones',
                message: 'Aquí recibirás alertas críticas sobre tu CPA, efectividad y estado de tus tiendas.',
                type: 'info'
            });
            addNotification({
                userId: 'dev',
                title: '🚀 Nueva integración disponible',
                message: 'Ya puedes conectar tu cuenta de Shopify para sincronizar pedidos automáticamente.',
                type: 'success'
            });
            addNotification({
                userId: 'dev',
                title: '⚠️ Alerta de CPA Alto',
                message: 'Tu campaña "Producto Estrella" está superando el CPA ideal calculado en el simulador.',
                type: 'warning'
            });
        }
    }, [isLoading, notifications.length, addNotification]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 size={16} color="#10B981" />;
            case 'error': return <XCircle size={16} color="#EF4444" />;
            case 'warning': return <AlertTriangle size={16} color="#F59E0B" />;
            case 'alert': return <TrendingUp size={16} color="#0066FF" />;
            default: return <Info size={16} color="#6B7280" />;
        }
    };

    return (
        <>
            {/* Overlay para cerrar al hacer clic fuera */}
            <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={onClose}
            />

            <div
                style={{
                    position: isMobile ? 'fixed' : 'absolute',
                    right: isMobile ? 'auto' : '0',
                    left: isMobile ? '50%' : 'auto',
                    transform: isMobile ? 'translateX(-50%)' : 'none',
                    top: isMobile ? '70px' : '100%',
                    marginTop: '10px',
                    width: isMobile ? 'calc(100% - 24px)' : '360px',
                    maxWidth: isMobile ? '360px' : 'none',
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '16px',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 200,
                    animation: 'slideDown 150ms ease-out',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: 'calc(100vh - 100px)',
                }}
            >
                {/* Header del Panel */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'rgba(var(--color-primary-rgb), 0.03)',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            Notificaciones
                        </span>
                        {unreadCount > 0 && (
                            <span style={{
                                backgroundColor: 'var(--color-primary)',
                                color: '#fff',
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '10px',
                                flexShrink: 0
                            }}>
                                {unreadCount} {isMobile ? '' : 'nuevas'}
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAllAsRead()}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-primary)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                flexShrink: 0,
                                padding: '4px 0 4px 8px'
                            }}
                        >
                            <CheckCheck size={14} />
                            <span style={{ whiteSpace: 'nowrap' }}>Leer todas</span>
                        </button>
                    )}
                </div>

                {/* Lista de Notificaciones */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '8px 0',
                }}>
                    {isLoading ? (
                        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-tertiary)' }}>
                            <Spinner size="sm" />
                            <span style={{ fontSize: '12px' }}>Cargando notificaciones...</span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                            <div style={{
                                width: '48px', height: '48px',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px',
                                color: 'var(--text-tertiary)'
                            }}>
                                <Bell size={20} />
                            </div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                                Todo al día
                            </p>
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                No tienes notificaciones nuevas por ahora.
                            </p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                onClick={() => !notif.isRead && markAsRead(notif.id)}
                                style={{
                                    padding: '16px 20px',
                                    display: 'flex',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 150ms ease',
                                    backgroundColor: notif.isRead ? 'transparent' : 'rgba(var(--color-primary-rgb), 0.04)',
                                    borderLeft: notif.isRead ? '3px solid transparent' : '3px solid var(--color-primary)',
                                    position: 'relative',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = notif.isRead ? 'transparent' : 'rgba(var(--color-primary-rgb), 0.04)'; }}
                            >
                                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                                    {getTypeIcon(notif.type)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        fontSize: '13px',
                                        fontWeight: notif.isRead ? 600 : 700,
                                        color: 'var(--text-primary)',
                                        margin: '0 0 4px',
                                        lineHeight: 1.4
                                    }}>
                                        {notif.title}
                                    </p>
                                    <p style={{
                                        fontSize: '12px',
                                        color: 'var(--text-secondary)',
                                        margin: '0 0 8px',
                                        lineHeight: 1.5
                                    }}>
                                        {notif.message}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                        <Clock size={10} />
                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notif.id);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '12px',
                                        padding: '4px',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-tertiary)',
                                        cursor: 'pointer',
                                        opacity: 0,
                                        transition: 'opacity 150ms',
                                    }}
                                    className="delete-notif-btn"
                                >
                                    <X size={14} />
                                </button>
                                <style>{`
                                    div:hover .delete-notif-btn { opacity: 1; }
                                `}</style>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'center',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'var(--text-tertiary)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Cerrar panel
                    </button>
                </div>
            </div>
        </>
    );
}
