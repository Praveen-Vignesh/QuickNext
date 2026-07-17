import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  googleLogin,
  register,
  passwordLogin,
  me,
  selectRole,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/google', googleLogin);
router.post('/register', register); // self-serve signup
router.post('/login', passwordLogin); // registered + seeded demo accounts
router.get('/me', requireAuth, me);
router.post('/role', requireAuth, selectRole);

export default router;
