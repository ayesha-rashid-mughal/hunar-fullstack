// js/product.js — product.html only
let currentQty = 1;
let currentProduct = null;

document.addEventListener('DOMContentLoaded', async () => {
  const id = new URLSearchParams(window.location.search).get('id');
  const wrap = document.getElementById('productDetail');
  if (!id) { wrap.innerHTML = `<p class="empty-note">No product specified.</p>`; return; }

  try {
    currentProduct = await apiGet(`/products/${id}`);
    document.title = `${currentProduct.name} — Hunar Marketplace`;
    renderDetail(currentProduct);
  } catch (err) {
    wrap.innerHTML = `<p class="empty-note">Couldn't load this product — it may have been removed, or the backend isn't running.</p>`;
  }
});

function renderDetail(p) {
  const outOfStock = p.stock <= 0;
  const wrap = document.getElementById('productDetail');
  wrap.innerHTML = `
    <div class="product-detail__img"><img src="${imgUrl(p.image)}" alt="${escapeHtml(p.name)}"></div>
    <div>
      <span class="product-card__tag">${escapeHtml(p.category)}</span>
      <h1 class="product-detail__title" style="margin-top:0.8rem;">${escapeHtml(p.name)}</h1>
      <p class="product-detail__price">Rs. ${Number(p.price).toLocaleString('en-PK')}</p>
      <p class="product-detail__desc">${escapeHtml(p.description || 'No description provided for this item yet.')}</p>
      <p style="color: var(--sage); font-size: 0.85rem; margin-bottom: 1.2rem;">
        ${outOfStock ? '<span style="color: var(--rose);">Out of stock</span>' : `${p.stock} in stock`}
        &nbsp;·&nbsp; ${p.rating}&#9733; rating
      </p>
      <div class="product-detail__actions">
        <div class="qty-stepper">
          <button id="qtyDown">−</button>
          <span id="qtyValue">1</span>
          <button id="qtyUp">+</button>
        </div>
        <button class="btn btn--marigold" id="addToCartBtn" ${outOfStock ? 'disabled' : ''}>
          ${outOfStock ? 'Sold out' : 'Add to cart'}
        </button>
        <button class="btn btn--ghost" id="wishlistBtn">&hearts; Wishlist</button>
      </div>
      <p class="form-status" id="detailStatus" role="status" aria-live="polite"></p>
    </div>
  `;

  document.getElementById('qtyUp').addEventListener('click', () => {
    currentQty = Math.min(currentQty + 1, p.stock || 1);
    document.getElementById('qtyValue').textContent = currentQty;
  });
  document.getElementById('qtyDown').addEventListener('click', () => {
    currentQty = Math.max(1, currentQty - 1);
    document.getElementById('qtyValue').textContent = currentQty;
  });
  document.getElementById('addToCartBtn').addEventListener('click', addCurrentToCart);
  document.getElementById('wishlistBtn').addEventListener('click', toggleCurrentWishlist);

  checkWishlistState(p.id);
}

async function addCurrentToCart() {
  const status = document.getElementById('detailStatus');
  if (!isLoggedIn()) { window.location.href = 'auth.html'; return; }
  try {
    await apiPost('/cart', { product_id: currentProduct.id, quantity: currentQty }, true);
    status.textContent = 'Added to cart.';
    status.className = 'form-status is-success';
    updateCartBadge();
  } catch (err) {
    status.textContent = err.message || 'Could not add to cart.';
    status.className = 'form-status is-error';
  }
}

async function checkWishlistState(productId) {
  if (!isLoggedIn()) return;
  try {
    const items = await apiGet('/wishlist', true);
    if (items.some((p) => p.id === productId)) {
      document.getElementById('wishlistBtn').textContent = '♥ In wishlist';
    }
  } catch (err) { /* fine */ }
}

async function toggleCurrentWishlist() {
  if (!isLoggedIn()) { window.location.href = 'auth.html'; return; }
  const btn = document.getElementById('wishlistBtn');
  try {
    if (btn.textContent.includes('In wishlist')) {
      await apiDelete(`/wishlist/${currentProduct.id}`, true);
      btn.textContent = '♥ Wishlist';
      showToast('Removed from wishlist.');
    } else {
      await apiPost('/wishlist', { product_id: currentProduct.id }, true);
      btn.textContent = '♥ In wishlist';
      showToast('Added to wishlist.');
    }
  } catch (err) {
    showToast(err.message || 'Could not update wishlist.');
  }
}
