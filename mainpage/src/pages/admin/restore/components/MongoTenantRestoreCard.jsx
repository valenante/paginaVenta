// src/pages/superadmin/restore/components/MongoTenantRestoreCard.jsx
import { useState } from "react";
import api from "../../../../utils/api"; // ajusta si cambia
import "../RestorePage.css"; // o un css propio

const API_BASE = "/admin/system";

export default function MongoTenantRestoreCard() {
  const [tenant, setTenant] = useState("");
  const [target, setTarget] = useState("sandbox"); // sandbox | prod
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const [job, setJob] = useState(null); // { jobId, status, ... }
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

const expectedConfirm =
  target === "prod"
    ? `MONGO_RESTORE_PROD:${tenant}:I_UNDERSTAND`
    : `MONGO_RESTORE:${tenant}:sandbox`;

  const startRestore = async () => {
    setError("");
    setOk("");
    setJob(null);

    const t = tenant.trim();
    if (!/^[a-z0-9-]+$/i.test(t)) {
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
        tenant: t,
        target,
        reason: reason.trim(),
        confirm: confirm.trim(),
      });

      setJob({ jobId: data?.jobId, status: "running" });
      setOk(`✅ Restore lanzado. jobId=${data?.jobId}`);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "No se pudo iniciar el restore");
    } finally {
      setLoading(false);
    }
  };

  const pollStatus = async () => {
    if (!job?.jobId) return;
    setError("");
    try {
      const { data } = await api.get(`${API_BASE}/mongo/restore-tenant/status`, {
        params: { jobId: job.jobId },
      });
      setJob(data);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "No se pudo leer el estado");
    }
  };

  return (
    <section className="restore-card">
      <div className="restore-card-header">
        <h3>🧬 MongoDB — Restore por Tenant</h3>
        <button className="rb-btn rb-btn-ghost" onClick={pollStatus} disabled={!job?.jobId}>
          🔄 Estado
        </button>
      </div>

      {error && <div className="rb-alert rb-alert-error">❌ {error}</div>}
      {ok && <div className="rb-alert rb-alert-ok">{ok}</div>}

      <p className="muted">
        Ejecuta <strong>mongorestore</strong> para clonar <code>tpv_{tenant}</code> a{" "}
        <code>tpv_{tenant}_{target}</code>. Solo superadmin.
      </p>

      <div className="rb-grid-2">
        <label className="rb-label">
          Tenant (slug)
          <input value={tenant} onChange={(e) => setTenant(e.target.value)} placeholder="zabor-feten" />
        </label>

        <label className="rb-label">
          Target
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
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
        />
        <small className="rb-help">Mínimo 10 caracteres.</small>
      </label>

      <label className="rb-label">
        Confirmación (escribe <strong>{expectedConfirm}</strong>)
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={expectedConfirm} />
      </label>

      <div className="rb-actions">
        <button className="rb-btn rb-btn-danger" onClick={startRestore} disabled={loading}>
          {loading ? "Lanzando…" : "🚀 Iniciar restore"}
        </button>
        <button
          className="rb-btn rb-btn-ghost"
          onClick={() => {
            setTenant(""); setTarget("sandbox"); setReason(""); setConfirm("");
            setJob(null); setError(""); setOk("");
          }}
          disabled={loading}
        >
          Limpiar
        </button>
      </div>

      {!!job?.jobId && (
        <div style={{ marginTop: 12 }}>
          <div className="rb-kv">
            <div><span className="muted">jobId:</span> <code>{job.jobId}</code></div>
            <div><span className="muted">status:</span> <code>{job.status || "—"}</code></div>
            <div><span className="muted">exitCode:</span> <code>{String(job.exitCode ?? "—")}</code></div>
          </div>

          {job?.tail?.length ? (
            <pre className="restore-doc" style={{ maxHeight: 260 }}>
              {job.tail.join("\n")}
            </pre>
          ) : (
            <p className="muted">Pulsa “Estado” para ver el log.</p>
          )}
        </div>
      )}
    </section>
  );
}
