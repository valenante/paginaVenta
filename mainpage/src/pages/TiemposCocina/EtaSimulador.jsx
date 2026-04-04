import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import api from "../../utils/api";
import "./EtaSimulador.css";

/* ── Helpers ── */
const num = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
const MESA_COLORS = ["#8b5cf6","#f59e0b","#06b6d4","#ef4444","#22c55e","#ec4899","#f97316","#14b8a6"];
const ICONS = { cocina: "\u{1F525}", barra: "\u{1F378}", "": "\u{1F4E6}" };

export default function EtaSimulador({ productos, estaciones, drafts, perfilByProduct }) {
  // ── Secciones (cargadas dinamicamente) ──
  const [secciones, setSecciones] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/secciones?includeInactive=0");
        const items = res?.data?.items || res?.data || [];
        setSecciones(items.sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999)));
      } catch { /* silent */ }
    })();
  }, []);

  const seccionMap = useMemo(() => {
    const m = new Map();
    secciones.forEach((s, idx) => m.set(s.slug, { ...s, index: idx }));
    return m;
  }, [secciones]);

  // ── Mesas ──
  const [mesas, setMesas] = useState([]);
  const [activeMesa, setActiveMesa] = useState(null);
  const [newMesaNum, setNewMesaNum] = useState("");

  // ── Carrito staging (items antes de enviar a mesa) ──
  // seccionOverride: si el usuario arrastra a otra seccion, se guarda aqui
  const [carrito, setCarrito] = useState([]); // [{ pid, qty, seccionOverride? }]

  // ── Buscador ──
  const [search, setSearch] = useState("");
  const [filterStation, setFilterStation] = useState("__all__");
  const [filterSeccion, setFilterSeccion] = useState("__all__");
  const searchRef = useRef(null);

  // ── Station overrides ──
  const [stationOverrides, setStationOverrides] = useState({}); // { [slug]: { workers, capacidadEspacio, capacidadAccion } }

  // ── Resultado ──
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // ── Mesa helpers ──
  const addMesa = useCallback(() => {
    const n = Number(newMesaNum) || (mesas.length + 1);
    if (mesas.some((m) => m.numero === n)) return;
    const mesa = { id: `m-${Date.now()}`, numero: n, items: [], todoJunto: false };
    setMesas((prev) => [...prev, mesa]);
    setActiveMesa(mesa.id);
    setNewMesaNum("");
  }, [newMesaNum, mesas]);

  const removeMesa = useCallback((mesaId) => {
    setMesas((prev) => prev.filter((m) => m.id !== mesaId));
    setActiveMesa((prev) => prev === mesaId ? null : prev);
  }, []);

  const toggleTodoJunto = useCallback((mesaId) => {
    setMesas((prev) => prev.map((m) => m.id === mesaId ? { ...m, todoJunto: !m.todoJunto } : m));
  }, []);

  // ── Carrito: agregar/quitar del staging ──
  const addToCarrito = useCallback((pid) => {
    setCarrito((prev) => {
      const idx = prev.findIndex((c) => c.pid === pid);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { pid, qty: 1 }];
    });
  }, []);

  const removeFromCarrito = useCallback((pid) => {
    setCarrito((prev) => prev.filter((c) => c.pid !== pid));
  }, []);

  const updateCarritoQty = useCallback((pid, qty) => {
    if (qty <= 0) { removeFromCarrito(pid); return; }
    setCarrito((prev) => prev.map((c) => c.pid === pid ? { ...c, qty } : c));
  }, [removeFromCarrito]);

  const clearCarrito = useCallback(() => setCarrito([]), []);

  // ── Drag & drop entre secciones ──
  const onDragEnd = useCallback((result) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const targetSeccion = destination.droppableId; // slug de la seccion destino
    setCarrito((prev) => prev.map((c) => {
      if (c.pid !== draggableId) return c;
      const prod = productos.find((p) => p._id === c.pid);
      const originalSec = prod?.seccion || "__none__";
      // Si vuelve a su seccion original, quitar override
      if (targetSeccion === originalSec) {
        const { seccionOverride: _, ...rest } = c;
        return rest;
      }
      return { ...c, seccionOverride: targetSeccion };
    }));
  }, [productos]);

  // ── Enviar carrito a mesa activa ──
  const sendToMesa = useCallback(() => {
    if (!activeMesa || !carrito.length) return;
    setMesas((prev) => prev.map((m) => {
      if (m.id !== activeMesa) return m;
      const items = [...m.items];
      for (const c of carrito) {
        const idx = items.findIndex((i) => i.pid === c.pid);
        if (idx >= 0) {
          items[idx] = { ...items[idx], qty: items[idx].qty + c.qty, seccionOverride: c.seccionOverride };
        } else {
          items.push({ pid: c.pid, qty: c.qty, seccionOverride: c.seccionOverride });
        }
      }
      return { ...m, items };
    }));
    setCarrito([]);
  }, [activeMesa, carrito]);

  // ── Quitar item de mesa ──
  const removeItemFromMesa = useCallback((mesaId, pid) => {
    setMesas((prev) => prev.map((m) => {
      if (m.id !== mesaId) return m;
      return { ...m, items: m.items.filter((i) => i.pid !== pid) };
    }));
  }, []);

  // ── Products: filtro + busqueda ──
  const filteredProducts = useMemo(() => {
    let prods = productos.filter((p) => p.tipo !== "bebida" || filterStation !== "__all__");
    if (filterStation !== "__all__") prods = prods.filter((p) => (p.estacion || "") === filterStation);
    if (filterSeccion !== "__all__") prods = prods.filter((p) => (p.seccion || "") === filterSeccion);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      prods = prods.filter((p) => (p.nombre || "").toLowerCase().includes(q));
    }
    return prods;
  }, [productos, filterStation, filterSeccion, search]);

  // Agrupar por seccion para el picker
  const groupedBySeccion = useMemo(() => {
    const groups = new Map();
    for (const p of filteredProducts) {
      const slug = p.seccion || "__none__";
      if (!groups.has(slug)) groups.set(slug, []);
      groups.get(slug).push(p);
    }
    // Ordenar grupos por orden de seccion
    const sorted = [...groups.entries()].sort((a, b) => {
      const oa = seccionMap.get(a[0])?.orden ?? 999;
      const ob = seccionMap.get(b[0])?.orden ?? 999;
      return oa - ob;
    });
    return sorted;
  }, [filteredProducts, seccionMap]);

  // Secciones disponibles en los productos filtrados (para filtro)
  const seccionesDisponibles = useMemo(() => {
    const set = new Set();
    for (const p of productos) {
      if (p.seccion) set.add(p.seccion);
    }
    return secciones.filter((s) => set.has(s.slug));
  }, [productos, secciones]);

  // Carrito agrupado por seccion (respetando overrides de drag)
  const carritoBySeccion = useMemo(() => {
    const groups = new Map();
    // Preinicializar todas las secciones activas (para que siempre aparezcan como drop targets)
    for (const s of secciones) groups.set(s.slug, []);
    if (!groups.has("__none__")) groups.set("__none__", []);

    for (const c of carrito) {
      const prod = productos.find((p) => p._id === c.pid);
      if (!prod) continue;
      const slug = c.seccionOverride || prod.seccion || "__none__";
      if (!groups.has(slug)) groups.set(slug, []);
      groups.get(slug).push({ ...c, prod });
    }
    return [...groups.entries()].sort((a, b) => {
      const oa = seccionMap.get(a[0])?.orden ?? 999;
      const ob = seccionMap.get(b[0])?.orden ?? 999;
      return oa - ob;
    });
  }, [carrito, productos, seccionMap, secciones]);

  // ── Station override helpers ──
  const getOverride = (slug, field) => stationOverrides[slug]?.[field];
  const setOverride = (slug, field, val) => {
    setStationOverrides((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], [field]: val === "" ? undefined : Number(val) },
    }));
  };
  const hasOverrides = Object.keys(stationOverrides).some((slug) => {
    const ov = stationOverrides[slug];
    return ov && (ov.workers != null || ov.capacidadEspacio != null || ov.capacidadAccion != null);
  });

  // ── Simular ──
  const runSimulation = useCallback(async () => {
    const mesasConItems = mesas.filter((m) => m.items.length > 0);
    if (!mesasConItems.length) { setSimResult(null); return; }

    setSimulating(true);
    try {
      const body = {
        mesas: mesasConItems.map((m) => ({
          numero: m.numero,
          todoJunto: m.todoJunto,
          items: m.items.map((it) => {
            const prod = productos.find((p) => p._id === it.pid);
            const secSlug = it.seccionOverride || prod?.seccion || "";
            const secIdx = seccionMap.get(secSlug)?.index ?? 999;
            return { productoId: it.pid, cantidad: it.qty, seccionIndex: secIdx };
          }),
        })),
      };

      // Solo enviar overrides si hay alguno definido
      if (hasOverrides) {
        const clean = {};
        for (const [slug, ov] of Object.entries(stationOverrides)) {
          const o = {};
          if (ov.workers != null) o.workers = ov.workers;
          if (ov.capacidadEspacio != null) o.capacidadEspacio = ov.capacidadEspacio;
          if (ov.capacidadAccion != null) o.capacidadAccion = ov.capacidadAccion;
          if (Object.keys(o).length) clean[slug] = o;
        }
        if (Object.keys(clean).length) body.overrides = { estaciones: clean };
      }

      const res = await api.post("/admin/eta/simulate", body);
      setSimResult(res.data || res);
    } catch {
      setSimResult(null);
    } finally {
      setSimulating(false);
    }
  }, [mesas, productos, seccionMap, stationOverrides, hasOverrides]);

  // Debounced auto-simulate
  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const mesasConItems = mesas.filter((m) => m.items.length > 0);
    if (!mesasConItems.length) { setSimResult(null); return; }
    debounceRef.current = setTimeout(runSimulation, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [mesas, stationOverrides, runSimulation]);

  // ── Helpers render ──
  const mesaActiva = mesas.find((m) => m.id === activeMesa);
  const totalItemsMesa = mesaActiva?.items.reduce((a, it) => a + it.qty, 0) || 0;

  return (
    <div className="sim">
      {/* ══ MESA BAR ══ */}
      <div className="sim-mesa-bar">
        <div className="sim-mesa-bar__left">
          {mesas.map((m, i) => (
            <button key={m.id}
              className={`sim-mesa-chip ${activeMesa === m.id ? "sim-mesa-chip--on" : ""}`}
              style={{ "--mesa-color": MESA_COLORS[i % MESA_COLORS.length] }}
              onClick={() => setActiveMesa(m.id)}>
              Mesa {m.numero}
              {m.todoJunto && <span className="sim-mesa-chip__tag">junto</span>}
              <span className="sim-mesa-chip__count">{m.items.reduce((a, it) => a + it.qty, 0)}</span>
              <button className="sim-mesa-chip__x" onClick={(e) => { e.stopPropagation(); removeMesa(m.id); }}>&times;</button>
            </button>
          ))}
        </div>
        <div className="sim-mesa-bar__add">
          <input type="number" className="sim-mesa-bar__input" value={newMesaNum}
            onChange={(e) => setNewMesaNum(e.target.value)}
            placeholder={`Mesa ${mesas.length + 1}`} min="1"
            onKeyDown={(e) => e.key === "Enter" && addMesa()} />
          <button className="sim-btn-primary" onClick={addMesa}>+ Mesa</button>
        </div>
      </div>

      {/* ══ MESA ACTIVA: opciones ══ */}
      {mesaActiva && (
        <div className="sim-mesa-options">
          <label className="sim-checkbox">
            <input type="checkbox" checked={mesaActiva.todoJunto} onChange={() => toggleTodoJunto(activeMesa)} />
            Servir todo junto
          </label>
          <span className="sim-mesa-options__count">{totalItemsMesa} plato{totalItemsMesa !== 1 ? "s" : ""}</span>
        </div>
      )}

      {!mesas.length && (
        <div className="sim-empty">
          Abre una mesa para empezar a simular. Agrega platos, ajusta la capacidad de tus estaciones y observa como responde tu cocina.
        </div>
      )}

      {/* ══ LAYOUT: Picker + Staging ══ */}
      {mesaActiva && (
        <div className="sim-layout">
          {/* ── PICKER ── */}
          <div className="sim-picker">
            <div className="sim-picker__head">
              <input ref={searchRef} type="text" className="sim-search"
                placeholder="Buscar plato..." value={search}
                onChange={(e) => setSearch(e.target.value)} />
            </div>

            {/* Filtros estacion + seccion */}
            <div className="sim-picker__filters">
              <button className={`sim-pill ${filterStation === "__all__" ? "sim-pill--on" : ""}`}
                onClick={() => setFilterStation("__all__")}>Todas</button>
              {estaciones.filter((e) => e.destino === "cocina" || e.destino === "barra").map((e) => (
                <button key={e.slug} className={`sim-pill ${filterStation === e.slug ? "sim-pill--on" : ""}`}
                  onClick={() => setFilterStation(e.slug)}>
                  {ICONS[e.destino] || ""} {e.nombre}
                </button>
              ))}
            </div>
            {seccionesDisponibles.length > 1 && (
              <div className="sim-picker__filters sim-picker__filters--sec">
                <button className={`sim-pill sim-pill--sec ${filterSeccion === "__all__" ? "sim-pill--on" : ""}`}
                  onClick={() => setFilterSeccion("__all__")}>Todas</button>
                {seccionesDisponibles.map((s) => (
                  <button key={s.slug} className={`sim-pill sim-pill--sec ${filterSeccion === s.slug ? "sim-pill--on" : ""}`}
                    onClick={() => setFilterSeccion(s.slug)}>{s.nombre}</button>
                ))}
              </div>
            )}

            {/* Grid agrupado por seccion */}
            <div className="sim-picker__body">
              {groupedBySeccion.map(([secSlug, prods]) => {
                const sec = seccionMap.get(secSlug);
                return (
                  <div key={secSlug} className="sim-sec-group">
                    <div className="sim-sec-group__head">
                      <span className="sim-sec-group__name">{sec?.nombre || "Sin seccion"}</span>
                      <span className="sim-sec-group__order">Prioridad {(sec?.index ?? 999) + 1}</span>
                    </div>
                    <div className="sim-sec-group__grid">
                      {prods.map((p) => {
                        const inCarrito = carrito.find((c) => c.pid === p._id);
                        const t = num(drafts[p._id]?.slaDefaultMinutos, 0);
                        const pp = perfilByProduct?.get(p._id);
                        return (
                          <button key={p._id} className={`sim-prod ${inCarrito ? "sim-prod--in" : ""}`}
                            onClick={() => addToCarrito(p._id)}>
                            <span className="sim-prod__name">{p.nombre}</span>
                            <span className="sim-prod__meta">
                              {t > 0 ? `${t}m` : "sin tiempo"}
                              {pp && pp.muestrasValidas >= 60 ? ` · ~${Math.round(pp.p50Seg / 60)}m real` : ""}
                            </span>
                            {inCarrito && <span className="sim-prod__qty">x{inCarrito.qty}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {!filteredProducts.length && (
                <div className="sim-picker__empty">No hay platos con estos filtros.</div>
              )}
            </div>
          </div>

          {/* ── STAGING (carrito con drag & drop entre secciones) ── */}
          <div className="sim-staging">
            <div className="sim-staging__head">
              <span>Pedido Mesa {mesaActiva.numero}</span>
              {carrito.length > 0 && (
                <button className="sim-staging__clear" onClick={clearCarrito}>Limpiar</button>
              )}
            </div>

            {!carrito.length ? (
              <div className="sim-staging__empty">Haz click en los platos de la izquierda para agregar al pedido.</div>
            ) : (
              <>
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="sim-staging__body">
                    {carrito.length > 0 && <div className="sim-staging__drag-hint">Arrastra platos entre secciones para cambiar su prioridad</div>}
                    {carritoBySeccion.map(([secSlug, items]) => {
                      const sec = seccionMap.get(secSlug);
                      const hasItems = items.length > 0;
                      return (
                        <Droppable droppableId={secSlug} key={secSlug}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`sim-staging__sec ${snapshot.isDraggingOver ? "sim-staging__sec--over" : ""} ${!hasItems ? "sim-staging__sec--empty-drop" : ""}`}
                            >
                              <div className="sim-staging__sec-name">
                                {sec?.nombre || "Sin seccion"}
                                <span className="sim-staging__sec-pri">Prio {(sec?.index ?? 999) + 1}</span>
                              </div>
                              {items.map((c, idx) => {
                                const isOverridden = !!c.seccionOverride;
                                return (
                                  <Draggable key={c.pid} draggableId={c.pid} index={idx}>
                                    {(dragProvided, dragSnapshot) => (
                                      <div
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        {...dragProvided.dragHandleProps}
                                        className={`sim-staging__item ${dragSnapshot.isDragging ? "sim-staging__item--dragging" : ""} ${isOverridden ? "sim-staging__item--moved" : ""}`}
                                      >
                                        <div className="sim-staging__item-left">
                                          <span className="sim-staging__item-grip">&#8942;&#8942;</span>
                                          <span className="sim-staging__item-name">{c.prod.nombre}</span>
                                          {isOverridden && <span className="sim-staging__item-badge">movido</span>}
                                        </div>
                                        <div className="sim-staging__item-controls">
                                          <button className="sim-qty-btn" onClick={() => updateCarritoQty(c.pid, c.qty - 1)}>-</button>
                                          <span className="sim-staging__item-qty">{c.qty}</span>
                                          <button className="sim-qty-btn" onClick={() => updateCarritoQty(c.pid, c.qty + 1)}>+</button>
                                          <button className="sim-staging__item-rm" onClick={() => removeFromCarrito(c.pid)}>&times;</button>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                              {!hasItems && !snapshot.isDraggingOver && (
                                <div className="sim-staging__sec-drop-hint">Suelta aqui</div>
                              )}
                            </div>
                          )}
                        </Droppable>
                      );
                    })}
                  </div>
                </DragDropContext>
                <button className="sim-btn-primary sim-staging__send" onClick={sendToMesa}>
                  Enviar a Mesa {mesaActiva.numero}
                </button>
              </>
            )}

            {/* Items ya en la mesa */}
            {mesaActiva.items.length > 0 && (
              <div className="sim-staging__existing">
                <div className="sim-staging__existing-title">En la mesa</div>
                {mesaActiva.items.map((it) => {
                  const p = productos.find((pr) => pr._id === it.pid);
                  const effectiveSec = it.seccionOverride || p?.seccion || "";
                  const sec = seccionMap.get(effectiveSec);
                  const isOverridden = !!it.seccionOverride;
                  return (
                    <div key={it.pid} className={`sim-staging__item sim-staging__item--sent ${isOverridden ? "sim-staging__item--moved" : ""}`}>
                      <div className="sim-staging__item-left">
                        <span className="sim-staging__item-name">{p?.nombre}</span>
                        {sec && <span className="sim-staging__item-sec">{sec.nombre}</span>}
                        {isOverridden && <span className="sim-staging__item-badge">movido</span>}
                      </div>
                      <div className="sim-staging__item-controls">
                        <span className="sim-staging__item-qty">x{it.qty}</span>
                        <button className="sim-staging__item-rm" onClick={() => removeItemFromMesa(activeMesa, it.pid)}>&times;</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ STATION OVERRIDES ══ */}
      {mesas.some((m) => m.items.length > 0) && (
        <div className="sim-overrides">
          <div className="sim-overrides__head">
            <span>Ajustar estaciones</span>
            <span className="sim-overrides__hint">Modifica workers y capacidad para ver como afecta a los tiempos</span>
          </div>
          <div className="sim-overrides__grid">
            {estaciones.filter((e) => e.destino === "cocina" || e.destino === "barra").map((est) => {
              const capE = est.capacidadEspacio ?? est.capacidadMax ?? 5;
              const capA = est.capacidadAccion ?? est.capacidadMax ?? 5;
              const wk = est.workersActivos ?? 1;
              return (
                <div key={est.slug} className="sim-override-card">
                  <div className="sim-override-card__name">{ICONS[est.destino] || ""} {est.nombre}</div>
                  <div className="sim-override-card__fields">
                    <label>
                      <span>Cocineros</span>
                      <input type="number" min="1" max="20"
                        placeholder={String(wk)}
                        value={getOverride(est.slug, "workers") ?? ""}
                        onChange={(e) => setOverride(est.slug, "workers", e.target.value)} />
                    </label>
                    <label>
                      <span>Fuegos</span>
                      <input type="number" min="1" max="30"
                        placeholder={String(capE)}
                        value={getOverride(est.slug, "capacidadEspacio") ?? ""}
                        onChange={(e) => setOverride(est.slug, "capacidadEspacio", e.target.value)} />
                    </label>
                    <label>
                      <span>Platos/cocinero</span>
                      <input type="number" min="1" max="20"
                        placeholder={String(capA)}
                        value={getOverride(est.slug, "capacidadAccion") ?? ""}
                        onChange={(e) => setOverride(est.slug, "capacidadAccion", e.target.value)} />
                    </label>
                  </div>
                  <div className="sim-override-card__cap">
                    Capacidad efectiva: <strong>{
                      Math.min(
                        num(getOverride(est.slug, "capacidadEspacio"), capE),
                        num(getOverride(est.slug, "workers"), wk) * num(getOverride(est.slug, "capacidadAccion"), capA)
                      )
                    } simultaneos</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ RESULTADOS ══ */}
      {simulating && <div className="sim-empty">Simulando...</div>}

      {simResult && !simulating && (
        <div className="sim-results">
          {/* Gantt por estacion */}
          {simResult.estaciones?.map((est) => {
            if (!est.scheduled?.length) return null;
            const maxMin = Math.max(1, ...est.scheduled.map((s) => s.etaMin));

            return (
              <div key={est.slug} className="sim-gantt">
                <div className="sim-gantt__head">
                  <span>{ICONS[est.destino] || ""} {est.nombre}</span>
                  <span className="sim-gantt__cap">{est.capacidad} simultaneos</span>
                </div>

                <div className="sim-gantt__chart">
                  <div className="sim-gantt__axis">
                    {Array.from({ length: Math.min(Math.ceil(maxMin / 5) + 1, 20) }).map((_, i) => {
                      const m = i * 5;
                      if (m > maxMin * 1.1) return null;
                      return <span key={m} className="sim-gantt__tick" style={{ left: `${maxMin > 0 ? (m / maxMin) * 100 : 0}%` }}>{m}m</span>;
                    })}
                  </div>
                  <div className="sim-gantt__bars">
                    {est.scheduled.map((s, idx) => {
                      const startMin = (s.startAtMs - simResult.nowMs) / 60000;
                      const left = maxMin > 0 ? (startMin / maxMin) * 100 : 0;
                      const width = maxMin > 0 ? (s.durMin / maxMin) * 100 : 100;
                      const mesaIdx = mesas.findIndex((m) => m.numero === s.mesa);
                      const color = MESA_COLORS[(mesaIdx >= 0 ? mesaIdx : idx) % MESA_COLORS.length];
                      return (
                        <div key={s.id} className="sim-gantt__bar"
                          style={{ left: `${Math.max(0, left)}%`, width: `${Math.max(width, 4)}%`, borderColor: color, background: `${color}22` }}>
                          <span className="sim-gantt__bar-mesa" style={{ background: color }}>M{s.mesa}</span>
                          <span className="sim-gantt__bar-name">{s.nombre}{s.cantidad > 1 ? ` x${s.cantidad}` : ""}</span>
                          <span className="sim-gantt__bar-time">{s.durMin}m {s.source !== "config" ? `(${s.source === "learned" ? "real" : "parcial"})` : ""}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="sim-gantt__summary">
                  <div className="sim-gantt__card"><span>Capacidad</span><strong>{est.capacidad}</strong></div>
                  <div className="sim-gantt__card sim-gantt__card--green"><span>Primer plato</span><strong>~{Math.round((est.firstFinishMs - simResult.nowMs) / 60000)}m</strong></div>
                  <div className="sim-gantt__card sim-gantt__card--purple"><span>Todo listo</span><strong>~{Math.round((est.maxFinishMs - simResult.nowMs) / 60000)}m</strong></div>
                </div>
              </div>
            );
          })}

          {/* Resumen por mesa */}
          {simResult.mesas?.length > 0 && (
            <div className="sim-mesa-results">
              {simResult.mesas.map((m, i) => (
                <div key={m.numero} className="sim-mesa-result" style={{ borderLeftColor: MESA_COLORS[i % MESA_COLORS.length] }}>
                  <span className="sim-mesa-result__label">Mesa {m.numero} {m.todoJunto ? "(junto)" : ""}</span>
                  <span className="sim-mesa-result__eta">~{m.etaMesaMin}m</span>
                  <span className="sim-mesa-result__source">
                    {m.avgConfidence > 0.5 ? "Datos reales" : m.avgConfidence > 0 ? "Datos parciales" : "Tiempos configurados"}
                    {m.avgConfidence > 0 ? ` · ${Math.round(m.avgConfidence * 100)}%` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
