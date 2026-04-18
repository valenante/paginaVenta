// src/components/Estadisticas/StatsPromedioDiaSemana.jsx
// Tabla de promedio de ventas por producto y día de la semana.
import React, { useMemo, useState, useEffect } from "react";
import "./StatsPromedioDiaSemana.css";

// Orden visual de días (Lun-Dom), mapeado a keys MongoDB $dayOfWeek
// Mongo: 1=Dom 2=Lun 3=Mar 4=Mié 5=Jue 6=Vie 7=Sáb
const DIAS = [
  { key: "2", label: "Lun" },
  { key: "3", label: "Mar" },
  { key: "4", label: "Mié" },
  { key: "5", label: "Jue" },
  { key: "6", label: "Vie" },
  { key: "7", label: "Sáb" },
  { key: "1", label: "Dom" },
];

// Mostrar sin decimales si es entero, con 1 decimal si no
const fmt = (n) => {
  const v = Number(n || 0);
  return v % 1 === 0 ? String(v) : v.toFixed(1);
};

const PROM_PER_PAGE = 15;

export default function StatsPromedioDiaSemana({ promedioDiaSemana }) {
  const productos = promedioDiaSemana?.productos || [];
  const diasActivos = promedioDiaSemana?.diasActivos || {};
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [promedioDiaSemana]);

  const totalesPorDia = useMemo(() => {
    const tot = {};
    DIAS.forEach((d) => (tot[d.key] = 0));
    productos.forEach((p) => {
      DIAS.forEach((d) => {
        tot[d.key] += p.promedios[d.key] || 0;
      });
    });
    return tot;
  }, [productos]);

  const maxPromedio = useMemo(() => {
    let max = 0;
    productos.forEach((p) => {
      DIAS.forEach((d) => {
        const v = p.promedios[d.key] || 0;
        if (v > max) max = v;
      });
    });
    return max;
  }, [productos]);

  const tieneAlgunDato = productos.some((p) => p.totalSemana > 0);

  if (!tieneAlgunDato) {
    return (
      <section className="stats-promedio-dia">
        <header className="stats-promedio-dia__header">
          <h3 className="stats-promedio-dia__title">Promedios por día de la semana</h3>
          <p className="stats-promedio-dia__subtitle">
            Cuántas unidades se venden en promedio cada día del semana.
          </p>
        </header>
        <p className="stats-promedio-dia__empty">
          Sin datos suficientes todavía. Necesitas varias semanas de ventas para calcular promedios significativos.
        </p>
      </section>
    );
  }

  const heatColor = (valor) => {
    if (valor <= 0) return "rgba(255,255,255,0.02)";
    const intensity = Math.min(1, valor / (maxPromedio || 1));
    return `rgba(139, 92, 246, ${0.08 + intensity * 0.42})`;
  };

  return (
    <section className="stats-promedio-dia">
      <header className="stats-promedio-dia__header">
        <h3 className="stats-promedio-dia__title">Promedios por día de la semana</h3>
        <p className="stats-promedio-dia__subtitle">
          Unidades vendidas en promedio cada día del semana. Útil para planificar compras según el día.
        </p>
      </header>

      <div className="stats-promedio-dia__wrap">
        <table className="stats-promedio-dia__table">
          <thead>
            <tr>
              <th className="stats-promedio-dia__th stats-promedio-dia__th--prod">Producto</th>
              {DIAS.map((d) => (
                <th key={d.key} className="stats-promedio-dia__th">
                  {d.label}
                  <span className="stats-promedio-dia__dias-activos">
                    ({diasActivos[d.key] || 0})
                  </span>
                </th>
              ))}
              <th className="stats-promedio-dia__th stats-promedio-dia__th--total">Total/sem</th>
            </tr>
          </thead>
          <tbody>
            {productos
              .slice()
              .sort((a, b) => b.totalSemana - a.totalSemana)
              .slice((page - 1) * PROM_PER_PAGE, page * PROM_PER_PAGE)
              .map((p) => (
                <tr key={p.productoId}>
                  <td className="stats-promedio-dia__td stats-promedio-dia__td--prod">{p.nombre}</td>
                  {DIAS.map((d) => {
                    const v = p.promedios[d.key] || 0;
                    return (
                      <td
                        key={d.key}
                        className="stats-promedio-dia__td"
                        style={{ background: heatColor(v) }}
                      >
                        {v > 0 ? fmt(v) : "—"}
                      </td>
                    );
                  })}
                  <td className="stats-promedio-dia__td stats-promedio-dia__td--total">
                    {fmt(p.totalSemana)}
                  </td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="stats-promedio-dia__td stats-promedio-dia__td--prod">
                <strong>Total categoría</strong>
              </td>
              {DIAS.map((d) => (
                <td key={d.key} className="stats-promedio-dia__td stats-promedio-dia__td--footer">
                  <strong>{fmt(totalesPorDia[d.key])}</strong>
                </td>
              ))}
              <td className="stats-promedio-dia__td stats-promedio-dia__td--total">
                <strong>
                  {fmt(Object.values(totalesPorDia).reduce((s, v) => s + v, 0))}
                </strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {(() => {
        const totalPages = Math.ceil(productos.length / PROM_PER_PAGE);
        if (totalPages <= 1) return null;
        return (
          <div className="statlist-pagination" style={{ marginTop: "12px" }}>
            <button
              className="statlist-pagination__btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Anterior
            </button>
            <span className="statlist-pagination__info">
              {page} / {totalPages}
            </span>
            <button
              className="statlist-pagination__btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente →
            </button>
          </div>
        );
      })()}

      <p className="stats-promedio-dia__footer">
        <span>
          Números entre paréntesis: cuántos días de ese tipo se han registrado hasta ahora.
        </span>
      </p>
    </section>
  );
}
