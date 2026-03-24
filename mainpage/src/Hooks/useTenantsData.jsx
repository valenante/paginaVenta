// src/Hooks/useTenantsData.jsx
// Hook para cargar tenants con paginación y búsqueda server-side.
import { useCallback, useEffect, useRef, useState } from "react";
import api from "../utils/api";
import * as logger from "../utils/logger";

const LIMIT = 20;

export default function useTenantsData() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  const abortRef = useRef(null);

  // Debounce search 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, planFilter]);

  const fetchTenants = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(LIMIT));
      if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());

      const { data } = await api.get(`/admin/superadmin/tenants?${params}`, {
        signal: controller.signal,
      });

      // Backend returns { items, total, page, limit, totalPages }
      const list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      setItems(list);
      setTotal(data?.total ?? list.length);
      setTotalPages(data?.totalPages ?? 1);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      logger.error("[useTenantsData] Error al cargar tenants:", err);
      setError(err?.response?.data?.message || err?.message || "Error cargando tenants");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Client-side plan filter (plan is not paginated server-side to keep it simple)
  const filtered = planFilter && planFilter !== "all"
    ? items.filter((t) => (typeof t.plan === "string" ? t.plan : t.plan?.slug) === planFilter)
    : items;

  return {
    tenants: items,
    filtered,
    loading,
    error,
    search,
    setSearch,
    planFilter,
    setPlanFilter,
    fetchTenants,
    page,
    setPage,
    totalPages,
    total,
  };
}
