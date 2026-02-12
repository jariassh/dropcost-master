# Diseño UI/UX - DropCost Master

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Enfoque:** Diseño moderno, profesional y responsivo

---

## 1. Guía de Estilos

### 1.1 Paleta de Colores

#### Colores Primarios
| Color | Hex | RGB | Uso |
|-------|-----|-----|-----|
| Azul Primario | `#0066FF` | 0, 102, 255 | Botones principales, links, acciones |
| Azul Oscuro | `#003D99` | 0, 61, 153 | Hover primario, texto enfatizado |
| Azul Claro | `#E6F0FF` | 230, 240, 255 | Fondos suaves, highlights |

#### Colores Secundarios
| Color | Hex | RGB | Uso |
|-------|-----|-----|-----|
| Verde Éxito | `#10B981` | 16, 185, 129 | Estados positivos, confirmaciones |
| Amarillo Alerta | `#F59E0B` | 245, 158, 11 | Advertencias, precaución |
| Rojo Error | `#EF4444` | 239, 68, 68 | Errores, eliminar, crítico |
| Gris Neutral | `#6B7280` | 107, 114, 128 | Texto secundario, bordes |

#### Colores Neutros
| Color | Hex | RGB | Uso |
|-------|-----|-----|-----|
| Blanco | `#FFFFFF` | 255, 255, 255 | Fondos claros |
| Gris Claro | `#F3F4F6` | 243, 244, 246 | Fondos secundarios |
| Gris Medio | `#D1D5DB` | 209, 213, 219 | Bordes, líneas |
| Gris Oscuro | `#1F2937` | 31, 41, 55 | Texto primario (light mode) |
| Negro Profundo | `#111827` | 17, 24, 39 | Texto máximo contraste |

#### Colores Dark Mode
| Color | Hex | RGB | Uso |
|-------|-----|-----|-----|
| Fondo Principal | `#0F172A` | 15, 23, 42 | Fondo base dark |
| Fondo Secundario | `#1E293B` | 30, 41, 59 | Cards dark |
| Texto Primario | `#F1F5F9` | 241, 245, 249 | Texto principal dark |
| Texto Secundario | `#94A3B8` | 148, 163, 184 | Texto secundario dark |

### 1.2 Tipografía

#### Fuente Principal: Inter
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

#### Jerarquía Tipográfica
| Elemento | Tamaño | Peso | Line-height | Uso |
|----------|--------|------|-------------|-----|
| **H1** | 32px | 700 (Bold) | 1.2 | Títulos de página |
| **H2** | 28px | 700 (Bold) | 1.3 | Títulos de sección |
| **H3** | 24px | 600 (Semibold) | 1.3 | Subtítulos |
| **H4** | 20px | 600 (Semibold) | 1.4 | Encabezados menores |
| **Body Large** | 16px | 400 (Regular) | 1.5 | Texto principal |
| **Body** | 14px | 400 (Regular) | 1.5 | Texto normal |
| **Caption** | 12px | 500 (Medium) | 1.4 | Etiquetas, hints |
| **Mono** | 13px | 400 (Regular) | 1.5 | Código, valores técnicos |

### 1.3 Sistema de Espaciado

Escala 4px (base unit):

| Token | Valor | Uso |
|-------|-------|-----|
| `xs` | 4px | Espacios mínimos, gaps pequeños |
| `sm` | 8px | Espacios pequeños |
| `md` | 12px | Espacios medianos |
| `lg` | 16px | Espacios normales |
| `xl` | 24px | Espacios grandes |
| `2xl` | 32px | Espacios muy grandes |
| `3xl` | 48px | Espacios entre secciones |
| `4xl` | 64px | Espacios entre módulos |

### 1.4 Radios y Bordes

| Token | Valor | Uso |
|-------|-------|-----|
| `none` | 0px | Sin bordes |
| `sm` | 4px | Bordes sutiles |
| `md` | 8px | Bordes estándar |
| `lg` | 12px | Bordes redondeados |
| `full` | 9999px | Totalmente redondo (pills, avatares) |

### 1.5 Sombras

```css
/* Sombra SM */
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Sombra MD (Cards) */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);

/* Sombra LG (Modals) */
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Sombra XL (Dropdowns) */
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

### 1.6 Transiciones y Animaciones

```css
/* Transición rápida */
transition: all 150ms ease-out;

/* Transición normal */
transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);

/* Transición lenta */
transition: all 500ms ease-out;

/* Animación loading (spinner) */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
animation: spin 1s linear infinite;

/* Animación fade-in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fadeIn 300ms ease-out;
```

---

## 2. Componentes Base

### 2.1 Botones

#### Variantes

**Primary (CTA Principal)**
```
Estado Normal:
  Background: #0066FF
  Color: Blanco
  Padding: 12px 24px
  Border-radius: 8px
  Cursor: pointer

Estado Hover:
  Background: #003D99
  Transform: translateY(-2px)
  Shadow: MD

Estado Active:
  Background: #002966
  Transform: translateY(0)

Estado Disabled:
  Background: #D1D5DB
  Cursor: not-allowed
  Opacity: 0.5
```

**Secondary (Acción secundaria)**
```
Estado Normal:
  Background: #F3F4F6
  Color: #1F2937
  Border: 1px solid #D1D5DB
  Padding: 12px 24px

Estado Hover:
  Background: #E5E7EB
  Border-color: #9CA3AF
```

**Danger (Acciones peligrosas)**
```
Background: #EF4444
Color: Blanco
Padding: 12px 24px
Border-radius: 8px

Hover:
  Background: #DC2626
```

**Ghost (Texto simple)**
```
Background: transparent
Color: #0066FF
Padding: 12px 24px

Hover:
  Background: #E6F0FF
```

### 2.2 Campos de Formulario

**Input Text**
```
Background: Blanco
Border: 1px solid #D1D5DB
Border-radius: 8px
Padding: 12px 16px
Font-size: 14px
Line-height: 1.5

Focus:
  Border-color: #0066FF
  Box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1)
  Outline: none

Error:
  Border-color: #EF4444
  Box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1)

Disabled:
  Background: #F3F4F6
  Opacity: 0.5
  Cursor: not-allowed
```

**Label**
```
Font-size: 14px
Font-weight: 500
Color: #1F2937
Margin-bottom: 8px
```

**Helper Text**
```
Font-size: 12px
Color: #6B7280
Margin-top: 4px
```

**Select/Dropdown**
```
Igual que Input Text
Agregar icono chevron-down a la derecha
Padding-right: 40px para el ícono
```

**Checkbox**
```
Size: 20px x 20px
Border: 2px solid #D1D5DB
Border-radius: 4px
Cursor: pointer

Checked:
  Background: #0066FF
  Border-color: #0066FF
  Checkmark blanco
```

**Radio Button**
```
Size: 20px x 20px
Border: 2px solid #D1D5DB
Border-radius: 50%
Cursor: pointer

Checked:
  Border-color: #0066FF
  Inner circle: #0066FF (10px)
```

### 2.3 Cards

```
Background: Blanco (light) / #1E293B (dark)
Border-radius: 12px
Padding: 24px
Box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
Border: 1px solid #E5E7EB (light) / #334155 (dark)

Hover (si es clickeable):
  Transform: translateY(-4px)
  Box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
```

### 2.4 Badges/Tags

**Success**
```
Background: #D1FAE5
Color: #065F46
Padding: 4px 12px
Border-radius: 9999px
Font-size: 12px
Font-weight: 500
```

**Warning**
```
Background: #FEF3C7
Color: #92400E
```

**Error**
```
Background: #FEE2E2
Color: #991B1B
```

**Info**
```
Background: #E0E7FF
Color: #3730A3
```

### 2.5 Alertas

```
Padding: 16px
Border-radius: 8px
Border-left: 4px solid (color según tipo)
Icono + Texto
Botón close (X) opcional

Success:
  Background: #ECFDF5
  Border-color: #10B981
  Icono: ✓ verde

Error:
  Background: #FEF2F2
  Border-color: #EF4444
  Icono: ✗ rojo

Warning:
  Background: #FFFBEB
  Border-color: #F59E0B
  Icono: ! amarillo

Info:
  Background: #EFF6FF
  Border-color: #0066FF
  Icono: i azul
```

### 2.6 Modales

```
Overlay:
  Background: rgba(0, 0, 0, 0.5)
  Backdrop-filter: blur(4px)

Modal:
  Background: Blanco / #1E293B
  Border-radius: 16px
  Max-width: 500px (SM), 700px (MD), 1000px (LG)
  Padding: 32px
  Box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
  
  Cabecera:
    Display: flex
    Justify-content: space-between
    Align-items: center
    Margin-bottom: 24px
    
    Título: H3
    Botón close (X): Ghost button

  Body:
    Margin-bottom: 24px

  Footer:
    Display: flex
    Gap: 12px
    Justify-content: flex-end
    Padding-top: 24px
    Border-top: 1px solid #E5E7EB
```

### 2.7 Notificaciones/Toast

```
Position: bottom-right (configurable)
Background: Blanco / #1E293B
Border-radius: 8px
Padding: 16px
Box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
Border-left: 4px solid (color según tipo)
Display: flex
Gap: 12px
Max-width: 400px

Auto-dismiss: 5 segundos (configurable)

Icono + Título + Descripción (opcional)
```

### 2.8 Tablas

```
Border-collapse: collapse
Width: 100%
Font-size: 14px

Cabecera:
  Background: #F9FAFB / #1E293B
  Padding: 12px 16px
  Font-weight: 600
  Border-bottom: 2px solid #E5E7EB
  Text-align: left

Filas:
  Padding: 16px
  Border-bottom: 1px solid #E5E7EB
  
  Hover:
    Background: #F3F4F6 / #334155
    Cursor: pointer (si es seleccionable)

Zebra (alternado):
  Filas pares: Background #FAFAFA / #0F172A
```

### 2.9 Paginación

```
Display: flex
Gap: 8px
Align-items: center
Margin-top: 24px

Botones:
  Size: 40px x 40px
  Border-radius: 8px
  Font-weight: 500
  
  Normal:
    Background: transparent
    Color: #0066FF
    Border: 1px solid #D1D5DB
    
  Active:
    Background: #0066FF
    Color: Blanco
    
  Disabled:
    Opacity: 0.5
    Cursor: not-allowed

Info: "Página X de Y" (derecha)
```

### 2.10 Spinner/Loading

```
Size: 40px x 40px (MD), 24px x 24px (SM), 64px x 64px (LG)
Border: 4px solid #E5E7EB
Border-top-color: #0066FF
Border-radius: 50%
Animation: spin 1s linear infinite

Overlay loading:
  Position: absolute / fixed
  Background: rgba(0, 0, 0, 0.3)
  Display: flex
  Justify-content: center
  Align-items: center
```

---

## 3. Pantallas y Flujos

### 3.1 Flujo de Autenticación

#### Pantalla: Login
```
Layout: Dos columnas
  Izquierda (60%): Imagen/gradiente azul con branding
  Derecha (40%): Formulario

Contenido derecha:
  Logo DropCost Master (arriba)
  H1: "Bienvenido"
  Texto: "Inicia sesión en tu cuenta"
  
  Formulario:
    Input Email
    Input Password (type=password)
    Checkbox "Recuérdame"
    Link "¿Olvidaste contraseña?"
    
    Botón Primary: "Iniciar Sesión"
    
    Divider: "O continúa con"
    
    Botón Social Google (outline)
    
    Footer: "¿No tienes cuenta? Regístrate"
    
Responsive:
  Mobile: Una columna, imagen arriba
  Tablet: Dos columnas 50/50
  Desktop: Dos columnas 40/60
```

#### Pantalla: Registro
```
Similar a Login pero:
  H1: "Crea tu cuenta"
  
  Formulario:
    Input Nombre
    Input Apellido
    Input Email
    Input Password
    Input Confirmar Password
    Input Teléfono + Selector país (bandera)
    Select País
    Checkbox "Acepto términos"
    
    Botón Primary: "Crear Cuenta"
    
  Footer: "¿Ya tienes cuenta? Inicia sesión"
```

#### Pantalla: Verificación Email
```
Centro: Card
  Icono: Correo (animado)
  H2: "Verifica tu correo"
  P: "Hemos enviado un link a tu_email@example.com"
  
  Código de 6 dígitos (inputs individuales o paste)
  
  Botón Primary: "Verificar"
  Link: "Reenviar código" (deshabilitado 60s)
  
  Footer: "¿Cambiaste de email? Cambiar"
```

#### Pantalla: 2FA (Código Email)
```
Centro: Card
  Icono: Escudo
  H2: "Autenticación de dos factores"
  P: "Ingresa el código de 6 dígitos"
  
  Input código (6 dígitos)
  
  Botón Primary: "Verificar"
  Link: "Usar código de recuperación"
```

#### Pantalla: Recuperar Contraseña
```
Centro: Card
  H2: "Recuperar contraseña"
  P: "Ingresa tu email para recibir instrucciones"
  
  Input Email
  
  Botón Primary: "Enviar instrucciones"
  
  Footer: "¿Recordaste? Inicia sesión"
```

### 3.2 Dashboard Ejecutivo

#### Layout General
```
Header:
  Logo izquierda
  Navegación principal
  Selector tienda (dropdown con buscador)
  Notificaciones (icono con badge)
  Dark/Light toggle
  Avatar usuario (dropdown)

Sidebar (izquierda):
  Nav items con iconos:
    Dashboard (house)
    Simulador (calculator)
    Análisis Regional (map)
    Configuración (gear)
    Admin (lock) - solo admin
    
  Logo en footer sidebar
  Collapse button (responsive)

Main Content:
  Padding: 32px
  Max-width: 1600px
```

#### Pantalla: Dashboard Principal
```
Hero section:
  Selector tienda
  Filtro fechas (from/to + presets)
  Botón Exportar (PDF/Excel)

Tarjetas KPI (Grid 3 columnas):
  CPA Real
    Valor grande: $8.42
    Icono: trending-down (verde)
    Variación: ↓ 12%
    
  Tasa Entrega Neta
    Valor: 72.4%
    Icono: truck
    Variación: ↓ 2.1% (rojo)
    
  Margen Real
    Valor: 25.8%
    Icono: chart-pie
    Variación: ↑ 4.5% (verde)
    
  Factor Markup
    Valor: 3.2x
    Icono: trending-up
    Status: Estable

Semáforo de Viabilidad (Card grande):
  Icono circular grande (verde/amarillo/rojo)
  Texto: "Escalamiento (Verde)" - recomendación IA
  
  AI Insight box:
    Icono IA
    "Optimiza urgentemente la logística..."

Gráfico Tendencias CPA:
  Card
  Línea azul mostrando evolución últimos 30 días
  Eje X: Fechas
  Eje Y: CPA
  Hover: tooltip con valor exacto

Simulador Rentabilidad:
  Card
  Slider: Tasa Devolución (0-100%)
  Input: Utilidad Neta Proyectada (actualiza en tiempo real)
  Valor destacado en grande

Responsive:
  Mobile: 1 columna
  Tablet: 2 columnas
  Desktop: 3+ columnas
```

### 3.3 Simulador Financiero

#### Pantalla: Nueva Simulación
```
Layout: Dos paneles
  Izquierda (60%): Formulario
  Derecha (40%): Resultados (sticky)

Panel Izquierdo - Formulario (Tabs o Collapse):
  
  Tab 1: Meta y Producto
    Card:
      H4: "Meta y Producto"
      Input Nombre Producto
      Input Margen Neto Deseado (%)
      Input Costo Producto
      
  Tab 2: Logística y Recaudo
    Card:
      H4: "Logística y Recaudo"
      Input Costo Flete Base
      Input Comisión Recaudo (%)
      Input Tasa Devoluciones (%)
      Input Otros Gastos
      
  Tab 3: Publicidad (Meta Ads)
    Card:
      H4: "Publicidad"
      Input CPA Promedio
      Input % Cancelación Pre-envío
      
  Botón Primary: "Calcular Precio"

Panel Derecho - Resultados (Sticky):
  Card (fondo azul claro)
  H2 grande: Precio Sugerido $125.836
  
  Estadísticas:
    Utilidad Neta / Venta: $31.459
    Efectividad Final: 68.0%
    
  Botón Primary: "Guardar Costeo"
  
  Pestañas resultados:
    Costos Logísticos Reales:
      Lista con valores
      
    Embudo Efectividad:
      Gráfico de funnel
      
    Desglose Precio Venta:
      Gráfico pie o stacked bar
      % por concepto
```

#### Pantalla: Mis Costeos
```
Header:
  H1: "Mis Costeos"
  Selector Tienda
  Buscador: Por producto, campaña
  Filtros: Fecha, rentabilidad, efectividad
  Botón Primary: "Nuevo Costeo"

Tabla:
  Columnas:
    Producto
    ID Campaña Meta
    Costeo Realizado
    Ventas Logradas
    Cant. Artículos
    Rentabilidad Total
    Fecha
    Acciones (... menu)
    
  Filas hoverable:
    Acciones: Duplicar, Editar, Ver detalles, Eliminar
    
  Paginación

Responsive:
  Mobile: Mostrar Producto, Rentabilidad, Acciones (rest en modal)
  Desktop: Tabla completa
```

### 3.4 Análisis Regional

#### Pantalla: Análisis Regional
```
Header:
  Selector Tienda
  Filtro Fechas
  Título: "Análisis Regional - Colombia" (según país tienda)

Tarjetas por Región (Grid 3 columnas):
  Cada región:
    Bandera + Nombre región
    Primer Intento: 92.4%
    Incidencias: 3.1%
    Badge estado: ÓPTIMO (verde)
    
  Hover: Expandir mostrando transportadoras

Tabla Benchmarks Transportadoras:
  H3: "Benchmarks Transportadoras 2025"
  
  Columnas:
    Departamento
    Transportadora Clave
    Meta Benchmark
    Incidencias
    Estado
    
  Filas coloreadas según estado

Mapa Riesgo Regional:
  H3: "Mapa de Riesgo Regional para COD"
  
  Mapa interactivo:
    Regiones verde (seguras)
    Regiones amarillo (precaución)
    Regiones rojo (no operar)
    
  Hover: Tooltip con detalles
  Click: Expandir información región
  
  Leyenda abajo

Responsive:
  Mobile: Tarjetas en 1 columna, mapa responsivo
  Desktop: Grid 3 columnas, mapa grande
```

### 3.5 Configuración

#### Pantalla: Mi Perfil
```
Layout: Sidebar (nav config) + Main content

Sidebar:
  Nav items:
    Mi Perfil (activo)
    Tiendas
    Membresía
    Métodos de Pago
    
Contenido:
  H2: "Mi Perfil"
  
  Avatar section:
    Avatar grande (150x150)
    Botón: "Cambiar foto"
    
  Formulario:
    Input Nombres
    Input Apellidos
    Input Email
    Input Teléfono + Select país
    Select País
    
  Botones:
    Primary: "Guardar Cambios"
    Secondary: "Cancelar"
    
  Section peligroso:
    H4: "Zona de Peligro"
    Botón Danger: "Inactivar Cuenta"
    Modal confirmación
```

#### Pantalla: Tiendas
```
Header:
  H2: "Mis Tiendas"
  Botón Primary: "+ Nueva Tienda"
  
Tabla Tiendas:
  Columnas:
    Logo (pequeño)
    Nombre Tienda
    País
    Acciones (Gestionar, Eliminar)
    
  Click "Gestionar" → Panel lateral

Panel Gestionar Tienda:
  Pestaña 1: Información
    Input Nombre
    Upload Logo
    Valor País (read-only)
    
    Botón: "Guardar cambios"
    
  Pestaña 2: Integraciones
    Card por integración:
      Icono + Nombre (Meta Ads, Dropi, Shopify)
      Estado: Conectada/Desconectada
      Última sincronización: fecha
      
      Botón: "Conectar" o "Desconectar"
      
  Pestaña 3: Cargar CSV
    Drag & drop área
    O "Seleccionar archivo"
    Select: Tipo datos (Meta Ads / Dropi / Shopify)
    Botón: "Procesar"
    
  Pestaña 4: Estadísticas Costeos
    Tabla:
      Fecha Costeo
      Producto
      ID Campaña
      Costeo
      Ventas
      Cant. Artículos
      Rentabilidad
```

#### Pantalla: Membresía
```
H2: "Mi Membresía"

Plan Activo (Card prominente):
  Logo plan
  H3: Plan Pro Mensual
  Precio: $50.000 COP/mes
  Status badge: SUSCRIPCIÓN ACTIVA (verde)
  
  Botón: "Cambiar a Anual"
  
  Info:
    Renovación: 15 de marzo 2026
    Almacenamiento: 100GB usado de 500GB
    Costeos permitidos: Ilimitados
    
Cambiar Plan:
  H3: "Cambiar Plan"
  
  Cards planes (Básico, Pro, Enterprise):
    Características
    Precio
    Botón: "Cambiar a este plan"
    
  Mostrar comparativa
  
Métodos de Pago:
  H3: "Métodos de Pago"
  
  Card por método:
    Icono tarjeta
    VISA •••• 4524
    Vencimiento: 12/52
    Badge: PRINCIPAL (si aplica)
    
    Botones: Eliminar, Hacer principal
    
  Botón Primary: "+ Agregar método"
  
Modal Agregar Método:
  H3: "Agregar método de pago"
  
  Formulario:
    Input Nombre Titular
    Input Número Tarjeta
    Input Mes/Año (MM/YY)
    Input CVV
    
  Checkbox: Hacer principal
  
  Botones: Agregar, Cancelar
```

### 3.6 Panel Admin

#### Pantalla: Usuarios
```
H2: "Gestión de Usuarios"

Filtros y búsqueda:
  Input búsqueda (email, nombre)
  Select Plan (Todos, Básico, Pro, Enterprise)
  Select Estado (Activo, Cancelado, Suspendido)
  Botón: "Filtrar"

Tabla:
  Columnas:
    Email
    Nombre
    Plan
    Estado
    Fecha Registro
    Última Actividad
    Acciones
    
  Filas:
    Click → Abre panel de detalles usuario
    
  Paginación

Panel Usuario (Lateral):
  Información:
    Nombre completo
    Email
    Teléfono
    País
    Plan
    Estado suscripción
    Fecha registro
    Última actividad
    
  Acciones:
    Botón: "Cambiar plan"
    Botón: "Suspender"
    Botón: "Activar código promocional"
    Botón: "Ver tiendas"
    
  Logs actividad (últimas acciones)
```

#### Pantalla: Planes
```
H2: "Gestión de Planes"

Botón Primary: "+ Nuevo Plan"

Tabla Planes:
  Columnas:
    Nombre
    Precio Mensual
    Precio Anual
    Usuarios
    Estado
    Acciones
    
  Filas clickeables → Panel edición

Panel Edición Plan:
  Input Nombre
  Input Descripción
  Input Precio Mensual
  Input Precio Anual
  
  Características (checkboxes):
    ☑ Costeos ilimitados
    ☑ Integraciones
    ☑ Dashboard
    ☑ Análisis Regional
    etc.
    
  Toggle: Activo/Inactivo
  
  Botones: Guardar, Cancelar
```

#### Pantalla: Códigos Promocionales
```
H2: "Códigos Promocionales"

Botón Primary: "+ Nuevo Código"

Tabla:
  Columnas:
    Código
    Descuento
    Planes
    Usos Límite
    Usos Actuales
    Vencimiento
    Estado
    Acciones
    
Modal Crear Código:
  Input Código (autogenerado o manual)
  Input Descuento %
  Multi-select Planes aplicables
  Input Usos límite
  Date picker Fecha vencimiento
  
  Botones: Crear, Cancelar
```

#### Pantalla: Integraciones de Pago
```
H2: "Pasarelas de Pago"

Cards por pasarela (Mercado Pago, PayPal, Stripe):
  Icono pasarela
  Nombre
  Estado: Conectada/Desconectada
  
  Si conectada:
    API Key: ••••••••
    Botón: "Desconectar"
    Link: "Ver transacciones"
    
  Si desconectada:
    Botón Primary: "Conectar"
    
Modal Conectar Pasarela:
  Instrucciones paso a paso
  Input API Key
  Input Secret Key
  Test button
  Botones: Guardar, Cancelar
```

#### Pantalla: Templates Email
```
H2: "Templates de Email"

Selector: Tipo template
  Bienvenida
  Verificación email
  2FA
  Cambio contraseña
  Factura
  Cancelación suscripción
  etc.

Editor:
  Área código HTML (editor con syntax highlight)
  Vista previa a la derecha
  Botones: Vista previa, Probar envío, Guardar
  
Variables disponibles (panel lateral):
  {{nombre_usuario}}
  {{email}}
  {{fecha}}
  etc.
```

---

## 4. Flujos de Usuario (User Flows)

### 4.1 Flujo: Nuevo Usuario Registrarse y Crear Primer Costeo

```
1. Login → Clic "Regístrate"
   ↓
2. Pantalla Registro → Llenar formulario
   ↓
3. Clic "Crear Cuenta"
   ↓
4. Verificar email (6 dígitos)
   ↓
5. Login automático → Dashboard (vacío)
   ↓
6. Clic "Nuevo Costeo" o link onboarding
   ↓
7. Simulador (primer costeo)
   ↓
8. Clic "Guardar Costeo"
   ↓
9. Modal: Crear tienda (nombre, logo, país)
   ↓
10. Guardar → Costeo registrado → Dashboard actualizado
```

### 4.2 Flujo: Comparar dos Costeos

```
1. Dashboard → Mis Costeos
   ↓
2. Búsqueda/filtro productos
   ↓
3. Clic en costeo 1 → Ver detalles
   ↓
4. Clic "Comparar con otro"
   ↓
5. Selector: Elige costeo 2
   ↓
6. Vista comparativa (lado a lado)
   - Parámetros entrada
   - Resultados
   - Diferencias destacadas
   ↓
7. Exportar comparativa (PDF)
```

### 4.3 Flujo: Conectar Meta Ads

```
1. Configuración → Tiendas → Gestionar
   ↓
2. Pestaña Integraciones
   ↓
3. Clic "Conectar" en Meta Ads
   ↓
4. Modal: OAuth2 flow → Redirige a Meta
   ↓
5. Usuario autoriza en Meta
   ↓
6. Vuelve a app: "Integración conectada"
   ↓
7. Dashboard: Datos Meta comienzan a sincronizarse
   ↓
8. Notificación: "Sincronización completada"
```

### 4.4 Flujo: Cambiar Plan (Cliente)

```
1. Configuración → Membresía
   ↓
2. Ver planes disponibles
   ↓
3. Clic "Cambiar a Pro"
   ↓
4. Confirmación con prorrateo
   ↓
5. Seleccionar método de pago
   ↓
6. Procesar pago (webhook pasarela)
   ↓
7. Confirmación: "Bienvenido a Pro"
   ↓
8. Email de factura/recibo
```

---

## 5. Responsive Design

### 5.1 Breakpoints

```css
Mobile: 0px - 640px (esencial)
Tablet: 641px - 1024px
Desktop: 1025px - 1600px
Wide: 1601px+ (opcional)
```

### 5.2 Estrategia por Viewport

| Elemento | Mobile | Tablet | Desktop |
|----------|--------|--------|---------|
| Sidebar | Colapsado (hamburger) | Colapsado | Visible |
| Tablas | Cards apiladas / scroll horizontal | Scroll horizontal | Tabla normal |
| Grids | 1 columna | 2 columnas | 3+ columnas |
| Modales | Full screen | 90% width | 70% width |
| Fuente | 14px body | 14px body | 16px body |
| Padding | 16px | 20px | 32px |

### 5.3 Mobile Navigation

```
Hamburger menu (icono ≡)
  ↓
Overlay navigation panel (slide-in izquierda)
  - Nav items vertical
  - Logo
  - Selector tienda
  - Avatar usuario

Bottom tab bar (alternativa):
  Dashboard | Simulador | Análisis | Config
```

---

## 6. Dark Mode

### 6.1 Implementación

CSS variables approach:
```css
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F3F4F6;
  --text-primary: #1F2937;
  --border-color: #E5E7EB;
}

[data-theme="dark"] {
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --text-primary: #F1F5F9;
  --border-color: #334155;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
}
```

### 6.2 Toggle Ubicación
- Header derecha (próximo a notificaciones)
- Ícono: sol/luna
- LocalStorage persistence

---

## 7. Animaciones y Microinteracciones

### 7.1 Transiciones Estándar
```
- Botones: 150ms ease-out
- Cards hover: 300ms cubic-bezier
- Modal entrada: 300ms ease-out (fade + scale 95%)
- Toast entrada: 200ms ease-out
```

### 7.2 Loading States
```
Spinner animado (rotación)
Skeleton loaders (en lugar de spinner)
Progress bar en long operations
```

### 7.3 Validación en Tiempo Real
```
Input email:
  Escribir → validación instantánea
  ✓ Verde si válido
  ✗ Rojo si inválido
  Tooltip hint
```

---

## 8. Accesibilidad (WCAG 2.1 AA)

### 8.1 Requerimientos
- Contraste mínimo 4.5:1 (texto normal)
- Contraste 3:1 (elementos grandes)
- Focus indicators visibles
- Aria labels en iconos
- Keyboard navigation (Tab)
- Alt text en imágenes

### 8.2 Implementación

```html
<!-- Input con label asociado -->
<label for="email">Email</label>
<input id="email" type="email" aria-required="true">

<!-- Botón con aria-label -->
<button aria-label="Cerrar modal">×</button>

<!-- Ícono decorativo -->
<span aria-hidden="true">🔒</span>

<!-- Skip link (primera opción tab) -->
<a href="#main" class="sr-only">Ir al contenido principal</a>
```

---

## 9. Iconografía

### 9.1 Librería de Iconos
Usar: **Heroicons** (Tailwind UI - gratuito)

Iconos a usar:
- Navigation: home, settings, menu, x, chevron
- Actions: plus, trash, edit, download, upload, copy
- Status: check, x, alert, info, question
- Business: chart-bar, pie-chart, trending-up, trending-down
- Communication: mail, bell, phone
- Objects: map-pin, truck, clock, calendar
- Users: user-circle, users
- Media: image, file, document-text

---

## 10. Prototipado (Figma Specs)

### 10.1 Estructura Figma
```
Proyecto: DropCost Master

Archivos:
  01-Design-System
    - Colors
    - Typography
    - Components
    - Shadows
    - Icons
    
  02-Screens-Auth
    - Login
    - Registro
    - Verificar Email
    - 2FA
    - Recuperar Contraseña
    
  03-Screens-App
    - Dashboard
    - Simulador
    - Análisis Regional
    - Configuración
    
  04-Screens-Admin
    - Usuarios
    - Planes
    - Códigos Promo
    - Integraciones
    
  05-Components
    - Buttons
    - Inputs
    - Cards
    - Tables
    - Modals
    - Alerts
```

### 10.2 Workflow Diseño → Desarrollo

1. Diseñador crea en Figma
2. Share link público
3. Developer inspecta (mide, colores, espaciados)
4. Dev implementa con Tailwind CSS
5. Revisar vs Figma
6. Ajustes finales

---

## 11. Guía de Estilos de Código

### 11.1 Componentes React (Naming)

```
├── Button.tsx
├── Card.tsx
├── Input.tsx
├── Modal.tsx
├── Table.tsx
├── Toast.tsx
└── ...
```

Estructura:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  ...props
}) => {
  // Component
};
```

### 11.2 Tailwind CSS Classes

```
Estructura:
  [responsive]:[state]:property-value
  
Ejemplos:
  md:grid-cols-2       → grid 2 columnas en tablet+
  hover:bg-blue-600   → fondo azul al hover
  dark:bg-slate-900   → fondo oscuro en dark mode
  disabled:opacity-50 → opacidad 50% cuando disabled
```

---

## 12. Checklist de Entrega Diseño

- [ ] Paleta de colores definida
- [ ] Tipografía completa
- [ ] Componentes base (botones, inputs, cards)
- [ ] 10+ pantallas mockup
- [ ] Flujos de usuario documentados
- [ ] Responsive layouts
- [ ] Dark mode
- [ ] Design system en Figma
- [ ] Especificaciones de componentes (spacing, colors)
- [ ] Guía de marca (logo, usage)
- [ ] Accesibilidad validada
- [ ] Handoff a desarrollo (Figma specs)

---

**Fin del Documento de Diseño UI/UX**

Este documento debe ser revisado en **Figma** para prototipado interactivo antes de pasar al desarrollo.
