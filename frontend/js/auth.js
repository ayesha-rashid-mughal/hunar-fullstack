// js/auth.js — auth.html only
document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, no reason to see this page.
  if (isLoggedIn()) {
    window.location.href = isAdmin() ? 'admin.html' : 'index.html';
    return;
  }

  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const adminForm = document.getElementById('adminLoginForm');

  loginTab.addEventListener('click', () => switchTab('login'));
  registerTab.addEventListener('click', () => switchTab('register'));
  document.getElementById('showAdminLogin').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    adminForm.style.display = adminForm.style.display === 'none' ? 'block' : 'none';
  });

  function switchTab(which) {
    adminForm.style.display = 'none';
    loginTab.classList.toggle('is-active', which === 'login');
    registerTab.classList.toggle('is-active', which === 'register');
    loginForm.style.display = which === 'login' ? 'block' : 'none';
    registerForm.style.display = which === 'register' ? 'block' : 'none';
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('loginStatus');
    status.textContent = ''; status.className = 'form-status';
    try {
      const result = await apiPost('/auth/login', {
        email: document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value,
      });
      setSession(result.token, result.user);
      window.location.href = 'index.html';
    } catch (err) {
      status.textContent = err.message || 'Could not log in.';
      status.className = 'form-status is-error';
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('registerStatus');
    status.textContent = ''; status.className = 'form-status';
    try {
      const result = await apiPost('/auth/register', {
        name: document.getElementById('regName').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        password: document.getElementById('regPassword').value,
        phone: document.getElementById('regPhone').value.trim(),
        address: document.getElementById('regAddress').value.trim(),
      });
      setSession(result.token, result.user);
      window.location.href = 'index.html';
    } catch (err) {
      status.textContent = err.message || 'Could not create account.';
      status.className = 'form-status is-error';
    }
  });

  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('adminLoginStatus');
    status.textContent = ''; status.className = 'form-status';
    try {
      const result = await apiPost('/auth/admin/login', {
        email: document.getElementById('adminEmail').value.trim(),
        password: document.getElementById('adminPassword').value,
      });
      setSession(result.token, result.user);
      window.location.href = 'admin.html';
    } catch (err) {
      status.textContent = err.message || 'Could not log in.';
      status.className = 'form-status is-error';
    }
  });
});
