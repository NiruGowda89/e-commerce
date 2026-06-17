// ─── Product Detail Page ───────────────────────────────────────────────────────
// Fixes: removed reference to undefined `products` array, added robust
// fallback, spinner show/hide, and wires up all new Flipkart-style UI.

if (typeof API_URL === 'undefined') window.API_URL = 'https://e-commerce-1-ariz.onrender.com/api';

// ── Fallback catalogue (used when backend is unreachable) ─────────────────────
const FALLBACK_PRODUCTS = [
    { id: 1, name: 'Classic White Shirt',     price: 599,  mrp: 999,  brand: 'Karunada',  category: 'Shirts',   description: 'Premium cotton formal shirt with a slim fit.',         image: 'images/shirt.jpg',  colors: ['White','Blue','Black'],   sizes: ['S','M','L','XL','XXL'] },
    { id: 2, name: 'Slim Fit Jeans',          price: 899,  mrp: 1499, brand: 'Karunada',  category: 'Jeans',    description: 'Stretchable denim jeans for everyday comfort.',         image: 'images/jeans.jpg',  colors: ['Blue','Black','Grey'],    sizes: ['28','30','32','34','36'] },
    { id: 3, name: 'Casual Linen Shirt',      price: 749,  mrp: 1299, brand: 'Karunada',  category: 'Shirts',   description: 'Breathable linen fabric perfect for summer.',           image: 'images/linen.jpg',  colors: ['Beige','White','Olive'],  sizes: ['S','M','L','XL'] },
    { id: 4, name: 'Graphic Round-Neck Tee',  price: 349,  mrp: 599,  brand: 'Karunada',  category: 'T-Shirts', description: 'Soft cotton tee with a bold graphic print.',            image: 'images/tshirt.jpg', colors: ['Black','White','Red'],    sizes: ['S','M','L','XL','XXL'] },
];

// ── Color → swatch hex map ────────────────────────────────────────────────────
const COLOR_HEX = {
    Black: '#1a1a1a', White: '#f8f8f8', Blue: '#2563eb', Red: '#dc2626',
    Grey: '#6b7280', Green: '#16a34a', Olive: '#84855a', Beige: '#d4b896',
    'Light Green': '#86efac', Pink: '#f9a8d4', Navy: '#1e3a5f', Brown: '#78350f',
    Yellow: '#fbbf24', Orange: '#f97316', Purple: '#7c3aed',
};

// ── State ─────────────────────────────────────────────────────────────────────
let _product       = null;
let _selectedSize  = '';
let _selectedColor = '';
let currentProductId = null;

// ── In-memory review image store (reviewId → [base64, ...]) ──────────────────
const reviewImageStore = {};

// ─────────────────────────────────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
    const params = new URLSearchParams(window.location.search);
    const id     = parseInt(params.get('id') || '1');

    showLoader(true);

    try {
        // 1. Try backend
        try {
            const bp = await apiGetProduct(id);
            if (bp && (bp.productId || bp.id)) {
                _product = normaliseBackendProduct(bp);
            }
        } catch (e) {
            console.warn('Backend offline — using fallback data');
        }

        // 2. Fallback to local catalogue
        if (!_product) {
            const local = FALLBACK_PRODUCTS.find(p => p.id === id) || FALLBACK_PRODUCTS[0];
            _product = local;
        }

        renderProduct(_product);
        initCountdown();
        loadReviews(_product.id);
        initReviewImageUpload();
        initStarPicker();
    } catch (error) {
        console.error('Error rendering product detail page:', error);
    } finally {
        showLoader(false);
    }

    // Notify share / favourite helpers defined in product.html <script>
    if (typeof setCurrentProduct === 'function') {
        try {
            setCurrentProduct({
                id:    _product.id,
                name:  _product.name,
                price: _product.price,
                image: _product.image,
            });
        } catch (e) {
            console.error('Error in setCurrentProduct helper:', e);
        }
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function showLoader(show) {
    const loader  = document.getElementById('pageLoader');
    const content = document.getElementById('pageContent');
    if (loader)  loader.style.display  = show ? 'flex' : 'none';
    if (content) content.style.display = show ? 'none' : 'block';
}

/** Normalise the backend DTO into a consistent shape */
function normaliseBackendProduct(bp) {
    // Backend may return comma-separated strings or single values
    const toArr = v => v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : [];
    return {
        id:          bp.productId || bp.id,
        name:        bp.productName || bp.name || 'Product',
        price:       bp.price       || 0,
        mrp:         bp.mrp         || Math.round((bp.price || 0) * 1.4),
        brand:       bp.brand       || 'Karunada Collection',
        category:    bp.category    || '',
        description: bp.description || '',
        image:       bp.imageUrl    || bp.image || 'images/shirt.jpg',
        colors:      toArr(bp.color)  .length ? toArr(bp.color)   : ['Black','Blue','White'],
        sizes:       toArr(bp.size)   .length ? toArr(bp.size)    : ['S','M','L','XL','XXL'],
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────────────────────────────────────

function renderProduct(p) {
    // Basic text
    setText('productName',     p.name);
    setText('productDesc',     p.description || 'Premium quality product from Karunada Collection.');
    setText('productPrice',    p.price);
    setText('productBrand',    p.brand || 'Karunada Collection');
    setText('breadcrumbProduct', p.name);

    // MRP & discount
    const mrp = p.mrp || Math.round(p.price * 1.4);
    const disc = Math.round(((mrp - p.price) / mrp) * 100);
    const mrpEl  = document.getElementById('productMrp');
    const discEl = document.getElementById('productDiscount');
    const hotEl  = document.getElementById('hotDealBadge');
    if (mrpEl)  mrpEl.innerHTML  = `<s>₹${mrp}</s>`;
    if (discEl) discEl.textContent = `${disc}% off`;
    if (hotEl)  hotEl.style.display = disc >= 20 ? 'inline-flex' : 'none';

    // Main image + thumbnails
    const mainImg = document.getElementById('productImage');
    // Build a small gallery: use the main image + placeholder variants
    const gallery = buildGallery(p.image);
    if (mainImg) mainImg.src = gallery[0];
    renderThumbs(gallery);

    // Colors
    const colors = p.colors && p.colors.length ? p.colors : ['Black', 'Blue', 'White'];
    _selectedColor = colors[0];
    renderColorSwatches(colors);

    // Sizes
    const sizes = p.sizes && p.sizes.length ? p.sizes : ['S', 'M', 'L', 'XL', 'XXL'];
    _selectedSize = sizes[0];
    renderSizeChips(sizes);

    // CTA buttons
    bindCTA(p);
}

/** Build a small gallery array — real image + subtle crop variants via URL trick */
function buildGallery(imgSrc) {
    // If it's a full URL we can't crop, so just repeat it (looks fine in thumbs)
    return [imgSrc, imgSrc, imgSrc];
}

function renderThumbs(gallery) {
    const strip = document.getElementById('thumbStrip');
    if (!strip) return;
    strip.innerHTML = gallery.map((src, i) => `
        <div class="pd-thumb ${i === 0 ? 'active' : ''}"
             onclick="selectThumb(this, '${src}')">
            <img src="${src}" alt="View ${i + 1}"
                 onerror="this.src='https://via.placeholder.com/80x80?text=img'">
        </div>`).join('');
}

window.selectThumb = function (el, src) {
    document.querySelectorAll('.pd-thumb').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    const main = document.getElementById('productImage');
    if (main) {
        main.style.opacity = '0';
        setTimeout(() => { main.src = src; main.style.opacity = '1'; }, 150);
    }
};

function renderColorSwatches(colors) {
    const strip   = document.getElementById('colorStrip');
    const nameEl  = document.getElementById('selectedColorName');
    if (!strip) return;
    if (nameEl) nameEl.textContent = colors[0];

    strip.innerHTML = colors.map((c, i) => {
        const hex = COLOR_HEX[c] || '#888';
        return `<button class="pd-color-swatch ${i === 0 ? 'active' : ''}"
                        style="background:${hex};"
                        title="${c}"
                        onclick="selectColor(this, '${c}')">
                    ${isLight(hex) ? '' : ''}
                </button>`;
    }).join('');
}

window.selectColor = function (el, colorName) {
    document.querySelectorAll('.pd-color-swatch').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    _selectedColor = colorName;
    const nameEl = document.getElementById('selectedColorName');
    if (nameEl) nameEl.textContent = colorName;
};

function renderSizeChips(sizes) {
    const container = document.getElementById('sizeChips');
    if (!container) return;
    container.innerHTML = sizes.map((s, i) => `
        <button class="pd-size-chip ${i === 0 ? 'active' : ''}"
                onclick="selectSize(this, '${s}')">${s}</button>`
    ).join('');
}

window.selectSize = function (el, size) {
    document.querySelectorAll('.pd-size-chip').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    _selectedSize = size;
};

function bindCTA(p) {
    const addBtn = document.getElementById('addToCartBtn');
    const buyBtn = document.getElementById('buyNowBtn');
    if (addBtn) {
        addBtn.onclick = function () {
            addToCart({ id: p.id, name: p.name, price: p.price, image: p.image,
                        size: _selectedSize, color: _selectedColor });
            showAddedToast(p.name);
        };
    }
    if (buyBtn) {
        buyBtn.onclick = function () {
            addToCart({ id: p.id, name: p.name, price: p.price, image: p.image,
                        size: _selectedSize, color: _selectedColor });
            window.location.href = 'cart.html';
        };
    }
}

// ── Brief toast after "Add to Cart" ──────────────────────────────────────────
function showAddedToast(name) {
    let t = document.getElementById('pdToast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'pdToast';
        t.className = 'pd-toast';
        document.body.appendChild(t);
    }
    t.textContent = `✅ "${name}" added to cart!`;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Utility ──────────────────────────────────────────────────────────────────
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
function isLight(hex) {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTDOWN TIMER  (counts down to midnight)
// ─────────────────────────────────────────────────────────────────────────────
function initCountdown() {
    function tick() {
        const now       = new Date();
        const midnight  = new Date(now); midnight.setHours(24, 0, 0, 0);
        let   diff      = Math.floor((midnight - now) / 1000);
        const hrs  = String(Math.floor(diff / 3600)).padStart(2, '0'); diff %= 3600;
        const mins = String(Math.floor(diff / 60)).padStart(2, '0');
        const secs = String(diff % 60).padStart(2, '0');
        setText('cdHr',  hrs);
        setText('cdMin', mins);
        setText('cdSec', secs);
    }
    tick();
    setInterval(tick, 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────────────────────
function starsHtml(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="pd-rv-star ${i <= rating ? 'filled' : ''}">★</span>`;
    }
    return html;
}

async function loadReviews(productId) {
    currentProductId = productId;
    const listEl = document.getElementById('reviewsList');
    if (!listEl) return;
    listEl.innerHTML = '<p class="text-muted small">Loading reviews…</p>';

    try {
        const res  = await fetch(API_URL + '/reviews/product/' + productId);
        const data = await res.json();

        // Rating badge
        const ratingEl = document.getElementById('ratingBadge');
        if (ratingEl && data.totalReviews > 0) {
            ratingEl.innerHTML = `
                <div class="pd-rating-pill">
                    ${starsHtml(Math.round(data.averageRating))}
                    <span class="pd-rating-num">${Number(data.averageRating).toFixed(1)}</span>
                </div>
                <span class="pd-rating-count">${data.totalReviews} rating${data.totalReviews > 1 ? 's' : ''}</span>`;
        }

        if (!data.reviews || data.reviews.length === 0) {
            listEl.innerHTML = '<p class="text-muted">No reviews yet. Be the first to review!</p>';
            return;
        }

        listEl.innerHTML = data.reviews.map(r => {
            const imgs    = reviewImageStore[r.reviewId] || [];
            const imgsHtml = imgs.length
                ? `<div class="review-images">${imgs.map(src =>
                      `<img src="${src}" alt="Review photo" onclick="openReviewImg('${src}')">`
                  ).join('')}</div>`
                : '';
            return `
            <div class="pd-review-card">
                <div class="pd-review-header">
                    <div class="pd-review-avatar">${(r.userName || 'C')[0].toUpperCase()}</div>
                    <div>
                        <div class="pd-review-name">${r.userName || 'Customer'}</div>
                        <div class="pd-review-stars">${starsHtml(r.rating)}</div>
                    </div>
                    <div class="pd-review-date ml-auto">
                        ${new Date(r.createdAt).toLocaleDateString('en-IN')}
                    </div>
                </div>
                <p class="pd-review-comment">${r.comment || ''}</p>
                ${imgsHtml}
            </div>`;
        }).join('');
    } catch (e) {
        listEl.innerHTML = '<p class="text-muted small">Could not load reviews.</p>';
    }
}

// Lightbox
window.openReviewImg = function (src) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
    overlay.innerHTML = `<img src="${src}" style="max-width:92vw;max-height:88vh;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,0.7);">`;
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
};

// ── Star picker ───────────────────────────────────────────────────────────────
function initStarPicker() {
    const stars  = document.querySelectorAll('#starPicker .pd-star');
    const hidden = document.getElementById('reviewRating');
    if (!stars.length) return;

    // Default: all 5 filled
    stars.forEach(s => s.classList.add('active'));

    stars.forEach((star, idx) => {
        star.addEventListener('mouseover', () => {
            stars.forEach((s, i) => s.classList.toggle('hover', i <= idx));
        });
        star.addEventListener('mouseout', () => {
            stars.forEach(s => s.classList.remove('hover'));
        });
        star.addEventListener('click', () => {
            const val = parseInt(star.dataset.val);
            if (hidden) hidden.value = val;
            stars.forEach((s, i) => s.classList.toggle('active', i < val));
        });
    });
}

// ── Review image upload ───────────────────────────────────────────────────────
function initReviewImageUpload() {
    const fileInput = document.getElementById('reviewImages');
    const previewEl = document.getElementById('reviewImagePreview');
    const uploadArea = document.getElementById('uploadArea');
    if (!fileInput) return;

    let selectedFiles = [];

    // Click on upload area triggers file picker
    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput.click());
    }

    fileInput.addEventListener('change', function () {
        Array.from(fileInput.files).forEach(file => {
            if (selectedFiles.length >= 3) return;
            const reader = new FileReader();
            reader.onload = e => {
                selectedFiles.push({ name: file.name, dataUrl: e.target.result });
                renderImgPreviews();
            };
            reader.readAsDataURL(file);
        });
        fileInput.value = '';
    });

    function renderImgPreviews() {
        if (!previewEl) return;
        previewEl.innerHTML = selectedFiles.map((f, i) => `
            <div class="preview-thumb">
                <img src="${f.dataUrl}" alt="Preview">
                <button class="remove-img" onclick="removeReviewImg(${i})" title="Remove">×</button>
            </div>`).join('');
        fileInput._previewFiles = selectedFiles;
    }

    window.removeReviewImg = function (idx) {
        selectedFiles.splice(idx, 1);
        renderImgPreviews();
    };
}

// ── Submit review ─────────────────────────────────────────────────────────────
async function submitReview() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user) {
        alert('Please login to submit a review.');
        window.location.href = 'login.html';
        return;
    }

    const rating    = parseInt(document.getElementById('reviewRating').value) || 5;
    const comment   = document.getElementById('reviewComment').value.trim();
    const msgEl     = document.getElementById('reviewMsg');
    const fileInput = document.getElementById('reviewImages');
    const pendingImgs = (fileInput && fileInput._previewFiles)
        ? fileInput._previewFiles.map(f => f.dataUrl)
        : [];

    if (!comment) {
        msgEl.innerHTML = '<span class="text-warning">⚠️ Please write a comment.</span>';
        return;
    }

    msgEl.innerHTML = '<span class="text-muted">Submitting…</span>';

    try {
        const res  = await fetch(API_URL + '/reviews', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                productId: currentProductId,
                userId:    user.userId || user.id,
                rating,
                comment
            })
        });
        const data = await res.json();

        if (res.ok) {
            if (pendingImgs.length > 0 && data.reviewId) {
                reviewImageStore[data.reviewId] = pendingImgs;
            }
            msgEl.innerHTML = '<span class="text-success">✅ Review submitted!</span>';
            document.getElementById('reviewComment').value = '';
            // Reset star picker to 5
            document.getElementById('reviewRating').value = '5';
            document.querySelectorAll('#starPicker .pd-star').forEach(s => s.classList.add('active'));
            // Clear image preview
            if (fileInput) {
                fileInput._previewFiles = [];
                const previewEl = document.getElementById('reviewImagePreview');
                if (previewEl) previewEl.innerHTML = '';
            }
            loadReviews(currentProductId);
        } else {
            msgEl.innerHTML = `<span class="text-danger">❌ ${data.message || data || 'Could not submit review'}</span>`;
        }
    } catch (e) {
        msgEl.innerHTML = '<span class="text-warning">⚠️ Could not connect to server</span>';
    }
}
