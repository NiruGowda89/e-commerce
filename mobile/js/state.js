// ─── App State — Karunada Collection Mobile ───────────────────────────────────
const AppState = (() => {
  'use strict';

  // ── Internal state ──────────────────────────────────────────────────────────
  let _cart = JSON.parse(localStorage.getItem('kc_cart') || '[]');
  let _auth = JSON.parse(localStorage.getItem('kc_auth') || 'null');
  let _favs = new Set(JSON.parse(localStorage.getItem('kc_favs') || '[]'));
  const _listeners = {};

  // ── Event emitter ───────────────────────────────────────────────────────────
  function on(event, fn) {
    (_listeners[event] = _listeners[event] || []).push(fn);
  }
  function emit(event, data) {
    (_listeners[event] || []).forEach(fn => fn(data));
  }

  // ── Persistence ─────────────────────────────────────────────────────────────
  function saveCart() {
    localStorage.setItem('kc_cart', JSON.stringify(_cart));
    emit('cart', _cart);
  }
  function saveFavs() {
    localStorage.setItem('kc_favs', JSON.stringify([..._favs]));
    emit('favs', [..._favs]);
  }
  function saveAuth() {
    if (_auth) {
      localStorage.setItem('kc_auth', JSON.stringify(_auth));
      localStorage.setItem('authToken', _auth.token || '');
      localStorage.setItem('user', JSON.stringify(_auth.user || {}));
    } else {
      ['kc_auth', 'authToken', 'user'].forEach(k => localStorage.removeItem(k));
    }
    emit('auth', _auth);
  }

  // ── Cart operations ─────────────────────────────────────────────────────────
  function addToCart({ productId, name, price, image, size, qty = 1 }) {
    const existing = _cart.find(i => i.productId === productId && i.size === size);
    if (existing) existing.qty += qty;
    else _cart.push({ productId, name, price, image, size, qty });
    saveCart();
  }
  function removeFromCart(productId, size) {
    _cart = _cart.filter(i => !(i.productId === productId && i.size === size));
    saveCart();
  }
  function updateQty(productId, size, qty) {
    if (qty <= 0) { removeFromCart(productId, size); return; }
    const item = _cart.find(i => i.productId === productId && i.size === size);
    if (item) { item.qty = qty; saveCart(); }
  }
  function clearCart() { _cart = []; saveCart(); }
  function getCart() { return [..._cart]; }
  function getCartTotal() { return _cart.reduce((s, i) => s + i.price * i.qty, 0); }
  function getCartCount() { return _cart.reduce((s, i) => s + i.qty, 0); }

  // ── Favourites operations ───────────────────────────────────────────────────
  function toggleFav(productId) {
    if (_favs.has(productId)) _favs.delete(productId);
    else _favs.add(productId);
    saveFavs();
    return _favs.has(productId);
  }
  function isFav(id) { return _favs.has(id); }
  function getFavIds() { return [..._favs]; }

  // ── Auth operations ─────────────────────────────────────────────────────────
  function login(user, token) { _auth = { user, token }; saveAuth(); }
  function logout() { _auth = null; saveAuth(); }
  function isLoggedIn() { return !!(_auth && _auth.token); }
  function getUser() { return _auth ? _auth.user : null; }
  function getToken() { return _auth ? _auth.token : null; }

  return {
    on, emit,
    addToCart, removeFromCart, updateQty, clearCart, getCart, getCartTotal, getCartCount,
    toggleFav, isFav, getFavIds,
    login, logout, isLoggedIn, getUser, getToken
  };
})();
