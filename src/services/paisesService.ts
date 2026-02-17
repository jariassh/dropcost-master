import paisesData from '@/data/paises.json';

export interface Pais {
    codigo_iso_2: string;
    codigo_iso_3: string;
    codigo_numerico: string;
    nombre_es: string;
    nombre_en: string;
    bandera: string;
    codigo_telefonico: string;
    prefijo: string;
    formato_telefono: string;
    region: string;
    subregion: string;
    moneda_codigo: string;
    moneda_nombre: string;
    moneda_simbolo: string;
    idioma: string;
}

// Memory cache for paises
let paisesCache: Pais[] | null = null;

export async function cargarPaises(): Promise<Pais[]> {
    if (paisesCache) return paisesCache;
    
    // Sort logic already applied during generation, but we can ensure it here
    paisesCache = (paisesData.paises as Pais[]).sort((a, b) => 
        a.nombre_es.localeCompare(b.nombre_es, 'es')
    );
    
    return paisesCache;
}

export async function obtenerPaisPorCodigo(codigo: string): Promise<Pais | null> {
    const paises = await cargarPaises();
    const cleanCodigo = codigo.toUpperCase();
    return paises.find(p => p.codigo_iso_2 === cleanCodigo || p.codigo_iso_3 === cleanCodigo) || null;
}

export async function obtenerPaisPorTelefono(telefono: string): Promise<Pais | null> {
    const paises = await cargarPaises();
    // Search for telephone code (e.g. +57)
    return paises.find(p => p.codigo_telefonico === telefono || p.prefijo === telefono) || null;
}

export async function buscarPaises(termino: string): Promise<Pais[]> {
    const paises = await cargarPaises();
    const lowerTerm = termino.toLowerCase();
    return paises.filter(p => 
        p.nombre_es.toLowerCase().includes(lowerTerm) ||
        p.nombre_en.toLowerCase().includes(lowerTerm) ||
        p.codigo_iso_2.toLowerCase().includes(lowerTerm) ||
        p.codigo_telefonico.includes(lowerTerm) ||
        p.moneda_codigo.toLowerCase().includes(lowerTerm)
    );
}

export async function obtenerPaisesPorRegion(region: string): Promise<Pais[]> {
    const paises = await cargarPaises();
    return paises.filter(p => p.region === region);
}
