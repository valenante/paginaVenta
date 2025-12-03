export default function AyudaLista({ data, setArticulo }) {
  return (
    <div className="ayuda-lista">
      <h2>{data.titulo}</h2>

      {data.articulos.map((a) => (
        <div
          key={a.id}
          className="ayuda-card"
          onClick={() => setArticulo(a)}
        >
          <h3>{a.titulo}</h3>
          <p>{a.descripcion}</p>
        </div>
      ))}
    </div>
  );
}
