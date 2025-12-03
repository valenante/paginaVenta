import { useState } from "react";
import AyudaSidebar from "./AyudaSidebar";
import AyudaSearch from "./AyudaSearch";
import AyudaLista from "./AyudaLista";
import AyudaArticulo from "./AyudaArticulo";
import { ayudaData } from "./ayudaData";
import "./Ayuda.css";

export default function AyudaPage() {
  const [section, setSection] = useState("empezar");
  const [articulo, setArticulo] = useState(null);

  const data = ayudaData[section];

  return (
    <div className="ayuda-layout">

      <AyudaSidebar
        section={section}
        setSection={(sec) => {
          setSection(sec);
          setArticulo(null);
        }}
      />

      <main className="ayuda-content">
        <AyudaSearch setArticulo={setArticulo} data={data} />

        {!articulo ? (
          <AyudaLista data={data} setArticulo={setArticulo} />
        ) : (
          <AyudaArticulo articulo={articulo} />
        )}
      </main>
    </div>
  );
}
