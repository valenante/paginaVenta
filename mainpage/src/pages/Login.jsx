import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
      const response = await api.post("/auth/login", form);
      const { user } = response.data;

      // Guardar info de usuario para UI / impersonado (NO para auth)
      sessionStorage.setItem("user", JSON.stringify(user));
      if (user.tenantId) {
        sessionStorage.setItem("tenantId", user.tenantId);
      }

      // 1️⃣ SUPERADMIN → Panel central Alef
      if (user.role === "superadmin") {
        return navigate("/superadmin");
      }

      const isLocalDomain = window.location.hostname.includes("local.");
      const tenantSlug = user.tenantId;

      if (!tenantSlug) {
        setError("No se encontró el restaurante asignado.");
        return;
      }

      // 2️⃣ Roles ligados a restaurante
      if (["admin_restaurante", "admin", "camarero", "cocinero"].includes(user.role)) {
        const domain = import.meta.env.VITE_MAIN_DOMAIN;

        const url = isLocalDomain
          ? `https://alef.local.softalef.com/${tenantSlug}` // desarrollo local
          : `https://${tenantSlug}-panel.${domain}`;        // PANEL del restaurante

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
            <div className="login-field">
              <label htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
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
