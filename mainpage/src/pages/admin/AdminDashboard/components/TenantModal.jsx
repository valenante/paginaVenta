import { useEffect, useState } from "react";
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
  const [refUpdate, setRefUpdate] = useState("origin/master");

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
    } catch (err) {
      console.error(err);
      setAlerta({
        tipo: "error",
        mensaje: "No se pudo obtener la lista de impresoras",
      });
    } finally {
      setLoading(false);
    }
  };

  const guardarConfig = async () => {
    if (!tenant?._id) return;

    try {
      setLoading(true);
      setAlerta({ tipo: "info", mensaje: "Guardando configuración..." });

      await api.put(`/admin/tenant/${tenant._id}/config-impresion`, {
        ipTailscale,
        printSecret,
        printerName,
        impresoras: {
          cocina: impCocina,
          barra: impBarra,
          caja: impCaja,
        },
      });

      setAlerta({
        tipo: "success",
        mensaje: "Configuración guardada correctamente",
      });
    } catch (err) {
      console.error(err);
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
      setAlerta({ tipo: "info", mensaje: "Actualizando agente..." });

      const { data } = await api.post(
        `/admin/tenant/${tenant._id}/actualizar-agente`,
        { version: refUpdate }
      );

      setAlerta({
        tipo: "success",
        mensaje: data?.message || "Actualización iniciada",
      });
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
      const { data } = await api.post(`/impresoras/admin/${tenant._id}/test`, payload);

      setAlerta({
        tipo: "success",
        mensaje: data?.message || "Prueba enviada",
      });
    } catch (err) {
      console.error(err);
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

      const { data } = await api.get(`/admin/tenant/${tenant._id}/ping-agente`);

      setEstado(data?.ok ? "online" : "offline");
      if (data?.version) setVersionAgente(data.version);

      setAlerta({
        tipo: data?.ok ? "success" : "error",
        mensaje: data?.ok
          ? `Agente en línea (${data.ms} ms)`
          : "Agente fuera de línea",
      });
    } catch (err) {
      console.error(err);
      setEstado("offline");
      setAlerta({
        tipo: "error",
        mensaje: "No se pudo contactar con el agente",
      });
    } finally {
      setLoading(false);
    }
  };

  const accederTPV = async () => {
    if (!ipTailscale) {
      setAlerta({
        tipo: "error",
        mensaje: "IP Tailscale no configurada",
      });
      return;
    }

    const sshUser = "alef";
    const comando = `tailscale ssh ${sshUser}@${ipTailscale}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(comando);
        setAlerta({
          tipo: "info",
          mensaje: `Comando copiado al portapapeles:\n\n${comando}\n\nPégalo en tu terminal.`,
        });
      } else {
        // Fallback seguro
        setAlerta({
          tipo: "info",
          mensaje: `Ejecuta este comando en tu terminal:\n\n${comando}`,
        });
      }
    } catch {
      setAlerta({
        tipo: "info",
        mensaje: `Ejecuta este comando en tu terminal:\n\n${comando}`,
      });
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
        <button
          className="btn-acceso-tpv"
          onClick={accederTPV}
        >
          🖥️ Acceder al TPV (Tailscale SSH)
        </button>

        <label>IP Tailscale</label>
        <input value={ipTailscale} onChange={(e) => setIpTailscale(e.target.value)} />

        <label>Clave secreta</label>
        <input value={printSecret} onChange={(e) => setPrintSecret(e.target.value)} />

        <label>Impresora predeterminada</label>
        <select value={printerName} onChange={(e) => setPrinterName(e.target.value)}>
          <option value="">-- Selecciona una impresora --</option>
          {impresoras.map((imp) => (
            <option key={imp} value={imp}>{imp}</option>
          ))}
        </select>

        <div className="hint">
          <small>
            Cocina: <strong>{defaultOrHint(impCocina)}</strong> ·
            Barra: <strong>{defaultOrHint(impBarra)}</strong> ·
            Caja: <strong>{defaultOrHint(impCaja)}</strong>
          </small>
        </div>

        <hr />

        <h4>Impresoras por estación</h4>

        <label>Cocina</label>
        <select value={impCocina} onChange={(e) => setImpCocina(e.target.value)}>
          {renderPrinterOptions()}
        </select>

        <label>Barra</label>
        <select value={impBarra} onChange={(e) => setImpBarra(e.target.value)}>
          {renderPrinterOptions()}
        </select>

        <label>Caja</label>
        <select value={impCaja} onChange={(e) => setImpCaja(e.target.value)}>
          {renderPrinterOptions()}
        </select>

        <div className="impresora-buttons">
          <button onClick={listarImpresoras}>🔍 Listar impresoras</button>
          <button onClick={guardarConfig}>💾 Guardar configuración</button>
          <button onClick={verificarConexion}>🔄 Verificar conexión</button>
        </div>

        <div className="agente-update-box">
          <h4>🔧 Actualización del agente</h4>
          <select value={refUpdate} onChange={(e) => setRefUpdate(e.target.value)}>
            <option value="origin/master">Última estable (origin/master)</option>
          </select>
          <button
            className="btn-update-agente"
            onClick={actualizarAgente}
            disabled={estado !== "online"}
          >
            🔄 Actualizar agente
          </button>
        </div>

        <div className="impresora-buttons">
          <button onClick={() => testPrint(printerName)}>🧾 Prueba</button>
          <button onClick={() => testPrint(impCocina || printerName)}>Cocina</button>
          <button onClick={() => testPrint(impBarra || printerName)}>Barra</button>
          <button onClick={() => testPrint(impCaja || printerName)}>Caja</button>
        </div>

        <p className={`estado ${estado}`}>
          Estado: <strong>{estado === "online" ? "🟢 Online" : "🔴 Offline"}</strong>
        </p>

        <p>
          <strong>Versión:</strong>{" "}
          {versionAgente
            ? `${versionAgente.pkgVersion} · ${versionAgente.commit}`
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

      <button className="close-btn" onClick={onClose}>
        Cerrar
      </button>
    </Modal>
  );
}
