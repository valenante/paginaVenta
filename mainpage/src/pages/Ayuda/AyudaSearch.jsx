import { useState } from "react";

export default function AyudaSearch({ setArticulo, data }) {
  const [query, setQuery] = useState("");

  const resultados = data?.articulos.filter((a) =>
    a.titulo.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="ayuda-search">
      <input
        placeholder="🔍 Buscar en la ayuda..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {query && resultados?.length === 0 && (
        <p className="ayuda-noresult">No se encontraron resultados.</p>
      )}
    </div>
  );
}
