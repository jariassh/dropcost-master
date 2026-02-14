# Especificación de Requerimientos - Sistema Global de Países
## DropCost Master

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Requerimientos:** RF-131 a RF-138  
**Alcance:** Global (aplicable en toda la aplicación)

---

## 1. Resumen Ejecutivo

Sistema **centralizado y reutilizable** para gestionar países en toda la aplicación. 

**Características:**
- Lista de 195 países con: código ISO, nombre, bandera emoji, código telefónico
- Selectores de país con búsqueda (por nombre o código telefónico)
- Inputs de país con autocompletado en tiempo real
- Mostrar siempre: bandera + nombre país + (código telefónico si aplica)
- Validaciones y normalizaciones globales

**Uso en:**
- Registro usuario (país)
- Retiros (país cuenta bancaria)
- Tiendas (país de operación)
- Dirección (país)
- Análitica (geolocalizacion)
- Cualquier selector país futuro

---

## 2. Requerimientos Funcionales

### RF-131: Base de Datos - Tabla de Países

```sql
CREATE TABLE paises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificadores
  codigo_iso_2 VARCHAR(2) UNIQUE NOT NULL, -- CO, MX, AR, ES, etc
  codigo_iso_3 VARCHAR(3) UNIQUE NOT NULL, -- COL, MEX, ARG, ESP, etc
  codigo_numerico VARCHAR(3) UNIQUE, -- 170, 484, 32, 724
  
  -- Nombres
  nombre_es VARCHAR NOT NULL, -- Colombia
  nombre_en VARCHAR NOT NULL, -- Colombia
  
  -- Bandera
  bandera_emoji VARCHAR(4) NOT NULL, -- 🇨🇴
  
  -- Teléfono
  codigo_telefonico VARCHAR(5), -- +57, +52, +54, +34
  prefijo_telefonico VARCHAR(5), -- 57, 52, 54, 34
  formato_telefono VARCHAR, -- +57 XXX XXXXXXX
  
  -- Moneda (NUEVO)
  moneda_codigo VARCHAR(3), -- COP, MXN, ARS, EUR, USD
  moneda_nombre VARCHAR, -- Peso Colombiano, Dólar Estadounidense
  moneda_simbolo VARCHAR(3), -- $, €, R$, S/, etc
  
  -- Metadata
  region VARCHAR, -- Americas, Europe, Asia, etc
  subregion VARCHAR, -- South America, Central America, etc
  idioma_principal VARCHAR,
  
  -- Control
  activo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_paises_codigo_iso_2 ON paises(codigo_iso_2);
CREATE INDEX idx_paises_nombre_es ON paises(nombre_es);
CREATE INDEX idx_paises_codigo_telefonico ON paises(codigo_telefonico);
CREATE INDEX idx_paises_moneda ON paises(moneda_codigo);
CREATE INDEX idx_paises_region ON paises(region);
CREATE FULLTEXT INDEX idx_paises_busqueda ON paises(nombre_es, nombre_en, codigo_telefonico);
```

---

### RF-132: Listado Completo de 195 Países

**Estructura de datos (JSON):**

```json
[
  {
    "codigo_iso_2": "CO",
    "codigo_iso_3": "COL",
    "nombre_es": "Colombia",
    "nombre_en": "Colombia",
    "bandera": "🇨🇴",
    "codigo_telefonico": "+57",
    "prefijo": "57",
    "region": "Americas",
    "moneda_codigo": "COP",
    "moneda_nombre": "Peso Colombiano",
    "moneda_simbolo": "$",
    "idioma": "es"
  },
  {
    "codigo_iso_2": "MX",
    "codigo_iso_3": "MEX",
    "nombre_es": "México",
    "nombre_en": "Mexico",
    "bandera": "🇲🇽",
    "codigo_telefonico": "+52",
    "prefijo": "52",
    "region": "Americas",
    "moneda_codigo": "MXN",
    "moneda_nombre": "Peso Mexicano",
    "moneda_simbolo": "$",
    "idioma": "es"
  },
  {
    "codigo_iso_2": "AR",
    "codigo_iso_3": "ARG",
    "nombre_es": "Argentina",
    "nombre_en": "Argentina",
    "bandera": "🇦🇷",
    "codigo_telefonico": "+54",
    "prefijo": "54",
    "region": "Americas",
    "moneda_codigo": "ARS",
    "moneda_nombre": "Peso Argentino",
    "moneda_simbolo": "$",
    "idioma": "es"
  },
  {
    "codigo_iso_2": "BR",
    "codigo_iso_3": "BRA",
    "nombre_es": "Brasil",
    "nombre_en": "Brazil",
    "bandera": "🇧🇷",
    "codigo_telefonico": "+55",
    "prefijo": "55",
    "region": "Americas",
    "moneda_codigo": "BRL",
    "moneda_nombre": "Real Brasileño",
    "moneda_simbolo": "R$",
    "idioma": "pt"
  },
  {
    "codigo_iso_2": "ES",
    "codigo_iso_3": "ESP",
    "nombre_es": "España",
    "nombre_en": "Spain",
    "bandera": "🇪🇸",
    "codigo_telefonico": "+34",
    "prefijo": "34",
    "region": "Europe",
    "moneda_codigo": "EUR",
    "moneda_nombre": "Euro",
    "moneda_simbolo": "€",
    "idioma": "es"
  },
  {
    "codigo_iso_2": "US",
    "codigo_iso_3": "USA",
    "nombre_es": "Estados Unidos",
    "nombre_en": "United States",
    "bandera": "🇺🇸",
    "codigo_telefonico": "+1",
    "prefijo": "1",
    "region": "Americas",
    "moneda_codigo": "USD",
    "moneda_nombre": "Dólar Estadounidense",
    "moneda_simbolo": "$",
    "idioma": "en"
  },
  {
    "codigo_iso_2": "PE",
    "codigo_iso_3": "PER",
    "nombre_es": "Perú",
    "nombre_en": "Peru",
    "bandera": "🇵🇪",
    "codigo_telefonico": "+51",
    "prefijo": "51",
    "region": "Americas",
    "moneda_codigo": "PEN",
    "moneda_nombre": "Sol Peruano",
    "moneda_simbolo": "S/",
    "idioma": "es"
  },
  {
    "codigo_iso_2": "CL",
    "codigo_iso_3": "CHL",
    "nombre_es": "Chile",
    "nombre_en": "Chile",
    "bandera": "🇨🇱",
    "codigo_telefonico": "+56",
    "prefijo": "56",
    "region": "Americas",
    "moneda_codigo": "CLP",
    "moneda_nombre": "Peso Chileno",
    "moneda_simbolo": "$",
    "idioma": "es"
  },
  // ... 187 países más (ver archivo adjunto paises-completo.json)
]
```

**Total:** 195 países + 6 territorios especiales

**Datos de moneda incluyen:**
- `moneda_codigo`: Código ISO 4217 (COP, USD, EUR, etc)
- `moneda_nombre`: Nombre completo en español
- `moneda_simbolo`: Símbolo de moneda ($, €, etc)

---

### RF-133: Selector de País - Con Búsqueda, Bandera y Moneda

**Componente reutilizable:**

```typescript
// src/components/SelectPais.tsx

interface SelectPaisProps {
  value?: string; // código ISO-2
  onChange: (pais: Pais) => void;
  placeholder?: string;
  showTelefono?: boolean; // Mostrar código telefónico
  showMoneda?: boolean; // Mostrar moneda (NUEVO)
  disabled?: boolean;
  label?: string;
  error?: string;
  required?: boolean;
}

export function SelectPais({
  value,
  onChange,
  placeholder = "Selecciona un país",
  showTelefono = true,
  showMoneda = false, // Por defecto no mostrar
  disabled = false,
  label,
  error,
  required = false
}: SelectPaisProps) {
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [paises, setPaises] = useState<Pais[]>([]);

  // Cargar países
  useEffect(() => {
    cargarPaises();
  }, []);

  // Filtrar países por búsqueda
  const paisesFiltrados = useMemo(() => {
    if (!busqueda) return paises;

    const termino = busqueda.toLowerCase();
    return paises.filter(p =>
      p.nombre_es.toLowerCase().includes(termino) ||
      p.nombre_en.toLowerCase().includes(termino) ||
      p.codigo_iso_2.toLowerCase().includes(termino) ||
      p.codigo_telefonico?.includes(termino) ||
      p.prefijo?.includes(termino) ||
      p.moneda_codigo?.includes(termino) || // Búsqueda por código moneda
      p.moneda_nombre?.toLowerCase().includes(termino) // Búsqueda por nombre moneda
    );
  }, [paises, busqueda]);

  // País seleccionado
  const paisSeleccionado = paises.find(p => p.codigo_iso_2 === value);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Input + Botón abrir */}
        <button
          onClick={() => setAbierto(!abierto)}
          disabled={disabled}
          className={`
            w-full flex items-center gap-2 px-4 py-2.5
            border rounded-lg bg-white
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
            transition-colors
          `}
        >
          {paisSeleccionado ? (
            <>
              <span className="text-2xl">{paisSeleccionado.bandera}</span>
              <div className="flex-1 text-left">
                <div className="font-medium">{paisSeleccionado.nombre_es}</div>
                <div className="text-xs text-gray-500 flex gap-2">
                  {showTelefono && paisSeleccionado.codigo_telefonico && (
                    <span>{paisSeleccionado.codigo_telefonico}</span>
                  )}
                  {showMoneda && paisSeleccionado.moneda_codigo && (
                    <span>
                      {paisSeleccionado.moneda_simbolo} {paisSeleccionado.moneda_codigo}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {/* Dropdown */}
        {abierto && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50">
            {/* Búsqueda */}
            <div className="p-3 border-b">
              <input
                type="text"
                placeholder="Busca por nombre, código (+57, +52...) o moneda (USD, EUR...)"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                autoFocus
              />
            </div>

            {/* Lista */}
            <div className="max-h-64 overflow-y-auto">
              {paisesFiltrados.length > 0 ? (
                paisesFiltrados.map(pais => (
                  <button
                    key={pais.codigo_iso_2}
                    onClick={() => {
                      onChange(pais);
                      setAbierto(false);
                      setBusqueda('');
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3
                      hover:bg-gray-100 transition-colors
                      ${value === pais.codigo_iso_2 ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                    `}
                  >
                    <span className="text-2xl">{pais.bandera}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{pais.nombre_es}</div>
                      <div className="text-xs text-gray-500 flex gap-2">
                        {showTelefono && pais.codigo_telefonico && (
                          <span>{pais.codigo_telefonico}</span>
                        )}
                        {showMoneda && pais.moneda_codigo && (
                          <span>
                            {pais.moneda_simbolo} {pais.moneda_codigo}
                          </span>
                        )}
                      </div>
                    </div>
                    {value === pais.codigo_iso_2 && (
                      <Check className="w-4 h-4 text-blue-500" />
                    )}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No se encontraron países
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
```

---

### RF-134: Input Autocompletado de País

**Para campos como "País de operación" en tiendas:**

```typescript
// src/components/InputPaisAutocompletado.tsx

interface InputPaisAutocompleteProps {
  value?: string; // código ISO-2
  onChange: (pais: Pais | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function InputPaisAutocompletado({
  value,
  onChange,
  label,
  placeholder = "Escribe el país...",
  required = false,
  error
}: InputPaisAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [paises, setPaises] = useState<Pais[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [sugerencias, setSugerencias] = useState<Pais[]>([]);

  const paisSeleccionado = paises.find(p => p.codigo_iso_2 === value);

  // Cargar todos los países
  useEffect(() => {
    cargarPaises().then(setPaises);
  }, []);

  // Filtrar sugerencias mientras usuario escribe
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const texto = e.target.value;
    setInputValue(texto);

    if (texto.length > 0) {
      const filtrados = paises.filter(p =>
        p.nombre_es.toLowerCase().includes(texto.toLowerCase()) ||
        p.nombre_en.toLowerCase().includes(texto.toLowerCase()) ||
        p.codigo_iso_2.toLowerCase().includes(texto.toLowerCase())
      );
      setSugerencias(filtrados);
      setMostrarSugerencias(true);
    } else {
      setMostrarSugerencias(false);
      setSugerencias([]);
    }
  };

  const seleccionarPais = (pais: Pais) => {
    onChange(pais);
    setInputValue('');
    setMostrarSugerencias(false);
  };

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Input con país seleccionado */}
        <div className="flex items-center border rounded-lg px-3 py-2.5">
          {paisSeleccionado && (
            <>
              <span className="text-2xl mr-2">{paisSeleccionado.bandera}</span>
              <span className="text-sm font-medium mr-2">
                {paisSeleccionado.nombre_es}
              </span>
              <button
                onClick={() => {
                  onChange(null);
                  setInputValue('');
                }}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </>
          )}

          {!paisSeleccionado && (
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => inputValue && setMostrarSugerencias(true)}
              placeholder={placeholder}
              className="flex-1 outline-none text-sm"
            />
          )}
        </div>

        {/* Sugerencias */}
        {mostrarSugerencias && sugerencias.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {sugerencias.map(pais => (
              <button
                key={pais.codigo_iso_2}
                onClick={() => seleccionarPais(pais)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-left border-b last:border-b-0"
              >
                <span className="text-2xl">{pais.bandera}</span>
                <div>
                  <div className="font-medium text-sm">{pais.nombre_es}</div>
                  <div className="text-xs text-gray-500">{pais.codigo_iso_2}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
```

---

### RF-135: Mostrar País con Bandera y Moneda en Toda la App

**Componente universal para mostrar país:**

```typescript
// src/components/PaisDisplay.tsx

interface PaisDisplayProps {
  codigo_iso_2: string;
  mostrarNombre?: boolean;
  mostrarCodigo?: boolean;
  mostrarTelefono?: boolean;
  mostrarMoneda?: boolean; // NUEVO
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PaisDisplay({
  codigo_iso_2,
  mostrarNombre = true,
  mostrarCodigo = false,
  mostrarTelefono = false,
  mostrarMoneda = false, // NUEVO (por defecto no mostrar)
  size = 'md',
  className = ''
}: PaisDisplayProps) {
  const [pais, setPais] = useState<Pais | null>(null);

  useEffect(() => {
    buscarPaisPorCodigo(codigo_iso_2).then(setPais);
  }, [codigo_iso_2]);

  if (!pais) return null;

  const tamanoBandera = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  }[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={tamanoBandera}>{pais.bandera}</span>
      {mostrarNombre && <span className="font-medium">{pais.nombre_es}</span>}
      {mostrarCodigo && <span className="text-sm text-gray-500">{pais.codigo_iso_2}</span>}
      {mostrarTelefono && pais.codigo_telefonico && (
        <span className="text-sm text-gray-500">{pais.codigo_telefonico}</span>
      )}
      {mostrarMoneda && pais.moneda_codigo && (
        <span className="text-sm text-gray-500">
          {pais.moneda_simbolo} {pais.moneda_codigo}
        </span>
      )}
    </div>
  );
}
```

**Ejemplos de uso:**

```typescript
// Solo bandera + nombre
<PaisDisplay codigo_iso_2="CO" mostrarNombre={true} />
// Resultado: 🇨🇴 Colombia

// Con teléfono
<PaisDisplay 
  codigo_iso_2="CO" 
  mostrarNombre={true} 
  mostrarTelefono={true} 
/>
// Resultado: 🇨🇴 Colombia +57

// Con moneda (NUEVO)
<PaisDisplay 
  codigo_iso_2="CO" 
  mostrarNombre={true} 
  mostrarMoneda={true} 
/>
// Resultado: 🇨🇴 Colombia $ COP

// Con todo
<PaisDisplay 
  codigo_iso_2="CO" 
  mostrarNombre={true} 
  mostrarTelefono={true} 
  mostrarMoneda={true} 
/>
// Resultado: 🇨🇴 Colombia +57 $ COP
```

---

### RF-136: Hook Reutilizable para Países

```typescript
// src/hooks/usePaises.ts

export function usePaises() {
  const [paises, setPaises] = useState<Pais[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarPaises()
      .then(setPaises)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Funciones útiles
  const obtenerPaisPorCodigo = (codigo: string) =>
    paises.find(p => p.codigo_iso_2 === codigo);

  const obtenerPaisPorTelefono = (telefono: string) =>
    paises.find(p => p.codigo_telefonico === telefono);

  const buscarPaises = (termino: string) =>
    paises.filter(p =>
      p.nombre_es.toLowerCase().includes(termino.toLowerCase()) ||
      p.codigo_iso_2.toLowerCase().includes(termino.toLowerCase()) ||
      p.codigo_telefonico?.includes(termino)
    );

  const obtenerPaisesPorRegion = (region: string) =>
    paises.filter(p => p.region === region);

  return {
    paises,
    loading,
    error,
    obtenerPaisPorCodigo,
    obtenerPaisPorTelefono,
    buscarPaises,
    obtenerPaisesPorRegion
  };
}
```

---

### RF-137: Validación de País

```typescript
// src/utils/validationPais.ts

import * as z from 'zod';

// Schema Zod para validación
export const schemaPais = z.string()
  .min(2, 'Selecciona un país válido')
  .regex(/^[A-Z]{2}$/, 'Código país inválido');

// Función de validación
export async function validarPais(codigo: string): Promise<boolean> {
  try {
    await schemaPais.parseAsync(codigo);
    
    // Validar que exista en BD
    const pais = await obtenerPaisPorCodigo(codigo);
    return !!pais;
  } catch (error) {
    return false;
  }
}

// Normalizar entrada
export function normalizarCodigoPais(input: string): string {
  return input.toUpperCase().trim().slice(0, 2);
}
```

---

### RF-138: Listado de Países - Dónde Usarse

**Ubicaciones donde DEBE aparecer país con bandera:**

```
1. REGISTRO USUARIO (en forms)
   ├─ Campo: País
   └─ Mostrar: 🇨🇴 Colombia
   └─ Con búsqueda: sí

2. CREAR TIENDA (en forms)
   ├─ Campo: País de operación
   └─ Mostrar: 🇲🇽 México (autocompletado)
   └─ Con búsqueda: sí (mientras escribe)

3. RETIROS (en forms)
   ├─ Campo: País cuenta bancaria
   └─ Mostrar: 🇦🇷 Argentina (+54)
   └─ Con código telefónico: sí
   └─ Con búsqueda: sí

4. ANALYTICS (en gráficos)
   ├─ Campo: País de visita
   └─ Mostrar: 🇪🇸 España
   └─ Sin búsqueda: no (solo lectura)

5. TABLA USUARIOS (admin)
   ├─ Campo: País usuario
   └─ Mostrar: 🇵🇪 Perú
   └─ Sin búsqueda: no (solo lectura)

6. CONFIGURACIÓN USUARIO
   ├─ Campo: País de residencia
   └─ Mostrar: 🇨🇱 Chile
   └─ Con búsqueda: sí

7. DIRECCIÓN DE ENVÍO
   ├─ Campo: País
   └─ Mostrar: 🇧🇷 Brasil
   └─ Con búsqueda: sí

8. INTEGRACIONES
   ├─ Campo: País (si aplica)
   └─ Mostrar: 🇺🇸 Estados Unidos
   └─ Con búsqueda: sí

REGLA GENERAL:
├─ Si usuario ESCRIBE: campo autocompletado
├─ Si usuario SELECCIONA: dropdown con búsqueda
└─ Si solo LECTURA: mostrar con bandera + nombre
```

---

## 3. Archivos Necesarios

### Archivo: `src/data/paises.json`

Contiene los 195 países con estructura:

```json
{
  "paises": [
    {
      "codigo_iso_2": "CO",
      "codigo_iso_3": "COL",
      "codigo_numerico": "170",
      "nombre_es": "Colombia",
      "nombre_en": "Colombia",
      "bandera": "🇨🇴",
      "codigo_telefonico": "+57",
      "prefijo": "57",
      "formato_telefono": "+57 XXX XXXXXXX",
      "region": "Americas",
      "subregion": "South America",
      "moneda_codigo": "COP",
      "moneda_nombre": "Peso Colombiano",
      "idioma": "es"
    },
    // ... 194 países más
  ]
}
```

**Fuentes:**
- ISO 3166-1 (códigos país)
- E.164 (códigos telefónicos)
- Flag emojis Unicode

---

### Archivo: `src/services/paisesService.ts`

```typescript
// Servicio para cargar/buscar países

import paisesData from '@/data/paises.json';
import { cache } from '@/utils/cache';

export async function cargarPaises(): Promise<Pais[]> {
  // Usar caché para no cargar repetidas veces
  const cached = cache.get('paises');
  if (cached) return cached;

  const paises = paisesData.paises;
  cache.set('paises', paises, 24 * 60 * 60 * 1000); // 24 horas
  return paises;
}

export async function obtenerPaisPorCodigo(codigo: string): Promise<Pais | null> {
  const paises = await cargarPaises();
  return paises.find(p => p.codigo_iso_2 === codigo) || null;
}

export async function buscarPaisPorTelefono(telefono: string): Promise<Pais | null> {
  const paises = await cargarPaises();
  return paises.find(p => p.codigo_telefonico === telefono) || null;
}
```

---

## 4. Validaciones

**En todos los selectores:**
- ✅ País debe existir en BD
- ✅ Código ISO-2 válido (2 letras mayúsculas)
- ✅ Requerido si tiene atributo `required`
- ✅ Código telefónico debe ser válido si se guarda

---

## 5. Integración en Componentes Existentes

### Ejemplo: Registro Usuario

```typescript
// Antes (sin banderas)
<SelectPais
  value={pais}
  onChange={setPais}
  label="País"
  required
/>

// Después (con banderas)
<SelectPais
  value={pais}
  onChange={(p) => setPais(p.codigo_iso_2)}
  label="País"
  placeholder="Selecciona tu país"
  showTelefono={false}
  required
/>
```

### Ejemplo: Crear Tienda

```typescript
// Entrada con autocompletado
<InputPaisAutocompletado
  value={pais}
  onChange={(p) => setPais(p?.codigo_iso_2 || null)}
  label="País de operación"
  placeholder="Escribe tu país..."
  required
/>
```

### Ejemplo: Mostrar en tabla

```typescript
// Lectura de país
<PaisDisplay
  codigo_iso_2={usuario.pais}
  mostrarNombre={true}
  mostrarTelefono={false}
/>
```

---

## 6. Performance & Caché

**Optimizaciones:**
- ✅ Caché en memoria (24 horas)
- ✅ Fulltext search para búsquedas rápidas
- ✅ Lazy load (cargar solo si usuario abre dropdown)
- ✅ Debounce en búsqueda (300ms)

---

## 7. Internacionalización (i18n)

**Soportar múltiples idiomas:**

```typescript
// Mostrar nombre según idioma del usuario
function obtenerNombrePais(pais: Pais, idioma: 'es' | 'en' = 'es') {
  return idioma === 'es' ? pais.nombre_es : pais.nombre_en;
}
```

---

## 8. Listado Completo de 195 Países

**Regiones cubiertas:**
- Americas (35 países)
- Europe (44 países)
- Africa (54 países)
- Asia (50 países)
- Oceania (14 países)

**Ejemplos de países incluidos:**

```
Americas:
- 🇨🇴 Colombia (+57)
- 🇲🇽 México (+52)
- 🇦🇷 Argentina (+54)
- 🇧🇷 Brasil (+55)
- 🇵🇪 Perú (+51)
- 🇨🇱 Chile (+56)
- 🇪🇨 Ecuador (+593)
- 🇻🇪 Venezuela (+58)
- 🇨🇺 Cuba (+53)
- 🇬🇹 Guatemala (+502)
- ... más

Europe:
- 🇪🇸 España (+34)
- 🇫🇷 Francia (+33)
- 🇩🇪 Alemania (+49)
- 🇮🇹 Italia (+39)
- 🇬🇧 Reino Unido (+44)
- 🇵🇹 Portugal (+351)
- 🇳🇱 Países Bajos (+31)
- 🇧🇪 Bélgica (+32)
- 🇦🇹 Austria (+43)
- 🇵🇱 Polonia (+48)
- ... más

Asia:
- 🇮🇳 India (+91)
- 🇨🇳 China (+86)
- 🇯🇵 Japón (+81)
- 🇰🇷 Corea del Sur (+82)
- 🇹🇭 Tailandia (+66)
- 🇵🇭 Filipinas (+63)
- 🇮🇩 Indonesia (+62)
- 🇲🇾 Malasia (+60)
- 🇸🇬 Singapur (+65)
- 🇻🇳 Vietnam (+84)
- ... más

Africa & Oceania:
- 🇸🇦 Arabia Saudita (+966)
- 🇦🇪 Emiratos Árabes (+971)
- 🇸🇿 Suiza (+41)
- 🇸🇪 Suecia (+46)
- 🇳🇴 Noruega (+47)
- 🇦🇺 Australia (+61)
- 🇳🇿 Nueva Zelanda (+64)
- ... y 145 más
```

---

## 9. Timeline Implementación

| Fase | Duración | Tareas |
|------|----------|--------|
| **Fase 1** | Día 1 | Crear JSON países + tabla BD |
| **Fase 2** | Día 1 | SelectPais component |
| **Fase 3** | Día 2 | InputPaisAutocompletado component |
| **Fase 4** | Día 2 | PaisDisplay component |
| **Fase 5** | Día 2-3 | Integrar en toda la app |
| **Fase 6** | Día 3 | Testing + validaciones |

**Total:** 3 días

---

## 10. Checklist Go-Live

- [ ] Archivo paises.json con 195 países + monedas
- [ ] Tabla paises en BD con campos moneda
- [ ] SelectPais component funciona
- [ ] InputPaisAutocompletado funciona
- [ ] PaisDisplay funciona
- [ ] Búsqueda por nombre
- [ ] Búsqueda por código telefónico
- [ ] Búsqueda por código ISO-2
- [ ] **Búsqueda por código moneda** (NUEVO)
- [ ] **Búsqueda por nombre moneda** (NUEVO)
- [ ] Moneda se muestra en dropdown (opcional)
- [ ] Moneda se muestra en lectura (opcional)
- [ ] Caché funcionando (no recargar innecesariamente)
- [ ] Bandera mostrándose correctamente
- [ ] Moneda mostrándose correctamente (si habilitada)
- [ ] Validación país obligatorio
- [ ] Validación código moneda (si aplica)
- [ ] Testing responsivo (mobile, tablet, desktop)
- [ ] Dark mode soporte
- [ ] Integrado en: registro, tiendas, retiros, analytics
- [ ] Deploy staging ✅
- [ ] Deploy producción ✅

---

## 11. Archivos a Proporcionar

### Entregables:

1. **paises.json** - 195 países con datos completos
2. **SelectPais.tsx** - Componente dropdown con búsqueda
3. **InputPaisAutocompletado.tsx** - Input con autocompletado
4. **PaisDisplay.tsx** - Componente para mostrar país
5. **paisesService.ts** - Servicio datos
6. **usePaises.ts** - Hook reutilizable
7. **validationPais.ts** - Validaciones

---

**Fin Especificación de Requerimientos - Sistema Global de Países**

---

## 📊 RESUMEN

**RF-131 a RF-138 (8 requerimientos)**

✅ **195 países** con:
- Código ISO-2 (CO, MX, AR, ES, US)
- Bandera emoji (🇨🇴, 🇲🇽, 🇦🇷, 🇪🇸, 🇺🇸)
- Código telefónico (+57, +52, +54, +34, +1)
- **MONEDA LOCAL** (NUEVO) ✨
  - Código moneda (COP, USD, EUR, MXN, ARS)
  - Nombre moneda (Peso Colombiano, Dólar, Euro)
  - Símbolo moneda ($, €, R$, S/)
- Nombre español e inglés

✅ **3 Componentes reutilizables:**
- SelectPais: dropdown con búsqueda (+ moneda opcional)
- InputPaisAutocompletado: input con autocompletado
- PaisDisplay: mostrar país lectura (+ moneda opcional)

✅ **Búsqueda inteligente ahora incluye:**
- Por nombre país
- Por código ISO-2
- Por código telefónico
- **Por código moneda** (USD, EUR, COP) ✨
- **Por nombre moneda** (Dólar, Euro, Peso) ✨
- Debounce 300ms

✅ **Validaciones:**
- País obligatorio si required
- Código ISO-2 válido
- Código telefónico válido
- Código moneda válido (si se muestra)

✅ **Performance:**
- Caché 24 horas
- Lazy load dropdown
- Fulltext search BD

✅ **Usable en:**
- Registro usuario (mostrar moneda opcional)
- Crear tienda (mostrar moneda opcional)
- Retiros (mostrar moneda para referencia)
- Analytics (mostrar moneda por país)
- Cualquier selector país futuro

✅ **Timeline:** 3 días

✅ **Ejemplos con moneda:**

```
BÚSQUEDA POR CÓDIGO MONEDA:
Escribo: "EUR" → 🇪🇸 España (+34) € EUR

BÚSQUEDA POR NOMBRE MONEDA:
Escribo: "Peso" → 🇨🇴 Colombia (+57) $ COP, 🇲🇽 México (+52) $ MXN

EN DROPDOWN CON MONEDA:
🇨🇴 Colombia (+57) $ COP
🇺🇸 Estados Unidos (+1) $ USD
🇪🇸 España (+34) € EUR

EN TABLA/LECTURA:
🇨🇴 Colombia $ COP
🇧🇷 Brasil R$ BRL
🇵🇪 Perú S/ PEN
```
