import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { UploadCloud, CheckCircle, AlertTriangle, Play, Database } from 'lucide-react';
import { api } from '../services/api';

export default function ImportManager({ selectedEncuesta }) {
    const [file, setFile] = useState(null);
    const [dataRows, setDataRows] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [periodos, setPeriodos] = useState([]);
    const [selectedPeriodo, setSelectedPeriodo] = useState('');

    useEffect(() => {
        if (selectedEncuesta) {
            api.getPeriodos(selectedEncuesta.id).then(setPeriodos).catch(console.error);
        }
    }, [selectedEncuesta]);

    const onDrop = useCallback((acceptedFiles) => {
        const selectedFile = acceptedFiles[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                
                if (parsedData.length > 0) {
                    setHeaders(parsedData[0]);
                    setDataRows(parsedData.slice(1).filter(row => row.length > 0));
                }
            };
            reader.readAsArrayBuffer(selectedFile);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv']
        },
        maxFiles: 1
    });

    const handleUpload = async () => {
        if (!file || dataRows.length === 0) return;
        
        setIsUploading(true);
        setProgress(0);

        try {
            const batchSize = 100;
            const totalBatches = Math.ceil(dataRows.length / batchSize);
            let currentImportId = null;

            for (let i = 0; i < totalBatches; i++) {
                const batch = dataRows.slice(i * batchSize, (i + 1) * batchSize);
                const rowsFormatted = batch.map((row, idx) => {
                    const rowObj = {};
                    headers.forEach((h, j) => { rowObj[h] = row[j]; });
                    return { index: i * batchSize + idx, data: rowObj };
                });

                const payload = {
                    action: 'upload_batch',
                    filename: file.name,
                    total_rows: dataRows.length,
                    batch_index: i,
                    rows: rowsFormatted,
                    import_id: currentImportId
                };

                const res = await api.uploadBatch(payload);
                
                if (i === 0) {
                    currentImportId = res.import_id;
                }

                setProgress(Math.round(((i + 1) / totalBatches) * 50)); // Hasta 50% para la subida a temp
            }

            // Aquí confirmamos
            setProgress(75);
            await api.commitImport(currentImportId, selectedEncuesta.id, selectedPeriodo);

            setProgress(100);
            Swal.fire({
                icon: 'success',
                title: 'Importación Completada',
                text: 'Los datos han sido pre-cargados en el servidor exitosamente. (El procesamiento final está en desarrollo)',
                confirmButtonColor: '#10b981'
            });

            setFile(null);
            setDataRows([]);
            setHeaders([]);
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h3>Importación Masiva de Datos</h3>
            </div>
            
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Período Destino:</label>
                <select 
                    className="input-group" 
                    value={selectedPeriodo} 
                    onChange={e => setSelectedPeriodo(e.target.value)}
                    style={{ maxWidth: '400px' }}
                >
                    <option value="">-- Seleccione un período --</option>
                    {periodos.map(p => (
                        <option key={p.id} value={p.id}>{p.mes}/{p.anio}</option>
                    ))}
                </select>
                {!selectedPeriodo && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>Debes seleccionar un período antes de subir el archivo.</p>}
            </div>

            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', border: '2px dashed var(--primary)', background: isDragActive ? 'rgba(14, 165, 233, 0.05)' : 'white', opacity: selectedPeriodo ? 1 : 0.5, pointerEvents: selectedPeriodo ? 'auto' : 'none' }} {...getRootProps()}>
                <input {...getInputProps()} />
                <UploadCloud size={48} color="var(--primary)" style={{ margin: '0 auto 1rem', display: 'block' }} />
                {isDragActive ? (
                    <p style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Soltá el archivo aquí...</p>
                ) : (
                    <>
                        <p style={{ fontWeight: 'bold' }}>Arrastrá tu archivo Excel (.xlsx, .csv) aquí</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>O hacé clic para seleccionar desde tu equipo</p>
                    </>
                )}
            </div>

            {file && (
                <div className="glass-card animate-slide-up" style={{ marginTop: '2rem', padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={20} color="#10b981" /> 
                                Archivo Listo: {file.name}
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Se encontraron <strong>{headers.length}</strong> columnas y <strong>{dataRows.length}</strong> registros.
                            </p>
                        </div>
                        <button 
                            className="btn btn-primary" 
                            onClick={handleUpload} 
                            disabled={isUploading}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem' }}
                        >
                            {isUploading ? <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Play size={18} />}
                            {isUploading ? 'Procesando...' : 'Iniciar Importación'}
                        </button>
                    </div>

                    {isUploading && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                <span>Progreso</span>
                                <span>{progress}%</span>
                            </div>
                            <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', height: '8px' }}>
                                <div style={{ width: `${progress}%`, background: '#10b981', height: '100%', transition: 'width 0.3s ease' }}></div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
