/**
 * SegmentBuilderPage.
 * UI para crear e informar "Listas Inteligentes" mediante filtros JSON.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Card,
    Button,
    Input,
    Select,
    PageHeader,
    CodePreview,
    Badge,
    SelectPais,
    useToast
} from '@/components/common';
import { plansService } from '@/services/plansService';
import { userService } from '@/services/userService';
import { Plan } from '@/types/plans.types';
import {
    Plus,
    Trash2,
    Search,
    Users,
    Filter,
    Database,
    ChevronLeft,
    Save
} from 'lucide-react';
import { estimateAudience, getSegmentById } from '@/services/marketingService';
import { useSaveSegment } from '@/hooks/useMarketing';
import { FilterCondition, SegmentFilters } from '@/types/marketing';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/useStoreStore';

export default function SegmentBuilderPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuthStore();
    const { tiendaActual } = useStoreStore();
    const saveSegmentMutation = useSaveSegment();
    const toast = useToast();

    const [name, setName] = useState('Mi Nueva Lista');
    const [description, setDescription] = useState('');
    const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
    const [isEstimating, setIsEstimating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [filters, setFilters] = useState<SegmentFilters>({
        operator: 'AND',
        conditions: [
            { field: 'country', operator: 'equals', value: 'Colombia' }
        ]
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);

        // Cargar datos iniciales para selectores
        const loadMetadata = async () => {
            try {
                const planList = await plansService.getPlans();
                setPlans(planList);

                const roleList = await userService.getUniqueRoles();
                setAvailableRoles(roleList);

                // Si hay un ID en la URL, cargar el segmento para edición
                if (id) {
                    const segment = await getSegmentById(id);
                    if (segment) {
                        setName(segment.name);
                        setDescription(segment.description);
                        setFilters(segment.filters);
                    }
                }
            } catch (err) {
                console.error('Error cargando metadata segmentador:', err);
            }
        };
        loadMetadata();

        return () => window.removeEventListener('resize', handleResize);
    }, [id]);

    // Estimación automática con debounce (500ms) para no saturar la BD mientras se escribe
    useEffect(() => {
        const timer = setTimeout(() => {
            refreshEstimation();
        }, 500);
        return () => clearTimeout(timer);
    }, [filters]);

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

    const refreshEstimation = async () => {
        setIsEstimating(true);
        try {
            const count = await estimateAudience(filters);
            setEstimatedSize(count);
        } catch (error) {
            console.error('Error estimando audiencia:', error);
        } finally {
            setIsEstimating(false);
        }
    };

    const handleSave = async () => {
        const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
        if (!user || (!isAdmin && !tiendaActual) || !name) {
            toast.warning('Campo requerido', 'Por favor completa el nombre de la lista');
            return;
        }

        setIsSaving(true);
        try {
            await saveSegmentMutation.mutateAsync({
                id,
                name,
                description,
                filters,
                tienda_id: tiendaActual?.id || null,
                usuario_id: user.id
            });

            toast.success('Lista guardada', '¡Lista Inteligente guardada correctamente!');
            navigate('/admin/marketing');
        } catch (error) {
            console.error('Error al guardar segmento:', error);
            toast.error('Error de guardado', 'Hubo un error al guardar la lista. Por favor intenta de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 300ms ease-out', paddingBottom: '80px' }}>
            <PageHeader
                title="Nueva Lista Inteligente"
                description="Crea segmentos de usuarios basados en filtros de comportamiento"
                icon={Filter}
                actions={
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/admin/marketing')}
                        leftIcon={<ChevronLeft size={18} />}
                        fullWidth={isMobile}
                    >
                        Volver
                    </Button>
                }
            />

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))',
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
                        <div style={{ width: '160px' }}>
                            <Select
                                value={filters.operator}
                                onChange={(val: string) => setFilters({ ...filters, operator: val as any })}
                                options={[
                                    { value: 'AND', label: 'Cumplir TODAS' },
                                    { value: 'OR', label: 'Cumplir ALGUNA' }
                                ]}
                            />
                        </div>
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
                                        onChange={(val: string) => updateCondition(idx, { field: val })}
                                        options={[
                                            { value: 'country', label: 'País' },
                                            { value: 'status', label: 'Estado Suscripción' },
                                            { value: 'rol', label: 'Rol de Usuario' },
                                            { value: 'plan', label: 'Plan de Suscripción' },
                                            { value: 'last_login', label: 'Última Actividad' }
                                        ]}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Select
                                        label="Operador"
                                        value={condition.operator}
                                        onChange={(val: string) => updateCondition(idx, { operator: val })}
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
                                    {condition.field === 'country' ? (
                                        <SelectPais
                                            label="Valor"
                                            value={condition.value}
                                            onChange={(val: string) => updateCondition(idx, { value: val })}
                                        />
                                    ) : condition.field === 'plan' ? (
                                        <Select
                                            label="Valor"
                                            value={condition.value}
                                            onChange={(val: string) => updateCondition(idx, { value: val })}
                                            options={plans.map(p => ({ value: p.id, label: p.name }))}
                                        />
                                    ) : condition.field === 'status' ? (
                                        <Select
                                            label="Valor"
                                            value={condition.value}
                                            onChange={(val: string) => updateCondition(idx, { value: val })}
                                            options={[
                                                { value: 'activa', label: 'Activa' },
                                                { value: 'pendiente', label: 'Pendiente' },
                                                { value: 'vencida', label: 'Vencida' },
                                                { value: 'cancelada', label: 'Cancelada' }
                                            ]}
                                        />
                                    ) : condition.field === 'rol' ? (
                                        <Select
                                            label="Valor"
                                            value={condition.value}
                                            onChange={(val) => updateCondition(idx, { value: val })}
                                            options={availableRoles.map(r => ({
                                                value: r,
                                                label: r === 'superadmin' ? 'Super Administrador' :
                                                    r === 'admin' ? 'Administrador' :
                                                        r === 'cliente' ? 'Cliente' :
                                                            r.charAt(0).toUpperCase() + r.slice(1).toLowerCase()
                                            }))}
                                        />
                                    ) : (
                                        <Input
                                            label="Valor"
                                            value={condition.value}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCondition(idx, { value: e.target.value })}
                                            placeholder="Ej: valor..."
                                        />
                                    )}
                                </div>
                                <Button
                                    variant="danger"
                                    onClick={() => removeCondition(idx)}
                                    leftIcon={<Trash2 size={16} />}
                                />
                            </div>
                        ))}
                    </div>

                    <Button variant="secondary" onClick={addCondition} fullWidth leftIcon={<Plus size={18} />}>
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
                                    {(estimatedSize || 0).toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-tertiary)' }}>usuarios</span>
                                </h3>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            fullWidth
                            leftIcon={<Search size={18} />}
                            isLoading={isEstimating}
                            onClick={refreshEstimation}
                        >
                            Refrescar Estimación
                        </Button>
                    </Card>

                    <Card title="Estructura JSON (Filtros)">
                        <CodePreview
                            code={JSON.stringify(filters, null, 2)}
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
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSave}
                    leftIcon={<Database size={18} />}
                    isLoading={isSaving}
                >
                    {id ? 'Actualizar Lista Inteligente' : 'Guardar Lista Inteligente'}
                </Button>
            </div>
        </div>
    );
}
