import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useConfig } from "../../context/ConfigContext.jsx";
import api from "../../utils/api.js";
import AlertaMensaje from "../../components/AlertaMensaje/AlertaMensaje.jsx";
import ModalConfirmacion from "../../components/Modal/ModalConfirmacion.jsx";
import CartaOrdenSection from "./CartaOrdenSection.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import CartaPromocionesPanel from "../../components/Promociones/CartaPromocionesPanel.jsx";
import "../../styles/CartaConfigPage.css";
import ErrorToast from "../../components/common/ErrorToast.jsx";
import { normalizeApiError } from "../../utils/normalizeApiError.js";
const HOME_SECTIONS = ["carrousel", "secciones"];

export default function CartaConfigPage() {
  const { config, setConfig, refreshConfig } = useConfig();
  const [form, setForm] = useState(config || {});
  const [saving, setSaving] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [error, setError] = useState(null);
  const [diasAperturaRaw, setDiasAperturaRaw] = useState("");
  /**
   * modal:
   * - modo: "confirm" | "prompt"
   * - titulo, mensaje, placeholder (opcional)
   * - onConfirm(valor?) / onClose()
   */
  const [modal, setModal] = useState(null);

  const [dragOverSection, setDragOverSection] = useState(null);
  const [promoPanelAbierto, setPromoPanelAbierto] = useState(false);

  const fileInputRef = useRef(null);
  const uploadTargetRef = useRef("carrousel");
  const { user } = useAuth();

  const canEditConfig =
    user?.role === "admin_restaurante" || user?.role === "admin_shop";

  // Sync cuando llega configfrefre
  useEffect(() => {
    if (!config) return;

    setForm(config);

    const arr = config?.informacionRestaurante?.diasApertura;
    setDiasAperturaRaw(Array.isArray(arr) ? arr.join(", ") : "");
  }, [config]);
  // ----------------------------
  // Helpers UI
  // ----------------------------
  const showAlert = useCallback((tipo, mensaje) => {
    setAlerta({ tipo, mensaje });
  }, []);

  const closeModal = useCallback(() => setModal(null), []);

  const openModalConfirm = useCallback(
    ({ titulo, mensaje, onConfirm }) => {
      setModal({
        modo: "confirm",
        titulo,
        mensaje,
        onConfirm: async () => {
          try {
            await onConfirm?.();
          } finally {
            closeModal();
          }
        },
        onClose: closeModal,
      });
    },
    [closeModal]
  );

  const openModalPrompt = useCallback(
    ({ titulo, mensaje, placeholder, onConfirm }) => {
      setModal({
        modo: "prompt",
        titulo,
        mensaje,
        placeholder: placeholder || "",
        onConfirm: async (valor) => {
          await onConfirm?.(valor); // 👈 si valida y no quiere cerrar, que no llame closeModal
        },
        onClose: closeModal,
      });
    },
    [closeModal]
  );

  // ----------------------------
  // Form helpers
  // ----------------------------
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const path = name.split(".");

    setForm((prev) => {
      const updated = { ...prev };
      let obj = updated;

      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (typeof obj[key] !== "object" || obj[key] === null) obj[key] = {};
        obj = obj[key];
      }

      obj[path[path.length - 1]] = type === "checkbox" ? checked : value;
      return updated;
    });
  }, []);

  const diasAperturaValue = useMemo(() => {
    const arr = form?.informacionRestaurante?.diasApertura;
    return Array.isArray(arr) ? arr.join(", ") : "";
  }, [form?.informacionRestaurante?.diasApertura]);

  const handleDiasAperturaChange = useCallback((e) => {
    const raw = e.target.value;
    const dias = raw
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    setForm((prev) => ({
      ...prev,
      informacionRestaurante: {
        ...prev.informacionRestaurante,
        diasApertura: dias,
      },
    }));
  }, []);

  // ----------------------------
  // Upload helpers
  // ----------------------------
  const openFilePicker = useCallback((section) => {
    uploadTargetRef.current = section;
    setDragOverSection(section);
    fileInputRef.current?.click();
  }, []);

  const handleFileUpload = useCallback(
    async (section, file) => {
      if (!file) return;

      setAlerta(null);
      setError(null);

      const formData = new FormData();
      formData.append("imagen", file);
      formData.append("seccion", section);

      try {
        const { data } = await api.post("/configuracion/imagen", formData);

        setForm((prev) => ({
          ...prev,
          imagenesHome: {
            ...prev.imagenesHome,
            [section]: [...(prev.imagenesHome?.[section] || []), data.imagePath],
          },
        }));

        showAlert("exito", "Imagen subida correctamente");
      } catch (err) {
        const normalized = normalizeApiError(err);
        setError({
          ...normalized,
          retryFn: () => handleFileUpload(section, file),
        });
      } finally {
        setDragOverSection(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [showAlert]
  );

  const handleDrop = useCallback(
    (section, e) => {
      e.preventDefault();
      setDragOverSection(null);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileUpload(section, file);
    },
    [handleFileUpload]
  );

  const handleSelectFile = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(uploadTargetRef.current, file);
    },
    [handleFileUpload]
  );

  // ----------------------------
  // Remove (con confirm)
  // ----------------------------
  const requestRemoveImage = useCallback(
    (section, index) => {
      openModalConfirm({
        titulo: "Eliminar imagen",
        mensaje: `¿Seguro que deseas eliminar esta imagen de "${section === "carrousel" ? "Carrusel" : "Secciones"
          }"? Esta acción no se puede deshacer.`,
        onConfirm: () => {
          setForm((prev) => {
            const updated = { ...prev };
            const list = updated.imagenesHome?.[section] || [];
            updated.imagenesHome = { ...updated.imagenesHome };
            updated.imagenesHome[section] = [
              ...list.slice(0, index),
              ...list.slice(index + 1),
            ];
            return updated;
          });

          showAlert("info", "Imagen eliminada.");
        },
      });
    },
    [openModalConfirm, showAlert]
  );

  const handleAddText = useCallback(
    (section) => {
      openModalPrompt({
        titulo: "Añadir texto",
        mensaje: "Introduce un texto para esta sección:",
        placeholder: "Ej: Bienvenidos a nuestro restaurante",
        onConfirm: (textRaw) => {
          const text = (textRaw || "").trim();
          if (!text) {
            showAlert("error", "El texto no puede estar vacío.");
            return; // 👈 mantenemos el modal abierto
          }

          setForm((prev) => {
            const updated = { ...prev };
            updated.textosHome = { ...(updated.textosHome || {}) };
            updated.textosHome[section] = [
              ...(updated.textosHome?.[section] || []),
              text,
            ];
            return updated;
          });

          closeModal();
          showAlert("exito", "Texto añadido correctamente.");
        },
      });
    },
    [openModalPrompt, closeModal, showAlert]
  );

  const requestRemoveText = useCallback(
    (section, index) => {
      const txt = form.textosHome?.[section]?.[index] || "";

      openModalConfirm({
        titulo: "Eliminar texto",
        mensaje: `¿Seguro que deseas eliminar este texto?\n\n“${txt}”`,
        onConfirm: () => {
          setForm((prev) => {
            const updated = { ...prev };
            const list = updated.textosHome?.[section] || [];
            updated.textosHome = { ...(updated.textosHome || {}) };
            updated.textosHome[section] = [
              ...list.slice(0, index),
              ...list.slice(index + 1),
            ];
            return updated;
          });

          showAlert("info", "Texto eliminado.");
        },
      });
    },
    [form.textosHome, openModalConfirm, showAlert]
  );

  const toImgSrc = (u) => {
    const s = String(u || "");
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s; // compat
    if (s.startsWith("/uploads/")) return `${window.location.origin}${s}`;
    return s;
  };

  // ----------------------------
  // Save
  // ----------------------------
  const handleSave = useCallback(async (reason = "Cambios carta / home") => {
    setAlerta(null);
    setError(null);

    try {
      setSaving(true);

      const dias = diasAperturaRaw
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      const payload = {
        informacionRestaurante: {
          ...form.informacionRestaurante,
          diasApertura: dias,
        },
        imagenesHome: form.imagenesHome,
        textosHome: form.textosHome,
        temaCarta: form.temaCarta,
        carta: form.carta,
      };

      // ✅ Guardrails: draft
      const { data: draft } = await api.post("/admin/config/versions", {
        patch: payload, // root-level patch (tu backend lo permite)
        scope: "carta_config",
        reason,
      });

      const versionId = draft?.version?.id || draft?.versionId || draft?.id;
      if (!versionId) throw new Error("No se recibió versionId del draft");

      // ✅ apply
      await api.post(`/admin/config/versions/${versionId}/apply`, { reason });

      // ✅ refresh real
      await refreshConfig();

      showAlert("exito", "Configuración actualizada correctamente ✅");
    } catch (err) {
      const normalized = normalizeApiError(err);
      setError({
        ...normalized,
        retryFn: () => handleSave(reason),
      });
    } finally {
      setSaving(false);
    }
  }, [form, diasAperturaRaw, refreshConfig, showAlert]);

  const handleRollback = useCallback(async (reason = "Rollback carta/config") => {
    setAlerta(null);
    setError(null);

    try {
      setSaving(true);
      await api.post("/admin/config/rollback", { reason });
      await refreshConfig();
      showAlert("exito", "Rollback aplicado ✅");
    } catch (err) {
      const normalized = normalizeApiError(err);
      setError({
        ...normalized,
        retryFn: () => handleRollback(reason),
      });
    } finally {
      setSaving(false);
    }
  }, [refreshConfig, showAlert]);

  // ----------------------------
  // UX: cerrar menú dragOver al resize (por si acaso)
  // ----------------------------
  useEffect(() => {
    const onResize = () => setDragOverSection(null);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ----------------------------
  // Guard: config
  // ----------------------------
  if (!config) {
    return (
      <div className="carta-config-page section section--wide">
        <div className="card carta-config-card">
          <h3>Cargando configuración...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="carta-config-page section section--wide">
      <div className="card carta-config-card">
        {/* ===== HEADER PRINCIPAL ===== */}
        <header className="carta-config-header">
          <div>
            <h2 className="config-title">
              🍽 Configuración de la carta y página principal
            </h2>
            <p className="config-subtitle">
              Ajusta la información que verán tus clientes al entrar en la carta,
              las imágenes destacadas del home y el estilo visual general.
            </p>
          </div>
        </header>

        {/* === INFORMACIÓN GENERAL === */}
        <section className="config-section">
          <div className="config-section-header">
            <h3 className="section-title">📍 Información del restaurante</h3>
            <p className="section-description">
              Estos datos aparecerán en la cabecera de la carta y en distintos
              puntos de la experiencia del cliente.
            </p>
          </div>

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
              value={diasAperturaRaw}
              onChange={(e) => setDiasAperturaRaw(e.target.value)}
              onBlur={() => {
                const dias = diasAperturaRaw
                  .split(",")
                  .map((d) => d.trim())
                  .filter(Boolean);

                setForm((prev) => ({
                  ...prev,
                  informacionRestaurante: {
                    ...prev.informacionRestaurante,
                    diasApertura: dias,
                  },
                }));
              }}
              placeholder="Ej: lunes, martes, miércoles"
            />
          </div>

          <div className="config-field-row">
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
          <div className="config-section-header">
            <h3 className="section-title">🖼 Imágenes del home</h3>
            <p className="section-description">
              y de los bloques de
              secciones que se muesGestiona las imágenes del carrusel principal tran en la página de inicio.
            </p>
          </div>

          {HOME_SECTIONS.map((section) => (
            <div key={section} className="imagenes-bloque">
              <div className="section-subheader">
                <h4 className="subsection-title">
                  {section === "carrousel" ? "Carrusel" : "Secciones"}
                </h4>
                <span className="section-subtitle">
                  Arrastra imágenes o haz clic para añadir
                </span>
              </div>

              <div
                className={`imagenes-grid card-border-dashed ${dragOverSection === section ? "drag-over" : ""
                  }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  uploadTargetRef.current = section;
                  setDragOverSection(section);
                }}
                onDragLeave={() => setDragOverSection(null)}
                onDrop={(e) => handleDrop(section, e)}
                onClick={() => openFilePicker(section)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openFilePicker(section);
                }}
              >
                {(form.imagenesHome?.[section] || []).map((url, i) => (
                  <div key={`${url}-${i}`} className="imagen-item">
                    <img src={toImgSrc(url)} alt={`${section}-${i}`} />                    
                    <button
                      type="button"
                      className="config-btn-delete"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        requestRemoveImage(section, i);
                      }}
                      title="Eliminar imagen"
                      aria-label="Eliminar imagen"
                    >
                      🗑
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="config-btn-add"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    openFilePicker(section);
                  }}
                >
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
            onChange={handleSelectFile}
          />
        </section>

        {/* === TEXTOS HOME === */}
        <section className="config-section">
          <div className="config-section-header">
            <h3 className="section-title">📝 Textos del home</h3>
            <p className="section-description">
              Mensajes breves que acompañan a las imágenes del carrusel y a las
              secciones destacadas.
            </p>
          </div>

          {HOME_SECTIONS.map((section) => {
            const count = form.textosHome?.[section]?.length || 0;

            return (
              <div key={section} className="textos-section">
                <div className="textos-header">
                  <h4 className="subsection-title">
                    {section === "carrousel" ? "Carrusel" : "Secciones"}{" "}
                    <span className="badge badge-aviso contador">
                      {count} textos
                    </span>
                  </h4>
                </div>

                <ul className="textos-lista">
                  {(form.textosHome?.[section] || []).map((t, i) => (
                    <li key={`${t}-${i}`} className="texto-item card-row">
                      <span>{t}</span>
                      <button
                        type="button"
                        className="config-btn-delete"
                        onClick={() => requestRemoveText(section, i)}
                        title="Eliminar texto"
                        aria-label="Eliminar texto"
                      >
                        🗑
                      </button>
                    </li>
                  ))}

                  <li className="li-add">
                    <button
                      type="button"
                      className="config-btn-add"
                      onClick={() => handleAddText(section)}
                    >
                      ➕ Añadir texto
                    </button>
                  </li>
                </ul>
              </div>
            );
          })}
        </section>

        <CartaOrdenSection
          form={form}
          setForm={setForm}
          handleChange={handleChange}
          showAlert={showAlert}
        />

        {/* === TEMA VISUAL DE LA CARTA === */}
        <section className="config-section">
          <div className="config-section-header">
            <h3 className="section-title">🎨 Apariencia de la carta</h3>
            <p className="section-description">
              Personaliza los colores de la carta que verá el cliente. Estos
              ajustes solo afectan a la carta online, no al TPV.
            </p>
          </div>

          <div className="theme-grid">
            <div className="theme-row">
              <label>Color principal</label>
              <div className="theme-inputs">
                <input
                  type="color"
                  name="temaCarta.colorPrincipal"
                  value={form.temaCarta?.colorPrincipal || "#9B1C1C"}
                  onChange={handleChange}
                  className="theme-color-input"
                />
                <input
                  type="text"
                  name="temaCarta.colorPrincipal"
                  value={form.temaCarta?.colorPrincipal || "#9B1C1C"}
                  onChange={handleChange}
                  className="theme-text-input"
                />
              </div>
              <small className="theme-help">Botones principales, títulos y acentos.</small>
            </div>

            <div className="theme-row">
              <label>Color secundario</label>
              <div className="theme-inputs">
                <input
                  type="color"
                  name="temaCarta.colorSecundario"
                  value={form.temaCarta?.colorSecundario || "#4C5EA8"}
                  onChange={handleChange}
                  className="theme-color-input"
                />
                <input
                  type="text"
                  name="temaCarta.colorSecundario"
                  value={form.temaCarta?.colorSecundario || "#4C5EA8"}
                  onChange={handleChange}
                  className="theme-text-input"
                />
              </div>
              <small className="theme-help">Elementos secundarios, etiquetas o detalles.</small>
            </div>

            <div className="theme-row">
              <label>Fondo de la página</label>
              <div className="theme-inputs">
                <input
                  type="color"
                  name="temaCarta.fondo"
                  value={form.temaCarta?.fondo || "#FFFFFF"}
                  onChange={handleChange}
                  className="theme-color-input"
                />
                <input
                  type="text"
                  name="temaCarta.fondo"
                  value={form.temaCarta?.fondo || "#FFFFFF"}
                  onChange={handleChange}
                  className="theme-text-input"
                />
              </div>
            </div>

            <div className="theme-row">
              <label>Color del texto</label>
              <div className="theme-inputs">
                <input
                  type="color"
                  name="temaCarta.texto"
                  value={form.temaCarta?.texto || "#2D2D2D"}
                  onChange={handleChange}
                  className="theme-color-input"
                />
                <input
                  type="text"
                  name="temaCarta.texto"
                  value={form.temaCarta?.texto || "#2D2D2D"}
                  onChange={handleChange}
                  className="theme-text-input"
                />
              </div>
            </div>

            <div className="theme-row">
              <label>Fondo de tarjetas / productos</label>
              <div className="theme-inputs">
                <input
                  type="color"
                  name="temaCarta.cardBg"
                  value={form.temaCarta?.cardBg || "#F5F5F5"}
                  onChange={handleChange}
                  className="theme-color-input"
                />
                <input
                  type="text"
                  name="temaCarta.cardBg"
                  value={form.temaCarta?.cardBg || "#F5F5F5"}
                  onChange={handleChange}
                  className="theme-text-input"
                />
              </div>
            </div>

            <div className="theme-row">
              <label>Color de botones</label>
              <div className="theme-inputs">
                <input
                  type="color"
                  name="temaCarta.boton"
                  value={form.temaCarta?.boton || "#9B1C1C"}
                  onChange={handleChange}
                  className="theme-color-input"
                />
                <input
                  type="text"
                  name="temaCarta.boton"
                  value={form.temaCarta?.boton || "#9B1C1C"}
                  onChange={handleChange}
                  className="theme-text-input"
                />
              </div>
            </div>

            <div className="theme-row">
              <label>Hover de botones</label>
              <div className="theme-inputs">
                <input
                  type="color"
                  name="temaCarta.botonHover"
                  value={form.temaCarta?.botonHover || "#7E1616"}
                  onChange={handleChange}
                  className="theme-color-input"
                />
                <input
                  type="text"
                  name="temaCarta.botonHover"
                  value={form.temaCarta?.botonHover || "#7E1616"}
                  onChange={handleChange}
                  className="theme-text-input"
                />
              </div>
            </div>
          </div>

          <div className="theme-preview">
            <div
              className="theme-preview-inner"
              style={{
                backgroundColor: form.temaCarta?.fondo || "#FFFFFF",
                color: form.temaCarta?.texto || "#2D2D2D",
              }}
            >
              <h4
                className="theme-preview-title"
                style={{ color: form.temaCarta?.colorPrincipal || "#9B1C1C" }}
              >
                Vista previa de la carta
              </h4>

              <div
                className="theme-preview-card"
                style={{
                  backgroundColor: form.temaCarta?.cardBg || "#F5F5F5",
                  borderColor: form.temaCarta?.cardBorde || "#CCCCCC",
                }}
              >
                <span className="theme-preview-producto">Producto de ejemplo</span>
                <span className="theme-preview-precio">12,00 €</span>
                <button
                  type="button"
                  className="theme-preview-btn"
                  style={{ backgroundColor: form.temaCarta?.boton || "#9B1C1C" }}
                >
                  Añadir
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* === PROMOS === */}
        <section className="config-section">
          <div className="config-section-header">
            <h3 className="section-title">⭐ Promociones y destacados</h3>
            <p className="section-description">
              Gestiona los productos destacados y las promociones activas en la carta.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secundario"
            onClick={() => setPromoPanelAbierto(true)}
          >
            Gestionar promociones
          </button>
        </section>
      </div>

      {/* Barra de acciones */}
      <div className="carta-config-actions">
        <button
          type="button"
          disabled={saving || !canEditConfig}
          className="btn btn-primario"
          title={!canEditConfig ? "No tienes permisos para editar configuración" : ""}
          onClick={() =>
            openModalPrompt({
              titulo: "Aplicar cambios",
              mensaje: "Escribe un motivo (se guardará en el historial).",
              placeholder: "Motivo (recomendado)",
              onConfirm: async (valor) => {
                const reason = (valor || "").trim() || "Cambios carta / home";
                await handleSave(reason);
                closeModal();
              },
            })
          }
        >
          {saving ? "Guardando..." : "Guardar todos los cambios"}
        </button>

        <button
          type="button"
          disabled={saving || !canEditConfig}
          className="btn btn-secundario"
          title={!canEditConfig ? "No tienes permisos para editar configuración" : ""}
          onClick={() =>
            openModalPrompt({
              titulo: "Confirmar rollback",
              mensaje: "Escribe un motivo (se guardará en el historial).",
              placeholder: "Motivo (recomendado)",
              onConfirm: async (valor) => {
                const reason = (valor || "").trim() || "Rollback carta/config";
                await handleRollback(reason);
                closeModal();
              },
            })
          }
        >
          Revertir último cambio
        </button>
      </div>

      {/* Alerta */}
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}

      {error && (
        <ErrorToast
          error={error}
          onRetry={error.canRetry ? error.retryFn : undefined}
          onClose={() => setError(null)}
        />
      )}

      {/* Panel promociones */}
      <CartaPromocionesPanel
        abierto={promoPanelAbierto}
        onClose={() => setPromoPanelAbierto(false)}
      />

      {/* Modal confirm/prompt */}
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
