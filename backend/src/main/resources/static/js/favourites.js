// ─── Favourites (Wishlist) ────────────────────────────────────────────────────
const FAV_KEY = 'karunadaFavourites';

function getFavourites() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); }
    catch(e) { return []; }
}

function saveFavourites(favs) {
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}

function isFavourite(productId) {
    return getFavourites().some(f => f.id == productId);
}

function toggleFavourite(product) {
    let favs = getFavourites();
    const idx = favs.findIndex(f => f.id == product.id);
    if (idx === -1) {
        favs.push(product);
        saveFavourites(favs);
        return true; // added
    } else {
        favs.splice(idx, 1);
        saveFavourites(favs);
        return false; // removed
    }
}

function refreshFavBadge() {
    const badge = document.getElementById('favCount');
    if (!badge) return;
    const n = getFavourites().length;
    badge.textContent = n > 0 ? n : '';
}

// Run on every page load
document.addEventListener('DOMContentLoaded', refreshFavBadge);
