import Dexie from 'dexie';

export const db = new Dexie('EncuestasDB');

db.version(1).stores({
  encuestas: '++id, titulo, descripcion, fecha_creacion',
  preguntas: '++id, encuesta_id, texto_pregunta, tipo',
  respuestas: '++id, encuesta_id, pregunta_id, respuesta, usuario, fecha'
});

export const seedDatabase = async () => {
  const encuestaCount = await db.encuestas.count();
  if (encuestaCount === 0) {
    const encuestaId = await db.encuestas.add({
      titulo: 'Encuesta de Satisfacción v1',
      descripcion: 'Ayúdanos a mejorar nuestros servicios con tu opinión.',
      fecha_creacion: new Date()
    });

    await db.preguntas.bulkAdd([
      {
        encuesta_id: encuestaId,
        texto_pregunta: '¿Cómo calificaría la rapidez de nuestro servicio?',
        tipo: 'escala'
      },
      {
        encuesta_id: encuestaId,
        texto_pregunta: '¿Qué es lo que más le gusta de nuestro producto?',
        tipo: 'texto'
      },
      {
        encuesta_id: encuestaId,
        texto_pregunta: '¿Recomendaría este servicio a un amigo?',
        tipo: 'multiple',
        opciones: ['Sí', 'No', 'Tal vez']
      },
      {
        encuesta_id: encuestaId,
        texto_pregunta: '¿Cuántas veces a la semana utiliza nuestro servicio?',
        tipo: 'numero'
      }
    ]);

    // Respuestas iniciales para que el dashboard no esté vacío
    const preguntas = await db.preguntas.where({ encuesta_id: encuestaId }).toArray();
    
    for (let i = 0; i < 10; i++) {
        const usuario = `Usuario ${i+1}`;
        const fecha = new Date();
        
        for (const p of preguntas) {
            let res = '';
            if (p.tipo === 'escala') res = Math.floor(Math.random() * 5) + 1;
            if (p.tipo === 'multiple') {
                const opts = p.opciones;
                res = opts[Math.floor(Math.random() * opts.length)];
            }
            if (p.tipo === 'numero') res = Math.floor(Math.random() * 10) + 1;
            if (p.tipo === 'texto') res = 'Excelente servicio y atención.';

            await db.respuestas.add({
                encuesta_id: encuestaId,
                pregunta_id: p.id,
                respuesta: res.toString(),
                usuario,
                fecha
            });
        }
    }
  }
};
