import { useState } from "react";
import api from "../../utils/api";
import AlertaMensaje from "../AlertaMensaje/AlertaMensaje";
import "./ModalConfigPromocion.css";

export default function ModalConfigPromocion({ producto, onClose, onSaved }) {
  const [form, setForm] = useState({
    activa: true,
    tipo: producto.promocion?.tipo || "mensaje",
    precioPromocional: producto.promocion?.precioPromocional || "",
    descuentoPorcentaje: producto.promocion?.descuentoPorcentaje || "",
    mensaje: producto.promocion?.mensaje || "",
    desde: producto.promocion?.desde?.slice(0, 10) || "",
    hasta: producto.promocion?.hasta?.slice(0, 10) || "",
  });

  const [saving, setSaving] = useState(false);
  const [alerta, setAlerta] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const guardarPromocion = async () => {
    try {
      setSaving(true);

      const { data } = await api.put(
        `/productos/${producto._id}/promocion`,
        form
      );

      onSaved(data);
    } catch (err) {
      console.error(err);
      setAlerta({
        tipo: "error",
        mensaje: "Error guardando la promoción",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal card modal-promocion">
        <header className="modal-header">
          <h3>Configurar promoción</h3>
          <button onClick={onClose}>✕</button>
        </header>

        <div className="modal-body">
          <label>Tipo de promoción</label>
          <select name="tipo" value={form.tipo} onChange={handleChange}>
            <option value="mensaje">Mensaje</option>
            <option value="precio">Precio fijo</option>
            <option value="porcentaje">Descuento %</option>
            <option value="happy_hour">Happy Hour</option>
          </select>

          {form.tipo === "precio" && (
            <input
              name="precioPromocional"
              type="number"
              placeholder="Precio promocional"
              value={form.precioPromocional}
              onChange={handleChange}
            />
          )}

          {form.tipo === "porcentaje" && (
            <input
              name="descuentoPorcentaje"
              type="number"
              placeholder="% descuento"
              value={form.descuentoPorcentaje}
              onChange={handleChange}
            />
          )}

          <textarea
            name="mensaje"
            placeholder="Texto promocional"
            value={form.mensaje}
            onChange={handleChange}
          />

          <div className="row">
            <input
              type="date"
              name="desde"
              value={form.desde}
              onChange={handleChange}
            />
            <input
              type="date"
              name="hasta"
              value={form.hasta}
              onChange={handleChange}
            />
          </div>
        </div>

        <footer className="modal-actions">
          <button className="btn btn-secundario" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primario "
            onClick={guardarPromocion}
            disabled={saving}
          >
            Guardar promoción
          </button>
        </footer>

        {alerta && (
          <AlertaMensaje {...alerta} onClose={() => setAlerta(null)} />
        )}
      </div>
    </div>
  );
}
