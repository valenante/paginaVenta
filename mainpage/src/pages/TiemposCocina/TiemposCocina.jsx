import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import AlertaMensaje from "../../components/AlertaMensaje/AlertaMensaje";
import EtaPerfiles from "./EtaPerfiles";
import EtaSimulador from "./EtaSimulador";
import "./TiemposCocina.v2.css";

const num = (v, fb) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : fb; };
const MAX_BAR = 25;
const barClass = (m) => (m <= 6 ? "tc-bar__fill--fast" : m <= 14 ? "tc-bar__fill--med" : "tc-bar__fill--slow");
const ICONS = { cocina: "\u{1F525}", barra: "\u{1F378}", "": "\u{1F4E6}" };

export default function TiemposCocina() {
  const [productos, setProductos] = useState([]);
  const [estaciones, setEstaciones] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [originals, setOriginals] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [activeStation, setActiveStation] = useState("__all__");

  const [mode, setMode] = useState("config");

  // SLA config
  const [slaConfig, setSlaConfig] = useState(null);
  const [slaOriginal, setSlaOriginal] = useState(null);
  const [savingSla, setSavingSla] = useState(false);

  // Perfiles aprendidos (se cargan al montar)
  const [perfiles, setPerfiles] = useState(null);
  const [cocinaActiva, setCocinaActiva] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  // ── Load ──
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [prodRes, estRes, cfgRes, perfilesRes] = await Promise.all([
          api.get("/productos?limit=500"),
          api.get("/estaciones?includeInactive=0"),
          api.get("/configuracion").catch(() => ({ data: {} })),
          api.get("/admin/eta/profiles").catch(() => ({ data: null })),
        ]);
        if (cancel) return;
        const prods = prodRes?.data?.items || prodRes?.data || [];
        const ests = estRes?.data?.items || estRes?.data || [];
        setProductos(prods);
        setEstaciones(ests);
        setCategorias([...new Set(prods.map((p) => p.categoria).filter(Boolean))].sort());

        const d = {}, o = {};
        for (const p of prods) {
          const sla = p.slaDefaultMinutos != null ? String(p.slaDefaultMinutos) : "";
          const carga = String(p.cargaEstacion ?? 1);
          const textra = p.tiempoExtraUnidadMin != null ? String(p.tiempoExtraUnidadMin) : "0";
          d[p._id] = { slaDefaultMinutos: sla, cargaEstacion: carga, tiempoExtraUnidadMin: textra };
          o[p._id] = { slaDefaultMinutos: sla, cargaEstacion: carga, tiempoExtraUnidadMin: textra, estacion: p.estacion || "" };
        }
        setDrafts(d);
        setOriginals(o);

        const cfgObj = cfgRes?.data?.config || cfgRes?.data?.data?.config || cfgRes?.data || {};
        setCocinaActiva(!!cfgObj?.pantallas?.cocina?.activa);

        const sla = cfgObj?.slaMesas || {};
        const slaInit = {
          activo: sla.activo ?? true,
          umbralAbsolutoMin: sla.umbralAbsolutoMin ?? 25,
          porcentajeAvisoRiesgo: sla.porcentajeAvisoRiesgo ?? 80,
          margenGraciaSegundos: sla.margenGraciaSegundos ?? 60,
          proximosMax: sla.proximosMax ?? 3,
        };
        setSlaConfig(slaInit);
        setSlaOriginal(JSON.stringify(slaInit));

        if (perfilesRes?.data) setPerfiles(perfilesRes.data);
      } catch { setMsg({ tipo: "error", texto: "Error cargando datos." }); }
      finally { if (!cancel) setLoading(false); }
    })();
    return () => { cancel = true; };
  }, []);

  // ── Helpers ──
  const updateDraft = useCallback((id, field, val) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  }, []);

  const changedIds = useMemo(() => {
    const s = new Set();
    if (!originals) return s;
    for (const p of productos) {
      const d = drafts[p._id], o = originals[p._id];
      if (!d || !o) continue;
      if (d.slaDefaultMinutos !== o.slaDefaultMinutos) s.add(p._id);
      else if (d.cargaEstacion !== o.cargaEstacion) s.add(p._id);
      else if (d.tiempoExtraUnidadMin !== o.tiempoExtraUnidadMin) s.add(p._id);
      if (d._estacionChanged !== undefined && d._estacionChanged !== o.estacion) s.add(p._id);
    }
    return s;
  }, [productos, drafts, originals]);

  const stationMap = useMemo(() => {
    const map = new Map();
    for (const e of estaciones) map.set(e.slug, { estacion: e, productos: [] });
    const noSt = [];
    for (const p of productos) {
      const slug = p.estacion || "";
      if (map.has(slug)) map.get(slug).productos.push(p);
      else noSt.push(p);
    }
    if (noSt.length) map.set("__none__", { estacion: { _id: "", nombre: "Sin estacion", slug: "__none__", destino: "", capacidadMax: 0 }, productos: noSt });
    return map;
  }, [estaciones, productos]);

  const stats = useMemo(() => {
    let total = 0, configured = 0, learned = 0;
    for (const p of productos) {
      if (p.tipo === "bebida") continue;
      total++;
      if (drafts[p._id]?.slaDefaultMinutos !== "") configured++;
    }
    if (perfiles?.productProfiles) {
      learned = new Set(perfiles.productProfiles.filter((pp) => pp.muestrasValidas >= 60).map((pp) => String(pp.productoId))).size;
    }
    return { total, configured, missing: total - configured, learned };
  }, [productos, drafts, perfiles]);

  // ── Perfil por producto (para badges) ──
  const perfilByProduct = useMemo(() => {
    const map = new Map();
    if (!perfiles?.productProfiles) return map;
    for (const pp of perfiles.productProfiles) {
      const key = String(pp.productoId);
      const existing = map.get(key);
      if (!existing || pp.muestrasValidas > existing.muestrasValidas) {
        map.set(key, pp);
      }
    }
    return map;
  }, [perfiles]);

  // ── Save productos ──
  const handleSave = async () => {
    const toSave = productos.filter((p) => changedIds.has(p._id));
    if (!toSave.length) return;
    setSaving(true); setMsg(null);
    let ok = 0, fail = 0;
    for (const p of toSave) {
      const d = drafts[p._id];
      const slaVal = Number(d.slaDefaultMinutos), cargaVal = Number(d.cargaEstacion), textraVal = Number(d.tiempoExtraUnidadMin);
      try {
        const payload = {
          slaDefaultMinutos: Number.isFinite(slaVal) && slaVal > 0 ? slaVal : null,
          cargaEstacion: Number.isFinite(cargaVal) && cargaVal >= 1 ? cargaVal : 1,
          tiempoExtraUnidadMin: Number.isFinite(textraVal) && textraVal >= 0 ? textraVal : 0,
        };
        if (d._estacionChanged !== undefined) payload.estacion = d._estacionChanged;
        await api.put(`/productos/${p._id}`, payload);
        ok++;
      } catch { fail++; }
    }
    if (ok > 0) {
      setOriginals((prev) => {
        const next = { ...prev };
        for (const p of toSave) { const d = drafts[p._id]; if (d) next[p._id] = { slaDefaultMinutos: d.slaDefaultMinutos, cargaEstacion: d.cargaEstacion, tiempoExtraUnidadMin: d.tiempoExtraUnidadMin, estacion: d._estacionChanged ?? prev[p._id]?.estacion ?? "" }; }
        return next;
      });
    }
    setSaving(false);
    setMsg(fail ? { tipo: "error", texto: `${ok} guardados, ${fail} con error.` } : { tipo: "ok", texto: `${ok} producto${ok > 1 ? "s" : ""} actualizado${ok > 1 ? "s" : ""}.` });
  };

  // ── SLA helpers ──
  const updateSla = (key, val) => setSlaConfig((prev) => ({ ...prev, [key]: val }));
  const slaHasChanges = slaConfig && slaOriginal && JSON.stringify(slaConfig) !== slaOriginal;
  const clamp = (val, min, max) => { const n = Number(val); return Number.isNaN(n) ? min : Math.min(max, Math.max(min, Math.trunc(n))); };

  const handleSaveSla = async () => {
    if (!slaConfig) return;
    setSavingSla(true);
    try {
      const { data: draft } = await api.post("/admin/config/versions", {
        patch: { slaMesas: slaConfig },
        scope: "sla_config",
        reason: "Actualizar configuracion SLA desde Tiempos cocina",
      });
      const versionId = draft?.version?.id || draft?.versionId || draft?.id;
      if (versionId) await api.post(`/admin/config/versions/${versionId}/apply`, { reason: "Aplicar SLA" });
      setSlaOriginal(JSON.stringify(slaConfig));
      setMsg({ tipo: "ok", texto: "Configuracion de alertas guardada." });
    } catch {
      setMsg({ tipo: "error", texto: "Error guardando configuracion de alertas." });
    } finally { setSavingSla(false); }
  };

  const refreshPerfiles = useCallback(async () => {
    try {
      const res = await api.get("/admin/eta/profiles");
      if (res?.data) setPerfiles(res.data);
    } catch { /* silent */ }
  }, []);

  if (loading) return <div className="tc-root"><div className="tc-loading">Cargando...</div></div>;

  return (
    <div className="tc-root">
      <header className="tc-header">
        <div className="tc-header__top">
          <div>
            <h2>Tiempos de cocina</h2>
            <p>Configura cuanto tarda cada plato y simula pedidos reales con el motor adaptativo de Alef.</p>
          </div>
          <div className="tc-header__actions">
            <button className="tc-help-btn" onClick={() => setShowHelp(true)} title="Como funciona">?</button>
            <div className="tc-mode-toggle">
              <button className={mode === "config" ? "tc-mode--on" : ""} onClick={() => setMode("config")}>Tiempos</button>
              <button className={mode === "sim" ? "tc-mode--on" : ""} onClick={() => setMode("sim")}>Simulador</button>
              <button className={mode === "alertas" ? "tc-mode--on" : ""} onClick={() => setMode("alertas")}>Alertas</button>
              <button className={mode === "aprendizaje" ? "tc-mode--on" : ""} onClick={() => setMode("aprendizaje")}>Aprendizaje</button>
            </div>
          </div>
        </div>
      </header>

      {/* ── KPIs ── */}
      <div className="tc-kpis">
        <div className={`tc-kpi ${stats.configured === stats.total ? "tc-kpi--highlight" : ""}`}>
          <span className="tc-kpi__label">Platos</span><span className="tc-kpi__val">{stats.total}</span>
        </div>
        <div className="tc-kpi">
          <span className="tc-kpi__label">Configurados</span><span className={`tc-kpi__val ${stats.configured === stats.total ? "tc-kpi__val--ok" : ""}`}>{stats.configured}</span>
        </div>
        <div className={`tc-kpi ${stats.missing > 0 ? "tc-kpi--alert" : ""}`}>
          <span className="tc-kpi__label">Sin tiempo</span><span className={`tc-kpi__val ${stats.missing > 0 ? "tc-kpi__val--warn" : "tc-kpi__val--ok"}`}>{stats.missing}</span>
        </div>
        <div className="tc-kpi">
          <span className="tc-kpi__label">Aprendidos</span><span className={`tc-kpi__val ${stats.learned > 0 ? "tc-kpi__val--ok" : ""}`}>{stats.learned}</span>
        </div>
      </div>

      {msg && <AlertaMensaje tipo={msg.tipo === "error" ? "error" : "exito"} mensaje={msg.texto} onClose={() => setMsg(null)} />}

      {!cocinaActiva && (
        <div className="tc-cocina-disabled">
          <strong>Pantalla de cocina desactivada</strong>
          <p>El motor adaptativo, las alertas SLA y las predicciones de tiempos necesitan que la pantalla de cocina este activa. Sin ella, los cocineros no pueden marcar platos como "listo" y el sistema no puede aprender.</p>
          <p>Activala en <strong>Configuracion &rarr; Funcionalidades &rarr; Cocina</strong>.</p>
        </div>
      )}

      {/* ── Station tabs ── */}
      <div className="tc-station-tabs">
        <button className={`tc-station-tab ${activeStation === "__all__" ? "tc-station-tab--on" : ""}`} onClick={() => setActiveStation("__all__")}>Todas</button>
        {Array.from(stationMap.entries()).map(([slug, { estacion, productos: prods }]) => {
          if (!prods.length) return null;
          return (
            <button key={slug} className={`tc-station-tab ${activeStation === slug ? "tc-station-tab--on" : ""}`} onClick={() => setActiveStation(slug)}>
              {ICONS[estacion.destino] || "\u{1F4E6}"} {estacion.nombre}
              <span className="tc-station-tab__count">{prods.length}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════
          MODE: SIMULATE
         ══════════════════════════════════════ */}
      {mode === "sim" && (
        <EtaSimulador
          productos={productos}
          estaciones={estaciones}
          drafts={drafts}
          perfilByProduct={perfilByProduct}
        />
      )}

      {/* ══════════════════════════════════════
          MODE: CONFIG
         ══════════════════════════════════════ */}
      {mode === "config" && (
        <>
          {Array.from(stationMap.entries()).map(([slug, { estacion, productos: prods }]) => {
            if (!prods.length) return null;
            if (activeStation !== "__all__" && activeStation !== slug) return null;
            const capE = estacion.capacidadEspacio ?? estacion.capacidadMax ?? 0;
            const capA = estacion.capacidadAccion ?? estacion.capacidadMax ?? 0;
            const wk = estacion.workersActivos ?? 1;
            const cap = capE > 0 && capA > 0 ? Math.min(capE, wk * capA) : (estacion.capacidadMax || 0);
            const stationChanges = prods.filter((p) => changedIds.has(p._id)).length;

            return (
              <div key={slug} className="tc-station">
                <div className="tc-station__head">
                  <div className="tc-station__left">
                    <div className="tc-station__icon">{ICONS[estacion.destino] || "\u{1F4E6}"}</div>
                    <div className="tc-station__info">
                      <span className="tc-station__name">{estacion.nombre}</span>
                      {cap > 0 && <span className="tc-station__cap">{cap} simultaneos</span>}
                    </div>
                  </div>
                </div>

                {stationChanges > 0 && (
                  <div className="tc-station-save">
                    <span>{stationChanges} cambio{stationChanges > 1 ? "s" : ""}</span>
                    <button className="btn-primario" onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar todo"}</button>
                  </div>
                )}

                <div className="tc-cards">
                  {[...prods].sort((a, b) => num(drafts[a._id]?.slaDefaultMinutos, 999) - num(drafts[b._id]?.slaDefaultMinutos, 999)).map((p) => {
                    const d = drafts[p._id] || { slaDefaultMinutos: "", cargaEstacion: "1", tiempoExtraUnidadMin: "0" };
                    const t = num(d.slaDefaultMinutos, 0);
                    const empty = d.slaDefaultMinutos === "";
                    const changed = changedIds.has(p._id);
                    const pct = t > 0 ? Math.min(100, (t / MAX_BAR) * 100) : 0;
                    const pp = perfilByProduct.get(p._id);

                    return (
                      <div key={p._id} className={`tc-card ${changed ? "tc-card--changed" : ""} ${empty ? "tc-card--empty" : ""}`}>
                        <div className="tc-card__bar"><div className={`tc-card__bar-fill ${barClass(t)}`} style={{ width: `${pct}%` }} /></div>
                        <div className="tc-card__name">{p.nombre}</div>
                        <div className="tc-card__tipo">
                          {p.tipo}
                          {pp && pp.muestrasValidas >= 60
                            ? <span className="tc-card__badge tc-card__badge--ok" title={`${pp.muestrasValidas} muestras — dato real de tu cocina`}>
                                real ~{Math.round(pp.p50Seg / 60)}m
                              </span>
                            : pp && pp.muestrasValidas > 0
                            ? <span className="tc-card__badge tc-card__badge--learning" title={`${pp.muestrasValidas} muestras — aun aprendiendo`}>
                                {pp.muestrasValidas} platos
                              </span>
                            : null
                          }
                        </div>
                        <div className="tc-card__time-row">
                          <label className="tc-card__time-field">
                            <input type="number" className={`tc-inp tc-inp--big ${empty ? "tc-inp--empty" : ""}`} value={d.slaDefaultMinutos}
                              onChange={(e) => updateDraft(p._id, "slaDefaultMinutos", e.target.value)} min="0" max="120" placeholder="-" />
                            <span>min</span>
                          </label>
                        </div>
                        <div className="tc-card__details">
                          <label className="tc-card__detail" title="Cuantos fuegos/puestos de la estacion ocupa este plato">
                            <span className="tc-card__detail-val">{d.cargaEstacion || "1"}</span>
                            <span className="tc-card__detail-label">{Number(d.cargaEstacion || 1) === 1 ? "puesto" : "puestos"}</span>
                            <input type="number" className="tc-inp-hidden" value={d.cargaEstacion}
                              onChange={(e) => updateDraft(p._id, "cargaEstacion", e.target.value)} min="1" max="20" placeholder="1" />
                          </label>
                          {Number(d.tiempoExtraUnidadMin || 0) > 0 && (
                            <span className="tc-card__detail-extra" title="Si piden 2 del mismo plato, el segundo tarda este extra">
                              +{d.tiempoExtraUnidadMin}m por ud extra
                            </span>
                          )}
                          <select className="tc-sel" value={p.estacion || ""} onChange={(e) => {
                            setProductos((prev) => prev.map((pr) => pr._id === p._id ? { ...pr, estacion: e.target.value } : pr));
                            setDrafts((prev) => ({ ...prev, [p._id]: { ...prev[p._id], _estacionChanged: e.target.value } }));
                          }}>
                            <option value="">Sin estacion</option>
                            {estaciones.map((est) => <option key={est._id} value={est.slug}>{est.nombre}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ══════════════════════════════════════
          MODE: ALERTAS (SLA CONFIG)
         ══════════════════════════════════════ */}
      {mode === "alertas" && slaConfig && (
        <div className="tc-sla-panel">
          <div className="tc-sla-card">
            <div className="tc-sla-card__head">
              <h3>Alertas de servicio</h3>
              <p>El sistema monitoriza cada mesa y te avisa si un plato se retrasa. A medida que tu cocina trabaja, el motor aprende y las predicciones mejoran solas.</p>
            </div>

            <div className="tc-sla-toggle">
              <label>
                <input type="checkbox" checked={!!slaConfig.activo} onChange={(e) => updateSla("activo", e.target.checked)} />
                <div>
                  <strong>Activar alertas de servicio</strong>
                  <span>Si lo desactivas no se mostraran alertas de retraso ni predicciones en el dashboard.</span>
                </div>
              </label>
            </div>

            {slaConfig.activo && (
              <div className="tc-sla-grid">
                <div className="tc-sla-field">
                  <label>Limite maximo de espera (min)</label>
                  <input type="number" value={slaConfig.umbralAbsolutoMin} min="5" max="120"
                    onChange={(e) => updateSla("umbralAbsolutoMin", clamp(e.target.value, 5, 120))} />
                  <span>Si una mesa supera este tiempo sin recibir un plato, se marca como retraso. Es el techo duro independiente de la prediccion.</span>
                </div>

                <div className="tc-sla-field">
                  <label>Margen de gracia (seg)</label>
                  <input type="number" value={slaConfig.margenGraciaSegundos} min="0" max="300"
                    onChange={(e) => updateSla("margenGraciaSegundos", clamp(e.target.value, 0, 300))} />
                  <span>Segundos que espera antes de empezar a contar. Evita alertas justo al entrar el pedido.</span>
                </div>

                <div className="tc-sla-field">
                  <label>Aviso "en riesgo" al (%)</label>
                  <input type="number" value={slaConfig.porcentajeAvisoRiesgo} min="50" max="99"
                    onChange={(e) => updateSla("porcentajeAvisoRiesgo", clamp(e.target.value, 50, 99))} />
                  <span>La mesa se marca amarilla cuando el tiempo alcanza este % del estimado. Al 100% pasa a rojo.</span>
                </div>

                <div className="tc-sla-field">
                  <label>Proximos en salir por mesa</label>
                  <input type="number" value={slaConfig.proximosMax} min="1" max="10"
                    onChange={(e) => updateSla("proximosMax", clamp(e.target.value, 1, 10))} />
                  <span>Cuantos platos muestra el panel de "Proximos" por cada mesa.</span>
                </div>
              </div>
            )}

            {slaHasChanges && (
              <div className="tc-sla-actions">
                <button className="btn-secundario" onClick={() => setSlaConfig(JSON.parse(slaOriginal))} disabled={savingSla}>Descartar</button>
                <button className="btn-primario" onClick={handleSaveSla} disabled={savingSla}>{savingSla ? "Guardando..." : "Guardar alertas"}</button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════
          MODE: APRENDIZAJE
         ══════════════════════════════════════ */}
      {mode === "aprendizaje" && (
        <EtaPerfiles perfiles={perfiles} onRefresh={refreshPerfiles} />
      )}

      {/* ══════════════════════════════════════
          MODAL AYUDA
         ══════════════════════════════════════ */}
      {showHelp && (
        <div className="tc-help-overlay" onClick={() => setShowHelp(false)}>
          <div className="tc-help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tc-help-modal__head">
              <h3>Como funciona</h3>
              <button className="tc-help-modal__close" onClick={() => setShowHelp(false)}>&times;</button>
            </div>
            <div className="tc-help-modal__body">
              <section>
                <h4>Tiempos</h4>
                <p>Cada plato tiene un <strong>tiempo estimado en minutos</strong> — cuanto tarda en estar listo desde que entra en cocina. Este es el dato base que usa el sistema para calcular todo lo demas.</p>
                <dl>
                  <dt>Tiempo (min)</dt>
                  <dd>Cuantos minutos tarda este plato en prepararse. Es el dato mas importante.</dd>
                  <dt>Puestos</dt>
                  <dd>Cuantos fuegos o huecos de la estacion ocupa este plato mientras se prepara. Una paella puede ocupar 2 fuegos, una croqueta solo 1. Si la estacion tiene 4 fuegos y el plato ocupa 2, solo caben 2 de este plato a la vez.</dd>
                  <dt>Extra por unidad</dt>
                  <dd>Si un cliente pide 3 del mismo plato, el primero tarda el tiempo normal. Cada unidad extra suma estos minutos adicionales. Ejemplo: una hamburguesa tarda 8 min, pero si piden 3, la segunda y tercera suman 2 min extra cada una (8 + 2 + 2 = 12 min total).</dd>
                  <dt>Estacion</dt>
                  <dd>A que zona de la cocina pertenece este plato (frio, frito, plancha, barra...). Cada estacion tiene una capacidad limitada.</dd>
                </dl>
              </section>

              <section>
                <h4>Simulador</h4>
                <p>Monta pedidos ficticios para ver como responderia tu cocina. Puedes abrir varias mesas, agregar platos, y el motor calcula cuanto tardaria cada uno teniendo en cuenta la capacidad real de cada estacion.</p>
                <p>Tambien puedes <strong>ajustar los cocineros y la capacidad</strong> de cada estacion para ver que pasa si contratas mas personal o reduces fuegos.</p>
              </section>

              <section>
                <h4>Secciones y prioridad</h4>
                <p>Los platos se agrupan por secciones (Entrantes, Medio, Final). La cocina <strong>prioriza las secciones por orden</strong> — los entrantes se preparan antes que los finales aunque entren al mismo tiempo.</p>
                <p>Puedes marcar una seccion como <strong>"Junto"</strong> al hacer un pedido. Eso significa que todos los platos de esa seccion se sirven a la vez — el camarero espera a que esten todos listos.</p>
              </section>

              <section>
                <h4>Alertas</h4>
                <p>El sistema vigila cada mesa abierta. Si un plato tarda mas de lo esperado, la mesa se marca <strong>amarilla</strong> (en riesgo) y luego <strong>roja</strong> (retraso). Puedes configurar los umbrales.</p>
              </section>

              <section>
                <h4>Aprendizaje</h4>
                <p>Cada vez que un cocinero marca un plato como "listo", Alef mide cuanto tardo realmente. Con el tiempo, las predicciones dejan de usar los tiempos que configuraste aqui y empiezan a usar <strong>datos reales de tu cocina</strong>.</p>
                <p>El aprendizaje es gradual y nunca se detiene. Las primeras muestras apenas pesan — necesita <strong>unas 60 para empezar a influir</strong> y cerca de <strong>1000 para maxima fiabilidad</strong> (95%). Siempre mantiene un 5% del tiempo que configuraste como red de seguridad.</p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
