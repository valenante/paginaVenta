import React, { useEffect, useMemo, useState } from "react";
import ModalBase from "./ModalBase";
import api from "../../utils/api";
import "./ModalEliminarMesa.css";

export default function ModalEliminarMesa({ open, onClose, mesas = [], onDeleted }) {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ("");
    setSelectedId("");
    setConfirm("");
    setErr("");
    setLoading(false);
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return mesas;
    return mesas.filter(
      (m) =>
        String(m.numero).includes(s) ||
        String(m.zona || "").toLowerCase().includes(s)
    );
  }, [q, mesas]);

  const selected = useMemo(
    () => mesas.find((m) => m._id === selectedId),
    [mesas, selectedId]
  );

  const canDelete = !!selected && confirm.trim() === String(selected.numero);

  const doDelete = async () => {
    if (!selected || loading) return;

    setErr("");
    setLoading(true);
    try {
      await api.delete(`/mesas/id/${selected._id}`);
      onDeleted?.();
      onClose?.();
    } catch (error) {
      const code = error?.response?.data?.error || "ERROR_ELIMINAR_MESA";
      setErr(code);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="alefForm-actions">
      <button
        type="button"
        className="alefBtn ghost"
        onClick={onClose}
        disabled={loading}
      >
        Cancelar
      </button>

      <button
        type="button"
        className="alefBtn danger"
        onClick={doDelete}
        disabled={!canDelete || loading}
      >
        {loading ? "Eliminando..." : "Eliminar definitivamente"}
      </button>
    </div>
  );

  return (
    <ModalBase
      open={open}
      title="Eliminar mesa"
      subtitle="Acción irreversible. Solo se recomienda si la mesa ya no se usa."
      onClose={onClose}
      footer={footer}
      width={720}
    >
      <div className="alefForm">
        <div className="alefForm-grid">
          <label className="alefField">
            <span className="alefField-label">Buscar (número o zona)</span>
            <input
              className="alefField-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej: 12 / interior"
            />
          </label>

          <label className="alefField">
            <span className="alefField-label">Selecciona mesa</span>
            <select
              className="alefField-input"
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setConfirm("");
                setErr("");
              }}
            >
              <option value="">-- Selecciona --</option>
              {filtered.map((m) => (
                <option key={m._id} value={m._id}>
                  Mesa {m.numero} · {m.zona}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selected && (
          <div className="dangerZone">
            <div className="dangerZone-top">
              <div className="pill">IRREVERSIBLE</div>
              <div className="dangerZone-title">
                Confirma la eliminación de la mesa <b>{selected.numero}</b>
              </div>
            </div>

            <div className="alefHint">
              Para confirmar, escribe el número <b>{selected.numero}</b> en el campo.
            </div>

            <label className="alefField">
              <span className="alefField-label">Confirmación</span>
              <input
                className="alefField-input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={`Escribe ${selected.numero}`}
              />
            </label>
          </div>
        )}

        {err && <div className="alefError">Error: {err}</div>}
      </div>
    </ModalBase>
  );
}
