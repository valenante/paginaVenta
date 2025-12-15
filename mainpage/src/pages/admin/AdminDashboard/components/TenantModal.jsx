import { useEffect, useState } from "react";
import Modal from "react-modal";
import api from "../../../../utils/api";
import "../../../../styles/TenantModal.css";

Modal.setAppElement("#root");

export default function TenantModal({ tenant, onClose }) {
  // =========================
  // Estado (Tenant)
  // =========================
  const [ipTailscale, setIpTailscale] = useState(tenant?.ipTailscale || "");
  const [printSecret, setPrintSecret] = useState(tenant?.printSecret || "");
  const [printerName, setPrinterName] = useState(tenant?.printerName || ""); // default

  // =========================
  // Estado (Impresoras por estación)
  // =========================
  const [impCocina, setImpCocina] = useState(tenant?.impresoras?.cocina || "");
  const [impBarra, setImpBarra] = useState(tenant?.impresoras?.barra || "");
  const [impCaja, setImpCaja] = useState(tenant?.impresoras?.caja || "");

  // Lista de impresoras CUPS detectadas por el agente
  const [impresoras, setImpresoras] = useState([]);

  // Estado agente
  const [estado, setEstado] = useState(tenant?.estadoAgente || "offline");

  // UX
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // Sync cuando cambia el tenant
  // =========================
  useEffect(() => {
    setIpTailscale(tenant?.ipTailscale || "");
    setPrintSecret(tenant?.printSecret || "");
    setPrinterName(tenant?.printerName || "");
    setEstado(tenant?.estadoAgente || "offline");

    // Si tu API ya devuelve estas tres en tenant, perfecto.
    // Si no las trae, igual queda vacío hasta que las cargues desde otro endpoint.
    setImpCocina(tenant?.impresoras?.cocina || "");
    setImpBarra(tenant?.impresoras?.barra || "");
    setImpCaja(tenant?.impresoras?.caja || "");

    setImpresoras([]);
    setMensaje("");
    setLoading(false);
  }, [tenant?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // =========================
  // Actions
  // =========================
  const listarImpresoras = async () => {
    if (!tenant?._id) return;

    try {
      setLoading(true);
      setMensaje("🔎 Buscando impresoras...");
      const { data } = await api.get(`/impresoras/${tenant._id}/listar`);

      const lista = Array.isArray(data?.impresoras) ? data.impresoras : [];
      setImpresoras(lista);
      setMensaje(`✅ Se detectaron ${lista.length} impresoras`);
    } catch (err) {
      console.error("Error al listar impresoras:", err);
      setMensaje("❌ No se pudo obtener la lista de impresoras");
    } finally {
      setLoading(false);
    }
  };

  const guardarConfig = async () => {
    if (!tenant?._id) return;

    try {
      setLoading(true);
      setMensaje("💾 Guardando configuración...");

      await api.put(`/tenants/${tenant._id}/config-impresion`, {
        ipTailscale,
        printSecret,
        printerName, // default
        impresoras: {
          cocina: impCocina,
          barra: impBarra,
          caja: impCaja,
        },
      });

      setMensaje("✅ Configuración guardada correctamente");
    } catch (err) {
      console.error("Error al guardar config:", err);
      setMensaje("❌ Error al guardar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const testPrint = async (impresora) => {
    if (!tenant?._id) return;

    try {
      setLoading(true);
      setMensaje("🧾 Enviando prueba de impresión...");

      const payload = impresora ? { impresora } : {};
      const { data } = await api.post(`/impresoras/${tenant._id}/test`, payload);

      setMensaje(data?.message || `✅ Prueba enviada (${impresora || "default"})`);
    } catch (err) {
      console.error("Error test print:", err);
      setMensaje("❌ Error al enviar prueba de impresión");
    } finally {
      setLoading(false);
    }
  };

  const verificarConexion = async () => {
    if (!tenant?._id) return;

    try {
      setLoading(true);
      const { data } = await api.get(`/tenants/${tenant._id}/ping-agente`);

      setEstado(data?.estado || "offline");
      if (data?.ok) setMensaje(`🟢 Agente en línea (${data.ms} ms)`);
      else setMensaje("🔴 Agente fuera de línea");
    } catch (err) {
      console.error("Error ping:", err);
      setMensaje("⚠️ No se pudo contactar con el agente");
      setEstado("offline");
    } finally {
      setLoading(false);
    }
  };

  // Helpers
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

      <div className="tenant-info">
        <p><strong>Nombre:</strong> {tenant?.nombre}</p>
        <p><strong>Email:</strong> {tenant?.email}</p>
        <p><strong>Plan:</strong> {tenant?.plan}</p>
        <p><strong>VeriFactu:</strong> {tenant?.verifactuEnabled ? "Activo ✅" : "Inactivo ❌"}</p>
        <p><strong>Creado:</strong> {tenant?.createdAt ? new Date(tenant.createdAt).toLocaleString() : "-"}</p>
      </div>

      <hr />

      <h3>🖨️ Configuración del agente de impresión</h3>

      <div className="impresora-section">
        <label>IP Tailscale</label>
        <input
          type="text"
          value={ipTailscale}
          onChange={(e) => setIpTailscale(e.target.value)}
          placeholder="ej: lovepizza-tpv.tailscale.net"
        />

        <label>Clave secreta (printSecret)</label>
        <input
          type="text"
          value={printSecret}
          onChange={(e) => setPrintSecret(e.target.value)}
          placeholder="clave-secreta..."
        />

        <label>Impresora predeterminada (fallback)</label>
        <select value={printerName} onChange={(e) => setPrinterName(e.target.value)}>
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

        <label>Impresora Cocina</label>
        <select value={impCocina} onChange={(e) => setImpCocina(e.target.value)}>
          {renderPrinterOptions()}
        </select>

        <label>Impresora Barra</label>
        <select value={impBarra} onChange={(e) => setImpBarra(e.target.value)}>
          {renderPrinterOptions()}
        </select>

        <label>Impresora Caja</label>
        <select value={impCaja} onChange={(e) => setImpCaja(e.target.value)}>
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

        <div className="impresora-buttons">
          <button onClick={() => testPrint(printerName)} disabled={loading}>
            🧾 Prueba (predeterminada)
          </button>

          <button onClick={() => testPrint(impCocina || printerName)} disabled={loading}>
            🧾 Probar Cocina
          </button>

          <button onClick={() => testPrint(impBarra || printerName)} disabled={loading}>
            🧾 Probar Barra
          </button>

          <button onClick={() => testPrint(impCaja || printerName)} disabled={loading}>
            🧾 Probar Caja
          </button>
        </div>

        <p className={`estado ${estado}`}>
          Estado del agente:{" "}
          <strong>{estado === "online" ? "🟢 Online" : "🔴 Offline"}</strong>
        </p>

        {mensaje && <p className="mensaje">{mensaje}</p>}
      </div>

      <button className="close-btn" onClick={onClose}>
        Cerrar
      </button>
    </Modal>
  );
}
