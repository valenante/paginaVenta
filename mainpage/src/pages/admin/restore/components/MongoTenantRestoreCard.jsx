// src/pages/superadmin/restore/components/MongoTenantRestoreCard.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../../../../utils/api";
import "../RestorePage.css";

const API_BASE = "/admin/system";

function Badge({ tone = "neutral", children }) {
  return <span className={`rb-badge ${tone}`}>{children}</span>;
}

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "—";
  }
}

function toneForDbStatus(status) {
  const st = String(status || "").toUpperCase();
  if (st === "COMPLETED") return "ok";
  if (st === "COMPLETED_WITH_WARNINGS") return "warn";
  if (st === "FAILED") return "danger";
  if (st === "RUNNING" || st === "PENDING") return "neutral";
  return "neutral";
}

function isTerminalAgentStatus(status) {
  const st = String(status || "").toLowerCase();
  return st === "completed" || st === "failed";
}

export default function MongoTenantRestoreCard() {
  const [tenant, setTenant] = useState("");
  const [target, setTarget] = useState("sandbox"); // sandbox | prod
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  // job “live” (agent)
  const [job, setJob] = useState(null); // { jobId, status, exitCode, tail, ... }

  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  // historial (DB)
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");

  const tenantTrim = useMemo(() => tenant.trim(), [tenant]);

  const expectedConfirm = useMemo(() => {
    if (!tenantTrim) return target === "prod" ? "MONGO_RESTORE_PROD:<tenant>:I_UNDERSTAND" : "MONGO_RESTORE:<tenant>:sandbox";
    return target === "prod"
      ? `MONGO_RESTORE_PROD:${tenantTrim}:I_UNDERSTAND`
      : `MONGO_RESTORE:${tenantTrim}:sandbox`;
  }, [target, tenantTrim]);

  const microcopy = useMemo(() => {
    if (!tenantTrim) return "Introduce un tenant slug (ej: zabor-feten).";
    const base = `tpv_${tenantTrim}`;

    if (target === "sandbox") {
      return (
        <>
          Clona <code>{base}</code> a <code>{base}_sandbox</code> para pruebas (recomendado).
        </>
      );
    }

    return (
      <>
        ⚠️ <strong>PELIGRO</strong>: restaura sobre <code>{base}</code> (overwrite de producción).
      </>
    );
  }, [tenantTrim, target]);

  const fetchJobs = async () => {
    setJobsError("");
    setJobsLoading(true);
    try {
      const { data } = await api.get(`${API_BASE}/mongo/restore-tenant/list`);
      setJobs(data?.jobs || []);
    } catch (e) {
      setJobsError(e?.response?.data?.message || e?.message || "No se pudo cargar el historial");
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pollStatus = async (jobIdOverride) => {
    const id = jobIdOverride || job?.jobId;
    if (!id) return;

    setError("");
    try {
      const { data } = await api.get(`${API_BASE}/mongo/restore-tenant/status`, {
        params: { jobId: id },
      });

      setJob(data);

      // si termina, mensaje humano
      if (isTerminalAgentStatus(data?.status)) {
        if (String(data?.status).toLowerCase() === "completed") {
          const warns = data?.warnings?.length || 0;
          setOk(warns > 0 ? `✅ Restore completado con advertencias (${warns}).` : "✅ Restore completado.");
          if (target === "sandbox" && tenantTrim) {
            sessionStorage.setItem("alef_env", "sandbox");
            sessionStorage.setItem("sandbox_tenantId", tenantTrim);
            window.location.reload();
          }
        } else {
          setError(data?.error?.message || "❌ Restore falló.");
        }
      }

      // refrescar historial DB (para ver status normalizado)
      await fetchJobs();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "No se pudo leer el estado");
    }
  };

  // Auto-poll mientras está “vivo”
  useEffect(() => {
    if (!job?.jobId) return;
    if (isTerminalAgentStatus(job?.status)) return;

    const t = setInterval(() => {
      pollStatus(job.jobId);
    }, 3500);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.jobId, job?.status]);

  const startRestore = async () => {
    setError("");
    setOk("");
    setJob(null);

    if (!/^[a-z0-9-]+$/i.test(tenantTrim)) {
      setError("Tenant inválido (usa slug tipo: zabor-feten)");
      return;
    }
    if (reason.trim().length < 10) {
      setError("Motivo obligatorio (mín. 10 caracteres).");
      return;
    }
    if (confirm.trim() !== expectedConfirm) {
      setError(`Confirmación inválida. Debe ser: ${expectedConfirm}`);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(`${API_BASE}/mongo/restore-tenant`, {
        tenant: tenantTrim,
        target,
        reason: reason.trim(),
        confirm: confirm.trim(),
      });

      const jobId = data?.jobId;
      if (!jobId) throw new Error("El agent no devolvió jobId.");

      // set “live job” y dispara poll
      setJob({ jobId, status: "running" });
      setOk(`✅ Restore lanzado. jobId=${jobId}`);

      // refresca historial y estado
      await fetchJobs();
      await pollStatus(jobId);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "No se pudo iniciar el restore");
    } finally {
      setLoading(false);
    }
  };

  const trackJob = async (jobId) => {
    setError("");
    setOk("");
    setJob({ jobId, status: "running" });
    setOk(`📌 Track jobId=${jobId}`);
    await pollStatus(jobId);
  };

  const resetForm = () => {
    setTenant("");
    setTarget("sandbox");
    setReason("");
    setConfirm("");
    setJob(null);
    setError("");
    setOk("");
  };

  const currentJobId = job?.jobId ? String(job.jobId) : null;

  return (
    <section className="restore-card">
      <div className="restore-card-header">
        <h3>🧬 MongoDB — Restore por Tenant</h3>

        <div className="restore-right-actions">
          <button
            className="rb-btn rb-btn-ghost"
            onClick={() => pollStatus()}
            disabled={!job?.jobId}
            title={!job?.jobId ? "Primero inicia un restore o elige uno del historial" : "Consultar estado al agent"}
          >
            🔄 Estado
          </button>

          <button
            className="rb-btn rb-btn-ghost"
            onClick={() => {
              sessionStorage.setItem("alef_env", "prod");
              sessionStorage.removeItem("sandbox_tenantId");
              window.location.reload();
            }}
            title="Salir del modo sandbox"
          >
            🟢 PROD
          </button>

          <button className="rb-btn rb-btn-ghost" onClick={fetchJobs} disabled={jobsLoading}>
            {jobsLoading ? "Cargando…" : "📜 Historial"}
          </button>
        </div>
      </div>

      {error && <div className="rb-alert rb-alert-error">❌ {error}</div>}
      {ok && <div className="rb-alert rb-alert-ok">{ok}</div>}

      <p className="muted">
        {microcopy} <span className="muted">Solo superadmin.</span>
      </p>

      <div className="rb-grid-2">
        <label className="rb-label">
          Tenant (slug)
          <input
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            placeholder="zabor-feten"
            disabled={loading}
          />
        </label>

        <label className="rb-label">
          Target
          <select value={target} onChange={(e) => setTarget(e.target.value)} disabled={loading}>
            <option value="sandbox">sandbox</option>
            <option value="prod">prod (peligroso)</option>
          </select>
        </label>
      </div>

      <label className="rb-label">
        Motivo (obligatorio)
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: Clonar prod a sandbox para reproducir bug en stock."
          disabled={loading}
        />
        <small className="rb-help">Mínimo 10 caracteres.</small>
      </label>

      <label className="rb-label">
        Confirmación (escribe <strong>{expectedConfirm}</strong>)
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={expectedConfirm}
          disabled={loading}
        />
      </label>

      <div className="rb-actions">
        <button className="rb-btn rb-btn-danger" onClick={startRestore} disabled={loading}>
          {loading ? "Lanzando…" : "🚀 Iniciar restore"}
        </button>

        <button className="rb-btn rb-btn-ghost" onClick={resetForm} disabled={loading}>
          Limpiar
        </button>
      </div>

      {!!job?.jobId && (
        <div style={{ marginTop: 12 }}>
          <div className="rb-kv">
            <div>
              <span className="muted">jobId:</span> <code>{job.jobId}</code>
            </div>
            <div>
              <span className="muted">status (agent):</span>{" "}
              <code>{job.status || "—"}</code>
            </div>
            <div>
              <span className="muted">exitCode:</span>{" "}
              <code>{String(job.exitCode ?? "—")}</code>
            </div>
          </div>

          {job?.tail?.length ? (
            <pre className="restore-doc" style={{ maxHeight: 260 }}>
              {job.tail.join("\n")}
            </pre>
          ) : (
            <p className="muted">Pulsa “Estado” para ver el log del agent.</p>
          )}
        </div>
      )}

      {/* =========================
          HISTORIAL (DB)
         ========================= */}
      <div style={{ marginTop: 14 }}>
        <div className="restore-card-header" style={{ marginBottom: 8 }}>
          <h4 style={{ margin: 0 }}>📜 Historial restores Mongo (DB)</h4>
          <span className="muted">{jobsLoading ? "Actualizando…" : `${jobs.length} items`}</span>
        </div>

        {jobsError && <div className="rb-alert rb-alert-error">❌ {jobsError}</div>}

        {!jobsLoading && !jobs.length && <p className="muted">Aún no hay restores registrados.</p>}

        {!!jobs.length && (
          <div className="table-wrapper">
            <table className="restore-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Source</th>
                  <th>Target</th>
                  <th>Status (DB)</th>
                  <th>Warnings</th>
                  <th>Actor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => {
                  const jid = String(j.jobId);
                  const selected = currentJobId && jid === currentJobId;
                  return (
                    <tr key={jid} style={selected ? { outline: "2px solid rgba(255, 103, 0, 0.35)" } : undefined}>
                      <td>{formatDate(j.createdAt || j.startedAt)}</td>
                      <td>
                        <code>{j.sourceTenant}</code>
                      </td>
                      <td>
                        <code>{j.targetTenant}</code>
                      </td>
                      <td>
                        <Badge tone={toneForDbStatus(j.status)}>{j.status}</Badge>
                      </td>
                      <td>{j.warningsCount ?? 0}</td>
                      <td>{j.initiatedBy?.email || "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="rb-btn rb-btn-ghost" onClick={() => trackJob(jid)} title="Track (consultar estado/tail del agent)">
                          📌 Track
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p className="muted" style={{ marginTop: 10 }}>
              * “Status (DB)” es el estado normalizado (PENDING/RUNNING/COMPLETED/COMPLETED_WITH_WARNINGS/FAILED). <br />
              * “Track” intenta consultar el estado/tail al agent (si el job ya expiró en el agent, puede no haber tail).
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
