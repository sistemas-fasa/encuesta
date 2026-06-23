const isProduction = import.meta.env.MODE === 'production';

// En producción para DonWeb usamos el backend en PHP
export const API_URL = isProduction 
  ? '/encuestas/api/api.php' 
  : 'http://localhost:3001/api'; 

const fetchWithCreds = (url, options = {}) => {
    return fetch(url, {
        ...options,
        credentials: 'include',
    });
};

export const api = {
    // Auth
    login: async (usuario, password) => {
        const response = await fetchWithCreds(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    logout: async () => {
        const response = await fetchWithCreds(`${API_URL}/logout`, { method: 'POST' });
        return response.json();
    },
    getCurrentUser: async () => {
        const response = await fetchWithCreds(`${API_URL}/me`);
        if (!response.ok) return null;
        return response.json();
    },

    // Surveys
    getEncuestas: async () => {
        const response = await fetchWithCreds(`${API_URL}/encuestas`);
        if (!response.ok) throw new Error((await response.json()).error || 'Error al obtener encuestas');
        return response.json();
    },
    getPublicEncuestas: async () => {
        const response = await fetch(`${API_URL}/public/encuestas`);
        if (!response.ok) throw new Error((await response.json()).error || 'Error al obtener encuestas');
        return response.json();
    },
    updateEncuestaStatus: async (id, estado) => {
        const response = await fetchWithCreds(`${API_URL}/encuestas/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado })
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al actualizar estado');
        return response.json();
    },
    createEncuesta: async (data) => {
        const response = await fetchWithCreds(`${API_URL}/encuestas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al crear encuesta');
        return response.json();
    },
    updateEncuesta: async (id, data) => {
        const response = await fetchWithCreds(`${API_URL}/encuestas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al actualizar encuesta');
        return response.json();
    },
    duplicateEncuesta: async (id) => {
        const response = await fetchWithCreds(`${API_URL}/encuestas/${id}/duplicate`, { method: 'POST' });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al duplicar encuesta');
        return response.json();
    },
    deleteEncuesta: async (id) => {
        const response = await fetchWithCreds(`${API_URL}/encuestas/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al eliminar encuesta');
        return response.json();
    },

    // Banco de Preguntas (Question Bank)
    getBancoPreguntas: async () => {
        const response = await fetchWithCreds(`${API_URL}/banco-preguntas`);
        if (!response.ok) throw new Error((await response.json()).error || 'Error al obtener banco de preguntas');
        return response.json();
    },
    createBancoPregunta: async (data) => {
        const response = await fetchWithCreds(`${API_URL}/banco-preguntas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al crear pregunta');
        return response.json();
    },
    updateBancoPregunta: async (id, data) => {
        const response = await fetchWithCreds(`${API_URL}/banco-preguntas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al actualizar pregunta');
        return response.json();
    },
    deleteBancoPregunta: async (id) => {
        const response = await fetchWithCreds(`${API_URL}/banco-preguntas/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al eliminar pregunta');
        return response.json();
    },

    // Questions (legacy - tied to survey)
    createPregunta: async (data) => {
        const response = await fetchWithCreds(`${API_URL}/preguntas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al crear pregunta');
        return response.json();
    },
    updatePregunta: async (id, data) => {
        const response = await fetchWithCreds(`${API_URL}/preguntas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al actualizar pregunta');
        return response.json();
    },
    deletePregunta: async (id) => {
        const response = await fetchWithCreds(`${API_URL}/preguntas/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al eliminar pregunta');
        return response.json();
    },

    // Survey-Question Linking
    vincularPregunta: async (encuestaId, data) => {
        const response = await fetchWithCreds(`${API_URL}/encuestas/${encuestaId}/vincular-pregunta`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al vincular pregunta');
        return response.json();
    },
    desvincularPregunta: async (encuestaId, preguntaId) => {
        const response = await fetchWithCreds(`${API_URL}/encuestas/${encuestaId}/desvincular-pregunta/${preguntaId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al desvincular pregunta');
        return response.json();
    },
    updateOpciones: async (preguntaId, opciones) => {
        const response = await fetchWithCreds(`${API_URL}/preguntas/${preguntaId}/opciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ opciones })
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al actualizar opciones');
        return response.json();
    },

    // Secciones
    getSecciones: async (encuestaId) => {
        const response = await fetchWithCreds(`${API_URL}/encuestas/${encuestaId}/secciones`);
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    getPublicSecciones: async (encuestaId) => {
        const response = await fetch(`${API_URL}/public/encuestas/${encuestaId}/secciones`);
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    createSeccion: async (data) => {
        const response = await fetchWithCreds(`${API_URL}/secciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    updateSeccion: async (id, data) => {
        const response = await fetchWithCreds(`${API_URL}/secciones/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    deleteSeccion: async (id) => {
        const response = await fetchWithCreds(`${API_URL}/secciones/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },

    // Sectores
    getSectores: async () => {
        const response = await fetch(`${API_URL}/sectores`);
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    createSector: async (data) => {
        const response = await fetchWithCreds(`${API_URL}/sectores`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    updateSector: async (id, data) => {
        const response = await fetchWithCreds(`${API_URL}/sectores/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    deleteSector: async (id) => {
        const response = await fetchWithCreds(`${API_URL}/sectores/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },

    // Localidades
    getLocalidades: async () => {
        const response = await fetchWithCreds(`${API_URL}/localidades`);
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    createLocalidad: async (data) => {
        const response = await fetchWithCreds(`${API_URL}/localidades`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    updateLocalidad: async (id, data) => {
        const response = await fetchWithCreds(`${API_URL}/localidades/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    deleteLocalidad: async (id) => {
        const response = await fetchWithCreds(`${API_URL}/localidades/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },

    // Data
    getPeriodos: async (encuestaId) => {
        const url = encuestaId ? `${API_URL}/periodos?encuesta_id=${encuestaId}` : `${API_URL}/periodos`;
        const response = await fetchWithCreds(url);
        if (!response.ok) throw new Error((await response.json()).error || 'Error al obtener periodos');
        return response.json();
    },
    createPeriodo: async (data) => {
        const response = await fetchWithCreds(`${API_URL}/periodos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al crear periodo');
        return response.json();
    },
    deletePeriodo: async (id) => {
        const response = await fetchWithCreds(`${API_URL}/periodos/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al eliminar periodo');
        return response.json();
    },
    getAuxData: async () => {
        const response = await fetch(`${API_URL}/aux/data`);
        if (!response.ok) throw new Error((await response.json()).error || 'Error al obtener datos auxiliares');
        return response.json();
    },
    getPreguntas: async (encuestaId, camaraId) => {
        let url = `${API_URL}/preguntas?`;
        if (encuestaId) url += `encuesta_id=${encuestaId}&`;
        if (camaraId) url += `camara_id=${camaraId}`;
        const response = await fetchWithCreds(url);
        if (!response.ok) throw new Error((await response.json()).error || 'Error al obtener preguntas');
        return response.json();
    },
    saveRespuestas: async (data) => {
        const response = await fetchWithCreds(`${API_URL}/respuestas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Error al guardar respuestas');
        }
        return response.json();
    },
    getStats: async (periodoId, localidadId, seccionId, sectorId, ivaStatus, camaraId) => {
        let url = `${API_URL}/stats/${periodoId}`;
        const params = [];
        if (localidadId) params.push(`localidad_id=${localidadId}`);
        if (seccionId) params.push(`seccion_id=${seccionId}`);
        if (sectorId) params.push(`sector_id=${sectorId}`);
        if (ivaStatus) params.push(`iva_status=${encodeURIComponent(ivaStatus)}`);
        if (camaraId) params.push(`camara_id=${camaraId}`);
        if (params.length) url += '?' + params.join('&');
        const response = await fetchWithCreds(url);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Error al obtener estadísticas');
        }
        return response.json();
    },
    getHistoricalStats: async (encuestaId, preguntaId, sectorId, localidadId) => {
        let url = `${API_URL}/stats-historical/${encuestaId}/${preguntaId}`;
        const params = [];
        if (sectorId) params.push(`sector_id=${sectorId}`);
        if (localidadId) params.push(`localidad_id=${localidadId}`);
        if (params.length) url += '?' + params.join('&');
        const response = await fetchWithCreds(url);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Error al obtener estadísticas históricas');
        }
        return response.json();
    },
    getStatsPivot: async (periodoId, basePreguntaId, crossPreguntaId, localidadId, sectorNombre) => {
        let url = `${API_URL}/stats-pivot/${periodoId}?base_pregunta_id=${basePreguntaId}&cross_pregunta_id=${crossPreguntaId}`;
        if (localidadId) url += `&localidad_id=${localidadId}`;
        if (sectorNombre) url += `&sector_nombre=${encodeURIComponent(sectorNombre)}`;
        const response = await fetchWithCreds(url);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Error al obtener estadísticas de cruce');
        }
        return response.json();
    },

    // Import
    uploadBatch: async (data) => {
        const response = await fetchWithCreds(`${API_URL}/import/upload_batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error subiendo lote');
        return response.json();
    },
    commitImport: async (importId, encuestaId, periodoId) => {
        const response = await fetchWithCreds(`${API_URL}/import/commit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ import_id: importId, encuesta_id: encuestaId, periodo_id: periodoId })
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error en commit');
        return response.json();
    },
    // Camaras
    createCamara: async (data) => {
        const response = await fetchWithCreds(`${API_URL}/camaras`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al crear cámara');
        return response.json();
    },
    updateCamara: async (id, data) => {
        const response = await fetchWithCreds(`${API_URL}/camaras/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al actualizar cámara');
        return response.json();
    },
    deleteCamara: async (id) => {
        const response = await fetchWithCreds(`${API_URL}/camaras/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al eliminar cǭmara');
        return response.json();
    },

    // Sorteos
    getSorteos: async () => {
        const response = await fetchWithCreds(`${API_URL}/sorteos`);
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    createSorteo: async (data) => {
        const response = await fetchWithCreds(`${API_URL}/sorteos`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    updateSorteo: async (id, data) => {
        const response = await fetchWithCreds(`${API_URL}/sorteos/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    updateSorteoStatus: async (id, activo) => {
        const response = await fetchWithCreds(`${API_URL}/sorteos/${id}/status`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ activo })
        });
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    deleteSorteo: async (id) => {
        const response = await fetchWithCreds(`${API_URL}/sorteos/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    getSorteoParticipantes: async (id, camaraId) => {
        let url = `${API_URL}/sorteos/${id}/participantes`;
        if (camaraId) url += `?camara_id=${camaraId}`;
        const response = await fetchWithCreds(url);
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    checkSorteoActivo: async (camaraId) => {
        const response = await fetch(`${API_URL}/public/camaras/${camaraId}/sorteo-activo`);
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },
    registrarParticipanteSorteo: async (data) => {
        const response = await fetch(`${API_URL}/public/sorteos/participar`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error);
        return response.json();
    },

    // Usuarios
    getUsuarios: async () => {
        const response = await fetchWithCreds(`${API_URL}/usuarios`);
        if (!response.ok) throw new Error('Error al cargar usuarios');
        return response.json();
    },
    createUsuario: async (data) => {
        const response = await fetchWithCreds(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al crear usuario');
        return response.json();
    },
    updateUsuario: async (id, data) => {
        const response = await fetchWithCreds(`${API_URL}/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al actualizar usuario');
        return response.json();
    },
    deleteUsuario: async (id) => {
        const response = await fetchWithCreds(`${API_URL}/usuarios/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al eliminar usuario');
        return response.json();
    },

    // Trend image
    getTrendImage: async (encuestaId, preguntaId, sectorId) => {
        let url = `${API_URL}/trend-image/${encuestaId}/${preguntaId}`;
        if (sectorId) url += `?sector_id=${sectorId}`;
        const response = await fetchWithCreds(url);
        if (!response.ok) return null;
        return response.json();
    },
    uploadTrendImage: async (encuestaId, preguntaId, file, sectorId) => {
        const formData = new FormData();
        formData.append('image', file);
        if (sectorId) formData.append('sector_id', sectorId);
        const response = await fetchWithCreds(`${API_URL}/trend-image/${encuestaId}/${preguntaId}`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al subir imagen');
        return response.json();
    },
    deleteTrendImage: async (encuestaId, preguntaId, sectorId) => {
        let url = `${API_URL}/trend-image/${encuestaId}/${preguntaId}`;
        if (sectorId) url += `?sector_id=${sectorId}`;
        const response = await fetchWithCreds(url, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Error al eliminar imagen');
        return response.json();
    },

    // Version check for cache busting
    getVersion: async () => {
        const versionUrl = isProduction ? '/encuestas/api/version.php' : 'http://localhost:3001/api/version';
        try {
            const response = await fetch(versionUrl, { cache: 'no-store' });
            if (!response.ok) return null;
            return response.json();
        } catch (e) {
            console.warn('[Version] No se pudo obtener versión:', e?.message);
            return null;
        }
    }
};
