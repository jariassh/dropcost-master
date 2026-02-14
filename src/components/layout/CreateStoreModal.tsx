/**
 * Modal para la creación de una nueva tienda.
 */
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, Banknote } from 'lucide-react';
import { Modal, Button, Input, Select, CountrySelect } from '@/components/common';
import { useStoreStore } from '@/store/useStoreStore';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { obtenerPaisPorCodigo, cargarPaises, Pais } from '@/services/paisesService';

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



export function CreateStoreModal({ isOpen, onClose }: CreateStoreModalProps) {
    const { crearTienda, isLoading } = useStoreStore();
    const { user } = useAuthStore();
    const [allCountries, setAllCountries] = useState<Pais[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useForm<StoreFormData>({
        resolver: zodResolver(storeSchema),
        defaultValues: { nombre: '', pais: 'CO', moneda: 'COP' },
    });

    useEffect(() => {
        cargarPaises().then(setAllCountries);
    }, []);

    const selectedPais = watch('pais');

    useEffect(() => {
        const syncMoneda = async () => {
            if (selectedPais) {
                const p = await obtenerPaisPorCodigo(selectedPais);
                if (p) {
                    setValue('moneda', p.moneda_codigo);
                }
            }
        };
        syncMoneda();
    }, [selectedPais, setValue]);

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
                            <CountrySelect
                                label="País de Operación"
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.pais?.message}
                            />
                        )}
                    />

                    <Input
                        label="Moneda Local"
                        disabled
                        value={watch('moneda') ? `${allCountries.find(p => p.moneda_codigo === watch('moneda'))?.moneda_nombre || ''} (${watch('moneda')})` : ''}
                        leftIcon={<Banknote size={18} />}
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
