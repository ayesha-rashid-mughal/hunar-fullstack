// js/account.js — account.html only
const STATUS_LABEL = { pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };

document.addEventListener('DOMContentLoaded', () => {
  if (!requireLoginOrRedirect()) return;
  const user = getUser();
  if (user) document.getElementById('accountGreeting').textContent = `${user.name.split(' ')[0]}'s orders`;
  loadOrders();
});

async function loadOrders() {
  const wrap = document.getElementById('ordersWrap');
  try {
    const orders = await apiGet('/orders', true);
    if (orders.length === 0) {
      wrap.innerHTML = `<p class="empty-note">No orders yet. <a href="shop.html" style="color: var(--marigold);">Start shopping →</a></p>`;
      return;
    }
    wrap.innerHTML = orders.map((order) => `
      <div class="data-table-wrap" style="margin-bottom: 1.2rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 1.1rem 1.2rem; border-bottom: 1px solid var(--line);">
          <div>
            <strong>Order #${order.id}</strong>
            <span style="color: var(--muted); font-size: 0.85rem; margin-left: 0.6rem;">
              ${new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <span class="status-select" data-status="${order.status}" style="pointer-events:none;">${STATUS_LABEL[order.status]}</span>
        </div>
        <table class="data-table">
          <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
          <tbody>
            ${order.items.map((item) => `
              <tr>
                <td>${escapeHtml(item.product_name)}</td>
                <td>${item.quantity}</td>
                <td>Rs. ${Number(item.price).toLocaleString('en-PK')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div style="padding: 1rem 1.2rem; text-align:right; font-family: var(--font-display); color: var(--marigold);">
          Total: Rs. ${Number(order.total_amount).toLocaleString('en-PK')}
        </div>
      </div>
    `).join('');
  } catch (err) {
    wrap.innerHTML = `<p class="empty-note">Couldn't load your orders — is the backend running on port 5000?</p>`;
  }
}
