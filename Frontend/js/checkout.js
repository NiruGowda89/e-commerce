// ─── Checkout JS ──────────────────────────────────────────────────────────────
if (typeof API_URL === 'undefined') window.API_URL = 'https://e-commerce-1-ariz.onrender.com/api';
// Use window.API_BASE set by api.js — avoid re-declaring const to prevent crash
if (typeof window.API_BASE === 'undefined') window.API_BASE = window.API_URL;

let appliedDiscount   = 0;
let selectedPayMethod = '';
let selectedUpiApp    = '';
let selectedAddrIdx   = -1;   // index of the chosen saved address (-1 = new form)

const ADDR_KEY = 'karunadaAddresses';

function getSavedAddresses() {
    try { return JSON.parse(localStorage.getItem(ADDR_KEY) || '[]'); }
    catch(e) { return []; }
}
function persistAddresses(arr) { localStorage.setItem(ADDR_KEY, JSON.stringify(arr)); }

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    renderOrderSummary();
    initAddressSection();

    // Recalculate shipping when pincode changes
    const pin = document.getElementById('pincode');
    if (pin) pin.addEventListener('input', function () { renderOrderSummary(this.value); });
});

// ─── Address section init ─────────────────────────────────────────────────────
function initAddressSection() {
    const addrs = getSavedAddresses();
    const savedSection = document.getElementById('savedAddrSection');
    const newForm      = document.getElementById('newAddressForm');

    if (addrs.length > 0) {
        // Show saved picker, hide blank form by default
        if (savedSection) savedSection.style.display = 'block';
        if (newForm)      newForm.style.display       = 'none';
        renderSavedAddrPicker(addrs);
        selectSavedAddr(0); // auto-select first address
    } else {
        // No saved addresses — show blank form, pre-fill from user
        if (savedSection) savedSection.style.display = 'none';
        if (newForm)      newForm.style.display       = 'block';
        prefillFromUser();
    }
}

function renderSavedAddrPicker(addrs) {
    const list = document.getElementById('savedAddrList');
    if (!list) return;
    list.innerHTML = addrs.map((a, i) => `
        <div class="co-addr-tile ${i === 0 ? 'selected' : ''}" id="addr-tile-${i}"
             onclick="selectSavedAddr(${i})">
            <div class="co-addr-tile__radio">
                <span class="co-addr-tile__dot"></span>
            </div>
            <div class="co-addr-tile__body">
                <div class="co-addr-tile__name">${a.name}${a.phone ? ' · ' + a.phone : ''}</div>
                <div class="co-addr-tile__line">
                    ${a.line}${a.area ? ', ' + a.area : ''}${a.landmark ? ', ' + a.landmark : ''},
                    ${a.city}${a.state ? ', ' + a.state : ''} – ${a.pincode}
                </div>
            </div>
        </div>`).join('');
}

function selectSavedAddr(idx) {
    selectedAddrIdx = idx;
    // Highlight tile
    document.querySelectorAll('.co-addr-tile').forEach((t, i) => {
        t.classList.toggle('selected', i === idx);
    });
    // Fill hidden form fields so proceedToPayment validation passes
    const addrs = getSavedAddresses();
    const a = addrs[idx];
    if (!a) return;
    setVal('fullName', a.name     || '');
    setVal('phone',    a.phone    || '');
    setVal('altPhone', a.altPhone || '');
    setVal('email',    a.email    || '');
    setVal('flatHouse',a.line     || '');
    setVal('area',     a.area     || '');
    setVal('landmark', a.landmark || '');
    setVal('pincode',  a.pincode  || '');
    setVal('city',     a.city     || '');
    const stateEl = document.getElementById('state');
    if (stateEl && a.state) stateEl.value = a.state;
    renderOrderSummary(a.pincode || '');
}

function showNewAddressForm() {
    selectedAddrIdx = -1;
    const newForm = document.getElementById('newAddressForm');
    if (newForm) newForm.style.display = 'block';
    // Clear fields for fresh entry
    ['fullName','phone','altPhone','email','flatHouse','area','landmark','pincode','city'].forEach(clearField);
    const stateEl = document.getElementById('state');
    if (stateEl) stateEl.value = '';
    prefillFromUser();
    // Scroll to new form
    if (newForm) newForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Deselect all tiles
    document.querySelectorAll('.co-addr-tile').forEach(t => t.classList.remove('selected'));
}

function prefillFromUser() {
    if (typeof getCurrentUser !== 'function') return;
    const user = getCurrentUser();
    if (!user) return;
    if (user.name  && !document.getElementById('fullName')?.value) setVal('fullName', user.name);
    if (user.email && !document.getElementById('email')?.value)    setVal('email',    user.email);
    if (user.phone && !document.getElementById('phone')?.value)    setVal('phone',    user.phone);
}

// Save current form values as a new address
function saveCurrentAddressToStore() {
    const a = {
        name:     document.getElementById('fullName')?.value.trim()  || '',
        phone:    document.getElementById('phone')?.value.trim()     || '',
        altPhone: document.getElementById('altPhone')?.value.trim()  || '',
        email:    document.getElementById('email')?.value.trim()     || '',
        line:     document.getElementById('flatHouse')?.value.trim() || '',
        area:     document.getElementById('area')?.value.trim()      || '',
        landmark: document.getElementById('landmark')?.value.trim()  || '',
        pincode:  document.getElementById('pincode')?.value.trim()   || '',
        city:     document.getElementById('city')?.value.trim()      || '',
        state:    document.getElementById('state')?.value            || '',
        country:  document.getElementById('country')?.value          || 'India',
    };
    const addrs = getSavedAddresses();
    // Avoid duplicate (same name + pincode)
    const isDupe = addrs.some(x => x.name === a.name && x.pincode === a.pincode && x.line === a.line);
    if (!isDupe) {
        addrs.unshift(a); // add at top
        persistAddresses(addrs);
    }
}

// ─── STEP 1 → STEP 2: validate address then unlock payment ───────────────────
function proceedToPayment() {
    const fields = [
        { id: 'fullName',  label: 'Full Name' },
        { id: 'phone',     label: 'Mobile Number' },
        { id: 'email',     label: 'Email Address' },
        { id: 'flatHouse', label: 'Flat / House No.' },
        { id: 'area',      label: 'Area / Street' },
        { id: 'pincode',   label: 'Pincode' },
        { id: 'city',      label: 'City' },
        { id: 'state',     label: 'State' },
    ];

    for (const f of fields) {
        const el = document.getElementById(f.id);
        if (!el || !el.value.trim()) {
            el && el.focus();
            showToast('Please fill in: ' + f.label, 'warning');
            return;
        }
    }

    // Validate phone
    const phone = document.getElementById('phone').value.trim();
    if (!/^\d{10}$/.test(phone)) {
        showToast('Enter a valid 10-digit mobile number', 'warning');
        document.getElementById('phone').focus();
        return;
    }

    // Validate alt phone (optional — only validate if filled)
    const altPhone = document.getElementById('altPhone')?.value.trim() || '';
    if (altPhone && !/^\d{10}$/.test(altPhone)) {
        showToast('Alternative number must be 10 digits', 'warning');
        document.getElementById('altPhone').focus();
        return;
    }

    // Validate email
    const email = document.getElementById('email').value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        showToast('Enter a valid email address', 'warning');
        document.getElementById('email').focus();
        return;
    }

    // Validate pincode
    const pin = document.getElementById('pincode').value.trim();
    if (!/^\d{6}$/.test(pin)) {
        showToast('Enter a valid 6-digit pincode', 'warning');
        document.getElementById('pincode').focus();
        return;
    }

    unlockPayment();
    // Save new address to store (only when user typed a new one, not selecting saved)
    if (selectedAddrIdx === -1) {
        saveCurrentAddressToStore();
    }
    // Smooth scroll to payment step
    const payStep = document.getElementById('stepPayment');
    if (payStep) payStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function unlockPayment() {
    const step = document.getElementById('stepPayment');
    const body = document.getElementById('paymentBody');
    const lock = document.getElementById('payLockIcon');
    if (step) step.classList.remove('co-card--locked');
    if (body) body.style.display = 'block';
    if (lock) lock.textContent = '✅';
    // Re-render totals with current pincode
    renderOrderSummary(document.getElementById('pincode')?.value || '');
}

// ─── Payment method tile selection ───────────────────────────────────────────
function onPayMethodChange(method) {
    selectedPayMethod = method;
    selectedUpiApp    = '';

    // Reset all section visibility
    ['upiSection', 'cardSection', 'codSection'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Clear UPI app selection
    document.querySelectorAll('.co-upi-app').forEach(b => b.classList.remove('active'));
    const qr = document.getElementById('upiQrFallback');
    if (qr) qr.style.display = 'none';

    // Highlight selected tile
    document.querySelectorAll('.co-pay-tile').forEach(t => t.classList.remove('active'));
    const tileId = { UPI: 'tile-upi', Card: 'tile-card', 'Cash on Delivery': 'tile-cod' }[method];
    if (tileId) {
        const tile = document.getElementById(tileId);
        if (tile) tile.classList.add('active');
    }

    if (method === 'UPI')              document.getElementById('upiSection').style.display  = 'block';
    if (method === 'Card')             document.getElementById('cardSection').style.display  = 'block';
    if (method === 'Cash on Delivery') document.getElementById('codSection').style.display   = 'block';

    const btn = document.getElementById('placeOrderBtn');
    if (method === 'Cash on Delivery') {
        // COD — enable immediately
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer'; }
    } else {
        // UPI/Card — keep disabled until payment confirmed
        if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; btn.style.cursor = 'not-allowed'; }
    }
}

// ─── UPI App Deep Links ───────────────────────────────────────────────────────
// Merchant UPI VPA — change this to your actual UPI ID
const MERCHANT_UPI = '7899648380@ybl';    // PhonePe VPA format
const MERCHANT_NAME = 'Karunada Collection';

function getGrandTotal() {
    const cart     = getCart();
    const pin      = document.getElementById('pincode')?.value.trim() || '';
    const subtotal = getCartTotal();
    const gst      = Math.round(calculateGST(cart));
    const shipping = calculateShipping(cart, pin);
    return Math.max(0, subtotal + gst + shipping - appliedDiscount);
}

function payWithUpiApp(app) {
    selectedUpiApp = app;

    // Highlight selected app button
    document.querySelectorAll('.co-upi-app').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('upi-' + app);
    if (btn) btn.classList.add('active');

    const amount    = getGrandTotal();
    const txnNote   = encodeURIComponent('Karunada Collection Order');
    const vpa       = encodeURIComponent(MERCHANT_UPI);
    const name      = encodeURIComponent(MERCHANT_NAME);
    const amtStr    = amount.toFixed(2);

    // Standard UPI intent URL
    const upiUrl = `upi://pay?pa=${vpa}&pn=${name}&am=${amtStr}&cu=INR&tn=${txnNote}`;
    const schemes = {
        phonepe: `phonepe://pay?pa=${vpa}&pn=${name}&am=${amtStr}&cu=INR&tn=${txnNote}`,
        gpay:    `tez://upi/pay?pa=${vpa}&pn=${name}&am=${amtStr}&cu=INR&tn=${txnNote}`,
        paytm:   `paytmmp://pay?pa=${vpa}&pn=${name}&am=${amtStr}&cu=INR&tn=${txnNote}`,
        other:   upiUrl,
    };
    const deepLink = schemes[app] || upiUrl;

    // Show "I've paid" confirm section
    const qrFallback = document.getElementById('upiQrFallback');
    const qrNote     = document.getElementById('upiQrNote');
    const appLabels  = { phonepe: 'PhonePe', gpay: 'Google Pay', paytm: 'Paytm', other: 'UPI App' };
    if (qrNote) qrNote.innerHTML =
        `<span style="font-size:.85rem;color:#555;">Paying ₹${amtStr} via ${appLabels[app]}…</span>
         <br><button class="co-place-btn" style="margin-top:10px;background:#22c55e;opacity:1;cursor:pointer;"
            onclick="onUpiPaymentDone()">✅ I've completed the payment — Place Order</button>`;
    if (qrFallback) qrFallback.style.display = 'block';

    // Try to open app
    window.location.href = deepLink;
}

// Called when user confirms UPI payment is done
function onUpiPaymentDone() {
    const btn = document.getElementById('placeOrderBtn');
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer'; }
    placeOrder();
}

// ─── Place Order ──────────────────────────────────────────────────────────────
function placeOrder() {
    const cart = getCart();
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'warning');
        setTimeout(() => window.location.href = 'cart.html', 1500);
        return;
    }

    if (!selectedPayMethod) {
        showToast('Please select a payment method', 'warning');
        return;
    }

    if (selectedPayMethod === 'UPI' && !selectedUpiApp) {
        showToast('Please select a UPI app to pay', 'warning');
        return;
    }

    // Build address string
    const flat     = document.getElementById('flatHouse')?.value.trim() || '';
    const area     = document.getElementById('area')?.value.trim()      || '';
    const landmark = document.getElementById('landmark')?.value.trim()  || '';
    const address  = [flat, area, landmark].filter(Boolean).join(', ');

    const pincode  = document.getElementById('pincode')?.value.trim()   || '';
    const subtotal = getCartTotal();
    const gst      = Math.round(calculateGST(cart));
    const shipping = calculateShipping(cart, pincode);
    const grandTotal = Math.max(0, subtotal + gst + shipping - appliedDiscount);

    const payLabel = selectedPayMethod === 'UPI'
        ? `UPI – ${{ phonepe:'PhonePe', gpay:'Google Pay', paytm:'Paytm', other:'Other App' }[selectedUpiApp] || selectedUpiApp}`
        : selectedPayMethod;

    const currentUser = getCurrentUser ? getCurrentUser() : null;

    const order = {
        customerName:    document.getElementById('fullName')?.value.trim()  || '',
        email:           document.getElementById('email')?.value.trim()      || '',
        phone:           document.getElementById('phone')?.value.trim()      || '',
        altPhone:        document.getElementById('altPhone')?.value.trim()   || '',
        shippingAddress: address,
        landmark:        landmark,
        city:            document.getElementById('city')?.value.trim()       || '',
        state:           document.getElementById('state')?.value             || '',
        pincode:         pincode,
        country:         document.getElementById('country')?.value           || 'India',
        paymentMethod:   payLabel,
        items:           cart,
        subtotal:        subtotal,
        gst:             gst,
        shippingCost:    shipping,
        total:           grandTotal,
        totalAmount:     grandTotal,
        status:          'Confirmed',
        placedAt:        new Date().toISOString(),
        userId:          currentUser ? (currentUser.id || currentUser.email) : null,
        user:            currentUser && currentUser.id ? { userId: currentUser.id } : null,
    };

    const btn = document.getElementById('placeOrderBtn');
    if (btn) { btn.textContent = 'Placing order…'; btn.disabled = true; }

    apiPlaceOrder(order)
        .catch(() => console.warn('Backend unreachable — saving locally only'))
        .finally(() => onOrderSuccess(order));
}

// ─── Order success ────────────────────────────────────────────────────────────
function onOrderSuccess(order) {
    saveOrder(order);
    clearCart();
    const saved = getOrders()[0];
    downloadBill(saved);
    // Redirect to the order confirmation screen in account
    window.location.href = 'account.html#order-confirm';
}

// ─── Coupon ───────────────────────────────────────────────────────────────────
function applyCoupon() {
    const code  = document.getElementById('couponInput')?.value.trim();
    const msgEl = document.getElementById('couponMsg');
    if (!code) { msgEl.innerHTML = '<span class="text-danger">Enter a coupon code</span>'; return; }

    const cart     = getCart();
    const subtotal = getCartTotal();
    const gst      = Math.round(calculateGST(cart));
    const pincode  = document.getElementById('pincode')?.value || '';
    const shipping = calculateShipping(cart, pincode);

    fetch(window.API_BASE + '/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderAmount: subtotal + gst + shipping }),
    })
    .then(r => r.json())
    .then(data => {
        if (data.valid) {
            appliedDiscount = data.discount;
            msgEl.innerHTML = `<span class="text-success">✅ Coupon applied! You save ₹${data.discount}</span>`;
            const dr = document.getElementById('discountRow');
            const dc = document.getElementById('checkoutDiscount');
            if (dr) dr.style.display = 'flex';
            if (dc) dc.textContent = '-₹' + data.discount;
            renderOrderSummary(pincode);
        } else {
            appliedDiscount = 0;
            msgEl.innerHTML = `<span class="text-danger">❌ ${data.error || 'Invalid coupon'}</span>`;
        }
    })
    .catch(() => { msgEl.innerHTML = '<span class="text-warning">⚠️ Could not validate coupon</span>'; });
}

// ─── GST & Shipping ───────────────────────────────────────────────────────────
function calculateGST(cart) {
    return cart.reduce((t, item) => {
        const price = Number(item.price);
        const rate  = price > 2500 ? 0.18 : 0.05;
        return t + price * item.quantity * rate;
    }, 0);
}

const STORE_PINCODE_PREFIX = '56';
function calculateShipping(cart, pincode) {
    if (!pincode || pincode.length < 2) return 80;
    const isLocal     = pincode.startsWith(STORE_PINCODE_PREFIX);
    const base        = isLocal ? 40 : 80;
    const items       = cart.reduce((s, i) => s + i.quantity, 0);
    const extraWeight = Math.max(0, items * 300 - 500);
    return base + Math.ceil(extraWeight / 100) * 5;
}

// ─── Order Summary Renderer ───────────────────────────────────────────────────
function renderOrderSummary(pincode) {
    const summaryEl  = document.getElementById('orderSummary');
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const gstEl      = document.getElementById('checkoutGST');
    const shippingEl = document.getElementById('checkoutShipping');
    const totalEl    = document.getElementById('checkoutTotal');
    const cart       = getCart();

    if (!summaryEl) return;

    if (cart.length === 0) {
        summaryEl.innerHTML = '<p class="text-warning small">Your cart is empty.</p>';
        return;
    }

    summaryEl.innerHTML = cart.map(item => `
        <div class="co-summary-item">
            <img src="${item.image}" alt="${item.name}"
                 onerror="this.src='https://via.placeholder.com/44?text=?'">
            <div class="co-summary-item__info">
                <div class="co-summary-item__name">${item.name}</div>
                <div class="co-summary-item__meta">
                    ${item.size ? item.size : ''}${item.color ? ' · ' + item.color : ''}
                    · Qty ${item.quantity}
                </div>
                <div class="co-summary-item__price">₹${Number(item.price) * item.quantity}</div>
            </div>
        </div>`).join('');

    const pin      = pincode !== undefined ? pincode : (document.getElementById('pincode')?.value || '');
    const subtotal = getCartTotal();
    const gst      = Math.round(calculateGST(cart));
    const shipping = calculateShipping(cart, pin);
    const total    = Math.max(0, subtotal + gst + shipping - appliedDiscount);

    if (subtotalEl) subtotalEl.textContent = '₹' + subtotal;
    if (gstEl)      gstEl.textContent      = '₹' + gst;
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Free' : '₹' + shipping;
    if (totalEl)    totalEl.textContent    = '₹' + total;
}

// ─── Razorpay ─────────────────────────────────────────────────────────────────
async function payWithRazorpay() {
    const name  = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    if (!name || !email || !phone) {
        showToast('Please complete the address form first', 'warning'); return;
    }
    const total = getGrandTotal();
    try {
        const res  = await fetch(window.API_BASE + '/payment/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: total }),
        });
        const data = await res.json();
        if (data.error) { showToast('Payment gateway not configured. Use UPI or COD.', 'warning'); return; }
        new Razorpay({
            key: data.keyId, amount: data.amount, currency: data.currency,
            name: 'Karunada Collection', description: 'Order Payment',
            order_id: data.orderId,
            prefill: { name, email, contact: phone },
            theme: { color: '#302b63' },
            handler: function () {
                selectedPayMethod = 'Card (Razorpay)';
                // Enable button then auto-place
                const btn = document.getElementById('placeOrderBtn');
                if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
                placeOrder();
            }
        }).open();
    } catch (e) {
        showToast('Could not connect to Razorpay. Try UPI or COD.', 'warning');
    }
}

// ─── Toast notification ───────────────────────────────────────────────────────
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function clearField(id)  { const el = document.getElementById(id); if (el) { el.value = ''; el.focus(); } }
function openMapPicker() { window.open('https://www.google.com/maps', '_blank'); }

function showToast(msg, type) {
    let t = document.getElementById('coToast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'coToast';
        t.className = 'co-toast';
        document.body.appendChild(t);
    }
    t.textContent  = msg;
    t.className    = 'co-toast co-toast--' + (type || 'info') + ' show';
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── Bill Download ────────────────────────────────────────────────────────────
function downloadBill(order) {
    const subtotal   = order.subtotal    || order.total;
    const gst        = order.gst         || 0;
    const shipping   = order.shippingCost || 0;
    const grandTotal = order.total;
    const date       = new Date(order.placedAt).toLocaleString('en-IN');

    const itemRows = (order.items || []).map(item => {
        const gstRate   = item.price > 2500 ? '18%' : '5%';
        const itemTotal = item.price * item.quantity;
        return `<tr>
          <td>${item.name}</td><td>${item.size||'—'}</td>
          <td style="text-align:center;">${item.quantity}</td>
          <td style="text-align:right;">₹${Number(item.price).toFixed(2)}</td>
          <td style="text-align:center;">${gstRate}</td>
          <td style="text-align:right;">₹${itemTotal.toFixed(2)}</td>
        </tr>`;
    }).join('');

    const billHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Invoice - ${order.id}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:13px;color:#333;padding:30px}
  .hdr{display:flex;justify-content:space-between;border-bottom:3px solid #1a1a2e;padding-bottom:16px;margin-bottom:20px}
  .brand{font-size:22px;font-weight:bold;color:#1a1a2e}
  .brand small{display:block;font-size:12px;font-weight:normal;color:#666}
  .meta{text-align:right}
  .meta h2{font-size:20px;color:#1a1a2e}
  .meta p{color:#555;font-size:12px}
  .sec{margin-bottom:18px}
  .sec-title{font-weight:bold;font-size:13px;background:#f0f0f0;padding:5px 8px;margin-bottom:8px;border-left:4px solid #e47911}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  table{width:100%;border-collapse:collapse}
  th{background:#1a1a2e;color:#fff;padding:8px;text-align:left;font-size:12px}
  td{padding:7px 8px;border-bottom:1px solid #eee}
  tr:nth-child(even) td{background:#fafafa}
  .tot{width:300px;margin-left:auto;margin-top:12px}
  .tot td{padding:5px 8px;border:none}
  .tot .grand td{font-weight:bold;font-size:15px;background:#1a1a2e;color:#fff}
  .badge{display:inline-block;background:#28a745;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px}
  .otp{background:#e8f4f8;border:1px solid #bee5eb;border-radius:6px;padding:10px 16px;display:inline-block;margin-top:8px}
  .otp strong{font-size:22px;letter-spacing:8px;color:#0c5460}
  .footer{margin-top:30px;border-top:1px solid #eee;padding-top:12px;text-align:center;color:#888;font-size:11px}
  @media print{body{padding:0}}
</style></head><body>
<div class="hdr">
  <div class="brand">🛍️ Karunada Collection<small>Your trusted clothing store</small></div>
  <div class="meta"><h2>TAX INVOICE</h2><p><strong>${order.id}</strong></p><p>Date: ${date}</p>
  <p><span class="badge">✅ ${order.status}</span></p></div>
</div>
<div class="sec">
  <div class="sec-title">BILLING & SHIPPING DETAILS</div>
  <div class="grid">
    <div><p><strong>Customer:</strong> ${order.customerName}</p><p><strong>Phone:</strong> ${order.phone}</p>${order.altPhone ? `<p><strong>Alt Phone:</strong> ${order.altPhone}</p>` : ''}<p><strong>Email:</strong> ${order.email}</p></div>
    <div><p><strong>Address:</strong> ${order.shippingAddress}</p><p><strong>${order.city}${order.state ? ', ' + order.state : ''}</strong> – ${order.pincode}</p><p><strong>Payment:</strong> ${order.paymentMethod}</p></div>
  </div>
</div>
<div class="sec">
  <div class="sec-title">ORDER ITEMS</div>
  <table><thead><tr><th>Product</th><th>Size</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:center">GST</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>${itemRows}</tbody></table>
  <table class="tot">
    <tr><td>Subtotal</td><td style="text-align:right">₹${Number(subtotal||0).toFixed(2)}</td></tr>
    <tr><td>GST</td><td style="text-align:right">₹${Number(gst||0).toFixed(2)}</td></tr>
    <tr><td>Shipping</td><td style="text-align:right">${shipping > 0 ? '₹' + Number(shipping).toFixed(2) : 'Free'}</td></tr>
    <tr class="grand"><td>GRAND TOTAL</td><td style="text-align:right">₹${Number(grandTotal||0).toFixed(2)}</td></tr>
  </table>
</div>
<div class="footer"><p>Thank you for shopping with Karunada Collection! | Computer-generated invoice.</p>
<p>GST: 5% on items ≤ ₹2,500 | 18% on items above ₹2,500</p></div>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(billHtml); win.document.close(); win.onload = () => win.print(); }
}
