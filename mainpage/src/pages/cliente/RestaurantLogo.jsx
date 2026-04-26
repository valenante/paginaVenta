import React, { useState } from "react";

/**
 * Avatar visual del restaurante. Muestra el logo si existe; si no, un círculo
 * con gradiente Alef y la inicial del nombre. Reutilizable en cards y heros.
 */
export default function RestaurantLogo({ nombre = "", logoUrl = null, size = 44 }) {
  const [error, setError] = useState(false);
  const inicial = (nombre || "?").charAt(0).toUpperCase();

  const styleBase = {
    width: size,
    height: size,
    borderRadius: 12,
    flexShrink: 0,
  };

  if (logoUrl && !error) {
    return (
      <img
        src={logoUrl}
        alt={`Logo ${nombre}`}
        onError={() => setError(true)}
        className="cli-rest-logo cli-rest-logo--img"
        style={{ ...styleBase, objectFit: "cover" }}
      />
    );
  }

  return (
    <div
      className="cli-rest-logo cli-rest-logo--fallback"
      style={{
        ...styleBase,
        background: "linear-gradient(135deg, #60b5ff, #2f7ed8)",
        color: "#fff",
        fontWeight: 800,
        fontSize: size * 0.42,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 10px rgba(96, 181, 255, 0.25)",
      }}
      aria-label={nombre}
    >
      {inicial}
    </div>
  );
}
