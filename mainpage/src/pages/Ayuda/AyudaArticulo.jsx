// src/pages/Ayuda/AyudaArticulo.jsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AyudaArticulo({ articulo }) {
  return (
    <article className="ayuda-articulo">
      <h2>{articulo.titulo}</h2>

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ node, ...props }) => <h2 {...props} />,
          h3: ({ node, ...props }) => <h3 {...props} />,
          p: ({ node, ...props }) => <p {...props} />,
          ul: ({ node, ...props }) => <ul {...props} />,
          li: ({ node, ...props }) => <li {...props} />,
          strong: ({ node, ...props }) => <strong {...props} />,
        }}
      >
        {articulo.contenido.join("\n\n")}
      </ReactMarkdown>

      {articulo.imagen && (
        <img src={articulo.imagen} alt={articulo.titulo} />
      )}
    </article>
  );
}
