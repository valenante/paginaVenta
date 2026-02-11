import { useRef, useState } from "react";
import "./IdentidadNegocioPanel.css";

export default function IdentidadNegocioPanel({
    form,
    setForm,
    onUploadLogo,
    esTienda
}) {
    const logoInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    return (
        <section className="config-card card">
            <header className="config-card-header">
                <h2>🏪 Datos del {esTienda ? "negocio" : "restaurante"}</h2>
                <p className="config-card-subtitle">
                    Información visible en el TPV y el dashboard.
                </p>
            </header>

            <div className="identidad-panel">
                <div className="identidad-layout">
                    {/* Columna izquierda: datos */}
                    <div className="identidad-campos">
                        {/* Nombre */}
                        <div className="config-field">
                            <label>Nombre comercial</label>
                            <input
                                type="text"
                                value={form.branding.nombreRestaurante|| ""}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        branding: {
                                            ...prev.branding,
                                           nombreRestaurante: e.target.value,
                                        },
                                    }))
                                }
                            />
                        </div>

                        {/* Dirección */}
                        <div className="config-field">
                            <label>Dirección</label>
                            <input
                                type="text"
                                value={form.informacionRestaurante?.direccion || ""}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        informacionRestaurante: {
                                            ...prev.informacionRestaurante,
                                            direccion: e.target.value,
                                        },
                                    }))
                                }
                            />
                        </div>

                        {/* Teléfono */}
                        <div className="config-field">
                            <label>Teléfono</label>
                            <input
                                type="tel"
                                value={form.informacionRestaurante?.telefono || ""}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        informacionRestaurante: {
                                            ...prev.informacionRestaurante,
                                            telefono: e.target.value,
                                        },
                                    }))
                                }
                            />
                        </div>
                    </div>

                    {/* Columna derecha: logo */}
                    <div className="identidad-uploads">
                        <div
                            className={`identidad-upload-zone ${dragOver ? "drag-over" : ""
                                }`}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOver(true);
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOver(false);
                                onUploadLogo(e.dataTransfer.files[0]);
                            }}
                            onClick={() => logoInputRef.current?.click()}
                        >
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => onUploadLogo(e.target.files[0])}
                            />

                            {form.branding.logoUrl ? (
                                <img
                                    src={form.branding.logoUrl}
                                    alt="Logo del negocio"
                                    className="identidad-logo-preview"
                                />
                            ) : (
                                <p className="identidad-upload-hint">
                                    📁 Arrastra o haz clic para subir el logo
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}