import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  createOrder,
  confirmPayment,
  cancelOrder,
  myOrders,
} from '../controllers/order.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/', createOrder); // reserve stock + create payment intent
router.post('/confirm', confirmPayment); // verify signature + mark paid
router.post('/:id/cancel', cancelOrder); // give reserved stock back
router.get('/mine', myOrders);

export default router;
