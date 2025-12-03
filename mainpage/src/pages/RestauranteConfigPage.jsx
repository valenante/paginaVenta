import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useConfig } from "../context/ConfigContext.jsx";
import api from "../utils/api";
import "../styles/RestauranteConfigPage.css";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";

export default function RestauranteConfigPage() {
  const { config, setConfig } = useConfig();
  const location = useLocation();

  const [form, setForm] = useState({
    branding: {},
    colores: {},
    estilo: {},
    temaTpv: {
      colorPrincipal: "#9B1C1C",
      colorSecundario: "#4C5EA8",
      fondo: "#5B1010",
      texto: "#ffffff",
      cardBg: "#3a3a3a",
      cardBorde: "#555555",
      boton: "#4C5EA8",
      botonHover: "#3C4C8A",
    },
  });

  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loadingFeatures, setLoadingFeatures] = useState(true);

  // === Estado modales y alertas ===
  const [modalConfirmSif, setModalConfirmSif] = useState(null);
  const [modalConfirmDelete, setModalConfirmDelete] = useState(null);
  const [alerta, setAlerta] = useState(null);

  // === SECCIONES / ESTACIONES ===
  const [secciones, setSecciones] = useState([]);
  const [estaciones, setEstaciones] = useState([]);

  const [nuevaSeccion, setNuevaSeccion] = useState({
    nombre: "",
    slug: "",
    destino: "cocina",
  });
  const [nuevaEstacion, setNuevaEstacion] = useState({
    nombre: "",
    slug: "",
    destino: "cocina",
    esCentral: false,
  });

  const [loadingSecciones, setLoadingSecciones] = useState(true);
  const [loadingEstaciones, setLoadingEstaciones] = useState(true);

  const [verifactuEnabled, setVerifactuEnabled] = useState(false);
  const [verifactuLoaded, setVerifactuLoaded] = useState(false);

  const [editandoSeccion, setEditandoSeccion] = useState(null);
  const [editandoEstacion, setEditandoEstacion] = useState(null);



  // === SIF CONFIG ===
  const [sifForm, setSifForm] = useState({
    cif: "",
    razonSocial: "",
    direccion: "",
    municipio: "",
    provincia: "",
    codigoPostal: "",
    pais: "ES",
  });
  const [sifMensaje, setSifMensaje] = useState(null);
  const [sifLoading, setSifLoading] = useState(false);

  // === Refs para inputs ===
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);
  const fondoInputRef = useRef(null);

  // Carga de features y config base
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const { data } = await api.get("/admin/features-plan");
        setFeatures(data.features || []);
        setConfig(data.config);
      } catch (err) {
        setAlerta({
          tipo: "error",
          mensaje: "Error al cargar funcionalidades del plan.",
        });
      } finally {
        setLoadingFeatures(false);
      }
    };

    fetchFeatures();
  }, [setConfig]);

  // Carga secciones / estaciones
  useEffect(() => {
    const fetchData = async () => {
      try {
        const sec = await api.get("/secciones");
        const est = await api.get("/estaciones");
        setSecciones(sec.data || []);
        setEstaciones(est.data || []);
      } catch (err) {
        setAlerta({
          tipo: "error",
          mensaje: "Error al cargar secciones o estaciones.",
        });
      } finally {
        setLoadingSecciones(false);
        setLoadingEstaciones(false);
      }
    };
    fetchData();
  }, []);

  // Cargar config en el formulario
  useEffect(() => {
    if (config) {
      setForm((prev) => ({
        ...prev,
        branding: config.branding || {},
        colores: config.colores || {},
        estilo: config.estilo || {},
        temaTpv: config.temaTpv || prev.temaTpv,
      }));
    }
  }, [config]);

  // Helper para leer paths "impresion.imprimirPedidosCocina"
  const getConfigValue = (cfg, path) => {
    if (!cfg || !path) return undefined;
    return path.split(".").reduce((acc, part) => {
      if (acc == null) return undefined;
      return acc[part];
    }, cfg);
  };

  // Actualizar flags de config cuando tocas una feature
  const handleFeatureUpdate = async (configKey, value) => {
    try {
      const { data } = await api.put("/admin/features-plan/update", {
        key: configKey,
        value,
      });

      setConfig(data);

      // 🔄 Si la feature toca pedidos comida/bebida → sincronizar flujoPedidos
      if (
        configKey === "flujoPedidos.permitePedidosComida" ||
        configKey === "flujoPedidos.permitePedidosBebida"
      ) {
        try {
          const nuevoFlujo = {
            permitePedidosComida:
              configKey === "flujoPedidos.permitePedidosComida" ? value : config.flujoPedidos?.permitePedidosComida,
            permitePedidosBebida:
              configKey === "flujoPedidos.permitePedidosBebida" ? value : config.flujoPedidos?.permitePedidosBebida,
          };

          const resFlujo = await api.put("/admin/config/flujo-pedidos", nuevoFlujo);

          // Guardar el flujo actualizado
          setConfig((prev) => ({
            ...prev,
            flujoPedidos: resFlujo.data.flujoPedidos,
          }));
        } catch (err) {
          console.error("Error sincronizando flujo pedidos:", err);
        }
      }

      setAlerta({
        tipo: "success",
        mensaje: "Cambios guardados correctamente ✅",
      });
    } catch (err) {
      console.error("[RestauranteConfig] Error al actualizar feature:", err);
      setAlerta({
        tipo: "error",
        mensaje: "Error al actualizar la configuración del plan.",
      });
    }
  };

  // Estado de VeriFactu
  useEffect(() => {
    const checkVerifactu = async () => {
      try {
        const { data } = await api.get("/admin/verifactu/verifactu");
        setVerifactuEnabled(!!data.enabled);
      } catch (err) {
        console.error(
          "[RestauranteConfig] Error obteniendo estado VeriFactu:",
          err.message
        );
      } finally {
        setVerifactuLoaded(true);
      }
    };
    checkVerifactu();
  }, []);

  // Alerta si venimos redirigidos desde el guard
  useEffect(() => {
    if (location.state?.fromVerifactuGuard) {
      setAlerta({
        tipo: "warning",
        mensaje:
          "Debes completar la configuración fiscal (SIF) y activar VeriFactu antes de poder utilizar el TPV.",
      });
    }
  }, [location.state]);

  // Cargar configuración SIF
  useEffect(() => {
    const fetchSifConfig = async () => {
      try {
        const { data } = await api.get("admin/verifactu/sifconfig");
        setSifForm({
          cif: data.productor?.nif || "",
          razonSocial: data.productor?.nombreRazon || "",
          direccion: data.direccion || "",
          municipio: data.municipio || "",
          provincia: data.provincia || "",
          codigoPostal: data.codigoPostal || "",
          pais: data.pais || "ES",
        });
      } catch (err) {
        setAlerta({
          tipo: "error",
          mensaje: "Error al obtener configuración SIF.",
        });
      }
    };
    fetchSifConfig();
  }, []);

  /** === Subida de imágenes === */
  const handleFileUpload = async (file, tipo) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("logo", file);

    try {
      setSaving(true);
      const { data } = await api.post("/configuracion/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newBranding = { ...form.branding };
      if (tipo === "logo") newBranding.logoUrl = data.logoUrl;
      if (tipo === "favicon") newBranding.faviconUrl = data.logoUrl;
      if (tipo === "fondo") newBranding.imagenFondoLogin = data.logoUrl;

      setForm((prev) => ({ ...prev, branding: newBranding }));
      setConfig(data.config);
      setAlerta({
        tipo: "success",
        mensaje: "Imagen subida correctamente ✅",
      });
    } catch (err) {
      setAlerta({ tipo: "error", mensaje: "Error al subir imagen." });
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = (tipo, e) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file, tipo);
  };

  const handleFileSelect = (tipo, e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file, tipo);
  };

  /** === Guardar configuración general === */
  const handleSave = async () => {
    try {
      setSaving(true);
      const { data } = await api.put("/configuracion", {
        branding: form.branding,
        colores: form.colores,
        estilo: form.estilo,
        temaTpv: form.temaTpv,
      });
      setConfig(data);
      setAlerta({
        tipo: "success",
        mensaje: "Configuración guardada correctamente ✅",
      });
    } catch {
      setAlerta({
        tipo: "error",
        mensaje: "Error al guardar configuración.",
      });
    } finally {
      setSaving(false);
    }
  };

  /** === Guardar configuración SIF === */
  const handleSaveSif = async () => {
    setModalConfirmSif({
      titulo: "Confirmar guardado",
      mensaje: "¿Deseas guardar la configuración SIF?",
      onConfirm: async () => {
        try {
          setSifLoading(true);
          const payload = {
            productor: {
              nif: sifForm.cif,
              nombreRazon: sifForm.razonSocial,
            },
            direccion: sifForm.direccion,
            municipio: sifForm.municipio,
            provincia: sifForm.provincia,
            codigoPostal: sifForm.codigoPostal,
            pais: sifForm.pais,
          };
          const { data } = await api.post("admin/verifactu/init-sif", payload);
          setSifMensaje(
            data.message || "Configuración SIF guardada correctamente ✅"
          );
          setAlerta({
            tipo: "success",
            mensaje: "Configuración SIF actualizada ✅",
          });
        } catch {
          setAlerta({
            tipo: "error",
            mensaje: "Error al guardar configuración SIF.",
          });
        } finally {
          setSifLoading(false);
          setModalConfirmSif(null); // 👈 cerramos este modal
        }
      },
      onClose: () => setModalConfirmSif(null),
    });
  };

  // === CRUD SECCIONES ===
  const crearSeccion = async () => {
    if (!nuevaSeccion.nombre.trim()) return;

    try {
      const { data } = await api.post("/secciones", nuevaSeccion);

      setSecciones((prev) => [...prev, data]);

      setNuevaSeccion({
        nombre: "",
        slug: "",
        destino: "cocina",
      });

      setAlerta({
        tipo: "success",
        mensaje: "Sección creada correctamente.",
      });
    } catch (err) {
      setAlerta({ tipo: "error", mensaje: "Error al crear sección." });
    }
  };

  const eliminarSeccion = async (id) => {
    try {
      await api.delete(`/secciones/${id}`);
      setSecciones((prev) => prev.filter((s) => s._id !== id));
      setAlerta({ tipo: "success", mensaje: "Sección eliminada." });
    } catch (err) {
      setAlerta({ tipo: "error", mensaje: "Error al eliminar sección." });
    }
  };

  const iniciarEdicionSeccion = (seccion) => {
    setEditandoSeccion({ ...seccion });
  };

  const guardarEdicionSeccion = async () => {
    try {
      const { data } = await api.put(`/secciones/${editandoSeccion._id}`, editandoSeccion);

      setSecciones((prev) =>
        prev.map((s) => (s._id === data._id ? data : s))
      );

      setEditandoSeccion(null);
      setAlerta({ tipo: "success", mensaje: "Sección actualizada." });
    } catch (err) {
      setAlerta({ tipo: "error", mensaje: "Error al actualizar sección." });
    }
  };

  // === CRUD ESTACIONES ===
  const crearEstacion = async () => {
    if (!nuevaEstacion.nombre.trim()) return;

    try {
      const { data } = await api.post("/estaciones", nuevaEstacion);
      setEstaciones((prev) => [...prev, data]);

      setNuevaEstacion({
        nombre: "",
        slug: "",
        destino: "cocina",
        esCentral: false,
      });

      setAlerta({
        tipo: "success",
        mensaje: "Estación creada correctamente.",
      });
    } catch (err) {
      setAlerta({ tipo: "error", mensaje: "Error al crear estación." });
    }
  };

  const eliminarEstacion = async (id) => {
    try {
      await api.delete(`/estaciones/${id}`);
      setEstaciones((prev) => prev.filter((s) => s._id !== id));
      setAlerta({ tipo: "success", mensaje: "Estación eliminada." });
    } catch (err) {
      setAlerta({ tipo: "error", mensaje: "Error al eliminar estación." });
    }
  };

  const iniciarEdicionEstacion = (estacion) => {
    setEditandoEstacion({ ...estacion });
  };

  const guardarEdicionEstacion = async () => {
    try {
      const { data } = await api.put(`/estaciones/${editandoEstacion._id}`, editandoEstacion);

      setEstaciones((prev) =>
        prev.map((s) => (s._id === data._id ? data : s))
      );

      setEditandoEstacion(null);
      setAlerta({ tipo: "success", mensaje: "Estación actualizada." });
    } catch (err) {
      setAlerta({ tipo: "error", mensaje: "Error al actualizar estación." });
    }
  };

  // Confirmación de borrado de SECCIÓN
  const pedirConfirmacionBorrarSeccion = (seccion) => {
    setModalConfirmDelete({
      tipo: "seccion",
      id: seccion._id,
      nombre: seccion.nombre,
    });
  };

  // Confirmación de borrado de ESTACIÓN
  const pedirConfirmacionBorrarEstacion = (estacion) => {
    setModalConfirmDelete({
      tipo: "estacion",
      id: estacion._id,
      nombre: estacion.nombre,
    });
  };

  const confirmarBorrado = async () => {
    try {
      if (modalConfirmDelete.tipo === "seccion") {
        await eliminarSeccion(modalConfirmDelete.id);
        setAlerta({ tipo: "success", mensaje: "Sección eliminada." });
      }

      if (modalConfirmDelete.tipo === "estacion") {
        await eliminarEstacion(modalConfirmDelete.id);
        setAlerta({ tipo: "success", mensaje: "Estación eliminada." });
      }
    } catch (err) {
      setAlerta({
        tipo: "error",
        mensaje: "Error al eliminar.",
      });
    } finally {
      setModalConfirmDelete(null);
    }
  };

  // ===========================
  //   RENDER
  // ===========================
  const verifactuBadge =
    verifactuLoaded &&
    (verifactuEnabled ? (
      <span className="badge badge-exito">VeriFactu activo</span>
    ) : (
      <span className="badge badge-aviso">VeriFactu pendiente</span>
    ));

  return (
    <main className="rest-config-page section section--wide">
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}

      {modalConfirmSif && <ModalConfirmacion {...modalConfirmSif} />}

      {/* Header global */}
      <header className="rest-config-header">
        <div>
          <h1>⚙️ Configuración del restaurante</h1>
          <p className="text-suave">
            Define la identidad visual, las funcionalidades y la configuración
            fiscal de tu entorno Alef.
          </p>
        </div>
        <div className="rest-config-header-status">{verifactuBadge}</div>
      </header>

      <div className="rest-config-layout">
        {/* COLUMNA PRINCIPAL */}
        <div className="rest-config-main">
          {/* === BRANDING Y LOGO === */}
          <section className="config-card card config-card--branding">
            <header className="config-card-header">
              <h2>🏪 Identidad del restaurante</h2>
              <p className="config-card-subtitle">
                Nombre comercial y logotipo que se utilizarán en el TPV y en
                la carta digital.
              </p>
            </header>

            <div className="branding-layout">
              <div className="config-field">
                <label>Nombre del restaurante</label>
                <input
                  type="text"
                  value={form.branding.nombreRestaurante || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      branding: {
                        ...prev.branding,
                        nombreRestaurante: e.target.value,
                      },
                    }))
                  }
                />
              </div>

              <div className="branding-uploads">
                {[
                  { tipo: "logo", label: "Logo principal", ref: logoInputRef },
                  // Si más adelante quieres favicon/fondo, se añaden aquí
                ].map(({ tipo, label, ref }) => (
                  <div
                    key={tipo}
                    className={`upload-zone ${dragOver === tipo ? "drag-over" : ""
                      }`}
                    onDrop={(e) => handleDrop(tipo, e)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(tipo);
                    }}
                    onDragLeave={() => setDragOver(null)}
                    onClick={() => ref.current?.click()}
                  >
                    <input
                      ref={ref}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleFileSelect(tipo, e)}
                    />
                    {form.branding[`${tipo}Url`] ? (
                      <img
                        src={form.branding[`${tipo}Url`]}
                        alt={label}
                        className="logo-preview"
                      />
                    ) : (
                      <p className="upload-hint">
                        📁 Arrastra o haz clic para subir{" "}
                        {label.toLowerCase()}.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* === APARIENCIA TPV === */}
          <section className="config-card card config-card--tema">
            <header className="config-card-header">
              <h2>🖥️ Apariencia del TPV</h2>
              <p className="config-card-subtitle">
                Personaliza los colores que verán los trabajadores en el TPV
                (caja, cocina, barra). Estos ajustes no afectan a la carta
                online.
              </p>
            </header>

            <div className="tema-grid">
              {/* Color principal */}
              <div className="tema-item">
                <span className="tema-label">Color principal</span>
                <div className="tema-color-row">
                  <span
                    className="tema-color-preview"
                    style={{
                      backgroundColor:
                        form.temaTpv?.colorPrincipal || "#9B1C1C",
                    }}
                  />
                  <input
                    type="color"
                    value={form.temaTpv?.colorPrincipal || "#9B1C1C"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        temaTpv: {
                          ...prev.temaTpv,
                          colorPrincipal: e.target.value,
                        },
                      }))
                    }
                  />
                  <span className="tema-hex">
                    {form.temaTpv?.colorPrincipal || "#9B1C1C"}
                  </span>
                </div>
                <p className="tema-help">
                  Barra lateral, encabezados y acentos principales.
                </p>
              </div>

              {/* Color secundario */}
              <div className="tema-item">
                <span className="tema-label">Color secundario</span>
                <div className="tema-color-row">
                  <span
                    className="tema-color-preview"
                    style={{
                      backgroundColor:
                        form.temaTpv?.colorSecundario || "#4C5EA8",
                    }}
                  />
                  <input
                    type="color"
                    value={form.temaTpv?.colorSecundario || "#4C5EA8"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        temaTpv: {
                          ...prev.temaTpv,
                          colorSecundario: e.target.value,
                        },
                      }))
                    }
                  />
                  <span className="tema-hex">
                    {form.temaTpv?.colorSecundario || "#4C5EA8"}
                  </span>
                </div>
                <p className="tema-help">
                  Botones secundarios y etiquetas de estado.
                </p>
              </div>

              {/* Fondo */}
              <div className="tema-item">
                <span className="tema-label">Fondo general</span>
                <div className="tema-color-row">
                  <span
                    className="tema-color-preview"
                    style={{
                      backgroundColor: form.temaTpv?.fondo || "#5B1010",
                    }}
                  />
                  <input
                    type="color"
                    value={form.temaTpv?.fondo || "#5B1010"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        temaTpv: {
                          ...prev.temaTpv,
                          fondo: e.target.value,
                        },
                      }))
                    }
                  />
                  <span className="tema-hex">
                    {form.temaTpv?.fondo || "#5B1010"}
                  </span>
                </div>
                <p className="tema-help">Fondo general de la app de TPV.</p>
              </div>

              {/* Texto */}
              <div className="tema-item">
                <span className="tema-label">Color del texto</span>
                <div className="tema-color-row">
                  <span
                    className="tema-color-preview"
                    style={{
                      backgroundColor: form.temaTpv?.texto || "#ffffff",
                    }}
                  />
                  <input
                    type="color"
                    value={form.temaTpv?.texto || "#ffffff"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        temaTpv: {
                          ...prev.temaTpv,
                          texto: e.target.value,
                        },
                      }))
                    }
                  />
                  <span className="tema-hex">
                    {form.temaTpv?.texto || "#ffffff"}
                  </span>
                </div>
                <p className="tema-help">Texto principal del TPV.</p>
              </div>

              {/* Fondo tarjetas */}
              <div className="tema-item">
                <span className="tema-label">Fondo de tarjetas</span>
                <div className="tema-color-row">
                  <span
                    className="tema-color-preview"
                    style={{
                      backgroundColor: form.temaTpv?.cardBg || "#3a3a3a",
                    }}
                  />
                  <input
                    type="color"
                    value={form.temaTpv?.cardBg || "#3a3a3a"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        temaTpv: {
                          ...prev.temaTpv,
                          cardBg: e.target.value,
                        },
                      }))
                    }
                  />
                  <span className="tema-hex">
                    {form.temaTpv?.cardBg || "#3a3a3a"}
                  </span>
                </div>
                <p className="tema-help">
                  Tarjetas de mesas, pedidos y paneles.
                </p>
              </div>

              {/* Borde tarjetas */}
              <div className="tema-item">
                <span className="tema-label">Borde de tarjetas</span>
                <div className="tema-color-row">
                  <span
                    className="tema-color-preview"
                    style={{
                      backgroundColor:
                        form.temaTpv?.cardBorde || "#555555",
                    }}
                  />
                  <input
                    type="color"
                    value={form.temaTpv?.cardBorde || "#555555"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        temaTpv: {
                          ...prev.temaTpv,
                          cardBorde: e.target.value,
                        },
                      }))
                    }
                  />
                  <span className="tema-hex">
                    {form.temaTpv?.cardBorde || "#555555"}
                  </span>
                </div>
              </div>

              {/* Botones */}
              <div className="tema-item">
                <span className="tema-label">Color de botones</span>
                <div className="tema-color-row">
                  <span
                    className="tema-color-preview"
                    style={{
                      backgroundColor: form.temaTpv?.boton || "#4C5EA8",
                    }}
                  />
                  <input
                    type="color"
                    value={form.temaTpv?.boton || "#4C5EA8"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        temaTpv: {
                          ...prev.temaTpv,
                          boton: e.target.value,
                        },
                      }))
                    }
                  />
                  <span className="tema-hex">
                    {form.temaTpv?.boton || "#4C5EA8"}
                  </span>
                </div>
              </div>

              {/* Hover botones */}
              <div className="tema-item">
                <span className="tema-label">Hover de botones</span>
                <div className="tema-color-row">
                  <span
                    className="tema-color-preview"
                    style={{
                      backgroundColor:
                        form.temaTpv?.botonHover || "#3C4C8A",
                    }}
                  />
                  <input
                    type="color"
                    value={form.temaTpv?.botonHover || "#3C4C8A"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        temaTpv: {
                          ...prev.temaTpv,
                          botonHover: e.target.value,
                        },
                      }))
                    }
                  />
                  <span className="tema-hex">
                    {form.temaTpv?.botonHover || "#3C4C8A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Vista previa rápida del TPV */}
            <div
              className="tpv-preview"
              style={{
                backgroundColor: form.temaTpv?.fondo || "#5B1010",
              }}
            >
              <aside
                className="tpv-preview-sidebar"
                style={{
                  backgroundColor:
                    form.temaTpv?.colorPrincipal || "#9B1C1C",
                }}
              >
                TPV
              </aside>

              <div className="tpv-preview-main">
                <div
                  className="tpv-preview-card"
                  style={{
                    backgroundColor: form.temaTpv?.cardBg || "#3a3a3a",
                    borderColor:
                      form.temaTpv?.cardBorde || "#555555",
                    color: form.temaTpv?.texto || "#ffffff",
                  }}
                >
                  <div className="tpv-preview-card-title">Mesa 3</div>
                  <div className="tpv-preview-card-body">
                    <span>12,00 €</span>
                    <button
                      className="tpv-preview-btn"
                      style={{
                        backgroundColor:
                          form.temaTpv?.boton || "#4C5EA8",
                      }}
                    >
                      Cobrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* === FUNCIONALIDADES DEL PLAN === */}
          <section className="config-card card">
            <header className="config-card-header">
              <h2>🧩 Funcionalidades del plan</h2>
              <p className="config-card-subtitle">
                Activa o desactiva las opciones disponibles según el plan
                contratado.
              </p>
            </header>

            {loadingFeatures && <p>Cargando funcionalidades...</p>}

            {!loadingFeatures && features.length === 0 && (
              <p>Este plan no incluye funcionalidades configurables.</p>
            )}

            {!loadingFeatures && features.length > 0 && (
              <div className="feature-grid">
                {features.map((f) => (
                  <label key={f._id} className="feature-item">
                    {f.configKey ? (
                      <>
                        <input
                          type="checkbox"
                          checked={Boolean(
                            getConfigValue(config, f.configKey)
                          )}
                          onChange={(e) =>
                            handleFeatureUpdate(
                              f.configKey,
                              e.target.checked
                            )
                          }
                        />
                        <span>{f.nombre}</span>
                      </>
                    ) : (
                      <>
                        <span className="feature-check">✔</span>
                        <span>{f.nombre}</span>
                      </>
                    )}
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* === SECCIONES === */}
          <section className="config-card card">
            <header className="config-card-header">
              <h2>📦 Secciones de la carta</h2>
              <p className="config-card-subtitle">
                Agrupa tus productos en secciones (entrantes, postres, bebidas,
                etc.) y define a qué zona llegan sus pedidos.
              </p>
            </header>

            <div className="config-field config-field--stacked">
              <label>Nueva sección</label>

              <input
                type="text"
                placeholder="Nombre (Ej: Entrantes)"
                value={nuevaSeccion.nombre}
                onChange={(e) =>
                  setNuevaSeccion({
                    ...nuevaSeccion,
                    nombre: e.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="Slug (ej: entrantes)"
                value={nuevaSeccion.slug}
                onChange={(e) =>
                  setNuevaSeccion({
                    ...nuevaSeccion,
                    slug: e.target.value,
                  })
                }
              />

              <select
                value={nuevaSeccion.destino}
                onChange={(e) =>
                  setNuevaSeccion({
                    ...nuevaSeccion,
                    destino: e.target.value,
                  })
                }
              >
                <option value="cocina">Cocina</option>
                <option value="barra">Barra</option>
              </select>

              <button
                type="button"
                className="btn btn-primario"
                onClick={crearSeccion}
              >
                Crear sección
              </button>
            </div>

            <ul className="lista-simple">
              {loadingSecciones && <li>Cargando secciones...</li>}
              {!loadingSecciones && secciones.length === 0 && (
                <li>No hay secciones creadas todavía.</li>
              )}
              {secciones.map((s) => (
                <li key={s._id}>
                  <span>
                    {s.nombre} ({s.slug})
                  </span>

                  <div className="acciones-mini">
                    <button type="button" onClick={() => iniciarEdicionSeccion(s)}>✏️</button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => pedirConfirmacionBorrarSeccion(s)}
                    >
                      ❌
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* === ESTACIONES === */}
          <section className="config-card card">
            <header className="config-card-header">
              <h2>🔥 Estaciones de cocina / barra</h2>
              <p className="config-card-subtitle">
                Define las estaciones donde se preparan los productos
                (plancha, frío, barra, etc.) y marca cuál es la estación
                central.
              </p>
            </header>

            <div className="config-field config-field--stacked">
              <label>Nueva estación</label>

              <input
                type="text"
                placeholder="Nombre (Ej: Plancha)"
                value={nuevaEstacion.nombre}
                onChange={(e) =>
                  setNuevaEstacion({
                    ...nuevaEstacion,
                    nombre: e.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="Slug (plancha)"
                value={nuevaEstacion.slug}
                onChange={(e) =>
                  setNuevaEstacion({
                    ...nuevaEstacion,
                    slug: e.target.value,
                  })
                }
              />

              <select
                value={nuevaEstacion.destino}
                onChange={(e) =>
                  setNuevaEstacion({
                    ...nuevaEstacion,
                    destino: e.target.value,
                  })
                }
              >
                <option value="cocina">Cocina</option>
                <option value="barra">Barra</option>
              </select>

              <label className="check-central">
                <input
                  type="checkbox"
                  checked={nuevaEstacion.esCentral}
                  onChange={(e) =>
                    setNuevaEstacion({
                      ...nuevaEstacion,
                      esCentral: e.target.checked,
                    })
                  }
                />
                Estación central
              </label>

              <button
                type="button"
                className="btn btn-primario"
                onClick={crearEstacion}
              >
                Crear estación
              </button>
            </div>

            <ul className="lista-simple">
              {loadingEstaciones && <li>Cargando estaciones...</li>}
              {!loadingEstaciones && estaciones.length === 0 && (
                <li>No hay estaciones creadas todavía.</li>
              )}
              {estaciones.map((e) => (
                <li key={e._id}>
                  <span>
                    {e.nombre} ({e.slug}) — {e.destino} {e.esCentral ? "⭐ Central" : ""}
                  </span>

                  <div className="acciones-mini">
                    <button type="button" onClick={() => iniciarEdicionEstacion(e)}>✏️</button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => pedirConfirmacionBorrarEstacion(e)}
                    >
                      ❌
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* === ESTILO GENERAL === */}
          <section className="config-card card">
            <header className="config-card-header">
              <h2>🎨 Estilo general</h2>
              <p className="config-card-subtitle">
                Ajustes de fuente y tema del backoffice (no afectan a TPV ni a la
                carta de los clientes).
              </p>
            </header>

            <div className="config-field">
              <label>Fuente principal</label>
              <input
                type="text"
                value={form.estilo.fuente || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    estilo: { ...prev.estilo, fuente: e.target.value },
                  }))
                }
              />
            </div>

            <div className="config-field">
              <label>Tema</label>
              <select
                value={form.estilo.tema || "claro"}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    estilo: { ...prev.estilo, tema: e.target.value },
                  }))
                }
              >
                <option value="claro">Claro</option>
                <option value="oscuro">Oscuro</option>
                <option value="auto">Automático</option>
              </select>
            </div>
          </section>
        </div>
      </div>

      {/* BARRA DE ACCIONES INFERIOR */}
      <div className="rest-config-actions">
        <button
          type="button"
          className="btn btn-primario"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Guardando..." : "Guardar configuración general"}
        </button>
      </div>

      {editandoSeccion && (
        <ModalConfirmacion
          titulo="Editar sección"
          mensaje=""
          placeholder=""
          onClose={() => setEditandoSeccion(null)}
          onConfirm={guardarEdicionSeccion}
        >
          <div className="modal-form">
            <input
              type="text"
              value={editandoSeccion.nombre}
              onChange={(e) =>
                setEditandoSeccion((prev) => ({ ...prev, nombre: e.target.value }))
              }
            />
            <input
              type="text"
              value={editandoSeccion.slug}
              onChange={(e) =>
                setEditandoSeccion((prev) => ({ ...prev, slug: e.target.value }))
              }
            />
            <select
              value={editandoSeccion.destino}
              onChange={(e) =>
                setEditandoSeccion((prev) => ({ ...prev, destino: e.target.value }))
              }
            >
              <option value="cocina">Cocina</option>
              <option value="barra">Barra</option>
            </select>
          </div>
        </ModalConfirmacion>
      )}

      {editandoEstacion && (
        <ModalConfirmacion
          titulo="Editar estación"
          mensaje=""
          placeholder=""
          onClose={() => setEditandoEstacion(null)}
          onConfirm={guardarEdicionEstacion}
        >
          <div className="modal-form">
            <input
              type="text"
              value={editandoEstacion.nombre}
              onChange={(e) =>
                setEditandoEstacion((prev) => ({ ...prev, nombre: e.target.value }))
              }
            />

            <input
              type="text"
              value={editandoEstacion.slug}
              onChange={(e) =>
                setEditandoEstacion((prev) => ({ ...prev, slug: e.target.value }))
              }
            />

            <select
              value={editandoEstacion.destino}
              onChange={(e) =>
                setEditandoEstacion((prev) => ({ ...prev, destino: e.target.value }))
              }
            >
              <option value="cocina">Cocina</option>
              <option value="barra">Barra</option>
            </select>

            <label className="check-central">
              <input
                type="checkbox"
                checked={editandoEstacion.esCentral}
                onChange={(e) =>
                  setEditandoEstacion((prev) => ({
                    ...prev,
                    esCentral: e.target.checked,
                  }))
                }
              />
              Estación central
            </label>
          </div>
        </ModalConfirmacion>
      )}

      {modalConfirmDelete && (
        <ModalConfirmacion
          titulo={`Eliminar ${modalConfirmDelete.tipo === "seccion" ? "sección" : "estación"}`}
          mensaje={`¿Seguro que deseas eliminar "${modalConfirmDelete.nombre}"? Esta acción NO se puede deshacer.`}
          onConfirm={confirmarBorrado}
          onClose={() => setModalConfirmDelete(null)}
        />
      )}

    </main>
  );
}
