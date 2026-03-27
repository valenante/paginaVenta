import { useCortesias } from "../../Hooks/useCortesias";
import "./CortesiasPage.css";

export default function CortesiasPage() {
  const c = useCortesias();

  return (
    <div className="cort-page">
      {/* ===== HEADER ===== */}
      <div className="cort-page__header">
        <div>
          <h2>Cortesias e Invitaciones</h2>
          <p>Gestiona invitaciones a clientes, comida del personal y productos elegibles.</p>
        </div>

        {(c.tab === "invitaciones" || c.tab === "personal") && (
          <div className="cort-page__header-actions">
            <input type="date" value={c.desde} onChange={(e) => c.setDesde(e.target.value)} className="cort-page__date" />
            <input type="date" value={c.hasta} onChange={(e) => c.setHasta(e.target.value)} className="cort-page__date" />
          </div>
        )}
      </div>

      {/* ===== TABS ===== */}
      <div className="cort-page__tabs">
        {[
          { key: "invitaciones", label: "Invitaciones" },
          { key: "personal", label: "Consumo personal" },
          { key: "config", label: "Productos elegibles" },
          { key: "registrar", label: "Registrar consumo" },
        ].map((t) => (
          <button
            key={t.key}
            className={`cort-page__tab ${c.tab === t.key ? "cort-page__tab--active" : ""}`}
            onClick={() => c.setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== KPI ===== */}
      {(c.tab === "invitaciones" || c.tab === "personal") && (
        <div className="cort-page__kpi">
          {c.tab === "invitaciones" ? (
            <>
              <div className="cort-page__kpi-card">
                <span>Total invitaciones</span>
                <strong>{c.resumenInv.totalItems}</strong>
              </div>
              <div className="cort-page__kpi-card">
                <span>Valor total</span>
                <strong>{Number(c.resumenInv.totalValor || 0).toFixed(2)} &euro;</strong>
              </div>
            </>
          ) : (
            <>
              <div className="cort-page__kpi-card">
                <span>Total registros</span>
                <strong>{c.resumenCp.totalRegistros}</strong>
              </div>
              <div className="cort-page__kpi-card">
                <span>Valor total</span>
                <strong>{Number(c.resumenCp.totalValor || 0).toFixed(2)} &euro;</strong>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== ERROR ===== */}
      {c.error && (
        <div className="cort-page__error">
          <span>{c.error}</span>
          <button onClick={c.fetchTabData}>Reintentar</button>
        </div>
      )}

      {c.loading && (c.tab === "invitaciones" || c.tab === "personal") && (
        <div className="cort-page__empty">Cargando...</div>
      )}

      {/* ===== INVITACIONES ===== */}
      {!c.loading && !c.error && c.tab === "invitaciones" && (
        <div className="cort-page__table-wrapper">
          {c.invitaciones.length === 0 ? (
            <div className="cort-page__empty">No hay invitaciones en este periodo.</div>
          ) : (
            <table className="cort-page__table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="center">Cant.</th>
                  <th className="center">Valor</th>
                  <th>Mesa</th>
                  <th>Autorizado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {c.invitaciones.map((inv) => (
                  <tr key={inv._id}>
                    <td><strong>{inv.nombre}</strong></td>
                    <td className="center">{inv.cantidad}</td>
                    <td className="center">{Number((inv.precioOriginal || 0) * (inv.cantidad || 1)).toFixed(2)} &euro;</td>
                    <td>{inv.mesa ?? "--"}</td>
                    <td>{inv.autorizadoPor || "--"}</td>
                    <td className="cort-page__table-date">{c.fmtFecha(inv.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ===== CONSUMO PERSONAL ===== */}
      {!c.loading && !c.error && c.tab === "personal" && (
        <div className="cort-page__table-wrapper">
          {c.consumos.length === 0 ? (
            <div className="cort-page__empty">No hay consumos del personal en este periodo.</div>
          ) : (
            <table className="cort-page__table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Productos</th>
                  <th className="center">Valor</th>
                  <th>Autorizado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {c.consumos.map((cp) => (
                  <tr key={cp._id}>
                    <td><strong>{cp.empleado?.nombre || "Empleado"}</strong></td>
                    <td className="cort-page__table-products">{(cp.items || []).map((i) => `${i.nombre} x${i.cantidad}`).join(", ")}</td>
                    <td className="center cort-page__table-valor">{Number(cp.totalValor || 0).toFixed(2)} &euro;</td>
                    <td>{cp.autorizadoPor?.nombre || "--"}</td>
                    <td className="cort-page__table-date">{c.fmtFecha(cp.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ===== CONFIG ===== */}
      {c.tab === "config" && (
        <>
          <div className="cort-page__info-card">
            <h4>Productos elegibles para comida del personal</h4>
            <p>{c.prodPagination.total} productos encontrados</p>
          </div>

          <div className="cort-page__filter-bar">
            <input
              type="text"
              className="cort-page__date"
              placeholder="Buscar producto..."
              value={c.busquedaProd}
              onChange={(e) => { c.setBusquedaProd(e.target.value); c.setProdPage(1); }}
            />
          </div>

          {c.prodError && (
            <div className="cort-page__error">
              <span>{c.prodError}</span>
              <button onClick={c.fetchProductos}>Reintentar</button>
            </div>
          )}

          {c.prodLoading && <div className="cort-page__empty">Cargando productos...</div>}

          {!c.prodLoading && !c.prodError && (
            <>
              <div className="cort-page__table-wrapper">
                <table className="cort-page__table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Categoria</th>
                      <th className="center">Precio</th>
                      <th className="center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.productos.map((prod) => (
                      <tr key={prod._id} className={prod.elegibleComidaPersonal ? "cort-page__row--on" : ""}>
                        <td><strong>{prod.nombre}</strong></td>
                        <td className="cort-page__table-date">{prod.categoria}</td>
                        <td className="center">{Number(prod.precios?.[0]?.precio ?? 0).toFixed(2)} &euro;</td>
                        <td className="center">
                          <button
                            className={`cort-page__toggle ${prod.elegibleComidaPersonal ? "cort-page__toggle--on" : ""}`}
                            onClick={() => c.handleToggleElegible(prod._id)}
                            disabled={c.toggling === prod._id}
                          >
                            {prod.elegibleComidaPersonal ? "Elegible" : "No elegible"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {c.prodPagination.totalPages > 1 && (
                <div className="cort-page__pagination">
                  <button className="cort-page__pag-btn" onClick={() => c.setProdPage((p) => Math.max(1, p - 1))} disabled={!c.prodPagination.hasPrev}>Anterior</button>
                  <span className="cort-page__pag-info">{c.prodPagination.page} / {c.prodPagination.totalPages}</span>
                  <button className="cort-page__pag-btn" onClick={() => c.setProdPage((p) => p + 1)} disabled={!c.prodPagination.hasNext}>Siguiente</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ===== REGISTRAR ===== */}
      {c.tab === "registrar" && (
        <div className="cort-page__form">
          {c.msgExito && <div className="cort-page__msg-exito">{c.msgExito}</div>}
          {c.registroError && <div className="cort-page__error"><span>{c.registroError}</span></div>}

          <div className="cort-page__info-card">
            <h4>Registrar comida del personal</h4>
            <p>Selecciona un empleado y los productos que ha consumido.</p>
          </div>

          <label className="cort-page__form-label">
            Empleado
            <select className="cort-page__select" value={c.empleadoId} onChange={(e) => c.setEmpleadoId(e.target.value)}>
              <option value="">Seleccionar empleado...</option>
              {c.usuarios.map((u) => (
                <option key={u._id} value={u._id}>{u.name || u.nombre || u.email || "Sin nombre"}</option>
              ))}
            </select>
          </label>

          <div className="cort-page__table-wrapper">
            {c.productosElegibles.length === 0 ? (
              <div className="cort-page__empty">No hay productos elegibles. Ve a "Productos elegibles" para activarlos.</div>
            ) : (
              <table className="cort-page__table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="center">Precio</th>
                    <th className="center">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {c.productosElegibles.map((prod) => {
                    const enCarrito = c.carrito.find((i) => i.productoId === String(prod._id));
                    return (
                      <tr key={prod._id} className={enCarrito ? "cort-page__row--on" : ""}>
                        <td><strong>{prod.nombre}</strong></td>
                        <td className="center">{Number(prod.precios?.[0]?.precio ?? 0).toFixed(2)} &euro;</td>
                        <td className="center">
                          <div className="cort-page__qty-controls">
                            {enCarrito && (
                              <>
                                <button className="cort-page__qty-btn" onClick={() => c.quitarDelCarrito(String(prod._id))}>-</button>
                                <span className="cort-page__qty">{enCarrito.cantidad}</span>
                              </>
                            )}
                            <button className="cort-page__qty-btn cort-page__qty-btn--add" onClick={() => c.agregarAlCarrito(prod)}>+</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {c.carrito.length > 0 && (
            <div className="cort-page__cart">
              {c.carrito.map((i) => (
                <div key={i.productoId} className="cort-page__cart-line">
                  <span>{i.nombre} x{i.cantidad}</span>
                  <span>{(i.precio * i.cantidad).toFixed(2)} &euro;</span>
                </div>
              ))}
              <div className="cort-page__cart-total">
                <strong>Total:</strong>
                <strong>{c.totalCarrito.toFixed(2)} &euro;</strong>
              </div>
            </div>
          )}

          <label className="cort-page__form-label">
            Notas (opcional)
            <input type="text" className="cort-page__input" placeholder="Ej: Menu del dia..." value={c.notas} onChange={(e) => c.setNotas(e.target.value)} />
          </label>

          <button
            className="cort-page__btn-submit"
            onClick={c.handleRegistrar}
            disabled={!c.empleadoId || c.carrito.length === 0 || c.enviando}
          >
            {c.enviando ? "Registrando..." : "Registrar consumo"}
          </button>
        </div>
      )}
    </div>
  );
}
