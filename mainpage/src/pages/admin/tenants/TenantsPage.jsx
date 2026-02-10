import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";

import TenantTable from "../AdminDashboard/components/TenantTable.jsx";

import "./TenantsPage.css";

export default function TenantsPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTenants = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      // ✅ ajusta endpoint si el tuyo es distinto
      const { data } = await api.get("/admin/superadmin/tenants");
      setTenants(data || []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Error cargando tenants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  return (
    <section className="tenants-page">
      <div className="tenants-page-header">
        <div>
          <h2>Tenants</h2>
          <p className="tenants-page-sub">
            Restaurantes y tiendas registradas en Alef.
          </p>
        </div>

        <div className="tenants-page-actions">
          <button
            className="btn btn-secundario"
            onClick={fetchTenants}
            disabled={loading}
          >
            {loading ? "Cargando..." : "Refrescar"}
          </button>

          <button
            className="btn btn-primario"
            onClick={() => navigate("/superadmin/tenants/nuevo")}
          >
            + Nuevo tenant
          </button>
        </div>
      </div>

      {error && <p className="registro-error">{error}</p>}

      {!loading && (
        <TenantTable tenants={tenants} onRefresh={fetchTenants} />
      )}
    </section>
  );
}
