// Cart page — render items, update qty, remove, show total
document.addEventListener('DOMContentLoaded', function () {
  renderCart();

  // Continue Shopping
  const continueBtn = document.getElementById('continueShopping');
  if (continueBtn) continueBtn.addEventListener('click', () => window.location.href = 'shop.html');
});

function renderCart() {
  const tbody     = document.getElementById('cartItems');
  const totalEl   = document.getElementById('cartTotal');
  const emptyDiv  = document.getElementById('emptyCart');
  const cartDiv   = document.getElementById('cartContents');
  if (!tbody) return;

  const cart = getCart();

  if (cart.length === 0) {
    if (cartDiv)  cartDiv.style.display  = 'none';
    if (emptyDiv) emptyDiv.style.display = 'block';
    return;
  }

  if (cartDiv)  cartDiv.style.display  = '';
  if (emptyDiv) emptyDiv.style.display = 'none';

  tbody.innerHTML = cart.map(item => `
    <tr>
      <td>
        <img src="${item.image}" alt="${item.name}"
             style="width:50px;height:50px;object-fit:cover;" class="mr-2">
        ${item.name}
      </td>
      <td>${item.size  || '—'}</td>
      <td>${item.color || '—'}</td>
      <td>
        <input type="number" class="form-control form-control-sm"
               value="${item.quantity}" min="1" style="width:65px;"
               onchange="updateQty(${item.id}, parseInt(this.value)); renderCart();">
      </td>
      <td>₹${item.price}</td>
      <td>₹${item.price * item.quantity}</td>
      <td>
        <button class="btn btn-danger btn-sm"
                onclick="removeFromCart(${item.id}); renderCart();">Remove</button>
      </td>
    </tr>`).join('');

  if (totalEl) totalEl.textContent = getCartTotal();
}
