// src/pages/ConfigImpresionPage.jsx
import { useEffect, useState } from "react";
import api from "../utils/api";
import { useConfig } from "../context/ConfigContext.jsx";
import "../styles/ConfigImpresionPage.css";

import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje"; // <- ajusta ruta

export default function ConfigImpresionPage() {
  const { config } = useConfig();

  const [impCocina, setImpCocina] = useState("");
  const [impBarra, setImpBarra] = useState("");
  const [impCaja, setImpCaja] = useState("");

  const [impresoras, setImpresoras] = useState([]);
  const [estado, setEstado] = useState("unknown");

  const [loading, setLoading] = useState(false);

  // ✅ ALERTA
  const [alerta, setAlerta] = useState(null);

  // cargar desde config
  useEffect(() => {
    setImpCocina(config?.impresion?.impresoras?.cocina || "");
    setImpBarra(config?.impresion?.impresoras?.barra || "");
    setImpCaja(config?.impresion?.impresoras?.caja || "");
  }, [config]);

  const listarImpresoras = async () => {
    try {
      setLoading(true);
      setAlerta({ tipo: "info", mensaje: "🔎 Buscando impresoras..." });

      // ✅ versión usuario: sin tenantId en URL (attachTenant resuelve)
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
          e?.response?.data?.error || "❌ No se pudo obtener la lista de impresoras",
      });
    } finally {
      setLoading(false);
    }
  };

  const guardar = async () => {
    try {
      setLoading(true);
      setAlerta({ tipo: "info", mensaje: "💾 Guardando configuración..." });

      await api.post("/impresoras/configurar", {
        impresoras: {
          cocina: impCocina,
          barra: impBarra,
          caja: impCaja,
        },
      });

      setAlerta({ tipo: "exito", mensaje: "✅ Configuración guardada" });
    } catch (e) {
      console.error(e);
      setAlerta({
        tipo: "error",
        mensaje: e?.response?.data?.error || "❌ Error al guardar",
      });
    } finally {
      setLoading(false);
    }
  };

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
        mensaje: e?.response?.data?.error || `❌ Error al enviar prueba (${label})`,
      });
    } finally {
      setLoading(false);
    }
  };

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
          Asigna impresoras por estación. Si dejas vacío, el servidor usará su
          predeterminada.
        </p>

        <div className="config-impresion__grid">
          <div className="config-impresion__field">
            <label>Impresora Cocina</label>
            <select value={impCocina} onChange={(e) => setImpCocina(e.target.value)}>
              {renderOptions()}
            </select>
          </div>

          <div className="config-impresion__field">
            <label>Impresora Barra</label>
            <select value={impBarra} onChange={(e) => setImpBarra(e.target.value)}>
              {renderOptions()}
            </select>
          </div>

          <div className="config-impresion__field">
            <label>Impresora Caja</label>
            <select value={impCaja} onChange={(e) => setImpCaja(e.target.value)}>
              {renderOptions()}
            </select>
          </div>
        </div>

        <div className="config-impresion__actions">
          <button className="btn" onClick={listarImpresoras} disabled={loading}>
            🔍 Listar impresoras
          </button>
          <button className="btn btn--primary" onClick={guardar} disabled={loading}>
            💾 Guardar
          </button>
        </div>

        <div className="config-impresion__actions">
          <button
            className="btn"
            onClick={() => testPrint(impCocina, "Cocina")}
            disabled={loading}
          >
            🧾 Probar Cocina
          </button>
          <button
            className="btn"
            onClick={() => testPrint(impBarra, "Barra")}
            disabled={loading}
          >
            🧾 Probar Barra
          </button>
          <button
            className="btn"
            onClick={() => testPrint(impCaja, "Caja")}
            disabled={loading}
          >
            🧾 Probar Caja
          </button>
        </div>

        <p className="text-suave">
          Estado: <b>{estado}</b>
        </p>
      </div>
    </main>
  );
}
