// @vitest-environment node
//
// ⚠️ EN NODE, NO EN NAVEGADOR SIMULADO. Importar la configuración de vite arrastra sus tripas, y bajo jsdom revienta con
// «new TextEncoder().encode("") instanceof Uint8Array is incorrectly false». El primer rojo de esta red fue ESE error, no
// la propiedad: un rojo que no viene de lo que se vigila no es una red roja, es un arnés roto (P-140).
/**
 * DESTINO: `tpv/src/tests/` y `carta/src/tests/`, una copia en cada uno (misma prueba, distinta ruta relativa).
 * ⚠️ `shop/` NO entra: no tiene motor de pruebas (D-644). Antes decía «no tiene proxy», y eso dejó de ser la razón
 * pertinente cuando el lote cambió de puerta.
 *
 * ⚖️ RED · D-603 — EL DESARROLLO NO PUEDE HABLAR CON LA API DE CLIENTES REALES SIN PEDIRLO.
 *
 * Dos partes, y la segunda nació de que la primera vigilaba la puerta equivocada:
 *  · P1-P3 — el PROXY del servidor de desarrollo va a local por defecto. (En `tpv` y `carta` ese proxy resultó ser
 *    código muerto: nadie pide por ruta relativa. Se mantiene porque sigue siendo correcto, y en el panel sí gobierna.)
 *  · P4-P9 y E1-E10 — la PUERTA DE VERDAD: las variables de destino, que salen del `.env` de cada máquina.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ⚠️ `vi.resetModules()` y NO un import con parámetro en la ruta: vite no resuelve importes dinámicos con una expresión
// dentro («Unknown variable dynamic import»). Sin reiniciar el módulo, el segundo caso leería la configuración que ya
// construyó el primero y daría verde midiendo el caché, no el código (P-140).
// ⚠️ El cambio de directorio también aquí, y lo aprendí por las malas: al añadir el registro contable, P3 —que pone
// un destino de fuera a propósito— empezó a escribir el fichero **en la raíz del paquete**, porque este bloque
// ejecutaba la configuración con el directorio real. Una red que ensucia el repositorio al correr es una red que
// alguien acabará desactivando. Se aísla igual que el segundo bloque.
const cargarConfig = async () => {
  vi.resetModules();
  const mod = await import("../../vite.config.js");
  const cfg = mod.default;
  if (typeof cfg !== "function") return cfg;
  const previo = process.cwd();
  const temporal = mkdtempSync(join(tmpdir(), "alef-d603-proxy-"));
  process.chdir(temporal);
  try {
    return cfg({ mode: "development", command: "serve" });
  } finally {
    process.chdir(previo);
    rmSync(temporal, { recursive: true, force: true });
  }
};

describe("D-603 · el proxy de desarrollo no puede apuntar a producción sin pedirlo", () => {
  const original = process.env.ALEF_DEV_API_TARGET;
  beforeEach(() => { delete process.env.ALEF_DEV_API_TARGET; });
  afterEach(() => { if (original === undefined) delete process.env.ALEF_DEV_API_TARGET; else process.env.ALEF_DEV_API_TARGET = original; });

  it("P1 · sin pedir nada, el proxy va a LOCAL", async () => {
    const cfg = await cargarConfig();
    const destino = cfg.server?.proxy?.["/api"]?.target;
    expect(destino, `destino del proxy sin configurar nada: ${destino}`).toMatch(/localhost|127\.0\.0\.1/);
  });

  it("P2 · el socket va al MISMO sitio que la API (no se puede quedar uno en producción)", async () => {
    const cfg = await cargarConfig();
    expect(cfg.server?.proxy?.["/socket.io"]?.target).toBe(cfg.server?.proxy?.["/api"]?.target);
  });

  it("P3 · si se PIDE un destino, se respeta", async () => {
    // ⚠️ El valor NO puede ser el de producción: hoy el código apunta ahí, así que la prueba pasaría sin leer la variable
    // —verde por coincidencia—. Se usa un destino que no aparece en ningún sitio del repositorio.
    process.env.ALEF_DEV_API_TARGET = "http://maquina-de-pruebas.local:9999";
    const cfg = await cargarConfig();
    expect(cfg.server?.proxy?.["/api"]?.target).toBe("http://maquina-de-pruebas.local:9999");
    expect(cfg.server?.proxy?.["/socket.io"]?.target, "el socket se quedó donde estaba").toBe("http://maquina-de-pruebas.local:9999");
  });
});

// MUTANTES previstos:
//   MD1 · volver a poner el literal de producción              ⇒ cae P1
//   MD2 · cambiar la API y dejar el socket en producción       ⇒ cae P2 (la asimetría clásica)
//   MD3 · ignorar `ALEF_DEV_API_TARGET`                        ⇒ cae P3
//
// ⚠️ TRAMPA (que mordió al escribir esto): si la configuración se exporta como OBJETO, `defineConfig` la devuelve tal cual
// y el `import` se cachea entre casos, así que P3 leería lo que construyó P1 y daría verde midiendo el caché. Se resuelve
// con `vi.resetModules()`. El primer intento usaba una marca de tiempo en la ruta del import y vite lo rechaza.

/**
 * ⭐⭐ SEGUNDA PARTE · LA PUERTA POR LA QUE SE PASA DE VERDAD NO ERA EL PROXY.
 *
 * Nace del ataque independiente a D-603. Al contar los consumidores (Art. 3) salió esto, VERIFICADO:
 * en `tpv`, `carta` y `shop` NADIE pide por la ruta relativa `/api`. Todo sale por
 * `axios.create({ baseURL: VITE_API_URL })` y los sockets por `VITE_SOCKET_URL`, URLs ABSOLUTAS.
 * O sea: por el proxy que vigilan P1-P3 no pasa ni una petición. La puerta abierta es el `.env` del desarrollador.
 *
 * ⚠️ AISLAMIENTO (bloqueante B2 del ataque r2, y era grave): la primera versión de estas pruebas heredaba el shell y el
 * `.env` de la máquina. En el ordenador de quien SÍ está apuntado a producción —el único que necesita esta red— salían
 * DOS rojos sin ningún defecto (P-117: un rojo permanente no vigila, y enseña a ignorar la red). Ahora cada caso corre en
 * un directorio TEMPORAL con el entorno limpio: no se lee ni se toca el `.env` de nadie.
 *
 * ⚠️ Lo que estas redes NO prueban: que el grito se vea en una terminal de verdad. Eso lo cerró el revisor independiente
 * arrancando el servidor contra un host inexistente: sale antes del banner y el repintado de vite no lo borra.
 */
describe("D-603 · el desarrollo apuntando fuera de la máquina se GRITA", () => {
  let raiz, cwdOriginal, envOriginal;

  beforeEach(() => {
    // ⚠️ S3 del r3 y S1 del r4. Esta red se aísla con `process.chdir`, que en `worker_threads` **existe pero revienta al
    // llamarla**. Mi primera guarda preguntaba `typeof process.chdir === "function"` y por eso era CÓDIGO MUERTO: daba
    // true en hilos y el rojo seguía siendo un `TypeError` crudo. Lo que discrimina es INTENTARLO, no preguntar si está.
    // El pool va fijado a `forks` en la configuración (`test.pool`); esto es el segundo cinturón, ahora de verdad.
    try {
      process.chdir(process.cwd());
    } catch {
      throw new Error(
        "Esta red necesita el pool `forks`: se aísla con process.chdir, que no funciona en worker_threads. " +
        "Está fijado en vite.config.js -> test.pool; si lo has cambiado a `threads`, es eso.",
      );
    }
    cwdOriginal = process.cwd();
    envOriginal = { ...process.env };
    for (const clave of Object.keys(process.env)) {
      if (clave.startsWith("VITE_") || clave === "ALEF_DEV_API_TARGET") delete process.env[clave];
    }
    // El aviso se calla cuando corre vitest (para no salir en cada gate); estas pruebas son justo las que deben verlo.
    delete process.env.VITEST;
    raiz = mkdtempSync(join(tmpdir(), "alef-d603-"));
  });

  afterEach(() => {
    // En `threads` esto también revienta; el rojo útil ya lo dio el `beforeEach`, así que aquí sólo estorba.
    try { process.chdir(cwdOriginal); } catch { /* sin chdir no hubo chdir que deshacer */ }
    rmSync(raiz, { recursive: true, force: true });
    for (const clave of Object.keys(process.env)) delete process.env[clave];
    Object.assign(process.env, envOriginal);
    vi.restoreAllMocks();
  });

  // Arranca la configuración COMO LO HACE VITE y recoge lo que salió por consola.
  // ⚠️ El espía se pone ANTES de ejecutar la configuración: el grito sale durante esa llamada, no al importar.
  //
  // ⚠️⚠️ EL CAMBIO DE DIRECTORIO VA SÓLO ALREDEDOR DE LA LLAMADA, NUNCA DEL IMPORT. Al principio lo puse en el
  // `beforeEach` y las 13 pruebas se pusieron rojas de golpe — pero no por la propiedad: el objeto de configuración de la
  // carta se construye al importar, y ahí se instancia el plugin de traducciones, que busca `lingui.config.js` en el
  // directorio actual. Un rojo que no viene de lo que se vigila es un arnés roto, no una red roja (P-140). Importamos con
  // el directorio del paquete, y sólo movemos el directorio para la llamada, que es donde `loadEnv` lee los `.env`.
  const arrancar = async (command, mode = "development") => {
    vi.resetModules();
    const dichos = [];
    vi.spyOn(console, "warn").mockImplementation((m) => { dichos.push(String(m)); });
    const mod = await import("../../vite.config.js");
    process.chdir(raiz);
    try {
      const cfg = typeof mod.default === "function" ? mod.default({ mode, command }) : mod.default;
      return { cfg, dicho: dichos.join("\n") };
    } finally {
      process.chdir(cwdOriginal);
    }
  };

  const ficheroEnv = (nombre, contenido) => writeFileSync(join(raiz, nombre), contenido);

  it("P4 · CONTROL · con todo en local no grita (si gritara siempre, las de abajo valdrían cero)", async () => {
    const { dicho } = await arrancar("serve");
    expect(dicho, `la consola dijo: ${dicho}`).toBe("");
  });

  it("P5 · el proxy apuntando a producción se grita, con código contable y con el valor dentro", async () => {
    process.env.ALEF_DEV_API_TARGET = "https://api.softalef.com";
    const { dicho } = await arrancar("serve");
    expect(dicho, "no salió ningún aviso").toContain("ALEF-DEV-DESTINO-FUERA");
    expect(dicho, "el aviso no dice a dónde apunta").toContain("https://api.softalef.com");
  });

  it("P6 · ⭐ LA PUERTA DE VERDAD · `VITE_API_URL` a producción se grita (el proxy ni se toca)", async () => {
    // Éste es el caso que D-603 no cubría: el proxy queda en local y aun así el navegador habla con producción,
    // porque el cliente de axios usa la URL absoluta de esta variable.
    process.env.VITE_API_URL = "https://api.softalef.com/api";
    const { cfg, dicho } = await arrancar("serve");
    expect(cfg.server?.proxy?.["/api"]?.target, "control: el proxy sigue en local").toMatch(/localhost|127\.0\.0\.1/);
    expect(dicho, "el destino real de las peticiones no se avisó").toContain("VITE_API_URL");
    expect(dicho).toContain("ALEF-DEV-DESTINO-FUERA");
  });

  it("P7 · el socket también cuenta como destino", async () => {
    process.env.VITE_SOCKET_URL = "https://api.softalef.com";
    const { dicho } = await arrancar("serve");
    expect(dicho).toContain("VITE_SOCKET_URL");
  });

  it("P8 · ⭐ NO ES UNA LISTA DE NOMBRES · una variable de destino inventada hoy también se avisa", async () => {
    // Cicatriz D-268: «la lista negra no sabe de campos nuevos». El barrido mira CUALQUIER variable `VITE_*` cuyo valor
    // sea un destino fuera de la máquina, con una lista corta y visible de las que NO son destino (ver E7).
    process.env.VITE_PASARELA_COBROS_URL = "https://api.softalef.com/pagos";
    const { dicho } = await arrancar("serve");
    expect(dicho, "sólo mira los nombres que ya conocía").toContain("VITE_PASARELA_COBROS_URL");
  });

  it("P9 · al COMPILAR no grita: ahí apuntar a producción es lo correcto", async () => {
    // Un aviso que salta también cuando todo está bien deja de leerse a la tercera vez.
    process.env.VITE_API_URL = "https://api.softalef.com/api";
    process.env.ALEF_DEV_API_TARGET = "https://api.softalef.com";
    const { dicho } = await arrancar("build");
    expect(dicho, `gritó al compilar: ${dicho}`).toBe("");
  });

  it("E1 · ⭐⭐ EL FICHERO `.env` · el destino escrito en un fichero se grita igual que el del shell", async () => {
    // BLOQUEANTE B1 del ataque r2. Todas las pruebas de arriba mueven `process.env`, y el riesgo declarado en la ficha
    // D-643 es el OTRO camino: el `.env` real de cada máquina. Se podía apagar entero el lector de ficheros
    // (`loadEnv` → `process.env`) y las nueve seguían verdes. Aquí no se toca `process.env`: sólo hay un fichero.
    ficheroEnv(".env", "VITE_API_URL=https://api.softalef.com/api\n");
    expect(process.env.VITE_API_URL, "control: el shell está limpio, el dato sólo puede venir del fichero").toBeUndefined();
    const { dicho } = await arrancar("serve");
    expect(dicho, "el destino escrito en el fichero .env no se avisó").toContain("VITE_API_URL");
    expect(dicho).toContain("https://api.softalef.com/api");
  });

  it("E2 · el fichero del MODO en curso también se lee (`.env.development`)", async () => {
    // Mata al mutante que lee el `.env` de un modo fijo: un `.env.development` apuntado a producción quedaría invisible.
    ficheroEnv(".env.development", "VITE_SOCKET_URL=https://api.softalef.com\n");
    const { dicho } = await arrancar("serve", "development");
    expect(dicho, "no se leyó el fichero del modo en curso").toContain("VITE_SOCKET_URL");
  });

  it("E3 · si hay VARIOS destinos fuera, los nombra TODOS (no sólo el primero)", async () => {
    process.env.VITE_API_URL = "https://api.softalef.com/api";
    process.env.VITE_SOCKET_URL = "https://api.softalef.com";
    const { dicho } = await arrancar("serve");
    expect(dicho, "se dejó uno sin nombrar").toContain("VITE_API_URL");
    expect(dicho, "se dejó uno sin nombrar").toContain("VITE_SOCKET_URL");
  });

  it("E4 · NO da falsa alarma con formas locales raras (sin esquema, 127.x, IPv6 mapeada)", async () => {
    // Un aviso que miente entrena a ignorarlo — el mismo argumento con el que P9 existe.
    // `localhost:3000` sin esquema lo admite un `.env` y mucha gente lo escribe.
    process.env.VITE_SOCKET_URL = "localhost:3000";
    process.env.VITE_API_URL = "http://127.0.0.2:3000/api";
    process.env.VITE_OTRA_URL = "http://[::ffff:127.0.0.1]/api";
    const { dicho } = await arrancar("serve");
    expect(dicho, `falsa alarma: ${dicho}`).toBe("");
  });

  it("E5 · corriendo las PRUEBAS no grita: si no, sale en cada gate y se acaba ignorando", async () => {
    process.env.VITEST = "true";
    process.env.VITE_API_URL = "https://api.softalef.com/api";
    const { dicho } = await arrancar("serve");
    expect(dicho, `gritó dentro de vitest: ${dicho}`).toBe("");
  });

  it("E6 · un destino cuyo nombre NO acaba en URL también se avisa", async () => {
    // El filtro anterior era `VITE_*URL`: `VITE_API_BASE` o `VITE_BACKEND` se colaban. Eso seguía siendo una lista,
    // sólo que de sufijos.
    process.env.VITE_API_BASE = "https://api.softalef.com";
    const { dicho } = await arrancar("serve");
    expect(dicho, "el barrido sigue mirando el sufijo del nombre").toContain("VITE_API_BASE");
  });

  it("E8 · CADA forma de «mi máquina» se reconoce, no sólo `localhost`", async () => {
    // RY1/RY2 del ataque r3: la lista de formas locales tenía cuatro entradas y la red ejercía UNA. Se podían borrar
    // las otras tres con la suite en verde (ceguera de población). Y `0.0.0.0` es lo que el propio servidor usa para
    // escuchar, así que es un valor que la gente escribe. RY4: sin recortar espacios, `" localhost:3000 "` avisaba.
    process.env.VITE_A_URL = "http://0.0.0.0:3000/api";
    process.env.VITE_B_URL = "http://[::1]:3000";
    process.env.VITE_C_URL = "http://127.0.0.1:3000";
    process.env.VITE_D_URL = "localhost:3000";
    process.env.VITE_E_URL = "  localhost:3000  ";
    process.env.VITE_F_URL = "http://localhost.localdomain:3000";
    const { dicho } = await arrancar("serve");
    expect(dicho, `falsa alarma: ${dicho}`).toBe("");
  });

  it("E9 · el FAIL-OPEN declarado está donde dice estar (Art. 5: la decisión escrita, PROBADA)", async () => {
    // El `catch` de la configuración es una decisión: lo que no se puede leer como URL NO se avisa. Estaba declarada
    // por escrito y no la vigilaba nadie — se podía invertir a fail-closed con la suite en verde (P-145: afirmar la
    // intención sin probar el efecto). Un puerto fuera de rango hace reventar al lector de URLs.
    process.env.VITE_API_URL = "http://localhost:99999";
    const { dicho } = await arrancar("serve");
    expect(dicho, `el fail-open declarado no se cumple: ${dicho}`).toBe("");
  });

  it("E10 · `algo:número` que NO es un anfitrión no se lee como destino (una hora, una versión)", async () => {
    // Falsa alarma que creó el arreglo de la ronda 2: al admitir `anfitrión:puerto` sin esquema, `04:00` se leía como
    // el anfitrión `0.0.0.4`. En una casa cuyo corte de día operativo es literalmente 04:00, es una trampa para mañana.
    process.env.VITE_CORTE = "04:00";
    process.env.VITE_VERSION = "1.2.3:4";
    const { dicho } = await arrancar("serve");
    expect(dicho, `falsa alarma: ${dicho}`).toBe("");
  });

  // ── El grito tiene que poder CONTARSE (Art. 5) ─────────────────────────────────────────────
  // Bloqueante con el que el revisor externo devolvió el lote: un código estable en la consola NO es contable,
  // porque la consola se borra. Sin esto, el primer tiempo del Art. 7 no produce la evidencia que permitiría
  // decidir el segundo. Estas tres redes miran el FICHERO, que es donde se puede contar de verdad.
  const REGISTRO = ".alef-destinos-fuera.log";
  const leerRegistro = () => (existsSync(join(raiz, REGISTRO)) ? readFileSync(join(raiz, REGISTRO), "utf8") : "");

  it("E11 · cada arranque apuntando fuera deja una línea ANOTADA, no sólo un grito en pantalla", async () => {
    process.env.VITE_API_URL = "https://api.softalef.com/api";
    const { dicho } = await arrancar("serve");
    const anotado = leerRegistro();
    expect(dicho, "control: además del fichero, sigue gritando").toContain("ALEF-DEV-DESTINO-FUERA");
    expect(anotado, "no quedó nada anotado: el aviso no se puede contar").toContain("ALEF-DEV-DESTINO-FUERA");
    expect(anotado, "el apunte no dice QUÉ apuntaba fuera").toContain("VITE_API_URL=https://api.softalef.com/api");
  });

  it("E12 · ⭐ el registro ACUMULA: dos arranques, dos líneas (si se sobrescribe, no hay nada que contar)", async () => {
    process.env.VITE_API_URL = "https://api.softalef.com/api";
    await arrancar("serve");
    await arrancar("serve");
    const lineas = leerRegistro().trim().split("\n").filter(Boolean);
    expect(lineas.length, `líneas en el registro tras dos arranques: ${lineas.length}`).toBe(2);
  });

  it("E13 · si NO se puede anotar, se grita igual (el contador no puede callar al aviso)", async () => {
    // Se pone un DIRECTORIO donde iría el fichero: escribir ahí revienta. El aviso es lo que protege; el contador
    // sólo sirve para decidir el segundo tiempo, así que su fallo no puede llevarse por delante al aviso.
    mkdirSync(join(raiz, REGISTRO));
    process.env.VITE_API_URL = "https://api.softalef.com/api";
    const { dicho } = await arrancar("serve");
    expect(dicho, "el fallo al anotar se llevó por delante el aviso").toContain("ALEF-DEV-DESTINO-FUERA");
  });

  it("E14 · CONTROL · si no hay nada que avisar, NI SIQUIERA SE CREA el registro", async () => {
    // ⚠️ La primera versión de este caso exigía que el registro estuviera VACÍO, y con eso sobrevivía el mutante que
    // anota siempre (anotar una cadena vacía crea el fichero y lo deja vacío: verde con el defecto dentro, otra vez).
    // Lo que hay que afirmar es que el fichero NO EXISTE: un arranque limpio no deja rastro.
    await arrancar("serve");
    expect(existsSync(join(raiz, REGISTRO)), "se creó el registro sin haber nada que avisar").toBe(false);
  });

  it("E7 · lo que NO es un destino no se avisa (ni el texto suelto ni el canal de observabilidad)", async () => {
    // El precio de barrer por valor es la falsa alarma. La lista de exclusión es CORTA y está a la vista en el código.
    process.env.VITE_NOMBRE_RESTAURANTE = "Mi Restaurante";
    process.env.VITE_TENANT_ID = "tres-catorce";
    process.env.VITE_SENTRY_DSN = "https://clave@o123.ingest.sentry.io/456";
    const { dicho } = await arrancar("serve");
    expect(dicho, `falsa alarma: ${dicho}`).toBe("");
  });
});

// MUTANTES previstos (segunda parte):
//   MD4 · quitar la llamada al aviso dentro de la configuración        ⇒ caen P5, P6, P7, P8, E1…
//   MD5 · gritar siempre, sin mirar si es `serve`                      ⇒ cae P9
//   MD6 · volver al filtro por sufijo del nombre (`VITE_*URL`)         ⇒ cae E6
//   MD7 · dar por local cualquier destino (el reconocedor miente)      ⇒ caen P5, P6, P7, P8, E1…
//   RX1 · dejar de leer los ficheros `.env` (sólo `process.env`)       ⇒ cae E1   ← lo trajo el ataque r2
//   RX2 · nombrar sólo el primer destino fuera                         ⇒ cae E3   ← lo trajo el ataque r2
//   RX3 · leer el `.env` de un modo fijo en vez del modo en curso      ⇒ cae E2   ← lo trajo el ataque r2
//   RX4 · quitar la excepción de vitest (gritar en cada gate)          ⇒ cae E5
//   RX5 · volver al reconocedor sin formas locales raras               ⇒ cae E4
