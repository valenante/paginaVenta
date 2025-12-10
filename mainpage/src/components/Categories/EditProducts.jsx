import React, { useState, useContext, useEffect } from "react";
import { ImageContext } from "../../context/ImagesContext"; // ✅ Importa el contexto
import {
  cargarSeccionesAPI,
  cargarEstacionesAPI
} from "../../utils/apiCocina";
import AlefSelect from "../AlefSelect/AlefSelect";
import "./EditProducts.css";

const EditProduct = ({ product, onSave, onCancel, onDelete }) => {
  // Obtener las funciones del contexto de imágenes
  const {
    dragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
  } = useContext(ImageContext);
  const [formData, setFormData] = useState({ ...product });
  const [errors, setErrors] = useState({});
  const [secciones, setSecciones] = useState([]);
  const [estaciones, setEstaciones] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const secs = await cargarSeccionesAPI();
        const ests = await cargarEstacionesAPI();

        setSecciones(secs || []);
        setEstaciones(ests || []);
      } catch (err) {
        console.error("❌ Error cargando secciones/estaciones dinámicas:", err);
      }
    };

    fetchData();
  }, []);

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "nombre":
        if (!value.trim()) error = "El nombre es obligatorio.";
        else if (value.length < 3)
          error = "El nombre debe tener al menos 3 caracteres.";
        break;
      case "categoria":
        if (!value.trim()) error = "La categoría es obligatoria.";
        break;
      case "tipo":
        if (!value.trim()) error = "El tipo es obligatorio.";
        break;
      case "seccion":
        if (!value.trim()) error = "La sección es obligatoria.";
        break;
      case "imagen":
        if (!value.trim()) error = "La imagen es obligatoria.";
        break;
      case "precios.tapa":
      case "precios.racion":
        if (value && value <= 0)
          error = "El precio debe ser mayor a 0 si está definido.";
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked ? "habilitado" : "deshabilitado",
      }));
    } else if (name.startsWith("precios.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        precios: {
          ...prev.precios,
          [key]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    for (const key in formData) {
      if (key === "precios") {
        for (const priceKey in formData.precios) {
          const error = validateField(
            `precios.${priceKey}`,
            formData.precios[priceKey]
          );
          if (error) newErrors[`precios.${priceKey}`] = error;
        }
      } else {
        // 🔧 IMPORTANTE: no validar seccion si el tipo NO es "plato"
        if (key === "seccion" && formData.tipo !== "plato") {
          continue;
        }

        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // ✅ convertir aliasesText a array antes de guardar
    const aliases =
      (formData.aliasesText || "")
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

    onSave({ ...formData, aliases });
  };

  const hasErrors = Object.entries(errors).some(([key, error]) => {
    if (!error) return false;

    // 🔧 Ignorar errores de sección si el producto NO es "plato"
    if (key === "seccion" && formData.tipo !== "plato") {
      return false;
    }

    return true;
  });

  return (
    <div className="alef-modal-overlay">
      <div className="alef-modal-content-editar">
        <div className="edit-product--editar">
          <form onSubmit={handleSubmit} className="form--editar" noValidate>
            {/* Nombre */}
            <label className="label--editar">
              Nombre:
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="input--editar"
              />
            </label>
            {errors.nombre && <p className="error--editar">{errors.nombre}</p>}

            {/* Descripción */}
            <label className="label--editar">
              Descripción:
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="textarea--editar"
              />
            </label>
            {errors.descripcion && (
              <p className="error--editar">{errors.descripcion}</p>
            )}

            {/* Traducciones en Inglés */}
            <fieldset className="fieldset--editar">
              <legend className="legend--editar">Traducción en Inglés</legend>

              <label className="label--editar">
                Nombre (EN):
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
                  placeholder="Ej: Ham Croquettes"
                />
              </label>

              <label className="label--editar">
                Descripción (EN):
                <textarea
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
                  className="textarea--editar"
                  placeholder="Ej: Delicious ham croquettes..."
                />
              </label>
            </fieldset>

            {/* Traducciones en Francés */}
            <fieldset className="fieldset--editar">
              <legend className="legend--editar">Traducción en Francés</legend>

              <label className="label--editar">
                Nombre (FR):
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
                Descripción (FR):
                <textarea
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
                  className="textarea--editar"
                  placeholder="Ej: Délicieuses croquettes au jambon..."
                />
              </label>
            </fieldset>

            {/* Ingredientes */}
            <label className="label--editar">
              Ingredientes:
              <textarea
                name="ingredientes"
                value={formData.ingredientes}
                onChange={handleChange}
                className="textarea--editar"
              />
            </label>

            {/* Categoría */}
            <label className="label--editar">
              Categoría:
              <input
                type="text"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="input--editar"
              />
            </label>
            {errors.categoria && (
              <p className="error--editar">{errors.categoria}</p>
            )}

            {/* Tipo */}
            <label className="label--editar">
              Tipo:
              <AlefSelect
                value={formData.tipo}
                options={[
                  { label: "Plato", value: "plato" },
                  { label: "Bebida", value: "bebida" }
                ]}
                placeholder="Selecciona un tipo"
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, tipo: value }))
                }
              />
            </label>

            {errors.tipo && <p className="error--editar">{errors.tipo}</p>}

            {formData.tipo === "plato" && (
              <>
                <label className="label--editar">
                  Sección:
                  <AlefSelect
                    value={formData.seccion}
                    options={secciones.map((sec) => ({
                      label: sec.nombre,
                      value: sec.slug
                    }))}
                    placeholder="Selecciona una sección"
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, seccion: value }))
                    }
                  />
                </label>

                {errors.seccion && <p className="error--editar">{errors.seccion}</p>}
              </>
            )}

            {/* Estación */}
            <label className="label--editar">
              Estación:
              <AlefSelect
                value={formData.estacion}
                options={estaciones.map((est) => ({
                  label: est.nombre,
                  value: est.slug
                }))}
                placeholder="Selecciona una estación"
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, estacion: value }))
                }
              />
            </label>

            {errors.estacion && <p className="error--editar">{errors.estacion}</p>}

            {/* Precios */}
            <fieldset className="fieldset--editar">
              <legend className="legend--editar">Precios</legend>

              {formData.tipo === "bebida" ? (
                <>
                  <label className="label--editar">
                    Precio Base:
                    <input
                      type="number"
                      name="precios.precioBase"
                      value={formData.precios.precioBase || ""}
                      onChange={handleChange}
                      className="input--editar"
                    />
                  </label>
                  <label className="label--editar">
                    Precio Copa:
                    <input
                      type="number"
                      name="precios.copa"
                      value={formData.precios.copa || ""}
                      onChange={handleChange}
                      className="input--editar"
                    />
                  </label>
                  <label className="label--editar">
                    Precio Botella:
                    <input
                      type="number"
                      name="precios.botella"
                      value={formData.precios.botella || ""}
                      onChange={handleChange}
                      className="input--editar"
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="label--editar">
                    Precio Base:
                    <input
                      type="number"
                      name="precios.precioBase"
                      value={formData.precios.precioBase || ""}
                      onChange={handleChange}
                      className="input--editar"
                    />
                  </label>
                  <label className="label--editar">
                    Precio Tapa:
                    <input
                      type="number"
                      name="precios.tapa"
                      value={formData.precios.tapa || ""}
                      onChange={handleChange}
                      className="input--editar"
                    />
                  </label>
                  <label className="label--editar">
                    Precio Ración:
                    <input
                      type="number"
                      name="precios.racion"
                      value={formData.precios.racion || ""}
                      onChange={handleChange}
                      className="input--editar"
                    />
                  </label>
                </>
              )}
            </fieldset>

            {/* Alérgenos */}
            <label className="label--editar">
              Alérgenos (separados por comas):
              <input
                type="text"
                name="alergenos"
                value={formData.alergenos?.join(", ") || ""}
                onChange={(e) => {
                  const value = e.target.value
                    .split(",")
                    .map((a) => a.trim())
                    .filter(Boolean);
                  setFormData((prev) => ({ ...prev, alergenos: value }));
                }}
                className="input--editar"
                placeholder="Ej: gluten, lactosa, frutos secos"
              />
            </label>

            {/* 🔹 Subida de Imágenes */}
            <label className="label--editar">
              Imagen:
              {/* Campo de texto para URL de la imagen */}
              <input
                type="text"
                name="img"
                value={formData.img}
                onChange={handleChange}
                className="input--editar"
                placeholder="URL de la imagen"
              />
              {/* ✅ Área de subida de imágenes con Drag & Drop */}
              <div
                className={`drop-zone ${dragging ? "dragging" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, setFormData)} // Pasamos setFormData aquí
                onClick={() => document.getElementById("file-upload").click()} // 🔹 Abre el input de archivos al hacer clic
              >
                <p>Arrastra una imagen aquí o haz clic para subir</p>
                <input
                  type="file"
                  id="file-upload" // 🔹 ID único para activar con clic
                  onChange={(e) => handleFileChange(e, setFormData)} // Pasamos setFormData aquí
                  accept="image/*"
                  className="hidden-file-input"
                />
              </div>
            </label>

            {/* Adicional */}
            <label className="label--editar">
              Precio Adicional (Unidad extra):
              <input
                type="number"
                value={formData.adicionales?.[0]?.precio || ""}
                placeholder="Precio del adicional"
                onChange={(e) => {
                  const nuevoPrecio = parseFloat(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    adicionales: [{ nombre: "Unidad adicional", precio: nuevoPrecio }],
                  }));
                }}
                className="input--editar"
              />
            </label>

            {/* Aliases */}
            <label className="label--editar">
              Aliases (separados por comas):
              <input
                type="text"
                value={formData.aliasesText || formData.aliases?.join(", ") || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    aliasesText: e.target.value, // guardamos texto plano
                  }))
                }
                className="input--editar"
                placeholder="Ej: croqueta, jamón, croquetas jamón"
              />
            </label>

            {/* Editar Stock */}
            <label className="label--editar">
              Stock:
              <input
                type="number"
                name="stock"
                value={formData.stock || ""}
                onChange={handleChange}
                className="input--editar"
              />
            </label>

            {/* Estado */}
            <label className="label--editar estado--editar">
              <input
                type="checkbox"
                name="estado"
                checked={formData.estado === "habilitado"}
                onChange={handleChange}
                className="checkbox--editar"
              />
              Habilitado
            </label>

            {/* Botones */}
            <div className="botones--editar">
              <button type="submit" disabled={hasErrors} className="boton--editar">
                Guardar
              </button>
              <button type="button" onClick={onCancel} className="boton--cancelar">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
