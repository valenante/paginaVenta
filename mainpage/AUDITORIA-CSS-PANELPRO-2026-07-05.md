Verificación completada: todos los file:line del catálogo son reales (confirmados por grep). Correcciones menores de numeración detectadas: en `Finanzas.css` el `color:#c084fc` del título de cortesías está en la **l.700** (no 701) y `.fin-cortesias-icon` abre en la **l.690** (no 691); en `TabResumen.jsx` el `📦` de "Coste ventas" está en la **l.53** (no 52). Incorporo esas correcciones. Entrego el documento a continuación.

---

# Rehacer Finanzas / Automatizaciones / Aprendizaje IA — que dejen de desentonar

**Repo:** `/home/valenante/Desktop/pagina-venta/pagina/mainpage/`
**Alcance:** solo estas 3 secciones del PanelPro. Investigación read-only, nada editado.

---

## 1. El canon en 6 líneas

1. El panel **NO es claro**: es un **dashboard oscuro con glassmorphism** (fondos `rgba(255,255,255,.03–.09)` sobre radial oscuro, texto slate/blanco) y **un solo acento: CELESTE**.
2. El sistema vive en `src/styles/dashboard-common.css` (tokens `--dash-*`, con `--dash-accent-1 = #2f7ed8` y `--dash-accent-2 = #60b5ff`) apoyado en la marca de `src/index.css` (`--color-primario #60b5ff` / `--color-primario-oscuro #2f7ed8`).
3. Los gradientes son legítimos **si son celestes**: `linear-gradient(135deg, var(--dash-accent-1), var(--dash-accent-2))`. El problema NUNCA es el gradiente, es el **color morado**.
4. **Estilos por CLASE, no inline.** Solo se tolera inline para valores **dinámicos de datos** (ancho/alto de barra en `%`, color venido de BD).
5. **Iconos = `react-icons/fi` (Feather, SVG de línea)**, renderizados con clase contenedora + `aria-hidden`. **Emojis = fuera del canon.** El hermano `OtrosPage.jsx` es la plantilla exacta.
6. Colores de estado **solo semánticos**: verde `#22c55e/#34d399`, rojo `#ef4444/#f87171`, ámbar `#fbbf24/#f59e0b`. **Morado/violeta = prohibido** (`#a855f7`, `#c084fc`, `#a78bfa`, `#6a0dad`, `rgba(106,13,173,*)`).

---

## 2. Resumen del desaguisado

| Sección | Nivel de desviación | Morados/violetas | Emojis IA | Inline estáticos (a clase) | Esfuerzo |
|---|---|---|---|---|---|
| **Finanzas** | Puntual pero muy visible (estructura ya canon) | **13** (12 en `Finanzas.css` + 1 en `TabResumen.jsx`) | **16** (6 en `TabResumen.jsx` + 10 en `utils.js`) | **2 estáticos** (`TabProductos` l.139, `TabGastos` l.156) + 5 dinámicos a normalizar | **1.5–2 h** |
| **Automatizaciones** | Bajo (solo emojis + 2 líneas moradas) | **2** (`.auto-option--active`, l.146–147) | **10** (`MODULES[].icon`, l.8–120) | **0** | **30–45 min** |
| **Aprendizaje IA** | La menos desviada | **1** (chip flecha "estable", l.76) | **6** (KPIs, l.44–49) | **1 estático** (l.101 `marginTop`) + 1 semántico (l.189) | **30–45 min** |

Añadidos comunes que también desentonan aunque no sean "morado prominente": **sombras naranja legacy** sobre botones celeste en Finanzas, y **cajas de icono neutras** (grises) que dejarán el SVG apagado si no se les da el chip celeste de `OtrosPage`.

**Esfuerzo total ≈ 3–3,5 h**, todo aditivo y reversible (cambios de color + clases 1:1, sin tocar lógica ni fetch).

---

## 3. Catálogo por sección

### 3.1 Finanzas

**Morados a eliminar** (→ celeste del sistema):

| file:line | Actual | Reemplazo canon |
|---|---|---|
| `src/pages/Finanzas/TabResumen.jsx:61` | `color="#a855f7"` (KPI "Coste ventas") | `color="#60b5ff"` o quitar color (borde glass neutro) |
| `src/pages/Finanzas/Finanzas.css:129` | `border-color: #a855f7` (focus date) | `var(--dash-accent-1, #2f7ed8)` |
| `src/pages/Finanzas/Finanzas.css:130` | `box-shadow ...rgba(168,85,247,.45)` | `rgba(96,181,255,.45)` |
| `src/pages/Finanzas/Finanzas.css:191` | `.fin-cortesias-card border rgba(168,85,247,.3)` | `var(--dash-glass-border)` (o `rgba(96,181,255,.3)`) |
| `src/pages/Finanzas/Finanzas.css:201` | `.fin-card-label color: #c084fc` | `var(--dash-accent-2, #60b5ff)` |
| `src/pages/Finanzas/Finanzas.css:339` | `.fin-search:focus border #a855f7` | `var(--dash-accent-1)` |
| `src/pages/Finanzas/Finanzas.css:340` | `box-shadow rgba(168,85,247,.45)` | `rgba(96,181,255,.45)` |
| `src/pages/Finanzas/Finanzas.css:486` | `.fin-form ...:focus border #a855f7` | `var(--dash-accent-1)` |
| `src/pages/Finanzas/Finanzas.css:487` | `box-shadow rgba(168,85,247,.45)` | `rgba(96,181,255,.45)` |
| `src/pages/Finanzas/Finanzas.css:524` | `.fin-input:focus border #a855f7` | `var(--dash-accent-1)` |
| `src/pages/Finanzas/Finanzas.css:525` | `box-shadow rgba(168,85,247,.45)` | `rgba(96,181,255,.45)` |
| `src/pages/Finanzas/Finanzas.css:700` | `.fin-cortesias-title color: #c084fc` | `var(--dash-accent-2, #60b5ff)` |
| `src/pages/Finanzas/Finanzas.css:894` | `.fin-bloque-link:hover ... color: #a78bfa` | `var(--dash-accent-2, #60b5ff)` |

**Emojis a quitar:**

- `src/pages/Finanzas/TabResumen.jsx:46` `💰` → `FiDollarSign`
- `src/pages/Finanzas/TabResumen.jsx:53` `📦` → `FiPackage`
- `src/pages/Finanzas/TabResumen.jsx:64` `🏠` → `FiHome`
- `src/pages/Finanzas/TabResumen.jsx:71` `📈/📉` (condicional) → `FiTrendingUp` / `FiTrendingDown`
- `src/pages/Finanzas/TabResumen.jsx:81` `🎁` en `.fin-cortesias-icon` → **emoji muerto** (la clase tiene `display:none` en `Finanzas.css:690`); borrar el `<div>` + la regla CSS
- `src/pages/Finanzas/TabResumen.jsx:158` `🎉` en "Todo pagado. 🎉" → dejar "Todo pagado."
- `src/pages/Finanzas/utils.js:86–95` — 10 labels de `CATEGORIAS_GASTO` con emoji (`🏠👥💡🌐🛡️📋💻🔧📣📦`). Van dentro de un `<select>`, así que **NO** se sustituyen por SVG: se borra el emoji y se deja solo el texto ("Alquiler", "Salarios", …).

**Inline a pasar a clase:**

- `TabProductos.jsx:139` `<td colSpan={8} style={{textAlign,padding,color:"#94a3b8"}}>` → **ESTÁTICO** → clase `.fin-empty-cell`
- `TabGastos.jsx:156` `<td colSpan={9} style={{...}}>` → **ESTÁTICO** → misma `.fin-empty-cell`
- `TabResumen.jsx:11` `style={color ? {borderTopColor:color} : null}` → en 3 de 4 cards el color es estático (`#3b82f6/#a855f7/#f97316`); mover a clases de estado, dejar solo el caso dinámico `margenColor`
- `TabResumen.jsx:96` `style={{color: impactoMargen>5 ? "#ef4444":"#94a3b8"}}` → clase `.fin-cortesias-num.is-alto`
- `TabProductos.jsx:120` `style={{color: margen>=0?"#22c55e":"#ef4444", fontWeight:600}}` → `.fin-num--pos` / `.fin-num--neg`
- `TabProductos.jsx:127` `style={{background:`${alertaColor}22`, color:alertaColor}}` → `.fin-pill--negativo/bajo/medio/alto`
- `TabGastos.jsx:131` `<tr style={{opacity: activo?1:0.5}}>` → `.fin-row--inactivo`

**Otras desviaciones (mismo pase):**

- **Sombras naranja legacy** `rgba(255,103,0,*)` sobre botones/tabs CELESTE: `Finanzas.css:75`, `:108`, `:354`, `:361`, `:662` → cambiar el glow a `rgba(47,126,216,.28)`.
- **Clase huérfana / mismatch:** el JSX de `PeriodoSelector.jsx:16` usa `.fin-periodo` + `.fin-periodo-presets` (l.17), pero el CSS define `.fin-periodo-selector` (`Finanzas.css:80`) → el contenedor queda **sin estilo**. Renombrar `.fin-periodo-selector`→`.fin-periodo` y crear `.fin-periodo-presets`.
- **Contenedor de icono:** `.fin-card-icon` (`Finanzas.css:148`) tiene solo `font-size:1.1rem` (pensado para emoji) → convertir en contenedor SVG (inline-flex, `color` heredado/celeste, ~1.1rem), imitando `.otros-card__icon`.
- **Aceptable, NO tocar:** los `contentStyle`/`wrapperStyle`/`tick fill` de Recharts en `TabResumen.jsx:198–209` son props que la librería exige (no son `style={{}}` sobre nuestro DOM). Colores en paleta (`#3b82f6/#f97316/#22c55e`). Se dejan.

---

### 3.2 Automatizaciones

**Morados a eliminar** (único punto morado de la sección):

| file:line | Actual | Reemplazo canon |
|---|---|---|
| `src/pages/AutomatizacionesPage.css:146` | `.auto-option--active background: rgba(106,13,173,0.08)` | `rgba(96,181,255,0.10)` |
| `src/pages/AutomatizacionesPage.css:147` | `.auto-option--active border-color: rgba(106,13,173,0.3)` | `rgba(96,181,255,0.35)` (o `var(--dash-accent-2)`) |

**Emojis a quitar** (array `MODULES`, todos renderizados en `.auto-card__icon`, l.203):

- `AutomatizacionesPage.jsx:8` `📦` → `FiPackage`
- `AutomatizacionesPage.jsx:21` `⚠️` → `FiAlertTriangle`
- `AutomatizacionesPage.jsx:33` `📊` → `FiBarChart2`
- `AutomatizacionesPage.jsx:45` `💰` → `FiDollarSign`
- `AutomatizacionesPage.jsx:57` `🍳` → `FiCoffee`
- `AutomatizacionesPage.jsx:69` `📦` (repetido) → `FiSliders` (para diferenciarlo de "pedidos")
- `AutomatizacionesPage.jsx:82` `📋` → `FiClipboard`
- `AutomatizacionesPage.jsx:94` `📣` → `FiSend`
- `AutomatizacionesPage.jsx:106` `🔒` → `FiLock`
- `AutomatizacionesPage.jsx:120` `📅` → `FiCalendar`

**Inline:** ninguno (no hay `style={{}}` en el JSX).

**Otras desviaciones:**

- **Caja de icono neutra:** `.auto-card__icon` (`AutomatizacionesPage.css:91–102`) usa fondo gris `rgba(255,255,255,0.04)` sin color → al meter SVG saldrá apagado. Darle el chip celeste de `OtrosPage.css:59–71`: `background:rgba(96,181,255,0.08); border:1px solid rgba(96,181,255,0.18); color:#60b5ff`.
- **El acento ya era celeste** en `accent-color` del radio (l.152) y el spinner (l.177) → se dejan.
- Menor/opcional: `radius 14px`→`18px` (`.auto-card` l.75, `.auto-header` l.8), añadir `box-shadow:var(--dash-shadow)+backdrop-filter:blur(14px)` a `.auto-card`, y `:focus` celeste a `.auto-card__hour-select` (l.216).

---

### 3.3 Aprendizaje IA

**Morados a eliminar** (único, prominente):

| file:line | Actual | Reemplazo canon |
|---|---|---|
| `src/pages/AprendizajeIAPage.css:76` | `.ia-learn__tend-arrow--stable background: rgba(106,13,173,0.15)` | `background: rgba(96,181,255,0.15)` (celeste). El `color: var(--color-primario-oscuro)` ya es celeste, se deja. Queda coherente con `--up` verde / `--down` rojo. |

**Emojis a quitar** (KPIs, renderizados en `.ia-learn__kpi-icon`, JSX l.188):

- `AprendizajeIAPage.jsx:44` `💬` → `FiMessageSquare`
- `AprendizajeIAPage.jsx:45` `📝` → `FiFileText`
- `AprendizajeIAPage.jsx:46` `📊` → `FiBarChart2`
- `AprendizajeIAPage.jsx:47` `📋` → `FiClipboard`
- `AprendizajeIAPage.jsx:48` `✅` → `FiCheckCircle`
- `AprendizajeIAPage.jsx:49` `🛒` → `FiShoppingCart`

**Inline a pasar a clase:**

- `AprendizajeIAPage.jsx:101` `<div className="ia-learn__propuestas-stats" style={{marginTop:"16px"}}>` → **ESTÁTICO, VIOLACIÓN** → CSS `.ia-learn__propuestas-stats { margin-top:16px }`
- `AprendizajeIAPage.jsx:189` `<span ... style={color ? {color} : undefined}>` → color semántico binario (verde/ámbar, viene de l.48) → clase de estado `.ia-learn__kpi-value--ok` / `--warn`
- **DINÁMICOS legítimos (dejar):** l.59 `height %`, l.133 y l.163 `width % + scoreColor()`, l.201 `width % + color` semántico. Tolerados por el canon (datos).

**Otras desviaciones:**

- **Icono ligado a emoji:** `.ia-learn__kpi-icon` (`AprendizajeIAPage.css:41`) solo `font-size:1.3rem` → restilar como chip celeste de `OtrosPage.css:59–71` (40×40, flex, `background:rgba(96,181,255,0.08)`, `border rgba(96,181,255,0.18)`, `color:#60b5ff`).
- **YA CONFORME (no tocar):** `.ia-learn__bar` (l.59) usa gradiente **celeste** `var(--color-primario)`→`var(--color-primario-oscuro)`. No es ofensor. Opcional alinear a `var(--dash-accent-2)/--1`.
- Opcionales de consistencia (baja prioridad): `radius 14px`→`var(--dash-radius-lg,18px)`, glass hardcodeado `rgba(255,255,255,0.03/0.06)`→tokens `--dash-glass-bg/border`, añadir `box-shadow`+`backdrop-filter` a las cards, tokenizar textos.

---

## 4. Plan de rehacer (ordenado, aditivo y seguro)

**Orden sugerido: empezar por las baratas y de mayor impacto visual (Automatizaciones + Aprendizaje IA), cerrar con Finanzas.**

### Paso 1 — Automatizaciones (~30–45 min, la más mecánica)
1. `AutomatizacionesPage.jsx`: añadir `import { FiPackage, FiAlertTriangle, FiBarChart2, FiDollarSign, FiCoffee, FiSliders, FiClipboard, FiSend, FiLock, FiCalendar } from "react-icons/fi";` y cambiar cada `icon: "<emoji>"` por la **referencia** al componente. En l.203 cambiar `{mod.icon}` por el patrón de `OtrosPage.jsx:109–111`: `{mod.icon && <mod.icon aria-hidden />}`.
2. `AutomatizacionesPage.css`: quitar morado en l.146–147; dar chip celeste a `.auto-card__icon` (l.91–102).
3. Verificar: `grep -niE "106, ?13, ?173|📦|⚠️|📊|💰|🍳|📋|📣|🔒|📅" src/pages/AutomatizacionesPage.*` → vacío.

### Paso 2 — Aprendizaje IA (~30–45 min)
1. `AprendizajeIAPage.jsx`: importar los 6 iconos Feather; pasar el **componente** en los KPIs (l.44–49); actualizar el componente `KPI` (l.185–193) para renderizar `<Icon aria-hidden />` y usar clase de estado en vez del `color` inline (l.189); en "Aceptación" pasar `estado={tasa>=50 ? "ok":"warn"}`; quitar el `style` estático de l.101.
2. `AprendizajeIAPage.css`: morado→celeste en l.76; restilar `.ia-learn__kpi-icon` como chip celeste; añadir `.ia-learn__propuestas-stats{margin-top:16px}` y `.ia-learn__kpi-value--ok/--warn`.
3. Dejar intactos los inline dinámicos (barras/scores).

### Paso 3 — Finanzas (~1,5–2 h, el grueso)
1. **`Finanzas.css`** (~30 min): buscar-y-reemplazar los 6 focus morados (l.129/130, 339/340, 486/487, 524/525) por `var(--dash-accent-1)` + `rgba(96,181,255,.45)`; cortesías l.191/201/700 y hover l.894 a celeste/neutro; sombras naranja l.75/108/354/361/662 a celeste; convertir `.fin-card-icon` (l.148) en contenedor SVG; borrar la regla muerta `.fin-cortesias-icon` (l.690); renombrar `.fin-periodo-selector`→`.fin-periodo` + crear `.fin-periodo-presets`; **añadir clases nuevas** `.fin-empty-cell`, `.fin-num--pos/--neg`, `.fin-cortesias-num.is-alto`, `.fin-row--inactivo`, `.fin-pill--negativo/bajo/medio/alto`.
2. **`utils.js`** (~5 min): quitar emojis de los labels (l.86–95).
3. **`TabResumen.jsx`** (~25 min): importar `FiDollarSign, FiPackage, FiHome, FiTrendingUp, FiTrendingDown`; iconos en las 4 Cards; quitar `color="#a855f7"` (l.61); borrar el `<div className="fin-cortesias-icon">🎁</div>` (l.81); clase en l.96; quitar `🎉` (l.158); dejar Recharts.
4. **`TabProductos.jsx`** (~15 min): l.120 → `.fin-num--pos/--neg`; l.127 → `.fin-pill fin-pill--${p.alerta}`; l.139 → `.fin-empty-cell`.
5. **`TabGastos.jsx`** (~10 min): l.131 → `.fin-row--inactivo`; l.156 → `.fin-empty-cell`. (Ya usa `FiEdit2/FiTrash2`, correcto.)
6. `FinanzasPage.jsx`, `Pagination.jsx`, `useFinanzas.js`: **sin morado/emojis, no tocar** (`FinanzasPage` usa `✕`/`?`, glifos unicode canon).

**No tocar `useFinanzas.js`** (solo fetch, ya limpio).

---

## 5. Nota — riesgos y cómo preservar la funcionalidad

- **¿El morado significa algo?** No. En las tres secciones es puramente decorativo (focus rings, fondo de card/chip, hover, color de KPI). Ninguna lógica depende del color morado. `rgba(106,13,173,*)` y `#a855f7/#c084fc/#a78bfa` son deuda estética, no estado semántico → cambio 1:1 sin riesgo.
- **¿Algún emoji es funcional?** No como icono. **Excepción de forma, no de función:** los emojis de `utils.js:86–95` viven dentro del **valor mostrado** de un `<select>` y también se pintan en la columna "Categoría" de la tabla de gastos (`cat.label`). No se pueden sustituir por SVG dentro de un `<option>` → **se elimina el emoji y se deja el texto**; el `value` (`"alquiler"`, `"salarios"`…) NO cambia, así que **no se rompe** el guardado ni el filtrado por categoría.
- **Emoji + código muerto** en Finanzas: `🎁` (`TabResumen.jsx:81`) está oculto por `.fin-cortesias-icon{display:none}` (`Finanzas.css:690`) → borrar `<div>` + regla es seguro (nunca se ve hoy).
- **Inline dinámicos = NO tocar:** anchos/alturas de barra en `%` y colores venidos de `scoreColor()`/`alertaColor()`/props de BD son datos legítimos según el canon. Convertirlos a clases fijas rompería la representación de los datos. Solo se migran los **estáticos** (`#94a3b8` en celdas vacías, `marginTop:16px`) y, opcionalmente, los **semánticos binarios** (>=0, >=50, >5) a clases de estado.
- **Recharts (`TabResumen.jsx:198–209`):** sus `style`-objeto son API de la librería, no violación de la regla de clases. Colores ya en paleta (`#3b82f6/#f97316/#22c55e`) → dejar.
- **Bug latente que conviene arreglar de paso** (no es color, es funcional): el mismatch de clases en `PeriodoSelector.jsx` (`.fin-periodo` vs `.fin-periodo-selector`) hace que el contenedor de presets del selector de periodo esté **sin estilo hoy**. Renombrar la clase lo arregla; verificar visualmente el selector tras el cambio.
- **Riesgo global: bajo y reversible.** Todo es color + clases + swap emoji→SVG, sin lógica. Verificación tras cada sección con `grep` de emojis/morados (debe salir vacío) y repaso visual: en Finanzas las 4 pestañas (Resumen / Productos / Gastos fijos / Cortesías) + el modal de gasto; en Automatizaciones el grid de módulos y la opción activa; en Aprendizaje IA los 6 KPIs y el chip "estable".