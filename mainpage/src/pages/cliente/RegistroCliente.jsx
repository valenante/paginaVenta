import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import "./cliente.css";

export default function RegistroCliente() {
  const { register } = useClienteAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [acepto, setAcepto] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!acepto) {
      setError("Debes aceptar las condiciones para continuar.");
      return;
    }
    setSubmitting(true);
    try {
      await register(form);
      navigate("/cliente/perfil");
    } catch (err) {
      const msg = err?.response?.data?.message || "No se pudo crear la cuenta.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cliente-auth">
      <div className="cliente-auth__card">
        <h1 className="cliente-auth__title">Crea tu cuenta ALEF</h1>
        <p className="cliente-auth__subtitle">
          Acumula puntos en cada visita a los restaurantes ALEF y canjéalos por descuentos.
        </p>

        <form onSubmit={onSubmit} className="cliente-auth__form">
          <label>
            Nombre
            <input
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={onChange}
              required
              autoComplete="name"
              maxLength={200}
            />
          </label>

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
            Teléfono <span className="cliente-auth__hint">(opcional, pero te identifica más rápido en el restaurante)</span>
            <input
              name="telefono"
              type="tel"
              value={form.telefono}
              onChange={onChange}
              autoComplete="tel"
              inputMode="tel"
              placeholder="+34 600 000 000"
            />
          </label>

          <label>
            Contraseña <span className="cliente-auth__hint">(mín. 8 caracteres con letra y número)</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </label>

          <label className="cliente-auth__checkbox">
            <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
            <span>
              Acepto los <Link to="/terminos">términos</Link> y la <Link to="/privacidad">política de privacidad</Link>.
              Esto es una <strong>beta</strong> del programa de fidelización.
            </span>
          </label>

          {error && <div className="cliente-auth__error">{error}</div>}

          <button type="submit" className="cliente-auth__submit" disabled={submitting}>
            {submitting ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <p className="cliente-auth__alt">
          ¿Ya tienes cuenta? <Link to="/cliente/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
