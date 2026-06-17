// ─── My Account Page ──────────────────────────────────────────────────────────
const ACCT_KEY     = 'urbanManUser';
const ADDR_KEY     = 'karunadaAddresses';
const PROFILE_KEY  = 'karunadaProfile';

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    const user = getCurrentUser();

    // Redirect to login if not authenticated
    if (!user) {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.hash);
        return;
    }

    // Populate sidebar greeting
    const nameParts = (user.name || 'User').split(' ');
    const initial   = nameParts[0][0].toUpperCase();
    const elAvatar  = document.getElementById('sidebarAvatar');
    const elName    = document.getElementById('sidebarName');
    if (elAvatar) elAvatar.textContent = initial;
    if (elName)   elName.textContent   = user.name || 'User';

    // Read hash AFTER auth confirmed — handles redirect from checkout
    // Use a tiny defer so the browser has fully parsed the hash from the URL
    setTimeout(function () {
        const raw  = window.location.hash.replace('#', '').trim();
        const hash = raw || 'profile';
        showPanel(hash);
    }, 0);
});

// ── Panel switcher ────────────────────────────────────────────────────────────
function showPanel(name) {
    // Hide all panels
    document.querySelectorAll('.acct-panel').forEach(p => p.style.display = 'none');

    // Deactivate all nav items and group headers
    document.querySelectorAll('.acct-nav-item, .acct-nav-group-hdr').forEach(el => {
        el.classList.remove('active');
    });

    // Show target panel
    const panel = document.getElementById('panel-' + name);
    if (panel) {
        panel.style.display = 'block';
    } else {
        // Panel not found — fall back to profile
        const fallback = document.getElementById('panel-profile');
        if (fallback) fallback.style.display = 'block';
    }

    // Mark nav item active (nav items have id="nav-{name}")
    const navItem = document.getElementById('nav-' + name);
    if (navItem) navItem.classList.add('active');

    // Special case: MY ORDERS button (group-hdr, no nav-orders id) — activate it
    // when showing orders OR order-confirm
    if (name === 'orders' || name === 'order-confirm') {
        const ordersBtn = document.querySelector('[onclick="showPanel(\'orders\')"]');
        if (ordersBtn) ordersBtn.classList.add('active');
    }

    // Update URL hash silently
    history.replaceState(null, '', '#' + name);

    // Lazy-load panel content
    if (name === 'orders')        renderOrdersPanel();
    if (name === 'order-confirm') renderOrderConfirmPanel();
    if (name === 'profile')       renderProfilePanel();
    if (name === 'addresses')     renderAddressPanel();
    if (name === 'wishlist')      renderWishlistPanel();
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE PANEL
// ─────────────────────────────────────────────────────────────────────────────
function renderProfilePanel() {
    const user    = getCurrentUser();
    const profile = getSavedProfile();

    const firstName = profile.firstName || (user ? (user.name || '').split(' ')[0] : '');
    const lastName  = profile.lastName  || (user ? (user.name || '').split(' ').slice(1).join(' ') : '');
    const email     = profile.email     || (user ? user.email  : '');
    const phone     = profile.phone     || (user ? user.phone  : '');
    const gender    = profile.gender    || '';

    setVal('pfFirstName', firstName);
    setVal('pfLastName',  lastName);
    setVal('pfEmail',     email);
    setVal('pfPhone',     phone);

    if (gender === 'Male')   setChecked('gMale',   true);
    if (gender === 'Female') setChecked('gFemale', true);
}

function getSavedProfile() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); }
    catch(e) { return {}; }
}

let _profileEditing = false;
function toggleProfileEdit() {
    _profileEditing = !_profileEditing;
    const inputs  = document.querySelectorAll('#profileForm .acct-input');
    const radios  = document.querySelectorAll('#profileForm input[type=radio]');
    const saveBtn = document.getElementById('profileSaveBtn');
    const editBtn = document.getElementById('profileEditBtn');

    inputs.forEach(i => i.readOnly  = !_profileEditing);
    radios.forEach(r => r.disabled  = !_profileEditing);
    if (saveBtn) saveBtn.style.display = _profileEditing ? 'inline-flex' : 'none';
    if (editBtn) editBtn.textContent   = _profileEditing ? 'Cancel' : 'Edit';
}

function saveProfile(e) {
    e.preventDefault();
    const profile = {
        firstName: getVal('pfFirstName'),
        lastName:  getVal('pfLastName'),
        email:     getVal('pfEmail'),
        phone:     getVal('pfPhone'),
        gender:    document.querySelector('input[name="gender"]:checked')?.value || '',
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

    // Also update the auth store so the navbar name updates
    const user = getCurrentUser();
    if (user) {
        user.name  = (profile.firstName + ' ' + profile.lastName).trim() || user.name;
        user.email = profile.email || user.email;
        user.phone = profile.phone || user.phone;
        localStorage.setItem(ACCT_KEY, JSON.stringify(user));
        refreshAuthNav();
        const elName = document.getElementById('sidebarName');
        if (elName) elName.textContent = user.name;
        const elAvatar = document.getElementById('sidebarAvatar');
        if (elAvatar) elAvatar.textContent = user.name[0].toUpperCase();
    }

    const msg = document.getElementById('profileMsg');
    if (msg) {
        msg.innerHTML = '<span class="text-success">✅ Profile saved!</span>';
        setTimeout(() => { msg.innerHTML = ''; }, 3000);
    }
    _profileEditing = false;
    toggleProfileEdit(); // re-lock fields
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS PANEL  (re-uses orders.js helpers)
// ─────────────────────────────────────────────────────────────────────────────
function renderOrdersPanel() {
    const orders  = getOrders();
    const listEl  = document.getElementById('ordersList');
    const emptyEl = document.getElementById('noOrders');
    if (!listEl) return;

    if (orders.length === 0) {
        listEl.innerHTML      = '';
        emptyEl.style.display = 'block';
        return;
    }
    emptyEl.style.display = 'none';
    listEl.innerHTML      = orders.map(o => buildOrderCard(o)).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER CONFIRM PANEL  (shown immediately after checkout)
// ─────────────────────────────────────────────────────────────────────────────
function renderOrderConfirmPanel() {
    const panel = document.getElementById('panel-order-confirm');
    if (!panel) return;

    const orders = getOrders();
    const order  = orders[0]; // most recent
    if (!order) {
        panel.innerHTML = `<div class="acct-panel-hdr"><h5>Order Confirmation</h5></div>
            <div class="acct-empty-state">
                <div style="font-size:2.5rem;">📦</div>
                <p class="mt-3 text-muted">No recent order found.</p>
                <a href="shop.html" class="btn btn-primary btn-sm mt-2">Start Shopping</a>
            </div>`;
        return;
    }

    // Build items summary
    const itemsHtml = (order.items || []).map(item => `
        <div class="oc-item">
            <img src="${item.image}" alt="${item.name}"
                 onerror="this.src='https://via.placeholder.com/48?text=?'">
            <div class="oc-item__info">
                <div class="oc-item__name">${item.name}</div>
                <div class="oc-item__meta">
                    ${item.size ? 'Size: ' + item.size : ''}
                    ${item.color ? ' · ' + item.color : ''}
                    · Qty: ${item.quantity}
                </div>
            </div>
            <div class="oc-item__price">₹${Number(item.price) * item.quantity}</div>
        </div>`).join('');

    panel.innerHTML = `
        <!-- Success hero -->
        <div class="oc-hero">
            <div class="oc-hero__checkmark">✓</div>
            <h2 class="oc-hero__title">Order Confirmed!</h2>
            <p class="oc-hero__sub">Thank you for shopping with Karunada Collection</p>
            <div class="oc-hero__id">${order.id}</div>
        </div>

        <!-- Order details card -->
        <div class="oc-card">
            <div class="oc-card__hdr">
                <span>🛍️ Items Ordered</span>
                <span class="oc-badge oc-badge--success">${order.status}</span>
            </div>
            <div class="oc-items">${itemsHtml}</div>
        </div>

        <!-- Summary card -->
        <div class="oc-card">
            <div class="oc-card__hdr">💰 Payment Summary</div>
            <div class="oc-summary-row"><span>Subtotal</span><span>₹${order.subtotal || order.total}</span></div>
            <div class="oc-summary-row"><span>GST</span><span>₹${order.gst || 0}</span></div>
            <div class="oc-summary-row"><span>Shipping</span><span>${(order.shippingCost || 0) > 0 ? '₹' + order.shippingCost : 'Free'}</span></div>
            <div class="oc-summary-row oc-summary-row--total"><span>Total Paid</span><strong>₹${order.total}</strong></div>
            <div class="oc-pay-method">Paid via: <strong>${order.paymentMethod}</strong></div>
        </div>

        <!-- Delivery address card -->
        <div class="oc-card">
            <div class="oc-card__hdr">📍 Delivery Address</div>
            <div class="oc-addr-name">${order.customerName}</div>
            <div class="oc-addr-line">${order.shippingAddress}</div>
            <div class="oc-addr-line">${order.city}${order.state ? ', ' + order.state : ''} – ${order.pincode}</div>
            <div class="oc-addr-line">📞 ${order.phone}${order.altPhone ? ' · ' + order.altPhone : ''}</div>
        </div>

        <!-- CTA row -->
        <div class="oc-cta-row">
            <button class="oc-btn oc-btn--outline" onclick="showPanel('orders')">
                📦 View All Orders
            </button>
            <a href="shop.html" class="oc-btn oc-btn--primary">
                🛍️ Continue Shopping
            </a>
        </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADDRESSES PANEL
// ─────────────────────────────────────────────────────────────────────────────
function getAddresses() {
    try { return JSON.parse(localStorage.getItem(ADDR_KEY) || '[]'); }
    catch(e) { return []; }
}
function saveAddresses(arr) { localStorage.setItem(ADDR_KEY, JSON.stringify(arr)); }

function renderAddressPanel() {
    const list = document.getElementById('addressList');
    if (!list) return;
    const addrs = getAddresses();

    const cardsHtml = addrs.length === 0
        ? `<div class="acct-empty-state" id="addrEmptyState">
            <div style="font-size:2.5rem;">📍</div>
            <p class="mt-3 text-muted">No saved addresses yet.</p>
           </div>`
        : addrs.map((a, i) => `
            <div class="acct-address-card" id="addr-card-${i}">
                <div class="acct-address-tag" style="${i === 0 ? 'background:#d1fae5;color:#065f46;' : ''}">
                    ${i === 0 ? 'DEFAULT' : 'HOME'}
                </div>
                <div class="acct-address-name">${a.name}${a.phone ? ' &nbsp;|&nbsp; ' + a.phone : ''}</div>
                <div class="acct-address-line">
                    ${a.line}${a.area ? ', ' + a.area : ''}${a.landmark ? ', ' + a.landmark : ''},
                    ${a.city}${a.state ? ', ' + a.state : ''} – ${a.pincode}
                </div>
                ${i !== 0 ? `<button class="acct-address-action" onclick="setDefaultAddress(${i})">Set as Default</button>` : ''}
                <button class="acct-address-remove" onclick="removeAddress(${i})">Remove</button>
            </div>`).join('');

    list.innerHTML = cardsHtml;
}

function showAddAddressForm() {
    const f = document.getElementById('addAddressForm');
    if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

function saveAddress() {
    const addr = {
        name:     getVal('addrName'),
        phone:    getVal('addrPhone'),
        line:     getVal('addrLine'),
        area:     getVal('addrArea'),
        landmark: getVal('addrLandmark'),
        city:     getVal('addrCity'),
        pincode:  getVal('addrPin'),
        state:    document.getElementById('addrState')?.value || '',
        country:  'India',
    };
    if (!addr.name || !addr.line || !addr.city || !addr.pincode) {
        alert('Please fill in Name, Address, City and Pincode.');
        return;
    }
    if (addr.pincode && !/^\d{6}$/.test(addr.pincode)) {
        alert('Enter a valid 6-digit pincode.');
        return;
    }
    const addrs = getAddresses();
    addrs.push(addr);
    saveAddresses(addrs);
    document.getElementById('addAddressForm').style.display = 'none';
    ['addrName','addrPhone','addrArea','addrLandmark','addrLine','addrCity','addrPin'].forEach(id => setVal(id, ''));
    const stateEl = document.getElementById('addrState');
    if (stateEl) stateEl.value = '';
    renderAddressPanel();
    showToast('Address saved!', 'success');
}

function setDefaultAddress(idx) {
    const addrs = getAddresses();
    if (idx <= 0 || idx >= addrs.length) return;
    // Move selected address to front
    const [addr] = addrs.splice(idx, 1);
    addrs.unshift(addr);
    saveAddresses(addrs);
    renderAddressPanel();
}

function removeAddress(idx) {
    if (!confirm('Remove this address?')) return;
    const addrs = getAddresses();
    addrs.splice(idx, 1);
    saveAddresses(addrs);
    renderAddressPanel();
}

// Toast for account page
function showToast(msg, type) {
    let t = document.getElementById('acctToast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'acctToast';
        t.className = 'co-toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className   = 'co-toast co-toast--' + (type || 'info') + ' show';
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('show'), 3000);
}

// ─────────────────────────────────────────────────────────────────────────────
// WISHLIST PANEL
// ─────────────────────────────────────────────────────────────────────────────
function renderWishlistPanel() {
    const grid = document.getElementById('acctWishlistGrid');
    if (!grid) return;
    const favs = typeof getFavourites === 'function' ? getFavourites() : [];

    if (favs.length === 0) {
        grid.innerHTML = `<div class="col-12 acct-empty-state">
            <div style="font-size:2.8rem;">❤️</div>
            <p class="mt-3 text-muted">Your wishlist is empty.<br>Save items you love while shopping.</p>
            <a href="shop.html" class="btn btn-primary btn-sm mt-2">Browse Products</a>
        </div>`;
        return;
    }

    grid.innerHTML = favs.map(p => `
        <div class="col-6 col-md-3 mb-4" id="wl-card-${p.id}">
            <div class="card h-100" style="border-radius:12px;overflow:hidden;">
                <div style="position:relative;">
                    <img src="${p.image || 'images/shirt.jpg'}" class="card-img-top"
                         style="height:180px;object-fit:cover;"
                         onerror="this.src='https://via.placeholder.com/200x180?text=?'"
                         alt="${p.name}">
                    <button onclick="acctRemoveWishlist(${p.id})"
                            style="position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.9);
                                   border:none;border-radius:50%;width:32px;height:32px;
                                   font-size:1rem;cursor:pointer;">❤️</button>
                </div>
                <div class="card-body p-2">
                    <p class="mb-1" style="font-size:0.82rem;font-weight:600;color:#1a1a2e;
                                           white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${p.name}</p>
                    <p class="mb-2 text-primary font-weight-bold" style="font-size:0.9rem;">₹${p.price}</p>
                    <a href="product.html?id=${p.id}" class="btn btn-primary btn-sm btn-block"
                       style="font-size:0.78rem;">View</a>
                </div>
            </div>
        </div>`).join('');
}

function acctRemoveWishlist(id) {
    if (typeof toggleFavourite !== 'function') return;
    const favs = getFavourites().filter(f => f.id != id);
    localStorage.setItem('karunadaFavourites', JSON.stringify(favs));
    const card = document.getElementById('wl-card-' + id);
    if (card) card.remove();
    if (typeof refreshFavBadge === 'function') refreshFavBadge();
    if (getFavourites().length === 0) renderWishlistPanel();
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER SEARCH  (delegates to orders.js getOrders / buildOrderCard)
// ─────────────────────────────────────────────────────────────────────────────
function searchOrder() {
    const query  = (document.getElementById('orderSearchInput')?.value || '').trim().toLowerCase();
    const listEl = document.getElementById('ordersList');
    const emptyEl = document.getElementById('noOrders');
    if (!query) { renderOrdersPanel(); return; }

    const matched = getOrders().filter(o =>
        o.id.toLowerCase().includes(query) ||
        (o.customerName || '').toLowerCase().includes(query)
    );

    if (matched.length === 0) {
        listEl.innerHTML = `<div class="alert alert-warning">
            No order found matching "<strong>${query}</strong>".
            <a href="#" onclick="clearOrderSearch()" class="ml-2">Clear</a>
        </div>`;
        emptyEl.style.display = 'none';
    } else {
        emptyEl.style.display = 'none';
        listEl.innerHTML = matched.map(o => buildOrderCard(o)).join('');
    }
}

function clearOrderSearch() {
    const input = document.getElementById('orderSearchInput');
    if (input) input.value = '';
    renderOrdersPanel();
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
function getVal(id)      { const el = document.getElementById(id); return el ? el.value : ''; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function setChecked(id, v) { const el = document.getElementById(id); if (el) el.checked = v; }

// ─── Support Panel FAQ accordion ─────────────────────────────────────────────
window.toggleFaq = function (el) {
    const isOpen = el.classList.contains('open');
    // Close all
    document.querySelectorAll('.support-topic-item.open').forEach(function(item) {
        item.classList.remove('open');
    });
    // Open clicked one (unless it was already open)
    if (!isOpen) el.classList.add('open');
};

// ─── Account Payments: open UPI app directly ──────────────────────────────────
window.openUpiApp = function (app) {
    const MERCHANT_UPI  = '7899648380@ybl';
    const MERCHANT_NAME = encodeURIComponent('Karunada Collection');
    const note          = encodeURIComponent('Karunada Collection Payment');
    const vpa           = encodeURIComponent(MERCHANT_UPI);

    const schemes = {
        phonepe: `phonepe://pay?pa=${vpa}&pn=${MERCHANT_NAME}&cu=INR&tn=${note}`,
        gpay:    `tez://upi/pay?pa=${vpa}&pn=${MERCHANT_NAME}&cu=INR&tn=${note}`,
        paytm:   `paytmmp://pay?pa=${vpa}&pn=${MERCHANT_NAME}&cu=INR&tn=${note}`,
    };

    window.location.href = schemes[app] || `upi://pay?pa=${vpa}&pn=${MERCHANT_NAME}&cu=INR&tn=${note}`;
};
