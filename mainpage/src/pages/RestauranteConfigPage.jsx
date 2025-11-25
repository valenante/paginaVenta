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

  const [form, setForm] = useState({ branding: {}, colores: {}, estilo: {} });
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loadingFeatures, setLoadingFeatures] = useState(true);

  // === Estado modales y alertas ===
  const [modalConfirm, setModalConfirm] = useState(null);
  const [alerta, setAlerta] = useState(null);

  const [verifactuEnabled, setVerifactuEnabled] = useState(false);
  const [verifactuLoaded, setVerifactuLoaded] = useState(false);

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

  // RestauranteConfigPage.jsx
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const { data } = await api.get("/admin/features-plan");
        // data = { plan, features, config }
        setFeatures(data.features || []);
        setConfig(data.config);
      } catch (err) {
        setAlerta({ tipo: "error", mensaje: "Error al cargar funcionalidades del plan." });
      } finally {
        setLoadingFeatures(false);
      }
    };

    fetchFeatures();
  }, [setConfig]);

  // === Cargar configuración general en el formulario ===
  useEffect(() => {
    if (config) {
      setForm({
        branding: config.branding || {},
        colores: config.colores || {},
        estilo: config.estilo || {},
      });
    }
  }, [config]);

  // 👇 helper para leer rutas tipo "impresion.imprimirPedidosCocina"
  const getConfigValue = (cfg, path) => {
    if (!cfg || !path) return undefined;
    return path.split(".").reduce((acc, part) => {
      if (acc == null) return undefined;
      return acc[part];
    }, cfg);
  };

  // 🔥 NUEVO: actualizar flags de config cuando tocas una feature
  const handleFeatureUpdate = async (configKey, value) => {
    try {
      const { data } = await api.put("/admin/features-plan/update", {
        key: configKey,
        value,
      });

      // el backend devuelve la config ya actualizada
      setConfig(data);

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

  // 🔥 NUEVO: comprobar si VeriFactu está activo
  useEffect(() => {
    const checkVerifactu = async () => {
      try {
        const { data } = await api.get("/admin/verifactu/verifactu");
        setVerifactuEnabled(!!data.enabled);
      } catch (err) {
        // si da 401/403/404, simplemente no mostramos nada especial
        console.error("[RestauranteConfig] Error obteniendo estado VeriFactu:", err.message);
      } finally {
        setVerifactuLoaded(true);
      }
    };
    checkVerifactu();
  }, []);

  // 🔔 Si venimos redirigidos desde el guard, mostramos también alerta normal
  useEffect(() => {
    if (location.state?.fromVerifactuGuard) {
      setAlerta({
        tipo: "warning",
        mensaje:
          "Debes completar la configuración fiscal (SIF) y activar VeriFactu antes de poder utilizar el TPV.",
      });
    }
  }, [location.state]);

  // === Cargar configuración SIF ===
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
        setAlerta({ tipo: "error", mensaje: "Error al obtener configuración SIF." });
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
      setAlerta({ tipo: "success", mensaje: "Imagen subida correctamente ✅" });
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
      });
      setConfig(data);
      setAlerta({ tipo: "success", mensaje: "Configuración guardada correctamente ✅" });
    } catch {
      setAlerta({ tipo: "error", mensaje: "Error al guardar configuración." });
    } finally {
      setSaving(false);
    }
  };

  /** === Guardar configuración SIF === */
  const handleSaveSif = async () => {
    setModalConfirm({
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
          setSifMensaje(data.message || "Configuración SIF guardada correctamente ✅");
          setAlerta({ tipo: "success", mensaje: "Configuración SIF actualizada ✅" });
        } catch {
          setAlerta({ tipo: "error", mensaje: "Error al guardar configuración SIF." });
        } finally {
          setSifLoading(false);
          setModalConfirm(null);
        }
      },
      onClose: () => setModalConfirm(null),
    });
  };

  return (
    <div className="config-page">
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}

      {modalConfirm && <ModalConfirmacion {...modalConfirm} />}

      <div className="config-card">
        <h2>⚙️ Configuración general del restaurante</h2>

        {/* Nombre */}
        <div className="config-field">
          <label>Nombre del restaurante</label>
          <input
            type="text"
            value={form.branding.nombreRestaurante || ""}
            onChange={(e) =>
              setForm({
                ...form,
                branding: { ...form.branding, nombreRestaurante: e.target.value },
              })
            }
          />
        </div>

        {/* LOGO / FAVICON / FONDO */}
        {[
          { tipo: "logo", label: "Logo principal", ref: logoInputRef },
          { tipo: "favicon", label: "Favicon", ref: faviconInputRef },
          { tipo: "fondo", label: "Fondo del login", ref: fondoInputRef },
        ].map(({ tipo, label, ref }) => (
          <div
            key={tipo}
            className={`upload-zone ${dragOver === tipo ? "drag-over" : ""}`}
            onDrop={(e) => handleDrop(tipo, e)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(tipo);
            }}
            onDragLeave={() => setDragOver(null)}
            onClick={() => ref.current.click()}
          >
            <input
              ref={ref}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFileSelect(tipo, e)}
            />
            {form.branding[`${tipo}Url`] ? (
              <img src={form.branding[`${tipo}Url`]} alt={label} className="logo-preview" />
            ) : (
              <p>📁 Arrastra o haz clic para subir {label.toLowerCase()}</p>
            )}
          </div>
        ))}

        {/* COLORES */}
        <section>
          <h3>🎨 Paleta de colores</h3>
          <div className="color-grid">
            {Object.entries(form.colores || {}).map(([key, value]) => (
              <div key={key} className="color-item">
                <label>{key}</label>
                <input
                  type="color"
                  value={value}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      colores: { ...form.colores, [key]: e.target.value },
                    })
                  }
                />
                <span className="color-preview">{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3>🧩 Funcionalidades del plan</h3>

          {loadingFeatures && <p>Cargando funcionalidades...</p>}

          {!loadingFeatures && features.length === 0 && (
            <p>Este plan no incluye funcionalidades configurables.</p>
          )}

          <div className="feature-grid">
            {features.map((f) => (
              <label key={f._id} className="feature-item">
                {f.configKey ? (
                  <>
                    <input
                      type="checkbox"
                      checked={Boolean(getConfigValue(config, f.configKey))}
                      onChange={(e) => handleFeatureUpdate(f.configKey, e.target.checked)}
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
        </section>

        {/* ESTILO */}
        <section>
          <h3>🧩 Estilo general</h3>
          <div className="config-field">
            <label>Fuente principal</label>
            <input
              type="text"
              value={form.estilo.fuente || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  estilo: { ...form.estilo, fuente: e.target.value },
                })
              }
            />
          </div>

          <div className="config-field">
            <label>Tema</label>
            <select
              value={form.estilo.tema || "claro"}
              onChange={(e) =>
                setForm({
                  ...form,
                  estilo: { ...form.estilo, tema: e.target.value },
                })
              }
            >
              <option value="claro">Claro</option>
              <option value="oscuro">Oscuro</option>
              <option value="auto">Automático</option>
            </select>
          </div>
        </section>

        {/* CONFIGURACIÓN SIF */}
        <section id="sif-section">
          <h3>🧾 Configuración SIF / VeriFactu</h3>
          <p className="sif-subtexto">
            Completa los datos fiscales del restaurante antes de activar VeriFactu.
          </p>
          {Object.entries(sifForm).map(([key, value]) => (
            <div key={key} className="config-field">
              <label>{key.toUpperCase()}</label>
              <input
                type="text"
                name={key}
                value={value}
                onChange={(e) =>
                  setSifForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
            </div>
          ))}

          <button onClick={handleSaveSif} disabled={sifLoading}>
            {sifLoading ? "Guardando..." : "Guardar configuración SIF"}
          </button>
          {sifMensaje && <p className="sif-mensaje">{sifMensaje}</p>}
        </section>

        <hr />

        <button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar configuración general"}
        </button>
      </div>
    </div>
  );
}
