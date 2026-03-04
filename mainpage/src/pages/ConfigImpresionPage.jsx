// src/pages/ConfigImpresionPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useConfig } from "../context/ConfigContext.jsx";
import "../styles/ConfigImpresionPage.css";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje";
import { normalizeApiError } from "../utils/normalizeApiError.js";
import ErrorToast from "../components/common/ErrorToast.jsx";

export default function ConfigImpresionPage() {
  const navigate = useNavigate();

  const { config, refreshConfig } = useConfig();

  const [impCocina, setImpCocina] = useState("");
  const [impBarra, setImpBarra] = useState("");
  const [impCaja, setImpCaja] = useState("");
  const [impTickets, setImpTickets] = useState("");

  const [impresoras, setImpresoras] = useState([]);
  const [estado, setEstado] = useState("unknown");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
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
    setSuccess(null);
    setError(null);

    try {
      setLoading(true);

      const { data } = await api.get("/impresoras/listar");

      const lista = Array.isArray(data?.impresoras) ? data.impresoras : [];

      setImpresoras(lista);
      setEstado(data?.estado || "unknown");

      setSuccess(`Se detectaron ${lista.length} impresoras`);
    } catch (err) {
      const normalized = normalizeApiError(err);

      setEstado(estadoFromError(normalized));
      setImpresoras([]); // opcional: limpiar lista si está offline

      setError({
        ...normalized,
        retryFn: listarImpresoras,
      });
    } finally {
      setLoading(false);
    }
  };

  const guardar = async (reason = "Cambios impresión") => {
    setSuccess(null);
    setError(null);

    try {
      setLoading(true);

      // ✅ patch mínimo y seguro (solo impresión.impresoras)
      const patch = {
        "impresion.impresoras": {
          cocina: impCocina,
          barra: impBarra,
          caja: impCaja,
          tickets: impTickets,
        },
      };

      // 1) Draft
      const { data: draft } = await api.post("/admin/config/versions", {
        patch,
        scope: "impresion_config",
        reason,
      });

      const versionId = draft?.version?.id || draft?.versionId || draft?.id;
      if (!versionId) throw new Error("No se recibió versionId del draft");

      // 2) Apply (aquí entra tu CONFIG_PREFLIGHT si impresión falla)
      await api.post(`/admin/config/versions/${versionId}/apply`, { reason });

      // 3) Refresh config para actualizar selects (y contexto global)
      await refreshConfig();
      setSuccess("Configuración guardada correctamente ✅");
    } catch (err) {
      const normalized = normalizeApiError(err);
      setError({ ...normalized, retryFn: () => guardar(reason) });
    } finally {
      setLoading(false);
    }
  };

  const testPrint = async (estacion) => {
    setSuccess(null);
    setError(null);

    try {
      setLoading(true);

      const { data } = await api.post("/impresoras/test", { estacion });

      setEstado(data?.estado || estado);
      setSuccess(data?.message || `Prueba enviada (${estacion})`);
    } catch (err) {
      const normalized = normalizeApiError(err);

      setEstado(estadoFromError(normalized));

      setError({
        ...normalized,
        retryFn: () => testPrint(estacion),
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

  const estadoFromError = (e) => {
    const f = e?.fields?.estado;
    if (f === "online" || f === "offline" || f === "unknown") return f;

    if (e?.code === "PRINT_AGENT_OFFLINE") return "offline";
    if (e?.code === "PRINT_AGENT_UNAUTHORIZED") return "offline";

    return "unknown";
  };

  const estadoLabel =
    estado === "online"
      ? "🟢 Online"
      : estado === "offline"
        ? "🔴 Offline"
        : "🟡 Unknown";

  return (
    <main className="section section--wide">
      {success && (
        <AlertaMensaje
          tipo="success"
          mensaje={success}
          onClose={() => setSuccess(null)}
          autoCerrar
          duracion={3200}
        />
      )}

      {error && (
        <ErrorToast
          error={error}
          onRetry={error.canRetry ? error.retryFn : undefined}
          onClose={() => setError(null)}
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
            onClick={() => guardar("Cambios impresión")}
            disabled={loading}
          >
            💾 Guardar
          </button>

          <button
            className="btn"
            onClick={() =>
              api
                .post("/admin/config/rollback", { reason: "Rollback impresión" })
                .then(async () => {
                  await refreshConfig();
                  await listarImpresoras();
                  setSuccess("Rollback aplicado ✅");
                })
                .catch((err) =>
                  setError({ ...normalizeApiError(err), retryFn: () => guardar("Cambios impresión") })
                )
            }
            disabled={loading}
          >
            ↩️ Rollback
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