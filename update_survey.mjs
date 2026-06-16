import fs from 'fs';

let content = fs.readFileSync('src/pages/SurveyForm.jsx', 'utf8');

// 1. Add secciones to state
content = content.replace(
  'const [preguntas, setPreguntas] = useState([]);',
  'const [preguntas, setPreguntas] = useState([]);\n  const [secciones, setSecciones] = useState([]);'
);

// 2. Load secciones in handleEncuestaChange
content = content.replace(
  'const pData = await api.getPeriodos(id);\n      const qData = await api.getPreguntas(id);',
  'const pData = await api.getPeriodos(id);\n      const qData = await api.getPreguntas(id);\n      const sData = await api.getPublicSecciones(id);'
);
content = content.replace(
  'setPeriodos(pData);\n      setPreguntas(qData);',
  'setPeriodos(pData);\n      setPreguntas(qData);\n      setSecciones(sData);'
);

// 3. Replace currentPregunta logic
content = content.replace(
  'const currentPregunta = preguntas[currentIndex];',
  'const currentSection = secciones[currentIndex];\n  const currentPreguntas = currentSection ? preguntas.filter(p => p.seccion_id === currentSection.id).sort((a,b)=>a.orden-b.orden) : [];'
);

// 4. Update handleNext logic
const handleNextReplacement = `const handleNext = () => {
    let nextSectionId = null;
    
    // Evaluate logic for all questions in the current section
    currentPreguntas.forEach(p => {
        const answer = respuestas[p.id];
        if (answer && p.tipo === 'opcion_unica' && answer.opcion_id) {
            const selectedOption = p.opciones.find(o => o.id === answer.opcion_id);
            if (selectedOption?.siguiente_seccion_id) {
                nextSectionId = selectedOption.siguiente_seccion_id;
            }
        }
    });

    if (nextSectionId) {
        const nextIdx = secciones.findIndex(s => s.id === nextSectionId);
        if (nextIdx !== -1) {
            setCurrentIndex(nextIdx);
            return;
        }
    }

    if (currentIndex < secciones.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };`;

content = content.replace(/const handleNext = \(\) => {[\s\S]*?(?=const handleSubmit =)/, handleNextReplacement + '\n\n  ');

// 5. Update render logic: entry screen validation
content = content.replace(
  'disabled={!selectedLocalidad || !selectedPeriodo || preguntas.length === 0}',
  'disabled={!selectedLocalidad || !selectedPeriodo || secciones.length === 0}'
);

content = content.replace(
  '{preguntas.length === 0 && !loading && (',
  '{secciones.length === 0 && !loading && ('
);

// 6. Replace main render block
// We need to carefully replace the render block. 
// It starts at `) : preguntas.length > 0 && currentPregunta && (`
// We will change it to `) : secciones.length > 0 && currentSection && (`
content = content.replace(
  ') : preguntas.length > 0 && currentPregunta && (',
  ') : secciones.length > 0 && currentSection && ('
);

content = content.replace(
  'Pregunta {currentIndex + 1} de {preguntas.length}',
  'Sección {currentIndex + 1} de {secciones.length}'
);

content = content.replace(
  'width: `${((currentIndex + 1) / preguntas.length) * 100}%`',
  'width: `${((currentIndex + 1) / secciones.length) * 100}%`'
);

// Now we need to wrap the question rendering in a map loop.
// The question header is: `<h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', lineHeight: '1.4' }}>{currentPregunta.texto_pregunta}</h3>`
// And it ends before `<div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>`

const renderingLoopStart = `{currentSection.descripcion && <p style={{ marginBottom: '2rem', fontSize: '1.1rem', color: 'var(--text-muted)' }}>{currentSection.descripcion}</p>}\n          <div style={{ display: 'grid', gap: '4rem', marginBottom: '3rem' }}>\n            {currentPreguntas.map(currentPregunta => (\n              <div key={currentPregunta.id} className="question-block">\n                <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', lineHeight: '1.4', fontWeight: '600' }}>{currentPregunta.texto_pregunta}</h3>\n\n                <div style={{ marginBottom: '1rem' }}>`;
const renderingLoopEnd = `</div>\n              </div>\n            ))}\n          </div>`;

content = content.replace(
    /<h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', lineHeight: '1.4' }}>\{currentPregunta\.texto_pregunta\}<\/h3>\s*<div style={{ marginBottom: '3rem' }}>/,
    renderingLoopStart
);

content = content.replace(
    /<\/div>\s*<div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>/,
    renderingLoopEnd + '\n\n          <div style={{ display: \'flex\', justifyContent: \'space-between\', gap: \'1rem\' }}>'
);


// 7. Update Next/Submit conditions
content = content.replace(
  '{currentIndex < preguntas.length - 1 ? (',
  '{currentIndex < secciones.length - 1 ? ('
);

const isSectionCompleteLogic = `currentPreguntas.every(p => {
                        const ans = respuestas[p.id];
                        if (!ans) return false;
                        if (p.tipo === 'cuadricula') return (ans.answers || []).length > 0 && p.opciones.filter(o => o.valor === null).length > 0;
                        return true;
                    }) === false`;

content = content.replace(
  /disabled=\{\(\) => \{[^}]*const ans = respuestas\[currentPregunta\.id\];[^}]*if \(!ans\) return true;[^}]*if \(currentPregunta\.tipo === 'cuadricula'\) \{[^}]*return \(ans\.answers \|\| \[\]\)\.length === 0;[^}]*\}[^}]*return false;[^}]*\}\(\)\}/g,
  `disabled={${isSectionCompleteLogic}}`
);

fs.writeFileSync('src/pages/SurveyForm.jsx', content);
