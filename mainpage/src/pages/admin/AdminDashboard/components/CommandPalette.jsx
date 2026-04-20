// src/pages/admin/AdminDashboard/components/CommandPalette.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiHome, FiActivity, FiFileText, FiSettings, FiUsers, FiRefreshCcw, FiDatabase, FiDownload, FiList } from "react-icons/fi";
import api from "../../../../utils/api";

const SECTIONS = [
  { name: "Dashboard", path: "/superadmin", icon: FiHome, keywords: "inicio home" },
  { name: "Estado del sistema", path: "/superadmin/monitor", icon: FiActivity, keywords: "monitor health salud" },
  { name: "Facturación", path: "/superadmin/billing", icon: FiFileText, keywords: "billing stripe pagos mrr" },
  { name: "Planes", path: "/superadmin/planes", icon: FiUsers, keywords: "pricing features" },
  { name: "Rollback API", path: "/superadmin/rollback", icon: FiRefreshCcw, keywords: "deploy blue green" },
  { name: "Restore & DR", path: "/superadmin/restore", icon: FiDatabase, keywords: "backup disaster recovery" },
  { name: "RGPD & Datos", path: "/superadmin/rgpd", icon: FiFileText, keywords: "privacidad gdpr delete export" },
  { name: "Exports", path: "/superadmin/exports", icon: FiDownload, keywords: "csv descargar reportes" },
  { name: "Migraciones", path: "/superadmin/migrations", icon: FiDatabase, keywords: "db schema" },
  { name: "Logs", path: "/superadmin/logs", icon: FiList, keywords: "audit errores" },
  { name: "Tickets", path: "/superadmin/tickets", icon: FiFileText, keywords: "soporte support" },
  { name: "Ajustes", path: "/superadmin/settings", icon: FiSettings, keywords: "config smtp stripe" },
  { name: "Changelog", path: "/superadmin/changelog", icon: FiFileText, keywords: "versiones updates" },
  { name: "Nuevo tenant", path: "/superadmin/tenants/nuevo", icon: FiUsers, keywords: "crear onboarding alta" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tenants, setTenants] = useState([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // CMD+K / Ctrl+K toggle
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Fetch tenants for search
  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/admin/superadmin/tenants?limit=50");
        const items = data?.data?.items || data?.items || data?.data || [];
        if (mounted) setTenants(Array.isArray(items) ? items : []);
      } catch { /* silent */ }
    })();
    return () => { mounted = false; };
  }, [open]);

  const q = query.toLowerCase().trim();

  const filteredSections = q
    ? SECTIONS.filter(s => s.name.toLowerCase().includes(q) || s.keywords.includes(q))
    : SECTIONS;

  const filteredTenants = q
    ? tenants.filter(t =>
        (t.slug || "").toLowerCase().includes(q) ||
        (t.nombre || "").toLowerCase().includes(q) ||
        (t.email || "").toLowerCase().includes(q)
      ).slice(0, 5)
    : [];

  const allResults = [
    ...filteredSections.map(s => ({ type: "section", ...s })),
    ...filteredTenants.map(t => ({ type: "tenant", name: t.nombre || t.slug, path: `/superadmin/tenants/${t.slug}`, slug: t.slug, plan: t.plan })),
  ];

  const go = useCallback((item) => {
    navigate(item.path);
    setOpen(false);
  }, [navigate]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, allResults.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && allResults[selected]) { go(allResults[selected]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, selected, allResults, go]);

  useEffect(() => { setSelected(0); }, [query]);

  if (!open) return null;

  return (
    <div className="cmd-overlay" onClick={() => setOpen(false)}>
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-wrap">
          <FiSearch className="cmd-input-icon" />
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Buscar secciones, tenants..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <kbd className="cmd-kbd">ESC</kbd>
        </div>
        <div className="cmd-results">
          {allResults.length === 0 && <div className="cmd-empty">Sin resultados</div>}
          {filteredSections.length > 0 && q && <div className="cmd-group-label">Secciones</div>}
          {allResults.map((item, i) => {
            if (item.type === "tenant" && i === filteredSections.length && filteredTenants.length > 0) {
              return (
                <div key="tenant-label">
                  <div className="cmd-group-label">Tenants</div>
                  <div
                    className={`cmd-item ${i === selected ? "cmd-item--active" : ""}`}
                    onClick={() => go(item)}
                    onMouseEnter={() => setSelected(i)}
                  >
                    <FiUsers className="cmd-item-icon" />
                    <span>{item.name}</span>
                    {item.plan && <span className="cmd-item-hint">{item.plan}</span>}
                  </div>
                </div>
              );
            }
            const Icon = item.icon || FiUsers;
            return (
              <div
                key={item.path + i}
                className={`cmd-item ${i === selected ? "cmd-item--active" : ""}`}
                onClick={() => go(item)}
                onMouseEnter={() => setSelected(i)}
              >
                <Icon className="cmd-item-icon" />
                <span>{item.name}</span>
                {item.slug && <span className="cmd-item-hint">{item.slug}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
