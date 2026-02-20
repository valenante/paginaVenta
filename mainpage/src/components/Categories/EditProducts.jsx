import React, { useEffect, useMemo, useState, useContext, useRef } from "react";
import api from "../../utils/api";
import AlefSelect from "../AlefSelect/AlefSelect";
import { useImageUpload } from "../../Hooks/useImageUpload";
import AlertaMensaje from "../AlertaMensaje/AlertaMensaje";

// ✅ reutiliza el CSS del CrearProducto (recomendado)
// Ajusta la ruta real a tu proyecto:
import "./CrearProducto.css";

// Si prefieres, puedes dejar EditProducts.css y copiar ahí los estilos --crear.
// import "./EditProducts.css";

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

const normalizePrecios = (precios) => {
  const p = precios && typeof precios === "object" ? precios : {};
  return {
    // platos
    precioBase: safeStr(p.precioBase ?? ""),
    tapa: safeStr(p.tapa ?? ""),
    racion: safeStr(p.racion ?? ""),

    // bebidas (compatibilidad: a veces guardabas copa/botella)
    precioCopa: safeStr(p.precioCopa ?? p.copa ?? ""),
    precioBotella: safeStr(p.precioBotella ?? p.botella ?? ""),
  };
};

const EditProduct = ({
  product,
  onSave,
  onCancel,

  // ✅ pásalas desde el padre si las tienes (como en CrearProducto)
  categorias = [],
  ingredientesStock = [],

  // ✅ para bloquear receta como en CrearProducto
  isPlanEsencial = false,
}) => {
  const {
    dragging,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    onFileChange: handleFileChange,
  } = useImageUpload();
  const [secciones, setSecciones] = useState([]);
  const [estaciones, setEstaciones] = useState([]);

  // === categoría: selector + "Otra..." como en CrearProducto
  const [usarOtraCategoria, setUsarOtraCategoria] = useState(false);

  // === imagen preview local (sin romper tu subida)
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [alerta, setAlerta] = useState(null);
  const [saving, setSaving] = useState(false);
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
    };
  }, [product]);

  const [formData, setFormData] = useState(initial);

  // rehidratar si cambia el producto
  useEffect(() => setFormData(initial), [initial]);

  // usarOtraCategoria: si hay lista de categorias y la actual no está, abre input
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
      .then(({ data }) => {
        setEstaciones(Array.isArray(data) ? data : []);
      })
      .catch((err) =>
        console.error("❌ Error cargando estaciones:", err)
      );
  }, [formData.tipo]);

  useEffect(() => {
    const fetchSecciones = async () => {
      try {
        const { data } = await api.get("/secciones");
        setSecciones(Array.isArray(data) ? data : []);
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

    // precios.*
    if (name.startsWith("precios.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        precios: { ...prev.precios, [key]: value },
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const manejarCambioArchivo = (e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
    // tu lógica de subida (deja que setee formData.img si subes a cloud)
    handleFileChange(e, setFormData);
  };

  const manejarDropArchivo = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e?.dataTransfer?.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    // tu lógica de subida
    handleDrop(e, setFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ construir payload final como en CrearProducto
    const precioBase = toNumOrNull(formData.precios.precioBase) ?? 0;
    const precioCopa = toNumOrNull(formData.precios.precioCopa) ?? 0;
    const precioBotella = toNumOrNull(formData.precios.precioBotella) ?? 0;
    const tapa = toNumOrNull(formData.precios.tapa) ?? 0;
    const racion = toNumOrNull(formData.precios.racion) ?? 0;

    const tienePrecio =
      formData.tipo === "plato"
        ? precioBase > 0 || tapa > 0 || racion > 0
        : precioBase > 0 || precioCopa > 0 || precioBotella > 0;

    if (!tienePrecio) {
      setAlerta({
        tipo: "error",
        mensaje:
          formData.tipo === "plato"
            ? "Debes indicar al menos un precio (base, tapa o ración)."
            : "Debes indicar al menos un precio (base, copa o botella).",
      });
      return;
    }

    // adicional
    const adicionalPrecio = toNumOrNull(formData.adicionalPrecioUI);
    const adicionales =
      adicionalPrecio != null && adicionalPrecio > 0
        ? [{ nombre: "Unidad adicional", precio: adicionalPrecio }]
        : [];

    const payload = {
      ...product, // conserva campos no editados
      ...formData,

      // precios normalizados
      precios: {
        precioBase: toNumOrNull(formData.precios.precioBase) ?? 0,

        // platos
        tapa: toNumOrNull(formData.precios.tapa),
        racion: toNumOrNull(formData.precios.racion),

        // bebidas
        precioCopa: toNumOrNull(formData.precios.precioCopa),
        precioBotella: toNumOrNull(formData.precios.precioBotella),
      },

      adicionales,
      aliases: formData.aliases,
      alergenos: formData.alergenos,

      // receta tal cual (ya son ids + cantidad)
      receta: Array.isArray(formData.receta) ? formData.receta : [],
    };

    // limpia helpers UI
    delete payload.aliasesString;
    delete payload.adicionalPrecioUI;
    delete payload.nuevoIng;
    delete payload.nuevaCantidad;

    try {
      setSaving(true);

      await onSave(payload);

      setAlerta({
        tipo: "success",
        mensaje: "✅ Producto actualizado correctamente",
      });

      setTimeout(onCancel, 800);

    } catch (error) {
      setAlerta({
        tipo: "error",
        mensaje:
          error.response?.data?.message ||
          "❌ Error al actualizar el producto",
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
                  {categorias?.length ? (
                    !usarOtraCategoria ? (
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
                      <input
                        type="text"
                        name="categoria"
                        placeholder="Escribe nueva categoría"
                        value={formData.categoria}
                        onChange={handleChange}
                        className="input--crear"
                        required
                      />
                    )
                  ) : (
                    <input
                      type="text"
                      name="categoria"
                      placeholder="Ej: entrantes, postres..."
                      value={formData.categoria}
                      onChange={handleChange}
                      className="input--crear"
                      required
                    />
                  )}

                  <p className="help-text--crear">
                    Organiza productos en TPV y permite filtrar la carta por tipo.
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
                    <em>Ejemplo:</em> si hoy no tienes “Croquetas”, la deshabilitas para que no la pidan
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

              {/* === PRECIOS === */}
              {formData.tipo === "plato" && (
                <fieldset className="fieldset--crear">
                  <legend className="legend--crear">Precios plato</legend>

                  <div className="form-group--crear">
                    <label className="label--crear">
                      Precio base:
                      <input
                        type="number"
                        name="precios.precioBase"
                        value={formData.precios.precioBase}
                        onChange={handleChange}
                        className="input--crear"
                        min="0"
                        step="0.01"
                        required
                      />
                      <p className="help-text--crear">Precio estándar del producto.</p>
                    </label>

                    <label className="label--crear">
                      Precio tapa:
                      <input
                        type="number"
                        name="precios.tapa"
                        value={formData.precios.tapa || ""}
                        onChange={handleChange}
                        className="input--crear"
                        min="0"
                        step="0.01"
                      />
                      <p className="help-text--crear">
                        Opcional si se vende como tapa.
                      </p>
                    </label>

                    <label className="label--crear">
                      Precio ración:
                      <input
                        type="number"
                        name="precios.racion"
                        value={formData.precios.racion || ""}
                        onChange={handleChange}
                        className="input--crear"
                        min="0"
                        step="0.01"
                      />
                      <p className="help-text--crear">
                        Opcional si se vende como ración.
                      </p>
                    </label>
                  </div>

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

              {formData.tipo === "bebida" && (
                <fieldset className="fieldset--crear">
                  <legend className="legend--crear">Precios bebida</legend>

                  <label className="label--crear">
                    Precio base:
                    <input
                      type="number"
                      name="precios.precioBase"
                      value={formData.precios.precioBase}
                      onChange={handleChange}
                      className="input--crear"
                      min="0"
                      step="0.01"
                      required
                    />
                    <p className="help-text--crear">
                      Precio estándar si no aplica copa/botella.
                    </p>
                  </label>

                  <label className="label--crear">
                    Precio copa:
                    <input
                      type="number"
                      name="precios.precioCopa"
                      value={formData.precios.precioCopa || ""}
                      onChange={handleChange}
                      className="input--crear"
                      min="0"
                      step="0.01"
                    />
                    <p className="help-text--crear">
                      Opcional para vinos/servicio por copa.
                    </p>
                  </label>

                  <label className="label--crear">
                    Precio botella:
                    <input
                      type="number"
                      name="precios.precioBotella"
                      value={formData.precios.precioBotella || ""}
                      onChange={handleChange}
                      className="input--crear"
                      min="0"
                      step="0.01"
                    />
                    <p className="help-text--crear">
                      Opcional para venta por botella.
                    </p>
                  </label>
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
                <p>Arrastra una imagen aquí o haz clic para subir</p>

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
                Añade formas habituales de pedirlo (ej: “croqueta”, “croquetas de
                jamón”, “jamón”).
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
            <button type="submit" className="boton--crear" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>

            <button type="button" onClick={onCancel} className="boton--cancelar">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
