// src/pages/PanelPro.jsx
import React, { useState } from "react";

// Módulos / páginas
import EstadisticasPage from "./EstadisticasPage";
import CajaDiaria from "../components/CajaDiariaUltraPro/CajaDiariaUltraPro";
import UsuariosPage from "../components/Usuarios/UsuariosPage";
import MapaEditor from "./MapaEditor";
import ProductsPage from "./ProductsMenu"; // 🆕 Gestión de productos / extras

import "../styles/PanelPro.css";

const PanelPro = () => {
  const [active, setActive] = useState("estadisticas");

  return (
    <div className="panelpro-root">
      {/* ====== TABS SUPERIORES ====== */}
      <div className="panelpro-tabs">
        <button
          className={active === "estadisticas" ? "active" : ""}
          onClick={() => setActive("estadisticas")}
        >
          📊 Estadísticas
        </button>

        <button
          className={active === "caja" ? "active" : ""}
          onClick={() => setActive("caja")}
        >
          💶 Caja diaria
        </button>

        <button
          className={active === "usuarios" ? "active" : ""}
          onClick={() => setActive("usuarios")}
        >
          👥 Usuarios
        </button>

        <button
          className={active === "mapa" ? "active" : ""}
          onClick={() => setActive("mapa")}
        >
          🗺️ Mapa del restaurante
        </button>

        {/* 🆕 NUEVA PESTAÑA: Productos / Carta */}
        <button
          className={active === "productos" ? "active" : ""}
          onClick={() => setActive("productos")}
        >
          🧾 Carta y productos
        </button>
      </div>

      {/* ====== CONTENIDO ====== */}
      <div className="panelpro-content">
        {active === "estadisticas" && <EstadisticasPage type="plato" />}
        {active === "caja" && <CajaDiaria />}
        {active === "usuarios" && <UsuariosPage />}
        {active === "mapa" && <MapaEditor />}
        {active === "productos" && <ProductsPage />} {/* 🆕 */}
      </div>
    </div>
  );
};

export default PanelPro;
