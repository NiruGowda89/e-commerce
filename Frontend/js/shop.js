// Shop page — loads products from backend, falls back to local data
document.addEventListener('DOMContentLoaded', async function () {
    let catalogue = products; // fallback to local products.js

    try {
        const backendProducts = await apiGetProducts();
        if (backendProducts && backendProducts.length > 0) {
            catalogue = backendProducts.map(p => ({
                id:          p.productId,
                name:        p.productName,
                price:       p.price,
                size:        p.size,
                color:       p.color,
                category:    p.category,
                description: p.description,
                image:       p.imageUrl || 'images/shirt.jpg'
            }));
        }
    } catch (e) {
        console.warn('Backend offline — using local product data');
    }

    window._catalogue = catalogue;

    // Check for search query in URL
    const urlQ = new URLSearchParams(window.location.search).get('q');
    if (urlQ) {
        document.getElementById('globalSearch').value = urlQ;
        const heading = document.querySelector('h2');
        if (heading) heading.textContent = 'Search results for: "' + urlQ + '"';
        const filtered = catalogue.filter(p =>
            p.name.toLowerCase().includes(urlQ.toLowerCase()) ||
            (p.category || '').toLowerCase().includes(urlQ.toLowerCase()) ||
            (p.description || '').toLowerCase().includes(urlQ.toLowerCase())
        );
        renderProducts(filtered);
        if (filtered.length === 0) {
            document.getElementById('productList').innerHTML = `
                <div class="col-12 text-center py-5">
                    <span style="font-size:3rem;">🔍</span>
                    <h4 class="mt-3 text-muted">No results for "${urlQ}"</h4>
                    <a href="shop.html" class="btn btn-primary mt-2">View All Products</a>
                </div>`;
        }
    } else {
        renderProducts(catalogue);
    }

    const sizeFilter  = document.getElementById('sizeFilter');
    const colorFilter = document.getElementById('colorFilter');
    const clearBtn    = document.getElementById('clearFilters');

    function applyFilters() {
        const size  = sizeFilter  ? sizeFilter.value  : '';
        const color = colorFilter ? colorFilter.value : '';
        const filtered = window._catalogue.filter(p =>
            (!size  || p.size  === size) &&
            (!color || p.color === color)
        );
        renderProducts(filtered);
    }

    if (sizeFilter)  sizeFilter.addEventListener('change', applyFilters);
    if (colorFilter) colorFilter.addEventListener('change', applyFilters);
    if (clearBtn)    clearBtn.addEventListener('click', function () {
        if (sizeFilter)  sizeFilter.value  = '';
        if (colorFilter) colorFilter.value = '';
        renderProducts(window._catalogue);
    });
});

function renderProducts(list) {
    const container = document.getElementById('productList');
    if (!container) return;

    if (!list || list.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-4"><p>No products found.</p></div>';
        return;
    }

    container.innerHTML = list.map(p => {
        const faved = typeof isFavourite === 'function' && isFavourite(p.id);
        return `
        <div class="col-md-3 mb-4">
            <div class="card h-100" style="position:relative;">
                <!-- Favourite button -->
                <button onclick="toggleFavBtn(${p.id}, '${p.name}', ${p.price}, '${p.image}')"
                        id="fav-${p.id}"
                        style="position:absolute;top:8px;right:8px;z-index:2;background:rgba(255,255,255,0.9);border:none;border-radius:50%;width:36px;height:36px;font-size:1.1rem;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.2);"
                        title="Save to favourites">${faved ? '❤️' : '🤍'}</button>

                <a href="product.html?id=${p.id}">
                    <img src="${p.image}" class="card-img-top" alt="${p.name}"
                         style="height:200px;object-fit:cover;"
                         onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                </a>
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title mb-1">${p.name}</h6>
                    <small class="text-muted">${p.category || ''}</small>
                    <div id="rating-${p.id}" class="my-1 small text-warning">☆☆☆☆☆</div>
                    <p class="font-weight-bold text-primary mb-2">₹${p.price}</p>
                    <div class="mt-auto d-flex">
                        <a href="product.html?id=${p.id}" class="btn btn-primary btn-sm flex-grow-1 mr-1">View</a>
                        <button class="btn btn-secondary btn-sm flex-grow-1"
                                onclick='addToCart(${JSON.stringify({id:p.id,name:p.name,price:p.price,image:p.image})});alert("Added to cart!")'>
                            🛒
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');

    // Load ratings for all products
    list.forEach(p => loadProductRating(p.id));
}

async function loadProductRating(productId) {
    try {
        const res  = await fetch(API_BASE + '/reviews/product/' + productId);
        const data = await res.json();
        const el   = document.getElementById('rating-' + productId);
        if (!el) return;
        if (data.totalReviews > 0) {
            const full  = Math.round(data.averageRating);
            const stars = '⭐'.repeat(full) + '☆'.repeat(5 - full);
            el.innerHTML = `${stars} <span class="text-muted">(${data.totalReviews})</span>`;
        } else {
            el.innerHTML = '<span class="text-muted small">No reviews yet</span>';
        }
    } catch(e) { /* silent */ }
}

function toggleFavBtn(id, name, price, image) {
    if (typeof toggleFavourite !== 'function') return;
    const added = toggleFavourite({ id, name, price, image });
    const btn = document.getElementById('fav-' + id);
    if (btn) btn.textContent = added ? '❤️' : '🤍';
    refreshFavBadge();
}
