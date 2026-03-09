// src/pages/MiCuentaPage.jsx ✅ PERFECTO (UX Errors PRO)
// - OK / avisos: AlertaMensaje
// - Errores reales backend: ErrorToast + normalizeApiError
// - Sin err.response.data.* en catch
// - Retry útil (refresca estado)
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import api from "../utils/api";
import LoadingScreen from "../components/LoadingScreen/LoadingScreen";
import "../styles/MiCuentaPage.css";

import ModalConfirmacion from "../components/Modal/ModalConfirmacion";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje";
import ErrorToast from "../components/common/ErrorToast.jsx";
import { normalizeApiError } from "../utils/normalizeApiError.js";

const PLAN_LABELS = {
  "tpv-premium": "TPV Premium",
  "tpv-avanzado": "TPV Avanzado",
  esencial: "Esencial",
};

const VERIFACTU_FECHAS = {
  sociedades: "01/01/2027",
  resto: "01/07/2027",
};

const VERIFACTU_AVISO =
  `Opcional durante el periodo de adaptación. ` +
  `Obligatorio desde ${VERIFACTU_FECHAS.sociedades} (Impuesto sobre Sociedades) ` +
  `o ${VERIFACTU_FECHAS.resto} (resto), según tu forma jurídica.`;

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

  // OK / avisos
  const [alerta, setAlerta] = useState(null);

  // KO (contrato)
  const [errorToast, setErrorToast] = useState(null);

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
  // Helpers UI
  // ============================
  const showOk = useCallback((mensaje) => {
    setAlerta({ tipo: "exito", mensaje });
  }, []);

  const showWarn = useCallback((mensaje) => {
    setAlerta({ tipo: "warn", mensaje });
  }, []);

  const showErr = useCallback((err, fallback = "No se pudo completar la operación.") => {
    const n = normalizeApiError(err);
    setErrorToast({ ...n, message: n?.message || fallback });
  }, []);

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
  // Validación mínima SIF
  // ============================
  const sifCompleto = useMemo(() => {
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
  // Fetch: VF state
  // ============================
  const fetchVF = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/verifactu/verifactu");
      setVerifactuEnabled(!!data?.enabled);
    } catch (err) {
      // no bloqueamos UI, pero si quieres ver fallo en soporte:
      // showErr(err, "No se pudo obtener el estado de VeriFactu.");
    }
  }, []);

  // ============================
  // Fetch: SIF config
  // ============================
  const fetchSifConfig = useCallback(async () => {
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
    } catch (err) {
      // silencioso para no “ensuciar” la cuenta
    }
  }, []);

  // ============================
  // Fetch: Cert status
  // ============================
  const fetchCertStatus = useCallback(async () => {
    try {
      setCertStatusLoading(true);
      const { data } = await api.get("/admin/firma/status");
      setCertStatus(data || null);
    } catch (err) {
      // si no existe endpoint o hay error, no rompe la página
      setCertStatus(null);
    } finally {
      setCertStatusLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    // Retry “inteligente” del toast: refresca todo lo que se ve en esta página
    await Promise.allSettled([fetchVF(), fetchSifConfig(), fetchCertStatus()]);
  }, [fetchVF, fetchSifConfig, fetchCertStatus]);

  useEffect(() => {
    fetchVF();
    fetchSifConfig();
    fetchCertStatus();
  }, [fetchVF, fetchSifConfig, fetchCertStatus]);

  // ============================
  // Acciones
  // ============================
  const toggleVerifactu = async () => {
    const next = !verifactuEnabled;

    // Gate profesional (UI) antes de pegar al backend
    if (next) {
      if (!certSubido) {
        showWarn("Para activar el envío a AEAT (VERI*FACTU) debes subir un certificado (.p12) válido.");
        return;
      }
      if (!sifCompleto) {
        showWarn("Para activar el envío a AEAT (VERI*FACTU) debes completar los datos fiscales (CIF, razón social y dirección).");
        return;
      }
      if (certValido === false) {
        showWarn("El certificado subido parece inválido. Sube un certificado válido antes de activar el envío a AEAT (VERI*FACTU).");
        return;
      }
    }

    setToggleLoading(true);
    setErrorToast(null);

    try {
      const { data } = await api.post("/admin/verifactu/toggle", { enabled: next });
      setVerifactuEnabled(!!data?.enabled);
      showOk(`Envío a AEAT (VERI*FACTU) ${next ? "activado" : "desactivado"} correctamente.`);
    } catch (err) {
      showErr(err, "No se pudo cambiar el estado de VeriFactu.");
    } finally {
      setToggleLoading(false);
    }
  };

  const handleSaveSif = async () => {
    try {
      setSifLoading(true);
      setErrorToast(null);

      const payload = {
        productor: { nif: sifForm.cif, nombreRazon: sifForm.razonSocial },
        direccion: sifForm.direccion,
        municipio: sifForm.municipio,
        provincia: sifForm.provincia,
        codigoPostal: sifForm.codigoPostal,
        pais: sifForm.pais,
      };

      const { data } = await api.post("/admin/verifactu/init-sif", payload);
      showOk(data?.message || "Datos fiscales guardados correctamente.");
      // opcional: refresh
      await fetchSifConfig();
    } catch (err) {
      showErr(err, "Error al guardar datos fiscales.");
    } finally {
      setSifLoading(false);
    }
  };

  const handleUploadCert = async (e) => {
    e.preventDefault();

    if (!archivo || !passwordCert) {
      showWarn("Selecciona un certificado y escribe la contraseña.");
      return;
    }

    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("password", passwordCert);

    try {
      setCertLoading(true);
      setErrorToast(null);

      const { data } = await api.post("/admin/firma/subir-certificado", formData);
      showOk(data?.message || "Certificado subido correctamente.");

      setArchivo(null);
      setPasswordCert("");

      await fetchCertStatus();
    } catch (err) {
      showErr(err, "Error al subir el certificado.");
    } finally {
      setCertLoading(false);
    }
  };

  // ⚠️ En Vite no existe process.env.REACT_APP_API_URL. Usamos VITE_API_URL.
  // Si el endpoint devuelve PDF, lo ideal es backend con URL absoluta o un endpoint público.
  const descargarDeclaracion = () => {
    const base = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
    // Si tu API base ya incluye /api, ajusta esta ruta a la real
    window.open(`${base}/firma/declaracion-responsable`, "_blank");
  };

  // ============================
  // Estados de carga
  // ============================
  if (authLoading || configLoading) return <LoadingScreen />;

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
      {/* ERROR TOAST (KO) */}
      {errorToast && (
        <ErrorToast
          error={errorToast}
          onRetry={errorToast.canRetry ? refreshAll : undefined}
          onClose={() => setErrorToast(null)}
        />
      )}

      {/* ALERTA OK / avisos */}
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
            onClick={async () => {
              await refreshAll();
              showOk("Estado actualizado.");
            }}
            disabled={certStatusLoading}
          >
            {certStatusLoading ? "Actualizando…" : "Actualizar estado"}
          </button>
        </div>
      </header>

      {/* ========= Resumen de estado ========= */}
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
          <span className="status-label">Envío a AEAT</span>
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
            className="btn btn-primario"
            onClick={async () => {
              try {
                setErrorToast(null);
                const { data } = await api.post("/pago/portal-billing");
                if (data?.url) window.location.href = data.url;
                else showWarn("No se recibió URL del portal de facturación.");
              } catch (err) {
                showErr(err, "No se pudo abrir la página de facturación.");
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
              <h4>Envío a AEAT (VERI*FACTU)</h4>
              <p className="hint">
                Envío automático de registros/facturas a la Agencia Tributaria (implicaciones legales).
              </p>
              <p className="hint">{VERIFACTU_AVISO}</p>
              <div className="inline-state">
                <span className={`pill pill--${verifactuEnabled ? "ok" : "danger"}`}>
                  {verifactuEnabled ? "ACTIVO" : "INACTIVO"}
                </span>
              </div>
            </div>

            <button
              className={`btn btn-primario ${verifactuEnabled ? "btn-danger" : ""}`}
              disabled={toggleLoading}
              onClick={() => setMostrarConfirmacionVF(true)}
            >
              {toggleLoading ? "Procesando…" : verifactuEnabled ? "Desactivar envío" : "Activar envío"}
            </button>
          </div>

          <div className="hint">
            Para activar el envío a AEAT (VERI*FACTU) se requiere certificado válido y datos fiscales completos.
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

          {!certStatusLoading && (
            <div className={`status-box ${certSubido ? (certValido ? "ok" : "warn") : "danger"}`}>
              {certSubido ? (
                <>
                  <strong>Certificado cargado.</strong>{" "}
                  {certCaduca ? <>Caduca el <b>{certCaduca}</b>.</> : "Caducidad: —"}
                  {certStatus?.uploadedAt && <div className="status-sub">Subido: {toDateES(certStatus.uploadedAt)}</div>}
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
              <input type="file" accept=".p12" onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
              {archivo?.name && (
                <div className="field-help">
                  Seleccionado: <b>{archivo.name}</b>
                </div>
              )}
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

          <p className="hint">El certificado se usa para firmar facturas y comunicaciones legales del sistema.</p>
        </section>

        {/* ===================== Datos fiscales ===================== */}
        <section className="micuenta-card">
          <div className="card-head">
            <h2>Datos fiscales</h2>
            <span className={`pill pill--${sifCompleto ? "ok" : "warn"}`}>
              {sifCompleto ? "Completos" : "Incompletos"}
            </span>
          </div>

          <p className="hint">Estos datos se usan para la emisión de facturas y para VeriFactu.</p>

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
                  onChange={(e) => setSifForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="actions-row">
            <button className="btn btn-primario" type="button" onClick={handleSaveSif} disabled={sifLoading}>
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
          titulo={verifactuEnabled ? "Desactivar envío a AEAT (VERI*FACTU)" : "Activar envío a AEAT (VERI*FACTU)"}
          mensaje={
            verifactuEnabled
              ? "Desactivar el envío a AEAT (VERI*FACTU) detiene la remisión automática. Durante el periodo de adaptación puedes activarlo o desactivarlo cuando lo necesites. ¿Deseas continuar?"
              : `Activar el envío a AEAT (VERI*FACTU) es opcional hasta 2027, pero te permite dejarlo listo con antelación. ${VERIFACTU_AVISO} Esta acción tiene implicaciones legales. ¿Deseas continuar?`
          }
          onClose={() => setMostrarConfirmacionVF(false)}
          onConfirm={async () => {
            setMostrarConfirmacionVF(false);
            await toggleVerifactu();
          }}
        >
          <p className="hint">Esta acción debe realizarse únicamente por un administrador del restaurante.</p>
        </ModalConfirmacion>
      )}
    </main>
  );
}