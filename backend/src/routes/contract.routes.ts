import { Router } from 'express';
import {
  getContracts,
  getContractById,
  createContract,
  downloadContractPdf,
  updateContract,
  deleteContract,
} from '../controllers/contract.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Middleware de Autenticacion JWT para todas las rutas de contratos
router.use(authenticateToken);

router.get('/', getContracts);
router.get('/:id', getContractById);
router.get('/:id/pdf', downloadContractPdf);
router.post('/', createContract);
router.put('/:id', updateContract);
router.delete('/:id', deleteContract);

export default router;
