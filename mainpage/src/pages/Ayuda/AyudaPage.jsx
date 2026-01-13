import { useEffect, useMemo, useState } from "react";
import AyudaSidebar from "./AyudaSidebar";
import AyudaSearch from "./AyudaSearch";
import AyudaLista from "./AyudaLista";
import AyudaArticulo from "./AyudaArticulo";
import { buildAyudaSections, getAyudaData, getDefaultAyudaSection } from "./ayudaData";
import "./Ayuda.css";

// AJUSTA ESTO a tu contexto real:
import { useTenant } from "../../context/TenantContext.jsx";

export default function AyudaPage() {
  const { tenant } = useTenant() || {};
  const tipoNegocio = (tenant?.tipoNegocio || tenant?.suscripcion?.tipoNegocio || "restaurante").toLowerCase();

  const ayuda = useMemo(() => getAyudaData(tipoNegocio), [tipoNegocio]);
  const sections = useMemo(() => buildAyudaSections(ayuda), [ayuda]);

  useEffect(() => {
    const defaultSection = getDefaultAyudaSection(ayuda);
    setSection(defaultSection);
    setArticulo(null);
  }, [tipoNegocio]); // 👈 CLAVE

  const [section, setSection] = useState(getDefaultAyudaSection(ayuda));
  const [articulo, setArticulo] = useState(null);

  // Si cambia el tipoNegocio/dataset, asegúrate de que la sección exista
  useEffect(() => {
    if (!ayuda[section]) {
      setSection(getDefaultAyudaSection(ayuda));
      setArticulo(null);
    }
  }, [ayuda, section]);

  const data = ayuda[section];

  return (
    <div className="ayuda-layout">
      <AyudaSidebar
        section={section}
        sections={sections}
        setSection={(sec) => {
          setSection(sec);
          setArticulo(null);
        }}
      />

      <main className="ayuda-content">
        {/* Opcional: pasar `ayuda` completo para buscar en TODO, no solo en la sección */}
        <AyudaSearch setArticulo={setArticulo} data={data} allData={ayuda} />

        {!articulo ? (
          <AyudaLista data={data} setArticulo={setArticulo} />
        ) : (
          <AyudaArticulo articulo={articulo} />
        )}
      </main>
    </div>
  );
}
