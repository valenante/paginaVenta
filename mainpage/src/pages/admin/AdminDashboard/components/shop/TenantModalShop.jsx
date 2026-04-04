import { useEffect, useState } from "react";
import Modal from "react-modal";
import api from "../../../../../utils/api";
import "../../../../../styles/TenantModal.css";

Modal.setAppElement("#root");

export default function TenantModalShop({ tenant, onClose }) {
  /* =========================
     Estado (Agente)
  ========================= */
  const [ipTailscale, setIpTailscale] = useState(tenant?.ipTailscale || "");
  const [printSecret, setPrintSecret] = useState(tenant?.printSecret || "");
  const [printerName, setPrinterName] = useState(tenant?.printerName || "");

  /* =========================
     Estado (Impresoras)
  ========================= */
  const [impCaja, setImpCaja] = useState(
    tenant?.impresion?.impresoras?.caja || ""
  );
  const [impTickets, setImpTickets] = useState(
    tenant?.impresion?.impresoras?.tickets || ""
  );

  const [impresoras, setImpresoras] = useState([]);

  /* =========================
     Estado agente
  ========================= */
  const [estado, setEstado] = useState(tenant?.estadoAgente || "offline");

  /* =========================
     UX
  ========================= */
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  /* =========================
     Sync tenant
  ========================= */
  useEffect(() => {
    setIpTailscale(tenant?.ipTailscale || "");
    setPrintSecret(tenant?.printSecret || "");
    setPrinterName(tenant?.printerName || "");

    setImpCaja(tenant?.impresion?.impresoras?.caja || "");
    setImpTickets(tenant?.impresion?.impresoras?.tickets || "");

    setEstado(tenant?.estadoAgente || "offline");
    setImpresoras([]);
    setMensaje("");
    setLoading(false);
  }, [tenant?._id]); // eslint-disable-line

  /* =========================
     Actions
  ========================= */
  const listarImpresoras = async () => {
    if (!tenant?._id) return;

    try {
      setLoading(true);
      setMensaje("🔎 Buscando impresoras...");

      const { data } = await api.get(`/impresoras/admin/${tenant._id}/listar`);
      const lista = Array.isArray(data?.impresoras) ? data.impresoras : [];

      setImpresoras(lista);
      setMensaje(`✅ Se detectaron ${lista.length} impresoras`);
    } catch {
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

      await api.put(`/admin/tenant/${tenant._id}/config-impresion`, {
        ipTailscale,
        printSecret,
        printerName,
        impresion: {
          impresoras: {
            caja: impCaja,
            tickets: impTickets,
          },
        },
      });

      setMensaje("✅ Configuración guardada correctamente");
    } catch {
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
      const { data } = await api.post(
        `/impresoras/${tenant._id}/test`,
        payload
      );

      setMensaje(
        data?.message || `✅ Prueba enviada (${impresora || "predeterminada"})`
      );
    } catch {
      setMensaje("❌ Error al enviar prueba");
    } finally {
      setLoading(false);
    }
  };

  const verificarConexion = async () => {
    if (!tenant?._id) return;

    try {
      setLoading(true);
      const { data } = await api.get(
        `/tenants/${tenant._id}/ping-agente`
      );

      setEstado(data?.estado || "offline");
      setMensaje(
        data?.ok
          ? `🟢 Agente en línea (${data.ms} ms)`
          : "🔴 Agente fuera de línea"
      );
    } catch {
      setEstado("offline");
      setMensaje("⚠️ No se pudo contactar con el agente");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Helpers
  ========================= */
  const renderOptions = () => (
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

  /* =========================
     Render
  ========================= */
  return (
    <Modal
      isOpen={!!tenant}
      onRequestClose={onClose}
      className="tenant-modal"
      overlayClassName="modal-overlay"
    >
      <h2>🛒 Configuración de impresión – Tienda</h2>

      <div className="tenant-info">
        <p><strong>Nombre:</strong> {tenant?.nombre}</p>
        <p><strong>Email:</strong> {tenant?.email}</p>
        <p><strong>Plan:</strong> {tenant?.plan}</p>
        <p>
          <strong>Creado:</strong>{" "}
          {tenant?.createdAt
            ? new Date(tenant.createdAt).toLocaleString()
            : "-"}
        </p>
      </div>

      <hr />

      <h3>🖨️ Agente de impresión</h3>

      <div className="impresora-section">
        <label>IP Tailscale</label>
        <input
          type="text"
          value={ipTailscale}
          onChange={(e) => setIpTailscale(e.target.value)}
          placeholder="ej: tienda-tpv.tailscale.net"
        />

        <label>Clave secreta (printSecret)</label>
        <input
          type="text"
          value={printSecret}
          onChange={(e) => setPrintSecret(e.target.value)}
          placeholder="clave-secreta..."
        />

        <label>Impresora predeterminada (fallback)</label>
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

        <div className="hint">
          <small>
            Caja: <strong>{defaultOrHint(impCaja)}</strong> · Tickets:{" "}
            <strong>{defaultOrHint(impTickets)}</strong>
          </small>
        </div>

        <hr />

        <h4>Impresoras por tipo</h4>

        <label>Impresora Caja</label>
        <select value={impCaja} onChange={(e) => setImpCaja(e.target.value)}>
          {renderOptions()}
        </select>

        <label>Impresora Tickets</label>
        <select
          value={impTickets}
          onChange={(e) => setImpTickets(e.target.value)}
        >
          {renderOptions()}
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

          <button onClick={() => testPrint(impCaja || printerName)} disabled={loading}>
            🧾 Probar Caja
          </button>

          <button
            onClick={() => testPrint(impTickets || printerName)}
            disabled={loading}
          >
            🧾 Probar Tickets
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
