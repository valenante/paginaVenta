import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import api from "../utils/api";
import "../styles/MiCuentaPage.css";

import ModalConfirmacion from "../components/Modal/ModalConfirmacion";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje"; // <- ajusta ruta

export default function MiCuentaPage() {
  const { user, loading: authLoading } = useAuth();
  const { config, loading: configLoading } = useConfig();

  // ✅ ALERTA GLOBAL
  const [alerta, setAlerta] = useState(null);

  // Estados
  const [archivo, setArchivo] = useState(null);
  const [passwordCert, setPasswordCert] = useState("");

  const [verifactuEnabled, setVerifactuEnabled] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  const [mostrarConfirmacionVF, setMostrarConfirmacionVF] = useState(false);

  // === CIF CONFIG ===
  const [sifForm, setSifForm] = useState({
    cif: "",
    razonSocial: "",
    direccion: "",
    municipio: "",
    provincia: "",
    codigoPostal: "",
    pais: "ES",
  });
  const [sifLoading, setSifLoading] = useState(false);

  // ==================================================
  // 1️⃣ Cargar estado de VeriFactu
  // ==================================================
  useEffect(() => {
    const fetchState = async () => {
      try {
        const { data } = await api.get("/admin/verifactu/verifactu");
        setVerifactuEnabled(!!data.enabled);
      } catch {
        // opcional
      }
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

      setAlerta({
        tipo: "exito",
        mensaje: `VeriFactu ${next ? "activado" : "desactivado"} correctamente.`,
      });
    } catch (err) {
      setAlerta({
        tipo: "error",
        mensaje:
          err?.response?.data?.message ||   // 👈 primero message
          err?.response?.data?.error ||
          "No se pudo cambiar el estado de VeriFactu.",
      });
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
        console.error("Error CIF:", err);
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

      setAlerta({
        tipo: "exito",
        mensaje: data.message || "Configuración CIF guardada correctamente.",
      });
    } catch (err) {
      setAlerta({
        tipo: "error",
        mensaje:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Error al guardar configuración CIF.",
      });
    } finally {
      setSifLoading(false);
    }
  };

  // ==================================================
  // 2️⃣ Subida del certificado (.p12)
  // ==================================================
  const handleUploadCert = async (e) => {
    e.preventDefault();

    if (!archivo || !passwordCert) {
      setAlerta({
        tipo: "warn",
        mensaje: "Selecciona un certificado y escribe la contraseña.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("password", passwordCert);

    try {
      const { data } = await api.post("/admin/firma/subir-certificado", formData);

      setAlerta({
        tipo: "exito",
        mensaje: data.message || "Certificado subido correctamente.",
      });

      // opcional: limpia campos
      setArchivo(null);
      setPasswordCert("");
    } catch (err) {
      setAlerta({
        tipo: "error",
        mensaje:
          err?.response?.data?.error || "Error al subir el certificado.",
      });
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
  const sus = config.suscripcion || {};
  const estado = sus.estado || "active";
  const rawPlan = sus.plan || config.plan || "esencial";

  const PLAN_LABELS = {
    "tpv-premium": "TPV Premium",
    "tpv-avanzado": "TPV Avanzado",
    esencial: "Esencial",
  };

  const normalizedPlan = rawPlan.toLowerCase().trim();
  const plan =
    PLAN_LABELS[normalizedPlan] ||
    PLAN_LABELS[normalizedPlan.replace(/_.*/, "")] ||
    "Básico";

  const renovacion = sus.fechaRenovacion
    ? new Date(sus.fechaRenovacion).toLocaleDateString("es-ES")
    : "—";

  const renderEstado = () => {
    const map = {
      active: { clase: "ok", txt: "Activa" },
      past_due: { clase: "warn", txt: "Pago pendiente" },
      unpaid: { clase: "danger", txt: "Suspendida" },
      trial: { clase: "info", txt: "Prueba" },
      canceled: { clase: "danger", txt: "Cancelada" },
    };
    const data = map[estado] || map.active;
    return <span className={`estado-badge ${data.clase}`}>{data.txt}</span>;
  };

  // ==================================================
  // 5️⃣ Render UI
  // ==================================================
  return (
    <main className="micuenta-page section section--narrow">
      {/* ✅ ALERTA ARRIBA */}
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
          autoCerrar
          duracion={3200}
        />
      )}

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
                } catch (err) {
                  setAlerta({
                    tipo: "error",
                    mensaje: "No se pudo abrir la página de facturación.",
                  });
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
        </div>

        {/* CUMPLIMIENTO LEGAL */}
        <div className="micuenta-card">
          <h2>Cumplimiento Legal</h2>

          <div className="micuenta-legal-row">
            <div>
              <h4>Declaración Responsable</h4>
              <p>Documento obligatorio (Ley 11/2021).</p>
            </div>
            <button
              className="micuenta-btn-secundario"
              onClick={descargarDeclaracion}
            >
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
              onClick={() => setMostrarConfirmacionVF(true)}
            >
              {verifactuEnabled ? "Desactivar" : "Activar"}
            </button>
          </div>
        </div>

        {/* CONFIGURACIÓN CIF */}
        <div className="micuenta-card">
          <h2>Datos fiscales (CIF)</h2>

          <p className="micuenta-sub">
            Estos datos son obligatorios para emitir facturas validadas por
            VeriFactu.
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
          {mostrarConfirmacionVF && (
            <ModalConfirmacion
              titulo={
                verifactuEnabled
                  ? "Desactivar VeriFactu"
                  : "Activar VeriFactu"
              }
              mensaje={
                verifactuEnabled
                  ? "Desactivar VeriFactu implica que las facturas dejarán de enviarse a la Agencia Tributaria. ¿Deseas continuar?"
                  : "Activar VeriFactu enviará automáticamente las facturas a la Agencia Tributaria conforme a la ley. Esta acción tiene implicaciones legales."
              }
              onClose={() => setMostrarConfirmacionVF(false)}
              onConfirm={async () => {
                setMostrarConfirmacionVF(false);
                await toggleVerifactu();
              }}
            >
              <p className="text-suave">
                Esta acción solo debe realizarse por un administrador del restaurante.
              </p>
            </ModalConfirmacion>
          )}
        </div>
      </div>
    </main>
  );
}
