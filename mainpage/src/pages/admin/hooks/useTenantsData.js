// src/pages/admin/hooks/useTenantsData.js
import { useEffect, useState } from "react";
import api from "../../../utils/api";

export default function useTenantsData() {
  const [tenants, setTenants] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("todos");

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const { data } = await api.get("/superadmin/tenants");
      setTenants(data);
      setFiltered(data);
    } catch (err) {
      console.error("Error al obtener tenants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filteredList = tenants.filter(t =>
      t.nombre.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
    );
    if (planFilter !== "todos") {
      filteredList = filteredList.filter(t => t.plan === planFilter);
    }
    setFiltered(filteredList);
  }, [search, planFilter, tenants]);

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
