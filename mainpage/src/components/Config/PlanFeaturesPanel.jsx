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
            const { data } = await api.put("/admin/features-plan/update", {
                key: configKey,
                value,
            });

            // el endpoint te devuelve config actualizada
            setConfig(data);

            // sincronizar flujo pedidos si toca esos flags
            if (
                configKey === "flujoPedidos.permitePedidosComida" ||
                configKey === "flujoPedidos.permitePedidosBebida"
            ) {
                const current = configRef.current;

                const nuevoFlujo = {
                    permitePedidosComida:
                        configKey === "flujoPedidos.permitePedidosComida"
                            ? value
                            : !!current?.flujoPedidos?.permitePedidosComida,
                    permitePedidosBebida:
                        configKey === "flujoPedidos.permitePedidosBebida"
                            ? value
                            : !!current?.flujoPedidos?.permitePedidosBebida,
                };

                try {
                    const resFlujo = await api.put("/admin/config/flujo-pedidos", nuevoFlujo);
                    setConfig((prev) => ({ ...prev, flujoPedidos: resFlujo.data.flujoPedidos }));
                } catch (err) {
                    console.error("Error sincronizando flujo pedidos:", err);
                }
            }

            onAlert?.({ tipo: "success", mensaje: "Cambios guardados correctamente ✅" });
        } catch (err) {
            console.error("[PlanFeaturesPanel] Error update:", err);
            onAlert?.({ tipo: "error", mensaje: "Error al actualizar la configuración del plan." });
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
