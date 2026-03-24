import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useConfig } from "../../context/ConfigContext.jsx";
import api from "../../utils/api.js";
import AlertaMensaje from "../../components/AlertaMensaje/AlertaMensaje.jsx";
import ModalConfirmacion from "../../components/Modal/ModalConfirmacion.jsx";
import CartaOrdenSection from "./CartaOrdenSection.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import CartaPromocionesPanel from "../../components/Promociones/CartaPromocionesPanel.jsx";
import { toImgSrc } from "../../utils/media";
import "../../styles/RestauranteConfigPage.css";
import "../../styles/CartaConfigPage.css";
import ErrorToast from "../../components/common/ErrorToast.jsx";
import { normalizeApiError } from "../../utils/normalizeApiError.js";
const HOME_SECTIONS = ["carrousel", "secciones"];

/* Color picker inline reutilizable (mismo estilo que TemaTpvPanel) */
const CartaColorPick = ({ label, value, name, onChange }) => (
  <label className="tema-pick">
    <span className="tema-pick__swatch" style={{ backgroundColor: value }}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange({ target: { name, value: e.target.value, type: "text" } })}
        className="tema-pick__input"
      />
    </span>
    <span className="tema-pick__label">{label}</span>
  </label>
);

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
    user?.role === "superadmin" ||
    user?.role === "admin_restaurante" ||
    user?.role === "admin_shop";

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
    const val = type === "checkbox" ? checked : value;

    setForm((prev) => {
      // Deep-clone the path to avoid mutating prev
      const updated = { ...prev };
      if (path.length === 1) {
        updated[path[0]] = val;
        return updated;
      }

      // Clone each nesting level
      let obj = updated;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        obj[key] = typeof obj[key] === "object" && obj[key] !== null
          ? { ...obj[key] }
          : {};
        obj = obj[key];
      }

      obj[path[path.length - 1]] = val;
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

      const cartaPayload = { ...(form.carta || {}) };
      // Asegurar booleanos explícitos (undefined no se serializa en JSON)
      cartaPayload.mostrarFotos = !!cartaPayload.mostrarFotos;
      cartaPayload.mostrarAlergenos = !!cartaPayload.mostrarAlergenos;
      cartaPayload.mostrarValoraciones = !!cartaPayload.mostrarValoraciones;
      cartaPayload.mostrarDestacados = !!cartaPayload.mostrarDestacados;
      cartaPayload.mostrarPromociones = !!cartaPayload.mostrarPromociones;
      cartaPayload.mostrarIconosCategorias = !!cartaPayload.mostrarIconosCategorias;

      const payload = {
        informacionRestaurante: {
          ...form.informacionRestaurante,
          diasApertura: dias,
        },
        imagenesHome: form.imagenesHome,
        textosHome: form.textosHome,
        temaCarta: form.temaCarta,
        carta: cartaPayload,
        mensajeBienvenida: form.mensajeBienvenida,
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
      <div className="carta-config-page cfg-page cfg-page--fixed-bar section section--wide">
        <div className="card carta-config-card">
          <h3>Cargando configuración...</h3>
        </div>
      </div>
    );
  }

  return (
    <main className="carta-config-page cfg-page cfg-page--fixed-bar section section--wide">
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

      {modal && (
        <ModalConfirmacion
          titulo={modal.titulo}
          mensaje={modal.mensaje}
          placeholder={modal.placeholder}
          onConfirm={modal.onConfirm}
          onClose={modal.onClose}
        />
      )}

      <header className="carta-config-header cfg-header">
        <div>
          <h1>🍽️ Configuración de la carta</h1>
          <p className="text-suave">
            Ajusta la información pública del restaurante, el contenido del home,
            el orden de la carta y su apariencia visual con una estructura Alef
            limpia y profesional.
          </p>
        </div>

        <div className="carta-config-header-status">
          <span className={`badge ${canEditConfig ? "badge-exito" : "badge-aviso"}`}>
            {canEditConfig ? "Edición habilitada" : "Solo lectura"}
          </span>
        </div>
      </header>

      <div className="carta-config-layout">
        <div className="carta-config-main">
          {/* INFORMACIÓN GENERAL */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>📍 Información del restaurante</h2>
                <p className="config-card-subtitle">
                  Estos datos aparecerán en la carta y en distintos puntos visibles
                  para el cliente.
                </p>
              </div>
            </div>

            <div className="carta-config-grid">
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

              <div className="config-field carta-config-grid-full">
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

          {/* IMÁGENES HOME */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>🖼️ Imágenes del home</h2>
                <p className="config-card-subtitle">
                  Gestiona el carrusel principal y las imágenes de secciones
                  destacadas de la home.
                </p>
              </div>
            </div>

            <div className="home-media-sections">
              {HOME_SECTIONS.map((section) => (
                <div key={section} className="home-media-block">
                  <div className="home-media-block__header">
                    <div>
                      <h3>{section === "carrousel" ? "Carrusel" : "Secciones"}</h3>
                      <p>
                        Arrastra imágenes o haz clic para añadir contenido visual.
                      </p>
                    </div>

                    <span className="badge badge-aviso">
                      {(form.imagenesHome?.[section] || []).length} imágenes
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
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleSelectFile}
            />
          </section>

          {/* TEXTOS HOME */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>📝 Textos del home</h2>
                <p className="config-card-subtitle">
                  Mensajes breves para el carrusel y las secciones destacadas.
                </p>
              </div>
            </div>

            <div className="home-texts-grid">
              {HOME_SECTIONS.map((section) => {
                const count = form.textosHome?.[section]?.length || 0;

                return (
                  <div key={section} className="textos-section">
                    <div className="textos-header">
                      <h3>
                        {section === "carrousel" ? "Carrusel" : "Secciones"}
                      </h3>
                      <span className="badge badge-aviso contador">
                        {count} textos
                      </span>
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
            </div>
          </section>

          {/* ORDEN / CONFIG CARTA */}
          <section className="card config-card config-card--embedded">
            <div className="config-card-header">
              <div>
                <h2>📚 Orden y estructura de la carta</h2>
                <p className="config-card-subtitle">
                  Define el orden de categorías, destacados, promociones y
                  comportamiento visual del catálogo.
                </p>
              </div>
            </div>

            <div className="embedded-section-reset">
              <CartaOrdenSection
                form={form}
                setForm={setForm}
                handleChange={handleChange}
                showAlert={showAlert}
              />
            </div>
          </section>

          {/* MENSAJE DE BIENVENIDA */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>👋 Mensaje de bienvenida</h2>
                <p className="config-card-subtitle">
                  Mensaje que aparece al entrar a la carta después del preMenu.
                  Incluye el logo del restaurante automáticamente.
                </p>
              </div>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="mensajeBienvenida.habilitado"
                checked={!!form.mensajeBienvenida?.habilitado}
                onChange={handleChange}
              />
              <span>Mostrar mensaje de bienvenida</span>
            </label>

            {form.mensajeBienvenida?.habilitado && (
              <div className="bienvenida-fields">
                <div className="config-field">
                  <label>Título</label>
                  <input
                    type="text"
                    name="mensajeBienvenida.titulo"
                    value={form.mensajeBienvenida?.titulo || ""}
                    onChange={handleChange}
                    placeholder="¡Bienvenido!"
                    maxLength={120}
                  />
                </div>

                <div className="config-field">
                  <label>Descripción</label>
                  <textarea
                    name="mensajeBienvenida.descripcion"
                    value={form.mensajeBienvenida?.descripcion || ""}
                    onChange={handleChange}
                    placeholder="Estamos encantados de recibirte. Explora nuestra carta y disfruta."
                    maxLength={500}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </section>

          {/* APARIENCIA */}
          <section className="card config-card config-card--tema">
            <header className="config-card-header">
              <h2>Apariencia de la carta</h2>
              <p className="config-card-subtitle">
                Personaliza los colores que verán los clientes en la carta
                online. La vista previa se actualiza en tiempo real.
              </p>
            </header>

            {/* Pickers agrupados */}
            <div className="tema-groups">
              <fieldset className="tema-group">
                <legend>Base</legend>
                <div className="tema-group__grid">
                  <CartaColorPick label="Fondo" value={form.temaCarta?.fondo || "#FFFFFF"} name="temaCarta.fondo" onChange={handleChange} />
                  <CartaColorPick label="Texto" value={form.temaCarta?.texto || "#2D2D2D"} name="temaCarta.texto" onChange={handleChange} />
                  <CartaColorPick label="Tarjetas" value={form.temaCarta?.cardBg || "#F5F5F5"} name="temaCarta.cardBg" onChange={handleChange} />
                </div>
              </fieldset>

              <fieldset className="tema-group">
                <legend>Marca</legend>
                <div className="tema-group__grid">
                  <CartaColorPick label="Principal" value={form.temaCarta?.colorPrincipal || "#9B1C1C"} name="temaCarta.colorPrincipal" onChange={handleChange} />
                  <CartaColorPick label="Secundario" value={form.temaCarta?.colorSecundario || "#4C5EA8"} name="temaCarta.colorSecundario" onChange={handleChange} />
                  <CartaColorPick label="Botones" value={form.temaCarta?.boton || "#9B1C1C"} name="temaCarta.boton" onChange={handleChange} />
                  <CartaColorPick label="Botones hover" value={form.temaCarta?.botonHover || "#7E1616"} name="temaCarta.botonHover" onChange={handleChange} />
                </div>
              </fieldset>
            </div>

            {/* Preview realista tipo móvil */}
            <div className="carta-preview-wrap">
              <div
                className="carta-preview"
                style={{
                  backgroundColor: form.temaCarta?.fondo || "#FFFFFF",
                  color: form.temaCarta?.texto || "#2D2D2D",
                }}
              >
                {/* Navbar */}
                <div
                  className="carta-preview__nav"
                  style={{ backgroundColor: form.temaCarta?.colorPrincipal || "#9B1C1C" }}
                >
                  <span className="carta-preview__nav-logo">Mi Restaurante</span>
                  <div className="carta-preview__nav-tabs">
                    <span className="carta-preview__tab active">Entrantes</span>
                    <span className="carta-preview__tab">Principales</span>
                    <span className="carta-preview__tab">Postres</span>
                  </div>
                </div>

                {/* Product cards */}
                <div className="carta-preview__body">
                  <h4
                    className="carta-preview__section-title"
                    style={{ color: form.temaCarta?.colorPrincipal || "#9B1C1C" }}
                  >
                    Entrantes
                  </h4>

                  {[
                    { nombre: "Croquetas caseras", precio: "8,50 €", badge: "Popular" },
                    { nombre: "Ensalada mixta", precio: "7,00 €", badge: null },
                  ].map((p) => (
                    <div
                      key={p.nombre}
                      className="carta-preview__card"
                      style={{
                        backgroundColor: form.temaCarta?.cardBg || "#F5F5F5",
                      }}
                    >
                      <div className="carta-preview__card-img" />
                      <div className="carta-preview__card-info">
                        <div className="carta-preview__card-top">
                          <span className="carta-preview__card-name">{p.nombre}</span>
                          {p.badge && (
                            <span
                              className="carta-preview__card-badge"
                              style={{ backgroundColor: form.temaCarta?.colorSecundario || "#4C5EA8" }}
                            >
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <div className="carta-preview__card-bottom">
                          <span className="carta-preview__card-price">{p.precio}</span>
                          <button
                            type="button"
                            className="carta-preview__btn"
                            style={{ backgroundColor: form.temaCarta?.boton || "#9B1C1C" }}
                          >
                            Añadir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Floating cart */}
                <div
                  className="carta-preview__cart"
                  style={{ backgroundColor: form.temaCarta?.boton || "#9B1C1C" }}
                >
                  <span>Ver carrito · 2 items</span>
                  <span style={{ fontWeight: 800 }}>15,50 €</span>
                </div>
              </div>
            </div>
          </section>

          {/* PROMOCIONES */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>⭐ Promociones y destacados</h2>
                <p className="config-card-subtitle">
                  Gestiona productos destacados y promociones activas que se
                  muestran en la carta.
                </p>
              </div>
            </div>

            <div className="promo-actions">
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => setPromoPanelAbierto(true)}
              >
                Gestionar promociones
              </button>
            </div>
          </section>
        </div>
      </div>

      <div className="carta-config-actions cfg-actions-bar">
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

      <CartaPromocionesPanel
        abierto={promoPanelAbierto}
        onClose={() => setPromoPanelAbierto(false)}
      />
    </main>
  );
}
