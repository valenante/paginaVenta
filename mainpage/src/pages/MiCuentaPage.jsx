import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import api from "../utils/api";
import "../styles/MiCuentaPage.css";

export default function MiCuentaPage() {
  const { user, loading: authLoading } = useAuth();
  const { config, loading: configLoading } = useConfig();

  // Estados
  const [archivo, setArchivo] = useState(null);
  const [passwordCert, setPasswordCert] = useState("");
  const [mensajeCert, setMensajeCert] = useState("");

  const [verifactuEnabled, setVerifactuEnabled] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  // === SIF CONFIG ===
  const [sifForm, setSifForm] = useState({
    cif: "",
    razonSocial: "",
    direccion: "",
    municipio: "",
    provincia: "",
    codigoPostal: "",
    pais: "ES",
  });
  const [sifMensaje, setSifMensaje] = useState(null);
  const [sifLoading, setSifLoading] = useState(false);

  // ==================================================
  // 1️⃣ Cargar estado de VeriFactu
  // ==================================================
  useEffect(() => {
    const fetchState = async () => {
      try {
        const { data } = await api.get("/admin/verifactu/verifactu");
        setVerifactuEnabled(!!data.enabled);
      } catch { }
    };
    fetchState();
  }, []);

  const toggleVerifactu = async () => {
    setToggleLoading(true);
    try {
      const next = !verifactuEnabled;
      const { data } = await api.post("/admin/verifactu/toggle", {
        enabled: next,
      });
      setVerifactuEnabled(!!data.enabled);
    } finally {
      setToggleLoading(false);
    }
  };

  useEffect(() => {
    const fetchSifConfig = async () => {
      try {
        const { data } = await api.get("/admin/verifactu/sifconfig");
        setSifForm({
          cif: data.productor?.nif || "",
          razonSocial: data.productor?.nombreRazon || "",
          direccion: data.direccion || "",
          municipio: data.municipio || "",
          provincia: data.provincia || "",
          codigoPostal: data.codigoPostal || "",
          pais: data.pais || "ES",
        });
      } catch (err) {
        console.error("Error SIF:", err);
      }
    };
    fetchSifConfig();
  }, []);

  const handleSaveSif = async () => {
    try {
      setSifLoading(true);
      const payload = {
        productor: {
          nif: sifForm.cif,
          nombreRazon: sifForm.razonSocial,
        },
        direccion: sifForm.direccion,
        municipio: sifForm.municipio,
        provincia: sifForm.provincia,
        codigoPostal: sifForm.codigoPostal,
        pais: sifForm.pais,
      };

      const { data } = await api.post("/admin/verifactu/init-sif", payload);

      setSifMensaje(data.message || "Configuración SIF guardada correctamente.");
    } catch (err) {
      setSifMensaje("Error al guardar configuración SIF.");
    } finally {
      setSifLoading(false);
    }
  };

  // ==================================================
  // 2️⃣ Subida del certificado (.p12)
  // ==================================================
  const handleUploadCert = async (e) => {
    e.preventDefault();
    if (!archivo || !passwordCert) return;

    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("password", passwordCert);

    try {
      const { data } = await api.post("/firma/subir-certificado", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMensajeCert(data.message || "Certificado subido correctamente.");
    } catch {
      setMensajeCert("Error al subir el certificado.");
    }
  };

  const descargarDeclaracion = () => {
    window.open(
      `${process.env.REACT_APP_API_URL}/firma/declaracion-responsable`,
      "_blank"
    );
  };

  // ==================================================
  // 3️⃣ Estados de carga / error
  // ==================================================
  if (authLoading || configLoading) {
    return (
      <main className="micuenta-page section section--wide">
        <p>Cargando...</p>
      </main>
    );
  }

  if (!user || !config) {
    return (
      <main className="micuenta-page section section--wide">
        <p>No se pudo cargar la información</p>
      </main>
    );
  }

  // ==================================================
  // 4️⃣ Datos de suscripción Y plan (YA dentro de config)
  // ==================================================

  const sus = config.suscripcion || {};        // ← todo ya viene de config
  const estado = sus.estado || "active";
  const rawPlan = sus.plan || config.plan || "esencial";

  const PLAN_LABELS = {
    "tpv-premium": "TPV Premium",
    "tpv-avanzado": "TPV Avanzado",
    "esencial": "Esencial",
  };

  // Normalizamos el plan (por si viniera con sufijos)
  const normalizedPlan = rawPlan.toLowerCase().trim();
  const plan =
    PLAN_LABELS[normalizedPlan] ||
    PLAN_LABELS[normalizedPlan.replace(/_.*/, "")] || // ej: tpv-premium_mensual
    "Básico";

  const renovacion = sus.fechaRenovacion
    ? new Date(sus.fechaRenovacion).toLocaleDateString("es-ES")
    : "—";

  // Badge bonito
  const renderEstado = () => {
    const map = {
      active: { clase: "ok", txt: "Activa" },
      past_due: { clase: "warn", txt: "Pago pendiente" },
      unpaid: { clase: "danger", txt: "Suspendida" },
      trial: { clase: "info", txt: "Prueba" },
      canceled: { clase: "danger", txt: "Cancelada" },
    };

    const data = map[estado] || map["active"];
    return <span className={`estado-badge ${data.clase}`}>{data.txt}</span>;
  };

  // ==================================================
  // 5️⃣ Render UI
  // ==================================================

  return (
    <main className="micuenta-page section section--narrow">
      <header className="micuenta-header">
        <h1>Mi cuenta</h1>
        <p className="micuenta-sub">
          Gestión de suscripción, facturación y firma digital
        </p>
      </header>

      <div className="micuenta-grid">
        {/* PLAN */}
        <div className="micuenta-card">
          <h2>Plan y Suscripción</h2>

          <div className="micuenta-block">
            <div className="micuenta-info-row">
              <span className="micuenta-label">Estado:</span>
              {renderEstado()}
            </div>

            <div className="micuenta-info-row">
              <span className="micuenta-label">Plan actual:</span>
              <span className="micuenta-value">{plan}</span>
            </div>

            <div className="micuenta-info-row">
              <span className="micuenta-label">Renovación:</span>
              <span className="micuenta-value">{renovacion}</span>
            </div>

            <button
              className="micuenta-btn"
              onClick={async () => {
                try {
                  const { data } = await api.post("/pago/portal-billing");
                  if (data.url) window.location.href = data.url;
                } catch {
                  alert("No se pudo abrir la página de facturación");
                }
              }}
            >
              Gestionar facturación
            </button>
          </div>
        </div>

        {/* FIRMA DIGITAL */}
        <div className="micuenta-card">
          <h2>Firma Digital (.p12)</h2>

          <form onSubmit={handleUploadCert} className="micuenta-form">
            <div className="micuenta-field">
              <label>Certificado (.p12)</label>
              <input
                type="file"
                accept=".p12"
                onChange={(e) => setArchivo(e.target.files[0])}
              />
            </div>

            <div className="micuenta-field">
              <label>Contraseña</label>
              <input
                type="password"
                value={passwordCert}
                onChange={(e) => setPasswordCert(e.target.value)}
              />
            </div>

            <button type="submit" className="micuenta-btn-secundario">
              Subir certificado
            </button>
          </form>

          {mensajeCert && <p className="micuenta-msg">{mensajeCert}</p>}
        </div>

        {/* CUMPLIMIENTO LEGAL */}
        <div className="micuenta-card">
          <h2>Cumplimiento Legal</h2>

          <div className="micuenta-legal-row">
            <div>
              <h4>Declaración Responsable</h4>
              <p>Documento obligatorio (Ley 11/2021).</p>
            </div>
            <button className="micuenta-btn-secundario" onClick={descargarDeclaracion}>
              Descargar PDF
            </button>
          </div>

          <div className="micuenta-legal-row">
            <div>
              <h4>Sistema VeriFactu</h4>
              <p>
                Estado:{" "}
                <strong className={verifactuEnabled ? "ok" : "danger"}>
                  {verifactuEnabled ? "ACTIVADO" : "DESACTIVADO"}
                </strong>
              </p>
            </div>

            <button
              className="micuenta-btn"
              disabled={toggleLoading}
              onClick={toggleVerifactu}
            >
              {verifactuEnabled ? "Desactivar" : "Activar"}
            </button>
          </div>
        </div>

        {/* ==================== CONFIGURACIÓN SIF ======================= */}
        <div className="micuenta-card">
          <h2>Datos fiscales (SIF)</h2>

          <p className="micuenta-sub">
            Estos datos son obligatorios para emitir facturas validadas por VeriFactu.
          </p>

          <div className="sif-grid">
            {Object.entries(sifForm).map(([key, value]) => (
              <div key={key} className="micuenta-field">
                <label>{key.toUpperCase()}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) =>
                    setSifForm((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="micuenta-btn"
            disabled={sifLoading}
            onClick={handleSaveSif}
          >
            {sifLoading ? "Guardando..." : "Guardar datos fiscales"}
          </button>

          {sifMensaje && <p className="micuenta-msg">{sifMensaje}</p>}
        </div>
      </div>
    </main>
  );
}
