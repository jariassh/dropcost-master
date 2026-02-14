import React from 'react';
import { Badge } from '../common/Badge';
import { User, UserFilters, SubscriptionStatus } from '../../types/user.types';
import { BadgeVariant } from '../../types/common.types';

interface UserStatusBadgeProps {
    status: SubscriptionStatus;
}

const statusConfig: Record<SubscriptionStatus, { variant: BadgeVariant, label: string }> = {
    activa: { variant: 'pill-success', label: 'Activa' },
    cancelada: { variant: 'pill-info', label: 'Cancelada' },
    suspendida: { variant: 'pill-error', label: 'Suspendida' },
    pendiente: { variant: 'pill-warning', label: 'Pendiente' },
};

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status }) => {
    const config = statusConfig[status] || statusConfig.pendiente;

    return (
        <Badge variant={config.variant}>
            {config.label}
        </Badge>
    );
};
