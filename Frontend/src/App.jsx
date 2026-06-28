import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Account from './pages/Account';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Favourites from './pages/Favourites';

export default function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Initial mount: load user and cart from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('urbanManUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn('Failed to load authenticated user');
    }

    try {
      const storedCart = localStorage.getItem('urbanManCart');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (e) {
      console.warn('Failed to load shopping cart');
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleCloseToast = () => {
    setToast({ message: '', type: 'success' });
  };

  // Cart operations
  const addToCart = (product, qty = 1) => {
    const list = [...cart];
    const index = list.findIndex(i => i.id === product.id && i.size === product.size && i.color === product.color);
    
    if (index !== -1) {
      list[index].quantity += qty;
    } else {
      list.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || 'images/shirt.jpg',
        size: product.size || '',
        color: product.color || '',
        quantity: qty
      });
    }

    setCart(list);
    localStorage.setItem('urbanManCart', JSON.stringify(list));
  };

  const updateQty = (productId, qty) => {
    let list = [...cart];
    const index = list.findIndex(i => i.id === productId);
    if (index === -1) return;

    if (qty < 1) {
      list = list.filter(i => i.id !== productId);
    } else {
      list[index].quantity = qty;
    }

    setCart(list);
    localStorage.setItem('urbanManCart', JSON.stringify(list));
  };

  const removeFromCart = (productId) => {
    const list = cart.filter(i => i.id !== productId);
    setCart(list);
    localStorage.setItem('urbanManCart', JSON.stringify(list));
    showToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('urbanManCart');
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <BrowserRouter>
      <div className="d-flex flex-column" style={{ minHeight: '100vh', background: 'var(--bg-body)', color: 'var(--text-primary)' }}>
        <Navbar cartCount={totalCartItems} user={user} />
        
        <main className="flex-grow-1" style={{ paddingBottom: '40px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop addToCart={addToCart} showToast={showToast} />} />
            <Route path="/new-arrivals" element={<Shop addToCart={addToCart} showToast={showToast} />} />
            <Route path="/offers" element={<Shop addToCart={addToCart} showToast={showToast} />} />
            <Route path="/product/:id" element={<ProductDetail addToCart={addToCart} showToast={showToast} user={user} />} />
            <Route 
              path="/cart" 
              element={
                <Cart 
                  cart={cart} 
                  updateQty={updateQty} 
                  removeFromCart={removeFromCart} 
                  user={user} 
                  showToast={showToast} 
                />
              } 
            />
            <Route 
              path="/checkout" 
              element={
                <Checkout 
                  cart={cart} 
                  clearCart={clearCart} 
                  user={user} 
                  showToast={showToast} 
                />
              } 
            />
            <Route 
              path="/account" 
              element={
                <Account 
                  user={user} 
                  setUser={setUser} 
                  showToast={showToast} 
                />
              } 
            />
            <Route 
              path="/login" 
              element={
                <Login 
                  setUser={setUser} 
                  showToast={showToast} 
                />
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AdminDashboard 
                  user={user} 
                  showToast={showToast} 
                />
              } 
            />
            <Route 
              path="/super-admin" 
              element={
                <SuperAdminDashboard 
                  user={user} 
                  showToast={showToast} 
                />
              } 
            />
            <Route 
              path="/favourites" 
              element={
                <Favourites 
                  showToast={showToast} 
                />
              } 
            />
            {/* Fallback routing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
        
        {toast.message && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={handleCloseToast} 
          />
        )}
      </div>
    </BrowserRouter>
  );
}
