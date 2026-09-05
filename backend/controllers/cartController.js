// controllers/cartController.js
const pool = require('../config/db');

// GET /api/cart  (auth required — returns the logged-in customer's cart)
async function getCart(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.price, p.image, p.stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.customer_id = ?
       ORDER BY ci.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getCart error:', err.message);
    res.status(500).json({ error: 'Could not load cart.' });
  }
}

// POST /api/cart  { product_id, quantity }
async function addToCart(req, res) {
  try {
    const { product_id, quantity } = req.body;
    if (!product_id) return res.status(400).json({ error: 'product_id is required.' });
    const qty = quantity && quantity > 0 ? quantity : 1;

    await pool.query(
      `INSERT INTO cart_items (customer_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [req.user.id, product_id, qty]
    );
    res.status(201).json({ message: 'Added to cart.' });
  } catch (err) {
    console.error('addToCart error:', err.message);
    res.status(500).json({ error: 'Could not add to cart.' });
  }
}

// PUT /api/cart/:id  { quantity }
async function updateCartItem(req, res) {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity must be at least 1.' });

    const [result] = await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND customer_id = ?',
      [quantity, req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cart item not found.' });
    res.json({ message: 'Cart updated.' });
  } catch (err) {
    console.error('updateCartItem error:', err.message);
    res.status(500).json({ error: 'Could not update cart.' });
  }
}

// DELETE /api/cart/:id
async function removeFromCart(req, res) {
  try {
    const [result] = await pool.query(
      'DELETE FROM cart_items WHERE id = ? AND customer_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cart item not found.' });
    res.json({ message: 'Removed from cart.' });
  } catch (err) {
    console.error('removeFromCart error:', err.message);
    res.status(500).json({ error: 'Could not remove item.' });
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeFromCart };
