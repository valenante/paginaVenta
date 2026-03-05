import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../utils/api";
import { useConfig } from "../../context/ConfigContext.jsx";
import "./PlanFeaturesPanel.css";

export default function PlanFeaturesPanel({ onAlert }) {
    const { config, setConfig } = useConfig();

    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI
    const [query, setQuery] = useState("");
    const [openCats, setOpenCats] = useState({}); // { TPV:true, Carta:false, ... }

    // para evitar “stale config” cuando actualizas y luego lees config
    const configRef = useRef(config);
    useEffect(() => {
        configRef.current = config;
    }, [config]);

    // Helper path "impresion.ticketMostrarHora"
    const getConfigValue = (cfg, path) => {
        if (!cfg || !path) return undefined;
        return path.split(".").reduce((acc, part) => (acc == null ? undefined : acc[part]), cfg);
    };

    // carga inicial
    useEffect(() => {
        const fetchFeatures = async () => {
            try {
                const { data } = await api.get("/admin/features-plan");
                setFeatures(data.features || []);
                if (data.config) setConfig(data.config);

                // abrir todas las categorías por defecto
                const cats = [...new Set((data.features || []).map((f) => f.categoria || "General"))];
                const init = {};
                cats.forEach((c) => (init[c] = false));
                setOpenCats(init);
            } catch (err) {
                onAlert?.({
                    tipo: "error",
                    mensaje: "Error al cargar funcionalidades del plan.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchFeatures();
    }, [setConfig, onAlert]);

    const handleFeatureUpdate = async (configKey, value) => {
        try {
            setLoading?.(true); // si tienes estado loading; si no, quítalo

            // ✅ UX PRO: si activas impresión cocina, exige configuración mínima
            if (configKey === "impresion.imprimirPedidosCocina" && value === true) {
                const cfg = configRef.current || config || {};
                const servidor = String(cfg?.impresion?.servidor || "").trim();
                const impresoraCocina = String(cfg?.impresion?.impresoras?.cocina || "").trim();

                if (!servidor) {
                    onAlert?.({
                        tipo: "error",
                        mensaje: "Antes de activar Cocina, configura el servidor de impresión.",
                    });
                    return;
                }

                if (!impresoraCocina) {
                    onAlert?.({
                        tipo: "error",
                        mensaje: "Antes de activar Cocina, selecciona la impresora de cocina.",
                    });
                    return;
                }
            }

            // ✅ Patch por ruta (guardrails). Si quieres, cuando activas cocina, manda también el mínimo requerido
            let patch = { [configKey]: value };

            if (configKey === "impresion.imprimirPedidosCocina" && value === true) {
                const cfg = configRef.current || config || {};
                patch = {
                    "impresion.imprimirPedidosCocina": true,
                    "impresion.servidor": String(cfg?.impresion?.servidor || "").trim(),
                    "impresion.impresoras.cocina": String(cfg?.impresion?.impresoras?.cocina || "").trim(),
                };
            }

            // 1) draft
            const { data: draft } = await api.post("/admin/config/versions", {
                patch,
                scope: "features_plan",
                reason: `Toggle feature: ${configKey} → ${value ? "ON" : "OFF"}`,
            });

            const versionId = draft?.version?.id || draft?.versionId || draft?.id;
            if (!versionId) throw new Error("No se recibió versionId del draft");

            // 2) apply
            await api.post(`/admin/config/versions/${versionId}/apply`, {
                reason: `Toggle feature: ${configKey}`,
            });

            // refresca config real
            const fresh = await api.get("/configuracion");
            setConfig(fresh?.data?.config ?? fresh?.data);

            onAlert?.({ tipo: "success", mensaje: "Cambio aplicado y auditado ✅" });
        } catch (err) {
            const payload = err?.response?.data;
            const msg =
                payload?.message ||
                payload?.error ||
                err?.message ||
                "No se pudo aplicar el cambio.";

            // ✅ si guardrails trae fields, los mostramos (sin tecnicismos)
            const fields = payload?.fields;
            const firstFieldMsg =
                fields && typeof fields === "object"
                    ? Object.values(fields)[0]
                    : null;

            console.error("[PlanFeaturesPanel] Error update:", payload || err);

            onAlert?.({
                tipo: "error",
                mensaje: firstFieldMsg ? `${msg} (${firstFieldMsg})` : msg,
            });
        } finally {
            setLoading?.(false); // si tienes estado loading; si no, quítalo
        }
    };

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return features;

        return features.filter((f) => {
            const nombre = (f.nombre || "").toLowerCase();
            const categoria = (f.categoria || "").toLowerCase();
            const key = (f.configKey || "").toLowerCase();
            return nombre.includes(q) || categoria.includes(q) || key.includes(q);
        });
    }, [features, query]);

    const grouped = useMemo(() => {
        const map = new Map();
        for (const f of filtered) {
            const cat = f.categoria || "General";
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat).push(f);
        }
        // ordena por categoría
        return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    }, [filtered]);

    const toggleCat = (cat) => {
        setOpenCats((prev) => ({ ...prev, [cat]: !prev[cat] }));
    };

    return (
        <section className="config-card card">
            <header className="config-card-header">
                <div>
                    <h2>🧩 Funcionalidades del plan</h2>
                    <p className="config-card-subtitle">
                        Activa o desactiva opciones del sistema. Usa el buscador para encontrarlas rápido.
                    </p>
                </div>

                <div className="features-search">
                    <input
                        type="text"
                        value={query}
                        placeholder="Buscar (ej: ticket, cocina, verifactu...)"
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </header>

            {loading && <p>Cargando funcionalidades...</p>}

            {!loading && features.length === 0 && (
                <p>Este plan no incluye funcionalidades configurables.</p>
            )}

            {!loading && features.length > 0 && (
                <div className="features-cats">
                    {grouped.map(([cat, items]) => (
                        <div key={cat} className="features-cat">
                            <button
                                type="button"
                                className="features-cat-header"
                                onClick={() => toggleCat(cat)}
                            >
                                <span className="features-cat-title">
                                    {cat} <span className="features-cat-count">({items.length})</span>
                                </span>
                                <span className="features-cat-chevron">{openCats[cat] ? "▾" : "▸"}</span>
                            </button>

                            {openCats[cat] && (
                                <div className="feature-grid">
                                    {items.map((f) => (
                                        <label key={f._id} className="feature-item">
                                            {f.configKey ? (
                                                <>
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(getConfigValue(config, f.configKey))}
                                                        onChange={(e) => handleFeatureUpdate(f.configKey, e.target.checked)}
                                                    />
                                                    <span>{f.nombre}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="feature-check">✔</span>
                                                    <span>{f.nombre}</span>
                                                </>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
