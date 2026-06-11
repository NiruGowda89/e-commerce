// ─── Storage Keys ─────────────────────────────────────────────────────────────
var AUTH_KEY       = 'urbanManUser';
var USERS_KEY      = 'urbanManUsers';
var ADMIN_AUTH_KEY = 'urbanManAdmin';

// ─── Admin Credentials ────────────────────────────────────────────────────────
var ADMIN_CREDENTIALS = [
  { username: 'admin',    password: 'admin123',  name: 'Super Admin'    },
  { username: 'karunada', password: 'karu@2026', name: 'Karunada Admin' }
];

// ─── Admin Auth ───────────────────────────────────────────────────────────────
function getAdmin() {
  try { return JSON.parse(localStorage.getItem(ADMIN_AUTH_KEY) || 'null'); }
  catch(e) { return null; }
}

function loginAdmin(username, password) {
  var match = null;
  for (var i = 0; i < ADMIN_CREDENTIALS.length; i++) {
    if (ADMIN_CREDENTIALS[i].username === username.trim() &&
        ADMIN_CREDENTIALS[i].password === password) {
      match = ADMIN_CREDENTIALS[i];
      break;
    }
  }
  if (!match) return { ok: false, msg: 'Invalid username or password.' };
  localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify({ username: match.username, name: match.name }));
  return { ok: true };
}

function logoutAdmin() {
  localStorage.removeItem(ADMIN_AUTH_KEY);
  window.location.href = 'login.html?tab=admin';
}

function requireAdmin() {
  if (!getAdmin()) {
    window.location.href = 'login.html?tab=admin';
  }
}

// ─── User Auth ────────────────────────────────────────────────────────────────
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); }
  catch(e) { return null; }
}

function getStoredUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch(e) { return []; }
}

function registerUser(name, email, phone, password) {
  var users = getStoredUsers();
  var exists = users.find(function(u) {
    return u.email.toLowerCase() === email.toLowerCase();
  });
  if (exists) {
    return { ok: false, msg: 'An account with this email already exists.' };
  }
  var user = {
    id: Date.now(),
    name: name,
    email: email.toLowerCase(),
    phone: phone,
    password: password,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(AUTH_KEY, JSON.stringify({
    id: user.id, name: user.name, email: user.email, phone: user.phone
  }));
  // Try backend (non-blocking)
  try {
    fetch('http://10.247.200.19:8080/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, phone: phone, password: password })
    }).catch(function() {});
  } catch(e) {}
  return { ok: true, user: user };
}

function loginUser(email, password) {
  var users = getStoredUsers();
  var user = users.find(function(u) {
    return u.email.toLowerCase() === email.toLowerCase().trim() &&
           u.password === password;
  });
  if (!user) return { ok: false, msg: 'Invalid email or password.' };
  localStorage.setItem(AUTH_KEY, JSON.stringify({
    id: user.id, name: user.name, email: user.email, phone: user.phone
  }));
  return { ok: true, user: user };
}

function logoutUser() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'login.html';
}

// ─── Navbar Login Button ──────────────────────────────────────────────────────
function refreshAuthNav() {
  var authEl = document.getElementById('authNav');
  if (!authEl) return;

  var user = getCurrentUser();

  if (user) {
    authEl.innerHTML =
      '<li class="nav-item dropdown">' +
        '<a class="nav-link dropdown-toggle" href="#" id="userDropdown" ' +
           'data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
          '👤 ' + user.name.split(' ')[0] +
        '</a>' +
        '<div class="dropdown-menu dropdown-menu-right" aria-labelledby="userDropdown">' +
          '<span class="dropdown-item-text text-muted small">' + user.email + '</span>' +
          '<div class="dropdown-divider"></div>' +
          '<a class="dropdown-item" href="orders.html">📦 My Orders</a>' +
          '<div class="dropdown-divider"></div>' +
          '<a class="dropdown-item text-danger" href="#" onclick="logoutUser();return false;">🚪 Logout</a>' +
        '</div>' +
      '</li>';
  } else {
    authEl.innerHTML =
      '<li class="nav-item">' +
        '<a class="nav-link font-weight-bold" href="login.html" ' +
           'style="color:#ffc107;border:1px solid #ffc107;border-radius:6px;padding:5px 12px;margin-left:4px;">' +
          '👤 Login' +
        '</a>' +
      '</li>';
  }
}

// Run immediately when script loads AND on DOMContentLoaded
refreshAuthNav();
document.addEventListener('DOMContentLoaded', refreshAuthNav);
