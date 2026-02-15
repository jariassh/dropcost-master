import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Check } from 'lucide-react';
import { Button } from '../common/Button';
import { CurrencyInput } from '../common/CurrencyInput';
import { Plan, PlanInput } from '@/types/plans.types';

interface PlanFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (plan: PlanInput) => Promise<void>;
    initialData?: Plan;
    isLoading?: boolean;
}

export const PlanFormModal: React.FC<PlanFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    isLoading = false
}) => {
    // Initial state setup
    const initialLimits = { stores: 1 }; // Default limits

    const [formData, setFormData] = useState<PlanInput>({
        slug: '',
        name: '',
        description: '',
        price_monthly: 0,
        price_semiannual: 0, // Changed from price_annual
        features: [],
        limits: initialLimits,
        is_active: true,
        is_public: true
    });

    const [newFeature, setNewFeature] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                slug: initialData.slug,
                name: initialData.name,
                description: initialData.description || '',
                price_monthly: initialData.price_monthly,
                price_semiannual: initialData.price_semiannual || 0, // Handle migration if needed
                features: initialData.features || [],
                limits: initialData.limits || { stores: 1 },
                is_active: initialData.is_active ?? true,
                is_public: initialData.is_public ?? true
            });
        } else {
            setFormData({
                slug: '',
                name: '',
                description: '',
                price_monthly: 0,
                price_semiannual: 0,
                features: [],
                limits: { stores: 1 },
                is_active: true,
                is_public: true
            });
        }
    }, [initialData, isOpen]);

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Auto-format: lowercase and replace spaces with underscores
        const value = e.target.value.toLowerCase().replace(/\s+/g, '_');
        setFormData({ ...formData, slug: value });
    };

    const handleAddFeature = () => {
        if (!newFeature.trim()) return;
        setFormData(prev => ({
            ...prev,
            features: [...prev.features, newFeature.trim()]
        }));
        setNewFeature('');
    };

    const handleRemoveFeature = (index: number) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'var(--card-bg)', width: '100%', maxWidth: '600px', maxHeight: '90vh',
                borderRadius: '16px', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{
                    padding: '20px 24px', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {initialData ? 'Editar Plan' : 'Nuevo Plan'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    <form id="plan-form" onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>

                        {/* Basic Info */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre del Plan</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{
                                        padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px'
                                    }}
                                    placeholder="Ej. Plan Pro"
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Slug (ID único)</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.slug}
                                    onChange={handleSlugChange}
                                    style={{
                                        padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px'
                                    }}
                                    placeholder="Ej. plan_pro"
                                />
                                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                    Se formatea automáticamente (ej. nombre_del_plan)
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Descripción</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                style={{
                                    padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px',
                                    minHeight: '80px', resize: 'vertical'
                                }}
                                placeholder="Descripción corta de los beneficios..."
                            />
                        </div>

                        {/* Pricing */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Precio Mensual ($)</label>
                                <CurrencyInput
                                    value={formData.price_monthly}
                                    onChange={(val) => setFormData({ ...formData, price_monthly: val })}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Precio Semestral ($)</label>
                                <CurrencyInput
                                    value={formData.price_semiannual}
                                    onChange={(val) => setFormData({ ...formData, price_semiannual: val })}
                                />
                            </div>
                        </div>

                        {/* Limits details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Límite de Tiendas</label>
                            <CurrencyInput
                                value={formData.limits.stores}
                                onChange={(val) => setFormData({ ...formData, limits: { ...formData.limits, stores: val } })}
                                allowDecimals={false}
                                prefix=""
                            />
                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                Definiremos otros límites de uso más adelante.
                            </span>
                        </div>

                        {/* Features */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Características del Plan</label>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={newFeature}
                                    onChange={e => setNewFeature(e.target.value)}
                                    placeholder="Agregar característica..."
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px'
                                    }}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                                />
                                <Button type="button" size="sm" onClick={handleAddFeature}>
                                    <Plus size={18} />
                                </Button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                {formData.features.map((feature, index) => (
                                    <div key={index} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '8px 12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Check size={14} color="var(--color-primary)" />
                                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{feature}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFeature(index)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {formData.features.length === 0 && (
                                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Sin características agregadas.</p>
                                )}
                            </div>
                        </div>

                        {/* Status & Visibility */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {/* Active Status */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <div
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    style={{
                                        width: '40px', height: '24px', backgroundColor: formData.is_active ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                        borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%',
                                        position: 'absolute', top: '3px', left: formData.is_active ? '19px' : '3px', transition: 'left 0.2s'
                                    }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Estado</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {formData.is_active ? 'Activo' : 'Inactivo'}
                                    </p>
                                </div>
                            </div>

                            {/* Public Visibility */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <div
                                    onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
                                    style={{
                                        width: '40px', height: '24px', backgroundColor: formData.is_public ? 'var(--color-success)' : 'var(--text-tertiary)',
                                        borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%',
                                        position: 'absolute', top: '3px', left: formData.is_public ? '19px' : '3px', transition: 'left 0.2s'
                                    }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Visibilidad</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {formData.is_public ? 'Público' : 'Privado (Solo Admin)'}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                <div style={{
                    padding: '20px 24px', borderTop: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'flex-end', gap: '12px'
                }}>
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="plan-form" isLoading={isLoading} leftIcon={<Save size={18} />}>
                        {initialData ? 'Guardar Cambios' : 'Crear Plan'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
