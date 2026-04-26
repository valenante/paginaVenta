import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getLoyaltyConfig, updateLoyaltyConfig } from "../services/loyaltyAdminService";
import "./LoyaltyConfigPage.css";

const TIPOS = [
  { value: "descuento_fijo", label: "Descuento fijo (€)", hint: "Resta X € del total." },
  { value: "descuento_pct", label: "Descuento porcentual (%)", hint: "Resta X% del total." },
  { value: "producto_gratis", label: "Producto gratis", hint: "Equivalente a un valor declarado." },
];

export default function LoyaltyConfigPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editing, setEditing] = useState(null); // recompensa que se edita en el modal

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await getLoyaltyConfig();
      setConfig(c);
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo cargar la configuración.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async (patch) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateLoyaltyConfig({ ...config, ...patch });
      setConfig(updated);
      setSuccess("Cambios guardados.");
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const onToggleActivo = (activo) => guardar({ activo });
  const onChangePuntosEuro = (v) => guardar({ puntosPorEuro: Number(v) || 0 });

  const onSaveRecompensa = (r) => {
    const recompensas = [...(config.recompensas || [])];
    if (r._id) {
      const idx = recompensas.findIndex((x) => String(x._id) === String(r._id));
      if (idx >= 0) recompensas[idx] = r;
    } else {
      recompensas.push(r);
    }
    guardar({ recompensas });
    setEditing(null);
  };

  const onDeleteRecompensa = (id) => {
    if (!window.confirm("¿Eliminar esta recompensa?")) return;
    const recompensas = (config.recompensas || []).filter((r) => String(r._id) !== String(id));
    guardar({ recompensas });
  };

  if (loading) return <div className="loyalty-config"><p>Cargando…</p></div>;

  return (
    <div className="loyalty-config">
      <header className="loyalty-config__header">
        <Link to="/dashboard" className="loyalty-config__back">← Volver</Link>
        <h1>💳 Programa de fidelización</h1>
        <p>
          Configura el programa de puntos de tu restaurante. Los clientes acumulan puntos al cobrar
          la mesa y pueden canjearlos por las recompensas que definas aquí.
        </p>
      </header>

      {error && <div className="loyalty-config__error">{error}</div>}
      {success && <div className="loyalty-config__success">{success}</div>}

      <section className="loyalty-config__section">
        <div className="loyalty-config__row">
          <div>
            <h2>Estado del programa</h2>
            <p className="loyalty-config__hint">
              Cuando está apagado, los puntos no se acumulan ni se pueden canjear, aunque vincules clientes a mesas.
            </p>
          </div>
          <label className="loyalty-config__toggle">
            <input
              type="checkbox"
              checked={!!config?.activo}
              onChange={(e) => onToggleActivo(e.target.checked)}
              disabled={saving}
            />
            <span>{config?.activo ? "Activo" : "Inactivo"}</span>
          </label>
        </div>
      </section>

      <section className="loyalty-config__section">
        <div className="loyalty-config__row">
          <div>
            <h2>Puntos por euro</h2>
            <p className="loyalty-config__hint">
              Cuántos puntos suma el cliente por cada euro consumido. Recomendado: 10 (10 € = 100 pts).
            </p>
          </div>
          <input
            type="number"
            min="0"
            step="1"
            className="loyalty-config__num"
            value={config?.puntosPorEuro ?? 10}
            onChange={(e) => setConfig((c) => ({ ...c, puntosPorEuro: Number(e.target.value) }))}
            onBlur={(e) => onChangePuntosEuro(e.target.value)}
            disabled={saving}
          />
        </div>
      </section>

      <section className="loyalty-config__section">
        <div className="loyalty-config__section-header">
          <div>
            <h2>Recompensas</h2>
            <p className="loyalty-config__hint">
              Lo que el cliente puede canjear con sus puntos.
            </p>
          </div>
          <button
            type="button"
            className="loyalty-config__btn-add"
            onClick={() => setEditing({ nombre: "", descripcion: "", coste: 100, tipo: "descuento_fijo", valor: 5, activo: true, stock: null })}
          >
            + Añadir recompensa
          </button>
        </div>

        {(config?.recompensas || []).length === 0 ? (
          <p className="loyalty-config__vacio">Aún no hay recompensas. Añade la primera para que tus clientes tengan algo que canjear.</p>
        ) : (
          <table className="loyalty-config__tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Coste (pts)</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Stock</th>
                <th>Activa</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {config.recompensas.map((r) => (
                <tr key={r._id || r.nombre} className={!r.activo ? "is-disabled" : ""}>
                  <td><strong>{r.nombre}</strong>{r.descripcion && <div className="loyalty-config__desc-mini">{r.descripcion}</div>}</td>
                  <td>{r.coste}</td>
                  <td>{TIPOS.find((t) => t.value === r.tipo)?.label || r.tipo}</td>
                  <td>{r.tipo === "descuento_pct" ? `${r.valor}%` : `${r.valor} €`}</td>
                  <td>{r.stock === null ? "∞" : r.stock}</td>
                  <td>{r.activo ? "✓" : "—"}</td>
                  <td>
                    <button type="button" onClick={() => setEditing(r)}>Editar</button>
                    <button type="button" className="del" onClick={() => onDeleteRecompensa(r._id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="loyalty-config__section loyalty-config__section--info">
        <h2>📝 En esta beta</h2>
        <ul>
          <li>Los multiplicadores horarios (ej: x2 mañanas) están en el modelo pero sin UI todavía.</li>
          <li>La caducidad de puntos no está activa (se gestionará con un cron en producción).</li>
          <li>El descuento por canjeo se muestra al camarero al canjear; lo aplica manualmente al cobrar.</li>
        </ul>
      </section>

      {editing && (
        <RecompensaModal
          recompensa={editing}
          onClose={() => setEditing(null)}
          onSave={onSaveRecompensa}
        />
      )}
    </div>
  );
}

function RecompensaModal({ recompensa, onClose, onSave }) {
  const [r, setR] = useState({ ...recompensa, stock: recompensa.stock ?? null });

  const submit = (e) => {
    e.preventDefault();
    if (!r.nombre.trim()) return;
    if (Number(r.coste) < 1) return;
    onSave({
      ...r,
      coste: Math.floor(Number(r.coste)),
      valor: Number(r.valor) || 0,
      stock: r.stock === null || r.stock === "" ? null : Math.max(0, Math.floor(Number(r.stock))),
    });
  };

  return (
    <div className="loyalty-config-modal__overlay" onClick={onClose}>
      <div className="loyalty-config-modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3>{r._id ? "Editar recompensa" : "Nueva recompensa"}</h3>
          <button type="button" onClick={onClose}>×</button>
        </header>

        <form onSubmit={submit}>
          <label>
            Nombre
            <input type="text" value={r.nombre} onChange={(e) => setR({ ...r, nombre: e.target.value })} required maxLength={100} />
          </label>

          <label>
            Descripción <span className="loyalty-config__hint">(opcional, lo ve el camarero al canjear)</span>
            <input type="text" value={r.descripcion || ""} onChange={(e) => setR({ ...r, descripcion: e.target.value })} maxLength={300} />
          </label>

          <div className="loyalty-config-modal__grid">
            <label>
              Coste en puntos
              <input type="number" min="1" step="1" value={r.coste} onChange={(e) => setR({ ...r, coste: e.target.value })} required />
            </label>

            <label>
              Tipo
              <select value={r.tipo} onChange={(e) => setR({ ...r, tipo: e.target.value })}>
                {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>

            <label>
              Valor {r.tipo === "descuento_pct" ? "(%)" : "(€)"}
              <input type="number" min="0" step="0.01" value={r.valor} onChange={(e) => setR({ ...r, valor: e.target.value })} required />
            </label>

            <label>
              Stock <span className="loyalty-config__hint">(vacío = ilimitado)</span>
              <input type="number" min="0" step="1" value={r.stock ?? ""} onChange={(e) => setR({ ...r, stock: e.target.value === "" ? null : e.target.value })} />
            </label>
          </div>

          <p className="loyalty-config__tipo-hint">{TIPOS.find((t) => t.value === r.tipo)?.hint}</p>

          <label className="loyalty-config-modal__checkbox">
            <input type="checkbox" checked={!!r.activo} onChange={(e) => setR({ ...r, activo: e.target.checked })} />
            <span>Activa (visible para canjear)</span>
          </label>

          <footer>
            <button type="button" className="loyalty-config-modal__cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="loyalty-config-modal__save">Guardar</button>
          </footer>
        </form>
      </div>
    </div>
  );
}
