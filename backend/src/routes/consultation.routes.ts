import { Router } from 'express';
import {
  syncConsultations,
  getConsultations,
  getConsultationById,
} from '../controllers/consultation.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de consultas médicas están protegidas por autenticación JWT
router.use(authenticateToken);

router.post('/sync', syncConsultations);
router.get('/', getConsultations);
router.get('/:id', getConsultationById);

export default router;
