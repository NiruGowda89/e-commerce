// Load Theme preference immediately to avoid flash
(function() {
  const theme = localStorage.getItem('karunada_app_theme') || 'turquoise';
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.className = (document.body.className || '') + ' theme-' + theme;
    });
  } else {
    document.body.className = (document.body.className || '') + ' theme-' + theme;
  }
})();

if (typeof API_URL === "undefined") {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '' || window.location.protocol === 'file:';
  window.API_URL = localStorage.getItem('karunada_api_base') || (isLocal ? "http://localhost:8080/api" : "https://e-commerce-1-ariz.onrender.com/api");
}
var API_URL = window.API_URL;


// ─── Storage Keys ─────────────────────────────────────────────────────────────
var AUTH_KEY       = 'urbanManUser';
var ADMIN_AUTH_KEY = 'urbanManAdmin';

// ─── Admin Role Checks ─────────────────────────────────────────────────────────

function getAdmin() {
  const user = getCurrentUser();
  if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
    return user;
  }
  return null;
}

function getSuperAdmin() {
  const user = getCurrentUser();
  return (user && user.role === 'SUPER_ADMIN') ? user : null;
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
    let menuHtml = '';
    if (user.role === 'SUPER_ADMIN') {
        menuHtml =
            '<a class="dropdown-item" href="super-admin.html">👑 Super Admin Portal</a>' +
            '<a class="dropdown-item" href="admin.html">🛡️ Admin Dashboard</a>';
    } else if (user.role === 'ADMIN') {
        menuHtml = '<a class="dropdown-item" href="admin.html">🛡️ Admin Dashboard</a>';
    } else {
        menuHtml =
            '<a class="dropdown-item" href="account.html#profile">👤 My Account</a>' +
            '<a class="dropdown-item" href="account.html#orders">📦 My Orders</a>' +
            '<a class="dropdown-item" href="account.html#wishlist">❤️ Wishlist</a>';
    }

    authEl.className = 'nav-item dropdown';
    authEl.innerHTML =
        '<a class="nav-link dropdown-toggle" href="account.html" id="userDropdown" ' +
           'data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
          '👤 ' + user.name.split(' ')[0] +
        '</a>' +
        '<div class="dropdown-menu dropdown-menu-right" aria-labelledby="userDropdown">' +
          '<span class="dropdown-item-text text-muted small">' + user.email + '</span>' +
          '<div class="dropdown-divider"></div>' +
          menuHtml +
          '<div class="dropdown-divider"></div>' +
          '<a class="dropdown-item text-danger" href="#" onclick="logoutUser();return false;">🚪 Logout</a>' +
        '</div>';
  } else {
    authEl.className = 'nav-item';
    authEl.innerHTML =
        '<a class="nav-link font-weight-bold" href="login.html" ' +
           'style="color:#ffc107;border:1px solid #ffc107;border-radius:6px;padding:5px 12px;margin-left:4px;">' +
          '👤 Login' +
        '</a>';
  }
}

document.addEventListener('DOMContentLoaded', refreshAuthNav);
