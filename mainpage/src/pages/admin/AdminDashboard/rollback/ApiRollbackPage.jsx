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

  const [target, setTarget] = useState("blue"); // blue|green|legacy|lkg
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const active = status?.api?.active || "unknown";
  const lkg = status?.api?.lkg || null;

  // ✅ “LKG” aparece como opción solo si el backend la reporta
  const availableRaw = status?.api?.available || ["blue", "green", "legacy"];
  const available = useMemo(() => {
    const base = Array.isArray(availableRaw) ? availableRaw : ["blue", "green", "legacy"];
    const hasLkg = !!lkg;
    // ponemos LKG arriba si existe
    return hasLkg ? ["lkg", ...base] : base;
  }, [availableRaw, lkg]);

  const targetUpper = useMemo(
    () => String(target || "").toUpperCase(),
    [target]
  );

  // ✅ Confirmación específica cuando el target es LKG
  const expectedConfirm = useMemo(() => {
    if (target === "lkg") return "LKG";
    return targetUpper;
  }, [target, targetUpper]);

  // ✅ “notSame” especial:
  // - si target es LKG, comparamos contra el slot al que apunta (lkg)
  // - si no hay lkg definido, no dejamos enviar
  const canSubmit = useMemo(() => {
    const rOk = reason.trim().length >= 10;
    const cOk = confirmText.trim().toUpperCase() === expectedConfirm;

    if (submitting) return false;

    if (target === "lkg") {
      if (!lkg) return false;
      const notSame = active !== lkg;
      return rOk && cOk && notSame;
    }

    const notSame = active !== target;
    return rOk && cOk && notSame;
  }, [reason, confirmText, expectedConfirm, active, target, submitting, lkg]);

  const activeTone = useMemo(() => {
    if (active === "blue") return "blue";
    if (active === "green") return "green";
    if (active === "legacy") return "warn";
    return "neutral";
  }, [active]);

  const lkgTone = useMemo(() => {
    if (!lkg) return "neutral";
    if (lkg === "blue") return "blue";
    if (lkg === "green") return "green";
    if (lkg === "legacy") return "warn";
    return "ok";
  }, [lkg]);

  const fetchStatus = async () => {
    setErr("");
    setOkMsg("");
    setLoading(true);
    try {
      const { data } = await api.get(`${API_BASE}/api/status`);
      setStatus(data);

      // normaliza target si ya no es válido:
      const nextActive = data?.api?.active || "unknown";
      const nextLkg = data?.api?.lkg || null;
      const nextAvail = data?.api?.available || ["blue", "green", "legacy"];
      const nextAvailList = nextLkg ? ["lkg", ...nextAvail] : nextAvail;

      if (!nextAvailList.includes(target)) {
        // preferimos LKG si existe, sino primer slot
        setTarget(nextLkg ? "lkg" : nextAvail[0]);
      }

      // evita quedarte en “rollback a lo mismo” si target=lkg y active==lkg
      if (target === "lkg" && nextLkg && nextActive === nextLkg) {
        // no tocamos target; solo lo indicamos en UI con el texto “ya estás en LKG”
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

      const switchedTo = data?.result?.switchedTo || (target === "lkg" ? (lkg || "lkg") : target);

      setOkMsg(
        target === "lkg"
          ? `✅ Rollback a LKG ejecutado. Producción ahora en: ${String(switchedTo).toUpperCase()}`
          : `✅ Rollback ejecutado. Producción ahora en: ${String(switchedTo).toUpperCase()}`
      );

      setConfirmText("");
      setReason("");

      await fetchStatus();
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2?.message || "Rollback falló");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedLabel = useMemo(() => {
    if (target === "lkg") {
      if (!lkg) return "LKG (no definido)";
      return `LKG → ${String(lkg).toUpperCase()}`;
    }
    return String(target).toUpperCase();
  }, [target, lkg]);

  const alreadyOnTarget = useMemo(() => {
    if (target === "lkg") return !!lkg && active === lkg;
    return active === target;
  }, [target, active, lkg]);

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

            {/* ✅ LKG visible */}
            <p className="rb-line">
              Last Known Good:{" "}
              {lkg ? (
                <Badge tone={lkgTone}>{String(lkg).toUpperCase()}</Badge>
              ) : (
                <Badge tone="neutral">NO DEFINIDO</Badge>
              )}
            </p>

            <p className="rb-muted">Último refresh: {humanNow(Date.now())}</p>

            {status?.api?.link && (
              <p className="rb-muted">
                Symlink: <code className="rb-code">{status.api.link}</code>
              </p>
            )}
          </div>

          <div className="rb-col">
            <h3>Slots disponibles</h3>
            <div className="rb-slots">
              {availableRaw.map((s) => (
                <span key={s} className={`rb-slot ${s === active ? "active" : ""}`}>
                  {String(s).toUpperCase()}
                </span>
              ))}
            </div>

            <p className="rb-muted" style={{ marginTop: 10 }}>
              * “legacy” = antiguo node/pm2 (si lo mantienes preparado).
              <br />
              * “LKG” = último slot marcado como estable (para rollback rápido “seguro”).
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
                // disabled si:
                // - submitting
                // - target normal = ya activo
                // - target lkg = no existe o ya estás en lkg
                const disabled =
                  submitting ||
                  (s !== "lkg" && s === active) ||
                  (s === "lkg" && (!lkg || active === lkg));

                const title =
                  s === "lkg"
                    ? !lkg
                      ? "No hay LKG definido aún (haz deploy y marca LKG en el backend/agent)"
                      : active === lkg
                        ? "Ya estás en LKG"
                        : `Volver a LKG → ${String(lkg).toUpperCase()}`
                    : s === active
                      ? "Ya está activo"
                      : "Seleccionar target";

                return (
                  <button
                    key={s}
                    type="button"
                    className={`rb-target ${target === s ? "selected" : ""}`}
                    disabled={disabled}
                    onClick={() => setTarget(s)}
                    title={title}
                  >
                    {s === "lkg" ? (lkg ? `LKG → ${String(lkg).toUpperCase()}` : "LKG") : String(s).toUpperCase()}
                    {s !== "lkg" && s === active ? " (activo)" : ""}
                    {s === "lkg" && lkg && active === lkg ? " (activo)" : ""}
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
              placeholder={
                target === "lkg"
                  ? "Ej: Incidente en prod tras deploy. Volvemos a Last Known Good."
                  : "Ej: Rollback por errores 5xx tras deploy, volvemos a la última versión estable."
              }
              rows={4}
              disabled={submitting}
            />
            <small className="rb-help">
              Mínimo 10 caracteres. Esto es clave para auditoría y trazabilidad.
            </small>
          </label>

          <label className="rb-label">
            Confirmación (escribe <strong>{expectedConfirm}</strong> para habilitar el botón)
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Escribe ${expectedConfirm}`}
              disabled={submitting}
            />
            <small className="rb-help">
              Evita rollbacks accidentales.
            </small>
          </label>

          <div className="rb-actions">
            <button type="submit" className="rb-btn rb-btn-danger" disabled={!canSubmit}>
              {submitting ? "Ejecutando…" : `Rollback a ${selectedLabel}`}
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

          {alreadyOnTarget && (
            <p className="rb-muted" style={{ marginTop: 10 }}>
              Ya estás en {target === "lkg" ? `LKG (${String(lkg).toUpperCase()})` : targetUpper}.
            </p>
          )}

          {target === "lkg" && !lkg && (
            <p className="rb-muted" style={{ marginTop: 10 }}>
              No hay LKG definido todavía. El backend debe exponer <code className="rb-code">api.lkg</code> en <code className="rb-code">/api/status</code>.
            </p>
          )}
        </form>
      </section>

      <section className="rb-card rb-card-note">
        <h3>Qué hace el botón realmente</h3>
        <ul className="rb-ul">
          <li>
            Cambia el symlink de Nginx para apuntar a{" "}
            <code className="rb-code">blue</code>, <code className="rb-code">green</code>, <code className="rb-code">legacy</code> o{" "}
            <code className="rb-code">LKG</code> (slot marcado como estable).
          </li>
          <li>Recarga Nginx (sin cortar conexiones).</li>
          <li>No rebuild, no deploy: solo cambia el “camino” de producción en segundos.</li>
        </ul>
      </section>
    </div>
  );
}
