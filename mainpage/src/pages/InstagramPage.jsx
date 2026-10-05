import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../utils/api";
import ModalConfirmacion from "../components/Modal/ModalConfirmacion.jsx";
import { leerQuery, quitarDeQuery } from "../utils/parametrosDeVuelta";
import "./InstagramPage.css";

// Enums = `saas-api/src/services/instagram/instagramConfig.constants.js` (IG_TONOS, IG_IDIOMAS,
// IG_HORA_RE, IG_POSTS_SEMANALES_MIN/MAX, IG_HASHTAGS_MAX). Si el backend cambia, cambiar aquí.
const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const HASHTAGS_MAX = 30;

// `motivoDesconexion` (GET /config) → texto para el dueño. IG_MOTIVOS_DESCONEXION.
const MOTIVOS_DESCONEXION = {
  token_invalid: "Instagram ha caducado o retirado el permiso de ALEF. Vuelve a conectar la cuenta para seguir publicando.",
  deautorizado_meta: "Se quitó el acceso de ALEF desde Instagram o Facebook. Vuelve a conectar la cuenta si quieres seguir publicando.",
  borrado_meta: "Se pidió a Meta borrar los datos de Instagram en ALEF y la conexión se eliminó. Vuelve a conectar la cuenta si quieres seguir publicando.",
};

// Vuelta del OAuth de Instagram (contrato 30-sep): `?instagram=connected` o
// `?instagram=error&motivo=…`. Lectura pura; se limpia en un efecto.
function leerVueltaDeInstagram() {
  const r = leerQuery("instagram");
  if (r === "connected") return { tipo: "ok" };
  if (r === "error") return { tipo: "error", motivo: leerQuery("motivo") || "" };
  return null;
}

// R3 (wt-instagram): Meta ya no reconoce el contenedor del intento anterior. El backend NO
// republica solo (409 INSTAGRAM_CONTENEDOR_INEXISTENTE): sólo con `confirmarRepublicar: true`.
const esContenedorInexistente = (post) =>
  post?.estado === "error" && typeof post.error === "string" && post.error.startsWith("contenedor_inexistente");

// R2-ART16 (wt-instagram): el primer intento llegó a enviarse a Meta y ya no se puede comprobar si
// salió ⇒ el backend NO republica ni confirmando (409, `fields.motivo: "intento_incierto"`).
const esIntentoIncierto = (post) =>
  post?.intentoIncierto === true ||
  (typeof post?.error === "string" && post.error.includes("(intento_incierto)"));
const TEXTO_INCIERTO =
  "No sabemos si Instagram llegó a publicarlo. Lo revisamos nosotros para no duplicarlo; escríbenos si lo necesitas ya.";
const es409Incierto = (err) => {
  const d = err?._server || err?.response?._server || err?.response?.data || {};
  return (err?.response?.status === 409 || d.status === 409 || d.code === "INSTAGRAM_CONTENEDOR_INEXISTENTE")
    && d.fields?.motivo === "intento_incierto";
};

const TEXTO_REPUBLICAR =
  "Instagram ya no reconoce el intento anterior. Si llegó a publicarse en otra cuenta, podría salir dos veces. ¿Publicar de nuevo?";

const msgDeError = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

const CATEGORIAS = [
  { value: "plato", label: "Plato" },
  { value: "ambiente", label: "Ambiente" },
  { value: "equipo", label: "Equipo" },
  { value: "cocina", label: "Cocina" },
  { value: "evento", label: "Evento" },
  { value: "general", label: "General" },
];

export default function InstagramPage() {
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState({});
  const [posts, setPosts] = useState([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsPage, setPostsPage] = useState(1);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingMedia, setEditingMedia] = useState(null);
  const [tab, setTab] = useState("posts");
  const [galleryCat, setGalleryCat] = useState("");
  const [msg, setMsg] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null); // { titulo, mensaje, textoConfirmar, accion }
  const [horaDraft, setHoraDraft] = useState(null);
  const [vueltaIg] = useState(leerVueltaDeInstagram);
  const fileRef = useRef(null);

  useEffect(() => {
    if (vueltaIg) quitarDeQuery(["instagram", "motivo"]);
  }, [vueltaIg]);

  const POSTS_PER_PAGE = 10;

  const fetchAll = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const [s, c, p, g] = await Promise.allSettled([
        api.get("/admin/instagram/status"),
        api.get("/admin/instagram/config"),
        api.get(`/admin/instagram/posts?limit=${POSTS_PER_PAGE}&page=${page}`),
        api.get("/admin/instagram/media"),
      ]);
      if (s.status === "fulfilled") setStatus(s.value.data?.data || s.value.data);
      if (c.status === "fulfilled") setConfig(c.value.data?.data || c.value.data || {});
      if (p.status === "fulfilled") {
        const d = p.value.data?.data || p.value.data || {};
        setPosts(d.items || []);
        setPostsTotal(d.total || 0);
      }
      if (g.status === "fulfilled") setGallery((g.value.data?.data?.items || g.value.data?.items || []));
      const fallo = [s, c, p, g].find((r) => r.status === "rejected");
      if (fallo) setMsg({ tipo: "error", texto: msgDeError(fallo.reason, "No se pudo cargar todo de Instagram") });
    } catch (err) {
      setMsg({ tipo: "error", texto: msgDeError(err, "No se pudo cargar Instagram") });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(1); }, [fetchAll]);

  const handleConnect = async () => {
    try {
      const { data } = await api.get("/admin/instagram/auth-url");
      const url = data?.data?.url || data?.url;
      if (url) window.location.href = url;
    } catch (err) {
      setMsg({ tipo: "error", texto: msgDeError(err, "No se pudo abrir la conexión con Instagram") });
    }
  };

  const doDisconnect = async () => {
    try {
      await api.post("/admin/instagram/disconnect");
      setMsg({ tipo: "ok", texto: "Instagram desconectado" });
    } catch (err) {
      setMsg({ tipo: "error", texto: msgDeError(err, "No se pudo desconectar") });
    }
    fetchAll();
  };

  const handleDisconnect = () => setConfirmacion({
    titulo: "Desconectar Instagram",
    mensaje: "ALEF dejará de generar y publicar posts en tu cuenta. ¿Quieres continuar?",
    textoConfirmar: "Desconectar",
    accion: doDisconnect,
  });

  const handleGenerate = async (tipo = "post") => {
    setGenerating(true);
    try {
      await api.post("/admin/instagram/posts/generate", { tipo });
      fetchAll(1);
      setPostsPage(1);
    } catch (err) {
      setMsg({ tipo: "error", texto: "No se pudo generar: " + msgDeError(err, "Sin contenido disponible") });
    }
    setGenerating(false);
  };

  const handlePublish = async (postId) => {
    setPublishing(postId);
    try {
      await api.post(`/admin/instagram/posts/${postId}/publish`);
      fetchAll(postsPage);
    } catch (err) {
      setMsg({ tipo: "error", texto: msgDeError(err, "No se pudo publicar") });
      fetchAll(postsPage);
    }
    setPublishing(null);
  };

  const handleApprove = async (postId) => {
    try {
      await api.post(`/admin/instagram/posts/${postId}/approve`);
    } catch (err) {
      setMsg({ tipo: "error", texto: msgDeError(err, "No se pudo aprobar") });
    }
    fetchAll(postsPage);
  };

  const doRepublicar = async (postId) => {
    setPublishing(postId);
    try {
      await api.post(`/admin/instagram/posts/${postId}/publish`, { confirmarRepublicar: true });
      setMsg({ tipo: "ok", texto: "Publicado de nuevo" });
    } catch (err) {
      setMsg({ tipo: "error", texto: es409Incierto(err) ? TEXTO_INCIERTO : msgDeError(err, "No se pudo publicar") });
    }
    setPublishing(null);
    fetchAll(postsPage);
  };

  const handleRepublicar = (postId) => setConfirmacion({
    titulo: "Publicar de nuevo",
    mensaje: TEXTO_REPUBLICAR,
    textoConfirmar: "Publicar de nuevo",
    accion: () => doRepublicar(postId),
  });

  // Reintentar un post en `error` = aprobarlo otra vez (el backend sólo aprueba desde
  // borrador/error; el cron publica los aprobados en su siguiente vuelta).
  const handleRetry = async (postId) => {
    try {
      await api.post(`/admin/instagram/posts/${postId}/approve`);
      setMsg({ tipo: "ok", texto: "Reintento en cola: se publicará en la próxima vuelta automática." });
    } catch (err) {
      setMsg({ tipo: "error", texto: msgDeError(err, "No se pudo reintentar") });
    }
    fetchAll(postsPage);
  };

  const handleDiscard = async (postId) => {
    try {
      await api.post(`/admin/instagram/posts/${postId}/discard`);
    } catch (err) {
      setMsg({ tipo: "error", texto: msgDeError(err, "No se pudo descartar") });
    }
    fetchAll(postsPage);
  };

  // Sólo se manda lo que cambia: ausente = el backend no lo toca.
  const handleSaveConfig = async (updates) => {
    try {
      await api.put("/admin/instagram/config", updates);
      setMsg({ tipo: "ok", texto: "Configuración guardada" });
    } catch (err) {
      setMsg({ tipo: "error", texto: msgDeError(err, "No se pudo guardar la configuración") });
    }
    setHoraDraft(null);
    fetchAll(postsPage);
  };

  const handleSaveHora = () => {
    if (horaDraft === null || horaDraft === config.horaPublicacion) return;
    if (!HORA_RE.test(horaDraft)) {
      setMsg({ tipo: "error", texto: "La hora debe tener formato HH:MM (00:00 a 23:59)" });
      return;
    }
    handleSaveConfig({ horaPublicacion: horaDraft });
  };

  const handleSaveHashtags = (valor) => {
    const tags = valor.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean);
    const actuales = config.hashtagsFijos || [];
    if (tags.join(",") === actuales.join(",")) return;
    if (tags.length > HASHTAGS_MAX) {
      setMsg({ tipo: "error", texto: `Máximo ${HASHTAGS_MAX} hashtags (Instagram no admite más)` });
      return;
    }
    handleSaveConfig({ hashtagsFijos: tags });
  };

  const publicaSolo = config.aprobacionManual === false;

  const handleToggleAutoPublicar = () => {
    if (publicaSolo) {
      handleSaveConfig({ aprobacionManual: true });
      return;
    }
    setConfirmacion({
      titulo: "Publicar sin revisar",
      mensaje: `Los posts que genere ALEF se publicarán solos en tu Instagram a las ${config.horaPublicacion || "13:00"}, sin que los revises antes. Puedes desactivarlo cuando quieras.`,
      textoConfirmar: "Sí, publicar solo",
      accion: () => handleSaveConfig({ aprobacionManual: false }),
    });
  };

  // ── Galería ──

  const handleUploadFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("categoria", "general");
        await api.post("/admin/instagram/media", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (err) {
        setMsg({ tipo: "error", texto: "Error subiendo " + file.name + ": " + msgDeError(err, "error desconocido") });
      }
    }
    setUploading(false);
    fetchAll();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("ig-dropzone--over");
    handleUploadFiles(e.dataTransfer.files);
  };

  const handleDeleteMedia = (id) => setConfirmacion({
    titulo: "Eliminar imagen",
    mensaje: "¿Eliminar esta imagen de la galería?",
    textoConfirmar: "Eliminar",
    accion: async () => {
      try {
        await api.delete(`/admin/instagram/media/${id}`);
      } catch (err) {
        setMsg({ tipo: "error", texto: msgDeError(err, "No se pudo eliminar la imagen") });
      }
      fetchAll();
    },
  });

  const handleSaveMedia = async (id, updates) => {
    try {
      await api.put(`/admin/instagram/media/${id}`, updates);
      setEditingMedia(null);
    } catch (err) {
      setMsg({ tipo: "error", texto: msgDeError(err, "No se pudo guardar la imagen") });
    }
    fetchAll();
  };

  const connected = status?.connected;
  const motivoDesconexion = !connected ? config.motivoDesconexion : "";

  if (loading) return <div className="sug-loading">Cargando...</div>;

  const filteredGallery = galleryCat
    ? gallery.filter(g => g.categoria === galleryCat)
    : gallery;

  return (
    <div className="sug-root">
      <div className="sug-header">
        <div>
          <h2>Instagram</h2>
          <p className="sug-header__sub">
            {connected
              ? `Conectado como @${status.username}`
              : "Conecta tu cuenta de Instagram para publicar automáticamente."}
          </p>
        </div>
        {connected ? (
          <button className="sug-btn sug-btn--secondary" onClick={handleDisconnect}>Desconectar</button>
        ) : (
          <button className="sug-btn sug-btn--primary" onClick={handleConnect}>Conectar Instagram</button>
        )}
      </div>

      {vueltaIg && (
        <div className={`ig-msg ig-msg--${vueltaIg.tipo}`} data-testid="ig-vuelta" role={vueltaIg.tipo === "error" ? "alert" : "status"}>
          <span>
            {vueltaIg.tipo === "ok"
              ? "Instagram conectado. Revisa la configuración para decidir cuándo y cómo se publica."
              : `No se pudo conectar Instagram${vueltaIg.motivo ? ` (motivo: ${vueltaIg.motivo})` : ""}. Vuelve a intentarlo.`}
          </span>
        </div>
      )}

      {msg && (
        <div className={`ig-msg ig-msg--${msg.tipo}`} role={msg.tipo === "error" ? "alert" : "status"}>
          <span>{msg.texto}</span>
          <button className="ig-msg__close" onClick={() => setMsg(null)} aria-label="Cerrar aviso">✕</button>
        </div>
      )}

      {!connected && motivoDesconexion && (
        <div className="sug-section ig-desconexion" data-testid="ig-desconexion">
          <h3 className="ig-desconexion__title">
            Instagram se ha desconectado{config.username ? ` (@${config.username})` : ""}
          </h3>
          <p className="ig-desconexion__desc">
            {MOTIVOS_DESCONEXION[motivoDesconexion] || "La conexión con Instagram se ha perdido. Vuelve a conectar la cuenta."}
          </p>
          <button className="sug-btn sug-btn--primary" onClick={handleConnect}>Reconectar Instagram</button>
        </div>
      )}

      {!connected && !motivoDesconexion && (
        <div className="sug-section ig-connect-cta">
          <div className="ig-connect-cta__icon">📱</div>
          <h3 className="ig-connect-cta__title">Conecta tu Instagram Business</h3>
          <p className="ig-connect-cta__desc">
            ALEF generará posts basados en los datos reales de tu restaurante — platos estrella, días flojos, celebraciones. Tú apruebas antes de publicar.
          </p>
          <button className="sug-btn sug-btn--primary" onClick={handleConnect}>Conectar Instagram</button>
        </div>
      )}

      {connected && (
        <>
          <div className="ig-tabs">
            <button className={`ig-tab ${tab === "posts" ? "ig-tab--active" : ""}`} onClick={() => setTab("posts")}>Posts</button>
            <button className={`ig-tab ${tab === "gallery" ? "ig-tab--active" : ""}`} onClick={() => setTab("gallery")}>
              Galería{gallery.length > 0 ? ` (${gallery.length})` : ""}
            </button>
            <button className={`ig-tab ${tab === "config" ? "ig-tab--active" : ""}`} onClick={() => setTab("config")}>Configuración</button>
          </div>

          {/* ── Posts ── */}
          {tab === "posts" && (
            <>
              <div className="sug-section ig-posts-bar">
                <span className="ig-posts-bar__count">{postsTotal} posts</span>
                <div className="ig-posts-bar__actions">
                  <button className="sug-btn sug-btn--secondary" onClick={() => handleGenerate("story")} disabled={generating}>
                    {generating ? "..." : "Story"}
                  </button>
                  <button className="sug-btn sug-btn--primary" onClick={() => handleGenerate("post")} disabled={generating}>
                    {generating ? "Generando..." : "Post"}
                  </button>
                </div>
              </div>

              {posts.length === 0 && (
                <div className="sug-section ig-empty">
                  No hay posts. Genera un post o una story para empezar.
                </div>
              )}

              {posts.map((post) => (
                <div key={post._id} className="sug-section ig-post-card">
                  <div className="ig-post-card__row">
                    <div className="ig-post-card__img">
                      {post.imageUrl ? <img src={post.imageUrl} alt="" /> : <div className="ig-post-card__noimg">📷</div>}
                    </div>
                    <div className="ig-post-card__body">
                      <div className="ig-post-card__meta">
                        <span className={`finv-badge badge--${post.estado === "publicado" ? "ok" : post.estado === "error" ? "error" : post.estado === "borrador" ? "info" : "warn"}`}>{post.estado}</span>
                        {post.tipo === "story" && <span className="ig-post-card__tipo">Story</span>}
                        <span className="ig-post-card__motivo">{post.motivo?.replace("_", " ")}</span>
                        {post.productoNombre && <span className="ig-post-card__producto">{post.productoNombre}</span>}
                      </div>
                      <p className="ig-post-card__caption">{post.caption}</p>
                      {post.hashtags?.length > 0 && (
                        <div className="ig-post-card__tags">
                          {post.hashtags.map((t, i) => <span key={i} className="ig-post-card__tag">#{t}</span>)}
                        </div>
                      )}
                      <div className="ig-post-card__actions">
                        {post.estado === "borrador" && (
                          <>
                            <button className="sug-btn sug-btn--primary sug-btn--sm" onClick={() => handleApprove(post._id)}>Aprobar</button>
                            <button className="sug-btn sug-btn--secondary sug-btn--sm" onClick={() => handlePublish(post._id)} disabled={publishing === post._id}>
                              {publishing === post._id ? "..." : "Publicar"}
                            </button>
                            <button className="sug-btn sug-btn--ghost sug-btn--sm" onClick={() => handleDiscard(post._id)}>Descartar</button>
                          </>
                        )}
                        {post.estado === "aprobado" && !post.verificacionPendiente && (
                          <button className="sug-btn sug-btn--primary sug-btn--sm" onClick={() => handlePublish(post._id)} disabled={publishing === post._id}>
                            {publishing === post._id ? "..." : "Publicar"}
                          </button>
                        )}
                        {post.estado === "publicado" && <span className="ig-post-card__status ig-post-card__status--ok">Publicado</span>}
                        {/* R2 (wt-instagram): `error` + `verificacionPendiente` = Meta no dijo si salió.
                            El cron sólo CONSULTA; reintentar aquí podría duplicar el post ⇒ sin botones. */}
                        {post.verificacionPendiente && (
                          <span className="ig-post-card__status ig-post-card__status--verificando" data-testid="ig-verificando">
                            Comprobando con Instagram si se llegó a publicar; no lo repetimos para no duplicarlo.
                          </span>
                        )}
                        {post.estado === "error" && !post.verificacionPendiente && esIntentoIncierto(post) && (
                          <span className="ig-post-card__status ig-post-card__status--verificando" data-testid="ig-incierto">
                            {TEXTO_INCIERTO}
                          </span>
                        )}
                        {post.estado === "error" && !post.verificacionPendiente && !esIntentoIncierto(post) && (
                          <>
                            <span className="ig-post-card__status ig-post-card__status--error">
                              Motivo del error: {post.error || "Instagram no dio motivo"}
                            </span>
                            {esContenedorInexistente(post) ? (
                              // «Reintentar» (approve → cron) acabaría otra vez en 409: el cron nunca confirma.
                              <button className="sug-btn sug-btn--primary sug-btn--sm" onClick={() => handleRepublicar(post._id)} disabled={publishing === post._id}>
                                {publishing === post._id ? "..." : "Publicar de nuevo"}
                              </button>
                            ) : (
                              <button className="sug-btn sug-btn--primary sug-btn--sm" onClick={() => handleRetry(post._id)}>
                                Reintentar
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Paginación */}
              {postsTotal > POSTS_PER_PAGE && (
                <div className="ig-pagination">
                  <button
                    className="sug-btn sug-btn--secondary sug-btn--sm"
                    disabled={postsPage <= 1}
                    onClick={() => { const p = postsPage - 1; setPostsPage(p); fetchAll(p); }}
                  >Anterior</button>
                  <span className="ig-pagination__info">
                    Página {postsPage} de {Math.ceil(postsTotal / POSTS_PER_PAGE)}
                  </span>
                  <button
                    className="sug-btn sug-btn--secondary sug-btn--sm"
                    disabled={postsPage >= Math.ceil(postsTotal / POSTS_PER_PAGE)}
                    onClick={() => { const p = postsPage + 1; setPostsPage(p); fetchAll(p); }}
                  >Siguiente</button>
                </div>
              )}
            </>
          )}

          {/* ── Galería ── */}
          {tab === "gallery" && (
            <>
              {/* Dropzone */}
              <div
                className="sug-section ig-dropzone"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("ig-dropzone--over"); }}
                onDragLeave={(e) => e.currentTarget.classList.remove("ig-dropzone--over")}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  hidden
                  onChange={(e) => handleUploadFiles(e.target.files)}
                />
                <div className="ig-dropzone__content">
                  <span className="ig-dropzone__icon">📷</span>
                  <span className="ig-dropzone__text">
                    {uploading ? "Subiendo..." : "Arrastra fotos aquí o haz clic para subir"}
                  </span>
                  <span className="ig-dropzone__hint">JPG, PNG, WebP — max 10MB por imagen</span>
                </div>
              </div>

              {/* Filtro por categoría */}
              {gallery.length > 0 && (
                <div className="ig-gallery-filter">
                  <button
                    className={`ig-filter-btn ${galleryCat === "" ? "ig-filter-btn--active" : ""}`}
                    onClick={() => setGalleryCat("")}
                  >Todas</button>
                  {CATEGORIAS.map(c => (
                    <button
                      key={c.value}
                      className={`ig-filter-btn ${galleryCat === c.value ? "ig-filter-btn--active" : ""}`}
                      onClick={() => setGalleryCat(c.value)}
                    >{c.label}</button>
                  ))}
                </div>
              )}

              {/* Grid */}
              {filteredGallery.length === 0 && (
                <div className="sug-section ig-empty">
                  {gallery.length === 0
                    ? "Sube fotos para que la IA las use en las publicaciones."
                    : "No hay fotos en esta categoría."}
                </div>
              )}

              <div className="ig-gallery-grid">
                {filteredGallery.map((img) => (
                  <div key={img._id} className="ig-gallery-card">
                    <div className="ig-gallery-card__img">
                      <img src={img.url} alt={img.descripcion || ""} />
                      <div className="ig-gallery-card__overlay">
                        <button className="ig-gallery-card__action" onClick={() => setEditingMedia(img)}>Editar</button>
                        <button className="ig-gallery-card__action ig-gallery-card__action--del" onClick={() => handleDeleteMedia(img._id)}>Eliminar</button>
                      </div>
                    </div>
                    <div className="ig-gallery-card__info">
                      <span className="ig-gallery-card__cat">{CATEGORIAS.find(c => c.value === img.categoria)?.label || img.categoria}</span>
                      {img.usedCount > 0 && <span className="ig-gallery-card__used">Usada {img.usedCount}x</span>}
                    </div>
                    {img.descripcion && <p className="ig-gallery-card__desc">{img.descripcion}</p>}
                    {img.productoNombre && <span className="ig-gallery-card__prod">{img.productoNombre}</span>}
                  </div>
                ))}
              </div>

              {/* Modal edición */}
              {editingMedia && (
                <EditMediaModal
                  media={editingMedia}
                  onSave={handleSaveMedia}
                  onClose={() => setEditingMedia(null)}
                />
              )}
            </>
          )}

          {/* ── Configuración ── */}
          {tab === "config" && (
            <>
              <div className="sug-section">
                <h3 className="sug-section__title">Tono del contenido</h3>
                <select className="ig-select" aria-label="Tono del contenido" value={config.tono || "casual"} onChange={(e) => handleSaveConfig({ tono: e.target.value })}>
                  <option value="casual">Casual — cercano, como un amigo</option>
                  <option value="formal">Formal — elegante y sofisticado</option>
                  <option value="gastronomico">Gastronómico — sabores y texturas</option>
                  <option value="divertido">Divertido — humor y energía</option>
                </select>
              </div>
              <div className="sug-section">
                <h3 className="sug-section__title">Posts por semana</h3>
                <select className="ig-select" aria-label="Posts por semana" value={config.frecuencia?.postsSemanales || 3} onChange={(e) => handleSaveConfig({ frecuencia: { postsSemanales: Number(e.target.value) } })}>
                  <option value={1}>1 post/semana</option>
                  <option value={2}>2 posts/semana</option>
                  <option value={3}>3 posts/semana</option>
                  <option value={5}>5 posts/semana</option>
                  <option value={7}>1 post/día</option>
                </select>
              </div>
              <div className="sug-section">
                <h3 className="sug-section__title">Idioma</h3>
                <select className="ig-select" aria-label="Idioma" value={config.idioma || "es"} onChange={(e) => handleSaveConfig({ idioma: e.target.value })}>
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                  <option value="es+en">Español + Inglés</option>
                </select>
              </div>
              <div className="sug-section">
                <h3 className="sug-section__title">Hora de publicación</h3>
                <input
                  className="ig-input ig-input--hora"
                  type="time"
                  aria-label="Hora de publicación"
                  value={horaDraft ?? config.horaPublicacion ?? "13:00"}
                  onChange={(e) => setHoraDraft(e.target.value)}
                  onBlur={handleSaveHora}
                />
                <p className="ig-hint">Hora de tu restaurante a la que se publican los posts que se publican solos.</p>
              </div>
              <div className="sug-section">
                <div className="ig-toggle-row">
                  <div className="ig-toggle-info">
                    <span className="ig-toggle-label">Publicar automáticamente sin revisar</span>
                    <span className="ig-toggle-desc">
                      {publicaSolo
                        ? `Activado: los posts que genere ALEF se publican solos a las ${config.horaPublicacion || "13:00"} sin que los revises.`
                        : "Desactivado: cada post queda como borrador hasta que tú lo apruebes."}
                    </span>
                  </div>
                  <button
                    className={`ig-toggle ${publicaSolo ? "ig-toggle--on" : ""}`}
                    role="switch"
                    aria-checked={publicaSolo}
                    aria-label="Publicar automáticamente sin revisar"
                    onClick={handleToggleAutoPublicar}
                  >
                    <span className="ig-toggle__knob" />
                  </button>
                </div>
                {publicaSolo && (
                  <p className="ig-aviso" data-testid="ig-aviso-autopublicar">
                    Atención: nadie revisa el texto ni la foto antes de que salgan en tu Instagram.
                  </p>
                )}
              </div>
              <div className="sug-section">
                <h3 className="sug-section__title">Hashtags fijos</h3>
                <input
                  key={(config.hashtagsFijos || []).join(",")}
                  className="ig-input"
                  type="text"
                  aria-label="Hashtags fijos"
                  placeholder="ZaborFeten, Torremolinos, RestaurantesMalaga"
                  defaultValue={(config.hashtagsFijos || []).join(", ")}
                  onBlur={(e) => handleSaveHashtags(e.target.value)}
                />
                <p className="ig-hint">Separados por comas, máximo {HASHTAGS_MAX}. Se añaden al final de cada post.</p>
              </div>
            </>
          )}
        </>
      )}

      {confirmacion && (
        <ModalConfirmacion
          titulo={confirmacion.titulo}
          mensaje={confirmacion.mensaje}
          textoConfirmar={confirmacion.textoConfirmar}
          onConfirm={() => { const a = confirmacion.accion; setConfirmacion(null); a(); }}
          onClose={() => setConfirmacion(null)}
        />
      )}
    </div>
  );
}

// ── Modal de edición de imagen ──

function EditMediaModal({ media, onSave, onClose }) {
  const [categoria, setCategoria] = useState(media.categoria || "general");
  const [descripcion, setDescripcion] = useState(media.descripcion || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(media._id, { categoria, descripcion });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sug-help-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sug-help-modal">
        <div className="sug-help-modal__header">
          <h3>Editar imagen</h3>
          <button className="sug-help-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="sug-help-modal__body">
          <div className="ig-edit-preview">
            <img src={media.url} alt="" />
          </div>
          <div className="ig-form-row">
            <label>Categoría</label>
            <select className="ig-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="ig-form-row ig-form-row--spaced">
            <label>Descripción (la IA la usa para generar el texto)</label>
            <input
              className="ig-input"
              type="text"
              placeholder="Ej: Plato de ceviche con decoración tropical"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <div className="ig-edit-actions">
            <button className="sug-btn sug-btn--secondary" onClick={onClose}>Cancelar</button>
            <button className="sug-btn sug-btn--primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
