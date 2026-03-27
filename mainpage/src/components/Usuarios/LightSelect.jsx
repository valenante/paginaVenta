// src/components/Usuarios/LightSelect.jsx
// Select ligero tema claro — misma API que AlefSelect
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import "./LightSelect.css";

export default function LightSelect({
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

  const normalizedOptions = useMemo(() => {
    return options
      .map((opt) => {
        if (!opt) return null;
        if (typeof opt === "string") return { label: opt, value: opt };
        if (typeof opt === "object" && "value" in opt) {
          return { label: opt.label ?? String(opt.value), value: opt.value };
        }
        return null;
      })
      .filter(Boolean);
  }, [options]);

  const selected = useMemo(() => {
    return normalizedOptions.find((o) => o.value === value) || null;
  }, [normalizedOptions, value]);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      const w = wrapperRef.current;
      const m = menuRef.current;
      if (!(w && w.contains(e.target)) && !(m && m.contains(e.target))) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown, true);
    return () => document.removeEventListener("mousedown", onDown, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const menu = open ? (
    <div
      ref={menuRef}
      className="light-select-menu"
      style={
        portal
          ? {
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight,
              zIndex: 2147483647,
            }
          : { maxHeight }
      }
    >
      {normalizedOptions.length === 0 ? (
        <div className="light-select-option disabled">Sin opciones</div>
      ) : (
        normalizedOptions.map((opt, index) => (
          <div
            key={`${String(opt.value)}-${index}`}
            className={`light-select-option ${value === opt.value ? "selected" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              onChange?.(opt.value);
              setOpen(false);
            }}
          >
            {opt.label}
            {value === opt.value && <span className="light-select-check">✓</span>}
          </div>
        ))
      )}
    </div>
  ) : null;

  return (
    <div className="light-select-wrapper" ref={wrapperRef}>
      {label && <label className="light-select-label">{label}</label>}

      <div
        ref={triggerRef}
        className={`light-select-trigger ${open ? "open" : ""} ${selected ? "" : "placeholder"}`}
        onClick={() => setOpen((p) => !p)}
      >
        <span>{selected?.label || placeholder}</span>
        <svg className="light-select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {!portal && menu}
      {portal && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
