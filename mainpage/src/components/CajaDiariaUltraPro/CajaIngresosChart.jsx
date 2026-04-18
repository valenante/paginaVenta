import { useMemo, useState, useEffect } from "react";
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
import "./CajaIngresosChart.css";

export default function CajaIngresosChart({ datosDiarios, onDiaClick, diaSeleccionado }) {
  // Fix #4: isMobile reactivo
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const data = useMemo(() => {
    const slice = isMobile ? datosDiarios.slice(-7) : datosDiarios;
    return slice.map((d) => ({
      fecha: new Date(d.fecha).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
      }),
      fechaISO: d.fecha,
      total: d.total,
    }));
  }, [datosDiarios, isMobile]);

  return (
    <section className={`caja-ingresos-chart ${isMobile ? "mobile" : ""}`}>
      <header className="chart-header">
        <h3>Ingresos diarios</h3>
        {isMobile ? (
          <span>Últimos 7 días</span>
        ) : (
          <span>
            Evolución del periodo seleccionado
            {onDiaClick ? " · Pulsa un día para ver detalle" : ""}
          </span>
        )}
      </header>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            style={onDiaClick ? { cursor: "pointer" } : undefined}
            onClick={(state) => {
              if (!onDiaClick) return;
              const payload = state?.activePayload?.[0]?.payload;
              const label = state?.activeLabel;
              const iso =
                payload?.fechaISO ||
                data.find((d) => d.fecha === label)?.fechaISO;
              if (iso) onDiaClick(iso);
            }}
          >
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6a0dad" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6a0dad" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />

            <XAxis
              dataKey="fecha"
              tick={{ fill: "#cbd5e1", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={isMobile ? "preserveStartEnd" : 0}
            />

            <YAxis
              tick={{ fill: "#cbd5e1", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${Number(v).toFixed(0)} €`}
              width={60}
            />

            <Tooltip
              contentStyle={{
                background: "rgba(20,20,35,0.95)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 6,
                color: "#e5e7eb",
                padding: "10px",
              }}
              labelStyle={{ color: "#fff" }}
              formatter={(value) => [`${Number(value).toFixed(2)} €`, "Ingresos"]}
            />

            {!isMobile && (
              <Legend
                wrapperStyle={{ color: "#e5e7eb", fontSize: 12, fontWeight: 600 }}
              />
            )}

            <Area
              type="monotone"
              dataKey="total"
              name="Ingresos (€)"
              stroke="#6a0dad"
              strokeWidth={3}
              fill="url(#gradTotal)"
              dot={isMobile ? false : (props) => {
                const { cx, cy, payload } = props;
                const selected = diaSeleccionado && payload?.fechaISO === diaSeleccionado;
                return (
                  <circle
                    key={payload?.fechaISO}
                    cx={cx} cy={cy}
                    r={selected ? 8 : 5}
                    fill={selected ? "#f59e0b" : "#6a0dad"}
                    stroke={selected ? "#fff" : "none"}
                    strokeWidth={selected ? 2 : 0}
                    style={onDiaClick ? { cursor: "pointer" } : undefined}
                  />
                );
              }}
              activeDot={{
                r: 7,
                style: onDiaClick ? { cursor: "pointer" } : undefined,
                onClick: (_, e) => {
                  if (!onDiaClick) return;
                  const p = e?.payload;
                  if (p?.fechaISO) onDiaClick(p.fechaISO);
                },
              }}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
