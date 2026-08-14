const API_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const register = async (candidateData) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(typeof candidateData === 'object' ? candidateData : { name: candidateData, email: arguments[1] })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};

export const adminLogin = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};

export const login = adminLogin;

export const startAssessment = async () => {
  const res = await fetch(`${API_URL}/assessment/start`, {
    method: 'POST',
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};

export const getCurrentAssessment = async () => {
  const res = await fetch(`${API_URL}/assessment/current`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};

export const submitAnswer = async (assessmentId, questionId, selectedOption, isFinal = false) => {
  const res = await fetch(`${API_URL}/assessment/submit-answer`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ assessmentId, questionId, selectedOption, isFinal })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit answer');
  return data;
};

export const logInfraction = async (assessmentId, type) => {
  const res = await fetch(`${API_URL}/assessment/log-infraction`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ assessmentId, type })
  });
  return res.json();
};

export const bookSpeakingAssessment = async (bookingData) => {
  const res = await fetch(`${API_URL}/assessment/book-speaking`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(bookingData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit booking');
  return data;
};

export const getAdminUsers = async () => {
  const res = await fetch(`${API_URL}/admin/users`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};

export const getAdminAssessmentDetails = async (id) => {
  const res = await fetch(`${API_URL}/admin/assessments/${id}`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};

export const getAdminAssessments = async () => {
  const res = await fetch(`${API_URL}/admin/assessments`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};

export const getAdminQuestions = async () => {
  const res = await fetch(`${API_URL}/questions`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};

export const createQuestion = async (questionData) => {
  const res = await fetch(`${API_URL}/questions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(questionData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};

export const updateQuestion = async (id, questionData) => {
  const res = await fetch(`${API_URL}/questions/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(questionData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};

export const deleteQuestion = async (id) => {
  const res = await fetch(`${API_URL}/questions/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
};
