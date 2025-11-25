import { useState } from "react";
import Modal from "react-modal";
import api from "../../../../utils/api";
import "../../../../styles/TenantModal.css";

Modal.setAppElement("#root");

export default function TenantModal({ tenant, onClose }) {
  const [ipTailscale, setIpTailscale] = useState(tenant.ipTailscale || "");
  const [printSecret, setPrintSecret] = useState(tenant.printSecret || "");
  const [printerName, setPrinterName] = useState(tenant.printerName || "");
  const [impresoras, setImpresoras] = useState([]);
  const [estado, setEstado] = useState(tenant.estadoAgente || "offline");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const listarImpresoras = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/impresoras/${tenant._id}/listar`);
      setImpresoras(data.impresoras);
      setMensaje(`Se detectaron ${data.impresoras.length} impresoras`);
    } catch (err) {
      console.error("Error al listar impresoras:", err);
      setMensaje("❌ No se pudo obtener la lista de impresoras");
    } finally {
      setLoading(false);
    }
  };

  const guardarConfig = async () => {
    try {
      setLoading(true);
      await api.put(`/tenants/${tenant._id}/config-impresion`, {
        ipTailscale,
        printSecret,
        printerName,
      });
      setMensaje("✅ Configuración guardada correctamente");
    } catch (err) {
      console.error("Error al guardar config:", err);
      setMensaje("❌ Error al guardar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const testPrint = async () => {
    try {
      setLoading(true);
      const { data } = await api.post(`/impresoras/${tenant._id}/test`);
      setMensaje(data.message || "🧾 Prueba enviada correctamente");
    } catch (err) {
      console.error("Error test print:", err);
      setMensaje("❌ Error al enviar prueba de impresión");
    } finally {
      setLoading(false);
    }
  };

  const verificarConexion = async () => {
    try {
      const { data } = await api.get(`/tenants/${tenant._id}/ping-agente`);
      setEstado(data.estado);
      if (data.ok) setMensaje(`🟢 Agente en línea (${data.ms} ms)`);
      else setMensaje("🔴 Agente fuera de línea");
    } catch (err) {
      console.error("Error ping:", err);
      setMensaje("⚠️ No se pudo contactar con el agente");
      setEstado("offline");
    }
  };

  return (
    <Modal
      isOpen={!!tenant}
      onRequestClose={onClose}
      className="tenant-modal"
      overlayClassName="modal-overlay"
    >
      <h2>Detalles del Restaurante</h2>

      <div className="tenant-info">
        <p><strong>Nombre:</strong> {tenant.nombre}</p>
        <p><strong>Email:</strong> {tenant.email}</p>
        <p><strong>Plan:</strong> {tenant.plan}</p>
        <p><strong>VeriFactu:</strong> {tenant.verifactuEnabled ? "Activo ✅" : "Inactivo ❌"}</p>
        <p><strong>Creado:</strong> {new Date(tenant.createdAt).toLocaleString()}</p>
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

        <label>Impresora predeterminada</label>
        <select
          value={printerName}
          onChange={(e) => setPrinterName(e.target.value)}
        >
          <option value="">-- Selecciona una impresora --</option>
          {impresoras.map((imp) => (
            <option key={imp} value={imp}>
              {imp}
            </option>
          ))}
        </select>

        <div className="impresora-buttons">
          <button onClick={listarImpresoras} disabled={loading}>
            🔍 Listar impresoras
          </button>
          <button onClick={guardarConfig} disabled={loading}>
            💾 Guardar configuración
          </button>
          <button onClick={testPrint} disabled={loading}>
            🧾 Prueba de impresión
          </button>
          <button onClick={verificarConexion} disabled={loading}>
            🔄 Verificar conexión
          </button>
        </div>

        <p className={`estado ${estado}`}>
          Estado del agente:{" "}
          <strong>
            {estado === "online" ? "🟢 Online" : "🔴 Offline"}
          </strong>
        </p>

        {mensaje && <p className="mensaje">{mensaje}</p>}
      </div>

      <button className="close-btn" onClick={onClose}>
        Cerrar
      </button>
    </Modal>
  );
}
