// src/pages/MapaEditor.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import Draggable from "react-draggable";
import api from "../utils/api";
import EditarMesa from "../components/EditarMesa/EditarMesa";
import "../styles/MapaEditor.css";

export default function MapaEditor() {
  const [mesas, setMesas] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(true);
  const [zona, setZona] = useState("interior");
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);

  const [containerSize, setContainerSize] = useState({ width: 1, height: 1 });
  const containerRef = useRef(null);

  // ✅ posiciones en % (no px)
  const [positionsPct, setPositionsPct] = useState({});
  const nodeRefs = useRef({});

  const [viewportW, setViewportW] = useState(() => window.innerWidth);
  const isMobile = viewportW < 768;
  const isTablet = viewportW >= 768 && viewportW < 1200;

  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const holdTimeoutRef = useRef(null);

  useEffect(() => {
    cargarMesas();
    // (opcional) limpia posiciones del estado al cambiar de zona
    // setPositionsPct({});
  }, [zona]);

  const cargarMesas = async () => {
    try {
      const res = await api.get("/mesas");
      setMesas(res.data);
    } catch (err) {
      console.error("❌ Error al cargar mesas:", err);
    }
  };

  // 🧭 Tamaño del contenedor en tiempo real
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

  // ✅ Inicializar positionsPct desde DB (solo si no existe aún)
  useEffect(() => {
    setPositionsPct((prev) => {
      const next = { ...prev };
      mesas.forEach((m) => {
        if (!next[m._id]) {
          next[m._id] = {
            x: m.posicion?.x ?? 0,
            y: m.posicion?.y ?? 0,
          };
        }
      });
      return next;
    });
  }, [mesas]);

  // helpers % -> px y px -> %
  const pctToPx = (pct) => {
    const x = (pct.x / 100) * containerSize.width;
    const y = (pct.y / 100) * containerSize.height;
    return { x, y };
  };

  const pxToPct = (px) => {
    const x = (px.x / containerSize.width) * 100;
    const y = (px.y / containerSize.height) * 100;
    return { x, y };
  };

  // clamp teniendo en cuenta tamaño real del nodo (para que no se salga)
  const clampPx = (mesaId, x, y) => {
    const el = nodeRefs.current[mesaId]?.current;
    const w = el?.offsetWidth ?? 72;
    const h = el?.offsetHeight ?? 72;

    const maxX = Math.max(0, containerSize.width - w);
    const maxY = Math.max(0, containerSize.height - h);

    return {
      x: Math.max(0, Math.min(maxX, x)),
      y: Math.max(0, Math.min(maxY, y)),
    };
  };

  const handleHoldStart = (mesa) => {
    holdTimeoutRef.current = setTimeout(() => {
      setMesaSeleccionada(mesa);
    }, 700);
  };

  const cancelHold = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  };

  // ✅ Guardar en DB en % (lo que tu dashboard ya entiende perfecto)
  const handleDragStop = async (_e, data, mesa) => {
    if (!modoEdicion) return;

    const clamped = clampPx(mesa._id, data.x, data.y);
    const pct = pxToPct(clamped);

    // estado local en %
    setPositionsPct((prev) => ({
      ...prev,
      [mesa._id]: { x: pct.x, y: pct.y },
    }));

    try {
      await api.put(`/mesas/${mesa._id}/posicion`, { x: pct.x, y: pct.y });

      // refrescar mesa en memoria (posicion en %)
      setMesas((prev) =>
        prev.map((m) =>
          m._id === mesa._id ? { ...m, posicion: { x: pct.x, y: pct.y } } : m
        )
      );
    } catch (err) {
      console.error("❌ Error al guardar posición:", err);
    }
  };

  const guardarCambiosMesa = async (datos) => {
    try {
      await api.put(`/mesas/${mesaSeleccionada._id}`, datos);
      setMesaSeleccionada(null);
      cargarMesas();
    } catch (err) {
      console.error("❌ Error al guardar cambios:", err);
    }
  };

  const eliminarMesa = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta mesa?")) return;
    try {
      await api.delete(`/mesas/${id}`);
      setMesaSeleccionada(null);
      cargarMesas();
    } catch (err) {
      console.error("❌ Error al eliminar mesa:", err);
    }
  };

  const mesasVisibles = mesas.filter((m) => m.zona === zona && m.zona !== "auxiliar");
  const mesasAuxiliares = mesas.filter((m) => m.zona === "auxiliar");

  if (isMobile) {
    return (
      <div className="mapa-mobile-disabled">
        <div className="mapa-mobile-card">
          <h2>Mapa del restaurante</h2>
          <p>El editor de plano está disponible solo en pantallas grandes.</p>
          <div className="mapa-mobile-hint">💻 Accede desde un ordenador o tablet para editar el mapa.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mapa-editor-container ${isTablet ? "tablet" : ""}`}>
      {/* === Barra superior === */}
      <div className="toolbar-editor">
        <select value={zona} onChange={(e) => setZona(e.target.value)}>
          <option value="interior">Interior</option>
          <option value="exterior">Terraza</option>
        </select>
        <button onClick={() => setModoEdicion(!modoEdicion)}>
          {modoEdicion ? "Bloquear plano" : "Editar plano"}
        </button>
      </div>

      {/* === Mapa principal === */}
      <div className="mapa-editor-principal" ref={containerRef}>
        {mesasVisibles.map((mesa) => {
          if (!nodeRefs.current[mesa._id]) nodeRefs.current[mesa._id] = React.createRef();

          const pct = positionsPct[mesa._id] ?? { x: mesa.posicion?.x ?? 0, y: mesa.posicion?.y ?? 0 };
          const px = pctToPx(pct);

          return (
            <Draggable
              key={mesa._id}
              nodeRef={nodeRefs.current[mesa._id]}
              disabled={!modoEdicion}
              bounds="parent"
              position={px}
              onStart={() => handleHoldStart(mesa)}
              onDrag={(_e, data) => {
                cancelHold();
                const clamped = clampPx(mesa._id, data.x, data.y);
                const nextPct = pxToPct(clamped);

                setPositionsPct((prev) => ({
                  ...prev,
                  [mesa._id]: { x: nextPct.x, y: nextPct.y },
                }));
              }}
              onStop={(e, data) => {
                cancelHold();
                handleDragStop(e, data, mesa);
              }}
            >
              <div ref={nodeRefs.current[mesa._id]} className="mesa-editor">
                {mesa.numero}
              </div>
            </Draggable>
          );
        })}
      </div>

      {/* ✅ Desktop: sidebar normal */}
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

      {/* ✅ Tablet/TPV: auxiliares debajo del mapa */}
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
          onClose={() => setMesaSeleccionada(null)}
          onSave={guardarCambiosMesa}
          onDelete={eliminarMesa}
        />
      )}
    </div>
  );
}
