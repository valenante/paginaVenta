// src/pages/StockShopPage.jsx
import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useToast } from "../context/ToastContext";
import AjustarStockShopModal from "../components/ShopStock/AjustarStockShopModal";
import CrearProductoShopModal from "../components/ShopStock/CrearItemStockShopModal";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import "../styles/StockPage.css";

const ITEMS_PER_PAGE = 12;

const StockShopPage = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [productos, setProductos] = useState([]);
    const [error, setError] = useState("");
    const [modal, setModal] = useState(null);

    // 🔎 Buscador
    const [search, setSearch] = useState("");

    // 📄 Paginación
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    /* =====================================================
       📦 CARGAR STOCK SHOP
    ===================================================== */
    const fetchStock = async () => {
        try {
            setLoading(true);

            const { data } = await api.get("/shop/stock/productos", {
                params: {
                    page,
                    limit: ITEMS_PER_PAGE,
                    search,
                },
            });

            setProductos(data.productos || []);
            setTotalPages(data.totalPages || 1);
            setError("");
        } catch (err) {
            console.error(err);
            setError("⚠ No se pudo cargar el stock de productos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
    }, [page, search]);

    /* =====================================================
       🚦 ESTADO STOCK
    ===================================================== */
    const getEstado = (p) => {
        const stock = p.inventario?.stock ?? 0;
        const minimo = p.inventario?.stockMinimo ?? 0;
        const critico = p.inventario?.stockCritico ?? null;

        if (critico != null && stock <= critico) return "critico";
        if (stock <= minimo) return "bajo";
        return "ok";
    };

    /* =====================================================
       🗑 ELIMINAR PRODUCTO
    ===================================================== */
    const eliminarProducto = async (id) => {
        try {
            await api.delete(`/shop/stock/producto/${id}`);
            fetchStock();
            setModal(null);
        } catch (err) {
            showToast("Error eliminando producto.", "error");
        }
    };

    return (
        <div className="stock-root">
            {/* ================= HEADER ================= */}
            <header className="stock-header">
                <div>
                    <h2>📦 Stock de productos</h2>
                    <p>Control de inventario de la tienda.</p>
                </div>

                <div className="stock-header-actions">
                    <button
                        className="btn-nuevo"
                        onClick={() => setModal({ type: "crear" })}
                    >
                        ➕ Nuevo producto
                    </button>

                    <input
                        className="stock-search"
                        placeholder="Buscar producto…"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </header>

            {/* ================= CONTENIDO ================= */}
            {loading ? (
                <div className="stock-loading">Cargando stock…</div>
            ) : error ? (
                <div className="stock-error">{error}</div>
            ) : (
                <div className="stock-grid">
                    {productos.map((prod) => {
                        const stock = prod.inventario?.stock ?? 0;
                        const max = prod.inventario?.stockMaximo ?? 0;
                        const unidad = prod.inventario?.unidadMedida || "ud";

                        const estado = getEstado(prod);

                        const porcentaje =
                            max > 0 ? Math.min(100, (stock / max) * 100) : 0;

                        return (
                            <div
                                key={prod._id}
                                className={`stock-card estado-${estado}`}
                            >
                                <button
                                    className="btn-eliminar-ingrediente"
                                    onClick={() =>
                                        setModal({ type: "eliminar", producto: prod })
                                    }
                                >
                                    ✖
                                </button>

                                <div className="stock-card-header">
                                    <span className="stock-name">{prod.nombre}</span>
                                    <span className={`estado-badge ${estado}`}>
                                        {estado === "ok" && "🟢 Óptimo"}
                                        {estado === "bajo" && "🟠 Bajo"}
                                        {estado === "critico" && "🔴 Crítico"}
                                    </span>
                                </div>

                                <div className="stock-bar">
                                    <div
                                        className="stock-bar-fill"
                                        style={{ width: `${porcentaje}%` }}
                                    />
                                </div>

                                <div className="stock-details">
                                    <strong>{stock} {unidad}</strong>
                                    <span className="max">máx: {max || "—"}</span>
                                </div>

                                <button
                                    className="btn-ajustar"
                                    onClick={() =>
                                        setModal({ type: "ajustar", producto: prod })
                                    }
                                >
                                    Ajustar stock
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ================= PAGINACIÓN ================= */}
            {totalPages > 1 && (
                <div className="stock-pagination">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        ◀ Anterior
                    </button>

                    <span>
                        Página {page} de {totalPages}
                    </span>

                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Siguiente ▶
                    </button>
                </div>
            )}

            {/* ================= MODALES ================= */}
            {modal?.type === "ajustar" && (
                <AjustarStockShopModal
                    producto={modal.producto}
                    onClose={() => setModal(null)}
                    onSave={fetchStock}
                />
            )}

            {modal?.type === "crear" && (
                <CrearProductoShopModal
                    onClose={() => setModal(null)}
                    onSave={fetchStock}
                />
            )}

            {modal?.type === "eliminar" && (
                <ModalConfirmacion
                    titulo="Eliminar producto"
                    mensaje={`¿Seguro que deseas eliminar "${modal.producto.nombre}"?`}
                    onConfirm={() => eliminarProducto(modal.producto._id)}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    );
};

export default StockShopPage;
