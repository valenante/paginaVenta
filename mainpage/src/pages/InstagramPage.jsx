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
  const [tab, setTab] = useState("posts");

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
      alert("Error: " + (err?.response?.data?.message || err.message));
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
      alert("Error: " + (err?.response?.data?.message || err.message));
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

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Cargando...</div>;

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
        <div className="sug-section" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>📱</div>
          <h3 style={{ margin: "0 0 8px", color: "#f1f5f9" }}>Conecta tu Instagram Business</h3>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", maxWidth: 500, margin: "0 auto 20px", lineHeight: 1.5 }}>
            ALEF generará posts basados en los datos reales de tu restaurante — platos estrella, días flojos, celebraciones. Tú apruebas antes de publicar.
          </p>
          <button className="sug-btn sug-btn--primary" onClick={handleConnect}>Conectar Instagram</button>
        </div>
      )}

      {connected && (
        <>
          <div className="ig-tabs">
            <button className={`ig-tab ${tab === "posts" ? "ig-tab--active" : ""}`} onClick={() => setTab("posts")}>Posts</button>
            <button className={`ig-tab ${tab === "config" ? "ig-tab--active" : ""}`} onClick={() => setTab("config")}>Configuración</button>
          </div>

          {tab === "posts" && (
            <>
              <div className="sug-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", color: "#94a3b8", fontWeight: 600 }}>{posts.length} posts</span>
                <button className="sug-btn sug-btn--primary" onClick={handleGenerate} disabled={generating}>
                  {generating ? "Generando..." : "🤖 Generar post"}
                </button>
              </div>

              {posts.length === 0 && (
                <div className="sug-section" style={{ textAlign: "center", padding: "30px 20px", color: "#94a3b8", fontSize: "0.85rem" }}>
                  No hay posts. Pulsa "Generar post" para que ALEF cree un borrador.
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
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{post.motivo?.replace("_", " ")}</span>
                        {post.productoNombre && <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>{post.productoNombre}</span>}
                      </div>
                      <p className="ig-post-card__caption">{post.caption}</p>
                      {post.hashtags?.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {post.hashtags.map((t, i) => <span key={i} style={{ fontSize: "0.7rem", color: "#60b5ff" }}>#{t}</span>)}
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
                        {post.estado === "publicado" && <span style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 600 }}>✓ Publicado</span>}
                        {post.estado === "error" && <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>⚠ {post.error}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === "config" && (
            <>
              <div className="sug-section">
                <h3 className="sug-section__title">Tono del contenido</h3>
                <select className="sug-select" value={config.tono || "casual"} onChange={(e) => handleSaveConfig({ tono: e.target.value })}>
                  <option value="casual">Casual — cercano, como un amigo</option>
                  <option value="formal">Formal — elegante y sofisticado</option>
                  <option value="gastronomico">Gastronómico — sabores y texturas</option>
                  <option value="divertido">Divertido — humor y energía</option>
                </select>
              </div>
              <div className="sug-section">
                <h3 className="sug-section__title">Posts por semana</h3>
                <select className="sug-select" value={config.frecuencia?.postsSemanales || 3} onChange={(e) => handleSaveConfig({ frecuencia: { ...config.frecuencia, postsSemanales: Number(e.target.value) } })}>
                  <option value={1}>1 post/semana</option>
                  <option value={2}>2 posts/semana</option>
                  <option value={3}>3 posts/semana</option>
                  <option value={5}>5 posts/semana</option>
                  <option value={7}>1 post/día</option>
                </select>
              </div>
              <div className="sug-section">
                <h3 className="sug-section__title">Idioma</h3>
                <select className="sug-select" value={config.idioma || "es"} onChange={(e) => handleSaveConfig({ idioma: e.target.value })}>
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                  <option value="es+en">Español + Inglés</option>
                </select>
              </div>
              <div className="sug-section">
                <h3 className="sug-section__title">Aprobación manual</h3>
                <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: "0.85rem", color: "#e2e8f0", cursor: "pointer" }}>
                  <input type="checkbox" checked={config.aprobacionManual !== false} onChange={(e) => handleSaveConfig({ aprobacionManual: e.target.checked })} style={{ width: 18, height: 18, accentColor: "#60b5ff" }} />
                  Revisar cada post antes de publicar
                </label>
              </div>
              <div className="sug-section">
                <h3 className="sug-section__title">Hashtags fijos</h3>
                <input
                  className="sug-input"
                  type="text"
                  placeholder="ZaborFeten, Torremolinos, RestaurantesMalaga"
                  defaultValue={(config.hashtagsFijos || []).join(", ")}
                  onBlur={(e) => {
                    const tags = e.target.value.split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean);
                    handleSaveConfig({ hashtagsFijos: tags });
                  }}
                />
                <p style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 6 }}>Separados por comas. Se añaden al final de cada post.</p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
