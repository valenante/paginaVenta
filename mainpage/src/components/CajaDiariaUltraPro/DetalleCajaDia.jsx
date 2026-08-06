// src/components/CajaDiariaUltraPro/DetalleCajaDia.jsx
// Modal portal con detalle de auditoría de caja: quién abrió/cerró, movimientos, arqueo.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiDownload } from "react-icons/fi";
import api from "../../utils/api";
import "./DetalleCajaDia.css";

const fmtHora = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
};
const money = (n) => n != null ? `${Number(n).toFixed(2)}€` : "—";
// Franja horaria de una caja: "12:06–00:51" / "12:06–abierta"
const fmtFranja = (c) => `${fmtHora(c?.fechaApertura)}–${c?.estado === "cerrada" ? fmtHora(c?.fechaCierre) : "abierta"}`;
const to2 = (n) => Math.round(n * 100) / 100;

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
  const [descargando, setDescargando] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [cajaSelId, setCajaSelId] = useState(null);

  useEffect(() => { if (autoOpen) setOpen(true); }, [autoOpen]);

  const close = () => { setOpen(false); if (onClose) onClose(); };

  // ── Multi-caja (aditivo) ───────────────────────────────────────────────
  // Un día operativo puede tener varias cajas (servicio + caja de noche). El backend
  // NUEVO manda `dia` y `cajas`; con el backend VIEJO ambos vienen undefined y todo
  // el componente cae al camino de siempre (una sola caja, sin selector).
  const cajasDia = Array.isArray(data?.cajas) ? data.cajas : [];
  const multiCaja = cajasDia.length > 1;
  // Si el id guardado no existe (otro día), cae sola a la PRINCIPAL.
  const cajaSel = multiCaja
    ? (cajasDia.find(c => String(c._id) === String(cajaSelId))
      || cajasDia.find(c => c.esPrincipal)
      || cajasDia[0])
    : null;
  const idxCajaSel = multiCaja ? cajasDia.findIndex(c => String(c._id) === String(cajaSel?._id)) : -1;

  // Vista efectiva: con varias cajas TODO es de la caja seleccionada; si no, lo de siempre.
  const cajaActiva = multiCaja ? cajaSel : data?.caja;
  const arqueoVista = multiCaja ? cajaSel?.arqueo : data?.arqueo;
  const movsTodos = Array.isArray(data?.movimientos) ? data.movimientos : [];
  const movsVista = multiCaja
    ? movsTodos.filter(m => String(m.cajaId) === String(cajaSel?._id))
    : movsTodos;
  const resumenVista = multiCaja
    ? movsVista.reduce((acc, m) => {
        if (!acc[m.tipo]) acc[m.tipo] = { count: 0, total: 0 };
        acc[m.tipo].count++;
        acc[m.tipo].total = to2(acc[m.tipo].total + Math.abs(m.importe));
        return acc;
      }, {})
    : (data?.resumenMovimientos || {});
  const totalMovsVista = multiCaja ? movsVista.length : data?.totalMovimientos;

  // Descarga el PDF oficial de cierre de ESTA caja (reutiliza GET /caja/:cajaId/pdf-cierre).
  const descargarPDF = async () => {
    const cajaId = cajaActiva?._id;
    if (!cajaId) return;
    try {
      setDescargando(true);
      setPdfError(null);
      const { data: blob } = await api.get(`/caja/${cajaId}/pdf-cierre`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      // Con varias cajas el mismo día, cada PDF tiene que llamarse distinto: si no, el
      // navegador guarda el segundo como "…(1).pdf" y en una auditoría no se sabe cuál es cuál.
      link.download = multiCaja
        ? `cierre-caja-${fecha}-caja${idxCajaSel + 1}.pdf`
        : `cierre-caja-${fecha}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      setPdfError("No se pudo generar el PDF de cierre.");
    } finally {
      setDescargando(false);
    }
  };

  useEffect(() => {
    if (!open || !fecha) return;
    let m = true;
    setLoading(true);
    api.get("/caja/detalle-dia", { params: { fecha } })
      .then(({ data: d }) => { if (m) { setData(d?.data || d); setCajaSelId(null); } })
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
          <div className="dcj-modal__actions">
            {data?.found && cajaActiva?._id && (
              <button
                className="dcj-modal__pdf"
                onClick={descargarPDF}
                disabled={descargando}
                title="Descargar PDF de cierre"
              >
                <FiDownload />
                {descargando ? "Generando…" : "Descargar PDF"}
              </button>
            )}
            <button className="dcj-modal__close" onClick={close}><FiX /></button>
          </div>
        </div>

        <div className="dcj-modal__body">
          {pdfError && <p className="dcj__pdf-error">{pdfError}</p>}
          {loading ? (
            <p className="dcj__loading">Cargando...</p>
          ) : !data?.found ? (
            <p className="dcj__empty">No se encontró caja para este día</p>
          ) : (
            <>
              {/* Selector de caja — sólo si el día tuvo más de una */}
              {multiCaja && (
                <div className="dcj__cajas">
                  <span className="dcj__label">Este día se abrieron {cajasDia.length} cajas</span>
                  <div className="dcj__cajas-tabs">
                    {cajasDia.map((c, i) => (
                      <button
                        key={String(c._id)}
                        type="button"
                        className={`dcj__caja-tab ${String(c._id) === String(cajaSel?._id) ? "dcj__caja-tab--activa" : ""}`}
                        onClick={() => setCajaSelId(String(c._id))}
                      >
                        <span className="dcj__caja-tab-titulo">
                          Caja {i + 1} de {cajasDia.length}
                          {c.esPrincipal && <span className="dcj__caja-tab-badge">principal</span>}
                        </span>
                        <span className="dcj__caja-tab-meta">{fmtFranja(c)} · {c.totalMovimientos} mov.</span>
                      </button>
                    ))}
                  </div>
                  <p className="dcj__cajas-hint">
                    Estás viendo la <strong>caja {idxCajaSel + 1} de {cajasDia.length}</strong> ({fmtFranja(cajaSel)} · {movsVista.length} mov.).
                    Todo lo de abajo es sólo de esta caja.
                  </p>

                  {/* Totales DEL DÍA (unión de todas las cajas), tal cual los manda el backend:
                      es lo único que cuadra con la fila del listado desde la que se abre este
                      modal. Sin esto, el detalle enseña un subtotal que no coincide con el día. */}
                  {Object.keys(data.resumenMovimientos || {}).length > 0 && (
                    <div className="dcj__dia-resumen">
                      <span className="dcj__label">
                        Todo el día — {data.totalMovimientos} mov. en {cajasDia.length} cajas
                      </span>
                      <div className="dcj__resumen-grid">
                        {Object.entries(data.resumenMovimientos).map(([tipo, r]) => (
                          <div key={tipo} className="dcj__resumen-item dcj__resumen-item--dia">
                            <span>{TIPO_LABEL[tipo] || tipo}</span>
                            <strong>{r.count}× — {money(r.total)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Header: apertura / cierre */}
              <div className="dcj__header">
                <div className="dcj__header-item">
                  <span className="dcj__label">Abierta por</span>
                  <strong>{cajaActiva.aperturaPorNombre}</strong>
                  <span className="dcj__time">{fmtHora(cajaActiva.fechaApertura)}</span>
                </div>
                <div className="dcj__header-item">
                  <span className="dcj__label">Cerrada por</span>
                  <strong>{cajaActiva.cierrePorNombre || "—"}</strong>
                  <span className="dcj__time">{cajaActiva.estado === "cerrada" ? fmtHora(cajaActiva.fechaCierre) : "Abierta"}</span>
                </div>
                {cajaActiva.mensajeCierre && (
                  <div className="dcj__header-item dcj__header-item--note">
                    <span className="dcj__label">Nota de cierre</span>
                    <span>{cajaActiva.mensajeCierre}</span>
                  </div>
                )}
              </div>

              {/* Arqueo */}
              {arqueoVista?.efectivoContado != null && (
                <div className="dcj__arqueo">
                  <div><span className="dcj__label">Efectivo esperado</span><strong>{money(arqueoVista.efectivoEsperado)}</strong></div>
                  <div><span className="dcj__label">Efectivo contado</span><strong>{money(arqueoVista.efectivoContado)}</strong></div>
                  <div className={`dcj__diferencia ${arqueoVista.diferencia < 0 ? "dcj__diferencia--neg" : arqueoVista.diferencia > 0 ? "dcj__diferencia--pos" : ""}`}>
                    <span className="dcj__label">Diferencia</span>
                    <strong>{arqueoVista.diferencia > 0 ? "+" : ""}{money(arqueoVista.diferencia)}</strong>
                  </div>
                </div>
              )}

              {/* Resumen movimientos */}
              {resumenVista && Object.keys(resumenVista).length > 0 && (
                <div className="dcj__resumen">
                  <span className="dcj__label">
                    {multiCaja ? `Resumen de esta caja (${totalMovsVista} mov.)` : `Resumen (${totalMovsVista} mov.)`}
                  </span>
                  <div className="dcj__resumen-grid">
                    {Object.entries(resumenVista).map(([tipo, r]) => (
                      <div key={tipo} className="dcj__resumen-item">
                        <span>{TIPO_LABEL[tipo] || tipo}</span>
                        <strong>{r.count}× — {money(r.total)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabla movimientos */}
              {movsVista.length > 0 && (
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
                      {movsVista.map((m, i) => (
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
