import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getLoyaltyConfig,
  updateLoyaltyConfig,
  getLoyaltyStats,
  getLoyaltyClientes,
} from "../services/loyaltyAdminService";
import "./LoyaltyConfigPage.css";

/* =====================================================
   Constantes
===================================================== */

const TIPOS_RECOMPENSA = [
  { value: "descuento_fijo", label: "Descuento fijo (€)", hint: "Resta una cantidad fija al total." },
  { value: "descuento_pct", label: "Descuento porcentual (%)", hint: "Resta un % al total de la mesa." },
  { value: "producto_gratis", label: "Producto gratis", hint: "El camarero retira el producto al cobrar; el valor se declara." },
];

const DIAS_SEMANA = [
  { value: 1, label: "L" },
  { value: 2, label: "M" },
  { value: 3, label: "X" },
  { value: 4, label: "J" },
  { value: 5, label: "V" },
  { value: 6, label: "S" },
  { value: 0, label: "D" },
];

const TABS = [
  { id: "config", label: "Configuración" },
  { id: "recompensas", label: "Recompensas" },
  { id: "multiplicadores", label: "Multiplicadores" },
  { id: "clientes", label: "Clientes" },
  { id: "metricas", label: "Métricas" },
];

const fmtMoney = (n) => `${Number(n || 0).toFixed(2).replace(".", ",")} €`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("es") : "—";

/* =====================================================
   Componente principal
===================================================== */

export default function LoyaltyConfigPage() {
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tab, setTab] = useState("config");
  const [editingRecompensa, setEditingRecompensa] = useState(null);
  const [editingMultiplicador, setEditingMultiplicador] = useState(null);

  /* ---------- Carga inicial ---------- */

  const cargarConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await getLoyaltyConfig();
      setConfig(c);
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo cargar la configuración.");
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarStats = useCallback(async () => {
    try {
      const s = await getLoyaltyStats();
      setStats(s);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => { cargarConfig(); cargarStats(); }, [cargarConfig, cargarStats]);

  /* ---------- Guardar ---------- */

  const guardar = async (patch, mensaje) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateLoyaltyConfig({ ...config, ...patch });
      setConfig(updated);
      setSuccess(mensaje || "Cambios guardados.");
      setTimeout(() => setSuccess(null), 2500);
      // recargar stats si cambió algo de "activo"
      if ("activo" in patch) cargarStats();
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Recompensas ---------- */

  const onSaveRecompensa = (r) => {
    const recompensas = [...(config.recompensas || [])];
    if (r._id) {
      const idx = recompensas.findIndex((x) => String(x._id) === String(r._id));
      if (idx >= 0) recompensas[idx] = r;
    } else {
      recompensas.push(r);
    }
    guardar({ recompensas }, "Recompensa guardada.");
    setEditingRecompensa(null);
  };

  const onDeleteRecompensa = (id) => {
    if (!window.confirm("¿Eliminar esta recompensa? Los puntos ya canjeados no se devuelven.")) return;
    const recompensas = (config.recompensas || []).filter((r) => String(r._id) !== String(id));
    guardar({ recompensas }, "Recompensa eliminada.");
  };

  const onToggleRecompensa = (id, activo) => {
    const recompensas = (config.recompensas || []).map((r) =>
      String(r._id) === String(id) ? { ...r, activo } : r
    );
    guardar({ recompensas });
  };

  /* ---------- Multiplicadores ---------- */

  const onSaveMultiplicador = (m) => {
    const multiplicadores = [...(config.multiplicadores || [])];
    if (m._id) {
      const idx = multiplicadores.findIndex((x) => String(x._id) === String(m._id));
      if (idx >= 0) multiplicadores[idx] = m;
    } else {
      multiplicadores.push(m);
    }
    guardar({ multiplicadores }, "Multiplicador guardado.");
    setEditingMultiplicador(null);
  };

  const onDeleteMultiplicador = (id) => {
    if (!window.confirm("¿Eliminar este multiplicador?")) return;
    const multiplicadores = (config.multiplicadores || []).filter((m) => String(m._id) !== String(id));
    guardar({ multiplicadores }, "Multiplicador eliminado.");
  };

  const onToggleMultiplicador = (id, activo) => {
    const multiplicadores = (config.multiplicadores || []).map((m) =>
      String(m._id) === String(id) ? { ...m, activo } : m
    );
    guardar({ multiplicadores });
  };

  /* ---------- Render ---------- */

  if (loading) {
    return (
      <div className="lc">
        <div className="lc__loading">Cargando…</div>
      </div>
    );
  }

  return (
    <div className="lc">
      {/* HEADER */}
      <header className="lc__header">
        <Link to="/dashboard" className="lc__back">← Volver al panel</Link>
        <div className="lc__title-row">
          <div>
            <h1 className="lc__title">
              <span className="lc__title-icon" aria-hidden="true">💳</span>
              Programa de fidelización
            </h1>
            <p className="lc__subtitle">
              Sistema de puntos para premiar a los clientes habituales de tu restaurante.
              Configúralo a tu medida y consulta los resultados en tiempo real.
            </p>
          </div>
          <span className={`lc__estado-badge ${config?.activo ? "is-on" : "is-off"}`}>
            {config?.activo ? "● Activo" : "○ Inactivo"}
          </span>
        </div>
      </header>

      {/* AVISOS */}
      {error && <div className="lc__toast lc__toast--error">{error}</div>}
      {success && <div className="lc__toast lc__toast--success">{success}</div>}

      {/* TABS */}
      <nav className="lc__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`lc__tab ${tab === t.id ? "is-active" : ""}`}
            onClick={() => setTab(t.id)}
            role="tab"
            aria-selected={tab === t.id}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* CONTENIDO */}
      <main className="lc__content">
        {tab === "config" && (
          <ConfigTab
            config={config}
            saving={saving}
            onSave={guardar}
            setConfig={setConfig}
          />
        )}

        {tab === "recompensas" && (
          <RecompensasTab
            recompensas={config?.recompensas || []}
            onAdd={() => setEditingRecompensa({
              nombre: "",
              descripcion: "",
              coste: 100,
              tipo: "descuento_fijo",
              valor: 5,
              activo: true,
              stock: null,
            })}
            onEdit={setEditingRecompensa}
            onDelete={onDeleteRecompensa}
            onToggle={onToggleRecompensa}
          />
        )}

        {tab === "multiplicadores" && (
          <MultiplicadoresTab
            multiplicadores={config?.multiplicadores || []}
            onAdd={() => setEditingMultiplicador({
              nombre: "",
              factor: 2,
              horaInicio: "09:00",
              horaFin: "13:00",
              diasSemana: [1, 2, 3, 4, 5],
              activo: true,
            })}
            onEdit={setEditingMultiplicador}
            onDelete={onDeleteMultiplicador}
            onToggle={onToggleMultiplicador}
          />
        )}

        {tab === "clientes" && <ClientesTab />}

        {tab === "metricas" && <MetricasTab stats={stats} onReload={cargarStats} />}
      </main>

      {/* MODALES */}
      {editingRecompensa && (
        <RecompensaModal
          recompensa={editingRecompensa}
          onClose={() => setEditingRecompensa(null)}
          onSave={onSaveRecompensa}
        />
      )}
      {editingMultiplicador && (
        <MultiplicadorModal
          multiplicador={editingMultiplicador}
          onClose={() => setEditingMultiplicador(null)}
          onSave={onSaveMultiplicador}
        />
      )}
    </div>
  );
}

/* =====================================================
   Tab: Configuración
===================================================== */

function ConfigTab({ config, saving, onSave, setConfig }) {
  return (
    <div className="lc__cards">
      <Card
        title="Estado del programa"
        hint="Cuando está apagado, no se acumulan ni se canjean puntos. Los clientes vinculados a mesas se mantienen pero el cierre no genera movimientos."
      >
        <div className="lc__toggle-row">
          <label className="lc__switch">
            <input
              type="checkbox"
              checked={!!config.activo}
              onChange={(e) => onSave({ activo: e.target.checked })}
              disabled={saving}
            />
            <span className="lc__switch-track">
              <span className="lc__switch-thumb" />
            </span>
            <span className="lc__switch-label">{config.activo ? "Activo" : "Inactivo"}</span>
          </label>
        </div>
      </Card>

      <Card
        title="Reglas básicas"
        hint="Define cuántos puntos suma cada euro consumido y cuándo el cliente puede canjear sus puntos."
      >
        <div className="lc__field-grid">
          <Field
            label="Puntos por euro"
            help="Recomendado: 10 (10 € = 100 pts)"
          >
            <NumberInput
              value={config.puntosPorEuro ?? 10}
              min={0}
              onChange={(v) => setConfig((c) => ({ ...c, puntosPorEuro: v }))}
              onCommit={(v) => onSave({ puntosPorEuro: v })}
              disabled={saving}
            />
          </Field>

          <Field
            label="Mínimo para canjear"
            help="Saldo mínimo antes de poder canjear cualquier recompensa"
          >
            <NumberInput
              value={config.minimoParaCanjear ?? 0}
              min={0}
              onChange={(v) => setConfig((c) => ({ ...c, minimoParaCanjear: v }))}
              onCommit={(v) => onSave({ minimoParaCanjear: v })}
              disabled={saving}
            />
          </Field>

          <Field
            label="Caducidad de puntos (días)"
            help="0 = sin caducidad. La caducidad se aplica vía cron en producción."
          >
            <NumberInput
              value={config.caducidadDias ?? 0}
              min={0}
              onChange={(v) => setConfig((c) => ({ ...c, caducidadDias: v }))}
              onCommit={(v) => onSave({ caducidadDias: v })}
              disabled={saving}
            />
          </Field>
        </div>
      </Card>
    </div>
  );
}

/* =====================================================
   Tab: Recompensas
===================================================== */

function RecompensasTab({ recompensas, onAdd, onEdit, onDelete, onToggle }) {
  if (recompensas.length === 0) {
    return (
      <Card>
        <Empty
          icon="🎁"
          title="Sin recompensas configuradas"
          description="Crea la primera para que tus clientes tengan algo que canjear con sus puntos."
          action={<button className="lc__btn lc__btn--primary" onClick={onAdd}>+ Crear recompensa</button>}
        />
      </Card>
    );
  }

  return (
    <Card
      title="Catálogo de recompensas"
      hint="Lo que el cliente puede canjear. Las inactivas no aparecen al camarero al canjear."
      action={<button className="lc__btn lc__btn--primary" onClick={onAdd}>+ Añadir</button>}
    >
      <div className="lc__table-wrap">
        <table className="lc__table">
          <thead>
            <tr>
              <th>Recompensa</th>
              <th>Coste</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Stock</th>
              <th>Estado</th>
              <th aria-label="Acciones"></th>
            </tr>
          </thead>
          <tbody>
            {recompensas.map((r) => {
              const tipoInfo = TIPOS_RECOMPENSA.find((t) => t.value === r.tipo);
              return (
                <tr key={r._id || r.nombre} className={!r.activo ? "is-off" : ""}>
                  <td>
                    <div className="lc__table-main">{r.nombre}</div>
                    {r.descripcion && <div className="lc__table-sub">{r.descripcion}</div>}
                  </td>
                  <td><strong>{r.coste}</strong> pts</td>
                  <td>{tipoInfo?.label || r.tipo}</td>
                  <td>{r.tipo === "descuento_pct" ? `${r.valor}%` : `${r.valor} €`}</td>
                  <td>{r.stock === null || r.stock === undefined ? "Ilimitado" : r.stock}</td>
                  <td>
                    <button
                      type="button"
                      className={`lc__chip-toggle ${r.activo ? "is-on" : "is-off"}`}
                      onClick={() => onToggle(r._id, !r.activo)}
                    >
                      {r.activo ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                  <td className="lc__table-actions">
                    <button type="button" className="lc__btn-row" onClick={() => onEdit(r)}>Editar</button>
                    <button type="button" className="lc__btn-row lc__btn-row--del" onClick={() => onDelete(r._id)}>Eliminar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* =====================================================
   Tab: Multiplicadores horarios
===================================================== */

function MultiplicadoresTab({ multiplicadores, onAdd, onEdit, onDelete, onToggle }) {
  return (
    <Card
      title="Multiplicadores horarios"
      hint="Multiplica los puntos en franjas concretas (ej: x2 las mañanas para mover gente en horas valle). Si una mesa cierra dentro de un multiplicador activo, sus puntos se multiplican."
      action={<button className="lc__btn lc__btn--primary" onClick={onAdd}>+ Añadir</button>}
    >
      {multiplicadores.length === 0 ? (
        <Empty
          icon="⏱️"
          title="Sin multiplicadores configurados"
          description="Sin multiplicadores, todos los clientes acumulan al ratio base."
        />
      ) : (
        <div className="lc__table-wrap">
          <table className="lc__table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Factor</th>
                <th>Franja horaria</th>
                <th>Días</th>
                <th>Estado</th>
                <th aria-label="Acciones"></th>
              </tr>
            </thead>
            <tbody>
              {multiplicadores.map((m) => (
                <tr key={m._id || m.nombre} className={!m.activo ? "is-off" : ""}>
                  <td><strong>{m.nombre}</strong></td>
                  <td><span className="lc__factor">×{m.factor}</span></td>
                  <td>{m.horaInicio} – {m.horaFin}</td>
                  <td>
                    <div className="lc__dias">
                      {DIAS_SEMANA.map((d) => (
                        <span
                          key={d.value}
                          className={`lc__dia ${(m.diasSemana || []).includes(d.value) ? "is-on" : ""}`}
                        >
                          {d.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`lc__chip-toggle ${m.activo ? "is-on" : "is-off"}`}
                      onClick={() => onToggle(m._id, !m.activo)}
                    >
                      {m.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="lc__table-actions">
                    <button type="button" className="lc__btn-row" onClick={() => onEdit(m)}>Editar</button>
                    <button type="button" className="lc__btn-row lc__btn-row--del" onClick={() => onDelete(m._id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* =====================================================
   Tab: Clientes
===================================================== */

function ClientesTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getLoyaltyClientes({ search, page, limit: 20 });
      setData(r || { items: [], total: 0 });
    } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { cargar(); }, [cargar]);

  const totalPaginas = Math.max(1, Math.ceil((data.total || 0) / 20));

  return (
    <Card
      title="Clientes con puntos"
      hint="Personas registradas en el programa con saldo en tu restaurante."
    >
      <div className="lc__search">
        <input
          type="search"
          placeholder="Buscar por nombre, email o teléfono…"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          className="lc__search-input"
        />
        <span className="lc__search-count">{data.total || 0} clientes</span>
      </div>

      {loading ? (
        <div className="lc__loading-mini">Cargando…</div>
      ) : data.items.length === 0 ? (
        <Empty
          icon="👥"
          title="Sin clientes todavía"
          description={search
            ? "Ningún cliente coincide con esa búsqueda."
            : "Cuando vincules clientes a mesas y cierres con consumo, aparecerán aquí."}
        />
      ) : (
        <>
          <div className="lc__table-wrap">
            <table className="lc__table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Puntos</th>
                  <th>Primera visita</th>
                  <th>Última visita</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="lc__table-main">{c.nombre}</div>
                      {c.estado !== "activo" && (
                        <span className="lc__chip-toggle is-off">Bloqueado</span>
                      )}
                    </td>
                    <td>
                      <div className="lc__table-sub">{c.email}</div>
                      {c.telefono && <div className="lc__table-sub">{c.telefono}</div>}
                    </td>
                    <td><strong className="lc__puntos">{c.puntos}</strong> pts</td>
                    <td>{fmtDate(c.firstVisit)}</td>
                    <td>{fmtDate(c.lastVisit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="lc__pag">
              <button
                type="button"
                className="lc__btn lc__btn--ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Anterior
              </button>
              <span>Página {page} de {totalPaginas}</span>
              <button
                type="button"
                className="lc__btn lc__btn--ghost"
                disabled={page >= totalPaginas}
                onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

/* =====================================================
   Tab: Métricas
===================================================== */

function MetricasTab({ stats, onReload }) {
  if (!stats) {
    return (
      <Card>
        <Empty
          icon="📊"
          title="Aún no hay datos"
          description="Las métricas aparecerán cuando empiecen a haber clientes vinculados y mesas cerradas."
          action={<button className="lc__btn lc__btn--ghost" onClick={onReload}>Recargar</button>}
        />
      </Card>
    );
  }

  const upliftPct = stats.ticketMedioSinLoyalty > 0
    ? ((stats.ticketMedioLoyalty - stats.ticketMedioSinLoyalty) / stats.ticketMedioSinLoyalty * 100)
    : null;

  return (
    <div className="lc__cards">
      <div className="lc__kpis">
        <Kpi label="Clientes activos" value={stats.clientesActivos} hint="Con saldo > 0 en tu restaurante" />
        <Kpi label="Puntos emitidos" value={stats.puntosEmitidos} hint="Desde el inicio del programa" />
        <Kpi label="Puntos canjeados" value={stats.puntosCanjeados} hint={`${stats.canjeosCount} canjeos`} />
        <Kpi label="Ratio de canjeo" value={`${stats.ratioCanjeo}%`} hint="Canjeados / emitidos" tone={stats.ratioCanjeo > 30 ? "good" : ""} />
        <Kpi label="Descuento total aplicado" value={fmtMoney(stats.descuentoTotalAplicado)} hint="Coste real del programa" tone="warn" />
      </div>

      <Card
        title="Mesas con loyalty vs sin loyalty"
        hint="Compara el ticket medio cuando el cliente está vinculado al programa frente al resto."
      >
        <div className="lc__compare">
          <div className="lc__compare-col">
            <div className="lc__compare-label">Con loyalty</div>
            <div className="lc__compare-num">{fmtMoney(stats.ticketMedioLoyalty)}</div>
            <div className="lc__compare-sub">{stats.mesasConLoyalty} mesas</div>
          </div>
          <div className="lc__compare-vs">vs</div>
          <div className="lc__compare-col">
            <div className="lc__compare-label">Sin loyalty</div>
            <div className="lc__compare-num">{fmtMoney(stats.ticketMedioSinLoyalty)}</div>
            <div className="lc__compare-sub">{stats.mesasSinLoyalty} mesas</div>
          </div>
        </div>
        {upliftPct !== null && (
          <div className={`lc__uplift ${upliftPct >= 0 ? "is-good" : "is-bad"}`}>
            {upliftPct >= 0 ? "▲" : "▼"} {Math.abs(upliftPct).toFixed(1)}% de diferencia
          </div>
        )}
      </Card>
    </div>
  );
}

/* =====================================================
   Componentes auxiliares
===================================================== */

function Card({ title, hint, action, children }) {
  return (
    <section className="lc__card">
      {(title || action) && (
        <header className="lc__card-header">
          <div>
            {title && <h2 className="lc__card-title">{title}</h2>}
            {hint && <p className="lc__card-hint">{hint}</p>}
          </div>
          {action && <div className="lc__card-action">{action}</div>}
        </header>
      )}
      <div className="lc__card-body">{children}</div>
    </section>
  );
}

function Field({ label, help, children }) {
  return (
    <label className="lc__field">
      <span className="lc__field-label">{label}</span>
      {children}
      {help && <span className="lc__field-help">{help}</span>}
    </label>
  );
}

function NumberInput({ value, onChange, onCommit, min, disabled }) {
  return (
    <input
      type="number"
      className="lc__num"
      value={value ?? 0}
      min={min}
      step="1"
      onChange={(e) => onChange(Number(e.target.value))}
      onBlur={(e) => onCommit?.(Number(e.target.value))}
      disabled={disabled}
    />
  );
}

function Empty({ icon, title, description, action }) {
  return (
    <div className="lc__empty">
      {icon && <div className="lc__empty-icon">{icon}</div>}
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {action && <div className="lc__empty-action">{action}</div>}
    </div>
  );
}

function Kpi({ label, value, hint, tone }) {
  return (
    <div className={`lc__kpi ${tone ? `lc__kpi--${tone}` : ""}`}>
      <div className="lc__kpi-label">{label}</div>
      <div className="lc__kpi-value">{value}</div>
      {hint && <div className="lc__kpi-hint">{hint}</div>}
    </div>
  );
}

/* =====================================================
   Modal: Recompensa
===================================================== */

function RecompensaModal({ recompensa, onClose, onSave }) {
  const [r, setR] = useState({ ...recompensa, stock: recompensa.stock ?? null });

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e) => {
    e.preventDefault();
    if (!r.nombre.trim()) return;
    onSave({
      ...r,
      coste: Math.max(1, Math.floor(Number(r.coste) || 0)),
      valor: Math.max(0, Number(r.valor) || 0),
      stock: r.stock === null || r.stock === "" ? null : Math.max(0, Math.floor(Number(r.stock))),
    });
  };

  const tipoActual = TIPOS_RECOMPENSA.find((t) => t.value === r.tipo);

  return (
    <ModalShell title={r._id ? "Editar recompensa" : "Nueva recompensa"} onClose={onClose}>
      <form onSubmit={submit} className="lc__form">
        <Field label="Nombre">
          <input
            type="text"
            className="lc__input"
            value={r.nombre}
            onChange={(e) => setR({ ...r, nombre: e.target.value })}
            required
            maxLength={100}
            placeholder="Ej: Café gratis"
          />
        </Field>

        <Field label="Descripción" help="Lo verá el camarero al canjear (opcional).">
          <input
            type="text"
            className="lc__input"
            value={r.descripcion || ""}
            onChange={(e) => setR({ ...r, descripcion: e.target.value })}
            maxLength={300}
          />
        </Field>

        <div className="lc__form-grid">
          <Field label="Coste (pts)">
            <input
              type="number"
              className="lc__input"
              min="1"
              step="1"
              value={r.coste}
              onChange={(e) => setR({ ...r, coste: e.target.value })}
              required
            />
          </Field>

          <Field label="Tipo">
            <select
              className="lc__input"
              value={r.tipo}
              onChange={(e) => setR({ ...r, tipo: e.target.value })}
            >
              {TIPOS_RECOMPENSA.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>

          <Field label={r.tipo === "descuento_pct" ? "Porcentaje" : "Valor (€)"}>
            <input
              type="number"
              className="lc__input"
              min="0"
              step="0.01"
              value={r.valor}
              onChange={(e) => setR({ ...r, valor: e.target.value })}
              required
            />
          </Field>

          <Field label="Stock" help="Vacío = ilimitado.">
            <input
              type="number"
              className="lc__input"
              min="0"
              step="1"
              value={r.stock ?? ""}
              onChange={(e) => setR({ ...r, stock: e.target.value === "" ? null : e.target.value })}
              placeholder="Ilimitado"
            />
          </Field>
        </div>

        {tipoActual?.hint && <p className="lc__form-hint">{tipoActual.hint}</p>}

        <label className="lc__check">
          <input
            type="checkbox"
            checked={!!r.activo}
            onChange={(e) => setR({ ...r, activo: e.target.checked })}
          />
          <span>Activa (visible para canjear)</span>
        </label>

        <ModalFooter onClose={onClose} submitLabel="Guardar" />
      </form>
    </ModalShell>
  );
}

/* =====================================================
   Modal: Multiplicador
===================================================== */

function MultiplicadorModal({ multiplicador, onClose, onSave }) {
  const [m, setM] = useState({ ...multiplicador });

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleDia = (d) => {
    const set = new Set(m.diasSemana || []);
    if (set.has(d)) set.delete(d); else set.add(d);
    setM({ ...m, diasSemana: Array.from(set).sort() });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!m.nombre.trim()) return;
    if (!(m.diasSemana || []).length) return;
    onSave({
      ...m,
      factor: Math.max(1, Number(m.factor) || 1),
    });
  };

  return (
    <ModalShell title={m._id ? "Editar multiplicador" : "Nuevo multiplicador"} onClose={onClose}>
      <form onSubmit={submit} className="lc__form">
        <Field label="Nombre" help="Identificativo, lo verás en la tabla.">
          <input
            type="text"
            className="lc__input"
            value={m.nombre}
            onChange={(e) => setM({ ...m, nombre: e.target.value })}
            required
            maxLength={80}
            placeholder="Ej: Mañanas dobles"
          />
        </Field>

        <div className="lc__form-grid">
          <Field label="Factor multiplicador" help="Multiplica los puntos por este número en la franja.">
            <input
              type="number"
              className="lc__input"
              min="1"
              step="0.5"
              value={m.factor}
              onChange={(e) => setM({ ...m, factor: e.target.value })}
              required
            />
          </Field>

          <Field label="Hora inicio">
            <input
              type="time"
              className="lc__input"
              value={m.horaInicio}
              onChange={(e) => setM({ ...m, horaInicio: e.target.value })}
              required
            />
          </Field>

          <Field label="Hora fin">
            <input
              type="time"
              className="lc__input"
              value={m.horaFin}
              onChange={(e) => setM({ ...m, horaFin: e.target.value })}
              required
            />
          </Field>
        </div>

        <Field label="Días de la semana">
          <div className="lc__dias lc__dias--editable">
            {DIAS_SEMANA.map((d) => (
              <button
                key={d.value}
                type="button"
                className={`lc__dia ${(m.diasSemana || []).includes(d.value) ? "is-on" : ""}`}
                onClick={() => toggleDia(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Field>

        <label className="lc__check">
          <input
            type="checkbox"
            checked={!!m.activo}
            onChange={(e) => setM({ ...m, activo: e.target.checked })}
          />
          <span>Activo</span>
        </label>

        <ModalFooter onClose={onClose} submitLabel="Guardar" />
      </form>
    </ModalShell>
  );
}

/* =====================================================
   Modal shell + footer
===================================================== */

function ModalShell({ title, onClose, children }) {
  return (
    <div className="lc__modal-overlay" onClick={onClose}>
      <div className="lc__modal" onClick={(e) => e.stopPropagation()}>
        <header className="lc__modal-header">
          <h3>{title}</h3>
          <button type="button" className="lc__modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>
        <div className="lc__modal-body">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onClose, submitLabel }) {
  return (
    <footer className="lc__modal-footer">
      <button type="button" className="lc__btn lc__btn--ghost" onClick={onClose}>Cancelar</button>
      <button type="submit" className="lc__btn lc__btn--primary">{submitLabel}</button>
    </footer>
  );
}
