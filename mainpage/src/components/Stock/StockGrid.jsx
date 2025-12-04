import React from "react";

export default function StockGrid({ ingredientes, setModal }) {
    const getEstado = (it) => {
        if (it.stockActual <= it.stockCritico) return "critico";
        if (it.stockActual <= it.stockMinimo) return "bajo";
        return "ok";
    };

    return (
        <div className="stock-grid">
            {ingredientes.map((ing) => {
                const estado = getEstado(ing);
                const porcentaje = Math.min(
                    100,
                    Math.max(0, (ing.stockActual / ing.stockMax) * 100)
                );

                return (
                    <div key={ing._id} className={`stock-card estado-${estado}`}>
                        <button
                            className="btn-eliminar-ingrediente"
                            onClick={() => setModal({ type: "eliminar", ingrediente: ing })}
                        >
                            ✖
                        </button>

                        <div className="stock-card-header">
                            <span className="stock-name">{ing.nombre}</span>
                            <span className={`estado-badge ${estado}`}>
                                {estado === "ok" && "🟢 Óptimo"}
                                {estado === "bajo" && "🟠 Bajo"}
                                {estado === "critico" && "🔴 Crítico"}
                            </span>
                        </div>

                        <div className="stock-bar">
                            <div className="stock-bar-fill" style={{ width: `${porcentaje}%` }} />
                        </div>

                        <div className="stock-details">
                            <strong>{ing.stockActual}{ing.unidad}</strong>
                            <span className="max">máx: {ing.stockMax}{ing.unidad}</span>
                        </div>

                        <button
                            className="btn-ajustar"
                            onClick={() => setModal({ type: "ajustar", ingrediente: ing })}
                        >
                            Ajustar stock
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
