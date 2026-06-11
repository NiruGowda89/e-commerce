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
});
