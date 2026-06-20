// Inkwell — API helper
// Change API_BASE if your backend runs somewhere other than localhost:5050.
const API_BASE = 'http://localhost:5050/api';

function getToken() {
  return localStorage.getItem('ink_token');
}
function getStoredUser() {
  const raw = localStorage.getItem('ink_user');
  return raw ? JSON.parse(raw) : null;
}
function setSession(token, user) {
  localStorage.setItem('ink_token', token);
  localStorage.setItem('ink_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('ink_token');
  localStorage.removeItem('ink_user');
}

// Wraps fetch with the API base URL, JSON headers, and the auth token (if present).
async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await res.json();
  } catch (_) {
    /* empty body */
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

// Renders the shared header auth area (login button vs. name + new post + logout)
function renderAuthArea() {
  const user = getStoredUser();
  const el = document.getElementById('authArea');
  if (!el) return;

  if (user) {
    el.innerHTML = `
      <a class="icon-btn" href="editor.html">New post</a>
      <button class="icon-btn" id="logoutBtn">Log out (${escapeHtml(user.name.split(' ')[0])})</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', () => {
      clearSession();
      window.location.href = 'index.html';
    });
  } else {
    el.innerHTML = `<button class="icon-btn" id="loginOpenBtn">Log in</button>`;
    document.getElementById('loginOpenBtn').addEventListener('click', () => openAuthModal());
  }
}

// ---------- Shared auth modal (used on index.html and post.html) ----------

function openAuthModal() {
  const overlay = document.getElementById('authModalOverlay');
  if (overlay) {
    overlay.classList.add('open');
    document.getElementById('authError').classList.remove('show');
  }
}
function closeAuthModal() {
  const overlay = document.getElementById('authModalOverlay');
  if (overlay) overlay.classList.remove('open');
}
function setAuthTab(tab) {
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('loginTab').classList.toggle('active', tab === 'login');
  document.getElementById('registerTab').classList.toggle('active', tab === 'register');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errBox = document.getElementById('authError');
  try {
    const { token, user } = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    setSession(token, user);
    closeAuthModal();
    renderAuthArea();
    if (typeof onAuthChanged === 'function') onAuthChanged();
    showToast(`Welcome back, ${user.name.split(' ')[0]}.`);
  } catch (err) {
    errBox.textContent = err.message;
    errBox.classList.add('show');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const errBox = document.getElementById('authError');
  try {
    const { token, user } = await apiRequest('/auth/register', { method: 'POST', body: { name, email, password } });
    setSession(token, user);
    closeAuthModal();
    renderAuthArea();
    if (typeof onAuthChanged === 'function') onAuthChanged();
    showToast(`Account created. Welcome, ${user.name.split(' ')[0]}.`);
  } catch (err) {
    errBox.textContent = err.message;
    errBox.classList.add('show');
  }
}

function wireAuthModal() {
  const loginTab = document.getElementById('loginTab');
  if (!loginTab) return;
  loginTab.addEventListener('click', () => setAuthTab('login'));
  document.getElementById('registerTab').addEventListener('click', () => setAuthTab('register'));
  document.getElementById('authModalClose').addEventListener('click', closeAuthModal);
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
}
