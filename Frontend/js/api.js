// ─── API Configuration ────────────────────────────────────────────────────────
const API_BASE = 'http://10.247.200.19:8080';

// ─── Products ─────────────────────────────────────────────────────────────────
async function apiGetProducts() {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}

async function apiGetProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error('Product not found');
    return res.json();
}

async function apiFilterProducts(size, color) {
    const res = await fetch(`${API_BASE}/products/filter?size=${size}&color=${color}`);
    if (!res.ok) throw new Error('Failed to filter products');
    return res.json();
}

async function apiAddProduct(product) {
    const res = await fetch(`${API_BASE}/products`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Failed to add product');
    return res.json();
}

async function apiDeleteProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete product');
    return res.text();
}

// ─── Orders ───────────────────────────────────────────────────────────────────
async function apiPlaceOrder(order) {
    const res = await fetch(`${API_BASE}/order/place`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(order)
    });
    if (!res.ok) throw new Error('Failed to place order');
    return res.json();
}

async function apiGetOrders(userId) {
    const res = await fetch(`${API_BASE}/order/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
}

async function apiUpdateOrderStatus(orderId, status) {
    const res = await fetch(`${API_BASE}/order/${orderId}/status?status=${status}`, {
        method: 'PUT'
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function apiRegister(user) {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(user)
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
}

async function apiLogin(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Invalid credentials');
    return res.json();
}

// ─── Helper: check if backend is reachable ────────────────────────────────────
async function isBackendOnline() {
    try {
        const res = await fetch(`${API_BASE}/products`, { method: 'GET' });
        return res.ok;
    } catch {
        return false;
    }
}
