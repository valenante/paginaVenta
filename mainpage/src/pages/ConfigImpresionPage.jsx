// src/pages/ConfigImpresionPage.jsx
import { useEffect, useState } from "react";
import api from "../utils/api";
import { useConfig } from "../context/ConfigContext.jsx";
import "../styles/ConfigImpresionPage.css";

export default function ConfigImpresionPage() {
  const { config } = useConfig();

  const [impCocina, setImpCocina] = useState("");
  const [impBarra, setImpBarra] = useState("");
  const [impCaja, setImpCaja] = useState("");

  const [impresoras, setImpresoras] = useState([]);
  const [estado, setEstado] = useState("unknown");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  // cargar desde config
  useEffect(() => {
    setImpCocina(config?.impresion?.impresoras?.cocina || "");
    setImpBarra(config?.impresion?.impresoras?.barra || "");
    setImpCaja(config?.impresion?.impresoras?.caja || "");
  }, [config]);

  const listarImpresoras = async () => {
    try {
      setLoading(true);
      setMensaje("🔎 Buscando impresoras...");
      // ✅ versión usuario: sin tenantId en URL (attachTenant resuelve)
      const { data } = await api.get("/impresoras/listar");
      const lista = Array.isArray(data?.impresoras) ? data.impresoras : [];
      setImpresoras(lista);
      setEstado(data?.estado || "unknown");
      setMensaje(`✅ Se detectaron ${lista.length} impresoras`);
    } catch (e) {
      console.error(e);
      setMensaje("❌ No se pudo obtener la lista de impresoras");
    } finally {
      setLoading(false);
    }
  };

 const guardar = async () => {
  try {
    setLoading(true);
    setMensaje("💾 Guardando configuración...");

    await api.post("/impresoras/configurar", {
      impresoras: {
        cocina: impCocina,
        barra: impBarra,
        caja: impCaja,
      },
    });

    setMensaje("✅ Guardado");
  } catch (e) {
    console.error(e);
    setMensaje("❌ Error al guardar");
  } finally {
    setLoading(false);
  }
};

  const testPrint = async (impresora) => {
    try {
      setLoading(true);
      setMensaje("🧾 Enviando prueba...");
      const { data } = await api.post("/impresoras/test", {
        impresora: impresora || "",
      });
      setMensaje(data?.message || "✅ Prueba enviada");
    } catch (e) {
      console.error(e);
      setMensaje("❌ Error al enviar prueba");
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
      <div className="card config-impresion">
        <h1>🖨️ Impresión</h1>
        <p className="text-suave">
          Asigna impresoras por estación. Si dejas vacío, el servidor usará su predeterminada.
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
          <button className="btn" onClick={() => testPrint(impCocina)} disabled={loading}>
            🧾 Probar Cocina
          </button>
          <button className="btn" onClick={() => testPrint(impBarra)} disabled={loading}>
            🧾 Probar Barra
          </button>
          <button className="btn" onClick={() => testPrint(impCaja)} disabled={loading}>
            🧾 Probar Caja
          </button>
        </div>

        <p className="text-suave">
          Estado: <b>{estado}</b>
        </p>

        {mensaje && <p className="mensaje">{mensaje}</p>}
      </div>
    </main>
  );
}
