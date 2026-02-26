# RF - LANDING PAGE DROPCOST MASTER
## Especificación Completa: Página de Ventas Profesional y Moderna

**Versión:** 1.0  
**Estado:** Listos para desarrollo  
**Base:** Propuesta Antigravity + mejoras de conversión  
**Objetivo:** Convertir dropshippers en usuarios pagos ($10-$40 USD/mes)

---

## 1. ESTRUCTURA GENERAL (SCROLL COMPLETO)

```
1. NAVBAR
   ↓
2. HERO SECTION
   ↓
3. DESCRIPCIÓN TAGLINE
   ↓
4. 6 FEATURE CARDS (Grid 3x2)
   ↓
5. SECCIÓN INTERACTIVA: "COSTEO EN EXCEL vs DROPCOST"
   ↓
6. CASOS DE USO / TESTIMONIOS (Carousel)
   ↓
7. COMPARATIVA: DropCost vs Competencia
   ↓
8. SECCIÓN PRICING (3 planes)
   ↓
9. FAQ (Acordeón)
   ↓
10. CTA FINAL
   ↓
11. FOOTER
```

---

## 2. NAVBAR (Sticky)

```
Layout: Flexbox, altura 64px, fondo dark (#0A0E27 o similar)

IZQUIERDA:
┌────────────────┐
│ 📊 DropCost    │
│    Master      │
└────────────────┘

CENTRO (Desktop solo):
├─ Funcionalidades (link a #features)
├─ Precios (link a #pricing)
└─ Blog (link /blog)

DERECHA:
├─ Iniciar Sesión (link /login) - texto azul
└─ Ver Planes (botón primary azul, link /register → /pricing)

MOBILE:
└─ Hamburger menu (collapsa centro a vertical)

Comportamiento:
- Sticky en top al scroll
- Sombra sutil al hacer scroll
- Logo clickeable → home
```

---

## 3. HERO SECTION (Full height o 600px)

```
LAYOUT: 2 columnas (50/50) Desktop | 1 columna Mobile

┌──────────────────────────────────────────────────────────┐
│                                                          │
│ IZQUIERDA (Texto):                                       │
│                                                          │
│ Badge: "⚡ Especial para Dropshipping COD"              │
│ (Fondo: gris oscuro, texto: blanco, border radius: 20px)
│                                                          │
│ H1: "Vende más, gana de verdad."                        │
│ (Blanco, 48-56px, bold, line-height 1.2)              │
│                                                          │
│ P: "La calculadora definitiva que considera CPA,        │
│    fletes y las devoluciones para que nunca pierds      │
│    plata en tus operaciones."                           │
│ (Gris claro, 16-18px, line-height 1.6)                │
│                                                          │
│ STATS (Abajo del párrafo):                              │
│ 📊 2,500+ dropshippers activos                          │
│ 💰 $5M+ en comisiones pagadas                           │
│ 🌎 Latam dominada                                       │
│                                                          │
│ BOTONES:                                                 │
│ [PRIMARY] "Ver Planes y Precios" (→ #pricing)          │
│ [SECONDARY] "Describir Funciones" (→ #features)        │
│ (Gap: 12px, stacked en mobile)                         │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ DERECHA (Visual):                                        │
│                                                          │
│ Screenshot/Mockup del Dashboard                         │
│ - Vista del Simulador en acción                         │
│ - Colores reales de DropCost                            │
│ - Responsive: muestra desktop en desktop,              │
│   mobile en mobile                                      │
│ - Efecto: Elevación (shadow), rotación sutil (3deg)    │
│                                                          │
│ ALTERNATIVA: Video 10 seg                               │
│ - Usuario creando costeo                                │
│ - Mostrando resultado en dashboard                      │
│ - Autoplay muted, loop                                  │
└──────────────────────────────────────────────────────────┘

Fondo: Dark gradient (#0A0E27 → #1A1F3A)
Padding: 80px vertical, 40px horizontal
```

---

## 4. DESCRIPCIÓN TAGLINE (Sección pequeña)

```
Fondo: Claro (#F9FAFB)
Align: Center
Padding: 60px

TEXT:
"Diseñado por dropshippers, para dropshippers.
Sin complicaciones. Sin fórmulas ocultas. Solo números reales."

Subtexto:
"Usado en Colombia, México, Argentina y más."
(Con banderas pequeñas: 🇨🇴 🇲🇽 🇦🇷 y más)
```

---

## 5. FEATURE CARDS (Grid 3x2)

```
Basado en propuesta Antigravity. Mismo layout.
Pero agregamos: Click → Expande descripción adicional

CARDS:

1️⃣ SIMULADOR DE COSTEO ROI
   Icon: 📊
   "Calcula tu margen real descuentando CPA,
    fletes y ese % de devoluciones que siempre te afecta."
   
   [Click] Expande:
   "Metodología: (Costo + Flete + CPA + Margen) / (1 - %Dev)
    Resultado: Precio exacto de venta.
    Precisión: ±2 decimales (estándar bancario)
    Formatos: USD, COP, MXN, ARS, etc."

2️⃣ BUNDLES DE VOLUMEN
   Icon: 📦
   "Escala tu ticket promedio creando ofertas de cambio
    inteligentes (paga 2 lleva 3, etc.) calculadas automáticamente."
   
   [Click] Expande:
   "Crea combos sin ser matemático.
    DropCost mantiene automáticamente el margen que quieres.
    Ejemplo: Vende 3 productos por $45, margen 25% garantizado."

3️⃣ DESCUENTOS ESTRATÉGICOS
   Icon: 📈
   "Sabe exactamente cuánto descuento puedes dar sin
    comprometer tu utilidad neta por venta."
   
   [Click] Expande:
   "Ingresa: Precio actual, descuento deseado.
    DropCost muestra: Nuevo margen, utilidad neta, ROI.
    Decides: ¿Es viable o no?"

4️⃣ OBSEQUIOS QUE CONVIERTEN
   Icon: 🎁
   "Añade regalos 'invisibles' a tu oferta calculando el impacto
    del costo del regalo en tu ROI."
   
   [Click] Expande:
   "Estrategia: Regala USB $2, cuesta $0.50.
    DropCost calcula: Sigue siendo rentable con este regalo.
    Conversión: +15% típicamente."

5️⃣ DASHBOARD DE KPIs
   Icon: 📊
   "Visualiza ROAS real y utilidad neta sin hojas de Excel.
    Sincronizado en tiempo real de tus tiendas."
   
   [Click] Expande:
   "Ve: ROAS por tienda, utilidad neta, costeo promedio,
    conversión rate, valor promedio por orden.
    Datos actualizados cada 5 minutos."

6️⃣ SEGUIMIENTO DE AFILIADOS
   Icon: 🤝
   "Gana comisiones invitando a otros dropshippers.
    Sistema brutal: cookies persistentes por 90 días."
   
   [Click] Expande:
   "Comparte código: dropcost.jariash.com/?ref=TU_CODIGO
    MP recuerda por 90 días (incluso si cierran pestaña).
    Tú ganas 15% comisión recurrente.
    Si referido upgrade → tu comisión sube también."

Layout:
- Desktop: 3 columnas, gap 24px
- Tablet: 2 columnas, gap 20px
- Mobile: 1 columna, gap 16px
- Padding: 80px vertical, 40px horizontal
- Fondo: Blanco

Card styling:
- Fondo: #F9FAFB (gris muy claro)
- Border: 1px #E5E7EB
- Border-radius: 12px
- Padding: 24px
- Hover: Elevación (shadow), border → color primary
- Cursor: Pointer (indica interactividad)
```

---

## 6. SECCIÓN INTERACTIVA: "COSTEO EN EXCEL vs DROPCOST"

**ESTE ES EL KILLER - Muestra el valor real**

```
Fondo: Degradado azul claro (#E6F0FF → #F0F9FF)
Padding: 100px vertical
Title: "Excel vs DropCost: Compara el proceso"
Subtitle: "La diferencia que cambia tu rentabilidad"

LAYOUT: 2 COLUMNAS (Desktop) | Apiladas (Mobile)

┌─ COLUMNA 1: EXCEL ────────────────────┐
│                                        │
│ TÍTULO: "Con Excel (el proceso actual)│
│          de la mayoría)"               │
│                                        │
│ PASO 1:                                │
│ ┌──────────────────────────────────┐  │
│ │ Abres Excel                      │  │
│ │ Copias fórmula vieja             │  │
│ │ "=(A1+B1)*C1"                    │  │
│ │                                  │  │
│ │ ⏱️ Tiempo: 2 minutos             │  │
│ │ ❌ Olvidas devoluciones          │  │
│ └──────────────────────────────────┘  │
│                                        │
│ PASO 2:                                │
│ ┌──────────────────────────────────┐  │
│ │ Ingresas costo: $5               │  │
│ │ Flete: $2                        │  │
│ │ CPA: $1.50                       │  │
│ │                                  │  │
│ │ Resultado: $8.50 precio venta   │  │
│ │                                  │  │
│ │ ❌ "Parece bien"                │  │
│ └──────────────────────────────────┘  │
│                                        │
│ PASO 3:                                │
│ ┌──────────────────────────────────┐  │
│ │ Vendes 100 unidades a $8.50      │  │
│ │ Total: $850                      │  │
│ │                                  │  │
│ │ Al final del mes:                │  │
│ │ • 20% devuelto (20 unidades)     │  │
│ │ • Flete a devolver: $40          │  │
│ │ • Pérdida: $170 + fletes         │  │
│ │                                  │  │
│ │ ❌ REALIDAD: Ganaste solo $680  │  │
│ │    (no $850)                     │  │
│ └──────────────────────────────────┘  │
│                                        │
│ CONCLUSIÓN:                            │
│ "No sabías que ibas a perder $170     │
│  en fletes de devoluciones."          │
│                                        │
└────────────────────────────────────────┘

┌─ COLUMNA 2: DROPCOST ──────────────────┐
│                                         │
│ TÍTULO: "Con DropCost (el proceso      │
│          inteligente)"                 │
│                                         │
│ PASO 1:                                 │
│ ┌───────────────────────────────────┐  │
│ │ Abres DropCost                    │  │
│ │ Ingresas costo: $5                │  │
│ │ Flete: $2                         │  │
│ │ CPA: $1.50                        │  │
│ │ Margen deseado: 25%               │  │
│ │ % Devoluciones: 20%               │  │
│ │                                   │  │
│ │ ⏱️ Tiempo: 30 segundos            │  │
│ │ ✅ Todo calculado                │  │
│ └───────────────────────────────────┘  │
│                                         │
│ PASO 2:                                 │
│ ┌───────────────────────────────────┐  │
│ │ DropCost calcula automáticamente  │  │
│ │                                   │  │
│ │ Fórmula: (5+2+1.5+1.75)/(1-0.20) │  │
│ │ = $14.06 precio venta             │  │
│ │                                   │  │
│ │ ✅ YA FACTORIZA DEVOLUCIONES     │  │
│ │ ✅ Margen GARANTIZADO 25%        │  │
│ └───────────────────────────────────┘  │
│                                         │
│ PASO 3:                                 │
│ ┌───────────────────────────────────┐  │
│ │ Vendes 100 unidades a $14.06      │  │
│ │ Total: $1,406                     │  │
│ │                                   │  │
│ │ Al final del mes:                 │  │
│ │ • 20% devuelto (20 unidades)      │  │
│ │ • Aun así: Ganas $1,050          │  │
│ │ • Margen real: 25% ✅            │  │
│ │                                   │  │
│ │ ✅ REALIDAD: Ganaste lo esperado │  │
│ │ (SIN sorpresas)                   │  │
│ └───────────────────────────────────┘  │
│                                         │
│ CONCLUSIÓN:                             │
│ "Sabías exactamente cuánto ibas a      │
│  ganar. Cero sorpresas. Cero pérdidas │  
│  inesperadas."                         │
│                                         │
└─────────────────────────────────────────┘

ABAJO (Comparativa rápida):

┌────────────────────────────────────────┐
│ DIFERENCIA EN NÚMEROS:                 │
│                                        │
│ EXCEL:     Ganancia: $680 (mal)       │
│ DROPCOST:  Ganancia: $1,050 (bien)    │
│                                        │
│ DIFERENCIA: +$370 por 100 unidades    │
│ ESCALA:     ×1,000 unidades/mes       │
│             = +$3,700/mes EXTRA       │
│                                        │
│ ANUAL: +$44,400 solo por calcular bien
│                                        │
│ 🎯 Eso es lo que DropCost te devuelve │
│    en el primer año.                  │
└────────────────────────────────────────┘

BOTÓN CTA:
"Prueba el Calculador Ahora" 
→ Lleva a herramienta interactiva en /calculador
(sin login, solo para ver)
```

---

## 7. CASOS DE USO / TESTIMONIOS (Carousel)

```
Fondo: Blanco
Padding: 80px vertical

TITLE: "Casos reales de dropshippers que escalaron"

Layout: Carousel (5 testimonios, scroll horizontal)

CARD 1:
┌─────────────────────────────────┐
│ "Venía vendiendo $5k/mes sin    │
│  saber si era rentable.         │
│  Con DropCost vi que estaba     │
│  perdiendo dinero en fletes     │
│  de devoluciones.              │
│  Ahora vendo $8k/mes con       │
│  margen limpio.               │
│  +$3k/mes extra."             │
│                              │
│ — Juan García                │
│   Dropshipper COD, Colombia  │
│   📊 1 tienda, 500 produtos │
└─────────────────────────────────┘

CARD 2:
┌─────────────────────────────────┐
│ "Tengo 5 tiendas de nichos     │
│  diferentes. DropCost me       │
│  muestra cuál es más rentable  │
│  en un dashboard único.        │
│  Cerré 2 tiendas sin utilidad  │
│  y escalé las 3 buenas.       │
│  Ahora crezco inteligente."   │
│                              │
│ — María López                │
│   Operadora Multi-Tienda,    │
│   México                      │
│   📊 5 tiendas, 1,500 productos
└─────────────────────────────────┘

CARD 3:
┌─────────────────────────────────┐
│ "Uso el sistema de referidos.  │
│  Invité 50 amigos              │
│  dropshippers en mi comunidad. │
│  Ya llevo $3k/mes en           │
│  comisiones sin hacer nada.   │
│  Es un ingreso pasivo de verdad
│"                              │
│                              │
│ — Carlos Mendez              │
│   Operador + Afiliado,       │
│   Argentina                   │
│   📊 2 tiendas + 50 referidos│
└─────────────────────────────────┘

CARD 4:
┌─────────────────────────────────┐
│ "Lo que más me gusta es que     │
│  DropCost entiende nuestro     │
│  contexto (COD, devoluciones,  │
│  fletes regionales).           │
│  No es herramienta genérica.   │
│  Es de verdad para             │
│  dropshippers latinos."        │
│                              │
│ — Sophia Rodríguez           │
│   Principiante, Chile        │
│   📊 1 tienda, 100 productos │
└─────────────────────────────────┘

CARD 5:
┌─────────────────────────────────┐
│ "La función de bundles me      │
│  salvó. Creé 'Paga 2 Lleva 3' │
│  automáticamente optimizado.  │
│  Conversion subió 40%.         │
│  Ticket promedio: +35%.        │
│  Todo sin perder margen."      │
│                              │
│ — Pedro Sánchez              │
│   E-commerce Scaling,        │
│   Perú                        │
│   📊 3 tiendas, 2,000 unidades
└─────────────────────────────────┘

Interactividad:
- Auto-scroll cada 5 seg (mobile), manual en desktop
- Dots navegación abajo
- Flecha anterior/siguiente
- Responsive: 1 card mobile, 2 tablets, 3 desktop
```

---

## 8. COMPARATIVA: DropCost vs Competencia

```
Fondo: Gris claro (#F9FAFB)
Padding: 80px vertical

TITLE: "¿Cómo DropCost se compara?"
SUBTITLE: "La única hecha para Latam + devoluciones"

TABLA RESPONSIVE (Colapsible en mobile):

┌────────────────┬─────┬──────┬──────────┬──────────────┐
│ Característica │ E..│ C... │ S..      │ DropCost ✅  │
├────────────────┼─────┼──────┼──────────┼──────────────┤
│ Cálculo auto   │ ❌  │ ✅   │ ✅       │ ✅ Instant  │
│ Factoriza dev. │ ❌  │ ❌   │ ❌       │ ✅ Core    │
│ Fletes región  │ ❌  │ ❌   │ ✅       │ ✅ +15 país│
│ Ofertas intelig│ ❌  │ ❌   │ ❌       │ ✅ Auto    │
│ Multi-tienda   │ ❌  │ ✅   │ ✅       │ ✅ Ilimitad│
│ Dashboard RT   │ ❌  │ ✅   │ ✅       │ ✅ Real    │
│ Sistema ref.   │ ❌  │ ❌   │ ❌       │ ✅ 90 días │
│ 2FA+Auditoría  │ ❌  │ ✅   │ ✅       │ ✅ Full   │
│ Soporte Latam  │ ❌  │ ❌   │ ❌       │ ✅ Nativos│
│ Precio         │ $0  │ $0   │ $20/mes  │ $10/mes    │
└────────────────┴─────┴──────┴──────────┴──────────────┘

NOTA ABAJO:
"Excel = Manual, error humano
Google Sheets = Genérico, sin devoluciones
Calculadora Competitors = Caro, no local
DropCost = Específico para COD Latam"

Diferenciador clave resaltado:
"ÚNICA herramienta que factoriza
devoluciones en el costeo."
```

---

## 9. SECCIÓN PRICING (3 Planes)

```
Fondo: Blanco
Padding: 100px vertical

TITLE: "Planes que crecen contigo"
SUBTITLE: "Comienza por $10 USD. Escala cuando necesites."

LAYOUT: 3 columnas (Desktop) | 1 columna con scroll (Mobile)

┌─ CARD STARTER ────────────────────┐
│                                    │
│ STARTER                            │
│ $10 USD / mes                      │
│ "Para comenzar"                    │
│                                    │
│ ✅ 1 tienda                        │
│ ✅ 100 costeos                     │
│ ✅ 100 ofertas                     │
│ ✅ Dashboard básico                │
│ ✅ Duplicar costeos                │
│ ❌ Billetera (no)                  │
│ ❌ Referidos (no)                  │
│ ❌ Eliminar costeos (no)           │
│ ❌ Historial (no)                  │
│                                    │
│ [Botón: "Escoger Plan"]           │
│ → /register?plan=starter           │
│                                    │
└────────────────────────────────────┘

┌─ CARD PRO ────────────────────────┐
│ ⭐ POPULAR / MÁS ELEGIDO          │
│                                    │
│ PRO                                │
│ $25 USD / mes                      │
│ "Para escalar operaciones"         │
│                                    │
│ ✅ 5 tiendas                       │
│ ✅ 250 costeos                     │
│ ✅ 250 ofertas                     │
│ ✅ Dashboard avanzado              │
│ ✅ Duplicar costeos                │
│ ✅ Billetera & Retiros             │
│ ✅ Sistema de Referidos            │
│ ✅ Historial (90 días)             │
│ ❌ Eliminar costeos (no)           │
│ ❌ Comisión Nivel 2 (no)           │
│                                    │
│ [Botón: "Escoger Plan"]           │
│ → /register?plan=pro               │
│ (Destaca con color + sombra)       │
│                                    │
│ Etiqueta abajo: "Pruébalo 1 mes"  │
└────────────────────────────────────┘

┌─ CARD ENTERPRISE ──────────────────┐
│                                    │
│ ENTERPRISE                         │
│ $40 USD / mes                      │
│ "Para operaciones grandes"         │
│                                    │
│ ✅ Tiendas ILIMITADAS              │
│ ✅ Costeos ILIMITADOS              │
│ ✅ Ofertas ILIMITADAS              │
│ ✅ Dashboard máximo                │
│ ✅ Duplicar costeos                │
│ ✅ Billetera & Retiros             │
│ ✅ Sistema de Referidos            │
│ ✅ Historial completo              │
│ ✅ Eliminar costeos ✅            │
│ ✅ Comisión Nivel 2 ✅            │
│ ✅ Soporte prioritario             │
│                                    │
│ [Botón: "Escoger Plan"]           │
│ → /register?plan=enterprise        │
│                                    │
│ Nota: "Contacta para custom"      │
└────────────────────────────────────┘

NOTA ABAJO DE CARDS:
"✅ Sin tarjeta requerida para registrarse
 ✅ Cambio de plan en cualquier momento
 ✅ Cancelación sin penalidad
 ✅ Facturación mensual automática"

CTAs importantes:
- Al hacer clic "Escoger Plan" → /register?plan=XXX
- Si está logueado → va a /checkout directo
- Si NO está logueado → va a /register primero
```

---

## 10. FAQ (Acordeón)

```
Fondo: Blanco
Padding: 80px vertical

TITLE: "Preguntas Frecuentes"

12 preguntas importantes:

1️⃣ ¿Qué es DropCost Master?
   "Es la calculadora inteligente para dropshippers que venden 
    en serio. Calcula tu precio de venta real considerando 
    devoluciones, fletes y CPA."

2️⃣ ¿Cómo hago para comenzar?
   "Haces clic en 'Escoger Plan', te registras con email,
    pagas $10 USD (o más), y accedes automáticamente."

3️⃣ ¿Cuál plan me recomiendan?
   "Si comienzas: STARTER ($10/mes).
    Si escalas: PRO ($25/mes) ← 90% usan este.
    Si operación grande: ENTERPRISE ($40/mes)."

4️⃣ ¿Cómo funciona el sistema de referidos?
   "Compartes tu código. Cuando alguien se registra,
    ganas 15% comisión por 90 días (o más si renuevan).
    Sistema de cookies persistentes de 90 días."

5️⃣ ¿Puedo cambiar de plan después?
   "Sí. Cuando quieras, en Configuración → Plan.
    Pagado a prorrateo. Sin penalización."

6️⃣ ¿Cómo calcula DropCost mi precio de venta?
   "Fórmula: (Costo + Flete + CPA + Margen) / (1 - % Devol)
    Ejemplo: (5 + 2 + 1 + 1.25) / (1 - 0.20) = $12.81
    Resultado = Precio exacto de venta con margen garantizado."

7️⃣ ¿Es seguro mi información?
   "Sí. Usamos AES-256 encryption, 2FA obligatorio,
    auditoría completa y compliance GDPR/CCPA."

8️⃣ ¿Puedo tener varias tiendas?
   "Sí. STARTER: 1 tienda. PRO: 5. ENTERPRISE: Ilimitadas.
    Cada tienda es independiente en DropCost."

9️⃣ ¿Hay período de prueba gratis?
   "No. Pero STARTER es $10/mes (muy bajo) y puedes 
    probar todas las funcionalidades. Si no te gusta, cancelas."

🔟 ¿Cómo retiro mis comisiones?
   "Tienes Billetera en PRO + ENTERPRISE.
    Acumulas comisiones, solicitas retiro,
    se transfiere a tu cuenta bancaria en 1-3 días."

1️⃣1️⃣ ¿Funciona en mobile?
   "100% responsive. Úsalo en celular, tablet o desktop
    sin problema. Mismo acceso, mismas funciones."

1️⃣2️⃣ ¿Qué pasa si no puedo costear todos mis productos?
   "STARTER: 100 costeos máximo. Si necesitas más,
    hay botón 'Duplicar' para copiar costeos rápido.
    O upgradea a PRO (250 costeos)."

Estilo:
- Acordeón: Click expande respuesta
- Fondo respuesta: Gris muy claro (#F9FAFB)
- Icono: + (se convierte en - al expandir)
- Animación: Smooth expand/collapse (0.3s)
- Mobile: Full width, tap para abrir
```

---

## 11. CTA FINAL (Before Footer)

```
Fondo: Gradiente azul primario (#0066FF → #0052CC)
Color texto: Blanco
Padding: 80px vertical
Border radius: 20px
Margin: 40px horizontal

CONTENIDO:
┌────────────────────────────────────────┐
│ ¿LISTO PARA TOMAR CONTROL DE TUS       │
│ NÚMEROS?                               │
│                                        │
│ Únete a 2,500+ dropshippers que ya     │
│ venden con precisión.                  │
│                                        │
│ [BOTÓN BLANCO] "Ver Planes y Empezar"  │
│ → /register (flujo: plan → email → pago)
│                                        │
│ Sin tarjeta requerida para la prueba   │
│ (El plan comienza una vez pagues)      │
└────────────────────────────────────────┘
```

---

## 12. FOOTER

```
Fondo: Dark (#0A0E27)
Padding: 60px vertical

LAYOUT: 4 columnas Desktop | 2 columnas Tablet | 1 Mobile

COLUMNA 1: PRODUCTO
├─ Simulador
├─ Planes
├─ Calculadora (herramienta abierta)
└─ Blog (próximamente)

COLUMNA 2: RECURSOS
├─ Documentación
├─ Tutoriales en Video
├─ Guías de Costeo
└─ Community (Slack/Discord)

COLUMNA 3: EMPRESA
├─ Acerca de DropCost
├─ Contacto
├─ Careers (próximamente)
└─ Partners

COLUMNA 4: LEGAL
├─ Términos de Servicio
├─ Política de Privacidad
├─ Política de Cookies
└─ Status Página

ABAJO (Bottom footer):
"© 2025 DropCost Master. Made by Dropshippers for Dropshippers.
 Soportado en Colombia 🇨🇴, México 🇲🇽, Argentina 🇦🇷, Chile 🇨🇱, Perú 🇵🇪"

Social links (opcional):
Instagram, Twitter, LinkedIn
```

---

## 13. COMPORTAMIENTOS INTERACTIVOS

```
✅ Hover en botones primarios:
   - Fondo: Color más oscuro (#0052CC)
   - Elevación: Shadow
   - Transición: 0.2s ease

✅ Hover en cards (features):
   - Elevación: +8px shadow
   - Border: 1px color primary
   - Transición: 0.3s ease
   - Cursor: Pointer

✅ Scroll suave entre secciones:
   - Links internos: Smooth scroll
   - Duración: 0.8s

✅ Sección Excel vs DropCost:
   - Click en paso 1 Excel → Se expande
   - Lado opuesto (DropCost) → Destaca
   - Números finales → Animación de entrada

✅ Carousel testimonios:
   - Auto-avance cada 5 seg
   - Pausa en hover
   - Navegación: dots + arrows

✅ Acordeón FAQ:
   - Click abre/cierra suave
   - Icon rota 180deg
   - Una sola expandida a la vez (opcional)

✅ Mobile Menu:
   - Hamburger icon en navbar
   - Menu desliza desde izquierda
   - Clickable overlay para cerrar
```

---

## 14. FLUJO DE CONVERSIÓN

```
LANDING PAGE
    ↓
Usuario ve "Ver Planes y Precios"
    ↓
Click CTA → Scroll a #pricing (smooth)
    ↓
Ve 3 planes con botón "Escoger Plan"
    ↓
Click "Escoger Plan" 
    ↓
SI está logueado:
├─ → /checkout?plan=XXX
├─ Ingresa datos de pago
└─ Click Pagar → Plan activado ✅

SI NO está logueado:
├─ → /register?plan=XXX
├─ Completa: Email + Password + País
├─ Verificación email (1 min)
├─ → /checkout?plan=XXX
├─ Selecciona método pago (Stripe / Mercado Pago)
├─ Confirma pago
└─ → Dashboard activado ✅

DESPUÉS:
Dashboard → Tutorial rápido → Crear primera tienda
```

---

## 15. CHECKLIST TÉCNICO

```
✅ Responsive: Desktop (1440px), Tablet (768px), Mobile (375px)
✅ Dark mode compatible
✅ Colores CSS variables (no hardcoded)
✅ Tipografía: Inter (400, 500, 600, 700)
✅ Espaciado: Escala 8px
✅ Performance: <3s load, <2.5s Largest Contentful Paint
✅ SEO: Meta tags, Schema markup, Open Graph
✅ Accesibilidad: WCAG 2.1 AA (colores, contrast, keyboard)
✅ Analytics: Google Analytics + Hotjar (optional)
✅ A/B Testing: Ready para tests en CTAs
✅ Mobile: Hamburger menu, touch-friendly buttons (48px min)
✅ Video: Autoplay muted, lazy loading
✅ Imágenes: Optimizadas, webp + fallback
✅ Forms: Validación frontend + backend
✅ Rate Limit: Protección contra bots en signup
```

---

## 16. COPY/COPYWRITING FINAL

```
HEADLINE (Hero):
"Vende más, gana de verdad."

SUBHEADLINE (Hero):
"La calculadora definitiva que considera CPA, fletes 
y las devoluciones para que nunca pierds plata 
en tus operaciones."

BADGE (Hero):
"⚡ Especial para Dropshipping COD"

TAGLINE:
"Diseñado por dropshippers, para dropshippers.
Sin complicaciones. Sin fórmulas ocultas. 
Solo números reales."

CTA FINAL:
"¿Listo para tomar control de tus números?"

PRECIO TAGLINE:
"Comienza por $10 USD. Escala cuando necesites."

TRUST:
"2,500+ dropshippers activos | $5M+ comisiones pagadas | Soporte Latam"
```

---

## 17. ARCHIVOS ENTREGABLES

```
Para desarrollo:

📁 /landing
├── index.html (estructura base)
├── styles.css (variables, responsive, dark mode)
├── script.js (interactividad: scroll, carousel, acordeón)
├── /img
│   ├── logo.svg
│   ├── hero-mockup.webp
│   ├── hero-video.mp4
│   ├── feature-icons.svg
│   └── testimonial-avatars.webp
└── /pages
    ├── calculador.html (herramienta abierta)
    └── blog-placeholder.html

Integración Backend:
├── /register → Signup flow
├── /login → Login
├── /checkout → Mercado Pago integration
└── /api/webhook → Pago confirmado
```

---

## 18. TIMELINE ESTIMADO

```
Fase 1 (Estructura base):
- Navbar + Hero + Features = 3-4 días

Fase 2 (Secciones complejas):
- Excel vs DropCost (interactivo) = 2-3 días
- Testimonios carousel = 1 día
- Pricing section = 1 día
- FAQ acordeón = 1 día

Fase 3 (Pulido):
- Optimización, responsivo, testing = 2-3 días
- Analytics, SEO, A/B setup = 1 día

TOTAL: 10-15 días de desarrollo
(Asumiendo 1 developer full-time)
```

---

**STATUS:** Listo para que Antigravity o tu developer comience.

¿Hay algo que quieras aclarar o cambiar antes de iniciar?

