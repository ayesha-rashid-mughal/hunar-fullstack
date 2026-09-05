// js/nav.js
// -------------------------------------------------------
// Fills in the nav's login/account area based on whether
// someone is logged in. Every page includes a <nav id="siteNav">
// shell in its HTML; this script only touches the right-side
// account area, not the whole nav.
// -------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  renderNavAccountArea();
  updateCartBadge();
  const burger = document.getElementById('navBurger');
  const mobile = document.getElementById('navMobile');
  if (burger && mobile) {
    burger.addEventListener('click', () => {
      const open = mobile.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
  }
});

function renderNavAccountArea() {
  const area = document.getElementById('navAccountArea');
  if (!area) return;
  const user = getUser();

  if (!user) {
    area.innerHTML = `<a href="auth.html" class="btn btn--ghost btn--small">Log in</a>`;
    return;
  }

  if (user.role === 'admin') {
    area.innerHTML = `
      <a href="admin.html" class="nav-account-link">Admin dashboard</a>
      <button class="btn btn--ghost btn--small" id="logoutBtn">Log out</button>`;
  } else {
    area.innerHTML = `
      <a href="account.html" class="nav-account-link">Hi, ${escapeHtml(user.name.split(' ')[0])}</a>
      <button class="btn btn--ghost btn--small" id="logoutBtn">Log out</button>`;
  }
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });
}

async function updateCartBadge() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  if (!isLoggedIn()) { badge.textContent = '0'; return; }
  try {
    const cart = await apiGet('/cart', true);
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = count;
  } catch (err) {
    badge.textContent = '0';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function showToast(message) {
  let toast = document.getElementById('sharedToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'sharedToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

// Redirect helpers used by pages that require login
function requireLoginOrRedirect() {
  if (!isLoggedIn()) {
    window.location.href = 'auth.html';
    return false;
  }
  return true;
}
function requireAdminOrRedirect() {
  if (!isLoggedIn() || !isAdmin()) {
    window.location.href = 'auth.html';
    return false;
  }
  return true;
}
