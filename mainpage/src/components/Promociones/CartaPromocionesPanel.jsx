import { useState, useEffect } from "react";
import api from "../../utils/api";
import AlertaMensaje from "../AlertaMensaje/AlertaMensaje";
import ModalConfigPromocion from "./ModalConfigPromocion";
import "./CartaPromocionesPanel.css";

export default function CartaPromocionesPanel({ abierto, onClose }) {
    const [promoTipo, setPromoTipo] = useState("plato");
    const [promoCategoria, setPromoCategoria] = useState("");
    const [promoProductos, setPromoProductos] = useState([]);
    const [promoLoading, setPromoLoading] = useState(false);
    const [productoPromo, setProductoPromo] = useState(null);
    const [alerta, setAlerta] = useState(null);

    /* ============================
       📦 Cargar productos
       ============================ */
    useEffect(() => {
        if (!abierto) return;

        const fetchProductos = async () => {
            try {
                setPromoLoading(true);
                setPromoCategoria("");

                const { data } = await api.get("/productos", {
                    params: { tipo: promoTipo },
                });

                setPromoProductos(data?.data || []);
            } catch (err) {
                console.error("❌ Error cargando productos:", err);
                setAlerta({
                    tipo: "error",
                    mensaje: "No se pudieron cargar los productos.",
                });
            } finally {
                setPromoLoading(false);
            }
        };

        fetchProductos();
    }, [abierto, promoTipo]);

    /* ============================
       🔁 Toggle estado
       ============================ */
    const handleToggleEstado = async (id, campo, valor) => {
        try {
            await api.put("/productos/toggle-estado", {
                id,
                campo, // destacado | promocionado
                valor,
            });

            setPromoProductos((prev) =>
                prev.map((p) =>
                    p._id === id ? { ...p, [campo]: valor } : p
                )
            );

            setAlerta({
                tipo: "exito",
                mensaje:
                    campo === "destacado"
                        ? "Producto destacado actualizado."
                        : "Promoción actualizada.",
            });
        } catch (err) {
            console.error("❌ Error toggle estado:", err);
            setAlerta({
                tipo: "error",
                mensaje: "No se pudo actualizar el producto.",
            });
        }
    };

    /* ============================
       🔍 Filtros
       ============================ */
    const productosPorTipo = promoProductos.filter((p) => {
        if (promoTipo === "bebida") return p.tipo === "bebida";
        if (promoTipo === "extra") return p.tipo === "extra";
        return p.tipo !== "bebida" && p.tipo !== "extra";
    });

    const categoriasDisponibles = Array.from(
        new Set(
            productosPorTipo
                .map((p) => p.categoria)
                .filter((c) => typeof c === "string" && c.trim() !== "")
        )
    );

    const productosFiltrados = productosPorTipo.filter((p) =>
        promoCategoria ? p.categoria === promoCategoria : true
    );

    const abrirModalPromocion = (producto) => {
        setProductoPromo(producto);
    };

    if (!abierto) return null;

    return (
        <div className="modal-overlay modal-overlay-promos">
            <div className="modal-promos card">
                <div className="modal-promos-header">
                    <div>
                        <h3>Productos destacados y en promoción</h3>
                        <p>
                            Marca productos como destacados o en promoción para resaltarlos en
                            la carta.
                        </p>
                    </div>
                    <button className="btn-icon" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="panel-promos">
                    {/* Tipos */}
                    <div className="promo-tipos">
                        {["plato", "bebida", "extra"].map((tipo) => (
                            <button
                                key={tipo}
                                className={`pill ${promoTipo === tipo ? "active" : ""}`}
                                onClick={() => setPromoTipo(tipo)}
                            >
                                {tipo === "plato"
                                    ? "Platos"
                                    : tipo === "bebida"
                                        ? "Bebidas"
                                        : "Extras"}
                            </button>
                        ))}
                    </div>

                    {/* Categorías */}
                    <div className="promo-categorias">
                        <label>Categoría</label>
                        <select
                            value={promoCategoria}
                            onChange={(e) => setPromoCategoria(e.target.value)}
                        >
                            <option value="">Todas</option>
                            {categoriasDisponibles.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Lista */}
                    <div className="promo-lista">
                        {promoLoading ? (
                            <p>Cargando productos...</p>
                        ) : productosFiltrados.length === 0 ? (
                            <p>No hay productos.</p>
                        ) : (
                            <ul>
                                {productosFiltrados.map((p) => (
                                    <li key={p._id} className="promo-item card-row">
                                        <span>
                                            {p.nombre} {p.categoria ? `(${p.categoria})` : ""}
                                        </span>

                                        <div className="promo-toggles">
                                            <label>
                                                Destacado
                                                <input
                                                    type="checkbox"
                                                    checked={p.destacado}
                                                    onChange={() =>
                                                        handleToggleEstado(
                                                            p._id,
                                                            "destacado",
                                                            !p.destacado
                                                        )
                                                    }
                                                />
                                            </label>

                                            <label>
                                                Promoción
                                                <input
                                                    type="checkbox"
                                                    checked={p.promocion?.activa}
                                                    onChange={() => abrirModalPromocion(p)}
                                                />
                                            </label>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {productoPromo && (
                <ModalConfigPromocion
                    producto={productoPromo}
                    onClose={() => setProductoPromo(null)}
                    onSaved={(productoActualizado) => {
                        setPromoProductos((prev) =>
                            prev.map((p) =>
                                p._id === productoActualizado._id ? productoActualizado : p
                            )
                        );
                        setProductoPromo(null);
                    }}
                />
            )}

            {alerta && (
                <AlertaMensaje
                    tipo={alerta.tipo}
                    mensaje={alerta.mensaje}
                    onClose={() => setAlerta(null)}
                />
            )}
        </div>
    );
}
