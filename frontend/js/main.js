// js/main.js — index.html only
const PKR = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`;

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadCategories();
  loadFeatured();
});

async function loadStats() {
  try {
    const [products, categories] = await Promise.all([
      apiGet('/products'),
      apiGet('/products/categories'),
    ]);
    countUp('statProducts', products.length);
    countUp('statCategories', categories.length);
    // Customer count isn't public — approximate via admin stats if logged
    // in as admin, otherwise just show the product/category counts.
    if (isAdmin()) {
      const stats = await apiGet('/admin/stats', true);
      countUp('statCustomers', stats.totalCustomers);
    } else {
      document.getElementById('statCustomers').textContent = '—';
      document.getElementById('statCustomers').nextElementSibling.textContent = 'Direct to artisan';
    }
  } catch (err) {
    console.error(err);
  }
}
function countUp(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = current;
  }, 25);
}

async function loadCategories() {
  const grid = document.getElementById('catGrid');
  try {
    const categories = await apiGet('/products/categories');
    grid.innerHTML = categories.map((c) => `
      <a href="shop.html?category=${encodeURIComponent(c.category)}" class="cat-card">
        <img src="${imgUrl(c.sample_image)}" alt="" loading="lazy">
        <div class="cat-card__overlay">
          <h3>${escapeHtml(c.category)}</h3>
          <span>${c.product_count} piece${c.product_count === 1 ? '' : 's'}</span>
        </div>
      </a>
    `).join('');
  } catch (err) {
    grid.innerHTML = `<p class="empty-note">Couldn't load categories — is the backend running on port 5000?</p>`;
  }
}

async function loadFeatured() {
  const grid = document.getElementById('featuredGrid');
  try {
    const products = await apiGet('/products');
    grid.innerHTML = products.slice(0, 8).map(renderProductCard).join('');
    attachProductCardHandlers(grid);
  } catch (err) {
    grid.innerHTML = `<p class="empty-note">Couldn't load products — is the backend running on port 5000?</p>`;
  }
}

// Shared across pages that render product cards (index + shop)
function renderProductCard(p) {
  const lowStock = p.stock <= 3 && p.stock > 0;
  const outOfStock = p.stock <= 0;
  return `
    <div class="product-card">
      <div class="product-card__img">
        <img src="${imgUrl(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" onclick="window.location.href='product.html?id=${p.id}'" style="cursor:pointer">
        <button class="wishlist-heart" data-wishlist="${p.id}" aria-label="Add to wishlist">&hearts;</button>
      </div>
      <div class="product-card__body">
        <span class="product-card__tag">${escapeHtml(p.category)}</span>
        <h3><a href="product.html?id=${p.id}">${escapeHtml(p.name)}</a></h3>
        <div class="product-card__foot">
          <span class="product-card__price">${PKR(p.price)}</span>
          <button class="btn btn--marigold btn--small" data-add="${p.id}" ${outOfStock ? 'disabled' : ''}>
            ${outOfStock ? 'Sold out' : 'Add'}
          </button>
        </div>
        <span class="product-card__stock ${lowStock ? 'is-low' : ''}">${outOfStock ? 'Out of stock' : lowStock ? `Only ${p.stock} left` : `${p.stock} in stock`}</span>
      </div>
    </div>`;
}

function attachProductCardHandlers(container) {
  container.querySelectorAll('[data-add]').forEach((btn) =>
    btn.addEventListener('click', () => addToCartFlow(Number(btn.dataset.add)))
  );
  container.querySelectorAll('[data-wishlist]').forEach((btn) =>
    btn.addEventListener('click', () => toggleWishlistFlow(Number(btn.dataset.wishlist), btn))
  );
}

async function addToCartFlow(productId) {
  if (!isLoggedIn()) { window.location.href = 'auth.html'; return; }
  try {
    await apiPost('/cart', { product_id: productId, quantity: 1 }, true);
    showToast('Added to cart.');
    updateCartBadge();
  } catch (err) {
    showToast(err.message || 'Could not add to cart.');
  }
}

async function toggleWishlistFlow(productId, btn) {
  if (!isLoggedIn()) { window.location.href = 'auth.html'; return; }
  try {
    if (btn.classList.contains('is-active')) {
      await apiDelete(`/wishlist/${productId}`, true);
      btn.classList.remove('is-active');
      showToast('Removed from wishlist.');
    } else {
      await apiPost('/wishlist', { product_id: productId }, true);
      btn.classList.add('is-active');
      showToast('Added to wishlist.');
    }
  } catch (err) {
    showToast(err.message || 'Could not update wishlist.');
  }
}

function imgUrl(path) {
  if (!path) return 'https://picsum.photos/seed/hunar-fallback/500/500';
  if (path.startsWith('http')) return path;
  return path; // relative path into /assets — served directly by Express static
}
