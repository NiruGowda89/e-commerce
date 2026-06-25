// My Orders page — reads order history from localStorage filtered by logged-in user
const ORDERS_KEY = 'urbanManOrders';

function getCurrentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('urbanManUser') || 'null');
    return user ? (user.id || user.email) : null;
  } catch (e) { return null; }
}

function getOrders() {
  const all = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  try {
    const user = JSON.parse(localStorage.getItem('urbanManUser') || 'null');
    if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) return all;
    const uid = user ? (user.id || user.email) : null;
    if (!uid) return [];
    return all.filter(o => o.userId === uid);
  } catch (e) { return all; }
}

// Called from checkout.js after a successful order
function saveOrder(order) {
  const orders   = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  order.id       = 'ORD-' + Date.now();
  order.userId   = getCurrentUserId(); // tag with logged-in user
  order.status   = 'Confirmed';
  order.placedAt = order.placedAt || new Date().toISOString();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

// Status badge
function statusBadge(status) {
  const map = {
    'Pending':    'warning',
    'Confirmed':  'info',
    'Shipped':    'primary',
    'Delivered':  'success',
    'Cancelled':  'danger'
  };
  return `<span class="badge badge-${map[status] || 'secondary'} px-2 py-1">${status}</span>`;
}

// Delivery confirmation banner
function deliveryBanner(order) {
  if (order.status !== 'Delivered') return '';
  return `<div class="alert alert-success d-flex align-items-center mb-0">
    <span style="font-size:1.5rem;" class="mr-2">🎉</span>
    <div>
      <strong>Your order has been delivered!</strong><br>
      <small>Delivered on ${order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : 'recently'}. 
      Thank you for shopping with us!</small>
    </div>
  </div>`;
}

// Render order history
document.addEventListener('DOMContentLoaded', function () {
  const orders   = getOrders();
  const listEl   = document.getElementById('ordersList');
  const emptyEl  = document.getElementById('noOrders');

  if (!listEl) return;

  if (orders.length === 0) {
    listEl.style.display  = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  listEl.innerHTML = orders.map(order => `
    <div class="card mb-4 ${order.status === 'Delivered' ? 'border-success' : ''}">

      <!-- Header -->
      <div class="card-header d-flex justify-content-between align-items-center
                  ${order.status === 'Delivered' ? 'bg-success text-white' : ''}">
        <div>
          <strong>${order.id}</strong>
          <span class="ml-3 ${order.status === 'Delivered' ? 'text-white-50' : 'text-muted'} small">
            ${new Date(order.placedAt).toLocaleString()}
          </span>
        </div>
        <div>
          ${order.status === 'Delivered'
            ? '<span class="badge badge-light text-success px-2 py-1">✅ Delivered</span>'
            : statusBadge(order.status)}
          <strong class="ml-2 ${order.status === 'Delivered' ? 'text-white' : 'text-primary'}">
            ₹${order.total}
          </strong>
        </div>
      </div>

      <!-- Delivery confirmation banner -->
      ${deliveryBanner(order)}

      <div class="card-body">
        <!-- Items table -->
        <table class="table table-sm mb-3">
          <thead class="thead-light">
            <tr>
              <th>Product</th><th>Size</th><th>Color</th>
              <th>Qty</th><th>Price</th><th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>
                  <img src="${item.image}" alt="${item.name}"
                       style="width:40px;height:40px;object-fit:cover;border-radius:4px;" class="mr-2"
                       onerror="this.style.display='none'">
                  ${item.name}
                </td>
                <td>${item.size  || '—'}</td>
                <td>${item.color || '—'}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price}</td>
                <td>₹${item.price * item.quantity}</td>
              </tr>`).join('')}
          </tbody>
        </table>

        <!-- Delivery info -->
        <div class="row">
          <div class="col-md-6">
            <h6 class="font-weight-bold">Delivery Details</h6>
            <p class="mb-1"><strong>Name:</strong> ${order.customerName}</p>
            <p class="mb-1"><strong>Phone:</strong> ${order.phone}</p>
            <p class="mb-1"><strong>Email:</strong> ${order.email}</p>
            <p class="mb-1"><strong>Address:</strong> 
              ${order.shippingAddress}, ${order.city} - ${order.pincode}</p>
          </div>
          <div class="col-md-6 text-md-right">
            <h6 class="font-weight-bold">Payment</h6>
            <p class="mb-1">${order.paymentMethod}</p>
            <p class="mb-1"><strong>Total Paid: ₹${order.total}</strong></p>
          </div>
        </div>
      </div>

      <div class="card-footer d-flex justify-content-between align-items-center">
        <a href="shop.html" class="btn btn-outline-primary btn-sm">Shop Again</a>
        <button class="btn btn-outline-secondary btn-sm" onclick="downloadBill(${JSON.stringify(order).replace(/"/g, '&quot;')})">🧾 Download Bill</button>
        ${order.status === 'Delivered'
          ? '<span class="text-success font-weight-bold">📦 Order Complete</span>'
          : order.status === 'Cancelled'
            ? '<span class="text-danger font-weight-bold">❌ Cancelled</span>'
            : `<button class="btn btn-outline-danger btn-sm"
                       onclick="cancelOrder('${order.id}')">Cancel Order</button>`}
      </div>
    </div>`).join('');
});

// Cancel an order
function cancelOrder(orderId) {
  if (!confirm('Cancel this order?')) return;
  const orders = getOrders();
  const order  = orders.find(o => o.id === orderId);
  if (!order) return;

  if (order.status === 'Delivered') {
    alert('Delivered orders cannot be cancelled.');
    return;
  }
  if (order.status === 'Shipped') {
    alert('This order is already shipped and cannot be cancelled.');
    return;
  }

  order.status = 'Cancelled';
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  location.reload();
}

// ─── Order ID Search ──────────────────────────────────────────────────────────
function searchOrder() {
  const query  = (document.getElementById('orderSearchInput').value || '').trim().toLowerCase();
  const listEl = document.getElementById('ordersList');
  const emptyEl = document.getElementById('noOrders');
  if (!query) { location.reload(); return; }

  const orders  = getOrders();
  const matched = orders.filter(o =>
    o.id.toLowerCase().includes(query) ||
    (o.customerName || '').toLowerCase().includes(query)
  );

  if (matched.length === 0) {
    if (listEl)  listEl.innerHTML = `
      <div class="alert alert-warning">
        No order found matching "<strong>${query}</strong>".
        <a href="#" onclick="clearOrderSearch()" class="ml-2">Clear Search</a>
      </div>`;
    if (emptyEl) emptyEl.style.display = 'none';
  } else {
    if (emptyEl) emptyEl.style.display = 'none';
    // Re-render only matched orders by temporarily replacing getOrders
    const orig = localStorage.getItem(ORDERS_KEY);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(matched));
    // Trigger re-render by dispatching DOMContentLoaded manually won't work,
    // so inline render here:
    if (listEl) {
      listEl.innerHTML = matched.map(order => buildOrderCard(order)).join('');
    }
    localStorage.setItem(ORDERS_KEY, orig);
  }
}

function clearOrderSearch() {
  const input = document.getElementById('orderSearchInput');
  if (input) input.value = '';
  location.reload();
}

// Build a single order card (extracted for reuse)
function buildOrderCard(order) {
  const colorMap = { Pending:'warning', Confirmed:'info', Shipped:'primary', Delivered:'success', Cancelled:'danger' };

  const delivBanner = order.status === 'Delivered'
    ? `<div class="alert alert-success d-flex align-items-center mb-0">
        <span style="font-size:1.5rem;" class="mr-2">🎉</span>
        <div><strong>Your order has been delivered!</strong><br>
          <small>Thank you for shopping with us!</small></div></div>` : '';

  const cancelBanner = order.status === 'Cancelled'
    ? `<div class="alert alert-danger py-2 mb-2"><strong>❌ Order Cancelled</strong></div>` : '';

  return `
    <div class="card mb-4 ${order.status==='Delivered'?'border-success':''}">
      <div class="card-header d-flex justify-content-between align-items-center ${order.status==='Delivered'?'bg-success text-white':''}">
        <div>
          <strong>${order.id}</strong>
          <span class="ml-3 small ${order.status==='Delivered'?'text-white-50':'text-muted'}">${new Date(order.placedAt).toLocaleString()}</span>
        </div>
        <div>
          <span class="badge badge-${colorMap[order.status]||'secondary'}">${order.status}</span>
          <strong class="ml-2 ${order.status==='Delivered'?'text-white':'text-primary'}">₹${order.total}</strong>
        </div>
      </div>
      ${delivBanner}
      ${cancelBanner}
      <div class="card-body">
        <table class="table table-sm mb-3">
          <thead class="thead-light"><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
          <tbody>
            ${(order.items||[]).map(item=>`
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price*item.quantity}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <p class="mb-1"><strong>Name:</strong> ${order.customerName} | <strong>Phone:</strong> ${order.phone}</p>
        <p class="mb-0"><strong>Address:</strong> ${order.shippingAddress}, ${order.city} - ${order.pincode}</p>
      </div>
      <div class="card-footer d-flex justify-content-between">
        <a href="shop.html" class="btn btn-outline-primary btn-sm">Shop Again</a>
        ${order.status==='Delivered'?'<span class="text-success font-weight-bold">📦 Complete</span>'
          : order.status==='Cancelled'?'<span class="text-danger">❌ Cancelled</span>'
          : `<button class="btn btn-outline-danger btn-sm" onclick="cancelOrder('${order.id}')">Cancel</button>`}
      </div>
    </div>`;
}

// ─── Bill Download ────────────────────────────────────────────────────────────
function downloadBill(order) {
    const subtotal   = order.subtotal    || order.total;
    const gst        = order.gst         || 0;
    const shipping   = order.shippingCost || 0;
    const grandTotal = order.total;
    const date       = new Date(order.placedAt).toLocaleString('en-IN');

    const itemRows = (order.items || []).map(item => {
        const gstRate  = item.price > 2500 ? '18%' : '5%';
        const itemTotal = item.price * item.quantity;
        return `<tr>
          <td>${item.name}</td>
          <td>${item.size || '—'}</td>
          <td style="text-align:center;">${item.quantity}</td>
          <td style="text-align:right;">₹${Number(item.price).toFixed(2)}</td>
          <td style="text-align:center;">${gstRate}</td>
          <td style="text-align:right;">₹${itemTotal.toFixed(2)}</td>
        </tr>`;
    }).join('');

    const billHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Invoice - ${order.id}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; font-size:13px; color:#333; padding:30px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #1a1a2e; padding-bottom:16px; margin-bottom:20px; }
  .brand { font-size:24px; font-weight:bold; color:#1a1a2e; }
  .brand small { display:block; font-size:12px; font-weight:normal; color:#666; }
  .invoice-meta { text-align:right; }
  .invoice-meta h2 { font-size:20px; color:#1a1a2e; }
  .invoice-meta p { color:#555; font-size:12px; }
  .section { margin-bottom:18px; }
  .section-title { font-weight:bold; font-size:13px; background:#f0f0f0; padding:5px 8px; margin-bottom:8px; border-left:4px solid #1a1a2e; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .info-block p { margin-bottom:3px; }
  table { width:100%; border-collapse:collapse; }
  th { background:#1a1a2e; color:#fff; padding:8px; text-align:left; font-size:12px; }
  td { padding:7px 8px; border-bottom:1px solid #eee; }
  tr:nth-child(even) td { background:#fafafa; }
  .totals-table { width:320px; margin-left:auto; margin-top:12px; }
  .totals-table td { padding:5px 8px; border:none; }
  .totals-table .grand-total td { font-weight:bold; font-size:15px; background:#1a1a2e; color:#fff; }
  .badge-confirmed { display:inline-block; background:#28a745; color:white; padding:3px 10px; border-radius:12px; font-size:12px; }
  .otp-box { background:#e8f4f8; border:1px solid #bee5eb; border-radius:6px; padding:10px 16px; display:inline-block; margin-top:8px; }
  .otp-box strong { font-size:22px; letter-spacing:8px; color:#0c5460; }
  .footer { margin-top:30px; border-top:1px solid #eee; padding-top:12px; text-align:center; color:#888; font-size:11px; }
</style></head>
<body>
  <div class="header">
    <div class="brand">🛍️ Karunada Collection<small>Your trusted clothing store</small></div>
    <div class="invoice-meta">
      <h2>TAX INVOICE</h2>
      <p><strong>${order.id}</strong></p>
      <p>Date: ${date}</p>
      <p><span class="badge-confirmed">✅ ${order.status}</span></p>
    </div>
  </div>
  <div class="section">
    <div class="section-title">BILLING & SHIPPING DETAILS</div>
    <div class="info-grid">
      <div class="info-block">
        <p><strong>Customer:</strong> ${order.customerName}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Email:</strong> ${order.email}</p>
      </div>
      <div class="info-block">
        <p><strong>Address:</strong> ${order.shippingAddress}</p>
        <p><strong>City:</strong> ${order.city} - ${order.pincode}</p>
        <p><strong>Payment:</strong> ${order.paymentMethod}</p>
      </div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">ORDER ITEMS</div>
    <table>
      <thead><tr>
        <th>Product</th><th>Size</th><th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Unit Price</th><th style="text-align:center;">GST</th>
        <th style="text-align:right;">Amount</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
    <table class="totals-table">
      <tr><td>Subtotal</td><td style="text-align:right;">₹${Number(subtotal||0).toFixed(2)}</td></tr>
      <tr><td>GST</td><td style="text-align:right;">₹${Number(gst||0).toFixed(2)}</td></tr>
      <tr><td>Shipping</td><td style="text-align:right;">${shipping > 0 ? '₹' + Number(shipping).toFixed(2) : 'Free'}</td></tr>
      <tr class="grand-total"><td>GRAND TOTAL</td><td style="text-align:right;">₹${Number(grandTotal||0).toFixed(2)}</td></tr>
    </table>
  </div>
  <div class="footer">
    <p>Thank you for shopping with Karunada Collection! | Computer-generated invoice.</p>
    <p>GST: 5% on items ≤ ₹2,500 | 18% on items above ₹2,500</p>
  </div>
</body></html>`;

    const win = window.open('', '_blank');
    win.document.write(billHtml);
    win.document.close();
    win.onload = function () { win.print(); };
}
