import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Save, Check, Edit2, GripVertical } from 'lucide-react';
import { Button } from '../common/Button';
import { CurrencyInput } from '../common/CurrencyInput';
import { Plan, PlanInput, PlanLimits } from '@/types/plans.types';

const CONTROLLED_FEATURES: { key: keyof PlanLimits; label: string; text: string; type: 'boolean' }[] = [
    { key: 'access_wallet', label: 'Acceso a Billetera', text: 'Acceso a Billetera y Retiros', type: 'boolean' },
    { key: 'access_referrals', label: 'Sistema de Referidos', text: 'Sistema de Referidos', type: 'boolean' },
    { key: 'can_duplicate_costeos', label: 'Duplicar Costeos', text: 'Duplicar Costeos', type: 'boolean' },
    { key: 'can_duplicate_offers', label: 'Duplicar Ofertas', text: 'Duplicar Ofertas', type: 'boolean' },
    { key: 'can_delete_costeos', label: 'Eliminar Costeos', text: 'Eliminar Costeos', type: 'boolean' },
    { key: 'can_delete_offers', label: 'Eliminar Ofertas', text: 'Eliminar Ofertas', type: 'boolean' },
    { key: 'can_delete_stores', label: 'Eliminar Tiendas', text: 'Eliminar Tiendas', type: 'boolean' },
    { key: 'view_activity_history', label: 'Ver Historial de Actividad', text: 'Historial de Actividad', type: 'boolean' }
];

const CONTROLLED_PATTERNS = [
    /^Hasta \d+ (Tienda|Tiendas)$/,
    /^Tiendas Ilimitadas$/,
    /^\d+ Costeos$/,
    /^Costeos Ilimitados$/,
    /^\d+ Ofertas$/,
    /^Ofertas Ilimitadas$/
];

const isControlledFeature = (text: string) => {
    // Check dynamic patterns first
    if (CONTROLLED_PATTERNS.some(p => p.test(text))) return true;

    // Check boolean features (with or without prefix)
    const cleanText = text.replace(/^⛔\s*/, '');
    return CONTROLLED_FEATURES.some(cF => cF.text === cleanText);
};

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
        is_public: true,
        currency: 'USD'
    });

    const [newFeature, setNewFeature] = useState('');
    const [editingFeatureIndex, setEditingFeatureIndex] = useState<number | null>(null);
    const [editingFeatureText, setEditingFeatureText] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                slug: initialData.slug,
                name: initialData.name,
                description: initialData.description || '',
                price_monthly: initialData.price_monthly,
                price_semiannual: initialData.price_semiannual || 0, // Handle migration if needed
                features: Array.from(new Set(initialData.features || [])),
                limits: initialData.limits || { stores: 1 },
                is_active: initialData.is_active ?? true,
                is_public: initialData.is_public ?? true,
                currency: initialData.currency || 'USD'
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
                is_public: true,
                currency: 'USD'
            });
        }
    }, [initialData, isOpen]);

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Auto-format: lowercase and replace spaces with underscores
        const value = e.target.value.toLowerCase().replace(/\s+/g, '_');
        setFormData({ ...formData, slug: value });
    };

    const handleAddFeature = () => {
        if (!newFeature.trim() || formData.features.includes(newFeature.trim())) return;
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

    const startEditingFeature = (index: number) => {
        setEditingFeatureIndex(index);
        setEditingFeatureText(formData.features[index]);
    };

    const saveEditingFeature = () => {
        if (editingFeatureIndex === null) return;
        if (!editingFeatureText.trim()) return;

        const newFeatures = [...formData.features];
        newFeatures[editingFeatureIndex] = editingFeatureText.trim();

        setFormData(prev => ({ ...prev, features: newFeatures }));
        setEditingFeatureIndex(null);
        setEditingFeatureText('');
    };

    const cancelEditingFeature = () => {
        setEditingFeatureIndex(null);
        setEditingFeatureText('');
    };

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
        setEditingFeatureIndex(null); // Cancel editing if any
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ''); // Fix for Firefox
    };

    const handleDragEnter = (position: number) => {
        if (dragItem.current === null) return;
        if (dragItem.current === position) return;

        const newFeatures = [...formData.features];
        const draggedItemContent = newFeatures[dragItem.current];
        newFeatures.splice(dragItem.current, 1);
        newFeatures.splice(position, 0, draggedItemContent);

        dragItem.current = position;
        setFormData(prev => ({ ...prev, features: newFeatures }));
    };

    const handleDragEnd = () => {
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleLimitToggle = (key: keyof PlanLimits, value: boolean) => {
        const newLimits = { ...formData.limits, [key]: value };

        // Sync with features text
        let newFeatures = [...formData.features];
        const featureDef = CONTROLLED_FEATURES.find(c => c.key === key);

        if (featureDef) {
            const enabledText = featureDef.text;
            const disabledText = `⛔ ${featureDef.text}`;

            // Remove both versions first to ensure clean state
            newFeatures = newFeatures.filter(f => f !== enabledText && f !== disabledText);

            if (value) {
                // Add enabled version to top
                newFeatures.unshift(enabledText);
            } else {
                // Add disabled version to bottom
                newFeatures.push(disabledText);
            }
        }

        setFormData(prev => ({
            ...prev,
            limits: newLimits,
            features: newFeatures
        }));
    };

    const handleNumericLimitChange = (key: 'stores' | 'costeos_limit' | 'offers_limit', value: number) => {
        const newLimits = { ...formData.limits, [key]: value };
        let newFeatures = [...formData.features];

        const INFINITY_THRESHOLD = 999999;

        // Format helpers
        const getStoreText = (v: number) => v >= INFINITY_THRESHOLD ? 'Tiendas Ilimitadas' : `Hasta ${v} ${v === 1 ? 'Tienda' : 'Tiendas'}`;
        const getCosteosText = (v: number) => v >= INFINITY_THRESHOLD ? 'Costeos Ilimitados' : `${v} Costeos`;
        const getOffersText = (v: number) => v >= INFINITY_THRESHOLD ? 'Ofertas Ilimitadas' : `${v} Ofertas`;

        let newText = '';
        let pattern: RegExp | null = null;
        let altPattern: RegExp | null = null;

        if (key === 'stores') {
            newText = getStoreText(value);
            pattern = /^Hasta \d+ (Tienda|Tiendas)$/;
            altPattern = /^Tiendas Ilimitadas$/;
        } else if (key === 'costeos_limit') {
            newText = getCosteosText(value);
            pattern = /^\d+ Costeos$/;
            altPattern = /^Costeos Ilimitados$/;
        } else if (key === 'offers_limit') {
            newText = getOffersText(value);
            pattern = /^\d+ Ofertas$/;
            altPattern = /^Ofertas Ilimitadas$/;
        }

        // Remove old text matching pattern
        if (pattern) {
            newFeatures = newFeatures.filter(f => !pattern!.test(f) && (!altPattern || !altPattern.test(f)));
        }

        // Add new text at the beginning
        newFeatures.unshift(newText);

        setFormData(prev => ({
            ...prev,
            limits: newLimits,
            features: newFeatures
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    if (!isOpen) return null;

    const INFINITY_THRESHOLD = 999999;

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
                                        padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', width: '100%', boxSizing: 'border-box', outline: 'none', transition: 'all 200ms ease'
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(0,102,255,0.1)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
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
                                        padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', width: '100%', boxSizing: 'border-box', outline: 'none', transition: 'all 200ms ease'
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(0,102,255,0.1)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
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
                                    padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px',
                                    minHeight: '80px', resize: 'vertical', width: '100%', boxSizing: 'border-box', outline: 'none', transition: 'all 200ms ease'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(0,102,255,0.1)'; }}
                                onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                                placeholder="Descripción corta de los beneficios..."
                            />
                        </div>

                        {/* Pricing */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>Configuración de Precios</h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Moneda Base del Plan</label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    style={{
                                        padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px',
                                        width: '100%', cursor: 'pointer', outline: 'none', transition: 'all 200ms ease'
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(0,102,255,0.1)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                                >
                                    <option value="COP">Peso Colombiano (COP)</option>
                                    <option value="USD">Dólar Estadounidense (USD)</option>
                                    <option value="MXN">Peso Mexicano (MXN)</option>
                                    <option value="EUR">Euro (EUR)</option>
                                </select>
                                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: 0 }}>
                                    Los usuarios verán el precio convertido a su moneda local, calculado desde esta moneda base.
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Precio Mensual</label>
                                    <CurrencyInput
                                        value={formData.price_monthly}
                                        onChange={(val) => setFormData({ ...formData, price_monthly: val })}
                                        style={{ width: '100%' }}
                                        prefix={formData.currency === 'USD' || formData.currency === 'EUR' ? undefined : '$ '}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Precio Semestral</label>
                                    <CurrencyInput
                                        value={formData.price_semiannual}
                                        onChange={(val) => setFormData({ ...formData, price_semiannual: val })}
                                        style={{ width: '100%' }}
                                        prefix={formData.currency === 'USD' || formData.currency === 'EUR' ? undefined : '$ '}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Limits details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>Configuración Técnica</h4>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
                                {/* Stores */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tiendas</label>
                                        <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.limits.stores >= INFINITY_THRESHOLD}
                                                onChange={(e) => handleNumericLimitChange('stores', e.target.checked ? INFINITY_THRESHOLD : 1)}
                                            /> ∞
                                        </label>
                                    </div>
                                    {formData.limits.stores >= INFINITY_THRESHOLD ? (
                                        <div style={{
                                            padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                                            borderRadius: '8px', fontSize: '14px', color: 'var(--text-tertiary)', textAlign: 'center'
                                        }}>Ilimitadas</div>
                                    ) : (
                                        <CurrencyInput
                                            value={formData.limits.stores}
                                            onChange={(val) => handleNumericLimitChange('stores', val)}
                                            allowDecimals={false}
                                            prefix=""
                                            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '100%' }}
                                        />
                                    )}
                                </div>
                                {/* Costeos */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Costeos</label>
                                        <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}>
                                            <input
                                                type="checkbox"
                                                checked={(formData.limits.costeos_limit || 0) >= INFINITY_THRESHOLD}
                                                onChange={(e) => handleNumericLimitChange('costeos_limit', e.target.checked ? INFINITY_THRESHOLD : 10)}
                                            /> ∞
                                        </label>
                                    </div>
                                    {(formData.limits.costeos_limit || 0) >= INFINITY_THRESHOLD ? (
                                        <div style={{
                                            padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                                            borderRadius: '8px', fontSize: '14px', color: 'var(--text-tertiary)', textAlign: 'center'
                                        }}>Ilimitados</div>
                                    ) : (
                                        <CurrencyInput
                                            value={formData.limits.costeos_limit || 0}
                                            onChange={(val) => handleNumericLimitChange('costeos_limit', val)}
                                            allowDecimals={false}
                                            prefix=""
                                            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '100%' }}
                                        />
                                    )}
                                </div>
                                {/* Offers */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Ofertas</label>
                                        <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}>
                                            <input
                                                type="checkbox"
                                                checked={(formData.limits.offers_limit || 0) >= INFINITY_THRESHOLD}
                                                onChange={(e) => handleNumericLimitChange('offers_limit', e.target.checked ? INFINITY_THRESHOLD : 5)}
                                            /> ∞
                                        </label>
                                    </div>
                                    {(formData.limits.offers_limit || 0) >= INFINITY_THRESHOLD ? (
                                        <div style={{
                                            padding: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                                            borderRadius: '8px', fontSize: '14px', color: 'var(--text-tertiary)', textAlign: 'center'
                                        }}>Ilimitadas</div>
                                    ) : (
                                        <CurrencyInput
                                            value={formData.limits.offers_limit || 0}
                                            onChange={(val) => handleNumericLimitChange('offers_limit', val)}
                                            allowDecimals={false}
                                            prefix=""
                                            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '100%' }}
                                        />
                                    )}
                                </div>
                            </div>


                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                                {CONTROLLED_FEATURES.map((item) => {
                                    const isEnabled = !!formData.limits[item.key];
                                    return (
                                        <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div
                                                onClick={() => handleLimitToggle(item.key, !isEnabled)}
                                                style={{
                                                    width: '36px', height: '20px', backgroundColor: isEnabled ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                                    borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                                                    flexShrink: 0
                                                }}
                                            >
                                                <div style={{
                                                    width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%',
                                                    position: 'absolute', top: '2px', left: isEnabled ? '18px' : '2px', transition: 'left 0.2s'
                                                }} />
                                            </div>
                                            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{item.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
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
                                <style>{`
                                    .draggable-item { cursor: grab; }
                                    .draggable-item:active { cursor: grabbing; }
                                `}</style>
                                {formData.features.map((feature, index) => (
                                    <div
                                        key={feature}
                                        draggable={editingFeatureIndex === null}
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragEnter={() => handleDragEnter(index)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDragEnd={handleDragEnd}
                                        className="draggable-item"
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '8px 12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)',
                                            gap: '12px', transition: 'transform 0.2s, box-shadow 0.2s'
                                        }}
                                    >
                                        {editingFeatureIndex === index ? (
                                            <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    value={editingFeatureText}
                                                    onChange={e => setEditingFeatureText(e.target.value)}
                                                    style={{
                                                        flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid var(--color-primary)',
                                                        backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px'
                                                    }}
                                                    autoFocus
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') { e.preventDefault(); saveEditingFeature(); }
                                                        if (e.key === 'Escape') cancelEditingFeature();
                                                    }}
                                                />
                                                <button type="button" onClick={saveEditingFeature} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success)' }}>
                                                    <Check size={16} />
                                                </button>
                                                <button type="button" onClick={cancelEditingFeature} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                    <div style={{ color: 'var(--text-tertiary)', cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                                                        <GripVertical size={16} />
                                                    </div>
                                                    <Check size={14} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{feature}</span>
                                                </div>

                                                <div style={{ display: 'flex', gap: '4px', opacity: 0.7 }}>
                                                    {/* Edit - Disable if controlled */}
                                                    {!isControlledFeature(feature) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => startEditingFeature(index)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    )}

                                                    {/* Delete - Disable if controlled */}
                                                    {!isControlledFeature(feature) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveFeature(index)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
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
                    padding: '16px 24px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    backgroundColor: 'var(--card-bg)'
                }}>
                    <Button variant="secondary" onClick={onClose} disabled={isLoading} style={{ borderColor: 'var(--border-color)' }}>
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
