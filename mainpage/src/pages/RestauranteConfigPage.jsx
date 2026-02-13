import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useConfig } from "../context/ConfigContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api";
import "../styles/RestauranteConfigPage.css";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import EstacionesPanel from "../components/Config/EstacionesPanel.jsx";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import { useTenant } from "../context/TenantContext";
import PlanFeaturesPanel from "../components/Config/PlanFeaturesPanel.jsx";
import SeccionesPanel from "../components/Config/SeccionesPanel.jsx";
import IdentidadNegocioPanel from "../components/Config/IdentidadNegocioPanel.jsx";
import OperativaSlaCapacidadPanel from "../components/Config/OperativaSlaCapacidadPanel.jsx";
import { DEFAULT_TEMA_TPV, normalizarTemaTpv } from "../utils/tema";
import { DEFAULT_TEMA_SHOP, normalizarTemaShop } from "../utils/temaShop";
import TemaTpvPanel from "../components/Tema/TemaTpvPanel.jsx";
import TemaShopPanel from "../components/Tema/TemaShopPanel.jsx";

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
    informacionRestaurante: {
      direccion: "",
      telefono: "",
    },
    colores: {},
    estilo: {},
    temaTpv: { ...DEFAULT_TEMA_TPV },
    temaShop: { ...DEFAULT_TEMA_SHOP },
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

  const [alerta, setAlerta] = useState(null);

  const [verifactuEnabled, setVerifactuEnabled] = useState(false);
  const [verifactuLoaded, setVerifactuLoaded] = useState(false);

  // Cargar config en el formulario
  useEffect(() => {
    if (!config) return;

    setForm((prev) => ({
      ...prev,
      branding: config.branding || {},
      informacionRestaurante: config.informacionRestaurante || {},
      colores: config.colores || {},
      estilo: config.estilo || {},
      temaTpv: normalizarTemaTpv(config.temaTpv),
      temaShop: normalizarTemaShop(config.temaShop),
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

  const configEndpoint = esTienda
    ? "/shop/configuracion"
    : "/configuracion";

  /** === Guardar configuración general === */
  const handleSave = async () => {
    try {
      setSaving(true);
      const { data } = await api.put(configEndpoint, {
        branding: form.branding,
        informacionRestaurante: form.informacionRestaurante,
        colores: form.colores,
        estilo: form.estilo,
        temaTpv: form.temaTpv,
        temaShop: form.temaShop,
        slaMesas: form.slaMesas,
        capacidadEstaciones: form.capacidadEstaciones,
      });
      setConfig(data.config);
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


  /** === Subida de imÃ¡genes === */
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

          <IdentidadNegocioPanel
            form={form}
            setForm={setForm}
            esTienda={esTienda}
            onUploadLogo={handleFileUpload}
          />

          {/* === APARIENCIA === */}
          {esRestaurante && (
            <TemaTpvPanel
              temaTpv={form.temaTpv}
              setTemaTpv={(updater) =>
                setForm((prev) => ({
                  ...prev,
                  temaTpv:
                    typeof updater === "function"
                      ? updater(prev.temaTpv)
                      : updater,
                }))
              }
            />
          )}

          {esTienda && (
            <TemaShopPanel
              temaShop={form.temaShop}
              setTemaShop={(updater) =>
                setForm((prev) => ({
                  ...prev,
                  temaShop:
                    typeof updater === "function"
                      ? updater(prev.temaShop)
                      : updater,
                }))
              }
            />
          )}

          {/* === ESTILO GENERAL === */}
          {/* <section className="config-card card">
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
                </section> */}

          <PlanFeaturesPanel onAlert={setAlerta} />

          {esRestaurante && (
            <SeccionesPanel
              isPlanEsencial={isPlanEsencial}
              onAlert={setAlerta}
            />
          )}

          {esRestaurante && (
            <EstacionesPanel
              isPlanEsencial={isPlanEsencial}
              onAlert={setAlerta}
            />
          )}

          {/* === CAPACIDAD Y SLA DE MESAS === 
          
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
          
          */}
        </div>
      </div>

      {/* BARRA DE ACCIONES INFERIOR */}
      <div className="rest-config-actions">
        <button
          type="button"
          className="btn btn-primario "
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Guardando..." : "Guardar configuración general"}
        </button>
      </div>
    </main>
  );
}
