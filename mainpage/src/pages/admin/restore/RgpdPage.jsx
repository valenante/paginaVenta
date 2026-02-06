import { useEffect, useMemo, useState } from "react";
import api from "../../../utils/api.js";
import ModalConfirmacion from "../../../components/Modal/ModalConfirmacion.jsx";
import AlertaMensaje from "../../../components/AlertaMensaje/AlertaMensaje.jsx";
import "./RgpdPage.css";

function Badge({ tone = "neutral", children }) {
    return <span className={`rgpd-badge ${tone}`}>{children}</span>;
}

function fmtDate(v) {
    if (!v) return "—";
    try {
        return new Date(v).toLocaleString();
    } catch {
        return String(v);
    }
}

export default function RgpdPage() {
    const [loading, setLoading] = useState(true);
    const [tenants, setTenants] = useState([]);

    const [selected, setSelected] = useState(null);
    const [deletions, setDeletions] = useState([]);
    const [loadingDeletions, setLoadingDeletions] = useState(false);

    const [alert, setAlert] = useState(null);

    // modales
    const [modal, setModal] = useState(null);
    const [confirmText, setConfirmText] = useState("");
    const [days, setDays] = useState(30);
    const [reason, setReason] = useState("");
    const [runningNow, setRunningNow] = useState(false);
    const [lastRunResults, setLastRunResults] = useState(null);

    const openRunNow = () => {
        setConfirmText("");
        setModal("runNow");
    };

    const doRunNow = async () => {
        if (confirmText.trim() !== "EJECUTAR") {
            setAlert({ type: "error", text: `Confirmación incorrecta. Escribe exactamente: EJECUTAR` });
            return;
        }

        setRunningNow(true);
        try {
            const { data } = await api.post("/admin/system/rgpd/run-due-now");

            const results = data?.results || [];
            setLastRunResults(results);

            const okCount = results.filter(r => r.ok).length;
            const failCount = results.filter(r => !r.ok).length;

            setAlert({
                type: "ok",
                text: `Runner ejecutado. OK: ${okCount}, Fallos: ${failCount}`,
            });

            closeModal();

            // refrescar UI
            if (selected?.slug) await fetchDeletions(selected.slug);
            await fetchTenants();
        } catch (e) {
            setAlert({
                type: "error",
                text: e?.response?.data?.message || "No se pudo ejecutar el runner",
            });
        } finally {
            setRunningNow(false);
        }
    };

    const fetchTenants = async () => {
        setLoading(true);
        try {
            // Ajusta al endpoint que ya uses para listar tenants
            // En tu panel supeadmin ya tienes tenants en TenantTable, así que seguramente:
            const { data } = await api.get("/admin/superadmin/tenants");
            setTenants(data?.tenants || data || []);
        } catch (e) {
            setAlert({ type: "error", text: e?.response?.data?.message || "No se pudieron cargar los tenants" });
        } finally {
            setLoading(false);
        }
    };

    const fetchDeletions = async (slug) => {
        if (!slug) return;
        setLoadingDeletions(true);
        try {
            const { data } = await api.get(`/admin/system/rgpd/tenant/${slug}/deletions`);
            setDeletions(data?.items || []);
        } catch (e) {
            setAlert({ type: "error", text: e?.response?.data?.message || "No se pudieron cargar los borrados" });
        } finally {
            setLoadingDeletions(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    useEffect(() => {
        if (selected?.slug) fetchDeletions(selected.slug);
    }, [selected?.slug]);

    const pendingDeletion = useMemo(() => {
        return deletions.find((d) => d.status === "PENDING") || null;
    }, [deletions]);

    const openExport = async (slug) => {
        try {
            setAlert(null);

            const res = await api.get("/admin/system/rgpd/export", {
                params: { tenant: slug },
                responseType: "blob",
            });

            // filename desde Content-Disposition si viene
            const cd = res.headers?.["content-disposition"] || "";
            const match = cd.match(/filename="([^"]+)"/i);
            const fallbackName = `alef-rgpd-export_${slug}.zip`;
            const filename = match?.[1] || fallbackName;

            const blob = new Blob([res.data], { type: "application/zip" });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);
        } catch (e) {
            setAlert({
                type: "error",
                text: e?.response?.data?.message || "No se pudo exportar RGPD",
            });
        }
    };

    const openSchedule = () => {
        setConfirmText("");
        setDays(30);
        setReason("");
        setModal("schedule");
    };

    const openCancel = () => {
        setConfirmText("");
        setReason("");
        setModal("cancel");
    };

    const closeModal = () => setModal(null);

    const doSchedule = async () => {
        if (!selected?.slug) return;

        const slug = selected.slug;
        if (confirmText.trim() !== slug) {
            setAlert({ type: "error", text: `Confirmación incorrecta. Escribe exactamente: ${slug}` });
            return;
        }

        try {
            await api.post(`/admin/system/rgpd/tenant/${slug}/schedule-delete`, {
                days,
                reason,
                idempotencyKey: `schedule_${slug}_${Date.now()}`,
            });

            setAlert({ type: "ok", text: `Borrado programado para ${slug}` });
            closeModal();
            await fetchDeletions(slug);
            await fetchTenants();
        } catch (e) {
            setAlert({ type: "error", text: e?.response?.data?.message || "No se pudo programar el borrado" });
        }
    };

    const doCancel = async () => {
        if (!selected?.slug) return;

        const slug = selected.slug;
        if (confirmText.trim() !== "CANCELAR") {
            setAlert({ type: "error", text: `Confirmación incorrecta. Escribe exactamente: CANCELAR` });
            return;
        }

        try {
            await api.post(`/admin/system/rgpd/tenant/${slug}/cancel-delete`, {
                reason,
            });

            setAlert({ type: "ok", text: `Borrado cancelado para ${slug}` });
            closeModal();
            await fetchDeletions(slug);
            await fetchTenants();
        } catch (e) {
            setAlert({ type: "error", text: e?.response?.data?.message || "No se pudo cancelar el borrado" });
        }
    };

    return (
        <div className="rgpd-page">
            <header className="rgpd-header">
                <h2>RGPD & Datos</h2>
                <p>Exportación y retención/borrado por tenant (solo superadmin).</p>
            </header>

            {alert && (
                <div className="rgpd-alert">
                    <AlertaMensaje tipo={alert.type === "ok" ? "success" : "error"} mensaje={alert.text} />
                </div>
            )}

            <div className="rgpd-grid">
                {/* LISTA TENANTS */}
                <section className="rgpd-card">
                    <div className="rgpd-card-head">
                        <h3>Tenants</h3>
                        <button className="rgpd-btn" onClick={fetchTenants} disabled={loading}>
                            Recargar
                        </button>
                    </div>

                    {loading ? (
                        <p className="rgpd-muted">Cargando...</p>
                    ) : (
                        <div className="rgpd-list">
                            {tenants.map((t) => {
                                const isSel = selected?.slug === t.slug;
                                return (
                                    <button
                                        key={t._id || t.slug}
                                        className={`rgpd-tenant ${isSel ? "is-selected" : ""}`}
                                        onClick={() => setSelected(t)}
                                        title={t.slug}
                                    >
                                        <div className="rgpd-tenant-top">
                                            <strong>{t.nombre}</strong>
                                            <span className="rgpd-slug">{t.slug}</span>
                                        </div>

                                        <div className="rgpd-tenant-meta">
                                            {t.activo ? <Badge tone="ok">activo</Badge> : <Badge tone="warn">inactivo</Badge>}
                                            {t.pendingDeletion ? <Badge tone="danger">pendingDeletion</Badge> : <Badge>—</Badge>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* DETALLE */}
                <section className="rgpd-card">
                    <div className="rgpd-card-head">
                        <h3>Acciones</h3>
                    </div>

                    {!selected ? (
                        <p className="rgpd-muted">Selecciona un tenant para ver acciones.</p>
                    ) : (
                        <>
                            <div className="rgpd-actions">
                                <button className="rgpd-btn" onClick={() => openExport(selected.slug)}>
                                    Exportar RGPD (ZIP)
                                </button>

                                {pendingDeletion ? (
                                    <button className="rgpd-btn danger" onClick={openCancel}>
                                        Cancelar borrado programado
                                    </button>
                                ) : (
                                    <button className="rgpd-btn danger" onClick={openSchedule}>
                                        Programar borrado
                                    </button>
                                )}

                                <button
                                    className="rgpd-btn danger"
                                    onClick={openRunNow}
                                    disabled={runningNow}
                                    title="Ejecuta todos los borrados vencidos (scheduledFor <= ahora)"
                                >
                                    {runningNow ? "Ejecutando..." : "Ejecutar pendientes ahora"}
                                </button>
                            </div>

                            <div className="rgpd-box">
                                <h4>Estado</h4>
                                {loadingDeletions ? (
                                    <p className="rgpd-muted">Cargando historial...</p>
                                ) : pendingDeletion ? (
                                    <div className="rgpd-status">
                                        <Badge tone="danger">PENDING</Badge>
                                        <div className="rgpd-status-lines">
                                            <div><b>Programado:</b> {fmtDate(pendingDeletion.scheduledFor)}</div>
                                            <div><b>Motivo:</b> {pendingDeletion.reason || "—"}</div>
                                            <div><b>Solicitado por:</b> {pendingDeletion.requestedBy?.email || "—"}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="rgpd-muted">No hay borrado pendiente.</p>
                                )}
                            </div>

                            <div className="rgpd-box">
                                <h4>Historial</h4>
                                {loadingDeletions ? (
                                    <p className="rgpd-muted">Cargando...</p>
                                ) : deletions.length === 0 ? (
                                    <p className="rgpd-muted">Sin registros.</p>
                                ) : (
                                    <div className="rgpd-history">
                                        {deletions.map((d) => (
                                            <div className="rgpd-history-item" key={d._id}>
                                                <div className="rgpd-history-top">
                                                    <Badge tone={d.status === "EXECUTED" ? "ok" : d.status === "FAILED" ? "danger" : d.status === "CANCELED" ? "warn" : "neutral"}>
                                                        {d.status}
                                                    </Badge>
                                                    <span className="rgpd-muted">{fmtDate(d.createdAt)}</span>
                                                </div>
                                                <div className="rgpd-muted">
                                                    <div><b>scheduledFor:</b> {fmtDate(d.scheduledFor)}</div>
                                                    <div><b>reason:</b> {d.reason || "—"}</div>
                                                    <div><b>result:</b> {d.result?.message || "—"}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {Array.isArray(lastRunResults) && lastRunResults.length > 0 && (
                                <div className="rgpd-box">
                                    <h4>Última ejecución</h4>
                                    <div className="rgpd-history">
                                        {lastRunResults.map((r, idx) => (
                                            <div key={`${r.tenantSlug || "tenant"}-${idx}`} className="rgpd-history-item">
                                                <div className="rgpd-history-top">
                                                    <Badge tone={r.ok ? "ok" : "danger"}>{r.ok ? "OK" : "FAILED"}</Badge>
                                                    <span className="rgpd-muted">{r.tenantSlug}</span>
                                                </div>
                                                {!r.ok && r.message && (
                                                    <div className="rgpd-muted"><b>error:</b> {r.message}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>

            {/* MODAL PROGRAMAR */}
            {modal === "schedule" && selected && (
                <ModalConfirmacion
                    isOpen
                    onClose={closeModal}
                    titulo="Programar borrado RGPD"
                    descripcion={`Esto eliminará la base de datos del tenant (${selected.slug}) al cumplirse la retención.`}
                    textoConfirmacion="CONFIRMAR"
                    onConfirm={doSchedule}
                // si tu ModalConfirmacion no soporta inputs, lo cambiamos a tu modal custom.
                >
                    <div className="rgpd-modal-body">
                        <label className="rgpd-label">
                            Días de retención
                            <input
                                className="rgpd-input"
                                type="number"
                                min="0"
                                value={days}
                                onChange={(e) => setDays(Number(e.target.value))}
                            />
                        </label>

                        <label className="rgpd-label">
                            Motivo (opcional)
                            <input
                                className="rgpd-input"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </label>

                        <label className="rgpd-label">
                            Para confirmar, escribe el slug exacto: <b>{selected.slug}</b>
                            <input
                                className="rgpd-input"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                            />
                        </label>
                    </div>
                </ModalConfirmacion>
            )}

            {/* MODAL CANCELAR */}
            {modal === "cancel" && selected && (
                <ModalConfirmacion
                    isOpen
                    onClose={closeModal}
                    titulo="Cancelar borrado programado"
                    descripcion={`Vas a cancelar el borrado programado de ${selected.slug}.`}
                    textoConfirmacion="CANCELAR"
                    onConfirm={doCancel}
                >
                    <div className="rgpd-modal-body">
                        <label className="rgpd-label">
                            Motivo (opcional)
                            <input
                                className="rgpd-input"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </label>

                        <label className="rgpd-label">
                            Para confirmar, escribe: <b>CANCELAR</b>
                            <input
                                className="rgpd-input"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                            />
                        </label>
                    </div>
                </ModalConfirmacion>
            )}
            {modal === "runNow" && (
                <ModalConfirmacion
                    isOpen
                    onClose={closeModal}
                    titulo="Ejecutar borrados vencidos (RUNNER)"
                    descripcion="Esto ejecutará TODOS los borrados PENDING cuyo scheduledFor ya haya vencido. Acción irreversible."
                    textoConfirmacion="EJECUTAR"
                    onConfirm={doRunNow}
                >
                    <div className="rgpd-modal-body">
                        <label className="rgpd-label">
                            Para confirmar, escribe: <b>EJECUTAR</b>
                            <input
                                className="rgpd-input"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="EJECUTAR"
                            />
                        </label>

                        <p className="rgpd-muted" style={{ marginTop: 10 }}>
                            Consejo: úsalo solo para pruebas o incidentes. En producción lo ideal es un cron/timer.
                        </p>
                    </div>
                </ModalConfirmacion>
            )}
        </div>
    );
}
