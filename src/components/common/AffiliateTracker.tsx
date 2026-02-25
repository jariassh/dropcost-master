import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { affiliateService } from '@/services/affiliateService';

/**
 * Componente invisible que escucha cambios en la URL para capturar
 * códigos de referido y persistirlos en cookies/storage por 90 días.
 */
export function AffiliateTracker() {
    const [searchParams] = useSearchParams();
    const ref = searchParams.get('ref');

    useEffect(() => {
        if (ref) {
            // Guardar o actualizar (Last Click Wins)
            affiliateService.setAffiliateId(ref);
        }
    }, [ref]);

    return null; // No renderiza nada
}
