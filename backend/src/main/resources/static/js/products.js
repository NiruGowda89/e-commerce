// Backend API URL (replace with your actual Render backend domain)
const API_URL = "https://e-commerce-1-ariz.onrender.com/api"; 

// Load all products from backend
async function loadProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
    const products = await response.json();
    renderProducts(products);
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

// Render products dynamically into productContainer
function renderProducts(products) {
  const container = document.getElementById("productContainer");
  if (!container) return;

  container.innerHTML = products
    .map(
      (p) => `
      <div class="col-md-4 mb-4">
        <div class="card h-100 shadow-sm">
          <img src="${p.image}" class="card-img-top" alt="${p.name}">
          <div class="card-body">
            <h5 class="card-title">${p.name}</h5>
            <p class="card-text text-muted">${p.description}</p>
            <h6 class="text-primary">₹${p.price}</h6>
            <a href="product.html?id=${p.id}" class="btn btn-dark btn-sm mt-2">View Details</a>
          </div>
        </div>
      </div>`
    )
    .join("");
}

// Load products when page loads
document.addEventListener("DOMContentLoaded", loadProducts);
