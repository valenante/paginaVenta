// src/pages/admin/Hooks/useTenantsData.js
import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";
import * as logger from "../utils/logger";

/**
 * Hook para cargar y filtrar tenants en el panel de superadmin.
 *
 * Devuelve:
 *  - tenants: lista completa
 *  - filtered: lista filtrada por búsqueda y plan
 *  - loading: estado de carga
 *  - search / setSearch: texto del input (inmediato, para binding del input)
 *  - planFilter / setPlanFilter: filtro por plan ("all" | slug)
 *  - fetchTenants: función para recargar desde el backend
 *
 * La búsqueda usa debounce interno (250ms) para no filtrar en cada keystroke.
 * Con 500+ tenants cargados en cliente el filtrado en cada tecla era perceptible.
 */
export default function useTenantsData() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  // inputSearch: valor inmediato que se muestra en el input
  // debouncedSearch: valor retrasado 250ms que dispara el filtro
  const [inputSearch, setInputSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  // Debounce: solo actualiza debouncedSearch 250ms después de que el usuario
  // deje de escribir. Evita filtrar en cada pulsación de tecla.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(inputSearch), 250);
    return () => clearTimeout(timer);
  }, [inputSearch]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/superadmin/tenants");
      const list = Array.isArray(data) ? data : data.tenants || [];
      setTenants(list);
    } catch (error) {
      logger.error("[useTenantsData] Error al cargar tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const filtered = useMemo(() => {
    let result = [...tenants];

    if (planFilter && planFilter !== "all") {
      result = result.filter((t) => {
        const slug = typeof t.plan === "string" ? t.plan : t.plan?.slug;
        return slug === planFilter;
      });
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.nombre?.toLowerCase().includes(q) ||
          t.slug?.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [tenants, debouncedSearch, planFilter]);

  return {
    tenants,
    filtered,
    loading,
    // Mantener 'search' y 'setSearch' como nombres externos para no romper
    // los componentes que ya consumen este hook
    search: inputSearch,
    setSearch: setInputSearch,
    planFilter,
    setPlanFilter,
    fetchTenants,
  };
}
