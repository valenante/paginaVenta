// src/components/Reservas/FiltroFechaReservas.jsx
//
// ⚖️ D-445 · El filtro de fecha de reservas, que SEÑALA los días con reserva.
//
// ── POR QUÉ NO ES UN <input type="date"> ───────────────────────────────────────────────
// Porque no se puede pintar. El calendario de un `<input type="date">` lo dibuja el NAVEGADOR
// y a sus días no llega ninguna hoja de estilos. Para marcar días concretos hace falta un
// calendario propio. Se usa `react-datepicker`, que YA era dependencia y que ya se usa en
// `ReservasAjustesPage.jsx:384` — no se mete librería nueva (CLAUDE.md: no duplicar utilidades).
//
// ── EL DATO YA EXISTÍA ─────────────────────────────────────────────────────────────────
// `GET /reservas/fechasReserva` devuelve las fechas con reserva en `YYYY-MM-DD`, agrupadas por
// día y **excluyendo las rechazadas**. ⭐ Censo Art. 3: no la llamaba NADIE. Estaba construida
// y sin llamador.
//
// ── EL CONTRATO DE ESTE COMPONENTE ─────────────────────────────────────────────────────
// Habla en `YYYY-MM-DD` hacia fuera —igual que el `<input type="date">` al que sustituye— para
// que la página no tenga que cambiar cómo guarda ni cómo consulta. Dentro usa `Date` porque es
// lo que pide la librería. ⚠️ La conversión es LOCAL a propósito: `new Date("2026-09-15")` se
// interpreta en UTC y en España pinta el día 14. Ese error de un día es justo el que hace que
// un calendario "casi funcione".
import React, { useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./FiltroFechaReservas.css";

/** "2026-09-15" → Date local (NO `new Date(str)`, que lo lee como UTC y resta un día). */
function aFechaLocal(iso) {
  if (!iso || typeof iso !== "string") return null;
  const [a, m, d] = iso.split("-").map(Number);
  if (!a || !m || !d) return null;
  return new Date(a, m - 1, d);
}

/** Date → "2026-09-15" en hora LOCAL (`toISOString()` volvería a UTC y restaría el día). */
function aIsoLocal(fecha) {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
}

export default function FiltroFechaReservas({
  value,
  onChange,
  diasConReserva = [],
  disabled = false,
  // sólo para las pruebas: deja el calendario desplegado sin tener que simular el clic
  abiertoPorDefecto = false,
}) {
  // Conjunto para que la comprobación por día sea directa y no un recorrido del array
  // por cada celda del mes (el calendario llama a `dayClassName` ~42 veces por render).
  const conReserva = useMemo(
    () => new Set(Array.isArray(diasConReserva) ? diasConReserva : []),
    [diasConReserva]
  );

  return (
    <DatePicker
      selected={aFechaLocal(value)}
      onChange={(d) => onChange?.(aIsoLocal(d))}
      dateFormat="yyyy-MM-dd"
      placeholderText="Todas las fechas"
      className="alef-filtro-fecha"
      calendarClassName="alef-calendario"
      disabled={disabled}
      isClearable={!disabled}
      open={abiertoPorDefecto || undefined}
      // ⭐ Aquí está lo que pidió Valen: la marca por día.
      dayClassName={(d) => (conReserva.has(aIsoLocal(d)) ? "dia-con-reserva" : undefined)}
    />
  );
}
