import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getLoyaltyConfig,
  updateLoyaltyConfig,
  getLoyaltyStats,
  getLoyaltyClientes,
  listarAnuncios,
  crearAnuncio,
  actualizarAnuncio,
  eliminarAnuncio,
} from "../services/loyaltyAdminService";
import ClienteLoyaltyDrawer from "./ClienteLoyaltyDrawer";
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
  { id: "anuncios", label: "Anuncios" },
  { id: "clientes", label: "Clientes" },
  { id: "metricas", label: "Métricas" },
];

const TIPOS_ANUNCIO = [
  { value: "promo",   label: "Promoción", icon: "🎉" },
  { value: "evento",  label: "Evento",    icon: "🎤" },
  { value: "novedad", label: "Novedad",   icon: "✨" },
  { value: "aviso",   label: "Aviso",     icon: "⚠️" },
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
  const [editingAnuncio, setEditingAnuncio] = useState(null);
  const [anunciosReloadKey, setAnunciosReloadKey] = useState(0);

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
    try { setStats(await getLoyaltyStats()); } catch { /* silencioso */ }
  }, []);

  useEffect(() => { cargarConfig(); cargarStats(); }, [cargarConfig, cargarStats]);

  const guardar = async (patch, mensaje) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateLoyaltyConfig({ ...config, ...patch });
      setConfig(updated);
      setSuccess(mensaje || "Cambios guardados.");
      setTimeout(() => setSuccess(null), 2500);
      if ("activo" in patch) cargarStats();
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const onSaveRecompensa = (r) => {
    const recompensas = [...(config.recompensas || [])];
    if (r._id) {
      const idx = recompensas.findIndex((x) => String(x._id) === String(r._id));
      if (idx >= 0) recompensas[idx] = r;
    } else recompensas.push(r);
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

  const onSaveMultiplicador = (m) => {
    const multiplicadores = [...(config.multiplicadores || [])];
    if (m._id) {
      const idx = multiplicadores.findIndex((x) => String(x._id) === String(m._id));
      if (idx >= 0) multiplicadores[idx] = m;
    } else multiplicadores.push(m);
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

  if (loading) {
    return (
      <main className="loyalty-config-page cfg-page section section--wide">
        <div className="cfg-loading">Cargando configuración…</div>
      </main>
    );
  }

  return (
    <main className="loyalty-config-page cfg-page section section--wide">
      {/* HEADER */}
      <header className="cfg-header">
        <div>
          <Link to="/dashboard" className="loyalty-back">← Volver al panel</Link>
          <h1>💳 Programa de fidelización</h1>
          <p className="text-suave">
            Sistema de puntos para premiar a tus clientes habituales. Configura las
            reglas, las recompensas y consulta los resultados en tiempo real.
          </p>
        </div>
        <div className="cfg-header-status">
          <span className={`badge ${config?.activo ? "badge-exito" : "badge-aviso"}`}>
            {config?.activo ? "● Activo" : "○ Inactivo"}
          </span>
        </div>
      </header>

      {/* TOASTS */}
      {error && (
        <div className="cfg-status-box danger" role="alert" style={{ marginBottom: "var(--space-md)" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="cfg-status-box ok" role="status" style={{ marginBottom: "var(--space-md)" }}>
          {success}
        </div>
      )}

      {/* TABS */}
      <div className="loyalty-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`loyalty-tab ${tab === t.id ? "is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      {tab === "config" && (
        <ConfigTab config={config} setConfig={setConfig} saving={saving} onSave={guardar} />
      )}

      {tab === "recompensas" && (
        <RecompensasTab
          recompensas={config?.recompensas || []}
          onAdd={() => setEditingRecompensa({
            nombre: "", descripcion: "", coste: 100,
            tipo: "descuento_fijo", valor: 5, activo: true, stock: null,
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
            nombre: "", factor: 2,
            horaInicio: "09:00", horaFin: "13:00",
            diasSemana: [1, 2, 3, 4, 5], activo: true,
          })}
          onEdit={setEditingMultiplicador}
          onDelete={onDeleteMultiplicador}
          onToggle={onToggleMultiplicador}
        />
      )}

      {tab === "anuncios" && (
        <AnunciosTab
          reloadKey={anunciosReloadKey}
          onAdd={() => setEditingAnuncio({
            titulo: "",
            mensaje: "",
            tipo: "novedad",
            destacado: false,
            activo: true,
            fechaInicio: "",
            fechaFin: "",
          })}
          onEdit={setEditingAnuncio}
          onDeleted={() => setAnunciosReloadKey((k) => k + 1)}
        />
      )}
      {tab === "clientes" && <ClientesTab />}
      {tab === "metricas" && <MetricasTab stats={stats} onReload={cargarStats} />}

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
      {editingAnuncio && (
        <AnuncioModal
          anuncio={editingAnuncio}
          onClose={() => setEditingAnuncio(null)}
          onSaved={() => {
            setEditingAnuncio(null);
            setAnunciosReloadKey((k) => k + 1);
          }}
        />
      )}
    </main>
  );
}

/* =====================================================
   Tabs de contenido
===================================================== */

function ConfigTab({ config, setConfig, saving, onSave }) {
  return (
    <>
      <section className="card config-card">
        <div className="config-card-header">
          <div>
            <h2>Estado del programa</h2>
            <p className="config-card-subtitle">
              Cuando está apagado no se acumulan ni se canjean puntos. Los clientes vinculados a mesas
              se mantienen pero el cierre no genera movimientos.
            </p>
          </div>
        </div>

        <div className="loyalty-toggle-row">
          <label className="loyalty-switch">
            <input
              type="checkbox"
              checked={!!config.activo}
              onChange={(e) => onSave({ activo: e.target.checked })}
              disabled={saving}
            />
            <span className="loyalty-switch-track">
              <span className="loyalty-switch-thumb" />
            </span>
            <span className="loyalty-switch-label">{config.activo ? "Activo" : "Inactivo"}</span>
          </label>
        </div>
      </section>

      <section className="card config-card">
        <div className="config-card-header">
          <div>
            <h2>Reglas básicas</h2>
            <p className="config-card-subtitle">
              Define cuántos puntos suma cada euro consumido y cuándo el cliente puede canjear.
            </p>
          </div>
        </div>

        <div className="cfg-form-grid">
          <div className="config-field">
            <label>Puntos por euro</label>
            <input
              type="number"
              min="0"
              step="1"
              value={config.puntosPorEuro ?? 10}
              onChange={(e) => setConfig((c) => ({ ...c, puntosPorEuro: Number(e.target.value) }))}
              onBlur={(e) => onSave({ puntosPorEuro: Number(e.target.value) })}
              disabled={saving}
            />
            <p className="cfg-help">Recomendado: 10 (10 € = 100 pts)</p>
          </div>

          <div className="config-field">
            <label>Mínimo para canjear</label>
            <input
              type="number"
              min="0"
              step="1"
              value={config.minimoParaCanjear ?? 0}
              onChange={(e) => setConfig((c) => ({ ...c, minimoParaCanjear: Number(e.target.value) }))}
              onBlur={(e) => onSave({ minimoParaCanjear: Number(e.target.value) })}
              disabled={saving}
            />
            <p className="cfg-help">Saldo mínimo antes de poder canjear cualquier recompensa.</p>
          </div>

          <div className="config-field">
            <label>Caducidad de puntos (días)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={config.caducidadDias ?? 0}
              onChange={(e) => setConfig((c) => ({ ...c, caducidadDias: Number(e.target.value) }))}
              onBlur={(e) => onSave({ caducidadDias: Number(e.target.value) })}
              disabled={saving}
            />
            <p className="cfg-help">0 = sin caducidad. La caducidad se aplica vía cron en producción.</p>
          </div>
        </div>
      </section>
    </>
  );
}

function RecompensasTab({ recompensas, onAdd, onEdit, onDelete, onToggle }) {
  return (
    <section className="card config-card">
      <div className="config-card-header">
        <div>
          <h2>Catálogo de recompensas</h2>
          <p className="config-card-subtitle">
            Lo que el cliente puede canjear con sus puntos. Las inactivas no aparecen al canjear.
          </p>
        </div>
        <div>
          <button className="btn btn-primario" type="button" onClick={onAdd}>
            ➕ Añadir recompensa
          </button>
        </div>
      </div>

      {recompensas.length === 0 ? (
        <div className="cfg-empty">
          <strong>Sin recompensas configuradas.</strong>
          <p className="text-suave" style={{ margin: "0.4rem 0 1rem" }}>
            Crea la primera para que tus clientes tengan algo que canjear.
          </p>
          <button className="btn btn-primario" type="button" onClick={onAdd}>
            ➕ Crear recompensa
          </button>
        </div>
      ) : (
        <div className="cfg-table-scroll">
          <table className="cfg-table">
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
                    <td data-label="Recompensa">
                      <div><strong>{r.nombre}</strong></div>
                      {r.descripcion && (
                        <div className="text-suave" style={{ fontSize: "0.78rem", marginTop: 2 }}>
                          {r.descripcion}
                        </div>
                      )}
                    </td>
                    <td data-label="Coste"><strong>{r.coste}</strong> pts</td>
                    <td data-label="Tipo">{tipoInfo?.label || r.tipo}</td>
                    <td data-label="Valor">{r.tipo === "descuento_pct" ? `${r.valor}%` : `${r.valor} €`}</td>
                    <td data-label="Stock">{r.stock === null || r.stock === undefined ? "Ilimitado" : r.stock}</td>
                    <td data-label="Estado">
                      <button
                        type="button"
                        className={`badge ${r.activo ? "badge-exito" : "badge-aviso"} loyalty-chip-toggle`}
                        onClick={() => onToggle(r._id, !r.activo)}
                      >
                        {r.activo ? "Activa" : "Inactiva"}
                      </button>
                    </td>
                    <td className="loyalty-row-actions cfg-td-actions">
                      <button type="button" className="btn btn-secundario btn-sm" onClick={() => onEdit(r)}>
                        Editar
                      </button>
                      <button type="button" className="btn btn-secundario btn-sm loyalty-btn-del" onClick={() => onDelete(r._id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function MultiplicadoresTab({ multiplicadores, onAdd, onEdit, onDelete, onToggle }) {
  return (
    <section className="card config-card">
      <div className="config-card-header">
        <div>
          <h2>Multiplicadores horarios</h2>
          <p className="config-card-subtitle">
            Multiplica los puntos en franjas concretas (ej: x2 las mañanas para mover gente en horas valle).
            Si una mesa cierra dentro de un multiplicador activo, sus puntos se multiplican.
          </p>
        </div>
        <div>
          <button className="btn btn-primario" type="button" onClick={onAdd}>
            ➕ Añadir multiplicador
          </button>
        </div>
      </div>

      {multiplicadores.length === 0 ? (
        <div className="cfg-empty">
          <strong>Sin multiplicadores configurados.</strong>
          <p className="text-suave" style={{ margin: "0.4rem 0 0" }}>
            Sin multiplicadores, todos los clientes acumulan al ratio base.
          </p>
        </div>
      ) : (
        <div className="cfg-table-scroll">
          <table className="cfg-table">
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
                  <td data-label="Nombre"><strong>{m.nombre}</strong></td>
                  <td data-label="Factor"><span className="loyalty-factor">×{m.factor}</span></td>
                  <td data-label="Franja">{m.horaInicio} – {m.horaFin}</td>
                  <td data-label="Días">
                    <div className="loyalty-dias">
                      {DIAS_SEMANA.map((d) => (
                        <span
                          key={d.value}
                          className={`loyalty-dia ${(m.diasSemana || []).includes(d.value) ? "is-on" : ""}`}
                        >
                          {d.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td data-label="Estado">
                    <button
                      type="button"
                      className={`badge ${m.activo ? "badge-exito" : "badge-aviso"} loyalty-chip-toggle`}
                      onClick={() => onToggle(m._id, !m.activo)}
                    >
                      {m.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="loyalty-row-actions cfg-td-actions">
                    <button type="button" className="btn btn-secundario btn-sm" onClick={() => onEdit(m)}>
                      Editar
                    </button>
                    <button type="button" className="btn btn-secundario btn-sm loyalty-btn-del" onClick={() => onDelete(m._id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ClientesTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [clienteAbierto, setClienteAbierto] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getLoyaltyClientes({ search, page, limit: 20 });
      setData(r || { items: [], total: 0 });
    } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { cargar(); }, [cargar]);

  const totalPaginas = Math.max(1, Math.ceil((data.total || 0) / 20));

  // Recencia: días desde la última visita. Sirve para el badge en la tabla.
  const diasDesde = (iso) => {
    if (!iso) return null;
    return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
  };
  const recenciaBadge = (iso) => {
    const d = diasDesde(iso);
    if (d === null) return null;
    if (d === 0) return <span className="loyalty-pill loyalty-pill--ok">Hoy</span>;
    if (d === 1) return <span className="loyalty-pill loyalty-pill--ok">Ayer</span>;
    if (d <= 30) return <span className="loyalty-pill loyalty-pill--info">Hace {d}d</span>;
    return <span className="loyalty-pill loyalty-pill--warn">Hace {d}d</span>;
  };

  return (
    <section className="card config-card">
      <div className="config-card-header">
        <div>
          <h2>Clientes con puntos</h2>
          <p className="config-card-subtitle">
            Personas registradas en el programa con saldo en tu restaurante. Toca una fila para ver el detalle completo.
          </p>
        </div>
        <div>
          <span className="badge badge-exito">{data.total} cliente{data.total === 1 ? "" : "s"}</span>
        </div>
      </div>

      <div className="cfg-form-grid">
        <div className="config-field">
          <label>Buscar cliente</label>
          <input
            type="search"
            placeholder="Buscar por nombre, email o teléfono…"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          />
        </div>
      </div>

      {loading ? (
        <div className="cfg-loading">Cargando clientes…</div>
      ) : data.items.length === 0 ? (
        <div className="cfg-empty">
          <strong>Sin clientes todavía.</strong>
          <p className="text-suave" style={{ margin: "0.4rem 0 0" }}>
            {search
              ? "Ningún cliente coincide con esa búsqueda."
              : "Cuando vincules clientes a mesas y cierres con consumo, aparecerán aquí."}
          </p>
        </div>
      ) : (
        <>
          <div className="cfg-table-scroll" style={{ marginTop: "var(--space-md)" }}>
            <table className="cfg-table cfg-table--clickable">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Puntos</th>
                  <th>Primera visita</th>
                  <th>Última visita</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => setClienteAbierto(c._id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td data-label="Cliente">
                      <div><strong>{c.nombre}</strong></div>
                      {c.estado !== "activo" && (
                        <span className="badge badge-error" style={{ marginTop: 4 }}>Bloqueado</span>
                      )}
                    </td>
                    <td data-label="Contacto">
                      <div>{c.email}</div>
                      {c.telefono && <div className="text-suave" style={{ fontSize: "0.8rem" }}>{c.telefono}</div>}
                    </td>
                    <td data-label="Puntos"><strong className="loyalty-puntos">{c.puntos}</strong> pts</td>
                    <td data-label="Primera visita">{fmtDate(c.firstVisit)}</td>
                    <td data-label="Última visita">
                      <div>{fmtDate(c.lastVisit)}</div>
                      <div style={{ marginTop: 4 }}>{recenciaBadge(c.lastVisit)}</div>
                    </td>
                    <td className="text-suave cli-row-arrow" aria-hidden="true">›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="cfg-pager" style={{ marginTop: "var(--space-md)" }}>
              <button
                type="button"
                className="btn btn-secundario"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Anterior
              </button>
              <span className="text-suave">Página {page} de {totalPaginas}</span>
              <button
                type="button"
                className="btn btn-secundario"
                disabled={page >= totalPaginas}
                onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {clienteAbierto && (
        <ClienteLoyaltyDrawer
          clienteId={clienteAbierto}
          onClose={() => setClienteAbierto(null)}
        />
      )}
    </section>
  );
}

function MetricasTab({ stats, onReload }) {
  if (!stats) {
    return (
      <section className="card config-card">
        <div className="cfg-empty">
          <strong>Aún no hay datos.</strong>
          <p className="text-suave" style={{ margin: "0.4rem 0 1rem" }}>
            Las métricas aparecerán cuando empiecen a haber clientes vinculados y mesas cerradas.
          </p>
          <button className="btn btn-secundario" type="button" onClick={onReload}>Recargar</button>
        </div>
      </section>
    );
  }

  const upliftPct = stats.ticketMedioSinLoyalty > 0
    ? ((stats.ticketMedioLoyalty - stats.ticketMedioSinLoyalty) / stats.ticketMedioSinLoyalty * 100)
    : null;

  return (
    <>
      <section className="card config-card">
        <div className="config-card-header">
          <div>
            <h2>Indicadores del programa</h2>
            <p className="config-card-subtitle">
              Métricas agregadas desde que activaste el programa de fidelización.
            </p>
          </div>
        </div>

        <div className="cfg-stats">
          <article className="cfg-stat">
            <span className="cfg-stat__label">Clientes activos</span>
            <strong>{stats.clientesActivos}</strong>
          </article>
          <article className="cfg-stat">
            <span className="cfg-stat__label">Puntos emitidos</span>
            <strong>{stats.puntosEmitidos}</strong>
          </article>
          <article className="cfg-stat">
            <span className="cfg-stat__label">Puntos canjeados</span>
            <strong>{stats.puntosCanjeados}</strong>
          </article>
          <article className="cfg-stat">
            <span className="cfg-stat__label">Ratio canjeo</span>
            <strong>{stats.ratioCanjeo}%</strong>
          </article>
          <article className="cfg-stat">
            <span className="cfg-stat__label">Descuento aplicado</span>
            <strong>{fmtMoney(stats.descuentoTotalAplicado)}</strong>
          </article>
          <article className="cfg-stat">
            <span className="cfg-stat__label">Canjeos realizados</span>
            <strong>{stats.canjeosCount}</strong>
          </article>
        </div>
      </section>

      <section className="card config-card">
        <div className="config-card-header">
          <div>
            <h2>Mesas con loyalty vs sin loyalty</h2>
            <p className="config-card-subtitle">
              Compara el ticket medio cuando el cliente está vinculado al programa frente al resto.
            </p>
          </div>
        </div>

        <div className="loyalty-compare">
          <div className="loyalty-compare-col">
            <div className="loyalty-compare-label">Con loyalty</div>
            <div className="loyalty-compare-num">{fmtMoney(stats.ticketMedioLoyalty)}</div>
            <div className="text-suave loyalty-compare-sub">{stats.mesasConLoyalty} mesas</div>
          </div>
          <div className="loyalty-compare-vs">vs</div>
          <div className="loyalty-compare-col">
            <div className="loyalty-compare-label">Sin loyalty</div>
            <div className="loyalty-compare-num">{fmtMoney(stats.ticketMedioSinLoyalty)}</div>
            <div className="text-suave loyalty-compare-sub">{stats.mesasSinLoyalty} mesas</div>
          </div>
        </div>
        {upliftPct !== null && (
          <div className={`loyalty-uplift ${upliftPct >= 0 ? "is-good" : "is-bad"}`}>
            {upliftPct >= 0 ? "▲" : "▼"} {Math.abs(upliftPct).toFixed(1)}% de diferencia
          </div>
        )}
      </section>
    </>
  );
}

/* =====================================================
   Modales
===================================================== */

function ModalShell({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="loyalty-modal-overlay" onClick={onClose}>
      <div className="loyalty-modal card" onClick={(e) => e.stopPropagation()}>
        <header className="loyalty-modal-header">
          <h3>{title}</h3>
          <button type="button" className="loyalty-modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>
        <div className="loyalty-modal-body">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onClose, submitLabel }) {
  return (
    <footer className="loyalty-modal-footer">
      <button type="button" className="btn btn-secundario" onClick={onClose}>Cancelar</button>
      <button type="submit" className="btn btn-primario">{submitLabel}</button>
    </footer>
  );
}

function RecompensaModal({ recompensa, onClose, onSave }) {
  const [r, setR] = useState({ ...recompensa, stock: recompensa.stock ?? null });

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
      <form onSubmit={submit}>
        <div className="config-field" style={{ marginBottom: "var(--space-md)" }}>
          <label>Nombre</label>
          <input
            type="text"
            value={r.nombre}
            onChange={(e) => setR({ ...r, nombre: e.target.value })}
            required
            maxLength={100}
            placeholder="Ej: Café gratis"
          />
        </div>

        <div className="config-field" style={{ marginBottom: "var(--space-md)" }}>
          <label>Descripción</label>
          <input
            type="text"
            value={r.descripcion || ""}
            onChange={(e) => setR({ ...r, descripcion: e.target.value })}
            maxLength={300}
            placeholder="(opcional, lo ve el camarero al canjear)"
          />
        </div>

        <div className="cfg-form-grid">
          <div className="config-field">
            <label>Coste (pts)</label>
            <input
              type="number" min="1" step="1" required
              value={r.coste}
              onChange={(e) => setR({ ...r, coste: e.target.value })}
            />
          </div>
          <div className="config-field">
            <label>Tipo</label>
            <select value={r.tipo} onChange={(e) => setR({ ...r, tipo: e.target.value })}>
              {TIPOS_RECOMPENSA.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="config-field">
            <label>{r.tipo === "descuento_pct" ? "Porcentaje" : "Valor (€)"}</label>
            <input
              type="number" min="0" step="0.01" required
              value={r.valor}
              onChange={(e) => setR({ ...r, valor: e.target.value })}
            />
          </div>
          <div className="config-field">
            <label>Stock</label>
            <input
              type="number" min="0" step="1"
              value={r.stock ?? ""}
              onChange={(e) => setR({ ...r, stock: e.target.value === "" ? null : e.target.value })}
              placeholder="Ilimitado"
            />
            <p className="cfg-help">Vacío = ilimitado.</p>
          </div>
        </div>

        {tipoActual?.hint && <p className="cfg-help" style={{ marginTop: "var(--space-sm)" }}>{tipoActual.hint}</p>}

        <label className="loyalty-check" style={{ marginTop: "var(--space-md)" }}>
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

function MultiplicadorModal({ multiplicador, onClose, onSave }) {
  const [m, setM] = useState({ ...multiplicador });

  const toggleDia = (d) => {
    const set = new Set(m.diasSemana || []);
    if (set.has(d)) set.delete(d); else set.add(d);
    setM({ ...m, diasSemana: Array.from(set).sort() });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!m.nombre.trim() || !(m.diasSemana || []).length) return;
    onSave({ ...m, factor: Math.max(1, Number(m.factor) || 1) });
  };

  return (
    <ModalShell title={m._id ? "Editar multiplicador" : "Nuevo multiplicador"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="config-field" style={{ marginBottom: "var(--space-md)" }}>
          <label>Nombre</label>
          <input
            type="text" required maxLength={80}
            value={m.nombre}
            onChange={(e) => setM({ ...m, nombre: e.target.value })}
            placeholder="Ej: Mañanas dobles"
          />
          <p className="cfg-help">Identificativo, lo verás en la tabla.</p>
        </div>

        <div className="cfg-form-grid">
          <div className="config-field">
            <label>Factor multiplicador</label>
            <input
              type="number" min="1" step="0.5" required
              value={m.factor}
              onChange={(e) => setM({ ...m, factor: e.target.value })}
            />
            <p className="cfg-help">Multiplica los puntos por este número en la franja.</p>
          </div>
          <div className="config-field">
            <label>Hora inicio</label>
            <input
              type="time" required
              value={m.horaInicio}
              onChange={(e) => setM({ ...m, horaInicio: e.target.value })}
            />
          </div>
          <div className="config-field">
            <label>Hora fin</label>
            <input
              type="time" required
              value={m.horaFin}
              onChange={(e) => setM({ ...m, horaFin: e.target.value })}
            />
          </div>
        </div>

        <div className="config-field" style={{ marginTop: "var(--space-md)" }}>
          <label>Días de la semana</label>
          <div className="loyalty-dias loyalty-dias--editable">
            {DIAS_SEMANA.map((d) => (
              <button
                key={d.value}
                type="button"
                className={`loyalty-dia ${(m.diasSemana || []).includes(d.value) ? "is-on" : ""}`}
                onClick={() => toggleDia(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <label className="loyalty-check" style={{ marginTop: "var(--space-md)" }}>
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
   Tab: Anuncios
===================================================== */

function AnunciosTab({ reloadKey, onAdd, onEdit, onDeleted }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listarAnuncios()
      .then((arr) => { if (alive) { setItems(arr); setError(null); } })
      .catch((err) => { if (alive) setError(err?.response?.data?.message || "Error cargando anuncios."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [reloadKey]);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este anuncio? Los clientes dejarán de verlo inmediatamente.")) return;
    try {
      await eliminarAnuncio(id);
      onDeleted?.();
    } catch (err) {
      alert(err?.response?.data?.message || "No se pudo eliminar.");
    }
  };

  const handleToggleActivo = async (a, activo) => {
    try {
      await actualizarAnuncio(a._id, { activo });
      onDeleted?.(); // recargamos
    } catch (err) {
      alert(err?.response?.data?.message || "No se pudo actualizar.");
    }
  };

  const ahora = new Date();

  return (
    <section className="card config-card">
      <div className="config-card-header">
        <div>
          <h2>Tablón de anuncios</h2>
          <p className="config-card-subtitle">
            Comunica promociones, eventos, novedades de carta o avisos a tus clientes
            registrados en ALEF. Aparecen en la app cliente del restaurante.
          </p>
        </div>
        <div>
          <button className="btn btn-primario" type="button" onClick={onAdd}>
            ➕ Nuevo anuncio
          </button>
        </div>
      </div>

      {error && <div className="cfg-status-box danger" style={{ marginBottom: "var(--space-md)" }}>{error}</div>}

      {loading ? (
        <div className="cfg-loading">Cargando anuncios…</div>
      ) : items.length === 0 ? (
        <div className="cfg-empty">
          <strong>Sin anuncios todavía.</strong>
          <p className="text-suave" style={{ margin: "0.4rem 0 1rem" }}>
            Crea el primero para empezar a comunicarte con tus clientes ALEF. Puedes
            programar fechas para que se publique solo durante un periodo.
          </p>
          <button className="btn btn-primario" type="button" onClick={onAdd}>
            ➕ Crear primer anuncio
          </button>
        </div>
      ) : (
        <div className="cfg-table-scroll">
          <table className="cfg-table">
            <thead>
              <tr>
                <th></th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th aria-label="Acciones"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => {
                const tipoInfo = TIPOS_ANUNCIO.find((t) => t.value === a.tipo);
                const inicio = a.fechaInicio ? new Date(a.fechaInicio) : null;
                const fin = a.fechaFin ? new Date(a.fechaFin) : null;
                const yaCaducado = fin && fin < ahora;
                const aunNoEmpezo = inicio && inicio > ahora;
                const vigente = a.activo && !yaCaducado && !aunNoEmpezo;

                return (
                  <tr key={a._id} className={!vigente ? "is-off" : ""}>
                    <td className="cfg-td-icon" style={{ width: 32, fontSize: "1.3rem", textAlign: "center" }}>
                      {tipoInfo?.icon || "•"}
                    </td>
                    <td data-label="Título">
                      <div>
                        <strong>{a.titulo}</strong>
                        {a.destacado && (
                          <span className="badge" style={{ marginLeft: 8, background: "rgba(255, 145, 73, 0.16)", color: "#e86f1c" }}>
                            ⭐ Destacado
                          </span>
                        )}
                      </div>
                      {a.mensaje && (
                        <div className="text-suave" style={{ fontSize: "0.78rem", marginTop: 2 }}>
                          {a.mensaje.length > 100 ? a.mensaje.slice(0, 100) + "…" : a.mensaje}
                        </div>
                      )}
                    </td>
                    <td data-label="Tipo">{tipoInfo?.label || a.tipo}</td>
                    <td data-label="Vigencia" style={{ fontSize: "0.85rem" }}>
                      {!inicio && !fin && <span className="text-suave">Indefinida</span>}
                      {inicio && <div>Desde: {inicio.toLocaleDateString("es")}</div>}
                      {fin && <div>Hasta: {fin.toLocaleDateString("es")}</div>}
                      {yaCaducado && <span style={{ color: "#b91c1c" }}>· Caducado</span>}
                      {aunNoEmpezo && <span style={{ color: "#b45309" }}>· Pendiente</span>}
                    </td>
                    <td data-label="Estado">
                      <button
                        type="button"
                        className={`badge ${a.activo ? "badge-exito" : "badge-aviso"} loyalty-chip-toggle`}
                        onClick={() => handleToggleActivo(a, !a.activo)}
                      >
                        {a.activo ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="loyalty-row-actions cfg-td-actions">
                      <button type="button" className="btn btn-secundario btn-sm" onClick={() => onEdit(a)}>
                        Editar
                      </button>
                      <button type="button" className="btn btn-secundario btn-sm loyalty-btn-del" onClick={() => handleDelete(a._id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AnuncioModal({ anuncio, onClose, onSaved }) {
  const isEdit = !!anuncio._id;
  const [form, setForm] = useState({
    titulo: anuncio.titulo || "",
    mensaje: anuncio.mensaje || "",
    tipo: anuncio.tipo || "novedad",
    destacado: !!anuncio.destacado,
    activo: anuncio.activo !== false,
    fechaInicio: anuncio.fechaInicio ? toDateInput(anuncio.fechaInicio) : "",
    fechaFin: anuncio.fechaFin ? toDateInput(anuncio.fechaFin) : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.titulo.trim()) return setError("Título requerido.");
    if (form.fechaInicio && form.fechaFin && new Date(form.fechaInicio) > new Date(form.fechaFin)) {
      return setError("La fecha de inicio no puede ser posterior a la fecha fin.");
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        fechaInicio: form.fechaInicio || null,
        fechaFin: form.fechaFin || null,
      };
      if (isEdit) await actualizarAnuncio(anuncio._id, payload);
      else await crearAnuncio(payload);
      onSaved?.();
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo guardar el anuncio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={isEdit ? "Editar anuncio" : "Nuevo anuncio"} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="config-field" style={{ marginBottom: "var(--space-md)" }}>
          <label>Título</label>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => onChange("titulo", e.target.value)}
            required
            maxLength={120}
            placeholder="Ej: Lunes 2x1 en hamburguesas"
            autoFocus
          />
        </div>

        <div className="config-field" style={{ marginBottom: "var(--space-md)" }}>
          <label>Mensaje <span className="cfg-help" style={{ fontWeight: 400 }}>(opcional, máx. 500 caracteres)</span></label>
          <textarea
            value={form.mensaje}
            onChange={(e) => onChange("mensaje", e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Detalla la promoción, condiciones, horario..."
            style={{ resize: "vertical" }}
          />
          <p className="cfg-help">{form.mensaje.length}/500 caracteres</p>
        </div>

        <div className="cfg-form-grid">
          <div className="config-field">
            <label>Tipo</label>
            <select value={form.tipo} onChange={(e) => onChange("tipo", e.target.value)}>
              {TIPOS_ANUNCIO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.icon} {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="config-field">
            <label>Fecha inicio <span style={{ fontWeight: 400, color: "var(--color-texto-suave)" }}>(opcional)</span></label>
            <input
              type="date"
              value={form.fechaInicio}
              onChange={(e) => onChange("fechaInicio", e.target.value)}
            />
          </div>

          <div className="config-field">
            <label>Fecha fin <span style={{ fontWeight: 400, color: "var(--color-texto-suave)" }}>(opcional)</span></label>
            <input
              type="date"
              value={form.fechaFin}
              onChange={(e) => onChange("fechaFin", e.target.value)}
            />
          </div>
        </div>

        <p className="cfg-help" style={{ marginTop: "var(--space-sm)" }}>
          Sin fecha fin, el anuncio se mantendrá visible hasta que lo desactives manualmente.
        </p>

        <label className="loyalty-check" style={{ marginTop: "var(--space-md)" }}>
          <input
            type="checkbox"
            checked={form.destacado}
            onChange={(e) => onChange("destacado", e.target.checked)}
          />
          <span>⭐ Destacado (aparece más arriba y con badge en la lista de restaurantes)</span>
        </label>

        <label className="loyalty-check" style={{ marginTop: "var(--space-sm)" }}>
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => onChange("activo", e.target.checked)}
          />
          <span>Activo (visible para los clientes)</span>
        </label>

        {error && <div className="cfg-status-box danger" style={{ marginTop: "var(--space-md)" }}>{error}</div>}

        <ModalFooter onClose={onClose} submitLabel={saving ? "Guardando…" : "Guardar anuncio"} />
      </form>
    </ModalShell>
  );
}

function toDateInput(v) {
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch { return ""; }
}
