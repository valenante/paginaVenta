import React, { useState, useContext, useEffect } from "react";
import { ImageContext } from "../../context/ImagesContext";
import { cargarSeccionesAPI, cargarEstacionesAPI } from "../../utils/apiCocina";
import AlefSelect from "../AlefSelect/AlefSelect";
import "./EditProducts.css";

/* helpers num */
const normalizeNumberOrNull = (v) => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const clampNum = (v, min, max) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

const EditProduct = ({ product, onSave, onCancel, onDelete }) => {
  const {
    dragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
  } = useContext(ImageContext);

  const normalizarMapAObjeto = (m) => {
    if (!m) return {};
    if (m instanceof Map) return Object.fromEntries(m);
    if (typeof m === "object") return { ...m };
    return {};
  };

  const [formData, setFormData] = useState({
    ...product,

    // SLA
    slaDefaultMinutos: product?.slaDefaultMinutos ?? "",
    slaPorEstacion: normalizarMapAObjeto(product?.slaPorEstacion),

    // CARGA
    cargaEstacion: product?.cargaEstacion ?? 1,
    cargaPorEstacion: normalizarMapAObjeto(product?.cargaPorEstacion),
  });

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
        if (!value?.trim()) error = "El nombre es obligatorio.";
        else if (value.length < 3)
          error = "El nombre debe tener al menos 3 caracteres.";
        break;
      case "categoria":
        if (!value?.trim()) error = "La categoría es obligatoria.";
        break;
      case "tipo":
        if (!value?.trim()) error = "El tipo es obligatorio.";
        break;
      case "seccion":
        if (!value?.trim()) error = "La sección es obligatoria.";
        break;
      case "imagen":
        if (!value?.trim()) error = "La imagen es obligatoria.";
        break;
      case "precios.tapa":
      case "precios.racion":
        if (value && Number(value) <= 0)
          error = "El precio debe ser mayor a 0 si está definido.";
        break;

      // opcionales (si quieres validar)
      case "cargaEstacion":
        if (value !== "" && value != null && Number(value) <= 0)
          error = "La carga debe ser mayor a 0.";
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

    // ✅ validar (manteniendo tu lógica)
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
        // 🔧 no validar seccion si el tipo NO es "plato"
        if (key === "seccion" && formData.tipo !== "plato") continue;

        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // ✅ aliases
    const aliases = (formData.aliasesText || "")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    // ✅ limpiar SLA por estación: quitar null/"" y dejar números
    const slaPorEstacionClean = {};
    for (const [k, v] of Object.entries(formData.slaPorEstacion || {})) {
      const n = normalizeNumberOrNull(v);
      if (n != null) slaPorEstacionClean[k] = n;
    }

    // ✅ limpiar carga por estación: quitar null/"" y dejar números > 0
    const cargaPorEstacionClean = {};
    for (const [k, v] of Object.entries(formData.cargaPorEstacion || {})) {
      const n = normalizeNumberOrNull(v);
      if (n != null && n > 0) cargaPorEstacionClean[k] = n;
    }

    const productoFinal = {
      ...formData,

      // SLA
      slaDefaultMinutos:
        formData.slaDefaultMinutos === "" ? null : Number(formData.slaDefaultMinutos),
      slaPorEstacion: slaPorEstacionClean,

      // CARGA
      cargaEstacion: clampNum(formData.cargaEstacion, 0.01, 100),
      cargaPorEstacion: cargaPorEstacionClean,
    };

    onSave({ ...productoFinal, aliases });
  };

  const hasErrors = Object.entries(errors).some(([key, error]) => {
    if (!error) return false;
    if (key === "seccion" && formData.tipo !== "plato") return false;
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

          {/* ===========================
                SLA (tiempo)
            =========================== */}
          <fieldset className="fieldset--editar">
            <legend className="legend--editar">⏱️ Tiempo aprox de preparación (min)</legend>

            <label className="label--editar">
              SLA general (minutos):
              <input
                type="number"
                min="0"
                value={formData.slaDefaultMinutos ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    slaDefaultMinutos: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                className="input--editar"
                placeholder="Ej: 12"
              />
            </label>
            {errors.slaDefaultMinutos && (
              <p className="error--editar">{errors.slaDefaultMinutos}</p>
            )}

            <p className="help-text">
              Este tiempo se usa si la estación no tiene un SLA específico.
            </p>

            <div className="sla-por-estacion">
              <p className="sla-subtitle">SLA por estación (opcional)</p>

              {estaciones.map((est) => (
                <label key={est.slug} className="label--editar sla-row">
                  {est.nombre}:
                  <input
                    type="number"
                    min="0"
                    value={formData.slaPorEstacion?.[est.slug] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);

                      setFormData((prev) => {
                        const next = { ...(prev.slaPorEstacion || {}) };
                        if (v == null) delete next[est.slug];
                        else next[est.slug] = v;
                        return { ...prev, slaPorEstacion: next };
                      });
                    }}
                    className="input--editar"
                    placeholder="Ej: 8"
                  />
                </label>
              ))}
            </div>
          </fieldset>

          {/* ===========================
                CARGA (peso)
            =========================== */}
          <fieldset className="fieldset--editar">
            <legend className="legend--editar">⚖️ Peso / carga de estación (slots)</legend>

            <label className="label--editar">
              Carga default (slots):
              <input
                type="number"
                min="0.01"
                step="0.05"
                value={formData.cargaEstacion ?? 1}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cargaEstacion: e.target.value === "" ? 1 : Number(e.target.value),
                  }))
                }
                className="input--editar"
                placeholder="Ej: 1"
              />
            </label>
            {errors.cargaEstacion && <p className="error--editar">{errors.cargaEstacion}</p>}

            <p className="help-text">
              1 = plato normal. 2 = ocupa el doble. 0.5 = rápido/ligero. Decimales permitidos.
            </p>

            <div className="sla-por-estacion">
              <p className="sla-subtitle">Carga por estación (opcional)</p>

              {estaciones.map((est) => (
                <label key={est.slug} className="label--editar sla-row">
                  {est.nombre}:
                  <input
                    type="number"
                    min="0.01"
                    step="0.05"
                    value={formData.cargaPorEstacion?.[est.slug] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);

                      setFormData((prev) => {
                        const next = { ...(prev.cargaPorEstacion || {}) };
                        if (v == null) delete next[est.slug];
                        else next[est.slug] = v;
                        return { ...prev, cargaPorEstacion: next };
                      });
                    }}
                    className="input--editar"
                    placeholder="Ej: 1.5"
                  />
                </label>
              ))}
            </div>
          </fieldset>

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
