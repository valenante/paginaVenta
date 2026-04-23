import { useEffect, useRef, useState } from "react";
import Modal from "react-modal";
import api from "../../../../utils/api";
import AlertaMensaje from "../../../../components/AlertaMensaje/AlertaMensaje";
import "../../../../styles/TenantModal.css";

Modal.setAppElement("#root");

export default function TenantModal({ tenant, onClose }) {
  // =========================
  // Estado (Tenant)
  // =========================
  const [ipTailscale, setIpTailscale] = useState(tenant?.ipTailscale || "");
  const [printSecret, setPrintSecret] = useState(tenant?.printSecret || "");
  const [printerName, setPrinterName] = useState(tenant?.printerName || "");

  // =========================
  // Estado (Impresoras por estación)
  // =========================
  const [impCocina, setImpCocina] = useState(tenant?.impresoras?.cocina || "");
  const [impBarra, setImpBarra] = useState(tenant?.impresoras?.barra || "");
  const [impCaja, setImpCaja] = useState(tenant?.impresoras?.caja || "");

  const [impresoras, setImpresoras] = useState([]);

  // =========================
  // Estado agente
  // =========================
  const [estado, setEstado] = useState(tenant?.estadoAgente || "offline");
  const [versionAgente, setVersionAgente] = useState(null);

  // =========================
  // UX
  // =========================
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(false);

  // =========================
  // Update
  // =========================
  const [releases, setReleases] = useState([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState("");
  const rollbackTimerRef = useRef(null);
  const pollRef = useRef(null);
  const [otaProgress, setOtaProgress] = useState(null); // { action, status, startedAt, error }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => { clearTimeout(rollbackTimerRef.current); clearInterval(pollRef.current); };
  }, []);

  // Poll agent status while OTA is running
  const startPolling = (action) => {
    setOtaProgress({ action, status: "running", startedAt: Date.now(), error: null });
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/admin/tenant/${tenant._id}/agente/status`);
        const update = data?.update;
        if (update?.status === "success") {
          clearInterval(pollRef.current);
          // OTA done — restart the service externally via SSH
          setOtaProgress((p) => ({ ...p, status: "restarting" }));
          try {
            await api.post(`/admin/tenant/${tenant._id}/restart-agente`);
            setOtaProgress((p) => ({ ...p, status: "success" }));
          } catch {
            setOtaProgress((p) => ({ ...p, status: "success", error: "Actualizado pero reinicio manual necesario" }));
          }
          setLoading(false);
        } else if (update?.status === "failed") {
          setOtaProgress((p) => ({ ...p, status: "failed", error: update?.error || "Error desconocido" }));
          clearInterval(pollRef.current);
          setLoading(false);
        }
        // else still running — keep polling
      } catch {
        // SSH/connection error — keep trying
      }
    }, 3000);

    // Timeout after 2 minutes
    setTimeout(() => {
      if (otaProgress?.status === "running") {
        clearInterval(pollRef.current);
        setOtaProgress((p) => p?.status === "running" ? { ...p, status: "timeout", error: "Tiempo agotado. Verifica manualmente." } : p);
        setLoading(false);
      }
    }, 120000);
  };

  // =========================
  // Sync tenant
  // =========================
  useEffect(() => {
    setIpTailscale(tenant?.ipTailscale || "");
    setPrintSecret(tenant?.printSecret || "");
    setPrinterName(tenant?.printerName || "");
    setEstado(tenant?.estadoAgente || "offline");

    setImpCocina(tenant?.impresoras?.cocina || "");
    setImpBarra(tenant?.impresoras?.barra || "");
    setImpCaja(tenant?.impresoras?.caja || "");

    setImpresoras([]);
    setAlerta(null);
    setLoading(false);
  }, [tenant?._id]);

  // =========================
  // Actions
  // =========================
  const listarImpresoras = async () => {
    if (!tenant?._id) return;

    try {
      setLoading(true);
      setAlerta({ tipo: "info", mensaje: "🔎 Buscando impresoras..." });

      const { data } = await api.get(`/impresoras/admin/${tenant._id}/listar`);
      const lista = Array.isArray(data?.impresoras) ? data.impresoras : [];

      setImpresoras(lista);
      setAlerta({
        tipo: "success",
        mensaje: `Se detectaron ${lista.length} impresoras`,
      });
    } catch {
      setAlerta({
        tipo: "error",
        mensaje: "No se pudo obtener la lista de impresoras",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tenant?._id) return;

    (async () => {
      try {
        const { data } = await api.get("/admin/tenant/print-agent/releases");
        const list = Array.isArray(data?.releases) ? data.releases : [];
        setReleases(list);
        setSelectedReleaseId(list[0]?.releaseId || "");
      } catch (e) {
        setReleases([]);
        setSelectedReleaseId("");
      }
    })();
  }, [tenant?._id]);

  const guardarConfig = async () => {
    if (!tenant?._id) return;

    try {
      setLoading(true);
      setAlerta({ tipo: "info", mensaje: "Guardando configuración..." });

      const body = {
        printSecret,
        printerName,
        impresoras: {
          cocina: impCocina,
          barra: impBarra,
          caja: impCaja,
        },
      };
      if (ipTailscale) body.ipTailscale = ipTailscale;
      await api.put(`/admin/tenant/${tenant._id}/config-impresion`, body);

      setAlerta({
        tipo: "success",
        mensaje: "Configuración guardada correctamente",
      });
    } catch {
      setAlerta({
        tipo: "error",
        mensaje: "Error al guardar la configuración",
      });
    } finally {
      setLoading(false);
    }
  };

  const actualizarAgente = async () => {
    if (!tenant?._id) return;

    try {
      setLoading(true);
      const rel = releases.find((r) => r.releaseId === selectedReleaseId);

      if (!rel?.url || !rel?.sha256) {
        setAlerta({ tipo: "error", mensaje: "No hay una release valida seleccionada" });
        setLoading(false);
        return;
      }

      await api.post(`/admin/tenant/${tenant._id}/actualizar-agente`, {
        releaseUrl: rel.url,
        sha256: rel.sha256,
        version: rel.releaseId || rel.version,
      });

      startPolling("update");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err.message || "Error desconocido";
      setAlerta({ tipo: "error", mensaje: msg });
      setLoading(false);
    }
  };

  const rollbackAgente = async () => {
    if (!tenant?._id) return;

    try {
      setLoading(true);
      await api.post(`/admin/tenant/${tenant._id}/rollback-agente`);
      startPolling("rollback");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detalle ||
        err.message ||
        "Error desconocido";

      setAlerta({ tipo: "error", mensaje: msg });
    } finally {
      setLoading(false);
    }
  };

  const testPrint = async (impresora) => {
    if (!tenant?._id) return;

    try {
      setLoading(true);
      setAlerta({ tipo: "info", mensaje: "Enviando prueba de impresión..." });

      const payload = impresora ? { impresora } : {};
      const { data } = await api.post(
        `/impresoras/admin/${tenant._id}/test`,
        payload
      );

      setAlerta({
        tipo: "success",
        mensaje: data?.message || "Prueba enviada",
      });
    } catch {
      setAlerta({
        tipo: "error",
        mensaje: "Error al enviar prueba de impresión",
      });
    } finally {
      setLoading(false);
    }
  };

  const verificarConexion = async () => {
    if (!tenant?._id) return;

    try {
      setLoading(true);

      const { data: raw } = await api.get(`/admin/tenant/${tenant._id}/ping-agente`);
      const payload = raw?.data || raw;

      setEstado(payload?.ok ? "online" : "offline");
      setVersionAgente(payload?.version || null);

      setAlerta({
        tipo: payload?.ok ? "success" : "error",
        mensaje: payload?.ok
          ? `Agente en línea (${payload.ms} ms)`
          : "Agente fuera de línea",
      });
    } catch {
      setEstado("offline");
      setAlerta({
        tipo: "error",
        mensaje: "No se pudo contactar con el agente",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant?._id) verificarConexion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?._id]);

  // =========================
  // Helpers
  // =========================
  const renderPrinterOptions = () => (
    <>
      <option value="">-- (sin asignar / usar predeterminada) --</option>
      {impresoras.map((imp) => (
        <option key={imp} value={imp}>
          {imp}
        </option>
      ))}
    </>
  );

  const defaultOrHint = (v) => (v ? v : "(usa predeterminada)");

  // =========================
  // Render
  // =========================
  return (
    <Modal
      isOpen={!!tenant}
      onRequestClose={onClose}
      className="tenant-modal"
      overlayClassName="modal-overlay"
    >
      <h2>Detalles del Restaurante</h2>

      <div className="impresora-section">
        <label>Clave secreta</label>
        <input
          value={printSecret}
          onChange={(e) => setPrintSecret(e.target.value)}
          disabled={loading}
        />

        <label>Impresora predeterminada</label>
        <select
          value={printerName}
          onChange={(e) => setPrinterName(e.target.value)}
          disabled={loading}
        >
          <option value="">-- Selecciona una impresora --</option>
          {impresoras.map((imp) => (
            <option key={imp} value={imp}>
              {imp}
            </option>
          ))}
        </select>

        <div className="hint">
          <small>
            Cocina: <strong>{defaultOrHint(impCocina)}</strong> · Barra:{" "}
            <strong>{defaultOrHint(impBarra)}</strong> · Caja:{" "}
            <strong>{defaultOrHint(impCaja)}</strong>
          </small>
        </div>

        <hr />

        <h4>Impresoras por estación</h4>

        <label>Cocina</label>
        <select value={impCocina} onChange={(e) => setImpCocina(e.target.value)} disabled={loading}>
          {renderPrinterOptions()}
        </select>

        <label>Barra</label>
        <select value={impBarra} onChange={(e) => setImpBarra(e.target.value)} disabled={loading}>
          {renderPrinterOptions()}
        </select>

        <label>Caja</label>
        <select value={impCaja} onChange={(e) => setImpCaja(e.target.value)} disabled={loading}>
          {renderPrinterOptions()}
        </select>

        <div className="impresora-buttons">
          <button onClick={listarImpresoras} disabled={loading}>
            🔍 Listar impresoras
          </button>
          <button onClick={guardarConfig} disabled={loading}>
            💾 Guardar configuración
          </button>
          <button onClick={verificarConexion} disabled={loading}>
            🔄 Verificar conexión
          </button>
        </div>

        <div className="agente-update-box">
          <h4>🔧 Actualización del agente</h4>
          <label>Release</label>
          <select
            value={selectedReleaseId}
            onChange={(e) => setSelectedReleaseId(e.target.value)}
            disabled={loading}
          >
            <option value="">-- No hay releases disponibles --</option>
            {releases.map((r) => (
              <option key={r.releaseId} value={r.releaseId}>
                {r.releaseId} · {r.pkgVersion || "—"} · {r.commit || "—"}
              </option>
            ))}
          </select>

          <div className="agente-actions">
            <button
              className="btn-update-agente"
              onClick={actualizarAgente}
              disabled={estado !== "online" || loading}
            >
              🔄 Actualizar agente
            </button>

            <button
              className="btn-rollback-agente"
              onClick={rollbackAgente}
              disabled={estado !== "online" || loading}
              title="Vuelve a la version anterior (previous)"
            >
              ↩️ Rollback agente
            </button>
          </div>

          {/* OTA Progress */}
          {otaProgress && (
            <div className={`ota-progress ota-progress--${otaProgress.status}`}>
              <div className="ota-progress__header">
                <strong>{otaProgress.action === "update" ? "Actualizando" : "Rollback"}</strong>
                {(otaProgress.status === "running" || otaProgress.status === "restarting") && <span className="ota-progress__spinner">⏳</span>}
                {otaProgress.status === "success" && <span className="ota-progress__icon">✅</span>}
                {otaProgress.status === "failed" && <span className="ota-progress__icon">❌</span>}
                {otaProgress.status === "timeout" && <span className="ota-progress__icon">⏰</span>}
              </div>
              {otaProgress.status === "running" && (
                <div className="ota-progress__bar-wrap">
                  <div className="ota-progress__bar" />
                  <span className="ota-progress__text">Descargando y verificando...</span>
                </div>
              )}
              {otaProgress.status === "restarting" && (
                <div className="ota-progress__bar-wrap">
                  <div className="ota-progress__bar" />
                  <span className="ota-progress__text">Reiniciando servicio...</span>
                </div>
              )}
              {otaProgress.status === "success" && (
                <p className="ota-progress__msg">
                  Completado. El agente se ha reiniciado con la nueva version.
                  {otaProgress.error && <><br/><small>{otaProgress.error}</small></>}
                </p>
              )}
              {(otaProgress.status === "failed" || otaProgress.status === "timeout") && (
                <p className="ota-progress__msg">{otaProgress.error}</p>
              )}
              {otaProgress.status !== "running" && otaProgress.status !== "restarting" && (
                <button className="ota-progress__close" onClick={() => { setOtaProgress(null); verificarConexion(); }}>Cerrar</button>
              )}
            </div>
          )}
        </div>

        <div className="impresora-buttons">
          <button onClick={() => testPrint(printerName)} disabled={loading}>
            🧾 Prueba
          </button>
          <button onClick={() => testPrint(impCocina || printerName)} disabled={loading}>
            Cocina
          </button>
          <button onClick={() => testPrint(impBarra || printerName)} disabled={loading}>
            Barra
          </button>
          <button onClick={() => testPrint(impCaja || printerName)} disabled={loading}>
            Caja
          </button>
        </div>

        <p className={`estado ${estado}`}>
          Estado: <strong>{estado === "online" ? "🟢 Online (WebSocket)" : "🔴 Offline"}</strong>
        </p>

        <p>
          <strong>Versión:</strong>{" "}
          {versionAgente?.pkgVersion
            ? versionAgente.commit
              ? `${versionAgente.pkgVersion} · ${versionAgente.commit}`
              : versionAgente.pkgVersion
            : "—"}
        </p>
      </div>

      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}

      <button className="close-btn" onClick={onClose} disabled={loading}>
        Cerrar
      </button>
    </Modal>
  );
}