// src/components/Paso3ServiciosExtras.jsx
import React from "react";
import "./Paso3ServiciosExtras.css";

export default function Paso3ServiciosExtras({
  servicios,
  setServicios,
  isShop = false,
}) {
  /* =====================
     Handlers
  ===================== */

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;

    setServicios((prev) => {
      // ✅ checkbox
      if (type === "checkbox") {
        return { ...prev, [name]: checked };
      }

      // ✅ number
      if (type === "number") {
        return { ...prev, [name]: value === "" ? "" : Number(value) };
      }

      // ✅ radio/select/text
      return { ...prev, [name]: value };
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;

    setServicios((prev) => ({
      ...prev,
      [name]: Array.from(files || []),
    }));
  };

  const handleTpvOptionChange = (e) => {
    const opcion = e.target.value; // "propio" | "nuevo"

    setServicios((prev) => ({
      ...prev,
      tpvOpcion: opcion,
      // Si usa su TPV, la instalación aplica (precio desde X)
      instalacionTpvPropio: opcion === "propio",
      // Si compra TPV nuevo, lo marcamos (1 unidad por defecto)
      tpvNuevo: opcion === "nuevo" ? 1 : 0,
    }));
  };

  const precioPantalla =
    servicios?.pantallaTipo === "pro" ? 450 : 180; // 👈 AJUSTA SI QUIERES

  return (
    <section className="paso3-servicios section section--wide">
      <header className="paso3-header">
        <div>
          <h2>🧾 Servicios y equipamiento</h2>
          <p>
            {isShop
              ? "Selecciona servicios opcionales y el hardware típico para tu tienda."
              : "Personaliza tu plan mensual y selecciona el equipamiento que necesitas para arrancar con Alef desde el primer día."}
          </p>
        </div>

        <div className="paso3-badge">
          <span className="badge badge-aviso">
            Opcional — puedes contratarlo más adelante
          </span>
        </div>
      </header>

      {/* === Servicios de puesta en marcha === */}
      <div className="servicios-grupo card">
        <h3>🚀 Puesta en marcha avanzada</h3>
        <p className="servicios-help">
          {isShop
            ? "Si quieres, nos mandas tu catálogo y dejamos tu tienda lista para vender."
            : "Si quieres olvidarte de la parte pesada, nos mandas la información y dejamos Alef listo para trabajar."}
        </p>

        {/* Carga completa de carta/productos (en shop: catálogo) */}
        <label className="servicio-item servicio-item--checkbox">
          <input
            type="checkbox"
            name="cargaProductos"
            checked={!!servicios.cargaProductos}
            onChange={handleChange}
          />

          <div className="servicio-content">
            <div className="servicio-header-row">
              <span className="servicio-title">
                {isShop
                  ? "Carga completa de catálogo y productos"
                  : "Carga completa de carta y productos"}
              </span>
              <span className="servicio-price badge badge-aviso">+80 € único</span>
            </div>
            <p className="servicio-description">
              {isShop
                ? "Nos envías tu catálogo (Excel/CSV/PDF…) y cargamos productos, categorías y precios para que puedas empezar a vender desde el día uno."
                : "Nos envías tu carta (PDF, fotos, Excel…) y nosotros damos de alta todos los productos, categorías y precios dentro de Alef para que puedas empezar a usarlo desde el día uno."}
            </p>

            {servicios.cargaProductos && (
              <div className="servicio-upload">
                <label className="servicio-upload-label">
                  {isShop
                    ? "Adjunta tu catálogo (Excel, CSV, PDF o imágenes)"
                    : "Adjunta tu carta (PDF, imagen o archivo)"}
                  <input
                    type="file"
                    name="cartaAdjuntos"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
                  />
                </label>
                <small className="servicio-helper">
                  Usaremos estos archivos como base. Si prefieres, también podrás
                  enviarlos luego por email o WhatsApp.
                </small>
              </div>
            )}
          </div>
        </label>

        {/* En restaurante: mesas + QR */}
        {!isShop && (
          <label className="servicio-item servicio-item--checkbox">
            <input
              type="checkbox"
              name="mesasQr"
              checked={!!servicios.mesasQr}
              onChange={handleChange}
            />

            <div className="servicio-content">
              <div className="servicio-header-row">
                <span className="servicio-title">
                  Configuración de mesas + QR impresos
                </span>
                <span className="servicio-price badge badge-aviso">
                  desde 80 € único
                </span>
              </div>
              <p className="servicio-description">
                Nos envías el plano o listado de mesas y configuramos toda la
                estructura en Alef. Te mandamos los QR con número de mesa,
                plastificados y listos para colocar.
              </p>

              {servicios.mesasQr && (
                <>
                  <div className="servicio-item servicio-item--number servicio-item--inline">
                    <div className="servicio-number-text">
                      <label>Número aproximado de mesas</label>
                      <small className="servicio-helper">
                        Solo para estimar el pack de QRs plastificados.
                      </small>
                    </div>
                    <input
                      className="servicio-number-input"
                      type="number"
                      name="mesasQrCantidad"
                      min="1"
                      max="150"
                      value={servicios.mesasQrCantidad ?? ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="servicio-upload">
                    <label className="servicio-upload-label">
                      Adjunta plano, fotos o listado de mesas
                      <input
                        type="file"
                        name="mesasAdjuntos"
                        multiple
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </label>
                    <small className="servicio-helper">
                      Puedes subir un plano, fotos de la sala o un documento con
                      los números de mesa. Si lo prefieres, también podrás
                      enviarlo después por email/WhatsApp.
                    </small>
                  </div>
                </>
              )}
            </div>
          </label>
        )}
      </div>

      {/* === Equipamiento físico === */}
      <div className="servicios-grupo card">
        <h3>🖨️ Equipamiento de hardware</h3>
        <p className="servicios-help">
          {isShop
            ? "Indícanos el hardware típico de tienda que quieres incluir."
            : "Indícanos el hardware que quieres que incluyamos en la instalación estándar. Te llegará listo para usar."}
        </p>

        {/* ✅ NUEVO: TPV principal */}
        <div className="servicio-item servicio-item--radio">
          <div className="servicio-number-text">
            <label>Terminal principal (TPV / PC)</label>
            <small className="servicio-helper">
              Es el equipo principal (caja/administración) desde el que se gestiona Alef.
            </small>
          </div>

          <div className="servicio-content">
            <label className="servicio-item servicio-item--checkbox" style={{ marginTop: 8 }}>
              <input
                type="radio"
                name="tpvOpcion"
                value="propio"
                checked={(servicios.tpvOpcion ?? "propio") === "propio"}
                onChange={handleTpvOptionChange}
              />
              <div className="servicio-content">
                <div className="servicio-header-row">
                  <span className="servicio-title">Usar mi TPV/PC</span>
                  <span className="servicio-price badge badge-aviso">
                    Instalación: desde 120 € único
                  </span>
                </div>
                <p className="servicio-description">
                  Aprovechas tu equipo actual y reduces el coste inicial. Nosotros lo dejamos configurado
                  (Softalef + impresoras + red) y listo para trabajar.
                </p>
                <small className="servicio-helper">
                  *El precio puede variar si se requiere visita presencial o el equipo necesita puesta a punto extra.
                </small>
              </div>
            </label>

            <label className="servicio-item servicio-item--checkbox" style={{ marginTop: 8 }}>
              <input
                type="radio"
                name="tpvOpcion"
                value="nuevo"
                checked={servicios.tpvOpcion === "nuevo"}
                onChange={handleTpvOptionChange}
              />
              <div className="servicio-content">
                <div className="servicio-header-row">
                  <span className="servicio-title">Quiero un TPV nuevo (recomendado si no tienes)</span>
                  <span className="servicio-price badge badge-aviso">+550 € aprox.</span>
                </div>
                <p className="servicio-description">
                  Te llega ya instalado y preparado: lo conectas, lo enciendes y con Internet ya puedes entrar a Softalef.
                </p>
                <small className="servicio-helper">
                  Incluye configuración inicial (software + drivers + base lista). Solo conectar y listo.
                </small>
              </div>
            </label>
          </div>
        </div>

        {/* Impresoras */}
        <div className="servicio-item servicio-item--number">
          <div className="servicio-number-text">
            <label>Impresoras térmicas</label>
            <small className="servicio-helper">150 € por unidad</small>
          </div>
          <input
            className="servicio-number-input"
            type="number"
            name="impresoras"
            min="0"
            max="10"
            value={servicios.impresoras ?? 0}
            onChange={handleChange}
          />
        </div>

        {/* ✅ NUEVO: Tipo de pantalla (tablet vs pro) */}
        <div className="servicio-item servicio-item--radio" style={{ marginTop: 10 }}>
          <div className="servicio-number-text">
            <label>{isShop ? "Pantalla TPV" : "Pantalla cocina/barra"}</label>
            <small className="servicio-helper">
              Elige el formato: tablet (rápida y barata) o pantalla pro (más robusta).
            </small>
          </div>

          <div className="servicio-content">
            <label className="servicio-item servicio-item--checkbox" style={{ marginTop: 8 }}>
              <input
                type="radio"
                name="pantallaTipo"
                value="tablet"
                checked={(servicios.pantallaTipo ?? "tablet") === "tablet"}
                onChange={handleChange}
              />
              <div className="servicio-content">
                <div className="servicio-header-row">
                  <span className="servicio-title">Tablet (11")</span>
                  <span className="servicio-price badge badge-aviso">+180 € / ud</span>
                </div>
                <p className="servicio-description">
                  ✅ Más barata, rápida de instalar y portátil.  
                  ⚠️ Menos “pro”, más sensible a grasa/golpes si no va protegida.
                </p>
              </div>
            </label>

            <label className="servicio-item servicio-item--checkbox" style={{ marginTop: 8 }}>
              <input
                type="radio"
                name="pantallaTipo"
                value="pro"
                checked={servicios.pantallaTipo === "pro"}
                onChange={handleChange}
              />
              <div className="servicio-content">
                <div className="servicio-header-row">
                  <span className="servicio-title">Pantalla táctil PRO (AIO)</span>
                  <span className="servicio-price badge badge-aviso">+450 € / ud aprox.</span>
                </div>
                <p className="servicio-description">
                  ✅ Más robusta y profesional, fija y siempre lista (tipo TPV).  
                  ⚠️ Más cara y requiere instalación fija (enchufe/soporte).
                </p>
                <small className="servicio-helper">
                  Ideal para barra y cocinas con mucho uso.
                </small>
              </div>
            </label>
          </div>
        </div>

        {/* Cantidad de pantallas */}
        <div className="servicio-item servicio-item--number">
          <div className="servicio-number-text">
            <label>{isShop ? "Cantidad de pantallas TPV" : "Cantidad de pantallas (cocina/barra)"}</label>
            <small className="servicio-helper">
              {precioPantalla} € por unidad (según tipo elegido)
            </small>
          </div>
          <input
            className="servicio-number-input"
            type="number"
            name="pantallas"
            min="0"
            max="10"
            value={servicios.pantallas ?? 0}
            onChange={handleChange}
          />
        </div>

        {/* En restaurante: PDA. En shop: scanner */}
        {!isShop ? (
          <div className="servicio-item servicio-item--number">
            <div className="servicio-number-text">
              <label>PDA para camareros</label>
              <small className="servicio-helper">180 € por unidad</small>
            </div>
            <input
              className="servicio-number-input"
              type="number"
              name="pda"
              min="0"
              max="10"
              value={servicios.pda ?? 0}
              onChange={handleChange}
            />
          </div>
        ) : (
          <div className="servicio-item servicio-item--number">
            <div className="servicio-number-text">
              <label>Scanner de códigos de barras</label>
              <small className="servicio-helper">(precio a definir) por unidad</small>
            </div>
            <input
              className="servicio-number-input"
              type="number"
              name="scanner"
              min="0"
              max="10"
              value={servicios.scanner ?? 0}
              onChange={handleChange}
            />
          </div>
        )}
      </div>

      {/* === Servicios adicionales === */}
      <div className="servicios-grupo card">
        <h3>🎓 Formación y servicios adicionales</h3>
        <p className="servicios-help">
          Formación para que el equipo use Alef desde el minuto uno.
        </p>

        {/* ✅ NUEVO: Formación */}
        <label className="servicio-item servicio-item--checkbox">
          <input
            type="checkbox"
            name="formacion"
            checked={!!servicios.formacion}
            onChange={handleChange}
          />
          <div className="servicio-content">
            <div className="servicio-header-row">
              <span className="servicio-title">Formación al equipo (60–90 min)</span>
              <span className="servicio-price badge badge-aviso">+120 € único</span>
            </div>
            <p className="servicio-description">
              Explicamos el flujo completo (caja, cocina, barra y sala), mejores prácticas y resolución de dudas.
              Puede ser presencial u online según disponibilidad.
            </p>

            {servicios.formacion && (
              <div className="servicio-item servicio-item--number servicio-item--inline">
                <div className="servicio-number-text">
                  <label>¿Cuántas personas aprox.?</label>
                  <small className="servicio-helper">Solo para organizar la sesión.</small>
                </div>
                <input
                  className="servicio-number-input"
                  type="number"
                  name="formacionPersonas"
                  min="1"
                  max="50"
                  value={servicios.formacionPersonas ?? ""}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>
        </label>

        {/* Fotografía solo en restaurante */}
        {!isShop && (
          <label className="servicio-item servicio-item--checkbox">
            <input
              type="checkbox"
              name="fotografia"
              checked={!!servicios.fotografia}
              onChange={handleChange}
            />
            <div className="servicio-content">
              <div className="servicio-header-row">
                <span className="servicio-title">Servicio de fotografía profesional</span>
                <span className="servicio-price badge badge-aviso">+120 € único</span>
              </div>
              <p className="servicio-description">
                Fotografíamos platos/local con calidad profesional para carta digital y presencia online.
              </p>
            </div>
          </label>
        )}
      </div>

      {/* === Info final === */}
      <div className="servicios-nota card">
        <p className="servicios-nota-text">
          💬 Todos los precios incluyen soporte técnico y actualizaciones de Alef.
          {" "}
          {servicios.tpvOpcion === "nuevo"
            ? " El TPV nuevo llega ya instalado y listo para conectar."
            : " Si usas tu TPV/PC, lo dejamos configurado para que funcione desde el primer día."}
          {" "}
          {servicios.pantallaTipo === "pro"
            ? " Las pantallas PRO se entregan preparadas para usar (enchufar y trabajar)."
            : " Las tablets se entregan configuradas (Wi-Fi + acceso directo a Softalef)."}
        </p>
      </div>
    </section>
  );
}
