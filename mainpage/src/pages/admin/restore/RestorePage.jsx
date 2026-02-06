import { useEffect, useMemo, useState } from "react";
import api from "../../../utils/api.js";
import "./RestorePage.css";
import MongoTenantRestoreCard from "./components/MongoTenantRestoreCard";
import ModalConfirmacion from "../../../components/Modal/ModalConfirmacion.jsx";

const API_BASE = "/admin/system";

function StatusDot({ state }) {
  return <span className={`status-dot ${state}`} />;
}

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

function nowDate() {
  try {
    return new Date().toLocaleDateString();
  } catch {
    return "—";
  }
}

// Modal simple (sin deps externas)
function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="rb-modal-overlay" onClick={onClose}>
      <div className="rb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rb-modal-header">
          <h3>{title}</h3>
          <button className="rb-btn rb-btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="rb-modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function RestorePage() {
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState([]);
  const [backupStatus, setBackupStatus] = useState(null);

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // ---- Stage workflow
  const [stageOpen, setStageOpen] = useState(false);
  const [stageSnapshot, setStageSnapshot] = useState(null);
  const [stageReason, setStageReason] = useState("");
  const [stageConfirm, setStageConfirm] = useState("");
  const [staging, setStaging] = useState(false);

  // ---- Current staged restore
  const [restoreId, setRestoreId] = useState("");
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffs, setDiffs] = useState([]);

  // ---- Apply workflow
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyReason, setApplyReason] = useState("");
  const [applyConfirm, setApplyConfirm] = useState("");
  const [applying, setApplying] = useState(false);

  // ---- Diff expand/collapse
  const [expanded, setExpanded] = useState(() => new Set());

  // ---- RGPD Export
  const [rgpdTenant, setRgpdTenant] = useState("");
  const [rgpdOpen, setRgpdOpen] = useState(false);
  const [rgpdExporting, setRgpdExporting] = useState(false);

  // ---- Snapshot workflow
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [snapshotReason, setSnapshotReason] = useState("");
  const [snapshotType, setSnapshotType] = useState("manual");
  const [snapshotting, setSnapshotting] = useState(false);

  const DOC_TEXT = useMemo(() => {
    return `DISASTER RECOVERY — ALEF (SaaS)

Versión: 1.0
Última revisión: ${nowDate()}

--------------------------------------------------
1. OBJETIVO
--------------------------------------------------
Garantizar que el sistema Alef pueda recuperarse
rápidamente ante errores críticos, caídas de servidor,
deploys defectuosos o corrupción de configuración.

Objetivo:
- RTO bajo (minutos)
- Cero pérdida de datos críticos (config/operación)
- Recuperación reproducible y auditable

--------------------------------------------------
2. COMPONENTES CRÍTICOS
--------------------------------------------------
- API (Docker blue/green)
- Nginx (reverse proxy + routing)
- Configuración de blue/green/legacy (symlink activo)
- Scripts operativos:
  - alef-api-switch
  - alef-api-deploy
- Datos compartidos:
  - uploads
  - logs
  - certificados

--------------------------------------------------
3. BACKUPS
--------------------------------------------------
Herramienta: restic
Destino: Cloudflare R2 (S3 compatible)

Se respaldan:
- /etc/nginx
- /opt/alef/api/shared
- /opt/alef/api/docker-compose.yml
- /usr/local/bin/alef-api-switch
- /usr/local/bin/alef-api-deploy

Política de retención (ejemplo):
- 7 diarios
- 4 semanales
- 6 mensuales

--------------------------------------------------
4. ROLLBACK RÁPIDO (SIN RESTORE)
--------------------------------------------------
Usar si el problema es un deploy defectuoso:

1) Panel Superadmin → Rollback API
2) Elegir blue / green / legacy
3) Motivo obligatorio + confirmación

Esto:
- Cambia symlink de Nginx
- Recarga Nginx (sin downtime)
- No reconstruye ni borra datos

Tiempo: segundos

--------------------------------------------------
5. RESTORE COMPLETO (DESASTRE REAL)
--------------------------------------------------
Usar SOLO si:
- Config/Nginx/scripts críticos dañados o perdidos
- Se necesita volver a un estado operativo conocido
- Hay dudas de integridad del filesystem operativo

Procedimiento (controlado):
A) Stage (NO toca prod)
   - Restaurar snapshot a carpeta segura
B) Diff
   - Comparar staged vs sistema actual
C) Apply
   - Aplicar solo targets whitelisted
   - Backup local previo
   - nginx -t y reload

--------------------------------------------------
6. PRINCIPIOS DE SEGURIDAD
--------------------------------------------------
- No hay restores automáticos desde UI
- Requiere superadmin
- Motivo obligatorio
- Confirmaciones explícitas (anti-misclick)
- Auditoría (logs)

--------------------------------------------------
7. CONCLUSIÓN
--------------------------------------------------
Alef dispone de:
✔ Backups automáticos
✔ Restore probado (restore drill)
✔ Rollback inmediato (blue/green)
✔ Procedimientos documentados

El sistema está preparado para operación real SaaS.
`;
  }, []);

  const downloadDoc = () => {
    const blob = new Blob([DOC_TEXT], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alef-disaster-recovery.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const fetchAll = async () => {
    setError("");
    setOkMsg("");
    setLoading(true);

    try {
      const [st, sn] = await Promise.all([
        api.get(`${API_BASE}/backup/status`),
        api.get(`${API_BASE}/backup/snapshots`),
      ]);

      setBackupStatus(st.data?.ok ? st.data : null);
      setSnapshots(sn.data?.snapshots || []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "No se pudo cargar el estado de backups");
    } finally {
      setLoading(false);
    }
  };

  const fetchDiff = async (rid) => {
    if (!rid) return;
    setDiffLoading(true);
    setError("");
    try {
      const { data } = await api.get(`${API_BASE}/backup/restore/diff`, {
        params: { restoreId: rid },
      });
      setDiffs(data?.diffs || []);
      // por defecto abrimos los que tienen cambios
      const next = new Set();
      (data?.diffs || []).forEach((d, idx) => {
        if (d?.changed) next.add(idx);
      });
      setExpanded(next);
    } catch (e) {
      setDiffs([]);
      setError(e?.response?.data?.message || e?.message || "No se pudo generar diff");
    } finally {
      setDiffLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const repoTone = useMemo(() => {
    if (!backupStatus) return "neutral";
    return backupStatus.repoOk ? "ok" : "warn";
  }, [backupStatus]);

  const openStageModal = (snap) => {
    setOkMsg("");
    setError("");
    setStageSnapshot(snap);
    setStageReason("");
    setStageConfirm("");
    setStageOpen(true);
  };

  const doStage = async () => {
    if (!stageSnapshot?.id) return;

    const expected = `RESTORE:${stageSnapshot.id}`;
    if (stageReason.trim().length < 10) {
      setError("Motivo obligatorio (mín. 10 caracteres).");
      return;
    }
    if (stageConfirm.trim() !== expected) {
      setError(`Confirmación inválida. Debe ser: ${expected}`);
      return;
    }

    setStaging(true);
    setError("");
    setOkMsg("");

    try {
      const payload = {
        snapshotId: stageSnapshot.id,
        reason: stageReason.trim(),
        confirm: stageConfirm.trim(),
      };

      const { data } = await api.post(`${API_BASE}/backup/restore/stage`, payload);

      const rid = data?.restoreId;
      setRestoreId(rid || "");
      setStageOpen(false);

      setOkMsg(`✅ Stage completado. restoreId=${rid}`);
      await fetchDiff(rid);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Stage falló");
    } finally {
      setStaging(false);
    }
  };

  const openApplyModal = () => {
    setOkMsg("");
    setError("");
    setApplyReason("");
    setApplyConfirm("");
    setApplyOpen(true);
  };

  const doApply = async () => {
    if (!restoreId) return;

    const expected = `APPLY:${restoreId}`;
    if (applyReason.trim().length < 10) {
      setError("Motivo obligatorio (mín. 10 caracteres).");
      return;
    }
    if (applyConfirm.trim() !== expected) {
      setError(`Confirmación inválida. Debe ser: ${expected}`);
      return;
    }

    setApplying(true);
    setError("");
    setOkMsg("");

    try {
      const payload = {
        restoreId,
        reason: applyReason.trim(),
        confirm: applyConfirm.trim(),
      };

      const { data } = await api.post(`${API_BASE}/backup/restore/apply`, payload);

      setApplyOpen(false);
      setOkMsg(`✅ Restore aplicado correctamente. Backup local: ${data?.backupDir || "—"}`);

      // refrescamos estado general
      await fetchAll();
      // y re-diff por si quieres ver que quedó igual
      await fetchDiff(restoreId);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Apply falló");
    } finally {
      setApplying(false);
    }
  };

  const toggleExpanded = (idx) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const doCreateSnapshot = async () => {
    if (snapshotReason.trim().length < 10) {
      setError("Motivo obligatorio (mín. 10 caracteres).");
      return;
    }

    setSnapshotting(true);
    setError("");
    setOkMsg("");

    try {
      const payload = {
        reason: snapshotReason.trim(),
        type: snapshotType, // manual | golden | pre-deploy
      };

      const { data } = await api.post(
        `${API_BASE}/backup/snapshot`,
        payload
      );

      setSnapshotOpen(false);
      setSnapshotReason("");
      setSnapshotType("manual");

      setOkMsg(`📸 Snapshot creado correctamente: ${data?.snapshotId || "—"}`);

      // refrescamos lista
      await fetchAll();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
        e?.message ||
        "No se pudo crear el snapshot"
      );
    } finally {
      setSnapshotting(false);
    }
  };

  const hasChanges = useMemo(() => {
    return (diffs || []).some((d) => d?.changed === true);
  }, [diffs]);

  if (loading) {
    return (
      <div className="restore-page">
        <header className="restore-header">
          <h2>Restore & Disaster Recovery</h2>
          <p className="muted">Cargando…</p>
        </header>
      </div>
    );
  }

  return (
    <div className="restore-page">
      <header className="restore-header">
        <div>
          <h2>Restore & Disaster Recovery</h2>
          <p className="muted">
            Centro de recuperación del sistema Alef. Consulta backups, ejecuta stage/diff/apply de forma controlada y auditable.
          </p>
        </div>

        <button className="rb-btn rb-btn-ghost" onClick={fetchAll}>
          🔄 Actualizar
        </button>
      </header>

      {error && <div className="rb-alert rb-alert-error">❌ {error}</div>}
      {okMsg && <div className="rb-alert rb-alert-ok">{okMsg}</div>}

      {/* ====== STATUS ====== */}
      <section className="restore-card">
        <div className="restore-card-header">
          <h3>🧠 Estado de backups</h3>
          <Badge tone={repoTone}>{backupStatus?.repoOk ? "REPO OK" : "REPO ?"}</Badge>
        </div>

        <div className="restore-kpis">
          <div className="restore-kpi">
            <span className="kpi-label">Snapshots</span>
            <span className="kpi-value">{backupStatus?.snapshotsCount ?? "—"}</span>
          </div>

          <div className="restore-kpi">
            <span className="kpi-label">Último refresh</span>
            <span className="kpi-value">{formatDate(Date.now())}</span>
          </div>
        </div>

        <p className="muted">
          * Backups gestionados con <strong>restic</strong> (R2). Restore recomendado: <strong>stage → diff → apply</strong>.
        </p>
      </section>

      {/* ====== DOCUMENTO ====== */}
      <section className="restore-card">
        <div className="restore-card-header">
          <h3>📘 Documento oficial — Disaster Recovery</h3>
          <button className="rb-btn rb-btn-primary" onClick={downloadDoc}>
            📥 Descargar .txt
          </button>
        </div>

        <p className="muted">Este documento es la fuente de verdad operativa. Descárgalo y guárdalo.</p>

        <pre className="restore-doc">{DOC_TEXT}</pre>
      </section>

      <MongoTenantRestoreCard />

      {/* ====== SNAPSHOTS ====== */}
      <section className="restore-card">
        <div className="restore-card-header">
          <h3>🗂 Snapshots disponibles</h3>

          <div className="restore-right-actions">
            <span className="muted">Selecciona uno para hacer <strong>Stage</strong>.</span>

            <button
              className="rb-btn rb-btn-primary"
              onClick={() => {
                setError("");
                setOkMsg("");
                setSnapshotReason("");
                setSnapshotType("manual");
                setSnapshotOpen(true);
              }}
            >
              📸 Crear snapshot
            </button>
          </div>
        </div>

        {!snapshots.length && <p className="muted">No hay snapshots disponibles.</p>}

        {!!snapshots.length && (
          <div className="table-wrapper">
            <table className="restore-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Host</th>
                  <th>Paths</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <code>{s.id}</code>
                    </td>
                    <td>{formatDate(s.time)}</td>
                    <td>{s.hostname || "—"}</td>
                    <td className="paths">{(s.paths || []).join(", ")}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="rb-btn rb-btn-danger" onClick={() => openStageModal(s)}>
                        🧪 Stage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ====== DIFF ====== */}
      <section className="restore-card">
        <div className="restore-card-header">
          <h3>🔍 Diff (staged vs live)</h3>

          <div className="restore-right-actions">
            <Badge tone={restoreId ? "ok" : "neutral"}>{restoreId ? `RESTORE ID: ${restoreId}` : "SIN STAGING"}</Badge>
            <button
              className="rb-btn rb-btn-ghost"
              onClick={() => fetchDiff(restoreId)}
              disabled={!restoreId || diffLoading}
              title={!restoreId ? "Primero ejecuta Stage" : "Actualizar diff"}
            >
              🔄 Refrescar diff
            </button>

            <button
              className="rb-btn rb-btn-primary"
              onClick={openApplyModal}
              disabled={!restoreId || applying}
              title={!restoreId ? "Primero ejecuta Stage" : "Aplicar restore"}
            >
              ✅ Apply
            </button>
          </div>
        </div>

        {!restoreId && (
          <p className="muted">
            Aún no hay staging. Ejecuta <strong>Stage</strong> sobre un snapshot para generar un restoreId.
          </p>
        )}

        {diffLoading && <p className="muted">Generando diff…</p>}

        {!!restoreId && !diffLoading && (
          <>
            {!diffs.length && <p className="muted">No hay diffs disponibles.</p>}

            {!!diffs.length && (
              <div className="diff-list">
                {diffs.map((d, idx) => {
                  const state = d?.existsInStaging === false ? "missing" : d?.changed ? "changed" : "ok";
                  const open = expanded.has(idx);

                  const tone =
                    state === "changed" ? "warn" : state === "missing" ? "danger" : "ok";

                  return (
                    <div key={`${d.target}-${idx}`} className={`diff-item ${open ? "open" : ""}`}>
                      <button className="diff-head" onClick={() => toggleExpanded(idx)} type="button">
                        <div className="diff-left">
                          <StatusDot state={state === "ok" ? "ok" : state === "missing" ? "down" : "degraded"} />
                          <span className="diff-title">{d.target}</span>
                        </div>

                        <div className="diff-right">
                          <Badge tone={tone}>
                            {state === "ok" ? "NO CHANGES" : state === "missing" ? "MISSING" : "CHANGED"}
                          </Badge>
                          <span className="diff-caret">{open ? "▾" : "▸"}</span>
                        </div>
                      </button>

                      {open && (
                        <div className="diff-body">
                          <div className="diff-meta">
                            <div>
                              <span className="muted">staged:</span>{" "}
                              <code className="rb-code">{d.staged}</code>
                            </div>
                            <div>
                              <span className="muted">exists:</span>{" "}
                              <code className="rb-code">{String(d.existsInStaging)}</code>
                            </div>
                          </div>

                          <pre className="diff-pre">
                            {d.diff?.trim() ? d.diff : "— (sin diferencias detectadas) —"}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <p className="muted" style={{ marginTop: 10 }}>
              {hasChanges
                ? "⚠️ Hay cambios. Antes de Apply revisa especialmente /etc/nginx y scripts."
                : "✅ No hay cambios detectados en targets (o el staging coincide)."}
            </p>
          </>
        )}
      </section>

      {/* ====== MODAL STAGE ====== */}
      <Modal
        open={stageOpen}
        title={`Stage restore: ${stageSnapshot?.id || "—"}`}
        onClose={() => (staging ? null : setStageOpen(false))}
      >
        <p className="muted">
          Esto restaura el snapshot a una carpeta segura (NO toca producción). Luego podrás ver el diff y decidir si aplicas.
        </p>

        <label className="rb-label">
          Motivo (obligatorio)
          <textarea
            rows={4}
            value={stageReason}
            onChange={(e) => setStageReason(e.target.value)}
            placeholder="Ej: Restore drill mensual. Probamos staging y diff sin tocar prod."
            disabled={staging}
          />
          <small className="rb-help">Mínimo 10 caracteres.</small>
        </label>

        <label className="rb-label">
          Confirmación (escribe <strong>{`RESTORE:${stageSnapshot?.id || ""}`}</strong>)
          <input
            value={stageConfirm}
            onChange={(e) => setStageConfirm(e.target.value)}
            placeholder={`RESTORE:${stageSnapshot?.id || ""}`}
            disabled={staging}
          />
          <small className="rb-help">Evita ejecuciones accidentales.</small>
        </label>

        <div className="rb-actions">
          <button className="rb-btn rb-btn-danger" onClick={doStage} disabled={staging}>
            {staging ? "Ejecutando…" : "Ejecutar Stage"}
          </button>

          <button className="rb-btn rb-btn-ghost" onClick={() => setStageOpen(false)} disabled={staging}>
            Cancelar
          </button>
        </div>
      </Modal>

      {/* ====== MODAL APPLY ====== */}
      <Modal
        open={applyOpen}
        title={`Apply restore: ${restoreId || "—"}`}
        onClose={() => (applying ? null : setApplyOpen(false))}
      >
        <p className="muted">
          ⚠️ Esto aplica el restore a targets whitelisted y recarga Nginx. Se crea un backup local previo.
        </p>

        <label className="rb-label">
          Motivo (obligatorio)
          <textarea
            rows={4}
            value={applyReason}
            onChange={(e) => setApplyReason(e.target.value)}
            placeholder="Ej: Nginx quedó corrupto por cambio manual, restauramos a estado estable."
            disabled={applying}
          />
          <small className="rb-help">Mínimo 10 caracteres.</small>
        </label>

        <label className="rb-label">
          Confirmación (escribe <strong>{`APPLY:${restoreId}`}</strong>)
          <input
            value={applyConfirm}
            onChange={(e) => setApplyConfirm(e.target.value)}
            placeholder={`APPLY:${restoreId}`}
            disabled={applying}
          />
          <small className="rb-help">Evita restores fatales por error humano.</small>
        </label>

        <div className="rb-actions">
          <button className="rb-btn rb-btn-danger" onClick={doApply} disabled={applying || !restoreId}>
            {applying ? "Aplicando…" : "Aplicar restore"}
          </button>

          <button className="rb-btn rb-btn-ghost" onClick={() => setApplyOpen(false)} disabled={applying}>
            Cancelar
          </button>
        </div>
      </Modal>
      {/* ====== MODAL SNAPSHOT ====== */}
      <Modal
        open={snapshotOpen}
        title="Crear snapshot del sistema"
        onClose={() => (snapshotting ? null : setSnapshotOpen(false))}
      >
        <p className="muted">
          Esto crea un snapshot completo del sistema (configuración, nginx, scripts y datos compartidos).
          No afecta a producción.
        </p>

        <label className="rb-label">
          Tipo de snapshot
          <select
            value={snapshotType}
            onChange={(e) => setSnapshotType(e.target.value)}
            disabled={snapshotting}
          >
            <option value="manual">Manual</option>
            <option value="golden">Golden (estado estable)</option>
            <option value="pre-deploy">Pre-deploy</option>
          </select>
          <small className="rb-help">
            Golden = punto estable recomendado antes de releases importantes.
          </small>
        </label>

        <label className="rb-label">
          Motivo (obligatorio)
          <textarea
            rows={4}
            value={snapshotReason}
            onChange={(e) => setSnapshotReason(e.target.value)}
            placeholder="Ej: Snapshot estable previo a venta / restore drill mensual."
            disabled={snapshotting}
          />
          <small className="rb-help">Mínimo 10 caracteres.</small>
        </label>

        <div className="rb-actions">
          <button
            className="rb-btn rb-btn-primary"
            onClick={doCreateSnapshot}
            disabled={snapshotting}
          >
            {snapshotting ? "Creando…" : "Crear snapshot"}
          </button>

          <button
            className="rb-btn rb-btn-ghost"
            onClick={() => setSnapshotOpen(false)}
            disabled={snapshotting}
          >
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  );
}
