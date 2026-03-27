// src/Hooks/useCortesias.js
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import api from "../utils/api";

function getFirstPrice(precios) {
  if (Array.isArray(precios)) {
    const sorted = [...precios].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    return sorted[0]?.precio ?? 0;
  }
  return precios?.precioBase ?? 0;
}

export function useCortesias() {
  const [tab, setTab] = useState("invitaciones");

  // Data
  const [invitaciones, setInvitaciones] = useState([]);
  const [consumos, setConsumos] = useState([]);
  const [resumenInv, setResumenInv] = useState({ totalItems: 0, totalValor: 0 });
  const [resumenCp, setResumenCp] = useState({ totalRegistros: 0, totalValor: 0 });
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [prodPagination, setProdPagination] = useState({ page: 1, totalPages: 1, total: 0, hasPrev: false, hasNext: false });

  // Loading / error
  const [loading, setLoading] = useState(false);
  const [prodLoading, setProdLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prodError, setProdError] = useState(null);
  const [registroError, setRegistroError] = useState(null);

  // Filters
  const [desde, setDesde] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [hasta, setHasta] = useState(() => new Date().toISOString().slice(0, 10));
  const [busquedaProd, setBusquedaProd] = useState("");
  const [prodPage, setProdPage] = useState(1);

  // Registrar consumo
  const [empleadoId, setEmpleadoId] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [msgExito, setMsgExito] = useState("");
  const [toggling, setToggling] = useState(null);

  // AbortControllers
  const dataControllerRef = useRef(null);
  const prodControllerRef = useRef(null);
  const msgTimerRef = useRef(null);

  // Fix #5: cleanup msg timer
  useEffect(() => {
    return () => {
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
      dataControllerRef.current?.abort();
      prodControllerRef.current?.abort();
    };
  }, []);

  /* =====================================================
     Fetch invitaciones OR consumo personal (fix #4: solo el tab activo)
  ===================================================== */
  const fetchTabData = useCallback(async () => {
    if (tab !== "invitaciones" && tab !== "personal") return;

    dataControllerRef.current?.abort();
    const controller = new AbortController();
    dataControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = { desde, hasta };
      const endpoint = tab === "invitaciones"
        ? "/cortesias/invitaciones"
        : "/cortesias/consumo-personal";

      const res = await api.get(endpoint, { params, signal: controller.signal });
      if (controller.signal.aborted) return;

      if (tab === "invitaciones") {
        setInvitaciones(res.data?.items || []);
        setResumenInv(res.data?.resumen || { totalItems: 0, totalValor: 0 });
      } else {
        setConsumos(res.data?.items || []);
        setResumenCp(res.data?.resumen || { totalRegistros: 0, totalValor: 0 });
      }
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setError("No se pudieron cargar los datos.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [tab, desde, hasta]);

  useEffect(() => { fetchTabData(); }, [fetchTabData]);

  /* =====================================================
     Fetch productos elegibles
  ===================================================== */
  const fetchProductos = useCallback(async () => {
    if (tab !== "config" && tab !== "registrar") return;

    prodControllerRef.current?.abort();
    const controller = new AbortController();
    prodControllerRef.current = controller;

    setProdLoading(true);
    setProdError(null);

    try {
      const params = {
        page: tab === "config" ? prodPage : 1,
        limit: tab === "config" ? 30 : 200,
      };
      if (busquedaProd.trim()) params.q = busquedaProd.trim();

      const res = await api.get("/cortesias/productos-elegibles", { params, signal: controller.signal });
      if (controller.signal.aborted) return;

      setProductos(res.data?.items || []);
      if (res.data?.pagination) setProdPagination(res.data.pagination);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setProdError("No se pudieron cargar los productos.");
    } finally {
      if (!controller.signal.aborted) setProdLoading(false);
    }
  }, [tab, prodPage, busquedaProd]);

  useEffect(() => { fetchProductos(); }, [fetchProductos]);

  /* =====================================================
     Fetch usuarios (para registrar)
  ===================================================== */
  useEffect(() => {
    if (tab !== "registrar") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/auth/usuarios");
        if (cancelled) return;
        const users = res.data?.items || res.data?.usuarios || res.data || [];
        setUsuarios(Array.isArray(users) ? users : []);
      } catch {
        if (!cancelled) setUsuarios([]);
      }
    })();
    return () => { cancelled = true; };
  }, [tab]);

  /* =====================================================
     Toggle elegible
  ===================================================== */
  const handleToggleElegible = useCallback(async (productoId) => {
    setToggling(productoId);
    try {
      const res = await api.patch(`/cortesias/productos-elegibles/${productoId}`);
      setProductos((prev) =>
        prev.map((p) =>
          p._id === productoId ? { ...p, elegibleComidaPersonal: res.data?.elegible } : p
        )
      );
    } catch {
      // silencioso — el toggle visual no cambia
    } finally {
      setToggling(null);
    }
  }, []);

  /* =====================================================
     Carrito
  ===================================================== */
  const agregarAlCarrito = useCallback((producto) => {
    setCarrito((prev) => {
      const idx = prev.findIndex((i) => i.productoId === String(producto._id));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 };
        return next;
      }
      return [...prev, {
        productoId: String(producto._id),
        nombre: producto.nombre || "Producto",
        precio: Number(getFirstPrice(producto.precios)),
        cantidad: 1,
      }];
    });
  }, []);

  const quitarDelCarrito = useCallback((productoId) => {
    setCarrito((prev) => {
      const idx = prev.findIndex((i) => i.productoId === productoId);
      if (idx < 0) return prev;
      if (prev[idx].cantidad <= 1) return prev.filter((_, i) => i !== idx);
      const next = [...prev];
      next[idx] = { ...next[idx], cantidad: next[idx].cantidad - 1 };
      return next;
    });
  }, []);

  /* =====================================================
     Registrar consumo (fix #6: error visible + fix #7: recargar)
  ===================================================== */
  const handleRegistrar = useCallback(async () => {
    if (!empleadoId || carrito.length === 0) return;
    setEnviando(true);
    setRegistroError(null);

    try {
      await api.post("/cortesias/consumo-personal", {
        empleadoId,
        items: carrito.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
        notas,
      });
      setCarrito([]);
      setNotas("");
      setEmpleadoId("");
      setMsgExito("Consumo registrado correctamente");

      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
      msgTimerRef.current = setTimeout(() => setMsgExito(""), 3000);
    } catch (err) {
      setRegistroError(err?.response?.data?.message || "Error al registrar el consumo.");
    } finally {
      setEnviando(false);
    }
  }, [empleadoId, carrito, notas]);

  /* =====================================================
     Derived (fix #9: useMemo)
  ===================================================== */
  const productosElegibles = useMemo(
    () => productos.filter((p) => p.elegibleComidaPersonal),
    [productos]
  );

  const totalCarrito = useMemo(
    () => carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0),
    [carrito]
  );

  /* =====================================================
     Helpers
  ===================================================== */
  const fmtFecha = (d) => {
    if (!d) return "--";
    try {
      return new Date(d).toLocaleString("es-ES", {
        timeZone: "Europe/Madrid",
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
      });
    } catch { return "--"; }
  };

  return {
    // Tab
    tab, setTab,

    // Data
    invitaciones, consumos, resumenInv, resumenCp,
    productos, usuarios, prodPagination,
    productosElegibles, totalCarrito,

    // Loading / error
    loading, prodLoading, error, prodError, registroError,

    // Filters
    desde, setDesde, hasta, setHasta,
    busquedaProd, setBusquedaProd,
    prodPage, setProdPage,

    // Registrar
    empleadoId, setEmpleadoId,
    carrito, notas, setNotas,
    enviando, msgExito, toggling,

    // Actions
    handleToggleElegible,
    agregarAlCarrito, quitarDelCarrito,
    handleRegistrar,
    fetchTabData, fetchProductos,

    // Helpers
    fmtFecha,
  };
}
