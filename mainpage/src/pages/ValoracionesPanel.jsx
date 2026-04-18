// src/pages/ValoracionesPanel.jsx
import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useFeaturesPlan } from "../context/FeaturesPlanContext";
import UpsellValoraciones from "../components/Valoraciones/UpsellValoraciones"; // 👈 NUEVO
import "../styles/ValoracionesPanel.css";

const PAGE_SIZE = 10;

const formatearFecha = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Stars = ({ value }) => {
  const val = Number(value || 0);
  const rounded = Math.round(val * 2) / 2;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= rounded) stars.push("★");
    else if (i - 0.5 === rounded) stars.push("☆");
    else stars.push("☆");
  }
  return <span className="valoraciones-stars">{stars.join(" ")}</span>;
};

export default function ValoracionesPanel() {
  const [resumen, setResumen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");
  const [orden, setOrden] = useState("relevancia");
  const [page, setPage] = useState(1);

  const [detalle, setDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [valoracionesDetalle, setValoracionesDetalle] = useState([]);

  // 🔐 Feature gate
  const { user } = useAuth();
  const { hasFeature } = useFeaturesPlan();
  const isPlanEsencial = !hasFeature("carta_valoraciones");

  // ========= MÉTRICAS GLOBALES =========
  const totalValoraciones = resumen.reduce(
    (acc, p) => acc + (p.totalValoraciones || 0),
    0
  );

  const mediaGlobal =
    totalValoraciones > 0
      ? (
        resumen.reduce(
          (acc, p) => acc + (p.avgPuntuacion || 0) * (p.totalValoraciones || 0),
          0
        ) / totalValoraciones
      ).toFixed(2)
      : 0;

  const mejorProducto =
    resumen.length > 0
      ? [...resumen]
        .filter((p) => p.totalValoraciones > 0)
        .sort((a, b) => (b.avgPuntuacion || 0) - (a.avgPuntuacion || 0))[0] ||
      null
      : null;

  const peorProducto =
    resumen.length > 0
      ? [...resumen]
        .filter((p) => p.totalValoraciones > 0)
        .sort((a, b) => (a.avgPuntuacion || 0) - (b.avgPuntuacion || 0))[0] ||
      null
      : null;

  // ========= CARGA RESUMEN =========
  const cargarResumen = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/valoraciones/mas-valorados");
      const items = Array.isArray(data?.items) ? data.items : [];
      setResumen(items);
      setPage(1); // reset de página al recargar
    } catch (err) {
      console.error("❌ Error cargando resumen de valoraciones:", err);
      setError("No se pudieron cargar las valoraciones.");
    } finally {
      setLoading(false);
    }
  };

  // Sólo cargo datos si NO es plan esencial
  useEffect(() => {
    if (!isPlanEsencial) {
      cargarResumen();
    } else {
      setLoading(false);
    }
  }, [isPlanEsencial]);

  // ========= CARGA DETALLE DE UN PRODUCTO =========
  const cargarDetalle = async (producto) => {
    setDetalle(producto);
    setDetalleLoading(true);
    setValoracionesDetalle([]);

    try {
      const { data } = await api.get(
        `/valoraciones/producto/${producto.productoId}`
      );
      const arr = Array.isArray(data?.valoraciones) ? data.valoraciones : [];
      setValoracionesDetalle(arr);
    } catch (err) {
      console.error("❌ Error cargando detalle de valoraciones:", err);
    } finally {
      setDetalleLoading(false);
    }
  };

  // ========= FILTRADO POR TEXTO =========
  const listaFiltrada = resumen.filter((p) => {
    if (!filtro.trim()) return true;
    const q = filtro.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q) ||
      (p.categoria || "").toLowerCase().includes(q)
    );
  });

  // ========= ORDENACIÓN =========
  const listaOrdenada = [...listaFiltrada].sort((a, b) => {
    const aMedia = a.avgPuntuacion || 0;
    const bMedia = b.avgPuntuacion || 0;
    const aTotal = a.totalValoraciones || 0;
    const bTotal = b.totalValoraciones || 0;

    switch (orden) {
      case "mejor":
        return bMedia - aMedia || bTotal - aTotal;
      case "peor":
        return aMedia - bMedia || aTotal - bTotal;
      case "mas-opiniones":
        return bTotal - aTotal || bMedia - aMedia;
      case "menos-opiniones":
        return aTotal - bTotal || aMedia - bMedia;
      case "nombre":
        return a.nombre.localeCompare(b.nombre, "es");
      case "relevancia":
      default:
        const scoreA = aMedia * aTotal;
        const scoreB = bMedia * bTotal;
        return scoreB - scoreA;
    }
  });

  // Reset de página al cambiar filtro u orden
  useEffect(() => {
    setPage(1);
  }, [filtro, orden]);

  // ========= PAGINACIÓN =========
  const totalPages =
    listaOrdenada.length === 0
      ? 1
      : Math.ceil(listaOrdenada.length / PAGE_SIZE);

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const itemsPagina = listaOrdenada.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  return (
    <div className="valoraciones-root">
      {/* HEADER */}
      <header className="valoraciones-header">
        <div>
          <h2>⭐ Valoraciones de los clientes</h2>
          <p>
            Revisa qué platos encantan a tus clientes y cuáles necesitan
            revisión, basado en sus valoraciones reales.
          </p>
        </div>

        {!isPlanEsencial && (
          <div className="valoraciones-header-actions">
            <input
              type="search"
              placeholder="Buscar por nombre o categoría…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />

            <select
              className="valoraciones-sort-select"
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
            >
              <option value="relevancia">Ordenar por relevancia</option>
              <option value="mejor">Mejor valorados</option>
              <option value="peor">Peor valorados</option>
              <option value="mas-opiniones">Más opiniones</option>
              <option value="menos-opiniones">Menos opiniones</option>
              <option value="nombre">Nombre A-Z</option>
            </select>

            <button onClick={cargarResumen}>Actualizar</button>
          </div>
        )}
      </header>

      <section className="valoraciones-info">
        <div className="valoraciones-info-card">
          <h4>¿Cómo se generan estas valoraciones?</h4>

          <p>
            Las valoraciones las dejan los clientes desde la <b>Carta QR</b>.
            Cuando un cliente <b>pide la cuenta</b>, el sistema le muestra un botón para
            valorar <b>solo los productos que pidió en esa mesa</b> (estrellas y comentario opcional).
          </p>

          <p className="valoraciones-info-muted">
            Puedes decidir si estas valoraciones se muestran o no en la Carta QR.
            Ve a <b>Dashboard → Datos del restaurante</b> y activa/desactiva la opción de{" "}
            <b>“Mostrar valoraciones”</b>.
          </p>
        </div>
      </section>

      {/* 🔒 SI ESENCIAL → SOLO UPSELL */}
      {isPlanEsencial ? (
        <div className="valoraciones-upsell-wrapper">
          <UpsellValoraciones />
        </div>
      ) : (
        <>
          {/* KPI */}
          <section className="valoraciones-kpi">
            <div className="valoraciones-kpi-card">
              <span>Total valoraciones</span>
              <strong>{totalValoraciones}</strong>
            </div>

            <div className="valoraciones-kpi-card">
              <span>Media global</span>
              <div className="valoraciones-kpi-media">
                <strong>{mediaGlobal}</strong>
                <Stars value={mediaGlobal} />
              </div>
            </div>

            {mejorProducto && (
              <div className="valoraciones-kpi-card highlight">
                <span>Producto mejor valorado</span>
                <strong>{mejorProducto.nombre}</strong>
                <small>
                  {mejorProducto.avgPuntuacion.toFixed(2)} ★ (
                  {mejorProducto.totalValoraciones} valoraciones)
                </small>
              </div>
            )}

            {peorProducto && (
              <div className="valoraciones-kpi-card worst">
                <span>Producto peor valorado</span>
                <strong>{peorProducto.nombre}</strong>
                <small>
                  {peorProducto.avgPuntuacion.toFixed(2)} ★ (
                  {peorProducto.totalValoraciones} valoraciones)
                </small>
              </div>
            )}
          </section>

          {/* LISTA / TABLA */}
          <section className="valoraciones-table-section">
            {loading ? (
              <div className="valoraciones-loading">Cargando valoraciones…</div>
            ) : error ? (
              <div className="valoraciones-error">{error}</div>
            ) : listaOrdenada.length === 0 ? (
              <div className="valoraciones-empty">
                No hay valoraciones registradas todavía.
              </div>
            ) : (
              <>
                <div className="valoraciones-table-wrapper">
                  <table className="valoraciones-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Tipo</th>
                        <th className="center">Media</th>
                        <th className="center">Nº valoraciones</th>
                        <th>Última valoración</th>
                        <th></th>
                      </tr>
                    </thead>

                    <tbody>
                      {itemsPagina.map((p) => (
                        <tr key={p.productoId}>
                          <td className="producto-cell">
                            <div>
                              <strong>{p.nombre}</strong>
                            </div>
                          </td>
                          <td>{p.categoria || "-"}</td>
                          <td>{p.tipo || "-"}</td>
                          <td className="center">
                            {p.totalValoraciones > 0 ? (
                              <span>{p.avgPuntuacion.toFixed(2)} ★</span>
                            ) : (
                              <span className="sin-valoraciones">
                                Sin valoraciones
                              </span>
                            )}
                          </td>
                          <td className="center">{p.totalValoraciones}</td>
                          <td>{formatearFecha(p.ultimaFecha)}</td>
                          <td className="center">
                            <button
                              className="btn-detalle-valoraciones"
                              onClick={() => cargarDetalle(p)}
                              disabled={p.totalValoraciones === 0}
                            >
                              Ver opiniones
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAGINACIÓN */}
                <div className="valoraciones-pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() =>
                      setPage((prev) => Math.max(1, prev - 1))
                    }
                  >
                    ◀ Anterior
                  </button>

                  <span>
                    Página {currentPage} de {totalPages}
                  </span>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                  >
                    Siguiente ▶
                  </button>
                </div>
              </>
            )}
          </section>

          {/* DETALLE */}
          {detalle && (
            <div
              className="valoraciones-detalle-overlay"
              onClick={() => setDetalle(null)}
            >
              <div
                className="valoraciones-detalle-panel"
                onClick={(e) => e.stopPropagation()}
              >
                <header className="detalle-header">
                  <div>
                    <h3>{detalle.nombre}</h3>
                    <p>
                      {detalle.categoria} · {detalle.tipo}
                    </p>
                  </div>
                  <button
                    className="detalle-close-btn"
                    onClick={() => setDetalle(null)}
                  >
                    ✕
                  </button>
                </header>

                {detalleLoading ? (
                  <div className="valoraciones-loading">
                    Cargando opiniones…
                  </div>
                ) : valoracionesDetalle.length === 0 ? (
                  <p className="valoraciones-empty">
                    Este producto no tiene opiniones.
                  </p>
                ) : (
                  <ul className="detalle-lista">
                    {valoracionesDetalle.map((v) => (
                      <li key={v._id} className="detalle-item">
                        <div className="detalle-top">
                          <Stars value={v.puntuacion} />
                          <span className="detalle-fecha">
                            {formatearFecha(v.fecha)}
                          </span>
                        </div>
                        {v.comentario ? (
                          <p className="detalle-comentario">{v.comentario}</p>
                        ) : (
                          <p className="detalle-comentario sin-comentario">
                            (Sin comentario escrito)
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
