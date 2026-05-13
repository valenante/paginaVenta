// src/pages/HorariosPage.jsx
// Calendario semanal de turnos del personal.

import React, { useState, useMemo } from "react";
import { useSemana, useConflictos, asignarTurno, eliminarAsignacion, publicarSemana } from "../Hooks/useHorarios";
import "./HorariosPage.css";

const DIAS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function getLunesFecha(offset = 0) {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + offset * 7);
  return d.toISOString().slice(0, 10);
}

function formatFecha(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es", { day: "numeric", month: "short" });
}

export default function HorariosPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const fecha = useMemo(() => getLunesFecha(weekOffset), [weekOffset]);
  const { data, loading, refetch } = useSemana(fecha);
  const { conflictos, refetch: refetchConflictos } = useConflictos(fecha);
  const [msg, setMsg] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null); // { usuarioId, dia }
  const [publishing, setPublishing] = useState(false);

  const turnos = data?.turnos || [];
  const empleados = data?.empleados || [];
  const diasCierre = data?.diasCierre || [];

  const handleAssign = async (usuarioId, diaSemana, turnoId) => {
    try {
      await asignarTurno({ usuarioId, fecha, diaSemana, turnoId });
      refetch();
      refetchConflictos();
      setSelectedCell(null);
      setMsg(null);
    } catch (err) {
      setMsg({ t: "error", m: err?.response?.data?.message || "Error al asignar" });
    }
  };

  const handleSetLibre = async (usuarioId, diaSemana) => {
    try {
      await asignarTurno({ usuarioId, fecha, diaSemana, turnoId: "libre", esLibre: true });
      refetch();
      setSelectedCell(null);
    } catch {}
  };

  const handleRemove = async (planillaId, asignacionId) => {
    try {
      await eliminarAsignacion(planillaId, asignacionId);
      refetch();
      refetchConflictos();
    } catch {}
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const result = await publicarSemana(fecha);
      setMsg({ t: "ok", m: `Semana publicada (${result.publicadas} planillas)` });
      refetch();
    } catch (err) {
      setMsg({ t: "error", m: "Error al publicar" });
    } finally {
      setPublishing(false);
    }
  };

  // Fechas de la semana
  const diasFechas = useMemo(() => {
    const lunes = new Date(fecha);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [fecha]);

  if (loading) return <div className="hor-root"><div className="sug-loading">Cargando horarios...</div></div>;

  return (
    <div className="hor-root">
      {/* Header */}
      <div className="sug-header">
        <div>
          <h2>Horarios del equipo</h2>
          <p className="sug-header__sub">Planifica los turnos de tu personal semana a semana.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="sug-btn sug-btn--secondary" onClick={() => setWeekOffset(w => w - 1)}>← Anterior</button>
          <button className="sug-btn sug-btn--secondary" onClick={() => setWeekOffset(0)}>Hoy</button>
          <button className="sug-btn sug-btn--secondary" onClick={() => setWeekOffset(w => w + 1)}>Siguiente →</button>
          <button className="sug-btn sug-btn--primary" onClick={handlePublish} disabled={publishing}>
            {publishing ? "Publicando..." : "Publicar semana"}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`sug-toast sug-toast--${msg.t === "ok" ? "ok" : "error"}`}>
          {msg.m}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", color: "inherit" }}>✕</button>
        </div>
      )}

      {/* Conflictos */}
      {conflictos.length > 0 && (
        <div className="hor-conflictos">
          <strong>⚠ Conflictos ({conflictos.length}):</strong>
          {conflictos.map((c, i) => (
            <span key={i} className="hor-conflicto-item">{c.mensaje}</span>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <div className="hor-calendar">
        {/* Header row: días */}
        <div className="hor-row hor-row--header">
          <div className="hor-cell hor-cell--name">Empleado</div>
          {diasFechas.map((d, i) => (
            <div key={i} className={`hor-cell hor-cell--day ${diasCierre.includes(i) ? "hor-cell--closed" : ""}`}>
              <span className="hor-day-name">{DIAS_SHORT[i]}</span>
              <span className="hor-day-date">{d.getDate()}/{d.getMonth() + 1}</span>
            </div>
          ))}
          <div className="hor-cell hor-cell--hours">Horas</div>
        </div>

        {/* Employee rows */}
        {empleados.map(emp => (
          <div key={emp.usuario._id} className="hor-row">
            <div className="hor-cell hor-cell--name">
              <span className="hor-emp-name">{emp.usuario.nombre}</span>
              <span className="hor-emp-role">{emp.usuario.rol}</span>
            </div>
            {Array.from({ length: 7 }, (_, dia) => {
              const asigs = emp.asignaciones.filter(a => a.diaSemana === dia);
              const isClosed = diasCierre.includes(dia);
              const isSelected = selectedCell?.usuarioId === emp.usuario._id.toString() && selectedCell?.dia === dia;

              return (
                <div
                  key={dia}
                  className={`hor-cell hor-cell--shift ${isClosed ? "hor-cell--closed" : ""} ${isSelected ? "hor-cell--selected" : ""}`}
                  onClick={() => !isClosed && setSelectedCell(
                    isSelected ? null : { usuarioId: emp.usuario._id.toString(), dia }
                  )}
                >
                  {asigs.map(a => (
                    <div
                      key={a._id}
                      className={`hor-turno-chip ${a.esLibre ? "hor-turno-chip--libre" : ""}`}
                      style={!a.esLibre ? { background: a.color || "#6366f1" } : undefined}
                    >
                      <span className="hor-turno-chip__name">{a.esLibre ? "Libre" : a.turnoNombre}</span>
                      <button
                        className="hor-turno-chip__remove"
                        onClick={e => { e.stopPropagation(); handleRemove(emp.planillaId, a._id); }}
                      >✕</button>
                    </div>
                  ))}
                  {asigs.length === 0 && !isClosed && (
                    <span className="hor-cell--empty">+</span>
                  )}

                  {/* Dropdown de asignación */}
                  {isSelected && (
                    <div className="hor-assign-dropdown" onClick={e => e.stopPropagation()}>
                      {turnos.map(t => (
                        <button
                          key={t.id}
                          className="hor-assign-option"
                          style={{ borderLeft: `4px solid ${t.color || "#6366f1"}` }}
                          onClick={() => handleAssign(emp.usuario._id, dia, t.id)}
                        >
                          {t.nombre} ({t.horaInicio}-{t.horaFin})
                        </button>
                      ))}
                      <button
                        className="hor-assign-option hor-assign-option--libre"
                        onClick={() => handleSetLibre(emp.usuario._id, dia)}
                      >
                        Día libre
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="hor-cell hor-cell--hours">
              <span className="hor-hours-value">{emp.horasSemanales.toFixed(1)}h</span>
            </div>
          </div>
        ))}
      </div>

      {/* Leyenda de turnos */}
      <div className="hor-leyenda">
        {turnos.map(t => (
          <span key={t.id} className="hor-leyenda-item">
            <span className="hor-leyenda-color" style={{ background: t.color || "#6366f1" }} />
            {t.nombre} ({t.horaInicio}-{t.horaFin})
          </span>
        ))}
        <span className="hor-leyenda-item">
          <span className="hor-leyenda-color" style={{ background: "#94a3b8" }} />
          Libre
        </span>
      </div>
    </div>
  );
}
