// js/wishlist.js — wishlist.html only
document.addEventListener('DOMContentLoaded', () => {
  if (!requireLoginOrRedirect()) return;
  loadWishlistPage();
});

async function loadWishlistPage() {
  const grid = document.getElementById('wishlistGrid');
  try {
    const items = await apiGet('/wishlist', true);
    if (items.length === 0) {
      grid.innerHTML = `<p class="empty-note">Nothing saved yet. <a href="shop.html" style="color: var(--marigold);">Browse the shop →</a></p>`;
      return;
    }
    grid.innerHTML = items.map(renderProductCard).join('');
    attachProductCardHandlers(grid);
    // Every card here is already in the wishlist — mark hearts active,
    // and clicking one removes it from this page immediately.
    grid.querySelectorAll('[data-wishlist]').forEach((btn) => {
      btn.classList.add('is-active');
      btn.addEventListener('click', async (e) => {
        e.stopImmediatePropagation();
        try {
          await apiDelete(`/wishlist/${btn.dataset.wishlist}`, true);
          showToast('Removed from wishlist.');
          loadWishlistPage();
        } catch (err) {
          showToast(err.message || 'Could not remove item.');
        }
      }, { capture: true });
    });
  } catch (err) {
    grid.innerHTML = `<p class="empty-note">Couldn't load your wishlist — is the backend running on port 5000?</p>`;
  }
}
