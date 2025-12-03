import React, { useState, useEffect } from 'react';
import api from '../../utils/api'; // ajustá la ruta según tu estructura
import './Admin.css';

const Admin = () => {
  const [archivo, setArchivo] = useState(null);
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  // === NUEVO: estado VeriFactu
  const [verifactuEnabled, setVerifactuEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Obtener estado inicial de VeriFactu
  const fetchVerifactu = async () => {
    try {
      const res = await api.get('/admin/verifactu/verifactu');
      setVerifactuEnabled(!!res.data.enabled);
    } catch (e) {
      console.error("Error obteniendo estado VeriFactu:", e);
    }
  };

  useEffect(() => {
    fetchVerifactu();
  }, []);

  // Toggle VeriFactu
  const toggleVerifactu = async () => {
    setLoading(true);
    try {
      const next = !verifactuEnabled;
      const res = await api.post('/admin/verifactu/toggle', { enabled: next });
      setVerifactuEnabled(!!res.data.enabled);
    } catch (e) {
      console.error("Error al cambiar VeriFactu:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!archivo || !password) return alert('Completa ambos campos');

    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('password', password);

    try {
      const res = await api.post('/firma/subir-certificado', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMensaje(res.data.message || 'Operación realizada');
    } catch (error) {
      console.error(error);
      setMensaje('Error al subir el certificado');
    }
  };

  const handleDescargarDeclaracion = () => {
    window.open(`${process.env.REACT_APP_API_URL}/firma/declaracion-responsable`, '_blank');
  };

  return (
    <div className="admin-panel">
      <h2 className="admin-title">Firma Digital y Declaración Responsable</h2>

      {/* === UPLOAD CERT === */}
      <section className="admin-section">
        <h3 className="admin-section-title">Subir Certificado Digital</h3>

        <form onSubmit={handleUpload} className="admin-form">
          <div className="admin-field">
            <label>Certificado (.p12)</label>
            <input
              type="file"
              accept=".p12"
              onChange={(e) => setArchivo(e.target.files[0])}
              required
            />
          </div>

          <div className="admin-field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary">
            Subir Certificado
          </button>
        </form>

        {mensaje && <p className="admin-message">{mensaje}</p>}
      </section>

      {/* === DECLARACIÓN RESPONSABLE === */}
      <section className="admin-section">
        <h3 className="admin-section-title">Declaración Responsable</h3>

        <button
          onClick={handleDescargarDeclaracion}
          className="btn-secondary"
        >
          Descargar Declaración Responsable
        </button>
      </section>

      {/* === VERIFACTU === */}
      <section className="admin-section">
        <h3 className="admin-section-title">Estado VeriFactu</h3>

        <p className="admin-verifactu-estado">
          Estado:{" "}
          <b style={{ color: verifactuEnabled ? "var(--tpv-success)" : "var(--tpv-error)" }}>
            {verifactuEnabled ? "ACTIVADO" : "DESACTIVADO"}
          </b>
        </p>

        <button
          onClick={toggleVerifactu}
          disabled={loading}
          className={verifactuEnabled ? "btn-secondary" : "btn-primary"}
        >
          {verifactuEnabled ? "Desactivar VeriFactu" : "Activar VeriFactu"}
        </button>
      </section>
    </div>
  );
};

export default Admin;
