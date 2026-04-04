// src/components/Config/OperativaSlaCapacidadPanel.jsx
import React, { useMemo } from "react";
import "./OperativaSlaCapacidadPanel.css";

export default function OperativaSlaCapacidadPanel({ form, setForm }) {
  const sla = form?.slaMesas || {};

  const slaSafe = useMemo(
    () => ({
      activo: sla.activo ?? true,
      fallbackMinutosMax: sla.fallbackMinutosMax ?? 10,
      porcentajeAvisoRiesgo: sla.porcentajeAvisoRiesgo ?? 80,
      margenGraciaSegundos: sla.margenGraciaSegundos ?? 60,
      cooldownAvisoMinutos: sla.cooldownAvisoMinutos ?? 5,
      proximosMax: sla.proximosMax ?? 3,
      factorOcupacionK: sla.factorOcupacionK ?? 0.35,
    }),
    [sla]
  );

  const setSla = (partial) => {
    setForm((prev) => ({
      ...prev,
      slaMesas: {
        ...(prev?.slaMesas || {}),
        ...partial,
      },
    }));
  };

  return (
    <section className="config-card card">
      <header className="config-card-header">
        <div>
          <h2>Alertas de servicio y prediccion de tiempos</h2>
          <p className="config-card-subtitle">
            Monitoriza cada mesa y predice cuando estara listo cada plato segun
            la cola de cocina. Si un plato se retrasa, te avisa en tiempo real.
          </p>
        </div>
      </header>

      <div className="sla-panel__fields">
        {/* ── Toggle principal ── */}
        <label className="sla-toggle">
          <input
            type="checkbox"
            checked={!!slaSafe.activo}
            onChange={(e) => setSla({ activo: e.target.checked })}
          />
          <div className="sla-toggle__text">
            <span className="sla-toggle__label">
              Activar alertas de servicio
            </span>
            <span className="sla-toggle__hint">
              Desactivalo si no quieres alertas de retraso ni predicciones de
              tiempo en el dashboard.
            </span>
          </div>
        </label>

        {slaSafe.activo && (
          <>
            {/* ── Info box ── */}
            <div className="sla-info">
              <span className="sla-info__icon">💡</span>
              <span className="sla-info__text">
                Para que las predicciones sean precisas, configura el
                <strong> tiempo de preparacion</strong> de cada producto en
                Carta &gt; Editar producto. Si un producto no tiene tiempo,
                se usara el valor por defecto que configures aqui abajo.
              </span>
            </div>

            {/* ── Grid de campos ── */}
            <div className="sla-grid">
              {/* Tiempo por defecto */}
              <div className="sla-field">
                <label>Tiempo de preparacion por defecto</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={slaSafe.fallbackMinutosMax}
                  onChange={(e) =>
                    setSla({ fallbackMinutosMax: clampInt(e.target.value, 1, 60) })
                  }
                  placeholder="10"
                />
                <span className="sla-field__hint">
                  Minutos. Se usa cuando un producto no tiene su propio tiempo
                  configurado.
                </span>
              </div>

              {/* Margen de gracia */}
              <div className="sla-field">
                <label>Margen de gracia</label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={slaSafe.margenGraciaSegundos}
                  onChange={(e) =>
                    setSla({ margenGraciaSegundos: clampInt(e.target.value, 0, 300) })
                  }
                  placeholder="60"
                />
                <span className="sla-field__hint">
                  Segundos que espera antes de empezar a contar. Evita alertas
                  justo al entrar el pedido. Recomendado: 30–60s.
                </span>
              </div>

              <div className="sla-divider" />

              {/* Aviso en riesgo */}
              <div className="sla-field">
                <label>Aviso "en riesgo" al (%)</label>
                <input
                  type="number"
                  min="50"
                  max="99"
                  value={slaSafe.porcentajeAvisoRiesgo}
                  onChange={(e) =>
                    setSla({ porcentajeAvisoRiesgo: clampInt(e.target.value, 50, 99) })
                  }
                  placeholder="80"
                />
                <span className="sla-field__hint">
                  La mesa se marca en amarillo cuando el tiempo alcanza este %
                  del estimado. Ej: 80% con plato de 10 min = aviso a los 8 min.
                  Al 100% pasa a rojo.
                </span>
              </div>

              {/* Cooldown */}
              <div className="sla-field">
                <label>Repetir alertas cada</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={slaSafe.cooldownAvisoMinutos}
                  onChange={(e) =>
                    setSla({ cooldownAvisoMinutos: clampInt(e.target.value, 0, 30) })
                  }
                  placeholder="5"
                />
                <span className="sla-field__hint">
                  Minutos entre alertas de la misma mesa. 0 = avisa siempre.
                  Evita saturar de notificaciones.
                </span>
              </div>

              <div className="sla-divider" />

              {/* Proximos en salir */}
              <div className="sla-field">
                <label>Platos "proximos en salir" por mesa</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={slaSafe.proximosMax}
                  onChange={(e) =>
                    setSla({ proximosMax: clampInt(e.target.value, 1, 10) })
                  }
                  placeholder="3"
                />
                <span className="sla-field__hint">
                  Cuantos platos muestra el panel de "Proximos" por cada mesa.
                </span>
              </div>

              {/* Factor ocupacion */}
              <div className="sla-field">
                <label>Ajuste por ocupacion</label>
                <select
                  value={
                    slaSafe.factorOcupacionK === 0
                      ? "0"
                      : slaSafe.factorOcupacionK <= 0.2
                        ? "0.15"
                        : slaSafe.factorOcupacionK <= 0.4
                          ? "0.35"
                          : "0.6"
                  }
                  onChange={(e) =>
                    setSla({ factorOcupacionK: Number(e.target.value) })
                  }
                >
                  <option value="0">Desactivado</option>
                  <option value="0.15">Suave</option>
                  <option value="0.35">Moderado (recomendado)</option>
                  <option value="0.6">Fuerte</option>
                </select>
                <span className="sla-field__hint">
                  Cuando hay mucha gente, los platos tardan mas. Este ajuste
                  aumenta el tiempo estimado automaticamente segun la ocupacion.
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* helpers */
function clampInt(val, min, max) {
  const n = Number(val);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
