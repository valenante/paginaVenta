import React, { useMemo, useState } from "react";
import "./Paso2ConfiguracionBasica.css";

const TITULOS_CATEGORIA = {
  legal: "🧾 Fiscalidad y VeriFactu",
  tpv: "🧾 TPV y caja",
  carta: "📋 Carta digital",
  cocina: "🍳 Cocina / barra",
  reservas: "📅 Reservas",
  reporting: "📊 Informes y estadísticas",
  soporte: "🛟 Soporte",
  hardware: "🖨 Impresoras y hardware",
  general: "🔧 Opciones generales",
};

function getTituloCategoria(cat) {
  const key = (cat || "general").toLowerCase();
  return TITULOS_CATEGORIA[key] || `🔧 ${key}`;
}

export default function Paso2ConfiguracionBasica({
  config,
  setConfig,
  plan,
  isShop = false, // 👈 NUEVO
}) {
  const featuresDelPlan = plan?.features || [];

  // ✅ Shop: simplificado (sin categorías)
  const featuresFlat = useMemo(() => {
    const configurables = featuresDelPlan.filter((f) => !!f.configKey);
    const fijas = featuresDelPlan.filter((f) => !f.configKey);
    return { configurables, fijas };
  }, [featuresDelPlan]);

  // ✅ Restaurante: agrupado por categoría (lo que ya tenías)
  const featuresPorCategoria = useMemo(() => {
    return featuresDelPlan.reduce((acc, f) => {
      const cat = (f.categoria || "general").toLowerCase();
      if (!acc[cat]) acc[cat] = { configurables: [], fijas: [] };
      if (f.configKey) acc[cat].configurables.push(f);
      else acc[cat].fijas.push(f);
      return acc;
    }, {});
  }, [featuresDelPlan]);

  const categorias = Object.entries(featuresPorCategoria);
  const totalFeatures = featuresDelPlan.length;
  const totalCategorias = categorias.length;

  // 🎛 Acordeón restaurante: por defecto se abre la primera categoría
  const [openCategory, setOpenCategory] = useState(
    categorias[0]?.[0] || null
  );

  const handleFeatureToggle = (configKey, checked) => {
    if (!configKey) return;
    setConfig((prev) => ({
      ...prev,
      [configKey]: checked,
    }));
  };

  const handleColorChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      colores: { ...prev.colores, [name]: value },
    }));
  };

  const handleInfoChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      informacionRestaurante: {
        ...prev.informacionRestaurante,
        [field]: value,
      },
    }));
  };

  const labelNegocio = isShop ? "tienda" : "restaurante";

  return (
    <section className="paso2-config section section--wide">
      <header className="paso2-header">
        <div className="paso2-header-text">
          <h2>⚙️ Configuración inicial</h2>
          <p>
            {isShop ? (
              <>
                Activa o desactiva las funcionalidades incluidas en tu plan.
                Esta configuración se usará para crear tu entorno. Más adelante
                podrás ajustar detalles desde el panel.
              </>
            ) : (
              <>
                Activa o desactiva las funcionalidades incluidas en tu plan.
                Esta configuración se usará para crear tu entorno. Más adelante
                podrás ajustar muchos detalles desde el panel del restaurante.
              </>
            )}
          </p>
        </div>

        <div className="plan-summary">
          <div className="plan-summary-pill plan-summary-pill--primary">
            <span className="pill-number">{totalFeatures}</span>
            <span className="pill-label">funciones incluidas en tu plan</span>
          </div>

          {!isShop && (
            <div className="plan-summary-pill plan-summary-pill--neutral">
              <span className="pill-number">{totalCategorias}</span>
              <span className="pill-label">bloques de configuración</span>
            </div>
          )}
        </div>
      </header>

      {/* =============================
          FEATURES
          - SHOP: una sola tarjeta (simple)
          - RESTAURANTE: categorías (igual que antes)
      ============================= */}

      {isShop ? (
        <div className="config-features-wrapper">
          {totalFeatures === 0 && (
            <p className="config-empty text-suave">
              No hay opciones configurables en este plan.
            </p>
          )}

          {totalFeatures > 0 && (
            <div className="feature-category-card card open">
              <div className="feature-category-body">
                {featuresFlat.configurables.length > 0 && (
                  <>
                    <p className="feature-subtitle">Lo que puedes configurar ahora</p>
                    <div className="feature-list">
                      {featuresFlat.configurables.map((f) => (
                        <label key={f._id} className="feature-item">
                          <input
                            type="checkbox"
                            checked={!!config[f.configKey]}
                            onChange={(e) =>
                              handleFeatureToggle(f.configKey, e.target.checked)
                            }
                          />
                          <div className="feature-text">
                            <span className="feature-name">{f.nombre}</span>
                            {f.descripcion && (
                              <small className="feature-desc">{f.descripcion}</small>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {featuresFlat.fijas.length > 0 && (
                  <div className="feature-fixed-block">
                    <p className="feature-subtitle">También incluye en este plan</p>
                    <ul className="feature-fixed-list">
                      {featuresFlat.fijas.map((f) => (
                        <li key={f._id}>{f.nombre}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        // ✅ RESTAURANTE (TU CÓDIGO TAL CUAL)
        <div className="config-features-wrapper">
          {totalFeatures === 0 && (
            <p className="config-empty text-suave">
              No hay opciones configurables en este plan.
            </p>
          )}

          {categorias.map(([catKey, grupo]) => {
            const abierta =
              openCategory === null
                ? catKey === categorias[0][0]
                : openCategory === catKey;

            const { configurables, fijas } = grupo;

            return (
              <div
                key={catKey}
                className={`feature-category-card card ${
                  abierta ? "open" : "closed"
                }`}
              >
                <button
                  type="button"
                  className="feature-category-header"
                  onClick={() =>
                    setOpenCategory((prev) => (prev === catKey ? null : catKey))
                  }
                >
                  <div className="feature-category-title">
                    {getTituloCategoria(catKey)}
                    <span className="feature-category-count badge badge-aviso">
                      {configurables.length + fijas.length} función
                      {configurables.length + fijas.length !== 1 && "es"}
                    </span>
                  </div>
                  <span className="feature-category-chevron">
                    {abierta ? "▲" : "▼"}
                  </span>
                </button>

                {abierta && (
                  <div className="feature-category-body">
                    {configurables.length > 0 && (
                      <>
                        <p className="feature-subtitle">
                          Lo que puedes configurar ahora
                        </p>
                        <div className="feature-list">
                          {configurables.map((f) => (
                            <label key={f._id} className="feature-item">
                              <input
                                type="checkbox"
                                checked={!!config[f.configKey]}
                                onChange={(e) =>
                                  handleFeatureToggle(
                                    f.configKey,
                                    e.target.checked
                                  )
                                }
                              />
                              <div className="feature-text">
                                <span className="feature-name">{f.nombre}</span>
                                {f.descripcion && (
                                  <small className="feature-desc">
                                    {f.descripcion}
                                  </small>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </>
                    )}

                    {fijas.length > 0 && (
                      <div className="feature-fixed-block">
                        <p className="feature-subtitle">
                          También incluye en este plan
                        </p>
                        <ul className="feature-fixed-list">
                          {fijas.map((f) => (
                            <li key={f._id}>{f.nombre}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* === Colores básicos (igual) === */}
      <div className="config-colores card">
        <h3>🎨 Paleta de colores</h3>
        <p className="config-help">
          Elige los colores principales de tu marca. Podrás ajustarlos más
          adelante desde el panel.
        </p>

        <div className="color-pickers">
          <div className="color-item">
            <label>Principal</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                name="principal"
                value={config.colores.principal}
                onChange={handleColorChange}
              />
              <span className="color-code">{config.colores.principal}</span>
            </div>
          </div>

          <div className="color-item">
            <label>Secundario</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                name="secundario"
                value={config.colores.secundario}
                onChange={handleColorChange}
              />
              <span className="color-code">{config.colores.secundario}</span>
            </div>
          </div>
        </div>
      </div>

      {/* === Información básica (solo cambia texto, no la estructura) === */}
      <div className="config-info card">
        <h3>📞 Información básica de {labelNegocio}</h3>
        <p className="config-help">
          {isShop ? (
            <>
              Estos datos se usarán como información de contacto en el panel.
              Podrás completarlos luego con más detalle.
            </>
          ) : (
            <>
              Estos datos aparecerán en algunas comunicaciones y en el panel del
              TPV. Podrás completarlos luego más en detalle.
            </>
          )}
        </p>

        <div className="config-info-grid">
          <div className="config-info-field">
            <label>Teléfono</label>
            <input
              type="text"
              value={config.informacionRestaurante.telefono}
              onChange={(e) => handleInfoChange("telefono", e.target.value)}
              placeholder="Ej. +34 612 345 678"
            />
          </div>

          <div className="config-info-field">
            <label>Dirección</label>
            <input
              type="text"
              value={config.informacionRestaurante.direccion}
              onChange={(e) => handleInfoChange("direccion", e.target.value)}
              placeholder="Ej. Calle Mayor 12, Madrid"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
