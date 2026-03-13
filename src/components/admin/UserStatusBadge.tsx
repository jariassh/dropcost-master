import React from 'react';
import { Badge } from '../common/Badge';
import { User, UserFilters, SubscriptionStatus } from '../../types/user.types';
import { BadgeVariant } from '../../types/common.types';

interface UserStatusBadgeProps {
    status: SubscriptionStatus;
    planId?: string;
    email_verificado?: boolean;
}

const statusConfig: Record<string, { variant: BadgeVariant, label: string }> = {
    activa: { variant: 'pill-success', label: 'Activa' },
    cancelada: { variant: 'pill-info', label: 'Cancelada' },
    suspendida: { variant: 'pill-error', label: 'Suspendida' },
    pendiente: { variant: 'pill-warning', label: 'Pendiente' },
    trial: { variant: 'pill-info', label: 'Prueba' },
    inactiva: { variant: 'pill-secondary', label: 'Inactiva' },
    sin_verificar: { variant: 'pill-error', label: 'Sin verificar' },
};

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status, planId, email_verificado }) => {
    let config = statusConfig[status] || statusConfig.pendiente;

    // Si el email no está verificado, forzar estado "Sin verificar"
    if (email_verificado === false) {
        config = { variant: 'pill-error', label: 'Sin verificar' };
    } else {
        // Diferenciar etiqueta para Plan Gratis vs Suscripciones de pago
        if (planId === 'plan_free' || !planId) {
            config = { variant: 'pill-secondary', label: 'Usuario Free' };
        } else {
            config = { variant: 'pill-success', label: 'Cliente Premium' };
        }
        
        // Si el estado es suspendido, eso manda
        if (status === 'suspendida') {
            config = statusConfig.suspendida;
        } else if (status === 'pendiente') {
            config = statusConfig.pendiente;
        }
    }

    return (
        <Badge variant={config.variant}>
            {config.label}
        </Badge>
    );
};
