// controllers/adminController.js
const pool = require('../config/db');

// GET /api/admin/stats
async function getStats(req, res) {
  try {
    const [[productCount]] = await pool.query('SELECT COUNT(*) AS total FROM products');
    const [[customerCount]] = await pool.query('SELECT COUNT(*) AS total FROM customers');
    const [[orderCount]] = await pool.query('SELECT COUNT(*) AS total FROM orders');
    const [[revenue]] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status != 'cancelled'`
    );
    const [[pendingCount]] = await pool.query(`SELECT COUNT(*) AS total FROM orders WHERE status = 'pending'`);

    res.json({
      totalProducts: productCount.total,
      totalCustomers: customerCount.total,
      totalOrders: orderCount.total,
      totalRevenue: Number(revenue.total),
      pendingOrders: pendingCount.total,
    });
  } catch (err) {
    console.error('getStats error:', err.message);
    res.status(500).json({ error: 'Could not load stats.' });
  }
}

// GET /api/admin/orders — every order, with customer info
async function getAllOrders(req, res) {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, c.name AS customer_name, c.email AS customer_email
       FROM orders o JOIN customers c ON c.id = o.customer_id
       ORDER BY o.created_at DESC`
    );
    for (const order of orders) {
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    console.error('getAllOrders error:', err.message);
    res.status(500).json({ error: 'Could not load orders.' });
  }
}

// PATCH /api/admin/orders/:id/status  { status }
async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }
    const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found.' });
    res.json({ message: 'Order status updated.' });
  } catch (err) {
    console.error('updateOrderStatus error:', err.message);
    res.status(500).json({ error: 'Could not update order.' });
  }
}

module.exports = { getStats, getAllOrders, updateOrderStatus };
