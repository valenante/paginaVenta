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
 *  - search / setSearch: texto de búsqueda
 *  - planFilter / setPlanFilter: filtro por plan ("all" | slug)
 *  - fetchTenants: función para recargar desde el backend
 */
export default function useTenantsData() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  const fetchTenants = async () => {
    setLoading(true);
    try {
      // Ajusta la ruta si tu API usa otra (p.ej. "/admin/tenants")
      const { data } = await api.get("/admin/superadmin/tenants");

      // Soportar tanto { tenants: [...] } como [ ... ]
      const list = Array.isArray(data) ? data : data.tenants || [];
      setTenants(list);
    } catch (error) {
      logger.error("[useTenantsData] Error al cargar tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar al montar
  useEffect(() => {
    fetchTenants();
  }, []);

  // Filtro por plan + búsqueda
  const filtered = useMemo(() => {
    let result = [...tenants];

    // 1) filtro por plan
    if (planFilter && planFilter !== "all") {
      result = result.filter((t) => {
        // soporta tenant.plan como string o como objeto poblado
        const slug = typeof t.plan === "string" ? t.plan : t.plan?.slug;
        return slug === planFilter;
      });
    }

    // 2) filtro por búsqueda
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => {
        return (
          t.nombre?.toLowerCase().includes(q) ||
          t.slug?.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [tenants, search, planFilter]);

  return {
    tenants,
    filtered,
    loading,
    search,
    setSearch,
    planFilter,
    setPlanFilter,
    fetchTenants,
  };
}
