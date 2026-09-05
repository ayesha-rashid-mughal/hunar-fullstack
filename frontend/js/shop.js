// js/shop.js — shop.html only
let currentCategory = 'all';
let currentSearch = '';
let wishlistIds = new Set();

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  currentCategory = params.get('category') || 'all';

  await loadWishlistIds();
  await loadFilterChips();
  await loadShopProducts();

  document.getElementById('searchInput').addEventListener('input', debounce((e) => {
    currentSearch = e.target.value.trim();
    loadShopProducts();
  }, 350));
});

async function loadWishlistIds() {
  if (!isLoggedIn()) return;
  try {
    const items = await apiGet('/wishlist', true);
    wishlistIds = new Set(items.map((p) => p.id));
  } catch (err) { /* not logged in or empty — fine */ }
}

async function loadFilterChips() {
  const wrap = document.getElementById('filterChips');
  try {
    const categories = await apiGet('/products/categories');
    categories.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.dataset.cat = c.category;
      btn.textContent = `${c.category} (${c.product_count})`;
      wrap.appendChild(btn);
    });
    updateActiveChip();
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      currentCategory = btn.dataset.cat;
      updateActiveChip();
      loadShopProducts();
    });
  } catch (err) { /* categories are non-critical to show */ }
}
function updateActiveChip() {
  document.querySelectorAll('.chip').forEach((c) => {
    c.classList.toggle('chip--active', c.dataset.cat === currentCategory);
  });
}

async function loadShopProducts() {
  const grid = document.getElementById('shopGrid');
  try {
    const query = new URLSearchParams();
    if (currentCategory !== 'all') query.set('category', currentCategory);
    if (currentSearch) query.set('search', currentSearch);
    const products = await apiGet(`/products?${query.toString()}`);

    if (products.length === 0) {
      grid.innerHTML = `<p class="empty-note">No products match that search.</p>`;
      return;
    }
    grid.innerHTML = products.map(renderProductCard).join('');
    attachProductCardHandlers(grid);
    grid.querySelectorAll('[data-wishlist]').forEach((btn) => {
      if (wishlistIds.has(Number(btn.dataset.wishlist))) btn.classList.add('is-active');
    });
  } catch (err) {
    grid.innerHTML = `<p class="empty-note">Couldn't load products — is the backend running on port 5000?</p>`;
  }
}

function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}
