import { Router } from 'express';
import { getPortalSummary, updatePaymentMethod, searchServiceLocations } from '../controllers/subscription.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Portal de cliente: exclusivo para suscriptores B2C
router.use(authenticateToken);
router.use(authorizeRole(['CLIENT']));

router.get('/summary', getPortalSummary);
router.put('/payment-method', updatePaymentMethod);
router.get('/locations', searchServiceLocations);

export default router;
