import { useState, useEffect } from 'react';
import { obtenerPaisPorCodigo, Pais } from '@/services/paisesService';

/**
 * Hook centralizado para detectar el país del usuario por IP.
 * Usa ipapi.co y cachea el resultado globalmente para evitar llamadas duplicadas.
 * Retorna el objeto Pais detectado o null si aún no se ha detectado/falló.
 */

// Cache global: solo una llamada a la API por sesión
let geoCountryCache: Pais | null = null;
let geoCountryPromise: Promise<Pais | null> | null = null;

async function detectGeoCountry(): Promise<Pais | null> {
    if (geoCountryCache) return geoCountryCache;

    if (!geoCountryPromise) {
        geoCountryPromise = (async () => {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                if (data.country_code) {
                    const pais = await obtenerPaisPorCodigo(data.country_code);
                    if (pais) {
                        geoCountryCache = pais;
                        // Emitir evento global para que LandingLayout y otros componentes legacy se enteren
                        window.dispatchEvent(new CustomEvent('countryDetected', { detail: pais }));
                        return pais;
                    }
                }
            } catch (error) {
                // Silenciar errores de geolocalización - no es crítico
            }
            return null;
        })();
    }

    return geoCountryPromise;
}

export function useGeoCountry(): Pais | null {
    const [country, setCountry] = useState<Pais | null>(geoCountryCache);

    useEffect(() => {
        // Si ya tenemos cache, no hacer nada
        if (geoCountryCache) {
            setCountry(geoCountryCache);
            return;
        }

        detectGeoCountry().then(result => {
            if (result) {
                setCountry(result);
            }
        });
    }, []);

    return country;
}

/**
 * Genera un placeholder de teléfono basado en el formato_telefono del país.
 * Ejemplo: "+57 XXX XXXXXXX" -> "300 123 4567" (remueve el código de país)
 */
export function getPhonePlaceholder(pais: Pais | null): string {
    if (!pais?.formato_telefono) return '300 123 4567';

    // Extraer solo la parte del número local (sin el código de país)
    // formato_telefono es como "+57 XXX XXXXXXX"
    const parts = pais.formato_telefono.split(' ');
    // Remover la primera parte que es el código de país (+57, +1, etc.)
    const localParts = parts.slice(1);
    if (localParts.length === 0) return '300 123 4567';

    // Reemplazar X por dígitos de ejemplo
    const digits = '3001234567890';
    let digitIndex = 0;
    const placeholder = localParts.join(' ').replace(/X/g, () => {
        return digits[digitIndex++ % digits.length];
    });

    return placeholder;
}
