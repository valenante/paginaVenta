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
    <main className="prov-page section section--wide">
      {/* =========================
          Header
      ========================= */}
      <header className="prov-header card">
        <div className="prov-headLeft">
          <nav className="prov-breadcrumbs">
            <span className="prov-crumb">Configuración</span>
            <span className="prov-sep">/</span>
            <span className="prov-crumb is-active">Proveedores</span>
          </nav>

          <h1 className="prov-title">Proveedores</h1>
          <p className="prov-subtitle">
            Centraliza contactos, condiciones, pedidos y recepción con trazabilidad.
          </p>

          <div className="prov-metaRow">
            <span className="prov-pill">
              Total: <b>{total}</b>
            </span>
            <span className="prov-pill">
              Página: <b>{page}</b> / {totalPages}
            </span>
          </div>
        </div>

        <div className="prov-headRight">
          <div className="prov-actions">
            <button
              className="btn btn-secundario"
              type="button"
              onClick={fetchProveedores}
              disabled={loading}
            >
              {loading ? "Cargando…" : "Refrescar"}
            </button>

            <button className="btn btn-primario" type="button" onClick={onCreate}>
              ➕ Nuevo proveedor
            </button>
          </div>

          <div className="prov-search">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre, CIF, email, teléfono…"
            />

            <div className="prov-pageSize">
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
        </div>
      </header>

      {/* =========================
          Alertas (positivas)
      ========================= */}
      {alerta && (
        <div className="prov-alert">
          <AlertaMensaje
            tipo={alerta.tipo}
            mensaje={alerta.mensaje}
            onClose={() => setAlerta(null)}
          />
        </div>
      )}

      {/* =========================
          Error UX PRO (Toast)
      ========================= */}
      {error && (
        <ErrorToast
          error={error}
          onRetry={error.canRetry ? error.retryFn : undefined}
          onClose={() => setError(null)}
        />
      )}

      {/* =========================
          Listado
      ========================= */}
      <section className="prov-card card">
        {loading ? (
          <div className="prov-loading">Cargando proveedores…</div>
        ) : items.length === 0 ? (
          <div className="prov-empty">
            <div className="prov-empty__title">No hay proveedores</div>
            <div className="prov-empty__text">
              Crea tu primer proveedor para empezar a gestionar pedidos y recepción.
            </div>
            <button className="btn btn-primario" type="button" onClick={onCreate}>
              ➕ Crear proveedor
            </button>
          </div>
        ) : (
          <>
            <div className="prov-tableWrap">
              <table className="prov-table">
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Contacto</th>
                    <th>Condiciones</th>
                    <th className="t-right">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="prov-nameCell">
                          <div className="prov-name">
                            {p.nombreRestaurante || p.razonSocial || "—"}
                          </div>
                          <div className="prov-sub">
                            {p.nif ? `CIF/NIF: ${p.nif}` : "—"}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="prov-sub">{p?.contacto?.email || "—"}</div>
                        <div className="prov-sub">{p?.contacto?.telefono || "—"}</div>
                      </td>

                      <td>
                        <div className="prov-sub">
                          Pago: <b>{p?.condicionesPago?.metodo || "—"}</b>
                        </div>
                        <div className="prov-sub">
                          Lead time:{" "}
                          <b>
                            {Number.isFinite(p?.leadTimeDias)
                              ? `${p.leadTimeDias} días`
                              : "—"}
                          </b>
                        </div>
                      </td>

                      <td className="t-right">
                        <div className="prov-rowActions">
                          <Link
                            className="btn btn-secundario"
                            to={`/configuracion/proveedores/${p._id}`}
                          >
                            Ver
                          </Link>

                          <button
                            className="btn btn-primario"
                            type="button"
                            onClick={() => onEdit(p)}
                          >
                            Editar
                          </button>

                          <button
                            className="btn btn-secundario"
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

            <div className="prov-pager">
              <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(1)}>
                « Primero
              </button>

              <button
                className="btn-ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹ Anterior
              </button>

              <span className="prov-pagerInfo">
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

      {/* =========================
          Modales
      ========================= */}
      {(modal?.type === "create" || modal?.type === "edit") && (
        <ProveedorModal
          mode={modal.type}
          proveedor={modal.proveedor || null}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            showAlert("exito", modal.type === "create" ? "Proveedor creado." : "Proveedor actualizado.");
            fetchProveedores();
          }}
        />
      )}

      {modal?.type === "delete" && (
        <ModalConfirmacion
          titulo="Eliminar proveedor"
          mensaje={`¿Seguro que deseas eliminar "${modal?.proveedor?.nombreRestaurante || "este proveedor"}"? Esta acción no se puede deshacer.`}
          onConfirm={() => handleDelete(modal?.proveedor?._id)}
          onClose={() => setModal(null)}
        />
      )}
    </main>
  );
}