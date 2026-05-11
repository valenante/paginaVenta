import React, { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import {
  useSugerenciasConfig,
  useSugerenciasStats,
  updateSugerenciasConfig,
  autoDetectFases,
  crearRegla,
  actualizarRegla,
  eliminarRegla,
  toggleRegla,
} from "../hooks/useSugerenciasConfig";
import "./SugerenciasConfigPage.css";

const TABS = [
  {
    key: "general",
    label: "General",
    help: {
      titulo: "Configuración general",
      texto: "Activa o desactiva las sugerencias inteligentes y elige donde se muestran.\n\n" +
        "- **En el carrito**: el cliente ve sugerencias antes de enviar su pedido. Es el momento de mayor impacto.\n" +
        "- **Post-pedido**: después de enviar, un toast sutil sugiere postres, café o copa. Auto-desaparece en 12 segundos.\n" +
        "- **Detalle de producto**: al abrir la ficha de un producto, muestra 1-2 productos que \"van bien con\" ese plato.\n\n" +
        "El **filtro de alérgenos** es crítico: si un cliente declara alergias al entrar a la mesa, el sistema NUNCA le sugerirá un producto con ese alérgeno. Si activas \"incluir trazas\", también filtra productos que pueden contener trazas.",
    },
  },
  {
    key: "fases",
    label: "Flujo de comida",
    help: {
      titulo: "Flujo de comida",
      texto: "Esta es la señal más potente del motor. Funciona desde el día 1 sin necesitar datos históricos.\n\n" +
        "**Como funciona:** el motor analiza qué tiene el cliente en el carrito y detecta en qué \"fase\" del menú está:\n\n" +
        "Aperitivo → Principal → Bebida → Postre → Cafe/Copa\n\n" +
        "Si el cliente tiene tapas pero no bebida, le sugiere \"Completa con una bebida\". Si tiene plato principal y bebida pero no postre, le sugiere postres.\n\n" +
        "**Que tienes que hacer:** asignar tus categorias reales a cada fase. Usa \"Auto-detectar\" para empezar y luego ajusta manualmente. Las categorias sin asignar (como Extras o Salsas) no se usan para el flujo — es normal dejarlas fuera.",
    },
  },
  {
    key: "pesos",
    label: "Pesos y umbrales",
    help: {
      titulo: "Pesos y umbrales",
      texto: "Controla cuanto influye cada señal en la puntuacion final de las sugerencias.\n\n" +
        "**Señales disponibles:**\n" +
        "- **Flujo de comida** (80): la fase del menu que falta. La más importante.\n" +
        "- **Co-ocurrencia** (70): productos que históricamente se piden juntos. Ej: \"El 77% que pide Patatas Bravas también pide Pan\".\n" +
        "- **Margen** (50): prioriza productos más rentables para ti.\n" +
        "- **Popularidad** (40): lo más vendido en los ultimos 30 dias.\n" +
        "- **Valoraciones** (30): productos mejor puntuados por clientes.\n" +
        "- **Categoria esperada** (20): categorias que aparecen en un % alto de mesas pero faltan en el carrito.\n" +
        "- **Promocion** (15): boost a productos en oferta.\n\n" +
        "**Umbrales:** son los minimos para que una señal se active. Bajarlos = más sugerencias pero menos precision. Subirlos = menos sugerencias pero más relevantes.\n\n" +
        "Si no sabes qué tocar, deja los valores por defecto. Funcionan bien para la mayoría de restaurantes.",
    },
  },
  {
    key: "reglas",
    label: "Reglas fijas",
    help: {
      titulo: "Reglas fijas",
      texto: "Aquí pones tu conocimiento como dueño. Las reglas fijas siempre se aplican por encima del motor automático.\n\n" +
        "**Tipos de regla:**\n\n" +
        "- **Maridaje**: \"Si pide Entrecot → sugerir Ribera del Duero\". Se activa solo cuando el producto trigger está en el carrito.\n" +
        "- **Siempre sugerir**: un producto aparece siempre en sugerencias (si no está agotado ni tiene conflicto de alérgenos). Ideal para tu plato estrella.\n" +
        "- **Nunca sugerir**: bloquea un producto. Ej: el Pan que ya pones gratis en la mesa.\n" +
        "- **Por fase**: cuando falta una fase concreta, sugiere una categoria específica. Ej: \"Si falta postre → sugerir Tartas\".\n" +
        "- **Franja horaria**: sugiere un producto solo en un horario. Ej: \"Mojitos de 17:00 a 20:00 (happy hour)\".\n\n" +
        "La **prioridad** (1-100) determina el orden. Las reglas con prioridad 90+ suelen ganar al motor automático. Puedes pausar una regla sin borrarla.",
    },
  },
];

function HelpModal({ help, onClose }) {
  if (!help) return null;
  return (
    <div className="sug-help-overlay" onClick={onClose}>
      <div className="sug-help-modal" onClick={e => e.stopPropagation()}>
        <div className="sug-help-modal__header">
          <h3>{help.titulo}</h3>
          <button className="sug-help-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="sug-help-modal__body">
          {help.texto.split("\n").map((line, i) => {
            if (!line.trim()) return <br key={i} />;
            // Bold markdown **text**
            const parts = line.split(/\*\*(.*?)\*\*/g);
            return (
              <p key={i} style={{ margin: "2px 0" }}>
                {parts.map((part, j) =>
                  j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                )}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const FASES = [
  { key: "aperitivo", label: "Aperitivo", emoji: "🥗" },
  { key: "principal", label: "Principal", emoji: "🍖" },
  { key: "bebida", label: "Bebida", emoji: "🍺" },
  { key: "postre", label: "Postre", emoji: "🍰" },
  { key: "café", label: "Café / Copa", emoji: "☕" },
];

const TIPO_REGLA_LABELS = {
  maridaje: "Maridaje",
  fase: "Por fase",
  siempre: "Siempre sugerir",
  nunca: "Nunca sugerir",
  franja: "Franja horaria",
};

/* ══════════════════════════════════════════════════════════ */
/*  Tab General                                              */
/* ══════════════════════════════════════════════════════════ */
function TabGeneral({ config, onSave, stats }) {
  const [local, setLocal] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (config) setLocal({
      enabled: config.enabled ?? false,
      touchpoints: config.touchpoints ?? { carrito: true, postPedido: true, detalleProducto: false },
      maxSugerencias: config.maxSugerencias ?? { carrito: 3, postPedido: 2, detalleProducto: 2 },
      filtrarAlergenos: config.filtrarAlergenos ?? true,
      incluirTrazas: config.incluirTrazas ?? true,
    });
  }, [config]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await onSave(local);
      setMsg({ t: "ok", m: "Guardado" });
      setTimeout(() => setMsg(null), 2500);
    } catch { setMsg({ t: "error", m: "Error al guardar" }); }
    finally { setSaving(false); }
  };

  const set = (path, val) => {
    setLocal(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = val;
      return copy;
    });
  };

  return (
    <div className="sug-tab">
      {msg && <div className={`sug-toast sug-toast--${msg.t}`}>{msg.m}</div>}

      {/* Stats badge */}
      {stats?.data && (
        <div className="sug-stats-bar">
          <span>Motor: {stats.data.perfil ? `${stats.data.perfil.totalSesiones} mesas analizadas` : "Sin datos aun"}</span>
          {stats.data.perfil && (
            <>
              <span>{stats.data.perfil.coocurrenciaCount} pares aprendidos</span>
              <span>{stats.data.perfil.categoriasCount} categorias</span>
            </>
          )}
          <span>{stats.data.reglasCount || 0} reglas activas</span>
        </div>
      )}

      {/* Toggle principal */}
      <div className="sug-section">
        <div className="sug-toggle-row">
          <div>
            <span className="sug-toggle-label">Sugerencias inteligentes</span>
            <span className="sug-toggle-desc">
              {local.enabled
                ? "Los clientes reciben sugerencias personalizadas en la carta digital."
                : "Las sugerencias estan desactivadas. Los clientes no veran recomendaciones."}
            </span>
          </div>
          <button
            className={`sug-toggle ${local.enabled ? "sug-toggle--on" : ""}`}
            onClick={() => set("enabled", !local.enabled)}
          >
            <span className="sug-toggle__knob" />
          </button>
        </div>
      </div>

      {local.enabled && (
        <>
          {/* Touchpoints */}
          <div className="sug-section">
            <h3 className="sug-section__title">Donde mostrar sugerencias</h3>
            <div className="sug-checkboxes">
              {[
                { key: "carrito", label: "En el carrito", desc: "Antes de enviar el pedido" },
                { key: "postPedido", label: "Post-pedido", desc: "Después de enviar (postres, café...)" },
                { key: "detalleProducto", label: "Detalle de producto", desc: "\"Va bien con...\" en la ficha" },
              ].map(tp => (
                <label key={tp.key} className={`sug-checkbox ${local.touchpoints?.[tp.key] ? "sug-checkbox--active" : ""}`}>
                  <input
                    type="checkbox"
                    checked={local.touchpoints?.[tp.key] ?? false}
                    onChange={e => set(`touchpoints.${tp.key}`, e.target.checked)}
                  />
                  <div>
                    <span className="sug-checkbox__label">{tp.label}</span>
                    <span className="sug-checkbox__desc">{tp.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Max por touchpoint */}
          <div className="sug-section">
            <h3 className="sug-section__title">Maximo de sugerencias</h3>
            <div className="sug-maxgrid">
              {[
                { key: "carrito", label: "Carrito", max: 5 },
                { key: "postPedido", label: "Post-pedido", max: 3 },
                { key: "detalleProducto", label: "Detalle", max: 3 },
              ].map(s => (
                <div key={s.key} className="sug-max-item">
                  <span>{s.label}</span>
                  <select
                    value={local.maxSugerencias?.[s.key] ?? 3}
                    onChange={e => set(`maxSugerencias.${s.key}`, Number(e.target.value))}
                  >
                    {Array.from({ length: s.max }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Alergenos */}
          <div className="sug-section">
            <h3 className="sug-section__title">Seguridad de alérgenos</h3>
            <div className="sug-checkboxes">
              <label className={`sug-checkbox ${local.filtrarAlergenos ? "sug-checkbox--active" : ""}`}>
                <input type="checkbox" checked={local.filtrarAlergenos ?? true}
                  onChange={e => set("filtrarAlergenos", e.target.checked)} />
                <div>
                  <span className="sug-checkbox__label">Filtrar alérgenos</span>
                  <span className="sug-checkbox__desc">No sugerir productos con alérgenos del cliente</span>
                </div>
              </label>
              <label className={`sug-checkbox ${local.incluirTrazas ? "sug-checkbox--active" : ""}`}>
                <input type="checkbox" checked={local.incluirTrazas ?? true}
                  onChange={e => set("incluirTrazas", e.target.checked)} />
                <div>
                  <span className="sug-checkbox__label">Incluir trazas</span>
                  <span className="sug-checkbox__desc">También filtrar productos con trazas de alérgenos</span>
                </div>
              </label>
            </div>
          </div>
        </>
      )}

      <button className="sug-btn sug-btn--primary" onClick={save} disabled={saving}>
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  Tab Flujo de comida                                      */
/* ══════════════════════════════════════════════════════════ */
function TabFases({ config, onSave }) {
  const [fases, setFases] = useState({
    aperitivo: [], principal: [], bebida: [], postre: [], cafe: [],
  });
  const [categoriasDisp, setCategoriasDisp] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (config?.fasesMenu) {
      setFases(prev => ({ ...prev, ...config.fasesMenu }));
    }
    // Cargar categorias del tenant
    (async () => {
      try {
        const { data } = await api.get("/admin/sugerencias/auto-detect-fases");
        setCategoriasDisp(data.categoriasDisponibles || []);
        // Si no hay fases configuradas, pre-rellenar con auto-detect
        if (!config?.fasesMenu || !Object.values(config.fasesMenu).some(v => v?.length)) {
          setFases(data.fases);
        }
      } catch { /* ignore */ }
    })();
  }, [config]);

  const handleAutoDetect = async () => {
    setDetecting(true);
    try {
      const data = await autoDetectFases();
      setFases(data.fases);
      setCategoriasDisp(data.categoriasDisponibles || []);
      setMsg({ t: "ok", m: "Fases auto-detectadas. Revisa y guarda." });
      setTimeout(() => setMsg(null), 3000);
    } catch { setMsg({ t: "error", m: "Error al auto-detectar" }); }
    finally { setDetecting(false); }
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await onSave({ fasesMenu: fases });
      setMsg({ t: "ok", m: "Fases guardadas" });
      setTimeout(() => setMsg(null), 2500);
    } catch { setMsg({ t: "error", m: "Error al guardar" }); }
    finally { setSaving(false); }
  };

  const addCat = (fase, cat) => {
    setFases(prev => {
      // Quitar de otras fases
      const next = {};
      for (const [f, cats] of Object.entries(prev)) {
        next[f] = cats.filter(c => c !== cat);
      }
      next[fase] = [...(next[fase] || []), cat];
      return next;
    });
  };

  const removeCat = (fase, cat) => {
    setFases(prev => ({
      ...prev,
      [fase]: (prev[fase] || []).filter(c => c !== cat),
    }));
  };

  // Categorias no asignadas
  const asignadas = new Set(Object.values(fases).flat());
  const sinAsignar = categoriasDisp.filter(c => !asignadas.has(c));

  return (
    <div className="sug-tab">
      {msg && <div className={`sug-toast sug-toast--${msg.t}`}>{msg.m}</div>}

      <div className="sug-section">
        <div className="sug-fases-header">
          <div>
            <h3 className="sug-section__title">Asignar categorias a fases del menu</h3>
            <p className="sug-section__desc">
              El motor sugiere la siguiente fase lógica. Asigna tus categorías a cada fase.
            </p>
          </div>
          <button className="sug-btn sug-btn--secondary" onClick={handleAutoDetect} disabled={detecting}>
            {detecting ? "Detectando..." : "Auto-detectar"}
          </button>
        </div>

        <div className="sug-fases-grid">
          {FASES.map(f => (
            <div key={f.key} className="sug-fase-col">
              <div className="sug-fase-col__header">
                <span className="sug-fase-col__emoji">{f.emoji}</span>
                <span className="sug-fase-col__label">{f.label}</span>
              </div>
              <div className="sug-fase-col__cats">
                {(fases[f.key] || []).map(cat => (
                  <span key={cat} className="sug-fase-tag">
                    {cat}
                    <button className="sug-fase-tag__x" onClick={() => removeCat(f.key, cat)}>x</button>
                  </span>
                ))}
                <select
                  className="sug-fase-add"
                  value=""
                  onChange={e => e.target.value && addCat(f.key, e.target.value)}
                >
                  <option value="">+ Anadir...</option>
                  {sinAsignar.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>

        {sinAsignar.length > 0 && (
          <div className="sug-sin-asignar">
            <span className="sug-sin-asignar__label">Sin asignar ({sinAsignar.length}):</span>
            {sinAsignar.map(c => (
              <span key={c} className="sug-fase-tag sug-fase-tag--unassigned">{c}</span>
            ))}
          </div>
        )}
      </div>

      <button className="sug-btn sug-btn--primary" onClick={save} disabled={saving}>
        {saving ? "Guardando..." : "Guardar fases"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  Tab Pesos y umbrales                                     */
/* ══════════════════════════════════════════════════════════ */
function TabPesos({ config, onSave }) {
  const [pesos, setPesos] = useState({
    flujoComida: 80, coocurrencia: 70, margen: 50, popularidad: 40,
    valoraciones: 30, categoriaEsperada: 20, promocion: 15,
  });
  const [umbrales, setUmbrales] = useState({
    minCoocPct: 30, minCoocMuestras: 5, minCatPct: 35, minFreqPct: 40,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (config?.pesos) setPesos(prev => ({ ...prev, ...config.pesos }));
    if (config?.umbrales) setUmbrales(prev => ({ ...prev, ...config.umbrales }));
  }, [config]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await onSave({ pesos, umbrales });
      setMsg({ t: "ok", m: "Guardado" });
      setTimeout(() => setMsg(null), 2500);
    } catch { setMsg({ t: "error", m: "Error al guardar" }); }
    finally { setSaving(false); }
  };

  const resetDefaults = () => {
    setPesos({ flujoComida: 80, coocurrencia: 70, margen: 50, popularidad: 40, valoraciones: 30, categoriaEsperada: 20, promocion: 15 });
    setUmbrales({ minCoocPct: 30, minCoocMuestras: 5, minCatPct: 35, minFreqPct: 40 });
  };

  const PESO_LABELS = {
    flujoComida: { label: "Flujo de comida", desc: "\"Te falta bebida\", \"Algo de postre?\"" },
    coocurrencia: { label: "Co-ocurrencia", desc: "Productos que se piden juntos" },
    margen: { label: "Margen", desc: "Priorizar productos más rentables" },
    popularidad: { label: "Popularidad", desc: "Lo más vendido en los ultimos 30 dias" },
    valoraciones: { label: "Valoraciones", desc: "Productos mejor puntuados" },
    categoriaEsperada: { label: "Categoria esperada", desc: "Categorias frecuentes que faltan" },
    promocion: { label: "Promocion activa", desc: "Boost a productos en oferta" },
  };

  const UMBRAL_LABELS = {
    minCoocPct: { label: "Min % co-ocurrencia", unit: "%", min: 10, max: 80 },
    minCoocMuestras: { label: "Min muestras co-ocurrencia", unit: "", min: 3, max: 50 },
    minCatPct: { label: "Min % presencia categoria", unit: "%", min: 10, max: 80 },
    minFreqPct: { label: "Min % frecuencia horaria", unit: "%", min: 20, max: 80 },
  };

  return (
    <div className="sug-tab">
      {msg && <div className={`sug-toast sug-toast--${msg.t}`}>{msg.m}</div>}

      <div className="sug-section">
        <div className="sug-fases-header">
          <h3 className="sug-section__title">Pesos de señales</h3>
          <button className="sug-btn sug-btn--secondary" onClick={resetDefaults}>Restaurar defaults</button>
        </div>
        <p className="sug-section__desc">Controla cuanto influye cada señal en el score final (0-100).</p>

        <div className="sug-sliders">
          {Object.entries(PESO_LABELS).map(([key, meta]) => (
            <div key={key} className="sug-slider-row">
              <div className="sug-slider-info">
                <span className="sug-slider-label">{meta.label}</span>
                <span className="sug-slider-desc">{meta.desc}</span>
              </div>
              <div className="sug-slider-control">
                <input
                  type="range" min="0" max="100" step="5"
                  value={pesos[key] ?? 50}
                  onChange={e => setPesos(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                />
                <span className="sug-slider-value">{pesos[key]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sug-section">
        <h3 className="sug-section__title">Umbrales</h3>
        <p className="sug-section__desc">Minimos para que una señal se active. Mas bajo = más sugerencias.</p>

        <div className="sug-umbrales-grid">
          {Object.entries(UMBRAL_LABELS).map(([key, meta]) => (
            <div key={key} className="sug-umbral-item">
              <span className="sug-umbral-label">{meta.label}</span>
              <div className="sug-umbral-input">
                <input
                  type="number" min={meta.min} max={meta.max}
                  value={umbrales[key] ?? meta.min}
                  onChange={e => setUmbrales(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                />
                {meta.unit && <span className="sug-umbral-unit">{meta.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="sug-btn sug-btn--primary" onClick={save} disabled={saving}>
        {saving ? "Guardando..." : "Guardar pesos y umbrales"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  Tab Reglas fijas                                         */
/* ══════════════════════════════════════════════════════════ */
function TabReglas({ config, onSave }) {
  const reglas = config?.reglas || [];
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ tipo: "maridaje", prioridad: 90, activa: true });
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [buscarOrigen, setBuscarOrigen] = useState("");
  const [buscarSugerido, setBuscarSugerido] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get("/productos?limit=500&fields=nombre,categoria"),
          api.get("/categorias"),
        ]);
        setProductos(prodRes.data?.productos || prodRes.data?.data || []);
        setCategorias((catRes.data?.categorias || catRes.data?.data || []).map(c => c.nombre));
      } catch { /* ignore */ }
    })();
  }, []);

  const resetForm = () => {
    setForm({ tipo: "maridaje", prioridad: 90, activa: true });
    setShowForm(false);
    setEditId(null);
    setBuscarOrigen("");
    setBuscarSugerido("");
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMsg(null);
    try {
      // Enriquecer con nombres
      const enriched = { ...form };
      if (enriched.productoOrigen) {
        const p = productos.find(pp => String(pp._id) === String(enriched.productoOrigen));
        if (p) enriched.nombreOrigen = p.nombre;
      }
      if (enriched.productoSugerido) {
        const p = productos.find(pp => String(pp._id) === String(enriched.productoSugerido));
        if (p) enriched.nombreSugerido = p.nombre;
      }

      if (editId) {
        await actualizarRegla(editId, enriched);
      } else {
        await crearRegla(enriched);
      }
      setMsg({ t: "ok", m: editId ? "Regla actualizada" : "Regla creada" });
      resetForm();
      onSave({}); // trigger refetch
      setTimeout(() => setMsg(null), 2500);
    } catch (err) {
      setMsg({ t: "error", m: err?.response?.data?.message || "Error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Eliminar esta regla?")) return;
    try {
      await eliminarRegla(id);
      setMsg({ t: "ok", m: "Regla eliminada" });
      onSave({});
      setTimeout(() => setMsg(null), 2500);
    } catch { setMsg({ t: "error", m: "Error al eliminar" }); }
  };

  const handleToggle = async (id) => {
    try {
      await toggleRegla(id);
      onSave({});
    } catch { /* ignore */ }
  };

  const handleEdit = (regla) => {
    setForm({ ...regla });
    setEditId(regla._id);
    setShowForm(true);
  };

  const filtrar = (lista, q) => {
    if (!q) return lista.slice(0, 20);
    const norm = q.toLowerCase();
    return lista.filter(p => p.nombre?.toLowerCase().includes(norm)).slice(0, 20);
  };

  const needsOrigen = form.tipo === "maridaje";
  const needsSugerido = ["maridaje", "siempre", "franja"].includes(form.tipo);
  const needsCategoria = form.tipo === "fase";
  const needsFranja = form.tipo === "franja";
  const needsFase = form.tipo === "fase";

  return (
    <div className="sug-tab">
      {msg && <div className={`sug-toast sug-toast--${msg.t}`}>{msg.m}</div>}

      <div className="sug-section">
        <div className="sug-fases-header">
          <div>
            <h3 className="sug-section__title">Reglas fijas</h3>
            <p className="sug-section__desc">
              Reglas manuales que siempre se aplican. Tienen prioridad sobre el motor automático.
            </p>
          </div>
          {!showForm && (
            <button className="sug-btn sug-btn--primary" onClick={() => setShowForm(true)}>
              + Nueva regla
            </button>
          )}
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="sug-regla-form">
            <div className="sug-form-row">
              <label>Tipo</label>
              <select value={form.tipo} onChange={e => setForm(prev => ({ ...prev, tipo: e.target.value }))}>
                {Object.entries(TIPO_REGLA_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {needsOrigen && (
              <div className="sug-form-row">
                <label>Producto origen (trigger)</label>
                <input
                  type="text" placeholder="Buscar producto..."
                  value={buscarOrigen}
                  onChange={e => setBuscarOrigen(e.target.value)}
                />
                <div className="sug-form-prodlist">
                  {filtrar(productos, buscarOrigen).map(p => (
                    <button key={p._id}
                      className={`sug-form-prod ${String(form.productoOrigen) === String(p._id) ? "sug-form-prod--sel" : ""}`}
                      onClick={() => setForm(prev => ({ ...prev, productoOrigen: p._id, nombreOrigen: p.nombre }))}
                    >
                      {p.nombre}
                    </button>
                  ))}
                </div>
                {form.nombreOrigen && <span className="sug-form-selected">Seleccionado: {form.nombreOrigen}</span>}
              </div>
            )}

            {needsSugerido && (
              <div className="sug-form-row">
                <label>Producto a sugerir</label>
                <input
                  type="text" placeholder="Buscar producto..."
                  value={buscarSugerido}
                  onChange={e => setBuscarSugerido(e.target.value)}
                />
                <div className="sug-form-prodlist">
                  {filtrar(productos, buscarSugerido).map(p => (
                    <button key={p._id}
                      className={`sug-form-prod ${String(form.productoSugerido) === String(p._id) ? "sug-form-prod--sel" : ""}`}
                      onClick={() => setForm(prev => ({ ...prev, productoSugerido: p._id, nombreSugerido: p.nombre }))}
                    >
                      {p.nombre}
                    </button>
                  ))}
                </div>
                {form.nombreSugerido && <span className="sug-form-selected">Seleccionado: {form.nombreSugerido}</span>}
              </div>
            )}

            {needsFase && (
              <div className="sug-form-row">
                <label>Fase trigger</label>
                <select value={form.faseTrigger || ""} onChange={e => setForm(prev => ({ ...prev, faseTrigger: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {FASES.map(f => <option key={f.key} value={f.key}>{f.emoji} {f.label}</option>)}
                </select>
              </div>
            )}

            {needsCategoria && (
              <div className="sug-form-row">
                <label>Categoria a sugerir</label>
                <select value={form.categoriaSugerida || ""} onChange={e => setForm(prev => ({ ...prev, categoriaSugerida: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {needsFranja && (
              <div className="sug-form-row sug-form-row--inline">
                <div>
                  <label>Desde</label>
                  <input type="time" value={form.desde || ""} onChange={e => setForm(prev => ({ ...prev, desde: e.target.value }))} />
                </div>
                <div>
                  <label>Hasta</label>
                  <input type="time" value={form.hasta || ""} onChange={e => setForm(prev => ({ ...prev, hasta: e.target.value }))} />
                </div>
              </div>
            )}

            {form.tipo !== "nunca" && (
              <div className="sug-form-row">
                <label>Mensaje personalizado</label>
                <input type="text" placeholder="Ej: Marida perfecto con..."
                  value={form.mensaje || ""}
                  onChange={e => setForm(prev => ({ ...prev, mensaje: e.target.value }))} />
              </div>
            )}

            {form.tipo === "nunca" && (
              <div className="sug-form-row">
                <label>Motivo (interno)</label>
                <input type="text" placeholder="Ej: Se pone gratis en la mesa"
                  value={form.motivo || ""}
                  onChange={e => setForm(prev => ({ ...prev, motivo: e.target.value }))} />
              </div>
            )}

            <div className="sug-form-row">
              <label>Prioridad (1-100)</label>
              <input type="number" min="1" max="100"
                value={form.prioridad ?? 90}
                onChange={e => setForm(prev => ({ ...prev, prioridad: Number(e.target.value) }))} />
            </div>

            <div className="sug-form-actions">
              <button className="sug-btn sug-btn--primary" onClick={handleSubmit} disabled={saving}>
                {saving ? "Guardando..." : editId ? "Actualizar" : "Crear regla"}
              </button>
              <button className="sug-btn sug-btn--secondary" onClick={resetForm}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Lista de reglas */}
        {reglas.length === 0 && !showForm && (
          <div className="sug-empty">No hay reglas configuradas. El motor funciona solo con señales automáticas.</div>
        )}

        {reglas.length > 0 && (
          <div className="sug-reglas-list">
            {reglas.map(r => (
              <div key={r._id} className={`sug-regla-card ${!r.activa ? "sug-regla-card--off" : ""}`}>
                <div className="sug-regla-card__header">
                  <span className={`sug-regla-tipo sug-regla-tipo--${r.tipo}`}>
                    {TIPO_REGLA_LABELS[r.tipo] || r.tipo}
                  </span>
                  <span className="sug-regla-prioridad">P{r.prioridad}</span>
                </div>

                <div className="sug-regla-card__body">
                  {r.tipo === "maridaje" && (
                    <span>{r.nombreOrigen || "?"} → {r.nombreSugerido || "?"}</span>
                  )}
                  {r.tipo === "siempre" && (
                    <span>Siempre: {r.nombreSugerido || "?"}</span>
                  )}
                  {r.tipo === "nunca" && (
                    <span>Nunca: {r.nombreSugerido || "?"} {r.motivo ? `(${r.motivo})` : ""}</span>
                  )}
                  {r.tipo === "fase" && (
                    <span>Fase {r.faseTrigger} → {r.categoriaSugerida}</span>
                  )}
                  {r.tipo === "franja" && (
                    <span>{r.nombreSugerido || "?"} ({r.desde}-{r.hasta})</span>
                  )}
                  {r.mensaje && <span className="sug-regla-msg">"{r.mensaje}"</span>}
                </div>

                <div className="sug-regla-card__actions">
                  <button className="sug-regla-action" onClick={() => handleToggle(r._id)}
                    title={r.activa ? "Desactivar" : "Activar"}>
                    {r.activa ? "Pausar" : "Activar"}
                  </button>
                  <button className="sug-regla-action" onClick={() => handleEdit(r)}>Editar</button>
                  <button className="sug-regla-action sug-regla-action--del" onClick={() => handleDelete(r._id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  Componente principal                                     */
/* ══════════════════════════════════════════════════════════ */
export default function SugerenciasConfigPage() {
  const [tab, setTab] = useState("general");
  const [helpModal, setHelpModal] = useState(null);
  const { config, loading, error, refetch } = useSugerenciasConfig();
  const stats = useSugerenciasStats();

  const handleSave = async (payload) => {
    await updateSugerenciasConfig(payload);
    refetch();
    stats.refetch();
  };

  if (loading) return <div className="sug-loading">Cargando configuración...</div>;
  if (error) return <div className="sug-error">{error}</div>;

  return (
    <div className="sug-root">
      <div className="sug-header">
        <div>
          <h2>Sugerencias inteligentes</h2>
          <p className="sug-header__sub">
            Configura como la carta digital recomienda productos a tus clientes.
          </p>
        </div>
        {config?.enabled && (
          <div className="sug-header__badge sug-header__badge--on">Activo</div>
        )}
      </div>

      <div className="sug-tabs">
        {TABS.map(t => (
          <div key={t.key} className="sug-tab-wrapper">
            <button
              className={`sug-tab-btn ${tab === t.key ? "sug-tab-btn--active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
            {t.help && (
              <button
                className="sug-tab-help"
                onClick={() => setHelpModal(t.help)}
                title={`Ayuda: ${t.label}`}
              >?</button>
            )}
          </div>
        ))}
      </div>

      {tab === "general" && <TabGeneral config={config} onSave={handleSave} stats={stats} />}
      {tab === "fases" && <TabFases config={config} onSave={handleSave} />}
      {tab === "pesos" && <TabPesos config={config} onSave={handleSave} />}
      {tab === "reglas" && <TabReglas config={config} onSave={handleSave} />}

      <HelpModal help={helpModal} onClose={() => setHelpModal(null)} />
    </div>
  );
}
