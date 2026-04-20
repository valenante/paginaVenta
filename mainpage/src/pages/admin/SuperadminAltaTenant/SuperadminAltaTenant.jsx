// src/pages/admin/SuperadminAltaTenant/SuperadminAltaTenant.jsx
// Alta rápida de tenant desde panel superadmin — flujo simplificado y coherente
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiArrowRight, FiCheck, FiLoader } from "react-icons/fi";
import api from "../../../utils/api";
import "./SuperadminAlta.css";

/* ── Precios actualizados (coherentes con pricing v3.2) ── */
const PLAN_SETUP = {
  "alef-shop": 199,
  "tpv-esencial": 349,
  "tpv-premium": 549,
};

export default function SuperadminAltaTenant() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Planes desde API
  const [planes, setPlanes] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/admin/superadminPlans/publicPlans");
        setPlanes(Array.isArray(data) ? data : []);
      } catch { /* silent */ }
    })();
  }, []);

  // Form state
  const [form, setForm] = useState({
    plan: "",
    nombre: "",
    email: "",
    adminName: "",
    tipoNegocio: "restaurante",
    periodo: "mensual",
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const planObj = useMemo(() => planes.find(p => p.slug === form.plan) || null, [planes, form.plan]);
  const isShop = (planObj?.tipoNegocio || form.tipoNegocio) === "shop";
  const mensual = Number(planObj?.precioMensual || 0);
  const setup = PLAN_SETUP[form.plan] || 0;
  const totalPrimerMes = mensual + setup;

  // Sync tipoNegocio cuando cambia plan
  useEffect(() => {
    if (planObj?.tipoNegocio) set("tipoNegocio", planObj.tipoNegocio);
  }, [planObj]);

  // Validación por paso
  const erroresPaso1 = () => {
    if (!form.plan) return "Selecciona un plan";
    if (!form.nombre.trim()) return "Nombre del negocio obligatorio";
    if (!form.email.trim() || !form.email.includes("@")) return "Email válido obligatorio";
    if (!form.adminName.trim()) return "Nombre del administrador obligatorio";
    return null;
  };

  const siguiente = () => {
    const err = erroresPaso1();
    if (err) { setError(err); return; }
    setError("");
    setPaso(2);
  };

  // Provisionar
  const handleProvision = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 1. Precheckout
      const preRes = await api.post("/superadmin/onboarding/precheckout", {
        tenant: {
          nombre: form.nombre.trim(),
          email: form.email.trim().toLowerCase(),
          plan: form.plan,
          tipoNegocio: form.tipoNegocio,
        },
        admin: {
          name: form.adminName.trim(),
          email: form.email.trim().toLowerCase(),
        },
        plan: form.plan,
        config: {},
        servicios: {},
        precio: { mensual, unico: setup, totalPrimerMes },
        ciclo: form.periodo.toUpperCase(),
      });

      const precheckoutId = preRes.data?.precheckoutId || preRes.data?.data?.precheckoutId;
      if (!precheckoutId) throw new Error("No se recibió precheckoutId");

      // 2. Provision
      const provRes = await api.post("/superadmin/onboarding/provision", { precheckoutId });
      const d = provRes.data?.data || provRes.data;

      if (d?.passwordSetupUrl) {
        setSuccess(`Tenant creado. Link set-password: ${d.passwordSetupUrl}`);
      } else {
        setSuccess(`Tenant ${d?.tenantSlug || form.nombre} creado correctamente.`);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Error al provisionar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sa-alta">
      <button className="sa-alta__back" onClick={() => navigate("/superadmin")}>
        <FiArrowLeft /> Volver
      </button>

      <h1 className="sa-alta__title">Alta de nuevo negocio</h1>
      <p className="sa-alta__sub">Provisión directa sin pago. Se envía email con link de contraseña.</p>

      {/* Stepper */}
      <div className="sa-stepper">
        <div className={`sa-step ${paso >= 1 ? "sa-step--active" : ""} ${paso > 1 ? "sa-step--done" : ""}`}>
          <span className="sa-step__num">{paso > 1 ? <FiCheck /> : "1"}</span>
          <span className="sa-step__label">Datos</span>
        </div>
        <div className="sa-step__line" />
        <div className={`sa-step ${paso >= 2 ? "sa-step--active" : ""}`}>
          <span className="sa-step__num">2</span>
          <span className="sa-step__label">Confirmar</span>
        </div>
      </div>

      {/* PASO 1: Datos */}
      {paso === 1 && (
        <div className="sa-form">
          <div className="sa-field">
            <label>Plan</label>
            <select value={form.plan} onChange={e => set("plan", e.target.value)}>
              <option value="">— Selecciona plan —</option>
              {planes.map(p => (
                <option key={p._id} value={p.slug}>
                  {p.nombre} — {p.precioMensual}€/mes {p.tipoNegocio === "shop" ? "(Shop)" : ""}
                </option>
              ))}
            </select>
          </div>

          {planObj && (
            <div className="sa-plan-info">
              <strong>{planObj.nombre}</strong> — {mensual}€/mes
              {planObj.features?.length > 0 && (
                <ul>{planObj.features.slice(0, 6).map((f, i) => <li key={i}>{f.nombre || f}</li>)}</ul>
              )}
            </div>
          )}

          <div className="sa-field">
            <label>Nombre del {isShop ? "negocio" : "restaurante"}</label>
            <input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej. Zabor Feten" />
          </div>

          <div className="sa-field">
            <label>Email (admin + contacto)</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="admin@restaurante.com" />
          </div>

          <div className="sa-field">
            <label>Nombre del administrador</label>
            <input value={form.adminName} onChange={e => set("adminName", e.target.value)} placeholder="Ej. Manuel García" />
          </div>

          <button className="sa-btn sa-btn--primary" onClick={siguiente}>
            Siguiente <FiArrowRight />
          </button>
        </div>
      )}

      {/* PASO 2: Confirmar y provisionar */}
      {paso === 2 && (
        <div className="sa-confirm">
          <div className="sa-summary">
            <h3>Resumen</h3>
            <div className="sa-summary__grid">
              <div><span className="sa-label">Negocio</span><span>{form.nombre}</span></div>
              <div><span className="sa-label">Email</span><span>{form.email}</span></div>
              <div><span className="sa-label">Admin</span><span>{form.adminName}</span></div>
              <div><span className="sa-label">Plan</span><span>{planObj?.nombre || form.plan}</span></div>
              <div><span className="sa-label">Tipo</span><span>{isShop ? "Shop" : "Restaurante"}</span></div>
            </div>
          </div>

          <div className="sa-pricing">
            <h3>Coste</h3>
            <div className="sa-pricing__row">
              <span>Suscripción mensual</span>
              <strong>{mensual.toFixed(2)}€/mes</strong>
            </div>
            <div className="sa-pricing__row">
              <span>Alta y configuración</span>
              <strong>{setup.toFixed(2)}€</strong>
            </div>
            <div className="sa-pricing__row sa-pricing__row--total">
              <span>Total primer mes</span>
              <strong>{totalPrimerMes.toFixed(2)}€</strong>
            </div>
            <p className="sa-pricing__note">Sin permanencia. Provisión sin cobro — facturación manual posterior.</p>
          </div>

          <div className="sa-confirm__actions">
            <button className="sa-btn sa-btn--ghost" onClick={() => setPaso(1)} disabled={loading}>
              <FiArrowLeft /> Volver
            </button>
            <button className="sa-btn sa-btn--primary" onClick={handleProvision} disabled={loading}>
              {loading ? <><FiLoader className="sa-spin" /> Provisionando...</> : <><FiCheck /> Crear y provisionar</>}
            </button>
          </div>
        </div>
      )}

      {error && <div className="sa-msg sa-msg--error">{error}</div>}
      {success && (
        <div className="sa-msg sa-msg--success">
          {success}
          <button className="sa-btn sa-btn--ghost" onClick={() => navigate("/superadmin")} style={{ marginTop: 8 }}>
            Volver al dashboard
          </button>
        </div>
      )}
    </div>
  );
}
