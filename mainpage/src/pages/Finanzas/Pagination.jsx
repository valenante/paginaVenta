import React from "react";

// Genera los números visibles con elipsis estilo: 1 … 4 5 [6] 7 8 … 20
function pageRange(current, total) {
  const delta = 1; // vecinos a cada lado
  const range = [];
  const rangeWithDots = [];
  let l;

  range.push(1);
  for (let i = current - delta; i <= current + delta; i++) {
    if (i > 1 && i < total) range.push(i);
  }
  if (total > 1) range.push(total);

  for (const i of range) {
    if (l) {
      if (i - l === 2) rangeWithDots.push(l + 1);
      else if (i - l > 2) rangeWithDots.push("…");
    }
    rangeWithDots.push(i);
    l = i;
  }
  return rangeWithDots;
}

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizes = [10, 20, 50, 100],
}) {
  const pages = pageRange(page, totalPages);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="fin-pagination">
      <div className="fin-pagination-info">
        Mostrando <strong>{from}–{to}</strong> de <strong>{total}</strong>
      </div>

      <div className="fin-pagination-controls">
        <button
          className="fin-pag-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          title="Primera"
        >
          «
        </button>
        <button
          className="fin-pag-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          title="Anterior"
        >
          ‹
        </button>

        {pages.map((p, idx) =>
          p === "…" ? (
            <span key={`e${idx}`} className="fin-pag-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`fin-pag-btn ${p === page ? "active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="fin-pag-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          title="Siguiente"
        >
          ›
        </button>
        <button
          className="fin-pag-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Última"
        >
          »
        </button>
      </div>

      {onPageSizeChange && (
        <label className="fin-pag-size">
          Por página
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
