import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../utils/api";
import "../../styles/SettingsPage.css";

const emptySecrets = {
  smtpPass: "",
  stripeSecretKey: "",
  stripeWebhookSecret: "",
  cloudflareApiToken: "",
  r2AccessKeyId: "",
  r2SecretAccessKey: "",
};

function safeStr(v) {
  return v == null ? "" : String(v);
}

function normalizePort(v) {
  const s = safeStr(v).trim();
  if (!s) return "";
  const n = Number(s);
  if (Number.isNaN(n)) return s; // lo dejamos, el backend validará
  return String(n);
}

function buildPayload(config, secrets) {
  return {
    maintenanceMode: !!config?.maintenanceMode,
    system: {
      version: safeStr(config?.system?.version).trim(),
    },

    smtp: {
      host: safeStr(config?.smtp?.host).trim(),
      port: normalizePort(config?.smtp?.port),
      user: safeStr(config?.smtp?.user).trim(),
      from: safeStr(config?.smtp?.from).trim(),
      ...(secrets.smtpPass.trim() ? { pass: secrets.smtpPass.trim() } : {}),
    },

    stripe: {
      publicKey: safeStr(config?.stripe?.publicKey).trim(),
      ...(secrets.stripeSecretKey.trim()
        ? { secretKey: secrets.stripeSecretKey.trim() }
        : {}),
      ...(secrets.stripeWebhookSecret.trim()
        ? { webhookSecret: secrets.stripeWebhookSecret.trim() }
        : {}),
    },

    cloudflare: {
      zoneId: safeStr(config?.cloudflare?.zoneId).trim(),
      accountId: safeStr(config?.cloudflare?.accountId).trim(),
      ...(secrets.cloudflareApiToken.trim()
        ? { apiToken: secrets.cloudflareApiToken.trim() }
        : {}),
    },

    r2: {
      accountId: safeStr(config?.r2?.accountId).trim(),
      bucket: safeStr(config?.r2?.bucket).trim(),
      publicBaseUrl: safeStr(config?.r2?.publicBaseUrl).trim(),
      ...(secrets.r2AccessKeyId.trim()
        ? { accessKeyId: secrets.r2AccessKeyId.trim() }
        : {}),
      ...(secrets.r2SecretAccessKey.trim()
        ? { secretAccessKey: secrets.r2SecretAccessKey.trim() }
        : {}),
    },
  };
}

function stableStringify(obj) {
  // stringify estable para dirty state
  return JSON.stringify(obj, Object.keys(obj).sort());
}

export default function SettingsPage() {
  const [tab, setTab] = useState("general");
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState(null);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState("");

  const [secrets, setSecrets] = useState(emptySecrets);

  // snapshot para detectar cambios
  const basePayloadRef = useRef("");

  const cargarConfig = async () => {
    const res = await api.get("/admin/superadmin/system/config");
    setConfig(res.data.config);
  };

  const cargarStatus = async () => {
    const res = await api.get("/admin/superadmin/system/status");
    setStatus(res.data.status);
  };

  useEffect(() => {
    (async () => {
      await Promise.all([cargarConfig(), cargarStatus()]);
    })();
  }, []);

  // cuando config llega por primera vez, guardamos snapshot de payload "sin secretos"
  useEffect(() => {
    if (!config) return;
    const base = buildPayload(config, emptySecrets);
    basePayloadRef.current = stableStringify(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!config]);

  const payloadActual = useMemo(() => {
    if (!config) return "";
    return stableStringify(buildPayload(config, secrets));
  }, [config, secrets]);

  const isDirty = useMemo(() => {
    if (!config) return false;
    // si hay secretos escritos, ya cuenta como dirty
    const hasSecrets =
      !!secrets.smtpPass.trim() ||
      !!secrets.stripeSecretKey.trim() ||
      !!secrets.stripeWebhookSecret.trim() ||
      !!secrets.cloudflareApiToken.trim() ||
      !!secrets.r2AccessKeyId.trim() ||
      !!secrets.r2SecretAccessKey.trim();

    if (hasSecrets) return true;
    return payloadActual !== basePayloadRef.current;
  }, [config, payloadActual, secrets]);

  // aviso al salir si hay cambios sin guardar
  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const update = (section, key, value) => {
    setConfig((prev) => ({
      ...prev,
      [section]: { ...(prev?.[section] || {}), [key]: value },
    }));
  };

  const guardar = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const payload = buildPayload(config, secrets);

      await api.put("/admin/superadmin/system/config", payload);

      // Limpia secretos (no quedan en memoria)
      setSecrets(emptySecrets);

      // refrescar
      await cargarConfig();
      await cargarStatus();

      // actualizar snapshot (sin secretos)
      // OJO: usamos el config "nuevo" que vino del servidor, pero si tarda, recalculamos cuando llegue
      // acá también lo forzamos con el último config en memoria:
      const base = buildPayload(config, emptySecrets);
      basePayloadRef.current = stableStringify(base);

      alert("✔ Cambios guardados");
    } catch (err) {
      console.error("Error guardando ajustes:", err);
      alert("❌ No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const testService = async (svc) => {
    setTesting(svc);
    try {
      await api.post(`/admin/superadmin/system/test/${svc}`);
      alert(`✔ ${svc.toUpperCase()} funcionando`);
      await cargarStatus();
    } catch (err) {
      alert(`❌ ${svc.toUpperCase()} falló: ` + (err.response?.data?.error || err.message));
    } finally {
      setTesting("");
    }
  };

  if (!config || !status) return <p>Cargando configuración...</p>;

  const estado = (ok) => (
    <span className={ok ? "estado ok" : "estado fail"}>● {ok ? "OK" : "ERROR"}</span>
  );

  return (
    <div className="settings-wrapper-settingsAdmin">
      <h1 className="settings-title-settingsAdmin">⚙️ Ajustes del Sistema</h1>
      <p className="settings-subtitle-settingsAdmin">
        Configuración global del SaaS Alef.
      </p>

      {/* --------- TABS --------- */}
      <div className="settings-tabs-settingsAdmin">
        <button
          className={tab === "general" ? "tab-btn-settingsAdmin active" : "tab-btn-settingsAdmin"}
          onClick={() => setTab("general")}
        >
          General
        </button>

        <button
          className={tab === "smtp" ? "tab-btn-settingsAdmin active" : "tab-btn-settingsAdmin"}
          onClick={() => setTab("smtp")}
        >
          SMTP / Email
        </button>

        <button
          className={tab === "stripe" ? "tab-btn-settingsAdmin active" : "tab-btn-settingsAdmin"}
          onClick={() => setTab("stripe")}
        >
          Stripe
        </button>

        <button
          className={tab === "cloudflare" ? "tab-btn-settingsAdmin active" : "tab-btn-settingsAdmin"}
          onClick={() => setTab("cloudflare")}
        >
          Cloudflare
        </button>

        <button
          className={tab === "r2" ? "tab-btn-settingsAdmin active" : "tab-btn-settingsAdmin"}
          onClick={() => setTab("r2")}
        >
          R2 Storage
        </button>
      </div>

      {/* --------- PANEL GENERAL --------- */}
      {tab === "general" && (
        <div className="settings-panel-settingsAdmin">
          <h2 className="settings-panel-title-settingsAdmin">🛠 Estado del sistema</h2>

          <div className="settings-status-grid-settingsAdmin">
            <p>MongoDB: {estado(status.mongo)}</p>
            <p>SMTP: {estado(status.smtp)}</p>
            <p>Stripe: {estado(status.stripe)}</p>
            <p>Cloudflare: {estado(status.cloudflare)}</p>
            <p>R2 Storage: {estado(status.r2)}</p>
          </div>

          <h3 className="settings-section-title-settingsAdmin">Modo mantenimiento</h3>
          <label className="settings-switch-settingsAdmin">
            <input
              type="checkbox"
              checked={!!config.maintenanceMode}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
              }
            />
            <span className="settings-slider-settingsAdmin" />
          </label>

          <h3 className="settings-section-title-settingsAdmin">Versión del sistema</h3>
          <input
            className="settings-input-settingsAdmin"
            type="text"
            value={safeStr(config?.system?.version)}
            onChange={(e) => update("system", "version", e.target.value)}
          />
        </div>
      )}

      {/* --------- SMTP --------- */}
      {tab === "smtp" && (
        <div className="settings-panel-settingsAdmin">
          <h2 className="settings-panel-title-settingsAdmin">📧 Configuración SMTP</h2>

          <small className="settings-small-settingsAdmin">
            SMTP permite a Alef enviar correos: bienvenida, recuperación, avisos, facturas, etc.
          </small>

          <label className="settings-label-settingsAdmin">Servidor SMTP (host)</label>
          <input
            className="settings-input-settingsAdmin"
            value={safeStr(config?.smtp?.host)}
            onChange={(e) => update("smtp", "host", e.target.value)}
            placeholder="smtp.tu-dominio.com"
          />

          <label className="settings-label-settingsAdmin">Puerto</label>
          <input
            className="settings-input-settingsAdmin"
            type="number"
            value={safeStr(config?.smtp?.port)}
            onChange={(e) => update("smtp", "port", e.target.value)}
            placeholder="587"
          />

          <label className="settings-label-settingsAdmin">Usuario</label>
          <input
            className="settings-input-settingsAdmin"
            value={safeStr(config?.smtp?.user)}
            onChange={(e) => update("smtp", "user", e.target.value)}
            placeholder="correo@tu-dominio.com"
          />

          <label className="settings-label-settingsAdmin">Contraseña / API Key</label>
          <input
            className="settings-input-settingsAdmin"
            type="password"
            value={secrets.smtpPass}
            onChange={(e) => setSecrets((p) => ({ ...p, smtpPass: e.target.value }))}
            placeholder={config?.smtp?.passSet ? "•••••• (ya configurada)" : "Introduce la contraseña"}
          />
          <small className="settings-small-settingsAdmin">Deja vacío para no cambiarla.</small>

          <label className="settings-label-settingsAdmin">Remitente (FROM)</label>
          <input
            className="settings-input-settingsAdmin"
            value={safeStr(config?.smtp?.from)}
            onChange={(e) => update("smtp", "from", e.target.value)}
            placeholder="Alef <no-reply@tu-dominio.com>"
          />

          <div className="settings-smtp-buttons-settingsAdmin">
            <button
              className="settings-test-btn-settingsAdmin"
              disabled={testing === "smtp"}
              onClick={() => testService("smtp")}
            >
              {testing === "smtp" ? "Probando conexión..." : "Probar conexión SMTP"}
            </button>

            <button
              className="settings-test-btn-settingsAdmin secondary"
              onClick={async () => {
                const email = prompt("Ingresa un email para enviar la prueba:");
                if (!email) return;
                try {
                  await api.post("/admin/superadmin/system/smtp/test-send", { to: email });
                  alert("✔ Correo enviado correctamente.");
                } catch (err) {
                  alert("❌ Error enviando correo: " + (err.response?.data?.error || err.message));
                }
              }}
            >
              Enviar correo de prueba
            </button>
          </div>
        </div>
      )}

      {/* --------- STRIPE --------- */}
      {tab === "stripe" && (
        <div className="settings-panel-settingsAdmin">
          <h2 className="settings-panel-title-settingsAdmin">💳 Stripe</h2>

          <label className="settings-label-settingsAdmin">Clave Pública</label>
          <input
            className="settings-input-settingsAdmin"
            value={safeStr(config?.stripe?.publicKey)}
            onChange={(e) => update("stripe", "publicKey", e.target.value)}
            placeholder="pk_live_..."
          />

          <label className="settings-label-settingsAdmin">Clave Secreta</label>
          <input
            className="settings-input-settingsAdmin"
            type="password"
            value={secrets.stripeSecretKey}
            onChange={(e) => setSecrets((p) => ({ ...p, stripeSecretKey: e.target.value }))}
            placeholder={config?.stripe?.secretKeySet ? "•••••• (ya configurada)" : "sk_live_..."}
          />
          <small className="settings-small-settingsAdmin">Deja vacío para no cambiarla.</small>

          <label className="settings-label-settingsAdmin">Webhook Secret</label>
          <input
            className="settings-input-settingsAdmin"
            type="password"
            value={secrets.stripeWebhookSecret}
            onChange={(e) => setSecrets((p) => ({ ...p, stripeWebhookSecret: e.target.value }))}
            placeholder={config?.stripe?.webhookSecretSet ? "•••••• (ya configurado)" : "whsec_..."}
          />
          <small className="settings-small-settingsAdmin">Deja vacío para no cambiarlo.</small>

          <button
            className="settings-test-btn-settingsAdmin"
            disabled={testing === "stripe"}
            onClick={() => testService("stripe")}
          >
            {testing === "stripe" ? "Probando..." : "Probar Stripe"}
          </button>
        </div>
      )}

      {/* --------- CLOUDFLARE --------- */}
      {tab === "cloudflare" && (
        <div className="settings-panel-settingsAdmin">
          <h2 className="settings-panel-title-settingsAdmin">🌐 Cloudflare</h2>

          <label className="settings-label-settingsAdmin">Zone ID</label>
          <input
            className="settings-input-settingsAdmin"
            value={safeStr(config?.cloudflare?.zoneId)}
            onChange={(e) => update("cloudflare", "zoneId", e.target.value)}
          />

          <label className="settings-label-settingsAdmin">Account ID</label>
          <input
            className="settings-input-settingsAdmin"
            value={safeStr(config?.cloudflare?.accountId)}
            onChange={(e) => update("cloudflare", "accountId", e.target.value)}
          />

          <label className="settings-label-settingsAdmin">API Token</label>
          <input
            className="settings-input-settingsAdmin"
            type="password"
            value={secrets.cloudflareApiToken}
            onChange={(e) => setSecrets((p) => ({ ...p, cloudflareApiToken: e.target.value }))}
            placeholder={config?.cloudflare?.apiTokenSet ? "•••••• (ya configurado)" : "Token API"}
          />
          <small className="settings-small-settingsAdmin">Deja vacío para no cambiarlo.</small>

          <button
            className="settings-test-btn-settingsAdmin"
            disabled={testing === "cloudflare"}
            onClick={() => testService("cloudflare")}
          >
            {testing === "cloudflare" ? "Probando..." : "Probar Cloudflare"}
          </button>
        </div>
      )}

      {/* --------- R2 STORAGE --------- */}
      {tab === "r2" && (
        <div className="settings-panel-settingsAdmin">
          <h2 className="settings-panel-title-settingsAdmin">📦 R2 Storage</h2>

          <label className="settings-label-settingsAdmin">Account ID</label>
          <input
            className="settings-input-settingsAdmin"
            value={safeStr(config?.r2?.accountId)}
            onChange={(e) => update("r2", "accountId", e.target.value)}
          />

          <label className="settings-label-settingsAdmin">Bucket</label>
          <input
            className="settings-input-settingsAdmin"
            value={safeStr(config?.r2?.bucket)}
            onChange={(e) => update("r2", "bucket", e.target.value)}
          />

          <label className="settings-label-settingsAdmin">URL pública base</label>
          <input
            className="settings-input-settingsAdmin"
            value={safeStr(config?.r2?.publicBaseUrl)}
            onChange={(e) => update("r2", "publicBaseUrl", e.target.value)}
            placeholder="https://cdn.tu-dominio.com"
          />

          <label className="settings-label-settingsAdmin">Access Key ID</label>
          <input
            className="settings-input-settingsAdmin"
            value={secrets.r2AccessKeyId}
            onChange={(e) => setSecrets((p) => ({ ...p, r2AccessKeyId: e.target.value }))}
            placeholder={
              config?.r2?.accessKeyIdMasked
                ? `${config.r2.accessKeyIdMasked} (cambiar)`
                : config?.r2?.accessKeyIdSet
                ? "•••••• (ya configurada)"
                : "Access Key ID"
            }
          />
          <small className="settings-small-settingsAdmin">Deja vacío para no cambiarla.</small>

          <label className="settings-label-settingsAdmin">Secret Access Key</label>
          <input
            className="settings-input-settingsAdmin"
            type="password"
            value={secrets.r2SecretAccessKey}
            onChange={(e) => setSecrets((p) => ({ ...p, r2SecretAccessKey: e.target.value }))}
            placeholder={config?.r2?.secretAccessKeySet ? "•••••• (ya configurado)" : "Secret Access Key"}
          />
          <small className="settings-small-settingsAdmin">Deja vacío para no cambiarla.</small>

          <button
            className="settings-test-btn-settingsAdmin"
            disabled={testing === "r2"}
            onClick={() => testService("r2")}
          >
            {testing === "r2" ? "Probando..." : "Probar R2"}
          </button>
        </div>
      )}

      {/* --------- GUARDAR --------- */}
      <button
        className="settings-save-btn-settingsAdmin"
        disabled={saving || !isDirty}
        onClick={guardar}
        title={!isDirty ? "No hay cambios para guardar" : ""}
      >
        {saving ? "Guardando..." : isDirty ? "Guardar Cambios" : "Sin cambios"}
      </button>
    </div>
  );
}
