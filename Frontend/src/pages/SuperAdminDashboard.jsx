import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  apiGetAllOrders, 
  apiGetProducts, 
  apiGetUsers, 
  apiToggleUserStatus, 
  apiUpdateUserRole,
  apiUpdateUserRoleByEmail,
  apiUpdateOrderStatus,
  apiDeleteProduct,
  apiGetAllCoupons,
  apiCreateCoupon,
  apiDeleteCoupon
} from '../api';

export default function SuperAdminDashboard({ user, showToast }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');

  // Database lists
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);

  // Loaders
  const [loading, setLoading] = useState(false);

  // Promoting form states
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoteRole, setPromoteRole] = useState('ADMIN');

  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Security gate: super admin check
  useEffect(() => {
    if (!user || user.role !== 'SUPER_ADMIN') {
      showToast('Access denied: super admin credentials required', 'error');
      navigate('/login');
    }
  }, [user]);

  // Load database lists on mount / tab change
  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [ord, prod, usr, cp] = await Promise.all([
        apiGetAllOrders().catch(() => []),
        apiGetProducts().catch(() => []),
        apiGetUsers().catch(() => []),
        apiGetAllCoupons().catch(() => [])
      ]);
      setOrders(ord || []);
      setProducts(prod || []);
      setUsers(usr || []);
      setCoupons(cp || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;

  // Toggle user active status
  const handleToggleUserStatus = async (id, active) => {
    try {
      await apiToggleUserStatus(id, active);
      showToast(`User ${active ? 'activated' : 'deactivated'} successfully!`, 'success');
      loadAllData();
    } catch (e) {
      showToast('Failed to update status', 'error');
    }
  };

  // Demote Admin to USER
  const handleRevokeAdmin = async (id) => {
    if (!window.confirm('Demote this admin to standard USER role?')) return;
    try {
      await apiUpdateUserRole(id, 'USER');
      showToast('Admin demoted to USER successfully!', 'success');
      loadAllData();
    } catch (e) {
      showToast('Failed to change user role', 'error');
    }
  };

  // Promote User to Admin
  const handlePromoteUser = async (e) => {
    e.preventDefault();
    if (!promoteEmail) return;

    try {
      await apiUpdateUserRoleByEmail(promoteEmail, promoteRole);
      showToast(`Role updated successfully for ${promoteEmail}!`, 'success');
      setPromoteEmail('');
      loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  // Order status management
  const handleOrderStatusChange = async (id, status) => {
    try {
      await apiUpdateOrderStatus(id, status);
      showToast(`Order #${id} → ${status}`, 'success');
      loadAllData();
    } catch (e) {
      showToast('Failed to update status', 'error');
    }
  };

  // Filters
  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    const matchesQuery = !q || 
      (u.name || '').toLowerCase().includes(q) || 
      (u.email || '').toLowerCase().includes(q);
    const matchesRole = !userRoleFilter || u.role === userRoleFilter;
    return matchesQuery && matchesRole;
  });

  const filteredOrders = orders.filter(o => 
    String(o.orderId || o.id).toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.customerName || '').toLowerCase().includes(orderSearch.toLowerCase())
  );

  return (
    <div className="container-fluid px-4 mt-4 mb-5">
      <div className="row">
        {/* Navigation Sidebar */}
        <div className="col-md-3 col-lg-2 mb-4">
          <h4 className="text-light mb-3">Super Admin</h4>
          <div className="list-group" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`list-group-item list-group-item-action ${activeTab === 'dashboard' ? 'active' : ''}`}
              style={{ background: activeTab === 'dashboard' ? 'var(--accent)' : 'var(--bg-surface)', color: '#fff', border: '1px solid var(--border)' }}
            >
              📊 Overview Stats
            </button>
            <button 
              onClick={() => setActiveTab('users')} 
              className={`list-group-item list-group-item-action ${activeTab === 'users' ? 'active' : ''}`}
              style={{ background: activeTab === 'users' ? 'var(--accent)' : 'var(--bg-surface)', color: '#fff', border: '1px solid var(--border)' }}
            >
              👥 Customer Users
            </button>
            <button 
              onClick={() => setActiveTab('admins')} 
              className={`list-group-item list-group-item-action ${activeTab === 'admins' ? 'active' : ''}`}
              style={{ background: activeTab === 'admins' ? 'var(--accent)' : 'var(--bg-surface)', color: '#fff', border: '1px solid var(--border)' }}
            >
              🛡️ Admin Roles
            </button>
            <button 
              onClick={() => setActiveTab('orders')} 
              className={`list-group-item list-group-item-action ${activeTab === 'orders' ? 'active' : ''}`}
              style={{ background: activeTab === 'orders' ? 'var(--accent)' : 'var(--bg-surface)', color: '#fff', border: '1px solid var(--border)' }}
            >
              📦 Order Logs
            </button>
          </div>
        </div>

        {/* Dashboard Console */}
        <div className="col-md-9 col-lg-10">
          <div className="card p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', minHeight: '500px' }}>
            
            {/* 1. OVERVIEW DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div>
                <h4 className="text-light mb-4">Operations Overview</h4>
                
                {/* KPI Grid */}
                <div className="row mb-4">
                  <div className="col-sm-6 col-md-3 mb-3">
                    <div className="p-3 border rounded text-center bg-dark" style={{ borderColor: 'var(--border)' }}>
                      <div className="text-muted small font-weight-bold">TOTAL ORDERS</div>
                      <div className="text-primary font-weight-bold mt-2" style={{ fontSize: '1.8rem' }}>{totalOrders}</div>
                    </div>
                  </div>
                  <div className="col-sm-6 col-md-3 mb-3">
                    <div className="p-3 border rounded text-center bg-dark" style={{ borderColor: 'var(--border)' }}>
                      <div className="text-muted small font-weight-bold">TOTAL REVENUE</div>
                      <div className="text-success font-weight-bold mt-2" style={{ fontSize: '1.6rem' }}>₹{totalRevenue.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div className="col-sm-6 col-md-3 mb-3">
                    <div className="p-3 border rounded text-center bg-dark" style={{ borderColor: 'var(--border)' }}>
                      <div className="text-muted small font-weight-bold">PENDING ORDERS</div>
                      <div className="text-warning font-weight-bold mt-2" style={{ fontSize: '1.8rem' }}>{pendingOrders}</div>
                    </div>
                  </div>
                  <div className="col-sm-6 col-md-3 mb-3">
                    <div className="p-3 border rounded text-center bg-dark" style={{ borderColor: 'var(--border)' }}>
                      <div className="text-muted small font-weight-bold">ACTIVE USERS</div>
                      <div className="text-info font-weight-bold mt-2" style={{ fontSize: '1.8rem' }}>{users.filter(u => u.active).length}</div>
                    </div>
                  </div>
                </div>

                <h5 className="text-light mb-3">Recent Orders Log</h5>
                <table className="table table-dark table-striped small">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(o => (
                      <tr key={o.orderId || o.id}>
                        <td className="text-primary font-weight-bold">#ORD-{o.orderId || o.id}</td>
                        <td className="font-weight-bold">{o.customerName}</td>
                        <td>₹{o.totalAmount}</td>
                        <td>
                          <span className={`badge-order ${o.status}`}>{o.status}</span>
                        </td>
                        <td className="text-secondary">{new Date(o.orderDate || Date.now()).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. CUSTOMERS TAB */}
            {activeTab === 'users' && (
              <div>
                <h4 className="text-light mb-4">Customer Accounts Directory</h4>
                
                <div className="row mb-3">
                  <div className="col-md-8 mb-2">
                    <input 
                      type="text" 
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="🔍 Search customers by name or email…" 
                      className="form-control"
                      style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                    />
                  </div>
                  <div className="col-md-4">
                    <select 
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="form-control"
                      style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                    >
                      <option value="">All Roles</option>
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPER_ADMIN">SUPER ADMIN</option>
                    </select>
                  </div>
                </div>

                <table className="table table-dark table-striped small">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.userId || u.id}>
                        <td>{u.userId || u.id}</td>
                        <td className="font-weight-bold text-light">{u.name}</td>
                        <td className="text-secondary">{u.email}</td>
                        <td>
                          <span className={`badge-role ${(u.role || 'user').toLowerCase()}`}>{u.role}</span>
                        </td>
                        <td>
                          <span className={`badge-status ${u.active ? 'active' : 'inactive'}`}>
                            {u.active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleToggleUserStatus(u.userId || u.id, !u.active)}
                            className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-success'} py-0 px-2`}
                            disabled={u.role === 'SUPER_ADMIN'}
                          >
                            {u.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. ADMIN PORTAL PROMOTIONS */}
            {activeTab === 'admins' && (
              <div>
                <h4 className="text-light mb-4">Manage Admin Roles</h4>
                
                {/* Promote Admin Form */}
                <form onSubmit={handlePromoteUser} className="p-3 mb-4 border rounded bg-dark" style={{ borderColor: 'var(--border)' }}>
                  <h6 className="text-light mb-3">🛡️ Promote User to Admin Role</h6>
                  <div className="row">
                    <div className="col-md-6 form-group">
                      <input 
                        type="email" 
                        value={promoteEmail}
                        onChange={(e) => setPromoteEmail(e.target.value)}
                        placeholder="User Email *" 
                        className="form-control"
                        required
                        style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div className="col-md-4 form-group">
                      <select 
                        value={promoteRole}
                        onChange={(e) => setPromoteRole(e.target.value)}
                        className="form-control"
                        style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER ADMIN</option>
                      </select>
                    </div>
                    <div className="col-md-2 form-group">
                      <button type="submit" className="btn btn-primary btn-block">Promote</button>
                    </div>
                  </div>
                </form>

                <h5 className="text-light mb-3">Admin Console Officers</h5>
                <table className="table table-dark table-striped small">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').map(u => (
                      <tr key={u.userId || u.id}>
                        <td>{u.userId || u.id}</td>
                        <td className="font-weight-bold text-light">{u.name}</td>
                        <td className="text-secondary">{u.email}</td>
                        <td>
                          <span className={`badge-role ${(u.role || 'user').toLowerCase()}`}>{u.role}</span>
                        </td>
                        <td>
                          {u.role !== 'SUPER_ADMIN' ? (
                            <button 
                              onClick={() => handleRevokeAdmin(u.userId || u.id)}
                              className="btn btn-sm btn-danger py-0 px-2"
                            >
                              Revoke Admin
                            </button>
                          ) : (
                            <span className="text-muted small">System Owner</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. ORDERS LOGS */}
            {activeTab === 'orders' && (
              <div>
                <h4 className="text-light mb-3">System Orders History Log</h4>
                <input 
                  type="text" 
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="🔍 Search order by ID or customer name…" 
                  className="form-control mb-3"
                  style={{ background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
                />

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
                            onChange={(e) => handleOrderStatusChange(o.orderId || o.id, e.target.value)}
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
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
