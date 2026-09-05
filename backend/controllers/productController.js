// controllers/productController.js
const pool = require('../config/db');

// GET /api/products?category=Pottery&search=vase
async function getAllProducts(req, res) {
  try {
    const { category, search } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    if (category && category !== 'all') { sql += ' AND category = ?'; params.push(category); }
    if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('getAllProducts error:', err.message);
    res.status(500).json({ error: 'Could not load products.' });
  }
}

// GET /api/products/categories — distinct categories with counts
async function getCategories(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT category, COUNT(*) AS product_count, MIN(image) AS sample_image
       FROM products GROUP BY category ORDER BY category ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('getCategories error:', err.message);
    res.status(500).json({ error: 'Could not load categories.' });
  }
}

// GET /api/products/:id
async function getProductById(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getProductById error:', err.message);
    res.status(500).json({ error: 'Could not load product.' });
  }
}

// POST /api/products  (admin only)
async function createProduct(req, res) {
  try {
    const { name, description, price, category, image, stock } = req.body;
    if (!name || !price || !category || !image) {
      return res.status(400).json({ error: 'name, price, category and image are required.' });
    }
    const [result] = await pool.query(
      `INSERT INTO products (name, description, price, category, image, stock) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description || '', price, category, image, stock || 0]
    );
    res.status(201).json({ id: result.insertId, message: 'Product created.' });
  } catch (err) {
    console.error('createProduct error:', err.message);
    res.status(500).json({ error: 'Could not create product.' });
  }
}

// PUT /api/products/:id  (admin only)
async function updateProduct(req, res) {
  try {
    const { name, description, price, category, image, stock } = req.body;
    const [result] = await pool.query(
      `UPDATE products SET name = ?, description = ?, price = ?, category = ?, image = ?, stock = ? WHERE id = ?`,
      [name, description, price, category, image, stock, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product updated.' });
  } catch (err) {
    console.error('updateProduct error:', err.message);
    res.status(500).json({ error: 'Could not update product.' });
  }
}

// DELETE /api/products/:id  (admin only)
async function deleteProduct(req, res) {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    console.error('deleteProduct error:', err.message);
    res.status(500).json({ error: 'Could not delete product.' });
  }
}

module.exports = { getAllProducts, getCategories, getProductById, createProduct, updateProduct, deleteProduct };
