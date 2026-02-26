// src/pages/admin/monitor/AdminMonitorJobs.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../../../utils/api";
import "./AdminMonitorJobs.css";

function StatusDot({ state }) {
  return <span className={`status-dot ${state}`} />;
}

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "—";
  }
}

function formatAge(ms) {
  if (!ms && ms !== 0) return "—";
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function stalePolicyFor(unit) {
  const map = {
    "alef-monitor.service": { label: "cada 1 min", staleSec: 180 },
    "alef-rgpd.service": { label: "cada 15 min", staleSec: 60 * 45 },
    "alef-snapshot.service": { label: "diario/hora", staleSec: 60 * 60 * 12 },
    "alef-mongo-backup.service": { label: "diario", staleSec: 60 * 60 * 36 },
    "alef-gc-uploads-local.service": { label: "diario", staleSec: 60 * 60 * 36 },
    "alef-restic-check.service": { label: "semanal", staleSec: 60 * 60 * 24 * 10 },
    "alef-restic-prune.service": { label: "semanal", staleSec: 60 * 60 * 24 * 10 },
    "alef-docker-prune.service": { label: "semanal", staleSec: 60 * 60 * 24 * 10 },
  };

  if (map[unit]) return map[unit];

  if (unit.includes("snapshot")) return { label: "snapshot", staleSec: 60 * 60 * 12 };
  if (unit.includes("mongo")) return { label: "mongo", staleSec: 60 * 60 * 36 };
  if (unit.includes("rgpd")) return { label: "rgpd", staleSec: 60 * 45 };
  if (unit.includes("gc")) return { label: "gc", staleSec: 60 * 60 * 36 };

  return { label: "—", staleSec: null };
}

function computeState(job, nowMs) {
  const lastAction = job?.last_action;
  const lastOkTs = job?.last_ok_ts ? Number(job.last_ok_ts) * 1000 : null;

  if (lastAction === "fail") return "down";
  if (!lastOkTs) return "degraded";

  const { staleSec } = stalePolicyFor(job.unit);
  if (!staleSec) return "ok";

  const ageMs = nowMs - lastOkTs;
  if (ageMs > staleSec * 1000) return "degraded";
  return "ok";
}

export default function AdminMonitorJobs({ q = "", onlyBad = false }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await api.get("/admin/system/jobs");
      setData(r.data || null);
    } catch (e) {
      setErr(e?.response?.data || e?.message || "Error");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const id = setInterval(fetchJobs, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nowMs = Date.now();

  const jobsList = useMemo(() => {
    const jobsObj = data?.jobs || {};
    const arr = Object.values(jobsObj);

    const qq = (q || "").trim().toLowerCase();
    let filtered = qq
      ? arr.filter((j) => (j?.unit || "").toLowerCase().includes(qq))
      : arr;

    filtered = filtered.map((j) => {
      const state = computeState(j, nowMs);
      const policy = stalePolicyFor(j.unit);
      const lastOkMs = j?.last_ok_ts ? Number(j.last_ok_ts) * 1000 : null;
      const ageMs = lastOkMs ? nowMs - lastOkMs : null;

      return { ...j, state, policyLabel: policy.label, staleSec: policy.staleSec, ageMs };
    });

    if (onlyBad) filtered = filtered.filter((j) => j.state !== "ok");

    const weight = (s) => (s === "down" ? 0 : s === "degraded" ? 1 : 2);
    filtered.sort((a, b) => weight(a.state) - weight(b.state));

    return filtered;
  }, [data, q, onlyBad, nowMs]);

  const stats = useMemo(() => {
    const c = { ok: 0, degraded: 0, down: 0 };
    for (const j of jobsList) c[j.state] = (c[j.state] || 0) + 1;
    return c;
  }, [jobsList]);

  return (
    <section className="jobs-monitor monitor-table monitor-table-jobs">
      <div className="jobs-header">
        <h3>Infra Jobs (systemd)</h3>

        <div className="jobs-stats">
          <small>
            OK: <strong>{stats.ok}</strong> · DEG: <strong>{stats.degraded}</strong> · DOWN:{" "}
            <strong>{stats.down}</strong>
          </small>

          <button className="jobs-btn-refresh" onClick={fetchJobs}>
            🔄 Actualizar Jobs
          </button>
        </div>
      </div>

      <small className="jobs-meta">
        Fuente: <strong>{data?.file || "—"}</strong> · Generado: {formatDate(data?.generatedAt)}
      </small>

      {loading && !data && <p className="jobs-loading">Cargando jobs...</p>}

      {err && (
        <div className="jobs-error-card">
          <h4>Jobs</h4>
          <p>
            <StatusDot state={"degraded"} /> No se pudo cargar /admin/system/jobs
          </p>
          <small>{typeof err === "string" ? err : JSON.stringify(err)}</small>
        </div>
      )}

      <div className="jobs-table-wrapper">
        <table className="jobs-table">
          <thead>
            <tr>
              <th>Estado</th>
              <th>Job</th>
              <th>Política</th>
              <th>Último OK</th>
              <th>Edad OK</th>
              <th>Último FAIL</th>
              <th>Code</th>
              <th>Result</th>
              <th>Msg</th>
            </tr>
          </thead>

          <tbody>
            {jobsList.map((j) => {
              const label = j.state === "ok" ? "OK" : j.state === "degraded" ? "DEGRADED" : "DOWN";

              return (
                <tr key={j.unit}>
                  <td>
                    <div className="jobs-state">
                      <StatusDot state={j.state} />
                      <span className="state-label">{label}</span>
                    </div>
                  </td>

                  <td>
                    <div className="jobs-jobcell">
                      <strong>{j.unit}</strong>
                      <small>last_action: {j.last_action || "—"}</small>
                    </div>
                  </td>

                  <td>
                    <small>{j.policyLabel || "—"}</small>
                  </td>

                  <td>{formatDate(j.last_ok_iso)}</td>
                  <td>{formatAge(j.ageMs)}</td>
                  <td>{formatDate(j.last_fail_iso)}</td>

                  <td>{j.code ?? "—"}</td>
                  <td>{j.result ?? "—"}</td>
                  <td className="jobs-msg">{j.msg ? String(j.msg).slice(0, 80) : "—"}</td>
                </tr>
              );
            })}

            {!jobsList.length && !loading && (
              <tr>
                <td colSpan="9" className="jobs-empty">
                  No hay jobs (o el filtro no encontró coincidencias).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <small className="jobs-footnote">
        * DEGRADED = OK demasiado viejo según política (sin “falsos positivos”). DOWN = último run en FAIL.
      </small>
    </section>
  );
}