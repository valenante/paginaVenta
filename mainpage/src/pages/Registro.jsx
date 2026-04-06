import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/Registro.css";
import { useToast } from "../context/ToastContext";

import Paso1DatosRestaurante from "../components/Registro/Paso1DatosRestaurante.jsx";
import Paso2Pago from "../components/Registro/Paso2Pago.jsx";

const STORAGE_KEY = "alef_registro_draft";
const STORAGE_TTL = 2 * 60 * 60 * 1000; // 2 horas

export default function Registro() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [periodo, setPeriodo] = useState("mensual");
  const [precheckoutId, setPrecheckoutId] = useState(null);

  // ======== QUERY ========
  const params = new URLSearchParams(window.location.search);
  const planSlug = (params.get("plan") || "").toLowerCase();

  // ======== ESTADOS ========
  const [tenant, setTenant] = useState({ nombre: "", plan: "", tipoNegocio: null });
  const [admin, setAdmin] = useState({ name: "", email: "" });
  const [planSeleccionado, setPlanSeleccionado] = useState(null);

  const isShop = useMemo(() => {
    const t = (planSeleccionado?.tipoNegocio || "").toLowerCase();
    if (t) return t === "shop";
    return planSlug === "shop" || planSlug.includes("shop");
  }, [planSeleccionado, planSlug]);

  const STEPS = useMemo(() => [
    { id: 1, label: isShop ? "Datos de la tienda" : "Datos del restaurante" },
    { id: 2, label: "Resumen y pago" },
  ], [isShop]);

  // ======== REDIRECT SI NO HAY PLAN ========
  useEffect(() => {
    if (!planSlug) navigate("/?seleccionarPlan=1");
  }, [planSlug, navigate]);

  // ======== CARGAR PLAN ========
  useEffect(() => {
    if (!planSlug) return;
    (async () => {
      try {
        const { data } = await api.get("/admin/superadminPlans/publicPlans");
        const planes = Array.isArray(data) ? data : [];
        const found = planes.find((p) => p.slug.toLowerCase() === planSlug);

        if (!found) {
          showToast("El plan seleccionado no existe.", "error");
          navigate("/");
          return;
        }

        setPlanSeleccionado(found);
        const tipoNegocio = (found.tipoNegocio || "").toLowerCase() || "restaurante";
        setTenant((prev) => ({ ...prev, plan: found.slug, tipoNegocio }));
      } catch {
        showToast("Error cargando el plan.", "error");
      }
    })();
  }, [planSlug, navigate]); // eslint-disable-line

  // ======== SEO ========
  useEffect(() => {
    document.title = "Registro | Alef";
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "robots"); document.head.appendChild(meta); }
    meta.setAttribute("content", "noindex, nofollow");
  }, []);

  // ======== PERSISTENCIA LOCALSTORAGE ========
  useEffect(() => {
    if (!tenant.nombre && !admin.email) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tenant, admin, paso, periodo, precheckoutId, _ts: Date.now(),
      }));
    } catch {}
  }, [tenant, admin, paso, periodo, precheckoutId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved._ts && Date.now() - saved._ts > STORAGE_TTL) { localStorage.removeItem(STORAGE_KEY); return; }
      if (saved.tenant?.plan && saved.tenant.plan !== planSlug) return;
      if (saved.tenant) setTenant(saved.tenant);
      if (saved.admin) setAdmin(saved.admin);
      if (saved.paso) setPaso(saved.paso);
      if (saved.periodo) setPeriodo(saved.periodo);
      if (saved.precheckoutId) setPrecheckoutId(saved.precheckoutId);
    } catch {}
  }, []); // eslint-disable-line

  // ======== PRECIO (simple - solo plan base) ========
  const precio = useMemo(() => {
    const mensual = planSeleccionado?.precioMensual || 0;
    const anual = planSeleccionado?.precioAnual || mensual * 11;
    return {
      mensual,
      anual,
      total: periodo === "anual" ? anual : mensual,
    };
  }, [planSeleccionado, periodo]);

  // ======== VALIDACION ========
  const validateStep = useCallback((stepNum) => {
    setValidationError("");
    if (stepNum === 1) {
      if (!tenant.nombre.trim()) { setValidationError("El nombre del negocio es obligatorio."); return false; }
      if (!admin.email.trim()) { setValidationError("El email del administrador es obligatorio."); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin.email.trim())) { setValidationError("Introduce un email valido."); return false; }
      if (!admin.name.trim()) { setValidationError("El nombre del administrador es obligatorio."); return false; }
    }
    return true;
  }, [tenant, admin]);

  const handleNext = useCallback(() => {
    if (!validateStep(paso)) return;
    setValidationError("");
    setPaso(paso + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [paso, validateStep]);

  const handlePrev = useCallback(() => {
    setValidationError("");
    setPaso(paso - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [paso]);

  // ======== RENDER ========
  const stepActual = STEPS.find((s) => s.id === paso);

  return (
    <main className="registro-avanzado registro-page">
      <div className="registro-shell">
        <div className="registro-main card">
          <header className="registro-header">
            <div>
              <p className="registro-kicker">
                Alta de {isShop ? "tienda" : "restaurante"}
              </p>
              <h1 className="registro-title">
                {paso === 1
                  ? `¿Como se llama tu ${isShop ? "tienda" : "restaurante"}?`
                  : "Confirma y empieza"}
              </h1>
              <p className="registro-subtitle">
                {paso === 1
                  ? "Solo necesitamos 3 datos para crear tu cuenta."
                  : "Revisa tu plan, elige como pagar y listo. En 2 minutos tienes todo funcionando."}
              </p>
            </div>

            {planSeleccionado && (
              <div className="registro-plan-box">
                <span className="registro-plan-label">Plan seleccionado</span>
                <strong className="registro-plan-nombre">{planSeleccionado.nombre}</strong>
                <span className="registro-plan-precio">{planSeleccionado.precioMensual} €/mes</span>
              </div>
            )}
          </header>

          {/* STEPPER */}
          <div className="registro-stepper">
            {STEPS.map((step, index) => (
              <div className="registro-step" key={step.id}>
                <div className={`registro-step-circle ${paso === step.id ? "active" : ""} ${paso > step.id ? "done" : ""}`}>
                  {paso > step.id ? "✓" : step.id}
                </div>
                <span className={`registro-step-label ${paso === step.id ? "active" : ""}`}>
                  {step.label}
                </span>
                {index < STEPS.length - 1 && <div className="registro-step-line" />}
              </div>
            ))}
          </div>

          <p className="registro-step-counter">
            Paso {paso} de {STEPS.length}: <span>{stepActual?.label}</span>
          </p>

          {/* CONTENIDO */}
          <div className="registro-step-content">
            {paso === 1 && (
              <Paso1DatosRestaurante
                tenant={tenant}
                setTenant={setTenant}
                admin={admin}
                setAdmin={setAdmin}
                isShop={isShop}
              />
            )}
            {paso === 2 && (
              <Paso2Pago
                tenant={tenant}
                admin={admin}
                plan={planSeleccionado}
                precio={precio}
                periodo={periodo}
                setPeriodo={setPeriodo}
                precheckoutId={precheckoutId}
                setPrecheckoutId={setPrecheckoutId}
                loading={loading}
                setLoading={setLoading}
                error={error}
                setError={setError}
                isShop={isShop}
              />
            )}
          </div>

          {/* NAVEGACION */}
          <div className="registro-nav">
            {paso > 1 && (
              <button type="button" className="registro-btn registro-btn-secundario" onClick={handlePrev} disabled={loading}>
                Anterior
              </button>
            )}
            {paso < STEPS.length && (
              <button type="button" className="registro-btn registro-btn btn-primario" onClick={handleNext} disabled={loading}>
                Continuar
              </button>
            )}
          </div>

          {validationError && <p className="registro-error">{validationError}</p>}
          {error && <p className="registro-error">{error}</p>}
        </div>
      </div>
    </main>
  );
}
