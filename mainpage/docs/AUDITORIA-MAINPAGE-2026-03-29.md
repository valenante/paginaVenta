# AUDITORIA COMPLETA DE MAINPAGE — Plan de Accion

**Fecha:** 2026-03-29
**Proyecto:** Mainpage — Landing de venta + Panel de administracion + Panel Superadmin
**Stack:** React 19.1 + Vite 6.3 + React Router 6.30 + Stripe + Socket.IO
**Tamano:** 235 archivos JS/JSX, 424 archivos totales en src/, 68 rutas, 9 contexts, 52 directorios de componentes

---

## INDICE

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Que es realmente este proyecto](#2-que-es-realmente-este-proyecto)
3. [Estado real por areas](#3-estado-real-por-areas)
4. [Fortalezas reales](#4-fortalezas-reales)
5. [Problemas encontrados](#5-problemas-encontrados)
6. [Riesgos](#6-riesgos)
7. [PLAN DE ACCION](#7-plan-de-accion)
8. [Conclusion final](#8-conclusion-final)

---

# 1. Resumen ejecutivo

## Estado real
Mainpage NO es una simple pagina de venta. Es una **aplicacion de 3 capas en un solo proyecto**:

1. **Landing publica** — pagina de venta con hero, features, packs, contacto, Stripe checkout
2. **Panel de administracion** — gestion completa del restaurante/shop (productos, categorias, stock, proveedores, facturas, estadisticas, usuarios, permisos, config, reservas, impresion, mapa de mesas, caja diaria, exportaciones, soporte)
3. **Panel superadmin** — gestion de la plataforma SaaS (tenants, planes, billing, logs, monitor, restore, RGPD, migraciones, rollback, settings)

Con 235 archivos fuente, 68 rutas, y 9 contexts, es la pieza **mas grande y mas critica** del ecosistema ALEF despues de la API.

## Veredicto
**Funcional y completa, pero con deuda tecnica proporcional a su tamano.**

| Aspecto | Estado |
|---|---|
| Funcionalidad | Completa — cubre todos los flujos de admin y superadmin |
| Arquitectura | Correcta — dual landing/panel bien separado, RBAC, multi-tenant |
| Seguridad | Buena con issues puntuales (secrets en UI, impersonation token) |
| Calidad de codigo | Debil — 0 tests, 0 tipos, god components, 89 console.log |
| Legal (RGPD) | Buena — privacy policy, cookie banner, pagina RGPD de superadmin |
| Stripe | Correcto — Hosted Checkout (sin scope PCI), clave test en .env |

## Comparativa con el resto del ecosistema

| Metrica | API | TPV | Carta | Mainpage |
|---|---|---|---|---|
| Archivos fuente | ~200 | 170 | 53 | 235 |
| Tests reales | 48 | 0 | 0 | 0 |
| Tipos | No (Zod) | No | No | No (@types instalados pero sin usar) |
| console.log prod | Controlado | 122 | ~5 | 89 |
| God files (>500L) | Pocos | 8 | 4 | 15+ |
| CI/CD | No | No | No | No |
| Stack moderno | Express 5 ESM | CRA React 18 | CRA React 19 | **Vite React 19** |

**Mainpage es el unico proyecto en Vite** — el mas moderno del stack.

---

# 2. Que es realmente este proyecto

## Capa 1: Landing publica (no autenticada)

Rutas publicas para vender ALEF:

| Ruta | Componente | Proposito |
|---|---|---|
| `/` | LandingPage | Hero, introduccion, funcionamiento, features, packs, contacto |
| `/login` | Login | Email + password |
| `/registro` | Registro | 4 pasos: datos, config, servicios extras, pago Stripe |
| `/registro-exito` | RegistroSuccess | Post-pago |
| `/forgot-password` | ForgotPassword | Reset de contrasena |
| `/set-password` | SetPassword | Establecer contrasena inicial |
| `/aviso-legal` | AvisoLegal | Aviso legal |
| `/privacidad` | Privacidad | Politica de privacidad RGPD |
| `/cookies` | Cookies | Politica de cookies |

## Capa 2: Panel de administracion (autenticado, por tenant)

Panel para el dueno/encargado del restaurante/shop:

| Area | Rutas | Componentes principales |
|---|---|---|
| Dashboard/Config | `/pro`, `/configuracion` | PanelPro, DashboardPage, RestauranteConfigPage |
| Productos | `/productos`, `/crear-producto`, `/editar-producto/:id` | Categories (3.400 LOC total), Products |
| Stock | `/stock` | StockPage (781L), EditarIngredienteModal (535L) |
| Proveedores | `/proveedores`, `/proveedores/:id` | Proveedores (2.020 LOC total) |
| Facturas | `/facturas` | FacturasPage (898L) |
| Estadisticas | `/estadisticas`, `/ventas` | Estadisticas (482 LOC), PanelPro |
| Usuarios | `/usuarios`, `/roles-permisos` | Usuarios (1.555 LOC), RolesPermisos (839L) |
| Caja diaria | `/caja-diaria` | CajaDiariaUltraPro (1.309 LOC total) |
| Mapa de mesas | `/mapa-editor` | MapaEditor (520L) |
| Reservas | `/reservas-config` | ReservasConfigPage (270L) |
| Impresion | `/impresion`, `/print-center` | ConfigImpresionPage (573L), PrintCenterPage (465L) |
| Carta | `/carta-config` | CartaConfigPage (952L) |
| Mi cuenta | `/mi-cuenta`, `/perfil` | MiCuentaPage (705L), PerfilPage (253L) |
| Soporte | `/soporte`, `/soporte/nuevo`, `/soporte/:id` | SoporteLista, SoporteNuevo, SoporteDetalle |
| Exportaciones | `/exports` | ExportsPage (541L) |
| Valoraciones | `/valoraciones` | ValoracionesPanel (433L) |
| Ayuda | `/ayuda` | Centro de ayuda con datos (2.186L + 774L) |

## Capa 3: Panel superadmin (requiere role superadmin)

Panel para gestionar toda la plataforma:

| Ruta | Componente | Proposito |
|---|---|---|
| `/superadmin` | AdminDashboard | Tabla de tenants, stats, crear/editar tenant |
| `/superadmin/tenants` | TenantsPage | Listado con filtros |
| `/superadmin/tenants/nuevo` | SuperadminAltaTenant | Alta manual (4 pasos + provisioning) |
| `/superadmin/planes` | PlanesAdmin | CRUD de planes con features y precios |
| `/superadmin/billing` | BillingPage | Historial de pagos, ingresos |
| `/superadmin/logs` | LogsPage (487L) | Logs de actividad por tenant |
| `/superadmin/tickets` | TicketsPage | Cola de soporte |
| `/superadmin/settings` | SettingsPage (520L) | Config global (incluye secrets backend) |
| `/superadmin/monitor` | AdminMonitorPage | Monitor de jobs en tiempo real |
| `/superadmin/rollback` | ApiRollbackPage | Rollback de version de API |
| `/superadmin/restore` | RestorePage (981L) | Restore de backups MongoDB |
| `/superadmin/rgpd` | RgpdPage (472L) | Borrado de datos RGPD |
| `/superadmin/exports` | SuperadminExportsPage | Exportaciones masivas |
| `/superadmin/migrations` | MigrationsPage | Tracking de migraciones de DB |

---

# 3. Estado real por areas

## 3.1 Arquitectura
**Estado: BUENA**

**Fortalezas:**
- **Vite** — el unico proyecto del ecosistema en Vite. Builds rapidos, HMR, ESM nativo.
- **Separacion landing/panel** bien ejecutada: `HomeEntry()` decide si mostrar landing o redirigir al panel segun auth state.
- **Rutas superadmin aisladas** bajo `AdminLayout` con guard `if (!user || !isSuperadmin) return <Navigate to="/" />`.
- **9 contexts bien delimitados** — Auth, Config, Tenant, Ventas, Categorias, ShopCategorias, Productos, FeaturesPlan, Toast.
- **68 rutas** organizadas en publicas / tenant / superadmin.

**Debilidades:**
- **App.jsx tiene 531 lineas** — concentra todas las rutas. Deberia dividirse en route modules.
- **10+ providers anidados** — similar al TPV.
- **Dual hooks directory** — `src/hooks/` y `src/Hooks/` (inconsistencia de casing).
- **utils/api.js es enorme** — contiene toda la logica de axios en un solo archivo.

**Evidencia:** `src/App.jsx` (531L), `src/context/` (9 archivos), `src/utils/api.js`

## 3.2 Seguridad
**Estado: BUENA CON ISSUES PUNTUALES**

| Control | Estado | Evidencia |
|---|---|---|
| CSRF double-submit cookie | Implementado | `api.js:170-198` — lee `__Secure-alef_csrf` / `alef_csrf`, envia como header |
| Recuperacion CSRF automatica | Implementado | Reintento con token fresco tras 403 CSRF |
| Token refresh con cola | Implementado | `api.js:356-403` — maneja TOKEN_EXPIRED, SESSION_REVOKED |
| RBAC completo | Implementado | AuthContext con `tienePermiso`, `hasPermission`, `hasAnyPermission`, `canAccessModule` |
| Guard superadmin | Implementado | AdminLayout — `if (!isSuperadmin) return <Navigate>` |
| DOMPurify instalado | Si, pero sin uso explicito | Viene como dependencia, no se usa directamente |
| XSS (dangerouslySetInnerHTML) | 0 usos | Verificado por busqueda global |
| react-markdown | Seguro | Componentes custom, contenido de datos estaticos, no user input |
| Cookie banner RGPD | Implementado | CookieBanner.jsx — solo cookies tecnicas |
| Paginas legales | Implementadas | AvisoLegal, Privacidad, Cookies |
| Stripe | Hosted Checkout (sin PCI scope) | `Paso4ResumenPago.jsx` — redirect a Stripe, no form embebido |

**Issues de seguridad encontrados:**

### Issue 1: Secrets de backend en formulario de UI
- **Archivo:** `src/pages/admin/SettingsPage.jsx`
- **Que pasa:** El superadmin puede ver/editar secrets del backend (Stripe secret key, webhook secret, Cloudflare API token, R2 secret, SMTP password) desde un formulario React.
- **Riesgo:** Los secrets estan en React state durante la edicion — accesibles via DevTools. Se transmiten en body HTTP (deberia ser HTTPS). Estan visibles en input fields.
- **Mitigacion existente:** Los secrets se borran del state despues de guardar (linea 165).
- **Solucion recomendada:** Usar inputs type="password" con masking. Idealmente, mover gestion de secrets a variables de entorno del servidor, no a UI.

### Issue 2: Token de impersonacion en sessionStorage
- **Archivo:** `src/pages/LoginImpersonar.jsx:26`
- **Que pasa:** `sessionStorage.setItem("token", token)` — el token de impersonacion llega por URL query param y se persiste en sessionStorage.
- **Riesgo:** Filtrable via browser history, logs de referrer, o DevTools.
- **Solucion:** Usar solo en memoria o cookie HttpOnly. Consumir el token una sola vez.

## 3.3 Stripe / Registro / Onboarding
**Estado: CORRECTO**

**Flujo de registro (4 pasos):**
1. **Paso1DatosEmpresa** — datos del negocio
2. **Paso2Configuracion** — tipo de negocio, config inicial
3. **Paso3ServiciosExtras** (604 lineas) — addons (carga de productos 80EUR, impresora 150EUR, etc.)
4. **Paso4ResumenPago** — resumen + redirect a Stripe Hosted Checkout

**Stripe flow:**
1. `loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)` — clave test en .env
2. `POST /pago/precheckout` con datos del tenant
3. `POST /pago/crear-sesion` con precheckoutId
4. `window.location.href = sesion.url` — redirect a Stripe
5. Return a `/pago/exito` o `/pago/cancelado`

**Correcto:** No embebe formulario de pago — usa Stripe Hosted Checkout (sin scope PCI).

## 3.4 Panel de administracion
**Estado: COMPLETO Y FUNCIONAL**

Cubre todos los flujos de administracion de un restaurante/shop:

- **Productos:** Crear (1.092L), editar (1.077L), categorias (674L) — CRUD completo con variaciones, precios, imagenes, extras
- **Stock:** Ingredientes, inventario, alertas de stock bajo
- **Proveedores:** CRUD completo, pedidos a proveedor, facturas de proveedor
- **Facturas VeriFactu:** Listado, filtros, rectificacion, anulacion, export CSV/PDF
- **Caja diaria:** Reporte diario con desglose, graficos, export PDF (CajaDiariaUltraPro — 1.309 LOC)
- **Usuarios:** CRUD con roles, permisos granulares (RolesPermisosPanel — 839L)
- **Estadisticas:** Recharts, ventas, productos mas vendidos
- **Mapa de mesas:** Editor drag-and-drop con zonas
- **Reservas:** Config de franjas, dias especiales, disponibilidad
- **Impresion:** Config de impresoras, cola de impresion, print center
- **Carta:** Config de carta QR (CartaConfigPage — 952L)
- **Mi cuenta:** Config del tenant, branding, tema, datos
- **Soporte:** Tickets con creacion, listado, detalle
- **Exportaciones:** CSV/PDF de pedidos, facturas, stock
- **Ayuda:** Centro de ayuda con articulos por tipo de negocio

## 3.5 Panel superadmin
**Estado: COMPLETO**

Gestion completa de la plataforma SaaS:

- **Tenants:** CRUD, estado, plan, alta manual con provisioning
- **Planes:** CRUD de planes con features y precios por tier
- **Billing:** Historial de pagos, ingresos
- **Logs:** Actividad por tenant con filtros
- **Monitor:** Jobs en tiempo real con Socket.IO
- **Restore:** Restore de backups MongoDB por tenant (981 lineas)
- **RGPD:** Borrado de datos por tenant (472 lineas)
- **Settings:** Config global del sistema
- **Migraciones:** Tracking de migraciones de DB
- **Rollback:** Rollback de version de API
- **Exportaciones:** Bulk exports
- **Tickets:** Cola de soporte centralizada

## 3.6 Calidad de codigo
**Estado: DEBIL (proporcional al tamano)**

| Metrica | Valor | Evaluacion |
|---|---|---|
| Archivos JS/JSX | 235 | Grande |
| Archivos > 500L | 15+ | Muchos god components |
| Archivo mas grande (logica) | CrearProducto.jsx (1.092L) | Necesita descomposicion |
| console.log/warn/error en prod | 89 en 41 archivos | Demasiados |
| Tests | 0 | Inexistente |
| PropTypes | 0 | Sin validacion |
| TypeScript | 0 (types instalados pero sin usar) | Sin tipos |
| ESLint | Configurado (basico) | Sin reglas custom de seguridad |
| Prettier | No | Sin formato automatico |
| PDF libraries redundantes | 2 sin usar (pdf-lib, pdfmake) | Bloat en bundle |

## 3.7 Dependencias
**Estado: MIXTO**

**Positivo:**
- Vite 6.3 (ultimo)
- React 19.1 (ultimo)
- RR6 (estable)
- ESLint 9 con plugin hooks

**Problemas:**
- **3 librerias PDF, solo 1 usada:** jspdf+autotable se usan, `pdf-lib` y `pdfmake` no se importan en ningun archivo. Son peso muerto en el bundle.
- **@types/react instalado pero sin TypeScript** — sin utilidad real.

## 3.8 Tests
**Estado: INEXISTENTE**

0 archivos de test. Ninguno. Para 235 archivos y el panel de admin mas critico del SaaS.

## 3.9 Legal / RGPD
**Estado: BUENA**

- **Cookie banner** con solo cookies tecnicas, link a politica
- **Aviso legal** completo
- **Politica de privacidad** referencia RGPD (EU 2016/679), lista derechos del interesado, datos de contacto
- **Politica de cookies** detallada
- **Panel RGPD de superadmin** (RgpdPage — 472L) para borrado de datos por tenant
- **Panel de restore** (RestorePage — 981L) para restauracion de backups

---

# 4. Fortalezas reales

1. **Unico proyecto en Vite** — stack moderno, builds rapidos, HMR, ESM nativo. Demuestra capacidad de evolucion tecnica.

2. **Panel de admin completo** — cubre absolutamente todo lo que un restaurante necesita configurar. No falta nada funcional.

3. **Panel superadmin profesional** — gestion de plataforma SaaS con restore, RGPD, migraciones, monitor, rollback. Features que muchos SaaS de equipos grandes no tienen.

4. **Stripe Hosted Checkout** — sin scope PCI, sin formulario de pago embebido. Decision correcta de seguridad.

5. **RBAC con permisos granulares** — `tienePermiso`, `hasPermission`, `hasAnyPermission`, `canAccessModule`. Misma calidad que TPV y API.

6. **Flujo de registro en 4 pasos** — profesional, con addons, precios, y redirect a Stripe.

7. **Legal completo** — privacy policy, cookie banner, aviso legal. Necesario para vender en Espana.

8. **Centro de ayuda integrado** — articulos por tipo de negocio. Reduce carga de soporte.

9. **Sistema de soporte** — tickets con creacion, listado, detalle. Basico pero funcional.

10. **CSRF + idempotency** en API layer — consistente con el resto del ecosistema.

---

# 5. Problemas encontrados

## P0 — Criticos

### P0-1: Secrets de backend visibles en formulario UI
- **Archivo:** `src/pages/admin/SettingsPage.jsx`
- **Que pasa:** Stripe secret key, webhook secret, Cloudflare token, R2 secret, SMTP password editables desde un formulario React. Estan en React state (accesibles via DevTools) y en inputs visibles.
- **Impacto:** Un atacante con acceso al navegador del superadmin (o una extension maliciosa) puede leer los secrets.
- **Solucion:** Inputs `type="password"` con masking. Idealmente, gestionar secrets solo via .env del servidor, no via UI.
- **Esfuerzo:** 30 minutos para masking, mas profundo para eliminar de UI.

### P0-2: 0 tests
- **Que pasa:** 235 archivos sin ninguna prueba automatizada. El panel de admin maneja dinero (facturas, caja, Stripe), datos sensibles (usuarios, RGPD), y operaciones destructivas (restore, borrado).
- **Impacto:** Cualquier cambio puede romper facturacion, permisos, o gestion de tenants sin que nadie lo detecte.
- **Solucion:** Tests progresivos empezando por AuthContext, RBAC, y flujo de Stripe.
- **Esfuerzo:** 3-5 dias para lo critico.

### P0-3: Token de impersonacion en sessionStorage
- **Archivo:** `src/pages/LoginImpersonar.jsx:26`
- **Que pasa:** Token de impersonacion llega por URL y se persiste en sessionStorage.
- **Impacto:** Filtrable via browser history o referrer.
- **Solucion:** Consumir en memoria, no persistir.
- **Esfuerzo:** 15 minutos.

## P1 — Muy importantes

### P1-1: 15+ god components (>500 lineas)
- **Archivos principales:** CrearProducto (1.092L), EditProducts (1.077L), RestorePage (981L), CartaConfigPage (952L), FacturasPage (898L), RolesPermisosPanel (839L), StockPage (781L), MiCuentaPage (705L), CategoriasPanel (674L), PedidoProveedorModal (637L), Paso3ServiciosExtras (604L), ConfigImpresionPage (573L), ExportsPage (541L), App.jsx (531L), SettingsPage (520L), MapaEditor (520L).
- **Impacto:** Imposible testear unitariamente. Alto riesgo de regresiones.
- **Solucion:** Descomponer progresivamente (hooks + sub-componentes).
- **Esfuerzo:** 1-2 dias por componente.

### P1-2: 89 console.log en produccion
- **Que pasa:** 89 console.log/warn/error en 41 archivos sin eliminacion en build.
- **Impacto:** Ruido en DevTools, filtracion de datos internos.
- **Solucion:** Plugin Vite para strip o logger condicional (como Carta y TPV ya tienen).
- **Esfuerzo:** 30 minutos (plugin) o 2-3 horas (logger manual).

### P1-3: 2 librerias PDF sin usar
- **Que pasa:** `pdf-lib` y `pdfmake` en dependencies pero sin importar en ningun archivo. Solo `jspdf` + `jspdf-autotable` se usan.
- **Impacto:** Peso muerto en bundle.
- **Solucion:** `npm uninstall pdf-lib pdfmake`
- **Esfuerzo:** 2 minutos.

### P1-4: @types/react sin TypeScript
- **Que pasa:** `@types/react` y `@types/react-dom` en devDeps pero no hay TypeScript configurado.
- **Impacto:** Sin utilidad. Confusion.
- **Solucion:** Eliminar (si no vas a migrar a TS) o configurar TS (si quieres tipos).
- **Esfuerzo:** 2 minutos (eliminar) o variable (configurar TS).

### P1-5: Directorio hooks duplicado
- **Que pasa:** `src/hooks/` y `src/Hooks/` coexisten (diferencia de casing).
- **Impacto:** Confusion. En Linux son directorios diferentes, en macOS/Windows son el mismo.
- **Solucion:** Unificar en `src/hooks/`.
- **Esfuerzo:** 15 minutos.

## P2 — Mejoras

### P2-1: App.jsx con 531 lineas de rutas
- **Solucion:** Separar en `routes/publicRoutes.jsx`, `routes/panelRoutes.jsx`, `routes/superadminRoutes.jsx`.
- **Esfuerzo:** 1-2 horas.

### P2-2: DOMPurify instalado pero sin uso explicito
- **Que pasa:** DOMPurify esta en dependencies pero no se importa explicitamente. react-markdown es seguro por defecto.
- **Solucion:** Verificar si alguna dependencia lo usa. Si no, evaluar si sera necesario para user content futuro.

### P2-3: Sin Prettier
- **Solucion:** Configurar y formatear progresivamente.
- **Esfuerzo:** 30 minutos.

### P2-4: ESLint sin reglas de seguridad
- **Solucion:** Anadir `eslint-plugin-security` y `eslint-plugin-import`.
- **Esfuerzo:** 30 minutos.

### P2-5: Vite sin strip de console en build
- **Solucion:**
```javascript
// vite.config.js
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true }
    }
  }
})
```
- **Esfuerzo:** 5 minutos.

---

# 6. Riesgos

## Riesgos de seguridad

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| Secrets de backend leidos via DevTools | Baja (requiere acceso al navegador del superadmin) | Critico | Masking + eliminar de UI |
| Token impersonacion filtrado | Media | Alto | Consumir en memoria |
| XSS en user content futuro | Baja (DOMPurify instalado pero no usado) | Alto | Usar DOMPurify explicitamente |

## Riesgos de calidad

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| Regresion en RBAC/permisos | Media | Critico | Tests de AuthContext |
| Regresion en flujo Stripe | Media | Critico | Tests del flujo de registro |
| God component roto por cambio | Alta | Alto | Descomponer, testear |
| Bundle bloated por deps sin usar | Segura | Medio | npm uninstall |

## Riesgos operativos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| Restore/RGPD ejecutado por error | Baja | Critico | Confirmacion doble, logs |
| Rollback de API desde UI sin validacion | Media | Alto | Verificar que pide confirmacion |
| Settings guardados incorrectamente | Media | Alto | Validacion de inputs |

---

# 7. PLAN DE ACCION

## Semana 1: Fixes criticos y limpieza (3-5 dias)

### Dia 1 — Seguridad inmediata (1-2 horas)

**1. Masking de secrets en SettingsPage:**
```jsx
// src/pages/admin/SettingsPage.jsx
// Cambiar todos los inputs de secrets a:
<input
  type="password"
  autoComplete="new-password"
  value={secrets.stripeSecretKey}
  onChange={...}
/>
// Esto previene que los secrets sean visibles en pantalla.
// Considerar: mostrar solo los ultimos 4 chars (...xxxx) como indicador.
```

**2. Fix token de impersonacion:**
```jsx
// src/pages/LoginImpersonar.jsx
// Cambiar:
//   sessionStorage.setItem("token", token);
// Por:
//   const tokenRef = useRef(token); // solo en memoria
//   usar tokenRef.current para la llamada API
//   NO persistir en storage
```

**3. Eliminar dependencias sin usar:**
```bash
cd /home/valenante/Desktop/pagina-venta/pagina/mainpage
npm uninstall pdf-lib pdfmake
# Si @types/react no se usa para nada:
npm uninstall @types/react @types/react-dom
```

**4. Strip console en build de produccion:**
```javascript
// vite.config.js — anadir a defineConfig:
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true
    }
  }
}
```

### Dia 2 — Limpieza estructural (1-2 horas)

**5. Unificar directorio hooks:**
```bash
# Mover todo de src/Hooks/ a src/hooks/
# Actualizar imports afectados
```

**6. jsconfig.json (ya existe, verificar que funciona):**
```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "jsx": "react-jsx",
    "checkJs": false
  }
}
```

### Dia 3-5 — Primeros tests

**Tests criticos por impacto de negocio:**

**a) AuthContext — permisos y roles:**
```javascript
describe('AuthContext', () => {
  it('superadmin bypassa todos los permisos', () => { ... });
  it('tienePermiso funciona con wildcard *', () => { ... });
  it('hasPermission requiere TODOS los permisos (AND)', () => { ... });
  it('hasAnyPermission requiere AL MENOS UNO (OR)', () => { ... });
  it('canAccessModule funciona con dot notation', () => { ... });
  it('logout limpia sessionStorage', () => { ... });
});
```

**b) Flujo de registro/Stripe:**
```javascript
describe('Registro', () => {
  it('Paso4 crea precheckout correctamente', () => { ... });
  it('Paso4 redirige a Stripe en exito', () => { ... });
  it('maneja error de Stripe gracefully', () => { ... });
});
```

**c) Guard de superadmin:**
```javascript
describe('AdminLayout', () => {
  it('redirige a / si no es superadmin', () => { ... });
  it('permite acceso si es superadmin', () => { ... });
});
```

---

## Semana 2: Descomponer god components prioritarios

### Prioridad 1: App.jsx (531L) -> route modules
```
src/routes/
  publicRoutes.jsx    — landing, login, registro, legal
  panelRoutes.jsx     — /pro, /productos, /facturas, /usuarios, etc.
  superadminRoutes.jsx — /superadmin/*
  shopRoutes.jsx      — /shop-*

App.jsx solo importa y monta los modulos.
```

### Prioridad 2: CrearProducto (1.092L) y EditProducts (1.077L)
```
Extraer:
  useProductoForm.js     — logica de formulario
  ProductoImagenes.jsx   — upload/preview de imagenes
  ProductoVariaciones.jsx — variaciones/tamanos
  ProductoExtras.jsx     — adicionales
  ProductoPrecios.jsx    — logica de precios
```

### Prioridad 3: RestorePage (981L)
```
Extraer:
  useRestore.js          — logica de restore
  RestoreForm.jsx        — formulario de restore
  RestoreProgress.jsx    — progreso/logs
  RestoreHistory.jsx     — historial
```

---

## Semana 3-4: Tests adicionales + mejoras

### Tests adicionales
```
- TenantContext: deteccion de tenant, error handling
- ConfigContext: hydration, feature flags
- Flujo de facturas: emision, rectificacion, anulacion
- Flujo de RGPD: borrado de tenant (mock API)
- Flujo de restore: restore de backup (mock API)
- RBAC en rutas: verificar que las guards funcionan
```

### Mejoras de calidad
```
- Prettier configurado
- ESLint con plugin security e import
- Logger condicional (como carta/logger.js)
- Separar SettingsPage secrets de settings generales
```

---

## Semana 5-8: Consolidacion

### Mas descomposicion de god components
```
FacturasPage (898L), RolesPermisosPanel (839L), StockPage (781L),
MiCuentaPage (705L), CartaConfigPage (952L)
— extraer hooks + sub-componentes progresivamente
```

### Code splitting avanzado
```
- React.lazy() para rutas pesadas (superadmin, facturas, estadisticas)
- Dynamic imports para componentes de admin no criticos
- Verificar chunk sizes con vite-plugin-visualizer
```

### Target de cobertura
```
- AuthContext: 90%
- Flujo Stripe: 80%
- Guards de rutas: 80%
- Contexts: 50%
- Componentes criticos: 30%
```

---

# 8. Conclusion final

## Donde esta Mainpage ahora

Mainpage es la pieza mas ambiciosa del ecosistema ALEF — 3 apps en una (landing, panel admin, panel superadmin) con 235 archivos y 68 rutas. **Funcionalmente esta completa.** Un dueno de restaurante puede configurar todo su negocio. Un superadmin puede gestionar toda la plataforma.

La **deuda tecnica es proporcional al tamano**: 0 tests para 235 archivos, 15+ god components, 89 console.log. Pero la arquitectura base es correcta (Vite, RBAC, multi-tenant, Stripe Hosted Checkout) y la seguridad es buena con los 2 issues puntuales identificados.

## Que impresiona

- **Panel superadmin completo** — restore, RGPD, migraciones, monitor, rollback. Features de nivel enterprise.
- **Registro con Stripe en 4 pasos** — flujo profesional de onboarding.
- **Centro de ayuda integrado** — reduce carga de soporte antes de que sea problema.
- **Sistema de soporte** — tickets basico pero funcional.
- **Legal completo** — privacy policy, cookie banner, aviso legal. Listo para vender en Espana.
- **Vite** — el unico proyecto moderno del stack. Demuestra que puedes migrar.

## Que me preocupa

- **0 tests para el panel que maneja dinero, permisos, y datos sensibles.** Si un cambio rompe el flujo de Stripe o los permisos de RBAC, nadie lo detecta.
- **Secrets de backend en formulario UI.** Es la decision de diseno mas peligrosa que he encontrado en todo ALEF.
- **15+ god components.** CrearProducto tiene 1.092 lineas — es practicamente inmantenible sin tests.
- **Sin strip de console en build.** Facil de arreglar (5 minutos con Vite config).

## Prioridades absolutas (dia 1)

1. Masking de secrets en SettingsPage — **30 minutos**
2. Fix token impersonacion — **15 minutos**
3. `npm uninstall pdf-lib pdfmake` — **2 minutos**
4. Strip console en vite.config.js — **5 minutos**

Con esos 4 fixes (~1 hora), el riesgo de seguridad baja significativamente.

---

*Documento generado a partir de auditoria completa del proyecto Mainpage.*
*Fuentes: 235 archivos JS/JSX analizados, 424 archivos totales, 68 rutas.*
*Fecha: 2026-03-29*
