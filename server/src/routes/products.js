import { Router } from 'express';
import {
  getProducts,
  getAdminProducts,
  getProductsByIds,
  exportProducts,
  getFacets,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/auth.js';

const router = Router();

// Public, read-heavy, and identical for every visitor at a given moment —
// exactly what an edge/CDN cache is for. Vercel's CDN respects s-maxage and
// will serve these from the edge without hitting the function (or the DB)
// on every request once traffic grows; stale-while-revalidate means a
// product update shows up within ~60s everywhere without a cold cache spike.
const cdnCache = (req, res, next) => {
  res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  next();
};

router.get('/', cdnCache, getProducts);
router.get('/facets', cdnCache, getFacets);
// Must stay above '/:slug' or "admin" would be treated as a product slug.
router.get('/admin/list', protect, admin, getAdminProducts);
router.get('/admin/export', protect, admin, exportProducts);
router.get('/by-ids', getProductsByIds);
router.get('/:slug', cdnCache, getProductBySlug);

router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;
