import { Router } from 'express';
import {
  getContracts,
  getContractById,
  createContract,
  downloadContractPdf,
  updateContract,
  deleteContract,
} from '../controllers/contract.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Middleware de Autenticacion JWT y autorizacion para ADMIN
router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

router.get('/', getContracts);
router.get('/:id', getContractById);
router.get('/:id/pdf', downloadContractPdf);
router.post('/', createContract);
router.put('/:id', updateContract);
router.delete('/:id', deleteContract);

export default router;
