import React, { useEffect, useMemo, useState, useRef } from "react";
import api from "../../utils/api";
import AlefSelect from "../AlefSelect/AlefSelect";
import { useImageUpload } from "../../Hooks/useImageUpload";
import { useCategorias } from "../../context/CategoriasContext";
import { useAuth } from "../../context/AuthContext";
import AlertaMensaje from "../AlertaMensaje/AlertaMensaje";

import "./CrearProducto.css";

/* =========================
   Helpers
========================= */
const toNumOrNull = (v) => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const safeStr = (v) => (v == null ? "" : String(v));

const ensureTraducciones = (t) => {
  const base = t && typeof t === "object" ? t : {};
  return {
    en: { nombre: safeStr(base?.en?.nombre), descripcion: safeStr(base?.en?.descripcion) },
    fr: { nombre: safeStr(base?.fr?.nombre), descripcion: safeStr(base?.fr?.descripcion) },
  };
};

const PRECIO_SUGGESTIONS = [
  "precioBase", "tapa", "racion", "copa", "botella",
  "jarra", "pincho", "medio", "unidad", "docena",
];

/**
 * Backward compat: convert old flat object format to new array format.
 * If already an array, return as-is.
 */
const normalizePrecios = (precios) => {
  // Already new format
  if (Array.isArray(precios)) {
    return precios.map((p, i) => ({
      clave: p.clave || "",
      label: p.label || "",
      precio: p.precio ?? 0,
      descripcion: p.descripcion || "",
      orden: p.orden ?? i,
    }));
  }

  // Old flat object format -> convert to array
  const p = precios && typeof precios === "object" ? precios : {};
  const arr = [];
  let orden = 0;

  const addIfPresent = (key, label) => {
    const val = p[key];
    if (val != null && val !== "" && val !== 0 && val !== "0") {
      arr.push({ clave: key, label, precio: Number(val) || 0, orden: orden++ });
    }
  };

  // Always include precioBase
  arr.push({
    clave: "precioBase",
    label: "Precio",
    precio: Number(p.precioBase) || 0,
    orden: orden++,
  });

  addIfPresent("tapa", "Tapa");
  addIfPresent("racion", "Ración");
  addIfPresent("precioCopa", "Copa");
  addIfPresent("copa", "Copa");
  addIfPresent("precioBotella", "Botella");
  addIfPresent("botella", "Botella");

  return arr.length ? arr : [{ clave: "precioBase", label: "Precio", precio: 0, orden: 0 }];
};

const EditProduct = ({
  product,
  onSave,
  onCancel,
  ingredientesStock = [],
}) => {
  const { user } = useAuth();
  const isPlanEsencial = user?.plan === "esencial" || user?.plan === "tpv-esencial";
  const {
    dragging,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    onFileChange: handleFileChange,
  } = useImageUpload();
  const { categoryObjectsByTipo, fetchCategoryObjects } = useCategorias();
  const [secciones, setSecciones] = useState([]);
  const [estaciones, setEstaciones] = useState([]);

  // === categoría: selector + "Otra..." como en CrearProducto
  const [usarOtraCategoria, setUsarOtraCategoria] = useState(false);

  // === imagen preview local (sin romper tu subida)
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [alerta, setAlerta] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // =========================
  // FormData inicial = product
  // =========================
  const initial = useMemo(() => {
    const aliasesArr = Array.isArray(product?.aliases) ? product.aliases : [];
    const alergenosArr = Array.isArray(product?.alergenos) ? product.alergenos : [];

    // receta
    const recetaArr = Array.isArray(product?.receta) ? product.receta : [];

    return {
      _id: product?._id,

      nombre: safeStr(product?.nombre),
      descripcion: safeStr(product?.descripcion),

      traducciones: ensureTraducciones(product?.traducciones),

      categoria: safeStr(product?.categoria),
      tipo: safeStr(product?.tipo || "plato"), // "plato" | "bebida"

      seccion: safeStr(product?.seccion),
      estacion: safeStr(product?.estacion),
      estado: safeStr(product?.estado || "habilitado"),

      precios: normalizePrecios(product?.precios),

      // adicional (unidad extra)
      adicionales: Array.isArray(product?.adicionales) ? product.adicionales : [],
      // para UI de input cómodo:
      adicionalPrecioUI: safeStr(product?.adicionales?.[0]?.precio ?? ""),

      // voz + alergias
      aliases: aliasesArr,
      aliasesString: aliasesArr.join(", "),
      alergenos: alergenosArr,

      // imagen
      img: safeStr(product?.img || product?.imagen || ""), // compat

      // receta
      receta: recetaArr,
      nuevoIng: "",
      nuevaCantidad: "",

      // stock directo
      stock: product?.stock ?? 0,
      controlStock: product?.controlStock ?? false,

      imprimirSiempre: product?.imprimirSiempre ?? false,
    };
  }, [product]);

  const [formData, setFormData] = useState(initial);

  // rehidratar si cambia el producto
  useEffect(() => setFormData(initial), [initial]);

  // Cargar categorías del modelo Categoria por tipo
  useEffect(() => {
    if (formData.tipo) {
      fetchCategoryObjects(formData.tipo);
    }
  }, [formData.tipo, fetchCategoryObjects]);

  // Nombres de categorías para el select
  const categorias = useMemo(() => {
    const tipo = formData.tipo;
    if (!tipo) return [];
    const objects = categoryObjectsByTipo[tipo] || [];
    return objects.map((c) => c.nombre).sort((a, b) => a.localeCompare(b, "es"));
  }, [formData.tipo, categoryObjectsByTipo]);

  // usarOtraCategoria: si la categoría actual no está en la lista, abre input
  useEffect(() => {
    if (!categorias?.length) return;
    const actual = safeStr(formData.categoria);
    setUsarOtraCategoria(actual && !categorias.includes(actual));
  }, [categorias, formData.categoria]);

  // cargar secciones/estaciones
  useEffect(() => {
    if (!formData.tipo) return;

    const destino =
      formData.tipo === "bebida" ? "barra" : "cocina";

    api
      .get("/estaciones", {
        params: { destino, includeInactive: 0 },
      })
      .then((res) => {
        const items = res?.data?.items || [];
        setEstaciones(Array.isArray(items) ? items : []);
      })
      .catch((err) =>
        console.error("❌ Error cargando estaciones:", err)
      );
  }, [formData.tipo]);

  useEffect(() => {
    const fetchSecciones = async () => {
      try {
        const res = await api.get("/secciones");
        const items = res?.data?.items || [];
        setSecciones(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error("Error cargando secciones:", err);
      }
    };

    fetchSecciones();
  }, []);

  // limpiar preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // =========================
  // Handlers
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrecioChange = (index, field, value) => {
    setFormData((prev) => {
      const next = [...prev.precios];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, precios: next };
    });
  };

  const addPrecio = () => {
    setFormData((prev) => ({
      ...prev,
      precios: [
        ...prev.precios,
        { clave: "", label: "", precio: 0, orden: prev.precios.length },
      ],
    }));
  };

  const removePrecio = (index) => {
    setFormData((prev) => ({
      ...prev,
      precios: prev.precios.filter((_, i) => i !== index),
    }));
  };

  const setTraduccion = (lang, campo, value) => {
    setFormData((prev) => ({
      ...prev,
      traducciones: {
        ...prev.traducciones,
        [lang]: {
          ...prev.traducciones?.[lang],
          [campo]: value,
        },
      },
    }));
  };

  const onBlurAliases = (value) => {
    const parsed = value
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    setFormData((prev) => ({
      ...prev,
      aliases: parsed,
      aliasesString: parsed.join(", "),
    }));
  };

  const onChangeAlergenos = (value) => {
    const arr = value
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean);

    setFormData((prev) => ({ ...prev, alergenos: arr }));
  };

  const manejarCambioArchivo = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      await handleFileChange(e, setFormData);
    } catch {
      setAlerta({ tipo: "error", mensaje: "Error al subir la imagen." });
    } finally {
      setUploading(false);
    }
  };

  const manejarDropArchivo = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setUploading(true);

    try {
      const file = await handleDrop(e, setFormData);
      if (file) {
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
    } catch {
      setAlerta({ tipo: "error", mensaje: "Error al subir la imagen." });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || uploading) return;

    const preciosArr = (formData.precios || []).map((p, i) => ({
      clave: p.clave || "precioBase",
      label: p.label || "",
      precio: toNumOrNull(p.precio) ?? 0,
      descripcion: p.descripcion || "",
      orden: p.orden ?? i,
    }));

    const tienePrecio = preciosArr.some((p) => (toNumOrNull(p.precio) ?? 0) > 0);

    if (!tienePrecio) {
      setAlerta({
        tipo: "error",
        mensaje: "Debes indicar al menos un precio.",
      });
      return;
    }

    const adicionalPrecio = toNumOrNull(formData.adicionalPrecioUI);
    const adicionales =
      adicionalPrecio != null && adicionalPrecio > 0
        ? [{ nombre: "Unidad adicional", precio: adicionalPrecio }]
        : [];

    const payload = {
      _id: product?._id,
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      categoria: formData.categoria,
      tipo: formData.tipo,
      estado: formData.estado,
      seccion: formData.seccion,
      estacion: formData.estacion,
      precios: preciosArr,
      traducciones: formData.traducciones,
      adicionales,
      aliases: formData.aliases,
      alergenos: formData.alergenos,
      receta: Array.isArray(formData.receta) ? formData.receta : [],
      stock: Number(formData.stock) || 0,
      controlStock: !!formData.controlStock,
      imprimirSiempre: !!formData.imprimirSiempre,
      img: formData.img || undefined,
    };

    try {
      setSaving(true);
      await onSave(payload);
      // onSave del padre se encarga de cerrar el modal si tiene éxito
    } catch (error) {
      setAlerta({
        tipo: "error",
        mensaje:
          error.response?.data?.message ||
          "Error al actualizar el producto",
      });
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // Render
  // =========================
  return (
    <div className="crear-producto-overlay--crear" onClick={onCancel}>
      <div
        className="crear-producto-modal--crear"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="titulo--crear">Editar producto</h2>

        {alerta && (
          <AlertaMensaje
            tipo={alerta.tipo}
            mensaje={alerta.mensaje}
            onClose={() => setAlerta(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="form--crear">
          {/* === COLUMNAS PRINCIPALES === */}
          <div className="form-columns--crear">
            {/* -------- Columna 1: Identidad + textos (carta) -------- */}
            <section className="form-section--crear">
              <div className="form-group--crear">
                <label className="label--crear">
                  Nombre:
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="input--crear"
                    required
                  />
                  <p className="help-text--crear">
                    Nombre del producto tal y como aparecerá en la carta digital y
                    en el TPV.
                  </p>
                </label>

                <label className="label--crear">
                  Descripción:
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    className="textarea--crear"
                    required
                  />
                  <p className="help-text--crear">
                    Descripción visible para el cliente en la carta digital.
                  </p>
                </label>

                {/* === ALÉRGENOS (no mezclado con VOZ) === */}
                <h4 className="subtitulo--crear">⚠️ Alérgenos</h4>
                <p className="help-text--crear">
                  Se muestra al cliente en la carta digital y ayuda a cocina a
                  identificar riesgos.
                </p>

                <label className="label--editar">
                  Alérgenos (separados por comas):
                  <input
                    type="text"
                    value={formData.alergenos?.join(", ") || ""}
                    onChange={(e) => onChangeAlergenos(e.target.value)}
                    className="input--editar"
                    placeholder="Ej: gluten, lactosa, huevo"
                  />
                </label>

                {/* === BLOQUE TRADUCCIONES === */}
                <h4 className="subtitulo--crear">🌍 Traducciones para la carta</h4>
                <p className="help-text--crear">
                  Se mostrarán automáticamente cuando el cliente cambie el idioma
                  en la carta.
                </p>

                <label className="label--editar">
                  Nombre en inglés:
                  <input
                    type="text"
                    value={formData.traducciones?.en?.nombre || ""}
                    onChange={(e) =>
                      setTraduccion("en", "nombre", e.target.value)
                    }
                    className="input--editar"
                    placeholder="Ej: Ham croquettes"
                  />
                  <p className="help-text--crear">
                    Nombre en inglés visible en la carta.
                  </p>
                </label>

                <label className="label--editar">
                  Descripción en inglés:
                  <input
                    type="text"
                    value={formData.traducciones?.en?.descripcion || ""}
                    onChange={(e) =>
                      setTraduccion("en", "descripcion", e.target.value)
                    }
                    className="input--editar"
                    placeholder="Ej: Delicious ham croquettes"
                  />
                  <p className="help-text--crear">
                    Descripción en inglés visible en la carta.
                  </p>
                </label>

                <label className="label--editar">
                  Nombre en francés:
                  <input
                    type="text"
                    value={formData.traducciones?.fr?.nombre || ""}
                    onChange={(e) =>
                      setTraduccion("fr", "nombre", e.target.value)
                    }
                    className="input--editar"
                    placeholder="Ej: Croquettes au jambon"
                  />
                  <p className="help-text--crear">
                    Nombre en francés visible en la carta.
                  </p>
                </label>

                <label className="label--editar">
                  Descripción en francés:
                  <input
                    type="text"
                    value={formData.traducciones?.fr?.descripcion || ""}
                    onChange={(e) =>
                      setTraduccion("fr", "descripcion", e.target.value)
                    }
                    className="input--editar"
                    placeholder="Ej: Délicieuses croquettes au jambon"
                  />
                  <p className="help-text--crear">
                    Descripción en francés visible en la carta.
                  </p>
                </label>
              </div>
            </section>

            {/* -------- Columna 2: Clasificación + flujo (TPV) -------- */}
            <section className="form-section--crear">
              <div className="form-group--crear">
                {/* === CATEGORÍA === */}
                <label className="label--crear">
                  Categoría:
                  {!usarOtraCategoria ? (
                    <AlefSelect
                      label=""
                      value={formData.categoria}
                      options={[...categorias, "Otra..."]}
                      onChange={(value) => {
                        if (value === "Otra...") {
                          setUsarOtraCategoria(true);
                          setFormData((prev) => ({ ...prev, categoria: "" }));
                        } else {
                          setUsarOtraCategoria(false);
                          setFormData((prev) => ({ ...prev, categoria: value }));
                        }
                      }}
                    />
                  ) : (
                    <>
                      <input
                        type="text"
                        name="categoria"
                        placeholder="Escribe nueva categoría"
                        value={formData.categoria}
                        onChange={handleChange}
                        className="input--crear"
                        required
                      />
                      {categorias.length > 0 && (
                        <button
                          type="button"
                          className="link-btn--crear"
                          onClick={() => {
                            setUsarOtraCategoria(false);
                            setFormData((prev) => ({ ...prev, categoria: "" }));
                          }}
                        >
                          ← Elegir categoría existente
                        </button>
                      )}
                    </>
                  )}

                  <p className="help-text--crear">
                    {usarOtraCategoria
                      ? "Escribe el nombre de la nueva categoría. Se creará automáticamente al guardar."
                      : "Organiza productos en TPV y permite filtrar la carta por tipo."}
                  </p>
                </label>

                {/* === VISIBILIDAD EN CARTA === */}
                <label className="label--crear">
                  Visible en carta:
                  <div className="estado-toggle--crear">
                    <input
                      type="checkbox"
                      checked={formData.estado === "habilitado"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          estado: e.target.checked ? "habilitado" : "deshabilitado",
                        }))
                      }
                    />
                    <span>
                      {formData.estado === "habilitado" ? "Habilitado" : "Deshabilitado"}
                    </span>
                  </div>

                  <p className="help-text--crear">
                    Si lo deshabilitas, <strong>no se mostrará en la carta digital</strong> para clientes,
                    pero <strong>seguirá apareciendo en el panel interno</strong> para tomar nota.
                    <br />
                    <em>Ejemplo:</em> si hoy no tienes "Croquetas", la deshabilitas para que no la pidan
                    por QR, pero el camarero aún podrá añadirla desde el TPV si decides venderlas en sala.
                  </p>
                </label>

                {/* === TIPO === */}
                <label className="label--crear">
                  Tipo:
                  <AlefSelect
                    value={formData.tipo}
                    options={["plato", "bebida"]}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, tipo: value }))
                    }
                  />
                  <p className="help-text--crear">
                    Define si se gestiona como plato o bebida.
                  </p>
                </label>

                {/* === SECCIÓN === */}
                <label className="label--crear">
                  Sección:
                  <AlefSelect
                    value={formData.seccion}
                    options={secciones.map((sec) => ({
                      label: sec.nombre,
                      value: sec.slug,
                    }))}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, seccion: value }))
                    }
                  />
                  <p className="help-text--crear">
                    Sección predeterminada en cocina (Entrantes, Principales,
                    Postres…).
                  </p>
                </label>

                {/* === ESTACIÓN === */}
                {!isPlanEsencial && (
                  <label className="label--crear">
                    Estación:
                    <AlefSelect
                      value={formData.estacion}
                      options={estaciones.map((est) => ({
                        label: est.nombre,
                        value: est.slug,
                      }))}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, estacion: value }))
                      }
                    />
                    <p className="help-text--crear">
                      Subdivisión (plancha, freidora, barra, postres…).
                    </p>
                  </label>
                )}
              </div>

              {/* === PRECIOS (array dinámico) === */}
              {formData.tipo && (
                <fieldset className="fieldset--crear">
                  <legend className="legend--crear">Precios</legend>
                  <p className="help-text--crear">
                    Agrega tantas variantes de precio como necesites (base, tapa,
                    ración, copa, botella, etc.). La primera entrada se considera el
                    precio principal.
                  </p>

                  <datalist id="precio-suggestions-edit">
                    {PRECIO_SUGGESTIONS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>

                  {formData.precios.map((entry, idx) => (
                    <div key={idx} className="precio-entry-row">
                      <label className="label--crear">
                        Clave:
                        <input
                          type="text"
                          list="precio-suggestions-edit"
                          value={entry.clave}
                          onChange={(e) => handlePrecioChange(idx, "clave", e.target.value)}
                          className="input--crear"
                          placeholder="precioBase"
                          required
                        />
                      </label>
                      <label className="label--crear">
                        Etiqueta:
                        <input
                          type="text"
                          value={entry.label}
                          onChange={(e) => handlePrecioChange(idx, "label", e.target.value)}
                          className="input--crear"
                          placeholder="Precio"
                        />
                      </label>
                      <label className="label--crear">
                        Detalle:
                        <input
                          type="text"
                          value={entry.descripcion || ""}
                          onChange={(e) => handlePrecioChange(idx, "descripcion", e.target.value)}
                          className="input--crear"
                          placeholder="2 uds, 200g..."
                          maxLength={100}
                        />
                      </label>
                      <label className="label--crear">
                        Precio:
                        <input
                          type="number"
                          value={entry.precio}
                          onChange={(e) => handlePrecioChange(idx, "precio", e.target.value)}
                          className="input--crear"
                          min="0"
                          step="0.01"
                          required
                        />
                      </label>
                      {formData.precios.length > 1 && (
                        <button
                          type="button"
                          className="btn-icon--crear"
                          onClick={() => removePrecio(idx)}
                          title="Eliminar precio"
                          aria-label="Eliminar precio"
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    className="boton--secundario"
                    onClick={addPrecio}
                  >
                    + Añadir precio
                  </button>

                  <fieldset className="fieldset--crear fieldset--adicional">
                    <legend className="legend--crear">Adicional (unidad extra)</legend>
                    <p className="help-text--crear">
                      Permite añadir una unidad extra (ej: 1 croqueta extra).
                    </p>

                    <label className="label--crear">
                      Precio del adicional:
                      <input
                        type="number"
                        value={formData.adicionalPrecioUI}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            adicionalPrecioUI: e.target.value,
                          }))
                        }
                        className="input--crear"
                        min="0"
                        step="0.01"
                      />
                    </label>
                  </fieldset>
                </fieldset>
              )}
            </section>
          </div>

          {/* === BLOQUE INFERIOR: imagen + voz === */}
          <section className="form-section--crear">
            <div className="form-group--crear">
              {/* === IMAGEN === */}
              <h4 className="subtitulo--crear">🖼️ Imagen del producto</h4>
              <p className="help-text--crear">
                Puedes mantener la imagen actual o reemplazarla subiendo una nueva.
              </p>

              {/* preview actual (si hay URL previa y no hay preview nuevo) */}
              {!previewUrl && formData.img && (
                <div className="preview-container" style={{ marginTop: 10 }}>
                  <img
                    src={formData.img}
                    alt="Imagen actual"
                    className="preview-img"
                  />
                </div>
              )}

              <div
                className={`drop-zone ${dragging ? "dragging" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={manejarDropArchivo}
                onClick={() => fileInputRef.current?.click()}
              >
                <p>{uploading ? "Subiendo imagen..." : "Arrastra una imagen aquí o haz clic para subir"}</p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={manejarCambioArchivo}
                  className="hidden-file-input"
                />

                {imageFile && <p>📂 {imageFile.name}</p>}
              </div>

              {previewUrl && (
                <div className="preview-container">
                  <img src={previewUrl} alt="Vista previa" className="preview-img" />
                </div>
              )}

              {/* === VOZ (aliases) === */}
              <h4 className="subtitulo--crear">🎙️ Aliases para comandas por voz</h4>
              <p className="help-text--crear">
                Añade formas habituales de pedirlo (ej: "croqueta", "croquetas de
                jamón", "jamón").
              </p>

              <label className="label--editar">
                Aliases (separados por comas):
                <input
                  type="text"
                  value={formData.aliasesString}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      aliasesString: e.target.value,
                    }))
                  }
                  onBlur={(e) => onBlurAliases(e.target.value)}
                  className="input--editar"
                  placeholder="Ej: croqueta, jamon, croquetas jamon"
                />
              </label>
            </div>
          </section>

          {/* === STOCK DIRECTO === */}
          <fieldset className="fieldset--crear">
            <legend className="legend--crear">
              📦 Stock directo del producto
            </legend>

            <p className="help-text--crear">
              Ideal para productos unitarios (solomillo, entreCôt, salmón…).
              Activa el control y establece las unidades disponibles.
              Se descontará automáticamente con cada pedido.
            </p>

            <div className="stock-directo-row--crear">
              <label className="toggle-stock--crear">
                <input
                  type="checkbox"
                  checked={!!formData.controlStock}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      controlStock: e.target.checked,
                    }))
                  }
                />
                <span className="toggle-stock-label--crear">
                  Control de stock activo
                </span>
              </label>

              {formData.controlStock && (
                <label className="label--editar stock-cantidad--crear">
                  Unidades disponibles
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="input--crear"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        stock: e.target.value,
                      }))
                    }
                  />
                </label>
              )}
            </div>

            <div className="stock-directo-row--crear" style={{ marginTop: "12px" }}>
              <label className="toggle-stock--crear">
                <input
                  type="checkbox"
                  checked={!!formData.imprimirSiempre}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      imprimirSiempre: e.target.checked,
                    }))
                  }
                />
                <span className="toggle-stock-label--crear">
                  Imprimir siempre
                </span>
              </label>
              <p className="help-text--crear" style={{ marginTop: "4px" }}>
                Si la impresion de pedidos esta desactivada para cocina o barra,
                este producto se seguira imprimiendo igualmente.
              </p>
            </div>
          </fieldset>

          {/* === RECETA === */}
          <fieldset className="fieldset--crear">
            <legend className="legend--crear">
              🧪 Receta y control de stock
              {isPlanEsencial && (
                <span style={{ marginLeft: 8, fontSize: "14px", color: "#ff6700" }}>
                  🔒 Solo en plan Profesional
                </span>
              )}
            </legend>

            <p className="help-text--crear">
              Vincula ingredientes del stock para descontarlos automáticamente
              cuando se sirve.
            </p>

            <div
              className="receta-crear-lista"
              style={{
                opacity: isPlanEsencial ? 0.45 : 1,
                pointerEvents: isPlanEsencial ? "none" : "auto",
              }}
            >
              {formData.receta.map((item, index) => {
                const ing = ingredientesStock.find(
                  (i) => i._id === item.ingrediente
                );
                return (
                  <div key={index} className="receta-item--crear">
                    <span className="receta-nombre--crear">
                      {ing?.nombre || "Ingrediente eliminado"}
                    </span>

                    <strong className="receta-cant--crear">
                      {item.cantidad}
                      {ing?.unidad || ""}
                    </strong>

                    <button
                      type="button"
                      className="btn-icon--crear"
                      onClick={() => {
                        const nueva = formData.receta.filter((_, i) => i !== index);
                        setFormData((prev) => ({ ...prev, receta: nueva }));
                      }}
                    >
                      ❌
                    </button>
                  </div>
                );
              })}
            </div>

            <div
              className="receta-add--crear"
              style={{
                opacity: isPlanEsencial ? 0.45 : 1,
                pointerEvents: isPlanEsencial ? "none" : "auto",
              }}
            >
              <AlefSelect
                label="Ingrediente"
                options={ingredientesStock.map((i) => ({
                  label: i.nombre,
                  value: i._id,
                }))}
                value={formData.nuevoIng}
                onChange={(v) =>
                  setFormData((prev) => ({ ...prev, nuevoIng: v }))
                }
                placeholder="Selecciona ingrediente"
              />

              <input
                type="number"
                className="input--crear"
                placeholder="Cantidad"
                value={formData.nuevaCantidad || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nuevaCantidad: e.target.value }))
                }
              />

              <button
                type="button"
                className="boton--secundario"
                onClick={() => {
                  if (!formData.nuevoIng || !formData.nuevaCantidad) return;

                  const nuevaLinea = {
                    ingrediente: formData.nuevoIng,
                    cantidad: Number(formData.nuevaCantidad),
                  };

                  setFormData((prev) => ({
                    ...prev,
                    receta: [...prev.receta, nuevaLinea],
                    nuevoIng: "",
                    nuevaCantidad: "",
                  }));
                }}
              >
                ➕ Añadir
              </button>
            </div>

            {isPlanEsencial && (
              <p
                style={{
                  marginTop: 12,
                  fontSize: 14,
                  textAlign: "center",
                  color: "#ff6700",
                }}
              >
                Para gestionar recetas completas, mejora tu plan a{" "}
                <strong>Profesional</strong>.
              </p>
            )}
          </fieldset>

          {/* === BOTONES === */}
          <div className="botones--crear">
            <button type="submit" className="boton--crear" disabled={saving || uploading}>
              {saving ? "Guardando..." : uploading ? "Subiendo imagen..." : "Guardar cambios"}
            </button>

            <button type="button" onClick={onCancel} className="boton--cancelar" disabled={saving}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
