// Admin page — loads products/orders from backend, falls back to local
const ORDERS_KEY = 'urbanManOrders';

document.addEventListener('DOMContentLoaded', async function () {
    // Show admin name in navbar
    const admin = typeof getAdmin === 'function' ? getAdmin() : null;
    const nameEl = document.getElementById('adminNameDisplay');
    if (nameEl && admin) nameEl.textContent = '👤 ' + admin.name;

    await loadAdminProducts();
    loadAdminOrders();

    // Coupon tab
    const couponTabEl = document.querySelector('a[href="#coupons"]');
    if (couponTabEl) couponTabEl.addEventListener('click', loadCoupons);

    // Add coupon form
    const couponForm = document.getElementById('addCouponForm');
    if (couponForm) {
        couponForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const coupon = {
                code:            document.getElementById('couponCode').value.trim().toUpperCase(),
                discountPercent: document.getElementById('couponPercent').value || null,
                discountAmount:  document.getElementById('couponAmount').value  || null,
                minOrderAmount:  document.getElementById('couponMinOrder').value || 0,
                active: true
            };
            if (!coupon.discountPercent && !coupon.discountAmount) {
                alert('Enter either a % discount or flat discount amount.'); return;
            }
            try {
                await fetch(API_BASE + '/coupons', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(coupon)
                });
                alert('Coupon ' + coupon.code + ' created!');
                couponForm.reset();
                loadCoupons();
            } catch(e) {
                alert('Could not save coupon — backend unreachable.');
            }
        });
    }

    document.getElementById('addProductForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const newProduct = {
            productName: document.getElementById('productName').value.trim(),
            category:    document.getElementById('category').value,
            brand:       document.getElementById('brand').value.trim(),
            price:       parseFloat(document.getElementById('price').value),
            size:        document.getElementById('size').value.trim(),
            color:       document.getElementById('color').value.trim(),
            stock:       parseInt(document.getElementById('stock').value),
            imageUrl:    document.getElementById('imageUrl').value.trim() || 'images/shirt.jpg',
            description: document.getElementById('description').value.trim()
        };

        try {
            await apiAddProduct(newProduct);
            alert('Product added successfully!');
        } catch (err) {
            alert('Backend offline — product not saved to server.');
        }

        this.reset();
        await loadAdminProducts();
    });
});

async function loadAdminProducts() {
    const tbody = document.getElementById('productTable');
    if (!tbody) return;

    let list = products; // fallback

    try {
        const backendProducts = await apiGetProducts();
        if (backendProducts && backendProducts.length > 0) {
            list = backendProducts.map(p => ({
                id:       p.productId,
                name:     p.productName,
                category: p.category,
                price:    p.price
            }));
        }
    } catch (e) {
        console.warn('Backend offline — showing local products');
    }

    tbody.innerHTML = list.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>₹${p.price}</td>
            <td>
                <a href="product.html?id=${p.id}" class="btn btn-info btn-sm">View</a>
                <button class="btn btn-danger btn-sm ml-1"
                        onclick="confirmDelete(${p.id}, '${p.name}')">Delete</button>
            </td>
        </tr>`).join('');

    // Update reports count
    const totalEl = document.getElementById('totalProducts');
    if (totalEl) totalEl.textContent = list.length;
}

function loadAdminOrders() {
    const tbody = document.getElementById('orderTable');
    if (!tbody) return;

    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No orders yet</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(o => `
        <tr>
            <td><small>${o.id}</small></td>
            <td>
                <strong>${o.customerName || 'Guest'}</strong><br>
                <small class="text-muted">${o.phone || ''}</small><br>
                <small class="text-muted">${o.shippingAddress || ''}, ${o.city || ''}</small>
            </td>
            <td>
                <span class="badge badge-${statusColor(o.status)}">${o.status}</span><br>
                <small class="text-muted">₹${o.total}</small>
            </td>
            <td>
                <select class="form-control form-control-sm status-select" 
                        data-order-id="${o.id}" style="min-width:120px;">
                    <option value="Pending"   ${o.status==='Pending'   ? 'selected':''}>Pending</option>
                    <option value="Confirmed" ${o.status==='Confirmed' ? 'selected':''}>Confirmed</option>
                    <option value="Shipped"   ${o.status==='Shipped'   ? 'selected':''}>Shipped</option>
                    <option value="Delivered" ${o.status==='Delivered' ? 'selected':''}>Delivered</option>
                    <option value="Cancelled" ${o.status==='Cancelled' ? 'selected':''}>Cancelled</option>
                </select>
                <button class="btn btn-success btn-sm mt-1 w-100"
                        onclick="updateOrderStatus('${o.id}')">Update</button>
            </td>
        </tr>`).join('');
}

function statusColor(s) {
    return { Pending:'warning', Confirmed:'info', Shipped:'primary', Delivered:'success', Cancelled:'danger' }[s] || 'secondary';
}

async function confirmDelete(id, name) {
    if (!confirm('Delete "' + name + '"?')) return;

    try {
        await apiDeleteProduct(id);
        alert(name + ' deleted.');
    } catch {
        alert('Backend offline — cannot delete from server.');
    }

    await loadAdminProducts();
}

// Update order status from admin panel
function updateOrderStatus(orderId) {
    const select = document.querySelector(`.status-select[data-order-id="${orderId}"]`);
    if (!select) return;

    const newStatus = select.value;
    const orders    = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const order     = orders.find(o => o.id === orderId);
    if (!order) return;

    order.status = newStatus;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    // Try to update backend too (non-blocking)
    if (order.backendId) {
        apiUpdateOrderStatus(order.backendId, newStatus).catch(() => {});
    }

    alert(`Order ${orderId} updated to "${newStatus}"`);
    loadAdminOrders();
}

// ─── Reports ──────────────────────────────────────────────────────────────────
async function loadReports() {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');

    const totalOrders = orders.length;
    const revenue     = orders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
    const pending     = orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed').length;

    const el = (id) => document.getElementById(id);
    if (el('rptTotalOrders')) el('rptTotalOrders').textContent = totalOrders;
    if (el('rptRevenue'))     el('rptRevenue').textContent     = '₹' + revenue.toFixed(0);
    if (el('rptPending'))     el('rptPending').textContent     = pending;

    // Total products
    try {
        const prods = await apiGetProducts();
        if (el('rptProducts')) el('rptProducts').textContent = prods.length;
        if (el('totalProducts')) el('totalProducts').textContent = prods.length;
    } catch(e) {}

    // Recent orders table
    const recentTbl = el('recentOrdersTable');
    if (recentTbl) {
        const recent = [...orders].slice(0, 10);
        recentTbl.innerHTML = recent.length === 0
            ? '<tr><td colspan="5" class="text-center text-muted">No orders yet</td></tr>'
            : recent.map(o => `<tr>
                <td><small>${o.id}</small></td>
                <td>${o.customerName || 'Guest'}</td>
                <td>₹${o.total}</td>
                <td><span class="badge badge-${statusColor(o.status)}">${o.status}</span></td>
                <td><small>${o.placedAt ? new Date(o.placedAt).toLocaleDateString('en-IN') : '-'}</small></td>
              </tr>`).join('');
    }

    // Top products
    const productCount = {};
    orders.forEach(o => {
        (o.items || []).forEach(item => {
            productCount[item.name] = (productCount[item.name] || 0) + item.quantity;
        });
    });
    const sorted = Object.entries(productCount).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const chartEl = el('topProductsChart');
    if (chartEl) {
        if (sorted.length === 0) {
            chartEl.innerHTML = '<p class="text-muted">No order data yet.</p>';
        } else {
            const max = sorted[0][1];
            chartEl.innerHTML = sorted.map(([name, count]) => `
                <div class="mb-2">
                    <div class="d-flex justify-content-between mb-1">
                        <span>${name}</span><strong>${count} sold</strong>
                    </div>
                    <div class="progress" style="height:20px;">
                        <div class="progress-bar bg-success" style="width:${Math.round(count/max*100)}%">${count}</div>
                    </div>
                </div>`).join('');
        }
    }
}

// Load reports when tab is clicked
document.addEventListener('DOMContentLoaded', function() {
    const reportsTab = document.querySelector('a[href="#reports"]');
    if (reportsTab) reportsTab.addEventListener('click', loadReports);
});

// ─── Coupon Management ────────────────────────────────────────────────────────
async function loadCoupons() {
    try {
        const res = await fetch(API_BASE + '/coupons');
        const coupons = await res.json();
        const tbody = document.getElementById('couponTable');
        if (!tbody) return;
        tbody.innerHTML = coupons.length === 0
            ? '<tr><td colspan="5" class="text-center text-muted">No coupons</td></tr>'
            : coupons.map(c => `<tr>
                <td><strong>${c.code}</strong></td>
                <td>${c.discountPercent ? c.discountPercent + '%' : '₹' + c.discountAmount}</td>
                <td>₹${c.minOrderAmount || 0}</td>
                <td><span class="badge badge-${c.active ? 'success' : 'secondary'}">${c.active ? 'Active' : 'Inactive'}</span></td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteCoupon(${c.couponId})">Delete</button></td>
              </tr>`).join('');
    } catch(e) { console.warn('Could not load coupons'); }
}

async function deleteCoupon(id) {
    if (!confirm('Delete this coupon?')) return;
    await fetch(API_BASE + '/coupons/' + id, { method: 'DELETE' });
    loadCoupons();
}
