import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Trash2, Edit3, Save, X, Settings, ListPlus, Type, HelpCircle, Database, Building, Copy, Calendar, ClipboardList, Eye, EyeOff, Share2, Link2, BookOpen, UploadCloud, ArrowUp, ArrowDown, Folder, Users, UserPlus } from 'lucide-react';
import Swal from 'sweetalert2';
import ImportManager from '../components/ImportManager';
import SorteosManager from '../components/SorteosManager';

export default function Admin() {
  const [encuestas, setEncuestas] = useState([]);
  const [selectedEncuesta, setSelectedEncuesta] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [isEditingSeccion, setIsEditingSeccion] = useState(false);
  const [editingSeccion, setEditingSeccion] = useState({ titulo: "", descripcion: "", orden: 0, sector_id: null, color: "#94a3b8", siguiente_seccion_id: null });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('surveys'); // 'surveys', 'periods', 'questions', 'banco'
  const [auxData, setAuxData] = useState({ localidades: [], camaras: [], ivas: [], rubros: [] });
  const [bancoPreguntas, setBancoPreguntas] = useState([]);
  const [isEditingBanco, setIsEditingBanco] = useState(false);
  const [editingBanco, setEditingBanco] = useState({ texto_pregunta: '', tipo: 'opcion_unica', orden: 0, categoria: '', opciones: [] });
  const [filtroCat, setFiltroCat] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [targetSeccionForBank, setTargetSeccionForBank] = useState(null);

  const [newSurvey, setNewSurvey] = useState({ titulo: '', descripcion: '' });
  const [editingSurvey, setEditingSurvey] = useState(null); // ID de la encuesta que se está editando
  const [tempSurveyData, setTempSurveyData] = useState({ titulo: '', descripcion: '' });
  const [newPeriod, setNewPeriod] = useState({ mes: new Date().getMonth() + 1, anio: new Date().getFullYear() });
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState({ texto_pregunta: '', tipo: 'opcion_unica', orden: 0, opciones: [] });

  const [highlightedQuestionId, setHighlightedQuestionId] = useState(null);
  const [highlightedSeccionId, setHighlightedSeccionId] = useState(null);
  const [highlightedBancoId, setHighlightedBancoId] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUser, setEditingUser] = useState({ usuario: '', password: '', nombre: '', rol: 'admin', estado: 1 });

  useEffect(() => {
    if (highlightedQuestionId) {
      const timer = setTimeout(() => setHighlightedQuestionId(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [highlightedQuestionId]);

  useEffect(() => {
    if (highlightedSeccionId) {
      const timer = setTimeout(() => setHighlightedSeccionId(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [highlightedSeccionId]);

  useEffect(() => {
    if (highlightedBancoId) {
      const timer = setTimeout(() => setHighlightedBancoId(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [highlightedBancoId]);

  useEffect(() => {
    loadInitialData();
  }, []);


  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [eData, aData] = await Promise.all([
        api.getEncuestas(),
        api.getAuxData()
      ]);
      setEncuestas(eData);
      setAuxData(aData);
      if (eData.length > 0 && !selectedEncuesta) handleSelectEncuesta(eData[0]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEncuesta = async (encuesta) => {
    setSelectedEncuesta(encuesta);
    try {
      const [pData, qData, sData, secData] = await Promise.all([
        api.getPeriodos(encuesta.id),
        api.getPreguntas(encuesta.id),
        api.getSecciones(encuesta.id),
        api.getSectores()
      ]);
      setPeriodos(pData);
      setPreguntas(qData);
      setSecciones(sData);
      setSectores(secData);
    } catch (error) {
      console.error('Error loading survey details:', error);
    }
  };

  const handleCreateSurvey = async () => {
    if (!newSurvey.titulo || loading) return;
    try {
      const res = await api.createEncuesta(newSurvey);
      const newId = res.id;
      setNewSurvey({ titulo: '', descripcion: '' });

      // Refrescar y seleccionar la nueva
      const eData = await api.getEncuestas();
      setEncuestas(eData);

      const createdSurvey = eData.find(e => e.id === newId);
      if (createdSurvey) {
        handleSelectEncuesta(createdSurvey);
        setTab('questions'); // Ir a Lógica directamente
      }

      Swal.fire({
        icon: 'success',
        title: 'Encuesta Creada',
        text: 'Comenzá a añadir preguntas desde el banco o creá nuevas.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al crear encuesta',
        text: error.message,
        confirmButtonColor: '#1d4ed8'
      });
    }
  };

  const handleDeleteSurvey = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Se borrarán todos los datos relacionados (respuestas, preguntas, etc). Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar encuesta',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await api.deleteEncuesta(id);
      if (selectedEncuesta?.id === id) setSelectedEncuesta(null);
      loadInitialData();
      Swal.fire({
        icon: 'success',
        title: 'Eliminada',
        text: 'La encuesta ha sido eliminada correctamente.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: error.message
      });
    }
  };

  const handleDuplicate = async (id) => {
    try {
      Swal.fire({
        title: 'Duplicando...',
        text: 'Espere un momento por favor',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await api.duplicateEncuesta(id);
      loadInitialData();

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Encuesta duplicada con todas sus secciones y lógica.',
        confirmButtonColor: '#10b981'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al duplicar',
        text: error.message
      });
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await api.updateEncuestaStatus(id, newStatus);
      loadInitialData();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el estado: ' + error.message
      });
    }
  };

  const handleUpdateSurvey = async () => {
    try {
      if (!tempSurveyData.titulo.trim()) return;
      await api.updateEncuesta(editingSurvey, tempSurveyData);
      setEditingSurvey(null);
      loadInitialData();
      Swal.fire({
        icon: 'success',
        title: 'Encuesta Actualizada',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    }
  };

  const handleAddCamara = async () => {
    const { value: nombre } = await Swal.fire({
      title: 'Nueva Cámara o Asociación',
      input: 'text',
      inputLabel: 'Nombre de la entidad',
      placeholder: 'Ej: Cámara de Comercio de...',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) return 'Debes escribir un nombre';
      }
    });

    if (nombre) {
      try {
        await api.createCamara({ nombre });
        loadInitialData();
        Swal.fire('¡Guardado!', 'La cámara ha sido agregada.', 'success');
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  const handleEditCamara = async (cam) => {
    const { value: nombre } = await Swal.fire({
      title: 'Editar Cámara',
      input: 'text',
      inputLabel: 'Nombre de la entidad',
      inputValue: cam.nombre,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) return 'Debes escribir un nombre';
      }
    });

    if (nombre && nombre !== cam.nombre) {
      try {
        await api.updateCamara(cam.id, { nombre });
        loadInitialData();
        Swal.fire('¡Actualizado!', 'La cámara ha sido modificada.', 'success');
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  const handleDeleteCamara = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar Cámara?',
      text: "Asegurate de que no haya respuestas vinculadas a esta cámara.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.deleteCamara(id);
        loadInitialData();
        Swal.fire('Eliminado', 'La cámara ha sido borrada.', 'success');
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  const handleSaveSeccion = async () => {
    const currentScroll = window.scrollY;
    try {
      let sId = editingSeccion.id;
      if (!sId) {
        const res = await api.createSeccion({ ...editingSeccion, encuesta_id: selectedEncuesta.id });
        sId = res.id;
      } else {
        await api.updateSeccion(sId, editingSeccion);
      }
      setIsEditingSeccion(false);
      await handleSelectEncuesta(selectedEncuesta);

      if (sId) {
        setHighlightedSeccionId(sId);
      }

      Swal.fire({
        icon: 'success',
        title: 'Sección guardada',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        window.scrollTo(0, currentScroll);
        setTimeout(() => window.scrollTo(0, currentScroll), 50);
        setTimeout(() => {
          window.scrollTo(0, currentScroll);
          if (sId) {
            const el = document.getElementById(`seccion-${sId}`) || document.getElementById(`seccion-group-${sId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 150);
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message
      });
    }
  };

  const handleDeleteSeccion = async (id) => {
    const currentScroll = window.scrollY;
    const result = await Swal.fire({
      title: '¿Eliminar sección?',
      text: "Se borrarán las preguntas vinculadas a esta sección.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await api.deleteSeccion(id);
      await handleSelectEncuesta(selectedEncuesta);
      window.scrollTo(0, currentScroll);
      setTimeout(() => window.scrollTo(0, currentScroll), 50);
      setTimeout(() => window.scrollTo(0, currentScroll), 150);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message }).then(() => {
        window.scrollTo(0, currentScroll);
        setTimeout(() => window.scrollTo(0, currentScroll), 50);
        setTimeout(() => window.scrollTo(0, currentScroll), 150);
      });
    }
  };

  const handleCreatePeriod = async () => {
    if (!selectedEncuesta) return;
    try {
      await api.createPeriodo({ ...newPeriod, encuesta_id: selectedEncuesta.id });
      handleSelectEncuesta(selectedEncuesta);
      Swal.fire({
        icon: 'success',
        title: '¡Periodo Abierto!',
        text: 'Ya se pueden recibir respuestas para este mes.',
        confirmButtonColor: '#1d4ed8'
      });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    }
  };

  const handleDeletePeriod = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar período?',
      text: "¡Atención! Se borrarán permanentemente TODAS las respuestas registradas en este mes/año.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, borrar todo',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await api.deletePeriodo(id);
      handleSelectEncuesta(selectedEncuesta);
      Swal.fire({ icon: 'success', title: 'Eliminado', text: 'El período y sus datos fueron borrados.' });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    }
  };

  const handleSaveQuestion = async () => {
    const currentScroll = window.scrollY;
    try {
      const questionData = {
        ...editingQuestion,
        categoria: editingQuestion.categoria?.trim() || null
      };

      let qId = editingQuestion.id;
      if (!qId) {
        const res = await api.createPregunta({ ...questionData, encuesta_id: selectedEncuesta.id });
        qId = res.id;
      } else {
        await api.updatePregunta(qId, questionData);
      }

      await api.updateOpciones(qId, editingQuestion.opciones);

      const catName = editingQuestion.categoria?.trim();
      if (catName && editingQuestion.color_temporal) {
        const existingSector = sectores.find(s => s.nombre.toLowerCase() === catName.toLowerCase());
        if (existingSector) {
          await api.updateSector(existingSector.id, { ...existingSector, color: editingQuestion.color_temporal });
        } else {
          await api.createSector({ nombre: catName, color: editingQuestion.color_temporal, orden: sectores.length });
        }
      }

      setIsEditingQuestion(false);
      await handleSelectEncuesta(selectedEncuesta);

      if (qId) {
        setHighlightedQuestionId(qId);
      }

      Swal.fire({
        icon: 'success',
        title: 'Pregunta guardada',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        window.scrollTo(0, currentScroll);
        setTimeout(() => window.scrollTo(0, currentScroll), 50);
        setTimeout(() => {
          window.scrollTo(0, currentScroll);
          if (qId) {
            const el = document.getElementById(`pregunta-${qId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 150);
      });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    }
  };

  const handleDeleteQuestion = async (id) => {
    const currentScroll = window.scrollY;
    const result = await Swal.fire({
      title: '¿Qué desea hacer?',
      text: '¿Querés quitar la pregunta de esta encuesta (desvincular) o eliminarla permanentemente del banco?',
      icon: 'warning',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonColor: '#f59e0b',
      denyButtonColor: '#dc2626',
      confirmButtonText: 'Solo desvincular',
      denyButtonText: 'Eliminar permanentemente',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.desvincularPregunta(selectedEncuesta.id, id);
        await handleSelectEncuesta(selectedEncuesta);
        Swal.fire({ icon: 'success', title: 'Desvinculada', timer: 1000, showConfirmButton: false }).then(() => {
          window.scrollTo(0, currentScroll);
          setTimeout(() => window.scrollTo(0, currentScroll), 50);
          setTimeout(() => window.scrollTo(0, currentScroll), 150);
        });
      } catch (err) {
        Swal.fire('Error', err.message, 'error').then(() => {
          window.scrollTo(0, currentScroll);
          setTimeout(() => window.scrollTo(0, currentScroll), 50);
          setTimeout(() => window.scrollTo(0, currentScroll), 150);
        });
      }
    } else if (result.isDenied) {
      try {
        await api.deletePregunta(id);
        await handleSelectEncuesta(selectedEncuesta);
        Swal.fire({ icon: 'success', title: 'Eliminada del Banco', timer: 1000, showConfirmButton: false }).then(() => {
          window.scrollTo(0, currentScroll);
          setTimeout(() => window.scrollTo(0, currentScroll), 50);
          setTimeout(() => window.scrollTo(0, currentScroll), 150);
        });
      } catch (err) {
        Swal.fire('Error', err.message, 'error').then(() => {
          window.scrollTo(0, currentScroll);
          setTimeout(() => window.scrollTo(0, currentScroll), 50);
          setTimeout(() => window.scrollTo(0, currentScroll), 150);
        });
      }
    }
  };

  const handleMoveQuestion = async (pregunta, direction) => {
    const currentScroll = window.scrollY;
    const secQuestions = preguntas
      .filter(q => q.seccion_id === pregunta.seccion_id)
      .sort((a, b) => a.orden - b.orden);

    const currentIndex = secQuestions.findIndex(q => q.id === pregunta.id);
    if (currentIndex === -1) return;

    let targetIndex = -1;
    if (direction === 'up' && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < secQuestions.length - 1) {
      targetIndex = currentIndex + 1;
    }

    if (targetIndex === -1) return;

    const targetPregunta = secQuestions[targetIndex];
    const tempOrden = pregunta.orden;
    const newPreguntaOrden = targetPregunta.orden;
    const newTargetOrden = tempOrden;

    Swal.fire({
      title: 'Reordenando...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await Promise.all([
        api.vincularPregunta(selectedEncuesta.id, {
          pregunta_id: pregunta.id,
          seccion_id: pregunta.seccion_id,
          orden: newPreguntaOrden
        }),
        api.vincularPregunta(selectedEncuesta.id, {
          pregunta_id: targetPregunta.id,
          seccion_id: targetPregunta.seccion_id,
          orden: newTargetOrden
        })
      ]);

      await handleSelectEncuesta(selectedEncuesta);
      Swal.close();
      window.scrollTo(0, currentScroll);
      setTimeout(() => window.scrollTo(0, currentScroll), 50);
      setTimeout(() => window.scrollTo(0, currentScroll), 150);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al mover pregunta',
        text: error.message
      }).then(() => {
        window.scrollTo(0, currentScroll);
        setTimeout(() => window.scrollTo(0, currentScroll), 50);
        setTimeout(() => window.scrollTo(0, currentScroll), 150);
      });
    }
  };

  const handleMoveSeccion = async (seccion, direction) => {
    const currentScroll = window.scrollY;
    const sorted = [...secciones].sort((a, b) => a.orden - b.orden);
    const currentIdx = sorted.findIndex(s => s.id === seccion.id);
    if (currentIdx === -1) return;

    let targetIdx = -1;
    if (direction === 'up' && currentIdx > 0) targetIdx = currentIdx - 1;
    else if (direction === 'down' && currentIdx < sorted.length - 1) targetIdx = currentIdx + 1;
    if (targetIdx === -1) return;

    const targetSeccion = sorted[targetIdx];
    Swal.fire({ title: 'Reordenando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      await Promise.all([
        api.updateSeccion(seccion.id, { ...seccion, orden: targetSeccion.orden }),
        api.updateSeccion(targetSeccion.id, { ...targetSeccion, orden: seccion.orden })
      ]);
      await handleSelectEncuesta(selectedEncuesta);
      Swal.close();
      window.scrollTo(0, currentScroll);
      setTimeout(() => window.scrollTo(0, currentScroll), 50);
      setTimeout(() => window.scrollTo(0, currentScroll), 150);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error al mover sección', text: error.message }).then(() => {
        window.scrollTo(0, currentScroll);
        setTimeout(() => window.scrollTo(0, currentScroll), 50);
        setTimeout(() => window.scrollTo(0, currentScroll), 150);
      });
    }
  };

  const handlePickFromBank = async (preguntaId) => {
    const currentScroll = window.scrollY;
    try {
      await api.vincularPregunta(selectedEncuesta.id, {
        pregunta_id: preguntaId,
        seccion_id: targetSeccionForBank,
        orden: preguntas.filter(q => q.seccion_id === targetSeccionForBank).length + 1
      });
      setShowBankPicker(false);
      await handleSelectEncuesta(selectedEncuesta);

      Swal.fire({
        icon: 'success',
        title: 'Añadida a la encuesta',
        timer: 1000,
        showConfirmButton: false
      }).then(() => {
        window.scrollTo(0, currentScroll);
        setTimeout(() => window.scrollTo(0, currentScroll), 50);
        setTimeout(() => window.scrollTo(0, currentScroll), 150);
      });
    } catch (err) { Swal.fire('Error', err.message, 'error'); }
  };

  const handleAddLocalidad = async () => {
    const { value: name } = await Swal.fire({
      title: 'Nueva Localidad',
      input: 'text',
      inputLabel: 'Nombre de la localidad',
      inputPlaceholder: 'Ej: Posadas',
      showCancelButton: true,
      confirmButtonColor: '#1d4ed8',
    });

    if (name) {
      try {
        await api.createLocalidad({ nombre: name });
        loadInitialData();
        Swal.fire({ icon: 'success', title: 'Agregado', timer: 1500 });
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message });
      }
    }
  };

  const handleDeleteLocalidad = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar localidad?',
      text: "Atención: Asegúrese que no haya respuestas vinculadas a esta localidad.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      try {
        await api.deleteLocalidad(id);
        loadInitialData();
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500 });
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message });
      }
    }
  };

  const loadBancoPreguntas = async () => {
    try {
      const data = await api.getBancoPreguntas();
      setBancoPreguntas(data);
    } catch (err) { console.error('Error loading banco:', err); }
  };

  const loadUsuarios = async () => {
    try {
      const data = await api.getUsuarios();
      setUsuarios(data);
    } catch (err) { console.error('Error loading users:', err); }
  };

  const handleSaveUser = async () => {
    try {
      if (!editingUser.id) {
        await api.createUsuario(editingUser);
      } else {
        await api.updateUsuario(editingUser.id, editingUser);
      }
      setIsEditingUser(false);
      loadUsuarios();
      Swal.fire({ icon: 'success', title: 'Guardado', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
  };

  const handleDeleteUser = async (id) => {
    const result = await Swal.fire({ title: '¿Eliminar usuario?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar' });
    if (result.isConfirmed) {
      try {
        await api.deleteUsuario(id);
        loadUsuarios();
      } catch (err) { Swal.fire({ icon: 'error', title: 'Error', text: err.message }); }
    }
  };

  const handleSaveBanco = async () => {
    const currentScroll = window.scrollY;
    try {
      const bankData = {
        ...editingBanco,
        categoria: editingBanco.categoria?.trim() || null
      };

      let qId = editingBanco.id;
      if (!qId) {
        const res = await api.createBancoPregunta(bankData);
        qId = res.id;
      } else {
        await api.updateBancoPregunta(qId, bankData);
      }
      if (['opcion_unica', 'opcion_multiple', 'cuadricula'].includes(editingBanco.tipo)) {
        await api.updateOpciones(qId, editingBanco.opciones);
      }

      const catName = editingBanco.categoria?.trim();
      if (catName && editingBanco.color_temporal) {
        const existingSector = sectores.find(s => s.nombre.toLowerCase() === catName.toLowerCase());
        if (existingSector) {
          await api.updateSector(existingSector.id, { ...existingSector, color: editingBanco.color_temporal });
        } else {
          await api.createSector({ nombre: catName, color: editingBanco.color_temporal, orden: sectores.length });
        }
        const secData = await api.getSectores();
        setSectores(secData);
      }

      setIsEditingBanco(false);
      await loadBancoPreguntas();

      if (qId) {
        setHighlightedBancoId(qId);
      }

      Swal.fire({
        icon: 'success',
        title: 'Pregunta guardada',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        window.scrollTo(0, currentScroll);
        setTimeout(() => window.scrollTo(0, currentScroll), 50);
        setTimeout(() => {
          window.scrollTo(0, currentScroll);
          if (qId) {
            const el = document.getElementById(`banco-pregunta-${qId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 150);
      });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message });
    }
  };

  const handleDeleteBanco = async (id) => {
    const currentScroll = window.scrollY;
    const result = await Swal.fire({
      title: '¿Eliminar pregunta del banco?',
      text: 'Se eliminará la pregunta y sus opciones permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;
    try {
      await api.deleteBancoPregunta(id);
      await loadBancoPreguntas();
      Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1500, showConfirmButton: false }).then(() => {
        window.scrollTo(0, currentScroll);
        setTimeout(() => window.scrollTo(0, currentScroll), 50);
        setTimeout(() => window.scrollTo(0, currentScroll), 150);
      });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.message }).then(() => {
        window.scrollTo(0, currentScroll);
        setTimeout(() => window.scrollTo(0, currentScroll), 50);
        setTimeout(() => window.scrollTo(0, currentScroll), 150);
      });
    }
  };

  const TIPO_REQUIERE_OPCIONES = ['opcion_unica', 'opcion_multiple', 'cuadricula', 'selector_rubro', 'selector_camara', 'selector_localidad', 'selector_iva'];

  const handleQuestionTipoChange = async (newTipo) => {
    const oldTipo = editingQuestion.tipo;
    const oldRequiere = TIPO_REQUIERE_OPCIONES.includes(oldTipo);
    const newRequiere = TIPO_REQUIERE_OPCIONES.includes(newTipo);
    const tieneOpciones = editingQuestion.opciones && editingQuestion.opciones.length > 0;

    if (tieneOpciones && oldRequiere && !newRequiere) {
      const result = await Swal.fire({
        title: '¿Cambiar tipo de respuesta?',
        text: 'Si cambias a un tipo que no requiere opciones (como Texto o Escala), se eliminarán permanentemente todas las opciones de respuesta cargadas.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, cambiar y borrar opciones',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        setEditingQuestion(prev => ({ ...prev, tipo: newTipo, opciones: [] }));
      }
    } else {
      setEditingQuestion(prev => ({ ...prev, tipo: newTipo }));
    }
  };

  const handleBancoTipoChange = async (newTipo) => {
    const oldTipo = editingBanco.tipo;
    const oldRequiere = TIPO_REQUIERE_OPCIONES.includes(oldTipo);
    const newRequiere = TIPO_REQUIERE_OPCIONES.includes(newTipo);
    const tieneOpciones = editingBanco.opciones && editingBanco.opciones.length > 0;

    if (tieneOpciones && oldRequiere && !newRequiere) {
      const result = await Swal.fire({
        title: '¿Cambiar tipo de respuesta?',
        text: 'Si cambias a un tipo que no requiere opciones (como Texto o Escala), se eliminarán permanentemente todas las opciones cargadas en esta pregunta del banco.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, cambiar y borrar opciones',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        setEditingBanco(prev => ({ ...prev, tipo: newTipo, opciones: [] }));
      }
    } else {
      setEditingBanco(prev => ({ ...prev, tipo: newTipo }));
    }
  };

  return (
    <>
      <div className="container animate-fade-in" style={{ maxWidth: '1300px' }}>
        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem' }}>Panel de Gestión</h1>
            <p style={{ color: 'var(--text-muted)' }}>Administración integral del sistema de encuestas</p>
          </div>
          <div></div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
          {/* Sidebar: Lista de Encuestas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardList size={20} color="var(--primary)" /> Mis Encuestas
              </h3>

              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <input
                  className="input-group"
                  style={{ padding: '0.8rem', fontSize: '0.9rem', marginBottom: 0 }}
                  placeholder="Nuevo Título..."
                  value={newSurvey.titulo}
                  onChange={e => setNewSurvey({ ...newSurvey, titulo: e.target.value })}
                />
                <button className="btn btn-primary" onClick={handleCreateSurvey} style={{ width: '100%' }}>
                  <Plus size={18} /> Crear Encuesta
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {encuestas.map(e => (
                  <div
                    key={e.id}
                    onClick={() => handleSelectEncuesta(e)}
                    className={`glass-card ${selectedEncuesta?.id === e.id ? 'active' : ''}`}
                    style={{
                      padding: '1rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      border: selectedEncuesta?.id === e.id ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                      background: selectedEncuesta?.id === e.id ? 'rgba(14, 165, 233, 0.05)' : 'white',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      {editingSurvey === e.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }} onClick={(evt) => evt.stopPropagation()}>
                          <input
                            className="input-group"
                            style={{ padding: '0.4rem', fontSize: '0.85rem', marginBottom: 0 }}
                            value={tempSurveyData.titulo}
                            onChange={e => setTempSurveyData({ ...tempSurveyData, titulo: e.target.value })}
                            autoFocus
                          />
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}
                              onClick={handleUpdateSurvey}
                            >Guardar</button>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}
                              onClick={() => setEditingSurvey(null)}
                            >Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {e.titulo}
                            <button
                              className="btn-icon"
                              style={{ padding: 0, opacity: 0.5 }}
                              title="Editar nombre"
                              onClick={(evt) => {
                                evt.stopPropagation();
                                setEditingSurvey(e.id);
                                setTempSurveyData({ titulo: e.titulo, descripcion: e.descripcion });
                              }}
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                          <div style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', opacity: 0.8 }}>
                            <span style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              background: e.estado === 1 ? '#10b981' : '#6b7280'
                            }}></span>
                            {e.estado === 1 ? 'Activa' : 'Inactiva'}
                          </div>
                        </>
                      )}
                      {/* Shareable link visible below */}
                      <div
                        onClick={(evt) => {
                          evt.stopPropagation();
                          const basePath = window.location.pathname.includes('/encuestas') ? '/encuestas' : '';
                          const url = `${window.location.origin}${basePath}/encuesta/${e.id}`;
                          navigator.clipboard.writeText(url);
                        }}
                        title="Clic para copiar enlace"
                        style={{
                          marginTop: '6px', fontSize: '0.65rem', color: '#10b981',
                          display: 'flex', alignItems: 'center', gap: '4px',
                          cursor: 'pointer', opacity: 0.8
                        }}
                      >
                        <Link2 size={10} />
                        {window.location.pathname.includes('/encuestas') ? '/encuestas' : ''}/encuesta/{e.id}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      <button
                        className="btn-icon"
                        title={e.estado === 1 ? 'Desactivar' : 'Activar'}
                        onClick={(evt) => { evt.stopPropagation(); handleToggleStatus(e.id, e.estado); }}
                        style={{ padding: '0.4rem', color: e.estado === 1 ? 'var(--primary)' : '#6b7280' }}
                      >
                        {e.estado === 1 ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        className="btn-icon"
                        title="Copiar enlace para compartir"
                        onClick={(evt) => {
                          evt.stopPropagation();
                          const basePath = window.location.pathname.includes('/encuestas') ? '/encuestas' : '';
                          const url = `${window.location.origin}${basePath}/encuesta/${e.id}`;
                          navigator.clipboard.writeText(url).then(() => {
                            Swal.fire({
                              icon: 'success',
                              title: 'Enlace Copiado',
                              html: `<p style="font-size: 0.9rem">Ya podés pegarlo en WhatsApp para ver la previsualización profesional.</p>
                                                   <code style="display:block; padding: 10px; background: #f1f5f9; border-radius: 5px; margin-top: 10px">${url}</code>`,
                              confirmButtonColor: '#10b981'
                            });
                          });
                        }}
                        style={{
                          padding: '0.5rem',
                          color: '#10b981',
                          background: 'rgba(16, 185, 129, 0.1)',
                          borderRadius: '8px',
                          marginLeft: '0.5rem'
                        }}
                      >
                        <Share2 size={18} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Duplicar"
                        onClick={(evt) => { evt.stopPropagation(); handleDuplicate(e.id); }}
                        style={{ padding: '0.4rem', color: 'var(--primary)' }}
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Eliminar"
                        onClick={(evt) => { evt.stopPropagation(); handleDeleteSurvey(e.id); }}
                        style={{ padding: '0.4rem', color: '#ef4444' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Main Content: Tabs para Periodos / Preguntas */}
          <div className="glass-card" style={{ padding: '2rem', minHeight: '80vh' }}>
            {!selectedEncuesta ? (
              <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                <ClipboardList size={64} style={{ margin: '0 auto 1rem', display: 'block' }} />
                <p>Seleccione o cree una encuesta para comenzar</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
                  <button
                    className={`btn ${tab === 'sections' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setTab('sections')}
                  >
                    <ListPlus size={18} /> Secciones
                  </button>
                  <button
                    className={`btn ${tab === 'questions' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setTab('questions')}
                  >
                    <ListPlus size={18} /> Lógica
                  </button>
                  <button
                    className={`btn ${tab === 'sectors' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ borderColor: '#10b981', color: tab === 'sectors' ? 'white' : '#10b981', background: tab === 'sectors' ? '#10b981' : 'transparent' }}
                    onClick={() => setTab('sectors')}
                  >
                    🏢 Sectores
                  </button>
                  <button
                    className={`btn ${tab === 'periods' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setTab('periods')}
                  >
                    <Calendar size={18} /> Períodos
                  </button>
                  <button
                    className={`btn ${tab === 'localidades' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ borderColor: '#6366f1', color: tab === 'localidades' ? 'white' : '#6366f1', background: tab === 'localidades' ? '#6366f1' : 'transparent' }}
                    onClick={() => setTab('localidades')}
                  >
                    📍 Localidades
                  </button>
                  <button
                    className={`btn ${tab === 'camaras' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ borderColor: '#f59e0b', color: tab === 'camaras' ? 'white' : '#f59e0b', background: tab === 'camaras' ? '#f59e0b' : 'transparent' }}
                    onClick={() => setTab('camaras')}
                  >
                    🏛️ Cámaras
                  </button>
                  <button
                    className={`btn ${tab === 'banco' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ borderColor: '#f59e0b', color: tab === 'banco' ? 'white' : '#f59e0b', background: tab === 'banco' ? '#f59e0b' : 'transparent' }}
                    onClick={() => { setTab('banco'); loadBancoPreguntas(); }}
                  >
                    <BookOpen size={18} /> Preguntas
                  </button>
                  <button
                    className={`btn ${tab === 'usuarios' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ borderColor: '#3b82f6', color: tab === 'usuarios' ? 'white' : '#3b82f6', background: tab === 'usuarios' ? '#3b82f6' : 'transparent' }}
                    onClick={() => { setTab('usuarios'); loadUsuarios(); }}
                  >
                    <Users size={18} /> Usuarios
                  </button>
                  <button
                    className={`btn ${tab === 'import' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ borderColor: '#8b5cf6', color: tab === 'import' ? 'white' : '#8b5cf6', background: tab === 'import' ? '#8b5cf6' : 'transparent' }}
                    onClick={() => setTab('import')}
                  >
                    <UploadCloud size={18} /> Importar Datos
                  </button>
                  <button
                    className={`btn ${tab === 'sorteos' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ borderColor: '#ec4899', color: tab === 'sorteos' ? 'white' : '#ec4899', background: tab === 'sorteos' ? '#ec4899' : 'transparent' }}
                    onClick={() => setTab('sorteos')}
                  >
                    🎉 Sorteos
                  </button>
                </div>

                {tab === 'sorteos' && <SorteosManager camaras={auxData.camaras} />}

                {tab === 'usuarios' && (
                  <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <div>
                        <h3><Users size={20} color="var(--primary)" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Gestión de Usuarios</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Administrá los usuarios que pueden acceder al sistema.</p>
                      </div>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => {
                          setEditingUser({ usuario: '', password: '', nombre: '', rol: 'admin', estado: 1 });
                          setIsEditingUser(true);
                        }}
                      >
                        <UserPlus size={18} /> Nuevo Usuario
                      </button>
                    </div>

                    <div className="glass-card" style={{ padding: '2rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>ID</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Usuario</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Nombre</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Rol</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Estado</th>
                            <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usuarios.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                              <td style={{ padding: '1rem', fontWeight: 'bold' }}>{u.id}</td>
                              <td style={{ padding: '1rem' }}>{u.usuario}</td>
                              <td style={{ padding: '1rem' }}>{u.nombre}</td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{ padding: '0.3rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 'bold' }}>
                                  {u.rol}
                                </span>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                {u.estado == 1 ? 
                                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>Activo</span> : 
                                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Inactivo</span>
                                }
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <button className="btn btn-outline btn-small" onClick={() => { setEditingUser({ ...u, password: '' }); setIsEditingUser(true); }} style={{ marginRight: '0.5rem', padding: '0.4rem' }}>
                                  <Edit3 size={16} />
                                </button>
                                <button className="btn btn-outline btn-small" onClick={() => handleDeleteUser(u.id)} style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)', padding: '0.4rem' }}>
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {usuarios.length === 0 && (
                            <tr>
                              <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay usuarios creados</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {tab === 'import' && <ImportManager selectedEncuesta={selectedEncuesta} />}


                {tab === 'questions' && (
                  <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                      <h3>Preguntas por Sección</h3>
                    </div>

                    {(preguntas.length === 0 && secciones.length === 0) ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '4rem 2rem', textAlign: 'center' }}>
                        <div
                          className="glass-card clickable animate-slide-up"
                          onClick={() => { setTab('sections'); }}
                          style={{ padding: '4rem 2rem', border: '2px dashed var(--primary)', cursor: 'pointer', background: 'rgba(99, 102, 241, 0.05)', transition: 'transform 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <ListPlus size={64} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
                          <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Primero, creá una Sección</h3>
                          <p style={{ opacity: 0.7 }}>Para organizar mejor tus preguntas, debés crear al menos una sección (ej: "Servicio", "Atención").</p>
                        </div>
                        <div
                          className="glass-card animate-slide-up"
                          style={{ padding: '4rem 2rem', border: '2px dashed #ccc', opacity: 0.6, cursor: 'not-allowed', background: '#f8fafc' }}
                        >
                          <Database size={64} color="#94a3b8" style={{ margin: '0 auto 1.5rem' }} />
                          <h3 style={{ color: '#64748b', marginBottom: '1rem' }}>Cargar del Banco</h3>
                          <p style={{ opacity: 0.7 }}>Podrás elegir preguntas del banco una vez que tengas secciones creadas.</p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '2rem' }}>
                        {secciones.concat({ id: null, titulo: "Sin sección asignada" }).map(sec => {
                          const secQuestions = preguntas.filter(q => q.seccion_id === sec.id);
                          if (sec.id === null && secQuestions.length === 0) return null;

                          return (
                            <div key={sec.id || 'none'} id={sec.id !== null ? `seccion-group-${sec.id}` : undefined} className="section-group">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--glass-bg)', borderRadius: '12px 12px 0 0', border: '1px solid var(--glass-border)', borderBottom: '2px solid var(--primary)' }}>
                                <h4 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {sec.id !== null ? (
                                    <Folder size={18} fill={sec.color || '#94a3b8'} color={sec.color || '#94a3b8'} style={{ flexShrink: 0 }} />
                                  ) : (
                                    <ListPlus size={18} />
                                  )} {sec.titulo}
                                </h4>
                                <button
                                  className="btn btn-outline"
                                  style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', borderColor: '#f59e0b', color: '#b45309' }}
                                  onClick={() => {
                                    setTargetSeccionForBank(sec.id);
                                    loadBancoPreguntas();
                                    setShowBankPicker(true);
                                  }}
                                >
                                  <Database size={14} /> Añadir del Banco
                                </button>
                              </div>
                              <div style={{ display: 'grid', gap: '1rem', padding: '1.5rem', background: 'rgba(255,255,255,0.3)', border: '1px solid var(--glass-border)', borderTop: 'none', borderRadius: '0 0 12px 12px' }}>
                                {secQuestions.length === 0 ? (
                                  <p style={{ textAlign: 'center', padding: '1rem', opacity: 0.5, fontSize: '0.85rem' }}>No hay preguntas en esta sección.</p>
                                ) : (
                                  secQuestions.map((p, pIdx) => {
                                    const catSector = p.categoria ? sectores?.find(s => s.nombre.toLowerCase().trim() === p.categoria.toLowerCase().trim()) : null;
                                    const secColor = catSector?.color || '#94a3b8';
                                    return (
                                      <div
                                        key={p.id}
                                        id={`pregunta-${p.id}`}
                                        className={`glass-card animate-slide-up ${p.id === highlightedQuestionId ? 'glow-highlight-question' : ''}`}
                                        style={{ padding: '1.5rem', background: 'white', animationDelay: `${pIdx * 0.05}s`, borderLeft: catSector ? `4px solid ${secColor}` : undefined }}
                                      >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                                              {p.categoria && <span style={{ fontSize: '0.65rem', background: catSector ? `${secColor}20` : '#fef3c7', color: catSector ? secColor : '#b45309', border: catSector ? `1px solid ${secColor}40` : 'none', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>{p.categoria}</span>}
                                              <span style={{ fontSize: '0.65rem', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>{p.tipo?.toUpperCase()}</span>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ORDEN: {p.orden} | ID: {p.id}</span>
                                            </div>
                                            <h4 style={{ fontSize: '1.05rem', marginTop: '0.2rem', color: '#1e293b' }}>{p.texto_pregunta}</h4>
                                          </div>
                                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                              className="btn-icon"
                                              disabled={pIdx === 0}
                                              style={{ opacity: pIdx === 0 ? 0.3 : 0.7, cursor: pIdx === 0 ? 'not-allowed' : 'pointer' }}
                                              onClick={() => handleMoveQuestion(p, 'up')}
                                              title="Mover Arriba"
                                            >
                                              <ArrowUp size={16} />
                                            </button>
                                            <button
                                              className="btn-icon"
                                              disabled={pIdx === secQuestions.length - 1}
                                              style={{ opacity: pIdx === secQuestions.length - 1 ? 0.3 : 0.7, cursor: pIdx === secQuestions.length - 1 ? 'not-allowed' : 'pointer' }}
                                              onClick={() => handleMoveQuestion(p, 'down')}
                                              title="Mover Abajo"
                                            >
                                              <ArrowDown size={16} />
                                            </button>
                                            <button className="btn-icon" onClick={() => { setEditingQuestion({ ...p }); setIsEditingQuestion(true); }}><Edit3 size={16} /></button>
                                            <button className="btn-icon" style={{ color: '#ef4444' }} onClick={() => handleDeleteQuestion(p.id)}><Trash2 size={16} /></button>
                                          </div>
                                        </div>

                                        {p.opciones && p.opciones.length > 0 && (
                                          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                            {p.opciones.slice(0, 10).map((opt, oIdx) => (
                                              <span key={oIdx} style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.04)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>{opt.texto}</span>
                                            ))}
                                            {p.opciones.length > 10 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+{p.opciones.length - 10} más</span>}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'sections' && (
                  <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                      <h3>Secciones de la Encuesta</h3>
                      {!isEditingSeccion && (
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setEditingSeccion({ titulo: '', descripcion: '', orden: secciones.length + 1, color: '#94a3b8', sector_id: null, siguiente_seccion_id: null });
                            setIsEditingSeccion(true);
                          }}
                        >
                          <Plus size={18} /> Nueva Sección
                        </button>
                      )}
                    </div>

                    {/* Modal de edición de sección movido al final fuera del contenedor transformado */}

                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {secciones.map((s, idx) => {
                        const sectorVinculado = sectores.find(sec => sec.id === s.sector_id);
                        const secColor = s.color || '#94a3b8';
                        return (
                          <div
                            key={s.id}
                            id={`seccion-${s.id}`}
                            className={`glass-card animate-slide-up ${s.id === highlightedSeccionId ? 'glow-highlight-seccion' : ''}`}
                            style={{ padding: '1.5rem', background: 'white', animationDelay: `${idx * 0.05}s` }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                  <Folder size={20} fill={secColor} color={secColor} style={{ flexShrink: 0, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }} />
                                  <span style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>ORDEN: {s.orden}</span>
                                  <span style={{
                                    fontSize: '0.7rem',
                                    background: `${secColor}15`,
                                    color: secColor === '#94a3b8' ? '#475569' : secColor,
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    border: `1px solid ${secColor}35`,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <span style={{
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      backgroundColor: secColor,
                                      display: 'inline-block'
                                    }}></span>
                                    {
                                      (() => {
                                        const matchedSector = sectores.find(sec => (sec.color || '').toLowerCase() === secColor.toLowerCase());
                                        if (matchedSector) return matchedSector.nombre.toUpperCase();
                                        return secColor === '#f97316' ? 'NARANJA' :
                                          secColor === '#22c55e' ? 'VERDE' :
                                            secColor === '#a855f7' ? 'VIOLETA' :
                                              secColor === '#0ea5e9' ? 'CELESTE' :
                                                secColor === '#eab308' ? 'AMARILLO' : 'GRIS';
                                      })()
                                    }
                                  </span>
                                  {sectorVinculado && (
                                    <span style={{
                                      fontSize: '0.7rem',
                                      background: `${sectorVinculado.color}20`,
                                      color: sectorVinculado.color,
                                      padding: '0.2rem 0.5rem',
                                      borderRadius: '4px',
                                      fontWeight: 'bold',
                                      border: `1px solid ${sectorVinculado.color}40`
                                    }}>
                                      SECTOR: {sectorVinculado.nombre.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <h4 style={{ fontSize: '1.2rem', marginTop: '0.2rem' }}>{s.titulo}</h4>
                                {s.descripcion && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{s.descripcion}</p>}
                                {s.siguiente_seccion_id && (
                                  <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', background: 'rgba(99,102,241,0.08)', color: 'var(--primary)', padding: '0.3rem 0.7rem', borderRadius: '20px', border: '1px solid rgba(99,102,241,0.2)' }}>
                                    ➡️ Siguiente: <strong>{secciones.find(sec => sec.id === s.siguiente_seccion_id)?.titulo || 'Sección desconocida'}</strong>
                                  </div>
                                )}

                                <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', background: 'rgba(0,0,0,0.03)', padding: '0.4rem 0.8rem', borderRadius: '20px' }}>
                                  <HelpCircle size={14} />
                                  <strong>Preguntas vinculadas:</strong> {preguntas.filter(p => p.seccion_id === s.id).length}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                  className="btn-icon"
                                  title="Mover arriba"
                                  style={{ opacity: idx === 0 ? 0.3 : 1 }}
                                  disabled={idx === 0}
                                  onClick={() => handleMoveSeccion(s, 'up')}
                                >
                                  <ArrowUp size={16} />
                                </button>
                                <button
                                  className="btn-icon"
                                  title="Mover abajo"
                                  style={{ opacity: idx === secciones.length - 1 ? 0.3 : 1 }}
                                  disabled={idx === secciones.length - 1}
                                  onClick={() => handleMoveSeccion(s, 'down')}
                                >
                                  <ArrowDown size={16} />
                                </button>
                                <button
                                  className="btn-icon"
                                  onClick={() => {
                                    setEditingSeccion({ ...s });
                                    setIsEditingSeccion(true);
                                  }}
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  className="btn-icon"
                                  style={{ color: '#ef4444' }}
                                  onClick={() => handleDeleteSeccion(s.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {secciones.length === 0 && (
                        <div
                          className="glass-card clickable animate-slide-up"
                          onClick={() => {
                            setEditingSeccion({ titulo: '', descripcion: '', orden: 1, color: '#94a3b8', sector_id: null, siguiente_seccion_id: null });
                            setIsEditingSeccion(true);
                          }}
                          style={{
                            padding: '4rem 2rem',
                            border: '2px dashed var(--primary)',
                            cursor: 'pointer',
                            background: 'rgba(99, 102, 241, 0.05)',
                            textAlign: 'center',
                            transition: 'transform 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <ListPlus size={64} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
                          <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Crear Primera Sección</h3>
                          <p style={{ opacity: 0.7 }}>Las secciones te permiten agrupar preguntas y crear flujos condicionales inteligentes.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}


                {tab === 'sectors' && (
                  <div className="animate-fade-in">
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ marginBottom: '0.5rem' }}>🏢 Sectores / Rubros</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Vinculá cada sector con su sección en esta encuesta.
                        La pregunta "Selector de Rubro" utilizará estos vínculos para navegación automática.
                      </p>
                    </div>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {sectores.map(sector => {
                        const seccionVinculada = secciones.find(s => s.sector_id === sector.id);
                        return (
                          <div key={sector.id} className="glass-card" style={{
                            padding: '1.2rem 1.5rem',
                            display: 'flex', alignItems: 'center', gap: '1.5rem',
                            borderLeft: `4px solid ${sector.color || '#0ea5e9'}`,
                            background: 'white'
                          }}>
                            <span style={{
                              width: '18px', height: '18px', borderRadius: '50%',
                              background: sector.color, flexShrink: 0
                            }}></span>
                            <div style={{ fontWeight: '700', fontSize: '1.1rem', minWidth: '120px' }}>
                              {sector.nombre}
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>→</span>
                            <div style={{ flex: 1 }}>
                              <select
                                className="input-group"
                                style={{ marginBottom: 0, fontSize: '0.9rem' }}
                                value={seccionVinculada?.id || ''}
                                onChange={async (e) => {
                                  const seccionId = e.target.value ? parseInt(e.target.value) : null;
                                  try {
                                    // Unlink previous section if any
                                    if (seccionVinculada) {
                                      await api.updateSeccion(seccionVinculada.id, { ...seccionVinculada, sector_id: null });
                                    }
                                    // Link new section
                                    if (seccionId) {
                                      const sec = secciones.find(s => s.id === seccionId);
                                      await api.updateSeccion(seccionId, { ...sec, sector_id: sector.id });

                                      // NEW: Also update the 'selector_rubro' question option jump if it exists
                                      const qRubro = preguntas.find(p => p.tipo === 'selector_rubro');
                                      if (qRubro) {
                                        const opt = qRubro.opciones.find(o => o.sector_id === sector.id);
                                        if (opt) {
                                          await api.updateOpcion(opt.id, { ...opt, siguiente_seccion_id: seccionId });
                                        }
                                      }
                                    }
                                    handleSelectEncuesta(selectedEncuesta);
                                  } catch (err) {
                                    Swal.fire({ icon: 'error', title: 'Error al vincular', text: err.message });
                                  }
                                }}
                              >
                                <option value="">-- Sin sección vinculada --</option>
                                {secciones.map(s => (
                                  <option key={s.id} value={s.id}>{s.titulo}</option>
                                ))}
                              </select>
                            </div>
                            <div style={{ fontSize: '0.75rem', textAlign: 'right', minWidth: '100px' }}>
                              {seccionVinculada
                                ? <span style={{ color: '#10b981', fontWeight: '600' }}>✓ Vinculado</span>
                                : <span style={{ color: '#ef4444', opacity: 0.7 }}>Sin vincular</span>
                              }
                            </div>
                          </div>
                        );
                      })}
                      {sectores.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                          No hay sectores configurados en la base de datos.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {tab === 'localidades' && (
                  <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ marginBottom: '0.5rem' }}>📍 Gestión de Localidades</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          Estas localidades aparecerán en el primer paso de todas las encuestas activas.
                        </p>
                      </div>
                      <button className="btn btn-primary" onClick={handleAddLocalidad}>
                        <Plus size={18} /> Nueva Localidad
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                      {auxData.localidades.map(loc => (
                        <div key={loc.id} className="glass-card" style={{
                          padding: '1rem 1.5rem',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: 'white'
                        }}>
                          <div style={{ fontWeight: '600' }}>{loc.nombre}</div>
                          <button
                            className="btn-icon"
                            style={{ color: '#ef4444' }}
                            onClick={() => handleDeleteLocalidad(loc.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {auxData.localidades.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                          No hay localidades cargadas.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {tab === 'camaras' && (
                  <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <div>
                        <h3>🏛️ Gestión de Cámaras y Asociaciones</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Administrá las entidades que aparecerán en el selector de la encuesta.</p>
                      </div>
                      <button className="btn btn-primary" onClick={handleAddCamara}>
                        <Plus size={18} /> Nueva Cámara
                      </button>
                    </div>
                    <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem' }}>Nombre de la Cámara</th>
                            <th style={{ textAlign: 'center', padding: '1rem', width: '100px' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auxData.camaras.map(cam => (
                            <tr key={cam.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                              <td style={{ padding: '1rem 1.5rem', fontWeight: '500' }}>{cam.nombre}</td>
                              <td style={{ textAlign: 'center', padding: '1rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                  <button
                                    className="btn-icon"
                                    style={{ color: 'var(--primary)' }}
                                    onClick={() => handleEditCamara(cam)}
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                  <button
                                    className="btn-icon"
                                    style={{ color: '#ef4444' }}
                                    onClick={() => handleDeleteCamara(cam.id)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {auxData.camaras.length === 0 && (
                            <tr>
                              <td colSpan="2" style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>No hay cámaras cargadas.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {tab === 'periods' && (
                  <div className="animate-fade-in">
                    <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--secondary)' }}>
                      <h4 style={{ marginBottom: '1.5rem' }}>Abrir Nuevo Período</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1.5rem', alignItems: 'flex-end' }}>
                        <div className="input-field">
                          <label>Mes (1-12)</label>
                          <input
                            type="number"
                            min="1" max="12"
                            className="input-group"
                            value={newPeriod.mes}
                            onChange={e => setNewPeriod({ ...newPeriod, mes: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="input-field">
                          <label>Año</label>
                          <input
                            type="number"
                            className="input-group"
                            value={newPeriod.anio}
                            onChange={e => setNewPeriod({ ...newPeriod, anio: parseInt(e.target.value) })}
                          />
                        </div>
                        <button className="btn btn-secondary" onClick={handleCreatePeriod}>
                          <Plus size={18} /> Abrir Período
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                      {periodos.map(p => (
                        <div key={p.id} className="glass-card animate-slide-up" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', textAlign: 'center', position: 'relative' }}>
                          <button
                            className="btn-icon"
                            title="Eliminar Período"
                            onClick={() => handleDeletePeriod(p.id)}
                            style={{ position: 'absolute', top: '10px', right: '10px', color: '#ef4444', opacity: 0.6 }}
                          >
                            <Trash2 size={14} />
                          </button>
                          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>{p.mes}/{p.anio}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>ID: {p.id}</div>
                          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', fontSize: '0.7rem' }}>
                            Abierto el: {p.fecha_apertura ? new Date(p.fecha_apertura).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tab === 'banco' && (
                  <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <div>
                        <h3 style={{ marginBottom: '0.3rem' }}>📋 Banco de Preguntas</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cargá preguntas reutilizables organizadas por categoría.</p>
                      </div>
                      {!isEditingBanco && (
                        <button className="btn btn-primary" onClick={() => {
                          setEditingBanco({ texto_pregunta: '', tipo: 'opcion_unica', orden: bancoPreguntas.length + 1, categoria: '', opciones: [] });
                          setIsEditingBanco(true);
                        }}>
                          <Plus size={18} /> Nueva Pregunta
                        </button>
                      )}
                    </div>

                    {/* Filtro por categoría */}
                    {!isEditingBanco && (bancoPreguntas.length > 0 || sectores.length > 0) && (
                      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Filtrar por Sector/Categoría:</span>
                        <button className={`btn ${filtroCat === '' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem' }} onClick={() => setFiltroCat('')}>Todas</button>
                        {/* Unimos categorías existentes con nombres de sectores */}
                        {[...new Set([
                          ...bancoPreguntas.map(p => p.categoria).filter(Boolean),
                          ...sectores.map(s => s.nombre)
                        ])].sort().map(cat => (
                          <button key={cat} className={`btn ${filtroCat === cat ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem' }} onClick={() => setFiltroCat(cat)}>{cat}</button>
                        ))}
                      </div>
                    )}

                    {/* Modal de edición de pregunta de banco movido al final fuera del contenedor transformado */}

                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {(filtroCat ? bancoPreguntas.filter(p => (p.categoria || 'Sin categoría') === filtroCat) : bancoPreguntas).map((p, idx) => {
                        const catSector = p.categoria ? sectores?.find(s => s.nombre.toLowerCase().trim() === p.categoria.toLowerCase().trim()) : null;
                        const secColor = catSector?.color || '#94a3b8';
                        return (
                          <div
                            key={p.id}
                            id={`banco-pregunta-${p.id}`}
                            className={`glass-card animate-slide-up ${p.id === highlightedBancoId ? 'glow-highlight-banco' : ''}`}
                            style={{ padding: '1.5rem', background: 'white', animationDelay: `${idx * 0.03}s`, borderLeft: catSector ? `4px solid ${secColor}` : undefined }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                                  {p.categoria && <span style={{ fontSize: '0.65rem', background: catSector ? `${secColor}20` : 'rgba(245,158,11,0.15)', color: catSector ? secColor : '#b45309', border: catSector ? `1px solid ${secColor}40` : 'none', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '700' }}>{p.categoria}</span>}
                                  <span style={{ fontSize: '0.65rem', background: 'rgba(14,165,233,0.1)', color: 'var(--primary)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>{p.tipo?.toUpperCase()}</span>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ID: {p.id}</span>
                                </div>
                                <h4 style={{ fontSize: '1rem', marginTop: '0.2rem' }}>{p.texto_pregunta}</h4>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                <button className="btn-icon" onClick={() => { setEditingBanco({ ...p }); setIsEditingBanco(true); }}><Edit3 size={16} /></button>
                                <button className="btn-icon" style={{ color: '#ef4444' }} onClick={() => handleDeleteBanco(p.id)}><Trash2 size={16} /></button>
                              </div>
                            </div>
                            {p.opciones && p.opciones.length > 0 && (
                              <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {p.opciones.slice(0, 8).map((opt, i) => (
                                  <span key={i} style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.04)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{opt.texto}</span>
                                ))}
                                {p.opciones.length > 8 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+{p.opciones.length - 8} más</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {bancoPreguntas.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                          <BookOpen size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                          <p>No hay preguntas cargadas. Creá la primera.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALES FLOTANTES FIJOS (FUERA DEL CONTENEDOR ANIMADO)   */}
      {/* ======================================================== */}

      {/* 1. Banco de Preguntas Picker Modal */}
      {isEditingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', display: 'flex', flexDirection: 'column', background: 'white', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {editingUser.id ? <Edit3 size={20} /> : <UserPlus size={20} />} 
                {editingUser.id ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={() => setIsEditingUser(false)} className="btn btn-outline" style={{ border: 'none', padding: '0.5rem' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label>Nombre de Usuario</label>
                <input type="text" value={editingUser.usuario} onChange={(e) => setEditingUser({...editingUser, usuario: e.target.value})} placeholder="Ej: admin123" />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label>Nombre Completo</label>
                <input type="text" value={editingUser.nombre} onChange={(e) => setEditingUser({...editingUser, nombre: e.target.value})} placeholder="Ej: Juan Perez" />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label>{editingUser.id ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}</label>
                <input type="password" value={editingUser.password} onChange={(e) => setEditingUser({...editingUser, password: e.target.value})} placeholder="***" />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label>Rol</label>
                <select value={editingUser.rol} onChange={(e) => setEditingUser({...editingUser, rol: e.target.value})}>
                  <option value="admin">Administrador</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Lector</option>
                </select>
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label>Estado</label>
                <select value={editingUser.estado} onChange={(e) => setEditingUser({...editingUser, estado: parseInt(e.target.value)})}>
                  <option value={1}>Activo</option>
                  <option value={0}>Inactivo</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setIsEditingUser(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveUser}><Save size={18} style={{ marginRight: '0.5rem' }} /> Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showBankPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'white' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <Database size={24} color="#f59e0b" />
                <h3 style={{ margin: 0 }}>Seleccionar del Banco de Preguntas</h3>
              </div>
              <button className="btn-icon" onClick={() => setShowBankPicker(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {bancoPreguntas.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>Cargando banco de preguntas...</p>}
                {bancoPreguntas.map(p => {
                  const yaVinculada = preguntas.some(q => q.id === p.id);
                  const catSector = p.categoria ? sectores?.find(s => s.nombre.toLowerCase().trim() === p.categoria.toLowerCase().trim()) : null;
                  const secColor = catSector?.color || '#94a3b8';
                  return (
                    <div key={p.id} className="glass-card animate-slide-up" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: yaVinculada ? 0.6 : 1, background: 'white', border: yaVinculada ? '1px dashed #ccc' : '1px solid #e2e8f0', borderLeft: catSector ? `4px solid ${secColor}` : undefined }}>
                      <div style={{ flex: 1, marginRight: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                          {p.categoria && <span style={{ fontSize: '0.65rem', background: catSector ? `${secColor}20` : '#fef3c7', color: catSector ? secColor : '#b45309', border: catSector ? `1px solid ${secColor}40` : 'none', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>{p.categoria}</span>}
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{p.tipo?.toUpperCase()}</span>
                        </div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{p.texto_pregunta}</div>
                      </div>
                      <button
                        className={`btn ${yaVinculada ? 'btn-outline' : 'btn-primary'}`}
                        disabled={yaVinculada}
                        onClick={() => handlePickFromBank(p.id)}
                        style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem', minWidth: '120px' }}
                      >
                        {yaVinculada ? 'Ya añadida' : 'Añadir'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', textAlign: 'right' }}>
              <button className="btn btn-outline" onClick={() => setShowBankPicker(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Editor de Preguntas de Encuesta Modal */}
      {isEditingQuestion && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'white',
            padding: '2.5rem',
            border: '2px solid var(--primary)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            transform: 'none'
          }}>
            <button
              className="btn-icon"
              onClick={() => setIsEditingQuestion(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}
            >
              <X size={20} />
            </button>
            <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle size={22} color="var(--primary)" />
              {editingQuestion.id ? 'Editar' : 'Nueva'} Pregunta
            </h4>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div className="input-field">
                <label>Texto de la Pregunta</label>
                <input
                  className="input-group"
                  value={editingQuestion.texto_pregunta}
                  onChange={e => setEditingQuestion({ ...editingQuestion, texto_pregunta: e.target.value })}
                />
              </div>
              <div className="input-field">
                <label>Sector / Categoría (Rubro)</label>
                <input
                  className="input-group"
                  value={editingQuestion.categoria || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, categoria: e.target.value })}
                  placeholder="Ej: Industria, Comercio..."
                  list="cats-list-survey"
                />
                <datalist id="cats-list-survey">
                  {sectores?.map(s => <option key={`sec-s-${s.id}`} value={s.nombre} />)}
                </datalist>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Colores de rubros:</span>
                  {[
                    { nombre: 'Naranja', hex: '#f97316' },
                    { nombre: 'Verde', hex: '#22c55e' },
                    { nombre: 'Violeta', hex: '#a855f7' },
                    { nombre: 'Celeste', hex: '#0ea5e9' },
                    { nombre: 'Amarillo', hex: '#eab308' }
                  ].map(col => {
                    const currentColor = editingQuestion.color_temporal || (editingQuestion.categoria ? sectores?.find(s => s.nombre.toLowerCase() === editingQuestion.categoria.toLowerCase().trim())?.color : null);
                    const isSelected = currentColor === col.hex;
                    const matchedSector = sectores?.find(s => (s.color || '').toLowerCase() === col.hex.toLowerCase());
                    const tooltipName = matchedSector ? matchedSector.nombre : col.nombre;
                    return (
                      <button
                        key={col.hex}
                        type="button"
                        title={tooltipName}
                        onClick={() => setEditingQuestion({ ...editingQuestion, color_temporal: col.hex })}
                        style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          backgroundColor: col.hex,
                          border: isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                          boxShadow: isSelected ? '0 0 0 2px white, 0 0 0 4px var(--primary)' : 'none',
                          cursor: 'pointer', transition: 'all 0.15s ease'
                        }}
                      />
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="input-field">
                  <label>Sección</label>
                  <select className="input-group" value={editingQuestion.seccion_id || ''} onChange={e => setEditingQuestion({ ...editingQuestion, seccion_id: parseInt(e.target.value) })}>
                    <option value="">Seleccionar...</option>
                    {secciones.map(s => <option key={s.id} value={s.id}>{s.titulo}</option>)}
                  </select>
                </div>
                <div className="input-field">
                  <label>Tipo de Respuesta</label>
                  <select
                    className="input-group"
                    value={editingQuestion.tipo}
                    onChange={e => handleQuestionTipoChange(e.target.value)}
                  >
                    <option value="opcion_unica">Opción Única</option>
                    <option value="opcion_multiple">Opción Múltiple</option>
                    <option value="texto">Texto (Línea)</option>
                    <option value="email">Correo Electrónico</option>
                    <option value="escala">Escala Numérica</option>
                    <option value="numero">Número (Solo Números)</option>
                    <option value="cuadricula">Cuadrícula (Matriz)</option>
                    <option value="selector_rubro">🏢 Selector de Rubro (Automático)</option>
                    <option value="selector_camara">🏛️ Selector de Cámara (Automático)</option>
                    <option value="selector_localidad">🏙️ Selector de Localidad (Automático)</option>
                    <option value="selector_iva">📑 Selector de Situación IVA (Automático)</option>
                  </select>
                </div>
                {['opcion_unica', 'selector_camara', 'selector_rubro', 'opcion_multiple', 'selector_localidad', 'selector_iva'].includes(editingQuestion.tipo) && (
                  <div className="input-field">
                    <label>Estilo Visual</label>
                    <select
                      className="input-group"
                      value={editingQuestion.estilo || 'auto'}
                      onChange={e => setEditingQuestion({ ...editingQuestion, estilo: e.target.value })}
                    >
                      <option value="auto">Automático (Botones o Lista)</option>
                      <option value="botones">Forzar Botones</option>
                      <option value="desplegable">Forzar Desplegable</option>
                    </select>
                  </div>
                )}
                <div className="input-field">
                  <label>Orden de Aparición</label>
                  <input
                    type="number"
                    className="input-group"
                    value={editingQuestion.orden}
                    onChange={e => setEditingQuestion({ ...editingQuestion, orden: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              {['opcion_unica', 'opcion_multiple', 'cuadricula'].includes(editingQuestion.tipo) && (
                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <label style={{ fontWeight: '600' }}>
                      {editingQuestion.tipo === 'cuadricula' ? 'Configuración de la Matriz' : 'Opciones y Lógica'}
                    </label>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                      onClick={() => setEditingQuestion({
                        ...editingQuestion,
                        opciones: [...editingQuestion.opciones, { texto: '', siguiente_seccion_id: null, valor: editingQuestion.tipo === 'cuadricula' ? 0 : null }]
                      })}
                    >
                      <Plus size={14} /> Añadir {editingQuestion.tipo === 'cuadricula' ? 'Elemento' : 'Opción'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: '0.8rem' }}>
                    {editingQuestion.opciones.map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input
                          className="input-group"
                          style={{ flex: 2, marginBottom: 0 }}
                          value={opt.texto}
                          onChange={e => {
                            const newOpts = [...editingQuestion.opciones];
                            newOpts[idx].texto = e.target.value;
                            setEditingQuestion({ ...editingQuestion, opciones: newOpts });
                          }}
                        />
                        {editingQuestion.tipo !== 'cuadricula' && (
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <select
                              className="input-group"
                              style={{ flex: 1, marginBottom: 0, fontSize: '0.8rem' }}
                              value={opt.siguiente_seccion_id || ''}
                              onChange={e => {
                                const newOpts = [...editingQuestion.opciones];
                                newOpts[idx].siguiente_seccion_id = e.target.value ? parseInt(e.target.value) : null;
                                setEditingQuestion({ ...editingQuestion, opciones: newOpts });
                              }}
                            >
                              <option value="">Flujo Natural...</option>
                              {secciones.map(s => {
                                const emoji = s.color === '#f97316' ? '🟠' :
                                  s.color === '#22c55e' ? '🟢' :
                                    s.color === '#a855f7' ? '🟣' :
                                      s.color === '#0ea5e9' ? '🔵' :
                                        s.color === '#eab308' ? '🟡' : '🔘';
                                return (
                                  <option key={s.id} value={s.id}>
                                    {emoji} Saltar a: {s.titulo}
                                  </option>
                                );
                              })}
                            </select>
                            {opt.siguiente_seccion_id && (() => {
                              const targetSec = secciones.find(s => s.id === opt.siguiente_seccion_id);
                              if (!targetSec) return null;
                              return (
                                <span
                                  title={`Saltar a: ${targetSec.titulo}`}
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: targetSec.color || '#94a3b8',
                                    display: 'inline-block',
                                    flexShrink: 0,
                                    border: '1px solid rgba(0,0,0,0.15)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                  }}
                                />
                              );
                            })()}
                          </div>
                        )}
                        <button className="btn-icon" style={{ color: '#ef4444' }} onClick={() => {
                          const newOpts = editingQuestion.opciones.filter((_, i) => i !== idx);
                          setEditingQuestion({ ...editingQuestion, opciones: newOpts });
                        }}><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-outline" onClick={() => setIsEditingQuestion(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSaveQuestion}>
                  <Save size={18} /> Guardar Pregunta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Editor de Secciones Modal */}
      {isEditingSeccion && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'white',
            padding: '2.5rem',
            border: '2px solid var(--secondary)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            transform: 'none'
          }}>
            <button
              className="btn-icon"
              onClick={() => setIsEditingSeccion(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}
            >
              <X size={20} />
            </button>
            <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Folder size={22} fill="var(--secondary)" color="var(--secondary)" />
              {editingSeccion.id ? 'Editar' : 'Nueva'} Sección
            </h4>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="input-field">
                  <label>Título de la Sección</label>
                  <input
                    className="input-group"
                    value={editingSeccion.titulo}
                    onChange={e => setEditingSeccion({ ...editingSeccion, titulo: e.target.value })}
                    placeholder="Ej: Atención al Cliente"
                  />
                </div>
                <div className="input-field">
                  <label>Vincular a Sector (Opcional)</label>
                  <select
                    className="input-group"
                    value={editingSeccion.sector_id || ''}
                    onChange={e => setEditingSeccion({ ...editingSeccion, sector_id: e.target.value ? parseInt(e.target.value) : null })}
                  >
                    <option value="">Ninguno (Sección General)</option>
                    {sectores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="input-field">
                <label>Descripción (Opcional)</label>
                <textarea
                  className="input-group"
                  value={editingSeccion.descripcion}
                  onChange={e => setEditingSeccion({ ...editingSeccion, descripcion: e.target.value })}
                  style={{ minHeight: '80px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                <div className="input-field" style={{ margin: 0 }}>
                  <label>Orden</label>
                  <input
                    type="number"
                    className="input-group"
                    value={editingSeccion.orden}
                    onChange={e => setEditingSeccion({ ...editingSeccion, orden: parseInt(e.target.value) || 0 })}
                    style={{ marginBottom: 0 }}
                  />
                </div>
                <div className="input-field" style={{ margin: 0 }}>
                  <label style={{ marginBottom: '0.6rem', display: 'block', fontWeight: '600' }}>Color de la Sección</label>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {[
                      { nombre: 'Gris', hex: '#94a3b8' },
                      { nombre: 'Naranja', hex: '#f97316' },
                      { nombre: 'Verde', hex: '#22c55e' },
                      { nombre: 'Violeta', hex: '#a855f7' },
                      { nombre: 'Celeste', hex: '#0ea5e9' },
                      { nombre: 'Amarillo', hex: '#eab308' }
                    ].map(col => (
                      <button
                        key={col.hex}
                        type="button"
                        title={col.nombre}
                        onClick={() => setEditingSeccion({ ...editingSeccion, color: col.hex })}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: col.hex,
                          border: (editingSeccion.color || '#94a3b8') === col.hex ? '3px solid #1e293b' : '2px solid transparent',
                          boxShadow: (editingSeccion.color || '#94a3b8') === col.hex ? '0 0 8px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                          transform: (editingSeccion.color || '#94a3b8') === col.hex ? 'scale(1.15)' : 'scale(1)',
                          transition: 'all 0.15s ease'
                        }}
                      />
                    ))}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 'bold' }}>
                      {
                        (() => {
                          const c = (editingSeccion.color || '#94a3b8').toLowerCase();
                          const matchedSector = sectores.find(sec => (sec.color || '').toLowerCase() === c);
                          if (matchedSector) return matchedSector.nombre;
                          return c === '#f97316' ? 'Naranja' :
                            c === '#22c55e' ? 'Verde' :
                              c === '#a855f7' ? 'Violeta' :
                                c === '#0ea5e9' ? 'Celeste' :
                                  c === '#eab308' ? 'Amarillo' : 'Gris';
                        })()
                      }
                    </span>
                  </div>
                </div>
              </div>
              <div className="input-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '700' }}>
                  ➡️ Después de esta sección, ir a:
                </label>
                <select
                  className="input-group"
                  value={editingSeccion.siguiente_seccion_id || ''}
                  onChange={e => setEditingSeccion({ ...editingSeccion, siguiente_seccion_id: e.target.value ? parseInt(e.target.value) : null })}
                  style={{ border: '2px solid var(--primary)', borderRadius: '8px' }}
                >
                  <option value="">Flujo secuencial (orden automático)</option>
                  {secciones.filter(s => s.id !== editingSeccion.id).map(s => (
                    <option key={s.id} value={s.id}>{s.titulo}</option>
                  ))}
                </select>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Seleccioná directamente cuál es la próxima sección al hacer clic en "Siguiente".
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-outline" onClick={() => setIsEditingSeccion(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSaveSeccion}>
                  <Save size={18} /> Guardar Sección
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Editor de Preguntas de Banco Modal */}
      {isEditingBanco && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'white',
            padding: '2.5rem',
            border: '2px solid #f59e0b',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            transform: 'none'
          }}>
            <button
              className="btn-icon"
              onClick={() => setIsEditingBanco(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}
            >
              <X size={20} />
            </button>
            <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={22} color="#f59e0b" />
              {editingBanco.id ? 'Editar' : 'Nueva'} Pregunta
            </h4>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div className="input-field">
                <label>Texto de la Pregunta</label>
                <input className="input-group" value={editingBanco.texto_pregunta} onChange={e => setEditingBanco({ ...editingBanco, texto_pregunta: e.target.value })} placeholder="Escribí la pregunta..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="input-field">
                  <label>Sector / Categoría</label>
                  <input className="input-group" value={editingBanco.categoria || ''} onChange={e => setEditingBanco({ ...editingBanco, categoria: e.target.value })} placeholder="Elegí un sector o escribí una categoría..." list="cats-list" />
                  <datalist id="cats-list">
                    {/* Sugerimos primero los Sectores oficiales */}
                    {sectores?.map(s => <option key={`sec-${s.id}`} value={s.nombre} />)}
                    {/* Luego categorías que ya existan en el banco */}
                    {[...new Set(bancoPreguntas.map(p => p.categoria).filter(c => c && !sectores?.find(s => s.nombre === c)))].map(c => <option key={c} value={c} />)}
                  </datalist>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Colores de rubros:</span>
                    {[
                      { nombre: 'Naranja', hex: '#f97316' },
                      { nombre: 'Verde', hex: '#22c55e' },
                      { nombre: 'Violeta', hex: '#a855f7' },
                      { nombre: 'Celeste', hex: '#0ea5e9' },
                      { nombre: 'Amarillo', hex: '#eab308' }
                    ].map(col => {
                      const currentColor = editingBanco.color_temporal || (editingBanco.categoria ? sectores?.find(s => s.nombre.toLowerCase() === editingBanco.categoria.toLowerCase().trim())?.color : null);
                      const isSelected = currentColor === col.hex;
                      const matchedSector = sectores?.find(s => (s.color || '').toLowerCase() === col.hex.toLowerCase());
                      const tooltipName = matchedSector ? matchedSector.nombre : col.nombre;
                      return (
                        <button
                          key={col.hex}
                          type="button"
                          title={tooltipName}
                          onClick={() => setEditingBanco({ ...editingBanco, color_temporal: col.hex })}
                          style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            backgroundColor: col.hex,
                            border: isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                            boxShadow: isSelected ? '0 0 0 2px white, 0 0 0 4px var(--primary)' : 'none',
                            cursor: 'pointer', transition: 'all 0.15s ease'
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
                <div className="input-field">
                  <label>Tipo de Respuesta</label>
                  <select className="input-group" value={editingBanco.tipo} onChange={e => handleBancoTipoChange(e.target.value)}>
                    <option value="opcion_unica">Opción Única</option>
                    <option value="opcion_multiple">Opción Múltiple</option>
                    <option value="texto">Texto (Línea)</option>
                    <option value="email">Correo Electrónico</option>
                    <option value="escala">Escala Numérica</option>
                    <option value="numero">Número (Solo Números)</option>
                    <option value="cuadricula">Cuadrícula (Matriz)</option>
                    <option value="selector_rubro">🏢 Selector de Rubro</option>
                    <option value="selector_camara">🏛️ Selector de Cámara</option>
                    <option value="selector_localidad">🏙️ Selector de Localidad</option>
                    <option value="selector_iva">📑 Selector de Situación IVA</option>
                  </select>
                </div>
                {['opcion_unica', 'selector_camara', 'selector_rubro', 'opcion_multiple', 'selector_localidad', 'selector_iva'].includes(editingBanco.tipo) && (
                  <div className="input-field">
                    <label>Estilo Visual</label>
                    <select
                      className="input-group"
                      value={editingBanco.estilo || 'auto'}
                      onChange={e => setEditingBanco({ ...editingBanco, estilo: e.target.value })}
                    >
                      <option value="auto">Automático (Botones o Lista)</option>
                      <option value="botones">Forzar Botones</option>
                      <option value="desplegable">Forzar Desplegable</option>
                    </select>
                  </div>
                )}
                <div className="input-field">
                  <label>Orden</label>
                  <input type="number" className="input-group" value={editingBanco.orden} onChange={e => setEditingBanco({ ...editingBanco, orden: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              {['opcion_unica', 'opcion_multiple'].includes(editingBanco.tipo) && (
                <div style={{ padding: '1.5rem', background: 'rgba(245,158,11,0.05)', borderRadius: '12px', border: '1px dashed rgba(245,158,11,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <label style={{ fontWeight: '600' }}>Opciones</label>
                    <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setEditingBanco({ ...editingBanco, opciones: [...editingBanco.opciones, { texto: '', siguiente_seccion_id: null }] })}>
                      <Plus size={14} /> Añadir Opción
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {editingBanco.opciones.map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input className="input-group" style={{ flex: 1, marginBottom: 0 }} placeholder={`Opción ${idx + 1}`} value={opt.texto} onChange={e => { const n = [...editingBanco.opciones]; n[idx].texto = e.target.value; setEditingBanco({ ...editingBanco, opciones: n }); }} />
                        <button className="btn-icon" style={{ color: '#ef4444' }} onClick={() => setEditingBanco({ ...editingBanco, opciones: editingBanco.opciones.filter((_, i) => i !== idx) })}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editingBanco.tipo === 'cuadricula' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(129,140,248,0.05)', borderRadius: '12px', border: '1px dashed rgba(129,140,248,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>FILAS (Ítems)</p>
                      <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => setEditingBanco({ ...editingBanco, opciones: [...editingBanco.opciones, { texto: '', valor: null }] })}><Plus size={12} /> Fila</button>
                    </div>
                    {editingBanco.opciones.filter(o => o.valor === null).map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                        <input className="input-group" style={{ marginBottom: 0, fontSize: '0.85rem' }} placeholder="Nombre del ítem..." value={opt.texto} onChange={e => { const n = [...editingBanco.opciones]; const ai = n.findIndex(o => o === opt); n[ai].texto = e.target.value; setEditingBanco({ ...editingBanco, opciones: n }); }} />
                        <button className="btn-icon" style={{ color: '#ef4444' }} onClick={() => setEditingBanco({ ...editingBanco, opciones: editingBanco.opciones.filter(o => o !== opt) })}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(14,165,233,0.05)', borderRadius: '12px', border: '1px dashed rgba(14,165,233,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>COLUMNAS (Escala)</p>
                      <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => setEditingBanco({ ...editingBanco, opciones: [...editingBanco.opciones, { texto: '', valor: editingBanco.opciones.filter(o => o.valor !== null).length }] })}><Plus size={12} /> Columna</button>
                    </div>
                    {editingBanco.opciones.filter(o => o.valor !== null).map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                        <input className="input-group" style={{ marginBottom: 0, fontSize: '0.85rem' }} placeholder="Escala..." value={opt.texto} onChange={e => { const n = [...editingBanco.opciones]; const ai = n.findIndex(o => o === opt); n[ai].texto = e.target.value; setEditingBanco({ ...editingBanco, opciones: n }); }} />
                        <button className="btn-icon" style={{ color: '#ef4444' }} onClick={() => setEditingBanco({ ...editingBanco, opciones: editingBanco.opciones.filter(o => o !== opt) })}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn btn-outline" onClick={() => setIsEditingBanco(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSaveBanco}><Save size={18} /> Guardar Pregunta</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
