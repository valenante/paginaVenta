import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import "./cliente.css";

export default function LoginCliente() {
  const { login } = useClienteAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(form);
      navigate("/cliente/perfil");
    } catch (err) {
      const msg = err?.response?.data?.message || "Email o contraseña incorrectos.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cliente-auth">
      <div className="cliente-auth__card">
        <h1 className="cliente-auth__title">Inicia sesión</h1>
        <p className="cliente-auth__subtitle">Accede a tu perfil y consulta tus puntos.</p>

        <form onSubmit={onSubmit} className="cliente-auth__form">
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              required
              autoComplete="email"
              inputMode="email"
            />
          </label>

          <label>
            Contraseña
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              required
              autoComplete="current-password"
            />
          </label>

          {error && <div className="cliente-auth__error">{error}</div>}

          <button type="submit" className="cliente-auth__submit" disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="cliente-auth__alt">
          ¿No tienes cuenta? <Link to="/cliente/registro">Crea una</Link>
        </p>
      </div>
    </div>
  );
}
