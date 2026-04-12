import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../../utils/api";
import "./ApiRollbackPage.css";

const API_BASE = "/admin/system";

// Warning si el slot destino lleva más de estos días sin deploy
const STALE_DAYS = 14;

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

function timeAgo(ts) {
  if (!ts) return null;
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 0) return null;
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(h / 24);
  if (d >= 1) return `hace ${d}d`;
  if (h >= 1) return `hace ${h}h`;
  const m = Math.floor(diff / 60_000);
  return `hace ${m}m`;
}

function daysSince(ts) {
  if (!ts) return Infinity;
  return (Date.now() - new Date(ts).getTime()) / 86_400_000;
}

function SlotSummary({ name, meta, active, lkg }) {
  const days = daysSince(meta?.deployedAt);
  const stale = days > STALE_DAYS;
  return (
    <div className={`rb-slot-card ${name === active ? "active" : ""}`}>
      <div className="rb-slot-card-head">
        <span className={`rb-badge ${name === "blue" ? "blue" : name === "green" ? "green" : "warn"}`}>
          {name.toUpperCase()}
        </span>
        <span className="rb-slot-tags">
          {name === active && <span className="rb-tag rb-tag-active">ACTIVO</span>}
          {name === lkg && <span className="rb-tag rb-tag-lkg">LKG</span>}
          {stale && meta?.deployedAt && <span className="rb-tag rb-tag-stale" title={`Deploy hace ${Math.round(days)} días`}>VIEJO</span>}
        </span>
      </div>
      {meta ? (
        <div className="rb-slot-card-body">
          <div className="rb-slot-line">
            <span className="rb-slot-label">SHA</span>
            <code className="rb-code">{meta.deployShaShort || "?"}</code>
          </div>
          <div className="rb-slot-line">
            <span className="rb-slot-label">Deploy</span>
            <span title={meta.deployedAt}>{timeAgo(meta.deployedAt) || "—"}</span>
          </div>
          {meta.commitSubject && (
            <div className="rb-slot-subject" title={meta.commitSubject}>
              {meta.commitSubject}
            </div>
          )}
        </div>
      ) : (
        <div className="rb-slot-card-body rb-muted">Sin deploy construido.</div>
      )}
    </div>
  );
}

export default function ApiRollbackPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const reqSeq = useRef(0);

  const [target, setTarget] = useState("blue");
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const active = status?.api?.active || "unknown";
  const lkg = status?.api?.lkg || null;
  const lkgMeta = status?.api?.lkgMeta || null;
  const slotsMeta = status?.api?.slots || {};
  const availableFromBackend = status?.api?.available;

  // ✅ La lista "available" viene del agent (slots con /ready OK).
  // Si no viene, fallback a blue/green.
  const available = useMemo(() => {
    const base = Array.isArray(availableFromBackend) && availableFromBackend.length
      ? availableFromBackend
      : ["blue", "green"];
    const hasLkg = !!lkg && base.includes(lkg);
    return hasLkg ? ["lkg", ...base] : base;
  }, [availableFromBackend, lkg]);

  const targetUpper = useMemo(
    () => String(target || "").toUpperCase(),
    [target]
  );

  const expectedConfirm = useMemo(() => {
    if (target === "lkg") return "ROLLBACK:LKG";
    return `ROLLBACK:${targetUpper}`;
  }, [target, targetUpper]);

  const resolvedTargetSlot = target === "lkg" ? lkg : target;
  const resolvedMeta = resolvedTargetSlot ? slotsMeta[resolvedTargetSlot] : null;
  const resolvedStaleDays = daysSince(resolvedMeta?.deployedAt);
  const resolvedStale = resolvedMeta && resolvedStaleDays > STALE_DAYS;

  const canSubmit = useMemo(() => {
    const rOk = reason.trim().length >= 10;
    const cOk = confirmText.trim().toUpperCase() === String(expectedConfirm).toUpperCase();
    if (submitting) return false;

    if (target === "lkg") {
      if (!lkg) return false;
      return rOk && cOk && active !== lkg;
    }

    return rOk && cOk && active !== target;
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
    const mySeq = ++reqSeq.current;

    setErr("");
    setOkMsg("");
    setLoading(true);

    try {
      const { data } = await api.get(`${API_BASE}/api/status`);
      if (mySeq !== reqSeq.current) return;

      setStatus(data);
      setLastRefreshedAt(data?.ts ? Number(data.ts) : Date.now());

      const nextLkg = data?.api?.lkg || null;
      const nextAvail = Array.isArray(data?.api?.available) && data.api.available.length
        ? data.api.available
        : ["blue", "green"];

      const nextAvailList = nextLkg ? ["lkg", ...nextAvail] : nextAvail;

      if (!nextAvailList.includes(target)) {
        setTarget(nextLkg ? "lkg" : nextAvail[0] || "blue");
      }
    } catch (e) {
      if (mySeq !== reqSeq.current) return;

      setStatus(null);
      setErr(e?.response?.data?.message || e?.message || "No se pudo obtener el estado");
    } finally {
      if (mySeq === reqSeq.current) setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get(`${API_BASE}/api/rollback/history?limit=10`);
      setHistory(data?.items || data?.data?.items || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doRollback = async (e) => {
    e.preventDefault();
    setErr("");
    setOkMsg("");

    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const payload = {
        target,
        reason: reason.trim(),
        confirm: confirmText.trim().toUpperCase(),
      };
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
      await fetchHistory();
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
            Cambia la versión activa (blue/green) en producción sin downtime,
            usando el switch de Nginx.
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

            <p className="rb-line">
              Last Known Good:{" "}
              {lkg ? (
                <Badge tone={lkgTone}>{String(lkg).toUpperCase()}</Badge>
              ) : (
                <Badge tone="neutral">NO DEFINIDO</Badge>
              )}
            </p>

            {lkgMeta && (
              <div className="rb-lkg-meta">
                {lkgMeta.deployShaShort && (
                  <div>SHA: <code className="rb-code">{lkgMeta.deployShaShort}</code></div>
                )}
                {lkgMeta.updatedAt && (
                  <div className="rb-muted">Marcado: {humanNow(lkgMeta.updatedAt)} ({timeAgo(lkgMeta.updatedAt)})</div>
                )}
                {lkgMeta.reason && (
                  <div className="rb-muted">Razón: {lkgMeta.reason}</div>
                )}
                {lkgMeta.commitSubject && (
                  <div className="rb-muted rb-lkg-subject" title={lkgMeta.commitSubject}>
                    {lkgMeta.commitSubject}
                  </div>
                )}
                {lkgMeta.reason === "bootstrap" && (
                  <div className="rb-warn-inline">
                    ⚠️ LKG en "bootstrap" — aún no se ha marcado un deploy real como estable.
                  </div>
                )}
              </div>
            )}

            <p className="rb-muted">Último refresh: {humanNow(lastRefreshedAt)}</p>
          </div>

          <div className="rb-col">
            <h3>Slots</h3>
            <div className="rb-slot-grid">
              {["blue", "green"].map((s) => (
                <SlotSummary key={s} name={s} meta={slotsMeta[s]} active={active} lkg={lkg} />
              ))}
            </div>
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
                const disabled =
                  submitting ||
                  (s !== "lkg" && s === active) ||
                  (s === "lkg" && (!lkg || active === lkg));

                const title =
                  s === "lkg"
                    ? !lkg
                      ? "No hay LKG definido aún (deployar marca LKG automáticamente)"
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

          {resolvedStale && (
            <div className="rb-warn-block">
              ⚠️ El slot <strong>{resolvedTargetSlot?.toUpperCase()}</strong> tiene un
              deploy de hace <strong>{Math.round(resolvedStaleDays)} días</strong>
              {resolvedMeta?.commitSubject && <> ({resolvedMeta.commitSubject})</>}.
              Si la DB ha cambiado de esquema, volver aquí puede romper cosas. Confirma
              que el código de ese slot sigue siendo compatible.
            </div>
          )}

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
              Mínimo 10 caracteres. Se guarda en auditoría.
            </small>
          </label>

          <label className="rb-label">
            Confirmación (escribe <strong>{expectedConfirm}</strong> para habilitar el botón)
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedConfirm} disabled={submitting}
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
        </form>
      </section>

      <section className="rb-card">
        <div className="rb-row" style={{ alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Historial de rollbacks (últimos 10)</h3>
          <button className="rb-btn rb-btn-ghost" onClick={fetchHistory} disabled={historyLoading}>
            🔄
          </button>
        </div>

        {historyLoading && <p className="rb-muted">Cargando historial…</p>}
        {!historyLoading && history.length === 0 && (
          <p className="rb-muted">Sin rollbacks registrados.</p>
        )}
        {!historyLoading && history.length > 0 && (
          <div className="rb-history">
            {history.map((h, i) => (
              <div key={i} className={`rb-history-item ${h.ok ? "ok" : "fail"}`}>
                <div className="rb-history-head">
                  <span className={`rb-badge ${h.ok ? "ok" : "warn"}`}>
                    {h.ok ? "OK" : "FAIL"}
                  </span>
                  <span className="rb-history-when">{humanNow(h.ts)}</span>
                  {h.actor?.email && (
                    <span className="rb-muted">· {h.actor.email}</span>
                  )}
                </div>
                <div className="rb-history-body">
                  {h.ok ? (
                    <span>
                      <code className="rb-code">{(h.slotBefore || "?").toUpperCase()}</code>
                      {" → "}
                      <code className="rb-code">{(h.switchedTo || "?").toUpperCase()}</code>
                      {h.target === "lkg" && " (via LKG)"}
                    </span>
                  ) : (
                    <span className="rb-muted">{h.error || h.message}</span>
                  )}
                </div>
                {h.reason && <div className="rb-history-reason">"{h.reason}"</div>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rb-card rb-card-note">
        <h3>Qué hace el botón realmente</h3>
        <ul className="rb-ul">
          <li>
            Cambia el symlink de Nginx para apuntar a{" "}
            <code className="rb-code">blue</code>, <code className="rb-code">green</code> o{" "}
            <code className="rb-code">LKG</code> (último slot marcado como estable).
          </li>
          <li>Recarga Nginx (sin cortar conexiones).</li>
          <li>Drena print-agents del slot viejo para que reconecten al nuevo.</li>
          <li>Persiste el rollback en auditoría (quién, cuándo, motivo, from/to).</li>
          <li>No rebuild, no deploy: solo cambia el "camino" de producción en segundos.</li>
        </ul>
      </section>
    </div>
  );
}
