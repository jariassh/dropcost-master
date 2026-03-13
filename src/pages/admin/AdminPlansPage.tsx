import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { PlanFormModal } from '@/components/admin/PlanFormModal';
import { plansService } from '@/services/plansService';
import { Plan, PlanInput } from '@/types/plans.types';
import { formatCurrency, formatNumber } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/common/PageHeader';
import { LayoutGrid } from 'lucide-react';

export const AdminPlansPage: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | undefined>(undefined);
    const [actionLoading, setActionLoading] = useState(false);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const data = await plansService.getPlans(false);
            setPlans(data);
        } catch (error) {
            console.error('Error loading plans:', error);
            // In a real app, show toast
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    const handleCreate = () => {
        setEditingPlan(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`¿Estás seguro de eliminar el plan "${name}"? Esta acción no se puede deshacer.`)) return;

        try {
            await plansService.deletePlan(id);
            await loadPlans();
        } catch (error) {
            console.error('Error deleting plan:', error);
            alert('Error al eliminar el plan');
        }
    };

    const handleSave = async (planData: PlanInput) => {
        setActionLoading(true);
        try {
            if (editingPlan) {
                await plansService.updatePlan(editingPlan.id, planData);
                // Refresh current user in store if they are on this plan
                const currentUser = useAuthStore.getState().user;
                if (currentUser?.plan?.slug === planData.slug) {
                    await useAuthStore.getState().refreshUser();
                }
            } else {
                await plansService.createPlan(planData);
            }
            await loadPlans();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving plan:', error);
            alert('Error al guardar el plan');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 var(--main-padding)', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <PageHeader
                title="Gestión de Planes"
                description="Configura los niveles de suscripción y precios."
                icon={LayoutGrid}
                actions={
                    <Button onClick={handleCreate} leftIcon={<Plus size={18} />} className="dc-admin-create-btn">
                        Nuevo Plan
                    </Button>
                }
            />

            <style>{`
                @media (max-width: 767px) {
                    .dc-admin-header-row {
                        text-align: center !important;
                        margin-bottom: 8px;
                    }
                    .dc-admin-header-row h1 {
                        font-size: 22px !important;
                    }
                    .dc-admin-actions {
                        width: 100% !important;
                    }
                    .dc-admin-create-btn {
                        width: 100% !important;
                        justify-content: center !important;
                    }
                    /* Table optimization */
                    table th:nth-child(3),
                    table th:nth-child(4),
                    table td:nth-child(3),
                    table td:nth-child(4) {
                        display: none !important;
                    }
                    table th, table td {
                        padding: 12px 16px !important;
                    }
                }
            `}</style>

            {/* Plans Table */}
            <Card noPadding style={{
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden'
            }}>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '200px' }}>Nombre / Slug</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '150px' }}>Precio Mensual</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '150px' }}>Precio Semestral</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '120px' }}>Límites</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '200px' }}>Estado / Visibilidad</th>
                                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '100px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        Cargando planes...
                                    </td>
                                </tr>
                            ) : plans.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No hay planes configurados. Crea uno nuevo.
                                    </td>
                                </tr>
                            ) : (
                                plans.map((plan) => (
                                    <tr
                                        key={plan.id}
                                        style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{plan.name}</span>
                                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{plan.slug}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                            {formatCurrency(plan.price_monthly, plan.currency || 'USD')}
                                        </td>
                                        <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                            {formatCurrency(plan.price_semiannual || 0, plan.currency || 'USD')}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                <span>🏪 {formatNumber(plan.limits?.stores || 0)} Tiendas</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <Badge variant={plan.is_active ? 'modern-success' : 'modern-error'}>
                                                    {plan.is_active ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                                <Badge variant={plan.is_public ? 'pill-info' : 'pill-warning'}>
                                                    {plan.is_public ? 'Público' : 'Privado'}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)}>
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(plan.id, plan.name)} style={{ color: 'var(--color-error)' }}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <PlanFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingPlan}
                isLoading={actionLoading}
            />
        </div>
    );
};
