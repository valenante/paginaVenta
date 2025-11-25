import { useEffect, useState } from "react";
import api from "../../utils/api";
import "../../styles/SettingsPage.css";

export default function SettingsPage() {
  const [tab, setTab] = useState("general");
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState("");

  useEffect(() => {
    cargarConfig();
    cargarStatus();
  }, []);

  const cargarConfig = async () => {
    const res = await api.get("/superadmin/system/config");
    setConfig(res.data.config);
  };

  const cargarStatus = async () => {
    const res = await api.get("/superadmin/system/status");
    setStatus(res.data.status);
  };

  const guardar = async () => {
    setSaving(true);
    try {
      await api.put("/superadmin/system/config", config);
      await cargarStatus();
    } catch (err) {
      console.error("Error guardando ajustes:", err);
    }
    setSaving(false);
  };

  const testService = async (svc) => {
    setTesting(svc);
    try {
      const res = await api.post(`/superadmin/system/test/${svc}`);
      alert(`✔ ${svc.toUpperCase()} funcionando`);
    } catch (err) {
      alert(`❌ ${svc.toUpperCase()} fallo: ` + err.response?.data?.error);
    }
    setTesting("");
  };

  const update = (section, key, value) => {
    setConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  if (!config || !status) return <p>Cargando configuración...</p>;

  // ------------- ICONOS DE ESTADO --------------
  const estado = (ok) => (
    <span className={ok ? "estado ok" : "estado fail"}>
      ● {ok ? "OK" : "ERROR"}
    </span>
  );

  return (
    <div className="settings-wrapper">
      <h1 className="titulo">⚙️ Ajustes del Sistema</h1>
      <p className="subtitulo">Configuración global del SaaS Alef.</p>

      {/* --------- TABS --------- */}
      <div className="tabs">
        <button className={tab === "general" ? "active" : ""} onClick={() => setTab("general")}>
          General
        </button>
        <button className={tab === "smtp" ? "active" : ""} onClick={() => setTab("smtp")}>
          SMTP / Email
        </button>
        <button className={tab === "stripe" ? "active" : ""} onClick={() => setTab("stripe")}>
          Stripe
        </button>
        <button className={tab === "cloudflare" ? "active" : ""} onClick={() => setTab("cloudflare")}>
          Cloudflare
        </button>
        <button className={tab === "r2" ? "active" : ""} onClick={() => setTab("r2")}>
          R2 Storage
        </button>
      </div>

      {/* --------- PANEL GENERAL --------- */}
      {tab === "general" && (
        <div className="panel">
          <h2>🛠 Estado del sistema</h2>
          <div className="status-grid">
            <p>MongoDB: {estado(status.mongo)}</p>
            <p>SMTP: {estado(status.smtp)}</p>
            <p>Stripe: {estado(status.stripe)}</p>
            <p>Cloudflare: {estado(status.cloudflare)}</p>
            <p>R2 Storage: {estado(status.r2)}</p>
          </div>

          <h3>Modo mantenimiento</h3>
          <label className="switch">
            <input
              type="checkbox"
              checked={config.maintenanceMode}
              onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
            />
            <span className="slider" />
          </label>

          <h3>Versión del sistema</h3>
          <input
            type="text"
            value={config.system.version}
            onChange={(e) => update("system", "version", e.target.value)}
          />
        </div>
      )}

      {/* --------- SMTP --------- */}
      {tab === "smtp" && (
        <div className="panel">
          <h2>📧 Configuración SMTP</h2>

          <small>
            SMTP permite a Alef enviar correos: bienvenida, recuperación de contraseña,
            avisos, facturas, etc.
          </small>

          <label>Servidor SMTP (host)</label>
          <input
            value={config?.smtp?.host || ""}
            onChange={(e) => update("smtp", "host", e.target.value)}
            placeholder="smtp.tu-dominio.com"
          />

          <label>Puerto</label>
          <input
            type="number"
            value={config?.smtp?.port || ""}
            onChange={(e) => update("smtp", "port", e.target.value)}
            placeholder="587"
          />

          <label>Usuario</label>
          <input
            value={config?.smtp?.user || ""}
            onChange={(e) => update("smtp", "user", e.target.value)}
            placeholder="correo@tu-dominio.com"
          />

          <label>Contraseña / API Key</label>
          <input
            type="password"
            value={config?.smtp?.pass || ""}
            onChange={(e) => update("smtp", "pass", e.target.value)}
          />

          <label>Remitente (FROM)</label>
          <input
            value={config?.smtp?.from || ""}
            onChange={(e) => update("smtp", "from", e.target.value)}
            placeholder="Alef <no-reply@tu-dominio.com>"
          />

          <div className="smtp-buttons">
            <button
              className="test-btn"
              disabled={testing === "smtp"}
              onClick={() => testService("smtp")}
            >
              {testing === "smtp" ? "Probando conexión..." : "Probar conexión SMTP"}
            </button>

            <button
              className="test-btn secondary"
              onClick={async () => {
                const email = prompt("Ingresa un email para enviar la prueba:");
                if (!email) return;
                await api.post("/superadmin/system/smtp/test-send", { to: email });
                alert("✔ Correo enviado correctamente.");
              }}
            >
              Enviar correo de prueba
            </button>
          </div>
        </div>
      )}

      {/* --------- STRIPE --------- */}
      {tab === "stripe" && (
        <div className="panel">
          <h2>💳 Stripe</h2>

          <label>Clave Pública</label>
          <input
            value={config?.stripe?.publicKey || ""}
            onChange={(e) => update("stripe", "publicKey", e.target.value)}
          />

          <label>Clave Secreta</label>
          <input
            type="password"
            value={config?.stripe?.secretKey || ""}
            onChange={(e) => update("stripe", "secretKey", e.target.value)}
          />

          <label>Webhook Secret</label>
          <input
            value={config?.stripe?.webhookSecret || ""}
            onChange={(e) => update("stripe", "webhookSecret", e.target.value)}
          />

          <button
            className="test-btn"
            disabled={testing === "stripe"}
            onClick={() => testService("stripe")}
          >
            {testing === "stripe" ? "Probando..." : "Probar Stripe"}
          </button>
        </div>
      )}

      {/* --------- CLOUDFLARE --------- */}
      {tab === "cloudflare" && (
        <div className="panel">
          <h2>🌐 Cloudflare</h2>

          <label>Zone ID</label>
          <input
            value={config?.cloudflare?.zoneId || ""}
            onChange={(e) => update("cloudflare", "zoneId", e.target.value)}
          />

          <label>API Token</label>
          <input
            value={config?.cloudflare?.apiToken || ""}
            onChange={(e) => update("cloudflare", "apiToken", e.target.value)}
          />

          <label>Account ID</label>
          <input
            value={config?.cloudflare?.accountId || ""}
            onChange={(e) => update("cloudflare", "accountId", e.target.value)}
          />

          <button
            className="test-btn"
            disabled={testing === "cloudflare"}
            onClick={() => testService("cloudflare")}
          >
            {testing === "cloudflare" ? "Probando..." : "Probar Cloudflare"}
          </button>
        </div>
      )}

      {/* --------- R2 STORAGE --------- */}
      {tab === "r2" && (
        <div className="panel">
          <h2>📦 R2 Storage</h2>

          <label>Account ID</label>
          <input
            value={config?.r2?.accountId || ""}
            onChange={(e) => update("r2", "accountId", e.target.value)}
          />

          <label>Access Key ID</label>
          <input
            value={config?.r2?.accessKeyId || ""}
            onChange={(e) => update("r2", "accessKeyId", e.target.value)}
          />

          <label>Secret Access Key</label>
          <input
            type="password"
            value={config?.r2?.secretAccessKey || ""}
            onChange={(e) => update("r2", "secretAccessKey", e.target.value)}
          />

          <label>Bucket</label>
          <input
            value={config?.r2?.bucket || ""}
            onChange={(e) => update("r2", "bucket", e.target.value)}
          />

          <label>URL pública base</label>
          <input
            value={config?.r2?.publicBaseUrl || ""}
            onChange={(e) => update("r2", "publicBaseUrl", e.target.value)}
          />

          <button
            className="test-btn"
            disabled={testing === "r2"}
            onClick={() => testService("r2")}
          >
            {testing === "r2" ? "Probando..." : "Probar R2"}
          </button>
        </div>
      )}

      {/* --------- GUARDAR --------- */}
      <button className="guardar-btn" disabled={saving} onClick={guardar}>
        {saving ? "Guardando..." : "Guardar Cambios"}
      </button>
    </div>
  );
}
