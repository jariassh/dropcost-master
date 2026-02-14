import paisesData from '@/data/paises.json';

export interface Pais {
    nombre_es: string;
    codigo_iso_2: string;
    codigo_telefonico: string;
    bandera: string;
    moneda_codigo: string;
    moneda_nombre: string;
    moneda_simbolo: string;
}

export async function cargarPaises(): Promise<Pais[]> {
    return paisesData.paises;
}

export async function obtenerPaisPorCodigo(codigo: string): Promise<Pais | null> {
    const paises = await cargarPaises();
    return paises.find(p => p.codigo_iso_2.toUpperCase() === codigo.toUpperCase()) || null;
}
