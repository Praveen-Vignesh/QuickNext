import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { googleLogin, passwordLogin, me, selectRole } from '../controllers/auth.controller.js';

const router = Router();

router.post('/google', googleLogin);
router.post('/login', passwordLogin); // seeded demo accounts
router.get('/me', requireAuth, me);
router.post('/role', requireAuth, selectRole);

export default router;
