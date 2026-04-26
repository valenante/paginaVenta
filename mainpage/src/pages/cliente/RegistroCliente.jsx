import React, { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import ClienteLayout from "./ClienteLayout";
import "./cliente.css";

export default function RegistroCliente() {
  const { register, isAuthenticated, loading } = useClienteAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [acepto, setAcepto] = useState(false);

  if (!loading && isAuthenticated) return <Navigate to="/cliente/perfil" replace />;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const passwordOk = form.password.length >= 8 && /[A-Za-z]/.test(form.password) && /[0-9]/.test(form.password);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!acepto) return setError("Debes aceptar las condiciones para continuar.");
    if (!passwordOk) return setError("La contraseña debe tener mínimo 8 caracteres con letra y número.");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/cliente/perfil");
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo crear la cuenta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ClienteLayout narrow>
      <div className="cliente-auth-grid">
        <aside className="cliente-auth-hero">
          <h2>Únete al programa de fidelización <span>ALEF</span></h2>
          <p>
            Acumula puntos cada vez que comes en un restaurante con Alef y canjéalos
            por descuentos y recompensas. Una sola cuenta, todos los restaurantes.
          </p>
          <ul className="cliente-auth-hero__bullets">
            <li><span>✓</span> Puntos automáticos en cada visita</li>
            <li><span>✓</span> Canjea descuentos al cobrar</li>
            <li><span>✓</span> Sin tarjetas físicas: tu email basta</li>
            <li><span>✓</span> Tus datos seguros y exportables</li>
          </ul>
        </aside>

        <div className="cliente-auth-card">
          <header className="cliente-auth-card__header">
            <h1>Crear cuenta</h1>
            <p>Solo unos datos y empezarás a sumar puntos.</p>
          </header>

          <form onSubmit={onSubmit} className="cliente-auth-form">
            <div className="cliente-field">
              <label>Nombre completo</label>
              <input
                name="nombre" type="text" required maxLength={200}
                autoComplete="name"
                value={form.nombre}
                onChange={onChange}
                placeholder="Ej: María García"
              />
            </div>

            <div className="cliente-field">
              <label>Email</label>
              <input
                name="email" type="email" required
                autoComplete="email" inputMode="email"
                value={form.email}
                onChange={onChange}
                placeholder="tu@email.com"
              />
            </div>

            <div className="cliente-field">
              <label>Teléfono <span className="cliente-field__optional">opcional</span></label>
              <input
                name="telefono" type="tel"
                autoComplete="tel" inputMode="tel"
                value={form.telefono}
                onChange={onChange}
                placeholder="+34 600 000 000"
              />
              <p className="cliente-field__help">El camarero podrá identificarte rápido en el restaurante.</p>
            </div>

            <div className="cliente-field">
              <label>Contraseña</label>
              <input
                name="password" type="password" required minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={onChange}
              />
              <PasswordMeter password={form.password} />
            </div>

            <label className="cliente-check">
              <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
              <span>
                Acepto los <Link to="/terminos">términos</Link> y la <Link to="/privacidad">política de privacidad</Link>.
              </span>
            </label>

            {error && <div className="cliente-alert cliente-alert--error">{error}</div>}

            <button type="submit" className="cliente-btn cliente-btn--primary" disabled={submitting}>
              {submitting ? "Creando cuenta…" : "Crear mi cuenta ALEF"}
            </button>
          </form>

          <p className="cliente-auth-card__alt">
            ¿Ya tienes cuenta? <Link to="/cliente/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </ClienteLayout>
  );
}

function PasswordMeter({ password }) {
  const checks = [
    { ok: password.length >= 8, label: "Mínimo 8 caracteres" },
    { ok: /[A-Za-z]/.test(password), label: "Al menos una letra" },
    { ok: /[0-9]/.test(password), label: "Al menos un número" },
  ];
  return (
    <ul className="cliente-pwmeter">
      {checks.map((c, i) => (
        <li key={i} className={c.ok ? "is-ok" : ""}>
          <span aria-hidden="true">{c.ok ? "✓" : "○"}</span> {c.label}
        </li>
      ))}
    </ul>
  );
}
