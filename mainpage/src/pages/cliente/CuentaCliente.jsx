import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useClienteAuth } from "../../context/ClienteAuthContext";
import {
  actualizarPerfil,
  cambiarPassword,
  borrarCuenta,
} from "../../services/clienteAuthService";
import ClienteLayout from "./ClienteLayout";
import "./cliente.css";

const TABS = [
  { id: "datos", label: "Datos personales" },
  { id: "password", label: "Contraseña" },
  { id: "borrar", label: "Borrar cuenta" },
];

export default function CuentaCliente() {
  const { cliente, loading, refresh, logout } = useClienteAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("datos");

  if (!loading && !cliente) return <Navigate to="/cliente/login" replace />;
  if (loading || !cliente) {
    return (
      <ClienteLayout>
        <div className="cliente-skel cliente-skel--cards" />
      </ClienteLayout>
    );
  }

  return (
    <ClienteLayout>
      <header className="cliente-section__header">
        <div>
          <h1 className="cliente-section__h1">Mi cuenta</h1>
          <p className="cliente-section__sub">
            Gestiona tus datos personales, cambia tu contraseña y controla tu cuenta ALEF.
          </p>
        </div>
      </header>

      <nav className="cli-cuenta-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            className={`cli-cuenta-tab ${tab === t.id ? "is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="cli-cuenta-card">
        {tab === "datos" && <DatosTab cliente={cliente} onSaved={refresh} />}
        {tab === "password" && <PasswordTab />}
        {tab === "borrar" && <BorrarTab onBorrado={() => { logout(); navigate("/cliente/login"); }} />}
      </div>
    </ClienteLayout>
  );
}

/* ─────────── Datos personales ─────────── */

function DatosTab({ cliente, onSaved }) {
  const [form, setForm] = useState({
    nombre: cliente.nombre || "",
    telefono: cliente.telefono || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await actualizarPerfil({
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
      });
      await onSaved?.();
      setSuccess("Datos actualizados correctamente.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="cliente-auth-form">
      <h2 className="cli-cuenta-h2">Datos personales</h2>
      <p className="cli-cuenta-help">
        Tu email no se puede cambiar desde aquí (es tu identificador único). Si necesitas
        modificarlo escríbenos a <a href="mailto:contacto@softalef.com">contacto@softalef.com</a>.
      </p>

      <div className="cliente-field">
        <label>Email</label>
        <input type="email" value={cliente.email} disabled readOnly />
      </div>

      <div className="cliente-field">
        <label>Nombre completo</label>
        <input
          name="nombre"
          type="text"
          value={form.nombre}
          onChange={onChange}
          required
          maxLength={200}
        />
      </div>

      <div className="cliente-field">
        <label>
          Teléfono
          <span className="cliente-field__optional">opcional</span>
        </label>
        <input
          name="telefono"
          type="tel"
          inputMode="tel"
          value={form.telefono}
          onChange={onChange}
          placeholder="+34 600 000 000"
        />
        <p className="cliente-field__help">
          El camarero te identifica más rápido en el restaurante si tienes teléfono.
        </p>
      </div>

      {error && <div className="cliente-alert cliente-alert--error">{error}</div>}
      {success && <div className="cliente-alert cliente-alert--success">{success}</div>}

      <div className="cli-cuenta-footer">
        <button type="submit" className="cliente-btn cliente-btn--primary" disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

/* ─────────── Contraseña ─────────── */

function PasswordTab() {
  const [form, setForm] = useState({ passwordActual: "", passwordNueva: "", passwordNueva2: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const newOk =
    form.passwordNueva.length >= 8 &&
    /[A-Za-z]/.test(form.passwordNueva) &&
    /[0-9]/.test(form.passwordNueva);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (form.passwordNueva !== form.passwordNueva2) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (!newOk) {
      setError("La nueva contraseña debe tener mínimo 8 caracteres con letra y número.");
      return;
    }
    setSaving(true);
    try {
      await cambiarPassword({
        passwordActual: form.passwordActual,
        passwordNueva: form.passwordNueva,
      });
      setForm({ passwordActual: "", passwordNueva: "", passwordNueva2: "" });
      setSuccess("Contraseña cambiada correctamente. Las demás sesiones se han cerrado.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="cliente-auth-form">
      <h2 className="cli-cuenta-h2">Cambiar contraseña</h2>
      <p className="cli-cuenta-help">
        Por seguridad, cambiar la contraseña cierra cualquier otra sesión activa
        (móviles, navegadores antiguos, etc).
      </p>

      <div className="cliente-field">
        <label>Contraseña actual</label>
        <input
          name="passwordActual"
          type="password"
          value={form.passwordActual}
          onChange={onChange}
          autoComplete="current-password"
          required
        />
      </div>

      <div className="cliente-field">
        <label>Nueva contraseña</label>
        <input
          name="passwordNueva"
          type="password"
          value={form.passwordNueva}
          onChange={onChange}
          autoComplete="new-password"
          required
          minLength={8}
        />
        <ul className="cliente-pwmeter">
          <li className={form.passwordNueva.length >= 8 ? "is-ok" : ""}>
            <span aria-hidden="true">{form.passwordNueva.length >= 8 ? "✓" : "○"}</span> Mínimo 8 caracteres
          </li>
          <li className={/[A-Za-z]/.test(form.passwordNueva) ? "is-ok" : ""}>
            <span aria-hidden="true">{/[A-Za-z]/.test(form.passwordNueva) ? "✓" : "○"}</span> Al menos una letra
          </li>
          <li className={/[0-9]/.test(form.passwordNueva) ? "is-ok" : ""}>
            <span aria-hidden="true">{/[0-9]/.test(form.passwordNueva) ? "✓" : "○"}</span> Al menos un número
          </li>
        </ul>
      </div>

      <div className="cliente-field">
        <label>Confirma la nueva contraseña</label>
        <input
          name="passwordNueva2"
          type="password"
          value={form.passwordNueva2}
          onChange={onChange}
          autoComplete="new-password"
          required
        />
      </div>

      {error && <div className="cliente-alert cliente-alert--error">{error}</div>}
      {success && <div className="cliente-alert cliente-alert--success">{success}</div>}

      <div className="cli-cuenta-footer">
        <button type="submit" className="cliente-btn cliente-btn--primary" disabled={saving}>
          {saving ? "Cambiando…" : "Cambiar contraseña"}
        </button>
      </div>
    </form>
  );
}

/* ─────────── Borrar cuenta ─────────── */

function BorrarTab({ onBorrado }) {
  const [form, setForm] = useState({ passwordActual: "", confirmacion: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.confirmacion !== "BORRAR") {
      setError("Debes escribir BORRAR (en mayúsculas) para confirmar.");
      return;
    }
    if (!window.confirm("¿Seguro que quieres borrar tu cuenta? Esta acción no se puede deshacer.")) return;
    setSaving(true);
    try {
      await borrarCuenta(form);
      onBorrado?.();
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo borrar la cuenta.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="cliente-auth-form">
      <h2 className="cli-cuenta-h2 cli-cuenta-h2--danger">Borrar cuenta</h2>

      <div className="cli-cuenta-warning">
        <strong>⚠️ Esta acción es irreversible.</strong>
        <ul>
          <li>Tu nombre y email se anonimizarán inmediatamente.</li>
          <li>Tu saldo de puntos en todos los restaurantes se perderá.</li>
          <li>Tu historial de movimientos se conserva (por integridad fiscal del restaurante)
              pero ya no estará vinculado a ti.</li>
          <li>Tendrás que crear una cuenta nueva si quieres volver al programa.</li>
        </ul>
      </div>

      <div className="cliente-field">
        <label>Contraseña actual</label>
        <input
          type="password"
          value={form.passwordActual}
          onChange={(e) => setForm((f) => ({ ...f, passwordActual: e.target.value }))}
          autoComplete="current-password"
          required
        />
      </div>

      <div className="cliente-field">
        <label>Escribe <code>BORRAR</code> para confirmar</label>
        <input
          type="text"
          value={form.confirmacion}
          onChange={(e) => setForm((f) => ({ ...f, confirmacion: e.target.value }))}
          required
          placeholder="BORRAR"
        />
      </div>

      {error && <div className="cliente-alert cliente-alert--error">{error}</div>}

      <div className="cli-cuenta-footer">
        <button type="submit" className="cli-cuenta-btn-danger" disabled={saving || form.confirmacion !== "BORRAR"}>
          {saving ? "Borrando…" : "Borrar mi cuenta definitivamente"}
        </button>
      </div>
    </form>
  );
}
