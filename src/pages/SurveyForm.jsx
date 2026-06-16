import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useParams } from 'react-router-dom';
import { ClipboardList, Building2, Calendar, Send, ChevronRight, ChevronLeft, AlertCircle, CheckCircle2, Trophy, Gift } from 'lucide-react';
import logo from '../assets/logo.png';
import bannerLogos from '../assets/banner-logos.jpg';
import { surveyLogger } from '../utils/surveyLogger';

export default function SurveyForm() {
  const { id: urlEncuestaId } = useParams(); // from /encuesta/:id
  const [encuestas, setEncuestas] = useState([]);
  const [selectedEncuesta, setSelectedEncuesta] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [localidades, setLocalidades] = useState([]);
  const [ivas, setIvas] = useState([]);
  const [camaras, setCamaras] = useState([]);
  const [selectedCamara, setSelectedCamara] = useState('');

  const [preguntas, setPreguntas] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [history, setHistory] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [activeSorteo, setActiveSorteo] = useState(null);
  const [sorteoCheckedForCamera, setSorteoCheckedForCamera] = useState(null);
  const [sorteoPrompted, setSorteoPrompted] = useState(false);
  const [showSorteoUI, setShowSorteoUI] = useState(false);
  const [sorteoStep, setSorteoStep] = useState(1);
  const [sorteoData, setSorteoData] = useState({ apellido: '', nombre: '', domicilio: '', telefono: '' });
  const [isSubmittingSorteo, setIsSubmittingSorteo] = useState(false);

  const selectedCamaraId = React.useMemo(() => {
    try {
    for (const pId in respuestas) {
       const q = preguntas.find(p => p && p.id === parseInt(pId));
       if (q?.tipo === 'selector_camara') {
           return respuestas[pId]?.valor_numerico;
       }
    }
    return null;
    } catch (err) {
      surveyLogger.error('selectedCamaraId', err);
      return null;
    }
  }, [preguntas, respuestas]);

  useEffect(() => {
    if (selectedCamaraId && selectedCamaraId !== sorteoCheckedForCamera) {
        setSorteoCheckedForCamera(selectedCamaraId);
        api.checkSorteoActivo(selectedCamaraId).then(res => {
            if (res.activo) {
                setActiveSorteo(res.sorteo);
                setSorteoPrompted(false);
                setShowSorteoUI(true);
            } else {
                setActiveSorteo(null);
                setSorteoPrompted(true);
            }
        }).catch(err => {
            surveyLogger.error('checkSorteoActivo', err);
            setActiveSorteo(null);
            setSorteoPrompted(true);
        });
    } else if (!selectedCamaraId && sorteoCheckedForCamera) {
        setActiveSorteo(null);
        setSorteoCheckedForCamera(null);
    }
  }, [selectedCamaraId, sorteoCheckedForCamera]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [eData, auxData] = await Promise.all([
        api.getPublicEncuestas(),
        api.getAuxData()
      ]);
      setEncuestas(eData);
      setLocalidades(auxData.localidades);
      setIvas(auxData.ivas);
      setCamaras(auxData.camaras);

      // If URL has a specific survey id, load that one; otherwise load first
      const targetId = urlEncuestaId ? parseInt(urlEncuestaId) : eData[0]?.id;
      if (targetId) handleEncuestaChange(targetId, eData);
    } catch (err) {
      setError('Error al cargar datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const handleEncuestaChange = async (id, eList) => {
    const list = eList || encuestas;
    const encuesta = list.find(e => e.id === parseInt(id)) || list[0] || { id: id };
    setSelectedEncuesta(encuesta);
    try {
      const pData = await api.getPeriodos(id);
      const qData = await api.getPreguntas(id);
      const sData = await api.getPublicSecciones(id);
      setPeriodos(pData);
      setPreguntas(qData);
      setSecciones(sData);
      setSelectedPeriodo(pData[0]?.id.toString() || '');
      setCurrentIndex(-1);
      setHistory([]);
      setRespuestas({});
      setSubmitted(false);
    } catch (err) {
      setError('Error al cargar la encuesta');
    }
  };


  // Find the selected sectors from answers (from a 'selector_rubro' type question)
  const sessionSectorIds = React.useMemo(() => {
    try {
    let sectorIds = [];
    Object.entries(respuestas || {}).forEach(([pId, val]) => {
      if (val.isSectorRubro && val.sectores_ids) {
        sectorIds = [...sectorIds, ...val.sectores_ids.map(Number)];
      } else if (val.opcion_id) {
        const q = preguntas.find(p => String(p.id) === String(pId));
        const opt = q?.opciones?.find(o => String(o.id) === String(val.opcion_id));
        if (opt?.siguiente_seccion_id) {
          const sec = secciones.find(s => String(s.id) === String(opt.siguiente_seccion_id));
          if (sec?.sector_id) {
            sectorIds.push(Number(sec.sector_id));
          }
        }
      }
    });
    return sectorIds;
    } catch (err) {
      surveyLogger.error('sessionSectorIds', err);
      return [];
    }
  }, [respuestas, preguntas, secciones]);

  // IDs de secciones que son destino de algún salto condicional (de cualquier opción)
  const allConditionalTargetIds = React.useMemo(() => {
    try {
    const ids = [];
    (preguntas || []).forEach(p => {
      if (!Array.isArray(p.opciones)) return;
      p.opciones.forEach(opt => {
        if (opt.siguiente_seccion_id != null) {
          ids.push(String(opt.siguiente_seccion_id));
        }
      });
    });
    return ids;
    } catch (err) {
      surveyLogger.error('allConditionalTargetIds', err);
      return [];
    }
  }, [preguntas]);

  // IDs de secciones a las que el usuario SÍ saltó (opción seleccionada activa)
  const activeJumpTargetIds = React.useMemo(() => {
    try {
    const ids = [];
    (preguntas || []).forEach(p => {
      if (!Array.isArray(p.opciones)) return;
      const ans = respuestas[p.id];
      if (!ans) return;
      p.opciones.forEach(opt => {
        if (opt.siguiente_seccion_id == null) return;
        let wasSelected = false;
        if (p.tipo === 'opcion_unica' || p.tipo === 'selector_camara') {
          wasSelected = ans.opcion_id != null && String(ans.opcion_id) === String(opt.id);
        } else if (p.tipo === 'selector_rubro') {
          wasSelected = !!(ans.isSectorRubro && Array.isArray(ans.opciones_ids) && ans.opciones_ids.some(id => String(id) === String(opt.id)));
        } else if (p.tipo === 'opcion_multiple') {
          wasSelected = !!(Array.isArray(ans.opciones_ids) && ans.opciones_ids.some(id => String(id) === String(opt.id)));
        }
        if (wasSelected) ids.push(String(opt.siguiente_seccion_id));
      });
    });
    return ids;
    } catch (err) {
      surveyLogger.error('activeJumpTargetIds', err);
      return [];
    }
  }, [preguntas, respuestas]);

  // Helper to find options selected in specific activity dropdowns
  const getActividadSelections = React.useCallback(() => {
    try {
    const selectedActivities = [];

    // Agrupamos por sección para tomar solo la PRIMERA pregunta dropdown de cada sección condicional
    // (que asume ser la pregunta de "Actividad Específica")
    (activeJumpTargetIds || []).forEach(sectionIdStr => {
      const preguntasDeSeccion = (preguntas || [])
        .filter(p => p && String(p.seccion_id) === sectionIdStr && p.tipo === 'opcion_unica')
        .sort((a, b) => (a.orden || 0) - (b.orden || 0));

      for (const q of preguntasDeSeccion) {
        if (!q) continue;
        const ans = respuestas[q.id];
        if (ans && ans.opcion_id) {
          const opt = q.opciones?.find(o => String(o.id) === String(ans.opcion_id));
          if (opt) {
            const txt = opt.texto.trim().toUpperCase();
            // Ignoramos respuestas genéricas de Sí/No
            if (txt !== 'SI' && txt !== 'SÍ' && txt !== 'NO') {
              selectedActivities.push({ id: opt.id, texto: opt.texto });
              break; // Tomamos solo la primera válida de esta sección
            }
          }
        }
      }
    });

    return selectedActivities;
    } catch (err) {
      surveyLogger.error('getActividadSelections', err);
      return [];
    }
  }, [respuestas, preguntas, activeJumpTargetIds]);


  const currentSection = secciones && currentIndex >= 0 && currentIndex < secciones.length ? secciones[currentIndex] : null;
  // Filter out the dynamic start screen questions from the regular survey flow
  const currentPreguntas = currentSection
    ? (preguntas || []).filter(p => {
      if (!p || p.seccion_id !== currentSection.id) return false;
      return !['selector_localidad', 'selector_iva'].includes(p.tipo);
    }).sort((a, b) => (a.orden || 0) - (b.orden || 0))
    : [];

  // nextSectionIndex: Calculates the index of the next section to visit based on current state and jumps
  const nextSectionIndex = React.useMemo(() => {
    try {
    if (!currentSection || currentIndex === -1) return -1;

    // PRIORIDAD 0: Si la sección actual tiene "siguiente sección" configurada directamente, usarla
    if (currentSection?.siguiente_seccion_id) {
      const nextIdx = secciones.findIndex(s => String(s.id) === String(currentSection.siguiente_seccion_id));
      if (nextIdx !== -1 && nextIdx !== currentIndex) {
        return nextIdx;
      }
    }

    let nextSectionId = null;

    // 1. Check for explicit jumps in answers (IMMEDIATE JUMP)
    currentPreguntas.forEach(p => {
      const answer = respuestas[p.id];
      if (answer && (p.tipo === 'opcion_unica' || p.tipo === 'selector_rubro' || p.tipo === 'selector_camara')) {
        if (answer.siguiente_seccion_id) {
          nextSectionId = answer.siguiente_seccion_id;
        }
      }
    });

    if (nextSectionId) {
      const nextIdx = secciones.findIndex(s => String(s.id) === String(nextSectionId));
      if (nextIdx !== -1 && nextIdx !== currentIndex) {
        return nextIdx;
      }
    }

    // 2. Sequential logic — skip sections that are conditional targets NOT triggered, or wrong sector
    if (currentIndex < secciones.length - 1) {
      let nextIdx = currentIndex + 1;

      while (nextIdx < secciones.length) {
        const nextSec = secciones[nextIdx];
        const secIdStr = String(nextSec.id);

        // Skip section if it's already in history to prevent circular loops
        if (history.includes(nextIdx)) {
          nextIdx++;
          continue;
        }

        // Skip section if it's a conditional jump target but was NOT triggered by the user
        const isConditionalTarget = allConditionalTargetIds.includes(secIdStr);
        const wasActivated = activeJumpTargetIds.includes(secIdStr);
        if (isConditionalTarget && !wasActivated) {
          nextIdx++;
          continue;
        }

        // Show general sections (no sector_id) or sections matching selected sectors.
        if (!nextSec.sector_id || sessionSectorIds.includes(Number(nextSec.sector_id))) {
          break;
        }
        nextIdx++;
      }

      if (nextIdx < secciones.length) {
        return nextIdx;
      }
    }

    return -1;
    } catch (err) {
      surveyLogger.error('nextSectionIndex', err);
      return -1;
    }
  }, [currentSection, currentIndex, secciones, currentPreguntas, respuestas, allConditionalTargetIds, activeJumpTargetIds, sessionSectorIds, history]);

  const isTerminalSection = nextSectionIndex === -1 && currentIndex >= 0;


  const handleAnswer = (preguntaId, data) => {
    const question = preguntas.find(p => String(p.id) === String(preguntaId));
    surveyLogger.answer(preguntaId, data, question?.texto_pregunta);
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: data
    }));
  };

  const handleRepeaterAnswer = (preguntaId, subrubroId, subrubroName, data) => {
    setRespuestas(prev => {
      const existing = prev[preguntaId] || { isRepeater: true, answers: [] };
      const answers = [...(existing.answers || [])];
      const idx = answers.findIndex(a => String(a.subrubroId) === String(subrubroId));
      if (idx >= 0) {
        answers[idx] = { subrubroId, subrubroName, data };
      } else {
        answers.push({ subrubroId, subrubroName, data });
      }
      return { ...prev, [preguntaId]: { isRepeater: true, answers } };
    });
  };

  const handleNext = () => {
    try {
      if (nextSectionIndex !== -1) {
        const answeredInSection = currentPreguntas.map(p => {
          const ans = respuestas[p.id];
          return {
            preguntaId: p.id,
            preguntaTexto: p.texto_pregunta?.substring(0, 80),
            tipo: p.tipo,
            respondida: !!ans,
            valor: ans ? (ans.opcion_id || ans.valor_texto || ans.valor_numerico || (ans.opciones_ids?.join(',')) || '(compleja)') : null
          };
        });

        const nextSec = secciones[nextSectionIndex];
        surveyLogger.next(
          currentSection?.id,
          currentSection?.titulo,
          answeredInSection,
          nextSectionIndex,
          nextSec?.id,
          nextSec?.titulo
        );

        setHistory(prev => [...prev, currentIndex]);
        setCurrentIndex(nextSectionIndex);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        surveyLogger.navigation('next_blocked', {
          reason: 'nextSectionIndex is -1',
          currentIndex,
          sectionId: currentSection?.id,
          sectionTitle: currentSection?.titulo
        });
      }
    } catch (err) {
      surveyLogger.error('handleNext', err);
      setError('Error al navegar a la siguiente sección. Por favor intentá de nuevo.');
    }
  };

  // Auto-skip empty sections that occur due to filtering out start screen questions
  useEffect(() => {
    try {
      if (currentIndex >= 0 && currentSection && currentPreguntas.length === 0 && !isTerminalSection && !loading) {
        if (nextSectionIndex !== -1) {
          const nextSec = secciones[nextSectionIndex];
          surveyLogger.autoSkip(
            currentIndex, currentSection?.id,
            nextSectionIndex, nextSec?.id,
            'Sin preguntas visibles en la sección'
          );
          setHistory(prev => [...prev, currentIndex]);
          setCurrentIndex(nextSectionIndex);
        } else {
          surveyLogger.autoSkip(
            currentIndex, currentSection?.id,
            -1, null,
            'Sin preguntas visibles y no hay siguiente sección disponible'
          );
        }
      }
    } catch (err) {
      surveyLogger.error('autoSkip', err);
    }
  }, [currentIndex, currentSection, currentPreguntas.length, isTerminalSection, loading, nextSectionIndex, secciones]);

  const handlePrev = () => {
    try {
      if (history.length > 0) {
        const newHistory = [...history];
        const prevIdx = newHistory.pop();
        surveyLogger.prev(currentIndex, currentSection?.id, prevIdx, secciones[prevIdx]?.id);
        setHistory(newHistory);
        setCurrentIndex(prevIdx);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        surveyLogger.navigation('prev_to_start', { fromIndex: currentIndex, fromSectionId: currentSection?.id });
        setCurrentIndex(-1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      surveyLogger.error('handlePrev', err);
      setError('Error al volver a la sección anterior. Por favor intentá de nuevo.');
    }
  };

  const handleSubmit = async (e) => {
    setLoading(true);
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedPeriodo) {
      setError('Por favor seleccione el período');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Encontrar los sector_ids si existen entre las respuestas
      const sessionSectorIdsSubmit = sessionSectorIds;

      const flattenedRespuestas = [];
      Object.entries(respuestas).forEach(([pId, val]) => {
        const question = preguntas.find(p => p.id === parseInt(pId));
        const section = secciones.find(s => s.id === question?.seccion_id);
        const sectionSectorId = section?.sector_id ? Number(section.sector_id) : null;

        const finalSectorId = sectionSectorId || (sessionSectorIdsSubmit.length > 0 ? sessionSectorIdsSubmit[0] : null);

        if (val.isGrid) {
          val.answers.forEach(ans => {
            flattenedRespuestas.push({
              pregunta_id: parseInt(pId),
              opcion_id: ans.opcion_id,
              valor_texto: ans.row,
              sector_id: finalSectorId
            });
          });
        } else if (val.isRepeater) {
          val.answers.forEach(ans => {
            flattenedRespuestas.push({
              pregunta_id: parseInt(pId),
              opcion_id: ans.data.opcion_id,
              valor_texto: ans.data.valor_texto ? `${ans.data.valor_texto} [${ans.subrubroName}]` : `[${ans.subrubroName}]`,
              sector_id: finalSectorId
            });
          });
        } else if (val.isSectorRubro) {
          const rubroQuestion = preguntas.find(p => p.id === parseInt(pId));
          val.opciones_ids.forEach((optId, idx) => {
            const sectorId = val.sectores_ids[idx] || null;
            const sectorNombre = rubroQuestion?.opciones?.find(o => String(o.id) === String(optId))?.texto || null;
            flattenedRespuestas.push({
              pregunta_id: parseInt(pId),
              sector_id: sectorId,
              valor_texto: sectorNombre,
              opcion_id: null
            });
          });
        } else if (val.opciones_ids) {
          val.opciones_ids.forEach(optId => {
            flattenedRespuestas.push({
              pregunta_id: parseInt(pId),
              opcion_id: optId,
              sector_id: finalSectorId
            });
          });
        } else if (question?.tipo === 'selector_camara' || question?.tipo === 'selector_localidad' || question?.tipo === 'selector_iva') {
          flattenedRespuestas.push({
            pregunta_id: parseInt(pId),
            opcion_id: null,
            valor_texto: val.valor_texto,
            valor_numerico: val.valor_numerico,
            sector_id: finalSectorId
          });
        } else {
          flattenedRespuestas.push({
            pregunta_id: parseInt(pId),
            ...val,
            sector_id: finalSectorId
          });
        }
      });

      const locAns = flattenedRespuestas.find(r => preguntas.find(p => p.id === r.pregunta_id)?.tipo === 'selector_localidad');
      const finalLocalidadId = locAns?.valor_numerico || (locAns?.valor_texto ? localidades.find(l => l.nombre === locAns.valor_texto)?.id : null);

      const data = {
        localidad_id: finalLocalidadId ? parseInt(finalLocalidadId) : null,
        periodo_id: parseInt(selectedPeriodo),
        iva_id: null,
        respuestas: flattenedRespuestas
      };

      surveyLogger.submit(flattenedRespuestas.length, data.periodo_id, data.localidad_id);

      await api.saveRespuestas(data);
      setSubmitted(true);
    } catch (err) {
      surveyLogger.error('handleSubmit', err);
      setError(err.message || 'Error al guardar respuestas. Por favor intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Email conditional helpers ─────────────────────────────────────────────
  const emailShouldShow = (pregunta, sectPreguntas, resps) => {
    const sibling = sectPreguntas.find(p => p.id !== pregunta.id && p.tipo === 'opcion_unica');
    const ans = sibling ? resps[sibling.id] : null;
    if (ans && ans.valor_texto?.toLowerCase().trim() === 'no') return false;
    return true;
  };
  const emailIsValid = (pregunta, resps) => {
    const val = resps[pregunta.id]?.valor_texto || '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };
  const emailHasError = (pregunta, resps) => {
    const val = resps[pregunta.id]?.valor_texto || '';
    return val.length > 0 && !emailIsValid(pregunta, resps);
  };
  // ─────────────────────────────────────────────────────────────────────────

  if (loading && !encuestas.length) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}><h2>Cargando encuesta...</h2></div>;

  if (submitted) {
    return (
      <div className="container animate-fade-in" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem' }}>
          <CheckCircle2 size={80} color="var(--success)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>¡Muchas gracias!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Tus respuestas han sido registradas exitosamente para este período.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Enviar otra respuesta</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in">
      <header style={{ marginBottom: '3rem', textAlign: 'center', paddingTop: '1rem' }}>
        <div style={{ marginBottom: '1.5rem', width: '100%', overflow: 'hidden' }}>
          <img
            src={bannerLogos}
            alt="Asociaciones Participantes"
            style={{ width: '100%', maxWidth: '900px', height: 'auto', objectFit: 'contain', borderRadius: '8px' }}
          />
        </div>

        {!urlEncuestaId && encuestas.length > 1 && (
          <div className="input-group" style={{ maxWidth: '400px', margin: '0 auto 2.5rem' }}>
            <label style={{ justifyContent: 'center', fontWeight: 'bold' }}>Seleccionar Encuesta Disponible</label>
            <select
              value={selectedEncuesta?.id || ''}
              onChange={(e) => handleEncuestaChange(e.target.value)}
              style={{ textAlignLast: 'center', borderColor: 'var(--primary)' }}
            >
              {encuestas.map(e => <option key={e.id} value={e.id}>{e.titulo}</option>)}
            </select>
          </div>
        )}

        <h1 style={{ fontSize: '2.8rem', marginBottom: '0.8rem', letterSpacing: '-1.5px', color: 'var(--text-main)', fontWeight: '800' }}>
          {selectedEncuesta?.titulo || 'Encuesta Provincial CEM - Relevamiento Pyme'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto', fontWeight: '500' }}>
          {selectedEncuesta?.descripcion || 'Encuesta Provincial CEM - Relevamiento Pyme'}
        </p>
        <div style={{ height: '5px', width: '80px', background: 'var(--primary)', margin: '2rem auto 0', borderRadius: '10px' }}></div>
      </header>

      {error && (
        <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#dc2626', boxShadow: 'none' }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {(() => {
        if (showSorteoUI) {
            return (
              <div className="glass-card animate-slide-up" style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                <Trophy size={64} color="#ec4899" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
                
                {sorteoStep === 1 && (
                    <>
                        <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>¡Sorteo Especial!</h3>
                        
                        {activeSorteo?.subtitulo && (
                            <h4 style={{ fontSize: '1.2rem', color: '#ec4899', marginBottom: '1rem', fontWeight: '500' }}>
                                {activeSorteo.subtitulo}
                            </h4>
                        )}

                        <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                            ¿Desea participar del sorteo vigente <b>"{activeSorteo?.nombre}"</b> de esta cámara?
                        </p>

                        {activeSorteo?.premios && (
                            <div style={{ 
                                background: 'rgba(236, 72, 153, 0.05)', 
                                border: '1px solid rgba(236, 72, 153, 0.2)', 
                                borderRadius: '12px', 
                                padding: '1.5rem', 
                                marginBottom: '2rem',
                                textAlign: 'left'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#ec4899', fontWeight: 'bold' }}>
                                    <Gift size={20} />
                                    <span>Premios en juego:</span>
                                </div>
                                <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                                    {activeSorteo.premios}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn btn-outline" onClick={() => {
                                setSorteoPrompted(true);
                                setShowSorteoUI(false);
                            }} style={{ width: '150px' }}>No, gracias</button>
                            <button className="btn btn-primary" onClick={() => setSorteoStep(2)} style={{ width: '150px', background: '#ec4899', borderColor: '#ec4899' }}>
                                ¡Sí, participar!
                            </button>
                        </div>
                    </>
                )}

                {sorteoStep === 2 && (
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        setIsSubmittingSorteo(true);
                        try {
                            await api.registrarParticipanteSorteo({
                                id_sorteo: activeSorteo.id,
                                id_camara: selectedCamaraId,
                                ...sorteoData
                            });
                            surveyLogger.navigation('sorteo_registered', { sorteoId: activeSorteo.id, camaraId: selectedCamaraId });
                            setSorteoPrompted(true);
                            setShowSorteoUI(false);
                            const Swal = (await import('sweetalert2')).default;
                            Swal.fire({ icon: 'success', title: '¡Inscrito!', text: 'Ya estás participando del sorteo. ¡Éxitos!', timer: 2500, showConfirmButton: false });
                        } catch (err) {
                            surveyLogger.error('sorteo_submit', err);
                            setError('Error al registrar en el sorteo: ' + (err.message || 'intentá de nuevo'));
                        } finally {
                            setIsSubmittingSorteo(false);
                        }
                    }} style={{ textAlign: 'left', display: 'grid', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>Tus Datos para el Sorteo</h3>
                        <div className="input-group">
                            <label>Nombre</label>
                            <input type="text" className="input-field" required value={sorteoData.nombre} onChange={e => setSorteoData({...sorteoData, nombre: e.target.value})} />
                        </div>
                        <div className="input-group">
                            <label>Apellido</label>
                            <input type="text" className="input-field" required value={sorteoData.apellido} onChange={e => setSorteoData({...sorteoData, apellido: e.target.value})} />
                        </div>
                        <div className="input-group">
                            <label>Domicilio</label>
                            <input type="text" className="input-field" required value={sorteoData.domicilio} onChange={e => setSorteoData({...sorteoData, domicilio: e.target.value})} />
                        </div>
                        <div className="input-group">
                            <label>Teléfono</label>
                            <input type="tel" className="input-field" required value={sorteoData.telefono} onChange={e => setSorteoData({...sorteoData, telefono: e.target.value})} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => {
                                setSorteoPrompted(true);
                                setShowSorteoUI(false);
                            }} disabled={isSubmittingSorteo}>Omitir</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#ec4899', borderColor: '#ec4899' }} disabled={isSubmittingSorteo}>
                                {isSubmittingSorteo ? 'Guardando...' : 'Guardar y Continuar'}
                            </button>
                        </div>
                    </form>
                )}
              </div>
            );
        }

        const startScreenQuestions = preguntas.filter(p => ['selector_localidad', 'selector_iva'].includes(p.tipo));
        const isStartScreenAnswered = startScreenQuestions.every(p => respuestas[p.id]?.valor_numerico || respuestas[p.id]?.valor_texto);
        
        if (currentIndex >= secciones.length) {
          surveyLogger.error('render', new Error(`currentIndex (${currentIndex}) fuera de rango, secciones.length=${secciones.length}`));
          return (
            <div className="glass-card" style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
              <AlertCircle size={48} color="#dc2626" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Error en la navegación</h3>
              <p style={{ color: 'var(--text-muted)' }}>La sección solicitada no está disponible. Por favor volvé al inicio.</p>
              <button className="btn btn-outline" style={{ marginTop: '1.5rem' }} onClick={() => { setCurrentIndex(-1); setHistory([]); }}>
                Volver al inicio
              </button>
            </div>
          );
        }

        return currentIndex === -1 ? (
          <div className="glass-card animate-slide-up" style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>Datos de Identificación</h3>
            <div style={{ display: 'grid', gap: '2rem' }}>
              
              {startScreenQuestions.map(q => {
                const isLocalidad = q.tipo === 'selector_localidad';
                const isIva = q.tipo === 'selector_iva';
                const opts = isLocalidad ? (localidades || []).map(l => ({ id: l.id, nombre: l.nombre })) :
                             isIva ? (ivas || []).map(i => ({ id: i.id, nombre: i.nombre })) :
                             (camaras || []).map(c => ({ id: c.id, nombre: c.nombre }));
                
                const icon = isLocalidad ? <ClipboardList size={20} color="var(--primary)" /> :
                             isIva ? <Building2 size={20} color="var(--primary)" /> :
                             <Building2 size={20} color="var(--primary)" />;
                
                const currentAns = respuestas[q.id];
                const selectedVal = currentAns?.valor_numerico || currentAns?.valor_texto || '';

                return (
                  <div key={q.id} className="input-group">
                    <label>{icon} {q.texto_pregunta}</label>
                    <select
                      value={selectedVal}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numVal = parseInt(val);
                        const isNum = !isNaN(numVal);
                        
                        const opt = isNum ? opts.find(o => o.id === numVal) : opts.find(o => o.nombre === val);
                        if (opt) {
                          handleAnswer(q.id, { opcion_id: null, valor_texto: opt.nombre, valor_numerico: opt.id });
                        } else {
                          handleAnswer(q.id, { opcion_id: null, valor_texto: '', valor_numerico: null });
                        }
                      }}
                      style={{ fontSize: '1.1rem', padding: '1rem' }}
                    >
                      <option value="">-- Seleccionar --</option>
                      {opts.map(opt => <option key={opt.id} value={opt.id}>{opt.nombre}</option>)}
                    </select>
                  </div>
                );
              })}

              <div className="input-group">
                <label><Calendar size={20} color="var(--primary)" /> Período a Informar</label>
                <select
                value={selectedPeriodo}
                onChange={(e) => setSelectedPeriodo(e.target.value)}
                style={{ fontSize: '1.1rem', padding: '1rem' }}
              >
                <option value="">-- Seleccionar Período --</option>
                {periodos.map(per => <option key={per.id} value={per.id}>{per.mes} de {per.anio}</option>)}
              </select>
            </div>

            <button
              className="btn btn-primary"
              style={{ padding: '1.2rem', fontSize: '1.1rem', marginTop: '1rem' }}
                disabled={!selectedPeriodo || !isStartScreenAnswered || secciones.length === 0}
              onClick={() => {
                if (activeSorteo && !sorteoPrompted) {
                    setShowSorteoUI(true);
                } else {
                    setHistory([-1]);
                    setCurrentIndex(0);
                }
              }}
            >
              Comenzar Encuesta <ChevronRight size={24} />
            </button>

            {secciones.length === 0 && !loading && (
              <p style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>
                * No hay preguntas configuradas para esta encuesta actualmente.
              </p>
            )}
          </div>
        </div>
      ) : currentIndex >= 0 && currentIndex < secciones.length ? (
        <div className="glass-card animate-slide-up" style={{ padding: '3rem', borderTop: `6px solid ${currentSection?.color || 'var(--primary)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              {isTerminalSection && (
                <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: '600' }}>
                  Última sección
                </span>
              )}
            </div>
            <div style={{ background: 'rgba(14, 165, 233, 0.1)', height: '6px', width: '200px', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ background: 'var(--primary)', height: '100%', borderRadius: '3px', width: isTerminalSection ? '100%' : `${((currentIndex + 1) / secciones.length) * 100}%`, transition: 'width 0.4s ease', boxShadow: '0 0 10px rgba(14, 165, 233, 0.3)' }}></div>
            </div>
          </div>

          {currentSection?.descripcion && <p style={{ marginBottom: '2rem', fontSize: '1.1rem', color: 'var(--text-muted)' }}>{currentSection.descripcion}</p>}

          <div style={{ display: 'grid', gap: '4rem', marginBottom: '3rem' }}>
            {(currentPreguntas || []).map(currentPregunta => {
              try {
              const isRepeater = currentPregunta?.texto_pregunta?.includes('{opciones_seleccionadas}') || false;
              let actividades = [];
              if (isRepeater) {
                actividades = getActividadSelections();
                if (actividades.length === 0) return null;
              } else {
                actividades = [{ id: null, texto: '' }];
              }

              return actividades.map(actividad => {
                const pId = currentPregunta?.id;
                const key = isRepeater ? `${pId}_${actividad.id}` : pId;
                const displayTitle = isRepeater
                  ? (currentPregunta?.texto_pregunta || '').replace('{opciones_seleccionadas}', actividad.texto)
                  : (currentPregunta?.texto_pregunta || '');

                const currentAns = isRepeater
                  ? (respuestas[pId]?.answers || []).find(a => String(a.subrubroId) === String(actividad.id))?.data
                  : respuestas[pId];

                const onAnswer = (data) => {
                  if (isRepeater) {
                    handleRepeaterAnswer(pId, actividad.id, actividad.texto, data);
                  } else {
                    handleAnswer(pId, data);
                  }
                };

                return (
                  <div key={key} className="question-block">
                    <div className="sticky-question-header">
                      <h2 className="question-title" style={{ margin: 0, color: 'var(--text-main)', lineHeight: '1.2', fontWeight: '700' }}>
                        {displayTitle}
                      </h2>
                      {currentPregunta.tipo === 'opcion_multiple' && (
                        <p style={{ color: 'var(--text-muted)', fontWeight: '500', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                          Puede seleccionar una o más opciones
                        </p>
                      )}
                    </div>

                    <div className="animate-fade-in" style={{ marginTop: '2rem' }}>
                      {currentPregunta.tipo === 'selector_rubro' && (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                            Si tiene dudas sobre qué rubro seleccionar, consulte la guía de actividades disponible en cada opción.
                          </p>
                          {(currentPregunta.opciones || []).map(opt => {
                            const rubroAns = currentAns || { isSectorRubro: true, opciones_ids: [], sectores_ids: [] };
                            const isSelected = rubroAns.opciones_ids?.includes(opt.id);

                            // Mapeo seguro de PDFs
                            const helpLinks = {
                              'comercio': 'https://cemisiones.com.ar/encuestas/ayuda/comercio.pdf',
                              'servicios': 'https://cemisiones.com.ar/encuestas/ayuda/servicios.pdf',
                              'industria': 'https://cemisiones.com.ar/encuestas/ayuda/industria.pdf',
                              'turismo': 'https://cemisiones.com.ar/encuestas/ayuda/turismo.pdf',
                              'producción': 'https://cemisiones.com.ar/encuestas/ayuda/produccion.pdf',
                              'produccion': 'https://cemisiones.com.ar/encuestas/ayuda/produccion.pdf'
                            };
                            const optTextLower = opt.texto.toLowerCase().trim();
                            const pdfUrl = helpLinks[optTextLower] || `https://cemisiones.com.ar/encuestas/ayuda/${optTextLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '')}.pdf`;

                            return (
                              <div
                                key={opt.id}
                                role="button"
                                tabIndex="0"
                                className={`btn-option ${isSelected ? 'selected' : ''}`}
                                style={{ borderLeft: `6px solid ${opt.color || 'var(--primary)'}`, display: 'flex', textAlign: 'left', cursor: 'pointer', outline: 'none' }}
                                onClick={() => {
                                  if (isSelected) {
                                    onAnswer({
                                      isSectorRubro: true,
                                      opciones_ids: [],
                                      sectores_ids: []
                                    });
                                  } else {
                                    onAnswer({
                                      isSectorRubro: true,
                                      opciones_ids: [opt.id],
                                      sectores_ids: opt.sector_id ? [opt.sector_id] : []
                                    });
                                  }
                                }}
                              >
                                <div className="option-indicator" style={{ borderRadius: '50%' }}>
                                  <div className="option-indicator-inner" style={{ borderRadius: '50%' }}></div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'space-between', width: '100%' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{opt.texto}</div>
                                    {!opt.sector_id && <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>⚠ Sin sector asignado</div>}
                                  </div>

                                  <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-ayuda"
                                    title={`Consulte aquí las actividades incluidas en ${opt.texto}.`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    ?
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {['opcion_unica', 'selector_camara', 'selector_localidad', 'selector_iva'].includes(currentPregunta.tipo) && (
                        (() => {
                          const isCamara = currentPregunta.tipo === 'selector_camara';
                          const isLocalidad = currentPregunta.tipo === 'selector_localidad';
                          const isIva = currentPregunta.tipo === 'selector_iva';
                          const isDynamic = isCamara || isLocalidad || isIva;
                          
                          let optsToRender = currentPregunta.opciones || [];
                          if (isCamara) optsToRender = camaras.map(c => ({ id: c.id, texto: c.nombre }));
                          if (isLocalidad) optsToRender = localidades.map(l => ({ id: l.id, texto: l.nombre }));
                          if (isIva) optsToRender = ivas.map(i => ({ id: i.id, texto: i.nombre }));

                          const forceDesplegable = currentPregunta.estilo === 'desplegable';
                          const forceBotones = currentPregunta.estilo === 'botones';
                          const useDesplegable = forceDesplegable || (!forceBotones && optsToRender.length > 6);
                          
                          return useDesplegable ? (
                            <div className="input-group animate-fade-in" style={{ maxWidth: '100%' }}>
                              <select
                                value={isDynamic ? (currentAns?.valor_texto || '') : (currentAns?.opcion_id || '')}
                                onChange={(e) => {
                                  if (isDynamic) {
                                    const opt = optsToRender.find(o => o.texto === e.target.value);
                                    if (opt) onAnswer({ opcion_id: null, valor_texto: opt.texto, valor_numerico: opt.id });
                                  } else {
                                    const opt = optsToRender.find(o => o.id === parseInt(e.target.value));
                                    if (opt) onAnswer({ opcion_id: opt.id, valor_texto: opt.texto, siguiente_seccion_id: opt.siguiente_seccion_id });
                                  }
                                }}
                                style={{
                                  fontSize: '1.2rem',
                                  padding: '1.2rem',
                                  width: '100%',
                                  borderRadius: '12px',
                                  border: '1px solid var(--glass-border)',
                                  background: 'white',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="">-- Seleccionar una opción --</option>
                                {optsToRender.map(opt => (
                                  <option key={opt.id} value={isDynamic ? opt.texto : opt.id}>{opt.texto}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                              {optsToRender.map(opt => {
                                const isSelected = isDynamic ? (currentAns?.valor_texto === opt.texto) : (currentAns?.opcion_id === opt.id);
                                return (
                                  <button
                                    key={opt.id}
                                    className={`btn-option ${isSelected ? 'selected' : ''}`}
                                    onClick={() => {
                                      if (isDynamic) {
                                        onAnswer({ opcion_id: null, valor_texto: opt.texto, valor_numerico: opt.id });
                                      } else {
                                        onAnswer({
                                          opcion_id: opt.id,
                                          valor_texto: opt.texto,
                                          siguiente_seccion_id: opt.siguiente_seccion_id
                                        });
                                      }
                                    }}
                                  >
                                    <div className="option-indicator">
                                      <div className="option-indicator-inner"></div>
                                    </div>
                                    {opt.texto}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()
                      )}

                      {currentPregunta.tipo === 'opcion_multiple' && (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                          {(currentPregunta.opciones || []).map(opt => {
                            const isSelected = currentAns?.opciones_ids?.includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                className={`btn-option ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  const existing = currentAns?.opciones_ids || [];
                                  let newOpciones;
                                  if (isSelected) {
                                    newOpciones = existing.filter(id => id !== opt.id);
                                  } else {
                                    newOpciones = [...existing, opt.id];
                                  }
                                  onAnswer({ opciones_ids: newOpciones, siguiente_seccion_id: opt.siguiente_seccion_id });
                                }}
                              >
                                <div className="checkbox-indicator" style={{
                                  width: '24px', height: '24px', borderRadius: '6px', border: '2px solid var(--glass-border)',
                                  marginRight: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: isSelected ? 'var(--primary)' : 'white',
                                  borderColor: isSelected ? 'var(--primary)' : 'var(--glass-border)',
                                  transition: 'all 0.2s'
                                }}>
                                  {isSelected && <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </div>
                                {opt.texto}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {currentPregunta.tipo === 'numero' && (
                        <div className="input-group animate-fade-in" style={{ maxWidth: '300px' }}>
                          <input
                            type="number"
                            className="input-field"
                            placeholder="Ingrese un número"
                            value={currentAns?.valor_numerico || ''}
                            onChange={(e) => onAnswer({ valor_numerico: e.target.value })}
                            style={{ fontSize: '1.5rem', textAlign: 'center', padding: '1.5rem' }}
                          />
                        </div>
                      )}

                      {currentPregunta.tipo === 'texto_corto' && (
                        <div className="input-group animate-fade-in">
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Escriba su respuesta aquí..."
                            value={currentAns?.valor_texto || ''}
                            onChange={(e) => onAnswer({ valor_texto: e.target.value })}
                            style={{ padding: '1.2rem', fontSize: '1.1rem' }}
                          />
                        </div>
                      )}

                      {currentPregunta.tipo === 'texto_largo' && (
                        <div className="input-group animate-fade-in">
                          <textarea
                            className="input-field"
                            placeholder="Escriba su respuesta aquí..."
                            rows="4"
                            value={currentAns?.valor_texto || ''}
                            onChange={(e) => onAnswer({ valor_texto: e.target.value })}
                            style={{ resize: 'vertical', minHeight: '120px', padding: '1.2rem', fontSize: '1.1rem' }}
                          />
                        </div>
                      )}

                      {currentPregunta.tipo === 'texto' && (
                        <textarea
                          className="input-group"
                          style={{ width: '100%', minHeight: '150px', background: 'white', color: 'var(--text-main)', padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                          placeholder="Escriba su respuesta aquí..."
                          value={currentAns?.valor_texto || ''}
                          onChange={(e) => onAnswer({ valor_texto: e.target.value })}
                        />
                      )}

                      {currentPregunta.tipo === 'email' && (
                        <div>
                          <input
                            type="email"
                            className="input-group"
                            style={{
                              width: '100%', padding: '1rem', background: 'white',
                              color: 'var(--text-main)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: '12px', fontSize: '1.1rem'
                            }}
                            placeholder="ejemplo@correo.com"
                            value={currentAns?.valor_texto || ''}
                            onChange={(e) => onAnswer({ valor_texto: e.target.value })}
                          />
                        </div>
                      )}

                      {currentPregunta.tipo === 'cuadricula' && (
                        <div className="grid-container animate-fade-in" style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: 'var(--text-main)' }}>Opción</th>
                                {(currentPregunta.opciones || []).map(opt => (
                                  <th key={opt.id} style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: 'var(--text-main)' }}>{opt.texto}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(currentPregunta.filas || '').split(',').map((fila, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                  <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--text-main)' }}>{fila.trim()}</td>
                                  {(currentPregunta.opciones || []).map(opt => (
                                    <td key={opt.id} style={{ padding: '1rem', textAlign: 'center' }}>
                                      <input
                                        type="radio"
                                        name={`grid_${key}_${idx}`}
                                        checked={currentAns?.answers?.find(a => a.row === fila.trim())?.opcion_id === opt.id || false}
                                        onChange={() => {
                                          const existingAnswers = currentAns?.answers || [];
                                          const newAnswers = existingAnswers.filter(a => a.row !== fila.trim());
                                          newAnswers.push({ row: fila.trim(), opcion_id: opt.id });
                                          onAnswer({ isGrid: true, answers: newAnswers });
                                        }}
                                        style={{ transform: 'scale(1.2)' }}
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                    </div>
                  </div>
                );
              });
            } catch (err) {
              surveyLogger.error('render_pregunta', err);
              return (
                <div key={currentPregunta?.id || 'error'} className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#dc2626' }}>
                    <AlertCircle size={20} />
                    <span>Error al mostrar esta pregunta. {/*currentPregunta?.texto_pregunta || 'Pregunta desconocida'*/}</span>
                  </div>
                </div>
              );
            }
          })}
          </div>

          <div className="action-buttons" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <button
              className="btn btn-outline"
              disabled={currentIndex < 0}
              onClick={handlePrev}
            >
              <ChevronLeft size={20} /> Anterior
            </button>

            {isTerminalSection ? (
              <button
                className="btn btn-secondary"
                onClick={handleSubmit}
                disabled={loading || (currentPreguntas || []).some(p => {
                  if (!p) return false;
                  const ans = respuestas[p.id];
                  if (p.tipo === 'numero') return false; // numeric questions are optional, user can pass anyway
                  // email: check if there is a sibling SI/NO answered NO — if so, email is not required
                  if (p.tipo === 'email') {
                    const siblingYesNo = currentPreguntas.find(s => s && s.id !== p.id && s.tipo === 'opcion_unica');
                    const siblingAns = siblingYesNo ? respuestas[siblingYesNo.id] : null;
                    const respondedNo = siblingAns && siblingAns.valor_texto?.toLowerCase().trim() === 'no';
                    if (respondedNo) return false; // not required
                    const emailVal = ans?.valor_texto || '';
                    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
                    return !isValid; // block if not valid
                  }
                  if (!ans) return true;
                  if (p.tipo === 'cuadricula') return (ans.answers || []).length === 0;
                  return false;
                })}
              >
                <Send size={20} /> {loading ? 'Enviando...' : 'Finalizar Encuesta'}
              </button>
            ) : (
              <button
                className="btn btn-primary"
                disabled={(currentPreguntas || []).some(p => {
                  if (!p) return false;
                  const ans = respuestas[p.id];
                  if (p.tipo === 'numero') return false; // numeric questions are optional, user can pass anyway
                  // email: check if there is a sibling SI/NO answered NO — if so, email is not required
                  if (p.tipo === 'email') {
                    const siblingYesNo = currentPreguntas.find(s => s && s.id !== p.id && s.tipo === 'opcion_unica');
                    const siblingAns = siblingYesNo ? respuestas[siblingYesNo.id] : null;
                    const respondedNo = siblingAns && siblingAns.valor_texto?.toLowerCase().trim() === 'no';
                    if (respondedNo) return false; // not required
                    const emailVal = ans?.valor_texto || '';
                    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
                    return !isValid; // block if not valid
                  }
                  if (!ans) return true;
                  if (p.tipo === 'cuadricula') return (ans.answers || []).length === 0;
                  return false;
                })}
                onClick={handleNext}
              >
                Siguiente <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card animate-slide-up" style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <CheckCircle2 size={64} color="#10b981" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-main)' }}>¡Encuesta completada con éxito!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '2rem' }}>Sus respuestas han sido registradas. Muchas gracias por su tiempo.</p>
        </div>
      );
      })()}

      {preguntas.length === 0 && !loading && (
        <div className="glass-card text-center" style={{ padding: '4rem' }}>
          <ClipboardList size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p style={{ opacity: 0.6 }}>No hay preguntas configuradas para esta encuesta o cámara.</p>
        </div>
      )}
    </div>
  );
}
