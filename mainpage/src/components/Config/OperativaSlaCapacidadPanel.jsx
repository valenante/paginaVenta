// src/components/Admin/Config/OperativaSlaCapacidadPanel.jsx
import React, { useMemo } from "react";
import "./OperativaSlaCapacidadPanel.css";

/**
 * Panel: SLA dinámico (mesaSlaWatcher) + Capacidad estaciones (capacity watcher + scheduler)
 * - slaMesas: controla SLA, próximos, debug, factor ocupación, intervalos
 * - capacidadEstaciones: controla watcher de capacidad y pesos + slotMode del scheduler
 */
export default function OperativaSlaCapacidadPanel({ form, setForm, onAlert }) {
  const sla = form?.slaMesas || {};
  const cap = form?.capacidadEstaciones || {};

  const slaSafe = useMemo(
    () => ({
      activo: sla.activo ?? true,
      modo: sla.modo ?? "dinamico", // dinamico | legacy (si lo sigues soportando en evaluarMesaSla)
      porcentajeAvisoRiesgo: sla.porcentajeAvisoRiesgo ?? 80,
      cooldownAvisoMinutos: sla.cooldownAvisoMinutos ?? 0,

      // watcher SLA
      intervaloRevisionSegundos: sla.intervaloRevisionSegundos ?? 30,

      // “Próximos en salir” (top N por mesa)
      proximosMax: sla.proximosMax ?? 3,

      // escala opcional por ocupación (si lo usas en watcher)
      factorOcupacionK: sla.factorOcupacionK ?? 0,

      // fallback cuando no se puede determinar próximo/plato/estación
      fallbackMinutosMax: sla.fallbackMinutosMax ?? 10,

      // logs
      debugLogs: sla.debugLogs ?? false,
    }),
    [sla]
  );

  const capSafe = useMemo(
    () => ({
      // watcher capacidad
      intervaloRevisionSegundos: cap.intervaloRevisionSegundos ?? 10,

      // pesos por seccionIndex (0,1,2) usados por el watcher de capacidad
      pesosSeccion: cap.pesosSeccion ?? { 0: 1.0, 1: 0.6, 2: 0.3 },
      pesoDefault: cap.pesoDefault ?? 0.15,

      // scheduler (NIVEL 2): cómo discretizas slots decimales
      slotMode: cap.slotMode ?? "ceil", // ceil | round | floor
    }),
    [cap]
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

  const setCap = (partial) => {
    setForm((prev) => ({
      ...prev,
      capacidadEstaciones: {
        ...(prev?.capacidadEstaciones || {}),
        ...partial,
      },
    }));
  };

  const updatePeso = (key, value) => {
    const n = clampNum(value, 0, 10);
    setCap({
      pesosSeccion: { ...capSafe.pesosSeccion, [key]: n },
    });
  };

  return (
    <>
      {/* ===========================
          SLA MESAS (mesaSlaWatcher)
      =========================== */}
      <section className="config-card card">
        <header className="config-card-header">
          <h2>⏱️ SLA de servicio (mesa)</h2>
          <p className="config-card-subtitle">
            El umbral “máximo sin servicio” se calcula por mesa en base al próximo item real
            (scheduler) y la cola/capacidad de su estación.
          </p>
        </header>

        <div className="config-field">
          <label className="check-central">
            <input
              type="checkbox"
              checked={!!slaSafe.activo}
              onChange={(e) => setSla({ activo: e.target.checked })}
            />
            Activar SLA de mesas
          </label>
        </div>

        <div className="config-field config-field--stacked">
          <label>Intervalo de revisión SLA (segundos)</label>
          <input
            type="number"
            min="5"
            max="120"
            value={slaSafe.intervaloRevisionSegundos}
            onChange={(e) => {
              const v = clampInt(e.target.value, 5, 120);
              setSla({ intervaloRevisionSegundos: v });
              onAlert?.({
                tipo: "info",
                mensaje:
                  "El intervalo del watcher SLA se aplica al arrancar. Para aplicarlo ya, reinicia el watcher/servidor.",
              });
            }}
          />
          <small className="text-suave">
            Recomendado: 20–40s. Más bajo = más carga / más realtime.
          </small>
        </div>

        <div className="config-field config-field--stacked">
          <label>Modo</label>
          <select
            value={slaSafe.modo}
            onChange={(e) => setSla({ modo: e.target.value })}
          >
            <option value="dinamico">Dinámico (recomendado)</option>
            <option value="legacy">Legacy (antiguo)</option>
          </select>
          <small className="text-suave">
            Dinámico = scheduler + cola real. Legacy solo si quieres el comportamiento antiguo.
          </small>
        </div>

        <div className="config-field config-field--stacked">
          <label>Porcentaje de aviso “en riesgo”</label>
          <input
            type="number"
            min="1"
            max="99"
            value={slaSafe.porcentajeAvisoRiesgo}
            onChange={(e) =>
              setSla({ porcentajeAvisoRiesgo: clampInt(e.target.value, 1, 99) })
            }
          />
          <small className="text-suave">
            Ej: 80% → si el umbral dinámico es 10 min, “en riesgo” empieza a los 8 min.
          </small>
        </div>

        <div className="config-field config-field--stacked">
          <label>Cooldown de avisos (minutos)</label>
          <input
            type="number"
            min="0"
            max="60"
            value={slaSafe.cooldownAvisoMinutos}
            onChange={(e) =>
              setSla({ cooldownAvisoMinutos: clampInt(e.target.value, 0, 60) })
            }
          />
          <small className="text-suave">Evita spam de alertas repetidas.</small>
        </div>

        <div className="config-field config-field--stacked">
          <label>Máximo “Próximos en salir” por mesa</label>
          <input
            type="number"
            min="1"
            max="10"
            value={slaSafe.proximosMax}
            onChange={(e) =>
              setSla({ proximosMax: clampInt(e.target.value, 1, 10) })
            }
          />
          <small className="text-suave">
            Esto alimenta el panel “Próximos” (top N por mesa).
          </small>
        </div>

        <div className="config-field config-field--stacked">
          <label>Factor ocupación (K)</label>
          <input
            type="number"
            step="0.05"
            min="0"
            max="2"
            value={slaSafe.factorOcupacionK}
            onChange={(e) =>
              setSla({ factorOcupacionK: clampNum(e.target.value, 0, 2) })
            }
          />
          <small className="text-suave">
            0 = desactivado. Si K &gt; 0, escala el ETA según ocupación para hacerlo más conservador.
          </small>
        </div>

        <div className="config-field config-field--stacked">
          <label>Fallback si falta info (minutos)</label>
          <input
            type="number"
            min="1"
            max="240"
            value={slaSafe.fallbackMinutosMax}
            onChange={(e) =>
              setSla({ fallbackMinutosMax: clampInt(e.target.value, 1, 240) })
            }
          />
          <small className="text-suave">
            Solo se usa si no se puede determinar estación/cola/siguiente item.
          </small>
        </div>

        <div className="config-field">
          <label className="check-central">
            <input
              type="checkbox"
              checked={!!slaSafe.debugLogs}
              onChange={(e) => setSla({ debugLogs: e.target.checked })}
            />
            Debug logs SLA (consola)
          </label>
          <small className="text-suave">
            Úsalo solo para test: imprime mucho en consola.
          </small>
        </div>
      </section>

      {/* ===========================
          CAPACIDAD ESTACIONES
      =========================== */}
      <section className="config-card card">
        <header className="config-card-header">
          <h2>🔥 Capacidad estaciones (cocina)</h2>
          <p className="config-card-subtitle">
            Controla cada cuánto se recalcula la saturación/cola y cómo se pondera por secciones.
            También ajusta el “slotMode” del scheduler (cómo se discretizan slots decimales).
          </p>
        </header>

        <div className="config-field config-field--stacked">
          <label>Intervalo watcher capacidad (segundos)</label>
          <input
            type="number"
            min="3"
            max="120"
            value={capSafe.intervaloRevisionSegundos}
            onChange={(e) => {
              const v = clampInt(e.target.value, 3, 120);
              setCap({ intervaloRevisionSegundos: v });
              onAlert?.({
                tipo: "info",
                mensaje:
                  "El intervalo del watcher de capacidad se aplica al arrancar. Para aplicarlo ya, reinicia el watcher/servidor.",
              });
            }}
          />
        </div>

        <div className="config-field config-field--stacked">
          <label>Slot mode (scheduler)</label>
          <select
            value={capSafe.slotMode}
            onChange={(e) => setCap({ slotMode: e.target.value })}
          >
            <option value="ceil">ceil (conservador)</option>
            <option value="round">round (balanceado)</option>
            <option value="floor">floor (optimista)</option>
          </select>
          <small className="text-suave">
            Recomendado: <b>ceil</b>. Si tienes cargaEstacion decimal, esto afecta la planificación.
          </small>
        </div>

        <div className="config-field config-field--stacked">
          <label>Pesos por seccionIndex (antigüedad / orden)</label>

          <div className="tabla-tramos">
            <div className="tabla-tramos__head">
              <span>Índice</span>
              <span>Peso</span>
              <span></span>
              <span></span>
            </div>

            {[0, 1, 2].map((i) => (
              <div key={i} className="tabla-tramos__row">
                <input type="text" value={i} readOnly />
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="10"
                  value={
                    capSafe.pesosSeccion?.[i] ??
                    capSafe.pesosSeccion?.[String(i)] ??
                    0
                  }
                  onChange={(e) => updatePeso(i, e.target.value)}
                />
                <div />
                <div />
              </div>
            ))}
          </div>

          <small className="text-suave">
            0 = lo más reciente / entrante, 1 = medio, 2 = final (según tu seccionIndex).
          </small>

          <div className="config-field config-field--stacked">
            <label>Peso default</label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="10"
              value={capSafe.pesoDefault}
              onChange={(e) =>
                setCap({ pesoDefault: clampNum(e.target.value, 0, 10) })
              }
            />
          </div>
        </div>
      </section>
    </>
  );
}

/* helpers */
function clampInt(val, min, max) {
  const n = Number(val);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function clampNum(val, min, max) {
  const n = Number(val);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}
