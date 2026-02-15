import React from 'react';
import { Badge } from '../common/Badge';

import { Plan } from '../../types/plans.types';

interface UserPlanBadgeProps {
    planId: string;
    plans?: Plan[];
}

export const UserPlanBadge: React.FC<UserPlanBadgeProps> = ({ planId, plans = [] }) => {
    const getPlanConfig = (id: string) => {
        // Find plan by slug (planId is usually the slug)
        const plan = plans.find(p => p.slug === id);

        if (plan) {
            // Assign variants based on slug or price for visual distinction
            let variant: any = 'pill-info';
            if (plan.slug.includes('enterprise')) variant = 'pill-purple';
            if (plan.slug.includes('pro')) variant = 'pill-info';
            if (plan.slug.includes('admin') || plan.slug.includes('staff')) variant = 'pill-warning';

            return { variant, label: plan.name };
        }

        // Fallback for legacy IDs or if plan list not yet loaded
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
