import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import AlefSelect from "../AlefSelect/AlefSelect";
import "./RecetasEditor.css";

export default function RecetaEditor({ producto }) {
    const [ingredientes, setIngredientes] = useState([]);
    const [receta, setReceta] = useState([]);
    const [nuevoIng, setNuevoIng] = useState("");
    const [cantidad, setCantidad] = useState("");

    /* ============================
       Cargar ingredientes del stock
       ============================ */
    const fetchIngredientes = async () => {
        try {
            const { data } = await api.get("/stock/ingredientes");
            setIngredientes(data.ingredientes || []);
        } catch (err) {
            console.error("Error cargando ingredientes", err);
        }
    };

    /* ============================
       Cargar receta del producto
       ============================ */
    const fetchReceta = async () => {
        try {
            const { data } = await api.get(`/recetas/${producto._id}/receta`);
            setReceta(data.receta || []);
        } catch (err) {
            console.error("Error cargando receta", err);
        }
    };

    /* ============================
       Agregar ingrediente a la receta
       ============================ */
    const agregarIngrediente = async () => {
        if (!nuevoIng || !cantidad) return;

        try {
            await api.post(`/recetas/${producto._id}/receta`, {
                ingredienteId: nuevoIng,
                cantidad: Number(cantidad),
            });

            setNuevoIng("");
            setCantidad("");
            fetchReceta();
        } catch (err) {
            console.error("Error agregando ingrediente", err);
        }
    };

    /* ============================
       Eliminar ingrediente
       ============================ */
    const eliminarIngrediente = async (id) => {
        try {
            await api.delete(`/recetas/${producto._id}/receta/${id}`);
            fetchReceta();
        } catch (err) {
            console.error("Error eliminando ingrediente", err);
        }
    };

    /* ============================
       Cargar datos iniciales
       ============================ */
    useEffect(() => {
        fetchIngredientes();
        fetchReceta();
    }, [producto]);

    return (
        <div className="receta-editor-pro">
            <h4 className="receta-editor-title">
                Ingredientes del producto
            </h4>

            {/* ============================
          LISTA DE INGREDIENTES ACTUALES
          ============================ */}
            <div className="receta-lineas">
                {receta.length === 0 && (
                    <p className="receta-vacia">Este producto no tiene receta aún.</p>
                )}

                {receta.map((r) => (
                    <div key={r._id} className="receta-item-line">
                        <div className="receta-info">
                            <span className="receta-nombre">{r.ingrediente.nombre}</span>
                            <strong className="receta-cantidad">
                                {r.cantidad}
                                {r.ingrediente.unidad}
                            </strong>
                        </div>

                        <button
                            className="receta-delete-btn"
                            onClick={() => eliminarIngrediente(r.ingrediente._id)}
                        >
                            ✖
                        </button>
                    </div>
                ))}
            </div>

            <hr className="receta-separador" />

            {/* ============================
          AGREGAR NUEVO INGREDIENTE
          ============================ */}
            <h4 className="receta-editor-subtitle">Añadir ingrediente</h4>

            <AlefSelect
                label="Ingrediente"
                value={nuevoIng}
                options={ingredientes.map((i) => ({
                    value: i._id,
                    label: i.nombre,
                }))}
                onChange={setNuevoIng}
                placeholder="Selecciona ingrediente"
            />

            <label className="receta-label">
                Cantidad
                <input
                    className="receta-input"
                    type="number"
                    min="0"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                />
            </label>

            <button className="receta-add-btn" onClick={agregarIngrediente}>
                ➕ Agregar a la receta
            </button>
        </div>
    );
}
