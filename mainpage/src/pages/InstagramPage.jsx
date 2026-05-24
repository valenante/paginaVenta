import React, { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import "./InstagramPage.css";

export default function InstagramPage() {
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState({});
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(null);
  const [tab, setTab] = useState("posts"); // posts | config

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, p] = await Promise.allSettled([
        api.get("/admin/instagram/status"),
        api.get("/admin/instagram/config"),
        api.get("/admin/instagram/posts?limit=20"),
      ]);
      if (s.status === "fulfilled") setStatus(s.value.data?.data || s.value.data);
      if (c.status === "fulfilled") setConfig(c.value.data?.data || c.value.data || {});
      if (p.status === "fulfilled") setPosts((p.value.data?.data?.items || p.value.data?.items || []));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleConnect = async () => {
    try {
      const { data } = await api.get("/admin/instagram/auth-url");
      const url = data?.data?.url || data?.url;
      if (url) window.location.href = url;
    } catch (err) {
      alert("Error al generar URL de conexión: " + (err?.response?.data?.message || err.message));
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("¿Desconectar Instagram?")) return;
    await api.post("/admin/instagram/disconnect");
    fetchAll();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post("/admin/instagram/posts/generate");
      fetchAll();
    } catch (err) {
      alert("No se pudo generar: " + (err?.response?.data?.message || "Sin contenido disponible"));
    }
    setGenerating(false);
  };

  const handlePublish = async (postId) => {
    setPublishing(postId);
    try {
      await api.post(`/admin/instagram/posts/${postId}/publish`);
      fetchAll();
    } catch (err) {
      alert("Error al publicar: " + (err?.response?.data?.message || err.message));
    }
    setPublishing(null);
  };

  const handleApprove = async (postId) => {
    await api.post(`/admin/instagram/posts/${postId}/approve`);
    fetchAll();
  };

  const handleDiscard = async (postId) => {
    await api.post(`/admin/instagram/posts/${postId}/discard`);
    fetchAll();
  };

  const handleSaveConfig = async (updates) => {
    await api.put("/admin/instagram/config", updates);
    fetchAll();
  };

  const connected = status?.connected;

  if (loading) return <div className="ig-loading">Cargando...</div>;

  return (
    <div className="ig-root">
      {/* Header */}
      <div className="ig-header">
        <div>
          <h2 className="ig-title">📸 Instagram</h2>
          <p className="ig-subtitle">
            {connected
              ? `Conectado como @${status.username}`
              : "Conecta tu cuenta de Instagram para publicar automáticamente."}
          </p>
        </div>
        {connected ? (
          <button className="ig-btn ig-btn--ghost" onClick={handleDisconnect}>Desconectar</button>
        ) : (
          <button className="ig-btn ig-btn--primary" onClick={handleConnect}>Conectar Instagram</button>
        )}
      </div>

      {!connected && (
        <div className="ig-empty">
          <div className="ig-empty__icon">📱</div>
          <h3>Conecta tu Instagram Business</h3>
          <p>ALEF generará posts basados en los datos reales de tu restaurante — platos estrella, días flojos, celebraciones. Tú apruebas antes de publicar.</p>
          <button className="ig-btn ig-btn--primary" onClick={handleConnect}>Conectar Instagram</button>
        </div>
      )}

      {connected && (
        <>
          {/* Tabs */}
          <div className="ig-tabs">
            <button className={`ig-tab ${tab === "posts" ? "ig-tab--active" : ""}`} onClick={() => setTab("posts")}>
              Posts
            </button>
            <button className={`ig-tab ${tab === "config" ? "ig-tab--active" : ""}`} onClick={() => setTab("config")}>
              Configuración
            </button>
          </div>

          {/* Posts tab */}
          {tab === "posts" && (
            <div className="ig-posts">
              <div className="ig-posts__header">
                <span className="ig-posts__count">{posts.length} posts</span>
                <button
                  className="ig-btn ig-btn--primary"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? "Generando..." : "🤖 Generar post"}
                </button>
              </div>

              {posts.length === 0 && (
                <div className="ig-empty ig-empty--small">
                  <p>No hay posts. Pulsa "Generar post" para que ALEF cree un borrador basado en tus datos.</p>
                </div>
              )}

              <div className="ig-posts__list">
                {posts.map((post) => (
                  <div key={post._id} className={`ig-post ig-post--${post.estado}`}>
                    <div className="ig-post__image">
                      {post.imageUrl ? (
                        <img src={post.imageUrl} alt="" />
                      ) : (
                        <div className="ig-post__noimg">📷</div>
                      )}
                    </div>
                    <div className="ig-post__body">
                      <div className="ig-post__meta">
                        <span className={`ig-post__badge ig-post__badge--${post.estado}`}>
                          {post.estado}
                        </span>
                        <span className="ig-post__motivo">{post.motivo?.replace("_", " ")}</span>
                        {post.productoNombre && (
                          <span className="ig-post__producto">{post.productoNombre}</span>
                        )}
                      </div>
                      <p className="ig-post__caption">{post.caption}</p>
                      {post.hashtags?.length > 0 && (
                        <div className="ig-post__tags">
                          {post.hashtags.map((t, i) => (
                            <span key={i} className="ig-post__tag">#{t}</span>
                          ))}
                        </div>
                      )}
                      <div className="ig-post__actions">
                        {post.estado === "borrador" && (
                          <>
                            <button className="ig-btn ig-btn--small ig-btn--primary" onClick={() => handleApprove(post._id)}>Aprobar</button>
                            <button
                              className="ig-btn ig-btn--small ig-btn--accent"
                              onClick={() => handlePublish(post._id)}
                              disabled={publishing === post._id}
                            >
                              {publishing === post._id ? "Publicando..." : "Publicar ahora"}
                            </button>
                            <button className="ig-btn ig-btn--small ig-btn--ghost" onClick={() => handleDiscard(post._id)}>Descartar</button>
                          </>
                        )}
                        {post.estado === "aprobado" && (
                          <button
                            className="ig-btn ig-btn--small ig-btn--accent"
                            onClick={() => handlePublish(post._id)}
                            disabled={publishing === post._id}
                          >
                            {publishing === post._id ? "Publicando..." : "Publicar ahora"}
                          </button>
                        )}
                        {post.estado === "publicado" && (
                          <span className="ig-post__published">✓ Publicado {post.publicadoAt ? new Date(post.publicadoAt).toLocaleDateString("es-ES") : ""}</span>
                        )}
                        {post.estado === "error" && (
                          <span className="ig-post__error">⚠ {post.error}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Config tab */}
          {tab === "config" && (
            <div className="ig-config">
              <div className="ig-config__section">
                <label className="ig-config__label">Tono del contenido</label>
                <select
                  className="ig-config__select"
                  value={config.tono || "casual"}
                  onChange={(e) => handleSaveConfig({ tono: e.target.value })}
                >
                  <option value="casual">Casual — cercano, como un amigo</option>
                  <option value="formal">Formal — elegante y sofisticado</option>
                  <option value="gastronomico">Gastronómico — sabores y texturas</option>
                  <option value="divertido">Divertido — humor y energía</option>
                </select>
              </div>

              <div className="ig-config__section">
                <label className="ig-config__label">Posts por semana</label>
                <select
                  className="ig-config__select"
                  value={config.frecuencia?.postsSemanales || 3}
                  onChange={(e) => handleSaveConfig({ frecuencia: { ...config.frecuencia, postsSemanales: Number(e.target.value) } })}
                >
                  <option value={1}>1 post/semana</option>
                  <option value={2}>2 posts/semana</option>
                  <option value={3}>3 posts/semana</option>
                  <option value={5}>5 posts/semana</option>
                  <option value={7}>1 post/día</option>
                </select>
              </div>

              <div className="ig-config__section">
                <label className="ig-config__label">Idioma</label>
                <select
                  className="ig-config__select"
                  value={config.idioma || "es"}
                  onChange={(e) => handleSaveConfig({ idioma: e.target.value })}
                >
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                  <option value="es+en">Español + Inglés</option>
                </select>
              </div>

              <div className="ig-config__section">
                <label className="ig-config__label">Aprobación manual</label>
                <label className="ig-config__toggle">
                  <input
                    type="checkbox"
                    checked={config.aprobacionManual !== false}
                    onChange={(e) => handleSaveConfig({ aprobacionManual: e.target.checked })}
                  />
                  <span>Revisar cada post antes de publicar</span>
                </label>
              </div>

              <div className="ig-config__section">
                <label className="ig-config__label">Hashtags fijos</label>
                <input
                  className="ig-config__input"
                  type="text"
                  placeholder="ZaborFeten, Torremolinos, RestaurantesMalaga"
                  defaultValue={(config.hashtagsFijos || []).join(", ")}
                  onBlur={(e) => {
                    const tags = e.target.value.split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean);
                    handleSaveConfig({ hashtagsFijos: tags });
                  }}
                />
                <p className="ig-config__hint">Separados por comas. Se añaden al final de cada post.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
