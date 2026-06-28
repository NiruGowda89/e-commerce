import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  apiGetProducts, 
  apiAddProduct, 
  apiDeleteProduct, 
  apiGetAllOrders, 
  apiUpdateOrderStatus,
  apiGetAllCoupons,
  apiCreateCoupon,
  apiDeleteCoupon
} from '../api';

export default function AdminDashboard({ user, showToast }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('products');

  // Products state
  const [products, setProducts] = useState([]);
  const [loadingProds, setLoadingProds] = useState(false);
  const [prodSearch, setProdSearch] = useState('');

  // Product Form State
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodBrand, setProdBrand] = useState('Karunada');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodSize, setProdSize] = useState('S,M,L,XL');
  const [prodColor, setProdColor] = useState('Blue,Black,White');
  const [prodImg, setProdImg] = useState('');
  const [prodDesc, setProdDesc] = useState('');

  // Orders state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');

  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [cpCode, setCpCode] = useState('');
  const [cpPercent, setCpPercent] = useState('');
  const [cpAmount, setCpAmount] = useState('');
  const [cpMinOrder, setCpMinOrder] = useState('');

  // Security Gate
  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      showToast('Access denied: admin credentials required', 'error');
      navigate('/login');
    }
  }, [user]);

  // Lazy-load active tab contents
  useEffect(() => {
    if (activeTab === 'products') loadProducts();
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'coupons') loadCoupons();
  }, [activeTab]);

  const loadProducts = async () => {
    setLoadingProds(true);
    try {
      const data = await apiGetProducts();
      setProducts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProds(false);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await apiGetAllOrders();
      setOrders(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const data = await apiGetAllCoupons();
      setCoupons(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Product CRUD Handlers
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodStock) {
      showToast('Name, Price, and Stock fields are mandatory', 'warning');
      return;
    }
    const payload = {
      productName: prodName,
      category: prodCategory,
      brand: prodBrand,
      price: Number(prodPrice),
      stock: parseInt(prodStock, 10),
      size: prodSize,
      color: prodColor,
      imageUrl: prodImg || 'images/shirt.jpg',
      description: prodDesc
    };

    try {
      await apiAddProduct(payload);
      showToast('Product added successfully!', 'success');
      setProdName('');
      setProdCategory('');
      setProdPrice('');
      setProdStock('');
      setProdImg('');
      setProdDesc('');
      loadProducts();
    } catch (err) {
      showToast('Failed to add product', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await apiDeleteProduct(id);
      showToast('Product deleted', 'info');
      loadProducts();
    } catch (err) {
      showToast('Failed to delete product', 'error');
    }
  };

  // Orders status changer
  const handleStatusChange = async (id, status) => {
    try {
      await apiUpdateOrderStatus(id, status);
      showToast(`Order #${id} updated to ${status}`, 'success');
      loadOrders();
    } catch (e) {
      showToast('Failed to update status', 'error');
    }
  };

  // Coupon CRUD Handlers
  const handleAddCoupon = async (e) => {
    e.preventDefault();
    if (!cpCode) return;
    const payload = {
      code: cpCode.toUpperCase(),
      discountPercent: cpPercent ? Number(cpPercent) : null,
      discountAmount: cpAmount ? Number(cpAmount) : null,
      minOrderAmount: cpMinOrder ? Number(cpMinOrder) : 0,
      active: true
    };
    try {
      await apiCreateCoupon(payload);
      showToast('Coupon code created!', 'success');
      setCpCode('');
      setCpPercent('');
      setCpAmount('');
      setCpMinOrder('');
      loadCoupons();
    } catch (err) {
      showToast('Failed to create coupon', 'error');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await apiDeleteCoupon(id);
      showToast('Coupon code deleted', 'info');
      loadCoupons();
    } catch (err) {
      showToast('Failed to delete coupon', 'error');
    }
  };

  const filteredProducts = products.filter(p => 
    (p.productName || p.name || '').toLowerCase().includes(prodSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    String(o.orderId || o.id).toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.customerName || '').toLowerCase().includes(orderSearch.toLowerCase())
  );

  return (
    <div className="container-fluid px-4 mt-4 mb-5">
      <div className="row">
        {/* Navigation Sidebar */}
        <div className="col-md-3 col-lg-2 mb-4">
          <h4 className="text-light mb-3">Admin Portal</h4>
          <div className="list-group" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <button 
              onClick={() => setActiveTab('products')} 
              className={`list-group-item list-group-item-action ${activeTab === 'products' ? 'active' : ''}`}
              style={{ background: activeTab === 'products' ? 'var(--accent)' : 'var(--bg-surface)', color: '#fff', border: '1px solid var(--border)' }}
            >
              👕 Products Catalog
            </button>
            <button 
              onClick={() => setActiveTab('orders')} 
              className={`list-group-item list-group-item-action ${activeTab === 'orders' ? 'active' : ''}`}
              style={{ background: activeTab === 'orders' ? 'var(--accent)' : 'var(--bg-surface)', color: '#fff', border: '1px solid var(--border)' }}
            >
              📦 Order History
            </button>
            <button 
              onClick={() => setActiveTab('coupons')} 
              className={`list-group-item list-group-item-action ${activeTab === 'coupons' ? 'active' : ''}`}
              style={{ background: activeTab === 'coupons' ? 'var(--accent)' : 'var(--bg-surface)', color: '#fff', border: '1px solid var(--border)' }}
            >
              🏷️ Coupon Codes
            </button>
          </div>
        </div>

        {/* Console view area */}
        <div className="col-md-9 col-lg-10">
          <div className="card p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', minHeight: '500px' }}>
            
            {/* 1. PRODUCTS TAB */}
            {activeTab === 'products' && (
              <div>
                <h4 className="text-light mb-4">Products Catalog</h4>
                
                {/* Form to Add Product */}
                <form onSubmit={handleAddProduct} className="p-3 mb-4 border rounded bg-dark" style={{ borderColor: 'var(--border)' }}>
                  <h6 className="text-light mb-3">➕ Add New Product</h6>
                  <div className="row">
                    <div className="col-md-6 form-group">
                      <input 
                        type="text" 
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        placeholder="Product Name *" 
                        className="form-control"
                        required
                        style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div className="col-md-6 form-group">
                      <input 
                        type="text" 
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        placeholder="Category (e.g. Shirts, Jeans)" 
                        className="form-control"
                        style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 form-group">
                      <input 
                        type="number" 
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        placeholder="Price (₹) *" 
                        className="form-control"
                        required
                        style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div className="col-md-4 form-group">
                      <input 
                        type="number" 
                        value={prodStock}
                        onChange={(e) => setProdStock(e.target.value)}
                        placeholder="Stock Quantity *" 
                        className="form-control"
                        required
                        style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div className="col-md-4 form-group">
                      <input 
                        type="text" 
                        value={prodBrand}
                        onChange={(e) => setProdBrand(e.target.value)}
                        placeholder="Brand Name" 
                        className="form-control"
                        style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 form-group">
                      <input 
                        type="text" 
                        value={prodImg}
                        onChange={(e) => setProdImg(e.target.value)}
                        placeholder="Image URL (e.g. images/shirt.jpg)" 
                        className="form-control"
                        style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div className="col-md-3 form-group">
                      <input 
                        type="text" 
                        value={prodSize}
                        onChange={(e) => setProdSize(e.target.value)}
                        placeholder="Sizes (Comma separated)" 
                        className="form-control"
                        style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div className="col-md-3 form-group">
                      <input 
                        type="text" 
                        value={prodColor}
                        onChange={(e) => setProdColor(e.target.value)}
                        placeholder="Colors (Comma separated)" 
                        className="form-control"
                        style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <textarea 
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      placeholder="Product description…" 
                      className="form-control"
                      rows="2"
                      style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-success btn-sm">Add Product</button>
                </form>

                {/* Catalog Listing */}
                <input 
                  type="text" 
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  placeholder="🔍 Search products by name…" 
                  className="form-control mb-3"
                  style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                />

                {loadingProds ? (
                  <p className="text-muted">Loading items…</p>
                ) : (
                  <table className="table table-dark table-striped small">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(p => (
                        <tr key={p.productId || p.id}>
                          <td>{p.productId || p.id}</td>
                          <td className="font-weight-bold text-light">{p.productName || p.name}</td>
                          <td>{p.category}</td>
                          <td className="text-primary">₹{p.price}</td>
                          <td>
                            {p.stock === 0 ? (
                              <span className="text-danger font-weight-bold">Out of stock</span>
                            ) : p.stock < 10 ? (
                              <span className="text-warning">{p.stock} (Low)</span>
                            ) : (
                              <span className="text-success">{p.stock}</span>
                            )}
                          </td>
                          <td>
                            <button 
                              onClick={() => handleDeleteProduct(p.productId || p.id)}
                              className="btn btn-sm btn-danger py-0 px-2"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 2. ORDERS TAB */}
            {activeTab === 'orders' && (
              <div>
                <h4 className="text-light mb-3">Order History Management</h4>
                <input 
                  type="text" 
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="🔍 Search order by ID or customer name…" 
                  className="form-control mb-3"
                  style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                />

                {loadingOrders ? (
                  <p className="text-muted">Loading orders…</p>
                ) : (
                  <table className="table table-dark table-striped small">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Total Amount</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(o => (
                        <tr key={o.orderId || o.id}>
                          <td className="text-primary font-weight-bold">#ORD-{o.orderId || o.id}</td>
                          <td>
                            <div className="text-light font-weight-bold">{o.customerName}</div>
                            <div className="text-secondary" style={{ fontSize: '0.72rem' }}>{o.email}</div>
                          </td>
                          <td>₹{o.totalAmount}</td>
                          <td className="small text-secondary">{o.paymentMethod}</td>
                          <td>
                            <span className={`badge-order ${o.status}`}>{o.status}</span>
                          </td>
                          <td>
                            <select 
                              value={o.status}
                              onChange={(e) => handleStatusChange(o.orderId || o.id, e.target.value)}
                              className="form-control form-control-sm py-0"
                              style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)', width: '120px' }}
                            >
                              {['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 3. COUPONS TAB */}
            {activeTab === 'coupons' && (
              <div>
                <h4 className="text-light mb-4">Promo Coupons Management</h4>
                
                <form onSubmit={handleAddCoupon} className="p-3 mb-4 border rounded bg-dark" style={{ borderColor: 'var(--border)' }}>
                  <h6 className="text-light mb-3">➕ Generate New Coupon</h6>
                  <div className="row">
                    <div className="col-md-3 form-group">
                      <input 
                        type="text" 
                        value={cpCode}
                        onChange={(e) => setCpCode(e.target.value)}
                        placeholder="Coupon Code *" 
                        className="form-control"
                        required
                        style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div className="col-md-3 form-group">
                      <input 
                        type="number" 
                        value={cpPercent}
                        onChange={(e) => setCpPercent(e.target.value)}
                        placeholder="Discount Percent (%)" 
                        className="form-control"
                        style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div className="col-md-3 form-group">
                      <input 
                        type="number" 
                        value={cpAmount}
                        onChange={(e) => setCpAmount(e.target.value)}
                        placeholder="Flat Amount (₹)" 
                        className="form-control"
                        style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div className="col-md-3 form-group">
                      <input 
                        type="number" 
                        value={cpMinOrder}
                        onChange={(e) => setCpMinOrder(e.target.value)}
                        placeholder="Min Order Amount (₹)" 
                        className="form-control"
                        style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-success btn-sm">Create Coupon</button>
                </form>

                {loadingCoupons ? (
                  <p className="text-muted">Loading coupons…</p>
                ) : (
                  <table className="table table-dark table-striped small">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Reduction</th>
                        <th>Min Order</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map(c => (
                        <tr key={c.couponId || c.id}>
                          <td className="text-warning font-weight-bold">{c.code}</td>
                          <td>
                            {c.discountPercent ? `${c.discountPercent}%` : c.discountAmount ? `₹${c.discountAmount}` : '—'}
                          </td>
                          <td>₹{c.minOrderAmount || 0}</td>
                          <td>
                            <span className={`badge-status ${c.active ? 'active' : 'inactive'}`}>
                              {c.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <button 
                              onClick={() => handleDeleteCoupon(c.couponId || c.id)}
                              className="btn btn-sm btn-danger py-0 px-2"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
