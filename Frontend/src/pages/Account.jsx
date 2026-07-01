import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { apiGetOrders, apiForgotPassword } from '../api';

export default function Account({ user, setUser, showToast }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [profileEditing, setProfileEditing] = useState(false);

  // Address States
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine, setAddrLine] = useState('');
  const [addrArea, setAddrArea] = useState('');
  const [addrLandmark, setLandmark] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPin, setAddrPin] = useState('');

  // Wishlist State
  const [wishlist, setWishlist] = useState([]);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderQuery, setOrderQuery] = useState('');

  // Settings Toggles
  const [biometric, setBiometric] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('turquoise');

  // Confirmation Order Detail
  const [confirmOrder, setConfirmOrder] = useState(null);

  // Parse active tab from hash on load & path update
  useEffect(() => {
    const hash = location.hash.replace('#', '').trim();
    if (hash) {
      setActiveTab(hash);
    } else {
      setActiveTab('profile');
    }
  }, [location.hash]);

  // Load preferences, addresses, profile from storage
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Load theme
    setCurrentTheme(localStorage.getItem('karunada_app_theme') || 'turquoise');
    setBiometric(localStorage.getItem('karunada_app_biometric') === 'true');
    setNotifications(localStorage.getItem('karunada_app_notify') === 'true');
    setImmersive(localStorage.getItem('karunada_app_immersive') === 'true');

    // Load Profile
    try {
      const profile = JSON.parse(localStorage.getItem('karunadaProfile') || '{}');
      setFirstName(profile.firstName || user.name?.split(' ')[0] || '');
      setLastName(profile.lastName || user.name?.split(' ').slice(1).join(' ') || '');
      setPhone(profile.phone || user.phone || '');
      setDob(profile.dob || '');
      setGender(profile.gender || 'Male');
    } catch (e) {}

    // Load Addresses
    try {
      const addrs = JSON.parse(localStorage.getItem('karunadaAddresses') || '[]');
      setAddresses(addrs);
    } catch (e) {}

    // Load Wishlist
    try {
      const favs = JSON.parse(localStorage.getItem('karunadaFavourites') || '[]');
      setWishlist(favs);
    } catch (e) {}
  }, [user]);

  // Fetch orders from API when orders tab is active
  useEffect(() => {
    if (activeTab === 'orders' && user) {
      loadOrders();
    } else if (activeTab === 'order-confirm') {
      loadConfirmOrder();
    }
  }, [activeTab, user]);

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await apiGetOrders(user.id);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadConfirmOrder = async () => {
    // Check sessionStorage
    const lastData = sessionStorage.getItem('lastOrderData');
    if (lastData) {
      setConfirmOrder(JSON.parse(lastData));
      sessionStorage.removeItem('lastOrderData');
      sessionStorage.removeItem('lastOrderId');
    } else {
      // Fallback: load latest order from api
      try {
        const data = await apiGetOrders(user.id);
        if (data.length > 0) {
          setConfirmOrder(data[0]);
        }
      } catch (e) {}
    }
  };

  // Profile Save
  const handleProfileSave = (e) => {
    e.preventDefault();
    const profile = { firstName, lastName, phone, dob, gender };
    localStorage.setItem('karunadaProfile', JSON.stringify(profile));

    // Update user auth store
    const updatedUser = { ...user, name: `${firstName} ${lastName}`.trim(), phone };
    setUser(updatedUser);
    localStorage.setItem('urbanManUser', JSON.stringify(updatedUser));

    setProfileEditing(false);
    showToast('Profile saved successfully!', 'success');
  };

  // Addresses CRUD
  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!addrName || !addrLine || !addrCity || !addrPin) {
      alert('Please fill Name, Address Line, City, and Pincode.');
      return;
    }
    const newAddr = {
      name: addrName,
      phone: addrPhone,
      line: addrLine,
      area: addrArea,
      landmark: addrLandmark,
      city: addrCity,
      state: addrState,
      pincode: addrPin
    };
    const list = [...addresses, newAddr];
    setAddresses(list);
    localStorage.setItem('karunadaAddresses', JSON.stringify(list));

    // Reset Form
    setAddrName('');
    setAddrPhone('');
    setAddrLine('');
    setAddrArea('');
    setLandmark('');
    setAddrCity('');
    setAddrState('');
    setAddrPin('');
    setShowAddressForm(false);
    showToast('Address saved successfully!', 'success');
  };

  const setDefaultAddress = (idx) => {
    const list = [...addresses];
    const [item] = list.splice(idx, 1);
    list.unshift(item);
    setAddresses(list);
    localStorage.setItem('karunadaAddresses', JSON.stringify(list));
    showToast('Default address updated!', 'success');
  };

  const removeAddress = (idx) => {
    if (!window.confirm('Remove this address?')) return;
    const list = [...addresses];
    list.splice(idx, 1);
    setAddresses(list);
    localStorage.setItem('karunadaAddresses', JSON.stringify(list));
    showToast('Address removed!', 'info');
  };

  // Wishlist Revoke
  const removeWishlist = (id) => {
    const list = wishlist.filter(item => item.id !== id);
    setWishlist(list);
    localStorage.setItem('karunadaFavourites', JSON.stringify(list));
    showToast('Removed from Wishlist!', 'info');
    window.dispatchEvent(new Event('favouritesUpdated'));
  };

  // Theme Toggler
  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('karunada_app_theme', theme);
    document.body.classList.remove('theme-turquoise', 'theme-indigo', 'theme-dark', 'theme-purple');
    document.body.classList.add('theme-' + theme);
    showToast(`Visual theme updated to ${theme.toUpperCase()}!`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('urbanManUser');
    localStorage.removeItem('authToken');
    setUser(null);
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  // Search orders
  const filteredOrders = orders.filter(o => 
    String(o.orderId || o.id).toLowerCase().includes(orderQuery.toLowerCase()) ||
    (o.customerName || '').toLowerCase().includes(orderQuery.toLowerCase())
  );

  return (
    <div className="container mt-4 mb-5">
      <div className="row">
        {/* SIDEBAR NAVIGATION */}
        <div className="col-md-4 col-lg-3 mb-4">
          <div className="card p-3 text-center mb-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div className="m-auto rounded-circle d-flex align-items-center justify-content-center bg-primary text-white font-weight-bold" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
              {firstName[0] || 'U'}
            </div>
            <h5 className="mt-2 text-light" id="sidebarGreeting">Hi, {firstName || user?.name || 'Customer'}</h5>
            <small className="text-secondary">{user?.email}</small>
          </div>

          <div className="list-group" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <button 
              onClick={() => navigate('#profile')}
              className={`list-group-item list-group-item-action ${activeTab === 'profile' ? 'active' : ''}`}
              style={{ background: activeTab === 'profile' ? 'var(--accent)' : 'var(--bg-surface)', color: '#fff', border: '1px solid var(--border)' }}
            >
              👤 My Profile
            </button>
            <button 
              onClick={() => navigate('#orders')}
              className={`list-group-item list-group-item-action ${activeTab === 'orders' ? 'active' : ''}`}
              style={{ background: activeTab === 'orders' ? 'var(--accent)' : 'var(--bg-surface)', color: '#fff', border: '1px solid var(--border)' }}
            >
              📦 My Orders
            </button>
            <button 
              onClick={() => navigate('#addresses')}
              className={`list-group-item list-group-item-action ${activeTab === 'addresses' ? 'active' : ''}`}
              style={{ background: activeTab === 'addresses' ? 'var(--accent)' : 'var(--bg-surface)', color: '#fff', border: '1px solid var(--border)' }}
            >
              📍 Manage Addresses
            </button>
            <button 
              onClick={() => navigate('#wishlist')}
              className={`list-group-item list-group-item-action ${activeTab === 'wishlist' ? 'active' : ''}`}
              style={{ background: activeTab === 'wishlist' ? 'var(--accent)' : 'var(--bg-surface)', color: '#fff', border: '1px solid var(--border)' }}
            >
              ❤️ My Wishlist
            </button>
            <button 
              onClick={() => navigate('#app-settings')}
              className={`list-group-item list-group-item-action ${activeTab === 'app-settings' ? 'active' : ''}`}
              style={{ background: activeTab === 'app-settings' ? 'var(--accent)' : 'var(--bg-surface)', color: '#fff', border: '1px solid var(--border)' }}
            >
              ⚙️ Settings
            </button>
            <button 
              onClick={handleLogout}
              className="list-group-item list-group-item-action text-danger"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* DETAILS PANEL PANEL CONTENT */}
        <div className="col-md-8 col-lg-9">
          <div className="card p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', minHeight: '400px' }}>
            
            {/* 1. PROFILE PANEL */}
            {activeTab === 'profile' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="text-light mb-0">My Profile</h4>
                  <button 
                    onClick={() => setProfileEditing(!profileEditing)}
                    className="btn btn-sm btn-outline-primary"
                  >
                    {profileEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                
                <form onSubmit={handleProfileSave}>
                  <div className="row">
                    <div className="col-md-6 form-group">
                      <label className="text-secondary small">First Name</label>
                      <input 
                        type="text" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="form-control"
                        readOnly={!profileEditing}
                        style={{ background: profileEditing ? 'var(--bg-elevated)' : 'transparent', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div className="col-md-6 form-group">
                      <label className="text-secondary small">Last Name</label>
                      <input 
                        type="text" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="form-control"
                        readOnly={!profileEditing}
                        style={{ background: profileEditing ? 'var(--bg-elevated)' : 'transparent', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 form-group">
                      <label className="text-secondary small">Phone Number</label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="form-control"
                        readOnly={!profileEditing}
                        style={{ background: profileEditing ? 'var(--bg-elevated)' : 'transparent', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div className="col-md-6 form-group">
                      <label className="text-secondary small">Date of Birth</label>
                      <input 
                        type="date" 
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="form-control"
                        readOnly={!profileEditing}
                        style={{ background: profileEditing ? 'var(--bg-elevated)' : 'transparent', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="text-secondary small d-block">Gender</label>
                    <div className="d-flex gap-4 mt-1">
                      <label className="text-light mr-4">
                        <input 
                          type="radio" 
                          name="gender" 
                          value="Male"
                          checked={gender === 'Male'} 
                          disabled={!profileEditing}
                          onChange={(e) => setGender(e.target.value)}
                          className="mr-2"
                        /> Male
                      </label>
                      <label className="text-light">
                        <input 
                          type="radio" 
                          name="gender" 
                          value="Female"
                          checked={gender === 'Female'} 
                          disabled={!profileEditing}
                          onChange={(e) => setGender(e.target.value)}
                          className="mr-2"
                        /> Female
                      </label>
                    </div>
                  </div>
                  
                  {profileEditing && (
                    <button type="submit" className="btn btn-primary px-4 mt-2">
                      Save Profile
                    </button>
                  )}
                </form>
              </div>
            )}

            {/* 2. ORDERS PANEL */}
            {activeTab === 'orders' && (
              <div>
                <h4 className="text-light mb-3">Order History</h4>
                
                <div className="input-group mb-3">
                  <input 
                    type="text" 
                    value={orderQuery}
                    onChange={(e) => setOrderQuery(e.target.value)}
                    className="form-control" 
                    placeholder="Search by Order ID or Name…" 
                    style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                  />
                </div>

                {ordersLoading ? (
                  <p className="text-muted">Loading orders…</p>
                ) : filteredOrders.length === 0 ? (
                  <p className="text-muted small">No matching orders found.</p>
                ) : (
                  filteredOrders.map(o => (
                    <div key={o.orderId} className="card mb-3 p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong className="text-primary" style={{ fontSize: '0.9rem' }}>#ORD-{o.orderId}</strong>
                        <span className={`badge-order ${o.status}`}>{o.status}</span>
                      </div>
                      <div className="small text-secondary mb-1">
                        Placed on: {new Date(o.orderDate || Date.now()).toLocaleDateString('en-IN')}
                      </div>
                      <div className="small text-secondary mb-2">
                        Payment: {o.paymentMethod}
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <strong className="text-light" style={{ fontSize: '1rem' }}>₹{o.totalAmount}</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. ADDRESSES PANEL */}
            {activeTab === 'addresses' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="text-light mb-0">Manage Addresses</h4>
                  <button 
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="btn btn-sm btn-primary"
                  >
                    {showAddressForm ? 'Cancel' : '➕ Add Address'}
                  </button>
                </div>

                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="mb-4 p-3 border rounded bg-dark" style={{ borderColor: 'var(--border)' }}>
                    <div className="row">
                      <div className="col-md-6 form-group">
                        <input 
                          type="text" 
                          value={addrName}
                          onChange={(e) => setAddrName(e.target.value)}
                          placeholder="Contact Name *" 
                          className="form-control"
                          required
                          style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                        />
                      </div>
                      <div className="col-md-6 form-group">
                        <input 
                          type="tel" 
                          value={addrPhone}
                          onChange={(e) => setAddrPhone(e.target.value)}
                          placeholder="Phone Number" 
                          className="form-control"
                          style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <input 
                        type="text" 
                        value={addrLine}
                        onChange={(e) => setAddrLine(e.target.value)}
                        placeholder="House / Street / Address Line 1 *" 
                        className="form-control"
                        required
                        style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-6 form-group">
                        <input 
                          type="text" 
                          value={addrArea}
                          onChange={(e) => setAddrArea(e.target.value)}
                          placeholder="Area / Colony" 
                          className="form-control"
                          style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                        />
                      </div>
                      <div className="col-md-6 form-group">
                        <input 
                          type="text" 
                          value={addrLandmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="Landmark (Optional)" 
                          className="form-control"
                          style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-4 form-group">
                        <input 
                          type="text" 
                          value={addrCity}
                          onChange={(e) => setAddrCity(e.target.value)}
                          placeholder="City *" 
                          className="form-control"
                          required
                          style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                        />
                      </div>
                      <div className="col-md-4 form-group">
                        <input 
                          type="text" 
                          value={addrState}
                          onChange={(e) => setAddrState(e.target.value)}
                          placeholder="State *" 
                          className="form-control"
                          required
                          style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                        />
                      </div>
                      <div className="col-md-4 form-group">
                        <input 
                          type="text" 
                          value={addrPin}
                          onChange={(e) => setAddrPin(e.target.value)}
                          placeholder="Pincode *" 
                          className="form-control"
                          required
                          style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-success btn-sm">Save Address</button>
                  </form>
                )}

                {addresses.length === 0 ? (
                  <p className="text-muted small">No saved addresses yet.</p>
                ) : (
                  addresses.map((a, i) => (
                    <div key={i} className="acct-address-card mb-3" style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                      <div className="acct-address-tag" style={{ background: i === 0 ? '#d1fae5' : '#374151', color: i === 0 ? '#065f46' : '#fff' }}>
                        {i === 0 ? 'DEFAULT' : 'HOME'}
                      </div>
                      <div className="acct-address-name text-light font-weight-bold">{a.name} {a.phone ? `| ${a.phone}` : ''}</div>
                      <div className="acct-address-line text-secondary mt-1">
                        {a.line}, {a.area ? a.area + ', ' : ''} {a.landmark ? a.landmark + ', ' : ''} {a.city}, {a.state} - {a.pincode}
                      </div>
                      <div className="mt-3">
                        {i !== 0 && (
                          <button onClick={() => setDefaultAddress(i)} className="btn btn-sm btn-outline-success mr-2 py-0">Set as Default</button>
                        )}
                        <button onClick={() => removeAddress(i)} className="btn btn-sm btn-outline-danger py-0">Remove</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. WISHLIST PANEL */}
            {activeTab === 'wishlist' && (
              <div>
                <h4 className="text-light mb-3">My Wishlist</h4>
                {wishlist.length === 0 ? (
                  <p className="text-muted small">No items saved in wishlist yet.</p>
                ) : (
                  <div className="row">
                    {wishlist.map(p => (
                      <div key={p.id} className="col-6 col-md-3 mb-4">
                        <div className="card h-100" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                          <div style={{ position: 'relative' }}>
                            <img 
                              src={p.image || 'images/shirt.jpg'} 
                              className="card-img-top" 
                              style={{ height: '150px', objectFit: 'cover' }}
                              alt={p.name}
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=?'; }}
                            />
                            <button 
                              onClick={() => removeWishlist(p.id)}
                              style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '1rem', cursor: 'pointer' }}
                            >
                              ❤️
                            </button>
                          </div>
                          <div className="card-body p-2">
                            <h6 className="mb-1 text-light small text-truncate">{p.name}</h6>
                            <p className="text-primary mb-2 font-weight-bold" style={{ fontSize: '0.85rem' }}>₹{p.price}</p>
                            <Link to={`/product/${p.id}`} className="btn btn-primary btn-sm btn-block py-0" style={{ fontSize: '0.75rem' }}>View</Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. APP SETTINGS */}
            {activeTab === 'app-settings' && (
              <div>
                <h4 className="text-light mb-3">App Settings</h4>
                <div className="form-group mb-4">
                  <label className="text-secondary small">🎨 Choose Theme Profile</label>
                  <select 
                    value={currentTheme}
                    onChange={(e) => handleThemeChange(e.target.value)}
                    className="form-control"
                    style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)', maxWidth: '200px' }}
                  >
                    <option value="turquoise">Turquoise (System)</option>
                    <option value="indigo">Indigo Glow</option>
                    <option value="dark">AMOLED Dark</option>
                    <option value="purple">Royal Purple</option>
                  </select>
                </div>

                <div className="form-group">
                  <div className="custom-control custom-switch mb-3">
                    <input 
                      type="checkbox" 
                      className="custom-control-input" 
                      id="biometricToggle" 
                      checked={biometric}
                      onChange={(e) => {
                        setBiometric(e.target.checked);
                        localStorage.setItem('karunada_app_biometric', e.target.checked ? 'true' : 'false');
                        showToast(e.target.checked ? '🔐 Biometric logins enabled!' : '🔓 Biometrics deactivated', 'info');
                      }}
                    />
                    <label className="custom-control-label text-light" htmlFor="biometricToggle">Simulate Biometric FaceID/TouchID</label>
                  </div>
                  <div className="custom-control custom-switch mb-3">
                    <input 
                      type="checkbox" 
                      className="custom-control-input" 
                      id="notifyToggle" 
                      checked={notifications}
                      onChange={(e) => {
                        setNotifications(e.target.checked);
                        localStorage.setItem('karunada_app_notify', e.target.checked ? 'true' : 'false');
                        showToast(e.target.checked ? '🔔 Push notifications activated!' : '🔕 Notifications deactivated', 'info');
                      }}
                    />
                    <label className="custom-control-label text-light" htmlFor="notifyToggle">Enable Simulated Push Notifications</label>
                  </div>
                  <div className="custom-control custom-switch mb-3">
                    <input 
                      type="checkbox" 
                      className="custom-control-input" 
                      id="immersiveToggle" 
                      checked={immersive}
                      onChange={(e) => {
                        setImmersive(e.target.checked);
                        localStorage.setItem('karunada_app_immersive', e.target.checked ? 'true' : 'false');
                        showToast(e.target.checked ? '📱 Immersive layout active' : '📱 Standard layout active', 'info');
                      }}
                    />
                    <label className="custom-control-label text-light" htmlFor="immersiveToggle">Enable Fullscreen App Experience</label>
                  </div>
                </div>
              </div>
            )}

            {/* 6. ORDER CONFIRM */}
            {activeTab === 'order-confirm' && (
              <div>
                {!confirmOrder ? (
                  <p className="text-muted">Loading order confirmation details…</p>
                ) : (
                  <div>
                    <div className="oc-hero text-center py-4 mb-4" style={{ background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div className="oc-hero__checkmark m-auto rounded-circle d-flex align-items-center justify-content-center bg-success text-white font-weight-bold mb-2" style={{ width: '50px', height: '50px', fontSize: '1.8rem' }}>✓</div>
                      <h3 className="oc-hero__title text-success font-weight-bold">Order Confirmed!</h3>
                      <p className="oc-hero__sub text-secondary small">Thank you for shopping with Karunadu Collections</p>
                      <div className="oc-hero__id text-primary font-weight-bold" style={{ fontSize: '1.1rem' }}>#ORD-{confirmOrder.orderId || confirmOrder.id}</div>
                    </div>

                    <div className="oc-card mb-4 p-3" style={{ background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div className="oc-card__hdr d-flex justify-content-between align-items-center mb-3">
                        <strong className="text-light">🛍️ Items Ordered</strong>
                        <span className="badge badge-success px-2 py-1">{confirmOrder.status}</span>
                      </div>
                      
                      <div className="oc-items">
                        {(confirmOrder.items || []).map((item, idx) => (
                          <div key={idx} className="d-flex align-items-center justify-content-between py-2 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                            <div className="d-flex align-items-center">
                              <img 
                                src={item.image || 'images/shirt.jpg'} 
                                alt={item.name} 
                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                className="mr-3"
                              />
                              <div>
                                <div className="text-light small font-weight-bold">{item.name}</div>
                                <div className="text-secondary" style={{ fontSize: '0.72rem' }}>Size: {item.size} · Qty: {item.quantity}</div>
                              </div>
                            </div>
                            <strong className="text-light small">₹{item.price * item.quantity}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="oc-card p-3" style={{ background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div className="oc-card__hdr mb-3 text-light">💰 Summary Details</div>
                      <div className="d-flex justify-content-between mb-2 small text-secondary">
                        <span>GST Charged</span>
                        <span>₹{confirmOrder.gst || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2 small text-secondary">
                        <span>Delivery shipping</span>
                        <span>{confirmOrder.shippingCost > 0 ? `₹${confirmOrder.shippingCost}` : 'Free'}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-3 text-light font-weight-bold border-top pt-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <span>Paid Total</span>
                        <strong className="text-success">₹{confirmOrder.totalAmount || confirmOrder.total}</strong>
                      </div>
                      <div className="small text-secondary pt-1 border-top" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        Paid Mode: <strong>{confirmOrder.paymentMethod}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
