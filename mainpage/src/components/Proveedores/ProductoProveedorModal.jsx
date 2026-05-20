import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../utils/api";
import { useTenant } from "../../context/TenantContext";
import Portal from "../ui/Portal";
import "./ProductoProveedorModal.css";

const DEFAULT = {
  nombre: "",
  unidad: "",
  formato: "",
  precio: "",
  iva: 10,
  activo: true,
  cantidadPorCompra: 1,
  unidadContenido: "",
  pesoNetoPorItem: "",
  unidadPesoNeto: "",
  factorConversion: 1,
};

const UNIDAD_CONTENIDO_OPTIONS = [
  { value: "ud", label: "Unidad" },
  { value: "botella", label: "Botella" },
  { value: "lata", label: "Lata" },
  { value: "pieza", label: "Pieza" },
  { value: "saco", label: "Saco" },
  { value: "paquete", label: "Paquete" },
  { value: "barril", label: "Barril" },
  { value: "bote", label: "Bote" },
  { value: "bolsa", label: "Bolsa" },
  { value: "tarrina", label: "Tarrina" },
  { value: "cubo", label: "Cubo" },
  { value: "garrafa", label: "Garrafa" },
];

const PESO_VOL_UNIDADES = [
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "l", label: "l" },
];

const UNIDAD_OPTIONS = [
  { value: "kg", label: "Kilogramo (kg)" },
  { value: "g", label: "Gramo (g)" },
  { value: "litro", label: "Litro (l)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "unidad", label: "Unidad (ud)" },
  { value: "caja", label: "Caja" },
  { value: "pack", label: "Pack" },
];

/* Detectar tipo de asociación de un producto existente */
const detectTipoAsociacion = (prod) => {
  if (prod?.ingredienteId) return "ingrediente";
  if (prod?.productoId) return "producto";
  return "producto"; // default para nuevos
};

function SearchSelect({ options, value, onChange, placeholder = "Buscar…" }) {
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="ppSearch">
      {selected ? (
        <div className="ppSearch-selected">
          <span>{selected.label}</span>
          <button type="button" className="ppSearch-clear" onClick={() => { onChange(""); setQuery(""); }}>✕</button>
        </div>
      ) : (
        <>
          <input
            className="ppSearch-input"
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query.trim() && (
            <ul className="ppSearch-results">
              {filtered.length === 0 && <li className="ppSearch-empty">Sin resultados para "{query}"</li>}
              {filtered.slice(0, 20).map((o) => (
                <li key={o.value} className="ppSearch-item" onClick={() => { onChange(o.value); setQuery(""); }}>
                  {o.label}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductoProveedorModal({
  mode = "create",
  producto,
  onClose,
  onSaved,
}) {
  const isEdit = mode === "edit";
  const { proveedorId } = useParams();
  const { tenant } = useTenant();

  const [form, setForm] = useState(() => ({
    ...DEFAULT,
    ...(producto || {}),
    precio: producto?.precioBase ?? "",
    ingredienteId: producto?.ingredienteId || "",
    productoId: producto?.productoId || "",
    productoShopId: producto?.productoShopId || "",
    cantidadPorCompra: producto?.cantidadPorCompra ?? producto?.factorConversion ?? 1,
    unidadContenido: producto?.unidadContenido || "",
    pesoNetoPorItem: producto?.pesoNetoPorItem || "",
    unidadPesoNeto: producto?.unidadPesoNeto || "",
    factorConversion: producto?.factorConversion ?? 1,
    factoresPorPrecio: producto?.factoresPorPrecio || [],
  }));

  const [tipoAsociacion, setTipoAsociacion] = useState(() =>
    isEdit ? detectTipoAsociacion(producto) : "producto"
  );

  const [ingredientes, setIngredientes] = useState([]);
  const [productosStock, setProductosStock] = useState([]);
  const [productosShop, setProductosShop] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Modo IA ──
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState("");

  const handleAiParse = async () => {
    if (!aiText.trim() || aiText.trim().length < 5) return;
    setAiLoading(true);
    setAiError("");
    setAiResult(null);
    try {
      const { data } = await api.post(`/admin/proveedores/${proveedorId}/productos/parse-natural`, { texto: aiText });
      if (data.ok && data.parsed) {
        setAiResult(data.parsed);
      } else {
        setAiError(data.message || "No se pudo interpretar");
      }
    } catch (err) {
      setAiError(err?.response?.data?.message || "Error al analizar");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiResult = () => {
    if (!aiResult) return;
    setForm((prev) => ({
      ...prev,
      nombre: aiResult.nombre || prev.nombre,
      unidad: aiResult.unidad || prev.unidad,
      formato: aiResult.formato || prev.formato,
      precio: aiResult.precioBase || prev.precio,
      iva: aiResult.iva || prev.iva,
      cantidadPorCompra: aiResult.cantidadPorCompra || prev.cantidadPorCompra,
      factorConversion: aiResult.cantidadPorCompra || prev.factorConversion,
      unidadContenido: aiResult.unidadContenido || prev.unidadContenido,
      pesoNetoPorItem: aiResult.pesoNetoPorItem || prev.pesoNetoPorItem,
      unidadPesoNeto: aiResult.unidadPesoNeto || prev.unidadPesoNeto,
    }));
    setAiResult(null);
    setAiText("");
    setAiApplied(true);
  };

  const [aiApplied, setAiApplied] = useState(false);

  const isRest = tenant?.tipoNegocio === "restaurante";
  const isShop = tenant?.tipoNegocio === "shop";

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  // Precios del producto asociado (para factores por precio)
  const productoAsociado = productosStock.find((p) => p._id === form.productoId);
  const preciosProducto = productoAsociado?.precios || [];
  const tieneMultiPrecios = preciosProducto.length > 1;

  // Unidad base y ratios — se restauran cuando productosStock se cargan
  const [unidadBase, setUnidadBase] = useState("");
  const [ratios, setRatios] = useState({});
  const [multiPrecioRestored, setMultiPrecioRestored] = useState(false);

  // Restaurar unidadBase y ratios desde factoresPorPrecio guardados
  useEffect(() => {
    if (multiPrecioRestored || !tieneMultiPrecios) return;
    const fps = producto?.factoresPorPrecio || form.factoresPorPrecio || [];
    const fc = Number(producto?.factorConversion || form.cantidadPorCompra) || 1;
    if (!fps.length) return;

    // La unidad base es la que tiene factor == fc (el factor general)
    const base = fps.find(f => Math.abs(f.factor - fc) < 0.01);
    if (base) {
      setUnidadBase(base.clave);
      const newRatios = {};
      for (const fp of fps) {
        if (fp.clave !== base.clave && fc > 0) {
          newRatios[fp.clave] = Math.round(fp.factor / fc);
        }
      }
      setRatios(newRatios);
    }
    setMultiPrecioRestored(true);
  }, [tieneMultiPrecios, producto, form.factoresPorPrecio, form.cantidadPorCompra, multiPrecioRestored]);

  const setRatio = (clave, val) => setRatios((prev) => ({ ...prev, [clave]: Number(val) || 0 }));

  // Calcular factoresPorPrecio a partir de unidadBase + ratios + factorConversion
  const buildFactoresPorPrecio = () => {
    if (!tieneMultiPrecios || !unidadBase) return [];
    const fc = Number(form.cantidadPorCompra) || 1;
    return preciosProducto.map((p) => {
      if (p.clave === unidadBase) return { clave: p.clave, factor: fc };
      const ratio = ratios[p.clave] || 0;
      return { clave: p.clave, factor: fc * ratio };
    }).filter((f) => f.factor > 0);
  };

  // Coste por tipo
  const getCostePorTipo = (clave) => {
    const fc = Number(form.cantidadPorCompra) || 1;
    const precio = Number(form.precio) || 0;
    if (precio <= 0) return null;
    if (clave === unidadBase) return precio / fc;
    const ratio = ratios[clave] || 0;
    if (ratio <= 0) return null;
    return precio / (fc * ratio);
  };

  /* =========================
     Cargar opciones según negocio
  ========================= */
  useEffect(() => {
    if (!tenant) return;

    const load = async () => {
      try {
        if (isRest) {
          const [ingRes, prodRes] = await Promise.all([
            api.get("/stock/ingredientes", { params: { limit: 200 } }),
            api.get("/productos", { params: { limit: 500 } }),
          ]);
          setIngredientes(ingRes.data?.ingredientes || []);
          const prods = Array.isArray(prodRes.data) ? prodRes.data : [];
          setProductosStock(prods);
        }

        if (isShop) {
          const { data } = await api.get("/shop/stock/productos");
          setProductosShop(Array.isArray(data) ? data : []);
        }
      } catch {
        // silencioso
      }
    };

    load();
  }, [tenant, isRest, isShop]);

  /* =========================
     Validación
  ========================= */
  const validate = () => {
    if (!form.nombre.trim()) return "El nombre es obligatorio.";
    if (Number(form.precio) <= 0) return "El precio debe ser mayor que 0.";
    if (Number(form.iva) < 0) return "IVA no válido.";
    if (Number(form.cantidadPorCompra) <= 0) {
      return "La cantidad por compra debe ser mayor que 0.";
    }

    if (isRest) {
      if (tipoAsociacion === "ingrediente" && !form.ingredienteId) {
        return "Debes seleccionar un ingrediente.";
      }
      if (tipoAsociacion === "producto" && !form.productoId) {
        return "Debes seleccionar un producto.";
      }
    }

    if (isShop && !form.productoShopId) {
      return "Debes asociar un producto de tienda.";
    }

    return "";
  };

  /* =========================
     Submit
  ========================= */
  const submit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return setError(msg);
    if (!form.unidad) return setError("Debes seleccionar una unidad.");

    try {
      setSaving(true);
      setError("");

      const cantPorCompra = Number(form.cantidadPorCompra) || 1;
      const payload = {
        nombre: form.nombre,
        unidad: form.unidad,
        formato: form.formato,
        precioBase: Number(form.precio),
        iva: Number(form.iva),
        activo: !!form.activo,
        // Presentación
        cantidadPorCompra: cantPorCompra,
        unidadContenido: form.unidadContenido || "",
        pesoNetoPorItem: Number(form.pesoNetoPorItem) || 0,
        unidadPesoNeto: form.unidadPesoNeto || "",
        // Legacy compat
        factorConversion: cantPorCompra,
        factoresPorPrecio: tieneMultiPrecios ? buildFactoresPorPrecio() : [],

        // Asociaciones
        ingredienteId: isRest && tipoAsociacion === "ingrediente" ? form.ingredienteId : null,
        productoId: isRest && tipoAsociacion === "producto" ? form.productoId : null,
        productoShopId: isShop ? form.productoShopId : null,
      };

      if (isEdit) {
        await api.put(
          `/admin/proveedores/${proveedorId}/productos/${producto._id}`,
          payload
        );
      } else {
        await api.post(
          `/admin/proveedores/${proveedorId}/productos`,
          payload
        );
      }

      onSaved?.();
      onClose?.();
    } catch {
      setError("No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     Render
  ========================= */
  return (
    <Portal>
      <div className="ppModal-backdrop" onMouseDown={onClose}>
        <div className="ppModal card" onMouseDown={(e) => e.stopPropagation()}>
          <header className="ppModal-head">
            <h2 className="ppModal-title">
              {isEdit ? "Editar producto" : "Nuevo producto"}
            </h2>
            <button
              type="button"
              className="ppModal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </header>

          {/* ── Asistente IA (solo en crear) ── */}
          {!isEdit && !aiResult && (
            <div className="ppModal-ai">
              <div className="ppModal-ai-header">
                <span className="ppModal-ai-icon">🤖</span>
                <span>Describe el producto con tus palabras</span>
              </div>
              <textarea
                className="ppModal-ai-input"
                rows={3}
                placeholder='Ej: "Croquetas de espinaca, caja de 4 bolsas de 1kg, cada croqueta 25g, me sale a 44€ sin IVA"'
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                disabled={aiLoading}
              />
              {aiError && <p className="ppModal-ai-error">{aiError}</p>}
              <button
                type="button"
                className="ppModal-ai-btn"
                onClick={handleAiParse}
                disabled={aiLoading || aiText.trim().length < 5}
              >
                {aiLoading ? "Analizando..." : "✨ Analizar con IA"}
              </button>
            </div>
          )}

          {/* ── Preview IA ── */}
          {aiResult && (
            <div className="ppModal-ai-preview">
              <div className="ppModal-ai-header">
                <span className="ppModal-ai-icon">🤖</span>
                <span>Esto es lo que entendí:</span>
              </div>
              <div className="ppModal-ai-card">
                <h3>{aiResult.nombre}</h3>
                <div className="ppModal-ai-details">
                  <span>📦 1 {aiResult.unidad} = {aiResult.cantidadPorCompra} {aiResult.unidadContenido}s</span>
                  {aiResult.pesoNetoPorItem > 0 && (
                    <span>⚖️ {aiResult.pesoNetoPorItem}{aiResult.unidadPesoNeto} por {aiResult.unidadContenido}</span>
                  )}
                  <span>💰 {aiResult.precioBase}€ + IVA {aiResult.iva}% = {aiResult._preview?.precioConIva}€</span>
                  <span>📊 Coste: {aiResult._preview?.costeUnitarioLabel}</span>
                  {aiResult._preview?.costePorPesoLabel && (
                    <span>📊 {aiResult._preview.costePorPesoLabel}</span>
                  )}
                </div>
                {aiResult.formato && <p className="ppModal-ai-formato">{aiResult.formato}</p>}
                {aiResult.resumen && <p className="ppModal-ai-resumen">{aiResult.resumen}</p>}
              </div>
              <div className="ppModal-ai-actions">
                <button type="button" className="ppModal-ai-btn ppModal-ai-btn--secondary" onClick={() => setAiResult(null)}>
                  ✏️ Corregir
                </button>
                <button type="button" className="ppModal-ai-btn ppModal-ai-btn--primary" onClick={applyAiResult}>
                  ✅ Usar estos datos
                </button>
              </div>
            </div>
          )}

          {aiApplied && (
            <div className="ppModal-ai-notice">
              ⚠️ Datos rellenados por IA — revisa que sean correctos y asocia el producto o ingrediente antes de guardar.
            </div>
          )}

          <form className="ppModal-body" onSubmit={submit}>
            {error && <div className="ppModal-alert badge-error">❌ {error}</div>}

            <div className="ppModal-grid">
              <div className="ppModal-field ppModal-field--full">
                <label>Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  autoFocus
                />
              </div>

              {/* ── RESTAURANTE: tipo de asociación + dropdown ── */}
              {isRest && (
                <>
                  <div className="ppModal-field ppModal-field--full">
                    <label>Asociar a *</label>
                    <div className="ppModal-tipo-toggle">
                      <button
                        type="button"
                        className={`ppModal-tipo-btn ${tipoAsociacion === "producto" ? "active" : ""}`}
                        onClick={() => {
                          setTipoAsociacion("producto");
                          set("ingredienteId", "");
                        }}
                      >
                        Producto
                      </button>
                      <button
                        type="button"
                        className={`ppModal-tipo-btn ${tipoAsociacion === "ingrediente" ? "active" : ""}`}
                        onClick={() => {
                          setTipoAsociacion("ingrediente");
                          set("productoId", "");
                        }}
                      >
                        Ingrediente
                      </button>
                    </div>
                    <small className="ppModal-help">
                      {tipoAsociacion === "producto"
                        ? "Vincula a un producto de la carta (Coca-Cola, Solomillo…). Al recibir pedido se sumará a su stock."
                        : "Vincula a un ingrediente del inventario (harina, aceite…). Al recibir pedido se sumará a su stock."}
                    </small>
                  </div>

                  {tipoAsociacion === "ingrediente" && (
                    <div className="ppModal-field ppModal-field--full">
                      <label>Ingrediente *</label>
                      <SearchSelect
                        placeholder="Buscar ingrediente…"
                        value={form.ingredienteId}
                        onChange={(v) => set("ingredienteId", v)}
                        options={ingredientes.map((i) => ({
                          value: i._id,
                          label: `${i.nombre} (${i.stockActual ?? 0} ${i.unidad})`,
                        }))}
                      />
                    </div>
                  )}

                  {tipoAsociacion === "producto" && (
                    <div className="ppModal-field ppModal-field--full">
                      <label>Producto *</label>
                      <SearchSelect
                        placeholder="Buscar producto…"
                        value={form.productoId}
                        onChange={(v) => set("productoId", v)}
                        options={productosStock.map((p) => ({
                          value: p._id,
                          label: `${p.nombre}${p.controlStock ? ` (${p.stock ?? 0} uds)` : ""}`,
                        }))}
                      />
                    </div>
                  )}
                </>
              )}

              {/* ── SHOP: producto de tienda ── */}
              {isShop && (
                <div className="ppModal-field ppModal-field--full">
                  <label>Producto de tienda asociado *</label>
                  <SearchSelect
                    placeholder="Buscar producto…"
                    value={form.productoShopId}
                    onChange={(v) => set("productoShopId", v)}
                    options={productosShop.map((p) => ({
                      value: p._id,
                      label: p.nombre,
                    }))}
                  />
                </div>
              )}

              {/* ── PRESENTACIÓN ── */}
              <div className="ppModal-field">
                <label>Unidad de compra *</label>
                <select
                  value={form.unidad}
                  onChange={(e) => set("unidad", e.target.value)}
                  required
                >
                  <option value="">Selecciona…</option>
                  {UNIDAD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ppModal-field">
                <label>Formato</label>
                <input
                  placeholder="Ej: Caja 24 botellas 237ml"
                  value={form.formato}
                  onChange={(e) => set("formato", e.target.value)}
                />
              </div>

              <div className="ppModal-field">
                <label>Contiene</label>
                <div className="ppModal-inline">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.cantidadPorCompra}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 1;
                      set("cantidadPorCompra", v);
                      set("factorConversion", v);
                    }}
                    className="ppModal-input--short"
                  />
                  <span className="ppModal-inline-sep">×</span>
                  <select
                    value={form.unidadContenido}
                    onChange={(e) => set("unidadContenido", e.target.value)}
                    className="ppModal-select--med"
                  >
                    <option value="">item</option>
                    {UNIDAD_CONTENIDO_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <small className="ppModal-help">
                  Items individuales por compra. Ej: 1 caja = <b>{form.cantidadPorCompra || 1}</b> {form.unidadContenido || "items"}
                </small>
              </div>

              <div className="ppModal-field">
                <label>Peso/volumen por item</label>
                <div className="ppModal-inline">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.pesoNetoPorItem}
                    onChange={(e) => set("pesoNetoPorItem", e.target.value)}
                    placeholder="0"
                    className="ppModal-input--short"
                  />
                  <select
                    value={form.unidadPesoNeto}
                    onChange={(e) => set("unidadPesoNeto", e.target.value)}
                    className="ppModal-select--sm"
                  >
                    <option value="">—</option>
                    {PESO_VOL_UNIDADES.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <small className="ppModal-help">Opcional. Ej: 237 ml por botella, 25000 g por saco</small>
              </div>

              {/* ── RESUMEN CALCULADO ── */}
              {Number(form.precio) > 0 && (
                <div className="ppModal-field ppModal-field--full">
                  <div className="ppModal-resumen">
                    {(() => {
                      const cant = Number(form.cantidadPorCompra) || 1;
                      const precio = Number(form.precio) || 0;
                      const peso = Number(form.pesoNetoPorItem) || 0;
                      const udCont = form.unidadContenido || "item";
                      const udPeso = form.unidadPesoNeto || "";
                      const costePorItem = cant > 0 ? precio / cant : precio;
                      const totalPeso = peso > 0 ? cant * peso : 0;
                      const costePorPeso = totalPeso > 0 ? precio / totalPeso : 0;

                      return (
                        <>
                          <span className="ppModal-resumen__line">
                            1 {form.unidad || "compra"} = <b>{cant} {udCont}{cant !== 1 ? "s" : ""}</b>
                            {totalPeso > 0 && <> = <b>{totalPeso.toLocaleString()} {udPeso}</b></>}
                          </span>
                          <span className="ppModal-resumen__line">
                            Coste: <b>{costePorItem.toFixed(2)} €/{udCont}</b>
                            {costePorPeso > 0 && <> · {costePorPeso.toFixed(4)} €/{udPeso}</>}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Multi-precio: unidad base + ratios */}
              {tieneMultiPrecios && (
                <>
                  <div className="ppModal-field ppModal-field--full">
                    <label>Este producto se vende de varias formas. ¿Cual es la unidad que compras?</label>
                    <div className="ppModal-tipo-toggle">
                      {preciosProducto.map((p) => (
                        <button
                          key={p.clave}
                          type="button"
                          className={`ppModal-tipo-btn ${unidadBase === p.clave ? "active" : ""}`}
                          onClick={() => setUnidadBase(p.clave)}
                        >
                          {p.label || p.clave}
                        </button>
                      ))}
                    </div>
                    {unidadBase && (
                      <small className="ppModal-help">
                        Compras por <b>{preciosProducto.find(p => p.clave === unidadBase)?.label || unidadBase}</b>.
                        El formato trae <b>{form.cantidadPorCompra || "?"}</b> unidades.
                      </small>
                    )}
                  </div>

                  {unidadBase && preciosProducto.filter(p => p.clave !== unidadBase).map((p) => (
                    <div className="ppModal-field" key={p.clave}>
                      <label>¿Cuantas {(p.label || p.clave).toLowerCase()}s salen de 1 {(preciosProducto.find(pr => pr.clave === unidadBase)?.label || unidadBase).toLowerCase()}?</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={ratios[p.clave] || ""}
                        onChange={(e) => setRatio(p.clave, e.target.value)}
                        placeholder="Ej: 5"
                      />
                    </div>
                  ))}

                  {/* Resumen de costes calculados */}
                  {unidadBase && Number(form.precio) > 0 && Number(form.cantidadPorCompra) > 0 && (
                    <div className="ppModal-field ppModal-field--full">
                      <label>Coste calculado</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        {preciosProducto.map((p) => {
                          const coste = getCostePorTipo(p.clave);
                          if (coste == null) return null;
                          const margen = p.precio > 0 ? ((p.precio - coste) / p.precio * 100) : 0;
                          const margenColor = margen < 0 ? "#ef4444" : margen < 40 ? "#f59e0b" : "#16a34a";
                          return (
                            <div key={p.clave} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                              <span style={{ fontWeight: 700, minWidth: 80 }}>{p.label || p.clave}</span>
                              <span>{coste.toFixed(2)}€ coste</span>
                              <span style={{ color: "#9ca3af" }}>→</span>
                              <span>venta {p.precio}€</span>
                              <span style={{ color: "#9ca3af" }}>→</span>
                              <span style={{ fontWeight: 700, color: margenColor }}>margen {margen.toFixed(0)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="ppModal-field">
                <label>Precio *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio}
                  onChange={(e) => set("precio", e.target.value)}
                />
              </div>

              <div className="ppModal-field">
                <label>IVA (%)</label>
                <select
                  value={form.iva}
                  onChange={(e) => set("iva", e.target.value)}
                >
                  <option value={0}>0%</option>
                  <option value={4}>4%</option>
                  <option value={10}>10%</option>
                  <option value={21}>21%</option>
                </select>
              </div>

              <div className="ppModal-toggle">
                <input
                  id="activo"
                  type="checkbox"
                  checked={!!form.activo}
                  onChange={(e) => set("activo", e.target.checked)}
                />
                <label htmlFor="activo">Producto activo</label>
              </div>
            </div>

            <footer className="ppModal-foot">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primario "
                disabled={saving}
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Portal>
  );
}
