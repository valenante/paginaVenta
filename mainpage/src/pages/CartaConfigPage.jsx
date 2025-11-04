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
  const [alerta, setAlerta] = useState(null); // 🔹 estado para AlertaMensaje
  const [modal, setModal] = useState(null); // 🔹 estado para ModalConfirmacion
  const [dragOverSection, setDragOverSection] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const path = name.split(".");
    let updatedForm = { ...form };

    let obj = updatedForm;
    for (let i = 0; i < path.length - 1; i++) {
      obj = obj[path[i]];
    }
    obj[path[path.length - 1]] = type === "checkbox" ? checked : value;

    setForm(updatedForm);
  };

  /** === Subida de imagen === */
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
    updated.imagenesHome[section].splice(index, 1);
    setForm(updated);
    setAlerta({ tipo: "info", mensaje: "Imagen eliminada." });
  };

  // 🟣 Modal para agregar texto
  const handleAddText = (section) => {
    setModal({
      titulo: "Añadir texto",
      mensaje: "Introduce un texto para esta sección:",
      placeholder: "Ej: Bienvenidos a nuestro restaurante",
      onConfirm: (text) => {
        if (!text) return setAlerta({ tipo: "error", mensaje: "El texto no puede estar vacío." });
        const updated = { ...form };
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
    updated.textosHome[section].splice(index, 1);
    setForm(updated);
    setAlerta({ tipo: "info", mensaje: "Texto eliminado." });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data } = await api.put("/configuracion", form);
      setConfig(data);
      setAlerta({ tipo: "exito", mensaje: "Configuración actualizada correctamente" });
    } catch (err) {
      console.error("❌ Error al guardar configuración:", err);
      setAlerta({ tipo: "error", mensaje: "Error al guardar los cambios." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="config-page carta-config">
      <div className="config-card">
        <h2>Configuración de la Carta y Página Principal</h2>

        {/* === INFORMACIÓN GENERAL === */}
        <section>
          <h3>📍 Información del Restaurante</h3>
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
                    diasApertura: e.target.value.split(",").map((d) => d.trim()),
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
        <section>
          <h3>🖼️ Imágenes del Home</h3>
          {["carrousel", "secciones"].map((section) => (
            <div key={section} className="imagenes-bloque">
              <h4>{section === "carrousel" ? "Carrousel" : "Secciones"}</h4>
              <div
                className={`imagenes-grid ${dragOverSection === section ? "drag-over" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverSection(section);
                }}
                onDragLeave={() => setDragOverSection(null)}
                onDrop={(e) => handleDrop(section, e)}
                onClick={() => {
                  setDragOverSection(section);
                  fileInputRef.current.click();
                }}
              >
                {form.imagenesHome?.[section]?.map((url, i) => (
                  <div key={i} className="imagen-item">
                    <img src={url} alt={`${section}-${i}`} />
                    <button onClick={() => handleRemoveImage(section, i)}>🗑</button>
                  </div>
                ))}
                <button className="btn-add">
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
            onChange={(e) => handleSelectFile(dragOverSection || "carrousel", e)}
          />
        </section>

        {/* === TEXTOS HOME === */}
        <section>
          <h3>📝 Textos del Home</h3>
          {["carrousel", "secciones"].map((section) => (
            <div key={section} className="textos-section">
              <div className="textos-header">
                <h4>
                  {section === "carrousel" ? "Carrousel" : "Secciones"}{" "}
                  <span>({form.textosHome?.[section]?.length || 0})</span>
                </h4>
              </div>
              <ul className="textos-lista">
                {form.textosHome?.[section]?.map((t, i) => (
                  <li key={i}>
                    <span>{t}</span>
                    <button className="btn-remove" onClick={() => handleRemoveText(section, i)}>
                      🗑
                    </button>
                  </li>
                ))}
                <li className="li-add">
                  <button className="btn-add" onClick={() => handleAddText(section)}>
                    ➕ Añadir texto
                  </button>
                </li>
              </ul>
            </div>
          ))}
        </section>

        {/* === CONFIGURACIÓN CARTA === */}
        <section>
          <h3>🍽️ Opciones de la Carta</h3>
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="carta.mostrarFotos"
              checked={form.carta?.mostrarFotos}
              onChange={handleChange}
            />
            Mostrar fotos
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="carta.mostrarAlergenos"
              checked={form.carta?.mostrarAlergenos}
              onChange={handleChange}
            />
            Mostrar alérgenos
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="carta.mostrarValoraciones"
              checked={form.carta?.mostrarValoraciones}
              onChange={handleChange}
            />
            Mostrar valoraciones
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
                    idiomas: e.target.value.split(",").map((i) => i.trim()),
                  },
                })
              }
            />
          </div>
        </section>

        <button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar todos los cambios"}
        </button>
      </div>

      {/* 🟢 Mostrar alerta si existe */}
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}

      {/* 🟢 Mostrar modal si existe */}
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
