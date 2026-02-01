// src/components/AlefSelect/AlefSelect.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import "./AlefSelect.css";

export default function AlefSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Seleccionar...",
  portal = true,
  maxHeight = 240,
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // ---------------------------
  // Normalizar opciones
  // ---------------------------
  const normalizedOptions = useMemo(() => {
    const normalize = (opt) => {
      if (!opt) return null;

      if (typeof opt === "string") {
        return { label: opt, value: opt };
      }

      if (typeof opt === "object" && ("value" in opt)) {
        return {
          label: opt.label ?? String(opt.value),
          value: opt.value,
        };
      }

      return null;
    };

    return options.map(normalize).filter(Boolean);
  }, [options]);

  const selected = useMemo(() => {
    return normalizedOptions.find((o) => o.value === value) || null;
  }, [normalizedOptions, value]);

  // ---------------------------
  // Posicionar menú (fixed)
  // ---------------------------
  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    updatePosition();

    // IMPORTANTÍSIMO: capture=true para pillar scroll dentro de modales/containers
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePosition]);

  // ---------------------------
  // Cerrar clic fuera (soporta portal)
  // ---------------------------
  useEffect(() => {
    if (!open) return;

    const onDown = (e) => {
      const w = wrapperRef.current;
      const m = menuRef.current;

      const clickInsideWrapper = w && w.contains(e.target);
      const clickInsideMenu = m && m.contains(e.target);

      if (!clickInsideWrapper && !clickInsideMenu) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, [open]);

  // Escape para cerrar
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // ---------------------------
  // Render menu
  // ---------------------------
  const menu = open ? (
    <div
      ref={menuRef}
      className="alef-select-menu"
      style={
        portal
          ? {
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight,
              zIndex: 2147483647, // máximo práctico
            }
          : { maxHeight }
      }
    >
      {normalizedOptions.length === 0 ? (
        <div className="alef-select-option disabled">Sin opciones</div>
      ) : (
        normalizedOptions.map((opt, index) => (
          <div
            key={`${String(opt.value)}-${index}`}
            className={`alef-select-option ${value === opt.value ? "selected" : ""}`}
            onMouseDown={(e) => {
              // mouseDown > click: evita que se “pierda” el click por blur/capas
              e.preventDefault();
              onChange?.(opt.value);
              setOpen(false);
            }}
          >
            {opt.label}
          </div>
        ))
      )}
    </div>
  ) : null;

  return (
    <div className="alef-select-wrapper" ref={wrapperRef}>
      {label && <label className="alef-select-label">{label}</label>}

      <div
        ref={triggerRef}
        className="alef-select-trigger"
        onClick={() => setOpen((p) => !p)}
      >
        <span>{selected?.label || placeholder}</span>
        <div className="alef-select-arrow">▾</div>
      </div>

      {/* Si NO usas portal, el menú vive aquí */}
      {!portal && menu}

      {/* Si usas portal, el menú va a document.body */}
      {portal && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
