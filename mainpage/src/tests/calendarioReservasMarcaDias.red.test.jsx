/**
 * ⚖️ D-445 · EL FILTRO DE FECHA DE RESERVAS NO SEÑALA LOS DÍAS QUE TIENEN RESERVA.
 *
 * ── LO QUE PIDIÓ VALEN ──────────────────────────────────────────────────────────────────
 * «En filtros de la pantalla de reservas, que los días que hubiera reserva salieran del celeste
 * de Alef.»
 *
 * ── POR QUÉ NO SE PODÍA ─────────────────────────────────────────────────────────────────
 * El filtro era un `<input type="date">` NATIVO: el calendario lo dibuja el navegador y **a sus
 * días no llega ninguna hoja de estilos**. No es difícil, es imposible. Hay que cambiar el
 * componente por `react-datepicker`, que YA está instalado y que ya se usa en los ajustes de
 * reservas — no se mete dependencia nueva.
 *
 * ── LOS DATOS YA EXISTÍAN, Y NADIE LOS PEDÍA ────────────────────────────────────────────
 * ⭐ `GET /reservas/fechasReserva` (`reservas.service.js:927`) ya devuelve las fechas con reserva
 * agrupadas por día y **excluyendo las rechazadas**, en formato `YYYY-MM-DD`. Censo Art.3: **no
 * la llamaba NADIE** — ni panel, ni TPV, ni carta. Capacidad construida y sin llamador.
 * Medido antes de decidir: hoy devuelve 2 fechas en zabor-feten, 0 en bodegón y 4 en
 * tres-catorce ⇒ **no hace falta acotarla por mes**; sería resolver un problema que no existe.
 *
 * ── QUÉ COMPRUEBA ESTA RED ──────────────────────────────────────────────────────────────
 * ⭐ La GARANTÍA que el usuario ve —«el día 15 se distingue de los demás»—, no la forma del
 * arreglo. Por eso mira la CLASE del día, que es lo que el usuario percibe como color, y no si
 * se llamó a tal función o si el hex es tal.
 *
 * ⚠️ NACEN ROJAS D1 y D2. C0 nace verde y debe seguir verde.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import FiltroFechaReservas from "../components/Reservas/FiltroFechaReservas";

/** Días con reserva que devolvería el backend, en su formato real. */
const CON_RESERVA = ["2026-09-15", "2026-09-18"];

function pintar(props = {}) {
  return render(
    <FiltroFechaReservas
      value="2026-09-15"
      onChange={() => {}}
      diasConReserva={CON_RESERVA}
      {...props}
    />
  );
}

/** Busca la celda de un día concreto dentro del calendario abierto. */
function celdaDia(numero) {
  return document.querySelector(`.react-datepicker__day--0${numero}`);
}

describe("D-445 · el calendario señala los días con reserva", () => {
  beforeEach(() => vi.useRealTimers());

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // C0 · CONTROL · el calendario se abre y pinta días. Sin esto, un "no tiene la clase"
  //      de abajo sería trivialmente cierto porque no habría ningún día que mirar.
  // ═══════════════════════════════════════════════════════════════════════════════════════
  it("C0 · CONTROL · el calendario se despliega y muestra los días del mes", () => {
    pintar({ abiertoPorDefecto: true });
    const dias = document.querySelectorAll(".react-datepicker__day");
    expect(dias.length, "no hay ni un día pintado: el calendario no se abrió").toBeGreaterThan(27);
  });

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // D1 · LO QUE PIDIÓ VALEN: el día con reserva se distingue.
  // ═══════════════════════════════════════════════════════════════════════════════════════
  it("D1 · un día CON reserva lleva la marca de Alef", () => {
    pintar({ abiertoPorDefecto: true });
    const dia15 = celdaDia(15);
    expect(dia15, "no encuentro la celda del día 15").toBeTruthy();
    expect(
      dia15.className,
      `el día 15 tiene reserva y sale igual que los demás (clases: "${dia15.className}")`,
    ).toContain("dia-con-reserva");
  });

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // D3 · EL ERROR DE UN DÍA. `new Date("2026-09-15")` se interpreta en UTC; en España eso
  //      pinta el 14. Un calendario con ese fallo "casi funciona" y es de los peores de ver:
  //      todo cuadra menos el día. Verificado: sin este caso, el mutante que usa
  //      `new Date(iso)` SOBREVIVÍA con los tres verdes.
  // ═══════════════════════════════════════════════════════════════════════════════════════
  //      ⚠️ CORRECCIÓN DE MI DIAGNÓSTICO, medida: en Madrid (UTC+2 en septiembre)
  //      `new Date("2026-09-15").getDate()` da **15**, así que aquí el defecto NO se ve y el
  //      mutante sobrevivía. Donde sí se ve es al OESTE de Greenwich — y ahí está el Bodegón
  //      Argentino (UTC−3), que pintaría el 14. Por eso el caso fija el huso.
  it("D3 · marca el día correcto también en Argentina, no el anterior", () => {
    const tzOriginal = process.env.TZ;
    process.env.TZ = "America/Argentina/Buenos_Aires";
    try {
    pintar({ abiertoPorDefecto: true });
    const dia14 = celdaDia(14);
    expect(dia14, "no encuentro la celda del día 14").toBeTruthy();
    expect(
      dia14.className,
      "marca el 14 teniendo la reserva el 15: la fecha se lee en UTC en vez de en local, y en Argentina eso es un dia menos",
    ).not.toContain("dia-con-reserva");
    } finally { process.env.TZ = tzOriginal; }
  });

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // D2 · CONTROL NEGATIVO · un día SIN reserva NO la lleva. Sin esto, "marcarlos todos"
  //      pasaría D1 y no serviría de nada.
  // ═══════════════════════════════════════════════════════════════════════════════════════
  it("D2 · un día SIN reserva no la lleva", () => {
    pintar({ abiertoPorDefecto: true });
    const dia16 = celdaDia(16);
    expect(dia16, "no encuentro la celda del día 16").toBeTruthy();
    expect(
      dia16.className,
      "el día 16 no tiene reserva y aparece marcado: marcarlos todos es no marcar ninguno",
    ).not.toContain("dia-con-reserva");
  });
});
