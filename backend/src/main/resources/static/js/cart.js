// ─── Cart Store (localStorage) ───────────────────────────────────────────────
const CART_KEY = 'urbanManCart';

function getCart()               { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
function _saveCart(cart)         { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function addToCart(product, qty = 1) {
  const cart = getCart();
  const item = cart.find(i => i.id === product.id);
  if (item) {
    item.quantity += qty;
  } else {
    cart.push({
      id:       product.id,
      name:     product.name,
      price:    product.price,
      image:    product.image  || 'images/shirt.jpg',
      size:     product.size   || '',
      color:    product.color  || '',
      quantity: qty
    });
  }
  _saveCart(cart);
  refreshCartBadge();
}

function removeFromCart(productId) {
  _saveCart(getCart().filter(i => i.id !== productId));
  refreshCartBadge();
}

function updateQty(productId, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  if (qty < 1) { removeFromCart(productId); return; }
  item.quantity = qty;
  _saveCart(cart);
  refreshCartBadge();
}

function getCartTotal()     { return getCart().reduce((s, i) => s + Number(i.price) * i.quantity, 0); }
function getCartItemCount() { return getCart().reduce((s, i) => s + i.quantity, 0); }
function clearCart()        { localStorage.removeItem(CART_KEY); refreshCartBadge(); }

// ─── Badge helper (works on every page) ──────────────────────────────────────
function refreshCartBadge() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  const n = getCartItemCount();
  badge.textContent = n > 0 ? n : '';
}

// Run on every page load
document.addEventListener('DOMContentLoaded', refreshCartBadge);
