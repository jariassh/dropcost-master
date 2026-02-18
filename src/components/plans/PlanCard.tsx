import React from 'react';
import { Check, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Plan } from '@/types/plans.types';
import { formatCurrency } from '@/lib/format';

interface PlanCardProps {
    plan: Plan;
    isCurrent?: boolean;
    onSelect?: (plan: Plan) => void;
    displayedPrice?: string;
    period?: 'monthly' | 'semiannual';
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, isCurrent = false, onSelect, displayedPrice, period = 'monthly' }) => {

    // Logic based on slug for styling
    const isEnterprise = plan.slug === 'plan_enterprise';
    const isPro = plan.slug === 'plan_pro';

    return (
        <div style={{
            padding: '32px',
            backgroundColor: 'var(--card-bg)',
            border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
            borderRadius: '16px', // Standardized from 24px
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            position: 'relative',
            boxShadow: isCurrent ? '0 10px 30px -10px rgba(0, 102, 255, 0.2)' : 'var(--shadow-sm)',
            transition: 'all 0.3s ease', // Smoother transition
            height: '100%',
            flex: 1
        }}
            onMouseEnter={(e) => {
                if (!isCurrent) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    e.currentTarget.style.borderColor = 'var(--color-primary-light, #60A5FA)'; // Subtle border highlight
                }
            }}
            onMouseLeave={(e) => {
                if (!isCurrent) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                }
            }}
        >
            {isCurrent && (
                <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <CheckCircle2 size={14} /> Tu Plan Actual
                </div>
            )}

            {/* Header */}
            <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {plan.name}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {plan.description}
                </p>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {displayedPrice ? displayedPrice.replace(/\s/g, '') : formatCurrency(plan.price_monthly).replace(/\s/g, '')}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                    {period === 'monthly' ? '/mes' : '/semestre'}
                </span>
            </div>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                {plan.features?.map((feature: string, index: number) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                            marginTop: '2px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Check size={12} style={{ color: 'var(--color-primary)' }} />
                        </div>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            {feature}
                        </span>
                    </div>
                ))}
            </div>

            {/* Action Button */}
            <Button
                variant={isCurrent ? 'secondary' : (isPro ? 'primary' : 'secondary')}
                fullWidth
                onClick={() => onSelect && onSelect(plan)}
                disabled={isCurrent}
                style={{
                    height: '48px',
                    fontSize: '15px',
                    ...(isEnterprise ? { backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none' } : {})
                }}
            >
                {isCurrent ? 'Plan Activo' : 'Seleccionar Plan'}
            </Button>
        </div>
    );
};
