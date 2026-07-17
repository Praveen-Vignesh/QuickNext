import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getCart, replaceCart, clearCart } from '../controllers/cart.controller.js';

const router = Router();

router.use(requireAuth); // the basket is always tied to a user

router.get('/', getCart);
router.put('/', replaceCart);
router.delete('/', clearCart);

export default router;
