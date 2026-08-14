import { assessmentQuestions } from './data/assessmentQuestions';
import { CEFR_LEARNING_PATHS } from './data/learningPaths';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const getCategoryMap = (questions) => {
  const map = [];
  let currentCategory = null;
  let startIdx = 0;
  const labels = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (q.category !== currentCategory) {
      if (currentCategory !== null) {
        map.push({ name: currentCategory, label: labels[map.length] || `Section ${map.length + 1}`, startIdx });
      }
      currentCategory = q.category;
      startIdx = i;
    }
  }
  if (currentCategory !== null) {
    map.push({ name: currentCategory, label: labels[map.length] || `Section ${map.length + 1}`, startIdx });
  }
  return map;
};

const calculateLocalReport = (user, answersMap) => {
  const totalQuestions = assessmentQuestions.length;
  let correctCount = 0;
  const categoryStats = {};

  for (let i = 0; i < assessmentQuestions.length; i++) {
    const q = assessmentQuestions[i];
    if (!categoryStats[q.category]) {
      categoryStats[q.category] = { correct: 0, total: 0 };
    }
    categoryStats[q.category].total += 1;
    if (answersMap[q.id] === q.correctAnswer) {
      correctCount += 1;
      categoryStats[q.category].correct += 1;
    }
  }

  const accuracy = Math.round((correctCount / (totalQuestions || 1)) * 100);

  const sectionMeta = {
    'Grammar': {
      title: 'GRAMMAR DECISIONS',
      subtitle: 'Grammatical mechanics & complex reported tenses.'
    },
    'Vocabulary': {
      title: 'C-SUITE LEXICAL RESOURCE',
      subtitle: 'Precision corporate collocations & registry.'
    },
    'Situations': {
      title: 'COMMUNICATION JUDGMENT',
      subtitle: 'Tactful, leadership-aligned workplace decisions.'
    }
  };

  const sectionRatings = Object.keys(categoryStats).map(cat => {
    const stats = categoryStats[cat];
    const percentage = Math.round((stats.correct / (stats.total || 1)) * 100);
    const meta = sectionMeta[cat] || {
      title: `${cat.toUpperCase()} MASTERY`,
      subtitle: `Key competencies in ${cat.toLowerCase()} assessment.`
    };

    let badge = 'NEEDS IMPROVEMENT';
    let badgeType = 'warning';
    if (percentage >= 75) {
      badge = 'STRONG';
      badgeType = 'success';
    } else if (percentage >= 55) {
      badge = 'COMPETENT';
      badgeType = 'info';
    }

    return {
      category: cat,
      title: meta.title,
      subtitle: meta.subtitle,
      score: stats.correct,
      total: stats.total,
      percentage,
      badge,
      badgeType
    };
  });

  let cefrLevel = 'A1-';
  if (accuracy >= 92) cefrLevel = 'B2+';
  else if (accuracy >= 85) cefrLevel = 'B2';
  else if (accuracy >= 78) cefrLevel = 'B2-';
  else if (accuracy >= 70) cefrLevel = 'B1+';
  else if (accuracy >= 62) cefrLevel = 'B1';
  else if (accuracy >= 54) cefrLevel = 'B1-';
  else if (accuracy >= 46) cefrLevel = 'A2+';
  else if (accuracy >= 38) cefrLevel = 'A2';
  else if (accuracy >= 30) cefrLevel = 'A2-';
  else if (accuracy >= 22) cefrLevel = 'A1+';
  else if (accuracy >= 15) cefrLevel = 'A1';
  else cefrLevel = 'A1-';

  const recommendedPath = CEFR_LEARNING_PATHS[cefrLevel] || CEFR_LEARNING_PATHS['B1-'];

  let stageTitle = 'Pre-Independent Communicator';
  let stageDescription = 'Can handle most workplace interactions with occasional difficulty.';
  let diagnosticSummary = 'Most workplace interactions can be managed independently. However, more complex discussions may expose gaps in fluency, precision, and language control that reduce overall communication effectiveness.';

  if (accuracy >= 85) {
    stageTitle = 'Executive Leader Communicator';
    stageDescription = 'Commands high-stakes executive discourse with fluency, nuance, and strategic authority.';
    diagnosticSummary = 'Exhibits exceptional command of executive discourse, nuanced tone calibration, and precise corporate vocabulary. Communication inspires trust and drives consensus in high-stakes boardroom environments.';
  } else if (accuracy >= 70) {
    stageTitle = 'Strategic Communicator';
    stageDescription = 'Delivers clear, impactful business arguments and handles complex negotiations effectively.';
    diagnosticSummary = 'Demonstrates strong fluency and professional composure across most corporate scenarios. Occasional minor lapses in high-pressure nuance, but consistently persuasive, structured, and clear.';
  } else if (accuracy >= 50) {
    stageTitle = 'Pre-Independent Communicator';
    stageDescription = 'Can handle most workplace interactions with occasional difficulty.';
    diagnosticSummary = 'Most workplace interactions can be managed independently. However, more complex discussions may expose gaps in fluency, precision, and language control that reduce overall communication effectiveness.';
  } else {
    stageTitle = 'Emerging Operational Communicator';
    stageDescription = 'Demonstrates basic workplace competence but requires structured support in executive articulation.';
    diagnosticSummary = 'Core workplace concepts are understood, but high-impact presentations, diplomatically sensitive negotiations, and advanced corporate phrasing require targeted refinement.';
  }

  return {
    candidate: {
      name: user ? user.name : 'Candidate',
      email: user ? user.email : '',
      role: user && user.job_title ? user.job_title : (user && user.company ? `${user.company} Executive` : 'Executive Candidate'),
      linkedin: user ? user.linkedin : ''
    },
    score: correctCount,
    totalQuestions,
    accuracy,
    cefrLevel,
    cSuiteStage: {
      title: stageTitle,
      description: stageDescription
    },
    diagnosticSummary,
    sectionRatings,
    recommendedPath
  };
};

export const register = async (candidateData) => {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData)
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    // Network / static host fallback
  }

  // Fallback for static hosting (GitHub Pages)
  const localUser = {
    id: Date.now(),
    role: 'CANDIDATE',
    ...candidateData
  };
  const token = 'local-token-' + Date.now();
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(localUser));
  localStorage.removeItem('local_answers');
  localStorage.removeItem('local_infractions');
  return { token, user: localUser };
};

export const adminLogin = async (email, password) => {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }

  if (email === 'admin' && password === 'admin@123123') {
    const adminUser = { id: 1, name: 'Administrator', email: 'admin', role: 'ADMIN' };
    const token = 'admin-token-' + Date.now();
    return { token, user: adminUser };
  }
  throw new Error('Invalid credentials');
};

export const login = adminLogin;

export const startAssessment = async () => {
  try {
    const res = await fetch(`${API_URL}/assessment/start`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }

  localStorage.removeItem('local_answers');
  const formatted = assessmentQuestions.map(q => ({
    id: q.id,
    category: q.category,
    text: q.text,
    options: q.options
  }));

  return {
    assessmentId: Date.now(),
    question: formatted[0],
    questions: formatted,
    answers: {},
    questionIndex: 0,
    totalQuestions: formatted.length,
    categories: getCategoryMap(formatted)
  };
};

export const getCurrentAssessment = async () => {
  try {
    const res = await fetch(`${API_URL}/assessment/current`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }

  const rawAnswers = JSON.parse(localStorage.getItem('local_answers') || '{}');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const formatted = assessmentQuestions.map(q => ({
    id: q.id,
    category: q.category,
    text: q.text,
    options: q.options
  }));

  const answerCount = Object.keys(rawAnswers).length;
  if (answerCount >= formatted.length) {
    const results = calculateLocalReport(user, rawAnswers);
    return { finished: true, results };
  }

  return {
    assessmentId: Date.now(),
    question: formatted[answerCount] || formatted[0],
    questions: formatted,
    answers: rawAnswers,
    questionIndex: answerCount,
    totalQuestions: formatted.length,
    categories: getCategoryMap(formatted)
  };
};

export const submitAnswer = async (assessmentId, questionId, selectedOption, isFinal = false) => {
  try {
    const res = await fetch(`${API_URL}/assessment/submit-answer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ assessmentId, questionId, selectedOption, isFinal })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }

  const rawAnswers = JSON.parse(localStorage.getItem('local_answers') || '{}');
  rawAnswers[questionId] = selectedOption;
  localStorage.setItem('local_answers', JSON.stringify(rawAnswers));

  const answerCount = Object.keys(rawAnswers).length;
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (isFinal || answerCount >= assessmentQuestions.length) {
    const report = calculateLocalReport(user, rawAnswers);
    return { finished: true, results: report };
  }

  const formatted = assessmentQuestions.map(q => ({
    id: q.id,
    category: q.category,
    text: q.text,
    options: q.options
  }));

  return {
    success: true,
    totalQuestions: formatted.length,
    categories: getCategoryMap(formatted)
  };
};

export const logInfraction = async (assessmentId, type) => {
  try {
    const res = await fetch(`${API_URL}/assessment/log-infraction`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ assessmentId, type })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }
  const currentCount = parseInt(localStorage.getItem('local_infractions') || '0', 10) + 1;
  localStorage.setItem('local_infractions', currentCount.toString());
  return { success: true, infractionsCount: currentCount };
};

export const bookSpeakingAssessment = async (bookingData) => {
  try {
    const res = await fetch(`${API_URL}/assessment/book-speaking`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bookingData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }
  localStorage.setItem('local_booking', JSON.stringify(bookingData));
  return { success: true, bookingId: Date.now() };
};

export const getAdminUsers = async () => {
  const res = await fetch(`${API_URL}/admin/users`, {
    method: 'GET',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch admin users');
  return res.json();
};

export const getAdminAssessmentDetails = async (id) => {
  const res = await fetch(`${API_URL}/admin/assessments/${id}`, {
    method: 'GET',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch assessment details');
  return res.json();
};

export const getAdminAssessments = async () => {
  try {
    const res = await fetch(`${API_URL}/admin/assessments`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }
  return [];
};

export const clearAllResponses = async () => {
  try {
    const res = await fetch(`${API_URL}/admin/clear-responses`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }
  localStorage.removeItem('local_answers');
  localStorage.removeItem('local_infractions');
  localStorage.removeItem('local_booking');
  return { success: true };
};

export const getAdminQuestions = async () => {
  try {
    const res = await fetch(`${API_URL}/questions`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }

  const stored = localStorage.getItem('local_custom_questions');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }

  const initial = assessmentQuestions.map(q => ({
    id: q.id,
    category: q.category,
    text: q.text,
    options: q.options,
    correct_answer: q.correctAnswer !== undefined ? q.correctAnswer : 0
  }));
  localStorage.setItem('local_custom_questions', JSON.stringify(initial));
  return initial;
};

export const createQuestion = async (questionData) => {
  try {
    const res = await fetch(`${API_URL}/questions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(questionData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }

  const questions = await getAdminQuestions();
  const newQuestion = {
    id: Date.now(),
    category: questionData.category,
    text: questionData.text,
    options: questionData.options,
    correct_answer: questionData.correctAnswer !== undefined ? questionData.correctAnswer : (questionData.correct_answer || 0)
  };
  questions.push(newQuestion);
  localStorage.setItem('local_custom_questions', JSON.stringify(questions));
  return newQuestion;
};

export const updateQuestion = async (id, questionData) => {
  try {
    const res = await fetch(`${API_URL}/questions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(questionData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }

  const questions = await getAdminQuestions();
  const idx = questions.findIndex(q => q.id === id);
  if (idx !== -1) {
    questions[idx] = {
      ...questions[idx],
      category: questionData.category,
      text: questionData.text,
      options: questionData.options,
      correct_answer: questionData.correctAnswer !== undefined ? questionData.correctAnswer : (questionData.correct_answer || 0)
    };
    localStorage.setItem('local_custom_questions', JSON.stringify(questions));
    return questions[idx];
  }
  return { id, ...questionData };
};

export const deleteQuestion = async (id) => {
  try {
    const res = await fetch(`${API_URL}/questions/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }

  const questions = await getAdminQuestions();
  const filtered = questions.filter(q => q.id !== id);
  localStorage.setItem('local_custom_questions', JSON.stringify(filtered));
  return { success: true };
};

// --- Contact / Get in Touch Messages API ---

export const submitContactMessage = async (messageData) => {
  try {
    const res = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }

  // Local fallback for static hosting
  const stored = JSON.parse(localStorage.getItem('local_contact_messages') || '[]');
  const newMessage = {
    id: Date.now(),
    name: messageData.name,
    email: messageData.email,
    phone: messageData.phone || '',
    company: messageData.company || '',
    subject: messageData.subject || 'General Inquiry',
    message: messageData.message,
    created_at: new Date().toISOString()
  };
  stored.unshift(newMessage);
  localStorage.setItem('local_contact_messages', JSON.stringify(stored));
  return { success: true, messageId: newMessage.id };
};

export const getAdminMessages = async () => {
  try {
    const res = await fetch(`${API_URL}/admin/messages`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }

  const stored = JSON.parse(localStorage.getItem('local_contact_messages') || '[]');
  return stored;
};

export const deleteAdminMessage = async (id) => {
  try {
    const res = await fetch(`${API_URL}/admin/messages/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }

  const stored = JSON.parse(localStorage.getItem('local_contact_messages') || '[]');
  const filtered = stored.filter(m => m.id !== id);
  localStorage.setItem('local_contact_messages', JSON.stringify(filtered));
  return { success: true };
};

export const clearAdminMessages = async () => {
  try {
    const res = await fetch(`${API_URL}/admin/clear-messages`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }

  localStorage.removeItem('local_contact_messages');
  return { success: true };
};
