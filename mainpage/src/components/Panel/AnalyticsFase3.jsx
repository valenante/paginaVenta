// src/components/Panel/AnalyticsFase3.jsx
// Analytics Fase 3: correlación, alertas, proyección ajustada
import { useEffect, useState, useMemo } from "react";
import api from "../../utils/api";
import { InfoButton } from "./InfoModal";
import "./AnalyticsFase3.css";

const money = (n) => Number(n || 0).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/* ═══════════════════════════════════════
   1. CORRELACIÓN DE PRODUCTOS
   ═══════════════════════════════════════ */
const STORAGE_KEY = "alef_corr_excluidos";
function loadExcluidos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveExcluidos(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function CorrelacionCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [excluidos, setExcluidos] = useState(() => loadExcluidos());
  const [minVeces, setMinVeces] = useState(2);
  const [sortBy, setSortBy] = useState("veces");
  const [addExcluir, setAddExcluir] = useState("");
  const [selectedProd, setSelectedProd] = useState("");
  const [page, setPage] = useState(1);
  const [allProductos, setAllProductos] = useState([]);

  // Guardar excluidos en localStorage
  useEffect(() => { saveExcluidos(excluidos); }, [excluidos]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [excluidos, minVeces, sortBy, selectedProd]);

  // Fetch con paginación y filtros server-side
  useEffect(() => {
    let m = true;
    setLoading(true);
    const params = {
      page,
      limit: 15,
      sort: sortBy,
      minSoporte: minVeces,
      excluir: excluidos.join(","),
      producto: selectedProd,
    };
    api.get("/dashboard/correlacion", { params })
      .then(({ data: d }) => {
        if (!m) return;
        const r = d?.data || d;
        setData(r);
        if (r?.productos?.length) setAllProductos(r.productos);
      })
      .catch(() => {})
      .finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, [page, sortBy, minVeces, excluidos, selectedProd]);

  const addToExcluidos = (nombre) => {
    const low = nombre.toLowerCase().trim();
    if (low && !excluidos.includes(low)) setExcluidos(prev => [...prev, low]);
  };
  const removeFromExcluidos = (nombre) => setExcluidos(prev => prev.filter(e => e !== nombre));

  if (loading && !data) return <div className="af3-card af3-card--loading">Cargando correlaciones...</div>;

  return (
    <div className="af3-card">
      <div className="af3-card__head">
        <h3>Productos que se piden juntos</h3>
        <div className="af3-card__actions">
          <InfoButton title="Correlación de productos">
            <h4>Qué muestra</h4>
            <p>Pares de productos que aparecen juntos frecuentemente en el mismo pedido (platos y bebidas).</p>
            <h4>Cómo se calcula</h4>
            <p>Analiza todos los pedidos de las últimas 4 semanas. El <code>×</code> indica cuántas veces aparecen juntos. El <code>%</code> es la confianza: si un cliente pide A, ese % también pide B.</p>
            <h4>Para qué sirve</h4>
            <ul>
              <li>Sugerir upselling al camarero</li>
              <li>Diseñar combos basados en datos reales</li>
              <li>Sugerencias automáticas en la carta digital</li>
            </ul>
            <h4>Filtros</h4>
            <p>Excluye productos que se piden con todo (pan, agua). Filtra por producto específico para ver sus pares. Se guarda en tu navegador.</p>
          </InfoButton>
        </div>
      </div>

      {/* Controles */}
      <div className="af3-corr-controls">
        <select className="af3-corr-select" value={selectedProd} onChange={e => setSelectedProd(e.target.value)}>
          <option value="">Todos los productos</option>
          {allProductos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="af3-corr-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="veces">Más frecuentes</option>
          <option value="confianza">Mayor confianza</option>
        </select>
        <select className="af3-corr-select" value={minVeces} onChange={e => setMinVeces(Number(e.target.value))}>
          <option value={2}>Mín. 2×</option>
          <option value={3}>Mín. 3×</option>
          <option value={5}>Mín. 5×</option>
          <option value={10}>Mín. 10×</option>
        </select>
      </div>

      {/* Excluidos */}
      <div className="af3-corr-excluidos">
        <span className="af3-corr-excluidos__label">Excluidos:</span>
        {excluidos.length === 0 && <span className="af3-corr-excluidos__empty">ninguno — añade productos genéricos</span>}
        {excluidos.map(e => (
          <span key={e} className="af3-corr-tag" onClick={() => removeFromExcluidos(e)} title="Click para quitar">{e} ×</span>
        ))}
        <form className="af3-corr-add" onSubmit={ev => { ev.preventDefault(); if (addExcluir.trim()) { addToExcluidos(addExcluir); setAddExcluir(""); } }}>
          <input placeholder="Añadir..." value={addExcluir} onChange={e => setAddExcluir(e.target.value)} className="af3-corr-add__input" />
        </form>
      </div>

      {/* Lista con ranking */}
      {loading ? (
        <div className="af3-corr-list af3-corr-list--loading">Actualizando...</div>
      ) : !data?.correlaciones?.length ? (
        <p className="af3-empty">Sin correlaciones con estos filtros. Prueba a bajar el mínimo o quitar excluidos.</p>
      ) : (
        <>
          <div className="af3-corr-list">
            {data.correlaciones.map((c) => {
              const maxConf = Math.max(c.confianzaAB, c.confianzaBA);
              const barW = Math.max(8, Math.min(100, maxConf));
              return (
                <div key={c.rank} className="af3-corr-row">
                  <span className="af3-corr-rank">#{c.rank}</span>
                  <div className="af3-corr-pair">
                    <span className="af3-corr-name af3-corr-name--click" onClick={() => setSelectedProd(selectedProd === c.productoA ? "" : c.productoA)}>{c.productoA}</span>
                    <span className="af3-corr-plus">+</span>
                    <span className="af3-corr-name af3-corr-name--click" onClick={() => setSelectedProd(selectedProd === c.productoB ? "" : c.productoB)}>{c.productoB}</span>
                  </div>
                  <div className="af3-corr-bar-wrap">
                    <div className="af3-corr-bar" style={{ width: `${barW}%` }} />
                  </div>
                  <div className="af3-corr-stats">
                    <span className="af3-corr-count">{c.vecesJuntos}×</span>
                    <span className="af3-corr-pct">{maxConf}%</span>
                  </div>
                  <button className="af3-corr-exclude-btn" onClick={() => addToExcluidos(c.productoA)} title={`Excluir ${c.productoA}`}>×</button>
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          <div className="af3-corr-pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            <span>{data.page} / {data.totalPages} ({data.total} pares)</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        </>
      )}
      <p className="af3-card__tip">{data?.totalPedidos || 0} pedidos analizados · {selectedProd || "últimas 4 semanas"}</p>
    </div>
  );
}

/* ═══════════════════════════════════════
   2. ALERTAS INTELIGENTES
   ═══════════════════════════════════════ */
export function AlertasCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    api.get("/dashboard/alertas")
      .then(({ data: d }) => { if (m) setData(d?.data || d); })
      .catch(() => {})
      .finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, []);

  if (loading) return <div className="af3-card af3-card--loading">Analizando...</div>;

  const sevIcon = { alta: "🔴", media: "🟡", baja: "🔵" };

  return (
    <div className={`af3-card ${!data?.alertas?.length ? "af3-card--ok" : ""}`}>
      <div className="af3-card__head">
        <h3>Alertas inteligentes</h3>
        <div className="af3-card__actions">
          {data?.totalAlertas > 0 && <span className="af3-badge">{data.totalAlertas}</span>}
          <InfoButton title="Alertas inteligentes">
            <h4>Qué muestra</h4>
            <p>Patrones que requieren tu atención, detectados automáticamente.</p>
            <h4>Qué detecta</h4>
            <ul>
              <li><strong>🔴 Mesa larga</strong> — mesas abiertas más de 2 horas (3h = alta)</li>
              <li><strong>🟡 Ticket descendente</strong> — ticket medio bajando 3 semanas seguidas del mismo día</li>
              <li><strong>🔵 Ventas bajas</strong> — si hoy (después de las 16h) estás al &lt;50% de la media del día</li>
            </ul>
            <h4>Para qué sirve</h4>
            <p>No tener que mirar el dashboard constantemente. Las alertas te avisan cuando algo necesita atención.</p>
          </InfoButton>
        </div>
      </div>
      {!data?.alertas?.length ? (
        <p className="af3-ok-msg">Todo bien — sin alertas activas</p>
      ) : (
        <div className="af3-alertas-list">
          {data.alertas.map((a, i) => (
            <div key={i} className={`af3-alerta af3-alerta--${a.severidad}`}>
              <span className="af3-alerta__icon">{sevIcon[a.severidad] || "⚪"}</span>
              <div className="af3-alerta__body">
                <span className="af3-alerta__msg">{a.mensaje}</span>
                <span className="af3-alerta__tipo">{a.tipo.replace(/_/g, " ")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   3. PROYECCIÓN AJUSTADA (sin media por día)
   ═══════════════════════════════════════ */
export function ProyeccionCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    api.get("/dashboard/proyeccion-ajustada")
      .then(({ data: d }) => { if (m) setData(d?.data || d); })
      .catch(() => {})
      .finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, []);

  if (loading) return <div className="af3-card af3-card--loading">Calculando proyección...</div>;
  if (!data) return null;

  const { ventasRealizadas, diasTranscurridos, diasTotales, proyeccionAjustada, proyeccionLineal, diferencia } = data;
  const pctMes = diasTotales > 0 ? Math.round((diasTranscurridos / diasTotales) * 100) : 0;

  return (
    <div className="af3-card">
      <div className="af3-card__head">
        <h3>Proyección del mes</h3>
        <div className="af3-card__actions">
          <span className="af3-card__sub">{diasTranscurridos}/{diasTotales} días</span>
          <InfoButton title="Proyección del mes">
            <h4>Qué muestra</h4>
            <p>Dos proyecciones de cuánto facturarás este mes.</p>
            <h4>Cómo se calcula</h4>
            <ul>
              <li><strong>Lineal</strong>: media diaria × días del mes. Simple pero imprecisa.</li>
              <li><strong>Ajustada</strong>: usa la media por día de la semana de las últimas 4 semanas. Si quedan más sábados (día fuerte), sube. Si quedan más lunes (día flojo), baja.</li>
            </ul>
            <h4>Para qué sirve</h4>
            <p>Planificar compras, personal y expectativas. La ajustada es más fiable que la lineal.</p>
          </InfoButton>
        </div>
      </div>

      <div className="af3-proy-kpis">
        <div className="af3-proy-kpi">
          <span className="af3-proy-label">Realizado</span>
          <span className="af3-proy-value">{money(ventasRealizadas)}€</span>
        </div>
        <div className="af3-proy-kpi af3-proy-kpi--main">
          <span className="af3-proy-label">Proyección ajustada</span>
          <span className="af3-proy-value">{money(proyeccionAjustada)}€</span>
        </div>
        <div className="af3-proy-kpi">
          <span className="af3-proy-label">Lineal</span>
          <span className="af3-proy-value af3-proy-value--dim">{money(proyeccionLineal)}€</span>
        </div>
      </div>

      <div className="af3-proy-bar-wrap">
        <div className="af3-proy-bar" style={{ width: `${pctMes}%` }} />
        <span className="af3-proy-bar-label">{pctMes}% del mes</span>
      </div>

      {diferencia !== 0 && (
        <p className="af3-proy-diff">
          Diferencia: <strong>{money(Math.abs(diferencia))}€ {diferencia > 0 ? "más" : "menos"}</strong> —
          {diferencia > 0 ? " los días restantes incluyen fines de semana fuertes" : " los días restantes son más flojos"}
        </p>
      )}
    </div>
  );
}
