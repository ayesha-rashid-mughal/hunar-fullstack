// controllers/wishlistController.js
const pool = require('../config/db');

// GET /api/wishlist
async function getWishlist(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT w.id AS wishlist_id, p.*
       FROM wishlist w
       JOIN products p ON p.id = w.product_id
       WHERE w.customer_id = ?
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getWishlist error:', err.message);
    res.status(500).json({ error: 'Could not load wishlist.' });
  }
}

// POST /api/wishlist  { product_id }
async function addToWishlist(req, res) {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ error: 'product_id is required.' });

    await pool.query(
      `INSERT IGNORE INTO wishlist (customer_id, product_id) VALUES (?, ?)`,
      [req.user.id, product_id]
    );
    res.status(201).json({ message: 'Added to wishlist.' });
  } catch (err) {
    console.error('addToWishlist error:', err.message);
    res.status(500).json({ error: 'Could not add to wishlist.' });
  }
}

// DELETE /api/wishlist/:productId
async function removeFromWishlist(req, res) {
  try {
    await pool.query(
      'DELETE FROM wishlist WHERE customer_id = ? AND product_id = ?',
      [req.user.id, req.params.productId]
    );
    res.json({ message: 'Removed from wishlist.' });
  } catch (err) {
    console.error('removeFromWishlist error:', err.message);
    res.status(500).json({ error: 'Could not remove item.' });
  }
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
