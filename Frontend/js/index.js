// Home page — featured products from backend, fallback to local
document.addEventListener('DOMContentLoaded', async function () {
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    let catalogue = products.slice(0, 4); // fallback

    try {
        const backendProducts = await apiGetProducts();
        if (backendProducts && backendProducts.length > 0) {
            catalogue = backendProducts.slice(0, 4).map(p => ({
                id:    p.productId,
                name:  p.productName,
                price: p.price,
                image: getProductImage(p.productId, p.imageUrl || 'images/shirt.jpg'),
                category: p.category
            }));
        }
    } catch (e) {
        console.warn('Backend offline — using local product data');
    }

    container.innerHTML = catalogue.map(p => `
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
                                onclick='addToCart(${JSON.stringify({id:p.id,name:p.name,price:p.price,image:p.image})})'>
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>`).join('');
});

// Returns first uploaded image from localStorage if available, else fallback
function getProductImage(productId, fallback) {
    try {
        const stored = localStorage.getItem('product_images_' + productId);
        if (stored) {
            const imgs = JSON.parse(stored).filter(Boolean);
            if (imgs.length > 0) return imgs[0];
        }
    } catch(e) {}
    return fallback || 'images/shirt.jpg';
}
