import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileText, Trash2, Upload, ExternalLink } from 'lucide-react';
import Swal from 'sweetalert2';

export default function InformesManager() {
  const [informes, setInformes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedMes, setSelectedMes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadInformes();
  }, []);

  const loadInformes = async () => {
    setLoading(true);
    try {
      const data = await api.getInformes();
      setInformes(data);
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedMes || !selectedFile) {
      Swal.fire('Atención', 'Seleccioná un mes y un archivo PDF', 'warning');
      return;
    }
    setUploading(true);
    try {
      await api.uploadInforme(selectedMes, selectedFile);
      Swal.fire({ icon: 'success', title: 'Informe subido', timer: 1500, showConfirmButton: false });
      setSelectedMes('');
      setSelectedFile(null);
      document.getElementById('file-input-informes').value = '';
      loadInformes();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    const result = await Swal.fire({
      title: '¿Eliminar informe?',
      text: 'Se eliminará permanentemente el archivo PDF.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#dc2626'
    });
    if (result.isConfirmed) {
      try {
        await api.deleteInforme(filename);
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
        loadInformes();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const formatMes = (mes) => {
    const [year, month] = mes.split('-');
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  if (loading) return <div>Cargando informes...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h3><FileText size={20} color="var(--primary)" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Gestión de Informes Mensuales (PDF)</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Subí los informes de resultados para que los usuarios puedan verlos al finalizar la encuesta.</p>
      </div>

      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Cargar Nuevo Informe</h4>
        <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '1rem', alignItems: 'end' }}>
          <div className="input-group">
            <label>Mes del Informe</label>
            <input
              type="month"
              className="input-field"
              value={selectedMes}
              onChange={(e) => setSelectedMes(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Archivo PDF</label>
            <input
              id="file-input-informes"
              type="file"
              className="input-field"
              accept=".pdf,application/pdf"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading} style={{ height: 'fit-content' }}>
            <Upload size={18} /> {uploading ? 'Subiendo...' : 'Subir PDF'}
          </button>
        </form>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Informes Cargados</h4>
        {informes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay informes cargados.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Mes</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Archivo</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Fecha de Carga</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {informes.map(inf => (
                <tr key={inf.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{formatMes(inf.mes)}</td>
                  <td style={{ padding: '1rem' }}>
                    <a href={inf.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <FileText size={16} /> {inf.archivo}
                    </a>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{inf.fecha_carga}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <a href={inf.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-small" style={{ marginRight: '0.5rem', padding: '0.4rem' }}>
                      <ExternalLink size={16} />
                    </a>
                    <button className="btn btn-outline btn-small" onClick={() => handleDelete(inf.id)} style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)', padding: '0.4rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
