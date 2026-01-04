// src/pages/MapaEditor.jsx
import React, { useEffect, useState, useRef } from "react";
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

  // posiciones en píxeles por mesa: { [id]: { x, y } }
  const [positions, setPositions] = useState({});
  const nodeRefs = useRef({}); // 👈 para evitar findDOMNode

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const holdTimeoutRef = useRef(null);

  useEffect(() => {
    cargarMesas();
  }, [zona]);

  const cargarMesas = async () => {
    try {
      const res = await api.get("/mesas");
      setMesas(res.data);
    } catch (err) {
      console.error("❌ Error al cargar mesas:", err);
    }
  };

  // 🧭 Detectar tamaño del contenedor en tiempo real
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      setContainerSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Convertir posiciones % de la DB → píxeles, solo si aún no tenemos esa mesa en `positions`
  useEffect(() => {
    const { width, height } = containerSize;
    if (!width || !height) return;

    setPositions((prev) => {
      const next = { ...prev };

      mesas.forEach((m) => {
        if (!next[m._id]) {
          const xPct = m.posicion?.x ?? 0;
          const yPct = m.posicion?.y ?? 0;
          next[m._id] = {
            x: (xPct / 100) * width,
            y: (yPct / 100) * height,
          };
        }
      });

      return next;
    });
  }, [mesas, containerSize]);

  // 🧮 Guardar posición proporcional cuando sueltas
  const handleDragStop = async (e, data, mesa) => {
    if (!modoEdicion) return;

    const { width, height } = containerSize;
    if (!width || !height) return;

    // clamped en píxeles
    const clampedX = Math.max(0, Math.min(width, data.x));
    const clampedY = Math.max(0, Math.min(height, data.y));

    const x = (clampedX / width) * 100;
    const y = (clampedY / height) * 100;

    // actualizar estado local en píxeles
    setPositions((prev) => ({
      ...prev,
      [mesa._id]: { x: clampedX, y: clampedY },
    }));

    try {
      await api.put(`/mesas/${mesa._id}/posicion`, { x, y });
      setMesas((prev) =>
        prev.map((m) =>
          m._id === mesa._id ? { ...m, posicion: { x, y } } : m
        )
      );
    } catch (err) {
      console.error("❌ Error al guardar posición:", err);
    }
  };

  // 🎯 Mantener pulsado para abrir edición
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

  const mesasVisibles = mesas.filter(
    (m) => m.zona === zona && m.zona !== "auxiliar"
  );
  const mesasAuxiliares = mesas.filter((m) => m.zona === "auxiliar");

  if (isMobile) {
    return (
      <div className="mapa-mobile-disabled">
        <div className="mapa-mobile-card">
          <h2>Mapa del restaurante</h2>
          <p>
            El editor de plano está disponible solo en pantallas grandes.
          </p>

          <div className="mapa-mobile-hint">
            💻 Accede desde un ordenador o tablet para editar el mapa.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mapa-editor-container">
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
          // crear ref para este nodo si no existe
          if (!nodeRefs.current[mesa._id]) {
            nodeRefs.current[mesa._id] = React.createRef();
          }

          const fallbackX =
            ((mesa.posicion?.x ?? 0) / 100) * containerSize.width;
          const fallbackY =
            ((mesa.posicion?.y ?? 0) / 100) * containerSize.height;

          const currentPos =
            positions[mesa._id] || { x: fallbackX, y: fallbackY };

          return (
            <Draggable
              key={mesa._id}
              nodeRef={nodeRefs.current[mesa._id]} // 👈 evita findDOMNode
              disabled={!modoEdicion}
              position={currentPos}
              onStart={() => handleHoldStart(mesa)}
              onDrag={(e, data) => {
                cancelHold();
                setPositions((prev) => ({
                  ...prev,
                  [mesa._id]: { x: data.x, y: data.y },
                }));
              }}
              onStop={(e, data) => {
                cancelHold();
                handleDragStop(e, data, mesa);
              }}
            >
              <div
                ref={nodeRefs.current[mesa._id]}
                className="mesa-editor"
              >
                {mesa.numero}
              </div>
            </Draggable>
          );
        })}
      </div>

      {/* === Barra lateral === */}
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

      {/* === Modal === */}
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
