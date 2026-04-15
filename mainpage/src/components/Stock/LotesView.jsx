// src/components/Stock/LotesView.jsx
//
// Vista de lotes (unificada dentro de StockPage como tab).
// Sin header de página ni botón "volver" — pensado para montarse como
// contenido de la tab "Lotes" en StockPage.
//
// Props opcionales:
//   - filtroItemId: si viene, filtra los lotes a un item concreto
//     (útil para abrirlo desde la fila de un ingrediente/producto).
//   - onChange: callback tras registrar una merma, para refrescar
//     contadores globales del padre (badge del tab, KPI sidebar, etc.).

import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import AlertaMensaje from "../AlertaMensaje/AlertaMensaje.jsx";
import ErrorToast from "../common/ErrorToast.jsx";
import { normalizeApiError } from "../../utils/normalizeApiError.js";
import ModalBase from "../MapaEditor/ModalBase";
import "../MapaEditor/ModalCrearMesa.css";
import "./LotesView.css";

const eur = (n) =>
  `${Number(n || 0).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;

function fmtFecha(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES");
}

export default function LotesView({ filtroItemId = null, onChange }) {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerta, setAlerta] = useState(null);

  const [filtroEstado, setFiltroEstado] = useState("activo");
  const [diasCaducidad, setDiasCaducidad] = useState("");
  const [mermaAction, setMermaAction] = useState(null);

  const fetchLotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (diasCaducidad) params.diasCaducidad = diasCaducidad;
      if (filtroItemId) params.itemId = filtroItemId;
      const { data } = await api.get("/stock/lotes", { params });
      setLotes(data?.items || []);
    } catch (err) {
      setError({ ...normalizeApiError(err), retryFn: fetchLotes });
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, diasCaducidad, filtroItemId]);

  useEffect(() => {
    fetchLotes();
  }, [fetchLotes]);

  const confirmarMerma = async () => {
    if (!mermaAction) return;
    try {
      await api.post(`/stock/lotes/${mermaAction.lote._id}/merma`, {
        cantidad: Number(mermaAction.cantidad),
        motivo: mermaAction.motivo,
      });
      setAlerta({
        tipo: "exito",
        mensaje: `Registrada ${mermaAction.motivo} de ${mermaAction.cantidad} ${mermaAction.lote.itemUnidad}.`,
      });
      setMermaAction(null);
      fetchLotes();
      onChange?.();
    } catch (err) {
      setError({ ...normalizeApiError(err) });
    }
  };

  const totales = useMemo(
    () => ({
      valorMerma: lotes.reduce((a, l) => a + Number(l.valorMerma || 0), 0),
      proximos: lotes.filter((l) => l.estadoCaducidad === "proximo").length,
      caducados: lotes.filter((l) => l.estadoCaducidad === "caducado").length,
    }),
    [lotes]
  );

  return (
    <div className="lotesView">
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}
      {error && <ErrorToast error={error} onClose={() => setError(null)} />}

      {/* Filtros + chips compactos */}
      <div className="lotesView-toolbar">
        <div className="lotesView-filtros">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="activo">Activos</option>
            <option value="caducado">Caducados</option>
            <option value="descartado">Descartados</option>
            <option value="agotado">Agotados</option>
            <option value="">Todos</option>
          </select>
          <select
            value={diasCaducidad}
            onChange={(e) => setDiasCaducidad(e.target.value)}
          >
            <option value="">Caducidad: sin filtro</option>
            <option value="0">Ya caducados</option>
            <option value="3">Próx. 3 días</option>
            <option value="7">Próx. 7 días</option>
            <option value="30">Próx. 30 días</option>
          </select>
          <button
            className="lotesView-btn lotesView-btn--ghost"
            onClick={fetchLotes}
            disabled={loading}
          >
            🔄 Refrescar
          </button>
        </div>

        <div className="lotesView-chips">
          <div className="lotesView-chip">
            <span>Lotes</span>
            <strong>{lotes.length}</strong>
          </div>
          <div className="lotesView-chip lotesView-chip--warn">
            <span>Próximos</span>
            <strong>{totales.proximos}</strong>
          </div>
          <div className="lotesView-chip lotesView-chip--critica">
            <span>Caducados</span>
            <strong>{totales.caducados}</strong>
          </div>
          <div className="lotesView-chip">
            <span>Valor merma</span>
            <strong>{eur(totales.valorMerma)}</strong>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="lotesView-empty">Cargando…</div>
      ) : lotes.length === 0 ? (
        <div className="lotesView-empty">
          No hay lotes con estos filtros. Los lotes se crean automáticamente al recibir
          pedidos de proveedor con fecha de caducidad.
        </div>
      ) : (
        <div className="lotesView-tabla-wrap">
          <table className="lotesView-tabla">
            <thead>
              <tr>
                <th>Item</th>
                <th>Lote</th>
                <th>Proveedor</th>
                <th>Recibido</th>
                <th>Caducidad</th>
                <th>Disponible</th>
                <th>Merma</th>
                <th>Valor</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((l) => (
                <tr key={l._id} className={`estado-${l.estadoCaducidad}`}>
                  <td data-label="Item">
                    <div className="lotesView-nombre">
                      {l.itemType === "ingrediente" ? "🧂" : "🍽️"} {l.itemNombre}
                    </div>
                    <div className="lotesView-sub">{l.itemUnidad}</div>
                  </td>
                  <td data-label="Lote">
                    <code className="lotesView-codigo">
                      {l.codigoLote || String(l._id).slice(-6)}
                    </code>
                  </td>
                  <td data-label="Proveedor">{l.proveedor?.nombre || "—"}</td>
                  <td data-label="Recibido">{fmtFecha(l.fechaRecepcion)}</td>
                  <td data-label="Caducidad">
                    {fmtFecha(l.fechaCaducidad)}
                    {l.diasHastaCaducidad != null && (
                      <div
                        className={`lotesView-dias lotesView-dias--${l.estadoCaducidad}`}
                      >
                        {l.estadoCaducidad === "caducado"
                          ? `Caducó hace ${Math.abs(l.diasHastaCaducidad)}d`
                          : `En ${l.diasHastaCaducidad}d`}
                      </div>
                    )}
                  </td>
                  <td data-label="Disponible">
                    <strong>{l.cantidadDisponible}</strong>
                    <div className="lotesView-sub">de {l.cantidadInicial}</div>
                  </td>
                  <td data-label="Merma">
                    {l.cantidadMerma > 0 ? (
                      <span className="lotesView-merma">{l.cantidadMerma}</span>
                    ) : (
                      <span className="lotesView-sub">—</span>
                    )}
                  </td>
                  <td data-label="Valor">{l.valorMerma > 0 ? eur(l.valorMerma) : "—"}</td>
                  <td data-label="Acciones">
                    {["activo", "agotado"].includes(l.estado) &&
                      l.cantidadDisponible > 0 && (
                        <button
                          className="lotesView-btn lotesView-btn--ghost lotesView-btn--sm"
                          onClick={() =>
                            setMermaAction({
                              lote: l,
                              cantidad: l.cantidadDisponible,
                              motivo:
                                l.estadoCaducidad === "caducado"
                                  ? "caducado"
                                  : "merma",
                            })
                          }
                        >
                          Registrar merma
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal merma (ModalBase hermano del resto de modales de stock) */}
      {mermaAction && (
        <ModalBase
          open={true}
          title="Registrar merma"
          subtitle={`${mermaAction.lote.itemNombre} · Lote ${
            mermaAction.lote.codigoLote ||
            String(mermaAction.lote._id).slice(-6)
          }`}
          onClose={() => setMermaAction(null)}
          width={520}
          footer={
            <div className="alefForm-actions">
              <button
                type="button"
                className="alefBtn ghost"
                onClick={() => setMermaAction(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="alefBtn primary"
                onClick={confirmarMerma}
                disabled={
                  !mermaAction.cantidad ||
                  mermaAction.cantidad <= 0 ||
                  mermaAction.cantidad > mermaAction.lote.cantidadDisponible
                }
              >
                Confirmar merma
              </button>
            </div>
          }
        >
          <div className="alefForm">
            <div className="alefHint">
              📦 Disponible:{" "}
              <b>
                {mermaAction.lote.cantidadDisponible}{" "}
                {mermaAction.lote.itemUnidad}
              </b>
            </div>

            <label className="alefField">
              <span className="alefField-label">
                Cantidad ({mermaAction.lote.itemUnidad})
              </span>
              <input
                className="alefField-input"
                type="number"
                min="0"
                max={mermaAction.lote.cantidadDisponible}
                step="0.01"
                value={mermaAction.cantidad}
                onChange={(e) =>
                  setMermaAction((s) => ({
                    ...s,
                    cantidad: Number(e.target.value),
                  }))
                }
                autoFocus
              />
            </label>

            <label className="alefField">
              <span className="alefField-label">Motivo</span>
              <select
                className="alefField-input"
                value={mermaAction.motivo}
                onChange={(e) =>
                  setMermaAction((s) => ({ ...s, motivo: e.target.value }))
                }
              >
                <option value="merma">
                  Merma (rotura, derrame, uso personal)
                </option>
                <option value="caducado">Caducado</option>
                <option value="descartado">
                  Descartado (error, sospecha)
                </option>
              </select>
            </label>

            <div className="alefHint">
              💰 Valor estimado:{" "}
              <b style={{ color: "#fcd34d" }}>
                {eur(
                  Number(mermaAction.cantidad || 0) *
                    Number(mermaAction.lote.costeUnitario || 0)
                )}
              </b>
            </div>
          </div>
        </ModalBase>
      )}
    </div>
  );
}
