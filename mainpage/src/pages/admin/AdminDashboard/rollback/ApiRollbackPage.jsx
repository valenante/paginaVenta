import { useEffect, useMemo, useState } from "react";
import api from "../../../../utils/api";
import "./ApiRollbackPage.css";

// Si tu backend monta en otra base, cámbialo aquí:
const API_BASE = "/admin/system";

function Badge({ tone = "neutral", children }) {
  return <span className={`rb-badge ${tone}`}>{children}</span>;
}

function humanNow(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "—";
  }
}

export default function ApiRollbackPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  const [target, setTarget] = useState("blue");
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const active = status?.api?.active || "unknown";
  const available = status?.api?.available || ["blue", "green", "legacy"];

  const targetUpper = useMemo(() => String(target || "").toUpperCase(), [target]);
  const canSubmit = useMemo(() => {
    const rOk = reason.trim().length >= 10;
    const cOk = confirmText.trim().toUpperCase() === targetUpper;
    const notSame = active !== target; // evitamos “rollback a lo mismo”
    return rOk && cOk && notSame && !submitting;
  }, [reason, confirmText, targetUpper, active, target, submitting]);

  const activeTone = useMemo(() => {
    if (active === "blue") return "blue";
    if (active === "green") return "green";
    if (active === "legacy") return "warn";
    return "neutral";
  }, [active]);

  const fetchStatus = async () => {
    setErr("");
    setOkMsg("");
    setLoading(true);
    try {
      const { data } = await api.get(`${API_BASE}/api/status`);
      setStatus(data);
      // si el target actual quedó inválido, normalizamos
      if (data?.api?.available?.length && !data.api.available.includes(target)) {
        setTarget(data.api.available[0]);
      }
    } catch (e) {
      setStatus(null);
      setErr(e?.response?.data?.message || e?.message || "No se pudo obtener el estado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doRollback = async (e) => {
    e.preventDefault();
    setErr("");
    setOkMsg("");

    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const payload = { target, reason: reason.trim() };
      const { data } = await api.post(`${API_BASE}/api/rollback`, payload);

      setOkMsg(`✅ Rollback ejecutado. Producción ahora en: ${data?.result?.switchedTo || target}`);
      setConfirmText("");
      setReason("");

      await fetchStatus();
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2?.message || "Rollback falló");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rb-page">
        <h2>Rollback API</h2>
        <p className="rb-muted">Cargando estado…</p>
      </div>
    );
  }

  return (
    <div className="rb-page">
      <div className="rb-header">
        <div>
          <h2>Rollback API</h2>
          <p className="rb-muted">
            Cambia la versión activa (blue/green/legacy) en producción sin downtime, usando el switch de Nginx.
          </p>
        </div>

        <button className="rb-btn rb-btn-ghost" onClick={fetchStatus} disabled={submitting}>
          🔄 Actualizar
        </button>
      </div>

      <section className="rb-card">
        <div className="rb-row">
          <div className="rb-col">
            <h3>Estado actual</h3>
            <p className="rb-line">
              Producción activa:{" "}
              <Badge tone={activeTone}>{String(active).toUpperCase()}</Badge>
            </p>

            <p className="rb-muted">
              Último refresh: {humanNow(Date.now())}
            </p>

            {status?.api?.link && (
              <p className="rb-muted">
                Symlink: <code className="rb-code">{status.api.link}</code>
              </p>
            )}
          </div>

          <div className="rb-col">
            <h3>Slots disponibles</h3>
            <div className="rb-slots">
              {available.map((s) => (
                <span key={s} className={`rb-slot ${s === active ? "active" : ""}`}>
                  {String(s).toUpperCase()}
                </span>
              ))}
            </div>

            <p className="rb-muted" style={{ marginTop: 10 }}>
              * “legacy” = antiguo node/pm2 (si lo mantienes preparado).
            </p>
          </div>
        </div>
      </section>

      <section className="rb-card">
        <h3>Ejecutar rollback</h3>

        {err && <div className="rb-alert rb-alert-error">❌ {err}</div>}
        {okMsg && <div className="rb-alert rb-alert-ok">{okMsg}</div>}

        <form onSubmit={doRollback} className="rb-form">
          <label className="rb-label">
            Target (a qué quieres volver)
            <div className="rb-targets">
              {available.map((s) => {
                const disabled = s === active || submitting;
                return (
                  <button
                    key={s}
                    type="button"
                    className={`rb-target ${target === s ? "selected" : ""}`}
                    disabled={disabled}
                    onClick={() => setTarget(s)}
                    title={s === active ? "Ya está activo" : "Seleccionar target"}
                  >
                    {String(s).toUpperCase()}
                    {s === active ? " (activo)" : ""}
                  </button>
                );
              })}
            </div>
          </label>

          <label className="rb-label">
            Motivo (obligatorio)
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Rollback por errores 5xx tras deploy, volvemos a la última versión estable."
              rows={4}
              disabled={submitting}
            />
            <small className="rb-help">
              Mínimo 10 caracteres. Esto es clave para auditoría y trazabilidad.
            </small>
          </label>

          <label className="rb-label">
            Confirmación (escribe <strong>{targetUpper}</strong> para habilitar el botón)
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Escribe ${targetUpper}`}
              disabled={submitting}
            />
            <small className="rb-help">
              Evita rollbacks accidentales.
            </small>
          </label>

          <div className="rb-actions">
            <button
              type="submit"
              className="rb-btn rb-btn-danger"
              disabled={!canSubmit}
            >
              {submitting ? "Ejecutando…" : `Rollback a ${targetUpper}`}
            </button>

            <button
              type="button"
              className="rb-btn rb-btn-ghost"
              onClick={() => {
                setReason("");
                setConfirmText("");
                setErr("");
                setOkMsg("");
              }}
              disabled={submitting}
            >
              Limpiar
            </button>
          </div>

          {active === target && (
            <p className="rb-muted" style={{ marginTop: 10 }}>
              Ya estás en ese target.
            </p>
          )}
        </form>
      </section>

      <section className="rb-card rb-card-note">
        <h3>Qué hace el botón realmente</h3>
        <ul className="rb-ul">
          <li>Cambia el symlink de Nginx para apuntar a <code className="rb-code">blue</code>, <code className="rb-code">green</code> o <code className="rb-code">legacy</code>.</li>
          <li>Recarga Nginx (sin cortar conexiones).</li>
          <li>No rebuild, no deploy: solo cambia el “camino” de producción en segundos.</li>
        </ul>
      </section>
    </div>
  );
}
