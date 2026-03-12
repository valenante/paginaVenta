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

  const asignacionInicial = useMemo(
    () => ({
      cocina: config?.impresion?.impresoras?.cocina || "",
      barra: config?.impresion?.impresoras?.barra || "",
      caja: config?.impresion?.impresoras?.caja || "",
      tickets: config?.impresion?.impresoras?.tickets || "",
    }),
    [config]
  );

  const asignacionActual = useMemo(
    () => ({
      cocina: impCocina,
      barra: impBarra,
      caja: impCaja,
      tickets: impTickets,
    }),
    [impCocina, impBarra, impCaja, impTickets]
  );

  const hasChanges = useMemo(() => {
    return JSON.stringify(asignacionActual) !== JSON.stringify(asignacionInicial);
  }, [asignacionActual, asignacionInicial]);

  const valoresActuales = useMemo(
    () => [impCocina, impBarra, impCaja, impTickets].filter(Boolean),
    [impCocina, impBarra, impCaja, impTickets]
  );

  const opcionesImpresoras = useMemo(() => {
    return Array.from(new Set([...valoresActuales, ...impresoras])).sort();
  }, [valoresActuales, impresoras]);

  const estadoFromError = (e) => {
    const f = e?.fields?.estado;
    if (f === "online" || f === "offline" || f === "unknown") return f;

    if (e?.code === "PRINT_AGENT_OFFLINE") return "offline";
    if (e?.code === "PRINT_AGENT_UNAUTHORIZED") return "offline";

    return "unknown";
  };

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
      setImpresoras([]);
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

      const patch = {
        "impresion.impresoras": {
          cocina: impCocina,
          barra: impBarra,
          caja: impCaja,
          tickets: impTickets,
        },
      };

      const { data: draft } = await api.post("/admin/config/versions", {
        patch,
        scope: "impresion_config",
        reason,
      });

      const versionId = draft?.version?.id || draft?.versionId || draft?.id;
      if (!versionId) throw new Error("No se recibió versionId del draft");

      await api.post(`/admin/config/versions/${versionId}/apply`, { reason });
      await refreshConfig();

      setSuccess("Configuración guardada correctamente ✅");
    } catch (err) {
      const normalized = normalizeApiError(err);
      setError({
        ...normalized,
        retryFn: () => guardar(reason),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (reason = "Rollback impresión") => {
    setSuccess(null);
    setError(null);

    try {
      setLoading(true);

      await api.post("/admin/config/rollback", { reason });
      await refreshConfig();
      await listarImpresoras();

      setSuccess("Rollback aplicado ✅");
    } catch (err) {
      const normalized = normalizeApiError(err);
      setError({
        ...normalized,
        retryFn: () => handleRollback(reason),
      });
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

  const estadoLabel =
    estado === "online"
      ? "Agente online"
      : estado === "offline"
        ? "Agente offline"
        : "Estado desconocido";

  const estadoClass =
    estado === "online"
      ? "print-config-status--online"
      : estado === "offline"
        ? "print-config-status--offline"
        : "print-config-status--unknown";

  const saveDisabledReason = !hasChanges
    ? "No hay cambios para guardar"
    : "";

  return (
    <main className="print-config-page section section--wide">
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

      <header className="print-config-header">
        <div>
          <h1>🖨️ Configuración de impresión</h1>
          <p className="text-suave">
            Asigna impresoras por estación, valida el agente local y realiza
            pruebas sin salir del flujo de configuración de Alef.
          </p>
        </div>

        <div className="print-config-header-status">
          <span className={`print-config-status ${estadoClass}`}>
            <span className="print-config-status__dot" />
            {estadoLabel}
          </span>
        </div>
      </header>

      <div className="print-config-layout">
        <div className="print-config-main">
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Agente y herramientas</h2>
                <p className="config-card-subtitle">
                  Consulta el estado del agente, detecta impresoras conectadas y
                  entra al centro de impresión para revisar cola, reintentos y
                  fallos.
                </p>
              </div>
            </div>

            <div className="print-config-toolbar">
              <button
                type="button"
                className="btn"
                onClick={() => navigate("/configuracion/impresion/centro")}
                disabled={loading}
                title="Ver cola de impresión, reintentar y recuperar fallos"
              >
                🧭 Centro de impresión
              </button>

              <button
                type="button"
                className="btn btn-primario"
                onClick={listarImpresoras}
                disabled={loading}
              >
                🔍 Listar impresoras
              </button>
            </div>

            <div className="print-config-stats">
              <article className="print-config-stat">
                <span className="print-config-stat__label">Estado del agente</span>
                <strong>{estadoLabel}</strong>
              </article>

              <article className="print-config-stat">
                <span className="print-config-stat__label">Impresoras detectadas</span>
                <strong>{impresoras.length}</strong>
              </article>

              <article className="print-config-stat">
                <span className="print-config-stat__label">Estaciones configuradas</span>
                <strong>
                  {Object.values(asignacionActual).filter(Boolean).length} / 4
                </strong>
              </article>
            </div>
          </section>

          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Asignación por estación</h2>
                <p className="config-card-subtitle">
                  Si una estación queda vacía, el servidor o el agente usarán la
                  impresora predeterminada.
                </p>
              </div>
            </div>

            <div className="print-config-grid">
              <div className="config-field">
                <label htmlFor="imp-cocina">Impresora Cocina</label>
                <select
                  id="imp-cocina"
                  value={impCocina}
                  onChange={(e) => setImpCocina(e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Sin asignar / usar predeterminada --</option>
                  {opcionesImpresoras.map((imp) => (
                    <option key={imp} value={imp}>
                      {imp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="config-field">
                <label htmlFor="imp-barra">Impresora Barra</label>
                <select
                  id="imp-barra"
                  value={impBarra}
                  onChange={(e) => setImpBarra(e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Sin asignar / usar predeterminada --</option>
                  {opcionesImpresoras.map((imp) => (
                    <option key={imp} value={imp}>
                      {imp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="config-field">
                <label htmlFor="imp-caja">Impresora Caja</label>
                <select
                  id="imp-caja"
                  value={impCaja}
                  onChange={(e) => setImpCaja(e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Sin asignar / usar predeterminada --</option>
                  {opcionesImpresoras.map((imp) => (
                    <option key={imp} value={imp}>
                      {imp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="config-field">
                <label htmlFor="imp-tickets">Impresora Tickets</label>
                <select
                  id="imp-tickets"
                  value={impTickets}
                  onChange={(e) => setImpTickets(e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Sin asignar / usar predeterminada --</option>
                  {opcionesImpresoras.map((imp) => (
                    <option key={imp} value={imp}>
                      {imp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="print-config-note">
              Consejo: usa “Listar impresoras” antes de guardar si acabas de
              conectar una impresora nueva al equipo local.
            </p>
          </section>

          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Pruebas por estación</h2>
                <p className="config-card-subtitle">
                  Envía tickets de prueba a cada estación para validar conexión,
                  nombre de impresora y respuesta del agente.
                </p>
              </div>
            </div>

            <div className="print-config-tests">
              <button
                type="button"
                className="btn"
                onClick={() => testPrint("cocina")}
                disabled={loading}
              >
                🧾 Probar Cocina
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => testPrint("barra")}
                disabled={loading}
              >
                🧾 Probar Barra
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => testPrint("caja")}
                disabled={loading}
              >
                🧾 Probar Caja
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => testPrint("tickets")}
                disabled={loading}
              >
                🧾 Probar Tickets
              </button>
            </div>
          </section>
        </div>
      </div>

      <div className="print-config-actions">
        <button
          type="button"
          className="btn btn-primario"
          onClick={() => guardar("Cambios impresión")}
          disabled={loading || !hasChanges}
          title={saveDisabledReason}
        >
          {loading ? "Guardando..." : "Guardar configuración"}
        </button>

        <button
          type="button"
          className="btn btn-secundario"
          onClick={() => handleRollback("Rollback impresión")}
          disabled={loading}
        >
          Revertir último cambio
        </button>
      </div>
    </main>
  );
}