// js/cart.js — cart.html only
document.addEventListener('DOMContentLoaded', () => {
  if (!requireLoginOrRedirect()) return;
  loadCartPage();
  document.getElementById('checkoutBtn').addEventListener('click', placeOrder);
});

async function loadCartPage() {
  const list = document.getElementById('cartList');
  try {
    const items = await apiGet('/cart', true);
    if (items.length === 0) {
      list.innerHTML = `<p class="empty-note">Your cart is empty. <a href="shop.html" style="color: var(--marigold);">Go shopping →</a></p>`;
      updateSummary(0, 0);
      return;
    }
    list.innerHTML = items.map((item) => `
      <div class="cart-row" data-cart-id="${item.id}">
        <img src="${imgUrl(item.image)}" alt="">
        <div class="cart-row__info">
          <h4>${escapeHtml(item.name)}</h4>
          <span>Rs. ${Number(item.price).toLocaleString('en-PK')}</span>
        </div>
        <div class="qty-stepper">
          <button data-dec="${item.id}">−</button>
          <span>${item.quantity}</span>
          <button data-inc="${item.id}" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
        </div>
        <button class="btn btn--danger btn--small" data-remove="${item.id}">Remove</button>
      </div>
    `).join('');

    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
    const total = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
    updateSummary(totalQty, total);

    list.querySelectorAll('[data-inc]').forEach((b) => b.addEventListener('click', () => changeQty(b.dataset.inc, 1, items)));
    list.querySelectorAll('[data-dec]').forEach((b) => b.addEventListener('click', () => changeQty(b.dataset.dec, -1, items)));
    list.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', () => removeItem(b.dataset.remove)));
  } catch (err) {
    list.innerHTML = `<p class="empty-note">Couldn't load your cart — is the backend running on port 5000?</p>`;
  }
}

function updateSummary(count, total) {
  document.getElementById('summaryCount').textContent = count;
  document.getElementById('summaryTotal').textContent = `Rs. ${total.toLocaleString('en-PK')}`;
}

async function changeQty(cartId, delta, items) {
  const item = items.find((i) => String(i.id) === String(cartId));
  const newQty = item.quantity + delta;
  if (newQty < 1) return removeItem(cartId);
  try {
    await apiPut(`/cart/${cartId}`, { quantity: newQty }, true);
    loadCartPage();
    updateCartBadge();
  } catch (err) {
    showToast(err.message || 'Could not update quantity.');
  }
}

async function removeItem(cartId) {
  try {
    await apiDelete(`/cart/${cartId}`, true);
    loadCartPage();
    updateCartBadge();
  } catch (err) {
    showToast(err.message || 'Could not remove item.');
  }
}

async function placeOrder() {
  const status = document.getElementById('checkoutStatus');
  const address = document.getElementById('shippingAddress').value.trim();
  const btn = document.getElementById('checkoutBtn');

  if (!address) {
    status.textContent = 'Please enter a shipping address.';
    status.className = 'form-status is-error';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Placing order…';
  try {
    const result = await apiPost('/orders', { shipping_address: address }, true);
    status.textContent = `Order #${result.orderId} placed — total Rs. ${Number(result.total).toLocaleString('en-PK')}.`;
    status.className = 'form-status is-success';
    updateCartBadge();
    setTimeout(() => { window.location.href = 'account.html'; }, 1500);
  } catch (err) {
    status.textContent = err.message || 'Could not place order.';
    status.className = 'form-status is-error';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Place order';
  }
}
