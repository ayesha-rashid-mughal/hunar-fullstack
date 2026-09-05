// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const [existing] = await pool.query('SELECT id FROM customers WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO customers (name, email, password_hash, phone, address) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, phone || null, address || null]
    );

    const token = signToken({ id: result.insertId, role: 'customer' });
    res.status(201).json({ token, user: { id: result.insertId, name, email, role: 'customer' } });
  } catch (err) {
    console.error('register error:', err.message);
    res.status(500).json({ error: 'Could not create account.' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const [rows] = await pool.query('SELECT * FROM customers WHERE email = ?', [email]);
    const customer = rows[0];
    if (!customer || !(await bcrypt.compare(password, customer.password_hash))) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const token = signToken({ id: customer.id, role: 'customer' });
    res.json({ token, user: { id: customer.id, name: customer.name, email: customer.email, role: 'customer' } });
  } catch (err) {
    console.error('login error:', err.message);
    res.status(500).json({ error: 'Could not log in.' });
  }
}

// POST /api/auth/admin/login
async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
    const admin = rows[0];
    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const token = signToken({ id: admin.id, role: 'admin' });
    res.json({ token, user: { id: admin.id, name: admin.username, email: admin.email, role: 'admin' } });
  } catch (err) {
    console.error('adminLogin error:', err.message);
    res.status(500).json({ error: 'Could not log in.' });
  }
}

// GET /api/auth/me  — used by the frontend to check "am I still logged in?"
async function me(req, res) {
  try {
    if (req.user.role === 'admin') {
      const [rows] = await pool.query('SELECT id, username, email FROM admins WHERE id = ?', [req.user.id]);
      if (!rows[0]) return res.status(404).json({ error: 'Account not found.' });
      return res.json({ ...rows[0], role: 'admin' });
    }
    const [rows] = await pool.query('SELECT id, name, email, phone, address FROM customers WHERE id = ?', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Account not found.' });
    res.json({ ...rows[0], role: 'customer' });
  } catch (err) {
    console.error('me error:', err.message);
    res.status(500).json({ error: 'Could not load account.' });
  }
}

module.exports = { register, login, adminLogin, me };
