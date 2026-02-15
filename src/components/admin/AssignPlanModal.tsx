import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { plansService } from '@/services/plansService';
import { Plan } from '@/types/plans.types';
import { User } from '@/types/user.types';
import { formatCurrency } from '@/lib/format';

interface AssignPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSuccess: () => void;
}

export const AssignPlanModal: React.FC<AssignPlanModalProps> = ({ isOpen, onClose, user, onSuccess }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadPlans();
            if (user?.plan_id) {
                setSelectedPlanId(user.plan_id);
            }
        }
    }, [isOpen, user]);

    const loadPlans = async () => {
        setLoading(true);
        try {
            // Fetch ALL active plans (Public + Private)
            const data = await plansService.getPlans(true, false);
            setPlans(data);
        } catch (error) {
            console.error('Error loading plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!user || !selectedPlanId) return;
        setSubmitting(true);
        try {
            await plansService.assignPlanToUser(user.id, selectedPlanId);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error assigning plan:', error);
            // Optional: Show error toast
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Asignar Plan a Usuario">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Selecciona el plan que deseas asignar a <strong>{user.nombres} {user.apellidos}</strong>.
                    Esto activará inmediatamente su suscripción.
                </p>

                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Cargando planes...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                onClick={() => setSelectedPlanId(plan.slug)} // Assuming we store slug in user.plan_id based on DB schema default
                                style={{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: selectedPlanId === plan.slug ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                                    backgroundColor: selectedPlanId === plan.slug ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{plan.name}</h4>
                                        {!plan.is_public && (
                                            <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: 'var(--color-warning)', color: '#fff', borderRadius: '4px', fontWeight: 700 }}>PRIVADO</span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                                        {formatCurrency(plan.price_monthly)}/mes
                                    </p>
                                </div>
                                {selectedPlanId === plan.slug && (
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Check size={14} color="white" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={submitting || !selectedPlanId}>
                        {submitting ? 'Asignando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
