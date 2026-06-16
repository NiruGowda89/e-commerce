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

    container.innerHTML = list.map(p => `
        <div class="col-md-3 mb-4">
            <div class="card h-100">
                <img src="${p.image}" class="card-img-top" alt="${p.name}"
                     style="height:200px;object-fit:cover;"
                     onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${p.name}</h5>
                    <p class="card-text text-muted small">${p.category}</p>
                    <p class="card-text font-weight-bold">₹${p.price}</p>
                    <div class="mt-auto">
                        <a href="product.html?id=${p.id}" class="btn btn-primary btn-sm">View</a>
                        <button class="btn btn-secondary btn-sm ml-1"
                                onclick='addToCart(${JSON.stringify({id:p.id,name:p.name,price:p.price,image:p.image})});alert("Added to cart!")'>
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>`).join('');
}
