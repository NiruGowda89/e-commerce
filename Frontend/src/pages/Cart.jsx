import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiValidateCoupon } from '../api';

export default function Cart({ cart, updateQty, removeFromCart, user, showToast }) {
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState(null);
  const [couponError, setCouponError] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  // GST Calculation: 5% for items <= 2500, 18% for items > 2500
  const gst = cart.reduce((sum, item) => {
    const rate = Number(item.price) <= 2500 ? 0.05 : 0.18;
    return sum + (Number(item.price) * rate) * item.quantity;
  }, 0);

  // Discount
  let discountAmount = 0;
  if (discountInfo) {
    if (discountInfo.coupon.discountPercent) {
      discountAmount = subtotal * (discountInfo.coupon.discountPercent / 100);
    } else if (discountInfo.coupon.discountAmount) {
      discountAmount = discountInfo.coupon.discountAmount;
    }
    discountAmount = Math.min(discountAmount, subtotal); // Can't exceed subtotal
  }

  // Shipping cost: Free above 499, otherwise 50
  const shipping = (subtotal - discountAmount) > 499 || subtotal === 0 ? 0 : 50;

  const grandTotal = Math.max(0, subtotal + gst + shipping - discountAmount);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode.trim()) return;

    try {
      const data = await apiValidateCoupon(couponCode.trim(), subtotal);
      setDiscountInfo(data);
      setCouponError('');
      showToast(`Coupon ${couponCode.toUpperCase()} applied!`, 'success');
    } catch (err) {
      setDiscountInfo(null);
      setCouponError(err.message || 'Invalid coupon code');
      showToast('Invalid coupon!', 'error');
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Cache checkout details
    const checkoutData = {
      cart,
      subtotal,
      gst,
      shipping,
      discountAmount,
      grandTotal,
      couponCode: discountInfo ? discountInfo.coupon.code : null
    };
    sessionStorage.setItem('checkoutSummary', JSON.stringify(checkoutData));

    if (!user) {
      showToast('Please login to checkout', 'info');
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="container mt-4 mb-5">
      <h2>Shopping Cart</h2>

      {cart.length === 0 ? (
        <div className="text-center py-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <span style={{ fontSize: '3rem' }}>🛒</span>
          <h4 className="mt-3 text-muted">Your cart is empty</h4>
          <Link to="/shop" className="btn btn-primary mt-2">Go Shopping</Link>
        </div>
      ) : (
        <div className="row">
          {/* Cart List */}
          <div className="col-lg-8">
            {cart.map(item => (
              <div 
                key={`${item.id}-${item.size}-${item.color}`}
                className="card mb-3 p-3" 
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}
              >
                <div className="row align-items-center">
                  <div className="col-3 col-md-2">
                    <img 
                      src={item.image || 'images/shirt.jpg'} 
                      alt={item.name} 
                      className="img-fluid rounded" 
                      style={{ height: '70px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/100?text=Item';
                      }}
                    />
                  </div>
                  <div className="col-9 col-md-4">
                    <h6 className="mb-1 text-light">{item.name}</h6>
                    <small className="text-muted">
                      {item.size ? `Size: ${item.size}` : ''} 
                      {item.color ? ` · Color: ${item.color}` : ''}
                    </small>
                    <div className="text-primary font-weight-bold mt-1">₹{item.price}</div>
                  </div>
                  <div className="col-6 col-md-3 mt-2 mt-md-0">
                    <div className="input-group input-group-sm" style={{ maxWidth: '110px' }}>
                      <div className="input-group-prepend">
                        <button 
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="btn btn-outline-secondary" 
                          type="button"
                        >-</button>
                      </div>
                      <input 
                        type="text" 
                        className="form-control text-center" 
                        value={item.quantity} 
                        readOnly 
                        style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      />
                      <div className="input-group-append">
                        <button 
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="btn btn-outline-secondary" 
                          type="button"
                        >+</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3 text-right mt-2 mt-md-0">
                    <div className="font-weight-bold text-light mb-1">₹{item.price * item.quantity}</div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="btn btn-link btn-sm text-danger p-0"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="col-lg-4">
            <div className="card p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <h5 className="mb-3 text-light">Order Summary</h5>
              
              <div className="d-flex justify-content-between mb-2 small text-secondary">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 small text-secondary">
                <span>GST</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="d-flex justify-content-between mb-2 small text-success">
                  <span>Discount</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between mb-3 small text-secondary">
                <span>Shipping</span>
                <span>{shipping > 0 ? `₹${shipping.toFixed(2)}` : 'Free'}</span>
              </div>

              <hr style={{ borderColor: 'var(--border)' }} />

              <div className="d-flex justify-content-between mb-4 font-weight-bold text-light">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="mb-4">
                <div className="input-group input-group-sm">
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="form-control" 
                    placeholder="Enter Coupon Code" 
                    style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                  />
                  <div className="input-group-append">
                    <button type="submit" className="btn btn-outline-primary">Apply</button>
                  </div>
                </div>
                {couponError && <div className="text-danger small mt-1">{couponError}</div>}
                {discountInfo && <div className="text-success small mt-1">✓ Coupon code applied!</div>}
              </form>

              <button 
                onClick={handleCheckout}
                className="btn btn-primary btn-block py-2 font-weight-bold"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
