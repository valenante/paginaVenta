import { useEffect } from "react";
import { useCortesias } from "../../Hooks/useCortesias";
import "./CortesiasPanel.css";

export default function CortesiasPanel({ abierto, onClose }) {
  const c = useCortesias();

  // Refetch when panel opens
  useEffect(() => {
    if (abierto) c.fetchTabData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="cortpanel-overlay" onClick={onClose}>
      <div className="cortpanel" onClick={(e) => e.stopPropagation()}>
        <header className="cortpanel__header">
          <h2>Cortesias e Invitaciones</h2>
          <button className="cortpanel__close btn-icon" onClick={onClose}>&times;</button>
        </header>

        {/* Filtro fecha */}
        <div className="cortpanel__filtro">
          <label>
            Desde
            <input type="date" value={c.desde} onChange={(e) => c.setDesde(e.target.value)} />
          </label>
          <label>
            Hasta
            <input type="date" value={c.hasta} onChange={(e) => c.setHasta(e.target.value)} />
          </label>
        </div>

        {/* Tabs */}
        <div className="cortpanel__tabs">
          {[
            { key: "invitaciones", label: "Invitaciones" },
            { key: "personal", label: "Personal" },
            { key: "config", label: "Configurar" },
            { key: "registrar", label: "Registrar" },
          ].map((t) => (
            <button
              key={t.key}
              className={`cortpanel__tab ${c.tab === t.key ? "cortpanel__tab--active" : ""}`}
              onClick={() => c.setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Resumen */}
        {(c.tab === "invitaciones" || c.tab === "personal") && (
          <div className="cortpanel__resumen">
            {c.tab === "invitaciones"
              ? `${c.resumenInv.totalItems} invitaciones \u2014 ${Number(c.resumenInv.totalValor || 0).toFixed(2)} \u20AC valor`
              : `${c.resumenCp.totalRegistros} registros \u2014 ${Number(c.resumenCp.totalValor || 0).toFixed(2)} \u20AC valor`}
          </div>
        )}

        {/* Error */}
        {c.error && (
          <div className="cortpanel__error">
            <span>{c.error}</span>
            <button onClick={c.fetchTabData}>Reintentar</button>
          </div>
        )}

        {c.loading && (c.tab === "invitaciones" || c.tab === "personal") && (
          <div className="cortpanel__loading">Cargando...</div>
        )}

        {/* Invitaciones */}
        {!c.loading && !c.error && c.tab === "invitaciones" && (
          <div className="cortpanel__list">
            {c.invitaciones.length === 0 && <p className="cortpanel__empty">No hay invitaciones en este periodo.</p>}
            {c.invitaciones.map((inv) => (
              <div key={inv._id} className="cortpanel__item cortpanel__item--inv">
                <div className="cortpanel__item-top">
                  <strong>{inv.nombre}</strong>
                  <span className="cortpanel__item-date">{c.fmtFecha(inv.fecha)}</span>
                </div>
                <div className="cortpanel__item-mid">
                  <span>x{inv.cantidad} &middot; Mesa {inv.mesa ?? "--"}</span>
                  <span className="cortpanel__item-valor">{Number((inv.precioOriginal || 0) * (inv.cantidad || 1)).toFixed(2)} &euro;</span>
                </div>
                <div className="cortpanel__item-bottom">
                  <span>Autorizado: {inv.autorizadoPor || "--"}</span>
                  {inv.motivo && <span className="cortpanel__item-motivo">{inv.motivo}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Personal */}
        {!c.loading && !c.error && c.tab === "personal" && (
          <div className="cortpanel__list">
            {c.consumos.length === 0 && <p className="cortpanel__empty">No hay consumos del personal en este periodo.</p>}
            {c.consumos.map((cp) => (
              <div key={cp._id} className="cortpanel__item cortpanel__item--cp">
                <div className="cortpanel__item-top">
                  <strong>{cp.empleado?.nombre || "Empleado"}</strong>
                  <span className="cortpanel__item-date">{c.fmtFecha(cp.fecha)}</span>
                </div>
                <div className="cortpanel__item-mid">
                  <span>{(cp.items || []).map((i) => `${i.nombre} x${i.cantidad}`).join(", ")}</span>
                  <span className="cortpanel__item-valor">{Number(cp.totalValor || 0).toFixed(2)} &euro;</span>
                </div>
                <div className="cortpanel__item-bottom">
                  <span>Autorizado: {cp.autorizadoPor?.nombre || "--"}</span>
                  {cp.notas && <span className="cortpanel__item-motivo">{cp.notas}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Config */}
        {c.tab === "config" && (
          <>
            <div className="cortpanel__resumen">
              {c.productosElegibles.length} productos elegibles para comida del personal
            </div>

            {c.prodError && (
              <div className="cortpanel__error">
                <span>{c.prodError}</span>
                <button onClick={c.fetchProductos}>Reintentar</button>
              </div>
            )}

            {c.prodLoading && <div className="cortpanel__loading">Cargando productos...</div>}

            {!c.prodLoading && !c.prodError && (
              <div className="cortpanel__list">
                {c.productos.map((prod) => (
                  <div key={prod._id} className={`cortpanel__item-config ${prod.elegibleComidaPersonal ? "cortpanel__item-config--active" : ""}`}>
                    <div className="cortpanel__config-info">
                      <strong>{prod.nombre}</strong>
                      <span className="cortpanel__config-cat">{prod.categoria}</span>
                      <span className="cortpanel__config-price">{Number(prod.precios?.[0]?.precio ?? 0).toFixed(2)} &euro;</span>
                    </div>
                    <button
                      className={`cortpanel__toggle ${prod.elegibleComidaPersonal ? "cortpanel__toggle--on" : ""}`}
                      onClick={() => c.handleToggleElegible(prod._id)}
                      disabled={c.toggling === prod._id}
                    >
                      {prod.elegibleComidaPersonal ? "Elegible" : "No elegible"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Registrar */}
        {c.tab === "registrar" && (
          <div className="cortpanel__form">
            {c.msgExito && <div className="cortpanel__msg-exito">{c.msgExito}</div>}
            {c.registroError && <div className="cortpanel__error"><span>{c.registroError}</span></div>}

            <label className="cortpanel__form-label">
              Empleado
              <select className="cortpanel__select" value={c.empleadoId} onChange={(e) => c.setEmpleadoId(e.target.value)}>
                <option value="">Seleccionar empleado...</option>
                {c.usuarios.map((u) => (
                  <option key={u._id} value={u._id}>{u.name || u.nombre || u.email || "Sin nombre"}</option>
                ))}
              </select>
            </label>

            <p className="cortpanel__form-hint">Solo productos marcados como elegibles</p>

            <div className="cortpanel__list">
              {c.productosElegibles.length === 0 && (
                <p className="cortpanel__empty">No hay productos elegibles. Ve a "Configurar" para activarlos.</p>
              )}
              {c.productosElegibles.map((prod) => {
                const enCarrito = c.carrito.find((i) => i.productoId === String(prod._id));
                return (
                  <div key={prod._id} className="cortpanel__item-config">
                    <div className="cortpanel__config-info">
                      <strong>{prod.nombre}</strong>
                      <span className="cortpanel__config-price">{Number(prod.precios?.[0]?.precio ?? 0).toFixed(2)} &euro;</span>
                    </div>
                    <div className="cortpanel__qty-controls">
                      {enCarrito && (
                        <>
                          <button className="cortpanel__qty-btn" onClick={() => c.quitarDelCarrito(String(prod._id))}>-</button>
                          <span className="cortpanel__qty">{enCarrito.cantidad}</span>
                        </>
                      )}
                      <button className="cortpanel__qty-btn cortpanel__qty-btn--add" onClick={() => c.agregarAlCarrito(prod)}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {c.carrito.length > 0 && (
              <div className="cortpanel__cart-summary">
                {c.carrito.map((i) => (
                  <div key={i.productoId} className="cortpanel__cart-line">
                    <span>{i.nombre} x{i.cantidad}</span>
                    <span>{(i.precio * i.cantidad).toFixed(2)} &euro;</span>
                  </div>
                ))}
                <div className="cortpanel__cart-total">
                  <strong>Total:</strong>
                  <strong>{c.totalCarrito.toFixed(2)} &euro;</strong>
                </div>
              </div>
            )}

            <label className="cortpanel__form-label">
              Notas (opcional)
              <input type="text" className="cortpanel__input" placeholder="Ej: Menu del dia..." value={c.notas} onChange={(e) => c.setNotas(e.target.value)} />
            </label>

            <button
              className="cortpanel__btn-submit"
              onClick={c.handleRegistrar}
              disabled={!c.empleadoId || c.carrito.length === 0 || c.enviando}
            >
              {c.enviando ? "Registrando..." : "Registrar consumo"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
