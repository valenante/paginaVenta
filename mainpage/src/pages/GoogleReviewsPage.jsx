import React, { useState } from "react";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import { useAutoFocus } from "../hooks/useAutoFocus";
import {
  useGoogleStatus,
  useGoogleReviews,
  useGooglePending,
  approveReview,
  rejectReview,
  updateGoogleConfig,
  getAuthUrl,
  disconnectGoogle,
} from "../hooks/useGoogleReviews";
import "./GoogleReviewsPage.css";

const TABS = [
  { key: "reviews", label: "Resenas" },
  { key: "pending", label: "Pendientes" },
  { key: "config", label: "Configuracion" },
];

const STATUS_FILTERS = [
  { value: "", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "published", label: "Publicadas" },
  { value: "rejected", label: "Rechazadas" },
  { value: "skipped", label: "Omitidas" },
];

const MODO_OPTIONS = [
  {
    value: "supervisado",
    label: "Supervisado",
    desc: "Publica automaticamente las positivas (4-5 estrellas). Las negativas quedan pendientes de tu aprobacion.",
  },
  {
    value: "automatico",
    label: "Automatico",
    desc: "Publica todas las respuestas generadas por IA sin intervencion.",
  },
  {
    value: "manual",
    label: "Manual",
    desc: "Todas las respuestas quedan pendientes de aprobacion antes de publicarse.",
  },
];

function Stars({ rating }) {
  return (
    <span className="grev-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "grev-star--filled" : "grev-star--empty"}>
          ★
        </span>
      ))}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: "Pendiente", cls: "pending" },
    approved: { label: "Aprobada", cls: "approved" },
    published: { label: "Publicada", cls: "published" },
    rejected: { label: "Rechazada", cls: "rejected" },
    skipped: { label: "Omitida", cls: "skipped" },
  };
  const s = map[status] || { label: status, cls: "" };
  return <span className={`grev-badge grev-badge--${s.cls}`}>{s.label}</span>;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Tab: Resenas ────────────────────────────────────────
function TabReviews() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error } = useGoogleReviews({ status: statusFilter, page });

  const reviews = data?.reviews || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20) || 1;

  return (
    <div className="grev-tab">
      <div className="grev-filters">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`grev-filter ${statusFilter === f.value ? "grev-filter--active" : ""}`}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <div className="grev-loading">Cargando resenas...</div>}
      {error && <div className="grev-error">{error}</div>}

      {!loading && reviews.length === 0 && (
        <div className="grev-empty">No hay resenas{statusFilter ? ` con estado "${statusFilter}"` : ""}.</div>
      )}

      {!loading && reviews.length > 0 && (
        <>
          <div className="grev-list">
            {reviews.map((r) => (
              <ReviewCard key={r._id} review={r} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="grev-pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
              <span className="grev-pagination__info">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Siguiente</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="grev-review">
      <div className="grev-review__header">
        <div className="grev-review__meta">
          <span className="grev-review__author">{review.authorName}</span>
          <Stars rating={review.rating} />
          <span className="grev-review__date">{formatDate(review.publishedAt)}</span>
        </div>
        <StatusBadge status={review.status} />
      </div>

      {review.text && (
        <p className="grev-review__text">{review.text}</p>
      )}

      {review.draftResponse && (
        <div className="grev-review__draft">
          <button
            className="grev-review__toggle"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Ocultar" : "Ver"} respuesta IA
            <span className="grev-review__toggle-arrow">{expanded ? "▲" : "▼"}</span>
          </button>
          {expanded && (
            <div className="grev-review__draft-text">
              {review.draftTone && (
                <span className="grev-review__tone">Tono: {review.draftTone}</span>
              )}
              <p>{review.draftResponse}</p>
            </div>
          )}
        </div>
      )}

      {review.rejectedReason && (
        <div className="grev-review__rejected">
          Motivo rechazo: {review.rejectedReason}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Pendientes ─────────────────────────────────────
function TabPending() {
  const { data, loading, error, refetch } = useGooglePending();
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [msg, setMsg] = useState(null);

  const autoFocusRef = useAutoFocus();

  const reviews = data?.reviews || [];

  const handleApprove = async (id) => {
    setActionLoading(id);
    setMsg(null);
    try {
      await approveReview(id);
      setMsg({ tipo: "ok", texto: "Respuesta publicada en Google" });
      refetch();
    } catch (err) {
      setMsg({ tipo: "error", texto: err?.response?.data?.message || "Error al aprobar" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) return;
    setActionLoading(id);
    setMsg(null);
    try {
      await rejectReview(id, rejectReason.trim());
      setMsg({ tipo: "ok", texto: "Borrador rechazado" });
      setRejectingId(null);
      setRejectReason("");
      refetch();
    } catch (err) {
      setMsg({ tipo: "error", texto: err?.response?.data?.message || "Error al rechazar" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="grev-tab">
      {msg && (
        <div className={`grev-toast grev-toast--${msg.tipo}`}>{msg.texto}</div>
      )}

      {loading && <div className="grev-loading">Cargando pendientes...</div>}
      {error && <div className="grev-error">{error}</div>}

      {!loading && reviews.length === 0 && (
        <div className="grev-empty">
          No hay resenas pendientes de aprobacion. Todo al dia.
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <div className="grev-pending-count">
          {reviews.length} resena{reviews.length !== 1 ? "s" : ""} pendiente{reviews.length !== 1 ? "s" : ""}
        </div>
      )}

      <div className="grev-list">
        {reviews.map((r) => (
          <div key={r._id} className="grev-review grev-review--pending">
            <div className="grev-review__header">
              <div className="grev-review__meta">
                <span className="grev-review__author">{r.authorName}</span>
                <Stars rating={r.rating} />
                <span className="grev-review__date">{formatDate(r.publishedAt)}</span>
              </div>
            </div>

            {r.text && <p className="grev-review__text">{r.text}</p>}

            {r.draftResponse && (
              <div className="grev-pending-draft">
                <span className="grev-pending-draft__label">Respuesta IA generada:</span>
                {r.draftTone && (
                  <span className="grev-review__tone">Tono: {r.draftTone}</span>
                )}
                <p className="grev-pending-draft__text">{r.draftResponse}</p>
              </div>
            )}

            <div className="grev-pending-actions">
              <button
                className="grev-btn grev-btn--approve"
                onClick={() => handleApprove(r._id)}
                disabled={actionLoading === r._id}
              >
                {actionLoading === r._id ? "Publicando..." : "Aprobar y publicar"}
              </button>

              {rejectingId === r._id ? (
                <div className="grev-reject-form">
                  <input
                    ref={autoFocusRef}
                    type="text"
                    className="grev-reject-input"
                    placeholder="Motivo del rechazo..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleReject(r._id)}
                  />
                  <button
                    className="grev-btn grev-btn--reject-confirm"
                    onClick={() => handleReject(r._id)}
                    disabled={actionLoading === r._id || !rejectReason.trim()}
                  >
                    Confirmar
                  </button>
                  <button
                    className="grev-btn grev-btn--cancel"
                    onClick={() => { setRejectingId(null); setRejectReason(""); }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  className="grev-btn grev-btn--reject"
                  onClick={() => setRejectingId(r._id)}
                  disabled={actionLoading === r._id}
                >
                  Rechazar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Configuracion ──────────────────────────────────
function TabConfig() {
  const { data: status, loading, error, refetch } = useGoogleStatus();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleModoChange = async (modo) => {
    setSaving(true);
    setMsg(null);
    try {
      await updateGoogleConfig({ modo });
      setMsg({ tipo: "ok", texto: "Modo actualizado" });
      refetch();
      setTimeout(() => setMsg(null), 2500);
    } catch (err) {
      setMsg({ tipo: "error", texto: err?.response?.data?.message || "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await updateGoogleConfig({ enabled: !status?.enabled });
      setMsg({ tipo: "ok", texto: status?.enabled ? "Desactivado" : "Activado" });
      refetch();
      setTimeout(() => setMsg(null), 2500);
    } catch (err) {
      setMsg({ tipo: "error", texto: err?.response?.data?.message || "Error" });
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await getAuthUrl();
      if (res?.url) {
        window.open(res.url, "_blank", "noopener");
      }
    } catch (err) {
      setMsg({ tipo: "error", texto: err?.response?.data?.message || "Error al obtener URL" });
    } finally {
      setConnecting(false);
    }
  };

  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);

  const handleDisconnect = async () => {
    setShowConfirmDisconnect(false);
    setDisconnecting(true);
    setMsg(null);
    try {
      await disconnectGoogle();
      setMsg({ tipo: "ok", texto: "Google desconectado" });
      refetch();
    } catch (err) {
      setMsg({ tipo: "error", texto: err?.response?.data?.message || "Error al desconectar" });
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) return <div className="grev-loading">Cargando configuracion...</div>;
  if (error) return <div className="grev-error">{error}</div>;

  return (
    <div className="grev-tab">
      {msg && (
        <div className={`grev-toast grev-toast--${msg.tipo}`}>{msg.texto}</div>
      )}

      {/* Conexion Google */}
      <div className="grev-config-section">
        <h3 className="grev-config-section__title">Conexion Google Business</h3>

        <div className="grev-config-connection">
          <div className={`grev-config-status ${status?.connected ? "grev-config-status--ok" : "grev-config-status--off"}`}>
            <span className="grev-config-status__dot" />
            <span>{status?.connected ? "Conectado" : "No conectado"}</span>
          </div>

          {status?.locationName && (
            <div className="grev-config-location">
              Ubicacion: <strong>{status.locationName}</strong>
            </div>
          )}

          {status?.connected ? (
            <button
              className="grev-btn grev-btn--disconnect"
              onClick={() => setShowConfirmDisconnect(true)}
              disabled={disconnecting}
            >
              {disconnecting ? "Desconectando..." : "Desconectar"}
            </button>
          ) : (
            <button
              className="grev-btn grev-btn--connect"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? "Abriendo..." : "Conectar Google Business"}
            </button>
          )}
        </div>
      </div>

      {/* Activar/Desactivar */}
      {status?.connected && (
        <div className="grev-config-section">
          <h3 className="grev-config-section__title">Respuestas automaticas</h3>

          <div className="grev-config-toggle-row">
            <div>
              <span className="grev-config-toggle-label">
                {status?.enabled ? "Activado" : "Desactivado"}
              </span>
              <span className="grev-config-toggle-desc">
                {status?.enabled
                  ? "Las resenas nuevas se procesan cada 30 minutos."
                  : "Las resenas no se procesaran hasta que actives esta opcion."}
              </span>
            </div>
            <button
              className={`grev-toggle ${status?.enabled ? "grev-toggle--on" : ""}`}
              onClick={handleToggleEnabled}
              disabled={saving}
              aria-label={status?.enabled ? "Desactivar" : "Activar"}
            >
              <span className="grev-toggle__knob" />
            </button>
          </div>
        </div>
      )}

      {/* Modo */}
      {status?.connected && status?.enabled && (
        <div className="grev-config-section">
          <h3 className="grev-config-section__title">Modo de publicacion</h3>
          <div className="grev-config-modes">
            {MODO_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`grev-mode-option ${status?.modo === opt.value ? "grev-mode-option--active" : ""}`}
              >
                <input
                  type="radio"
                  name="modo"
                  value={opt.value}
                  checked={status?.modo === opt.value}
                  onChange={() => handleModoChange(opt.value)}
                  disabled={saving}
                />
                <div className="grev-mode-option__body">
                  <span className="grev-mode-option__label">{opt.label}</span>
                  <span className="grev-mode-option__desc">{opt.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {showConfirmDisconnect && (
        <ModalConfirmacion
          titulo="Desconectar Google Business"
          mensaje="Se dejarán de procesar reseñas automáticamente. ¿Deseas continuar?"
          onConfirm={handleDisconnect}
          onClose={() => setShowConfirmDisconnect(false)}
        />
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────
export default function GoogleReviewsPage() {
  const [tab, setTab] = useState("reviews");
  const { data: status } = useGoogleStatus();
  const { data: pendingData } = useGooglePending();

  const pendingCount = pendingData?.reviews?.length || 0;

  return (
    <div className="grev-root">
      <div className="grev-header">
        <div>
          <h2>Google Reviews</h2>
          <p className="grev-header__subtitle">
            Gestiona las resenas de Google Business con respuestas generadas por IA.
          </p>
        </div>
        {status?.connected && (
          <div className={`grev-header__status ${status?.enabled ? "grev-header__status--on" : "grev-header__status--off"}`}>
            <span className="grev-header__status-dot" />
            {status?.enabled ? `Activo (${status?.modo || "supervisado"})` : "Pausado"}
          </div>
        )}
      </div>

      <div className="grev-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`grev-tab-btn ${tab === t.key ? "grev-tab-btn--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === "pending" && pendingCount > 0 && (
              <span className="grev-tab-btn__badge">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "reviews" && <TabReviews />}
      {tab === "pending" && <TabPending />}
      {tab === "config" && <TabConfig />}
    </div>
  );
}
