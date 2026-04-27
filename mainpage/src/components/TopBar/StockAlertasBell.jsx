// src/components/TopBar/StockAlertasBell.jsx
//
// Fase 4 — Campana de alertas de stock en TopBar.
// Muestra un badge con el nº de alertas activas (critica/alta).
// Al hacer click abre un popover con la lista (top 10) y CTA directo a
// "Hacer pedido" filtrado por stock bajo.

import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useStockAlertas,
  useStockAlertasCount,
} from "../../hooks/useStockAlertas.js";
import "./StockAlertasBell.css";

function fmtDias(n) {
  if (n == null) return "—";
  if (n < 1) return "<1 día";
  return `${n.toFixed(1)} días`;
}

function tipoIcon(t) {
  return t === "ingrediente" ? "🧂" : "🍽️";
}

export default function StockAlertasBell() {
  const { count, criticas } = useStockAlertasCount();
  const [abierto, setAbierto] = useState(false);
  const { data, loading, refresh } = useStockAlertas();
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!abierto) return;
    refresh();
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [abierto, refresh]);

  const items = data?.items || [];
  const resumen = data?.resumen || {};
  const preview = items.slice(0, 10);

  const irAHacerPedido = () => {
    setAbierto(false);
    navigate("/configuracion/proveedores/hacer-pedido?soloBajos=true");
  };

  if (count === 0) return null; // sin alertas: no mostrar badge (evita ruido)

  return (
    <div className="stockBell" ref={ref}>
      <button
        type="button"
        className={`stockBell-btn ${criticas > 0 ? "is-critica" : "is-alta"}`}
        onClick={() => setAbierto((v) => !v)}
        aria-label={`${count} alertas de stock`}
        title={`${count} alerta${count === 1 ? "" : "s"} de stock`}
      >
        <span className="stockBell-icon">🚨</span>
        <span className="stockBell-badge">{count > 99 ? "99+" : count}</span>
      </button>

      {abierto && (
        <div className="stockBell-popover" role="dialog" aria-label="Alertas de stock">
          <header className="stockBell-head">
            <h3>Alertas de stock</h3>
            <span className="stockBell-sub">
              {resumen.criticas || 0} críticas · {resumen.altas || 0} altas ·{" "}
              {resumen.riesgoRotura || 0} con riesgo de rotura
            </span>
          </header>

          {loading && !data ? (
            <div className="stockBell-empty">Cargando…</div>
          ) : items.length === 0 ? (
            <div className="stockBell-empty">Todo en orden. 🎉</div>
          ) : (
            <ul className="stockBell-lista">
              {preview.map((a) => (
                <li
                  key={`${a.itemType}:${a.itemId}`}
                  className={`stockBell-item sev-${a.severidad}`}
                >
                  <div className="stockBell-item-main">
                    <span className="stockBell-item-nombre">
                      {tipoIcon(a.itemType)} {a.nombre}
                    </span>
                    <span className="stockBell-item-meta">
                      {a.stockActual} {a.unidad}
                      {a.diasRestantes != null && (
                        <>
                          {" "}
                          · dura <strong>{fmtDias(a.diasRestantes)}</strong>
                        </>
                      )}
                      {a.proveedor?.nombre && (
                        <>
                          {" · "}
                          <span className="stockBell-item-prov">{a.proveedor.nombre}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="stockBell-item-tags">
                    {a.tipos.includes("stock_critico") && (
                      <span className="stockBell-tag tag-critica">crítico</span>
                    )}
                    {a.tipos.includes("riesgo_rotura") && (
                      <span className="stockBell-tag tag-critica">rotura</span>
                    )}
                    {a.tipos.includes("stock_bajo") &&
                      !a.tipos.includes("stock_critico") && (
                        <span className="stockBell-tag tag-alta">bajo</span>
                      )}
                  </div>
                </li>
              ))}
              {items.length > preview.length && (
                <li className="stockBell-mas">
                  +{items.length - preview.length} más en la página
                </li>
              )}
            </ul>
          )}

          <footer className="stockBell-foot">
            <button
              type="button"
              className="stockBell-btn-ghost"
              onClick={() => { setAbierto(false); navigate("/pro"); }}
            >
              Cerrar
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}
