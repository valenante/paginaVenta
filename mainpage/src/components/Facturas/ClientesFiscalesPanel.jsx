// src/components/Facturas/ClientesFiscalesPanel.jsx
// Panel CRUD de clientes fiscales — datos guardados automáticamente al emitir factura nominativa.

import React, { useCallback, useEffect, useState } from "react";
import api from "../../utils/api";
import "./ClientesFiscalesPanel.css";

export default function ClientesFiscalesPanel() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { _id, nif, nombre, direccion }
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/clientesfiscales/todos", {
        params: { q: search || undefined, page, limit: 25 },
      });
      setItems(data?.items || []);
      setTotal(data?.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Eliminar el registro fiscal de "${nombre}"?`)) return;
    try {
      await api.delete(`/clientesfiscales/${id}`);
      setMsg({ t: "ok", m: "Registro eliminado." });
      fetchData();
    } catch {
      setMsg({ t: "error", m: "Error al eliminar." });
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/clientesfiscales/${editing._id}`, {
        nif: editing.nif,
        nombre: editing.nombre,
        direccion: editing.direccion,
      });
      setMsg({ t: "ok", m: "Registro actualizado." });
      setEditing(null);
      fetchData();
    } catch {
      setMsg({ t: "error", m: "Error al guardar." });
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / 25) || 1;

  return (
    <div className="cf-panel">
      <div className="cf-header">
        <div>
          <h3 className="cf-title">Registros fiscales</h3>
          <p className="cf-subtitle">Datos de clientes guardados al emitir factura nominativa. Se sugieren automáticamente.</p>
        </div>
        <span className="cf-count">{total} registros</span>
      </div>

      {msg && (
        <div className={`cf-msg cf-msg--${msg.t}`}>
          {msg.m}
          <button onClick={() => setMsg(null)}>✕</button>
        </div>
      )}

      <input
        className="cf-search"
        type="text"
        placeholder="Buscar por NIF o nombre..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Modal editar */}
      {editing && (
        <div className="cf-edit-overlay">
          <div className="cf-edit-card">
            <h4>Editar registro fiscal</h4>
            <label>NIF / CIF</label>
            <input value={editing.nif} onChange={(e) => setEditing({ ...editing, nif: e.target.value })} />
            <label>Nombre / Razón social</label>
            <input value={editing.nombre} onChange={(e) => setEditing({ ...editing, nombre: e.target.value })} />
            <label>Dirección</label>
            <input value={editing.direccion || ""} onChange={(e) => setEditing({ ...editing, direccion: e.target.value })} />
            <div className="cf-edit-actions">
              <button className="cf-btn cf-btn--secondary" onClick={() => setEditing(null)} disabled={saving}>Cancelar</button>
              <button className="cf-btn cf-btn--primary" onClick={handleSaveEdit} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <p className="cf-loading">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="cf-empty">No hay registros fiscales{search ? ` para "${search}"` : ""}. Se crean automáticamente al emitir facturas nominativas.</p>
      ) : (
        <>
          <div className="cf-table">
            <div className="cf-table-head">
              <span>NIF / CIF</span>
              <span>Nombre</span>
              <span>Dirección</span>
              <span>Usos</span>
              <span>Último uso</span>
              <span>Acciones</span>
            </div>
            {items.map((c) => (
              <div key={c._id} className="cf-table-row">
                <span className="cf-nif">{c.nif}</span>
                <span className="cf-nombre">{c.nombre}</span>
                <span className="cf-dir">{c.direccion || "—"}</span>
                <span className="cf-usos">{c.usoCount || 1}</span>
                <span className="cf-fecha">{c.ultimoUso ? new Date(c.ultimoUso).toLocaleDateString("es-ES") : "—"}</span>
                <span className="cf-actions">
                  <button className="cf-btn-sm" onClick={() => setEditing({ _id: c._id, nif: c.nif, nombre: c.nombre, direccion: c.direccion || "" })} title="Editar">✏️</button>
                  <button className="cf-btn-sm cf-btn-sm--danger" onClick={() => handleDelete(c._id, c.nombre)} title="Eliminar">🗑️</button>
                </span>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="cf-pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Anterior</button>
              <span>Página {page} de {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Siguiente →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
