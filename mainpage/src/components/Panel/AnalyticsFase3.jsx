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
// Productos genéricos que se piden con todo — filtrar por defecto
const GENERICOS = ["pan", "agua", "regañas", "pan de ajo", "bread"];

export function CorrelacionCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hideGenericos, setHideGenericos] = useState(true);
  const [minVeces, setMinVeces] = useState(3);

  useEffect(() => {
    let m = true;
    api.get("/dashboard/correlacion")
      .then(({ data: d }) => { if (m) setData(d?.data || d); })
      .catch(() => {})
      .finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, []);

  const filtered = useMemo(() => {
    if (!data?.correlaciones) return [];
    return data.correlaciones
      .filter(c => c.vecesJuntos >= minVeces)
      .filter(c => {
        if (!hideGenericos) return true;
        const aLow = c.productoA.toLowerCase();
        const bLow = c.productoB.toLowerCase();
        return !GENERICOS.some(g => aLow.includes(g) || bLow.includes(g));
      });
  }, [data, hideGenericos, minVeces]);

  if (loading) return <div className="af3-card af3-card--loading">Cargando correlaciones...</div>;
  if (!data?.correlaciones?.length) return null;

  return (
    <div className="af3-card">
      <div className="af3-card__head">
        <h3>Productos que se piden juntos</h3>
        <div className="af3-card__actions">
          <InfoButton title="Correlación de productos">
            <h4>Qué muestra</h4>
            <p>Pares de productos que aparecen juntos frecuentemente en el mismo pedido.</p>
            <h4>Cómo se calcula</h4>
            <p>Analiza todos los pedidos de las últimas 4 semanas. Para cada par de productos que aparecen en el mismo pedido, cuenta cuántas veces coinciden. El <code>%</code> indica la confianza: si un cliente pide el producto A, ese % de las veces también pide el B.</p>
            <h4>Para qué sirve</h4>
            <ul>
              <li>Sugerir upselling: "¿Le pongo un Protos Roble con el Solomillo?"</li>
              <li>Diseñar combos o menús basados en datos reales</li>
              <li>Optimizar la carta digital con sugerencias automáticas</li>
            </ul>
          </InfoButton>
        </div>
      </div>

      <div className="af3-corr-controls">
        <label className="af3-toggle">
          <input type="checkbox" checked={hideGenericos} onChange={e => setHideGenericos(e.target.checked)} />
          <span>Ocultar genéricos (pan, agua...)</span>
        </label>
        <label className="af3-corr-min">
          Mín.
          <select value={minVeces} onChange={e => setMinVeces(Number(e.target.value))}>
            <option value={2}>2×</option>
            <option value={3}>3×</option>
            <option value={5}>5×</option>
            <option value={10}>10×</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="af3-empty">Sin correlaciones con estos filtros. Prueba a bajar el mínimo o desactivar el filtro de genéricos.</p>
      ) : (
        <div className="af3-corr-list">
          {filtered.slice(0, 10).map((c, i) => (
            <div key={i} className="af3-corr-row">
              <div className="af3-corr-pair">
                <span className="af3-corr-name">{c.productoA}</span>
                <span className="af3-corr-plus">+</span>
                <span className="af3-corr-name">{c.productoB}</span>
              </div>
              <div className="af3-corr-stats">
                <span className="af3-corr-count">{c.vecesJuntos}×</span>
                <span className="af3-corr-pct">{c.confianzaAB}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="af3-card__tip">{data.totalPedidos} pedidos analizados · últimas 4 semanas</p>
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
