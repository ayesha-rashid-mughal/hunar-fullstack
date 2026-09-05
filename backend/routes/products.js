// routes/products.js
const express = require('express');
const router = express.Router();
const {
  getAllProducts, getCategories, getProductById,
  createProduct, updateProduct, deleteProduct,
} = require('../controllers/productController');
const { requireAdmin } = require('../middleware/auth');

router.get('/categories', getCategories);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', requireAdmin, createProduct);
router.put('/:id', requireAdmin, updateProduct);
router.delete('/:id', requireAdmin, deleteProduct);

module.exports = router;
