// src/components/Categories/CrearProducto.jsx
import React, { useState, useContext, useEffect, useMemo } from "react";
import PreciosHelpModal from "./PreciosHelpModal";
import AdicionalesEditor from "./AdicionalesEditor";
import CompuestosEditor from "./CompuestosEditor";

const capitalizeClave = (s) => {
  const v = String(s || "").trim();
  if (!v) return "";
  if (v === "precioBase") return "Precio";
  return v.charAt(0).toUpperCase() + v.slice(1);
};
import { ProductosContext } from "../../context/ProductosContext";
import { useCategorias } from "../../context/CategoriasContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useImageUpload } from "../../hooks/useImageUpload";
import AlefSelect from "../AlefSelect/AlefSelect";
import AlertaMensaje from "../AlertaMensaje/AlertaMensaje";
import * as logger from "../../utils/logger";
import api from "../../utils/api";
import "./CrearProducto.css";

const CrearProducto = ({ onClose, onCreated, initialTipo, cloneFrom }) => {
  // 🔹 ProductosContext — opcional
  const productosCtx = useContext(ProductosContext);
  const { categoryObjectsByTipo, fetchCategoryObjects } = useCategorias();
  const { user } = useAuth();
  const { showToast } = useToast();
  const cargarProductos = productosCtx?.cargarProductos;
  const productosDisponibles = productosCtx?.productos || [];

  const {
    dragging,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    onFileChange: handleFileChange,
  } = useImageUpload();

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [usarOtraCategoria, setUsarOtraCategoria] = useState(false);
  const [secciones, setSecciones] = useState([]);
  const [estaciones, setEstaciones] = useState([]);
  const [alerta, setAlerta] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreciosHelp, setShowPreciosHelp] = useState(false);

  const isPlanEsencial =
    user?.plan === "esencial" || user?.plan === "tpv-esencial";

  const [formData, setFormData] = useState(() => {
    if (cloneFrom) {
      const aliasesArr = Array.isArray(cloneFrom.aliases) ? cloneFrom.aliases : [];
      const alergenosArr = Array.isArray(cloneFrom.alergenos) ? cloneFrom.alergenos : [];
      const preciosArr = Array.isArray(cloneFrom.precios)
        ? cloneFrom.precios.map((p, i) => ({
            clave: p.clave || "precioBase",
            label: p.label || "",
            precio: p.precio ?? 0,
            coste: p.coste ?? 0,
            factorStock: p.factorStock ?? 1,
            descripcion: p.descripcion || "",
            orden: p.orden ?? i,
          }))
        : [{ clave: "precioBase", label: "Precio", precio: 0, coste: 0, factorStock: 1, orden: 0 }];
      const trad = cloneFrom.traducciones && typeof cloneFrom.traducciones === "object" ? cloneFrom.traducciones : {};

      return {
        nombre: `Copia de ${cloneFrom.nombre || ""}`,
        descripcion: cloneFrom.descripcion || "",
        categoria: cloneFrom.categoria || "",
        tipo: cloneFrom.tipo || initialTipo || "",
        seccion: cloneFrom.seccion || "",
        img: "", // no clonar imagen, el usuario sube una nueva si quiere
        estacion: cloneFrom.estacion || "",
        aliases: [],
        aliasesString: "",
        estado: cloneFrom.estado || "habilitado",
        precios: preciosArr,
        alergenos: alergenosArr,
        adicionales: Array.isArray(cloneFrom.adicionales) ? cloneFrom.adicionales : [],
        traducciones: {
          en: { nombre: trad?.en?.nombre || "", descripcion: trad?.en?.descripcion || "" },
          fr: { nombre: trad?.fr?.nombre || "", descripcion: trad?.fr?.descripcion || "" },
        },
        receta: Array.isArray(cloneFrom.receta) ? cloneFrom.receta : [],
        // v3 fase 4 — compuestos
        componentes: Array.isArray(cloneFrom.componentes) ? cloneFrom.componentes : [],
        seleccionables: Array.isArray(cloneFrom.seleccionables) ? cloneFrom.seleccionables : [],
        stock: 0,
        controlStock: cloneFrom.controlStock ?? false,
        imprimirSiempre: cloneFrom.imprimirSiempre ?? false,
      };
    }

    return {
      nombre: "",
      descripcion: "",
      categoria: "",
      tipo: initialTipo || "",
      seccion: "",
      img: "",
      estacion: "",
      aliases: [],
      aliasesString: "",
      estado: "habilitado",
      precios: [{ clave: "precioBase", label: "Precio", precio: 0, coste: 0, factorStock: 1, orden: 0 }],
      alergenos: [],
      traducciones: {
        en: { nombre: "", descripcion: "" },
        fr: { nombre: "", descripcion: "" },
      },
      receta: [],
      // v3 fase 4 — compuestos
      componentes: [],
      seleccionables: [],
      stock: 0,
      controlStock: false,
      imprimirSiempre: false,
    };
  });
  const [ingredientesStock, setIngredientesStock] = useState([]);


  const estacionesFiltradas = useMemo(() => {
    if (!formData.tipo || estaciones.length === 0) return [];

    const destinoObjetivo =
      formData.tipo === "bebida" ? "barra" : "cocina";

    return estaciones.filter((e) => e.destino === destinoObjetivo);
  }, [formData.tipo, estaciones]);

  const seccionesFiltradas = useMemo(() => {
    if (!formData.tipo || secciones.length === 0) return [];

    const destinoObjetivo =
      formData.tipo === "bebida" ? "barra" : "cocina";

    return secciones.filter(
      (s) => s.destino === destinoObjetivo
    );
  }, [formData.tipo, secciones]);

  useEffect(() => {
    const loadIngredientes = async () => {
      try {
        const { data } = await api.get("/stock/ingredientes");
        setIngredientesStock(data.ingredientes || []);
      } catch (err) {
        console.error("Error cargando ingredientes", err);
      }
    };
    loadIngredientes();
  }, []);


  // 🔹 Cargar categorías desde el modelo Categoria (por tipo seleccionado)
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

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      estacion: "",
      seccion: "",
    }));
  }, [formData.tipo]);

  // 🔥 Cargar secciones y estaciones
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [seccionesRes, estacionesRes] =
          await Promise.all([
            api.get("/secciones"),
            api.get("/estaciones", {
              params: { includeInactive: 0 },
            }),
          ]);

        const seccionesDB = seccionesRes?.data?.items || [];
        const estacionesDB = estacionesRes?.data?.items || [];

        setSecciones(Array.isArray(seccionesDB) ? seccionesDB : []);
        setEstaciones(Array.isArray(estacionesDB) ? estacionesDB : []);
      } catch (err) {
        logger.error("❌ Error cargando secciones/estaciones:", err);
      }
    };

    fetchData();
  }, []);

  // === Precios dinámicos ===
  const PRECIO_SUGGESTIONS = [
    "precioBase", "tapa", "racion", "copa", "botella",
    "jarra", "pincho", "medio", "unidad", "docena",
  ];

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
        { clave: "", label: "", precio: 0, coste: 0, factorStock: 1, orden: prev.precios.length },
      ],
    }));
  };

  const removePrecio = (index) => {
    setFormData((prev) => ({
      ...prev,
      precios: prev.precios.filter((_, i) => i !== index),
    }));
  };

  // Manejo genérico de cambios
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("traducciones.")) {
      const [, lang, key] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        traducciones: {
          ...prev.traducciones,
          [lang]: { ...prev.traducciones[lang], [key]: value },
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || uploading) return;

    const productData = { ...formData };
    productData.stock = Number(productData.stock) || 0;
    productData.controlStock = !!productData.controlStock;
    productData.imprimirSiempre = !!productData.imprimirSiempre;

    // Auto-derivar label desde la clave si está vacío
    productData.precios = (productData.precios || []).map((p) => ({
      ...p,
      label: (p.label && p.label.trim()) ? p.label : capitalizeClave(p.clave || "precioBase"),
    }));

    if (productData.tipo === "plato") {
      delete productData.conHielo;
      delete productData.conLimon;
      delete productData.tamaño;
    } else if (productData.tipo === "bebida") {
      delete productData.ingredientes;
      delete productData.puntosDeCoccion;
    }

    if (formData.tipo !== "bebida") {
      if (!formData.seccion) {
        showToast("Debes seleccionar una sección.", "aviso");
        return;
      }
      if (!isPlanEsencial && !formData.estacion) {
        showToast("Debes seleccionar una estación.", "aviso");
        return;
      }
    }

    setSaving(true);
    try {
      const response = await api.post("/productos", productData, {
        withCredentials: true,
      });

      if (response.status === 201) {
        if (typeof cargarProductos === "function") {
          cargarProductos();
        }

        if (typeof onCreated === "function") {
          onCreated(response.data);
        }

        setAlerta({
          tipo: "exito",
          mensaje: "Producto creado correctamente",
        });

        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      setAlerta({
        tipo: "error",
        mensaje:
          error.response?.data?.message ||
          "Error al crear el producto",
      });

      logger.error(
        "Error al crear el producto:",
        error.response?.data || error.message
      );
    } finally {
      setSaving(false);
    }
  };

  const manejarCambioArchivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      await handleFileChange(e, setFormData);
    } catch (err) {
      setAlerta({ tipo: "error", mensaje: "Error al subir la imagen." });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="crear-producto-overlay--crear" onClick={onClose}>
      <div
        className="crear-producto-modal--crear"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="titulo--crear">{cloneFrom ? "Clonar producto" : "Crear producto"}</h2>

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
            {/* -------- Columna 1: Identidad + textos (lo que ve el cliente) -------- */}
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
                    Descripción visible para el cliente en la carta digital. Úsala
                    para detallar ingredientes, elaboración o características
                    importantes.
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
                    name="alergenos"
                    value={formData.alergenos?.join(", ") || ""}
                    onChange={(e) => {
                      const value = e.target.value
                        .split(",")
                        .map((a) => a.trim().toLowerCase())
                        .filter(Boolean);
                      setFormData((prev) => ({ ...prev, alergenos: value }));
                    }}
                    className="input--editar"
                    placeholder="Ej: gluten, lactosa, huevo"
                  />
                </label>

                {/* === BLOQUE TRADUCCIONES === */}
                <h4 className="subtitulo--crear">🌍 Traducciones para la carta</h4>
                <p className="help-text--crear">
                  Estos textos se mostrarán automáticamente cuando el cliente
                  cambie el idioma en la carta.
                </p>

                <label className="label--editar">
                  Nombre en inglés:
                  <input
                    type="text"
                    value={formData.traducciones?.en?.nombre || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        traducciones: {
                          ...prev.traducciones,
                          en: {
                            ...prev.traducciones?.en,
                            nombre: e.target.value,
                          },
                        },
                      }))
                    }
                    className="input--editar"
                    placeholder="Ej: Ham croquettes"
                  />
                  <p className="help-text--crear">
                    Nombre en inglés que verá el cliente en la carta si selecciona
                    ese idioma.
                  </p>
                </label>

                <label className="label--editar">
                  Descripción en inglés:
                  <input
                    type="text"
                    value={formData.traducciones?.en?.descripcion || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        traducciones: {
                          ...prev.traducciones,
                          en: {
                            ...prev.traducciones?.en,
                            descripcion: e.target.value,
                          },
                        },
                      }))
                    }
                    className="input--editar"
                    placeholder="Ej: Delicious ham croquettes"
                  />
                  <p className="help-text--crear">
                    Descripción en inglés visible en la carta digital.
                  </p>
                </label>

                <label className="label--editar">
                  Nombre en francés:
                  <input
                    type="text"
                    value={formData.traducciones?.fr?.nombre || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        traducciones: {
                          ...prev.traducciones,
                          fr: {
                            ...prev.traducciones?.fr,
                            nombre: e.target.value,
                          },
                        },
                      }))
                    }
                    className="input--editar"
                    placeholder="Ej: Croquettes au jambon"
                  />
                  <p className="help-text--crear">
                    Nombre en francés que verá el cliente en la carta si selecciona
                    ese idioma.
                  </p>
                </label>

                <label className="label--editar">
                  Descripción en francés:
                  <input
                    type="text"
                    value={formData.traducciones?.fr?.descripcion || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        traducciones: {
                          ...prev.traducciones,
                          fr: {
                            ...prev.traducciones?.fr,
                            descripcion: e.target.value,
                          },
                        },
                      }))
                    }
                    className="input--editar"
                    placeholder="Ej: Délicieuses croquettes au jambon"
                  />
                  <p className="help-text--crear">
                    Descripción en francés visible en la carta digital.
                  </p>
                </label>
              </div>
            </section>

            {/* -------- Columna 2: Clasificación + flujo (TPV / cocina / barra) -------- */}
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
                      ? "Escribe el nombre de la nueva categoría. Se creará automáticamente al guardar el producto."
                      : "La categoría sirve para organizar los productos al tomar nota en el TPV y permite a los clientes filtrar la carta por tipo de producto."}
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
                    Si lo deshabilitas, <strong>no aparecerá en la carta digital</strong> (clientes),
                    pero <strong>seguirá disponible en el panel interno</strong> para que los camareros
                    puedan seguir tomando nota si lo necesitas.
                    <br />
                    <em>Ejemplo:</em> si hoy te quedas sin "Tarta de queso", la deshabilitas y no la
                    verá el cliente en su móvil, pero el camarero podrá seguir añadiéndola desde el TPV
                    si aún te interesa venderla en sala.
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
                    Define si el producto se gestiona como plato o bebida (afecta a
                    precios y flujo de trabajo).
                  </p>
                </label>

                {/* === SECCIÓN === */}
                <label className="label--crear">
                  Sección:
                  <AlefSelect
                    value={formData.seccion}
                    options={seccionesFiltradas.map((sec) => ({
                      label: sec.nombre,
                      value: sec.slug,
                    }))}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, seccion: value }))
                    }
                  />
                  <p className="help-text--crear">
                    Sección predeterminada del producto en cocina (Entrantes,
                    Principales, Postres…). Al tomar nota, esta sección se puede
                    modificar si es necesario.
                    <br />
                    <em>Las secciones se crean en Dashboard → Datos del restaurante.</em>
                  </p>
                </label>

                {/* === ESTACIÓN (solo si el plan NO es esencial) === */}
                {!isPlanEsencial && (
                  <label className="label--crear">
                    Estación:
                    <AlefSelect
                      value={formData.estacion}
                      options={estacionesFiltradas.map((est) => ({
                        label: est.nombre,
                        value: est.slug,
                      }))}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, estacion: value }))
                      }
                    />
                    <p className="help-text--crear">
                      Subdivisión de cocina/barra a la que irá dirigido este producto
                      al tomar la comanda (por ejemplo: plancha, freidora, barra,
                      postres…).
                    </p>
                  </label>
                )}

              </div>

              {/* === PRECIOS (array dinámico) === */}
              {formData.tipo && (
                <fieldset className="fieldset--crear fieldset--precios">
                  <legend className="legend--crear">Precios</legend>
                  <div className="precios-toolbar">
                    <p className="help-text--crear" style={{ margin: 0 }}>
                      Agrega tantas variantes como necesites (base, tapa, ración, copa, botella…).
                      La primera entrada es la principal.
                    </p>
                    <button
                      type="button"
                      className="btn-ayuda--crear"
                      onClick={() => setShowPreciosHelp(true)}
                    >
                      💡 Ayuda
                    </button>
                  </div>

                  <datalist id="precio-suggestions">
                    {PRECIO_SUGGESTIONS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>

                  {formData.precios.map((entry, idx) => (
                    <div key={idx} className="precio-entry-row">
                      <div className="precio-entry-header">
                        <span className="precio-entry-title">
                          Variante #{idx + 1}
                          {entry.clave && (
                            <span className="precio-entry-summary">
                              · {capitalizeClave(entry.clave)}
                            </span>
                          )}
                        </span>
                        {formData.precios.length > 1 && (
                          <button
                            type="button"
                            className="btn-icon--crear"
                            onClick={() => removePrecio(idx)}
                            title="Eliminar variante"
                            aria-label="Eliminar variante"
                          >
                            ❌
                          </button>
                        )}
                      </div>

                      <div className="precio-entry-identity">
                        <label className="label--crear">
                          Clave
                          <input
                            type="text"
                            list="precio-suggestions"
                            value={entry.clave}
                            onChange={(e) => handlePrecioChange(idx, "clave", e.target.value)}
                            className="input--crear"
                            placeholder="precioBase"
                            required
                          />
                        </label>
                        <label className="label--crear">
                          Detalle <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
                          <input
                            type="text"
                            value={entry.descripcion || ""}
                            onChange={(e) => handlePrecioChange(idx, "descripcion", e.target.value)}
                            className="input--crear"
                            placeholder="2 uds, 200g, 1/2 ración..."
                            maxLength={100}
                          />
                        </label>
                      </div>

                      <div className="precio-entry-numbers">
                        <label className="label--crear">
                          Precio (€)
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
                        <label className="label--crear">
                          Coste (€)
                          <input
                            type="number"
                            value={entry.coste ?? 0}
                            onChange={(e) => handlePrecioChange(idx, "coste", e.target.value)}
                            className="input--crear"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            title="Precio de compra por unidad de esta variante"
                          />
                        </label>
                        <label className="label--crear">
                          Factor stock
                          <input
                            type="number"
                            value={entry.factorStock ?? 1}
                            onChange={(e) => handlePrecioChange(idx, "factorStock", e.target.value)}
                            className="input--crear"
                            min="0"
                            step="0.01"
                            placeholder="1"
                            title="Qué porción de stock consume esta variante. Botella entera = 1, Copa = 0.2 (5 copas/botella), Tapa = 0.5 (2 tapas/ración)"
                          />
                        </label>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="boton--secundario"
                    onClick={addPrecio}
                  >
                    + Añadir precio
                  </button>

                  <AdicionalesEditor
                    adicionales={formData.adicionales || []}
                    onChange={(next) =>
                      setFormData((prev) => ({ ...prev, adicionales: next }))
                    }
                    productosDisponibles={productosDisponibles}
                  />

                  {/* v3 fase 4 — productos compuestos (opt-in) */}
                  <CompuestosEditor
                    componentes={formData.componentes || []}
                    seleccionables={formData.seleccionables || []}
                    onChangeComponentes={(next) =>
                      setFormData((prev) => ({ ...prev, componentes: next }))
                    }
                    onChangeSeleccionables={(next) =>
                      setFormData((prev) => ({ ...prev, seleccionables: next }))
                    }
                    productosDisponibles={productosDisponibles}
                  />
                </fieldset>
              )}
            </section>
          </div>

          {/* === BLOQUE INFERIOR: imagen + voz + receta/stock === */}
          <section className="form-section--crear">
            <div className="form-group--crear">
              {/* === IMAGEN === */}
              <h4 className="subtitulo--crear">🖼️ Imagen del producto</h4>
              <p className="help-text--crear">
                Esta imagen se mostrará en la carta digital para los clientes.
                Recomendamos usar una imagen clara y bien iluminada.
              </p>

              <div
                className={`drop-zone ${dragging ? "dragging" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={async (e) => {
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
                }}
                onClick={() => document.getElementById("file-upload").click()}
              >
                <p>{uploading ? "Subiendo imagen..." : "Arrastra una imagen aquí o haz clic para subir"}</p>

                <input
                  type="file"
                  id="file-upload"
                  accept="image/*"
                  onChange={manejarCambioArchivo}
                  className="hidden-file-input"
                />

                {imageFile && <p>📂 {imageFile.name}</p>}
              </div>

              {previewUrl && (
                <div className="preview-container">
                  <img
                    src={previewUrl}
                    alt="Vista previa del producto"
                    className="preview-img"
                  />
                </div>
              )}

              {/* === VOZ (aliases) === */}
              <h4 className="subtitulo--crear">🎙️ Aliases para comandas por voz</h4>
              <p className="help-text--crear">
                Los aliases son "subnombres" que el sistema utiliza para reconocer
                este producto en las comandas por voz. Añade formas habituales de
                pedirlo (ej: "croqueta", "croquetas de jamón", "jamón").
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
                  onBlur={(e) => {
                    const value = e.target.value;
                    const parsed = value
                      .split(",")
                      .map((a) => a.trim())
                      .filter(Boolean);

                    setFormData((prev) => ({
                      ...prev,
                      aliases: parsed,
                      aliasesString: parsed.join(", "),
                    }));
                  }}
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

          {/* === RECETA OPCIONAL === */}
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
              La receta sirve para vincular ingredientes del stock a este producto
              y descontarlos automáticamente cuando se sirve. Es fundamental para
              controlar inventario y costes con precisión.
            </p>

            {/* LISTA DE INGREDIENTES (DESACTIVADA SI ESENCIAL) */}
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
                // v3 stock-modelo-v2 fase 3: mostrar a qué variante aplica cada línea
                const variantePill = item.clavePrecio
                  ? (formData.precios || []).find((p) => p.clave === item.clavePrecio)
                  : null;
                return (
                  <div key={index} className="receta-item--crear">
                    <span className="receta-nombre--crear">
                      {ing?.nombre || "Ingrediente eliminado"}
                      {(formData.precios || []).length > 1 && (
                        <span
                          style={{
                            marginLeft: 6,
                            padding: "1px 6px",
                            borderRadius: 10,
                            fontSize: 10,
                            fontWeight: 600,
                            background: item.clavePrecio ? "#cfe7ff" : "#d9f5dd",
                            color: item.clavePrecio ? "#074a8a" : "#0b6a1d",
                          }}
                          title={
                            item.clavePrecio
                              ? `Solo se descuenta al vender la variante "${variantePill?.label || item.clavePrecio}"`
                              : "Se descuenta al vender cualquier variante (× factorStock si aplica)"
                          }
                        >
                          {item.clavePrecio ? (variantePill?.label || item.clavePrecio) : "Universal"}
                        </span>
                      )}
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

            {/* FORMULARIO PARA AÑADIR (DESACTIVADO SI ESENCIAL) */}
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
                onChange={(v) => setFormData((prev) => ({ ...prev, nuevoIng: v }))}
                placeholder="Selecciona ingrediente"
              />

              <input
                type="number"
                className="input--crear"
                placeholder="Cantidad"
                value={formData.nuevaCantidad || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    nuevaCantidad: e.target.value,
                  }))
                }
              />

              {/* v3 stock-modelo-v2 fase 3: selector de variante (solo si hay ≥2 variantes) */}
              {(formData.precios || []).length > 1 && (
                <label className="label--crear" style={{ margin: 0, fontSize: 12 }}>
                  Aplica a
                  <select
                    className="input--crear"
                    value={formData.nuevaClavePrecio || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        nuevaClavePrecio: e.target.value,
                      }))
                    }
                  >
                    <option value="">Universal (todas)</option>
                    {(formData.precios || []).map((p) => (
                      <option key={p.clave} value={p.clave}>
                        Solo {p.label || p.clave}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <button
                type="button"
                className="boton--secundario"
                onClick={() => {
                  if (!formData.nuevoIng || !formData.nuevaCantidad) return;

                  const nuevaLinea = {
                    ingrediente: formData.nuevoIng,
                    cantidad: Number(formData.nuevaCantidad),
                    // v3 fase 3: null = universal
                    clavePrecio: formData.nuevaClavePrecio || null,
                  };

                  setFormData((prev) => ({
                    ...prev,
                    receta: [...prev.receta, nuevaLinea],
                    nuevoIng: "",
                    nuevaCantidad: "",
                    nuevaClavePrecio: "",
                  }));
                }}
              >
                ➕ Añadir
              </button>
            </div>

            {/* MENSAJE DE UPSELL */}
            {isPlanEsencial && (
              <p
                style={{
                  marginTop: "12px",
                  fontSize: "14px",
                  textAlign: "center",
                  color: "#ff6700",
                }}
              >
                Para gestionar recetas completas, mejora tu plan a{" "}
                <strong>Profesional</strong>.
              </p>
            )}
          </fieldset>

          {/* === BOTONES FINALES === */}
          <div className="botones--crear">
            <button type="submit" className="boton--crear" disabled={saving || uploading}>
              {saving ? "Guardando..." : uploading ? "Subiendo imagen..." : "Guardar"}
            </button>
            <button type="button" onClick={onClose} className="boton--cancelar" disabled={saving}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
      <PreciosHelpModal open={showPreciosHelp} onClose={() => setShowPreciosHelp(false)} />
    </div>
  );
};

export default CrearProducto;
