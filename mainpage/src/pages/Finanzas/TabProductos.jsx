import React, { useState, useEffect } from "react";
import { useFinanzasProductos } from "../../hooks/useFinanzas";
import { eur, pct, alertaColor, alertaLabel } from "./utils";
import Pagination from "./Pagination";

export default function TabProductos({ periodo }) {
  const [sortBy, setSortBy] = useState("revenue");
  const [filtro, setFiltro] = useState("");
  const [verSinCoste, setVerSinCoste] = useState(false);
  const [verTodos, setVerTodos] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Reset a página 1 cuando cambian filtros
  useEffect(() => { setPage(1); }, [filtro, verSinCoste, verTodos, sortBy, periodo.desde, periodo.hasta]);

  const { data, loading, error } = useFinanzasProductos({
    desde: periodo.desde,
    hasta: periodo.hasta,
    sortBy,
    page,
    pageSize,
    q: filtro,
    soloSinCoste: verSinCoste,
    incluirSinVentas: verTodos,
  });

  const items = data?.items || [];
  const pagination = data?.pagination || { page: 1, pageSize, total: 0, totalPages: 1 };

  const exportCsv = () => {
    if (!items.length) return;
    const headers = ["Producto", "Categoría", "Unidades", "Ingresos €", "Coste €", "Margen €", "Margen %", "Alerta"];
    const rows = items.map((i) => [
      i.nombre, i.categoria, i.unidades, i.revenue, i.coste, i.margen, i.margenPct, i.alerta,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finanzas-productos-${periodo.desde}-${periodo.hasta}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fin-tab-productos">
      <div className="fin-toolbar">
        <input
          type="text"
          placeholder="Buscar producto o categoría…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="fin-input"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="fin-input"
        >
          <option value="revenue">Ordenar: Ingresos</option>
          <option value="margen">Ordenar: Margen €</option>
          <option value="margenPct">Ordenar: Margen %</option>
          <option value="unidades">Ordenar: Unidades</option>
        </select>
        <label className="fin-checkbox">
          <input
            type="checkbox"
            checked={verSinCoste}
            onChange={(e) => setVerSinCoste(e.target.checked)}
          />
          Solo sin coste
        </label>
        <label className="fin-checkbox">
          <input
            type="checkbox"
            checked={verTodos}
            onChange={(e) => setVerTodos(e.target.checked)}
          />
          Incluir sin ventas
        </label>
        <button className="fin-btn-ghost" onClick={exportCsv}>
          📥 Exportar CSV
        </button>
      </div>

      {error && <div className="fin-error">Error: {error}</div>}
      {loading && <div className="fin-loading">Calculando…</div>}

      {!loading && !error && (
        <>
          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Unidades</th>
                  <th>Ingresos</th>
                  <th>Coste</th>
                  <th>Margen €</th>
                  <th>Margen %</th>
                  <th>Alerta</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.productoId}>
                    <td>
                      {p.nombre}
                      {p.sinCoste && (
                        <span className="fin-tag fin-tag-warn" title="No tiene coste configurado">
                          ⚠ sin coste
                        </span>
                      )}
                    </td>
                    <td>{p.categoria}</td>
                    <td>{p.unidades}</td>
                    <td>{eur(p.revenue)}</td>
                    <td>{eur(p.coste)}</td>
                    <td style={{ color: p.margen >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                      {eur(p.margen)}
                    </td>
                    <td>{pct(p.margenPct)}</td>
                    <td>
                      <span
                        className="fin-pill"
                        style={{
                          background: `${alertaColor(p.alerta)}22`,
                          color: alertaColor(p.alerta),
                        }}
                      >
                        {alertaLabel(p.alerta)}
                      </span>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                      Sin productos en este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.total > 0 && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />
          )}
        </>
      )}
    </div>
  );
}
