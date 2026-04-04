import React, { useState, useMemo, useCallback } from "react";
import api from "../../utils/api";
import "./EtaPerfiles.css";

const num = (v, fb = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

const fmtMin = (seg) => {
  if (seg == null) return "-";
  const m = seg / 60;
  return m >= 1 ? `${m.toFixed(1)}m` : `${Math.round(seg)}s`;
};

function ConfidenceBar({ muestras }) {
  const pct = Math.min(100, Math.round((num(muestras, 0) / 20) * 100));
  const cls = pct >= 70 ? "eta-conf-bar__fill--high" : pct >= 35 ? "eta-conf-bar__fill--mid" : "eta-conf-bar__fill--low";

  return (
    <span className="eta-conf-bar" title={`${num(muestras, 0)} de 20 platos necesarios para precision completa`}>
      <span className="eta-conf-bar__track">
        <span className={`eta-conf-bar__fill ${cls}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="eta-conf-bar__pct">{pct}%</span>
    </span>
  );
}

function SourceBadge({ muestras }) {
  if (muestras >= 20) return <span className="eta-source eta-source--learned">fiable</span>;
  if (muestras >= 5) return <span className="eta-source eta-source--blended">aprendiendo</span>;
  return <span className="eta-source eta-source--config">pocos datos</span>;
}

export default function EtaPerfiles({ perfiles, onRefresh }) {
  const [filterStation, setFilterStation] = useState("__all__");
  const [filterSource, setFilterSource] = useState("__all__");
  const [resetting, setResetting] = useState(null);

  const profiles = perfiles?.productProfiles || [];
  const stationProfiles = perfiles?.stationProfiles || [];
  const summary = perfiles?.summary || {};

  // Estaciones disponibles
  const estaciones = useMemo(() => {
    const set = new Set();
    for (const p of profiles) {
      if (p.estacionSlug) set.add(p.estacionSlug);
    }
    return [...set].sort();
  }, [profiles]);

  // Filtrar
  const filtered = useMemo(() => {
    let list = profiles;
    if (filterStation !== "__all__") {
      list = list.filter((p) => p.estacionSlug === filterStation);
    }
    if (filterSource === "learned") {
      list = list.filter((p) => p.muestrasValidas >= 20);
    } else if (filterSource === "blended") {
      list = list.filter((p) => p.muestrasValidas >= 5 && p.muestrasValidas < 20);
    } else if (filterSource === "config") {
      list = list.filter((p) => p.muestrasValidas < 5);
    }
    return list.sort((a, b) => b.muestrasValidas - a.muestrasValidas);
  }, [profiles, filterStation, filterSource]);

  const handleReset = useCallback(async (productoId, nombre) => {
    if (!window.confirm(`Resetear los datos de "${nombre}"? Alef volvera a aprender desde cero con los proximos platos.`)) return;
    setResetting(productoId);
    try {
      await api.delete(`/admin/eta/profiles/${productoId}`);
      if (onRefresh) onRefresh();
    } catch {
      // silent
    } finally {
      setResetting(null);
    }
  }, [onRefresh]);

  if (!profiles.length && !stationProfiles.length) {
    return (
      <div className="eta-perfiles">
        <div className="eta-empty">
          <div className="eta-empty__icon">&#128340;</div>
          <div className="eta-empty__title">Sin datos todavia</div>
          <div className="eta-empty__text">
            Cuando los cocineros marquen platos como "listo", Alef empezara a medir cuanto tarda cada plato y mejorara las predicciones automaticamente.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="eta-perfiles">
      <div className="eta-perfiles__head">
        <div>
          <h4 className="eta-perfiles__title">Datos aprendidos por Alef</h4>
          <p className="eta-perfiles__subtitle">Cada vez que un plato sale de cocina, el sistema mide cuanto tardo y mejora sus predicciones.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="eta-summary">
        <div className="eta-summary__card">
          <span className="eta-summary__val eta-summary__val--purple">{summary.totalProductProfiles || 0}</span>
          <span className="eta-summary__label">Platos medidos</span>
        </div>
        <div className="eta-summary__card">
          <span className="eta-summary__val eta-summary__val--green">{summary.productosConDatos || 0}</span>
          <span className="eta-summary__label">Con datos fiables</span>
        </div>
        <div className="eta-summary__card">
          <span className="eta-summary__val eta-summary__val--amber">{summary.productosSinDatos || 0}</span>
          <span className="eta-summary__label">Aun aprendiendo</span>
        </div>
        <div className="eta-summary__card">
          <span className="eta-summary__val eta-summary__val--cyan">{summary.totalStationProfiles || 0}</span>
          <span className="eta-summary__label">Estaciones activas</span>
        </div>
      </div>

      {/* Filters */}
      <div className="eta-filters">
        <button className={`eta-filter-btn ${filterStation === "__all__" ? "eta-filter-btn--on" : ""}`}
          onClick={() => setFilterStation("__all__")}>Todas</button>
        {estaciones.map((e) => (
          <button key={e} className={`eta-filter-btn ${filterStation === e ? "eta-filter-btn--on" : ""}`}
            onClick={() => setFilterStation(e)}>{e}</button>
        ))}
        <span style={{ width: "1px", background: "rgba(255,255,255,0.12)", margin: "0 0.3rem" }} />
        <button className={`eta-filter-btn ${filterSource === "__all__" ? "eta-filter-btn--on" : ""}`}
          onClick={() => setFilterSource("__all__")}>Todos</button>
        <button className={`eta-filter-btn ${filterSource === "learned" ? "eta-filter-btn--on" : ""}`}
          onClick={() => setFilterSource("learned")}>Fiables</button>
        <button className={`eta-filter-btn ${filterSource === "blended" ? "eta-filter-btn--on" : ""}`}
          onClick={() => setFilterSource("blended")}>Aprendiendo</button>
        <button className={`eta-filter-btn ${filterSource === "config" ? "eta-filter-btn--on" : ""}`}
          onClick={() => setFilterSource("config")}>Pocos datos</button>
      </div>

      {/* Table */}
      <div className="eta-table-wrap">
        <table className="eta-table">
          <thead>
            <tr>
              <th>Plato</th>
              <th>Estacion</th>
              <th>Uds</th>
              <th title="Platos marcados como listo">Muestras</th>
              <th title="Cuantos platos necesita para dar predicciones fiables">Precision</th>
              <th title="Tiempo en el que salen la mayoria de los platos">Tiempo habitual</th>
              <th title="Tiempo cuando la cocina va mas lenta de lo normal">Dia lento</th>
              <th title="El plato mas rapido registrado">Mas rapido</th>
              <th title="El plato mas lento registrado">Mas lento</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const key = `${p.productoId}:${p.estacionSlug}:${p.qtyBucket}`;
              return (
                <tr key={key}>
                  <td className="eta-table__name">{p.productoNombre}</td>
                  <td className="eta-table__station">{p.estacionSlug}</td>
                  <td><span className="eta-table__qty">{p.qtyBucket}</span></td>
                  <td>{p.muestrasValidas}</td>
                  <td><ConfidenceBar muestras={p.muestrasValidas} /></td>
                  <td>{fmtMin(p.p50Seg)}</td>
                  <td>{fmtMin(p.p80Seg)}</td>
                  <td>{fmtMin(p.minSeg)}</td>
                  <td>{fmtMin(p.maxSeg)}</td>
                  <td><SourceBadge muestras={p.muestrasValidas} /></td>
                  <td>
                    <button className="eta-reset-btn"
                      disabled={resetting === String(p.productoId)}
                      onClick={() => handleReset(p.productoId, p.productoNombre)}>
                      {resetting === String(p.productoId) ? "..." : "Resetear"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr><td colSpan="11" style={{ textAlign: "center", color: "#64748b", padding: "1.5rem" }}>No hay platos con estos filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Station profiles */}
      {stationProfiles.length > 0 && (
        <>
          <h4 className="eta-perfiles__title" style={{ marginTop: "1.5rem" }}>Tiempos por estacion</h4>
          <p className="eta-perfiles__subtitle">Cuanto espera un plato en la cola de cada estacion antes de que lo empiecen.</p>
          <div className="eta-stations">
            {stationProfiles.map((s) => (
              <div key={s.estacionSlug} className="eta-station-card">
                <div className="eta-station-card__name">{s.estacionSlug}</div>
                <div className="eta-station-card__row">
                  <span>Espera media</span>
                  <span className="eta-station-card__val">{fmtMin(s.ewmaQueueDelaySeg)}</span>
                </div>
                <div className="eta-station-card__row">
                  <span>Espera habitual</span>
                  <span className="eta-station-card__val">{fmtMin(s.p50QueueSeg)}</span>
                </div>
                <div className="eta-station-card__row">
                  <span>Espera en pico</span>
                  <span className="eta-station-card__val">{fmtMin(s.p80QueueSeg)}</span>
                </div>
                <div className="eta-station-card__row">
                  <span>Platos medidos</span>
                  <span className="eta-station-card__val">{s.muestrasValidas}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
