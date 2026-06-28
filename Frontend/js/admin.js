// ─── Admin JS ────────────────────────────────────────────────────────
// Handles all Admin dashboard interactions, analytics, inventory, and orders

(function () {
  'use strict';

  const admin = getCurrentUser();
  if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
    window.location.href = 'login.html';
  }

  /* ── Display logged-in admin ──────────────────────────────────────── */
  const nameEl   = document.getElementById('adminNameDisplay');
  const avatarEl = document.getElementById('admAvatar');
  if (nameEl && admin) {
    nameEl.textContent = admin.name || 'Store Admin';
    if (avatarEl) {
      const parts = (admin.name || 'Admin').split(' ');
      avatarEl.textContent = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    }
  }

  /* ── Memory Cache ────────────────────────────────────────────────── */
  let _orders   = [];
  let _products = [];
  let _coupons  = [];

  /* ══════════════════════════════════════════════════════════════════
     NAVIGATION
  ══════════════════════════════════════════════════════════════════ */
  window.showSection = function (name) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link-item').forEach(b => b.classList.remove('active'));
    
    // Custom mapping for orders pages to section element ids
    let targetId = 'sec-' + name;
    const sec = document.getElementById(targetId);
    if (sec) sec.classList.add('active');

    const btn = document.querySelector(`[data-section="${name}"]`);
    if (btn) btn.classList.add('active');

    const topTitle = document.getElementById('topbarSection');
    if (topTitle && btn) topTitle.textContent = btn.textContent.trim();

    // Close mobile sidebar if open
    document.getElementById('sidebar').classList.remove('open');

    // Lazy-load data for active section
    const loaders = {
      dashboard:          loadDashboard,
      products:           loadProductsSection,
      coupons:            loadCouponsSection,
      'orders-all':       loadOrdersAllSection,
      'orders-pending':   loadOrdersPendingSection,
      'orders-delivered': loadOrdersDeliveredSection
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
     TOAST NOTIFICATION
  ══════════════════════════════════════════════════════════════════ */
  window.saToast = function (msg, type = 'success') {
    const t = document.getElementById('saToast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'show ' + type;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.className = ''; }, 3500);
  };

  /* ══════════════════════════════════════════════════════════════════
     BACKEND STATUS BADGE
  ══════════════════════════════════════════════════════════════════ */
  async function checkBackendStatus() {
    const statusContainer = document.getElementById('backendStatus');
    if (!statusContainer) return;
    const online = await isBackendOnline();
    if (online) {
      statusContainer.innerHTML = '<span class="badge-online">Backend Online</span>';
    } else {
      statusContainer.innerHTML = '<span class="badge-offline">Backend Offline</span>';
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     DASHBOARD & REPORTS
  ══════════════════════════════════════════════════════════════════ */
  let chartsBuilt = false;
  let revenueChartInstance = null;
  let statusChartInstance = null;

  async function loadDashboard() {
    try {
      await fetchAllOrdersAndProducts();

      const totalOrders = _orders.length;
      const totalRevenue = _orders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);
      const pendingOrders = _orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed' || o.status === 'Shipped').length;
      const catalogProducts = _products.length;

      setText('rptTotalOrders', totalOrders);
      setText('rptRevenue', '₹' + totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 }));
      setText('rptPending', pendingOrders);
      setText('rptProducts', catalogProducts);

      buildDashboardCharts();
      renderRecentOrders(_orders.slice(-8).reverse());
      renderTopProductsSold();
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  }

  async function fetchAllOrdersAndProducts() {
    // 1. Fetch products
    try {
      _products = await apiGetProducts();
    } catch (e) {
      console.warn('Backend products fetch failed.');
      _products = [];
    }

    // 2. Fetch all orders from backend only — no localStorage
    try {
      const res = await fetch(`${API_BASE}/order/all`);
      if (!res.ok) throw new Error('Orders fetch failed');
      _orders = await res.json();
    } catch (e) {
      console.warn('Backend orders fetch failed:', e);
      _orders = [];
    }

    // Sort newest first
    _orders.sort((a, b) => new Date(b.orderDate || b.placedAt || 0).getTime()
                          - new Date(a.orderDate || a.placedAt || 0).getTime());
  }

  function buildDashboardCharts() {
    const statusCounts = {};
    const statusRevenue = {};
    
    _orders.forEach(o => {
      const status = o.status || 'Pending';
      const amount = o.totalAmount || o.total || 0;
      statusCounts[status]  = (statusCounts[status]  || 0) + 1;
      statusRevenue[status] = (statusRevenue[status] || 0) + amount;
    });

    const labels = Object.keys(statusCounts);
    if (labels.length === 0) return;

    const palette = ['#3b82f6', '#10b981', '#fbbf24', '#a78bfa', '#ef4444'];

    // Destroy existing charts to prevent canvas reusable errors on reload
    if (revenueChartInstance) revenueChartInstance.destroy();
    if (statusChartInstance) statusChartInstance.destroy();

    const cfg = (type, data, opts = {}) => ({
      type, data,
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: { 
          legend: { labels: { color: '#9ca3af', font: { size: 10 } } } 
        }, 
        ...opts 
      }
    });

    // 1. Revenue Chart
    const revCtx = document.getElementById('revenueChart');
    if (revCtx) {
      revenueChartInstance = new Chart(revCtx, cfg('bar', {
        labels,
        datasets: [{
          label: 'Revenue (₹)',
          data: labels.map(l => statusRevenue[l] || 0),
          backgroundColor: palette.slice(0, labels.length),
          borderRadius: 6
        }]
      }, {
        scales: {
          x: { ticks: { color: '#9ca3af', font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { color: '#9ca3af', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.06)' } }
        }
      }));
    }

    // 2. Status Breakdown
    const statCtx = document.getElementById('statusChart');
    if (statCtx) {
      statusChartInstance = new Chart(statCtx, cfg('doughnut', {
        labels,
        datasets: [{
          data: labels.map(l => statusCounts[l] || 0),
          backgroundColor: palette.slice(0, labels.length),
          borderWidth: 0,
          hoverOffset: 8
        }]
      }));
    }
  }

  function renderRecentOrders(ordersList) {
    const tbody = document.getElementById('recentOrdersTable');
    if (!tbody) return;
    if (!ordersList.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px;">No recent orders.</td></tr>';
      return;
    }
    tbody.innerHTML = ordersList.map(o => `
      <tr>
        <td style="color:var(--primary-lt);font-weight:600;">#${o.orderId || o.id}</td>
        <td>${esc(o.customerName || 'Guest')}</td>
        <td>₹${(o.totalAmount || 0).toLocaleString('en-IN')}</td>
        <td><span class="badge-order ${o.status}">${o.status}</span></td>
        <td style="color:var(--muted);font-size:.75rem;">${fmtDate(o.orderDate)}</td>
      </tr>`).join('');
  }

  function renderTopProductsSold() {
    const chartEl = document.getElementById('topProductsChart');
    if (!chartEl) return;

    const productCount = {};
    _orders.forEach(o => {
      // If items are nested as list, parse them
      let items = [];
      if (o.items_json) {
        try { items = JSON.parse(o.items_json); } catch(e) {}
      } else if (Array.isArray(o.items)) {
        items = o.items;
      }
      
      items.forEach(item => {
        const name = item.productName || item.name || 'Unknown Item';
        productCount[name] = (productCount[name] || 0) + (item.quantity || 1);
      });
    });

    const sorted = Object.entries(productCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    if (sorted.length === 0) {
      chartEl.innerHTML = '<p style="color:var(--muted);font-size:.8rem;text-align:center;padding:20px;">No products sold yet.</p>';
      return;
    }

    const max = sorted[0][1];
    chartEl.innerHTML = sorted.map(([name, count]) => `
      <div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:between;margin-bottom:5px;font-size:.8rem;">
          <span style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;">${esc(name)}</span>
          <strong style="color:var(--green);margin-left:auto;">${count} sold</strong>
        </div>
        <div style="height:12px;background:rgba(255,255,255,0.05);border-radius:6px;overflow:hidden;display:flex;">
          <div style="width:${Math.round(count / max * 100)}%;background:linear-gradient(90deg,var(--primary),var(--green));border-radius:6px;"></div>
        </div>
      </div>`).join('');
  }

  /* ══════════════════════════════════════════════════════════════════
     PRODUCTS
  ══════════════════════════════════════════════════════════════════ */
  async function loadProductsSection() {
    const tbody = document.getElementById('productTable');
    if (!tbody) return;
    tbody.innerHTML = loadingRow(5);

    try {
      _products = await apiGetProducts();
    } catch (e) {
      console.warn('Backend products unavailable, showing memory/local');
      _products = typeof products !== 'undefined' ? products : [];
    }

    renderProductsTable(_products);
  }

  function renderProductsTable(prods) {
    const tbody = document.getElementById('productTable');
    if (!tbody) return;
    const countEl = document.getElementById('productCount');
    if (countEl) countEl.textContent = `(${prods.length})`;

    if (!prods.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px;">No products found in catalog.</td></tr>';
      return;
    }

    tbody.innerHTML = prods.map(p => `
      <tr data-name="${esc((p.productName || p.name || '').toLowerCase())}">
        <td style="color:var(--muted);font-size:.75rem;">${p.productId || p.id}</td>
        <td style="font-weight:600;">${esc(p.productName || p.name)}</td>
        <td><span style="color:var(--muted);">${esc(p.category || '—')}</span></td>
        <td>₹${(p.price || 0).toLocaleString('en-IN')}</td>
        <td>
          <a href="product.html?id=${p.productId || p.id}" class="btn-sa success sm">👁 View</a>
          <button class="btn-sa danger sm" onclick="saDeleteProduct(${p.productId || p.id}, '${esc(p.productName || p.name)}')">🗑 Delete</button>
        </td>
      </tr>`).join('');
  }

  window.filterProductsTable = function () {
    const q = (document.getElementById('productSearch').value || '').toLowerCase();
    document.querySelectorAll('#productTable tr[data-name]').forEach(row => {
      row.style.display = (!q || row.dataset.name.includes(q)) ? '' : 'none';
    });
  };

  /* ══════════════════════════════════════════════════════════════════
     PRODUCT IMAGE PICKER  (multi-image, base64 in localStorage)
  ══════════════════════════════════════════════════════════════════ */
  let _selectedImageBase64s = []; // holds all selected images as base64 strings

  window.previewProductImages = function (e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    _selectedImageBase64s = [];
    const previewRow  = document.getElementById('imagePreviewRow');
    const countNote   = document.getElementById('imageCountNote');
    if (previewRow)  previewRow.innerHTML = '';
    if (countNote)   countNote.textContent = '';

    let loaded = 0;
    files.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = function (ev) {
        _selectedImageBase64s[idx] = ev.target.result;
        loaded++;

        // Add thumbnail preview
        if (previewRow) {
          const wrap = document.createElement('div');
          wrap.style.cssText = 'position:relative;display:inline-block;';
          const img = document.createElement('img');
          img.src = ev.target.result;
          img.style.cssText = 'width:64px;height:64px;object-fit:cover;border-radius:6px;border:1px solid var(--border);';
          // Remove button
          const rm = document.createElement('button');
          rm.type = 'button';
          rm.textContent = '×';
          rm.style.cssText = 'position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:#ef4444;color:#fff;border:none;font-size:.75rem;line-height:1;cursor:pointer;padding:0;';
          rm.onclick = function () {
            _selectedImageBase64s.splice(idx, 1, null);
            wrap.remove();
            if (countNote) countNote.textContent = `${_selectedImageBase64s.filter(Boolean).length} image(s) selected`;
          };
          wrap.appendChild(img);
          wrap.appendChild(rm);
          previewRow.appendChild(wrap);
        }

        if (loaded === files.length && countNote) {
          countNote.textContent = `${loaded} image(s) selected`;
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const productForm = document.getElementById('addProductForm');
  if (productForm) {
    productForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Get valid images (nulls removed after deletion)
      const validImages = _selectedImageBase64s.filter(Boolean);
      // First image as primary URL; fallback to default
      const primaryImage = validImages[0] || 'images/shirt.jpg';

      const newProduct = {
        productName: document.getElementById('productName').value.trim(),
        category:    document.getElementById('category').value,
        brand:       document.getElementById('brand').value.trim() || 'Karunada',
        price:       parseFloat(document.getElementById('price').value),
        stock:       parseInt(document.getElementById('stock').value),
        size:        document.getElementById('size').value.trim(),
        color:       document.getElementById('color').value.trim(),
        imageUrl:    primaryImage,
        description: document.getElementById('description').value.trim()
      };

      try {
        const saved = await apiAddProduct(newProduct);
        // Store all extra images in localStorage keyed by product ID
        if (validImages.length > 0 && saved) {
          const pid = saved.productId || saved.id;
          if (pid) {
            localStorage.setItem('product_images_' + pid, JSON.stringify(validImages));
          }
        }
        saToast('Product added successfully!');
        productForm.reset();
        document.getElementById('brand').value = 'Karunada';
        // Clear image state
        _selectedImageBase64s = [];
        const previewRow = document.getElementById('imagePreviewRow');
        const countNote  = document.getElementById('imageCountNote');
        if (previewRow) previewRow.innerHTML = '';
        if (countNote)  countNote.textContent = '';
        loadProductsSection();
      } catch (err) {
        saToast('Backend offline — product not saved to server.', 'error');
      }
    });
  }

  window.saDeleteProduct = async function (id, name) {
    if (!confirm(`Delete "${name}" permanently?`)) return;
    try {
      await apiDeleteProduct(id);
      saToast(`Product "${name}" deleted.`);
      loadProductsSection();
    } catch {
      saToast('Failed to delete product.', 'error');
    }
  };

  /* ══════════════════════════════════════════════════════════════════
     COUPONS
  ══════════════════════════════════════════════════════════════════ */
  async function loadCouponsSection() {
    const tbody = document.getElementById('couponTable');
    if (!tbody) return;
    tbody.innerHTML = loadingRow(5);

    try {
      const res = await fetch(API_BASE + '/coupons');
      _coupons = await res.json();
      renderCouponsTable(_coupons);
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--muted);">No coupons or coupons API not reachable.</td></tr>';
    }
  }

  function renderCouponsTable(coupons) {
    const tbody = document.getElementById('couponTable');
    if (!tbody) return;
    tbody.innerHTML = coupons.length ? coupons.map(c => `
      <tr>
        <td style="font-weight:700;color:var(--gold);letter-spacing:.5px;">${esc(c.code)}</td>
        <td>${c.discountPercent ? c.discountPercent + '%' : (c.discountAmount ? '₹'+c.discountAmount : '—')}</td>
        <td>₹${c.minOrderAmount || 0}</td>
        <td><span class="badge-status ${c.active ? 'active' : 'inactive'}">${c.active ? 'Active' : 'Inactive'}</span></td>
        <td>
          <button class="btn-sa danger sm" onclick="saDeleteCoupon(${c.couponId || c.id})">Delete</button>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px;">No active coupons found.</td></tr>';
  }

  const couponForm = document.getElementById('addCouponForm');
  if (couponForm) {
    couponForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const coupon = {
        code:            document.getElementById('couponCode').value.trim().toUpperCase(),
        discountPercent: parseFloat(document.getElementById('couponPercent').value) || null,
        discountAmount:  parseFloat(document.getElementById('couponAmount').value) || null,
        minOrderAmount:  parseFloat(document.getElementById('couponMinOrder').value) || 0,
        active: true
      };

      if (!coupon.discountPercent && !coupon.discountAmount) {
        saToast('Provide either Percent or Flat Discount.', 'error');
        return;
      }

      try {
        const res = await fetch(API_BASE + '/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(coupon)
        });
        if (!res.ok) throw new Error();
        saToast('Coupon created successfully!');
        couponForm.reset();
        loadCouponsSection();
      } catch (err) {
        saToast('Could not save coupon.', 'error');
      }
    });
  }

  window.saDeleteCoupon = async function (id) {
    if (!confirm('Delete this coupon?')) return;
    try {
      const res = await fetch(API_BASE + '/coupons/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      saToast('Coupon deleted.');
      loadCouponsSection();
    } catch {
      saToast('Failed to delete coupon.', 'error');
    }
  };

  /* ══════════════════════════════════════════════════════════════════
     ORDERS REGISTRY - ALL
  ══════════════════════════════════════════════════════════════════ */
  async function loadOrdersAllSection() {
    const tbody = document.getElementById('orderTableAll');
    if (!tbody) return;
    tbody.innerHTML = loadingRow(7);
    await fetchAllOrdersAndProducts();
    renderOrdersAllTable(_orders);
  }

  function renderOrdersAllTable(ordersList) {
    const tbody = document.getElementById('orderTableAll');
    if (!tbody) return;
    const countEl = document.getElementById('allOrdersCount');
    if (countEl) countEl.textContent = `(${ordersList.length})`;

    if (!ordersList.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px;">No orders found.</td></tr>';
      return;
    }

    tbody.innerHTML = ordersList.map(o => `
      <tr data-customer="${esc((o.customerName || o.email || '').toLowerCase())}" data-id="${o.orderId || o.id}">
        <td style="color:var(--primary-lt);font-weight:600;">#${o.orderId || o.id}</td>
        <td>
          <div style="font-weight:600;font-size:.82rem;">${esc(o.customerName || 'Guest')}</div>
          <div style="color:var(--muted);font-size:.72rem;">${esc(o.email || '')} ${esc(o.phone || '')}</div>
          <div style="color:var(--muted);font-size:.68rem;">${esc(o.shippingAddress || '')}, ${esc(o.city || '')}</div>
        </td>
        <td>₹${(o.totalAmount || o.total || 0).toLocaleString('en-IN')}</td>
        <td style="color:var(--muted);font-size:.78rem;">${esc(o.paymentMethod || 'COD')}</td>
        <td><span class="badge-order ${o.status}">${o.status}</span></td>
        <td style="color:var(--muted);font-size:.73rem;">${fmtDate(o.orderDate)}</td>
        <td>
          <select class="sa-input" style="padding:4px 8px;font-size:.75rem;max-width:130px;"
            onchange="updateOrderStatus(${o.orderId || o.id}, this.value, 'orders-all')">
            ${['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(s =>
              `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
      </tr>`).join('');
  }

  window.filterAllOrdersTable = function () {
    const q = (document.getElementById('orderSearchAll').value || '').toLowerCase();
    document.querySelectorAll('#orderTableAll tr[data-customer]').forEach(row => {
      const cust = row.dataset.customer || '';
      const id = String(row.dataset.id || '');
      row.style.display = (!q || cust.includes(q) || id.includes(q)) ? '' : 'none';
    });
  };

  /* ══════════════════════════════════════════════════════════════════
     ORDERS REGISTRY - PENDING
  ══════════════════════════════════════════════════════════════════ */
  async function loadOrdersPendingSection() {
    const tbody = document.getElementById('orderTablePending');
    if (!tbody) return;
    tbody.innerHTML = loadingRow(7);
    await fetchAllOrdersAndProducts();
    
    // Filter active/pending states: Pending, Confirmed, Shipped
    const pendingOrders = _orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed' || o.status === 'Shipped');
    renderOrdersPendingTable(pendingOrders);
  }

  function renderOrdersPendingTable(ordersList) {
    const tbody = document.getElementById('orderTablePending');
    if (!tbody) return;
    const countEl = document.getElementById('pendingOrdersCount');
    if (countEl) countEl.textContent = `(${ordersList.length})`;

    if (!ordersList.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px;">No pending orders in queue.</td></tr>';
      return;
    }

    tbody.innerHTML = ordersList.map(o => `
      <tr data-customer="${esc((o.customerName || o.email || '').toLowerCase())}" data-id="${o.orderId || o.id}">
        <td style="color:var(--primary-lt);font-weight:600;">#${o.orderId || o.id}</td>
        <td>
          <div style="font-weight:600;font-size:.82rem;">${esc(o.customerName || 'Guest')}</div>
          <div style="color:var(--muted);font-size:.72rem;">${esc(o.email || '')} ${esc(o.phone || '')}</div>
          <div style="color:var(--muted);font-size:.68rem;">${esc(o.shippingAddress || '')}, ${esc(o.city || '')}</div>
        </td>
        <td>₹${(o.totalAmount || o.total || 0).toLocaleString('en-IN')}</td>
        <td style="color:var(--muted);font-size:.78rem;">${esc(o.paymentMethod || 'COD')}</td>
        <td><span class="badge-order ${o.status}">${o.status}</span></td>
        <td style="color:var(--muted);font-size:.73rem;">${fmtDate(o.orderDate)}</td>
        <td>
          <select class="sa-input" style="padding:4px 8px;font-size:.75rem;max-width:130px;"
            onchange="updateOrderStatus(${o.orderId || o.id}, this.value, 'orders-pending')">
            ${['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(s =>
              `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
      </tr>`).join('');
  }

  window.filterPendingOrdersTable = function () {
    const q = (document.getElementById('orderSearchPending').value || '').toLowerCase();
    document.querySelectorAll('#orderTablePending tr[data-customer]').forEach(row => {
      const cust = row.dataset.customer || '';
      const id = String(row.dataset.id || '');
      row.style.display = (!q || cust.includes(q) || id.includes(q)) ? '' : 'none';
    });
  };

  /* ══════════════════════════════════════════════════════════════════
     ORDERS REGISTRY - DELIVERED
  ══════════════════════════════════════════════════════════════════ */
  async function loadOrdersDeliveredSection() {
    const tbody = document.getElementById('orderTableDelivered');
    if (!tbody) return;
    tbody.innerHTML = loadingRow(6);
    await fetchAllOrdersAndProducts();

    // Filter delivered status
    const deliveredOrders = _orders.filter(o => o.status === 'Delivered');
    renderOrdersDeliveredTable(deliveredOrders);
  }

  function renderOrdersDeliveredTable(ordersList) {
    const tbody = document.getElementById('orderTableDelivered');
    if (!tbody) return;
    const countEl = document.getElementById('deliveredOrdersCount');
    if (countEl) countEl.textContent = `(${ordersList.length})`;

    if (!ordersList.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px;">No delivered orders.</td></tr>';
      return;
    }

    tbody.innerHTML = ordersList.map(o => `
      <tr data-customer="${esc((o.customerName || o.email || '').toLowerCase())}" data-id="${o.orderId || o.id}">
        <td style="color:var(--primary-lt);font-weight:600;">#${o.orderId || o.id}</td>
        <td>
          <div style="font-weight:600;font-size:.82rem;">${esc(o.customerName || 'Guest')}</div>
          <div style="color:var(--muted);font-size:.72rem;">${esc(o.email || '')} ${esc(o.phone || '')}</div>
          <div style="color:var(--muted);font-size:.68rem;">${esc(o.shippingAddress || '')}, ${esc(o.city || '')}</div>
        </td>
        <td>₹${(o.totalAmount || o.total || 0).toLocaleString('en-IN')}</td>
        <td style="color:var(--muted);font-size:.78rem;">${esc(o.paymentMethod || 'COD')}</td>
        <td><span class="badge-order ${o.status}">${o.status}</span></td>
        <td style="color:var(--muted);font-size:.73rem;">${fmtDate(o.orderDate)}</td>
      </tr>`).join('');
  }

  window.filterDeliveredOrdersTable = function () {
    const q = (document.getElementById('orderSearchDelivered').value || '').toLowerCase();
    document.querySelectorAll('#orderTableDelivered tr[data-customer]').forEach(row => {
      const cust = row.dataset.customer || '';
      const id = String(row.dataset.id || '');
      row.style.display = (!q || cust.includes(q) || id.includes(q)) ? '' : 'none';
    });
  };

  /* ══════════════════════════════════════════════════════════════════
     UPDATE ORDER STATUS
  ══════════════════════════════════════════════════════════════════ */
  window.updateOrderStatus = async function (id, newStatus, currentView = 'orders-all') {
    try {
      await apiUpdateOrderStatus(id, newStatus);
      saToast(`Order #${id} updated to "${newStatus}".`);
      // Refresh active view
      if (currentView === 'orders-all') {
        loadOrdersAllSection();
      } else if (currentView === 'orders-pending') {
        loadOrdersPendingSection();
      } else {
        loadDashboard();
      }
    } catch (e) {
      saToast('Failed to update order status.', 'error');
    }
  };

  /* ══════════════════════════════════════════════════════════════════
     HELPERS & UTILS
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
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  }

  function loadingRow(cols) {
    return `<tr class="loading-row"><td colspan="${cols}"><span class="spinner"></span></td></tr>`;
  }

  /* ── Initializations ────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', async () => {
    // Determine active section immediately
    showSection('dashboard');
    
    // Check backend online status
    await checkBackendStatus();
    setInterval(checkBackendStatus, 15000); // Check status every 15s
  });

})();
