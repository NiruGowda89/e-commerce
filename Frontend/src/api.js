// Priority: explicit env var → Capacitor/native APK → dev localhost → production relative path
const _envUrl = import.meta.env.VITE_API_URL;

function resolveApiBase() {
  if (_envUrl) return _envUrl.replace(/\/$/, ''); // explicit override (production server)
  const { hostname, protocol } = window.location;
  if (protocol === 'capacitor:' || protocol === 'ionic:') {
    // Running inside a Capacitor APK — must use absolute URL of the backend server
    // Fall through: developer should set VITE_API_URL in Frontend/.env for APK builds
    console.warn('[API] Running in Capacitor but VITE_API_URL is not set. API calls may fail.');
    return 'http://10.0.2.2:8080/api'; // Android emulator loopback to host machine
  }
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8080/api'; // Local dev server
  }
  return '/api'; // Production: same-origin (served by Express)
}

export const API_BASE = resolveApiBase();


// Helper to make authenticated requests
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  options.headers = options.headers || {};
  
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  // Return text if body is empty or not JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const apiGetProducts = () => authFetch(`${API_BASE}/products`);
export const apiGetProduct = (id) => authFetch(`${API_BASE}/products/${id}`);
export const apiFilterProducts = (size, color) => authFetch(`${API_BASE}/products/filter?size=${size}&color=${color}`);
export const apiAddProduct = (product) => authFetch(`${API_BASE}/products`, { method: 'POST', body: product });
export const apiDeleteProduct = (id) => authFetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const apiGetCart = (userId) => authFetch(`${API_BASE}/cart/${userId}`);
export const apiAddToCart = (userId, productId, qty) => authFetch(`${API_BASE}/cart/add`, {
  method: 'POST',
  body: { userId, productId, qty }
});
export const apiRemoveFromCart = (cartId) => authFetch(`${API_BASE}/cart/remove/${cartId}`, { method: 'DELETE' });

// ─── Orders ───────────────────────────────────────────────────────────────────
export const apiPlaceOrder = (order) => authFetch(`${API_BASE}/order/place`, { method: 'POST', body: order });
export const apiGetOrders = (userId) => authFetch(`${API_BASE}/order/${userId}`);
export const apiGetOrdersByStatus = (status) => authFetch(`${API_BASE}/order/status/${status}`);
export const apiUpdateOrderStatus = (orderId, status) => authFetch(`${API_BASE}/order/${orderId}/status?status=${status}`, { method: 'PUT' });
export const apiGetAllOrders = () => authFetch(`${API_BASE}/order/all`);

// ─── Coupons ──────────────────────────────────────────────────────────────────
export const apiValidateCoupon = (code, orderAmount) => authFetch(`${API_BASE}/coupons/validate`, {
  method: 'POST',
  body: { code, orderAmount }
});
export const apiGetAllCoupons = () => authFetch(`${API_BASE}/coupons`);
export const apiCreateCoupon = (coupon) => authFetch(`${API_BASE}/coupons`, { method: 'POST', body: coupon });
export const apiDeleteCoupon = (id) => authFetch(`${API_BASE}/coupons/${id}`, { method: 'DELETE' });

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const apiGetReviews = (productId) => authFetch(`${API_BASE}/reviews/product/${productId}`);
export const apiAddReview = (productId, userId, rating, comment) => authFetch(`${API_BASE}/reviews`, {
  method: 'POST',
  body: { productId, userId, rating, comment }
});
export const apiDeleteReview = (reviewId) => authFetch(`${API_BASE}/reviews/${reviewId}`, { method: 'DELETE' });

// ─── Payments ─────────────────────────────────────────────────────────────────
export const apiCreatePaymentOrder = (amount) => authFetch(`${API_BASE}/payment/create-order`, {
  method: 'POST',
  body: { amount }
});
export const apiVerifyPaymentSignature = (rzpOrderId, rzpPaymentId, rzpSignature) => authFetch(`${API_BASE}/payment/verify`, {
  method: 'POST',
  body: {
    razorpay_order_id: rzpOrderId,
    razorpay_payment_id: rzpPaymentId,
    razorpay_signature: rzpSignature
  }
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const apiRegister = (user) => authFetch(`${API_BASE}/auth/register`, { method: 'POST', body: user });
export const apiLogin = (email, password) => authFetch(`${API_BASE}/auth/login`, {
  method: 'POST',
  body: { email, password }
});
export const apiForgotPassword = (email) => authFetch(`${API_BASE}/auth/forgot-password`, {
  method: 'POST',
  body: { email }
});

// ─── Admin / User Management ──────────────────────────────────────────────────
export const apiGetUsers = () => authFetch(`${API_BASE}/admin/users`);
export const apiToggleUserStatus = (userId, active) => authFetch(`${API_BASE}/admin/users/${userId}/status?active=${active}`, { method: 'PUT' });
export const apiUpdateUserRole = (userId, role) => authFetch(`${API_BASE}/admin/users/${userId}/role?role=${role}`, { method: 'PUT' });
export const apiUpdateUserRoleByEmail = (email, role) => authFetch(`${API_BASE}/admin/users/role?email=${encodeURIComponent(email)}&role=${role}`, { method: 'PUT' });

// ─── Verification ─────────────────────────────────────────────────────────────
export const isBackendOnline = async () => {
  try {
    const res = await fetch(`${API_BASE}/products`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
};

// Helper to parse multiple product images
export function getProductImages(imageUrl) {
  if (!imageUrl) return ['images/shirt.jpg'];
  if (imageUrl.startsWith('[')) {
    try {
      const parsed = JSON.parse(imageUrl);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse imageUrl JSON:", e);
    }
  }
  // Default to comma-separated check or single item array
  if (imageUrl.includes(',')) {
    return imageUrl.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [imageUrl];
}
