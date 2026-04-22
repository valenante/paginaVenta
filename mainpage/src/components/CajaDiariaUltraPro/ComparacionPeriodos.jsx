import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { obtenerCajasPorRango } from "./ObtenerCajasPorRango";
import { toISODateKey, formatFechaUI } from "./cajaHelpers";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./ComparacionPeriodos.css";

/* =========================================================================
   Helpers
   ========================================================================= */

function agregarPorDia(datosRaw) {
  const map = {};
  datosRaw.forEach((d) => {
    const key = toISODateKey(d.fecha);
    if (!key) return;
    if (!map[key]) map[key] = { fecha: key, total: 0, numTickets: 0 };
    map[key].total += Number(d.total || 0);
    map[key].numTickets += Number(d.numTickets || 0);
  });
  return Object.values(map).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function computeKPIs(diarios) {
  const ingresos = diarios.reduce((s, d) => s + d.total, 0);
  const tickets = diarios.reduce((s, d) => s + d.numTickets, 0);
  const ticketMedio = tickets > 0 ? ingresos / tickets : 0;
  const mediaDiaria = diarios.length > 0 ? ingresos / diarios.length : 0;
  return { ingresos, tickets, ticketMedio, mediaDiaria, dias: diarios.length };
}

function pctDelta(a, b) {
  if (!b || b === 0) return null;
  return ((a - b) / b) * 100;
}

function formatDelta(pct) {
  if (pct == null) return "—";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function deltaClass(pct) {
  if (pct == null) return "neutral";
  if (pct > 0) return "up";
  if (pct < 0) return "down";
  return "neutral";
}

/** Sugiere periodo B automáticamente: mismo rango pero justo antes de A */
function sugerirPeriodoB(inicioA, finA) {
  const start = new Date(`${inicioA}T00:00:00`);
  const end = new Date(`${finA}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { inicio: "", fin: "" };

  const duracionMs = end - start;
  const nuevoFin = new Date(start.getTime() - 86400000); // día anterior al inicio de A
  const nuevoInicio = new Date(nuevoFin.getTime() - duracionMs + 86400000);

  return {
    inicio: nuevoInicio.toISOString().slice(0, 10),
    fin: nuevoFin.toISOString().slice(0, 10),
  };
}

/* =========================================================================
   Component
   ========================================================================= */

export default function ComparacionPeriodos({ periodoA, tipoNegocio }) {
  const [bInicio, setBInicio] = useState("");
  const [bFin, setBFin] = useState("");
  const [datosB, setDatosB] = useState([]);
  const [loadingB, setLoadingB] = useState(false);
  const [errorB, setErrorB] = useState(null);
  const controllerRef = useRef(null);

  // Auto-sugerir periodo B al montar o cuando A cambia
  useEffect(() => {
    if (!periodoA?.fechaInicio || !periodoA?.fechaFin) return;
    const sugerido = sugerirPeriodoB(periodoA.fechaInicio, periodoA.fechaFin);
    setBInicio(sugerido.inicio);
    setBFin(sugerido.fin);
  }, [periodoA?.fechaInicio, periodoA?.fechaFin]);

  // Fetch periodo B
  const cargarB = useCallback(async () => {
    if (!bInicio || !bFin) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoadingB(true);
    setErrorB(null);

    try {
      const raw = await obtenerCajasPorRango(bInicio, bFin, tipoNegocio);
      if (controller.signal.aborted) return;
      setDatosB(Array.isArray(raw) ? raw : []);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setDatosB([]);
      setErrorB("Error al cargar el periodo de comparación.");
    } finally {
      if (!controller.signal.aborted) setLoadingB(false);
    }
  }, [bInicio, bFin, tipoNegocio]);

  useEffect(() => {
    cargarB();
    return () => controllerRef.current?.abort();
  }, [cargarB]);

  // Agregar
  const diariosA = useMemo(() => agregarPorDia(periodoA?.datos || []), [periodoA?.datos]);
  const diariosB = useMemo(() => agregarPorDia(datosB), [datosB]);

  const kpiA = useMemo(() => computeKPIs(diariosA), [diariosA]);
  const kpiB = useMemo(() => computeKPIs(diariosB), [diariosB]);

  // Chart overlay: alinear por "día N del periodo" (no por fecha absoluta)
  const chartData = useMemo(() => {
    const maxLen = Math.max(diariosA.length, diariosB.length);
    const rows = [];
    for (let i = 0; i < maxLen; i++) {
      rows.push({
        dia: `Día ${i + 1}`,
        periodoA: diariosA[i]?.total ?? null,
        periodoB: diariosB[i]?.total ?? null,
      });
    }
    return rows;
  }, [diariosA, diariosB]);

  const absDiff = (a, b, isMoney) => {
    const d = a - b;
    if (d === 0) return "";
    const sign = d > 0 ? "+" : "";
    return isMoney ? `${sign}${d.toFixed(2)}€` : `${sign}${Math.round(d)}`;
  };

  const kpis = [
    {
      label: "Ingresos",
      a: `${kpiA.ingresos.toFixed(2)} €`,
      b: `${kpiB.ingresos.toFixed(2)} €`,
      delta: pctDelta(kpiA.ingresos, kpiB.ingresos),
      abs: absDiff(kpiA.ingresos, kpiB.ingresos, true),
    },
    {
      label: "Tickets",
      a: String(kpiA.tickets),
      b: String(kpiB.tickets),
      delta: pctDelta(kpiA.tickets, kpiB.tickets),
      abs: absDiff(kpiA.tickets, kpiB.tickets),
    },
    {
      label: "Ticket medio",
      a: `${kpiA.ticketMedio.toFixed(2)} €`,
      b: `${kpiB.ticketMedio.toFixed(2)} €`,
      delta: pctDelta(kpiA.ticketMedio, kpiB.ticketMedio),
      abs: absDiff(kpiA.ticketMedio, kpiB.ticketMedio, true),
    },
    {
      label: "Media diaria",
      a: `${kpiA.mediaDiaria.toFixed(2)} €`,
      b: `${kpiB.mediaDiaria.toFixed(2)} €`,
      delta: pctDelta(kpiA.mediaDiaria, kpiB.mediaDiaria),
      abs: absDiff(kpiA.mediaDiaria, kpiB.mediaDiaria, true),
    },
  ];

  const labelA = `${formatFechaUI(periodoA?.fechaInicio)} — ${formatFechaUI(periodoA?.fechaFin)}`;
  const labelB = `${formatFechaUI(bInicio)} — ${formatFechaUI(bFin)}`;

  return (
    <section className="comp-root">
      <header className="comp-header">
        <div>
          <h3 className="comp-title">Comparar periodos</h3>
          <p className="comp-sub">
            Selecciona un segundo rango de fechas para comparar.
          </p>
        </div>

        <div className="comp-filtros-b">
          <label className="comp-label">Periodo B</label>
          <input type="date" value={bInicio} onChange={(e) => setBInicio(e.target.value)} />
          <span className="comp-dash">—</span>
          <input type="date" value={bFin} onChange={(e) => setBFin(e.target.value)} />
          {loadingB && <span className="comp-loading-dot" />}
        </div>
      </header>

      {errorB && (
        <div className="comp-error">
          <span>{errorB}</span>
          <button onClick={cargarB}>Reintentar</button>
        </div>
      )}

      {/* KPIs lado a lado */}
      <div className="comp-kpi-grid">
        {/* Header row */}
        <div className="comp-kpi-corner" />
        <div className="comp-kpi-col-label comp-kpi-col-a">
          Periodo A
          <span className="comp-kpi-dates">{labelA}</span>
        </div>
        <div className="comp-kpi-col-label comp-kpi-col-b">
          Periodo B
          <span className="comp-kpi-dates">{labelB}</span>
        </div>
        <div className="comp-kpi-col-label comp-kpi-col-delta">Cambio</div>

        {/* Data rows */}
        {kpis.map((k) => (
          <React.Fragment key={k.label}>
            <div className="comp-kpi-label">{k.label}</div>
            <div className="comp-kpi-val comp-kpi-val-a">{k.a}</div>
            <div className="comp-kpi-val comp-kpi-val-b">{loadingB ? "—" : k.b}</div>
            <div className={`comp-kpi-delta ${deltaClass(k.delta)}`}>
              {loadingB ? "—" : `${formatDelta(k.delta)}${k.abs ? ` (${k.abs})` : ""}`}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Chart overlay */}
      {chartData.length > 0 && (
        <div className="comp-chart">
          <h4 className="comp-chart-title">Evolución comparada</h4>
          <div className="comp-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6a0dad" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6a0dad" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />

                <XAxis
                  dataKey="dia"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${Number(v).toFixed(0)} €`}
                  width={60}
                />

                <Tooltip
                  contentStyle={{
                    background: "rgba(15,15,30,0.95)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#e5e7eb",
                    padding: "10px 14px",
                  }}
                  formatter={(value, name) => [
                    value != null ? `${Number(value).toFixed(2)} €` : "—",
                    name,
                  ]}
                />

                <Legend wrapperStyle={{ color: "#e5e7eb", fontSize: 12, fontWeight: 600 }} />

                <Area
                  type="monotone"
                  dataKey="periodoA"
                  name="Periodo A"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  fill="url(#gradA)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#a855f7" }}
                  connectNulls
                />

                <Area
                  type="monotone"
                  dataKey="periodoB"
                  name="Periodo B"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray="6 3"
                  fill="url(#gradB)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#f59e0b" }}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
