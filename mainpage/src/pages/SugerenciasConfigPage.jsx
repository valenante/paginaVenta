import React, { useState, useEffect, useCallback } from "react";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
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
import { toInputText, clampIntNum } from "../utils/numeroInput";
import { mensajeConCampos } from "../utils/normalizeApiError";
import "./SugerenciasConfigPage.css";

/* Valores por defecto de los umbrales: los usa el estado inicial, el "restaurar
   por defecto" y la conversión del guardado cuando un campo se deja vacío. */
const UMBRAL_DEFAULTS = { minCoocPct: 30, minCoocMuestras: 5, minCatPct: 35, minFreqPct: 40 };

/* Pesos por defecto = los del esquema del backend (`SugerenciaConfig.schema.js`, pesos.*).
   Sólo los usa «Restaurar defaults»: lo que se PINTA viene siempre de la config efectiva de la
   API. «Valoraciones» ya no existe (señal borrada en el backend). */
const PESO_DEFAULTS = {
  flujoComida: 80, coocurrencia: 70, margen: 50, popularidad: 40,
  cargaCocina: 30, stock: 25, categoriaEsperada: 20, promocion: 15, clima: 35,
};

// 0 = domingo … 6 = sábado (igual que el motor: `sugerenciasCarrito.service.js`). Orden de lunes a domingo.
const DIAS_SEMANA = [
  { v: 1, l: "L", n: "Lunes" }, { v: 2, l: "M", n: "Martes" }, { v: 3, l: "X", n: "Miércoles" },
  { v: 4, l: "J", n: "Jueves" }, { v: 5, l: "V", n: "Viernes" }, { v: 6, l: "S", n: "Sábado" },
  { v: 0, l: "D", n: "Domingo" },
];

const cruzaMedianoche = (desde, hasta) => Boolean(desde && hasta && hasta < desde);

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
        "El **filtro de alérgenos** es crítico. **Con el filtro activado**: Filtra los productos con los alérgenos que la mesa ha declarado o confirmado; revisa siempre la ficha de alérgenos del plato. Mira toda la mesa: las alergias que declaran los comensales al entrar y las que se anotan en los platos del pedido. Si activas \"incluir trazas\", también filtra productos que pueden contener trazas. Con el filtro desactivado, las sugerencias no miran los alérgenos.",
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
        "- **Carga de cocina** (30): evita sugerir platos de una estación saturada.\n" +
        "- **Stock** (25): prioriza lo que hay en abundancia y evita lo que se está acabando.\n" +
        "- **Categoria esperada** (20): categorias que aparecen en un % alto de mesas pero faltan en el carrito.\n" +
        "- **Promocion** (15): boost a productos en oferta.\n" +
        "- **Clima** (35): con calor o frío, sube las categorías que elijas en la pestaña Clima.\n\n" +
        "**Umbrales:** son los minimos para que una señal se active. Bajarlos = más sugerencias pero menos precision. Subirlos = menos sugerencias pero más relevantes.\n\n" +
        "Si no sabes qué tocar, deja los valores por defecto. Funcionan bien para la mayoría de restaurantes.",
    },
  },
  {
    key: "clima",
    label: "Clima",
    help: {
      titulo: "Clima",
      texto: "Cuando hace calor o frío, el motor sube las categorías que elijas (por ejemplo, bebidas frías con calor y sopas con frío).\n\n" +
        "**Requisitos:** el restaurante tiene que tener su **ubicación configurada** y el servicio del tiempo tiene que estar disponible. Si no lo está, esta señal simplemente no suma nada: el resto del motor sigue igual.\n\n" +
        "Cuánto pesa el clima frente a las demás señales se ajusta en «Pesos y umbrales».",
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
        "- **Franja horaria**: sugiere un producto solo en un horario y, si quieres, sólo unos días. Ej: \"Mojitos de 17:00 a 20:00 (happy hour)\". Una franja como 22:00-02:00 cruza la medianoche y es válida. La hora es la del restaurante.\n\n" +
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
              <p key={i} className="sug-help-modal__linea">
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

// Emojis sugeridos para nuevas fases
const EMOJI_OPTIONS = ["🥗", "🍖", "🍺", "🍰", "☕", "🍣", "🍕", "🥘", "🍷", "🧁", "🍽️", "🥂", "🍔", "🌮", "🍜"];

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
    // La API devuelve la config EFECTIVA (con los defaults del esquema): se usa tal cual. Antes
    // `enabled ?? false` pintaba «apagado» un documento sin campo que el motor trataba como ENCENDIDO.
    if (config) setLocal({
      enabled: config.enabled,
      touchpoints: config.touchpoints,
      maxSugerencias: config.maxSugerencias,
      filtrarAlergenos: config.filtrarAlergenos,
      incluirTrazas: config.incluirTrazas,
      // «Mostrar el camarero IA en la carta» = NO `asistenteIA.apagadoPorDueno`. Ausente ⇒ encendido
      // (así lo define el backend, R2-ART16). Se guarda aparte en `inicial` para mandarlo SÓLO si cambia.
      asistenteVisible: config.asistenteIA?.apagadoPorDueno !== true,
    });
  }, [config]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const { asistenteVisible, ...resto } = local;
      const payload = { ...resto };
      // Sólo si el dueño lo ha cambiado: ausente = el backend no lo toca.
      if (asistenteVisible !== (config?.asistenteIA?.apagadoPorDueno !== true)) {
        payload.asistenteIA = { apagadoPorDueno: !asistenteVisible };
      }
      await onSave(payload);
      setMsg({ t: "ok", m: "Guardado" });
      setTimeout(() => setMsg(null), 2500);
    } catch (err) { setMsg({ t: "error", m: mensajeConCampos(err, "Error al guardar") }); }
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

      {stats?.error && <div className="sug-toast sug-toast--error">{stats.error}</div>}

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
            role="switch"
            aria-checked={Boolean(local.enabled)}
            aria-label="Sugerencias inteligentes"
            onClick={() => set("enabled", !local.enabled)}
          >
            <span className="sug-toggle__knob" />
          </button>
        </div>
      </div>

      {/* Camarero IA en la carta (interruptor del dueño) */}
      <div className="sug-section">
        <div className="sug-toggle-row">
          <div>
            <span className="sug-toggle-label">Mostrar el camarero IA en la carta</span>
            <span className="sug-toggle-desc" data-testid="sug-asistente-desc">
              {local.asistenteVisible
                ? "Los clientes ven el asistente IA en la carta QR."
                : "Oculto: los clientes no ven el asistente IA en la carta QR."}
            </span>
          </div>
          <button
            className={`sug-toggle ${local.asistenteVisible ? "sug-toggle--on" : ""}`}
            role="switch"
            aria-checked={Boolean(local.asistenteVisible)}
            aria-label="Mostrar el camarero IA en la carta"
            onClick={() => set("asistenteVisible", !local.asistenteVisible)}
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
                    checked={Boolean(local.touchpoints?.[tp.key])}
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
                <input type="checkbox" checked={Boolean(local.filtrarAlergenos)}
                  onChange={e => set("filtrarAlergenos", e.target.checked)} />
                <div>
                  <span className="sug-checkbox__label">Filtrar alérgenos</span>
                  <span className="sug-checkbox__desc" data-testid="sug-alergenos-desc">
                    {local.filtrarAlergenos
                      ? "Filtra los productos con los alérgenos que la mesa ha declarado o confirmado; revisa siempre la ficha de alérgenos del plato."
                      : "Desactivado: las sugerencias NO miran los alérgenos de la mesa."}
                  </span>
                </div>
              </label>
              <label className={`sug-checkbox ${local.incluirTrazas ? "sug-checkbox--active" : ""}`}>
                <input type="checkbox" checked={Boolean(local.incluirTrazas)}
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
  // fases es ARRAY de objetos: [{ key, label, emoji, orden, categorias, esBebida, traducciones }]
  const [fases, setFases] = useState([]);
  const [categoriasDisp, setCategoriasDisp] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [newFase, setNewFase] = useState({ label: "", emoji: "🍽️", esBebida: false });
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    if (config?.fasesMenu && Array.isArray(config.fasesMenu) && config.fasesMenu.length) {
      setFases(config.fasesMenu.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)));
    }
    (async () => {
      try {
        const { data } = await api.get("/admin/sugerencias/auto-detect-fases");
        setCategoriasDisp(data.categoriasDisponibles || []);
        if (!config?.fasesMenu || !Array.isArray(config.fasesMenu) || !config.fasesMenu.length) {
          setFases(data.fases);
        }
      } catch (err) {
        setMsg({ t: "error", m: mensajeConCampos(err, "No se pudieron cargar las categorías") });
      }
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
    } catch (err) { setMsg({ t: "error", m: mensajeConCampos(err, "Error al auto-detectar") }); }
    finally { setDetecting(false); }
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await onSave({ fasesMenu: fases });
      setMsg({ t: "ok", m: "Fases guardadas" });
      setTimeout(() => setMsg(null), 2500);
    } catch (err) { setMsg({ t: "error", m: mensajeConCampos(err, "Error al guardar") }); }
    finally { setSaving(false); }
  };

  const slugify = (text) =>
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

  const addFase = () => {
    if (!newFase.label.trim()) return;
    const key = slugify(newFase.label);
    if (fases.some(f => f.key === key)) {
      setMsg({ t: "error", m: "Ya existe una fase con ese nombre" });
      return;
    }
    setFases(prev => [...prev, {
      key,
      label: newFase.label.trim(),
      emoji: newFase.emoji || "🍽️",
      orden: prev.length,
      categorias: [],
      esBebida: newFase.esBebida,
      traducciones: { en: { label: "" }, fr: { label: "" } },
    }]);
    setNewFase({ label: "", emoji: "🍽️", esBebida: false });
    setShowNewForm(false);
  };

  const [confirmDeleteFase, setConfirmDeleteFase] = useState(null);
  const removeFase = (key) => {
    setConfirmDeleteFase(key);
  };
  const doRemoveFase = () => {
    if (confirmDeleteFase) {
      setFases(prev => prev.filter(f => f.key !== confirmDeleteFase).map((f, i) => ({ ...f, orden: i })));
    }
    setConfirmDeleteFase(null);
  };

  const moveFase = (idx, dir) => {
    setFases(prev => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr.map((f, i) => ({ ...f, orden: i }));
    });
  };

  const updateFase = (key, field, value) => {
    setFases(prev => prev.map(f => f.key === key ? { ...f, [field]: value } : f));
  };

  const addCat = (faseKey, cat) => {
    setFases(prev => prev.map(f => {
      // Quitar de cualquier otra fase
      const newCats = (f.categorias || []).filter(c => c !== cat);
      if (f.key === faseKey) newCats.push(cat);
      return { ...f, categorias: newCats };
    }));
  };

  const removeCat = (faseKey, cat) => {
    setFases(prev => prev.map(f =>
      f.key === faseKey ? { ...f, categorias: (f.categorias || []).filter(c => c !== cat) } : f
    ));
  };

  const asignadas = new Set(fases.flatMap(f => f.categorias || []));
  const sinAsignar = categoriasDisp.filter(c => !asignadas.has(c));

  return (
    <div className="sug-tab">
      {msg && <div className={`sug-toast sug-toast--${msg.t}`}>{msg.m}</div>}

      <div className="sug-section">
        <div className="sug-fases-header">
          <div>
            <h3 className="sug-section__title">Fases del menú</h3>
            <p className="sug-section__desc">
              Crea y personaliza las fases de tu menú. Cada fase guía al cliente por tu carta.
            </p>
          </div>
          <div className="sug-acciones">
            <button className="sug-btn sug-btn--secondary" onClick={handleAutoDetect} disabled={detecting}>
              {detecting ? "Detectando..." : "Auto-detectar"}
            </button>
            <button className="sug-btn sug-btn--primary" onClick={() => setShowNewForm(true)}>
              + Nueva fase
            </button>
          </div>
        </div>

        {/* Formulario nueva fase */}
        {showNewForm && (
          <div className="sug-new-fase">
            <select className="sug-new-fase__emoji" value={newFase.emoji} onChange={e => setNewFase(p => ({ ...p, emoji: e.target.value }))}>
              {EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input
              type="text" placeholder="Nombre de la fase (ej: Sushi, Tapas...)"
              value={newFase.label} onChange={e => setNewFase(p => ({ ...p, label: e.target.value }))}
              className="sug-new-fase__nombre"
              onKeyDown={e => e.key === "Enter" && addFase()}
            />
            <label className="sug-new-fase__bebida">
              <input type="checkbox" checked={newFase.esBebida} onChange={e => setNewFase(p => ({ ...p, esBebida: e.target.checked }))} />
              Es bebida
            </label>
            <button className="sug-btn sug-btn--primary" onClick={addFase}>Crear</button>
            <button className="sug-btn sug-btn--secondary" onClick={() => setShowNewForm(false)}>Cancelar</button>
          </div>
        )}

        <div className="sug-fases-grid">
          {fases.map((f, idx) => (
            <div key={f.key} className="sug-fase-col">
              <div className="sug-fase-col__header">
                <span className="sug-fase-col__emoji">{f.emoji}</span>
                <span className="sug-fase-col__label">{f.label}</span>
                {f.esBebida && <span className="sug-fase-col__bebida">bebida</span>}
                <div className="sug-fase-col__botones">
                  <button className="sug-fase-col__move" onClick={() => moveFase(idx, -1)} disabled={idx === 0} title="Subir">↑</button>
                  <button className="sug-fase-col__move" onClick={() => moveFase(idx, 1)} disabled={idx === fases.length - 1} title="Bajar">↓</button>
                  <button className="sug-fase-col__delete" onClick={() => removeFase(f.key)} title="Eliminar">✕</button>
                </div>
              </div>
              <div className="sug-fase-col__cats">
                {(f.categorias || []).map(cat => (
                  <span key={cat} className="sug-fase-tag">
                    {cat}
                    <button className="sug-fase-tag__x" onClick={() => removeCat(f.key, cat)}>x</button>
                  </span>
                ))}
                <select className="sug-fase-add" value="" onChange={e => e.target.value && addCat(f.key, e.target.value)}>
                  <option value="">+ Añadir...</option>
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

      {confirmDeleteFase && (
        <ModalConfirmacion
          titulo="Eliminar fase"
          mensaje="¿Eliminar esta fase del flujo de comida?"
          onConfirm={doRemoveFase}
          onClose={() => setConfirmDeleteFase(null)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  Tab Pesos y umbrales                                     */
/* ══════════════════════════════════════════════════════════ */
function TabPesos({ config, onSave }) {
  const [pesos, setPesos] = useState(PESO_DEFAULTS);
  const [umbrales, setUmbrales] = useState({
    minCoocPct: 30, minCoocMuestras: 5, minCatPct: 35, minFreqPct: 40,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (config?.pesos) setPesos(prev => ({ ...prev, ...config.pesos }));
    // (la config efectiva ya trae todos los pesos; el merge sólo protege de una respuesta parcial)
    if (config?.umbrales) setUmbrales(prev => ({ ...prev, ...config.umbrales }));
  }, [config]);

  // Los inputs de umbrales guardan TEXTO mientras se teclea (para poder
  // vaciarlos); aquí se convierten y se aplican los límites de cada métrica.
  const umbralesNumericos = () => {
    const out = {};
    for (const [key, meta] of Object.entries(UMBRAL_LABELS)) {
      out[key] = clampIntNum(umbrales[key], meta.min, meta.max, UMBRAL_DEFAULTS[key]);
    }
    return out;
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      // Sólo las señales que existen (nunca `valoraciones`, aunque llegara de un documento viejo).
      const soloVigentes = Object.fromEntries(Object.keys(PESO_LABELS).map((k) => [k, clampIntNum(pesos[k], 0, 100, PESO_DEFAULTS[k])]));
      await onSave({ pesos: soloVigentes, umbrales: umbralesNumericos() });
      setMsg({ t: "ok", m: "Guardado" });
      setTimeout(() => setMsg(null), 2500);
    } catch (err) { setMsg({ t: "error", m: mensajeConCampos(err, "Error al guardar") }); }
    finally { setSaving(false); }
  };

  const resetDefaults = () => {
    setPesos(PESO_DEFAULTS);
    setUmbrales({ minCoocPct: 30, minCoocMuestras: 5, minCatPct: 35, minFreqPct: 40 });
  };

  const PESO_LABELS = {
    flujoComida: { label: "Flujo de comida", desc: "\"Te falta bebida\", \"Algo de postre?\"" },
    coocurrencia: { label: "Co-ocurrencia", desc: "Productos que se piden juntos" },
    margen: { label: "Margen", desc: "Priorizar productos más rentables" },
    popularidad: { label: "Popularidad", desc: "Lo más vendido en los ultimos 30 dias" },
    cargaCocina: { label: "Carga de cocina", desc: "Evitar platos de una estación saturada" },
    stock: { label: "Stock", desc: "Priorizar lo que sobra, evitar lo que se acaba" },
    categoriaEsperada: { label: "Categoria esperada", desc: "Categorias frecuentes que faltan" },
    promocion: { label: "Promocion activa", desc: "Boost a productos en oferta" },
    clima: { label: "Clima", desc: "Calor o frío suben las categorías de la pestaña Clima" },
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
                  aria-label={`Peso ${meta.label}`}
                  value={pesos[key] ?? PESO_DEFAULTS[key]}
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
                  value={toInputText(umbrales[key])}
                  onChange={e => setUmbrales(prev => ({ ...prev, [key]: e.target.value }))}
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
/*  Tab Clima                                                */
/* ══════════════════════════════════════════════════════════ */
// Rangos = `sugerenciasConfigSchema.clima` del backend.
const CLIMA_RANGOS = { calorUmbral: [-20, 55], frioUmbral: [-40, 40] };

function TabClima({ config, onSave }) {
  const [clima, setClima] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    // Config efectiva: trae enabled/umbrales/categorías con los defaults del esquema.
    if (config?.clima) setClima({ ...config.clima });
  }, [config]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/categorias");
        setCategorias((data?.categorias || data?.data || []).map(c => c.nombre).filter(Boolean));
      } catch (err) {
        setMsg({ t: "error", m: mensajeConCampos(err, "No se pudieron cargar las categorías") });
      }
    })();
  }, []);

  if (!clima) return <div className="sug-tab"><div className="sug-loading">Cargando...</div></div>;

  const toggleCat = (lista, cat) => setClima(prev => {
    const actual = prev[lista] || [];
    return { ...prev, [lista]: actual.includes(cat) ? actual.filter(c => c !== cat) : [...actual, cat] };
  });

  const save = async () => {
    const calor = clampIntNum(clima.calorUmbral, ...CLIMA_RANGOS.calorUmbral, 28);
    const frio = clampIntNum(clima.frioUmbral, ...CLIMA_RANGOS.frioUmbral, 12);
    if (frio >= calor) {
      setMsg({ t: "error", m: "El umbral de frío tiene que ser más bajo que el de calor" });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await onSave({
        clima: {
          enabled: Boolean(clima.enabled),
          calorUmbral: calor,
          frioUmbral: frio,
          categoriasCalor: clima.categoriasCalor || [],
          categoriasFrio: clima.categoriasFrio || [],
        },
      });
      setMsg({ t: "ok", m: "Clima guardado" });
      setTimeout(() => setMsg(null), 2500);
    } catch (err) {
      setMsg({ t: "error", m: mensajeConCampos(err, "Error al guardar") });
    } finally {
      setSaving(false);
    }
  };

  const bloqueCategorias = (lista, titulo) => (
    <div className="sug-form-row">
      <label>{titulo}</label>
      {categorias.length === 0
        ? <span className="sug-form-hint">No hay categorías en tu carta.</span>
        : (
          <div className="sug-clima-cats" role="group" aria-label={titulo}>
            {categorias.map(cat => {
              const on = (clima[lista] || []).includes(cat);
              return (
                <button key={cat} type="button" aria-pressed={on}
                  className={`sug-fase-tag sug-clima-cat ${on ? "sug-clima-cat--on" : ""}`}
                  onClick={() => toggleCat(lista, cat)}>
                  {cat}
                </button>
              );
            })}
          </div>
        )}
    </div>
  );

  return (
    <div className="sug-tab">
      {msg && <div className={`sug-toast sug-toast--${msg.t}`}>{msg.m}</div>}

      <div className="sug-section">
        <div className="sug-toggle-row">
          <div>
            <span className="sug-toggle-label">Sugerir según el tiempo</span>
            <span className="sug-toggle-desc" data-testid="sug-clima-requisito">
              Necesita que el restaurante tenga su ubicación configurada y que el servicio del tiempo esté disponible.
              Si no lo está, el clima no suma nada y el resto de sugerencias sigue igual.
            </span>
          </div>
          <button
            className={`sug-toggle ${clima.enabled ? "sug-toggle--on" : ""}`}
            role="switch"
            aria-checked={Boolean(clima.enabled)}
            aria-label="Sugerir según el tiempo"
            onClick={() => setClima(prev => ({ ...prev, enabled: !prev.enabled }))}
          >
            <span className="sug-toggle__knob" />
          </button>
        </div>
      </div>

      {clima.enabled && (
        <div className="sug-section">
          <h3 className="sug-section__title">Temperaturas</h3>
          <div className="sug-umbrales-grid">
            <div className="sug-umbral-item">
              <label className="sug-umbral-label" htmlFor="sug-clima-calor">Calor a partir de</label>
              <div className="sug-umbral-input">
                <input id="sug-clima-calor" type="number" min={CLIMA_RANGOS.calorUmbral[0]} max={CLIMA_RANGOS.calorUmbral[1]}
                  value={toInputText(clima.calorUmbral)}
                  onChange={e => setClima(prev => ({ ...prev, calorUmbral: e.target.value }))} />
                <span className="sug-umbral-unit">°C</span>
              </div>
            </div>
            <div className="sug-umbral-item">
              <label className="sug-umbral-label" htmlFor="sug-clima-frio">Frío por debajo de</label>
              <div className="sug-umbral-input">
                <input id="sug-clima-frio" type="number" min={CLIMA_RANGOS.frioUmbral[0]} max={CLIMA_RANGOS.frioUmbral[1]}
                  value={toInputText(clima.frioUmbral)}
                  onChange={e => setClima(prev => ({ ...prev, frioUmbral: e.target.value }))} />
                <span className="sug-umbral-unit">°C</span>
              </div>
            </div>
          </div>
          {bloqueCategorias("categoriasCalor", "Categorías que suben con calor")}
          {bloqueCategorias("categoriasFrio", "Categorías que suben con frío")}
        </div>
      )}

      <button className="sug-btn sug-btn--primary" onClick={save} disabled={saving}>
        {saving ? "Guardando..." : "Guardar clima"}
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
      } catch (err) {
        setMsg({ t: "error", m: mensajeConCampos(err, "No se pudieron cargar productos y categorías") });
      }
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
      // prioridad se teclea como texto → aquí se convierte (1-100, defecto 90)
      const enriched = { ...form, prioridad: clampIntNum(form.prioridad, 1, 100, 90) };
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
      // La API explica QUÉ falta (`fields`): «Elige el producto de la regla», «Hora HH:MM»…
      setMsg({ t: "error", m: mensajeConCampos(err, "No se pudo guardar la regla") });
    } finally {
      setSaving(false);
    }
  };

  const [confirmDeleteRegla, setConfirmDeleteRegla] = useState(null);
  const handleDelete = (id) => setConfirmDeleteRegla(id);
  const doDeleteRegla = async () => {
    if (!confirmDeleteRegla) return;
    try {
      await eliminarRegla(confirmDeleteRegla);
      setMsg({ t: "ok", m: "Regla eliminada" });
      onSave({});
      setTimeout(() => setMsg(null), 2500);
    } catch (err) { setMsg({ t: "error", m: mensajeConCampos(err, "Error al eliminar") }); }
    setConfirmDeleteRegla(null);
  };

  const handleToggle = async (id) => {
    try {
      await toggleRegla(id);
      onSave({});
    } catch (err) {
      setMsg({ t: "error", m: mensajeConCampos(err, "No se pudo pausar/activar la regla") });
    }
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
  // «nunca» también necesita producto: sin él la API responde 400 (y el motor no sabría qué bloquear).
  const needsSugerido = ["maridaje", "siempre", "nunca", "franja"].includes(form.tipo);
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
                <label>{form.tipo === "nunca" ? "Producto que NUNCA se sugiere" : "Producto a sugerir"}</label>
                <input
                  type="text" placeholder="Buscar producto..."
                  aria-label="Buscar producto de la regla"
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
                  {(config?.fasesMenu || []).map(f => <option key={f.key} value={f.key}>{f.emoji} {f.label}</option>)}
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
              <>
                <div className="sug-form-row sug-form-row--inline">
                  <div>
                    <label htmlFor="sug-franja-desde">Desde</label>
                    <input id="sug-franja-desde" type="time" value={form.desde || ""} onChange={e => setForm(prev => ({ ...prev, desde: e.target.value }))} />
                  </div>
                  <div>
                    <label htmlFor="sug-franja-hasta">Hasta</label>
                    <input id="sug-franja-hasta" type="time" value={form.hasta || ""} onChange={e => setForm(prev => ({ ...prev, hasta: e.target.value }))} />
                  </div>
                </div>
                <p className="sug-form-hint">
                  Hora del restaurante.
                  {cruzaMedianoche(form.desde, form.hasta) && (
                    <span data-testid="sug-franja-medianoche"> La franja {form.desde}-{form.hasta} cruza la medianoche: vale, se aplica de {form.desde} hasta las {form.hasta} del día siguiente.</span>
                  )}
                </p>
                <div className="sug-form-row">
                  <label>Días de la semana</label>
                  <div className="sug-dias" role="group" aria-label="Días de la semana">
                    {DIAS_SEMANA.map(d => {
                      const marcado = (form.diasSemana || []).includes(d.v);
                      return (
                        <button
                          key={d.v}
                          type="button"
                          className={`sug-dia ${marcado ? "sug-dia--on" : ""}`}
                          aria-pressed={marcado}
                          aria-label={d.n}
                          title={d.n}
                          onClick={() => setForm(prev => {
                            const actuales = prev.diasSemana || [];
                            const nuevos = actuales.includes(d.v) ? actuales.filter(x => x !== d.v) : [...actuales, d.v];
                            return { ...prev, diasSemana: nuevos.sort((a, b) => a - b) };
                          })}
                        >
                          {d.l}
                        </button>
                      );
                    })}
                  </div>
                  <span className="sug-form-hint">Si no marcas ninguno, se aplica todos los días.</span>
                </div>
              </>
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
                value={toInputText(form.prioridad)}
                onChange={e => setForm(prev => ({ ...prev, prioridad: e.target.value }))} />
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
                    <span>
                      {r.nombreSugerido || "?"} ({r.desde}-{r.hasta})
                      {r.diasSemana?.length ? ` · ${DIAS_SEMANA.filter(d => r.diasSemana.includes(d.v)).map(d => d.l).join(" ")}` : ""}
                    </span>
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

      {confirmDeleteRegla && (
        <ModalConfirmacion
          titulo="Eliminar regla"
          mensaje="¿Eliminar esta regla fija?"
          onConfirm={doDeleteRegla}
          onClose={() => setConfirmDeleteRegla(null)}
        />
      )}
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
      {tab === "clima" && <TabClima config={config} onSave={handleSave} />}
      {tab === "reglas" && <TabReglas config={config} onSave={handleSave} />}

      <HelpModal help={helpModal} onClose={() => setHelpModal(null)} />
    </div>
  );
}
