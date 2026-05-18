// src/components/Turnos/ControlTurnosPanel.jsx
// Panel de control de acceso por turno — admin habilita/deshabilita empleados en tiempo real.

import React, { useState } from "react";
import { useTurnosAcceso, toggleTurnoUsuario, bulkToggleTurnos } from "../../hooks/useTurnosAcceso";
import "./ControlTurnosPanel.css";

const ROLES_LABEL = {
  admin_restaurante: "Admin",
  camarero: "Camarero",
  cocinero: "Cocinero",
  barman: "Barman",
};

export default function ControlTurnosPanel() {
  const { usuarios, loading, refetch } = useTurnosAcceso();
  const [msg, setMsg] = useState(null);
  const [toggling, setToggling] = useState(null); // userId being toggled

  const handleToggle = async (userId, newValue) => {
    setToggling(userId);
    try {
      await toggleTurnoUsuario(userId, newValue);
      refetch();
      setMsg(null);
    } catch (err) {
      setMsg({ t: "error", m: err?.response?.data?.message || "Error al cambiar turno" });
    } finally {
      setToggling(null);
    }
  };

  const handleBulk = async (turnoActivo) => {
    const nonAdminIds = usuarios
      .filter(u => !["admin_restaurante", "superadmin", "admin_shop"].includes(u.role))
      .map(u => u._id);
    if (!nonAdminIds.length) return;
    try {
      await bulkToggleTurnos(nonAdminIds, turnoActivo);
      refetch();
      setMsg({ t: "ok", m: turnoActivo === true ? "Todos activados" : turnoActivo === false ? "Todos desactivados" : "Restaurado a automático" });
    } catch (err) {
      setMsg({ t: "error", m: "Error en acción masiva" });
    }
  };

  if (loading) {
    return (
      <div className="ct-root">
        <div className="sug-loading">Cargando estado de turnos...</div>
      </div>
    );
  }

  const activos = usuarios.filter(u => u.enTurnoAhora);
  const inactivos = usuarios.filter(u => !u.enTurnoAhora);

  return (
    <div className="ct-root">
      {/* Header */}
      <div className="sug-header">
        <div>
          <h2>Control de acceso</h2>
          <p className="sug-header__sub">
            Gestiona quién puede acceder al TPV ahora mismo.
            {activos.length > 0 && <span className="ct-count-badge ct-count-badge--on">{activos.length} en turno</span>}
            {inactivos.length > 0 && <span className="ct-count-badge ct-count-badge--off">{inactivos.length} fuera</span>}
          </p>
        </div>
        <div className="ct-bulk-actions">
          <button className="sug-btn sug-btn--secondary ct-bulk-btn" onClick={() => handleBulk(true)} title="Activar todos">
            Activar todos
          </button>
          <button className="sug-btn sug-btn--secondary ct-bulk-btn" onClick={() => handleBulk(false)} title="Desactivar todos">
            Desactivar todos
          </button>
          <button className="sug-btn sug-btn--secondary ct-bulk-btn" onClick={() => handleBulk(null)} title="Restaurar modo automático">
            Auto
          </button>
        </div>
      </div>

      {msg && (
        <div className={`sug-toast sug-toast--${msg.t === "ok" ? "ok" : "error"}`}>
          {msg.m}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", color: "inherit" }}>✕</button>
        </div>
      )}

      {/* Employee list */}
      <div className="ct-grid">
        {usuarios.map(u => {
          const isAdmin = ["admin_restaurante", "superadmin", "admin_shop"].includes(u.role);
          const isToggling = toggling === u._id;

          return (
            <div key={u._id} className={`ct-card ${u.enTurnoAhora ? "ct-card--on" : "ct-card--off"} ${isAdmin ? "ct-card--admin" : ""}`}>
              <div className="ct-card-left">
                <div className={`ct-avatar ${u.enTurnoAhora ? "ct-avatar--on" : "ct-avatar--off"}`}>
                  {u.avatarUrl
                    ? <img src={u.avatarUrl} alt="" className="ct-avatar-img" />
                    : <span className="ct-avatar-letter">{u.name?.[0]?.toUpperCase() || "?"}</span>
                  }
                </div>
                <div className="ct-info">
                  <span className="ct-name">{u.name}</span>
                  <span className="ct-role">{ROLES_LABEL[u.role] || u.role}</span>
                  {u.enTurnoAhora && u.turnoActual && (
                    <span className="ct-turno-info">
                      {u.turnoActual.horaInicio} - {u.turnoActual.horaFin}
                      {u.turnoActual.turnoNombre && ` (${u.turnoActual.turnoNombre})`}
                    </span>
                  )}
                  {!u.enTurnoAhora && u.proximoTurno && (
                    <span className="ct-proximo">
                      Siguiente: {u.proximoTurno.horaInicio} - {u.proximoTurno.horaFin}
                      {u.proximoTurno.esHoy ? " hoy" : ""}
                    </span>
                  )}
                </div>
              </div>

              <div className="ct-card-right">
                {isAdmin ? (
                  <span className="ct-badge ct-badge--admin">Siempre activo</span>
                ) : (
                  <div className="ct-toggle-group">
                    <button
                      className={`ct-toggle-btn ${u.turnoActivo === null ? "ct-toggle-btn--active ct-toggle-btn--auto" : ""}`}
                      onClick={() => handleToggle(u._id, null)}
                      disabled={isToggling}
                      title="Automático (según horario)"
                    >
                      Auto
                    </button>
                    <button
                      className={`ct-toggle-btn ${u.turnoActivo === true ? "ct-toggle-btn--active ct-toggle-btn--on" : ""}`}
                      onClick={() => handleToggle(u._id, true)}
                      disabled={isToggling}
                      title="Forzar acceso"
                    >
                      ON
                    </button>
                    <button
                      className={`ct-toggle-btn ${u.turnoActivo === false ? "ct-toggle-btn--active ct-toggle-btn--off" : ""}`}
                      onClick={() => handleToggle(u._id, false)}
                      disabled={isToggling}
                      title="Bloquear acceso"
                    >
                      OFF
                    </button>
                  </div>
                )}

                <div className={`ct-status-dot ${u.enTurnoAhora ? "ct-status-dot--on" : "ct-status-dot--off"}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="ct-legend">
        <span className="ct-legend-item"><span className="ct-dot ct-dot--green" /> En turno</span>
        <span className="ct-legend-item"><span className="ct-dot ct-dot--gray" /> Fuera de turno</span>
        <span className="ct-legend-item"><span className="ct-dot ct-dot--blue" /> Auto = según horario publicado</span>
      </div>
    </div>
  );
}
