// src/pages/ProveedoresPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useTenant } from "../context/TenantContext";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import ProveedorModal from "../components/Proveedores/ProveedorModal.jsx";
import ErrorToast from "../components/common/ErrorToast.jsx";
import { normalizeApiError } from "../utils/normalizeApiError.js";
import AlertaMensaje from "../components/AlertaMensaje/AlertaMensaje.jsx";
import "../styles/ProveedoresPage.css";

const PAGE_SIZE_DEFAULT = 12;

export default function ProveedoresPage() {
  const { tenantId } = useTenant();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);

  // ✅ UX PRO
  const [error, setError] = useState(null);
  const [alerta, setAlerta] = useState(null); // opcional: success/info

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  const [modal, setModal] = useState(null); // { type: "create" | "edit" | "delete", proveedor? }

  // Si tu api.js ya mete x-tenant-id automáticamente, puedes borrar esto.
  const headersTenant = useMemo(() => {
    return tenantId ? { headers: { "x-tenant-id": tenantId } } : {};
  }, [tenantId]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((total || 0) / pageSize));
  }, [total, pageSize]);

  const showAlert = useCallback((tipo, mensaje) => {
    setAlerta({ tipo, mensaje });
  }, []);

  const fetchProveedores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await api.get("/admin/proveedores", {
        ...headersTenant,
        params: {
          q: q || undefined,
          page,
          limit: pageSize,
        },
      });

      setItems(data?.items || []);
      setTotal(Number(data?.total || 0));
    } catch (err) {
      setItems([]);
      setTotal(0);

      const normalized = normalizeApiError(err);
      setError({
        ...normalized,
        retryFn: fetchProveedores,
      });
    } finally {
      setLoading(false);
    }
  }, [headersTenant, q, page, pageSize]);

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores, tenantId]);

  const onCreate = () => setModal({ type: "create" });
  const onEdit = (p) => setModal({ type: "edit", proveedor: p });
  const onDelete = (p) => setModal({ type: "delete", proveedor: p });

  const handleDelete = useCallback(
    async (id) => {
      try {
        setError(null);
        setAlerta(null);

        await api.delete(`/admin/proveedores/${id}`, headersTenant);
        setModal(null);

        showAlert("exito", "Proveedor eliminado correctamente.");
        fetchProveedores();
      } catch (err) {
        const normalized = normalizeApiError(err);
        setError({
          ...normalized,
          retryFn: () => handleDelete(id),
        });
      }
    },
    [headersTenant, fetchProveedores, showAlert]
  );

  return (
    <main className="proveedores-config-page cfg-page section section--wide">
      {alerta && (
        <AlertaMensaje
          tipo={alerta.tipo}
          mensaje={alerta.mensaje}
          onClose={() => setAlerta(null)}
        />
      )}

      {error && (
        <ErrorToast
          error={error}
          onRetry={error.canRetry ? error.retryFn : undefined}
          onClose={() => setError(null)}
        />
      )}

      <header className="proveedores-config-header cfg-header">
        <div>
          <h1>🏭 Proveedores</h1>
          <p className="text-suave">
            Centraliza contactos, condiciones comerciales y acceso rápido al detalle
            de cada proveedor desde una vista Alef clara y consistente.
          </p>
        </div>

        <div className="proveedores-config-header-status">
          <span className="badge badge-exito">
            {total} proveedor{total === 1 ? "" : "es"}
          </span>
        </div>
      </header>

      <div className="proveedores-config-layout cfg-layout">
        <div className="proveedores-config-main">
          {/* RESUMEN + ACCIONES */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Resumen y herramientas</h2>
                <p className="config-card-subtitle">
                  Consulta el total de proveedores, cambia la paginación y ejecuta
                  acciones rápidas de gestión.
                </p>
              </div>
            </div>

            <div className="proveedores-config-toolbar cfg-toolbar">
              <button
                className="btn btn-secundario"
                type="button"
                onClick={fetchProveedores}
                disabled={loading}
              >
                {loading ? "Cargando…" : "Refrescar"}
              </button>

              <button
                className="btn btn-primario"
                type="button"
                onClick={onCreate}
              >
                ➕ Nuevo proveedor
              </button>
            </div>

            <div className="proveedores-config-stats cfg-stats">
              <article className="proveedores-config-stat cfg-stat">
                <span className="proveedores-config-stat__label cfg-stat__label">Total</span>
                <strong>{total}</strong>
              </article>

              <article className="proveedores-config-stat cfg-stat">
                <span className="proveedores-config-stat__label cfg-stat__label">Página actual</span>
                <strong>{page}</strong>
              </article>

              <article className="proveedores-config-stat cfg-stat">
                <span className="proveedores-config-stat__label cfg-stat__label">Total páginas</span>
                <strong>{totalPages}</strong>
              </article>
            </div>
          </section>

          {/* FILTROS */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Búsqueda y paginación</h2>
                <p className="config-card-subtitle">
                  Busca por nombre, CIF, email o teléfono y ajusta cuántos resultados
                  ver por página.
                </p>
              </div>
            </div>

            <div className="proveedores-config-filtros">
              <div className="config-field proveedores-config-filtros__search">
                <label>Buscar proveedor</label>
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar por nombre, CIF, email, teléfono…"
                />
              </div>

              <div className="config-field proveedores-config-filtros__size">
                <label>Por página</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value) || PAGE_SIZE_DEFAULT);
                    setPage(1);
                  }}
                >
                  <option value={12}>12</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </section>

          {/* LISTADO */}
          <section className="card config-card">
            <div className="config-card-header">
              <div>
                <h2>Listado de proveedores</h2>
                <p className="config-card-subtitle">
                  Revisa la información principal de cada proveedor y accede a sus
                  acciones disponibles.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="proveedores-loading">
                Cargando proveedores…
              </div>
            ) : items.length === 0 ? (
              <div className="proveedores-empty">
                <div className="proveedores-empty__title">No hay proveedores</div>
                <div className="proveedores-empty__text">
                  Crea tu primer proveedor para empezar a gestionar pedidos y recepción.
                </div>
                <button className="btn btn-primario" type="button" onClick={onCreate}>
                  ➕ Crear proveedor
                </button>
              </div>
            ) : (
              <>
                <div className="proveedores-table-scroll">
                  <table className="proveedores-table">
                    <thead>
                      <tr>
                        <th>Proveedor</th>
                        <th>Contacto</th>
                        <th>Condiciones</th>
                        <th className="col-acciones">Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((p) => (
                        <tr key={p._id}>
                          <td data-label="Proveedor">
                            <div className="proveedores-name-cell">
                              <div className="proveedores-name">
                                {p.nombreRestaurante || p.razonSocial || "—"}
                              </div>
                              <div className="proveedores-sub">
                                {p.nif ? `CIF/NIF: ${p.nif}` : "—"}
                              </div>
                            </div>
                          </td>

                          <td data-label="Contacto">
                            <div className="proveedores-sub">
                              {p?.contacto?.email || "—"}
                            </div>
                            <div className="proveedores-sub">
                              {p?.contacto?.telefono || "—"}
                            </div>
                          </td>

                          <td data-label="Condiciones">
                            <div className="proveedores-sub">
                              Pago: <b>{p?.condicionesPago?.metodo || "—"}</b>
                            </div>
                            <div className="proveedores-sub">
                              Lead time:{" "}
                              <b>
                                {Number.isFinite(p?.leadTimeDias)
                                  ? `${p.leadTimeDias} días`
                                  : "—"}
                              </b>
                            </div>
                          </td>

                          <td data-label="Acciones">
                            <div className="proveedores-row-actions">
                              <Link
                                className="btn btn-secundario btn-compact"
                                to={`/configuracion/proveedores/${p._id}`}
                              >
                                Ver
                              </Link>

                              <button
                                className="btn btn-primario btn-compact"
                                type="button"
                                onClick={() => onEdit(p)}
                              >
                                Editar
                              </button>

                              <button
                                className="btn btn-secundario btn-compact"
                                type="button"
                                onClick={() => onDelete(p)}
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

                <div className="proveedores-pager">
                  <button
                    className="btn-ghost"
                    disabled={page <= 1}
                    onClick={() => setPage(1)}
                  >
                    « Primero
                  </button>

                  <button
                    className="btn-ghost"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ‹ Anterior
                  </button>

                  <span className="proveedores-pager-info">
                    Página <b>{page}</b> / {totalPages}
                  </span>

                  <button
                    className="btn-ghost"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente ›
                  </button>

                  <button
                    className="btn-ghost"
                    disabled={page >= totalPages}
                    onClick={() => setPage(totalPages)}
                  >
                    Último »
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {(modal?.type === "create" || modal?.type === "edit") && (
        <ProveedorModal
          mode={modal.type}
          proveedor={modal.proveedor || null}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            showAlert(
              "exito",
              modal.type === "create"
                ? "Proveedor creado."
                : "Proveedor actualizado."
            );
            fetchProveedores();
          }}
        />
      )}

      {modal?.type === "delete" && (
        <ModalConfirmacion
          titulo="Eliminar proveedor"
          mensaje={`¿Seguro que deseas eliminar "${modal?.proveedor?.nombreRestaurante || "este proveedor"
            }"? Esta acción no se puede deshacer.`}
          onConfirm={() => handleDelete(modal?.proveedor?._id)}
          onClose={() => setModal(null)}
        />
      )}
    </main>
  );
}