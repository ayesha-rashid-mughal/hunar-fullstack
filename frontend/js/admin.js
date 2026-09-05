// js/admin.js — admin.html only
const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAdminOrRedirect()) return;
  loadStats();
  loadProducts();
  loadOrders();
  initTabs();
  initProductModal();
});

function initTabs() {
  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('is-active'));
      document.querySelectorAll('.admin-panel').forEach((p) => p.classList.remove('is-active'));
      tab.classList.add('is-active');
      document.getElementById(tab.dataset.panel).classList.add('is-active');
    });
  });
}

async function loadStats() {
  try {
    const stats = await apiGet('/admin/stats', true);
    document.getElementById('statProductsAdmin').textContent = stats.totalProducts;
    document.getElementById('statCustomersAdmin').textContent = stats.totalCustomers;
    document.getElementById('statOrdersAdmin').textContent = stats.totalOrders;
    document.getElementById('statPendingAdmin').textContent = stats.pendingOrders;
    document.getElementById('statRevenueAdmin').textContent = `Rs. ${Number(stats.totalRevenue).toLocaleString('en-PK')}`;
  } catch (err) {
    showToast(err.message || 'Could not load stats.');
  }
}

/* ---------- products panel ---------- */
async function loadProducts() {
  const tbody = document.querySelector('#productsTable tbody');
  try {
    const products = await apiGet('/products');
    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-note">No products yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = products.map((p) => `
      <tr>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.category)}</td>
        <td>Rs. ${Number(p.price).toLocaleString('en-PK')}</td>
        <td>${p.stock}</td>
        <td style="white-space:nowrap;">
          <button class="btn btn--ghost btn--small" data-edit="${p.id}">Edit</button>
          <button class="btn btn--danger btn--small" data-delete="${p.id}">Delete</button>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('[data-edit]').forEach((b) =>
      b.addEventListener('click', () => openProductModal(products.find((p) => p.id === Number(b.dataset.edit))))
    );
    tbody.querySelectorAll('[data-delete]').forEach((b) =>
      b.addEventListener('click', () => deleteProduct(b.dataset.delete))
    );
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-note">Couldn't load products.</td></tr>`;
  }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  try {
    await apiDelete(`/products/${id}`, true);
    showToast('Product deleted.');
    loadProducts();
    loadStats();
  } catch (err) {
    showToast(err.message || 'Could not delete product.');
  }
}

function initProductModal() {
  const overlay = document.getElementById('productModalOverlay');
  const form = document.getElementById('productForm');

  document.getElementById('addProductBtn').addEventListener('click', () => openProductModal(null));
  document.getElementById('productModalClose').addEventListener('click', closeProductModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeProductModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('productFormStatus');
    const id = document.getElementById('productId').value;
    const payload = {
      name: document.getElementById('pName').value.trim(),
      description: document.getElementById('pDescription').value.trim(),
      price: Number(document.getElementById('pPrice').value),
      category: document.getElementById('pCategory').value.trim(),
      image: document.getElementById('pImage').value.trim(),
      stock: Number(document.getElementById('pStock').value),
    };
    try {
      if (id) {
        await apiPut(`/products/${id}`, payload, true);
        showToast('Product updated.');
      } else {
        await apiPost('/products', payload, true);
        showToast('Product created.');
      }
      closeProductModal();
      loadProducts();
      loadStats();
    } catch (err) {
      status.textContent = err.message || 'Could not save product.';
      status.className = 'form-status is-error';
    }
  });
}

function openProductModal(product) {
  document.getElementById('productModalTitle').textContent = product ? 'Edit product' : 'Add product';
  document.getElementById('productId').value = product ? product.id : '';
  document.getElementById('pName').value = product ? product.name : '';
  document.getElementById('pDescription').value = product ? product.description || '' : '';
  document.getElementById('pPrice').value = product ? product.price : '';
  document.getElementById('pCategory').value = product ? product.category : '';
  document.getElementById('pImage').value = product ? product.image : '';
  document.getElementById('pStock').value = product ? product.stock : '';
  document.getElementById('productFormStatus').textContent = '';
  document.getElementById('productModalOverlay').classList.add('is-open');
}
function closeProductModal() {
  document.getElementById('productModalOverlay').classList.remove('is-open');
}

/* ---------- orders panel ---------- */
async function loadOrders() {
  const tbody = document.querySelector('#ordersTable tbody');
  try {
    const orders = await apiGet('/admin/orders', true);
    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-note">No orders yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = orders.map((order) => `
      <tr>
        <td>#${order.id}</td>
        <td>${escapeHtml(order.customer_name)}<br><span style="color:var(--faint); font-size:0.78rem;">${escapeHtml(order.customer_email)}</span></td>
        <td>Rs. ${Number(order.total_amount).toLocaleString('en-PK')}</td>
        <td>${new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
        <td>
          <select class="status-select" data-status="${order.status}" data-order="${order.id}">
            ${ORDER_STATUSES.map((s) => `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}
          </select>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('.status-select').forEach((select) => {
      select.addEventListener('change', async (e) => {
        try {
          await apiPatch(`/admin/orders/${e.target.dataset.order}/status`, { status: e.target.value }, true);
          e.target.dataset.status = e.target.value;
          showToast('Order status updated.');
          loadStats();
        } catch (err) {
          showToast(err.message || 'Could not update order.');
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-note">Couldn't load orders.</td></tr>`;
  }
}
