// src/pages/proveedores/HacerPedidoPage.jsx
//
// Fase 2 — Botón "Hacer pedido":
// Tabla editable con items a reponer (ingredientes + productos con controlStock),
// filtrable por proveedor / tipo / búsqueda / "solo stock bajo", con sugerencia
// de cantidad y coste estimado. Al confirmar, crea N PedidoProveedor (uno por
// proveedor) en estado "enviado" y genera un PDF por cada uno para mandar.

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../utils/api";
import { useTenant } from "../../context/TenantContext";
import ErrorToast from "../../components/common/ErrorToast.jsx";
import AlertaMensaje from "../../components/AlertaMensaje/AlertaMensaje.jsx";
import { normalizeApiError } from "../../utils/normalizeApiError.js";
import { generarPedidoProveedorPDF } from "../../utils/pdfs/pedidoProveedorPDF.js";
import { abrirWhatsappPedido } from "../../utils/whatsappPedido.js";
import "./HacerPedidoPage.css";

const fmtEur = (v) => `${Number(v || 0).toFixed(2)} €`;

export default function HacerPedidoPage() {
  const { tenantId, tenant } = useTenant();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [resumen, setResumen] = useState({ totalItems: 0, porProveedor: [] });
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [alerta, setAlerta] = useState(null);

  // Últimos pedidos
  const [ultimosPedidos, setUltimosPedidos] = useState([]);
  const [mostrarUltimos, setMostrarUltimos] = useState(false);

  // Pedidos recién creados (para panel de acciones: PDF + WhatsApp)
  const [pedidosCreados, setPedidosCreados] = useState([]); // [{ pedido, proveedor, emisor }]

  // Filtros
  const [q, setQ] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [soloBajos, setSoloBajos] = useState(
    searchParams.get("soloBajos") === "true"
  );

  // Cantidades editadas por el usuario (por itemKey)
  const [cantidades, setCantidades] = useState({});
  const itemKey = (it) => `${it.itemType}:${it.itemId}`;

  // Sincronizar soloBajos → URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (soloBajos) params.set("soloBajos", "true");
    else params.delete("soloBajos");
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soloBajos]);

  const fetchSugerencias = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("/admin/proveedores/sugerencias-pedido", {
        params: {
          proveedorId: filtroProveedor || undefined,
          tipo: filtroTipo || undefined,
          q: q || undefined,
          soloBajos: soloBajos ? "true" : undefined,
        },
      });
      const lista = data?.items || [];
      setItems(lista);
      setResumen(data?.resumen || { totalItems: lista.length, porProveedor: [] });
      setCantidades((prev) => {
        const next = { ...prev };
        for (const it of lista) {
          const k = `${it.itemType}:${it.itemId}`;
          if (next[k] == null) next[k] = it.sugerido?.cantidadCompra || 0;
        }
        return next;
      });
    } catch (err) {
      setItems([]);
      setResumen({ totalItems: 0, porProveedor: [] });
      setError({ ...normalizeApiError(err), retryFn: fetchSugerencias });
    } finally {
      setLoading(false);
    }
  }, [filtroProveedor, filtroTipo, q, soloBajos]);

  useEffect(() => {
    if (!tenantId) return;
    fetchSugerencias();
  }, [tenantId, fetchSugerencias]);

  const fetchUltimosPedidos = useCallback(async () => {
    try {
      // Recorre los proveedores con actividad y trae sus últimos pedidos.
      // Como no hay endpoint global, lo resolvemos por proveedor en paralelo.
      const provIds = (resumen.porProveedor || [])
        .map((p) => p.proveedorId)
        .filter(Boolean);
      if (provIds.length === 0) {
        // fallback: pedir el listado maestro de proveedores para sacar ids
        const { data } = await api.get("/admin/proveedores", {
          params: { limit: 50 },
        });
        (data?.items || []).forEach((p) => provIds.push(p._id));
      }
      const results = await Promise.all(
        provIds.map((pid) =>
          api
            .get(`/admin/proveedores/${pid}/pedidos`)
            .then((r) => (r.data?.items || r.data || []).slice(0, 5))
            .catch(() => [])
        )
      );
      const flat = results
        .flat()
        .sort(
          (a, b) =>
            new Date(b.fechaPedido || b.createdAt || 0) -
            new Date(a.fechaPedido || a.createdAt || 0)
        )
        .slice(0, 10);
      setUltimosPedidos(flat);
    } catch (err) {
      setUltimosPedidos([]);
    }
  }, [resumen.porProveedor]);

  useEffect(() => {
    if (mostrarUltimos) fetchUltimosPedidos();
  }, [mostrarUltimos, fetchUltimosPedidos]);

  const proveedoresDisponibles = useMemo(() => {
    return (resumen.porProveedor || [])
      .filter((p) => p.proveedorId)
      .map((p) => ({ _id: p.proveedorId, nombre: p.nombre }));
  }, [resumen]);

  const grupos = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const key = it.proveedor?._id || "__sin_proveedor__";
      if (!map.has(key)) {
        map.set(key, {
          proveedorId: it.proveedor?._id || null,
          nombre: it.proveedor?.nombre || "Sin proveedor",
          items: [],
        });
      }
      map.get(key).items.push(it);
    }
    return [...map.values()];
  }, [items]);

  const totales = useMemo(() => {
    let totalItems = 0;
    let totalImporte = 0;
    const porProveedor = new Map();
    for (const it of items) {
      const k = itemKey(it);
      const cant = Number(cantidades[k] || 0);
      if (cant <= 0) continue;
      totalItems += 1;
      const precio = Number(it.productoProveedor?.precioBase || 0);
      const iva = Number(it.productoProveedor?.iva || 0);
      const linea = cant * precio * (1 + iva / 100);
      totalImporte += linea;
      const pkey = it.proveedor?._id || "__sin_proveedor__";
      if (!porProveedor.has(pkey)) {
        porProveedor.set(pkey, {
          proveedorId: it.proveedor?._id || null,
          nombre: it.proveedor?.nombre || "Sin proveedor",
          items: 0,
          importe: 0,
        });
      }
      const g = porProveedor.get(pkey);
      g.items += 1;
      g.importe += linea;
    }
    return {
      totalItems,
      totalImporte: Math.round(totalImporte * 100) / 100,
      proveedores: [...porProveedor.values()].map((g) => ({
        ...g,
        importe: Math.round(g.importe * 100) / 100,
      })),
    };
  }, [items, cantidades]);

  const cambiarCantidad = (k, delta) => {
    setCantidades((prev) => {
      const curr = Number(prev[k] || 0);
      const next = Math.max(0, curr + delta);
      return { ...prev, [k]: next };
    });
  };
  const setCantidadExacta = (k, v) => {
    const n = Math.max(0, Number(v) || 0);
    setCantidades((prev) => ({ ...prev, [k]: n }));
  };

  const construirBloques = () => {
    const porProveedor = new Map();
    for (const it of items) {
      const cant = Number(cantidades[itemKey(it)] || 0);
      if (cant <= 0) continue;
      if (!it.proveedor?._id || !it.productoProveedor?._id) continue;
      const pid = String(it.proveedor._id);
      if (!porProveedor.has(pid)) {
        porProveedor.set(pid, { proveedorId: pid, lineas: [], _items: [] });
      }
      porProveedor.get(pid).lineas.push({
        productoProveedorId: it.productoProveedor._id,
        cantidad: cant,
      });
      porProveedor.get(pid)._items.push({ ...it, cantidad: cant });
    }
    return [...porProveedor.values()];
  };

  const generarPedidos = async () => {
    const bloques = construirBloques();
    if (bloques.length === 0) {
      setAlerta({ tipo: "info", mensaje: "No hay líneas con cantidad > 0." });
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const { data } = await api.post("/admin/proveedores/pedidos-bulk", {
        bloques: bloques.map(({ _items, ...b }) => b),
      });
      const creados = data?.creados || [];
      const errores = data?.errores || [];
      if (creados.length === 0) {
        setError({
          code: "BULK_FAIL",
          message: "No se pudo crear ningún pedido.",
          details: errores,
        });
        return;
      }
      const emisor = {
        nombre: tenant?.nombre || tenant?.slug || "Mi Restaurante",
        nif: tenant?.nif || tenant?.cif || "",
        email: tenant?.email || "",
        telefono: tenant?.telefono || "",
        direccion: [
          tenant?.direccion?.calle,
          tenant?.direccion?.ciudad,
          tenant?.direccion?.provincia,
          tenant?.direccion?.codigoPostal,
        ].filter(Boolean).join(", "),
      };
      // Obtener datos completos de cada pedido + proveedor para mostrar acciones
      const acciones = [];
      for (const c of creados) {
        try {
          const [{ data: provData }, { data: pedData }] = await Promise.all([
            api.get(`/admin/proveedores/${c.proveedorId}`),
            api.get(`/admin/proveedores/${c.proveedorId}/pedidos/${c._id}`),
          ]);
          const prov = provData?.proveedor || provData;
          const pedido = pedData?.pedido || pedData;
          acciones.push({
            emisor,
            proveedor: {
              _id: prov?._id,
              nombre: prov?.nombreComercial || prov?.razonSocial || "Proveedor",
              nif: prov?.nif || "",
              email: prov?.contacto?.email || "",
              telefono: prov?.contacto?.telefono || "",
              direccion: [
                prov?.direccion?.calle,
                prov?.direccion?.ciudad,
                prov?.direccion?.provincia,
                prov?.direccion?.codigoPostal,
              ].filter(Boolean).join(", "),
            },
            pedido,
          });
        } catch (e) {
          console.warn("[HacerPedido] Error leyendo pedido creado", e);
        }
      }
      setPedidosCreados(acciones);

      const mensaje =
        errores.length > 0
          ? `Creados ${creados.length} pedidos. ${errores.length} con error.`
          : `${creados.length} pedido${creados.length === 1 ? "" : "s"} listo${creados.length === 1 ? "" : "s"} — envía por WhatsApp o descarga el PDF abajo.`;
      setAlerta({ tipo: "exito", mensaje });
      setCantidades({});
      fetchSugerencias();
    } catch (err) {
      setError({ ...normalizeApiError(err), retryFn: generarPedidos });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="hacer-pedido-page cfg-page section section--wide">
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}
      {error && <ErrorToast error={error} onClose={() => setError(null)} />}

      <header className="hp-header cfg-header">
        <div>
          <h1>🛒 Hacer pedido</h1>
          <p className="text-suave">
            Items por debajo del objetivo de stock, agrupados por proveedor. Ajusta
            cantidades y descarga un PDF por proveedor para enviárselo.
          </p>
        </div>
        <div className="hp-header-status">
          <span className="badge badge-exito">
            {totales.totalItems} línea{totales.totalItems === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      <div className="hp-layout cfg-layout">
        <div className="hp-main">
          {/* RESUMEN + ACCIONES */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Resumen y acciones</h2>
                <p className="config-card-subtitle">
                  Totales del pedido propuesto y generación de los PDF para enviar.
                </p>
              </div>
            </div>

            <div className="hp-toolbar cfg-toolbar">
              <button
                className="btn btn-secundario"
                type="button"
                onClick={fetchSugerencias}
                disabled={loading}
              >
                {loading ? "Cargando…" : "🔄 Recalcular"}
              </button>

              <button
                className="btn btn-secundario"
                type="button"
                onClick={() => setMostrarUltimos((v) => !v)}
              >
                📋 {mostrarUltimos ? "Ocultar" : "Ver"} últimos pedidos
              </button>

              <Link to="/configuracion/proveedores" className="btn btn-secundario">
                ← Volver a proveedores
              </Link>

              <button
                className="btn btn-primario"
                type="button"
                onClick={generarPedidos}
                disabled={enviando || totales.totalItems === 0}
                title="Crea los pedidos y genera un PDF por proveedor"
              >
                {enviando
                  ? "Generando…"
                  : `📄 Generar ${totales.proveedores.length} pedido${
                      totales.proveedores.length === 1 ? "" : "s"
                    } + PDFs`}
              </button>
            </div>

            <div className="hp-stats cfg-stats">
              <article className="cfg-stat">
                <span className="cfg-stat__label">Líneas</span>
                <strong>{totales.totalItems}</strong>
              </article>
              <article className="cfg-stat">
                <span className="cfg-stat__label">Importe estimado</span>
                <strong>{fmtEur(totales.totalImporte)}</strong>
              </article>
              <article className="cfg-stat">
                <span className="cfg-stat__label">Proveedores</span>
                <strong>{totales.proveedores.length}</strong>
              </article>
            </div>
          </section>

          {/* PEDIDOS RECIÉN CREADOS — panel de acciones (PDF + WhatsApp) */}
          {pedidosCreados.length > 0 && (
            <section className="card config-card">
              <div className="config-card-header">
                <div>
                  <h2>✅ Pedidos listos para enviar</h2>
                  <p className="config-card-subtitle">
                    Elige cómo mandar cada pedido a su proveedor. WhatsApp abre la
                    app con el mensaje pre-rellenado.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secundario"
                  onClick={() => setPedidosCreados([])}
                  title="Cerrar este panel"
                >
                  ✕ Limpiar
                </button>
              </div>

              <ul className="hp-creados">
                {pedidosCreados.map(({ emisor, proveedor, pedido }) => {
                  const tieneWhatsapp = !!proveedor.telefono;
                  return (
                    <li key={pedido._id} className="hp-creado">
                      <div className="hp-creado-info">
                        <strong>{proveedor.nombre}</strong>
                        <span className="hp-creado-meta">
                          {(pedido.lineas || []).length} línea
                          {(pedido.lineas || []).length === 1 ? "" : "s"} ·{" "}
                          {fmtEur(pedido.total)}
                        </span>
                        {!tieneWhatsapp && (
                          <span className="hp-creado-warn">
                            ⚠ Sin teléfono — añade uno al proveedor para usar WhatsApp
                          </span>
                        )}
                      </div>
                      <div className="hp-creado-actions">
                        <button
                          type="button"
                          className="btn btn-secundario"
                          onClick={() =>
                            generarPedidoProveedorPDF({
                              emisor,
                              proveedor,
                              pedido,
                            })
                          }
                          title="Descargar PDF"
                        >
                          📄 PDF
                        </button>
                        <button
                          type="button"
                          className="btn btn-primario hp-wa-btn"
                          onClick={() =>
                            abrirWhatsappPedido({ emisor, proveedor, pedido })
                          }
                          disabled={!tieneWhatsapp}
                          title={
                            tieneWhatsapp
                              ? `Abrir WhatsApp a ${proveedor.telefono}`
                              : "Este proveedor no tiene teléfono"
                          }
                        >
                          📱 WhatsApp
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* ÚLTIMOS PEDIDOS */}
          {mostrarUltimos && (
            <section className="card config-card">
              <div className="config-card-header">
                <div>
                  <h2>📋 Últimos pedidos</h2>
                  <p className="config-card-subtitle">
                    Los 10 pedidos más recientes a cualquier proveedor.
                  </p>
                </div>
              </div>

              {ultimosPedidos.length === 0 ? (
                <div className="hp-empty">Sin pedidos recientes.</div>
              ) : (
                <ul className="hp-ultimos">
                  {ultimosPedidos.map((p) => (
                    <li key={p._id} className="hp-ultimo">
                      <div className="hp-ultimo-left">
                        <strong>
                          {p.numeroPedido || `#${String(p._id).slice(-6)}`}
                        </strong>
                        <span className="hp-ultimo-fecha">
                          {new Date(
                            p.fechaPedido || p.createdAt
                          ).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                      <div className="hp-ultimo-right">
                        <span className={`hp-estado-badge hp-estado-${p.estado}`}>
                          {p.estado}
                        </span>
                        <strong className="hp-ultimo-total">
                          {fmtEur(p.total)}
                        </strong>
                        <Link
                          className="hp-ultimo-link"
                          to={`/configuracion/proveedores/${p.proveedorId}/pedidos/${p._id}`}
                        >
                          Ver
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* FILTROS */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Filtros</h2>
                <p className="config-card-subtitle">
                  Acota la lista por proveedor, tipo o búsqueda libre.
                </p>
              </div>
            </div>

            <div className="hp-filtros">
              <div className="config-field hp-filtros__search">
                <label>Buscar</label>
                <input
                  type="search"
                  placeholder="Nombre, categoría…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="config-field">
                <label>Proveedor</label>
                <select
                  value={filtroProveedor}
                  onChange={(e) => setFiltroProveedor(e.target.value)}
                >
                  <option value="">Todos</option>
                  {proveedoresDisponibles.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="config-field">
                <label>Tipo</label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="ingrediente">🧂 Ingredientes</option>
                  <option value="producto">🍽️ Platos</option>
                  <option value="bebida">🥂 Bebidas</option>
                </select>
              </div>
              <label className="hp-checkbox-field">
                <input
                  type="checkbox"
                  checked={soloBajos}
                  onChange={(e) => setSoloBajos(e.target.checked)}
                />
                Solo stock bajo
              </label>
            </div>
          </section>

          {/* LISTADO AGRUPADO */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Listado por proveedor</h2>
                <p className="config-card-subtitle">
                  Ajusta cantidades en cada fila. Las filas sin proveedor no se pueden
                  pedir hasta asignar uno.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="hp-empty">Cargando…</div>
            ) : grupos.length === 0 ? (
              <div className="hp-empty">
                No hay items candidatos. Ajusta filtros o configura stock objetivo.
              </div>
            ) : (
              grupos.map((g) => (
                <div key={g.proveedorId || "sin"} className="hp-grupo">
                  <header className="hp-grupo-head">
                    <h3>
                      {g.nombre}
                      {!g.proveedorId && (
                        <span className="hp-alerta hp-alerta--rojo">
                          Sin proveedor asignado
                        </span>
                      )}
                    </h3>
                    <span className="hp-grupo-count">
                      {g.items.length} item{g.items.length === 1 ? "" : "s"}
                    </span>
                  </header>

                  <div className="hp-tabla-wrap">
                    <table className="hp-tabla">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Stock</th>
                          <th>Objetivo</th>
                          <th>Dura</th>
                          <th>Falta</th>
                          <th>Unidad compra</th>
                          <th>Precio</th>
                          <th>Pedir</th>
                          <th className="hp-td-num">Total</th>
                          <th>Alertas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.items.map((it) => {
                          const k = itemKey(it);
                          const cant = Number(cantidades[k] || 0);
                          const precio = Number(
                            it.productoProveedor?.precioBase || 0
                          );
                          const iva = Number(it.productoProveedor?.iva || 0);
                          const linea = cant * precio * (1 + iva / 100);
                          const factor = Number(
                            it.productoProveedor?.factorConversion || 1
                          );
                          const sinProveedor = !it.proveedor?._id;

                          return (
                            <tr key={k} className={sinProveedor ? "is-disabled" : ""}>
                              <td>
                                <div className="hp-nombre">
                                  {it.itemType === "ingrediente"
                                    ? "🧂 "
                                    : it.tipo === "bebida"
                                    ? "🥂 "
                                    : "🍽️ "}
                                  {it.nombre}
                                </div>
                                <div className="hp-sub">
                                  {it.categoria || ""}
                                  {it.categoria && it.unidad ? " · " : ""}
                                  {it.unidad || ""}
                                </div>
                              </td>
                              <td data-label="Stock">
                                {it.stockActual} {it.unidad}
                              </td>
                              <td data-label="Objetivo">
                                {it.stockMax || it.stockMinimoDefault || "—"}{" "}
                                {it.unidad}
                              </td>
                              <td data-label="Dura">
                                {it.diasRestantes != null ? (
                                  <span
                                    className={
                                      it.alertas?.includes("riesgo_rotura")
                                        ? "hp-dias-rojo"
                                        : "hp-dias"
                                    }
                                    title={`Consumo medio: ${it.consumoMedioDiario}/día`}
                                  >
                                    {it.diasRestantes < 1
                                      ? "<1d"
                                      : `${it.diasRestantes.toFixed(1)}d`}
                                  </span>
                                ) : (
                                  <span className="hp-dias-sin">—</span>
                                )}
                              </td>
                              <td data-label="Falta">
                                {it.sugerido?.faltaItem || 0} {it.unidad}
                              </td>
                              <td data-label="Unidad compra">
                                {it.productoProveedor?.unidadCompra || "—"}
                                {factor > 1 && (
                                  <span className="hp-factor"> (×{factor})</span>
                                )}
                              </td>
                              <td data-label="Precio">{fmtEur(precio)}</td>
                              <td data-label="Pedir">
                                <div className="hp-cant">
                                  <button
                                    type="button"
                                    onClick={() => cambiarCantidad(k, -1)}
                                    disabled={cant <= 0 || sinProveedor}
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={cant}
                                    onChange={(e) =>
                                      setCantidadExacta(k, e.target.value)
                                    }
                                    disabled={sinProveedor}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => cambiarCantidad(k, +1)}
                                    disabled={sinProveedor}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="hp-td-num" data-label="Total">
                                <strong>{fmtEur(linea)}</strong>
                              </td>
                              <td data-label="Alertas">
                                {(it.alertas || []).map((a) => (
                                  <span
                                    key={a}
                                    className={`hp-alerta hp-alerta--${
                                      a === "stock_bajo" || a === "riesgo_rotura"
                                        ? "rojo"
                                        : "amarillo"
                                    }`}
                                  >
                                    {a === "sin_proveedor" && "Sin proveedor"}
                                    {a === "sin_principal" && "Sin principal"}
                                    {a === "sin_stock_max" && "Sin objetivo"}
                                    {a === "stock_bajo" && "Stock bajo"}
                                    {a === "riesgo_rotura" && "⚠ Rotura"}
                                  </span>
                                ))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
