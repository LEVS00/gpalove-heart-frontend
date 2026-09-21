/* ============================================================
   GPALove_heart — API Connector
   Connecte le frontend au backend Render
   ============================================================ */

const API_URL = 'https://gpalove-heart-backend.onrender.com';

/* ---------- TOKEN ---------- */
function getToken() { return localStorage.getItem('gpalove_token'); }
function setToken(t) { localStorage.setItem('gpalove_token', t); }
function clearToken() { localStorage.removeItem('gpalove_token'); }

/* ---------- USER CACHE ---------- */
function cacheUser(u) { localStorage.setItem('gpalove_user', JSON.stringify(u)); }
function getCachedUser() {
  try { return JSON.parse(localStorage.getItem('gpalove_user')); }
  catch { return null; }
}
function clearCache() {
  localStorage.removeItem('gpalove_user');
  localStorage.removeItem('gpalove_token');
}

/* ---------- FETCH WRAPPER ---------- */
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const config = { ...options, headers: { ...headers, ...(options.headers || {}) } };
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(API_URL + path, config);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erreur serveur');
    return data;
  } catch (e) {
    console.error('API error:', path, e.message);
    throw e;
  }
}

/* ============================================================
   AUTHENTIFICATION
   ============================================================ */
async function apiRegister({ nom, email, tel, password }) {
  return api('/api/auth/register', {
    method: 'POST',
    body: { nom, email, tel, password }
  });
}

async function apiVerify(email, code) {
  const data = await api('/api/auth/verify', {
    method: 'POST',
    body: { email, code }
  });
  if (data.token) setToken(data.token);
  if (data.user) cacheUser(data.user);
  return data;
}

async function apiLogin(email, password) {
  const data = await api('/api/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  if (data.token) setToken(data.token);
  if (data.user) cacheUser(data.user);
  return data;
}

async function apiResendCode(email) {
  return api('/api/auth/resend', { method: 'POST', body: { email } });
}

function apiLogout() {
  clearCache();
  location.href = 'index.html';
}

/* ============================================================
   UTILISATEUR
   ============================================================ */
async function apiGetMe() {
  const u = await api('/api/users/me');
  cacheUser(u);
  return u;
}

async function apiUpdateProfile(nom) {
  return api('/api/users/me', { method: 'PUT', body: { nom } });
}

async function apiTrackOnline(ms) {
  return api('/api/users/online', { method: 'POST', body: { ms } });
}

async function apiClaimBonus() {
  return api('/api/users/claim-bonus', { method: 'POST' });
}

/* ============================================================
   TRANSACTIONS
   ============================================================ */
async function apiDeposit(amount, txId) {
  return api('/api/transactions/deposit', {
    method: 'POST',
    body: { amount, txId }
  });
}

async function apiWithdraw(amount, operator, number) {
  return api('/api/transactions/withdraw', {
    method: 'POST',
    body: { amount, operator, number }
  });
}

async function apiGetTransactions() {
  return api('/api/transactions');
}

/* ============================================================
   MÈRES PORTEUSES
   ============================================================ */
async function apiGetSurrogates() {
  return api('/api/surrogates');
}

async function apiGetSurrogate(id) {
  return api('/api/surrogates/' + id);
}

async function apiIncrementChosen(id) {
  return api('/api/surrogates/' + id + '/chosen', { method: 'POST' });
}

/* ============================================================
   CAMPAGNES / DONS / INVESTISSEMENTS
   ============================================================ */
async function apiGetCampaigns(category) {
  const q = category && category !== 'all' ? '?category=' + category : '';
  return api('/api/campaigns' + q);
}

async function apiDonate(campaignId) {
  return api('/api/campaigns/' + campaignId + '/donate', { method: 'POST' });
}

/* ============================================================
   TÉMOIGNAGES & FORMATIONS
   ============================================================ */
async function apiGetTestimonials(limit = 20) {
  return api('/api/testimonials?limit=' + limit);
}

async function apiGetFormations(q = '', limit = 24) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  params.set('limit', limit);
  return api('/api/formations?' + params.toString());
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */
async function apiGetNotifications() {
  return api('/api/notifications');
}

async function apiReport(message) {
  return api('/api/notifications/report', {
    method: 'POST',
    body: { message }
  });
}

/* ============================================================
   ADMIN
   ============================================================ */
const admin = {
  getUsers: () => api('/api/admin/users'),
  getDeposits: () => api('/api/admin/deposits'),
  getWithdrawals: () => api('/api/admin/withdrawals'),
  getStats: () => api('/api/admin/stats'),
  suspend: (id) => api('/api/admin/users/' + id + '/suspend', { method: 'PUT' }),
  addBalance: (id, amount) => api('/api/admin/users/' + id + '/balance', { method: 'PUT', body: { amount } }),
  resetBalance: (id) => api('/api/admin/users/' + id + '/reset', { method: 'PUT' }),
  makePro: (id) => api('/api/admin/users/' + id + '/pro', { method: 'PUT' }),
  approveDeposit: (id) => api('/api/admin/deposits/' + id + '/approve', { method: 'PUT' }),
  rejectDeposit: (id) => api('/api/admin/deposits/' + id + '/reject', { method: 'PUT' }),
  approveWithdraw: (id) => api('/api/admin/withdrawals/' + id + '/approve', { method: 'PUT' }),
  rejectWithdraw: (id) => api('/api/admin/withdrawals/' + id + '/reject', { method: 'PUT' }),
  createCampaign: (data) => api('/api/admin/campaigns', { method: 'POST', body: data }),
  deleteCampaign: (id) => api('/api/admin/campaigns/' + id, { method: 'DELETE' }),
  aiImportSurrogate: (rawText) => api('/api/admin/surrogates/ai-import', { method: 'POST', body: { rawText } }),
  verifySurrogate: (id) => api('/api/admin/surrogates/' + id + '/verify', { method: 'PUT' }),
  deleteSurrogate: (id) => api('/api/admin/surrogates/' + id, { method: 'DELETE' }),
  sendNotification: (to, msg) => api('/api/admin/notifications', { method: 'POST', body: { to, msg } }),
  gift: (email, amount) => api('/api/admin/gift', { method: 'POST', body: { email, amount } })
};

/* ============================================================
   UTILITAIRES
   ============================================================ */
const PI_TO_XAF = 6000;
const MIN_DEPOSIT_PI = 0.5;

function fmtPi(v) { return (+v || 0).toFixed(2) + ' π'; }
function fmtXAF(v) { return Math.round((+v || 0) * PI_TO_XAF).toLocaleString('fr-FR') + ' XAF'; }
function dateStr(ts) { return new Date(ts).toLocaleString('fr-FR'); }

function toast(msg, type = '') {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.className = 'toast ' + type;
  t.textContent = msg;
  setTimeout(() => t.classList.add('show'), 20);
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove('show'), 3500);
}

/* ---------- VALIDATIONS ---------- */
function validatePhone(tel) { return /^6\d{8}$/.test(tel); }
function validatePassword(pwd) { return /^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=]).{6,}$/.test(pwd); }
function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

/* ---------- COPIE LIEN MÈRE PORTEUSE ---------- */
async function copySurrogateLink(id) {
  const base = location.origin + location.pathname.replace(/[^/]*$/, '');
  const url = base + 'mere.html?id=' + id;
  try {
    await navigator.clipboard.writeText(url);
    try { await apiIncrementChosen(id); } catch {}
    toast('Lien copié ! Envoyez-le à votre agent WhatsApp.', 'success');
  } catch {
    toast('Copie impossible — copiez manuellement : ' + url, 'error');
  }
}

/* ---------- GUARD : page protégée ---------- */
function requireAuth(redirect = 'auth.html') {
  if (!getToken()) {
    location.href = redirect;
    return null;
  }
  return getCachedUser();
}

/* ---------- GUARD : admin uniquement ---------- */
function requireAdmin() {
  const u = requireAuth();
  if (u && !u.isAdmin) { location.href = 'dashboard.html'; return null; }
  return u;
}

/* ---------- TRACKING TEMPS EN LIGNE ---------- */
let _onlineStart = Date.now();
setInterval(() => {
  if (!getToken()) return;
  const elapsed = Date.now() - _onlineStart;
  if (elapsed > 60000) {
    apiTrackOnline(elapsed).catch(() => {});
    _onlineStart = Date.now();
  }
}, 60000);

window.addEventListener('beforeunload', () => {
  if (!getToken()) return;
  const elapsed = Date.now() - _onlineStart;
  if (elapsed > 30000) {
    try { navigator.sendBeacon(API_URL + '/api/users/online', new Blob([JSON.stringify({ ms: elapsed })], { type: 'application/json' })); } catch {}
  }
});

