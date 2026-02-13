import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import api from "../utils/api";
import "../styles/MiCuentaPage.css";

import ModalConfirmacion from "../components/Modal/ModalConfirmacion";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje";

const PLAN_LABELS = {
  "tpv-premium": "TPV Premium",
  "tpv-avanzado": "TPV Avanzado",
  esencial: "Esencial",
};

const SIF_FIELDS = [
  { key: "cif", label: "CIF/NIF", required: true, placeholder: "B12345678" },
  { key: "razonSocial", label: "Razón social", required: true, placeholder: "Restaurante Ejemplo SL" },
  { key: "direccion", label: "Dirección", required: true, placeholder: "Calle… nº…" },
  { key: "municipio", label: "Municipio", required: true, placeholder: "Madrid" },
  { key: "provincia", label: "Provincia", required: true, placeholder: "Madrid" },
  { key: "codigoPostal", label: "Código postal", required: true, placeholder: "28001" },
  { key: "pais", label: "País", required: true, placeholder: "ES" },
];

const toDateES = (d) => {
  try {
    return new Date(d).toLocaleDateString("es-ES");
  } catch {
    return "—";
  }
};

export default function MiCuentaPage() {
  const { user, loading: authLoading } = useAuth();
  const { config, loading: configLoading } = useConfig();

  const [alerta, setAlerta] = useState(null);

  // Firma (.p12)
  const [archivo, setArchivo] = useState(null);
  const [passwordCert, setPasswordCert] = useState("");
  const [certLoading, setCertLoading] = useState(false);
  const [certStatus, setCertStatus] = useState(null);
  const [certStatusLoading, setCertStatusLoading] = useState(true);

  // VeriFactu
  const [verifactuEnabled, setVerifactuEnabled] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [mostrarConfirmacionVF, setMostrarConfirmacionVF] = useState(false);

  // CIF / SIF
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

  // ============================
  // Suscripción / plan
  // ============================
  const sus = config?.suscripcion || {};
  const estado = sus?.estado || "active";
  const rawPlan = (sus?.plan || config?.plan || "esencial").toLowerCase().trim();
  const plan = PLAN_LABELS[rawPlan] || PLAN_LABELS[rawPlan.replace(/_.*/, "")] || "Básico";
  const renovacion = sus?.fechaRenovacion ? toDateES(sus.fechaRenovacion) : "—";

  const renderEstadoSuscripcion = () => {
    const map = {
      active: { clase: "ok", txt: "Activa" },
      past_due: { clase: "warn", txt: "Pago pendiente" },
      unpaid: { clase: "danger", txt: "Suspendida" },
      trial: { clase: "info", txt: "Prueba" },
      canceled: { clase: "danger", txt: "Cancelada" },
    };
    const data = map[estado] || map.active;
    return <span className={`pill pill--${data.clase}`}>{data.txt}</span>;
  };

  // ============================
  // Helpers validación
  // ============================
  const sifCompleto = useMemo(() => {
    // Requeridos mínimos para producción
    const requiredKeys = SIF_FIELDS.filter((f) => f.required).map((f) => f.key);
    return requiredKeys.every((k) => String(sifForm?.[k] || "").trim().length > 0);
  }, [sifForm]);

  const certSubido = !!certStatus?.uploaded;
  const certValido = certStatus?.valid !== false; // si no viene, asumimos ok
  const certCaduca = certStatus?.expiresAt ? toDateES(certStatus.expiresAt) : null;

  const readiness = useMemo(() => {
    return {
      certificado: certStatusLoading ? "loading" : certSubido ? (certValido ? "ok" : "warn") : "danger",
      fiscal: sifCompleto ? "ok" : "warn",
      verifactu: verifactuEnabled ? "ok" : "info",
    };
  }, [certStatusLoading, certSubido, certValido, sifCompleto, verifactuEnabled]);

  // ============================
  // Fetch: VeriFactu state
  // ============================
  useEffect(() => {
    const fetchVF = async () => {
      try {
        const { data } = await api.get("/admin/verifactu/verifactu");
        setVerifactuEnabled(!!data.enabled);
      } catch {
        // silencioso
      }
    };
    fetchVF();
  }, []);

  // ============================
  // Fetch: SIF config
  // ============================
  useEffect(() => {
    const fetchSifConfig = async () => {
      try {
        const { data } = await api.get("/admin/verifactu/sifconfig");
        setSifForm({
          cif: data?.productor?.nif || "",
          razonSocial: data?.productor?.nombreRazon || "",
          direccion: data?.direccion || "",
          municipio: data?.municipio || "",
          provincia: data?.provincia || "",
          codigoPostal: data?.codigoPostal || "",
          pais: data?.pais || "ES",
        });
      } catch {
        // silencioso
      }
    };
    fetchSifConfig();
  }, []);

  // ============================
  // Fetch: Cert status
  // ============================
  const fetchCertStatus = async () => {
    try {
      setCertStatusLoading(true);
      const { data } = await api.get("/admin/firma/status");
      // Esperado: { uploaded, valid, expiresAt, uploadedAt }
      setCertStatus(data || null);
    } catch {
      // Si no existe el endpoint aún, no rompe la página
      setCertStatus(null);
    } finally {
      setCertStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchCertStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================
  // Acciones
  // ============================
  const toggleVerifactu = async () => {
    const next = !verifactuEnabled;

    // ✅ Gate profesional: si vas a ACTIVAR, exige requisitos mínimos
    if (next) {
      if (!certSubido) {
        setAlerta({
          tipo: "warn",
          mensaje: "Para activar VeriFactu debes subir un certificado (.p12) válido.",
        });
        return;
      }
      if (!sifCompleto) {
        setAlerta({
          tipo: "warn",
          mensaje: "Para activar VeriFactu debes completar los datos fiscales (CIF, razón social y dirección).",
        });
        return;
      }
      if (certValido === false) {
        setAlerta({
          tipo: "warn",
          mensaje: "El certificado subido parece inválido. Sube un certificado válido antes de activar VeriFactu.",
        });
        return;
      }
    }

    setToggleLoading(true);
    try {
      const { data } = await api.post("/admin/verifactu/toggle", { enabled: next });
      setVerifactuEnabled(!!data.enabled);

      setAlerta({
        tipo: "exito",
        mensaje: `VeriFactu ${next ? "activado" : "desactivado"} correctamente.`,
      });
    } catch (err) {
      setAlerta({
        tipo: "error",
        mensaje:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "No se pudo cambiar el estado de VeriFactu.",
      });
    } finally {
      setToggleLoading(false);
    }
  };

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
        mensaje: data?.message || "Datos fiscales guardados correctamente.",
      });
    } catch (err) {
      setAlerta({
        tipo: "error",
        mensaje:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Error al guardar datos fiscales.",
      });
    } finally {
      setSifLoading(false);
    }
  };

  const handleUploadCert = async (e) => {
    e.preventDefault();

    if (!archivo || !passwordCert) {
      setAlerta({ tipo: "warn", mensaje: "Selecciona un certificado y escribe la contraseña." });
      return;
    }

    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("password", passwordCert);

    try {
      setCertLoading(true);
      const { data } = await api.post("/admin/firma/subir-certificado", formData);

      setAlerta({
        tipo: "exito",
        mensaje: data?.message || "Certificado subido correctamente.",
      });

      setArchivo(null);
      setPasswordCert("");

      // ✅ refresca estado visual
      await fetchCertStatus();
    } catch (err) {
      setAlerta({
        tipo: "error",
        mensaje: err?.response?.data?.message || err?.response?.data?.error || "Error al subir el certificado.",
      });
    } finally {
      setCertLoading(false);
    }
  };

  const descargarDeclaracion = () => {
    window.open(`${process.env.REACT_APP_API_URL}/firma/declaracion-responsable`, "_blank");
  };

  // ============================
  // Estados de carga
  // ============================
  if (authLoading || configLoading) {
    return (
      <main className="micuenta-page section section--wide">
        <p>Cargando…</p>
      </main>
    );
  }

  if (!user || !config) {
    return (
      <main className="micuenta-page section section--wide">
        <p>No se pudo cargar la información.</p>
      </main>
    );
  }

  // ============================
  // UI
  // ============================
  return (
    <main className="micuenta-page section section--narrow">
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
          autoCerrar
          duracion={3400}
        />
      )}

      <header className="micuenta-header">
        <div>
          <h1>Mi cuenta</h1>
          <p className="micuenta-sub">Suscripción, facturación, firma digital y cumplimiento legal</p>
        </div>

        <div className="micuenta-header-actions">
          <button
            className="btn-soft"
            type="button"
            onClick={() => {
              fetchCertStatus();
              setAlerta({ tipo: "info", mensaje: "Estado actualizado." });
            }}
            disabled={certStatusLoading}
          >
            {certStatusLoading ? "Actualizando…" : "Actualizar estado"}
          </button>
        </div>
      </header>

      {/* ========= Resumen de estado (producción) ========= */}
      <section className="micuenta-status">
        <div className="status-item">
          <span className="status-label">Certificado</span>
          <span className={`pill pill--${readiness.certificado}`}>
            {certStatusLoading ? "Cargando…" : certSubido ? (certValido ? "Cargado" : "Revisar") : "No cargado"}
          </span>
        </div>

        <div className="status-item">
          <span className="status-label">Datos fiscales</span>
          <span className={`pill pill--${readiness.fiscal}`}>{sifCompleto ? "Completos" : "Incompletos"}</span>
        </div>

        <div className="status-item">
          <span className="status-label">VeriFactu</span>
          <span className={`pill pill--${readiness.verifactu}`}>{verifactuEnabled ? "Activo" : "Inactivo"}</span>
        </div>
      </section>

      <div className="micuenta-grid">
        {/* ===================== Suscripción ===================== */}
        <section className="micuenta-card">
          <div className="card-head">
            <h2>Suscripción</h2>
            {renderEstadoSuscripcion()}
          </div>

          <div className="micuenta-info">
            <div className="info-row">
              <span className="info-label">Plan</span>
              <span className="info-value">{plan}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Renovación</span>
              <span className="info-value">{renovacion}</span>
            </div>
          </div>

          <button
            className="btn btn-primario "
            onClick={async () => {
              try {
                const { data } = await api.post("/pago/portal-billing");
                if (data?.url) window.location.href = data.url;
              } catch {
                setAlerta({ tipo: "error", mensaje: "No se pudo abrir la página de facturación." });
              }
            }}
          >
            Gestionar facturación
          </button>

          <p className="hint">
            Gestiona tu método de pago, facturas y cambios de plan desde el portal seguro.
          </p>
        </section>

        {/* ===================== Cumplimiento legal ===================== */}
        <section className="micuenta-card micuenta-card--legal">
          <div className="card-head">
            <h2>Cumplimiento legal</h2>
            <span className="pill pill--info">Ley 11/2021</span>
          </div>

          <div className="legal-row">
            <div>
              <h4>Declaración responsable</h4>
              <p className="hint">
                Documento obligatorio del sistema (inalterabilidad, trazabilidad y registros).
              </p>
            </div>
            <button className="btn btn-secundario" onClick={descargarDeclaracion}>
              Descargar PDF
            </button>
          </div>

          <div className="legal-row">
            <div>
              <h4>VeriFactu</h4>
              <p className="hint">
                Envío automático de facturas a la Agencia Tributaria (implicaciones legales).
              </p>
              <div className="inline-state">
                <span className={`pill pill--${verifactuEnabled ? "ok" : "danger"}`}>
                  {verifactuEnabled ? "ACTIVO" : "INACTIVO"}
                </span>
              </div>
            </div>

            <button
              className={`btn btn-primario  ${verifactuEnabled ? "btn-danger" : ""}`}
              disabled={toggleLoading}
              onClick={() => setMostrarConfirmacionVF(true)}
            >
              {toggleLoading ? "Procesando…" : verifactuEnabled ? "Desactivar" : "Activar"}
            </button>
          </div>

          <div className="hint">
            Para activar VeriFactu se requiere certificado válido y datos fiscales completos.
          </div>
        </section>

        {/* ===================== Firma digital ===================== */}
        <section className="micuenta-card">
          <div className="card-head">
            <h2>Firma digital</h2>
            <span className={`pill pill--${certSubido ? (certValido ? "ok" : "warn") : "danger"}`}>
              {certStatusLoading ? "…" : certSubido ? (certValido ? "Cargado" : "Revisar") : "No cargado"}
            </span>
          </div>

          {/* Estado detallado */}
          {!certStatusLoading && (
            <div className={`status-box ${certSubido ? (certValido ? "ok" : "warn") : "danger"}`}>
              {certSubido ? (
                <>
                  <strong>Certificado cargado.</strong>{" "}
                  {certCaduca ? <>Caduca el <b>{certCaduca}</b>.</> : "Caducidad: —"}
                  {certStatus?.uploadedAt && (
                    <div className="status-sub">Subido: {toDateES(certStatus.uploadedAt)}</div>
                  )}
                </>
              ) : (
                <>
                  <strong>No hay certificado cargado.</strong>
                  <div className="status-sub">Súbelo para habilitar firma y/o VeriFactu.</div>
                </>
              )}
            </div>
          )}

          <form onSubmit={handleUploadCert} className="micuenta-form">
            <div className="field">
              <label>Certificado (.p12)</label>
              <input
                type="file"
                accept=".p12"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              />
              {archivo?.name && <div className="field-help">Seleccionado: <b>{archivo.name}</b></div>}
            </div>

            <div className="field">
              <label>Contraseña del certificado</label>
              <input
                type="password"
                value={passwordCert}
                onChange={(e) => setPasswordCert(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn btn-secundario" disabled={certLoading}>
              {certLoading ? "Subiendo…" : "Subir certificado"}
            </button>
          </form>

          <p className="hint">
            El certificado se usa para firmar facturas y comunicaciones legales del sistema.
          </p>
        </section>

        {/* ===================== Datos fiscales ===================== */}
        <section className="micuenta-card">
          <div className="card-head">
            <h2>Datos fiscales</h2>
            <span className={`pill pill--${sifCompleto ? "ok" : "warn"}`}>
              {sifCompleto ? "Completos" : "Incompletos"}
            </span>
          </div>

          <p className="hint">
            Estos datos se usan para la emisión de facturas y para VeriFactu.
          </p>

          <div className="sif-grid">
            {SIF_FIELDS.map((f) => (
              <div key={f.key} className="field">
                <label>
                  {f.label} {f.required ? <span className="req">*</span> : null}
                </label>
                <input
                  type="text"
                  value={sifForm[f.key] || ""}
                  placeholder={f.placeholder || ""}
                  onChange={(e) =>
                    setSifForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="actions-row">
            <button className="btn btn-primario " type="button" onClick={handleSaveSif} disabled={sifLoading}>
              {sifLoading ? "Guardando…" : "Guardar datos fiscales"}
            </button>
          </div>

          {!sifCompleto && (
            <div className="status-box warn">
              <strong>Faltan datos fiscales.</strong>
              <div className="status-sub">
                Completa CIF/NIF, razón social y dirección para habilitar VeriFactu sin errores.
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ===================== Modal confirmación VeriFactu ===================== */}
      {mostrarConfirmacionVF && (
        <ModalConfirmacion
          titulo={verifactuEnabled ? "Desactivar VeriFactu" : "Activar VeriFactu"}
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
          <p className="hint">
            Esta acción debe realizarse únicamente por un administrador del restaurante.
          </p>
        </ModalConfirmacion>
      )}
    </main>
  );
}
