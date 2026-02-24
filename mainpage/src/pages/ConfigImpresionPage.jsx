// src/pages/ConfigImpresionPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useConfig } from "../context/ConfigContext.jsx";
import "../styles/ConfigImpresionPage.css";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje";

export default function ConfigImpresionPage() {
  const navigate = useNavigate();

  const { config, setConfig } = useConfig(); // ✅ si existe setConfig en tu context

  const [impCocina, setImpCocina] = useState("");
  const [impBarra, setImpBarra] = useState("");
  const [impCaja, setImpCaja] = useState("");
  const [impTickets, setImpTickets] = useState("");

  const [impresoras, setImpresoras] = useState([]);
  const [estado, setEstado] = useState("unknown");
  const [loading, setLoading] = useState(false);
  const [alerta, setAlerta] = useState(null);

  useEffect(() => {
    setImpCocina(config?.impresion?.impresoras?.cocina || "");
    setImpBarra(config?.impresion?.impresoras?.barra || "");
    setImpCaja(config?.impresion?.impresoras?.caja || "");
    setImpTickets(config?.impresion?.impresoras?.tickets || "");
  }, [config]);

  const valoresActuales = useMemo(
    () => [impCocina, impBarra, impCaja, impTickets].filter(Boolean),
    [impCocina, impBarra, impCaja, impTickets]
  );

  const listarImpresoras = async () => {
    try {
      setLoading(true);
      setAlerta({ tipo: "info", mensaje: "🔎 Buscando impresoras..." });

      const { data } = await api.get("/impresoras/listar");
      const lista = Array.isArray(data?.impresoras) ? data.impresoras : [];

      setImpresoras(lista);
      setEstado(data?.estado || "unknown");

      setAlerta({
        tipo: "success",
        mensaje: `✅ Se detectaron ${lista.length} impresoras`,
      });
    } catch (e) {
      setEstado(e?.response?.data?.estado || "unknown");
      setAlerta({
        tipo: "error",
        mensaje:
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          "❌ No se pudo obtener la lista de impresoras",
      });
    } finally {
      setLoading(false);
    }
  };

  const guardar = async () => {
    try {
      setLoading(true);
      setAlerta({ tipo: "info", mensaje: "💾 Guardando configuración..." });

      const { data } = await api.post("/impresoras/configurar", {
        impresoras: {
          cocina: impCocina,
          barra: impBarra,
          caja: impCaja,
          tickets: impTickets,
        },
      });

      // ✅ refresca context si viene config
      if (data?.config && typeof setConfig === "function") {
        setConfig(data.config);
      }

      setAlerta({ tipo: "success", mensaje: "✅ Configuración guardada" });
    } catch (e) {
      setAlerta({
        tipo: "error",
        mensaje:
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          "❌ Error al guardar",
      });
    } finally {
      setLoading(false);
    }
  };

  const testPrint = async (estacion) => {
    try {
      setLoading(true);
      setAlerta({
        tipo: "info",
        mensaje: `🧾 Enviando prueba (${estacion})...`,
      });

      const { data } = await api.post("/impresoras/test", { estacion });

      setEstado(data?.estado || estado);
      setAlerta({
        tipo: "success",
        mensaje: data?.message || `✅ Prueba enviada (${estacion})`,
      });
    } catch (e) {
      setEstado(e?.response?.data?.estado || "unknown");
      setAlerta({
        tipo: "error",
        mensaje:
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          `❌ Error al enviar prueba (${estacion})`,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderOptions = () => {
    const merged = Array.from(new Set([...valoresActuales, ...impresoras])).sort();
    return (
      <>
        <option value="">-- (sin asignar / usar predeterminada) --</option>
        {merged.map((imp) => (
          <option key={imp} value={imp}>
            {imp}
          </option>
        ))}
      </>
    );
  };

  const estadoLabel =
    estado === "online"
      ? "🟢 Online"
      : estado === "offline"
      ? "🔴 Offline"
      : "🟡 Unknown";

  return (
    <main className="section section--wide">
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
          autoCerrar
          duracion={3200}
        />
      )}

      <div className="card config-impresion">
        <h1>🖨️ Impresión</h1>
        <p className="text-suave">
          Asigna impresoras por estación. Si lo dejas vacío, el servidor/agente
          usará la predeterminada.
        </p>

        {/* ✅ Botón para ir al Centro de Impresión */}
        <div className="config-impresion__actions">
          <button
            className="btn"
            onClick={() => navigate("/configuracion/impresion/centro")}
            disabled={loading}
            title="Ver cola de impresión, reintentar y recuperar fallos"
          >
            🧭 Centro de impresión
          </button>

          <button
            className="btn btn-primario"
            onClick={listarImpresoras}
            disabled={loading}
          >
            🔍 Listar impresoras
          </button>

          <button
            className="btn btn--primario"
            onClick={guardar}
            disabled={loading}
          >
            💾 Guardar
          </button>
        </div>

        <div className="config-impresion__grid">
          <div className="config-impresion__field">
            <label>Impresora Cocina</label>
            <select
              value={impCocina}
              onChange={(e) => setImpCocina(e.target.value)}
              disabled={loading}
            >
              {renderOptions()}
            </select>
          </div>

          <div className="config-impresion__field">
            <label>Impresora Barra</label>
            <select
              value={impBarra}
              onChange={(e) => setImpBarra(e.target.value)}
              disabled={loading}
            >
              {renderOptions()}
            </select>
          </div>

          <div className="config-impresion__field">
            <label>Impresora Caja</label>
            <select
              value={impCaja}
              onChange={(e) => setImpCaja(e.target.value)}
              disabled={loading}
            >
              {renderOptions()}
            </select>
          </div>

          <div className="config-impresion__field">
            <label>Impresora Tickets</label>
            <select
              value={impTickets}
              onChange={(e) => setImpTickets(e.target.value)}
              disabled={loading}
            >
              {renderOptions()}
            </select>
          </div>
        </div>

        <div className="config-impresion__actions">
          <button
            className="btn"
            onClick={() => testPrint("cocina")}
            disabled={loading}
          >
            🧾 Probar Cocina
          </button>
          <button
            className="btn"
            onClick={() => testPrint("barra")}
            disabled={loading}
          >
            🧾 Probar Barra
          </button>
          <button
            className="btn"
            onClick={() => testPrint("caja")}
            disabled={loading}
          >
            🧾 Probar Caja
          </button>
          <button
            className="btn"
            onClick={() => testPrint("tickets")}
            disabled={loading}
          >
            🧾 Probar Tickets
          </button>
        </div>

        <p className="text-suave">
          Estado agente: <b>{estadoLabel}</b>
        </p>
      </div>
    </main>
  );
}