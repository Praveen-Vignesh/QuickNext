import { Router } from 'express';
import { listProducts, listCategories, getProduct } from '../controllers/product.controller.js';

const router = Router();

// Must come before '/:id', or Express reads "categories" as a product id.
router.get('/categories', listCategories);

router.get('/', listProducts);
router.get('/:id', getProduct);

export default router;
