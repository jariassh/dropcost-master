/**
 * SegmentBuilderPage.
 * UI para crear e informar "Listas Inteligentes" mediante filtros JSON.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    Button,
    Input,
    Select,
    PageHeader,
    CodePreview
} from '@/components/common';
import {
    Plus,
    Trash2,
    Search,
    Users,
    ChevronRight,
    Filter,
    Database
} from 'lucide-react';
import { saveSegment } from '@/services/marketingService';
import { FilterCondition, SegmentFilters } from '@/types/marketing';

export default function SegmentBuilderPage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [filters, setFilters] = useState<SegmentFilters>({
        operator: 'AND',
        conditions: [
            { field: 'country', operator: 'equals', value: 'Colombia' }
        ]
    });

    const addCondition = () => {
        setFilters({
            ...filters,
            conditions: [...filters.conditions, { field: 'status', operator: 'equals', value: 'active' }]
        });
    };

    const updateCondition = (idx: number, updates: Partial<FilterCondition>) => {
        const newConditions = [...filters.conditions];
        newConditions[idx] = { ...newConditions[idx], ...updates };
        setFilters({ ...filters, conditions: newConditions });
    };

    const removeCondition = (idx: number) => {
        setFilters({
            ...filters,
            conditions: filters.conditions.filter((_, i) => i !== idx)
        });
    };

    const handleSave = async () => {
        await saveSegment({ name, description, filters });
        navigate('/admin/marketing');
    };

    return (
        <div style={{ animation: 'fadeIn 300ms ease-out' }}>
            <PageHeader
                title="Nueva Lista Inteligente"
                subtitle="Crea segmentos de usuarios basados en filtros de comportamiento"
                onBack={() => navigate('/admin/marketing')}
            />

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: '24px',
                    marginBottom: '40px'
                }}
            >
                {/* Panel de Configuración */}
                <Card title="Configuración de Lista">
                    <Input
                        label="Nombre de la Lista"
                        placeholder="Ej. Clientes VIP Marzo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ marginBottom: '16px' }}
                    />
                    <Input
                        label="Descripción"
                        placeholder="Para qué sirve esta lista..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ marginBottom: '24px' }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Filter size={18} color="var(--color-primary)" />
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Reglas de Segmentación
                            </h4>
                        </div>
                        <Select
                            value={filters.operator}
                            onChange={(e) => setFilters({ ...filters, operator: e.target.value as any })}
                            options={[
                                { value: 'AND', label: 'Cumplir TODAS' },
                                { value: 'OR', label: 'Cumplir ALGUNA' }
                            ]}
                            style={{ width: '160px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                        {filters.conditions.map((condition, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'flex-end',
                                    padding: '12px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <Select
                                        label="Campo"
                                        value={condition.field}
                                        onChange={(e) => updateCondition(idx, { field: e.target.value })}
                                        options={[
                                            { value: 'country', label: 'País' },
                                            { value: 'status', label: 'Estado Suscripción' },
                                            { value: 'orders_count', label: 'Número de Costeos' },
                                            { value: 'last_login', label: 'Última Actividad' }
                                        ]}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Select
                                        label="Operador"
                                        value={condition.operator}
                                        onChange={(e) => updateCondition(idx, { operator: e.target.value })}
                                        options={[
                                            { value: 'equals', label: 'Es igual a' },
                                            { value: 'not_equals', label: 'No es igual a' },
                                            { value: 'greater_than', label: 'Mayor que' },
                                            { value: 'less_than', label: 'Menor que' },
                                            { value: 'contains', label: 'Contiene' }
                                        ]}
                                    />
                                </div>
                                <div style={{ flex: 1.5 }}>
                                    <Input
                                        label="Valor"
                                        value={condition.value}
                                        onChange={(e) => updateCondition(idx, { value: e.target.value })}
                                    />
                                </div>
                                <Button
                                    variant="danger"
                                    onClick={() => removeCondition(idx)}
                                    icon={Trash2}
                                />
                            </div>
                        ))}
                    </div>

                    <Button variant="secondary" onClick={addCondition} fullWidth icon={Plus}>
                        Agregar Filtro
                    </Button>
                </Card>

                {/* Vista Previa de Audiencia / JSON */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Card title="Vista Previa de Audiencia">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: 'var(--color-primary)12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={28} color="var(--color-primary)" />
                            </div>
                            <div>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Tamaño estimado</p>
                                <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                    1,250 <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-tertiary)' }}>usuarios</span>
                                </h3>
                            </div>
                        </div>
                        <Button variant="secondary" fullWidth icon={Search}>
                            Refrescar Estimación
                        </Button>
                    </Card>

                    <Card title="Estructura JSON (Filtros)">
                        <CodePreview
                            code={JSON.stringify(filters, null, 2)}
                            language="json"
                        />
                    </Card>
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    padding: '24px',
                    backgroundColor: 'var(--bg-primary)',
                    borderTop: '1px solid var(--border-color)',
                    position: 'sticky',
                    bottom: 0,
                    margin: '0 -24px'
                }}
            >
                <Button variant="primary" size="lg" onClick={handleSave} icon={Database}>
                    Guardar Lista Inteligente
                </Button>
            </div>
        </div>
    );
}
