// src/components/Paso3ServiciosExtras.jsx
import React from "react";
import "./Paso3ServiciosExtras.css";

export default function Paso3ServiciosExtras({
  servicios,
  setServicios,
  isShop = false, // 👈 NUEVO
}) {
  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;

    setServicios((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value === ""
          ? ""
          : Number(value),
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;

    setServicios((prev) => ({
      ...prev,
      [name]: Array.from(files || []),
    }));
  };

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

        {/* En restaurante: mesas + QR. En shop: lo ocultamos */}
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
                <span className="servicio-price badge badge-aviso">desde 80 € único</span>
              </div>
              <p className="servicio-description">
                Nos envías el plano o listado de mesas y configuramos toda la
                estructura en Alef. Te mandamos los QR de la carta con número de
                mesa, plastificados y listos para colocar en cada mesa.
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
            value={servicios.impresoras}
            onChange={handleChange}
          />
        </div>

        {/* En shop: "Pantalla TPV" reutilizando el mismo campo pantallas */}
        <div className="servicio-item servicio-item--number">
          <div className="servicio-number-text">
            <label>{isShop ? "Pantalla TPV" : "Pantallas de cocina/barra"}</label>
            <small className="servicio-helper">
              {isShop ? "250 € por unidad" : "250 € por unidad"}
            </small>
          </div>
          <input
            className="servicio-number-input"
            type="number"
            name="pantallas"
            min="0"
            max="10"
            value={servicios.pantallas}
            onChange={handleChange}
          />
        </div>

        {/* En restaurante: PDA. En shop: scanner */}
        {!isShop ? (
          <div className="servicio-item servicio-item--number">
            <div className="servicio-number-text">
              <label>PDA o tablet para camareros</label>
              <small className="servicio-helper">180 € por unidad</small>
            </div>
            <input
              className="servicio-number-input"
              type="number"
              name="pda"
              min="0"
              max="10"
              value={servicios.pda}
              onChange={handleChange}
            />
          </div>
        ) : (
          <div className="servicio-item servicio-item--number">
            <div className="servicio-number-text">
              <label>Scanner de códigos de barras</label>
              <small className="servicio-helper">
                (precio a definir) por unidad
              </small>
            </div>
            <input
              className="servicio-number-input"
              type="number"
              name="scanner"       // 👈 NUEVO CAMPO
              min="0"
              max="10"
              value={servicios.scanner ?? 0}
              onChange={handleChange}
            />
          </div>
        )}
      </div>

      {/* === Servicios adicionales === */}
      {!isShop && (
        <div className="servicios-grupo card">
          <h3>📷 Servicios adicionales</h3>
          <p className="servicios-help">
            Opciones únicas para presentar mejor tu marca y empezar con todo
            configurado.
          </p>

          <label className="servicio-item servicio-item--checkbox">
            <input
              type="checkbox"
              name="fotografia"
              checked={servicios.fotografia}
              onChange={handleChange}
            />
            <div className="servicio-content">
              <div className="servicio-header-row">
                <span className="servicio-title">
                  Servicio de fotografía profesional
                </span>
                <span className="servicio-price badge badge-aviso">
                  +120 € único
                </span>
              </div>
              <p className="servicio-description">
                Fotografíamos tus platos y tu local con calidad profesional para
                usarlos en la carta digital y en tu web.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* === Info final === */}
      <div className="servicios-nota card">
        <p className="servicios-nota-text">
          💬 Todos los precios incluyen soporte técnico y actualizaciones de Alef.
          {isShop
            ? " El hardware se envía configurado y listo para conectar."
            : " El hardware se envía configurado y listo para conectar."}
        </p>
      </div>
    </section>
  );
}
