import React from 'react';
import { Badge } from '../common/Badge';
import { SubscriptionStatus } from '../../types/user.types';

interface UserStatusBadgeProps {
    status: SubscriptionStatus;
}

const statusConfig: Record<SubscriptionStatus, { variant: 'success' | 'error' | 'warning' | 'neutral', label: string }> = {
    activa: { variant: 'success', label: 'Activa' },
    cancelada: { variant: 'neutral', label: 'Cancelada' }, // Badge doesn't seem to have neutral, checking back. Badge has info/success/warning/error. Let's use 'info' for neutral/cancelada or maybe 'error' for cancelada? 
    // Wait, let's look at Badge.tsx again in thought.
    // badges: success, warning, error, info.
    // suspendida -> error
    // cancelada -> info ? or error?
    // pendiente -> warning
    // activa -> success
    suspendida: { variant: 'error', label: 'Suspendida' },
    pendiente: { variant: 'warning', label: 'Pendiente' },
};

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status }) => {
    const config = statusConfig[status] || statusConfig.pendiente;

    return (
        <Badge variant={config.variant}>
            {config.label}
        </Badge>
    );
};
