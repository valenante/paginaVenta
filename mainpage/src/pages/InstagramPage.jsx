import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../utils/api";
import "./InstagramPage.css";

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
  const fileRef = useRef(null);

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
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(1); }, [fetchAll]);

  const handleConnect = async () => {
    try {
      const { data } = await api.get("/admin/instagram/auth-url");
      const url = data?.data?.url || data?.url;
      if (url) window.location.href = url;
    } catch (err) {
      alert("Error: " + (err?.response?.data?.message || err.message));
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("¿Desconectar Instagram?")) return;
    await api.post("/admin/instagram/disconnect");
    fetchAll();
  };

  const handleGenerate = async (tipo = "post") => {
    setGenerating(true);
    try {
      await api.post("/admin/instagram/posts/generate", { tipo });
      fetchAll(1);
      setPostsPage(1);
    } catch (err) {
      alert("No se pudo generar: " + (err?.response?.data?.message || "Sin contenido disponible"));
    }
    setGenerating(false);
  };

  const handlePublish = async (postId) => {
    setPublishing(postId);
    try {
      await api.post(`/admin/instagram/posts/${postId}/publish`);
      fetchAll(postsPage);
    } catch (err) {
      alert("Error: " + (err?.response?.data?.message || err.message));
    }
    setPublishing(null);
  };

  const handleApprove = async (postId) => {
    await api.post(`/admin/instagram/posts/${postId}/approve`);
    fetchAll(postsPage);
  };

  const handleDiscard = async (postId) => {
    await api.post(`/admin/instagram/posts/${postId}/discard`);
    fetchAll(postsPage);
  };

  const handleSaveConfig = async (updates) => {
    await api.put("/admin/instagram/config", updates);
    fetchAll();
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
        alert("Error subiendo " + file.name + ": " + (err?.response?.data?.message || err.message));
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

  const handleDeleteMedia = async (id) => {
    if (!confirm("¿Eliminar esta imagen de la galería?")) return;
    await api.delete(`/admin/instagram/media/${id}`);
    fetchAll();
  };

  const handleSaveMedia = async (id, updates) => {
    await api.put(`/admin/instagram/media/${id}`, updates);
    setEditingMedia(null);
    fetchAll();
  };

  const connected = status?.connected;

  if (loading) return <div className="sug-loading">Cargando...</div>;

  const filteredGallery = galleryCat
    ? gallery.filter(g => g.categoria === galleryCat)
    : gallery;

  return (
    <div className="sug-root">
      <div className="sug-header">
        <div>
          <h2>📸 Instagram</h2>
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

      {!connected && (
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
                    {generating ? "..." : "📱 Story"}
                  </button>
                  <button className="sug-btn sug-btn--primary" onClick={() => handleGenerate("post")} disabled={generating}>
                    {generating ? "Generando..." : "🤖 Post"}
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
                        {post.estado === "aprobado" && (
                          <button className="sug-btn sug-btn--primary sug-btn--sm" onClick={() => handlePublish(post._id)} disabled={publishing === post._id}>
                            {publishing === post._id ? "..." : "Publicar"}
                          </button>
                        )}
                        {post.estado === "publicado" && <span className="ig-post-card__status ig-post-card__status--ok">✓ Publicado</span>}
                        {post.estado === "error" && <span className="ig-post-card__status ig-post-card__status--error">⚠ {post.error}</span>}
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
                <select className="ig-select" value={config.tono || "casual"} onChange={(e) => handleSaveConfig({ tono: e.target.value })}>
                  <option value="casual">Casual — cercano, como un amigo</option>
                  <option value="formal">Formal — elegante y sofisticado</option>
                  <option value="gastronomico">Gastronómico — sabores y texturas</option>
                  <option value="divertido">Divertido — humor y energía</option>
                </select>
              </div>
              <div className="sug-section">
                <h3 className="sug-section__title">Posts por semana</h3>
                <select className="ig-select" value={config.frecuencia?.postsSemanales || 3} onChange={(e) => handleSaveConfig({ frecuencia: { ...config.frecuencia, postsSemanales: Number(e.target.value) } })}>
                  <option value={1}>1 post/semana</option>
                  <option value={2}>2 posts/semana</option>
                  <option value={3}>3 posts/semana</option>
                  <option value={5}>5 posts/semana</option>
                  <option value={7}>1 post/día</option>
                </select>
              </div>
              <div className="sug-section">
                <h3 className="sug-section__title">Idioma</h3>
                <select className="ig-select" value={config.idioma || "es"} onChange={(e) => handleSaveConfig({ idioma: e.target.value })}>
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                  <option value="es+en">Español + Inglés</option>
                </select>
              </div>
              <div className="sug-section">
                <div className="ig-toggle-row">
                  <div className="ig-toggle-info">
                    <span className="ig-toggle-label">Aprobación manual</span>
                    <span className="ig-toggle-desc">Revisar cada post antes de publicar</span>
                  </div>
                  <button
                    className={`ig-toggle ${config.aprobacionManual !== false ? "ig-toggle--on" : ""}`}
                    onClick={() => handleSaveConfig({ aprobacionManual: config.aprobacionManual === false })}
                  >
                    <span className="ig-toggle__knob" />
                  </button>
                </div>
              </div>
              <div className="sug-section">
                <h3 className="sug-section__title">Hashtags fijos</h3>
                <input
                  className="ig-input"
                  type="text"
                  placeholder="ZaborFeten, Torremolinos, RestaurantesMalaga"
                  defaultValue={(config.hashtagsFijos || []).join(", ")}
                  onBlur={(e) => {
                    const tags = e.target.value.split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean);
                    handleSaveConfig({ hashtagsFijos: tags });
                  }}
                />
                <p className="ig-hint">Separados por comas. Se añaden al final de cada post.</p>
              </div>
            </>
          )}
        </>
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
    await onSave(media._id, { categoria, descripcion });
    setSaving(false);
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
          <div className="ig-form-row" style={{ marginTop: 12 }}>
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
