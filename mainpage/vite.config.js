import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { appendFileSync } from "node:fs";

/**
 * ⭐⭐⭐ D-642 · AQUÍ EL PROXY **SÍ** ES LA PUERTA, AL REVÉS QUE EN `tpv` Y `carta`.
 *
 * Este bloque es el GEMELO byte a byte del de `alef/tpv/vite.config.js` y `alef/carta/vite.config.js`
 * (lote D-603, 16-sep) — mismo código, mismo código de evento, mismas 23 pruebas. Se duplica a
 * propósito: un import fuera del paquete rompería la compilación si el empaquetado copia sólo esta
 * carpeta, y eso es peor que repetir el bloque. La divergencia la caza la red, que está en los tres.
 *
 * ⚠️ PERO LA CONCLUSIÓN DE D-603 NO SE COPIA. Allí el censo (Art. 3) demostró que por el proxy **no
 * pasaba ni una petición**: `tpv`, `carta` y `shop` llaman con URLs ABSOLUTAS (`VITE_API_URL`), así que
 * endurecer el proxy no cerraba nada (ficha D-643, «guardia en una puerta muerta»). **En el panel es
 * justo al revés y por eso es el peligroso de verdad (D-642):** su `.env` usa RUTAS RELATIVAS
 * (`VITE_API_URL=/api`, `VITE_SOCKET_URL=/`), así que **toda** petición del panel en desarrollo entra
 * por este proxy. Con el destino anterior —`https://api.softalef.com`, sin palanca y sin aviso—
 * abrir el panel en local y tocar un tenant real **escribía en producción**.
 *
 * ⚠️ MATIZ MEDIDO EL 17-SEP, porque la ficha D-642 podía leerse peor de lo que es: en el ÚLTIMO COMMIT
 * (`ef59242`) el `.env` del repositorio dice `VITE_API_URL=http://localhost:3000/api` — o sea que **una
 * copia recién clonada no pasaba por el proxy**. El `.env` con rutas relativas es una modificación sin
 * commitear del árbol de trabajo de Valen, del 13-ago. La puerta abierta era REAL, pero en la máquina
 * de quien trabaja, no en el repositorio. Las dos cosas quedan cerradas con esto: el destino por
 * defecto es tu propia máquina, y si alguien apunta fuera, **se grita y se puede contar**.
 *
 * ⭐ El panel escribe precios, carta y configuración. Por eso el revisor externo lo declaró PROHIBIDO
 * como instrumento de prueba hasta arreglar esto.
 */
/**
 * ⭐⭐ D-603 · EL PROXY DE DESARROLLO APUNTABA A PRODUCCIÓN, Y POR DEFECTO.
 * Arrancar `npm run dev` abría un túnel contra `https://api.softalef.com`, que es **la API que sirve a clientes reales**.
 * El tenant se decide por el primer tramo de la URL, así que bastaba teclear mal un slug para estar tocando el
 * restaurante de otro. El propio fichero lo avisaba por escrito («⚠️ Esto habla con la API que sirve a CLIENTES REALES»),
 * que es tanto como decir que se sabía y se dejó: un aviso no es una salvaguarda.
 *
 * ⭐ DECISIÓN DE VALEN (15-sep): **a local por defecto**. Para ir contra producción hay que pedirlo A PROPÓSITO con
 * `ALEF_DEV_API_TARGET=https://api.softalef.com npm run dev`, y el arranque lo GRITA por consola.
 */
const DESTINO_DEV = process.env.ALEF_DEV_API_TARGET || "http://localhost:3000";

/**
 * ⭐⭐ D-603 · SEGUNDA PARTE: LA PUERTA DE VERDAD NO ERA EL PROXY DE AQUÍ ABAJO.
 *
 * Me lo sacó el ataque independiente. Al contar los consumidores (Art. 3) el censo dice, VERIFICADO:
 * en `carta`, `tpv` y `shop` NADIE pide por la ruta relativa `/api`. Todas las llamadas salen por
 * `axios.create({ baseURL: VITE_API_URL })` (carta/src/services/alefService.js:28, tpv/src/utils/api.js:19)
 * y los sockets por `VITE_SOCKET_URL` (carta/src/utils/socket.js:4): URLs ABSOLUTAS las dos.
 * Conclusión: por el proxy de abajo NO PASA NI UNA PETICIÓN. Endurecerlo estaba bien y no cerró nada.
 *
 * La puerta que sí está abierta es el `.env` del desarrollador: si ahí pone la API de producción,
 * `npm run dev` habla con clientes reales y esta configuración no se enteraba. Esto lo GRITA.
 *
 * ⚠️ GRITA, NO IMPIDE (Art. 7: nada que empiece a decir que no entra de golpe) y sólo al arrancar el
 * servidor de desarrollo: al COMPILAR, apuntar a producción es lo correcto, y un aviso que salta
 * siempre deja de leerse (Art. 5: el grito tiene que significar algo y poder contarse).
 *
 * ⚠️ GEMELO de `carta/vite.config.js`. Decisión deliberada de DUPLICAR en vez de compartir módulo: un
 * import fuera del paquete rompería la compilación si el empaquetado copia sólo esta carpeta, y eso es
 * mucho peor que repetir 20 líneas. La divergencia la caza la red, que está en los dos paquetes
 * (`src/tests/proxyDeDesarrolloApuntaALocal.red.test.js`, copias byte a byte).
 */
export const CODIGO_DESTINO_FUERA = "ALEF-DEV-DESTINO-FUERA";

// Variables `VITE_*` que NO son un destino aunque su valor sea una URL. Lista CORTA y a la vista: el barrido mira el
// VALOR, así que lo que hay que mantener es esta excepción —no un catálogo de nombres buenos, que es justo la cicatriz
// D-268 («la lista negra no sabe de campos nuevos»).
const NO_SON_DESTINO = new Set(["VITE_SENTRY_DSN"]);

// ⚠️ Las CUATRO primeras son las que escribe la gente; `localhost.localdomain` es la otra entrada estándar de
// `/etc/hosts` para 127.0.0.1. Cada una tiene su caso en la red (E8): antes sólo se ejercía `localhost` y se
// podían borrar las demás con la suite en verde.
const MAQUINA_LOCAL = new Set(["localhost", "0.0.0.0", "::1", "[::1]", "localhost.localdomain"]);

const esAnfitrionLocal = (anfitrion) =>
  MAQUINA_LOCAL.has(anfitrion) ||
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(anfitrion) ||         // TODO 127.0.0.0/8 es tu máquina, no sólo el .0.1
  /^\[::ffff:7f[0-9a-f]{2}:[0-9a-f]{1,4}\]$/i.test(anfitrion);  // la misma, escrita como IPv6 mapeada

// `localhost:3000` SIN esquema lo admite un `.env` y mucha gente lo escribe. Sin esta línea se lee como si «localhost:»
// fuera el esquema, el anfitrión sale vacío y se avisaba de un destino que es tu propia máquina. Un aviso que miente
// entrena a ignorarlo, que es el mismo motivo por el que no se grita al compilar.
// ⚠️ Y `04:00` NO es un anfitrión. Al admitir `anfitrion:puerto` sin esquema se colaba la hora del corte de día
// operativo —que en esta casa es literalmente 04:00— leída como la máquina `0.0.0.4`. Para pasar por anfitrión hay
// que tener alguna letra o ser cuatro números con puntos.
// ⚠️ LÍMITE QUE ESTO ABRE, dicho a propósito (lo midió el ataque r4): una IP escrita como ENTERO decimal con puerto
// (`3232235777:80`) deja de avisarse. Exposición medida hoy: **0** — ninguna variable del árbol tiene esa forma, y
// nadie escribe una IP así a mano. Se prefiere el silencio en ese caso raro antes que la falsa alarma en `04:00`,
// que es una forma que esta casa usa de verdad. Y al revés: `cache:6379` o `main:1234` SÍ avisan, porque son
// anfitriones con nombre, y eso es correcto aunque sorprenda.
const PARECE_ANFITRION = /^(?=.*[A-Za-z])[A-Za-z0-9.\-_]+$|^\d{1,3}(\.\d{1,3}){3}$/;

const conEsquema = (valor) => {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(valor)) return valor;
  const conPuerto = /^([A-Za-z0-9.\-_]+):\d{1,5}$/.exec(valor);
  return conPuerto && PARECE_ANFITRION.test(conPuerto[1]) ? `http://${valor}` : valor;
};

const apuntaFueraDeLaMaquina = (valor) => {
  if (!valor) return false;
  try {
    // Se mira el ANFITRIÓN, no si la cadena contiene «localhost»: `https://malo.com/?x=localhost` pasaba el filtro
    // anterior. Una ruta relativa (`/api`) o un texto suelto resuelven contra localhost ⇒ no son un destino de fuera.
    return !esAnfitrionLocal(new URL(conEsquema(String(valor).trim()), "http://localhost").hostname);
  } catch {
    return false; // LÍMITE DICHO: `VITE_API_URL=api.softalef.com` (sin esquema y sin puerto) se lee como ruta
  }               // relativa y NO se avisa. Tampoco funcionaría como destino, pero el reconocedor no lo distingue.
};

// ⚠️ Art. 5, y es el BLOQUEANTE con el que el revisor externo me devolvió el lote: un fail-open legítimo tiene que
// estar decidido, GRITAR y **poder contarse**. Un código estable en la consola no es contable: la consola se borra.
// Esto deja una línea por arranque en un fichero local —ignorado por git, nunca sale de tu máquina— para poder
// responder mecánicamente «¿cuántas veces pasó desde X?»:
//
//     grep -c ALEF-DEV-DESTINO-FUERA .alef-destinos-fuera.log
//
// Deliberadamente DOMÉSTICO: ni servicio, ni red, ni infraestructura nueva. El revisor lo pidió mínimo y tiene razón.
export const REGISTRO_DESTINOS = ".alef-destinos-fuera.log";

const anotarEnFichero = (linea) => {
  // ⚠️ No poder anotar NUNCA puede impedir arrancar ni callar el aviso: el aviso es lo que protege, el contador
  // sólo sirve para decidir el segundo tiempo. Si el disco está lleno o el fichero es ilegible, se grita igual.
  try {
    appendFileSync(REGISTRO_DESTINOS, linea);
  } catch { /* se sigue gritando */ }
};

export const avisarDestinosFuera = (variables, avisar = console.warn, anotar = anotarEnFichero) => {
  // ⚠️ Barre por VALOR, no por nombre: cualquier `VITE_*` cuyo destino esté fuera de la máquina, incluidas las que
  // alguien añada mañana sin acordarse de este fichero. El filtro por sufijo que había antes (`VITE_*URL`) dejaba
  // pasar `VITE_API_BASE`, `VITE_API_HOST` o `VITE_BACKEND`: seguía siendo una lista, sólo que de sufijos.
  const fuera = Object.entries(variables)
    .filter(([clave]) => (clave.startsWith("VITE_") && !NO_SON_DESTINO.has(clave)) || clave === "ALEF_DEV_API_TARGET")
    .filter(([, valor]) => apuntaFueraDeLaMaquina(valor));
  if (fuera.length === 0) return fuera;
  // Primero se ANOTA y después se grita: si gritar rompiera, el dato ya está en disco.
  anotar(`${new Date().toISOString()}\t${CODIGO_DESTINO_FUERA}\t${fuera.map(([c, v]) => `${c}=${v}`).join(" ")}\n`);
  avisar(
    `\n⚠️  ${CODIGO_DESTINO_FUERA} · EL DESARROLLO APUNTA FUERA DE TU MÁQUINA:\n` +
      fuera.map(([clave, valor]) => `   · ${clave} = ${valor}`).join("\n") +
      `\n   Si eso es producción, lo que hagas aquí lo verán CLIENTES REALES.\n` +
      `   (queda anotado en ${REGISTRO_DESTINOS}; cuéntalo con: grep -c ${CODIGO_DESTINO_FUERA} ${REGISTRO_DESTINOS})\n`,
  );
  return fuera;
};


const configuracion = {
  plugins: [react()],
  server: {

    // ── Proxy SOLO DE DESARROLLO ───────────────────────────────────────────────
    // ⭐ Destino POR DEFECTO: TU MÁQUINA. Para ir contra producción hay que pedirlo
    // a propósito desde el shell y el arranque lo GRITA:
    //     ALEF_DEV_API_TARGET=https://api.softalef.com npm run dev
    // Hace falta un proxy (y no basta apuntar la URL) porque en produccion la cookie
    // de sesion sale con `domain: ".softalef.com"` — un navegador servido desde
    // localhost no puede guardarla. `cookieDomainRewrite` se lo quita.
    // CSRF: no se falsea nada; csrf.js:14 ya admite cualquier origen http://localhost.
    // ⚠️ Esto habla con la API que sirve a CLIENTES REALES.
    proxy: {
      "/api": {
        target: DESTINO_DEV,
        changeOrigin: true,
        secure: DESTINO_DEV.startsWith("https"),
        cookieDomainRewrite: "",
      },
      "/socket.io": {
        target: DESTINO_DEV,
        changeOrigin: true,
        secure: DESTINO_DEV.startsWith("https"),
        ws: true,
      },
    },
    host: true,
    port: 5176,
    allowedHosts: [
      "alef.local.softalef.com",
      "carta.local.softalef.com",
      "tpv.local.softalef.com",
    ],
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
  // Tests de componente (mismo montaje que el TPV: tpv/vite.config.js:81-85).
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/tests/setup.js",
    // ⚠️ `forks` y no `threads`: la red de este bloque usa `process.chdir`, que en un worker de hilos
    // no existe. Con `threads` las pruebas de aislamiento no podían ni ejecutarse. Mismo motivo y
    // misma línea que en `tpv` y `carta`.
    pool: "forks",
  },
};

export default defineConfig(({ command, mode }) => {
  // `loadEnv` lee los ficheros `.env` Y las variables del shell. `ALEF_DEV_API_TARGET` se sigue
  // leyendo de `process.env` a propósito: es SÓLO de shell, y ponerla en un `.env` no debe encender
  // el túnel sin querer. Se inyecta ya resuelta para que el aviso diga a dónde apunta el proxy DE
  // VERDAD, no lo que alguien escribió en un fichero que se ignora.
  if (command === "serve" && !process.env.VITEST) {
    avisarDestinosFuera({ ...loadEnv(mode, process.cwd(), ""), ALEF_DEV_API_TARGET: DESTINO_DEV });
  }
  return configuracion;
});