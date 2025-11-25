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

      // ===============================
      // 🧭 REDIRECCIÓN SEGÚN EL ROL
      // ===============================

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

      // 2️⃣ Roles ligados a restaurante → ir al entorno del restaurante
      //    (admin_restaurante, admin, camarero, cocinero)
      if (
        ["admin_restaurante", "admin", "camarero", "cocinero"].includes(user.role)
      ) {
        const url = isLocalDomain
          // 🔹 Entorno local: usamos alef.local con el slug como primer segmento
          ? `https://alef.local.softalef.com/${tenantSlug}`
          // 🔹 Producción: subdominio por tenant para el TPV
          : `https://tpv.${tenantSlug}.${import.meta.env.VITE_MAIN_DOMAIN}`;

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
      <div className="login-container">
        <h1 className="login-title">Iniciar sesión en Alef</h1>
        <p className="login-subtitle">
          Accede a tu panel de control o al entorno de tu restaurante.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          {/* EMAIL */}
          <label>
            Correo electrónico:
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="tu@restaurante.com"
              autoComplete="username"
              required
            />
          </label>

          {/* PASSWORD */}
          <label>
            Contraseña:
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {/* ERROR */}
          {error && <p className="login-error">{error}</p>}

          {/* BOTÓN */}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Entrar"}
          </button>

          {/* RECUPERAR CONTRASEÑA */}
          <p className="login-forgot" onClick={handleForgotPassword}>
            ¿Olvidaste tu contraseña?
          </p>
        </form>

        {/* FOOTER */}
        <p className="login-footer">
          ¿No tienes cuenta?{" "}
          <a href="/registro" className="login-link">
            Regístrate aquí
          </a>
        </p>
      </div>
    </main>
  );
}
