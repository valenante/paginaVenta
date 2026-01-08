import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/Soporte.css";

export default function SoporteNuevo() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        asunto: "",
        descripcion: "",
        prioridad: "media"
    });

    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const enviar = async (e) => {
        e.preventDefault();
        setEnviando(true);
        setError("");

        try {
            await api.post("/admin/tickets/cliente", form);
            navigate("/soporte");

        } catch (err) {
            setError(err.response?.data?.error || "Error al crear ticket");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="soporte-contenedor">
            <h1>Nuevo ticket</h1>

            <form className="soporte-form" onSubmit={enviar}>

                <label>Asunto:</label>
                <input
                    type="text"
                    name="asunto"
                    value={form.asunto}
                    onChange={handleChange}
                    required
                />

                <label>Descripción:</label>
                <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    required
                />

                <label>Prioridad:</label>
                <select
                    name="prioridad"
                    value={form.prioridad}
                    onChange={handleChange}
                >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                </select>

                {error && <p className="soporte-error">{error}</p>}

                <button className="btn-primario" disabled={enviando}>
                    {enviando ? "Enviando..." : "Crear ticket"}
                </button>
            </form>
        </div>
    );
}
