// api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken() {
  return localStorage.getItem('setrxai_token');
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const error = new Error(errData.error || 'Something went wrong');
    error.status = response.status;
    throw error;
  }

  return response;
}

export const api = {
  signup: (name, email, password) =>
    apiRequest('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }).then(r => r.json()),

  login: (email, password) =>
    apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }).then(r => r.json()),

  getMe: () => apiRequest('/api/auth/me').then(r => r.json()),

  deleteAccount: () => apiRequest('/api/auth/me', { method: 'DELETE' }).then(r => r.json()),

  updateProfile: (name) =>
    apiRequest('/api/auth/me', { method: 'PATCH', body: JSON.stringify({ name }) }).then(r => r.json()),

  changePassword: (currentPassword, newPassword) =>
    apiRequest('/api/auth/me/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) }).then(r => r.json()),

  forgotPassword: (email) =>
    apiRequest('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }).then(r => r.json()),

  verifyOTP: (email, otp) =>
    apiRequest('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }).then(r => r.json()),

  resetPassword: (email, otp, newPassword) =>
    apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }).then(r => r.json()),

  getSessions: () => apiRequest('/api/sessions').then(r => r.json()),

  createSession: (mode, projectId = null) =>
    apiRequest('/api/sessions', { method: 'POST', body: JSON.stringify({ mode, projectId }) }).then(r => r.json()),

  getMessages: (sessionId) =>
    apiRequest(`/api/sessions/${sessionId}/messages`).then(r => r.json()),

  deleteSession: (sessionId) =>
    apiRequest(`/api/sessions/${sessionId}`, { method: 'DELETE' }).then(r => r.json()),

  getProjects: () => apiRequest('/api/projects').then(r => r.json()),

  createProject: (name) =>
    apiRequest('/api/projects', { method: 'POST', body: JSON.stringify({ name }) }).then(r => r.json()),

  deleteProject: (id) =>
    apiRequest(`/api/projects/${id}`, { method: 'DELETE' }).then(r => r.json()),

  parseFile: (fileName, mimeType, base64Data) =>
    apiRequest('/api/parse-file', { method: 'POST', body: JSON.stringify({ fileName, mimeType, data: base64Data }) }).then(r => r.json()),

  chatStream: (mode, messages, sessionId, image, file) => {
    const token = getToken();
    return fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mode, messages, sessionId, image, file }),
    });
  },
};

export { getToken, API_URL };
