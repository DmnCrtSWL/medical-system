import { Router } from 'express';
import {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctor.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Middleware de Autenticacion JWT para todas las rutas de doctores
router.use(authenticateToken);

router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.post('/', createDoctor);
router.put('/:id', updateDoctor);
router.delete('/:id', deleteDoctor);

export default router;
