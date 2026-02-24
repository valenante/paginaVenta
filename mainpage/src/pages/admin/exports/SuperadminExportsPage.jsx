import { useEffect, useMemo, useState } from "react";
import api from "../../../utils/api.js";
import AlertaMensaje from "../../../components/AlertaMensaje/AlertaMensaje.jsx";
import ModalConfirmacion from "../../../components/Modal/ModalConfirmacion.jsx";
import "./SuperadminExportsPage.css";

function Badge({ tone = "neutral", children }) {
  return <span className={`exports-badge ${tone}`}>{children}</span>;
}

function fmtDate(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

function toIsoStartOfDay(dateStr) {
  if (!dateStr) return null;
  return `${dateStr}T00:00:00.000Z`;
}
function toIsoEndOfDay(dateStr) {
  if (!dateStr) return null;
  return `${dateStr}T23:59:59.999Z`;
}

const TYPE_OPTIONS = [
  { value: "facturas_csv", label: "Facturas (CSV)" },
  { value: "productos_csv", label: "Productos (CSV)" },
  { value: "ventas_csv", label: "Ventas (CSV)" },
  { value: "ingredientes_csv", label: "Ingredientes (CSV)" },
  { value: "movimientos_stock_csv", label: "Movimientos Stock (CSV)" },
  { value: "movimientos_caja_csv", label: "Movimientos Caja (CSV)" },
  { value: "cajas_csv", label: "Cajas (CSV)" },
  { value: "valoraciones_csv", label: "Valoraciones (CSV)" },
];

export default function SuperadminExportsPage() {
  const [tenants, setTenants] = useState([]);
  const [selected, setSelected] = useState(null);

  const [alert, setAlert] = useState(null);
  const [modal, setModal] = useState(null);

  // generar
  const [type, setType] = useState("facturas_csv");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [includeAnulaciones, setIncludeAnulaciones] = useState(true);
  const [onlyAnulaciones, setOnlyAnulaciones] = useState(false);
  const [creating, setCreating] = useState(false);

  // historial
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const hasRunning = useMemo(
    () => items.some((j) => j.status === "PENDING" || j.status === "RUNNING"),
    [items]
  );

  const fetchTenants = async () => {
    try {
      const { data } = await api.get("/admin/superadmin/tenants");
      setTenants(data?.tenants || data || []);
    } catch (e) {
      setAlert({
        type: "error",
        text: e?.response?.data?.message || "No se pudieron cargar tenants",
      });
    }
  };

  const fetchJobs = async () => {
    if (!selected?.slug) return;
    setLoading(true);
    try {
      const { data } = await api.get("/admin/superadmin/exports", {
        params: { tenantSlug: selected.slug, limit: 50 },
      });
      setItems(data?.items || []);
    } catch (e) {
      setAlert({
        type: "error",
        text: e?.response?.data?.message || "No se pudo cargar historial",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (selected?.slug) fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.slug]);

  useEffect(() => {
    if (!hasRunning) return;
    const id = setInterval(fetchJobs, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRunning, selected?.slug]);

  const closeModal = () => setModal(null);

  const createJob = async () => {
    if (!selected?.slug) return;
    setCreating(true);
    setAlert(null);

    try {
      const params = {
        from: from ? toIsoStartOfDay(from) : undefined,
        to: to ? toIsoEndOfDay(to) : undefined,
        includeAnulaciones,
        onlyAnulaciones,
      };

      const { data } = await api.post("/admin/superadmin/exports", {
        tenantSlug: selected.slug,
        type,
        params,
      });

      setAlert({
        type: "ok",
        text: data?.reused ? "Export reutilizado (idéntico)." : "Export creado.",
      });

      closeModal();
      await fetchJobs();
    } catch (e) {
      setAlert({
        type: "error",
        text: e?.response?.data?.message || "No se pudo crear el export",
      });
    } finally {
      setCreating(false);
    }
  };

  const downloadJob = async (job) => {
    try {
      const { data } = await api.get(`/admin/superadmin/exports/${job._id}/download`);
      if (!data?.url) throw new Error("NO_URL");
      window.location.assign(data.url);
    } catch (e) {
      setAlert({
        type: "error",
        text: e?.response?.data?.message || "No se pudo descargar",
      });
    }
  };

  const toneForStatus = (s) => {
    if (s === "DONE") return "ok";
    if (s === "FAILED") return "danger";
    if (s === "RUNNING") return "warn";
    return "neutral";
  };

  return (
    <div className="rgpd-page superexports-page">
      <header className="rgpd-header">
        <div>
          <h2>Exports / Reports (Superadmin)</h2>
          <p>Genera exports para cualquier tenant y audita historial.</p>
        </div>

        <div className="rgpd-actions">
          <button className="rgpd-btn" onClick={fetchTenants} type="button">
            Recargar tenants
          </button>
          <button
            className="rgpd-btn rgpd-btn-ghost"
            onClick={fetchJobs}
            disabled={!selected?.slug || loading}
            type="button"
            title={!selected?.slug ? "Selecciona un tenant" : ""}
          >
            {loading ? "Cargando…" : "Recargar historial"}
          </button>
        </div>
      </header>

      {alert && (
        <div className="rgpd-alert">
          <AlertaMensaje
            tipo={alert.type === "ok" ? "success" : "error"}
            mensaje={alert.text}
          />
        </div>
      )}

      <div className="rgpd-grid superexports-grid">
        {/* TENANTS */}
        <section className="rgpd-card">
          <div className="rgpd-card-head">
            <h3>Tenants</h3>
          </div>

          <div className="rgpd-list">
            {tenants.map((t) => {
              const isSel = selected?.slug === t.slug;
              return (
                <button
                  key={t._id || t.slug}
                  className={`rgpd-tenant ${isSel ? "is-selected" : ""}`}
                  onClick={() => setSelected(t)}
                  type="button"
                >
                  <div className="rgpd-tenant-top">
                    <strong>{t.nombre}</strong>
                    <span className="rgpd-slug">{t.slug}</span>
                  </div>

                  <div className="rgpd-tenant-meta">
                    {t.activo ? (
                      <Badge tone="ok">activo</Badge>
                    ) : (
                      <Badge tone="warn">inactivo</Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ACCIONES + HISTORIAL */}
        <section className="rgpd-card superexports-sticky">
          <div className="rgpd-card-head">
            <h3>Acciones & Historial</h3>
          </div>

          {!selected ? (
            <p className="rgpd-muted">Selecciona un tenant.</p>
          ) : (
            <>
              <div className="rgpd-box">
                <h4>Crear export</h4>

                {/* Reuso exports-* para inputs */}
                <div className="exports-form superexports-form">
                  <label className="exports-label">
                    Tipo
                    <select
                      className="exports-input"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      {TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="exports-row">
                    <label className="exports-label">
                      Desde
                      <input
                        className="exports-input"
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                      />
                    </label>

                    <label className="exports-label">
                      Hasta
                      <input
                        className="exports-input"
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="exports-row exports-row-tight">
                    <label className="exports-check">
                      <input
                        type="checkbox"
                        checked={includeAnulaciones}
                        onChange={(e) => {
                          const v = e.target.checked;
                          setIncludeAnulaciones(v);
                          if (!v) setOnlyAnulaciones(false);
                        }}
                      />
                      Incluir anulaciones
                    </label>

                    <label
                      className={`exports-check ${includeAnulaciones ? "" : "is-disabled"}`}
                    >
                      <input
                        type="checkbox"
                        disabled={!includeAnulaciones}
                        checked={onlyAnulaciones}
                        onChange={(e) => setOnlyAnulaciones(e.target.checked)}
                      />
                      Solo anulaciones
                    </label>
                  </div>

                  <div className="rgpd-actions">
                    <button
                      className="rgpd-btn rgpd-btn-primary"
                      onClick={() => setModal("confirm")}
                      disabled={creating}
                      type="button"
                    >
                      {creating ? "Creando…" : `Generar para ${selected.slug}`}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rgpd-box">
                <h4>Historial</h4>

                {loading ? (
                  <p className="rgpd-muted">Cargando…</p>
                ) : items.length === 0 ? (
                  <p className="rgpd-muted">Sin exports.</p>
                ) : (
                  <div className="superexports-history">
                    {items.map((j) => (
                      <div className="superexports-job" key={j._id}>
                        <div className="exports-cell">
                          <Badge tone={toneForStatus(j.status)}>{j.status}</Badge>
                          <div className="exports-sub">
                            {j.status === "RUNNING"
                              ? `${j.progress || 0}%`
                              : j.message || "—"}
                          </div>
                        </div>

                        <div className="exports-cell">
                          <div className="exports-strong">{j.type}</div>
                          <div className="exports-sub">{fmtDate(j.createdAt)}</div>
                          <div className="exports-sub">{j.file?.filename || "—"}</div>
                        </div>

                        <div className="exports-cell exports-actions-cell superexports-actions-cell">
                          {j.status === "DONE" ? (
                            <button
                              className="rgpd-btn rgpd-btn-primary"
                              onClick={() => downloadJob(j)}
                              type="button"
                            >
                              Descargar
                            </button>
                          ) : (
                            <button className="rgpd-btn" disabled type="button">
                              Descargar
                            </button>
                          )}
                        </div>

                        {j.status === "FAILED" &&
                        (j.error?.message || j.error?.code) ? (
                          <div className="exports-error">
                            <b>Error:</b>{" "}
                            {j.error?.code ? `${j.error.code} — ` : ""}
                            {j.error?.message || "—"}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {modal === "confirm" && selected && (
        <ModalConfirmacion
          isOpen
          onClose={closeModal}
          titulo="Generar export (superadmin)"
          descripcion={`Se generará para el tenant: ${selected.slug}`}
          textoConfirmacion="GENERAR"
          onConfirm={createJob}
        >
          <div className="exports-modal-body">
            <div className="rgpd-muted">
              <b>Tipo:</b> {type}
            </div>
            <div className="rgpd-muted">
              <b>Rango:</b> {from || "—"} → {to || "—"}
            </div>
          </div>
        </ModalConfirmacion>
      )}
    </div>
  );
}