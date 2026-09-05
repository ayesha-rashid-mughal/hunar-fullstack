// controllers/orderController.js
const pool = require('../config/db');

// POST /api/orders  { shipping_address }
// Turns the customer's current cart into an order. Uses a
// transaction so it's impossible to end up with an order that
// has no items, or a cart that's cleared without an order
// being created — it's all-or-nothing.
async function checkout(req, res) {
  const connection = await pool.getConnection();
  try {
    const { shipping_address } = req.body;
    if (!shipping_address) {
      connection.release();
      return res.status(400).json({ error: 'shipping_address is required.' });
    }

    await connection.beginTransaction();

    const [cartRows] = await connection.query(
      `SELECT ci.quantity, p.id AS product_id, p.name, p.price, p.stock
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.customer_id = ?`,
      [req.user.id]
    );

    if (cartRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: 'Your cart is empty.' });
    }

    for (const item of cartRows) {
      if (item.quantity > item.stock) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({ error: `Only ${item.stock} left of "${item.name}".` });
      }
    }

    const total = cartRows.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_id, total_amount, shipping_address) VALUES (?, ?, ?)',
      [req.user.id, total, shipping_address]
    );
    const orderId = orderResult.insertId;

    for (const item of cartRows) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.price, item.quantity]
      );
      await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await connection.query('DELETE FROM cart_items WHERE customer_id = ?', [req.user.id]);

    await connection.commit();
    res.status(201).json({ orderId, total, message: 'Order placed.' });
  } catch (err) {
    await connection.rollback();
    console.error('checkout error:', err.message);
    res.status(500).json({ error: 'Could not place order.' });
  } finally {
    connection.release();
  }
}

// GET /api/orders — the logged-in customer's own order history
async function getMyOrders(req, res) {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    for (const order of orders) {
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    console.error('getMyOrders error:', err.message);
    res.status(500).json({ error: 'Could not load orders.' });
  }
}

module.exports = { checkout, getMyOrders };
