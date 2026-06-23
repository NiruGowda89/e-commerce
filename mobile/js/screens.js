// ─── Screens — Karunada Collection Mobile ────────────────────────────────────
// Each function returns an HTML string to be rendered into #screen-wrap.

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function fmtPrice(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}
function fmtDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}
function skeletonRail(n = 4) {
  return Array.from({ length: n }, () => `
    <div class="sk-card-sm">
      <div class="skeleton sk-img-sm"></div>
      <div class="sk-body">
        <div class="skeleton sk-line" style="width:80%"></div>
        <div class="skeleton sk-line w60"></div>
        <div class="skeleton sk-line w40"></div>
      </div>
    </div>`).join('');
}
function skeletonGrid(n = 4) {
  return Array.from({ length: n }, () => `
    <div class="sk-card-grid">
      <div class="skeleton sk-img-grid"></div>
      <div class="sk-body">
        <div class="skeleton sk-line" style="width:80%"></div>
        <div class="skeleton sk-line w60"></div>
        <div class="skeleton sk-line w40"></div>
      </div>
    </div>`).join('');
}

function getDiscount(p) {
  return p.discount || (p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0);
}
function getOrigPrice(p) {
  return p.originalPrice || (p.discount ? Math.round(p.price / (1 - p.discount / 100)) : null);
}

function productCardSmall(p) {
  const id   = p.productId || p.id;
  const name = p.productName || p.name || 'Product';
  const cat  = p.category || '';
  const img  = resolveImgUrl(p.imageUrl || p.image || '');
  const price = p.price || 0;
  const disc = getDiscount(p);
  return `
    <div class="p-card-sm" onclick="Router.navigate('product',{id:'${id}'})">
      <div class="card-img-wrap">
        ${img
          ? `<img src="${img}" alt="${name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''}
        <div class="card-img-placeholder" ${img ? 'style="display:none"' : ''}>👕</div>
        ${disc > 0 ? `<span class="discount-badge-pill">${disc}% OFF</span>` : ''}
        ${p.isNew ? `<span class="new-badge-pill">NEW</span>` : ''}
      </div>
      <div class="card-body">
        <div class="card-cat">${cat}</div>
        <div class="card-name">${name}</div>
        <div class="card-price">
          ${fmtPrice(price)}
          ${getOrigPrice(p) ? `<span class="card-price-old">${fmtPrice(getOrigPrice(p))}</span>` : ''}
        </div>
      </div>
    </div>`;
}
function productCardGrid(p, showFav = true) {
  const id    = p.productId || p.id;
  const name  = p.productName || p.name || 'Product';
  const cat   = p.category || '';
  const img   = resolveImgUrl(p.imageUrl || p.image || '');
  const price = p.price || 0;
  const isFav = AppState.isFav(String(id));
  const disc  = getDiscount(p);
  return `
    <div class="p-card-grid" onclick="Router.navigate('product',{id:'${id}'})">
      <div class="card-img-wrap">
        ${img
          ? `<img src="${img}" alt="${name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''}
        <div class="card-img-placeholder" ${img ? 'style="display:none"' : ''}>👕</div>
        ${disc > 0 ? `<span class="discount-badge-pill">${disc}% OFF</span>` : ''}
        ${p.isNew ? `<span class="new-badge-pill">NEW</span>` : ''}
        ${showFav ? `<button class="fav-btn ${isFav ? 'active' : ''}"
          onclick="event.stopPropagation();kcToggleFav('${id}',this)"
          aria-label="Favourite">
          ${isFav ? '❤️' : '🤍'}
        </button>` : ''}
      </div>
      <div class="card-body">
        <div class="card-cat">${cat}</div>
        <div class="card-name">${name}</div>
        <div class="card-price">
          ${fmtPrice(price)}
          ${getOrigPrice(p) ? `<span class="card-price-old">${fmtPrice(getOrigPrice(p))}</span>` : ''}
        </div>
      </div>
    </div>`;
}
function emptyState(icon, title, sub, cta = null) {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <div class="empty-title">${title}</div>
      <div class="empty-sub">${sub}</div>
      ${cta ? `<button class="btn-primary" style="max-width:220px" onclick="${cta.action}">${cta.label}</button>` : ''}
    </div>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   HOME SCREEN
   ───────────────────────────────────────────────────────────────────────────── */
async function screenHome() {
  return `
    <!-- Hero -->
    <div class="hero">
      <div class="hero-glow"></div>
      <div class="hero-slash-2"></div>
      <div class="hero-slash"></div>
      <div class="hero-body">
        <div class="hero-left">
          <div class="hero-badge">✨ New Collection</div>
          <h1 class="hero-title">The Ultimate<br>Men's Fashion<br>Experience.</h1>
          <button class="hero-cta" onclick="Router.navigate('shop')">Shop Now →</button>
        </div>
        <div class="hero-emoji">🪄</div>
      </div>
    </div>

    <!-- Stats chips -->
    <div class="stats-row">
      <div class="stat-chip">🔥 Up to 29% OFF</div>
      <div class="stat-chip">✨ New Arrivals Weekly</div>
      <div class="stat-chip">⚡ Fast Delivery</div>
      <div class="stat-chip">💎 Premium Quality</div>
    </div>

    <!-- Demo notice (shown if offline) -->
    <div id="demo-notice" class="demo-notice" style="display:none;margin-top:12px;">
      📡 <span>Demo mode</span> — backend offline. Showing sample products.
    </div>

    <!-- Featured Products -->
    <div class="section">
      <div class="section-hdr">
        <div>
          <div class="section-title">Featured</div>
          <div class="section-sub">Handpicked styles for you</div>
        </div>
        <button class="section-see-all" onclick="Router.navigate('shop')">See All</button>
      </div>
      <div class="h-rail" id="featured-rail">${skeletonRail(4)}</div>
    </div>

    <!-- New Arrivals Grid -->
    <div class="section">
      <div class="section-hdr">
        <div>
          <div class="section-title">New Arrivals</div>
          <div class="section-sub">Fresh styles this week</div>
        </div>
        <button class="section-see-all" onclick="Router.navigate('newarrivals')">See All</button>
      </div>
      <div class="product-grid" id="new-arrivals-grid">${skeletonGrid(4)}</div>
    </div>

    <!-- Quick Links -->
    <div class="section" style="margin-top:4px">
      <div class="quick-link" onclick="Router.navigate('shop')">
        <div class="ql-icon">🛍️</div>
        <div class="ql-info">
          <div class="ql-title">All Products</div>
          <div class="ql-sub">Browse our full collection</div>
        </div>
        <div class="ql-arrow">›</div>
      </div>
      <div class="quick-link" onclick="Router.navigate('offers')">
        <div class="ql-icon danger">🔥</div>
        <div class="ql-info">
          <div class="ql-title">Exclusive Offers</div>
          <div class="ql-sub">Up to 29% off on select items</div>
        </div>
        <div class="ql-arrow">›</div>
      </div>
      <div class="quick-link" onclick="Router.navigate('newarrivals')">
        <div class="ql-icon">✨</div>
        <div class="ql-info">
          <div class="ql-title">New Arrivals</div>
          <div class="ql-sub">Fresh styles just landed</div>
        </div>
        <div class="ql-arrow">›</div>
      </div>
    </div>
    <div class="page-bottom"></div>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHOP SCREEN
   ───────────────────────────────────────────────────────────────────────────── */
async function screenShop(params = {}) {
  const q   = params.q   || '';
  const cat = params.cat || 'All';
  const cats = ['All','T-Shirts','Shirts','Trousers','Shorts','Polo','Jackets'];
  return `
    <div class="search-bar-wrap" style="padding-bottom:10px">
      <div class="search-bar">
        <span class="s-icon">🔍</span>
        <input id="shop-search" type="search" placeholder="Search products…" value="${q}"
          autocomplete="off" autocorrect="off" spellcheck="false">
        <button id="shop-search-clear" style="background:none;border:none;color:var(--text-3);font-size:1rem;padding:0 4px;display:${q?'block':'none'}" onclick="kcClearSearch()">✕</button>
      </div>
      <div class="filter-chips" id="filter-chips" style="margin-top:10px">
        ${cats.map(c => `
          <button class="filter-chip ${c===cat?'active':''}"
            onclick="kcFilterCat('${c}')">${c}</button>`).join('')}
      </div>
    </div>
    <div class="pad pad-top">
      <div class="product-grid" id="shop-grid">${skeletonGrid(6)}</div>
    </div>
    <div class="page-bottom"></div>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   PRODUCT DETAIL SCREEN
   ───────────────────────────────────────────────────────────────────────────── */
async function screenProduct(params = {}) {
  return `<div class="spinner-wrap"><div class="spinner"></div></div>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   OFFERS SCREEN  (discounted products)
   ───────────────────────────────────────────────────────────────────────────── */
async function screenOffers() {
  return `
    <div class="pad" style="padding-top:16px">
      <div class="product-grid" id="offers-grid">${skeletonGrid(6)}</div>
    </div>
    <div class="page-bottom"></div>`;
}
window.kcInit_offers = async function() {
  const grid = document.getElementById('offers-grid');
  if (!grid) return;
  try {
    let products = await apiGetProducts();
    if (!products || products.length === 0) products = DEMO_PRODUCTS;
  } catch(e) {
    products = DEMO_PRODUCTS;
  }
  const offerProducts = products.filter(p => (p.discount > 0 || p.originalPrice) && !p.disableOffer);
  if (offerProducts.length === 0) {
    grid.innerHTML = emptyState('🔥', 'No offers right now', 'Check back soon for exciting deals!', { label: 'Browse All', action: "Router.navigate('shop')" });
  } else {
    grid.innerHTML = offerProducts.map(p => productCardGrid(p)).join('');
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   NEW ARRIVALS SCREEN
   ───────────────────────────────────────────────────────────────────────────── */
async function screenNewArrivals() {
  return `
    <div class="pad" style="padding-top:16px">
      <div class="product-grid" id="arrivals-grid">${skeletonGrid(6)}</div>
    </div>
    <div class="page-bottom"></div>`;
}
window.kcInit_newarrivals = async function() {
  const grid = document.getElementById('arrivals-grid');
  if (!grid) return;
  let products;
  try {
    products = await apiGetProducts();
    if (!products || products.length === 0) products = DEMO_PRODUCTS;
  } catch(e) {
    products = DEMO_PRODUCTS;
  }
  const newItems = products.filter(p => p.isNew || p.category === 'New Collection');
  if (newItems.length === 0) {
    grid.innerHTML = emptyState('✨', 'No new arrivals yet', 'Fresh styles coming soon!', { label: 'Browse All', action: "Router.navigate('shop')" });
  } else {
    grid.innerHTML = newItems.map(p => productCardGrid(p)).join('');
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   CART SCREEN
   ───────────────────────────────────────────────────────────────────────────── */
async function screenCart() {
  const cart = AppState.getCart();
  if (cart.length === 0) {
    return emptyState('🛒', 'Your cart is empty',
      'Add items from the shop to get started.',
      { label: 'Browse Products', action: "Router.navigate('shop')" });
  }
  const itemsHtml = cart.map(item => `
    <div class="cart-item" id="ci-${item.productId}-${item.size}">
      <div class="cart-item-img">
        ${item.image
          ? `<img src="${resolveImgUrl(item.image)}" alt="${item.name}" loading="lazy">`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.6rem">👕</div>`}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">Size: ${item.size}</div>
        <div class="cart-item-price">${fmtPrice(item.price * item.qty)}</div>
        <div class="qty-ctrl">
          <button class="qty-btn" onclick="kcQty('${item.productId}','${item.size}',-1)" aria-label="Decrease">−</button>
          <span class="qty-val" id="qty-${item.productId}-${item.size}">${item.qty}</span>
          <button class="qty-btn" onclick="kcQty('${item.productId}','${item.size}',1)" aria-label="Increase">+</button>
        </div>
      </div>
      <button class="cart-item-del" onclick="kcRemoveCart('${item.productId}','${item.size}')" aria-label="Remove">🗑️</button>
    </div>`).join('');

  const subtotal  = AppState.getCartTotal();
  const delivery  = subtotal >= 999 ? 0 : 60;
  const total     = subtotal + delivery;

  return `
    <div class="pad" style="padding-top:16px">
      ${itemsHtml}
      <div class="price-summary">
        <div class="price-row"><span>Subtotal</span><span>${fmtPrice(subtotal)}</span></div>
        <div class="price-row"><span>Delivery</span><span>${delivery === 0 ? '<span style="color:var(--success)">FREE</span>' : fmtPrice(delivery)}</span></div>
        ${delivery > 0 ? `<div style="font-size:0.7rem;color:var(--text-3);margin-bottom:10px">Free delivery on orders above ₹999</div>` : ''}
        <div class="price-row total"><span>Total</span><span>${fmtPrice(total)}</span></div>
      </div>
      <button class="btn-primary" onclick="Router.navigate('checkout')">
        🛒 Proceed to Checkout — ${fmtPrice(total)}
      </button>
    </div>
    <div class="page-bottom"></div>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   CHECKOUT SCREEN
   ───────────────────────────────────────────────────────────────────────────── */
async function screenCheckout() {
  const cart = AppState.getCart();
  if (cart.length === 0) {
    return emptyState('🛒', 'Cart is empty',
      'Add items before checking out.',
      { label: 'Go to Shop', action: "Router.navigate('shop')" });
  }
  const user = AppState.getUser();
  const subtotal = AppState.getCartTotal();
  const delivery = subtotal >= 999 ? 0 : 60;
  const total    = subtotal + delivery;

  return `
    <div class="pad" style="padding-top:16px">

      <div class="form-section">
        <div class="form-section-title">📦 Delivery Address</div>
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input class="form-input" id="co-name" placeholder="Your full name"
            value="${user ? (user.name || user.username || '') : ''}" autocomplete="name">
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number *</label>
          <input class="form-input" id="co-phone" placeholder="10-digit mobile number"
            type="tel" autocomplete="tel"
            value="${user ? (user.phone || '') : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Street Address *</label>
          <textarea class="form-textarea" id="co-address" placeholder="Flat/House No., Building, Street"
            autocomplete="street-address">${user ? (user.address || '') : ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">City *</label>
          <input class="form-input" id="co-city" placeholder="City" autocomplete="address-level2">
        </div>
        <div class="form-group">
          <label class="form-label">Pincode *</label>
          <input class="form-input" id="co-pin" placeholder="6-digit pincode"
            type="number" maxlength="6" autocomplete="postal-code">
        </div>
        <div id="co-error" class="inline-error"></div>
      </div>

      <div class="form-section">
        <div class="form-section-title">💳 Payment Method</div>
        <div class="pay-opts">
          <div class="pay-opt selected" id="pay-cod" onclick="kcSelectPay('cod')">
            <div class="pay-radio"></div>
            <div class="pay-opt-icon">💵</div>
            <div>
              <div class="pay-opt-label">Cash on Delivery</div>
              <div class="pay-opt-sub">Pay when order arrives</div>
            </div>
          </div>
          <div class="pay-opt" id="pay-upi" onclick="kcSelectPay('upi')">
            <div class="pay-radio"></div>
            <div class="pay-opt-icon">📱</div>
            <div>
              <div class="pay-opt-label">UPI / Online</div>
              <div class="pay-opt-sub">Pay now (redirect to payment)</div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title">🧾 Order Summary</div>
        ${cart.map(i => `
          <div class="price-row">
            <span style="color:var(--text-1);font-weight:500">${i.name} <span style="color:var(--text-3)">×${i.qty}</span></span>
            <span>${fmtPrice(i.price * i.qty)}</span>
          </div>`).join('')}
        <div class="price-row" style="margin-top:4px">
          <span>Delivery</span>
          <span>${delivery === 0 ? '<span style="color:var(--success)">FREE</span>' : fmtPrice(delivery)}</span>
        </div>
        <div class="price-row total"><span>Total</span><span>${fmtPrice(total)}</span></div>
      </div>

      <button class="btn-primary" id="co-btn" onclick="kcPlaceOrder()">
        ✅ Place Order — ${fmtPrice(total)}
      </button>
    </div>
    <div class="page-bottom"></div>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   FAVOURITES SCREEN
   ───────────────────────────────────────────────────────────────────────────── */
async function screenFavourites() {
  const ids = AppState.getFavIds();
  if (ids.length === 0) {
    return emptyState('❤️', 'No favourites yet',
      'Tap the heart on any product to save it here.',
      { label: 'Browse Products', action: "Router.navigate('shop')" });
  }
  return `
    <div class="pad" style="padding-top:16px">
      <div class="product-grid" id="fav-grid">${skeletonGrid(ids.length)}</div>
    </div>
    <div class="page-bottom"></div>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   ACCOUNT SCREEN
   ───────────────────────────────────────────────────────────────────────────── */
async function screenAccount() {
  if (AppState.isLoggedIn()) {
    const user = AppState.getUser();
    const initial = (user.name || user.username || 'U').charAt(0).toUpperCase();
    return `
      <div class="profile-header">
        <div class="profile-avatar">${initial}</div>
        <div>
          <div class="profile-name">${user.name || user.username || 'User'}</div>
          <div class="profile-email">${user.email || ''}</div>
        </div>
      </div>
      <div class="menu-list">
        <div class="menu-item" onclick="Router.navigate('orders')">
          <div class="menu-item-icon">📦</div>
          <div class="menu-item-label">My Orders</div>
          <div class="menu-item-arrow">›</div>
        </div>
        <div class="menu-item" onclick="Router.navigate('favourites')">
          <div class="menu-item-icon">❤️</div>
          <div class="menu-item-label">Favourites</div>
          <div class="menu-item-arrow">›</div>
        </div>
        <div class="menu-item" onclick="Router.navigate('cart')">
          <div class="menu-item-icon">🛒</div>
          <div class="menu-item-label">My Cart</div>
          <div class="menu-item-arrow">›</div>
        </div>
        <div class="divider" style="margin:0"></div>
        <div class="menu-item" style="margin-top:10px">
          <div class="menu-item-icon">⚙️</div>
          <div class="menu-item-label">Settings</div>
          <div class="menu-item-arrow">›</div>
        </div>
        <div class="menu-item">
          <div class="menu-item-icon">❓</div>
          <div class="menu-item-label">Help & Support</div>
          <div class="menu-item-arrow">›</div>
        </div>
        <div class="divider" style="margin:0"></div>
        <div class="menu-item danger" style="margin-top:10px" onclick="kcLogout()">
          <div class="menu-item-icon">🚪</div>
          <div class="menu-item-label">Sign Out</div>
        </div>
      </div>
      <div class="page-bottom"></div>`;
  }
  // Not logged in — show login/register tabs
  return `
    <div class="auth-tabs">
      <button class="auth-tab active" id="tab-login" onclick="kcAuthTab('login')">Sign In</button>
      <button class="auth-tab" id="tab-register" onclick="kcAuthTab('register')">Create Account</button>
    </div>

    <!-- Login Form -->
    <div class="auth-form" id="form-login">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="login-email" type="email" placeholder="you@example.com" autocomplete="email">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input class="form-input" id="login-pass" type="password" placeholder="••••••••" autocomplete="current-password">
      </div>
      <div id="login-error" class="inline-error"></div>
      <div style="margin-top:16px">
        <button class="btn-primary" id="login-btn" onclick="kcLogin()">Sign In</button>
      </div>
    </div>

    <!-- Register Form -->
    <div class="auth-form" id="form-register" style="display:none">
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input class="form-input" id="reg-name" type="text" placeholder="Your full name" autocomplete="name">
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="reg-email" type="email" placeholder="you@example.com" autocomplete="email">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input class="form-input" id="reg-pass" type="password" placeholder="Min 8 characters" autocomplete="new-password">
      </div>
      <div id="reg-error" class="inline-error"></div>
      <div style="margin-top:16px">
        <button class="btn-primary" id="reg-btn" onclick="kcRegister()">Create Account</button>
      </div>
    </div>
    <div class="page-bottom"></div>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   ORDERS SCREEN
   ───────────────────────────────────────────────────────────────────────────── */
async function screenOrders() {
  if (!AppState.isLoggedIn()) {
    return emptyState('🔐', 'Sign in required',
      'Please sign in to view your orders.',
      { label: 'Sign In', action: "Router.navigate('account')" });
  }
  return `
    <div class="pad" style="padding-top:16px">
      <div id="orders-list"><div class="spinner-wrap"><div class="spinner"></div></div></div>
    </div>
    <div class="page-bottom"></div>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SEARCH SCREEN
   ───────────────────────────────────────────────────────────────────────────── */
async function screenSearch(params = {}) {
  const q = params.q || '';
  return `
    <div class="search-bar-wrap" style="padding-bottom:12px">
      <div class="search-bar">
        <span class="s-icon">🔍</span>
        <input id="gs-input" type="search" placeholder="Search products…" value="${q}"
          autocomplete="off" autocorrect="off" autofocus>
      </div>
    </div>
    <div class="pad">
      <div class="product-grid" id="search-grid">
        ${q ? skeletonGrid(4) : emptyState('🔍', 'Search for products', 'Type above to find what you\'re looking for.')}
      </div>
    </div>
    <div class="page-bottom"></div>`;
}
