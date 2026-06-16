const LOG_PREFIX = '[Encuesta]';

const formatTime = () => new Date().toISOString();

export const surveyLogger = {
  navigation: (action, details) => {
    const entry = {
      timestamp: formatTime(),
      action,
      ...details
    };
    console.log(LOG_PREFIX, JSON.stringify(entry));
    return entry;
  },

  answer: (preguntaId, data, questionText) => {
    const entry = {
      timestamp: formatTime(),
      action: 'answer',
      preguntaId,
      questionText: questionText || '(sin texto)',
      answerData: data
    };
    console.log(LOG_PREFIX, JSON.stringify(entry));
    return entry;
  },

  next: (currentSectionId, currentSectionTitle, answeredQuestions, nextSectionIndex, nextSectionId, nextSectionTitle) => {
    const entry = {
      timestamp: formatTime(),
      action: 'navigate_next',
      currentSectionId,
      currentSectionTitle,
      answeredQuestions,
      nextSectionIndex,
      nextSectionId,
      nextSectionTitle
    };
    console.log(LOG_PREFIX, JSON.stringify(entry));
    return entry;
  },

  prev: (fromSectionIndex, fromSectionId, toSectionIndex, toSectionId) => {
    const entry = {
      timestamp: formatTime(),
      action: 'navigate_prev',
      fromSectionIndex,
      fromSectionId,
      toSectionIndex,
      toSectionId
    };
    console.log(LOG_PREFIX, JSON.stringify(entry));
    return entry;
  },

  autoSkip: (fromSectionIndex, fromSectionId, toSectionIndex, toSectionId, reason) => {
    const entry = {
      timestamp: formatTime(),
      action: 'auto_skip',
      fromSectionIndex,
      fromSectionId,
      toSectionIndex,
      toSectionId,
      reason
    };
    console.log(LOG_PREFIX, JSON.stringify(entry));
    return entry;
  },

  error: (context, error) => {
    const entry = {
      timestamp: formatTime(),
      action: 'error',
      context,
      message: error?.message || String(error),
      stack: error?.stack || null
    };
    console.error(LOG_PREFIX, JSON.stringify(entry));
    return entry;
  },

  submit: (totalRespuestas, periodoId, localidadId) => {
    const entry = {
      timestamp: formatTime(),
      action: 'submit',
      totalRespuestas,
      periodoId,
      localidadId
    };
    console.log(LOG_PREFIX, JSON.stringify(entry));
    return entry;
  }
};
