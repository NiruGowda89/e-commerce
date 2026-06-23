// ─── Main App — Karunada Collection Mobile ────────────────────────────────────

/* ═══════════════════════════════════════════════════════════════════════════════
   BOOTSTRAP
   ═══════════════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Register all routes
  Router.register('home',       screenHome);
  Router.register('shop',       screenShop);
  Router.register('product',    screenProduct);
  Router.register('cart',       screenCart);
  Router.register('checkout',   screenCheckout);
  Router.register('favourites', screenFavourites);
  Router.register('account',    screenAccount);
  Router.register('orders',     screenOrders);
  Router.register('search',     screenSearch);

  // Listen for state changes to keep badge updated
  AppState.on('cart',  () => updateCartBadge());
  AppState.on('auth',  () => { /* auth change */ });

  updateCartBadge();

  // Header button wiring
  document.getElementById('hdr-back').addEventListener('click', () => Router.back());
  document.getElementById('hdr-search').addEventListener('click', () => Router.navigate('search'));
  document.getElementById('hdr-cart').addEventListener('click', () => Router.navigate('cart'));

  // Bottom nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => Router.navigate(btn.dataset.screen));
  });

  // Offline / online detection
  const banner = document.getElementById('offline-banner');
  function checkOnline() {
    if (!navigator.onLine) banner.classList.add('show');
    else banner.classList.remove('show');
  }
  window.addEventListener('offline', checkOnline);
  window.addEventListener('online',  checkOnline);
  checkOnline();

  // Start router
  Router.init();
});

/* ═══════════════════════════════════════════════════════════════════════════════
   SCREEN INIT CALLBACKS  (called by router after each screen renders)
   ═══════════════════════════════════════════════════════════════════════════════ */

// Home
window.kcInit_home = async function() {
  try {
    let products = await apiGetProducts();
    if (!products || products.length === 0) throw new Error('empty');
    renderFeaturedRail(products.slice(0, 10));
    renderNewArrivalsGrid([...products].reverse().slice(0, 6));
  } catch(e) {
    const notice = document.getElementById('demo-notice');
    if (notice) notice.style.display = 'flex';
    renderFeaturedRail(DEMO_PRODUCTS);
    renderNewArrivalsGrid([...DEMO_PRODUCTS].reverse());
  }
};

function renderFeaturedRail(products) {
  const el = document.getElementById('featured-rail');
  if (!el) return;
  el.innerHTML = products.map(productCardSmall).join('');
}
function renderNewArrivalsGrid(products) {
  const el = document.getElementById('new-arrivals-grid');
  if (!el) return;
  el.innerHTML = products.map(p => productCardGrid(p)).join('');
}

// Shop
window.kcInit_shop = async function(params = {}) {
  const q   = params.q   || document.getElementById('shop-search')?.value || '';
  const cat = params.cat || 'All';

  // Wire search input
  const searchEl = document.getElementById('shop-search');
  if (searchEl) {
    let debounce;
    searchEl.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        const v = searchEl.value;
        const clearBtn = document.getElementById('shop-search-clear');
        if (clearBtn) clearBtn.style.display = v ? 'block' : 'none';
        loadShopGrid(v, window._shopCat || 'All');
      }, 350);
    });
  }

  window._shopCat = cat;
  await loadShopGrid(q, cat);
};

async function loadShopGrid(q, cat) {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  grid.innerHTML = skeletonGrid(6);
  try {
    let products = await apiGetProducts();
    if (!products || products.length === 0) products = DEMO_PRODUCTS;
    // Filter by category
    if (cat && cat !== 'All') {
      products = products.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase());
    }
    // Filter by search query
    if (q) {
      const ql = q.toLowerCase();
      products = products.filter(p =>
        (p.productName || p.name || '').toLowerCase().includes(ql) ||
        (p.category || '').toLowerCase().includes(ql)
      );
    }
    if (products.length === 0) {
      grid.innerHTML = emptyState('🔍', 'No products found',
        'Try a different search term or category.');
    } else {
      grid.innerHTML = products.map(p => productCardGrid(p)).join('');
    }
  } catch(e) {
    let products = DEMO_PRODUCTS;
    if (cat !== 'All') products = products.filter(p => p.category === cat);
    if (q) products = products.filter(p => p.productName.toLowerCase().includes(q.toLowerCase()));
    grid.innerHTML = products.length
      ? products.map(p => productCardGrid(p)).join('')
      : emptyState('🔍', 'No products found', 'Try a different term.');
  }
}

window.kcFilterCat = function(cat) {
  window._shopCat = cat;
  document.querySelectorAll('.filter-chip').forEach(el => {
    el.classList.toggle('active', el.textContent.trim() === cat);
  });
  const q = document.getElementById('shop-search')?.value || '';
  loadShopGrid(q, cat);
};

window.kcClearSearch = function() {
  const el = document.getElementById('shop-search');
  if (el) el.value = '';
  const clearBtn = document.getElementById('shop-search-clear');
  if (clearBtn) clearBtn.style.display = 'none';
  loadShopGrid('', window._shopCat || 'All');
};

// Product Detail
window.kcInit_product = async function(params = {}) {
  const id = params.id;
  if (!id) { Router.navigate('home'); return; }
  const wrap = document.getElementById('screen-wrap');
  if (!wrap) return;

  try {
    let p;
    try {
      p = await apiGetProduct(id);
    } catch(e) {
      p = DEMO_PRODUCTS.find(d => d.productId === id) || DEMO_PRODUCTS[0];
    }

    const pid   = p.productId || p.id || id;
    const name  = p.productName || p.name || 'Product';
    const cat   = p.category || '';
    const img   = resolveImgUrl(p.imageUrl || p.image || '');
    const price = p.price || 0;
    const desc  = p.description || 'Premium quality men\'s fashion product.';
    const sizes = p.sizes || ['S','M','L','XL'];
    const colors= p.colors || [];
    const isFav = AppState.isFav(String(pid));

    // Update header title
    const hdrTitle = document.getElementById('hdr-title');
    if (hdrTitle) hdrTitle.textContent = cat || name;

    wrap.innerHTML = `
      <div class="pd-img-wrap">
        ${img
          ? `<img src="${img}" alt="${name}">`
          : `<div class="pd-img-placeholder">👕</div>`}
      </div>
      <div class="pd-body">
        <div class="pd-cat">${cat}</div>
        <div class="pd-name">${name}</div>
        <div class="pd-price-row">
          <span class="pd-price">${fmtPrice(price)}</span>
        </div>
        <div class="pd-desc">${desc}</div>

        ${sizes.length > 0 ? `
          <div class="pd-section-label">Select Size</div>
          <div class="size-chips" id="size-chips">
            ${sizes.map((s, i) => `
              <button class="size-chip ${i===0?'active':''}"
                onclick="kcSelectSize(this,'${s}')"
                data-size="${s}">${s}</button>`).join('')}
          </div>` : ''}

        ${colors.length > 0 ? `
          <div class="pd-section-label">Select Color</div>
          <div class="color-chips" id="color-chips">
            ${colors.map((c,i) => `
              <button class="color-chip ${i===0?'active':''}"
                onclick="kcSelectColor(this,'${c}')"
                data-color="${c}">${c}</button>`).join('')}
          </div>` : ''}

        <div class="atc-bar">
          <button class="btn-fav ${isFav?'active':''}" id="pd-fav-btn"
            onclick="kcToggleFav('${pid}', this)" aria-label="Favourite">
            ${isFav ? '❤️' : '🤍'}
          </button>
          <button class="btn-atc" id="atc-btn"
            onclick="kcAddToCartFromPD('${pid}','${name}',${price},'${img}')">
            🛒 Add to Cart
          </button>
        </div>
      </div>
      <div class="page-bottom"></div>`;

    // Set defaults
    window._pdSize  = sizes[0] || '';
    window._pdColor = colors[0] || '';

  } catch(e) {
    wrap.innerHTML = emptyState('⚠️', 'Product not found',
      'This product could not be loaded.',
      { label: 'Go Back', action: 'Router.back()' });
  }
};

window.kcSelectSize = function(btn, size) {
  document.querySelectorAll('.size-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  window._pdSize = size;
};
window.kcSelectColor = function(btn, color) {
  document.querySelectorAll('.color-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  window._pdColor = color;
};
window.kcAddToCartFromPD = function(id, name, price, image) {
  const size = window._pdSize || 'M';
  AppState.addToCart({ productId: String(id), name, price: Number(price), image, size });
  showToast(`✅ Added to cart (Size: ${size})`, 'success');
  updateCartBadge();
};

// Cart
window.kcInit_cart = function() { /* cart rendered statically */ };

// Checkout
window.kcInit_checkout = function() {
  window._payMethod = 'cod';
};

// Favourites
window.kcInit_favourites = async function() {
  const ids = AppState.getFavIds();
  const grid = document.getElementById('fav-grid');
  if (!grid || ids.length === 0) return;

  try {
    let allProducts = await apiGetProducts().catch(() => DEMO_PRODUCTS);
    if (!allProducts || allProducts.length === 0) allProducts = DEMO_PRODUCTS;
    const favProducts = allProducts.filter(p =>
      ids.includes(String(p.productId || p.id))
    );
    if (favProducts.length === 0) {
      grid.innerHTML = emptyState('❤️', 'No favourites found',
        'Your saved products could not be loaded.');
    } else {
      grid.innerHTML = favProducts.map(p => productCardGrid(p, false)).join('');
    }
  } catch(e) {
    grid.innerHTML = emptyState('⚠️', 'Could not load', 'Please try again.');
  }
};

// Account (auth forms)
window.kcInit_account = function() { /* wired inline */ };

// Orders
window.kcInit_orders = async function() {
  const list = document.getElementById('orders-list');
  if (!list) return;
  const user = AppState.getUser();
  if (!user) return;
  try {
    const orders = await apiGetOrders(user.id);
    if (!orders || orders.length === 0) {
      list.innerHTML = emptyState('📦', 'No orders yet',
        'Your orders will appear here once you place one.',
        { label: 'Shop Now', action: "Router.navigate('shop')" });
      return;
    }
    list.innerHTML = orders.map(o => orderCardHtml(o)).join('');
  } catch(e) {
    list.innerHTML = emptyState('⚠️', 'Could not load orders',
      'Please check your connection and try again.');
  }
};

// Search
window.kcInit_search = async function(params = {}) {
  const input = document.getElementById('gs-input');
  if (!input) return;

  if (params.q) await runSearch(params.q);

  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => runSearch(input.value), 350);
  });
  input.focus();
};

async function runSearch(q) {
  const grid = document.getElementById('search-grid');
  if (!grid) return;
  if (!q) { grid.innerHTML = emptyState('🔍', 'Search for products', 'Type above to find what you\'re looking for.'); return; }
  grid.innerHTML = skeletonGrid(4);
  try {
    let products = await apiGetProducts().catch(() => DEMO_PRODUCTS);
    if (!products || products.length === 0) products = DEMO_PRODUCTS;
    const ql = q.toLowerCase();
    const results = products.filter(p =>
      (p.productName || p.name || '').toLowerCase().includes(ql) ||
      (p.category || '').toLowerCase().includes(ql)
    );
    grid.innerHTML = results.length
      ? results.map(p => productCardGrid(p)).join('')
      : emptyState('🔍', 'No results', `No products matching "${q}".`);
  } catch(e) {
    grid.innerHTML = emptyState('⚠️', 'Search failed', 'Check your connection.');
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CART ACTIONS
   ═══════════════════════════════════════════════════════════════════════════════ */
window.kcQty = function(productId, size, delta) {
  const item = AppState.getCart().find(i => i.productId === productId && i.size === size);
  if (!item) return;
  const newQty = item.qty + delta;
  AppState.updateQty(productId, size, newQty);
  if (newQty <= 0) {
    // Remove card from DOM
    const el = document.getElementById(`ci-${productId}-${size}`);
    if (el) el.remove();
    // Refresh if empty
    if (AppState.getCart().length === 0) Router.navigate('cart');
  } else {
    const qtyEl = document.getElementById(`qty-${productId}-${size}`);
    if (qtyEl) qtyEl.textContent = newQty;
    refreshCartSummary();
  }
  updateCartBadge();
};

window.kcRemoveCart = function(productId, size) {
  AppState.removeFromCart(productId, size);
  updateCartBadge();
  const el = document.getElementById(`ci-${productId}-${size}`);
  if (el) el.style.transition = 'opacity 0.2s';
  if (el) { el.style.opacity = '0'; setTimeout(() => { el.remove(); refreshCartSummary(); }, 200); }
  if (AppState.getCart().length === 0) setTimeout(() => Router.navigate('cart'), 300);
};

function refreshCartSummary() {
  const subtotal = AppState.getCartTotal();
  const delivery = subtotal >= 999 ? 0 : 60;
  const total    = subtotal + delivery;
  const rows = document.querySelectorAll('.price-summary .price-row');
  if (rows.length >= 3) {
    rows[0].children[1].textContent = fmtPrice(subtotal);
    rows[2].children[1].textContent = fmtPrice(total);
  }
  const coBtn = document.getElementById('co-btn');
  if (coBtn) coBtn.textContent = `✅ Place Order — ${fmtPrice(total)}`;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FAVOURITES
   ═══════════════════════════════════════════════════════════════════════════════ */
window.kcToggleFav = function(productId, btn) {
  const isNowFav = AppState.toggleFav(String(productId));
  if (btn) {
    btn.classList.toggle('active', isNowFav);
    btn.textContent = isNowFav ? '❤️' : '🤍';
  }
  showToast(isNowFav ? '❤️ Added to favourites' : '💔 Removed from favourites');
};

/* ═══════════════════════════════════════════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════════════════════════════════════════ */
window.kcAuthTab = function(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('form-login').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
};

window.kcLogin = async function() {
  const email = document.getElementById('login-email')?.value.trim();
  const pass  = document.getElementById('login-pass')?.value;
  const errEl = document.getElementById('login-error');
  const btn   = document.getElementById('login-btn');
  if (!email || !pass) { showErr(errEl, 'Please fill in all fields.'); return; }
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  hideErr(errEl);
  try {
    const res = await apiLogin(email, pass);
    const user  = res.user  || res;
    const token = res.token || res.accessToken || res.jwt || '';
    AppState.login(user, token);
    showToast('👋 Welcome back!', 'success');
    Router.navigate('account');
  } catch(e) {
    showErr(errEl, 'Invalid email or password.');
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
};

window.kcRegister = async function() {
  const name  = document.getElementById('reg-name')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const pass  = document.getElementById('reg-pass')?.value;
  const errEl = document.getElementById('reg-error');
  const btn   = document.getElementById('reg-btn');
  if (!name || !email || !pass) { showErr(errEl, 'Please fill in all fields.'); return; }
  if (pass.length < 8) { showErr(errEl, 'Password must be at least 8 characters.'); return; }
  btn.disabled = true;
  btn.textContent = 'Creating account…';
  hideErr(errEl);
  try {
    const res = await apiRegister({ name, email, password: pass });
    const user  = res.user  || res;
    const token = res.token || res.accessToken || res.jwt || '';
    AppState.login(user, token);
    showToast('🎉 Account created!', 'success');
    Router.navigate('account');
  } catch(e) {
    showErr(errEl, e.message || 'Registration failed. Try a different email.');
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
};

window.kcLogout = function() {
  AppState.logout();
  showToast('👋 Signed out successfully');
  Router.navigate('account');
};

/* ═══════════════════════════════════════════════════════════════════════════════
   CHECKOUT
   ═══════════════════════════════════════════════════════════════════════════════ */
window.kcSelectPay = function(method) {
  window._payMethod = method;
  document.querySelectorAll('.pay-opt').forEach(el => el.classList.remove('selected'));
  document.getElementById(`pay-${method}`)?.classList.add('selected');
};

window.kcPlaceOrder = async function() {
  const name    = document.getElementById('co-name')?.value.trim();
  const phone   = document.getElementById('co-phone')?.value.trim();
  const address = document.getElementById('co-address')?.value.trim();
  const city    = document.getElementById('co-city')?.value.trim();
  const pin     = document.getElementById('co-pin')?.value.trim();
  const errEl   = document.getElementById('co-error');
  const btn     = document.getElementById('co-btn');

  if (!name || !phone || !address || !city || !pin) {
    showErr(errEl, 'Please fill in all delivery fields.');
    return;
  }
  if (!/^\d{10}$/.test(phone)) { showErr(errEl, 'Enter a valid 10-digit phone number.'); return; }
  if (!/^\d{6}$/.test(pin)) { showErr(errEl, 'Enter a valid 6-digit pincode.'); return; }
  hideErr(errEl);

  const user = AppState.getUser();
  const cart = AppState.getCart();
  const subtotal = AppState.getCartTotal();
  const delivery = subtotal >= 999 ? 0 : 60;

  btn.disabled = true;
  btn.textContent = '⏳ Placing Order…';

  const order = {
    userId: user ? user.id : null,
    customerName: name,
    phone,
    deliveryAddress: `${address}, ${city} - ${pin}`,
    paymentMethod: window._payMethod || 'cod',
    items: cart.map(i => ({
      productId: i.productId,
      productName: i.name,
      quantity: i.qty,
      size: i.size,
      price: i.price
    })),
    totalAmount: subtotal + delivery,
    status: 'PENDING'
  };

  try {
    await apiPlaceOrder(order);
    AppState.clearCart();
    updateCartBadge();
    const wrap = document.getElementById('screen-wrap');
    if (wrap) {
      wrap.innerHTML = `
        <div class="success-screen">
          <div class="success-anim">🎉</div>
          <div class="success-title">Order Placed!</div>
          <div class="success-sub">Thank you, ${name.split(' ')[0]}!<br>
            Your order has been placed successfully.<br>
            We'll send updates to your phone.</div>
          <button class="btn-primary" style="max-width:240px" onclick="Router.navigate('home')">
            🏠 Back to Home
          </button>
          <div style="height:12px"></div>
          <button class="btn-outline" style="max-width:240px" onclick="Router.navigate('orders')">
            📦 View Orders
          </button>
        </div>`;
    }
  } catch(e) {
    showErr(errEl, 'Failed to place order. Please try again.');
    btn.disabled = false;
    btn.textContent = `✅ Place Order`;
  }
};

/* ═══════════════════════════════════════════════════════════════════════════════
   ORDERS HELPER
   ═══════════════════════════════════════════════════════════════════════════════ */
function orderCardHtml(o) {
  const status = o.status || 'PENDING';
  const items  = o.items || o.orderItems || [];
  const total  = o.totalAmount || o.total || 0;
  const date   = fmtDate(o.createdAt || o.orderDate);
  const orderId = o.orderId || o.id || '—';

  return `
    <div class="order-card">
      <div class="order-row-top">
        <div>
          <div class="order-id">Order #${orderId}</div>
          <div class="order-date">${date}</div>
        </div>
        <div class="status-badge ${status}">${status}</div>
      </div>
      ${items.length > 0 ? `
        <div class="order-items-preview">
          ${items.slice(0, 3).map(i => `
            <div class="order-thumb">
              ${i.imageUrl || i.image
                ? `<img src="${resolveImgUrl(i.imageUrl || i.image)}" alt="${i.productName||''}" loading="lazy">`
                : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.2rem">👕</div>`}
            </div>`).join('')}
          ${items.length > 3 ? `<div style="font-size:0.72rem;color:var(--text-3);align-self:center">+${items.length-3} more</div>` : ''}
        </div>` : ''}
      <div class="order-total-row">
        <div class="order-total-lbl">${items.length} item${items.length !== 1 ? 's' : ''}</div>
        <div class="order-total-val">${fmtPrice(total)}</div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   UI HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */
let _toastTimer;
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'show' + (type ? ' ' + type : '');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

function showErr(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}
function hideErr(el) {
  if (!el) return;
  el.classList.remove('show');
}

function updateCartBadge() {
  const count = AppState.getCartCount();
  // Nav badge
  const navBadge = document.getElementById('nav-cart-badge');
  if (navBadge) {
    navBadge.textContent = count > 9 ? '9+' : count || '';
    navBadge.classList.toggle('visible', count > 0);
  }
  // Header badge
  const hdrBadge = document.getElementById('hdr-cart-badge');
  if (hdrBadge) {
    hdrBadge.textContent = count > 9 ? '9+' : count || '';
    hdrBadge.classList.toggle('visible', count > 0);
  }
}
