import React, { useState, useRef } from "react";
import api from "../../utils/api";
import ModalBase from "../MapaEditor/ModalBase";

export default function RecibirFotoModal({ onClose, onDone }) {
  const [step, setStep] = useState("upload"); // upload, analyzing, preview, applying, done
  const [image, setImage] = useState(null); // { base64, mimeType, name }
  const [result, setResult] = useState(null); // { matched, unmatched }
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      setImage({ base64, mimeType: file.type, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const analizar = async () => {
    if (!image) return;
    setStep("analyzing");
    setError(null);
    try {
      const { data } = await api.post("/stock/albaran-vision", {
        imageBase64: image.base64,
        imageMimeType: image.mimeType,
      });
      const res = data.data || data;
      setResult(res);
      // Select all matched by default
      const sel = new Set();
      (res.matched || []).forEach((_, i) => sel.add(i));
      setSelected(sel);
      setStep("preview");
    } catch (err) {
      setError(err.response?.data?.message || "Error analizando la imagen");
      setStep("upload");
    }
  };

  const aplicar = async () => {
    if (!result?.matched?.length) return;
    setStep("applying");
    setError(null);
    try {
      const items = result.matched
        .filter((_, i) => selected.has(i))
        .filter((m) => m.match?.tipo === "ingrediente")
        .map((m) => ({
          ingredienteId: m.match.id,
          cantidad: m.cantidad || 0,
        }));

      if (items.length === 0) {
        setError("No hay ingredientes seleccionados para aplicar");
        setStep("preview");
        return;
      }

      await api.post("/stock/albaran-vision/apply", { items });
      setStep("done");
      setTimeout(() => { onDone?.(); onClose(); }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Error aplicando al stock");
      setStep("preview");
    }
  };

  const toggleSelect = (i) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const footer = (
    <div className="alefForm-actions">
      <button type="button" className="alefBtn ghost" onClick={onClose}>
        {step === "done" ? "Cerrar" : "Cancelar"}
      </button>
      {step === "upload" && image && (
        <button type="button" className="alefBtn primary" onClick={analizar}>
          🤖 Analizar imagen
        </button>
      )}
      {step === "preview" && (
        <button type="button" className="alefBtn primary" onClick={aplicar}>
          ✅ Aplicar {selected.size} al stock
        </button>
      )}
    </div>
  );

  return (
    <ModalBase
      open={true}
      title="📷 Recibir mercancía con foto"
      subtitle="Saca una foto del albarán o súbela. ALEF extraerá los productos automáticamente."
      onClose={onClose}
      footer={footer}
      width={800}
    >
      {error && (
        <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#fca5a5", fontSize: "0.82rem", marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          {!image ? (
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed rgba(96,181,255,0.3)",
                borderRadius: 14,
                padding: "40px 20px",
                cursor: "pointer",
                color: "#94a3b8",
                transition: "all 0.15s",
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = "rgba(96,181,255,0.6)"}
              onMouseOut={(e) => e.currentTarget.style.borderColor = "rgba(96,181,255,0.3)"}
            >
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>📷</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Sube una foto del albarán</div>
              <div style={{ fontSize: "0.78rem" }}>Toca para abrir cámara o seleccionar archivo</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: 8 }}>📎 {image.name}</div>
              <button
                type="button"
                className="alefBtn ghost"
                onClick={() => { setImage(null); fileRef.current.value = ""; }}
                style={{ fontSize: "0.78rem" }}
              >
                Cambiar imagen
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Analyzing */}
      {step === "analyzing" && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: 12 }}>🤖</div>
          <div style={{ fontWeight: 700 }}>Analizando imagen con IA...</div>
          <div style={{ fontSize: "0.78rem", marginTop: 4 }}>Extrayendo productos, cantidades y precios</div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && result && (
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {result.matched?.length > 0 && (
            <>
              <h4 style={{ margin: "0 0 8px", fontSize: "0.88rem" }}>
                ✅ Productos reconocidos ({result.matched.length})
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", marginBottom: 16 }}>
                <thead>
                  <tr style={{ color: "#94a3b8", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <th style={{ width: 30, padding: "6px 8px" }}></th>
                    <th style={{ textAlign: "left", padding: "6px 8px" }}>Albarán</th>
                    <th style={{ textAlign: "left", padding: "6px 8px" }}>En ALEF</th>
                    <th style={{ padding: "6px 8px" }}>Cant.</th>
                    <th style={{ padding: "6px 8px" }}>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {result.matched.map((m, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#e2e8f0" }}>
                      <td style={{ padding: "6px 8px" }}>
                        <input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)} style={{ accentColor: "#60b5ff" }} />
                      </td>
                      <td style={{ padding: "6px 8px" }}>{m.nombreAlbaran}</td>
                      <td style={{ padding: "6px 8px" }}>
                        <strong>{m.match?.nombreSistema}</strong>
                        <span style={{ fontSize: "0.7rem", color: "#64748b", marginLeft: 6 }}>{m.match?.tipo}</span>
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>{m.cantidad} {m.unidad}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>{m.precioTotal != null ? m.precioTotal.toFixed(2) + "€" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {result.unmatched?.length > 0 && (
            <>
              <h4 style={{ margin: "0 0 8px", fontSize: "0.88rem", color: "#f59e0b" }}>
                ⚠️ No reconocidos ({result.unmatched.length})
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ color: "#94a3b8", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <th style={{ textAlign: "left", padding: "6px 8px" }}>Del albarán</th>
                    <th style={{ padding: "6px 8px" }}>Cant.</th>
                    <th style={{ padding: "6px 8px" }}>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {result.unmatched.map((u, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#94a3b8" }}>
                      <td style={{ padding: "6px 8px" }}>{u.nombreAlbaran}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>{u.cantidad} {u.unidad}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>{u.precioTotal != null ? u.precioTotal.toFixed(2) + "€" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* Step 4: Applying */}
      {step === "applying" && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 700 }}>Actualizando stock...</div>
        </div>
      )}

      {/* Step 5: Done */}
      {step === "done" && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#22c55e" }}>
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Stock actualizado</div>
        </div>
      )}
    </ModalBase>
  );
}
