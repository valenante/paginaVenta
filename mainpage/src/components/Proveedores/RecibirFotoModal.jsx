import React, { useState, useRef } from "react";
import api from "../../utils/api";
import ModalBase from "../MapaEditor/ModalBase";
import "./RecibirFotoModal.css";

export default function RecibirFotoModal({ onClose, onDone }) {
  const [mode, setMode] = useState("foto");
  const [step, setStep] = useState("upload");
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [editedResult, setEditedResult] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [updatePrices, setUpdatePrices] = useState(new Set());
  const fileRef = useRef(null);

  const [manualItems, setManualItems] = useState([{ nombre: "", cantidad: "", unidad: "unidad" }]);

  // Búsqueda para vincular no reconocidos
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingIdx, setSearchingIdx] = useState(null);

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
      setEditedResult({
        matched: (res.matched || []).map(m => ({ ...m })),
        unmatched: (res.unmatched || []).map(u => ({ ...u })),
      });
      const sel = new Set();
      const upd = new Set();
      (res.matched || []).forEach((m, i) => {
        sel.add(i);
        // Auto-marcar actualizar precio si difiere >5%
        if (m.match?.costeDB && m.precioTotal) {
          const precioUd = m.precioTotal / (m.cantidad || 1);
          const diff = Math.abs(precioUd - m.match.costeDB) / m.match.costeDB;
          if (diff > 0.05) upd.add(i);
        }
      });
      setSelected(sel);
      setUpdatePrices(upd);
      setStep("preview");
    } catch (err) {
      setError(err.response?.data?.message || "Error analizando la imagen");
      setStep("upload");
    }
  };

  const aplicar = async () => {
    if (!editedResult?.matched?.length) return;
    setStep("applying");
    setError(null);
    try {
      const items = editedResult.matched
        .filter((_, i) => selected.has(i))
        .filter((m) => m.match?.tipo === "ingrediente")
        .map((m, i) => {
          const base = {
            ingredienteId: m.match.id,
            cantidad: Number(m.cantidad) || 0,
          };
          // Si "actualizar precio" está marcado, enviar precio nuevo
          const realIdx = editedResult.matched.indexOf(m);
          if (updatePrices.has(realIdx) && m.precioTotal && m.cantidad) {
            base.precioNuevo = Math.round((Number(m.precioTotal) / Number(m.cantidad)) * 100) / 100;
            if (m.match.productoProveedorId) base.productoProveedorId = m.match.productoProveedorId;
          }
          return base;
        });

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

  const updateMatched = (i, field, val) => {
    setEditedResult(prev => ({
      ...prev,
      matched: prev.matched.map((m, idx) => idx === i ? { ...m, [field]: val } : m),
    }));
  };

  const updateUnmatched = (i, field, val) => {
    setEditedResult(prev => ({
      ...prev,
      unmatched: prev.unmatched.map((u, idx) => idx === i ? { ...u, [field]: val } : u),
    }));
  };

  const toggleSelect = (i) => {
    setSelected(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  };

  const toggleUpdatePrice = (i) => {
    setUpdatePrices(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  };

  // Buscar ingredientes para vincular no reconocidos
  const searchIngrediente = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const { data } = await api.get("/stock/ingredientes", { params: { search: q, limit: 6 } });
      setSearchResults(data?.items || data || []);
    } catch { setSearchResults([]); }
  };

  const vincularNoReconocido = (unmatchedIdx, ingrediente) => {
    setEditedResult(prev => {
      const u = prev.unmatched[unmatchedIdx];
      const newMatched = [...prev.matched, {
        ...u,
        match: {
          tipo: "ingrediente",
          id: String(ingrediente._id),
          nombreSistema: ingrediente.nombre,
          stockActual: ingrediente.stockActual || 0,
          unidadSistema: ingrediente.unidad,
          costeDB: ingrediente.coste || null,
        },
        confianza: "manual",
      }];
      const newUnmatched = prev.unmatched.filter((_, i) => i !== unmatchedIdx);
      // Seleccionar el nuevo matched
      setSelected(prev => { const n = new Set(prev); n.add(newMatched.length - 1); return n; });
      return { matched: newMatched, unmatched: newUnmatched };
    });
    setSearchingIdx(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Calcular badge de diferencia de precio
  const priceBadge = (m) => {
    if (!m.match?.costeDB || !m.precioTotal || !m.cantidad) return null;
    const precioNuevo = Number(m.precioTotal) / Number(m.cantidad);
    const diff = ((precioNuevo - m.match.costeDB) / m.match.costeDB) * 100;
    if (Math.abs(diff) < 2) return { cls: "recibir-badge--equal", text: "=" };
    if (diff > 0) return { cls: "recibir-badge--up", text: `+${diff.toFixed(0)}%` };
    return { cls: "recibir-badge--down", text: `${diff.toFixed(0)}%` };
  };

  // Manual mode
  const addManualRow = () => setManualItems(prev => [...prev, { nombre: "", cantidad: "", unidad: "unidad" }]);
  const updateManualRow = (i, field, val) => setManualItems(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const removeManualRow = (i) => setManualItems(prev => prev.filter((_, idx) => idx !== i));

  const aplicarManual = async () => {
    const valid = manualItems.filter(i => i.nombre.trim() && Number(i.cantidad) > 0);
    if (!valid.length) return;
    setStep("applying");
    setError(null);
    try {
      const items = [];
      for (const item of valid) {
        const { data } = await api.get("/stock/ingredientes", { params: { search: item.nombre, limit: 1 } });
        const found = data?.items?.[0] || data?.[0];
        if (found) items.push({ ingredienteId: found._id, cantidad: Number(item.cantidad) });
      }
      if (items.length) await api.post("/stock/albaran-vision/apply", { items });
      setStep("done");
      setTimeout(() => { onDone?.(); onClose(); }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Error aplicando");
      setStep("upload");
    }
  };

  const footer = (
    <div className="recibir-footer">
      <button type="button" className="alefBtn ghost" onClick={onClose}>
        {step === "done" ? "Cerrar" : "Cancelar"}
      </button>
      {mode === "foto" && step === "upload" && image && (
        <button type="button" className="alefBtn primary" onClick={analizar}>Analizar imagen</button>
      )}
      {mode === "manual" && step === "upload" && (
        <button type="button" className="alefBtn primary" onClick={aplicarManual}
          disabled={!manualItems.some(i => i.nombre.trim() && Number(i.cantidad) > 0)}>
          Aplicar al stock
        </button>
      )}
      {step === "preview" && (
        <button type="button" className="alefBtn primary" onClick={aplicar}>
          Aplicar {selected.size} al stock
        </button>
      )}
    </div>
  );

  return (
    <ModalBase open={true} title="Recibir mercancia" subtitle="Sube una foto del albaran o introduce manualmente. ALEF extrae y compara con los datos existentes." onClose={onClose} footer={footer} width={900}>
      {error && <div className="recibir-alert">{error}</div>}

      {step === "upload" && (
        <div className="recibir-modes">
          <button type="button" className={`recibir-modeBtn ${mode === "foto" ? "recibir-modeBtn--active" : ""}`} onClick={() => setMode("foto")}>Con foto</button>
          <button type="button" className={`recibir-modeBtn ${mode === "manual" ? "recibir-modeBtn--active" : ""}`} onClick={() => setMode("manual")}>Manual</button>
        </div>
      )}

      {/* Upload foto */}
      {step === "upload" && mode === "foto" && (
        <div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={e => handleFile(e.target.files?.[0])} />
          {!image ? (
            <div className="recibir-dropzone" onClick={() => fileRef.current?.click()}>
              <div className="recibir-dropzone-icon">📷</div>
              <div className="recibir-dropzone-title">Sube una foto del albaran</div>
              <div className="recibir-dropzone-hint">Toca para abrir camara o seleccionar archivo</div>
            </div>
          ) : (
            <div className="recibir-fileInfo">
              <div className="recibir-fileName">📎 {image.name}</div>
              <button type="button" className="alefBtn ghost" onClick={() => { setImage(null); fileRef.current.value = ""; }}>Cambiar imagen</button>
            </div>
          )}
        </div>
      )}

      {/* Manual */}
      {step === "upload" && mode === "manual" && (
        <div>
          <table className="recibir-manualTable">
            <thead><tr><th>Producto / Ingrediente</th><th style={{ width: 100 }}>Cantidad</th><th style={{ width: 100 }}>Unidad</th><th style={{ width: 40 }}></th></tr></thead>
            <tbody>
              {manualItems.map((item, i) => (
                <tr key={i}>
                  <td><input type="text" className="recibir-manualInput" placeholder="Nombre..." value={item.nombre} onChange={e => updateManualRow(i, "nombre", e.target.value)} /></td>
                  <td><input type="number" min="0" className="recibir-manualInput recibir-manualInput--center" placeholder="0" value={item.cantidad} onChange={e => updateManualRow(i, "cantidad", e.target.value)} /></td>
                  <td><select className="recibir-manualInput" value={item.unidad} onChange={e => updateManualRow(i, "unidad", e.target.value)}><option value="unidad">uds</option><option value="caja">caja</option><option value="kg">kg</option><option value="litro">litro</option><option value="botella">botella</option></select></td>
                  <td>{manualItems.length > 1 && <button type="button" className="recibir-manualDelete" onClick={() => removeManualRow(i)}>✕</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="recibir-addRow" onClick={addManualRow}>+ Añadir linea</button>
        </div>
      )}

      {step === "analyzing" && (
        <div className="recibir-status"><div className="recibir-status-icon">🤖</div><div className="recibir-status-title">Analizando imagen con IA...</div><div className="recibir-status-hint">Extrayendo productos, cantidades y precios</div></div>
      )}

      {/* Preview con comparación */}
      {step === "preview" && editedResult && (
        <div className="recibir-preview">
          {editedResult.matched?.length > 0 && (
            <>
              <h4 className="recibir-sectionTitle">Productos reconocidos ({editedResult.matched.length})</h4>
              <table className="recibir-table">
                <thead>
                  <tr>
                    <th style={{ width: 30 }}></th>
                    <th>Del albaran</th>
                    <th>En ALEF</th>
                    <th style={{ width: 70 }}>Stock</th>
                    <th style={{ width: 80 }}>Cant.</th>
                    <th style={{ width: 90 }}>Precio</th>
                    <th style={{ width: 80 }}>En DB</th>
                    <th style={{ width: 50 }}>Diff</th>
                    <th style={{ width: 30 }}>$</th>
                  </tr>
                </thead>
                <tbody>
                  {editedResult.matched.map((m, i) => {
                    const badge = priceBadge(m);
                    return (
                      <tr key={i}>
                        <td><input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)} /></td>
                        <td>
                          <input type="text" className="recibir-editInput recibir-editInput--wide" value={m.nombreAlbaran || ""} onChange={e => updateMatched(i, "nombreAlbaran", e.target.value)} />
                        </td>
                        <td className="recibir-table td--match">
                          {m.match?.nombreSistema}
                          <span className="recibir-matchTipo">{m.match?.tipo}</span>
                        </td>
                        <td className="recibir-table td--muted">{m.match?.stockActual ?? "—"}</td>
                        <td><input type="number" min="0" step="0.1" className="recibir-editInput" value={m.cantidad ?? ""} onChange={e => updateMatched(i, "cantidad", e.target.value)} /></td>
                        <td><input type="number" min="0" step="0.01" className="recibir-editInput" value={m.precioTotal ?? ""} onChange={e => updateMatched(i, "precioTotal", e.target.value)} /></td>
                        <td className="recibir-table td--muted">{m.match?.costeDB != null ? m.match.costeDB.toFixed(2) + "€" : "—"}</td>
                        <td>{badge ? <span className={`recibir-badge ${badge.cls}`}>{badge.text}</span> : "—"}</td>
                        <td>{badge && badge.cls !== "recibir-badge--equal" ? <input type="checkbox" checked={updatePrices.has(i)} onChange={() => toggleUpdatePrice(i)} title="Actualizar precio en DB" /> : null}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {editedResult.unmatched?.length > 0 && (
            <>
              <h4 className="recibir-sectionTitle recibir-sectionTitle--warn">No reconocidos ({editedResult.unmatched.length})</h4>
              <table className="recibir-table">
                <thead>
                  <tr>
                    <th>Del albaran</th>
                    <th style={{ width: 80 }}>Cant.</th>
                    <th style={{ width: 90 }}>Precio</th>
                    <th>Vincular a...</th>
                  </tr>
                </thead>
                <tbody>
                  {editedResult.unmatched.map((u, i) => (
                    <tr key={i}>
                      <td>{u.nombreAlbaran}</td>
                      <td><input type="number" min="0" step="0.1" className="recibir-editInput recibir-editInput--muted" value={u.cantidad ?? ""} onChange={e => updateUnmatched(i, "cantidad", e.target.value)} /></td>
                      <td><input type="number" min="0" step="0.01" className="recibir-editInput recibir-editInput--muted" value={u.precioTotal ?? ""} onChange={e => updateUnmatched(i, "precioTotal", e.target.value)} /></td>
                      <td>
                        {searchingIdx === i ? (
                          <div className="recibir-searchWrap">
                            <input type="text" className="recibir-editInput recibir-editInput--wide" placeholder="Buscar ingrediente..." autoFocus value={searchQuery} onChange={e => searchIngrediente(e.target.value)} onBlur={() => setTimeout(() => { if (searchingIdx === i) setSearchingIdx(null); }, 200)} />
                            {searchResults.length > 0 && (
                              <div className="recibir-searchDropdown">
                                {searchResults.map((ing, j) => (
                                  <div key={j} className="recibir-searchItem" onMouseDown={() => vincularNoReconocido(i, ing)}>
                                    <span className="recibir-searchItem-name">{ing.nombre}</span>
                                    <span className="recibir-searchItem-stock">{ing.stockActual || 0} {ing.unidad}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button type="button" className="recibir-linkBtn" onClick={() => { setSearchingIdx(i); setSearchQuery(""); setSearchResults([]); }}>Vincular</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {step === "applying" && (
        <div className="recibir-status"><div className="recibir-status-icon">📦</div><div className="recibir-status-title">Actualizando stock...</div></div>
      )}

      {step === "done" && (
        <div className="recibir-status recibir-status--done"><div className="recibir-status-icon">✅</div><div className="recibir-status-title">Stock actualizado</div></div>
      )}
    </ModalBase>
  );
}
