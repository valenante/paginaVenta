import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../utils/api";
import { useTenant } from "../../context/TenantContext";
import Portal from "../ui/Portal";
import ErrorToast from "../common/ErrorToast.jsx";
import { normalizeApiError } from "../../utils/normalizeApiError.js";
import "./PedidoProveedorModal.css";

const DEFAULT = {
  fechaEsperada: "",
  notas: "",
  lineas: [{ productoProveedorId: "", cantidad: 1 }],
};

function toDateInputValue(v) {
  if (!v) return "";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}

export default function PedidoProveedorModal({ onClose, onSaved, mode = "create", pedido, proveedor }) {
  const { proveedorId } = useParams();
  const { tenant } = useTenant();
  const isEdit = mode === "edit";

  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(true);

  const [form, setForm] = useState(() => ({
    ...DEFAULT,
    ...(pedido || {}),
    fechaEsperada: toDateInputValue(pedido?.fechaEsperada),
    lineas:
      Array.isArray(pedido?.lineas) && pedido.lineas.length
        ? pedido.lineas.map((l) => ({
            productoProveedorId: l.productoProveedorId || "",
            cantidad: l.cantidad ?? 1,
          }))
        : DEFAULT.lineas,
  }));

  const [saving, setSaving] = useState(false);

  // ✅ UX PRO
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const getFieldErr = (path) => fieldErrors?.[path];

  // Cargar productos del proveedor
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoadingProductos(true);
        const { data } = await api.get(`/admin/proveedores/${proveedorId}/productos`);
        if (!alive) return;
        setProductos(data?.items || []);
      } catch {
        if (!alive) return;
        setProductos([]);
      } finally {
        if (alive) setLoadingProductos(false);
      }
    };

    if (proveedorId) load();
    return () => {
      alive = false;
    };
  }, [proveedorId]);

  const set = (k, v) => {
    setForm((s) => ({ ...s, [k]: v }));
    setFieldErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const setLinea = (idx, patch) => {
    setForm((s) => {
      const next = [...(s.lineas || [])];
      next[idx] = { ...(next[idx] || {}), ...patch };
      return { ...s, lineas: next };
    });

    Object.keys(patch || {}).forEach((subKey) => {
      const path = `lineas[${idx}].${subKey}`;
      setFieldErrors((prev) => ({ ...prev, [path]: undefined }));
    });
  };

  const addLinea = () => {
    setForm((s) => ({
      ...s,
      lineas: [...(s.lineas || []), { productoProveedorId: "", cantidad: 1 }],
    }));
  };

  const removeLinea = (idx) => {
    setForm((s) => {
      const next = [...(s.lineas || [])];
      next.splice(idx, 1);
      return { ...s, lineas: next.length ? next : [{ productoProveedorId: "", cantidad: 1 }] };
    });
  };

  const localValidate = useCallback(() => {
    const fe = {};

    const lineas = Array.isArray(form.lineas) ? form.lineas : [];
    if (!lineas.length) fe.lineas = "Debes incluir al menos una línea.";

    lineas.forEach((l, i) => {
      if (!l?.productoProveedorId) fe[`lineas[${i}].productoProveedorId`] = "Selecciona un producto.";
      const c = Number(l?.cantidad);
      if (!Number.isFinite(c) || c <= 0) fe[`lineas[${i}].cantidad`] = "Cantidad debe ser > 0.";
    });

    return fe;
  }, [form.lineas]);

  const buildPayload = useCallback(() => {
    const lineas = (form.lineas || []).map((l) => ({
      productoProveedorId: l.productoProveedorId,
      cantidad: Number(l.cantidad),
    }));

    return {
      fechaEsperada: form.fechaEsperada ? new Date(`${form.fechaEsperada}T00:00:00.000Z`) : null,
      notas: form.notas || "",
      lineas,
    };
  }, [form.fechaEsperada, form.notas, form.lineas]);

  const submit = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setError(null);

      const fe = localValidate();
      if (Object.keys(fe).length) {
        setFieldErrors(fe);
        return;
      }
      setFieldErrors({});

      setSaving(true);

      try {
        const payload = buildPayload();

        if (isEdit) {
          await api.put(
            `/admin/proveedores/${proveedorId}/pedidos/${pedido?._id}`,
            payload
          );
        } else {
          await api.post(`/admin/proveedores/${proveedorId}/pedidos`, payload);
        }

        onSaved?.();
        onClose?.();
      } catch (err) {
        const normalized = normalizeApiError(err);

        const backendFields =
          normalized?.fields && typeof normalized.fields === "object"
            ? normalized.fields
            : null;

        if (backendFields) setFieldErrors(backendFields);

        setError({
          ...normalized,
          retryFn: () => submit(),
        });
      } finally {
        setSaving(false);
      }
    },
    [buildPayload, isEdit, pedido?._id, proveedorId, localValidate, onSaved, onClose]
  );

  const productoMap = useMemo(() => {
    const m = new Map();
    (productos || []).forEach((p) => m.set(String(p._id), p));
    return m;
  }, [productos]);

  const calcLinea = (l) => {
    const prod = productoMap.get(String(l.productoProveedorId));
    const qty = Number(l.cantidad || 0);
    const unit = Number(prod?.precioBase || 0);
    const iva = Number(prod?.iva || 0);
    const base = qty * unit;
    const total = base * (1 + iva / 100);
    return { base, total, iva, unit, nombre: prod?.nombre };
  };

  const totals = useMemo(() => {
    const lineas = form.lineas || [];
    let subtotal = 0;
    let total = 0;
    for (const l of lineas) {
      const { base, total: t } = calcLinea(l);
      subtotal += base;
      total += t;
    }
    const totalIva = total - subtotal;
    return { subtotal, totalIva, total };
  }, [form.lineas, productoMap]);

  const generarPDF = () => {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 16;

    // ── Colores ──
    const purple = [106, 13, 173];
    const darkText = [30, 30, 30];
    const grayText = [120, 120, 120];

    // ── Datos del emisor (restaurante) ──
    const emisor = {
      nombre: tenant?.nombre || tenant?.slug || "Mi Restaurante",
      nif: tenant?.nif || tenant?.cif || "",
      email: tenant?.email || "",
      telefono: tenant?.telefono || "",
      direccion: [
        tenant?.direccion?.calle,
        tenant?.direccion?.ciudad,
        tenant?.direccion?.provincia,
        tenant?.direccion?.codigoPostal,
      ].filter(Boolean).join(", "),
    };

    // ── Datos del proveedor ──
    const prov = {
      nombre: proveedor?.nombreComercial || proveedor?.razonSocial || "Proveedor",
      nif: proveedor?.nif || "",
      email: proveedor?.contacto?.email || "",
      telefono: proveedor?.contacto?.telefono || "",
      direccion: [
        proveedor?.direccion?.calle,
        proveedor?.direccion?.ciudad,
        proveedor?.direccion?.provincia,
        proveedor?.direccion?.codigoPostal,
      ].filter(Boolean).join(", "),
    };

    const fechaPedido = new Date().toLocaleDateString("es-ES", {
      day: "2-digit", month: "long", year: "numeric",
    });
    const fechaEsp = form.fechaEsperada
      ? new Date(form.fechaEsperada + "T00:00:00").toLocaleDateString("es-ES", {
          day: "2-digit", month: "long", year: "numeric",
        })
      : "—";
    const numPedido = pedido?.numeroPedido || pedido?._id?.slice(-8)?.toUpperCase() || String(Date.now()).slice(-8);

    // ══════════════════════════════════════════
    // HEADER — banda púrpura
    // ══════════════════════════════════════════
    doc.setFillColor(...purple);
    doc.rect(0, 0, pageW, 36, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("PEDIDO A PROVEEDOR", margin, 16);

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`N.º ${numPedido}`, margin, 24);
    doc.text(`Fecha: ${fechaPedido}`, margin, 30);

    doc.text(`Entrega estimada: ${fechaEsp}`, pageW - margin, 24, { align: "right" });

    // ══════════════════════════════════════════
    // EMISOR + PROVEEDOR (dos columnas)
    // ══════════════════════════════════════════
    let y = 46;

    const drawBlock = (title, data, x, maxW) => {
      doc.setFontSize(7);
      doc.setTextColor(...grayText);
      doc.setFont(undefined, "bold");
      doc.text(title.toUpperCase(), x, y);

      doc.setFontSize(11);
      doc.setTextColor(...darkText);
      doc.setFont(undefined, "bold");
      doc.text(data.nombre, x, y + 6);

      doc.setFontSize(8.5);
      doc.setFont(undefined, "normal");
      doc.setTextColor(...grayText);
      let lineY = y + 12;
      if (data.nif) { doc.text(`NIF/CIF: ${data.nif}`, x, lineY); lineY += 4.5; }
      if (data.direccion) {
        const lines = doc.splitTextToSize(data.direccion, maxW);
        doc.text(lines, x, lineY);
        lineY += lines.length * 4.5;
      }
      if (data.telefono) { doc.text(`Tel: ${data.telefono}`, x, lineY); lineY += 4.5; }
      if (data.email) { doc.text(data.email, x, lineY); lineY += 4.5; }
      return lineY;
    };

    const half = (pageW - margin * 2) / 2;
    const y1 = drawBlock("De", emisor, margin, half - 5);
    const y2 = drawBlock("Para", prov, margin + half + 5, half - 5);
    y = Math.max(y1, y2) + 6;

    // Línea separadora
    doc.setDrawColor(220);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    // ══════════════════════════════════════════
    // TABLA DE LÍNEAS
    // ══════════════════════════════════════════
    const lineas = form.lineas || [];
    const body = lineas.map((l, i) => {
      const c = calcLinea(l);
      const prod = productoMap.get(String(l.productoProveedorId));
      return [
        String(i + 1),
        prod?.nombre || "—",
        prod?.formato || "",
        String(Number(l.cantidad || 0)),
        `${Number(c.unit || 0).toFixed(2)} €`,
        `${c.iva}%`,
        `${Number(c.total || 0).toFixed(2)} €`,
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["#", "Producto", "Formato", "Cant.", "Precio ud.", "IVA", "Total"]],
      body,
      styles: { fontSize: 8.5, cellPadding: 3 },
      headStyles: {
        fillColor: purple,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        3: { halign: "center", cellWidth: 14 },
        4: { halign: "right", cellWidth: 24 },
        5: { halign: "center", cellWidth: 14 },
        6: { halign: "right", cellWidth: 24 },
      },
      alternateRowStyles: { fillColor: [250, 248, 255] },
    });

    // ══════════════════════════════════════════
    // TOTALES — alineados a la derecha
    // ══════════════════════════════════════════
    const finalY = doc.lastAutoTable.finalY + 6;

    const drawTotal = (label, value, yPos, bold) => {
      doc.setFontSize(bold ? 11 : 9.5);
      doc.setFont(undefined, bold ? "bold" : "normal");
      doc.setTextColor(...(bold ? darkText : grayText));
      doc.text(label, pageW - margin - 50, yPos, { align: "right" });
      doc.setTextColor(...darkText);
      doc.text(`${Number(value || 0).toFixed(2)} €`, pageW - margin, yPos, { align: "right" });
    };

    drawTotal("Subtotal", totals.subtotal, finalY, false);
    drawTotal("IVA", totals.totalIva, finalY + 6, false);

    doc.setDrawColor(...purple);
    doc.setLineWidth(0.5);
    doc.line(pageW - margin - 60, finalY + 10, pageW - margin, finalY + 10);

    drawTotal("TOTAL", totals.total, finalY + 17, true);

    // ══════════════════════════════════════════
    // NOTAS
    // ══════════════════════════════════════════
    if (form.notas?.trim()) {
      const notasY = finalY + 28;
      doc.setFontSize(8);
      doc.setFont(undefined, "bold");
      doc.setTextColor(...grayText);
      doc.text("OBSERVACIONES", margin, notasY);
      doc.setFont(undefined, "normal");
      const notasLines = doc.splitTextToSize(form.notas.trim(), pageW - margin * 2);
      doc.text(notasLines, margin, notasY + 5);
    }

    // ══════════════════════════════════════════
    // FOOTER
    // ══════════════════════════════════════════
    doc.setFontSize(7.5);
    doc.setTextColor(180);
    doc.text(
      `Generado el ${new Date().toLocaleString("es-ES")} — ${emisor.nombre}`,
      margin,
      pageH - 8
    );
    doc.text("softalef.com", pageW - margin, pageH - 8, { align: "right" });

    doc.save(`pedido_${prov.nombre.replace(/\s+/g, "_")}_${numPedido}.pdf`);
  };

  return (
    <Portal>
      <div className="pedProvModal-backdrop" onMouseDown={onClose}>
        <div className="pedProvModal card" onMouseDown={(e) => e.stopPropagation()}>
          {/* ===== Header ===== */}
          <header className="pedProvModal-head">
            <div className="pedProvModal-headText">
              <h2 className="pedProvModal-title">
                {isEdit ? "Editar pedido" : "Nuevo pedido"}
              </h2>
              <p className="pedProvModal-subtitle">
                Añade líneas con productos del proveedor. El precio/IVA se toma del producto en el momento del pedido.
              </p>
            </div>

            <button
              type="button"
              className="pedProvModal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </header>

          {/* ===== Body ===== */}
          <form className="pedProvModal-body" onSubmit={submit}>
            {error && (
              <ErrorToast
                error={error}
                onRetry={error.canRetry ? error.retryFn : undefined}
                onClose={() => setError(null)}
              />
            )}

            {/* Meta */}
            <section className="pedProvModal-section">
              <div className="pedProvModal-grid">
                <div className="pedProvModal-field">
                  <label>Fecha esperada</label>
                  <input
                    type="date"
                    value={form.fechaEsperada || ""}
                    onChange={(e) => set("fechaEsperada", e.target.value)}
                    aria-invalid={!!getFieldErr("fechaEsperada")}
                  />
                  {getFieldErr("fechaEsperada") ? (
                    <small className="field-error">{getFieldErr("fechaEsperada")}</small>
                  ) : null}
                </div>

                <div className="pedProvModal-field pedProvModal-field--full">
                  <label>Notas</label>
                  <textarea
                    rows={3}
                    value={form.notas || ""}
                    onChange={(e) => set("notas", e.target.value)}
                    placeholder="Observaciones, entrega, teléfono del comercial..."
                  />
                </div>
              </div>
            </section>

            {/* Líneas */}
            <section className="pedProvModal-section">
              <div className="pedProvModal-linesHead">
                <h3 className="pedProvModal-h3">Líneas</h3>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={addLinea}
                  disabled={saving}
                >
                  ➕ Añadir línea
                </button>
              </div>

              {getFieldErr("lineas") ? (
                <div className="pedProvModal-inlineError">{getFieldErr("lineas")}</div>
              ) : null}

              {loadingProductos ? (
                <div className="pedProvModal-loading">Cargando productos…</div>
              ) : productos.length === 0 ? (
                <div className="pedProvModal-empty">
                  Este proveedor no tiene productos activos. Crea productos primero.
                </div>
              ) : (
                <div className="pedProvModal-lines">
                  {(form.lineas || []).map((l, idx) => {
                    const c = calcLinea(l);
                    return (
                      <div key={idx} className="pedProvModal-line card">
                        <div className="pedProvModal-lineGrid">
                          <div className="pedProvModal-field pedProvModal-field--full">
                            <label>Producto *</label>
                            <select
                              value={l.productoProveedorId || ""}
                              onChange={(e) => setLinea(idx, { productoProveedorId: e.target.value })}
                              aria-invalid={!!getFieldErr(`lineas[${idx}].productoProveedorId`)}
                            >
                              <option value="">Selecciona…</option>
                              {productos.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.nombre} · {Number(p.precioBase || 0).toFixed(2)}€ · {p.iva || 0}% · {p.unidad || "—"}
                                </option>
                              ))}
                            </select>
                            {getFieldErr(`lineas[${idx}].productoProveedorId`) ? (
                              <small className="field-error">
                                {getFieldErr(`lineas[${idx}].productoProveedorId`)}
                              </small>
                            ) : null}
                          </div>

                          <div className="pedProvModal-field">
                            <label>Cantidad *</label>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={l.cantidad ?? 1}
                              onChange={(e) => setLinea(idx, { cantidad: e.target.value })}
                              aria-invalid={!!getFieldErr(`lineas[${idx}].cantidad`)}
                            />
                            {getFieldErr(`lineas[${idx}].cantidad`) ? (
                              <small className="field-error">
                                {getFieldErr(`lineas[${idx}].cantidad`)}
                              </small>
                            ) : null}
                          </div>

                          <div className="pedProvModal-lineTotals">
                            <div className="row">
                              <span className="k">Base</span>
                              <span className="v">{Number(c.base || 0).toFixed(2)} €</span>
                            </div>
                            <div className="row">
                              <span className="k">Total</span>
                              <span className="v strong">{Number(c.total || 0).toFixed(2)} €</span>
                            </div>
                          </div>

                          <div className="pedProvModal-lineActions">
                            <button
                              type="button"
                              className="btn btn-secundario"
                              onClick={() => removeLinea(idx)}
                              disabled={saving}
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Totales */}
            <section className="pedProvModal-section">
              <div className="pedProvModal-totals">
                <div className="trow">
                  <span>Subtotal</span>
                  <span>{Number(totals.subtotal || 0).toFixed(2)} €</span>
                </div>
                <div className="trow">
                  <span>IVA</span>
                  <span>{Number(totals.totalIva || 0).toFixed(2)} €</span>
                </div>
                <div className="trow total">
                  <span>Total</span>
                  <span>{Number(totals.total || 0).toFixed(2)} €</span>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="pedProvModal-foot">
              <button
                type="button"
                className="btn btn-secundario"
                onClick={generarPDF}
                disabled={saving || !form.lineas?.some((l) => l.productoProveedorId)}
              >
                📄 Descargar PDF
              </button>

              <div className="pedProvModal-footRight">
                <button
                  type="button"
                  className="btn btn-secundario"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-primario"
                  disabled={saving || loadingProductos || productos.length === 0}
                >
                  {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear pedido"}
                </button>
              </div>
            </footer>
          </form>
        </div>
      </div>
    </Portal>
  );
}