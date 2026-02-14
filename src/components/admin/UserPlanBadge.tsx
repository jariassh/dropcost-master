import React from 'react';
import { Badge } from '../common/Badge';

interface UserPlanBadgeProps {
    planId: string;
}

export const UserPlanBadge: React.FC<UserPlanBadgeProps> = ({ planId }) => {
    const getPlanConfig = (id: string) => {
        switch (id) {
            case 'plan_pro':
                return { variant: 'pill-info' as const, label: 'Pro' };
            case 'plan_enterprise':
                return { variant: 'pill-purple' as const, label: 'Enterprise' };
            default:
                return { variant: 'pill-info' as const, label: 'Gratis' };
        }
    };

    const { variant, label } = getPlanConfig(planId);

    return (
        <Badge variant={variant} className="capitalize">
            {label}
        </Badge>
    );
};
