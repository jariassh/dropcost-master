import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { affiliateService } from '@/services/affiliateService';
import { incrementReferralClicks } from '@/services/referralService';

/**
 * Componente invisible que escucha cambios en la URL para capturar
 * códigos de referido y persistirlos en cookies/storage por 90 días.
 */
export function AffiliateTracker() {
    const [searchParams] = useSearchParams();
    const ref = searchParams.get('ref');
    const hasTracked = useRef(false);

    useEffect(() => {
        if (ref && !hasTracked.current) {
            // 1. Guardar o actualizar persistencia (Last Click Wins)
            affiliateService.setAffiliateId(ref);

            // 2. Incrementar clics solo si es visitante único para este código
            if (!affiliateService.isClickCounted(ref)) {
                incrementReferralClicks(ref);
                affiliateService.markClickAsCounted(ref);
            }

            hasTracked.current = true;
        }
    }, [ref]);

    return null; // No renderiza nada
}
