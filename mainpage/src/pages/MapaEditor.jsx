// src/pages/MapaEditor.jsx
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import api from "../utils/api";
import EditarMesa from "../components/EditarMesa/EditarMesa";
import MapaEditorHelp from "../components/MapaEditor/MapaEditorHelp";
import ModalCrearMesa from "../components/MapaEditor/ModalCrearMesa";
import ModalEliminarMesa from "../components/MapaEditor/ModalEliminarMesa";
import "../styles/MapaEditor.css";

const SNAP_THRESHOLD = 1.8;

function snapToOthers(pct, otherPositions) {
  let x = pct.x;
  let y = pct.y;
  const guides = [];

  let bestDx = SNAP_THRESHOLD;
  let bestDy = SNAP_THRESHOLD;
  let snapX = null;
  let snapY = null;

  for (const other of otherPositions) {
    const dx = Math.abs(pct.x - other.x);
    const dy = Math.abs(pct.y - other.y);

    if (dx < bestDx) {
      bestDx = dx;
      snapX = other.x;
    }

    if (dy < bestDy) {
      bestDy = dy;
      snapY = other.y;
    }
  }

  if (snapX !== null) {
    x = snapX;
    guides.push({ axis: "x", value: snapX });
  }

  if (snapY !== null) {
    y = snapY;
    guides.push({ axis: "y", value: snapY });
  }

  return { snapped: { x, y }, guides };
}

export default function MapaEditor() {
  const [mesas, setMesas] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(true);
  const [zona, setZona] = useState("interior");
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [containerSize, setContainerSize] = useState({ width: 1, height: 1 });
  const containerRef = useRef(null);

  const [positionsPct, setPositionsPct] = useState({});
  const nodeRefs = useRef({});

  const [viewportW, setViewportW] = useState(() => window.innerWidth);
  const isMobile = viewportW < 768;
  const isTablet = viewportW >= 768 && viewportW < 1200;

  const [openCrear, setOpenCrear] = useState(false);
  const [openEliminar, setOpenEliminar] = useState(false);

  const [savingIds, setSavingIds] = useState(new Set());
  const [saveError, setSaveError] = useState(null);

  const [guides, setGuides] = useState([]);

  // Drag state — gestionado manualmente (sin react-draggable)
  const dragState = useRef(null);
  const holdTimeoutRef = useRef(null);
  // Ref para leer positionsPct dentro de callbacks sin stale closure
  const positionsPctRef = useRef(positionsPct);
  positionsPctRef.current = positionsPct;

  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fetchControllerRef = useRef(null);

  const cargarMesas = useCallback(async () => {
    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/mesas", { signal: controller.signal });
      if (controller.signal.aborted) return;
      setMesas(res.data || []);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setError("No se pudieron cargar las mesas.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarMesas();
    return () => fetchControllerRef.current?.abort();
  }, [cargarMesas]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      setContainerSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mesaIds = new Set(mesas.map((m) => m._id));

    setPositionsPct((prev) => {
      const next = {};
      mesas.forEach((m) => {
        next[m._id] = prev[m._id] || {
          x: m.posicion?.x ?? 0,
          y: m.posicion?.y ?? 0,
        };
      });
      return next;
    });

    Object.keys(nodeRefs.current).forEach((id) => {
      if (!mesaIds.has(id)) delete nodeRefs.current[id];
    });
  }, [mesas]);

  const mesasVisibles = useMemo(
    () => mesas.filter((m) => m.zona === zona && m.zona !== "auxiliar"),
    [mesas, zona]
  );
  const mesasAuxiliares = useMemo(
    () => mesas.filter((m) => m.zona === "auxiliar"),
    [mesas]
  );

  // Clamp en % (0-maxPct teniendo en cuenta tamaño del nodo)
  const clampPct = useCallback(
    (mesaId, pct) => {
      const el = nodeRefs.current[mesaId]?.current;
      const w = el?.offsetWidth ?? 72;
      const h = el?.offsetHeight ?? 72;
      const maxXPct = Math.max(0, ((containerSize.width - w) / containerSize.width) * 100);
      const maxYPct = Math.max(0, ((containerSize.height - h) / containerSize.height) * 100);
      return {
        x: Math.max(0, Math.min(maxXPct, pct.x)),
        y: Math.max(0, Math.min(maxYPct, pct.y)),
      };
    },
    [containerSize]
  );

  const getOtherPositions = useCallback(
    (excludeId) =>
      mesasVisibles
        .filter((m) => m._id !== excludeId)
        .map((m) => positionsPct[m._id] || { x: m.posicion?.x ?? 0, y: m.posicion?.y ?? 0 }),
    [mesasVisibles, positionsPct]
  );

  // ——————— Drag manual con pointer events ———————

  const cancelHold = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  };

  const onPointerDown = (e, mesa) => {
    if (!modoEdicion) return;
    // Solo botón principal del mouse / touch primario
    if (e.button !== 0 && e.button !== undefined) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = containerRef.current.getBoundingClientRect();
    const pct = positionsPct[mesa._id] || { x: mesa.posicion?.x ?? 0, y: mesa.posicion?.y ?? 0 };

    dragState.current = {
      mesaId: mesa._id,
      mesaNumero: mesa.numero,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPctX: pct.x,
      startPctY: pct.y,
      containerLeft: rect.left,
      containerTop: rect.top,
      hasMoved: false,
    };

    // Hold para editar
    holdTimeoutRef.current = setTimeout(() => {
      if (dragState.current && !dragState.current.hasMoved) {
        setMesaSeleccionada(mesa);
        dragState.current = null;
      }
    }, 700);
  };

  const onPointerMove = useCallback(
    (e) => {
      const ds = dragState.current;
      if (!ds) return;

      ds.hasMoved = true;
      cancelHold();

      const deltaXPx = e.clientX - ds.startMouseX;
      const deltaYPx = e.clientY - ds.startMouseY;

      const deltaXPct = (deltaXPx / containerSize.width) * 100;
      const deltaYPct = (deltaYPx / containerSize.height) * 100;

      const rawPct = {
        x: ds.startPctX + deltaXPct,
        y: ds.startPctY + deltaYPct,
      };

      const clamped = clampPct(ds.mesaId, rawPct);
      const others = getOtherPositions(ds.mesaId);
      const { snapped, guides: newGuides } = snapToOthers(clamped, others);

      setGuides(newGuides);
      setPositionsPct((prev) => ({
        ...prev,
        [ds.mesaId]: snapped,
      }));
    },
    [containerSize, clampPct, getOtherPositions]
  );

  const saveTimers = useRef({});

  const onPointerUp = useCallback(
    (e) => {
      const ds = dragState.current;
      if (!ds) return;

      cancelHold();
      dragState.current = null;
      setGuides([]);

      if (!ds.hasMoved) return;

      // Leer la posición final via ref (evita stale closure)
      const finalPct = positionsPctRef.current[ds.mesaId];
      if (!finalPct) return;

      // Debounce save
      if (saveTimers.current[ds.mesaId]) {
        clearTimeout(saveTimers.current[ds.mesaId]);
      }

      saveTimers.current[ds.mesaId] = setTimeout(async () => {
        delete saveTimers.current[ds.mesaId];
        setSaveError(null);
        setSavingIds((prev) => new Set(prev).add(ds.mesaId));

        try {
          await api.put(`/mesas/${ds.mesaId}/posicion`, {
            x: finalPct.x,
            y: finalPct.y,
          });

          setMesas((prev) =>
            prev.map((m) =>
              m._id === ds.mesaId ? { ...m, posicion: { x: finalPct.x, y: finalPct.y } } : m
            )
          );
        } catch (err) {
          setSaveError(`Error al guardar posición de mesa ${ds.mesaNumero}.`);
        } finally {
          setSavingIds((prev) => {
            const next = new Set(prev);
            next.delete(ds.mesaId);
            return next;
          });
        }
      }, 400);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Listeners globales para move/up (para que funcione fuera del nodo)
  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const guardarCambiosMesa = async (datos) => {
    try {
      await api.put(`/mesas/${mesaSeleccionada._id}`, datos);
      setMesaSeleccionada(null);
      cargarMesas();
    } catch (err) {
      const code = err?.response?.data?.code || err?.response?.data?.error;
      const msg = mapMesaError(code) || "Error al guardar cambios.";
      throw new Error(msg);
    }
  };

  const eliminarMesa = async (id) => {
    try {
      await api.delete(`/mesas/id/${id}`);
      setMesaSeleccionada(null);
      cargarMesas();
    } catch (err) {
      const code = err?.response?.data?.code || err?.response?.data?.error;
      const msg = mapMesaError(code) || "Error al eliminar mesa.";
      throw new Error(msg);
    }
  };

  if (isMobile) {
    return (
      <div className="mapa-mobile-disabled">
        <div className="mapa-mobile-card">
          <h2>Mapa del restaurante</h2>
          <p>El editor de plano está disponible solo en pantallas grandes.</p>
          <div className="mapa-mobile-hint">Accede desde un ordenador o tablet para editar el mapa.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mapa-editor-container ${isTablet ? "tablet" : ""}`}>
      <div className="toolbar-editor">
        <select value={zona} onChange={(e) => setZona(e.target.value)}>
          <option value="interior">Interior</option>
          <option value="exterior">Terraza</option>
        </select>

        <button onClick={() => setModoEdicion(!modoEdicion)}>
          {modoEdicion ? "Bloquear plano" : "Editar plano"}
        </button>

        <button onClick={() => setOpenCrear(true)} disabled={!modoEdicion}>
          + Nueva mesa
        </button>

        <button onClick={() => setOpenEliminar(true)} disabled={!modoEdicion}>
          Eliminar mesa
        </button>

        {savingIds.size > 0 && (
          <span className="toolbar-saving">Guardando...</span>
        )}
      </div>

      {error && (
        <div className="mapa-error-banner">
          <span>{error}</span>
          <button onClick={cargarMesas}>Reintentar</button>
        </div>
      )}

      {saveError && (
        <div className="mapa-error-banner mapa-error-banner--warn">
          <span>{saveError}</span>
          <button onClick={() => setSaveError(null)}>Cerrar</button>
        </div>
      )}

      <div className="mapa-editor-principal" ref={containerRef}>
        {loading && mesas.length === 0 && (
          <div className="mapa-loading">Cargando mesas...</div>
        )}

        {/* Guías de alineación */}
        {guides.map((g, i) =>
          g.axis === "x" ? (
            <div
              key={`guide-${i}`}
              className="snap-guide snap-guide--vertical"
              style={{ left: `${g.value}%` }}
            />
          ) : (
            <div
              key={`guide-${i}`}
              className="snap-guide snap-guide--horizontal"
              style={{ top: `${g.value}%` }}
            />
          )
        )}

        {mesasVisibles.map((mesa) => {
          if (!nodeRefs.current[mesa._id]) nodeRefs.current[mesa._id] = React.createRef();

          const pct = positionsPct[mesa._id] ?? {
            x: mesa.posicion?.x ?? 0,
            y: mesa.posicion?.y ?? 0,
          };

          const isDragging = dragState.current?.mesaId === mesa._id;

          return (
            <div
              key={mesa._id}
              ref={nodeRefs.current[mesa._id]}
              className={`mesa-editor ${isDragging ? "is-dragging" : ""}`}
              style={{
                left: `${pct.x}%`,
                top: `${pct.y}%`,
                cursor: modoEdicion ? (isDragging ? "grabbing" : "grab") : "default",
              }}
              onPointerDown={(e) => onPointerDown(e, mesa)}
            >
              {mesa.numero}
            </div>
          );
        })}
      </div>

      {!isTablet && (
        <div className="sidebar-editor">
          <h3>Mesas Auxiliares</h3>
          <div className="sidebar-mesas-list">
            {mesasAuxiliares.map((mesa) => (
              <div
                key={mesa._id}
                className="mesa-sidebar"
                onClick={() => setMesaSeleccionada(mesa)}
              >
                {mesa.numero}
              </div>
            ))}
          </div>
        </div>
      )}

      {isTablet && (
        <div className="aux-below-editor">
          <h3 className="aux-below-title">Mesas Auxiliares</h3>
          <div className="aux-below-list">
            {mesasAuxiliares.map((mesa) => (
              <div
                key={mesa._id}
                className="mesa-sidebar"
                onClick={() => setMesaSeleccionada(mesa)}
              >
                {mesa.numero}
              </div>
            ))}
          </div>
        </div>
      )}

      {mesaSeleccionada && (
        <EditarMesa
          mesa={mesaSeleccionada}
          mesas={mesas}
          onClose={() => setMesaSeleccionada(null)}
          onSave={guardarCambiosMesa}
          onDelete={eliminarMesa}
        />
      )}

      <ModalCrearMesa
        open={openCrear}
        onClose={() => setOpenCrear(false)}
        zonaDefault={zona}
        mesasZona={mesasVisibles}
        onCreated={cargarMesas}
      />

      <ModalEliminarMesa
        open={openEliminar}
        onClose={() => setOpenEliminar(false)}
        mesas={mesas}
        onDeleted={() => {
          setMesaSeleccionada(null);
          cargarMesas();
        }}
      />

      <MapaEditorHelp />
    </div>
  );
}

function mapMesaError(code) {
  const map = {
    MESA_YA_EXISTE: "Ya existe una mesa con ese número.",
    MESA_NOT_FOUND: "Mesa no encontrada.",
    MESA_ABIERTA_NO_ELIMINABLE: "No se puede eliminar una mesa que está abierta.",
    NUMERO_INVALIDO: "El número de mesa no es válido.",
    ZONA_INVALIDA: "La zona seleccionada no es válida.",
    COORDENADAS_INVALIDAS: "Las coordenadas de posición no son válidas.",
    VALIDATION_ERROR: "Datos inválidos. Revisa los campos.",
  };
  return map[code] || null;
}
