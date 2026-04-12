// src/components/Config/BorrarConReasignacionModal.jsx
// Modal genérico de borrado seguro con reasignación, reutilizado para
// Secciones y Estaciones. Recibe los slugs de la API y avisa al admin
// antes de ejecutar el DELETE.

import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import "./BorrarConReasignacionModal.css";

/**
 * @param {object} props
 * @param {string} props.tipo - "seccion" | "estacion"
 * @param {object} props.item - { _id, nombre, slug, destino, esCentral? }
 * @param {function} props.onClose
 * @param {function} props.onEliminado - (result) => void
 */
const BorrarConReasignacionModal = ({ tipo, item, onClose, onEliminado }) => {
  const tituloTipo = tipo === "seccion" ? "sección" : "estación";
  const apiBase = tipo === "seccion" ? "/secciones" : "/estaciones";

  const [impacto, setImpacto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [reassignTo, setReassignTo] = useState("");
  const [incluirPedidos, setIncluirPedidos] = useState(true);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setCargando(true);
      setError(null);
      try {
        const { data } = await api.get(`${apiBase}/${item._id}/impacto`);
        if (!alive) return;
        setImpacto(data);
        // Preseleccionar primera alternativa para comodidad
        const alternativas = data?.alternativasParaReasignar || [];
        if (alternativas.length === 1) {
          setReassignTo(alternativas[0].slug);
        }
      } catch (err) {
        if (!alive) return;
        setError(err?.response?.data?.message || "No se pudo cargar el impacto.");
      } finally {
        if (alive) setCargando(false);
      }
    })();
    return () => { alive = false; };
  }, [item._id, apiBase]);

  const resumen = impacto
    ? {
        productos: impacto.productos?.total || 0,
        muestra: impacto.productos?.muestra || [],
        pedidos: impacto.pedidosActivos?.total || 0,
        items: impacto.pedidosActivos?.items || 0,
        alternativas: impacto.alternativasParaReasignar || [],
        esCentral: impacto[tipo]?.esCentral || false,
      }
    : null;

  const hayUso = !!resumen && (resumen.productos > 0 || resumen.pedidos > 0);
  const hayAlternativas = !!resumen && resumen.alternativas.length > 0;
  const puedeEjecutar = !cargando && !eliminando && (!hayUso || (hayUso && reassignTo));

  const handleEliminar = async () => {
    if (!puedeEjecutar) return;
    setEliminando(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (reassignTo) params.set("reassignTo", reassignTo);
      if (hayUso) params.set("incluirPedidosActivos", incluirPedidos ? "1" : "0");
      const qs = params.toString();
      const { data } = await api.delete(`${apiBase}/${item._id}${qs ? `?${qs}` : ""}`);
      onEliminado?.(data);
      onClose?.();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          `No se pudo eliminar la ${tituloTipo}. Intenta de nuevo.`
      );
      setEliminando(false);
    }
  };

  return (
    <div className="br-overlay" onClick={onClose}>
      <div className="br-modal" onClick={(e) => e.stopPropagation()}>
        <header className="br-header">
          <h2>
            <span className="br-icon">⚠️</span>
            Borrar {tituloTipo} "{item.nombre}"
          </h2>
          <button className="br-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>

        {cargando && (
          <div className="br-body br-loading">Analizando impacto…</div>
        )}

        {!cargando && error && !impacto && (
          <div className="br-body br-error">{error}</div>
        )}

        {!cargando && resumen && (
          <div className="br-body">
            {resumen.esCentral && (
              <div className="br-warning">
                ⭐ Esta es una <strong>estación central</strong>. Al borrarla se designará otra como central automáticamente
                {reassignTo ? ` (${reassignTo})` : ""}.
              </div>
            )}

            <div className="br-stats">
              <div className="br-stat">
                <span className="br-stat-num">{resumen.productos}</span>
                <span className="br-stat-label">productos</span>
              </div>
              <div className="br-stat">
                <span className="br-stat-num">{resumen.pedidos}</span>
                <span className="br-stat-label">pedidos activos</span>
              </div>
              <div className="br-stat">
                <span className="br-stat-num">{resumen.items}</span>
                <span className="br-stat-label">líneas afectadas</span>
              </div>
            </div>

            {!hayUso && (
              <p className="br-ok">
                Nadie la usa. Se puede borrar sin reasignar.
              </p>
            )}

            {hayUso && !hayAlternativas && (
              <div className="br-blocker">
                <p>
                  <strong>No hay otras {tipo === "seccion" ? "secciones" : "estaciones"} activas</strong> del mismo destino
                  ({resumen.esCentral ? "central" : impacto[tipo]?.destino || "—"}) para reasignar.
                </p>
                <p>Primero crea otra {tituloTipo} y luego vuelve a intentarlo.</p>
              </div>
            )}

            {hayUso && hayAlternativas && (
              <>
                <div className="br-reassign">
                  <label>
                    <span>Reasignar productos y pedidos a:</span>
                    <select
                      value={reassignTo}
                      onChange={(e) => setReassignTo(e.target.value)}
                      disabled={eliminando}
                    >
                      <option value="">— Elegir destino —</option>
                      {resumen.alternativas.map((a) => (
                        <option key={a.slug} value={a.slug}>
                          {a.nombre} ({a.slug})
                          {a.esCentral ? " · central" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="br-checkbox">
                  <input
                    type="checkbox"
                    checked={incluirPedidos}
                    onChange={(e) => setIncluirPedidos(e.target.checked)}
                    disabled={eliminando}
                  />
                  <span>
                    Reasignar también <strong>{resumen.items}</strong> líneas de pedidos activos
                    (recomendado, evita pedidos huérfanos en cocina).
                  </span>
                </label>
              </>
            )}

            {resumen.muestra.length > 0 && (
              <details className="br-details">
                <summary>Ver productos afectados ({resumen.productos})</summary>
                <ul className="br-list">
                  {resumen.muestra.map((p) => (
                    <li key={p._id}>
                      <strong>{p.nombre}</strong>
                      <span className="br-list-meta">
                        {" "}· {p.categoria || p.tipo || "—"}
                      </span>
                    </li>
                  ))}
                  {resumen.productos > resumen.muestra.length && (
                    <li className="br-list-more">
                      …y {resumen.productos - resumen.muestra.length} más.
                    </li>
                  )}
                </ul>
              </details>
            )}
          </div>
        )}

        {error && impacto && (
          <div className="br-error br-error-inline">{error}</div>
        )}

        <footer className="br-footer">
          <button
            type="button"
            className="br-btn br-btn-ghost"
            onClick={onClose}
            disabled={eliminando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="br-btn br-btn-danger"
            onClick={handleEliminar}
            disabled={!puedeEjecutar}
          >
            {eliminando
              ? "Borrando…"
              : !hayUso
                ? "Borrar"
                : hayAlternativas
                  ? "Borrar y reasignar"
                  : "No se puede borrar"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default BorrarConReasignacionModal;
