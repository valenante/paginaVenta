// src/components/TenantErrorScreen/TenantErrorScreen.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../../context/TenantContext"; // ✅ AÑADIR
import "./TenantErrorScreen.css";
import logoAlef from "../../assets/imagenes/alef.png";

export default function TenantErrorScreen({
  title = "No se pudo cargar el restaurante",
  message = "Revisa tu conexión o el enlace. Si el problema continúa, contacta con soporte.",
  error,
  onRetry,
  showDetails = false,
}) {
  const navigate = useNavigate();
  const { clearTenant } = useTenant(); // ✅ AÑADIR

  return (
    <div className="TenantErrorScreen" role="alert" aria-live="assertive">
      <div className="TenantErrorScreen-inner">
        <img src={logoAlef} alt="Alef Logo" className="TenantErrorScreen-logo" />

        <h1 className="TenantErrorScreen-title">{title}</h1>
        <p className="TenantErrorScreen-message">{message}</p>

        <div className="TenantErrorScreen-actions">
          <button
            className="TenantErrorScreen-btn TenantErrorScreen-btn--primary"
            onClick={() => onRetry?.()}
            type="button"
          >
            Reintentar
          </button>

          <button
            className="TenantErrorScreen-btn TenantErrorScreen-btn--ghost"
            onClick={() => {
              clearTenant();                 // ✅ LIMPIA
              navigate("/", { replace: true }); // ✅ reemplaza historial
            }}
            type="button"
          >
            Ir al inicio
          </button>

          <button
            className="TenantErrorScreen-btn TenantErrorScreen-btn--ghost"
            onClick={() => {
              clearTenant();                     // ✅ opcional pero recomendado
              navigate("/soporte", { replace: true });
            }}
            type="button"
          >
            Soporte
          </button>
        </div>

        {showDetails && error && (
          <details className="TenantErrorScreen-details">
            <summary>Detalles técnicos</summary>
            <pre>{String(error)}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
