// js/api.js
// -------------------------------------------------------
// Every network call goes through here. The JWT (issued at
// login) is stored in localStorage and attached to every
// authenticated request automatically.
// -------------------------------------------------------
const API_BASE = 'http://localhost:5000/api';

function getToken() { return localStorage.getItem('hunar_token'); }
function getUser() {
  const raw = localStorage.getItem('hunar_user');
  return raw ? JSON.parse(raw) : null;
}
function setSession(token, user) {
  localStorage.setItem('hunar_token', token);
  localStorage.setItem('hunar_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('hunar_token');
  localStorage.removeItem('hunar_user');
}
function isLoggedIn() { return !!getToken(); }
function isAdmin() { return getUser()?.role === 'admin'; }

async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (!token) throw new Error('You need to log in first.');
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const apiGet = (path, auth = false) => apiRequest(path, { auth });
const apiPost = (path, body, auth = false) => apiRequest(path, { method: 'POST', body, auth });
const apiPut = (path, body, auth = false) => apiRequest(path, { method: 'PUT', body, auth });
const apiPatch = (path, body, auth = false) => apiRequest(path, { method: 'PATCH', body, auth });
const apiDelete = (path, auth = false) => apiRequest(path, { method: 'DELETE', auth });
