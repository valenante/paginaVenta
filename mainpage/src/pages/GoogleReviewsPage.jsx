import React, { useEffect, useState } from "react";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import { useAutoFocus } from "../hooks/useAutoFocus";
import { useLocale } from "../hooks/useLocale";
import {
  useGoogleStatus,
  useGoogleReviews,
  useGooglePending,
  approveReview,
  rejectReview,
  saveDraftReview,
  respondReview,
  esBorradorCambiado,
  listGoogleAccounts,
  listGoogleLocations,
  selectGoogleLocation,
  updateGoogleConfig,
  getAuthUrl,
  disconnectGoogle,
} from "../hooks/useGoogleReviews";
import { leerQuery, quitarDeQuery } from "../utils/parametrosDeVuelta";
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
  { value: "error", label: "Con error" },
];

// El modo de partida de un cliente nuevo es MANUAL (decisión R2-ART16, F6): lo pone el backend,
// el panel no inventa un default (pinta `status.modo` tal cual).
const TEXTO_MODO_MANUAL =
  "Estás en modo Manual: la IA te prepara la respuesta de cada reseña; tú la revisas y la publicas con un clic. Cuando quieras, pasa a Supervisado.";

// Textos = lo que hace el backend (`reviewFlow.service.js` → `decidirAutopublicacion`):
// supervisado ≤3★ pendiente · automático ≤2★ pendiente · manual todo pendiente. En los tres,
// las reseñas anteriores a la conexión y las respuestas con enlaces/teléfonos/códigos
// (filtro de salida) quedan también pendientes.
const MODO_OPTIONS = [
  {
    value: "supervisado",
    label: "Supervisado",
    desc: "Publica sola la respuesta a las reseñas de 4 y 5 estrellas. Las de 3 estrellas o menos quedan pendientes para que tú las revises.",
  },
  {
    value: "automatico",
    label: "Automatico",
    desc: "Publica sola la respuesta a las reseñas de 3, 4 y 5 estrellas. Las de 1 y 2 estrellas no se publican solas: quedan pendientes para ti.",
  },
  {
    value: "manual",
    label: "Manual",
    desc: "Tú revisas y publicas cada respuesta; cuando quieras, pasa a Supervisado.",
  },
];

const MODO_NOTA =
  "En cualquier modo quedan siempre pendientes las reseñas que ya existian antes de conectar y las respuestas que lleven enlaces, telefonos, emails o codigos de descuento.";

// `estado` real de la integración (GET /status). null = todavía no se ha sincronizado nunca.
const ESTADO_TEXTOS = {
  ok: { cls: "ok", titulo: "Funcionando", texto: "ALEF lee las reseñas de tu ficha de Google." },
  sin_negocio: {
    cls: "warn",
    titulo: "Falta elegir la ficha",
    texto: "Elige la ficha de Google de tu restaurante. Sin ella ALEF no puede leer ninguna reseña.",
  },
  token_invalido: {
    cls: "error",
    titulo: "Permiso retirado",
    texto: "Google ha retirado el permiso de ALEF. Vuelve a conectar la cuenta.",
  },
  sin_acceso_api: {
    cls: "warn",
    titulo: "Pendiente de Google",
    texto: "Google aún no ha aprobado el acceso de ALEF a la API de reseñas; lo estamos tramitando. No tienes que hacer nada.",
  },
  error: {
    cls: "error",
    titulo: "Error al sincronizar",
    texto: "Google no respondió bien en la última sincronización. Se volverá a intentar sola.",
  },
};
const ESTADO_SIN_SYNC = {
  cls: "off",
  titulo: "Sin sincronizar",
  texto: "Todavía no se ha leído ninguna reseña de Google.",
};

function formatDateTime(iso, locale = "es-ES") {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(locale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// R4C-1: el texto que se ENSEÑA y se propone editar es `textoAPublicar` — exactamente el que certifica
// `huellaBorrador` (puede ser `respuestaAprobada`, no el `draftResponse`). Si no viene (backend viejo),
// `draftResponse`. Así lo que el dueño ve es lo que aprueba con la huella que manda.
const textoVisible = (r) => r?.textoAPublicar ?? r?.draftResponse ?? "";

const msgDeError = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

function EstadoIntegracion({ status }) {
  const { locale } = useLocale();
  if (!status?.connected) return null;
  const e = (status.estado && ESTADO_TEXTOS[status.estado]) || ESTADO_SIN_SYNC;
  return (
    <div className={`grev-estado grev-estado--${e.cls}`} data-testid="grev-estado">
      <div className="grev-estado__titulo">{e.titulo}</div>
      <p className="grev-estado__texto">{e.texto}</p>
      <div className="grev-estado__meta">
        {status.ultimaSyncAt
          ? <span>Ultima sincronizacion correcta: {formatDateTime(status.ultimaSyncAt, locale)}</span>
          : <span>Aun no hay ninguna sincronizacion correcta.</span>}
        {status.ultimoError && status.estado !== "ok" && (
          <span className="grev-estado__error">Ultimo error: {status.ultimoError}</span>
        )}
      </div>
    </div>
  );
}

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
    error: { label: "Error al publicar", cls: "rejected" },
  };
  const s = map[status] || { label: status, cls: "" };
  return <span className={`grev-badge grev-badge--${s.cls}`}>{s.label}</span>;
}

function formatDate(iso, locale = "es-ES") {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Tab: Resenas ────────────────────────────────────────
function TabReviews() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useGoogleReviews({ status: statusFilter, page });

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
              <ReviewCard key={r._id} review={r} onChanged={refetch} />
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

function ReviewCard({ review, onChanged }) {
  const { locale } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [respondiendo, setRespondiendo] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState(null);
  const puedeResponder = review.status === "rejected" || review.status === "error";

  const abrirRespuesta = () => {
    setTexto(textoVisible(review));
    setRespondiendo(true);
    setMsg(null);
  };

  const enviarRespuesta = async () => {
    if (!texto.trim()) return;
    setEnviando(true);
    setMsg(null);
    try {
      await respondReview(review._id, texto.trim());
      setMsg({ tipo: "ok", texto: "Respuesta publicada en Google" });
      setRespondiendo(false);
      onChanged?.();
    } catch (err) {
      setMsg({ tipo: "error", texto: msgDeError(err, "Error al publicar la respuesta") });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grev-review">
      <div className="grev-review__header">
        <div className="grev-review__meta">
          <span className="grev-review__author">{review.authorName}</span>
          <Stars rating={review.rating} />
          <span className="grev-review__date">{formatDate(review.publishedAt, locale)}</span>
        </div>
        <StatusBadge status={review.status} />
      </div>

      {review.text && (
        <p className="grev-review__text">{review.text}</p>
      )}

      {textoVisible(review) && (
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
              <p>{textoVisible(review)}</p>
            </div>
          )}
        </div>
      )}

      {review.rejectedReason && (
        <div className="grev-review__rejected">
          Motivo rechazo: {review.rejectedReason}
        </div>
      )}

      {review.status === "error" && review.ultimoErrorPublicacion && (
        <div className="grev-review__rejected">
          No se pudo publicar: {review.ultimoErrorPublicacion}
        </div>
      )}

      {msg && <div className={`grev-toast grev-toast--${msg.tipo}`}>{msg.texto}</div>}

      {puedeResponder && !respondiendo && (
        <div className="grev-pending-actions">
          <button className="grev-btn grev-btn--approve" onClick={abrirRespuesta}>
            Responder con mi texto
          </button>
        </div>
      )}

      {puedeResponder && respondiendo && (
        <div className="grev-editor">
          <label className="grev-editor__label" htmlFor={`grev-resp-${review._id}`}>Tu respuesta</label>
          <textarea
            id={`grev-resp-${review._id}`}
            className="grev-editor__textarea"
            value={texto}
            maxLength={4000}
            onChange={(e) => setTexto(e.target.value)}
          />
          <div className="grev-pending-actions">
            <button
              className="grev-btn grev-btn--approve"
              onClick={enviarRespuesta}
              disabled={enviando || !texto.trim()}
            >
              {enviando ? "Publicando..." : "Publicar mi respuesta"}
            </button>
            <button className="grev-btn grev-btn--cancel" onClick={() => setRespondiendo(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Pendientes ─────────────────────────────────────
function TabPending() {
  const { locale } = useLocale();
  const { data, loading, error, refetch } = useGooglePending();
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [msg, setMsg] = useState(null);
  // Texto editado por review: { [id]: string }. Clave AUSENTE = el dueño no ha tocado el
  // borrador ⇒ se aprueba sin body (se publica el borrador guardado).
  const [editados, setEditados] = useState({});
  const [editandoId, setEditandoId] = useState(null);

  const autoFocusRef = useAutoFocus();

  const reviews = data?.reviews || [];

  const handleSaveDraft = async (id) => {
    const texto = (editados[id] || "").trim();
    if (!texto) return;
    setActionLoading(id);
    setMsg(null);
    try {
      await saveDraftReview(id, texto);
      setMsg({ tipo: "ok", texto: "Borrador guardado (aun no se ha publicado)" });
      setEditandoId(null);
      setEditados((prev) => { const n = { ...prev }; delete n[id]; return n; });
      refetch();
    } catch (err) {
      setMsg({ tipo: "error", texto: msgDeError(err, "Error al guardar el borrador") });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (id) => {
    const editado = editados[id];
    const review = reviews.find((r) => r._id === id);
    if (editado !== undefined && !editado.trim()) {
      setMsg({ tipo: "error", texto: "La respuesta no puede estar vacia" });
      return;
    }
    setActionLoading(id);
    setMsg(null);
    try {
      await approveReview(id, editado === undefined ? undefined : editado.trim(), review?.huellaBorrador);
      setMsg({ tipo: "ok", texto: "Respuesta publicada en Google" });
      setEditandoId(null);
      setEditados((prev) => { const n = { ...prev }; delete n[id]; return n; });
      refetch();
    } catch (err) {
      if (esBorradorCambiado(err)) {
        // Lo que el dueño vio ya no es lo que saldría: se recarga para que lo revise antes.
        setEditandoId(null);
        setEditados((prev) => { const n = { ...prev }; delete n[id]; return n; });
        setMsg({ tipo: "error", texto: "Este borrador ha cambiado desde que lo abriste; revísalo antes de aprobar" });
        refetch();
        return;
      }
      setMsg({ tipo: "error", texto: msgDeError(err, "Error al aprobar") });
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
                <span className="grev-review__date">{formatDate(r.publishedAt, locale)}</span>
              </div>
            </div>

            {r.text && <p className="grev-review__text">{r.text}</p>}

            {editandoId === r._id ? (
              <div className="grev-editor">
                <label className="grev-editor__label" htmlFor={`grev-draft-${r._id}`}>Edita la respuesta antes de publicarla</label>
                <textarea
                  id={`grev-draft-${r._id}`}
                  className="grev-editor__textarea"
                  value={editados[r._id] ?? textoVisible(r)}
                  maxLength={4000}
                  onChange={(e) => setEditados((prev) => ({ ...prev, [r._id]: e.target.value }))}
                />
                <div className="grev-pending-actions">
                  <button
                    className="grev-btn grev-btn--cancel"
                    onClick={() => handleSaveDraft(r._id)}
                    disabled={actionLoading === r._id || !(editados[r._id] || "").trim()}
                  >
                    Guardar borrador
                  </button>
                  <button
                    className="grev-btn grev-btn--cancel"
                    onClick={() => {
                      setEditandoId(null);
                      setEditados((prev) => { const n = { ...prev }; delete n[r._id]; return n; });
                    }}
                  >
                    Descartar cambios
                  </button>
                </div>
              </div>
            ) : textoVisible(r) && (
              <div className="grev-pending-draft">
                <span className="grev-pending-draft__label">
                  {r.editadaPorHumano ? "Respuesta editada por ti:" : "Respuesta IA generada:"}
                </span>
                {r.draftTone && (
                  <span className="grev-review__tone">Tono: {r.draftTone}</span>
                )}
                <p className="grev-pending-draft__text">{textoVisible(r)}</p>
              </div>
            )}

            <div className="grev-pending-actions">
              {editandoId !== r._id && (
                <button
                  className="grev-btn grev-btn--cancel"
                  onClick={() => setEditandoId(r._id)}
                  disabled={actionLoading === r._id}
                >
                  Editar respuesta
                </button>
              )}
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

// ─── Selector de cuenta y ficha de Google Business ───────
// Sin `accountId/locationId` guardados el cron NO lee ninguna reseña (estado `sin_negocio`).
function FichaSelector({ status, onSaved }) {
  const [abierto, setAbierto] = useState(!status?.negocioElegido);
  const [accounts, setAccounts] = useState(null);
  const [accountId, setAccountId] = useState("");
  const [locations, setLocations] = useState(null);
  const [locationId, setLocationId] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);

  const cargarLocations = async (accId) => {
    setLocations(null);
    setLocationId("");
    if (!accId) return;
    setCargando(true);
    setMsg(null);
    try {
      const locs = await listGoogleLocations(accId);
      setLocations(locs);
      if (locs.length === 1) setLocationId(locs[0].locationId);
    } catch (err) {
      setMsg({ tipo: "error", texto: msgDeError(err, "No se pudieron cargar las fichas de Google") });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!abierto || accounts !== null) return;
    let vivo = true;
    (async () => {
      setCargando(true);
      setMsg(null);
      try {
        const accs = await listGoogleAccounts();
        if (!vivo) return;
        setAccounts(accs);
        if (accs.length === 1) {
          setAccountId(accs[0].accountId);
          await cargarLocations(accs[0].accountId);
        }
      } catch (err) {
        if (vivo) setMsg({ tipo: "error", texto: msgDeError(err, "No se pudieron cargar tus cuentas de Google") });
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  const guardar = async () => {
    const loc = (locations || []).find((l) => l.locationId === locationId);
    if (!accountId || !loc) return;
    setGuardando(true);
    setMsg(null);
    try {
      await selectGoogleLocation({ accountId, locationId: loc.locationId, locationName: loc.displayName || "" });
      setMsg({ tipo: "ok", texto: `Ficha guardada: ${loc.displayName}` });
      setAbierto(false);
      onSaved?.();
    } catch (err) {
      setMsg({ tipo: "error", texto: msgDeError(err, "No se pudo guardar la ficha") });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="grev-config-section" data-testid="grev-ficha">
      <h3 className="grev-config-section__title">Ficha de tu restaurante en Google</h3>
      {msg && <div className={`grev-toast grev-toast--${msg.tipo}`}>{msg.texto}</div>}

      {!abierto && (
        <div className="grev-config-connection">
          <div className="grev-config-location">
            {status?.locationName
              ? <>Ficha: <strong>{status.locationName}</strong></>
              : "Ficha elegida."}
          </div>
          <button className="grev-btn grev-btn--cancel" onClick={() => setAbierto(true)}>
            Cambiar ficha
          </button>
        </div>
      )}

      {abierto && (
        <div className="grev-ficha">
          {!status?.negocioElegido && (
            <p className="grev-ficha__aviso">
              Elige la ficha de Google de tu restaurante. Hasta que no la elijas, ALEF no puede leer ninguna reseña.
            </p>
          )}
          {cargando && <div className="grev-loading">Consultando Google...</div>}

          {accounts !== null && accounts.length === 0 && (
            <p className="grev-ficha__aviso">Tu cuenta de Google no tiene ninguna cuenta de Google Business.</p>
          )}

          {accounts !== null && accounts.length > 0 && (
            <label className="grev-ficha__campo">
              <span>Cuenta de Google Business</span>
              <select
                className="grev-ficha__select"
                aria-label="Cuenta de Google Business"
                value={accountId}
                onChange={(e) => { setAccountId(e.target.value); cargarLocations(e.target.value); }}
              >
                <option value="">Elige una cuenta</option>
                {accounts.map((a) => (
                  <option key={a.accountId} value={a.accountId}>{a.accountName}</option>
                ))}
              </select>
            </label>
          )}

          {locations !== null && locations.length === 0 && (
            <p className="grev-ficha__aviso">Esta cuenta no tiene fichas de negocio.</p>
          )}

          {locations !== null && locations.length > 0 && (
            <label className="grev-ficha__campo">
              <span>Ficha del restaurante</span>
              <select
                className="grev-ficha__select"
                aria-label="Ficha del restaurante"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              >
                <option value="">Elige una ficha</option>
                {locations.map((l) => (
                  <option key={l.locationId} value={l.locationId}>
                    {l.displayName}{l.address ? ` — ${l.address}` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="grev-pending-actions">
            <button
              className="grev-btn grev-btn--approve"
              onClick={guardar}
              disabled={guardando || !accountId || !locationId}
            >
              {guardando ? "Guardando..." : "Guardar ficha"}
            </button>
            {status?.negocioElegido && (
              <button className="grev-btn grev-btn--cancel" onClick={() => setAbierto(false)}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Configuracion ──────────────────────────────────
// El estado lo pide el padre (una sola fuente para la cabecera y esta pestaña).
function TabConfig({ status, loading, error, refetch }) {
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
      setMsg({ tipo: "error", texto: msgDeError(err, "Error al obtener URL") });
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

          {status?.connected && status?.estado === "token_invalido" && (
            <button
              className="grev-btn grev-btn--connect"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? "Abriendo..." : "Volver a conectar"}
            </button>
          )}

          <button className="grev-btn grev-btn--cancel" onClick={refetch}>
            Actualizar estado
          </button>

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

      {status?.connected && status?.modo === "manual" && (
        <div className="grev-config-section grev-modo-manual" data-testid="grev-modo-manual">
          {TEXTO_MODO_MANUAL}
        </div>
      )}

      {status?.connected && <FichaSelector status={status} onSaved={refetch} />}

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
          <p className="grev-mode-nota">{MODO_NOTA}</p>
          <p className="grev-mode-nota">
            Cuando una reseña de 3 estrellas o menos queda pendiente, te llega un aviso en la app de ALEF (si la tienes instalada).
          </p>
        </div>
      )}

      {showConfirmDisconnect && (
        <ModalConfirmacion
          titulo="Desconectar Google Business"
          mensaje="ALEF dejará de leer tus reseñas y de prepararte respuestas. ¿Deseas continuar?"
          onConfirm={handleDisconnect}
          onClose={() => setShowConfirmDisconnect(false)}
        />
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────
// Vuelta del OAuth de Google (contrato 30-sep): `?google=connected` o `?google=error&motivo=…`.
// Se lee al montar (puro) y se quita de la URL en un efecto, para que recargar no repita el aviso.
function leerVueltaDeGoogle() {
  const r = leerQuery("google");
  if (r === "connected") return { tipo: "ok" };
  if (r === "error") return { tipo: "error", motivo: leerQuery("motivo") || "" };
  return null;
}

export default function GoogleReviewsPage() {
  const [vueltaGoogle] = useState(leerVueltaDeGoogle);
  const [tab, setTab] = useState(vueltaGoogle ? "config" : "reviews");

  useEffect(() => {
    if (vueltaGoogle) quitarDeQuery(["google", "motivo"]);
  }, [vueltaGoogle]);
  const { data: status, loading: statusLoading, error: statusError, refetch: refetchStatus } = useGoogleStatus();
  const { data: pendingData } = useGooglePending();

  // «Conectar» abre Google en OTRA pestaña: al volver a ésta, el estado del servidor ha
  // cambiado (conectado, token nuevo…) ⇒ se vuelve a pedir al recuperar el foco.
  useEffect(() => {
    const alVolver = () => refetchStatus();
    window.addEventListener("focus", alVolver);
    return () => window.removeEventListener("focus", alVolver);
  }, [refetchStatus]);

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
            {status?.enabled ? (status?.modo ? `Activo (${status.modo})` : "Activo") : "Pausado"}
          </div>
        )}
      </div>

      {vueltaGoogle?.tipo === "ok" && (
        <div className="grev-toast grev-toast--ok" data-testid="grev-vuelta-google">
          Google conectado. Ahora elige la ficha de tu restaurante para empezar a leer reseñas.
        </div>
      )}
      {vueltaGoogle?.tipo === "error" && (
        <div className="grev-toast grev-toast--error" data-testid="grev-vuelta-google" role="alert">
          No se pudo conectar Google{vueltaGoogle.motivo ? ` (motivo: ${vueltaGoogle.motivo})` : ""}. Vuelve a intentarlo desde «Conectar Google Business».
        </div>
      )}

      <EstadoIntegracion status={status} />

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
      {tab === "config" && (
        <TabConfig status={status} loading={statusLoading && !status} error={statusError} refetch={refetchStatus} />
      )}
    </div>
  );
}
