// src/pages/ConfigImpresionShopPage.jsx
import { useEffect, useState } from "react";
import api from "../utils/api";
import { useConfig } from "../context/ConfigContext.jsx";
import "../styles/ConfigImpresionPage.css";

import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje"; // <- ajusta ruta

export default function ConfigImpresionShopPage() {
  const { config } = useConfig();

  const [impCaja, setImpCaja] = useState("");
  const [impTickets, setImpTickets] = useState("");

  const [impresoras, setImpresoras] = useState([]);
  const [estado, setEstado] = useState("unknown");
  const [loading, setLoading] = useState(false);

  // ✅ ALERTA
  const [alerta, setAlerta] = useState(null);

  /* =====================
     Cargar configuración
  ===================== */
  useEffect(() => {
    setImpCaja(config?.impresion?.impresoras?.caja || "");
    setImpTickets(config?.impresion?.impresoras?.tickets || "");
  }, [config]);

  /* =====================
     Listar impresoras
  ===================== */
  const listarImpresoras = async () => {
    try {
      setLoading(true);
      setAlerta({ tipo: "info", mensaje: "🔎 Buscando impresoras..." });

      const { data } = await api.get("/impresoras/listar");
      const lista = Array.isArray(data?.impresoras) ? data.impresoras : [];

      setImpresoras(lista);
      setEstado(data?.estado || "unknown");

      setAlerta({
        tipo: "exito",
        mensaje: `✅ Se detectaron ${lista.length} impresoras`,
      });
    } catch (e) {
      console.error(e);
      setAlerta({
        tipo: "error",
        mensaje:
          e?.response?.data?.error ||
          "❌ No se pudo obtener la lista de impresoras",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     Guardar configuración
  ===================== */
  const guardar = async () => {
    try {
      setLoading(true);
      setAlerta({ tipo: "info", mensaje: "💾 Guardando configuración..." });

      await api.post("/impresoras/configurar", {
        impresoras: {
          caja: impCaja,
          tickets: impTickets,
        },
      });

      setAlerta({ tipo: "exito", mensaje: "✅ Configuración guardada" });
    } catch (e) {
      console.error(e);
      setAlerta({
        tipo: "error",
        mensaje:
          e?.response?.data?.error || "❌ Error al guardar la configuración",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     Test impresión
  ===================== */
  const testPrint = async (impresora, label) => {
    try {
      setLoading(true);
      setAlerta({ tipo: "info", mensaje: `🧾 Enviando prueba (${label})...` });

      const { data } = await api.post("/impresoras/test", {
        impresora: impresora || "",
      });

      setAlerta({
        tipo: "exito",
        mensaje: data?.message || `✅ Prueba enviada (${label})`,
      });
    } catch (e) {
      console.error(e);
      setAlerta({
        tipo: "error",
        mensaje:
          e?.response?.data?.error || `❌ Error al enviar prueba (${label})`,
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     Render options
  ===================== */
  const renderOptions = () => (
    <>
      <option value="">-- (sin asignar / usar predeterminada) --</option>
      {impresoras.map((imp) => (
        <option key={imp} value={imp}>
          {imp}
        </option>
      ))}
    </>
  );

  /* =====================
     Render
  ===================== */
  return (
    <main className="section section--wide">
      {/* ✅ ALERTA ARRIBA */}
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
          autoCerrar
          duracion={3000}
        />
      )}

      <div className="card config-impresion">
        <h1>🖨️ Impresión</h1>

        <p className="text-suave">
          Configura las impresoras de la tienda. Si no asignas ninguna, el
          servidor usará la impresora predeterminada del sistema.
        </p>

        <div className="config-impresion__grid">
          <div className="config-impresion__field">
            <label>Impresora de Caja</label>
            <select value={impCaja} onChange={(e) => setImpCaja(e.target.value)}>
              {renderOptions()}
            </select>
          </div>

          <div className="config-impresion__field">
            <label>Impresora de Tickets</label>
            <select
              value={impTickets}
              onChange={(e) => setImpTickets(e.target.value)}
            >
              {renderOptions()}
            </select>
          </div>
        </div>

        <div className="config-impresion__actions">
          <button className="btn" onClick={listarImpresoras} disabled={loading}>
            🔍 Listar impresoras
          </button>

          <button
            className="btn btn--primary"
            onClick={guardar}
            disabled={loading}
          >
            💾 Guardar
          </button>
        </div>

        <div className="config-impresion__actions">
          <button
            className="btn"
            onClick={() => testPrint(impCaja, "Caja")}
            disabled={loading}
          >
            🧾 Probar Caja
          </button>

          <button
            className="btn"
            onClick={() => testPrint(impTickets, "Tickets")}
            disabled={loading}
          >
            🧾 Probar Tickets
          </button>
        </div>

        <p className="text-suave">
          Estado del servicio de impresión: <b>{estado}</b>
        </p>
      </div>
    </main>
  );
}
