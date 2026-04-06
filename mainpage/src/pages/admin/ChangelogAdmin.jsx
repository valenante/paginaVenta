import { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import "../../styles/ChangelogAdmin.css";

const TIPOS = ["nueva", "mejora", "fix", "cambio"];
const DESTINATARIOS = ["todos", "admin", "superadmin"];

export default function ChangelogAdmin() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form
  const [form, setForm] = useState({
    version: "",
    titulo: "",
    descripcion: "",
    destinatarios: "todos",
    publicado: true,
    items: [{ tipo: "nueva", texto: "" }],
  });
  const [editId, setEditId] = useState(null);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/superadmin/changelog");
      setEntries(Array.isArray(data) ? data : data?.data || []);
    } catch {
      setError("Error cargando changelog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const resetForm = () => {
    setForm({ version: "", titulo: "", descripcion: "", destinatarios: "todos", publicado: true, items: [{ tipo: "nueva", texto: "" }] });
    setEditId(null);
    setError("");
  };

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { tipo: "mejora", texto: "" }] }));
  const removeItem = (i) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => setForm((f) => ({
    ...f,
    items: f.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it),
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.version.trim() || !form.titulo.trim()) {
      setError("Version y titulo son obligatorios");
      return;
    }

    const cleanItems = form.items.filter((it) => it.texto.trim());
    const payload = { ...form, items: cleanItems };

    try {
      setLoading(true);
      setError("");
      if (editId) {
        await api.put(`/admin/superadmin/changelog/${editId}`, payload);
      } else {
        await api.post("/admin/superadmin/changelog", payload);
      }
      resetForm();
      await fetchEntries();
    } catch (err) {
      setError(err?.response?.data?.message || "Error guardando");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry) => {
    setForm({
      version: entry.version,
      titulo: entry.titulo,
      descripcion: entry.descripcion || "",
      destinatarios: entry.destinatarios || "todos",
      publicado: entry.publicado !== false,
      items: entry.items?.length ? entry.items : [{ tipo: "nueva", texto: "" }],
    });
    setEditId(entry._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Eliminar esta entrada?")) return;
    try {
      await api.delete(`/admin/superadmin/changelog/${id}`);
      await fetchEntries();
    } catch {
      setError("Error eliminando");
    }
  };

  const handleToggle = async (entry) => {
    try {
      await api.put(`/admin/superadmin/changelog/${entry._id}`, { publicado: !entry.publicado });
      await fetchEntries();
    } catch {
      setError("Error actualizando");
    }
  };

  return (
    <div className="cla-page">
      <h2 className="cla-title">Changelog / Novedades</h2>
      <p className="cla-subtitle">
        Las entradas publicadas se muestran a los usuarios del panel al entrar.
      </p>

      {error && <p className="cla-error">{error}</p>}

      {/* FORMULARIO */}
      <form className="cla-form card" onSubmit={handleSubmit}>
        <h3>{editId ? "Editar entrada" : "Nueva entrada"}</h3>

        <div className="cla-row">
          <div className="cla-field">
            <label>Version *</label>
            <input
              value={form.version}
              onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
              placeholder="2.1.0"
              disabled={!!editId}
            />
          </div>
          <div className="cla-field">
            <label>Destinatarios</label>
            <select
              value={form.destinatarios}
              onChange={(e) => setForm((f) => ({ ...f, destinatarios: e.target.value }))}
            >
              {DESTINATARIOS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="cla-field cla-field--check">
            <label>
              <input
                type="checkbox"
                checked={form.publicado}
                onChange={(e) => setForm((f) => ({ ...f, publicado: e.target.checked }))}
              />
              Publicado
            </label>
          </div>
        </div>

        <div className="cla-field">
          <label>Titulo *</label>
          <input
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            placeholder="Comandas por voz y mejoras en cocina"
          />
        </div>

        <div className="cla-field">
          <label>Descripcion (opcional)</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            placeholder="Breve descripcion de la actualizacion..."
            rows={2}
          />
        </div>

        <div className="cla-items-section">
          <label>Items de la actualizacion</label>
          {form.items.map((item, i) => (
            <div key={i} className="cla-item-row">
              <select
                value={item.tipo}
                onChange={(e) => updateItem(i, "tipo", e.target.value)}
              >
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                value={item.texto}
                onChange={(e) => updateItem(i, "texto", e.target.value)}
                placeholder="Descripcion del cambio..."
              />
              <button type="button" className="cla-item-remove" onClick={() => removeItem(i)}>x</button>
            </div>
          ))}
          <button type="button" className="cla-add-item" onClick={addItem}>+ Agregar item</button>
        </div>

        <div className="cla-form-actions">
          <button type="submit" className="cla-btn cla-btn--primary" disabled={loading}>
            {editId ? "Guardar cambios" : "Crear entrada"}
          </button>
          {editId && (
            <button type="button" className="cla-btn cla-btn--secondary" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* LISTA */}
      <div className="cla-list">
        {entries.map((entry) => (
          <div key={entry._id} className={`cla-entry card ${entry.publicado ? "" : "cla-entry--draft"}`}>
            <div className="cla-entry-header">
              <div>
                <strong className="cla-entry-version">v{entry.version}</strong>
                <span className="cla-entry-titulo">{entry.titulo}</span>
                <span className={`cla-entry-status ${entry.publicado ? "cla-entry-status--pub" : ""}`}>
                  {entry.publicado ? "Publicado" : "Borrador"}
                </span>
                <span className="cla-entry-dest">{entry.destinatarios}</span>
              </div>
              <div className="cla-entry-actions">
                <button onClick={() => handleToggle(entry)}>
                  {entry.publicado ? "Despublicar" : "Publicar"}
                </button>
                <button onClick={() => handleEdit(entry)}>Editar</button>
                <button className="cla-btn--danger" onClick={() => handleDelete(entry._id)}>Eliminar</button>
              </div>
            </div>
            {entry.items?.length > 0 && (
              <ul className="cla-entry-items">
                {entry.items.map((it, i) => (
                  <li key={i}><span className={`cla-tipo cla-tipo--${it.tipo}`}>{it.tipo}</span> {it.texto}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {!entries.length && !loading && <p className="cla-empty">No hay entradas de changelog.</p>}
      </div>
    </div>
  );
}
