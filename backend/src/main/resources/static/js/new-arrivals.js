// New Arrivals page — shows products marked isNew or category "New Collection"
document.addEventListener('DOMContentLoaded', async function () {
    let catalogue = products;

    try {
        const bp = await apiGetProducts();
        if (bp && bp.length > 0) {
            catalogue = bp.map(p => ({
                id:          p.productId,
                name:        p.productName,
                price:       p.price,
                size:        p.size,
                color:       p.color,
                category:    p.category,
                description: p.description,
                image:       p.imageUrl || 'images/shirt.jpg',
                isNew:       p.category === 'New Collection',
                discount:    0
            }));
        }
    } catch (e) {
        console.warn('Backend offline — using local data');
    }

    // Filter new arrivals: isNew flag OR "New Collection" category
    const newItems = catalogue.filter(p => p.isNew || p.category === 'New Collection');

    const container  = document.getElementById('newArrivalsList');
    const countBadge = document.getElementById('arrivalCount');

    if (countBadge) countBadge.textContent = newItems.length + ' Items';

    if (!container) return;

    if (newItems.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <span style="font-size:3rem;">🛍️</span>
                <h4 class="mt-3 text-muted">No new arrivals right now</h4>
                <a href="shop.html" class="btn btn-primary mt-2">Browse All Products</a>
            </div>`;
        return;
    }

    container.innerHTML = newItems.map(p => `
        <div class="col-md-3 mb-4">
            <div class="card h-100">
                <span class="new-badge">NEW</span>
                <img src="${p.image}" class="card-img-top" alt="${p.name}"
                     style="height:200px;object-fit:cover;"
                     onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${p.name}</h5>
                    <p class="card-text text-muted small">${p.category}</p>
                    <p class="card-text">
                        <span class="font-weight-bold text-primary">₹${p.price}</span>
                    </p>
                    <p class="card-text small text-muted">${p.description || ''}</p>
                    <div class="mt-auto">
                        <a href="product.html?id=${p.id}" class="btn btn-primary btn-sm">View</a>
                        <button class="btn btn-success btn-sm ml-1"
                                onclick='addToCart(${JSON.stringify({id:p.id,name:p.name,price:p.price,image:p.image})});alert("Added to cart!")'>
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>`).join('');
});
