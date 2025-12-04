// src/pages/StockPage.jsx
import React, { useEffect, useState } from "react";
import api from "../utils/api";
import AjustarStockModal from "../components/Stock/AjustarStockModal";
import CrearIngredienteModal from "../components/Stock/CrearIngredienteModal";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import "../styles/StockPage.css";

const StockPage = () => {
    const [loading, setLoading] = useState(true);
    const [ingredientes, setIngredientes] = useState([]);
    const [error, setError] = useState("");
    const [modal, setModal] = useState(null);
    // 🔎 Buscador
    const [search, setSearch] = useState("");

    // 📄 Paginación
    const ITEMS_PER_PAGE = 12;
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchStock = async () => {
        try {
            const { data } = await api.get("/stock/ingredientes", {
                params: {
                    page,
                    limit: ITEMS_PER_PAGE,
                    search,
                },
            });

            setIngredientes(data.ingredientes || []);
            setTotalPages(data.totalPages);
        } catch (err) {
            setError("⚠ No se pudo cargar el stock.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
    }, [page, search]);


    const getEstado = (it) => {
        if (it.stockActual <= it.stockCritico) return "critico";
        if (it.stockActual <= it.stockMinimo) return "bajo";
        return "ok";
    };

    /** ================
     * ELIMINAR INGREDIENTE
     * ================ */
    const eliminarIngrediente = async (id) => {
        try {
            await api.delete(`/stock/ingrediente/${id}`);
            fetchStock();
            setModal(null);
        } catch (err) {
            alert("Error eliminando ingrediente.");
        }
    };

    return (
        <div className="stock-root">
            <header className="stock-header">
                <div>
                    <h2>📦 Gestión de Stock</h2>
                    <p>Control centralizado de ingredientes, mínimos y alertas.</p>
                </div>

                <div className="stock-header-actions">
                    <button
                        className="btn-nuevo"
                        onClick={() => setModal({ type: "crear" })}
                    >
                        ➕ Nuevo ingrediente
                    </button>

                    <input
                        className="stock-search"
                        placeholder="Buscar ingrediente…"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </header>

            {loading ? (
                <div className="stock-loading">Cargando stock…</div>
            ) : error ? (
                <div className="stock-error">{error}</div>
            ) : (
                <div className="stock-grid">
                    {ingredientes.map((ing) => {
                        const estado = getEstado(ing);
                        const porcentaje = Math.min(
                            100,
                            Math.max(0, (ing.stockActual / ing.stockMax) * 100)
                        );

                        return (
                            <div key={ing._id} className={`stock-card estado-${estado}`}>

                                {/* --- Botón eliminar --- */}
                                <button
                                    className="btn-eliminar-ingrediente"
                                    onClick={() => setModal({ type: "eliminar", ingrediente: ing })}
                                >
                                    ✖
                                </button>

                                <div className="stock-card-header">
                                    <span className="stock-name">{ing.nombre}</span>
                                    <span className={`estado-badge ${estado}`}>
                                        {estado === "ok" && "🟢 Óptimo"}
                                        {estado === "bajo" && "🟠 Bajo"}
                                        {estado === "critico" && "🔴 Crítico"}
                                    </span>
                                </div>

                                <div className="stock-bar" title={`${porcentaje.toFixed(0)}%`}>
                                    <div className="stock-bar-fill" style={{ width: `${porcentaje}%` }} />
                                </div>

                                <div className="stock-details">
                                    <strong>{ing.stockActual}{ing.unidad}</strong>
                                    <span className="max">máx: {ing.stockMax}{ing.unidad}</span>
                                </div>

                                <button className="btn-ajustar" onClick={() => setModal({ type: "ajustar", ingrediente: ing })}>
                                    Ajustar stock
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {totalPages > 1 && (
                <div className="stock-pagination">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        ◀ Anterior
                    </button>

                    <span>Página {page} de {totalPages}</span>

                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Siguiente ▶
                    </button>
                </div>
            )}

            {/* ========== Modales ========== */}

            {modal?.type === "ajustar" && (
                <AjustarStockModal
                    ingrediente={modal.ingrediente}
                    onClose={() => setModal(null)}
                    onSave={fetchStock}
                />
            )}

            {modal?.type === "crear" && (
                <CrearIngredienteModal
                    onClose={() => setModal(null)}
                    onSave={fetchStock}
                />
            )}

            {modal?.type === "eliminar" && (
                <ModalConfirmacion
                    titulo="Eliminar ingrediente"
                    mensaje={`¿Seguro que deseas eliminar "${modal.ingrediente.nombre}"? Esta acción no se puede deshacer.`}
                    onConfirm={() => eliminarIngrediente(modal.ingrediente._id)}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    );
};

export default StockPage;
