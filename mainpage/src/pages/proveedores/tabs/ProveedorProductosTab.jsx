import React, { useEffect, useState, useRef } from "react";
import { useOutletContext, useParams, useSearchParams } from "react-router-dom";
import api from "../../../utils/api";
import ModalConfirmacion from "../../../components/Modal/ModalConfirmacion.jsx";
import ProductoProveedorModal from "../../../components/Proveedores/ProductoProveedorModal.jsx";
import "./ProveedorProductosTab.css";

export default function ProveedorProductosTab() {
  const { proveedorId } = useParams();
  const { headersTenant } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalProducto, setModalProducto] = useState(null);
  const [modalDelete, setModalDelete] = useState(null);
  const ppAutoOpened = useRef(false);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(
        `/admin/proveedores/${proveedorId}/productos`,
        headersTenant
      );
      const fetched = data?.items || [];
      setItems(fetched);
      return fetched;
    } catch {
      setError("No se pudieron cargar los productos.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos().then((fetched) => {
      // Auto-abrir modal si viene ?pp=<id> en la URL
      const ppId = searchParams.get("pp");
      if (ppId && !ppAutoOpened.current && fetched.length > 0) {
        ppAutoOpened.current = true;
        const match = fetched.find((p) => p._id === ppId);
        if (match) {
          setModalProducto({ mode: "edit", producto: match });
          // Limpiar el param para que no se reabra al navegar
          searchParams.delete("pp");
          setSearchParams(searchParams, { replace: true });
        }
      }
    });
  }, [proveedorId]);

  const handleDelete = async (productoId) => {
    await api.delete(
      `/admin/proveedores/${proveedorId}/productos/${productoId}`,
      headersTenant
    );
    setModalDelete(null);
    fetchProductos();
  };

  return (
    <section className="provDet-grid">
      <div className="card provDet-card provDet-card--full">
        {/* Header */}
        <div className="provTab-header">
          <h2 className="provDet-cardTitle">Productos del proveedor</h2>
          <button
            className="btn btn-primario "
            onClick={() => setModalProducto({ mode: "create" })}
          >
            ➕ Nuevo producto
          </button>
        </div>

        {/* Estados */}
        {loading && <div className="provDet-loading">Cargando productos…</div>}
        {error && <div className="provDet-alert provDet-alert--error">{error}</div>}

        {!loading && items.length === 0 && (
          <div className="provDet-empty">
            Este proveedor no tiene productos registrados.
          </div>
        )}

        {/* DESKTOP TABLE */}
        {!loading && items.length > 0 && (
          <div className="prov-tableWrap only-desktop">
            <table className="prov-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Unidad</th>
                  <th>Formato</th>
                  <th>Precio (sin IVA)</th>
                  <th>Precio (con IVA)</th>
                  <th>IVA</th>
                  <th>Estado</th>
                  <th className="t-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id}>
                    <td className="prov-name">{p.nombre}</td>
                    <td>{p.unidad || "—"}</td>
                    <td>{p.formato || "—"}</td>
                    <td>{Number(p.precioBase).toFixed(2)} €</td>
                    <td>{(Number(p.precioBase) * (1 + (Number(p.iva) || 0) / 100)).toFixed(2)} €</td>
                    <td>{p.iva}%</td>
                    <td>
                      <span className={`prov-pill ${p.activo === false ? "is-off" : ""}`}>
                        {p.activo === false ? "Inactivo" : "Activo"}
                      </span>
                    </td>
                    <td className="t-right">
                      <div className="prov-rowActions">
                        <button
                          className="btn btn-primario "
                          onClick={() =>
                            setModalProducto({ mode: "edit", producto: p })
                          }
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-secundario"
                          onClick={() =>
                            setModalProducto({ mode: "create", producto: { ...p, _id: undefined, nombre: `${p.nombre} (copia)` } })
                          }
                        >
                          Clonar
                        </button>
                        <button
                          className="btn btn-secundario"
                          onClick={() => setModalDelete(p)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MOBILE CARDS */}
        {!loading && items.length > 0 && (
          <div className="prov-mobileList only-mobile">
            {items.map((p) => (
              <div key={p._id} className="prov-mobileCard">
                <div className="prov-mobileHeader">
                  <span className="prov-name">{p.nombre}</span>
                  <span className={`prov-pill ${p.activo === false ? "is-off" : ""}`}>
                    {p.activo === false ? "Inactivo" : "Activo"}
                  </span>
                </div>

                <div className="prov-mobileGrid">
                  <div>
                    <span className="k">Unidad</span>
                    <span className="v">{p.unidad || "—"}</span>
                  </div>
                  <div>
                    <span className="k">Formato</span>
                    <span className="v">{p.formato || "—"}</span>
                  </div>
                  <div>
                    <span className="k">Sin IVA</span>
                    <span className="v">{Number(p.precioBase).toFixed(2)} €</span>
                  </div>
                  <div>
                    <span className="k">Con IVA</span>
                    <span className="v">{(Number(p.precioBase) * (1 + (Number(p.iva) || 0) / 100)).toFixed(2)} €</span>
                  </div>
                  <div>
                    <span className="k">IVA</span>
                    <span className="v">{p.iva}%</span>
                  </div>
                </div>

                <div className="prov-mobileActions">
                  <button
                    className="btn btn-primario "
                    onClick={() => setModalProducto({ mode: "edit", producto: p })}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-secundario"
                    onClick={() =>
                      setModalProducto({ mode: "create", producto: { ...p, _id: undefined, nombre: `${p.nombre} (copia)` } })
                    }
                  >
                    Clonar
                  </button>
                  <button
                    className="btn btn-secundario"
                    onClick={() => setModalDelete(p)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      {modalDelete && (
        <ModalConfirmacion
          titulo="Eliminar producto"
          mensaje={`¿Eliminar "${modalDelete.nombre}"?`}
          onConfirm={() => handleDelete(modalDelete._id)}
          onClose={() => setModalDelete(null)}
        />
      )}

      {modalProducto && (
        <ProductoProveedorModal
          mode={modalProducto.mode}
          producto={modalProducto.producto}
          onClose={() => setModalProducto(null)}
          onSaved={fetchProductos}
        />
      )}
    </section>
  );
}
