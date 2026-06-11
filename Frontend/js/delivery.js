// Delivery Boy portal — verify OTP and mark order as Delivered
const ORDERS_KEY = 'urbanManOrders';

document.addEventListener('DOMContentLoaded', function () {
    loadTodayDeliveries();

    // Allow submitting with Enter key on OTP field
    document.getElementById('deliveryOtp').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') confirmDelivery();
    });
});

function confirmDelivery() {
    const orderId = document.getElementById('deliveryOrderId').value.trim();
    const otp     = document.getElementById('deliveryOtp').value.trim();
    const errorEl = document.getElementById('errorMsg');

    errorEl.style.display = 'none';

    // Validation
    if (!orderId) {
        showError('Please enter the Order ID.');
        return;
    }
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        showError('Please enter a valid 6-digit OTP.');
        return;
    }

    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const order  = orders.find(o => o.id === orderId);

    // Order not found
    if (!order) {
        showError('Order ID not found. Please check and try again.');
        return;
    }

    // Already delivered
    if (order.status === 'Delivered') {
        showError('This order has already been delivered.');
        return;
    }

    // Cancelled
    if (order.status === 'Cancelled') {
        showError('This order has been cancelled and cannot be delivered.');
        return;
    }

    // Wrong OTP
    if (order.otp !== otp) {
        showError('❌ Incorrect OTP. Please ask the customer to check their My Orders page.');
        return;
    }

    // ✅ OTP matches — mark as Delivered
    order.status      = 'Delivered';
    order.deliveredAt = new Date().toISOString();
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    // Show success
    document.getElementById('formSection').style.display  = 'none';
    document.getElementById('successSection').style.display = '';
    document.getElementById('successMsg').textContent =
        `Order ${orderId} for ${order.customerName} has been marked as delivered. ` +
        `Delivered at ${new Date().toLocaleTimeString()}.`;

    loadTodayDeliveries();
}

function showError(msg) {
    const el = document.getElementById('errorMsg');
    el.textContent    = msg;
    el.style.display  = 'block';
}

function resetForm() {
    document.getElementById('deliveryOrderId').value  = '';
    document.getElementById('deliveryOtp').value       = '';
    document.getElementById('errorMsg').style.display  = 'none';
    document.getElementById('formSection').style.display   = '';
    document.getElementById('successSection').style.display = 'none';
}

function loadTodayDeliveries() {
    const tbody  = document.getElementById('todayDeliveries');
    if (!tbody) return;

    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const today  = new Date().toDateString();

    const todayOrders = orders.filter(o => {
        const placed = o.deliveredAt || o.placedAt;
        return placed && new Date(placed).toDateString() === today;
    });

    if (todayOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-2">No deliveries today</td></tr>';
        return;
    }

    const colorMap = {
        Pending: 'warning', Confirmed: 'info',
        Shipped: 'primary', Delivered: 'success', Cancelled: 'danger'
    };

    tbody.innerHTML = todayOrders.map(o => `
        <tr>
            <td><small>${o.id}</small></td>
            <td>${o.customerName || 'Guest'}<br>
                <small class="text-muted">${o.shippingAddress || ''}</small>
            </td>
            <td>
                <span class="badge badge-${colorMap[o.status] || 'secondary'}">${o.status}</span>
            </td>
        </tr>`).join('');
}
