// ─── Hash Router — Karunada Collection Mobile ─────────────────────────────────
const Router = (() => {
  'use strict';

  const routes = {};
  let _current = 'home';
  let _transitioning = false;

  // ── Header config per screen ────────────────────────────────────────────────
  const HEADER_CFG = {
    home:        { title: 'Karunada',     back: false, search: true,  cart: true  },
    shop:        { title: 'Shop',         back: false, search: true,  cart: true  },
    cart:        { title: 'My Cart',      back: false, search: false, cart: false },
    favourites:  { title: 'Favourites',   back: false, search: false, cart: true  },
    account:     { title: 'Account',      back: false, search: false, cart: true  },
    product:     { title: '',             back: true,  search: false, cart: true  },
    checkout:    { title: 'Checkout',     back: true,  search: false, cart: false },
    orders:      { title: 'My Orders',    back: true,  search: false, cart: true  },
    search:      { title: 'Search',       back: true,  search: false, cart: true  },
    offers:      { title: '🔥 Offers',    back: false, search: false, cart: true  },
    newarrivals: { title: '✨ New Arrivals', back: false, search: false, cart: true  },
  };

  // ── Register a route ────────────────────────────────────────────────────────
  function register(name, fn) { routes[name] = fn; }

  // ── Navigate programmatically ────────────────────────────────────────────────
  async function navigate(name, params = {}) {
    const url = params.id ? `#${name}/${params.id}` : `#${name}`;
    history.pushState({ name, params }, '', url);
    await _render(name, params);
  }

  function back() { history.back(); }

  // ── Internal render ─────────────────────────────────────────────────────────
  async function _render(name, params = {}) {
    if (_transitioning) return;
    _transitioning = true;

    const handler = routes[name] || routes['home'];
    const wrap = document.getElementById('screen-wrap');
    if (!wrap) { _transitioning = false; return; }

    // Slide out
    wrap.classList.add('slide-out');
    await _sleep(160);

    try {
      wrap.innerHTML = await handler(params);
    } catch (e) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Something went wrong</p></div>`;
      console.error(e);
    }

    wrap.classList.remove('slide-out');
    wrap.classList.add('slide-in');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => wrap.classList.remove('slide-in'));
    });

    _current = name;
    _updateHeader(name, params);
    _updateBottomNav(name);
    wrap.scrollTop = 0;

    // Run screen init
    const initFn = window[`kcInit_${name}`];
    if (typeof initFn === 'function') initFn(params);

    _transitioning = false;
  }

  // ── Update header UI ────────────────────────────────────────────────────────
  function _updateHeader(name) {
    const cfg = HEADER_CFG[name] || { title: name, back: true, search: false, cart: true };
    const elTitle  = document.getElementById('hdr-title');
    const elBack   = document.getElementById('hdr-back');
    const elSearch = document.getElementById('hdr-search');
    const elCart   = document.getElementById('hdr-cart');
    if (elTitle)  elTitle.textContent  = cfg.title;
    if (elBack)   elBack.style.display   = cfg.back   ? 'flex' : 'none';
    if (elSearch) elSearch.style.display = cfg.search ? 'flex' : 'none';
    if (elCart)   elCart.style.display   = cfg.cart   ? 'flex' : 'none';
  }

  // ── Update bottom nav active state ──────────────────────────────────────────
  function _updateBottomNav(name) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.screen === name);
    });
  }

  // ── Init: parse hash on load + handle popstate ──────────────────────────────
  function init() {
    window.addEventListener('popstate', () => {
      const [name, ...rest] = (location.hash.slice(1) || 'home').split('/');
      _render(name || 'home', { id: rest.join('/') });
    });
    const [name, ...rest] = (location.hash.slice(1) || 'home').split('/');
    _render(name || 'home', { id: rest.join('/') });
  }

  function current() { return _current; }
  function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  return { register, navigate, back, init, current };
})();
