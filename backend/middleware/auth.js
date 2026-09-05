// middleware/auth.js
// -------------------------------------------------------
// How auth works here, in plain terms:
// 1. On login, the server signs a JWT containing { id, role }
//    and hands it to the frontend.
// 2. The frontend stores that token and sends it back on every
//    request in an "Authorization: Bearer <token>" header.
// 3. requireAuth checks that header, verifies the token hasn't
//    been tampered with, and attaches req.user for controllers
//    to use — no server-side session storage needed at all.
// -------------------------------------------------------
const jwt = require('jsonwebtoken');
require('dotenv').config();

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Your session has expired — please log in again.' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access only.' });
    }
    next();
  });
}

module.exports = { requireAuth, requireAdmin };
