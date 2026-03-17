import { useEffect, useState } from "react";
import api from "../utils/api";

/**
 * useRoles — carga los roles del tenant desde GET /admin/permisos/roles
 * @param {string} [scope] — "tpv" | "shop" — filtra por scope si se pasa
 * @returns {{ roles: Array<{value,label,scope,isProtected}>, loading: boolean }}
 */
export function useRoles(scope) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/admin/permisos/roles");
        if (!alive) return;

        // sendOk envuelve en { ok, data: { roles } }
        const raw = data?.data?.roles ?? data?.roles ?? [];
        let list = Array.isArray(raw) ? raw : [];
        if (scope) {
          list = list.filter((r) => r.scope === scope);
        }
        setRoles(list);
      } catch (err) {
        console.error("[useRoles] Error cargando roles:", err?.response?.status, err?.message);
        if (!alive) return;
        setRoles([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [scope]);

  return { roles, loading };
}
