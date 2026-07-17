import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireVendor } from '../middleware/role.middleware.js';
import {
  listOwnProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listVendorOrders,
  updateOrderStatus,
  dashboard,
} from '../controllers/vendor.controller.js';

const router = Router();

// Every vendor route is behind both guards.
router.use(requireAuth, requireVendor);

router.get('/products', listOwnProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/orders', listVendorOrders);
router.patch('/orders/:id/status', updateOrderStatus);

router.get('/dashboard', dashboard);

export default router;
