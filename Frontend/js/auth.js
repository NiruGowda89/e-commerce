if (typeof API_URL === "undefined") {
  window.API_URL = "https://e-commerce-1-ariz.onrender.com/api";
}
var API_URL = window.API_URL;


// ─── Storage Keys ─────────────────────────────────────────────────────────────
var AUTH_KEY       = 'urbanManUser';
var ADMIN_AUTH_KEY = 'urbanManAdmin';

// ─── Admin Role Checks ─────────────────────────────────────────────────────────

function getAdmin() {
  const user = getCurrentUser();
  if (user && user.role === 'ADMIN') {
    return user;
  }
  return null;
}

function logoutAdmin() {
  logoutUser();
}

function requireAdmin() {
  if (!getAdmin()) {
    window.location.href = 'login.html';
  }
}

// ─── User Auth ────────────────────────────────────────────────────────────────
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); }
  catch(e) { return null; }
}

async function registerUser(name, email, phone, password) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });

    const data = await response.json();
    if (!response.ok) {
      return { ok: false, msg: data.error || 'Registration failed.' };
    }

    const user = {
      id: data.user?.id || null,
      name: data.user?.name || name,
      email: data.user?.email || email,
      phone: data.user?.phone || phone
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return { ok: true, user };
  } catch (error) {
    return { ok: false, msg: 'Unable to register. Please try again.' };
  }
}

async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      return { ok: false, msg: data.error || 'Invalid credentials.' };
    }

    const user = {
      id: data.user?.id || null,
      name: data.user?.name || email.split('@')[0],
      email: data.user?.email || email,
      role: data.user?.role || 'USER'
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    localStorage.setItem('authToken', data.token || '');
    return { ok: true, user };
  } catch (error) {
    return { ok: false, msg: 'Unable to login. Please try again.' };
  }
}

function logoutUser() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem('authToken');
  window.location.href = 'login.html';
}

// ─── Navbar Auth Display ───────────────────────────────────────────────────────
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

document.addEventListener('DOMContentLoaded', refreshAuthNav);
