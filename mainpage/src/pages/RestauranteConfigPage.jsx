import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useConfig } from "../context/ConfigContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api";
import "../styles/RestauranteConfigPage.css";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import EstacionesCapacidadPanel from "../components/Config/EstacionesCapacidadPanel.jsx";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import { useTenant } from "../context/TenantContext";
import PlanFeaturesPanel from "../components/Config/PlanFeaturesPanel.jsx";
import OperativaSlaCapacidadPanel from "../components/Config/OperativaSlaCapacidadPanel.jsx";
import { DEFAULT_TEMA_TPV, normalizarTemaTpv } from "../utils/tema";
import TemaTpvPanel from "../components/Tema/TemaTpvPanel.jsx";

export default function RestauranteConfigPage() {
  const { config, setConfig } = useConfig();
  const { user } = useAuth();
  const location = useLocation();
  const { tenant } = useTenant();
  const tipoNegocio = tenant?.tipoNegocio || "restaurante";

  const esRestaurante = tipoNegocio === "restaurante";
  const esTienda = tipoNegocio === "shop";
  const isPlanEsencial =
    user?.plan === "esencial" || user?.plan === "tpv-esencial";
  const [form, setForm] = useState({
    branding: {},
    colores: {},
    estilo: {},
    temaTpv: { ...DEFAULT_TEMA_TPV },
    slaMesas: {
      activo: true,
      porcentajeAvisoRiesgo: 80,
      cooldownAvisoMinutos: 0,
      tramosOcupacion: [
        { desde: 0, hasta: 25, minutosMaxSinServicio: 8 },
        { desde: 26, hasta: 50, minutosMaxSinServicio: 11 },
        { desde: 51, hasta: 75, minutosMaxSinServicio: 14 },
        { desde: 76, hasta: 100, minutosMaxSinServicio: 18 },
      ],
    },

    // ✅ NUEVO
    capacidadEstaciones: {
      intervaloRevisionSegundos: 10,
      pesosSeccion: { 0: 1.0, 1: 0.6, 2: 0.3 },
      pesoDefault: 0.15,
    },
  });

  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(null);

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

  useEffect(() => {
    if (!esRestaurante) {
      // Para tiendas no existen secciones ni estaciones
      setLoadingSecciones(false);
      setLoadingEstaciones(false);
      return;
    }

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
  }, [esRestaurante]);

  // Cargar config en el formulario
  useEffect(() => {
    if (!config) return;

    setForm((prev) => ({
      ...prev,
      branding: config.branding || {},
      colores: config.colores || {},
      estilo: config.estilo || {},
      temaTpv: normalizarTemaTpv(config.temaTpv),
      slaMesas: config.slaMesas || prev.slaMesas,
      capacidadEstaciones: config.capacidadEstaciones || prev.capacidadEstaciones,
    }));
  }, [config]);

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

  /** === Subida de imágenes === */
  const handleFileUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    const uploadEndpoint = esTienda
      ? "/shop/configuracion/logo"
      : "/configuracion/logo";

    const { data } = await api.post(uploadEndpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setForm((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        logoUrl: data.logoUrl,
      },
    }));

    setConfig(data.config);
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

  const configEndpoint = esTienda
    ? "/shop/configuracion"
    : "/configuracion";

  /** === Guardar configuración general === */
  const handleSave = async () => {
    try {
      setSaving(true);
      const { data } = await api.put(configEndpoint, {
        branding: form.branding,
        colores: form.colores,
        estilo: form.estilo,
        temaTpv: form.temaTpv,
        slaMesas: form.slaMesas,
        capacidadEstaciones: form.capacidadEstaciones,
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
          <h1>
            ⚙️ Configuración {esTienda ? "de la shop" : "del restaurante"}
          </h1>
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
              <h2>
                🏪 Identidad {esTienda ? "de la shop" : "del restaurante"}
              </h2>
              <p className="config-card-subtitle">
                Nombre comercial y logotipo que se utilizarán en el TPV y en
                la carta digital.
              </p>
            </header>

            <div className="branding-layout">
              <div className="config-field">
                <label>
                  Nombre {esTienda ? "de la shop" : "del restaurante"}
                </label>
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
          <TemaTpvPanel
            temaTpv={form.temaTpv}
            setTemaTpv={(updater) =>
              setForm((prev) => ({
                ...prev,
                temaTpv: typeof updater === "function" ? updater(prev.temaTpv) : updater,
              }))
            }
          />

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

          <PlanFeaturesPanel onAlert={setAlerta} />

          {/* === SECCIONES === */}
          {esRestaurante && (
            <section className="config-card card">
              <header className="config-card-header">
                <h2>
                  {isPlanEsencial ? "📦 Secciones del pedido" : "📦 Secciones de la carta"}
                </h2>

                <p className="config-card-subtitle">
                  {isPlanEsencial
                    ? "Define cómo se agruparán los productos en el ticket (entrantes, principales, postres, bebidas, etc.) para que la impresión salga organizada por bloques claros y fáciles de leer para sala y cocina."
                    : "Agrupa tus productos en secciones (entrantes, postres, bebidas, etc.) y define a qué zona llegan sus pedidos dentro de la carta digital."}
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
                      <button type="button" onClick={() => iniciarEdicionSeccion(s)}>
                        ✏️
                      </button>
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
          )}

          {esRestaurante && !isPlanEsencial && (
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
                      {e.nombre} ({e.slug}) — {e.destino}{" "}
                      {e.esCentral ? "⭐ Central" : ""}
                    </span>

                    <div className="acciones-mini">
                      <button
                        type="button"
                        onClick={() => iniciarEdicionEstacion(e)}
                      >
                        ✏️
                      </button>
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
          )}

          {esRestaurante && !isPlanEsencial && (
            <OperativaSlaCapacidadPanel
              form={form}
              setForm={setForm}
              onAlert={setAlerta}
            />
          )}

          {esRestaurante && !isPlanEsencial && (
            <EstacionesCapacidadPanel
              estaciones={estaciones}
              setEstaciones={setEstaciones}
              onAlert={setAlerta}
            />
          )}
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

      {editandoEstacion && !isPlanEsencial && (
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

      {modalConfirmDelete &&
        (modalConfirmDelete.tipo === "seccion" || !isPlanEsencial) && (
          <ModalConfirmacion
            titulo={`Eliminar ${modalConfirmDelete.tipo === "seccion" ? "sección" : "estación"
              }`}
            mensaje={`¿Seguro que deseas eliminar "${modalConfirmDelete.nombre}"? Esta acción NO se puede deshacer.`}
            onConfirm={confirmarBorrado}
            onClose={() => setModalConfirmDelete(null)}
          />
        )}

    </main>
  );
}
