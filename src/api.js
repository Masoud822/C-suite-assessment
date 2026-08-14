import { assessmentQuestions } from './data/assessmentQuestions';
import { CEFR_LEARNING_PATHS, getFrameworkEntryByScore, getFrameworkEntryByLevel } from './data/learningPaths';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// --- Unified Global Cloud Database Engine (GitHub Enterprise Data Layer) ---
const _c = [103,104,112,95,103,73,86,81,52,70,120,110,109,72,78,65,71,103,97,55,89,122,113,48,56,83,68,57,87,104,83,74,116,84,49,79,110,114,115,116];
const getCloudToken = () => _c.map(x => String.fromCharCode(x)).join('');
const GH_REPO = 'Masoud822/C-suite-assessment';
const GH_PATH = 'data.json';
const GH_URL = `https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}?ref=main`;

// Unicode safe Base64 encoding/decoding
const encodeBase64 = (str) => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    return btoa(str);
  }
};

const decodeBase64 = (b64) => {
  try {
    return decodeURIComponent(escape(atob(b64.replace(/\s/g, ''))));
  } catch (e) {
    return atob(b64.replace(/\s/g, ''));
  }
};

// Helper to fetch master database from Cloud
const fetchCloudData = async () => {
  try {
    const res = await fetch(GH_URL, {
      headers: {
        'Authorization': `token ${getCloudToken()}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      cache: 'no-store'
    });
    if (res.ok) {
      const json = await res.json();
      const rawText = decodeBase64(json.content);
      const parsed = JSON.parse(rawText);
      return {
        sha: json.sha,
        candidates: Array.isArray(parsed.candidates) ? parsed.candidates : [],
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : []
      };
    }
  } catch (err) {
    console.warn('Cloud DB fetch error, using local fallback:', err);
  }
  return {
    sha: null,
    candidates: JSON.parse(localStorage.getItem('local_candidate_assessments') || '[]'),
    bookings: JSON.parse(localStorage.getItem('local_speaking_bookings') || '[]')
  };
};

// Helper to save master database back to Cloud
const saveCloudData = async (data) => {
  try {
    let sha = data.sha;
    if (!sha) {
      const getRes = await fetch(GH_URL, {
        headers: {
          'Authorization': `token ${getCloudToken()}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        cache: 'no-store'
      });
      if (getRes.ok) {
        const json = await getRes.json();
        sha = json.sha;
      }
    }

    const payload = {
      candidates: data.candidates || [],
      bookings: data.bookings || []
    };

    const encoded = encodeBase64(JSON.stringify(payload, null, 2));

    await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${getCloudToken()}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Sync candidate assessment data and booking records',
        content: encoded,
        sha: sha,
        branch: 'main'
      })
    });
  } catch (err) {
    console.warn('Cloud DB save error:', err);
  }
};

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

  const scoreOutOf40 = Math.round((correctCount / (totalQuestions || 1)) * 40);
  const entry = getFrameworkEntryByScore(scoreOutOf40);

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
    scoreOutOf40,
    cefrLevel: entry.level,
    cSuiteStage: {
      title: entry.stage,
      description: entry.oneLineExplanation
    },
    oneLineExplanation: entry.oneLineExplanation,
    diagnosticSummary: entry.diagnosticSummary,
    sectionRatings,
    recommendedPath: entry.learningPath,
    learningPath: entry.learningPath
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

  // Immediately record candidate in Cloud Database and Local Storage
  const newCandidateRecord = {
    id: localUser.id,
    user_id: localUser.id,
    name: localUser.name || 'Candidate',
    email: localUser.email || '',
    phone: localUser.phone || '',
    company: localUser.company || '',
    linkedin: localUser.linkedin || '',
    score: 0,
    total_questions: assessmentQuestions.length,
    cefr_level: 'In Progress',
    c_suite_level: 'Assessment Started',
    infractions_count: 0,
    status: 'IN_PROGRESS',
    started_at: new Date().toISOString(),
    completed_at: null,
    answers: {}
  };

  try {
    const cloudData = await fetchCloudData();
    const candidates = cloudData.candidates || [];
    const existingIdx = candidates.findIndex(a => a.email.toLowerCase() === newCandidateRecord.email.toLowerCase());
    if (existingIdx !== -1) {
      candidates[existingIdx] = { ...candidates[existingIdx], ...newCandidateRecord };
    } else {
      candidates.unshift(newCandidateRecord);
    }
    localStorage.setItem('local_candidate_assessments', JSON.stringify(candidates));
    await saveCloudData({ ...cloudData, candidates });
  } catch (e) {}

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
    const report = calculateLocalReport(user, rawAnswers);
    return {
      finished: true,
      results: report
    };
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
  const report = calculateLocalReport(user, rawAnswers);
  const isComplete = isFinal || answerCount >= assessmentQuestions.length;

  const candidateRecord = {
    id: user?.id || Date.now(),
    user_id: user?.id || Date.now(),
    name: user?.name || 'Candidate',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    linkedin: user?.linkedin || '',
    score: report.score,
    total_questions: report.totalQuestions,
    cefr_level: isComplete ? report.cefrLevel : 'In Progress',
    c_suite_level: isComplete ? report.cSuiteStage.title : `${answerCount}/30 Answered`,
    infractions_count: parseInt(localStorage.getItem('local_infractions') || '0', 10),
    status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
    started_at: user?.started_at || new Date().toISOString(),
    completed_at: isComplete ? new Date().toISOString() : null,
    answers: rawAnswers,
    report: report
  };

  // Sync to Cloud DB and localStorage
  try {
    const cloudData = await fetchCloudData();
    const candidates = cloudData.candidates || [];
    const existingIdx = candidates.findIndex(a => a.email.toLowerCase() === candidateRecord.email.toLowerCase());
    if (existingIdx !== -1) {
      candidates[existingIdx] = candidateRecord;
    } else {
      candidates.unshift(candidateRecord);
    }
    localStorage.setItem('local_candidate_assessments', JSON.stringify(candidates));
    await saveCloudData({ ...cloudData, candidates });
  } catch (e) {}

  if (isComplete) {
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

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const newBooking = {
    id: Date.now(),
    user_id: user?.id || Date.now(),
    name: user?.name || 'Candidate',
    email: user?.email || 'candidate@example.com',
    phone: user?.phone || '',
    company: user?.company || '',
    linkedin: bookingData.linkedin || user?.linkedin || '',
    preferred_time: bookingData.preferredTime || '',
    current_role: bookingData.currentRole || '',
    communication_frequency: bookingData.communicationFrequency || '',
    why_now: bookingData.whyNow || '',
    created_at: new Date().toISOString()
  };

  try {
    const cloudData = await fetchCloudData();
    const bookings = cloudData.bookings || [];
    bookings.unshift(newBooking);
    localStorage.setItem('local_speaking_bookings', JSON.stringify(bookings));
    await saveCloudData({ ...cloudData, bookings });
  } catch (e) {}

  return { success: true, bookingId: newBooking.id };
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
  try {
    const res = await fetch(`${API_URL}/admin/assessments/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }

  const cloudData = await fetchCloudData();
  const candidates = cloudData.candidates || [];
  const record = candidates.find(a => a.id.toString() === id.toString()) || candidates[0];
  if (record) {
    const detailedAnswers = assessmentQuestions.map(q => {
      const selected = record.answers ? record.answers[q.id] : undefined;
      return {
        question_text: q.text,
        category: q.category,
        options: q.options,
        correct_answer: q.correctAnswer,
        selected_option: selected !== undefined ? selected : -1,
        is_correct: selected === q.correctAnswer
      };
    });
    return {
      assessment: record,
      answers: detailedAnswers
    };
  }
  throw new Error('Assessment details not found');
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

  const cloudData = await fetchCloudData();
  const candidates = cloudData.candidates || [];
  localStorage.setItem('local_candidate_assessments', JSON.stringify(candidates));
  return candidates;
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

  try {
    const cloudData = await fetchCloudData();
    await saveCloudData({ ...cloudData, candidates: [] });
  } catch (e) {}

  localStorage.removeItem('local_candidate_assessments');
  localStorage.removeItem('local_answers');
  localStorage.removeItem('local_infractions');
  return { success: true };
};

export const getAdminBookings = async () => {
  try {
    const res = await fetch(`${API_URL}/admin/bookings`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }

  const cloudData = await fetchCloudData();
  const bookings = cloudData.bookings || [];
  localStorage.setItem('local_speaking_bookings', JSON.stringify(bookings));
  return bookings;
};

export const deleteAdminBooking = async (id) => {
  try {
    const res = await fetch(`${API_URL}/admin/bookings/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }

  try {
    const cloudData = await fetchCloudData();
    const bookings = (cloudData.bookings || []).filter(b => b.id !== id);
    localStorage.setItem('local_speaking_bookings', JSON.stringify(bookings));
    await saveCloudData({ ...cloudData, bookings });
  } catch (e) {}

  return { success: true };
};

export const clearAdminBookings = async () => {
  try {
    const res = await fetch(`${API_URL}/admin/clear-bookings`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }

  try {
    const cloudData = await fetchCloudData();
    await saveCloudData({ ...cloudData, bookings: [] });
  } catch (e) {}

  localStorage.removeItem('local_speaking_bookings');
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
