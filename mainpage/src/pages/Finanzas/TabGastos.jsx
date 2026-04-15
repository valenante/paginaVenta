import React, { useState } from "react";
import { useGastosFijos } from "../../hooks/useFinanzas";
import { eur, ymd, CATEGORIAS_GASTO } from "./utils";

const PERIODICIDAD_LABEL = {
  mensual: "Mensual",
  trimestral: "Trimestral",
  anual: "Anual",
};

const FORM_DEFAULT = {
  nombre: "",
  categoria: "alquiler",
  importe: "",
  iva: 21,
  periodicidad: "mensual",
  fechaInicio: ymd(new Date()),
  fechaFin: "",
  notas: "",
};

export default function TabGastos() {
  const { data, loading, error, crear, editar, borrar } = useGastosFijos();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(FORM_DEFAULT);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const openCrear = () => {
    setEditing(null);
    setForm(FORM_DEFAULT);
    setFormError(null);
    setShowModal(true);
  };

  const openEditar = (g) => {
    setEditing(g);
    setForm({
      nombre: g.nombre,
      categoria: g.categoria,
      importe: g.importe,
      iva: g.iva,
      periodicidad: g.periodicidad,
      fechaInicio: ymd(g.fechaInicio),
      fechaFin: g.fechaFin ? ymd(g.fechaFin) : "",
      notas: g.notas || "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        ...form,
        importe: Number(form.importe),
        iva: Number(form.iva),
        fechaFin: form.fechaFin || null,
      };
      if (editing) {
        await editar(editing._id, payload);
      } else {
        await crear(payload);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err?.response?.data?.message || err.message || "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBorrar = async (g) => {
    if (!confirm(`¿Borrar gasto fijo "${g.nombre}"?`)) return;
    try {
      await borrar(g._id);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Error al borrar");
    }
  };

  if (error) return <div className="fin-error">Error: {error}</div>;

  const items = data?.items || [];
  const totalMensualEstimado = items
    .filter((g) => g.activo)
    .reduce((acc, g) => {
      const ciclo = g.periodicidad === "anual" ? 12 : g.periodicidad === "trimestral" ? 3 : 1;
      return acc + g.importe / ciclo;
    }, 0);

  return (
    <div className="fin-tab-gastos">
      <div className="fin-toolbar">
        <div className="fin-gastos-resumen">
          <strong>{items.length}</strong> gastos fijos registrados ·
          aprox <strong>{eur(totalMensualEstimado)}</strong>/mes
        </div>
        <button className="fin-btn-primary" onClick={openCrear}>
          + Nuevo gasto fijo
        </button>
      </div>

      {loading && <div className="fin-loading">Cargando…</div>}

      {!loading && (
        <div className="fin-table-wrap">
          <table className="fin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Importe (BI)</th>
                <th>IVA</th>
                <th>Periodicidad</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((g) => {
                const cat = CATEGORIAS_GASTO.find((c) => c.value === g.categoria);
                return (
                  <tr key={g._id} style={{ opacity: g.activo ? 1 : 0.5 }}>
                    <td>
                      <strong>{g.nombre}</strong>
                      {g.notas && <div className="fin-table-sub">{g.notas}</div>}
                    </td>
                    <td>{cat?.label || g.categoria}</td>
                    <td>{eur(g.importe)}</td>
                    <td>{g.iva}%</td>
                    <td>{PERIODICIDAD_LABEL[g.periodicidad]}</td>
                    <td>{ymd(g.fechaInicio)}</td>
                    <td>{g.fechaFin ? ymd(g.fechaFin) : "—"}</td>
                    <td>
                      <span className={`fin-pill ${g.activo ? "active" : "inactive"}`}>
                        {g.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="fin-actions">
                      <button onClick={() => openEditar(g)} title="Editar">✏️</button>
                      <button onClick={() => handleBorrar(g)} title="Borrar">🗑️</button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                    No hay gastos fijos registrados. Crea el primero.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* === Modal CRUD === */}
      {showModal && (
        <div className="fin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="fin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "Editar gasto fijo" : "Nuevo gasto fijo"}</h3>
            <form onSubmit={handleSubmit} className="fin-form">
              <label>
                Nombre
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Alquiler local"
                />
              </label>

              <div className="fin-form-row">
                <label>
                  Categoría
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  >
                    {CATEGORIAS_GASTO.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Periodicidad
                  <select
                    value={form.periodicidad}
                    onChange={(e) => setForm({ ...form, periodicidad: e.target.value })}
                  >
                    <option value="mensual">Mensual</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </label>
              </div>

              <div className="fin-form-row">
                <label>
                  Importe (sin IVA) €
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.importe}
                    onChange={(e) => setForm({ ...form, importe: e.target.value })}
                    placeholder="850.00"
                  />
                </label>

                <label>
                  IVA %
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={form.iva}
                    onChange={(e) => setForm({ ...form, iva: e.target.value })}
                  />
                </label>
              </div>

              <div className="fin-form-row">
                <label>
                  Fecha inicio
                  <input
                    type="date"
                    required
                    value={form.fechaInicio}
                    onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                  />
                </label>

                <label>
                  Fecha fin (opcional)
                  <input
                    type="date"
                    value={form.fechaFin}
                    onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                  />
                </label>
              </div>

              <label>
                Notas
                <textarea
                  rows="2"
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  placeholder="Detalles adicionales (opcional)"
                />
              </label>

              {formError && <div className="fin-error">{formError}</div>}

              <div className="fin-form-actions">
                <button type="button" className="fin-btn-ghost" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="fin-btn-primary" disabled={submitting}>
                  {submitting ? "Guardando…" : editing ? "Guardar cambios" : "Crear gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
