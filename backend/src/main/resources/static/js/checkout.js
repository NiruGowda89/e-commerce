// ─── Coupon State ─────────────────────────────────────────────────────────────
let appliedDiscount = 0;

function applyCoupon() {
    const code = document.getElementById('couponInput').value.trim();
    const msgEl = document.getElementById('couponMsg');
    if (!code) { msgEl.innerHTML = '<span class="text-danger">Enter a coupon code</span>'; return; }

    const cart = getCart();
    const subtotal = getCartTotal();
    const gst = Math.round(calculateGST(cart));
    const pincode = document.getElementById('pincode') ? document.getElementById('pincode').value : '';
    const shipping = calculateShipping(cart, pincode);
    const orderAmount = subtotal + gst + shipping;

    fetch(API_BASE + '/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderAmount })
    })
    .then(r => r.json())
    .then(data => {
        if (data.valid) {
            appliedDiscount = data.discount;
            msgEl.innerHTML = `<span class="text-success">✅ Coupon applied! You save ₹${data.discount}</span>`;
            const discountRow = document.getElementById('discountRow');
            const discountEl = document.getElementById('checkoutDiscount');
            if (discountRow) discountRow.style.display = 'flex';
            if (discountEl) discountEl.textContent = '-₹' + data.discount;
            renderOrderSummary(pincode);
        } else {
            appliedDiscount = 0;
            msgEl.innerHTML = `<span class="text-danger">❌ ${data.error || 'Invalid coupon'}</span>`;
        }
    })
    .catch(() => {
        msgEl.innerHTML = '<span class="text-warning">⚠️ Could not validate coupon</span>';
    });
}
// 5% GST for items ≤ ₹2500, 18% GST for items > ₹2500 (per item price)
function calculateGST(cart) {
    return cart.reduce((total, item) => {
        const rate = item.price > 2500 ? 0.18 : 0.05;
        return total + (item.price * item.quantity * rate);
    }, 0);
}

// ─── Shipping Calculation ─────────────────────────────────────────────────────
// Local (same state, pincode prefix matches) = ₹40
// National = ₹80
// Weight estimate: ~300g per garment, ₹5 per 100g after first 500g free
const STORE_PINCODE_PREFIX = '56'; // Karnataka prefix — adjust to your store's state

function calculateShipping(cart, pincode) {
    if (!pincode || pincode.length < 2) return 80; // default national

    // Determine local vs national by first 2 digits of pincode
    const isLocal = pincode.startsWith(STORE_PINCODE_PREFIX);
    const baseRate = isLocal ? 40 : 80;

    // Weight: ~300g per item quantity
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    const weightGrams = totalItems * 300;

    // Free up to 500g, then ₹5 per 100g
    const extraWeight = Math.max(0, weightGrams - 500);
    const weightCharge = Math.ceil(extraWeight / 100) * 5;

    return baseRate + weightCharge;
}

// ─── Checkout page — sends order to backend, saves locally too ────────────────
document.addEventListener('DOMContentLoaded', function () {
    renderOrderSummary();

    // Recalculate totals when pincode changes
    document.getElementById('pincode').addEventListener('input', function () {
        renderOrderSummary(this.value);
    });

    document.getElementById('checkoutForm').addEventListener('submit', async function (e) {        e.preventDefault();

        const cart = getCart();
        if (cart.length === 0) {
            alert('Your cart is empty!');
            window.location.href = 'cart.html';
            return;
        }

        const pincode = document.getElementById('pincode').value.trim();
        const subtotal = getCartTotal();
        const gst = Math.round(calculateGST(cart));
        const shipping = calculateShipping(cart, pincode);
        const grandTotal = Math.max(0, subtotal + gst + shipping - appliedDiscount);

        const order = {
            customerName:    document.getElementById('fullName').value.trim(),
            email:           document.getElementById('email').value.trim(),
            phone:           document.getElementById('phone').value.trim(),
            shippingAddress: document.getElementById('address').value.trim(),
            city:            document.getElementById('city').value.trim(),
            pincode:         pincode,
            paymentMethod:   document.getElementById('paymentMethod').value,
            items:           cart,
            subtotal:        subtotal,
            gst:             gst,
            shippingCost:    shipping,
            total:           grandTotal,
            totalAmount:     grandTotal,
            status:          'Pending',
            placedAt:        new Date().toISOString()
        };

        const btn = document.getElementById('placeOrderBtn');
        btn.textContent = 'Placing order…';
        btn.disabled    = true;

        try {
            await apiPlaceOrder(order);
        } catch (err) {
            console.warn('Backend unreachable — saving order locally only');
        }

        onOrderSuccess(order);
    });
});

function renderOrderSummary(pincode) {
    const summaryEl  = document.getElementById('orderSummary');
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const gstEl      = document.getElementById('checkoutGST');
    const shippingEl = document.getElementById('checkoutShipping');
    const totalEl    = document.getElementById('checkoutTotal');
    const cart       = getCart();

    if (!summaryEl) return;

    if (cart.length === 0) {
        summaryEl.innerHTML = '<p class="text-warning">Your cart is empty.</p>';
        return;
    }

    summaryEl.innerHTML = cart.map(item => {
        const gstRate = item.price > 2500 ? '18%' : '5%';
        return `
        <div class="d-flex align-items-center mb-2">
            <img src="${item.image}" alt="${item.name}"
                 style="width:45px;height:45px;object-fit:cover;" class="mr-2 rounded"
                 onerror="this.src='https://via.placeholder.com/45?text=?'">
            <div>
                <strong>${item.name}</strong><br>
                <small>${item.size || ''} ${item.color ? '/ ' + item.color : ''}</small><br>
                <small>Qty: ${item.quantity} × ₹${item.price} = ₹${item.price * item.quantity}</small><br>
                <small class="text-muted">GST: ${gstRate}</small>
            </div>
        </div>`;
    }).join('');

    const currentPincode = pincode || (document.getElementById('pincode') ? document.getElementById('pincode').value : '');
    const subtotal  = getCartTotal();
    const gst       = Math.round(calculateGST(cart));
    const shipping  = calculateShipping(cart, currentPincode);
    const grandTotal = Math.max(0, subtotal + gst + shipping - appliedDiscount);

    if (subtotalEl) subtotalEl.textContent = '₹' + subtotal;
    if (gstEl)      gstEl.textContent      = '₹' + gst;
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Free' : '₹' + shipping;
    if (totalEl)    totalEl.textContent    = '₹' + grandTotal;
}

function onOrderSuccess(order) {
    saveOrder(order);
    clearCart();
    const saved = getOrders()[0];
    // Auto-download the bill
    downloadBill(saved);
    alert('✅ Order placed & auto-confirmed!\n\nYour Delivery OTP: ' + saved.otp + '\n\nYour bill has been downloaded.');
    window.location.href = 'orders.html';
}

function downloadBill(order) {
    const subtotal  = order.subtotal  || order.total;
    const gst       = order.gst       || 0;
    const shipping  = order.shippingCost || 0;
    const grandTotal = order.total;
    const date = new Date(order.placedAt).toLocaleString('en-IN');

    const itemRows = (order.items || []).map(item => {
        const gstRate = item.price > 2500 ? '18%' : '5%';
        const itemTotal = item.price * item.quantity;
        return `
        <tr>
          <td>${item.name}</td>
          <td>${item.size || '—'}</td>
          <td style="text-align:center;">${item.quantity}</td>
          <td style="text-align:right;">₹${item.price.toFixed(2)}</td>
          <td style="text-align:center;">${gstRate}</td>
          <td style="text-align:right;">₹${itemTotal.toFixed(2)}</td>
        </tr>`;
    }).join('');

    const billHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${order.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #333; padding: 30px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 20px; }
    .brand { font-size: 24px; font-weight: bold; color: #1a1a2e; }
    .brand small { display: block; font-size: 12px; font-weight: normal; color: #666; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 20px; color: #1a1a2e; }
    .invoice-meta p { color: #555; font-size: 12px; }
    .section { margin-bottom: 18px; }
    .section-title { font-weight: bold; font-size: 13px; background: #f0f0f0; padding: 5px 8px; margin-bottom: 8px; border-left: 4px solid #1a1a2e; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-block p { margin-bottom: 3px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1a1a2e; color: #fff; padding: 8px; text-align: left; font-size: 12px; }
    td { padding: 7px 8px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) td { background: #fafafa; }
    .totals-table { width: 320px; margin-left: auto; margin-top: 12px; }
    .totals-table td { padding: 5px 8px; border: none; }
    .totals-table .grand-total td { font-weight: bold; font-size: 15px; background: #1a1a2e; color: #fff; }
    .badge-confirmed { display: inline-block; background: #28a745; color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px; }
    .otp-box { background: #e8f4f8; border: 1px solid #bee5eb; border-radius: 6px; padding: 10px 16px; display: inline-block; margin-top: 8px; }
    .otp-box strong { font-size: 22px; letter-spacing: 8px; color: #0c5460; }
    .footer { margin-top: 30px; border-top: 1px solid #eee; padding-top: 12px; text-align: center; color: #888; font-size: 11px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      🛍️ Karunada Collection
      <small>Your trusted clothing store</small>
    </div>
    <div class="invoice-meta">
      <h2>TAX INVOICE</h2>
      <p><strong>${order.id}</strong></p>
      <p>Date: ${date}</p>
      <p><span class="badge-confirmed">✅ Confirmed</span></p>
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
      <thead>
        <tr>
          <th>Product</th><th>Size</th><th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Unit Price</th><th style="text-align:center;">GST</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <table class="totals-table">
      <tr><td>Subtotal</td><td style="text-align:right;">₹${(subtotal||0).toFixed(2)}</td></tr>
      <tr><td>GST</td><td style="text-align:right;">₹${(gst||0).toFixed(2)}</td></tr>
      <tr><td>Shipping</td><td style="text-align:right;">${shipping > 0 ? '₹' + shipping.toFixed(2) : 'Free'}</td></tr>
      <tr class="grand-total"><td>GRAND TOTAL</td><td style="text-align:right;">₹${(grandTotal||0).toFixed(2)}</td></tr>
    </table>
  </div>

  ${order.otp ? `
  <div class="section">
    <div class="section-title">DELIVERY OTP</div>
    <div class="otp-box">
      Share with delivery person: <strong>${order.otp}</strong>
    </div>
  </div>` : ''}

  <div class="footer">
    <p>Thank you for shopping with Karunada Collection! | This is a computer-generated invoice.</p>
    <p>GST: 5% on items ≤ ₹2,500 | 18% on items above ₹2,500</p>
  </div>
</body>
</html>`;

    // Open in new tab and trigger print/save as PDF
    const win = window.open('', '_blank');
    win.document.write(billHtml);
    win.document.close();
    win.onload = function () {
        win.print();
    };
}

function toggleUpiQr(value) {
    const qrSection       = document.getElementById('upiQrSection');
    const razorpaySection = document.getElementById('razorpaySection');
    if (qrSection)       qrSection.style.display       = (value === 'UPI')       ? 'block' : 'none';
    if (razorpaySection) razorpaySection.style.display  = (value === 'Razorpay') ? 'block' : 'none';
}

async function payWithRazorpay() {
    const cart    = getCart();
    const pincode = document.getElementById('pincode').value.trim();
    const subtotal = getCartTotal();
    const gst      = Math.round(calculateGST(cart));
    const shipping = calculateShipping(cart, pincode);
    const total    = Math.max(0, subtotal + gst + shipping - appliedDiscount);

    const name  = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (!name || !email || !phone) {
        alert('Please fill in your name, email and phone before paying.');
        return;
    }

    try {
        const res  = await fetch(API_BASE + '/payment/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: total })
        });
        const data = await res.json();

        if (data.error) {
            alert('Payment gateway not configured. Please use UPI or Cash on Delivery.');
            return;
        }

        const options = {
            key:         data.keyId,
            amount:      data.amount,
            currency:    data.currency,
            name:        'Karunada Collection',
            description: 'Order Payment',
            order_id:    data.orderId,
            prefill:     { name, email, contact: phone },
            theme:       { color: '#1a1a2e' },
            handler: function(response) {
                // Payment successful — verify and place order
                document.getElementById('checkoutForm').dispatchEvent(new Event('submit'));
            }
        };
        const rzp = new Razorpay(options);
        rzp.open();
    } catch (e) {
        alert('Could not connect to payment gateway. Please use UPI or Cash on Delivery.');
    }
}
