import { Router } from 'express';
import { getPlans, checkout, searchServiceLocations } from '../controllers/subscription.controller';

const router = Router();

// Rutas públicas de la landing (sin autenticación)
router.get('/plans', getPlans);
router.post('/checkout', checkout);
router.get('/locations', searchServiceLocations);

export default router;
