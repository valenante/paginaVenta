import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../context/TenantContext";
import api from "../utils/api";
import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setTenantId, clearTenant } = useTenant();

  // ============================
  // 🔧 Manejo del formulario
  // ============================
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ============================
  // 🚪 Login Global (Alef)
  // ============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1) Login: solo para crear la sesión / cookie
      await api.post("/auth/login", form);

      // 2) Ahora sí, pedimos el usuario completo desde /auth/me/me
      const meRes = await api.get("/auth/me/me");
      const user = meRes.data.user;

      // Limpia errores anteriores (por si venías de /esto-no-existe)
      clearTenant();

      // Guarda (como ya haces)
      sessionStorage.setItem("user", JSON.stringify(user));
      if (user.tenantId) {
        sessionStorage.setItem("tenantId", user.tenantId);
        setTenantId(user.tenantId); // ✅ CLAVE
      }

      // 1️⃣ SUPERADMIN → Panel central Alef
      if (user.role === "superadmin") {
        return navigate("/superadmin");
      }

      const isLocalhost = window.location.hostname === "localhost";
      const tenantSlug = user.tenantId;

      if (!tenantSlug) {
        setError("No se encontró el restaurante asignado.");
        return;
      }

      // 👉 Detectar plan esencial (ahora SÍ viene bien)
      const isPlanEsencial =
        user.plan === "esencial" || user.plan === "tpv-esencial";

      // 2️⃣ Roles ligados a restaurante
      if (["admin_restaurante", "admin_tienda", "admin", "camarero", "cocinero"].includes(user.role)) {
        let url;

        if (isLocalhost) {
          url = `http://localhost:5173/${tenantSlug}/pro`;
        } else {
          const base = `https://${tenantSlug}-panel.${import.meta.env.VITE_MAIN_DOMAIN}`;
          url = `${base}/pro`;
        }

        window.location.href = url;
        return;
      }

      // 3️⃣ Otros roles globales (muy raro)
      navigate("/");
    } catch (err) {
      console.error("❌ Error de inicio de sesión:", err);

      const backendMsg = err.response?.data?.error;

      setError(
        backendMsg ||
        "Error al iniciar sesión. Revisa tus credenciales e intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // 🔐 Recuperar contraseña
  // ============================
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  // ============================
  // 🎨 Render UI
  // ============================
  return (
    <main className="login-page">
      <div className="login-shell">
        {/* Lado izquierdo: branding / mensaje */}
        <section className="login-info">
          <span className="login-kicker">Panel Alef</span>
          <h1 className="login-hero-title">
            Accede al corazón digital de tu restaurante
          </h1>
          <p className="login-hero-subtitle">
            Desde aquí gestionas tus locales, planes, usuarios y todo lo que
            ocurre en tu TPV Alef. Un solo acceso para controlar la operación
            completa.
          </p>

          <ul className="login-bullets">
            <li>Ver y gestionar tus restaurantes y usuarios.</li>
            <li>Configurar carta digital, reservas y flujos de trabajo.</li>
            <li>Acceder rápidamente al TPV y a la carta online.</li>
          </ul>
        </section>

        {/* Lado derecho: tarjeta de login */}
        <section className="login-card card">
          <h2 className="login-title">Iniciar sesión en Alef</h2>
          <p className="login-subtitle">
            Usa las credenciales que recibiste al dar de alta tu restaurante
            o tu usuario.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            {/* EMAIL */}
            <div className="login-field">
              <label htmlFor="login-email">Correo electrónico</label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tu@restaurante.com"
                autoComplete="username"
                required
              />
            </div>

            {/* PASSWORD */}
            {/* PASSWORD */}
            <div className="login-field login-field-password">
              <label htmlFor="login-password">Contraseña</label>

              <div className="login-password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            {/* ERROR */}
            {error && <p className="login-error">{error}</p>}

            {/* BOTÓN */}
            <button type="submit" className="login-btn btn-primario" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Entrar"}
            </button>

            {/* RECUPERAR CONTRASEÑA */}
            <button
              type="button"
              className="login-forgot"
              onClick={handleForgotPassword}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>

          {/* FOOTER */}
          <p className="login-footer">
            ¿No tienes cuenta?{" "}
            <a href="/registro" className="login-link">
              Regístrate aquí
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
