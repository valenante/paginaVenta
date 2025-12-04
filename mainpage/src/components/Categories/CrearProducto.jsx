// src/components/Categories/CrearProducto.jsx
import React, { useState, useContext, useEffect } from "react";
import { ProductosContext } from "../../context/ProductosContext";
import { ImageContext } from "../../context/ImagesContext";
import {
  cargarSeccionesAPI,
  cargarEstacionesAPI,
} from "../../utils/apiCocina";
import AlefSelect from "../AlefSelect/AlefSelect";
import * as logger from "../../utils/logger";
import api from "../../utils/api";
import "./CrearProducto.css";

const CrearProducto = ({ onClose, onCreated }) => {
  // 🔹 ProductosContext — opcional
  const productosCtx = useContext(ProductosContext);
  const cargarProductos = productosCtx?.cargarProductos;

  // 🔹 ImageContext — opcional, con fallbacks
  const imageCtx = useContext(ImageContext) || {};
  const {
    dragging = false,
    handleDragOver = (e) => e.preventDefault(),
    handleDragLeave = () => { },
    handleDrop = () => { },
    handleFileChange = () => { },
  } = imageCtx;

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [usarOtraCategoria, setUsarOtraCategoria] = useState(false);
  const [secciones, setSecciones] = useState([]);
  const [estaciones, setEstaciones] = useState([]);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    categoria: "",
    tipo: "",
    stock: 0,
    seccion: "",
    img: "",
    estacion: "",
    aliases: [],
    aliasesString: "",
    estado: "habilitado",
    precios: {
      precioBase: 0,
      tapa: null,
      racion: null,
      precioCopa: null,
      precioBotella: null,
    },
    ingredientes: [],
    alergenos: [],
    traducciones: {
      en: { nombre: "", descripcion: "" },
      fr: { nombre: "", descripcion: "" },
    },
    receta: [],
  });
  const [ingredientesStock, setIngredientesStock] = useState([]);

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


  // 🔹 Cargar categorías desde productos existentes
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await api.get("/productos");
        const productos = response.data;

        const categoriasUnicas = [
          ...new Set(
            productos
              .map((p) => p.categoria?.trim()?.toLowerCase())
              .filter((cat) => !!cat)
          ),
        ];

        setCategorias(categoriasUnicas);
      } catch (error) {
        logger.error("Error al cargar categorías:", error);
      }
    };
    fetchCategorias();
  }, []);

  // 🔥 Cargar secciones y estaciones desde Cocina
  useEffect(() => {
    const fetchData = async () => {
      try {
        const seccionesDB = await cargarSeccionesAPI();
        const estacionesDB = await cargarEstacionesAPI();

        setSecciones(seccionesDB || []);
        setEstaciones(estacionesDB || []);
      } catch (err) {
        logger.error("❌ Error cargando secciones/estaciones:", err);
      }
    };

    fetchData();
  }, []);

  // Manejo genérico de cambios
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("precios.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        precios: { ...prev.precios, [key]: value },
      }));
    } else if (name.startsWith("traducciones.")) {
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

    const productData = { ...formData };

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
        alert("Debes seleccionar una sección.");
        return;
      }
      if (!formData.estacion) {
        alert("Debes seleccionar una estación.");
        return;
      }
    }

    try {
      const response = await api.post("/productos", productData, {
        withCredentials: true,
      });

      if (response.status === 201) {
        // 🔹 Si existe contexto de productos, recarga
        if (typeof cargarProductos === "function") {
          cargarProductos();
        }

        // 🔹 Si el padre (Categories) pasa onCreated, recarga allí también
        if (typeof onCreated === "function") {
          onCreated(response.data);
        }

        onClose();
      }
    } catch (error) {
      logger.error(
        "Error al crear el producto:",
        error.response?.data || error.message
      );
    }
  };

  const manejarCambioArchivo = (e) => {
    // llama a la lógica real de subida si existe
    handleFileChange(e, setFormData);

    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div
      className="crear-producto-overlay--crear"
      onClick={onClose}
    >
      <div
        className="crear-producto-modal--crear"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="titulo--crear">Crear producto</h2>

        <form onSubmit={handleSubmit} className="form--crear">
          {/* === COLUMNAS PRINCIPALES === */}
          <div className="form-columns--crear">
            {/* -------- Columna 1 -------- */}
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
                </label>

                {/* Traducciones EN / FR */}
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
                </label>
              </div>

              {/* Ingredientes */}
              <fieldset className="fieldset--crear">
                <legend className="legend--crear">Ingredientes</legend>

                <div className="ingredientes-lista--crear">
                  {formData.ingredientes.map((ingrediente, index) => (
                    <div key={index} className="ingrediente-item--crear">
                      <input
                        type="text"
                        value={ingrediente}
                        onChange={(e) => {
                          const nuevos = [...formData.ingredientes];
                          nuevos[index] = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            ingredientes: nuevos,
                          }));
                        }}
                        className="input--crear"
                      />
                      <button
                        type="button"
                        className="btn-icon--crear"
                        onClick={() => {
                          const nuevos = formData.ingredientes.filter(
                            (_, i) => i !== index
                          );
                          setFormData((prev) => ({
                            ...prev,
                            ingredientes: nuevos,
                          }));
                        }}
                        aria-label="Eliminar ingrediente"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="boton--secundario"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      ingredientes: [...prev.ingredientes, ""],
                    }))
                  }
                >
                  ➕ Agregar ingrediente
                </button>
              </fieldset>
            </section>

            {/* -------- Columna 2 -------- */}
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
                    <input
                      type="text"
                      name="categoria"
                      placeholder="Escribe nueva categoría"
                      value={formData.categoria}
                      onChange={handleChange}
                      className="input--crear"
                      required
                    />
                  )}
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
                </label>

                {/* === SECCIÓN === */}
                <label className="label--crear">
                  Sección:
                  <AlefSelect
                    value={formData.seccion}
                    options={secciones.map((sec) => ({
                      label: sec.nombre,
                      value: sec.slug
                    }))}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, seccion: value }))
                    }
                  />
                </label>

                {/* === ESTACIÓN === */}
                <label className="label--crear">
                  Estación:
                  <AlefSelect
                    value={formData.estacion}
                    options={estaciones.map((est) => ({
                      label: est.nombre,
                      value: est.slug
                    }))}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, estacion: value }))
                    }
                  />
                </label>

              </div>

              {/* Precios */}
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
                    </label>
                  </div>

                  <fieldset className="fieldset--crear fieldset--adicional">
                    <legend className="legend--crear">
                      Adicional (unidad extra)
                    </legend>
                    <label className="label--crear">
                      Precio del adicional:
                      <input
                        type="number"
                        value={formData.adicionales?.[0]?.precio || ""}
                        onChange={(e) => {
                          const nuevoPrecio = parseFloat(e.target.value);
                          setFormData((prev) => ({
                            ...prev,
                            adicionales: [
                              {
                                nombre: "Unidad adicional",
                                precio: nuevoPrecio || 0,
                              },
                            ],
                          }));
                        }}
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
                  </label>
                </fieldset>
              )}
            </section>
          </div>

          {/* === BLOQUE INFERIOR: stock, alias, alérgenos, imagen === */}
          <section className="form-section--crear">
            <div className="form-group--crear">
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

              <label className="label--crear">
                Stock:
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="input--crear"
                  min="0"
                  step="1"
                  required
                />
              </label>

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
            </div>

            {/* Subida de imagen */}
            <div
              className={`drop-zone ${dragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();

                const file = e.dataTransfer.files[0];
                if (file) {
                  manejarCambioArchivo({ target: { files: [file] } });
                }
              }}
              onClick={() => document.getElementById("file-upload").click()}
            >
              <p>Arrastra una imagen aquí o haz clic para subir</p>

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
          </section>

          {/* === RECETA OPCIONAL === */}
          <fieldset className="fieldset--crear">
            <legend className="legend--crear">Receta (opcional)</legend>

            <div className="receta-crear-lista">
              {formData.receta.map((item, index) => {
                const ing = ingredientesStock.find((i) => i._id === item.ingrediente);
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

            <div className="receta-add--crear">
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
                  setFormData((prev) => ({
                    ...prev,
                    nuevaCantidad: e.target.value,
                  }))
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
          </fieldset>

          {/* === BOTONES FINALES === */}
          <div className="botones--crear">
            <button type="submit" className="boton--crear">
              Guardar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="boton--cancelar"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearProducto;
