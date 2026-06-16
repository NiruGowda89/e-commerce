// Product detail page — loads product from backend by ?id=, fallback to local
document.addEventListener('DOMContentLoaded', async function () {
    const id = parseInt(new URLSearchParams(window.location.search).get('id') || '1');

    let product = products.find(p => p.id === id) || products[0]; // fallback

    try {
        const bp = await apiGetProduct(id);
        if (bp) {
            product = {
                id:          bp.productId,
                name:        bp.productName,
                price:       bp.price,
                size:        bp.size,
                color:       bp.color,
                category:    bp.category,
                brand:       bp.brand,
                description: bp.description,
                image:       bp.imageUrl || 'images/shirt.jpg'
            };
        }
    } catch (e) {
        console.warn('Backend offline — using local product data');
    }

    // Populate fields
    document.getElementById('productName').textContent  = product.name;
    document.getElementById('productDesc').textContent  = product.description;
    document.getElementById('productPrice').textContent = product.price;
    document.getElementById('productImage').src         = product.image;

    const catEl   = document.getElementById('productCategory');
    const breadEl = document.getElementById('breadcrumbProduct');
    if (catEl)   catEl.textContent   = product.category || '';
    if (breadEl) breadEl.textContent = product.name;

    // Pre-select size / color
    const sizeSelect  = document.getElementById('sizeSelect');
    const colorSelect = document.getElementById('colorSelect');
    if (sizeSelect  && product.size)  sizeSelect.value  = product.size;
    if (colorSelect && product.color) colorSelect.value = product.color;

    // Add to Cart
    document.getElementById('addToCartBtn').addEventListener('click', function () {
        addToCart({
            id:    product.id,
            name:  product.name,
            price: product.price,
            image: product.image,
            size:  sizeSelect  ? sizeSelect.value  : product.size,
            color: colorSelect ? colorSelect.value : product.color
        });
        alert(product.name + ' added to cart!');
    });

    // Buy Now
    document.getElementById('buyNowBtn').addEventListener('click', function () {
        addToCart({
            id:    product.id,
            name:  product.name,
            price: product.price,
            image: product.image,
            size:  sizeSelect  ? sizeSelect.value  : product.size,
            color: colorSelect ? colorSelect.value : product.color
        });
        window.location.href = 'cart.html';
    });

    // Load reviews
    loadReviews(product.id);
});

// ─── Reviews ──────────────────────────────────────────────────────────────────
let currentProductId = null;

function starsHtml(rating) {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
}

async function loadReviews(productId) {
    currentProductId = productId;
    try {
        const res = await fetch(API_URL + '/reviews/product/' + productId);
        const data = await res.json();

        const ratingBadge = document.getElementById('ratingBadge');
        if (ratingBadge && data.totalReviews > 0) {
            ratingBadge.innerHTML = `
                <span class="badge badge-warning text-dark" style="font-size:1rem;">
                    ⭐ ${data.averageRating} / 5
                </span>
                <span class="text-muted ml-2">(${data.totalReviews} review${data.totalReviews > 1 ? 's' : ''})</span>`;
        }

        const listEl = document.getElementById('reviewsList');
        if (!listEl) return;

        if (!data.reviews || data.reviews.length === 0) {
            listEl.innerHTML = '<p class="text-muted">No reviews yet. Be the first to review!</p>';
            return;
        }

        listEl.innerHTML = data.reviews.map(r => `
            <div class="card mb-2">
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>${r.userName || 'Customer'}</strong>
                        <span>${starsHtml(r.rating)}</span>
                    </div>
                    <p class="mb-0 mt-1">${r.comment || ''}</p>
                    <small class="text-muted">${new Date(r.createdAt).toLocaleDateString('en-IN')}</small>
                </div>
            </div>`).join('');
    } catch (e) {
        console.warn('Could not load reviews');
    }
}

async function submitReview() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user) {
        alert('Please login to submit a review.');
        window.location.href = 'login.html';
        return;
    }

    const rating  = parseInt(document.getElementById('reviewRating').value);
    const comment = document.getElementById('reviewComment').value.trim();
    const msgEl   = document.getElementById('reviewMsg');

    try {
        const res = await fetch(API_URL + '/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: currentProductId, userId: user.userId, rating, comment })
        });
        const data = await res.json();

        if (res.ok) {
            msgEl.innerHTML = '<span class="text-success">✅ Review submitted!</span>';
            document.getElementById('reviewComment').value = '';
            loadReviews(currentProductId);
        } else {
            msgEl.innerHTML = `<span class="text-danger">❌ ${data || 'Could not submit review'}</span>`;
        }
    } catch (e) {
        msgEl.innerHTML = '<span class="text-warning">⚠️ Could not connect to server</span>';
    }
}
