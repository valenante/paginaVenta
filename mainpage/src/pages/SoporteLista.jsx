import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import "../styles/Soporte.css";

export default function SoporteLista() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const cargarTickets = async ({
    estado = filtroEstado,
    prioridad = filtroPrioridad,
    search = busqueda,
    pageParam = page,
  } = {}) => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: pageParam,
        limit: 12,
      };

      if (estado && estado !== "todos") params.estado = estado;
      if (prioridad && prioridad !== "todas") params.prioridad = prioridad;
      if (search.trim()) params.search = search.trim();

      const res = await api.get("/tickets", { params });

      setTickets(res.data.tickets || []);
      setPages(res.data.meta?.pages || 1);
    } catch (err) {
      console.error("Error cargando tickets", err);
      setError(
        "No se pudieron cargar los tickets. Inténtalo de nuevo en unos segundos."
      );
    } finally {
      setLoading(false);
    }
  };

  // recargar al cambiar filtros
  useEffect(() => {
    setPage(1);
    setBusqueda("");
    cargarTickets({
      estado: filtroEstado,
      prioridad: filtroPrioridad,
      pageParam: 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, filtroPrioridad]);

  const handleBuscar = () => {
    setPage(1);
    cargarTickets({
      estado: filtroEstado,
      prioridad: filtroPrioridad,
      search: busqueda,
      pageParam: 1,
    });
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > pages) return;
    setPage(nuevaPagina);
    cargarTickets({
      estado: filtroEstado,
      prioridad: filtroPrioridad,
      search: busqueda,
      pageParam: nuevaPagina,
    });
  };

  const hayTickets = tickets.length > 0;

  return (
    <div className="soporte-contenedor">
      {/* HEADER */}
      <div className="soporte-header">
        <div>
          <h1>Soporte técnico</h1>
          <p className="soporte-subtitulo">
            Crea incidencias y habla con el equipo de soporte.
          </p>
        </div>

        <div className="soporte-header-acciones">
          <button
            type="button"
            className="btn-secundario"
            onClick={() =>
              cargarTickets({
                estado: filtroEstado,
                prioridad: filtroPrioridad,
                search: busqueda,
                pageParam: page,
              })
            }
          >
            Recargar
          </button>

          <Link to="/soporte/nuevo" className="btn-primario">
            Nuevo ticket
          </Link>
        </div>
      </div>

      {/* FILTROS */}
      <div className="soporte-filtros">
        <div className="soporte-filtro">
          <label>Estado</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="abierto">Abiertos</option>
            <option value="en_progreso">En progreso</option>
            <option value="cerrado">Cerrados</option>
          </select>
        </div>

        <div className="soporte-filtro">
          <label>Prioridad</label>
          <select
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
          >
            <option value="todas">Todas</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>

        <div className="soporte-filtro soporte-filtro-busqueda">
          <label>Buscar</label>
          <div className="soporte-search-wrapper">
            <input
              type="text"
              placeholder="Buscar por asunto…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
            />
            <button type="button" className="btn-buscar" onClick={handleBuscar}>
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* ESTADOS */}
      {loading && <p className="soporte-loading">Cargando tickets…</p>}

      {error && !loading && <p className="soporte-error">{error}</p>}

      {!loading && !error && !hayTickets && (
        <p className="soporte-vacio">
          No tienes tickets todavía. Crea tu primer ticket para contactar con
          soporte.
        </p>
      )}

      {/* LISTA */}
      {!loading && !error && hayTickets && (
        <>
          <div className="soporte-lista">
            {tickets.map((t) => (
              <Link
                to={`/soporte/${t._id}`}
                className="soporte-item"
                key={t._id}
              >
                <div className="soporte-item-main">
                  <h3>{t.asunto}</h3>
                  <p className="soporte-item-descripcion">
                    {t.descripcion?.slice(0, 140) || "Sin descripción"}
                    {t.descripcion && t.descripcion.length > 140 ? "…" : ""}
                  </p>
                </div>

                <div className="soporte-item-meta">
                  <div className="soporte-badges">
                    <span className={`badge-estado estado-${t.estado}`}>
                      {t.estado}
                    </span>
                    <span
                      className={`badge-prioridad prioridad-${t.prioridad}`}
                    >
                      {t.prioridad}
                    </span>
                  </div>
                  <small className="soporte-fecha">
                    {new Date(t.createdAt).toLocaleDateString()} •{" "}
                    {new Date(t.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </div>
              </Link>
            ))}
          </div>

          {/* PAGINACIÓN */}
          {pages > 1 && (
            <div className="soporte-paginacion">
              <button
                disabled={page === 1}
                onClick={() => cambiarPagina(page - 1)}
              >
                ← Anterior
              </button>
              <span>
                Página {page} de {pages}
              </span>
              <button
                disabled={page === pages}
                onClick={() => cambiarPagina(page + 1)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
