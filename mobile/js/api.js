// ─── API Layer — Karunada Collection Mobile ───────────────────────────────────
var API_BASE = (() => {
  const stored = localStorage.getItem('karunada_api_base');
  if (stored) return stored;
  const h = location.hostname;
  return (h === 'localhost' || h === '127.0.0.1' || h === '' || location.protocol === 'file:')
    ? 'http://localhost:8080/api'
    : 'https://e-commerce-1-ariz.onrender.com/api';
})();

function resolveImgUrl(img) {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) {
    return img;
  }
  const cleanPath = img.startsWith('/') ? img.slice(1) : img;
  const base = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;
  return `${base}/${cleanPath}`;
}


// ─── JWT Fetch Interceptor ────────────────────────────────────────────────────
const _origFetch = window.fetch;
window.fetch = function(resource, init) {
  const token = localStorage.getItem('authToken');
  const url = resource.toString();
  if (token && (url.startsWith(API_BASE) || url.includes('/api/'))) {
    init = init || {};
    init.headers = init.headers || {};
    if (!init.headers['Authorization'] && !init.headers['authorization']) {
      init.headers['Authorization'] = 'Bearer ' + token;
    }
  }
  return _origFetch(resource, init);
};

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
  const res = await fetch(`${API_BASE}/products/filter?size=${encodeURIComponent(size)}&color=${encodeURIComponent(color)}`);
  if (!res.ok) throw new Error('Filter failed');
  return res.json();
}

// ─── Orders ──────────────────────────────────────────────────────────────────
async function apiPlaceOrder(order) {
  const res = await fetch(`${API_BASE}/order/place`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
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
  const res = await fetch(`${API_BASE}/order/${orderId}/status?status=${status}`, { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to update order');
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function apiRegister(user) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => 'Registration failed');
    throw new Error(msg || 'Registration failed');
  }
  return res.json();
}

async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Invalid credentials');
  return res.json();
}

async function isBackendOnline() {
  try {
    const res = await fetch(`${API_BASE}/products`, { method: 'GET' });
    return res.ok;
  } catch { return false; }
}

// ─── Demo Products (offline fallback with discounts) ──────────────────────────
const DEMO_PRODUCTS = [
  { productId:'d1', productName:'Classic Black Tee',    category:'T-Shirts', price:499,  originalPrice:699,  discount:29, imageUrl:'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80', description:'Premium cotton crew-neck tee. Soft, breathable, and perfect for everyday wear.', sizes:['S','M','L','XL','XXL'], colors:['Black'], isNew:false },
  { productId:'d2', productName:'Slim Fit Chinos',       category:'Trousers', price:1199, originalPrice:1499, discount:20, imageUrl:'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&q=80', description:'Tailored slim-fit chinos with stretch comfort fabric for all-day wear.', sizes:['30','32','34','36'], colors:['Beige','Navy'], isNew:false },
  { productId:'d3', productName:'Cargo Shorts',          category:'Shorts',   price:799,  originalPrice:999,  discount:20, imageUrl:'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=400&q=80', description:'Rugged cargo shorts with multiple utility pockets and drawstring waist.', sizes:['S','M','L','XL'], colors:['Olive','Black'], isNew:true },
  { productId:'d4', productName:'Striped Polo',          category:'Polo',     price:699,  originalPrice:899,  discount:22, imageUrl:'https://images.unsplash.com/photo-1625910513473-4726a2d9dcd9?w=400&q=80', description:'Classic striped polo with ribbed collar and embroidered logo.', sizes:['S','M','L','XL'], colors:['Navy/White','Red/White'], isNew:true },
  { productId:'d5', productName:'Denim Jacket',          category:'Jackets',  price:2199, originalPrice:2999, discount:27, imageUrl:'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&q=80', description:'Rugged denim jacket with contrast stitching and button closure.', sizes:['S','M','L','XL'], colors:['Blue','Black'], isNew:false },
  { productId:'d6', productName:'White Linen Shirt',     category:'Shirts',   price:899,  originalPrice:1299, discount:31, imageUrl:'https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=400&q=80', description:'Breathable linen shirt perfect for summer. Regular fit with point collar.', sizes:['S','M','L','XL','XXL'], colors:['White','Light Blue'], isNew:true },
  { productId:'d7', productName:'Track Pants',           category:'Trousers', price:899,  originalPrice:1099, discount:18, imageUrl:'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=400&q=80', description:'Comfortable track pants with elastic waistband and side pockets.', sizes:['S','M','L','XL'], colors:['Black','Grey'], isNew:false },
  { productId:'d8', productName:'Graphic Hoodie',        category:'T-Shirts', price:1499, originalPrice:1999, discount:25, imageUrl:'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80', description:'Bold graphic print hoodie with kangaroo pocket and drawstring hood.', sizes:['S','M','L','XL','XXL'], colors:['Black','Grey'], isNew:true },
];
