// src/context/VentasContext.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import api from "../utils/api";
import { useTenant } from "./TenantContext";
/* ================================
  Helpers
================================ */
const safeLower = (v) => String(v ?? "").toLowerCase();

const includesQ = (value, q) =>
  String(value ?? "").toLowerCase().includes(String(q ?? "").toLowerCase());

const fmtISODate = (d) => {
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return "";
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const dd = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const buildCsv = (rows) => {
  const escape = (v) => {
    const s = String(v ?? "");
    if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return rows.map((r) => r.map(escape).join(",")).join("\n");
};

const downloadTextFile = (filename, content, mime = "text/csv;charset=utf-8") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/* ================================
  Normalizador (soporta "ventas shops" y "ventas tpv viejas")
================================ */
const normalizeVenta = (v) => {
  const fecha = v?.fecha || v?.fechaOperativa || v?.createdAt;
  const metodoPago = v?.metodoPago || v?.pago?.metodo || v?.metodo || "—";
  const canal = v?.canal || v?.origen || "—";
  const estado = v?.estado === "anulada" || v?.anulada ? "anulada" : "emitida";

  // shops: lineas[]
  const lineas = Array.isArray(v?.lineas) ? v.lineas : null;
  if (lineas?.length) {
    const total =
      Number(v?.total) ||
      lineas.reduce((acc, l) => {
        const qty = Number(l?.cantidad ?? l?.qty ?? 0);
        const unit = Number(l?.precioUnitario ?? l?.precio ?? 0);
        const lineaTotal = Number(l?.total ?? unit * qty);
        return acc + (Number.isFinite(lineaTotal) ? lineaTotal : 0);
      }, 0);

    const resumen = lineas
      .slice(0, 3)
      .map((l) => l?.nombre || l?.productoNombre || l?.sku || l?.productoId || "Item")
      .join(" · ");

    const itemsCount = lineas.reduce((acc, l) => acc + Number(l?.cantidad ?? l?.qty ?? 0), 0);

    return {
      id: v?._id,
      fecha,
      metodoPago,
      canal,
      estado,
      lineasCount: lineas.length,
      itemsCount,
      total,
      resumen,
      raw: v,
    };
  }

  // tpv viejo: producto + cantidad
  const total = Number(v?.total) || 0;
  const cantidad = Number(v?.cantidad) || 0;

  const nombreProducto =
    v?.nombre || v?.productoNombre || v?.producto?.nombre || v?.productoId || v?.producto || "Producto";

  return {
    id: v?._id,
    fecha,
    metodoPago,
    canal,
    estado,
    lineasCount: cantidad ? 1 : 0,
    itemsCount: cantidad,
    total,
    resumen: nombreProducto,
    raw: v,
  };
};

/* ================================
  Context
================================ */
const VentasContext = createContext(null);

const DEFAULT_META = {
  totalItems: 0,
  totalPages: 1,
  resumen: { totalVentas: 0, totalImporte: 0, porMetodoPago: {} },
};

export function VentasProvider({
  tenantId,
  children,
  defaultPageSize = 25,
  defaultFilters = {},
}) {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  // ✅ meta server (paginación real)
  const [serverMeta, setServerMeta] = useState(DEFAULT_META);

  // filtros
  const [q, setQ] = useState(defaultFilters.q || "");
  const [desde, setDesde] = useState(defaultFilters.desde || "");
  const [hasta, setHasta] = useState(defaultFilters.hasta || "");
  const [metodoPago, setMetodoPago] = useState(defaultFilters.metodoPago || "todos");
  const [canal, setCanal] = useState(defaultFilters.canal || "todos");
  const [estado, setEstado] = useState(defaultFilters.estado || "todos");

  // paginación server-side
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const { tenant } = useTenant();
  const tipoNegocio = tenant?.tipoNegocio || "restaurante";

  const headersTenant = useMemo(() => {
    return tenantId ? { headers: { "x-tenant-id": tenantId } } : {};
  }, [tenantId]);

  // refs para detectar cambios y evitar fetch con "page vieja"
  const prevTenantRef = useRef(null);
  const prevKeyRef = useRef("");

  const pageCount = useMemo(() => Math.max(1, Number(serverMeta?.totalPages || 1)), [serverMeta]);
  const pageSafe = useMemo(() => {
    const p = Number(page || 1);
    return Math.min(Math.max(p, 1), pageCount);
  }, [page, pageCount]);

  const ventasEndpoint = useMemo(() => {
    return tipoNegocio === "shop" ? "/shop/ventas" : "/ventas";
  }, [tipoNegocio]);

  // ✅ Fetch server-side (sin slice() en frontend)
  const refresh = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError("");

      const params = {
        from: desde || undefined,
        to: hasta || undefined,
        metodoPago: metodoPago !== "todos" ? metodoPago : undefined,
        // canal: canal !== "todos" ? canal : undefined, // (solo si backend lo soporta)
        estado: estado !== "todos" ? estado : undefined,
        q: q || undefined,
        modoFecha: "real",
        page: pageSafe,
        limit: pageSize,
      };

      const { data } = await api.get(ventasEndpoint, {
        ...headersTenant,
        params,
      });

      setVentas(Array.isArray(data?.items) ? data.items : []);
      setServerMeta({
        totalItems: Number(data?.totalItems || 0),
        totalPages: Number(data?.totalPages || 1),
        resumen: data?.resumen || DEFAULT_META.resumen,
      });

      setLastUpdatedAt(new Date());
    } catch (e) {
      setVentas([]);
      setServerMeta(DEFAULT_META);
      setError("No se pudieron cargar las ventas");
    } finally {
      setLoading(false);
    }
  }, [
    tenantId,
    headersTenant,
    desde,
    hasta,
    metodoPago,
    canal,
    estado,
    q,
    pageSafe,
    pageSize,
  ]);

  // ✅ Motor único:
  // - si cambia tenant o filtros y NO estás en página 1, primero te resetea page->1 y espera al siguiente render
  // - si ya estás en page 1, hace fetch directo
  useEffect(() => {
    if (!tenantId) {
      setVentas([]);
      setError("");
      setInfo("");
      setLastUpdatedAt(null);
      setServerMeta(DEFAULT_META);
      prevTenantRef.current = null;
      prevKeyRef.current = "";
      return;
    }

    const tenantChanged = prevTenantRef.current !== tenantId;

    const key = JSON.stringify({
      q,
      desde,
      hasta,
      metodoPago,
      canal,
      estado,
      pageSize, // si cambia "por página", también reseteamos a page 1
    });

    const keyChanged = prevKeyRef.current !== key;

    if (tenantChanged) {
      setVentas([]);
      setError("");
      setInfo("");
      setLastUpdatedAt(null);
      setServerMeta(DEFAULT_META);

      prevTenantRef.current = tenantId;
      prevKeyRef.current = key;

      if (page !== 1) {
        setPage(1);
        return;
      }
    } else if (keyChanged) {
      prevKeyRef.current = key;

      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    refresh();
  }, [
    tenantId,
    q,
    desde,
    hasta,
    metodoPago,
    canal,
    estado,
    page,
    pageSize,
    refresh,
  ]);

  // normalizadas (la página actual ya viene del server)
  const ventasNorm = useMemo(() => ventas.map(normalizeVenta), [ventas]);



  // metodos/canales disponibles (de la página actual)
  const metodosDisponibles = useMemo(() => {
    const set = new Set();
    for (const v of ventasNorm) {
      const m = safeLower(v?.metodoPago);
      if (m && m !== "—") set.add(m);
    }
    return Array.from(set).sort();
  }, [ventasNorm]);

  const canalesDisponibles = useMemo(() => {
    const set = new Set();
    for (const v of ventasNorm) {
      const c = safeLower(v?.canal);
      if (c && c !== "—") set.add(c);
    }
    return Array.from(set).sort();
  }, [ventasNorm]);

  // ✅ en server-side, "filtradas" == "lo que devuelve el server"
  const ventasFiltradas = ventasNorm;
  const ventasPage = ventasNorm;

  // ✅ Totales: usa resumen del backend (global del rango/filtros)
  // itemsCount global no lo devuelve el backend, aquí mostramos ítems de la página cargada
  const totals = useMemo(() => {
    const count = Number(serverMeta?.totalItems || 0);
    const total = Number(serverMeta?.resumen?.totalImporte || 0);
    const items = ventasNorm.reduce((acc, v) => acc + Number(v?.itemsCount || 0), 0);
    return { count, total, items };
  }, [serverMeta, ventasNorm]);

  const clearFilters = () => {
    setQ("");
    setDesde("");
    setHasta("");
    setMetodoPago("todos");
    setCanal("todos");
    setEstado("todos");
  };

  // ⚠️ Exporta lo que tienes cargado (página actual). Si quieres export "todo el rango",
  // hay que hacer endpoint dedicado o paginar desde aquí.
  const exportCsv = () => {
    const header = [
      "id",
      "fecha",
      "metodoPago",
      "canal",
      "estado",
      "lineasCount",
      "itemsCount",
      "total",
      "resumen",
    ];

    const rows = ventasFiltradas.map((v) => [
      v.id,
      v.fecha ? new Date(v.fecha).toISOString() : "",
      v.metodoPago,
      v.canal,
      v.estado,
      v.lineasCount,
      v.itemsCount,
      Number(v.total || 0),
      v.resumen,
    ]);

    const csv = buildCsv([header, ...rows]);
    const filename = `ventas_${tenantId || "tenant"}_${fmtISODate(new Date())}.csv`;
    downloadTextFile(filename, csv);
  };

  const value = {
    tenantId,

    // data
    ventas: ventasNorm,
    ventasFiltradas,
    ventasPage,

    // estado
    loading,
    error,
    info,
    lastUpdatedAt,

    // filtros
    filters: { q, desde, hasta, metodoPago, canal, estado },
    setQ,
    setDesde,
    setHasta,
    setMetodoPago,
    setCanal,
    setEstado,
    clearFilters,

    // options
    metodosDisponibles,
    canalesDisponibles,

    // totals + pagination
    totals,
    page: pageSafe, // lo que muestras en UI
    setPage,        // el usuario pide página -> el efecto refresca
    pageSize,
    setPageSize,    // si cambia pageSize -> resetea page 1 y refresca
    pageCount,

    // actions
    refresh,
    exportCsv,
  };

  return <VentasContext.Provider value={value}>{children}</VentasContext.Provider>;
}

export function useVentas() {
  const ctx = useContext(VentasContext);
  if (!ctx) throw new Error("useVentas debe usarse dentro de VentasProvider");
  return ctx;
}
