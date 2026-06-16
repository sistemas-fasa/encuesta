import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { Plus, Edit3, Trash2, Power, Users, Download, Trophy, Settings, X, Search } from 'lucide-react';

export default function SorteosManager({ camaras }) {
    const [sorteos, setSorteos] = useState([]);
    const [participantes, setParticipantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'form', 'participantes'
    const [editingSorteo, setEditingSorteo] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        periodo: '',
        fecha_inicio: '',
        fecha_fin: '',
        camaras: [],
        activo: 1
    });
    const [filtroCamara, setFiltroCamara] = useState('');

    useEffect(() => {
        loadSorteos();
    }, []);

    const loadSorteos = async () => {
        setLoading(true);
        try {
            const data = await api.getSorteos();
            setSorteos(data);
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEdit = () => {
        setFormData({ nombre: '', subtitulo: '', premios: '', periodo: '', fecha_inicio: '', fecha_fin: '', camaras: [], activo: 1 });
        setEditingSorteo(null);
        setView('form');
    };

    const handleEdit = (sorteo) => {
        setFormData({
            ...sorteo,
            fecha_inicio: sorteo.fecha_inicio.split('T')[0],
            fecha_fin: sorteo.fecha_fin.split('T')[0],
            camaras: sorteo.camaras || []
        });
        setEditingSorteo(sorteo);
        setView('form');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingSorteo) {
                await api.updateSorteo(editingSorteo.id, formData);
                Swal.fire({ icon: 'success', title: 'Sorteo Actualizado', timer: 1500, showConfirmButton: false });
            } else {
                await api.createSorteo(formData);
                Swal.fire({ icon: 'success', title: 'Sorteo Creado', timer: 1500, showConfirmButton: false });
            }
            setView('list');
            loadSorteos();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await api.updateSorteoStatus(id, !currentStatus);
            loadSorteos();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar sorteo?',
            text: 'Se eliminarán también todos los participantes registrados.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            confirmButtonColor: '#dc2626'
        });
        if (result.isConfirmed) {
            try {
                await api.deleteSorteo(id);
                loadSorteos();
                Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };

    const handleViewParticipantes = async (sorteo) => {
        setEditingSorteo(sorteo);
        setFiltroCamara('');
        try {
            const data = await api.getSorteoParticipantes(sorteo.id);
            setParticipantes(data);
            setView('participantes');
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const handleFilterParticipantes = async (camaraId) => {
        setFiltroCamara(camaraId);
        try {
            const data = await api.getSorteoParticipantes(editingSorteo.id, camaraId);
            setParticipantes(data);
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const exportToExcel = () => {
        if (participantes.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(participantes.map(p => ({
            'Sorteo': editingSorteo.nombre,
            'Cámara': p.camara_nombre,
            'Apellido': p.apellido,
            'Nombre': p.nombre,
            'Domicilio': p.domicilio,
            'Teléfono': p.telefono,
            'Fecha Registro': p.fecha_registro ? new Date(p.fecha_registro).toLocaleString() : '-'
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Participantes');
        XLSX.writeFile(workbook, `Participantes_${editingSorteo.nombre.replace(/\s+/g, '_')}.xlsx`);
    };

    const handleRandomDraw = () => {
        if (participantes.length === 0) {
            Swal.fire('Atención', 'No hay participantes para realizar el sorteo.', 'warning');
            return;
        }

        let counter = 0;
        const maxTicks = 20;
        const speed = 100;
        
        // Random effect simulation
        const timer = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * participantes.length);
            const p = participantes[randomIndex];
            Swal.fire({
                title: 'Sorteando...',
                text: `${p.nombre} ${p.apellido}`,
                showConfirmButton: false,
                allowOutsideClick: false
            });
            counter++;
            
            if (counter > maxTicks) {
                clearInterval(timer);
                const finalWinner = participantes[Math.floor(Math.random() * participantes.length)];
                Swal.fire({
                    icon: 'success',
                    title: '¡Ganador!',
                    html: `
                        <div style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--primary);">
                            <b>${finalWinner.nombre} ${finalWinner.apellido}</b>
                        </div>
                        <p>Cámara: ${finalWinner.camara_nombre}</p>
                        <p>Teléfono: ${finalWinner.telefono}</p>
                        <p>Domicilio: ${finalWinner.domicilio}</p>
                    `,
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#10b981'
                });
            }
        }, speed);
    };

    if (loading) return <div>Cargando sorteos...</div>;

    return (
        <div className="animate-fade-in">
            {view === 'list' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Gestión de Sorteos</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Crea y administra sorteos para las cámaras</p>
                        </div>
                        <button className="btn btn-primary" onClick={handleCreateEdit}>
                            <Plus size={18} /> Nuevo Sorteo
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {sorteos.length === 0 ? (
                            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                No hay sorteos configurados.
                            </div>
                        ) : (
                            sorteos.map(sorteo => (
                                <div key={sorteo.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{sorteo.nombre}</h3>
                                            <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: sorteo.activo ? '#dcfce7' : '#f3f4f6', color: sorteo.activo ? '#166534' : '#4b5563', fontWeight: 'bold' }}>
                                                {sorteo.activo ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            Periodo: {sorteo.periodo} | {new Date(sorteo.fecha_inicio).toLocaleDateString()} - {new Date(sorteo.fecha_fin).toLocaleDateString()}
                                        </p>
                                        <p style={{ margin: 0, color: 'var(--primary)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                                            {sorteo.camaras.length} Cámara(s) vinculada(s)
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => handleViewParticipantes(sorteo)} title="Ver Participantes">
                                            <Users size={18} />
                                        </button>
                                        <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => handleToggleStatus(sorteo.id, sorteo.activo)} title={sorteo.activo ? 'Desactivar' : 'Activar'}>
                                            <Power size={18} color={sorteo.activo ? '#10b981' : '#6b7280'} />
                                        </button>
                                        <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => handleEdit(sorteo)} title="Editar">
                                            <Edit3 size={18} />
                                        </button>
                                        <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => handleDelete(sorteo.id)} title="Eliminar">
                                            <Trash2 size={18} color="#ef4444" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {view === 'form' && (
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0 }}>{editingSorteo ? 'Editar Sorteo' : 'Nuevo Sorteo'}</h3>
                        <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => setView('list')}>
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSave} style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label>Nombre del Sorteo</label>
                                <input type="text" className="input-field" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required placeholder="Ej: Sorteo Día de la Madre" />
                            </div>
                            <div className="input-group">
                                <label>Subtítulo (Opcional)</label>
                                <input type="text" className="input-field" value={formData.subtitulo || ''} onChange={e => setFormData({...formData, subtitulo: e.target.value})} placeholder="Ej: Participá y ganá increíbles premios" />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Premios a Sortear</label>
                            <textarea className="input-field" value={formData.premios || ''} onChange={e => setFormData({...formData, premios: e.target.value})} placeholder="Ej: 1° Premio: Smart TV 50&#34;&#10;2° Premio: Estadía para 2 personas" rows={3} style={{ resize: 'vertical' }}></textarea>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label>Periodo / Mes</label>
                                <input type="text" className="input-field" value={formData.periodo} onChange={e => setFormData({...formData, periodo: e.target.value})} required placeholder="Ej: Octubre 2026" />
                            </div>
                            <div className="input-group">
                                <label>Fecha de Inicio</label>
                                <input type="date" className="input-field" value={formData.fecha_inicio} onChange={e => setFormData({...formData, fecha_inicio: e.target.value})} required />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label>Fecha de Fin</label>
                                <input type="date" className="input-field" value={formData.fecha_fin} onChange={e => setFormData({...formData, fecha_fin: e.target.value})} required />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Cámaras Participantes</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'white' }}>
                                {camaras.map(cam => (
                                    <label key={cam.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={formData.camaras.includes(cam.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData({...formData, camaras: [...formData.camaras, cam.id]});
                                                } else {
                                                    setFormData({...formData, camaras: formData.camaras.filter(id => id !== cam.id)});
                                                }
                                            }}
                                        />
                                        {cam.nombre}
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                <input type="checkbox" checked={formData.activo === 1} onChange={e => setFormData({...formData, activo: e.target.checked ? 1 : 0})} />
                                Sorteo Activo
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" className="btn btn-outline" onClick={() => setView('list')}>Cancelar</button>
                            <button type="submit" className="btn btn-primary">Guardar Sorteo</button>
                        </div>
                    </form>
                </div>
            )}

            {view === 'participantes' && (
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                        <div>
                            <h3 style={{ margin: 0 }}>Participantes: {editingSorteo?.nombre}</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Total registrados: {participantes.length}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-outline" style={{ background: '#10b981', color: 'white', borderColor: '#10b981' }} onClick={exportToExcel}>
                                <Download size={18} /> Exportar Excel
                            </button>
                            <button className="btn btn-primary" style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }} onClick={handleRandomDraw}>
                                <Trophy size={18} /> Sorteo Aleatorio
                            </button>
                            <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => setView('list')}>
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem', maxWidth: '300px' }}>
                        <select className="input-field" value={filtroCamara} onChange={e => handleFilterParticipantes(e.target.value)}>
                            <option value="">Todas las Cámaras vinculadas</option>
                            {camaras.filter(c => editingSorteo.camaras.includes(c.id)).map(cam => (
                                <option key={cam.id} value={cam.id}>{cam.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                                    <th style={{ padding: '1rem' }}>Apellido y Nombre</th>
                                    <th style={{ padding: '1rem' }}>Cámara</th>
                                    <th style={{ padding: '1rem' }}>Teléfono</th>
                                    <th style={{ padding: '1rem' }}>Domicilio</th>
                                    <th style={{ padding: '1rem' }}>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participantes.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{p.apellido}, {p.nombre}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.camara_nombre}</td>
                                        <td style={{ padding: '1rem' }}>{p.telefono}</td>
                                        <td style={{ padding: '1rem' }}>{p.domicilio}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{p.fecha_registro ? new Date(p.fecha_registro).toLocaleString() : '-'}</td>
                                    </tr>
                                ))}
                                {participantes.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay participantes registrados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
