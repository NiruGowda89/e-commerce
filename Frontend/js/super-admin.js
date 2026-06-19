// ─── Super Admin JS ────────────────────────────────────────────────────────
// Handles all Super Admin dashboard interactions

(function () {
  'use strict';

  /* ── Guard: only SUPER_ADMIN may enter ─────────────────────────── */
  const user = getCurrentUser();
  if (!user || user.role !== 'SUPER_ADMIN') {
    window.location.href = 'login.html';
  }

  /* ── Display logged-in user ──────────────────────────────────────── */
  const nameEl   = document.getElementById('saName');
  const avatarEl = document.getElementById('saAvatar');
  if (nameEl && user) {
    nameEl.textContent = user.name || 'Super Admin';
    if (avatarEl) {
      const parts = (user.name || 'SA').split(' ');
      avatarEl.textContent = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    }
  }
  const sysLoggedAs = document.getElementById('sysLoggedAs');
  if (sysLoggedAs) sysLoggedAs.textContent = (user && user.email) ? user.email : '—';
  const sysCurrApi = document.getElementById('sysCurrApi');
  if (sysCurrApi) sysCurrApi.textContent = API_BASE || '—';
  const sysApiUrl = document.getElementById('sysApiUrl');
  if (sysApiUrl) sysApiUrl.value = API_BASE || '';

  /* ── In-memory data cache ────────────────────────────────────────── */
  let _orders   = [];
  let _products = [];
  let _users    = [];   // populated from /api/admin/users (when available)
  let _coupons  = [];

  /* ══════════════════════════════════════════════════════════════════
     NAVIGATION
  ══════════════════════════════════════════════════════════════════ */
  window.showSection = function (name) {
    document.querySelectorAll('.sa-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link-item').forEach(b => b.classList.remove('active'));
    const sec = document.getElementById('sec-' + name);
    if (sec) sec.classList.add('active');
    const btn = document.querySelector(`[data-section="${name}"]`);
    if (btn) btn.classList.add('active');
    const topTitle = document.getElementById('topbarSection');
    if (topTitle && btn) topTitle.textContent = btn.textContent.trim();
    // Lazy-load section data
    const loaders = {
      dashboard: loadDashboard,
      analytics:  loadAnalytics,
      users:      loadUsersSection,
      admins:     loadAdminsSection,
      products:   loadProductsSection,
      orders:     loadOrdersSection,
      coupons:    loadCouponsSection,
    };
    if (loaders[name]) loaders[name]();
  };

  document.querySelectorAll('.nav-link-item').forEach(btn => {
    btn.addEventListener('click', () => showSection(btn.dataset.section));
  });

  window.toggleSidebar = function () {
    document.getElementById('sidebar').classList.toggle('open');
  };

  /* ══════════════════════════════════════════════════════════════════
     TOAST
  ══════════════════════════════════════════════════════════════════ */
  window.saToast = function (msg, type = 'success') {
    const t = document.getElementById('saToast');
    t.textContent = msg;
    t.className = 'show ' + type;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.className = ''; }, 3500);
  };

  /* ══════════════════════════════════════════════════════════════════
     LOGOUT
  ══════════════════════════════════════════════════════════════════ */
  window.saLogout = function () { logoutUser(); };

  /* ══════════════════════════════════════════════════════════════════
     MODAL HELPERS
  ══════════════════════════════════════════════════════════════════ */
  window.closeModal = function (id) {
    document.getElementById(id).classList.remove('open');
  };
  window.openPromoteModal = function () {
    document.getElementById('promoteOverlay').classList.add('open');
  };
  window.confirmAction = function (msg, fn) {
    if (confirm(msg)) fn();
  };

  /* ══════════════════════════════════════════════════════════════════
     DASHBOARD
  ══════════════════════════════════════════════════════════════════ */
  let chartsBuilt = false;
  async function loadDashboard() {
    try {
      const [orders, products] = await Promise.all([
        fetch(`${API_BASE}/order/all`).then(r => r.json()),
        apiGetProducts()
      ]);
      _orders   = Array.isArray(orders)   ? orders   : [];
      _products = Array.isArray(products) ? products : [];

      const total   = _orders.length;
      const revenue = _orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
      const pending  = _orders.filter(o => o.status === 'Pending').length;
      const delivered= _orders.filter(o => o.status === 'Delivered').length;

      setText('kpiOrders',   total);
      setText('kpiRevenue',  '₹' + revenue.toLocaleString('en-IN'));
      setText('kpiPending',  pending);
      setText('kpiDelivered',delivered);
      setText('kpiProducts', _products.length);
      // Users KPI — try endpoint, fall back to placeholder
      try {
        const u = await fetch(`${API_BASE}/admin/users`).then(r => r.json());
        _users = Array.isArray(u) ? u : [];
        setText('kpiUsers', _users.length);
      } catch {
        setText('kpiUsers', '—');
      }

      buildDashboardCharts();
      renderRecentOrders(_orders.slice(-8).reverse());
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  }

  function buildDashboardCharts() {
    if (chartsBuilt) return;
    chartsBuilt = true;

    const statusCounts = {};
    const statusRevenue = {};
    _orders.forEach(o => {
      statusCounts[o.status]  = (statusCounts[o.status]  || 0) + 1;
      statusRevenue[o.status] = (statusRevenue[o.status] || 0) + (o.totalAmount || 0);
    });
    const labels = Object.keys(statusCounts);
    const palette = ['#7c3aed','#f59e0b','#10b981','#3b82f6','#ef4444'];

    const cfg = (type, data, opts = {}) => ({
      type, data,
      options: { responsive: true, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } }, ...opts }
    });

    new Chart(document.getElementById('revenueChart'), cfg('bar', {
      labels,
      datasets: [{ label: 'Revenue (₹)', data: labels.map(l => statusRevenue[l] || 0),
        backgroundColor: palette, borderRadius: 6 }]
    }, { scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } } }));

    new Chart(document.getElementById('statusChart'), cfg('doughnut', {
      labels,
      datasets: [{ data: labels.map(l => statusCounts[l] || 0),
        backgroundColor: palette, borderWidth: 0, hoverOffset: 8 }]
    }));
  }

  function renderRecentOrders(orders) {
    const tbody = document.getElementById('dashRecentOrders');
    if (!orders.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px;">No orders yet.</td></tr>'; return; }
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td style="color:var(--purple-lt);font-weight:600;">#${o.orderId || o.id || '—'}</td>
        <td>${esc(o.customerName || o.email || '—')}</td>
        <td>₹${(o.totalAmount || 0).toLocaleString('en-IN')}</td>
        <td><span class="badge-order ${o.status}">${o.status || '—'}</span></td>
        <td style="color:var(--muted);font-size:.75rem;">${fmtDate(o.orderDate)}</td>
      </tr>`).join('');
  }

  /* ══════════════════════════════════════════════════════════════════
     ANALYTICS
  ══════════════════════════════════════════════════════════════════ */
  let analyticsBuilt = false;
  async function loadAnalytics() {
    if (!_orders.length || !_products.length) await loadDashboard();
    if (analyticsBuilt) return;
    analyticsBuilt = true;

    const confirmed  = _orders.filter(o => o.status === 'Confirmed').length;
    const shipped    = _orders.filter(o => o.status === 'Shipped').length;
    const cancelled  = _orders.filter(o => o.status === 'Cancelled').length;
    const avgVal     = _orders.length ? (_orders.reduce((s,o)=>s+(o.totalAmount||0),0)/_orders.length) : 0;

    setText('anlConfirmed', confirmed);
    setText('anlShipped',   shipped);
    setText('anlCancelled', cancelled);
    setText('anlAvg', '₹' + Math.round(avgVal).toLocaleString('en-IN'));

    // Category revenue — from products price × stock as proxy
    const catRevenue = {};
    _products.forEach(p => {
      catRevenue[p.category] = (catRevenue[p.category] || 0) + (p.price * p.stock);
    });
    const catLabels = Object.keys(catRevenue);
    const catPalette = ['#7c3aed','#f59e0b','#10b981','#3b82f6','#ef4444','#ec4899','#06b6d4'];

    new Chart(document.getElementById('categoryChart'), {
      type: 'bar',
      data: {
        labels: catLabels,
        datasets: [{ label: 'Value (₹)', data: catLabels.map(l=>catRevenue[l]),
          backgroundColor: catPalette.slice(0,catLabels.length), borderRadius: 6 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } },
        scales: { x:{ticks:{color:'#94a3b8',font:{size:10}}}, y:{ticks:{color:'#94a3b8'}} } }
    });

    // Payment method split
    const payMap = {};
    _orders.forEach(o => { payMap[o.paymentMethod || 'Unknown'] = (payMap[o.paymentMethod || 'Unknown'] || 0) + 1; });
    const payLabels = Object.keys(payMap);
    new Chart(document.getElementById('paymentChart'), {
      type: 'pie',
      data: {
        labels: payLabels,
        datasets: [{ data: payLabels.map(l=>payMap[l]),
          backgroundColor: catPalette, borderWidth: 0 }]
      },
      options: { responsive: true, plugins: { legend: { labels: { color: '#94a3b8', font:{size:11} } } } }
    });

    // Top products
    const sorted = [..._products].sort((a,b)=>(b.price*b.stock)-(a.price*a.stock)).slice(0,10);
    const tbody = document.getElementById('topProductsTable');
    tbody.innerHTML = sorted.map((p,i) => `
      <tr>
        <td style="color:var(--gold);font-weight:700;">${i+1}</td>
        <td style="font-weight:600;">${esc(p.productName || p.name)}</td>
        <td><span style="color:var(--muted);">${esc(p.category || '—')}</span></td>
        <td>₹${(p.price||0).toLocaleString('en-IN')}</td>
        <td>${stockBadge(p.stock)}</td>
      </tr>`).join('');
  }

  /* ══════════════════════════════════════════════════════════════════
     USERS
  ══════════════════════════════════════════════════════════════════ */
  window.loadUsersSection = async function () {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = loadingRow(7);
    try {
      const res = await fetch(`${API_BASE}/admin/users`);
      if (!res.ok) throw new Error('Backend endpoint not yet available.');
      _users = await res.json();
      renderUsersTable(_users);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--muted);">
        <div>🔌 User management API endpoint is not available yet.</div>
        <div style="font-size:.75rem;margin-top:8px;">Add <code style="color:var(--purple-lt);">GET /api/admin/users</code> to the backend to enable this feature.</div>
      </td></tr>`;
    }
  };

  function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    document.getElementById('userCount').textContent = `(${users.length})`;
    if (!users.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--muted);">No users found.</td></tr>'; return; }
    tbody.innerHTML = users.map(u => `
      <tr data-email="${esc(u.email)}" data-name="${esc(u.name||'')}" data-role="${u.role||'USER'}">
        <td style="color:var(--muted);font-size:.75rem;">${u.userId || u.id}</td>
        <td style="font-weight:600;">${esc(u.name || '—')}</td>
        <td style="color:var(--muted);">${esc(u.email)}</td>
        <td><span class="badge-role ${(u.role||'user').toLowerCase()}">${u.role || 'USER'}</span></td>
        <td><span class="badge-status ${u.active ? 'active' : 'inactive'}">${u.active ? 'Active' : 'Inactive'}</span></td>
        <td style="color:var(--muted);font-size:.75rem;">${fmtDate(u.createdAt)}</td>
        <td>
          <button class="btn-sa sm ${u.active ? 'danger' : 'success'}"
            onclick="toggleUserStatus(${u.userId || u.id}, ${!u.active})">
            ${u.active ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      </tr>`).join('');
  }

  window.filterUsersTable = function () {
    const q    = (document.getElementById('userSearch').value || '').toLowerCase();
    const role = document.getElementById('userRoleFilter').value;
    document.querySelectorAll('#usersTableBody tr[data-email]').forEach(row => {
      const email = (row.dataset.email || '').toLowerCase();
      const name  = (row.dataset.name  || '').toLowerCase();
      const r     = row.dataset.role || '';
      const match = (!q || email.includes(q) || name.includes(q)) && (!role || r === role);
      row.style.display = match ? '' : 'none';
    });
  };

  window.toggleUserStatus = async function (id, active) {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}/status?active=${active}`, { method: 'PUT' });
      if (!res.ok) throw new Error();
      saToast(`User ${active ? 'activated' : 'deactivated'} successfully.`);
      loadUsersSection();
    } catch {
      saToast('Failed to update user status. Backend endpoint needed.', 'error');
    }
  };

  /* ══════════════════════════════════════════════════════════════════
     ADMINS
  ══════════════════════════════════════════════════════════════════ */
  async function loadAdminsSection() {
    const tbody = document.getElementById('adminsTableBody');
    tbody.innerHTML = loadingRow(6);
    try {
      const res = await fetch(`${API_BASE}/admin/users`);
      if (!res.ok) throw new Error();
      const all = await res.json();
      const admins = all.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');
      tbody.innerHTML = admins.length ? admins.map(u => `
        <tr>
          <td style="color:var(--muted);font-size:.75rem;">${u.userId||u.id}</td>
          <td style="font-weight:600;">${esc(u.name||'—')}</td>
          <td style="color:var(--muted);">${esc(u.email)}</td>
          <td><span class="badge-role ${(u.role||'').toLowerCase()}">${u.role}</span></td>
          <td><span class="badge-status ${u.active?'active':'inactive'}">${u.active?'Active':'Inactive'}</span></td>
          <td>
            ${u.role !== 'SUPER_ADMIN' ? `<button class="btn-sa sm danger" onclick="revokeAdmin(${u.userId||u.id})">Revoke Admin</button>` : '<span style="color:var(--muted);font-size:.73rem;">Protected</span>'}
          </td>
        </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted);">No admin accounts found.</td></tr>';
    } catch {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--muted);">
        🔌 Admin management API not available yet. Backend endpoint <code style="color:var(--purple-lt);">GET /api/admin/users</code> required.
      </td></tr>`;
    }
  }

  window.revokeAdmin = async function (id) {
    if (!confirm('Demote this admin to USER?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}/role?role=USER`, { method: 'PUT' });
      if (!res.ok) throw new Error();
      saToast('Admin revoked and demoted to USER.');
      loadAdminsSection();
    } catch {
      saToast('Role change API not available yet.', 'error');
    }
  };

  window.promoteUser = async function () {
    const email = document.getElementById('promoteEmail').value.trim();
    const role  = document.getElementById('promoteRole').value;
    if (!email) { saToast('Please enter an email.', 'error'); return; }
    try {
      const res = await fetch(`${API_BASE}/admin/users/role?email=${encodeURIComponent(email)}&role=${role}`, { method: 'PUT' });
      if (!res.ok) throw new Error();
      saToast(`Role updated to ${role} for ${email}`);
      closeModal('promoteOverlay');
      loadAdminsSection();
    } catch {
      saToast('Role update API not available yet.', 'error');
    }
  };

  /* ══════════════════════════════════════════════════════════════════
     PRODUCTS
  ══════════════════════════════════════════════════════════════════ */
  window.loadProductsSection = async function () {
    const tbody = document.getElementById('saProductsTable');
    tbody.innerHTML = loadingRow(6);
    try {
      _products = await apiGetProducts();
      renderProductsTable(_products);
    } catch {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--red);">Failed to load products.</td></tr>';
    }
  };

  function renderProductsTable(prods) {
    const tbody = document.getElementById('saProductsTable');
    document.getElementById('productCount').textContent = `(${prods.length})`;
    tbody.innerHTML = prods.map(p => `
      <tr data-name="${esc((p.productName||p.name||'').toLowerCase())}">
        <td style="color:var(--muted);font-size:.75rem;">${p.productId||p.id}</td>
        <td style="font-weight:600;">${esc(p.productName||p.name)}</td>
        <td><span style="color:var(--muted);">${esc(p.category||'—')}</span></td>
        <td>₹${(p.price||0).toLocaleString('en-IN')}</td>
        <td>${stockBadge(p.stock)}</td>
        <td>
          <button class="btn-sa sm danger" onclick="saDeleteProduct(${p.productId||p.id})">🗑 Delete</button>
        </td>
      </tr>`).join('');
  }

  window.filterProductsTable = function () {
    const q = (document.getElementById('productSearch').value || '').toLowerCase();
    document.querySelectorAll('#saProductsTable tr[data-name]').forEach(row => {
      row.style.display = (!q || row.dataset.name.includes(q)) ? '' : 'none';
    });
  };

  document.getElementById('saAddProductForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const product = {
      productName: document.getElementById('saProductName').value,
      category:    document.getElementById('saCategory').value,
      brand:       document.getElementById('saBrand').value,
      price:       +document.getElementById('saPrice').value,
      stock:       +document.getElementById('saStock').value,
      size:        document.getElementById('saSize').value,
      color:       document.getElementById('saColor').value,
      imageUrl:    document.getElementById('saImageUrl').value,
      description: document.getElementById('saDescription').value,
    };
    try {
      await apiAddProduct(product);
      saToast('Product added successfully!');
      this.reset();
      document.getElementById('saBrand').value = 'Karunada';
      loadProductsSection();
    } catch {
      saToast('Failed to add product.', 'error');
    }
  });

  window.saDeleteProduct = async function (id) {
    if (!confirm('Delete this product permanently?')) return;
    try {
      await apiDeleteProduct(id);
      saToast('Product deleted.');
      loadProductsSection();
    } catch {
      saToast('Failed to delete product.', 'error');
    }
  };

  /* ══════════════════════════════════════════════════════════════════
     ORDERS
  ══════════════════════════════════════════════════════════════════ */
  window.loadOrdersSection = async function () {
    const tbody = document.getElementById('saOrdersTable');
    tbody.innerHTML = loadingRow(7);
    try {
      const data = await fetch(`${API_BASE}/order/all`).then(r => r.json());
      _orders = Array.isArray(data) ? data : [];
      renderOrdersTable(_orders);
    } catch {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--red);">Failed to load orders.</td></tr>';
    }
  };

  function renderOrdersTable(orders) {
    const tbody = document.getElementById('saOrdersTable');
    document.getElementById('orderCount').textContent = `(${orders.length})`;
    tbody.innerHTML = orders.length ? orders.map(o => `
      <tr data-customer="${esc((o.customerName||o.email||'').toLowerCase())}"
          data-id="${o.orderId||o.id}"
          data-status="${o.status||''}">
        <td style="color:var(--purple-lt);font-weight:600;">#${o.orderId||o.id}</td>
        <td>
          <div style="font-weight:600;font-size:.82rem;">${esc(o.customerName||'—')}</div>
          <div style="color:var(--muted);font-size:.72rem;">${esc(o.email||'')}</div>
        </td>
        <td>₹${(o.totalAmount||0).toLocaleString('en-IN')}</td>
        <td style="color:var(--muted);font-size:.78rem;">${esc(o.paymentMethod||'—')}</td>
        <td><span class="badge-order ${o.status}">${o.status||'—'}</span></td>
        <td style="color:var(--muted);font-size:.73rem;">${fmtDate(o.orderDate)}</td>
        <td>
          <select class="sa-input" style="padding:4px 8px;font-size:.75rem;max-width:130px;"
            onchange="updateOrderStatus(${o.orderId||o.id}, this.value)">
            ${['Pending','Confirmed','Shipped','Delivered','Cancelled'].map(s =>
              `<option ${o.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--muted);">No orders found.</td></tr>';
  }

  window.filterOrdersTable = function () {
    const q      = (document.getElementById('orderSearch').value || '').toLowerCase();
    const status = document.getElementById('orderStatusFilter').value;
    document.querySelectorAll('#saOrdersTable tr[data-customer]').forEach(row => {
      const cust = row.dataset.customer || '';
      const id   = String(row.dataset.id || '');
      const st   = row.dataset.status || '';
      const match = (!q || cust.includes(q) || id.includes(q)) && (!status || st === status);
      row.style.display = match ? '' : 'none';
    });
  };

  window.updateOrderStatus = async function (id, status) {
    try {
      await apiUpdateOrderStatus(id, status);
      saToast(`Order #${id} → ${status}`);
    } catch {
      saToast('Failed to update order status.', 'error');
    }
  };

  /* ══════════════════════════════════════════════════════════════════
     COUPONS
  ══════════════════════════════════════════════════════════════════ */
  window.loadCouponsSection = async function () {
    const tbody = document.getElementById('saCouponTable');
    tbody.innerHTML = loadingRow(5);
    try {
      const res = await fetch(`${API_BASE}/coupons`);
      _coupons = await res.json();
      renderCouponsTable(_coupons);
    } catch {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--muted);">No coupons or endpoint not available.</td></tr>';
    }
  };

  function renderCouponsTable(coupons) {
    const tbody = document.getElementById('saCouponTable');
    tbody.innerHTML = coupons.length ? coupons.map(c => `
      <tr>
        <td style="font-weight:700;color:var(--gold);letter-spacing:.5px;">${esc(c.code)}</td>
        <td>${c.discountPercent ? c.discountPercent + '%' : (c.discountAmount ? '₹'+c.discountAmount : '—')}</td>
        <td>${c.minOrderAmount ? '₹'+c.minOrderAmount : '—'}</td>
        <td><span class="badge-status ${c.active ? 'active' : 'inactive'}">${c.active ? 'Active' : 'Inactive'}</span></td>
        <td>
          <button class="btn-sa sm danger" onclick="deleteCoupon(${c.couponId||c.id})">Delete</button>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--muted);">No coupons found.</td></tr>';
  }

  document.getElementById('saAddCouponForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const coupon = {
      code:            document.getElementById('saCouponCode').value.toUpperCase(),
      discountPercent: +document.getElementById('saCouponPercent').value || null,
      discountAmount:  +document.getElementById('saCouponAmount').value || null,
      minOrderAmount:  +document.getElementById('saCouponMin').value || 0,
      active: true
    };
    try {
      const res = await fetch(`${API_BASE}/coupons`, {
        method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(coupon)
      });
      if (!res.ok) throw new Error();
      saToast('Coupon created!');
      this.reset();
      loadCouponsSection();
    } catch {
      saToast('Failed to create coupon.', 'error');
    }
  });

  window.deleteCoupon = async function (id) {
    if (!confirm('Delete this coupon?')) return;
    try {
      const res = await fetch(`${API_BASE}/coupons/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      saToast('Coupon deleted.');
      loadCouponsSection();
    } catch {
      saToast('Failed to delete coupon.', 'error');
    }
  };

  window.clearCoupons = async function () {
    if (!_coupons.length) { saToast('No coupons to clear.'); return; }
    let ok = 0;
    for (const c of _coupons) {
      try { await fetch(`${API_BASE}/coupons/${c.couponId||c.id}`, {method:'DELETE'}); ok++; } catch {}
    }
    saToast(`Cleared ${ok} coupon(s).`);
    loadCouponsSection();
  };

  /* ══════════════════════════════════════════════════════════════════
     SYSTEM SETTINGS
  ══════════════════════════════════════════════════════════════════ */
  window.saveApiUrl = function () {
    const val = document.getElementById('sysApiUrl').value.trim();
    if (!val) return;
    localStorage.setItem('karunada_api_base', val);
    saToast('API URL saved. Reload the page to apply.');
  };

  window.testApi = async function () {
    const el = document.getElementById('apiTestResult');
    el.textContent = 'Testing…';
    el.style.color = 'var(--muted)';
    const online = await isBackendOnline();
    if (online) { el.textContent = '✓ Backend is reachable!'; el.style.color = 'var(--green)'; }
    else         { el.textContent = '✗ Backend not reachable.'; el.style.color = 'var(--red)'; }
  };

  /* ══════════════════════════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════════════════════════ */
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  function esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function fmtDate(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}); }
    catch { return '—'; }
  }
  function loadingRow(cols) {
    return `<tr class="loading-row"><td colspan="${cols}"><span class="spinner"></span></td></tr>`;
  }
  function stockBadge(stock) {
    const n = stock || 0;
    if (n === 0) return `<span style="color:var(--red);font-weight:700;">Out of Stock</span>`;
    if (n < 10)  return `<span style="color:var(--gold);font-weight:600;">${n} (Low)</span>`;
    return `<span style="color:var(--green);">${n}</span>`;
  }

  /* ── Initial load ─────────────────────────────────────────────── */
  loadDashboard();

  // Update navbar link in auth.js for SUPER_ADMIN
  const u2 = getCurrentUser();
  if (u2 && u2.role === 'SUPER_ADMIN') {
    // inject super-admin link into any authNav that exists
    const authNav = document.getElementById('authNav');
    if (authNav) {
      const link = authNav.querySelector('a[href="admin.html"]');
      if (link) link.href = 'super-admin.html';
    }
  }

})();
