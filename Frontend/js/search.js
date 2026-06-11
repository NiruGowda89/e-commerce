// Global search — redirects to shop with ?q= query param
function doSearch(e) {
    if (e) e.preventDefault();
    const q = document.getElementById('globalSearch').value.trim();
    if (!q) return;
    window.location.href = 'shop.html?q=' + encodeURIComponent(q);
}
