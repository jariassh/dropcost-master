import React from 'react';
import { Badge } from '../common/Badge';
import { User, UserFilters, SubscriptionStatus } from '../../types/user.types';
import { BadgeVariant } from '../../types/common.types';

interface UserStatusBadgeProps {
    status: SubscriptionStatus;
    planId?: string;
}

const statusConfig: Record<SubscriptionStatus, { variant: BadgeVariant, label: string }> = {
    activa: { variant: 'pill-success', label: 'Activa' },
    cancelada: { variant: 'pill-info', label: 'Cancelada' },
    suspendida: { variant: 'pill-error', label: 'Suspendida' },
    pendiente: { variant: 'pill-warning', label: 'Pendiente' },
    trial: { variant: 'pill-info', label: 'Prueba' },
    inactiva: { variant: 'pill-secondary', label: 'Inactiva' },
};

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status, planId }) => {
    let config = statusConfig[status] || statusConfig.pendiente;

    // Diferenciar etiqueta para Plan Gratis vs Suscripciones de pago
    if (status === 'activa') {
        if (planId === 'plan_free' || !planId) {
            config = { variant: 'pill-secondary', label: 'Cuenta Activa' };
        } else {
            config = { variant: 'pill-success', label: 'Suscripción Activa' };
        }
    }

    return (
        <Badge variant={config.variant}>
            {config.label}
        </Badge>
    );
};
