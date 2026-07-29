import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  BLOQUES,
  PRESETS,
  TIPOS_ANADIBLES,
  ACCIONES_CTA,
  buildHomeFromPreset,
  nuevoBloque,
} from "./homeBlocksCatalog";
import "./CartaHomeBuilder.css";

/**
 * Builder de la HOME componible: elegir plantilla, reordenar bloques (drag&drop),
 * activar/desactivar, cambiar la disposición (variante) y editar props por bloque,
 * con una vista previa esquemática. El estado vive en `config.carta.home`; se guarda
 * con el mismo botón "Guardar" de la página (draft+apply).
 *
 * @param home      config.carta.home actual (o undefined = home clásica)
 * @param onChange  (nuevoHome|undefined) => void  — undefined ⇒ volver a la home clásica
 * @param disabled  solo lectura
 */
export default function CartaHomeBuilder({ home, onChange, disabled = false }) {
  const bloques = Array.isArray(home?.bloques) ? home.bloques : null;
  const [abierto, setAbierto] = useState(null); // id del bloque con props desplegadas
  const [addOpen, setAddOpen] = useState(false);

  const emit = (nuevos, preset = home?.preset || "personalizado") =>
    onChange({ version: 1, preset, bloques: nuevos.map((b, i) => ({ ...b, orden: i })) });

  const elegirPreset = (id) => emit(buildHomeFromPreset(id).bloques, id);
  // null (no undefined) para que el guardado lo serialice y el backend limpie el campo
  // ⇒ la carta vuelve a la home clásica (LegacyHome).
  const restaurarClasica = () => onChange(null);

  const onDragEnd = (r) => {
    if (disabled || !r.destination || r.destination.index === r.source.index) return;
    const arr = [...bloques];
    const [movido] = arr.splice(r.source.index, 1);
    arr.splice(r.destination.index, 0, movido);
    emit(arr);
  };
  const setBloque = (id, patch) => emit(bloques.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const setProp = (id, key, val) =>
    emit(bloques.map((b) => {
      if (b.id !== id) return b;
      const props = { ...(b.props || {}) };
      if (key.includes(".")) {
        const [k1, k2] = key.split(".");
        props[k1] = { ...(props[k1] || {}), [k2]: val };
      } else {
        props[key] = val;
      }
      return { ...b, props };
    }));
  const getProp = (bl, key) => {
    if (key.includes(".")) { const [k1, k2] = key.split("."); return bl.props?.[k1]?.[k2]; }
    return bl.props?.[key];
  };
  const quitar = (id) => emit(bloques.filter((b) => b.id !== id));
  const anadir = (tipo) => { emit([...(bloques || []), nuevoBloque(tipo)]); setAddOpen(false); };

  // ── Editor de botones (bloque CTA) ──
  const editorBotones = (bl) => {
    const botones = Array.isArray(bl.props?.botones) ? bl.props.botones : [];
    const setBtns = (arr) => setProp(bl.id, "botones", arr);
    return (
      <div className="chb-btns">
        {botones.map((btn, i) => (
          <div className="chb-btn-row" key={i}>
            <input
              type="text"
              className="chb-input"
              placeholder="Texto del botón"
              value={btn.label || ""}
              disabled={disabled}
              onChange={(e) => setBtns(botones.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
            />
            <select
              className="chb-input"
              value={btn.accion || "carta"}
              disabled={disabled}
              onChange={(e) => setBtns(botones.map((x, j) => (j === i ? { ...x, accion: e.target.value } : x)))}
            >
              {ACCIONES_CTA.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
            </select>
            <select
              className="chb-input"
              value={btn.estilo || "primario"}
              disabled={disabled}
              onChange={(e) => setBtns(botones.map((x, j) => (j === i ? { ...x, estilo: e.target.value } : x)))}
            >
              <option value="primario">Relleno</option>
              <option value="secundario">Contorno</option>
            </select>
            {btn.accion === "url" && (
              <input
                type="text"
                className="chb-input chb-input--url"
                placeholder="https://…"
                value={btn.url || ""}
                disabled={disabled}
                onChange={(e) => setBtns(botones.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
              />
            )}
            <button type="button" className="chb-icon-btn" disabled={disabled}
              onClick={() => setBtns(botones.filter((_, j) => j !== i))} title="Quitar botón">✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-secundario chb-add-btn" disabled={disabled}
          onClick={() => setBtns([...botones, { label: "Nuevo botón", accion: "carta", estilo: "primario" }])}>
          + Añadir botón
        </button>
      </div>
    );
  };

  // ── Editor de reseñas (bloque resenas) ──
  const editorResenas = (bl) => {
    const items = Array.isArray(bl.props?.items) ? bl.props.items : [];
    const set = (arr) => setProp(bl.id, "items", arr);
    return (
      <div className="chb-btns">
        {items.map((it, i) => (
          <div className="chb-btn-row" key={i}>
            <input className="chb-input" placeholder="Autor" value={it.autor || ""} disabled={disabled}
              onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, autor: e.target.value } : x)))} />
            <select className="chb-input" value={it.estrellas || 5} disabled={disabled}
              onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, estrellas: Number(e.target.value) } : x)))}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
            </select>
            <textarea className="chb-input chb-input--url" rows={2} placeholder="Testimonio" value={it.texto || ""} disabled={disabled}
              onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)))} />
            <button type="button" className="chb-icon-btn" disabled={disabled} onClick={() => set(items.filter((_, j) => j !== i))} title="Quitar">✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-secundario chb-add-btn" disabled={disabled}
          onClick={() => set([...items, { texto: "", autor: "", estrellas: 5 }])}>+ Añadir reseña</button>
      </div>
    );
  };

  // ── Editor de redes (bloque redes) ──
  const TIPOS_RED = [["instagram", "Instagram"], ["facebook", "Facebook"], ["whatsapp", "WhatsApp"], ["tiktok", "TikTok"], ["web", "Web"], ["telefono", "Teléfono"]];
  const editorRedes = (bl) => {
    const redes = Array.isArray(bl.props?.redes) ? bl.props.redes : [];
    const set = (arr) => setProp(bl.id, "redes", arr);
    return (
      <div className="chb-btns">
        {redes.map((r, i) => (
          <div className="chb-btn-row" key={i}>
            <select className="chb-input" value={r.tipo || "instagram"} disabled={disabled}
              onChange={(e) => set(redes.map((x, j) => (j === i ? { ...x, tipo: e.target.value } : x)))}>
              {TIPOS_RED.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
            </select>
            <input className="chb-input" placeholder="URL o teléfono" value={r.url || ""} disabled={disabled}
              onChange={(e) => set(redes.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
            <button type="button" className="chb-icon-btn" disabled={disabled} onClick={() => set(redes.filter((_, j) => j !== i))} title="Quitar">✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-secundario chb-add-btn" disabled={disabled}
          onClick={() => set([...redes, { tipo: "instagram", url: "" }])}>+ Añadir red</button>
      </div>
    );
  };

  // ── Editor de props de un bloque ──
  const editorProps = (bl) => {
    const def = BLOQUES[bl.tipo];
    if (!def || def.props.length === 0) {
      return <p className="chb-noprops">Este bloque no tiene ajustes de contenido.</p>;
    }
    return (
      <div className="chb-props">
        {def.props.map((p) => {
          if (p.type === "botones") return <div key={p.key}>{editorBotones(bl)}</div>;
          if (p.type === "resenas") return <div key={p.key}>{editorResenas(bl)}</div>;
          if (p.type === "redes") return <div key={p.key}>{editorRedes(bl)}</div>;
          const val = getProp(bl, p.key) ?? "";
          return (
            <div className="config-field" key={p.key}>
              {p.label && <label>{p.label}</label>}
              {p.type === "textarea" ? (
                <textarea className="chb-input" rows={3} placeholder={p.placeholder || ""} disabled={disabled}
                  value={val} onChange={(e) => setProp(bl.id, p.key, e.target.value)} />
              ) : p.type === "select" ? (
                <select className="chb-input" value={val} disabled={disabled}
                  onChange={(e) => setProp(bl.id, p.key, e.target.value)}>
                  {(p.opciones || []).map(([v, n]) => <option key={v} value={v}>{n}</option>)}
                </select>
              ) : p.type === "color" ? (
                <input type="color" className="chb-input chb-input--color" disabled={disabled}
                  value={val || "#60b5ff"} onChange={(e) => setProp(bl.id, p.key, e.target.value)} />
              ) : (
                <input type="text" className="chb-input" placeholder={p.placeholder || ""} disabled={disabled}
                  value={val} onChange={(e) => setProp(bl.id, p.key, e.target.value)} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="card config-card chb">
      <div className="config-card-header">
        <div>
          <h2>Estructura de la home</h2>
          <p className="config-card-subtitle">
            Elige una plantilla y personalízala: reordena arrastrando, activa o desactiva
            secciones y cambia su disposición. La identidad (colores, logo) se mantiene.
          </p>
        </div>
      </div>

      {/* Plantillas */}
      <div className="chb-presets">
        {PRESETS.map((p) => (
          <button
            type="button"
            key={p.id}
            className={`chb-preset ${home?.preset === p.id ? "is-selected" : ""}`}
            disabled={disabled}
            onClick={() => elegirPreset(p.id)}
          >
            <span className="chb-preset__icon">{p.icono}</span>
            <span className="chb-preset__nombre">{p.nombre}</span>
            <span className="chb-preset__desc">{p.descripcion}</span>
          </button>
        ))}
      </div>

      {!bloques ? (
        <p className="chb-legacy-note">
          Ahora mismo usas la <strong>home clásica</strong> (Escaparate). Elige una plantilla
          arriba para empezar a estructurarla a tu gusto.
        </p>
      ) : (
        <>
          <div className="chb-builder">
            {/* Lista de bloques con drag&drop */}
            <div className="chb-list-wrap">
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="home-bloques">
                  {(provided) => (
                    <div className="chb-list" ref={provided.innerRef} {...provided.droppableProps}>
                      {bloques.map((bl, i) => {
                        const def = BLOQUES[bl.tipo] || { nombre: bl.tipo, icono: "❓", variantes: [] };
                        const open = abierto === bl.id;
                        return (
                          <Draggable key={bl.id} draggableId={bl.id} index={i} isDragDisabled={disabled}>
                            {(prov, snap) => (
                              <div
                                className={`chb-block ${bl.visible === false ? "is-hidden" : ""} ${snap.isDragging ? "is-dragging" : ""}`}
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                              >
                                <div className="chb-block__row">
                                  <span className="chb-handle" {...prov.dragHandleProps} title="Arrastra para reordenar">⠿</span>
                                  <span className="chb-block__icon">{def.icono}</span>
                                  <span className="chb-block__nombre">{def.nombre}</span>

                                  {def.variantes.length > 1 && (
                                    <select
                                      className="chb-variante"
                                      value={bl.variante || def.variantes[0][0]}
                                      disabled={disabled}
                                      onChange={(e) => setBloque(bl.id, { variante: e.target.value })}
                                      title="Disposición"
                                    >
                                      {def.variantes.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
                                    </select>
                                  )}

                                  <label className="chb-switch" title={bl.visible === false ? "Oculto" : "Visible"}>
                                    <input
                                      type="checkbox"
                                      checked={bl.visible !== false}
                                      disabled={disabled}
                                      onChange={(e) => setBloque(bl.id, { visible: e.target.checked })}
                                    />
                                    <span className="chb-switch__track"><span className="chb-switch__thumb" /></span>
                                  </label>

                                  <button type="button" className="chb-icon-btn"
                                    onClick={() => setAbierto(open ? null : bl.id)}
                                    title="Ajustes del bloque">{open ? "▲" : "▼"}</button>
                                  <button type="button" className="chb-icon-btn chb-icon-btn--danger" disabled={disabled}
                                    onClick={() => quitar(bl.id)} title="Quitar bloque">🗑</button>
                                </div>

                                {open && <div className="chb-block__body">{editorProps(bl)}</div>}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Añadir bloque */}
              <div className="chb-add">
                <button type="button" className="btn btn-secundario" disabled={disabled}
                  onClick={() => setAddOpen((v) => !v)}>+ Añadir bloque</button>
                {addOpen && (
                  <div className="chb-add-menu">
                    {TIPOS_ANADIBLES.map((t) => (
                      <button type="button" key={t} className="chb-add-menu__item" onClick={() => anadir(t)}>
                        <span>{BLOQUES[t].icono}</span> {BLOQUES[t].nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="button" className="chb-reset" disabled={disabled} onClick={restaurarClasica}>
                ↩ Volver a la home clásica
              </button>
            </div>

            {/* Vista previa esquemática */}
            <aside className="chb-preview" aria-label="Vista previa de la estructura">
              <div className="chb-phone">
                <div className="chb-phone__screen">
                  <div className="chb-strip chb-strip--fixed">Barra superior (logo)</div>
                  {bloques.filter((b) => b.visible !== false).map((b) => {
                    const def = BLOQUES[b.tipo] || { nombre: b.tipo, icono: "❓" };
                    return (
                      <div className={`chb-strip chb-strip--${b.tipo}`} key={b.id}>
                        <span>{def.icono}</span> {def.nombre}
                      </div>
                    );
                  })}
                  <div className="chb-strip chb-strip--fixed">Pie / contacto</div>
                </div>
              </div>
              <p className="chb-preview__hint">Vista esquemática · el diseño real usa tus colores y contenido.</p>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
