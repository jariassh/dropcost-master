/**
 * Modal para la creación de una nueva tienda.
 */
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, Banknote } from 'lucide-react';
import { Modal, Button, Input, Select } from '@/components/common';
import { useStoreStore } from '@/store/useStoreStore';
import { useAuthStore } from '@/store/authStore';

const storeSchema = z.object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    pais: z.string().min(2, 'Selecciona un país'),
    moneda: z.string().min(3, 'Selecciona una moneda'),
});

type StoreFormData = z.infer<typeof storeSchema>;

interface CreateStoreModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PAISES = [
    { value: 'CO', label: 'Colombia' },
    { value: 'MX', label: 'México' },
    { value: 'EC', label: 'Ecuador' },
    { value: 'PE', label: 'Perú' },
    { value: 'CL', label: 'Chile' },
];

const MONEDAS = [
    { value: 'COP', label: 'Peso Colombiano (COP)' },
    { value: 'MXN', label: 'Peso Mexicano (MXN)' },
    { value: 'USD', label: 'Dólar Estadounidense (USD)' },
    { value: 'PEN', label: 'Sol Peruano (PEN)' },
    { value: 'CLP', label: 'Peso Chileno (CLP)' },
];

export function CreateStoreModal({ isOpen, onClose }: CreateStoreModalProps) {
    const { crearTienda, isLoading } = useStoreStore();
    const { user } = useAuthStore();

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm<StoreFormData>({
        resolver: zodResolver(storeSchema),
        defaultValues: { nombre: '', pais: 'CO', moneda: 'COP' },
    });

    async function onSubmit(data: StoreFormData) {
        if (!user?.id) return;

        const success = await crearTienda({
            nombre: data.nombre,
            pais: data.pais,
            moneda: data.moneda,
            usuario_id: user.id
        });

        if (success) {
            reset();
            onClose();
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Crear Nueva Tienda"
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '10px' }}>
                    Configura tu nueva tienda para empezar a costear tus productos de manera independiente.
                </p>

                <Input
                    label="Nombre de la Tienda"
                    placeholder="Ej: Mi Tienda Online"
                    leftIcon={<Store size={18} />}
                    error={errors.nombre?.message}
                    {...register('nombre')}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Controller
                        name="pais"
                        control={control}
                        render={({ field }) => (
                            <Select
                                label="País de Operación"
                                options={PAISES}
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.pais?.message}
                            />
                        )}
                    />

                    <Controller
                        name="moneda"
                        control={control}
                        render={({ field }) => (
                            <Select
                                label="Moneda Local"
                                options={MONEDAS}
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.moneda?.message}
                            />
                        )}
                    />
                </div>

                <div style={{ marginTop: '12px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        Crear Tienda
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
