// src/components/CajaDiariaUltraPro/DetalleCajaDia.jsx
// Modal portal con detalle de auditoría de caja: quién abrió/cerró, movimientos, arqueo.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import api from "../../utils/api";
import "./DetalleCajaDia.css";

const fmtHora = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
};
const money = (n) => n != null ? `${Number(n).toFixed(2)}€` : "—";

const TIPO_LABEL = {
  venta_efectivo: "Venta efectivo",
  venta_tarjeta: "Venta tarjeta",
  propina: "Propina",
  cambio: "Cambio",
  ingreso_manual: "Ingreso manual",
  retiro_manual: "Retiro manual",
  ajuste: "Ajuste",
  fondo_inicial: "Fondo inicial",
  reversa: "Reversa",
};

export default function DetalleCajaDia({ fecha, autoOpen = false, onClose }) {
  const [open, setOpen] = useState(autoOpen);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (autoOpen) setOpen(true); }, [autoOpen]);

  const close = () => { setOpen(false); if (onClose) onClose(); };

  useEffect(() => {
    if (!open || !fecha) return;
    let m = true;
    setLoading(true);
    api.get("/caja/detalle-dia", { params: { fecha } })
      .then(({ data: d }) => { if (m) setData(d?.data || d); })
      .catch(() => { if (m) setData(null); })
      .finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, [open, fecha]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open]);

  const modal = open ? createPortal(
    <div className="dcj-overlay" onClick={close}>
      <div className="dcj-modal" onClick={e => e.stopPropagation()}>
        <div className="dcj-modal__head">
          <h2>Detalle de caja — {fecha}</h2>
          <button className="dcj-modal__close" onClick={close}><FiX /></button>
        </div>

        <div className="dcj-modal__body">
          {loading ? (
            <p className="dcj__loading">Cargando...</p>
          ) : !data?.found ? (
            <p className="dcj__empty">No se encontró caja para este día</p>
          ) : (
            <>
              {/* Header: apertura / cierre */}
              <div className="dcj__header">
                <div className="dcj__header-item">
                  <span className="dcj__label">Abierta por</span>
                  <strong>{data.caja.aperturaPorNombre}</strong>
                  <span className="dcj__time">{fmtHora(data.caja.fechaApertura)}</span>
                </div>
                <div className="dcj__header-item">
                  <span className="dcj__label">Cerrada</span>
                  <strong>{data.caja.estado === "cerrada" ? fmtHora(data.caja.fechaCierre) : "Abierta"}</strong>
                </div>
                {data.caja.mensajeCierre && (
                  <div className="dcj__header-item dcj__header-item--note">
                    <span className="dcj__label">Nota de cierre</span>
                    <span>{data.caja.mensajeCierre}</span>
                  </div>
                )}
              </div>

              {/* Arqueo */}
              {data.arqueo.efectivoContado != null && (
                <div className="dcj__arqueo">
                  <div><span className="dcj__label">Efectivo esperado</span><strong>{money(data.arqueo.efectivoEsperado)}</strong></div>
                  <div><span className="dcj__label">Efectivo contado</span><strong>{money(data.arqueo.efectivoContado)}</strong></div>
                  <div className={`dcj__diferencia ${data.arqueo.diferencia < 0 ? "dcj__diferencia--neg" : data.arqueo.diferencia > 0 ? "dcj__diferencia--pos" : ""}`}>
                    <span className="dcj__label">Diferencia</span>
                    <strong>{data.arqueo.diferencia > 0 ? "+" : ""}{money(data.arqueo.diferencia)}</strong>
                  </div>
                </div>
              )}

              {/* Resumen movimientos */}
              {data.resumenMovimientos && Object.keys(data.resumenMovimientos).length > 0 && (
                <div className="dcj__resumen">
                  <span className="dcj__label">Resumen ({data.totalMovimientos} mov.)</span>
                  <div className="dcj__resumen-grid">
                    {Object.entries(data.resumenMovimientos).map(([tipo, r]) => (
                      <div key={tipo} className="dcj__resumen-item">
                        <span>{TIPO_LABEL[tipo] || tipo}</span>
                        <strong>{r.count}× — {money(r.total)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabla movimientos */}
              {data.movimientos.length > 0 && (
                <div className="dcj__movs">
                  <span className="dcj__label">Movimientos</span>
                  <table className="dcj__table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Hora</th>
                        <th>Tipo</th>
                        <th>Importe</th>
                        <th>Quién</th>
                        <th>Referencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.movimientos.map((m, i) => (
                        <tr key={i}>
                          <td>{m.seq}</td>
                          <td>{fmtHora(m.hora)}</td>
                          <td><span className={`dcj__tipo dcj__tipo--${m.tipo}`}>{TIPO_LABEL[m.tipo] || m.tipo}</span></td>
                          <td className={m.importe < 0 ? "dcj__neg" : ""}>{money(m.importe)}</td>
                          <td>{m.usuario}</td>
                          <td className="dcj__ref">{m.referencia || m.motivo || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  if (!autoOpen && !open) return null;
  return modal;
}
