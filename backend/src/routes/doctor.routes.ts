import { Router } from 'express';
import {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctor.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { uploadLicense } from '../middlewares/upload.middleware';

const router = Router();

// Middleware de Autenticacion JWT para todas las rutas de doctores
router.use(authenticateToken);

router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.post('/', uploadLicense.single('licenseFile'), createDoctor);
router.put('/:id', uploadLicense.single('licenseFile'), updateDoctor);
router.delete('/:id', deleteDoctor);

export default router;
