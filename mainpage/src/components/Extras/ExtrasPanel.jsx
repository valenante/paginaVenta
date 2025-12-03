import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import "./ExtrasPanel.css";
import ModalConfirmacion from "../Modal/ModalConfirmacion"; // ajusta la ruta si es necesario

const ExtrasPanel = ({ onBack }) => {
  const [extras, setExtras] = useState([]);
  const [nuevoExtra, setNuevoExtra] = useState({ nombre: "", precio: "" });
  const [editandoId, setEditandoId] = useState(null);
  const [editValues, setEditValues] = useState({ nombre: "", precio: "" });
  const [mostrarModal, setMostrarModal] = useState(false);
  const [extraAEliminar, setExtraAEliminar] = useState(null);

  const fetchExtras = async () => {
    try {
      const res = await api.get("/extras");
      setExtras(res.data);
    } catch (error) {
      console.error("Error al cargar extras", error);
    }
  };

  useEffect(() => {
    fetchExtras();
  }, []);

  const handleCrearExtra = async () => {
    try {
      if (!nuevoExtra.nombre || !nuevoExtra.precio) return;
      await api.post("/extras", {
        nombre: nuevoExtra.nombre,
        precio: parseFloat(nuevoExtra.precio),
      });
      setNuevoExtra({ nombre: "", precio: "" });
      fetchExtras();
    } catch (error) {
      console.error("Error al crear extra", error);
    }
  };

  const confirmarEliminar = (extra) => {
    setExtraAEliminar(extra);
    setMostrarModal(true);
  };

  const ejecutarEliminacion = async () => {
    if (!extraAEliminar) return;
    try {
      await api.delete(`/extras/${extraAEliminar._id}`);
      fetchExtras();
      setMostrarModal(false);
      setExtraAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar extra", error);
    }
  };

  const iniciarEdicion = (extra) => {
    setEditandoId(extra._id);
    setEditValues({ nombre: extra.nombre, precio: extra.precio });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditValues({ nombre: "", precio: "" });
  };

  const guardarEdicion = async () => {
    try {
      await api.put(`/extras/${editandoId}`, {
        nombre: editValues.nombre,
        precio: parseFloat(editValues.precio),
      });
      cancelarEdicion();
      fetchExtras();
    } catch (error) {
      console.error("Error al guardar edición", error);
    }
  };
  return (
    <div className="extras-panel">
      <div className="extras-panel-header">
        <h2>Extras disponibles</h2>
        <button onClick={onBack} className="btn-gris btn-volver-extras">
          Volver
        </button>
      </div>

      <ul>
        {extras.map((extra) => (
          <li key={extra._id}>
            {editandoId === extra._id ? (
              <>
                <input
                  type="text"
                  value={editValues.nombre}
                  onChange={(e) =>
                    setEditValues({ ...editValues, nombre: e.target.value })
                  }
                />
                <input
                  type="number"
                  step="0.01"
                  value={editValues.precio}
                  onChange={(e) =>
                    setEditValues({ ...editValues, precio: e.target.value })
                  }
                />
                <div className="extras-acciones">
                  <button
                    className="btn-verde"
                    type="button"
                    onClick={guardarEdicion}
                  >
                    Guardar
                  </button>
                  <button
                    className="btn-gris"
                    type="button"
                    onClick={cancelarEdicion}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="extra-info">
                  {extra.nombre} - {extra.precio.toFixed(2)} €
                </span>
                <div className="extras-acciones">
                  <button
                    className="btn-gris"
                    type="button"
                    onClick={() => iniciarEdicion(extra)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-rojo"
                    type="button"
                    onClick={() => confirmarEliminar(extra)}
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="crear-extra">
        <h3>Crear nuevo extra</h3>
        <input
          type="text"
          placeholder="Nombre"
          value={nuevoExtra.nombre}
          onChange={(e) =>
            setNuevoExtra({ ...nuevoExtra, nombre: e.target.value })
          }
        />
        <input
          type="number"
          step="0.01"
          placeholder="Precio"
          value={nuevoExtra.precio}
          onChange={(e) =>
            setNuevoExtra({ ...nuevoExtra, precio: e.target.value })
          }
        />
        <button
          type="button"
          className="btn-verde"
          onClick={handleCrearExtra}
        >
          Crear
        </button>
      </div>

      {mostrarModal && (
        <ModalConfirmacion
          titulo="Eliminar extra"
          mensaje={`¿Seguro que deseas eliminar "${extraAEliminar.nombre}"?`}
          onConfirm={ejecutarEliminacion}
          onClose={() => setMostrarModal(false)}
        />
      )}
    </div>
  );
};

export default ExtrasPanel;
