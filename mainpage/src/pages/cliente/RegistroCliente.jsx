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
    <ClienteLayout>
      <main className="cli-login-page">
        <div className="cli-login-shell">
          <section className="cli-login-info">
            <span className="cli-login-kicker">Alef Club</span>
            <h1 className="cli-login-hero-title">
              Únete al programa <span>de fidelidad</span>
            </h1>
            <p className="cli-login-hero-subtitle">
              Acumula puntos cada vez que comes en un restaurante con Alef y canjéalos
              por descuentos y recompensas. Una sola cuenta, todos los restaurantes.
            </p>
            <ul className="cli-login-bullets">
              <li>Puntos automáticos en cada visita.</li>
              <li>Canjea descuentos y productos gratis.</li>
              <li>Sin tarjetas físicas: tu email basta.</li>
              <li>Tus datos seguros y exportables (RGPD).</li>
            </ul>
          </section>

          <section className="cli-login-card">
            <h2 className="cli-login-title">Crear cuenta</h2>
            <p className="cli-login-subtitle">
              Solo unos datos y empezarás a sumar puntos.
            </p>

            <form onSubmit={onSubmit} className="cli-login-form">
              <div className="cli-login-field">
                <label htmlFor="cli-reg-nombre">Nombre completo</label>
                <input
                  id="cli-reg-nombre"
                  name="nombre" type="text" required maxLength={200}
                  autoComplete="name"
                  value={form.nombre}
                  onChange={onChange}
                  placeholder="Ej: María García"
                />
              </div>

              <div className="cli-login-field">
                <label htmlFor="cli-reg-email">Correo electrónico</label>
                <input
                  id="cli-reg-email"
                  name="email" type="email" required
                  autoComplete="email" inputMode="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="tu@email.com"
                />
              </div>

              <div className="cli-login-field">
                <label htmlFor="cli-reg-tel">
                  Teléfono <span className="cli-login-field__optional">opcional</span>
                </label>
                <input
                  id="cli-reg-tel"
                  name="telefono" type="tel"
                  autoComplete="tel" inputMode="tel"
                  value={form.telefono}
                  onChange={onChange}
                  placeholder="+34 600 000 000"
                />
                <p className="cli-login-field__help">
                  El camarero podrá identificarte rápido en el restaurante.
                </p>
              </div>

              <div className="cli-login-field">
                <label htmlFor="cli-reg-pwd">Contraseña</label>
                <input
                  id="cli-reg-pwd"
                  name="password" type="password" required minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={onChange}
                />
                <PasswordMeter password={form.password} />
              </div>

              <label className="cli-login-check">
                <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
                <span>
                  Acepto los <Link to="/terminos">términos</Link> y la <Link to="/privacidad">política de privacidad</Link>.
                </span>
              </label>

              {error && <div className="cli-login-error" role="alert">{error}</div>}

              <button type="submit" className="cli-login-btn" disabled={submitting}>
                {submitting ? "Creando cuenta…" : "Crear mi cuenta Alef"}
              </button>
            </form>

            <p className="cli-login-footer-cta">
              ¿Ya tienes cuenta?{" "}
              <Link to="/cliente/login" className="cli-login-link">
                Inicia sesión
              </Link>
            </p>
          </section>
        </div>
      </main>
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
