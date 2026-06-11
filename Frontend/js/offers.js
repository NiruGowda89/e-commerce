// Offers page — shows products with discount > 0
document.addEventListener('DOMContentLoaded', async function () {
    let catalogue = products;

    try {
        const bp = await apiGetProducts();
        if (bp && bp.length > 0) {
            catalogue = bp.map(p => ({
                id:            p.productId,
                name:          p.productName,
                price:         p.price,
                originalPrice: p.originalPrice || null,
                size:          p.size,
                color:         p.color,
                category:      p.category,
                description:   p.description,
                image:         p.imageUrl || 'images/shirt.jpg',
                discount:      p.discount  || 0
            }));
        }
    } catch (e) {
        console.warn('Backend offline — using local data');
    }

    // Filter: has a discount OR has an originalPrice
    const offerItems = catalogue.filter(p => p.discount > 0 || p.originalPrice);

    const container  = document.getElementById('offersList');
    const countBadge = document.getElementById('offerCount');

    if (countBadge) countBadge.textContent = offerItems.length + ' Deals';

    if (!container) return;

    if (offerItems.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <span style="font-size:3rem;">🎯</span>
                <h4 class="mt-3 text-muted">No active offers right now</h4>
                <p class="text-muted">Check back soon for exciting deals!</p>
                <a href="shop.html" class="btn btn-primary mt-2">Browse All Products</a>
            </div>`;
        return;
    }

    container.innerHTML = offerItems.map(p => {
        const discPct  = p.discount || (p.originalPrice
            ? Math.round((1 - p.price / p.originalPrice) * 100)
            : 0);
        const origPrice = p.originalPrice || Math.round(p.price / (1 - discPct / 100));
        const savings   = origPrice - p.price;

        return `
        <div class="col-md-3 mb-4">
            <div class="card h-100">
                <span class="discount-badge">${discPct}% OFF</span>
                <img src="${p.image}" class="card-img-top" alt="${p.name}"
                     style="height:200px;object-fit:cover;"
                     onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${p.name}</h5>
                    <p class="card-text text-muted small">${p.category}</p>
                    <p class="card-text mb-1">
                        <span class="font-weight-bold text-danger" style="font-size:1.1rem;">₹${p.price}</span>
                        <span class="original-price ml-2">₹${origPrice}</span>
                    </p>
                    <p class="mb-2">
                        <span class="savings-pill">You save ₹${savings}</span>
                    </p>
                    <p class="card-text small text-muted">${p.description || ''}</p>
                    <div class="mt-auto">
                        <a href="product.html?id=${p.id}" class="btn btn-outline-danger btn-sm">View Deal</a>
                        <button class="btn btn-danger btn-sm ml-1"
                                onclick='addToCart(${JSON.stringify({id:p.id,name:p.name,price:p.price,image:p.image})});alert("Added to cart!")'>
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>`; }).join('');
});
