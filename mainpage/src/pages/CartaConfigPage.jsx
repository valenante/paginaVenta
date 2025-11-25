import { useState, useEffect, useRef } from "react";
import { useConfig } from "../context/ConfigContext.jsx";
import api from "../utils/api";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import "../styles/CartaConfigPage.css";

export default function CartaConfigPage() {
  const { config, setConfig } = useConfig();
  const [form, setForm] = useState(config || {});
  const [saving, setSaving] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [modal, setModal] = useState(null);
  const [dragOverSection, setDragOverSection] = useState(null);
  const fileInputRef = useRef(null);

  // 🔹 Estado para gestión de destacados / promociones
  const [promoPanelAbierto, setPromoPanelAbierto] = useState(false);
  const [promoTipo, setPromoTipo] = useState("plato"); // 'plato' | 'bebida' | 'extra'
  const [promoCategoria, setPromoCategoria] = useState("");
  const [promoProductos, setPromoProductos] = useState([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSeleccionados, setPromoSeleccionados] = useState([]);

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  // ============================
  // 🔧 Manejo genérico del form
  // ============================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const path = name.split(".");
    const updatedForm = { ...form };

    let obj = updatedForm;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (typeof obj[key] !== "object" || obj[key] === null) {
        obj[key] = {};
      }
      obj = obj[key];
    }
    obj[path[path.length - 1]] = type === "checkbox" ? checked : value;

    setForm(updatedForm);
  };

  // ============================
  // 📸 Subida de imagen
  // ============================
  const handleFileUpload = async (section, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("imagen", file);
    formData.append("seccion", section);

    try {
      const { data } = await api.post("/configuracion/imagen", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setForm((prev) => ({
        ...prev,
        imagenesHome: {
          ...prev.imagenesHome,
          [section]: [...(prev.imagenesHome?.[section] || []), data.imageUrl],
        },
      }));

      setAlerta({ tipo: "exito", mensaje: "Imagen subida correctamente" });
    } catch (err) {
      console.error("❌ Error al subir imagen:", err);
      setAlerta({ tipo: "error", mensaje: "Error al subir imagen." });
    }
  };

  const handleDrop = (section, e) => {
    e.preventDefault();
    setDragOverSection(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(section, file);
  };

  const handleSelectFile = (section, e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(section, file);
  };

  const handleRemoveImage = (section, index) => {
    const updated = { ...form };
    if (!updated.imagenesHome?.[section]) return;

    updated.imagenesHome[section] = [
      ...updated.imagenesHome[section].slice(0, index),
      ...updated.imagenesHome[section].slice(index + 1),
    ];

    setForm(updated);
    setAlerta({ tipo: "info", mensaje: "Imagen eliminada." });
  };

  // ============================
  // 📝 Textos del Home
  // ============================
  const handleAddText = (section) => {
    setModal({
      titulo: "Añadir texto",
      mensaje: "Introduce un texto para esta sección:",
      placeholder: "Ej: Bienvenidos a nuestro restaurante",
      onConfirm: (text) => {
        if (!text) {
          return setAlerta({
            tipo: "error",
            mensaje: "El texto no puede estar vacío.",
          });
        }
        const updated = { ...form };
        if (!updated.textosHome) updated.textosHome = {};
        if (!updated.textosHome[section]) updated.textosHome[section] = [];
        updated.textosHome[section].push(text);

        setForm(updated);
        setModal(null);
        setAlerta({ tipo: "exito", mensaje: "Texto añadido correctamente." });
      },
      onClose: () => setModal(null),
    });
  };

  const handleRemoveText = (section, index) => {
    const updated = { ...form };
    if (!updated.textosHome?.[section]) return;

    updated.textosHome[section] = [
      ...updated.textosHome[section].slice(0, index),
      ...updated.textosHome[section].slice(index + 1),
    ];

    setForm(updated);
    setAlerta({ tipo: "info", mensaje: "Texto eliminado." });
  };

  const handleToggleEstado = async (id, campo, valor) => {
    try {
      const { data } = await api.put("/productos/toggle-estado", {
        id,
        campo,     // "destacado" o "promocionado"
        valor      // true o false
      });

      // actualizar estado local
      setPromoProductos((prev) =>
        prev.map((p) =>
          p._id === id ? { ...p, [campo]: valor } : p
        )
      );

      setAlerta({
        tipo: "exito",
        mensaje: `${campo === "destacado" ? "Destacado" : "Promoción"} actualizado.`
      });

    } catch (err) {
      console.error("❌ Error al actualizar estado:", err);
      setAlerta({
        tipo: "error",
        mensaje: "No se pudo actualizar el estado del producto."
      });
    }
  };
  // ============================
  // 💾 Guardar configuración
  // ============================
  const handleSave = async () => {
    try {
      setSaving(true);
      const { data } = await api.put("/configuracion", form);
      setConfig(data);
      setAlerta({
        tipo: "exito",
        mensaje: "Configuración actualizada correctamente",
      });
    } catch (err) {
      console.error("❌ Error al guardar configuración:", err);
      setAlerta({ tipo: "error", mensaje: "Error al guardar los cambios." });
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // ⭐ Gestión de productos destacados / en promoción
  // =====================================================

  // Cargar productos por tipo cuando se abre el panel o cambia el tipo
  useEffect(() => {
    const fetchProductos = async () => {
      if (!promoPanelAbierto || !promoTipo) return;
      try {
        setPromoLoading(true);
        setPromoSeleccionados([]);
        setPromoCategoria("");

        // Ajusta este endpoint a tu API real
        const { data } = await api.get(`/productos`, {
          params: { tipo: promoTipo },
        });

        setPromoProductos(data || []);
      } catch (err) {
        console.error("❌ Error al cargar productos:", err);
        setAlerta({
          tipo: "error",
          mensaje: "No se pudieron cargar los productos.",
        });
      } finally {
        setPromoLoading(false);
      }
    };

    fetchProductos();
  }, [promoPanelAbierto, promoTipo]);

  // 🔹 1) Filtrar productos según el tipo elegido
  const productosPorTipo = (promoProductos || []).filter((p) => {
    if (promoTipo === "bebida") return p.tipo === "bebida";
    if (promoTipo === "extra") return p.tipo === "extra";
    // 👉 'plato' = todo lo que NO sea bebida ni extra
    return p.tipo !== "bebida" && p.tipo !== "extra";
  });

  // 🔹 2) Categorías disponibles según ese tipo
  const categoriasDisponibles = Array.from(
    new Set(
      productosPorTipo
        .map((p) => p.categoria)
        .filter((c) => typeof c === "string" && c.trim() !== "")
    )
  );

  // 🔹 3) Filtrado final por categoría
  const productosFiltrados = productosPorTipo.filter((p) =>
    promoCategoria ? p.categoria === promoCategoria : true
  );


  const toggleProductoSeleccion = (id) => {
    setPromoSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const actualizarProductosSeleccionados = async (dataActualizar) => {
    if (!promoSeleccionados.length) {
      setAlerta({
        tipo: "error",
        mensaje: "Selecciona al menos un producto.",
      });
      return;
    }

    try {
      // Endpoint genérico de actualización masiva
      await api.put("/productos/marcar-multiple", {
        ids: promoSeleccionados,
        data: dataActualizar,
      });

      setAlerta({
        tipo: "exito",
        mensaje: "Productos actualizados correctamente.",
      });

      // Refrescar lista
      const { data } = await api.get(`/productos`, {
        params: { tipo: promoTipo },
      });
      setPromoProductos(data || []);
      setPromoSeleccionados([]);
    } catch (err) {
      console.error("❌ Error al actualizar productos:", err);
      setAlerta({
        tipo: "error",
        mensaje: "Error al actualizar los productos.",
      });
    }
  };

  const handleMarcarPromocion = () =>
    actualizarProductosSeleccionados({ promocionado: true });

  const handleQuitarPromocion = () =>
    actualizarProductosSeleccionados({ promocionado: false });

  const handleMarcarDestacado = () =>
    actualizarProductosSeleccionados({ destacado: true });

  const handleQuitarDestacado = () =>
    actualizarProductosSeleccionados({ destacado: false });

  // ============================
  // RENDER
  // ============================
  return (
    <div className="config-page carta-config">
      <div className="config-card">
        <h2 className="config-title">Configuración de la Carta y Página Principal</h2>

        {/* === INFORMACIÓN GENERAL === */}
        <section className="config-section">
          <h3 className="section-title">📍 Información del Restaurante</h3>

          <div className="config-field">
            <label>Teléfono</label>
            <input
              type="text"
              name="informacionRestaurante.telefono"
              value={form.informacionRestaurante?.telefono || ""}
              onChange={handleChange}
            />
          </div>

          <div className="config-field">
            <label>Dirección</label>
            <input
              type="text"
              name="informacionRestaurante.direccion"
              value={form.informacionRestaurante?.direccion || ""}
              onChange={handleChange}
            />
          </div>

          <div className="config-field">
            <label>Días de apertura (separados por coma)</label>
            <input
              type="text"
              name="informacionRestaurante.diasApertura"
              value={form.informacionRestaurante?.diasApertura?.join(", ") || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  informacionRestaurante: {
                    ...form.informacionRestaurante,
                    diasApertura: e.target.value
                      .split(",")
                      .map((d) => d.trim()),
                  },
                })
              }
            />
          </div>

          <div className="config-field-group">
            <div className="config-field">
              <label>Horario de comida</label>
              <input
                type="text"
                name="informacionRestaurante.horarios.comida"
                value={form.informacionRestaurante?.horarios?.comida || ""}
                onChange={handleChange}
                placeholder="Ej: 13:00 - 17:00"
              />
            </div>

            <div className="config-field">
              <label>Horario de cena</label>
              <input
                type="text"
                name="informacionRestaurante.horarios.cena"
                value={form.informacionRestaurante?.horarios?.cena || ""}
                onChange={handleChange}
                placeholder="Ej: 20:00 - 24:00"
              />
            </div>
          </div>
        </section>

        {/* === IMÁGENES HOME === */}
        <section className="config-section">
          <h3 className="section-title">🖼️ Imágenes del Home</h3>

          {["carrousel", "secciones"].map((section) => (
            <div key={section} className="imagenes-bloque">
              <div className="section-subheader">
                <h4>{section === "carrousel" ? "Carrousel" : "Secciones"}</h4>
                <span className="section-subtitle">
                  Arrastra imágenes o haz clic para añadir
                </span>
              </div>

              <div
                className={`imagenes-grid ${dragOverSection === section ? "drag-over" : ""
                  }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverSection(section);
                }}
                onDragLeave={() => setDragOverSection(null)}
                onDrop={(e) => handleDrop(section, e)}
                onClick={() => {
                  setDragOverSection(section);
                  fileInputRef.current?.click();
                }}
              >
                {form.imagenesHome?.[section]?.map((url, i) => (
                  <div key={i} className="imagen-item">
                    <img src={url} alt={`${section}-${i}`} />
                    <button
                      type="button"
                      className="btn-icon btn-delete"
                      onClick={() => handleRemoveImage(section, i)}
                    >
                      🗑
                    </button>
                  </div>
                ))}

                <button type="button" className="btn-add">
                  ➕ Añadir
                </button>
              </div>
            </div>
          ))}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) =>
              handleSelectFile(dragOverSection || "carrousel", e)
            }
          />
        </section>

        {/* === TEXTOS HOME === */}
        <section className="config-section">
          <h3 className="section-title">📝 Textos del Home</h3>

          {["carrousel", "secciones"].map((section) => (
            <div key={section} className="textos-section">
              <div className="textos-header">
                <h4>
                  {section === "carrousel" ? "Carrousel" : "Secciones"}{" "}
                  <span className="contador">
                    ({form.textosHome?.[section]?.length || 0})
                  </span>
                </h4>
              </div>

              <ul className="textos-lista">
                {form.textosHome?.[section]?.map((t, i) => (
                  <li key={i} className="texto-item">
                    <span>{t}</span>
                    <button
                      type="button"
                      className="btn-icon btn-remove"
                      onClick={() => handleRemoveText(section, i)}
                    >
                      🗑
                    </button>
                  </li>
                ))}

                <li className="li-add">
                  <button
                    type="button"
                    className="btn-add"
                    onClick={() => handleAddText(section)}
                  >
                    ➕ Añadir texto
                  </button>
                </li>
              </ul>
            </div>
          ))}
        </section>

        {/* === CONFIGURACIÓN CARTA === */}
        <section className="config-section">
          <h3 className="section-title">🍽️ Opciones de la Carta</h3>

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="carta.mostrarFotos"
              checked={!!form.carta?.mostrarFotos}
              onChange={handleChange}
            />
            <span>Mostrar fotos</span>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="carta.mostrarAlergenos"
              checked={!!form.carta?.mostrarAlergenos}
              onChange={handleChange}
            />
            <span>Mostrar alérgenos</span>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="carta.mostrarValoraciones"
              checked={!!form.carta?.mostrarValoraciones}
              onChange={handleChange}
            />
            <span>Mostrar valoraciones</span>
          </label>

          <div className="config-field">
            <label>Orden de la carta</label>
            <select
              name="carta.modoOrden"
              value={form.carta?.modoOrden || "por_categoria"}
              onChange={handleChange}
            >
              <option value="por_categoria">Por categorías (por defecto)</option>
              <option value="alfabetico">Alfabético (A-Z)</option>
              <option value="precio_asc">Precio: de menor a mayor</option>
              <option value="precio_desc">Precio: de mayor a menor</option>
              <option value="personalizado">
                Personalizado (según orden del producto)
              </option>
            </select>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="carta.mostrarDestacados"
              checked={!!form.carta?.mostrarDestacados}
              onChange={handleChange}
            />
            <span>Mostrar sección de productos destacados</span>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="carta.mostrarPromociones"
              checked={!!form.carta?.mostrarPromociones}
              onChange={handleChange}
            />
            <span>Mostrar sección de productos en promoción</span>
          </label>

          <div className="config-field">
            <label>Idiomas (separados por coma)</label>
            <input
              type="text"
              name="carta.idiomas"
              value={form.carta?.idiomas?.join(", ") || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  carta: {
                    ...form.carta,
                    idiomas: e.target.value
                      .split(",")
                      .map((i) => i.trim()),
                  },
                })
              }
            />
          </div>
        </section>

        {/* === DESTACADOS / PROMOS === */}
        {/* === DESTACADOS / PROMOS === */}
        <section className="config-section">
          <h3 className="section-title">⭐ Productos destacados y en promoción</h3>
          <p className="texto-ayuda">
            Selecciona productos por tipo y categoría, y márcalos como{" "}
            <strong>destacados</strong> o <strong>en promoción</strong> para
            resaltarlos en la carta.
          </p>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setPromoPanelAbierto(true)}
          >
            Gestionar productos destacados / en promoción
          </button>
        </section>

        <div className="config-actions">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? "Guardando..." : "Guardar todos los cambios"}
          </button>
        </div>
      </div>

      {/* ⭐ MODAL DESTACADOS / PROMOS */}
      {promoPanelAbierto && (
        <div className="modal-overlay-promos">
          <div className="modal-promos">
            <div className="modal-promos-header">
              <div>
                <h3>Productos destacados y en promoción</h3>
                <p>
                  Selecciona uno o varios productos, y márcalos como
                  destacados o en promoción. Los cambios se guardan al instante.
                </p>
              </div>
              <button
                type="button"
                className="modal-promos-close"
                onClick={() => setPromoPanelAbierto(false)}
              >
                ✕
              </button>
            </div>

            <div className="panel-promos">
              {/* Selección de tipo */}
              <div className="promo-tipos">
                <button
                  type="button"
                  className={`pill ${promoTipo === "plato" ? "active" : ""}`}
                  onClick={() => setPromoTipo("plato")}
                >
                  Platos
                </button>
                <button
                  type="button"
                  className={`pill ${promoTipo === "bebida" ? "active" : ""}`}
                  onClick={() => setPromoTipo("bebida")}
                >
                  Bebidas
                </button>
                <button
                  type="button"
                  className={`pill ${promoTipo === "extra" ? "active" : ""}`}
                  onClick={() => setPromoTipo("extra")}
                >
                  Extras
                </button>
              </div>

              {/* Selección de categoría */}
              <div className="promo-categorias">
                <label>Categoría</label>
                <select
                  value={promoCategoria}
                  onChange={(e) => setPromoCategoria(e.target.value)}
                >
                  <option value="">Todas</option>
                  {categoriasDisponibles.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Listado de productos */}
              <div className="promo-lista">
                {promoLoading ? (
                  <p>Cargando productos...</p>
                ) : productosFiltrados.length === 0 ? (
                  <p>No hay productos para este filtro.</p>
                ) : (
                  <ul>
                    {productosFiltrados.map((p) => (
                      <li key={p._id} className="promo-item">

                        {/* Selección masiva */}
                        <label className="promo-label">
                          <span className="promo-nombre">
                            {p.nombre} {p.categoria ? `(${p.categoria})` : ""}
                          </span>
                        </label>

                        {/* Toggles individuales */}
                        <div className="promo-toggles">
                          <label className="toggle-row">
                            <span>Destacado</span>
                            <input
                              type="checkbox"
                              className="toggle-switch"
                              checked={p.destacado}
                              onChange={() => handleToggleEstado(p._id, "destacado", !p.destacado)}
                            />
                          </label>

                          <label className="toggle-row">
                            <span>Promoción</span>
                            <input
                              type="checkbox"
                              className="toggle-switch"
                              checked={p.promocionado}
                              onChange={() => handleToggleEstado(p._id, "promocionado", !p.promocionado)}
                            />
                          </label>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Alerta */}
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}

      {/* 🟢 Modal */}
      {modal && (
        <ModalConfirmacion
          titulo={modal.titulo}
          mensaje={modal.mensaje}
          placeholder={modal.placeholder}
          onConfirm={modal.onConfirm}
          onClose={modal.onClose}
        />
      )}
    </div>
  );
}
