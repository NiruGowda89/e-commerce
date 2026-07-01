import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPlaceOrder, apiCreatePaymentOrder } from '../api';

export default function Checkout({ cart, clearCart, user, showToast }) {
  const navigate = useNavigate();

  // Summary state
  const [summary, setSummary] = useState(null);

  // Address form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [flatHouse, setFlatHouse] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddrIdx, setSelectedAddrIdx] = useState(-1);

  // Payment states
  const [selectedPayMethod, setSelectedPayMethod] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('');
  const [upiStatusText, setUpiStatusText] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Merchant configurations
  const MERCHANT_UPI = '9380008927@ibl';
  const MERCHANT_NAME = 'Karunadu Collections';

  // Load checkout summary from session and addresses from local storage
  useEffect(() => {
    const summaryData = sessionStorage.getItem('checkoutSummary');
    if (!summaryData) {
      showToast('No active checkout session!', 'warning');
      navigate('/cart');
      return;
    }
    const parsed = JSON.parse(summaryData);
    setSummary(parsed);

    // Populate email from user if logged in
    if (user) {
      setEmail(user.email || '');
      setFullName(user.name || '');
      setPhone(user.phone || '');
    }

    // Load saved addresses
    try {
      const addrs = JSON.parse(localStorage.getItem('karunadaAddresses') || '[]');
      setSavedAddresses(addrs);
      if (addrs.length > 0) {
        // Set first address as default selection
        setSelectedAddrIdx(0);
        applySavedAddress(addrs[0]);
      }
    } catch (e) {}
  }, [user]);

  const applySavedAddress = (addr) => {
    setFullName(addr.name || '');
    setPhone(addr.phone || '');
    setFlatHouse(addr.line || '');
    setArea(addr.area || '');
    setLandmark(addr.landmark || '');
    setCity(addr.city || '');
    setState(addr.state || '');
    setPincode(addr.pincode || '');
  };

  const handleAddressSelectChange = (idx) => {
    setSelectedAddrIdx(idx);
    if (idx >= 0 && savedAddresses[idx]) {
      applySavedAddress(savedAddresses[idx]);
    } else {
      setFullName('');
      setPhone('');
      setFlatHouse('');
      setArea('');
      setLandmark('');
      setCity('');
      setState('');
      setPincode('');
    }
  };

  // Pre-submit address validation
  const validateForm = () => {
    if (!fullName || !phone || !flatHouse || !city || !pincode || !email) {
      showToast('Please fill all mandatory address fields', 'warning');
      return false;
    }
    if (!/^\d{10}$/.test(phone)) {
      showToast('Enter a valid 10-digit phone number', 'warning');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      showToast('Enter a valid email address', 'warning');
      return false;
    }
    if (!/^\d{6}$/.test(pincode)) {
      showToast('Enter a valid 6-digit pincode', 'warning');
      return false;
    }
    return true;
  };

  // UPI deep linking
  const triggerUPIAppLaunch = (app) => {
    setSelectedUpiApp(app);
    setPaymentConfirmed(false);

    const amount = summary.grandTotal;
    const vpa = MERCHANT_UPI;
    const name = MERCHANT_NAME;
    const txnNote = 'Karunadu Collections Order';
    const amtStr = amount.toFixed(2);

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const vpaEnc = encodeURIComponent(vpa);
    const nameEnc = encodeURIComponent(name);
    const txnNoteEnc = encodeURIComponent(txnNote);
    
    let params = `pa=${vpaEnc}&pn=${nameEnc}&cu=INR&tn=${txnNoteEnc}&am=${amtStr}`;
    const genericUPI = `upi://pay?${params}`;

    const schemes = {
      phonepe: `phonepe://pay?${params}`,
      gpay: isIOS ? `gpay://upi/pay?${params}` : `tez://upi/pay?${params}`,
      paytm: `paytmmp://pay?${params}`
    };

    const targetUrl = schemes[app] || genericUPI;

    setUpiStatusText(`Opening ${app.toUpperCase()} for ₹${amtStr}…`);
    
    // Attempt scheme launch
    window.location.href = targetUrl;

    // Timeout fallback triggers
    const startTime = Date.now();
    setTimeout(() => {
      const timeElapsed = Date.now() - startTime;
      if (timeElapsed < 2200 && !document.hidden) {
        setUpiStatusText(`Direct launch failed. Redirecting to default UPI selector…`);
        window.location.href = genericUPI;

        setTimeout(() => {
          if (!document.hidden) {
            setUpiStatusText(`Could not open UPI apps automatically. Please pay ₹${amtStr} to ${vpa} manually.`);
          }
        }, 2000);
      }
    }, 1500);
  };

  // Card payment via Razorpay
  const handleRazorpay = async () => {
    if (!validateForm()) return;
    
    try {
      const orderData = await apiCreatePaymentOrder(summary.grandTotal);
      if (orderData.error) {
        showToast('Payment gateway issue. Choose UPI or COD.', 'warning');
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Karunadu Collections',
        description: 'Order Payment',
        order_id: orderData.orderId,
        prefill: {
          name: fullName,
          email: email,
          contact: phone
        },
        theme: { color: '#302b63' },
        handler: function () {
          setSelectedPayMethod('Card (Razorpay)');
          setPaymentConfirmed(true);
          submitOrder('Card (Razorpay)');
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      showToast('Could not load Razorpay. Try UPI or COD.', 'error');
    }
  };

  const submitOrder = async (payMethodOverride = '') => {
    if (!validateForm()) return;

    const method = payMethodOverride || selectedPayMethod;
    if (!method) {
      showToast('Please select a payment method', 'warning');
      return;
    }

    setPlacingOrder(true);
    const address = [flatHouse, area, landmark].filter(Boolean).join(', ');

    const finalPayMethod = method === 'UPI' 
      ? `UPI – ${{ phonepe: 'PhonePe', gpay: 'Google Pay', paytm: 'Paytm', other: 'Other App' }[selectedUpiApp] || selectedUpiApp}` 
      : method;

    const orderPayload = {
      userId: user ? user.id : null,
      customerName: fullName,
      email,
      phone,
      shippingAddress: address,
      city,
      pincode,
      paymentMethod: finalPayMethod,
      totalAmount: summary.grandTotal,
      items: cart
    };

    try {
      const savedOrder = await apiPlaceOrder(orderPayload);
      
      // Save order info to session for confirmation
      sessionStorage.setItem('lastOrderId', String(savedOrder.orderId || savedOrder.id));
      sessionStorage.setItem('lastOrderData', JSON.stringify(savedOrder));
      
      // Clear shopping cart
      clearCart();
      showToast('Order Placed Successfully!', 'success');
      navigate('/account#order-confirm');
    } catch (err) {
      showToast(err.message || 'Failed to place order', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!summary) return null;

  return (
    <div className="container mt-4 mb-5">
      <h2>Checkout Details</h2>
      <div className="row mt-4">
        {/* Billing & Shipping Section */}
        <div className="col-lg-7">
          <div className="card p-4 mb-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <h5 className="mb-3 text-light">📍 Delivery Address</h5>

            {savedAddresses.length > 0 && (
              <div className="form-group">
                <label className="text-secondary small">Choose Saved Address</label>
                <select 
                  className="form-control"
                  value={selectedAddrIdx}
                  onChange={(e) => handleAddressSelectChange(Number(e.target.value))}
                  style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                >
                  {savedAddresses.map((a, i) => (
                    <option key={i} value={i}>{a.name} - {a.line}, {a.city}</option>
                  ))}
                  <option value={-1}>-- Enter New Address --</option>
                </select>
              </div>
            )}

            <div className="row">
              <div className="col-md-6 form-group">
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-control" 
                  placeholder="Full Name *" 
                  style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div className="col-md-6 form-group">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control" 
                  placeholder="Email Address *" 
                  style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 form-group">
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-control" 
                  placeholder="Phone Number *" 
                  style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div className="col-md-6 form-group">
                <input 
                  type="tel" 
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  className="form-control" 
                  placeholder="Alternate Phone (Optional)" 
                  style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <input 
                type="text" 
                value={flatHouse}
                onChange={(e) => setFlatHouse(e.target.value)}
                className="form-control" 
                placeholder="Flat / House No. / Building *" 
                style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                required
              />
            </div>

            <div className="row">
              <div className="col-md-6 form-group">
                <input 
                  type="text" 
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="form-control" 
                  placeholder="Colony / Area / Street" 
                  style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                />
              </div>
              <div className="col-md-6 form-group">
                <input 
                  type="text" 
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="form-control" 
                  placeholder="Landmark (Optional)" 
                  style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 form-group">
                <input 
                  type="text" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="form-control" 
                  placeholder="City *" 
                  style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div className="col-md-4 form-group">
                <input 
                  type="text" 
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="form-control" 
                  placeholder="State *" 
                  style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                  required
                />
              </div>
              <div className="col-md-4 form-group">
                <input 
                  type="text" 
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="form-control" 
                  placeholder="Pincode *" 
                  style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="card p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <h5 className="mb-3 text-light">💳 Select Payment Method</h5>
            <div className="d-flex flex-wrap gap-2 mb-4">
              <button 
                onClick={() => { setSelectedPayMethod('UPI'); setPaymentConfirmed(false); }}
                className={`btn flex-grow-1 ${selectedPayMethod === 'UPI' ? 'btn-primary' : 'btn-outline-secondary'}`}
              >
                📱 UPI Apps
              </button>
              <button 
                onClick={() => { setSelectedPayMethod('Card'); setPaymentConfirmed(false); }}
                className={`btn flex-grow-1 ${selectedPayMethod === 'Card' ? 'btn-primary' : 'btn-outline-secondary'}`}
              >
                💳 Credit/Debit Card
              </button>
              <button 
                onClick={() => { setSelectedPayMethod('Cash on Delivery'); setPaymentConfirmed(true); }}
                className={`btn flex-grow-1 ${selectedPayMethod === 'Cash on Delivery' ? 'btn-primary' : 'btn-outline-secondary'}`}
              >
                💵 Cash on Delivery
              </button>
            </div>

            {/* UPI Application options */}
            {selectedPayMethod === 'UPI' && (
              <div className="p-3 mb-3 border rounded" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <label className="text-secondary small">Choose preferred UPI app:</label>
                <div className="d-flex flex-wrap gap-2">
                  {['phonepe', 'gpay', 'paytm', 'other'].map(app => (
                    <button 
                      key={app}
                      onClick={() => triggerUPIAppLaunch(app)}
                      className={`btn btn-sm ${selectedUpiApp === app ? 'btn-success' : 'btn-outline-secondary'}`}
                    >
                      {app.toUpperCase()}
                    </button>
                  ))}
                </div>
                
                {selectedUpiApp && (
                  <div className="mt-3 p-3 text-center border-success bg-dark rounded">
                    <p className="small text-secondary mb-2">{upiStatusText}</p>
                    <button 
                      onClick={() => { setPaymentConfirmed(true); submitOrder(); }}
                      className="btn btn-sm btn-success px-4"
                    >
                      ✅ I've paid — Place Order
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Card / Razorpay Options */}
            {selectedPayMethod === 'Card' && (
              <div className="p-3 mb-3 text-center border rounded" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <p className="small text-secondary mb-3">All cards and netbanking accepted safely via Razorpay</p>
                <button 
                  onClick={handleRazorpay}
                  className="btn btn-primary px-4 font-weight-bold"
                >
                  💳 Pay Now with Razorpay
                </button>
              </div>
            )}

            {/* COD option */}
            {selectedPayMethod === 'Cash on Delivery' && (
              <div className="p-3 mb-3 text-center border rounded" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <p className="small text-secondary mb-0">Pay with cash when the package is delivered to your door.</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary & Finalize Button */}
        <div className="col-lg-5">
          <div className="card p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <h5 className="mb-3 text-light">Order Summary</h5>
            <div className="mb-3">
              {summary.cart.map(item => (
                <div key={`${item.id}-${item.size}`} className="d-flex justify-content-between mb-2 small text-secondary">
                  <span>{item.name} (x{item.quantity})</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <hr style={{ borderColor: 'var(--border)' }} />

            <div className="d-flex justify-content-between mb-2 small text-secondary">
              <span>Subtotal</span>
              <span>₹{summary.subtotal.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2 small text-secondary">
              <span>GST</span>
              <span>₹{summary.gst.toFixed(2)}</span>
            </div>
            {summary.discountAmount > 0 && (
              <div className="d-flex justify-content-between mb-2 small text-success">
                <span>Discount</span>
                <span>-₹{summary.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="d-flex justify-content-between mb-3 small text-secondary">
              <span>Shipping</span>
              <span>{summary.shipping > 0 ? `₹${summary.shipping.toFixed(2)}` : 'Free'}</span>
            </div>

            <hr style={{ borderColor: 'var(--border)' }} />

            <div className="d-flex justify-content-between mb-4 font-weight-bold text-light">
              <span>Grand Total</span>
              <span>₹{summary.grandTotal.toFixed(2)}</span>
            </div>

            <button 
              disabled={!paymentConfirmed || placingOrder}
              onClick={() => submitOrder()}
              className="btn btn-success btn-block py-2 font-weight-bold"
              style={{ opacity: paymentConfirmed ? 1 : 0.5, cursor: paymentConfirmed ? 'pointer' : 'not-allowed' }}
            >
              {placingOrder ? 'Placing order…' : ' Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
