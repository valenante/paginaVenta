import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import { toInputText, toNum, clampIntNum } from "../../utils/numeroInput";
import "./EstacionesCapacidadPanel.css";

export default function EstacionesCapacidadPanel({
  estaciones = [],
  setEstaciones,
  onAlert,
}) {
  const [draft, setDraft] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);

  // El draft guarda TEXTO (lo que el usuario está tecleando, "" incluido).
  // Convertir dentro del onChange impedía borrar el campo: Number("") === 0,
  // el clamp lo subía a 1 y React reescribía "1" en el DOM en cada tecla.
  // La conversión y el clamp se hacen al GUARDAR.
  useEffect(() => {
    const next = {};
    for (const e of estaciones) {
      next[e._id] = toInputText(toNum(e.capacidadMax, 5));
    }
    setDraft(next);
  }, [estaciones]);

  // Capacidad efectiva que se enviaría: respeta los límites del input (1..200).
  const capGuardable = (e) =>
    clampIntNum(draft[e._id], 1, 200, toNum(e.capacidadMax, 5));

  const isChanged = (e) => toNum(e.capacidadMax, 5) !== capGuardable(e);

  const hasChanges = useMemo(
    () => estaciones.some((e) => isChanged(e)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [estaciones, draft]
  );

  const setCap = (id, value) => {
    setDraft((prev) => ({ ...prev, [id]: value }));
  };

  const normalizeUpdated = (data) => {
    // soporta backend que devuelva { estacion: {...} } o directamente {...}
    if (!data) return null;
    return data.estacion ?? data;
  };

  const guardarUna = async (estacion) => {
    // el input guarda texto → aquí se convierte y se aplican los límites
    const nuevaCap = capGuardable(estacion);

    try {
      setSavingId(estacion._id);

      // ✅ manda solo lo necesario (evitas pisar campos o mandar basura)
      const { data } = await api.put(`/estaciones/${estacion._id}`, {
        capacidadMax: nuevaCap,
      });

      const updated = normalizeUpdated(data) || {
        ...estacion,
        capacidadMax: nuevaCap,
      };

      setEstaciones((prev) =>
        prev.map((x) => (x._id === updated._id ? updated : x))
      );

      onAlert?.({
        tipo: "success",
        mensaje: `Capacidad actualizada: ${estacion.nombre}`,
      });
    } catch (err) {
      onAlert?.({
        tipo: "error",
        mensaje: "Error al guardar capacidad de estación.",
      });
    } finally {
      setSavingId(null);
    }
  };

  const guardarTodas = async () => {
    const cambios = estaciones
      .filter((e) => isChanged(e))
      .map((e) => ({
        _id: e._id,
        capacidadMax: capGuardable(e),
      }));

    if (!cambios.length) {
      onAlert?.({ tipo: "info", mensaje: "No hay cambios para guardar." });
      return;
    }

    try {
      setSavingAll(true);

      // Guardamos en paralelo
      const results = await Promise.all(
        cambios.map((e) =>
          api
            .put(`/estaciones/${e._id}`, { capacidadMax: e.capacidadMax })
            .then((r) => normalizeUpdated(r.data))
        )
      );

      // Reemplazamos en estado (fallback si alguna respuesta viene rara)
      const map = new Map(
        results
          .filter(Boolean)
          .map((r) => [r._id, r])
      );

      setEstaciones((prev) =>
        prev.map((e) =>
          map.get(e._id)
            ? map.get(e._id)
            : // si no vino en results, mantenemos
              e
        )
      );

      onAlert?.({ tipo: "success", mensaje: "Capacidades guardadas ✅" });
    } catch (err) {
      onAlert?.({ tipo: "error", mensaje: "Error al guardar capacidades." });
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <section className="config-card card estaciones-capacidad">
      <header className="config-card-header">
        <div>
          <h2>Capacidad por estación (slots físicos)</h2>
          <p className="config-card-subtitle">
            Define cuántas <b>unidades físicas</b> puede procesar la estación a la vez
            (ej: plancha 20 burgers ≈ capacidad 20 si “burger” tiene carga=1).
            El watcher usa esta capacidad para calcular <b>%</b> y <b>cola (min)</b>.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secundario"
          onClick={guardarTodas}
          disabled={!hasChanges || savingAll}
          title={!hasChanges ? "No hay cambios" : "Guardar todas"}
        >
          {savingAll ? "Guardando..." : "Guardar todo"}
        </button>
      </header>

      <ul className="estaciones-capacidad__lista">
        {estaciones.length === 0 && (
          <li className="estaciones-capacidad__empty">No hay estaciones.</li>
        )}

        {estaciones.map((e) => {
          const changed = isChanged(e);
          const disabled = savingId === e._id;

          return (
            <li key={e._id} className="estaciones-capacidad__item">
              <div className="estaciones-capacidad__info">
                <div className="estaciones-capacidad__nombre">
                  {e.nombre}{" "}
                  {e.esCentral ? <span className="badge-mini">Central</span> : null}
                  {changed ? <span className="badge-mini badge-mini--warn">Modificado</span> : null}
                </div>
                <div className="estaciones-capacidad__meta">
                  <span className="pill">{e.destino}</span>
                  <span className="pill">slug: {e.slug}</span>
                </div>
              </div>

              <div className="estaciones-capacidad__controls">
                <div className="cap-input">
                  <label>Capacidad (slots)</label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={toInputText(draft[e._id])}
                    onChange={(ev) => setCap(e._id, ev.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primario "
                  onClick={() => guardarUna(e)}
                  disabled={disabled || !changed}
                  title={!changed ? "No hay cambios" : "Guardar"}
                >
                  {disabled ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <small className="text-suave">
        Tip: Si subes capacidadMax, la estación tardará más en entrar en “en riesgo/saturada”
        y bajará la cola estimada (colaMin) para el mismo volumen de pedidos.
      </small>
    </section>
  );
}
