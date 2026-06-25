// ─── Orders — all data comes from backend DB, no localStorage ─────────────────

// Fetch orders for the logged-in user from backend
async function getOrders() {
  const user = getCurrentUser ? getCurrentUser() : null;
  if (!user) return [];
  try {
    // Admin/Super Admin gets all orders
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      const res = await fetch(`${window.API_BASE}/order/all`);
      if (!res.ok) return [];
      return await res.json();
    }
    // Regular user gets own orders
    const res = await fetch(`${window.API_BASE}/order/${user.id}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error('Failed to fetch orders:', e);
    return [];
  }
}

// Status badge
function statusBadge(status) {
  const map = {
    'Pending':   'warning',
    'Confirmed': 'info',
    'Shipped':   'primary',
    'Delivered': 'success',
    'Cancelled': 'danger'
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
      <small>Thank you for shopping with us!</small>
    </div>
  </div>`;
}

// Normalise a backend order object to a consistent shape
function normaliseOrder(o) {
  // items_json is stored as a JSON string in DB
  let items = [];
  if (Array.isArray(o.items)) {
    items = o.items;
  } else if (o.itemsJson) {
    try { items = JSON.parse(o.itemsJson); } catch(e) {}
  } else if (o.items_json) {
    try { items = JSON.parse(o.items_json); } catch(e) {}
  }

  return {
    id:              'ORD-' + (o.orderId || o.id),
    orderId:         o.orderId || o.id,
    customerName:    o.customerName || '',
    email:           o.email        || '',
    phone:           o.phone        || '',
    shippingAddress: o.shippingAddress || '',
    city:            o.city     || '',
    pincode:         o.pincode  || '',
    paymentMethod:   o.paymentMethod || '',
    status:          o.status   || 'Pending',
    total:           o.totalAmount || o.total || 0,
    totalAmount:     o.totalAmount || o.total || 0,
    subtotal:        o.subtotal    || o.totalAmount || 0,
    gst:             o.gst         || 0,
    shippingCost:    o.shippingCost || 0,
    placedAt:        o.orderDate   || o.placedAt || new Date().toISOString(),
    items:           items,
  };
}

// Build a single order card HTML
function buildOrderCard(raw) {
  const order = normaliseOrder(raw);
  const colorMap = { Pending:'warning', Confirmed:'info', Shipped:'primary', Delivered:'success', Cancelled:'danger' };

  const delivBanner = order.status === 'Delivered'
    ? `<div class="alert alert-success d-flex align-items-center mb-0">
        <span style="font-size:1.5rem;" class="mr-2">🎉</span>
        <div><strong>Your order has been delivered!</strong><br>
          <small>Thank you for shopping with us!</small></div></div>` : '';

  const cancelBanner = order.status === 'Cancelled'
    ? `<div class="alert alert-danger py-2 mb-2"><strong>❌ Order Cancelled</strong></div>` : '';

  const itemsHtml = order.items.length
    ? `<table class="table table-sm mb-3">
        <thead class="thead-light"><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>${item.productName || item.name || '—'}</td>
              <td>${item.quantity || 1}</td>
              <td>₹${(item.price || 0) * (item.quantity || 1)}</td>
            </tr>`).join('')}
        </tbody>
      </table>`
    : '<p class="text-muted small">No item details available.</p>';

  return `
    <div class="card mb-4 ${order.status === 'Delivered' ? 'border-success' : ''}">
      <div class="card-header d-flex justify-content-between align-items-center
                  ${order.status === 'Delivered' ? 'bg-success text-white' : ''}">
        <div>
          <strong>${order.id}</strong>
          <span class="ml-3 small ${order.status === 'Delivered' ? 'text-white-50' : 'text-muted'}">
            ${new Date(order.placedAt).toLocaleString()}
          </span>
        </div>
        <div>
          <span class="badge badge-${colorMap[order.status] || 'secondary'}">${order.status}</span>
          <strong class="ml-2 ${order.status === 'Delivered' ? 'text-white' : 'text-primary'}">
            ₹${order.totalAmount}
          </strong>
        </div>
      </div>
      ${delivBanner}
      ${cancelBanner}
      <div class="card-body">
        ${itemsHtml}
        <p class="mb-1"><strong>Name:</strong> ${order.customerName} &nbsp;|&nbsp; <strong>Phone:</strong> ${order.phone}</p>
        <p class="mb-0"><strong>Address:</strong> ${order.shippingAddress}, ${order.city} – ${order.pincode}</p>
        <p class="mb-0 mt-1 text-muted small"><strong>Payment:</strong> ${order.paymentMethod}</p>
      </div>
      <div class="card-footer d-flex justify-content-between align-items-center">
        <a href="shop.html" class="btn btn-outline-primary btn-sm">Shop Again</a>
        <button class="btn btn-outline-secondary btn-sm"
                onclick='downloadBill(${JSON.stringify(order).replace(/'/g, "&#39;")})'>🧾 Bill</button>
        ${order.status === 'Delivered'
          ? '<span class="text-success font-weight-bold">📦 Complete</span>'
          : order.status === 'Cancelled'
            ? '<span class="text-danger font-weight-bold">❌ Cancelled</span>'
            : `<button class="btn btn-outline-danger btn-sm"
                       onclick="cancelOrder(${order.orderId})">Cancel Order</button>`}
      </div>
    </div>`;
}

// Cancel an order via backend
async function cancelOrder(orderId) {
  if (!confirm('Cancel this order?')) return;
  try {
    const res = await fetch(`${window.API_BASE}/order/${orderId}/status?status=Cancelled`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error();
    location.reload();
  } catch (e) {
    alert('Could not cancel order. Please try again.');
  }
}

// Bill Download (used by buildOrderCard)
function downloadBill(order) {
  const subtotal   = order.subtotal   || order.totalAmount || 0;
  const gst        = order.gst        || 0;
  const shipping   = order.shippingCost || 0;
  const grandTotal = order.totalAmount  || order.total || 0;
  const date       = new Date(order.placedAt).toLocaleString('en-IN');

  const itemRows = (order.items || []).map(item => {
    const gstRate   = (item.price || 0) > 2500 ? '18%' : '5%';
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    return `<tr>
      <td>${item.productName || item.name || '—'}</td>
      <td>${item.size || '—'}</td>
      <td style="text-align:center;">${item.quantity || 1}</td>
      <td style="text-align:right;">₹${Number(item.price || 0).toFixed(2)}</td>
      <td style="text-align:center;">${gstRate}</td>
      <td style="text-align:right;">₹${itemTotal.toFixed(2)}</td>
    </tr>`;
  }).join('');

  const billHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Invoice – ${order.id}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:13px;color:#333;padding:30px}
  .hdr{display:flex;justify-content:space-between;border-bottom:3px solid #1a1a2e;padding-bottom:16px;margin-bottom:20px}
  .brand{font-size:22px;font-weight:bold;color:#1a1a2e}
  .brand small{display:block;font-size:12px;font-weight:normal;color:#666}
  .meta{text-align:right}.meta h2{font-size:20px;color:#1a1a2e}
  .sec{margin-bottom:18px}
  .sec-title{font-weight:bold;font-size:13px;background:#f0f0f0;padding:5px 8px;margin-bottom:8px;border-left:4px solid #e47911}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  table{width:100%;border-collapse:collapse}
  th{background:#1a1a2e;color:#fff;padding:8px;font-size:12px;text-align:left}
  td{padding:7px 8px;border-bottom:1px solid #eee}
  tr:nth-child(even) td{background:#fafafa}
  .tot{width:300px;margin-left:auto;margin-top:12px}
  .tot td{padding:5px 8px;border:none}
  .tot .grand td{font-weight:bold;font-size:15px;background:#1a1a2e;color:#fff}
  .badge{display:inline-block;background:#28a745;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px}
  .footer{margin-top:30px;border-top:1px solid #eee;padding-top:12px;text-align:center;color:#888;font-size:11px}
</style></head><body>
<div class="hdr">
  <div class="brand">🛍️ Karunada Collection<small>Your trusted clothing store</small></div>
  <div class="meta"><h2>TAX INVOICE</h2>
    <p><strong>${order.id}</strong></p>
    <p>Date: ${date}</p>
    <p><span class="badge">✅ ${order.status}</span></p>
  </div>
</div>
<div class="sec">
  <div class="sec-title">BILLING &amp; SHIPPING DETAILS</div>
  <div class="grid">
    <div>
      <p><strong>Customer:</strong> ${order.customerName}</p>
      <p><strong>Phone:</strong> ${order.phone}</p>
      <p><strong>Email:</strong> ${order.email || ''}</p>
    </div>
    <div>
      <p><strong>Address:</strong> ${order.shippingAddress}</p>
      <p><strong>${order.city}</strong> – ${order.pincode}</p>
      <p><strong>Payment:</strong> ${order.paymentMethod}</p>
    </div>
  </div>
</div>
<div class="sec">
  <div class="sec-title">ORDER ITEMS</div>
  <table>
    <thead><tr>
      <th>Product</th><th>Size</th>
      <th style="text-align:center">Qty</th>
      <th style="text-align:right">Unit Price</th>
      <th style="text-align:center">GST</th>
      <th style="text-align:right">Amount</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <table class="tot">
    <tr><td>Subtotal</td><td style="text-align:right">₹${Number(subtotal).toFixed(2)}</td></tr>
    <tr><td>GST</td><td style="text-align:right">₹${Number(gst).toFixed(2)}</td></tr>
    <tr><td>Shipping</td><td style="text-align:right">${shipping > 0 ? '₹' + Number(shipping).toFixed(2) : 'Free'}</td></tr>
    <tr class="grand"><td>GRAND TOTAL</td><td style="text-align:right">₹${Number(grandTotal).toFixed(2)}</td></tr>
  </table>
</div>
<div class="footer">
  <p>Thank you for shopping with Karunada Collection! | Computer-generated invoice.</p>
  <p>GST: 5% on items ≤ ₹2,500 | 18% on items above ₹2,500</p>
</div>
</body></html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(billHtml); win.document.close(); win.onload = () => win.print(); }
}
