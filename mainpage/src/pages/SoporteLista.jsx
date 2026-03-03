// src/pages/SoporteLista.jsx ✅ PERFECTO (UX Errors PRO)
// - OK/avisos: AlertaMensaje (solo si quieres, aquí lo uso para “recargado”)
// - Errores backend: ErrorToast (normalizeApiError)
// - Sin console.error, sin strings legacy en catch
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import "../styles/Soporte.css";

import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import ErrorToast from "../components/common/ErrorToast.jsx";
import { normalizeApiError } from "../utils/normalizeApiError.js";

export default function SoporteLista() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // OK / avisos
  const [alerta, setAlerta] = useState(null);

  // KO contrato
  const [errorToast, setErrorToast] = useState(null);

  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const showOk = (msg) => setAlerta({ tipo: "exito", mensaje: msg });
  const showWarn = (msg) => setAlerta({ tipo: "warn", mensaje: msg });
  const showErr = (err, fallback = "No se pudo completar la operación.") => {
    const n = normalizeApiError(err);
    setErrorToast({ ...n, message: n?.message || fallback });
  };

  const cargarTickets = useCallback(
    async ({
      estado = filtroEstado,
      prioridad = filtroPrioridad,
      search = busqueda,
      pageParam = page,
      silent = false, // si true, no mostramos “recargado”
    } = {}) => {
      try {
        setLoading(true);
        setErrorToast(null);

        const params = { page: pageParam, limit: 12 };

        if (estado && estado !== "todos") params.estado = estado;
        if (prioridad && prioridad !== "todas") params.prioridad = prioridad;

        const q = String(search || "").trim();
        if (q) params.search = q;

        const res = await api.get("/tickets", { params });

        setTickets(Array.isArray(res?.data?.tickets) ? res.data.tickets : []);
        setPages(Number(res?.data?.meta?.pages || 1) || 1);

        if (!silent) {
          // opcional: comenta si no quieres toast de éxito al recargar
          // showOk("Listado actualizado.");
        }
      } catch (err) {
        setTickets([]);
        setPages(1);
        showErr(err, "No se pudieron cargar los tickets. Inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    },
    [busqueda, filtroEstado, filtroPrioridad, page, showErr]
  );

  // recargar al cambiar filtros
  useEffect(() => {
    setPage(1);
    setBusqueda("");
    cargarTickets({
      estado: filtroEstado,
      prioridad: filtroPrioridad,
      pageParam: 1,
      silent: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, filtroPrioridad]);

  const handleBuscar = () => {
    const q = String(busqueda || "").trim();
    if (q.length > 0 && q.length < 2) {
      showWarn("La búsqueda es demasiado corta.");
      return;
    }

    setPage(1);
    cargarTickets({
      estado: filtroEstado,
      prioridad: filtroPrioridad,
      search: busqueda,
      pageParam: 1,
      silent: true,
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
      silent: true,
    });
  };

  const hayTickets = Array.isArray(tickets) && tickets.length > 0;

  const onRetry = useCallback(() => {
    cargarTickets({
      estado: filtroEstado,
      prioridad: filtroPrioridad,
      search: busqueda,
      pageParam: page,
      silent: true,
    });
  }, [cargarTickets, filtroEstado, filtroPrioridad, busqueda, page]);

  return (
    <div className="soporte-contenedor">
      {/* ERROR TOAST */}
      {errorToast && (
        <ErrorToast
          error={errorToast}
          onRetry={errorToast.canRetry ? onRetry : undefined}
          onClose={() => setErrorToast(null)}
        />
      )}

      {/* ALERTA OK / avisos */}
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
          autoCerrar
          duracion={3200}
        />
      )}

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
            className="btn btn-secundario"
            onClick={() =>
              cargarTickets({
                estado: filtroEstado,
                prioridad: filtroPrioridad,
                search: busqueda,
                pageParam: page,
                silent: true,
              })
            }
            disabled={loading}
          >
            {loading ? "Recargando…" : "Recargar"}
          </button>

          <Link to="/soporte/nuevo" className="btn btn-primario">
            Nuevo ticket
          </Link>
        </div>
      </div>

      {/* FILTROS */}
      <div className="soporte-filtros">
        <div className="soporte-filtro">
          <label>Estado</label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} disabled={loading}>
            <option value="todos">Todos</option>
            <option value="abierto">Abiertos</option>
            <option value="en_progreso">En progreso</option>
            <option value="cerrado">Cerrados</option>
          </select>
        </div>

        <div className="soporte-filtro">
          <label>Prioridad</label>
          <select value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)} disabled={loading}>
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
              disabled={loading}
            />
            <button type="button" className="btn-buscar" onClick={handleBuscar} disabled={loading}>
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* ESTADOS */}
      {loading && <p className="soporte-loading">Cargando tickets…</p>}

      {!loading && !hayTickets && (
        <p className="soporte-vacio">
          No tienes tickets todavía. Crea tu primer ticket para contactar con soporte.
        </p>
      )}

      {/* LISTA */}
      {!loading && hayTickets && (
        <>
          <div className="soporte-lista">
            {tickets.map((t) => (
              <Link to={`/soporte/${t._id}`} className="soporte-item" key={t._id}>
                <div className="soporte-item-main">
                  <h3>{t.asunto}</h3>
                  <p className="soporte-item-descripcion">
                    {t.descripcion?.slice(0, 140) || "Sin descripción"}
                    {t.descripcion && t.descripcion.length > 140 ? "…" : ""}
                  </p>
                </div>

                <div className="soporte-item-meta">
                  <div className="soporte-badges">
                    <span className={`badge-estado estado-${t.estado}`}>{t.estado}</span>
                    <span className={`badge-prioridad prioridad-${t.prioridad}`}>{t.prioridad}</span>
                  </div>
                  <small className="soporte-fecha">
                    {new Date(t.createdAt).toLocaleDateString()} •{" "}
                    {new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </small>
                </div>
              </Link>
            ))}
          </div>

          {/* PAGINACIÓN */}
          {pages > 1 && (
            <div className="soporte-paginacion">
              <button disabled={page === 1} onClick={() => cambiarPagina(page - 1)}>
                ← Anterior
              </button>
              <span>
                Página {page} de {pages}
              </span>
              <button disabled={page === pages} onClick={() => cambiarPagina(page + 1)}>
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}