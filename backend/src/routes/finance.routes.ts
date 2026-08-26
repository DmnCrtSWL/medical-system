import { Router } from 'express';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getFinancialSummary,
} from '../controllers/finance.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas financieras estan protegidas por autenticacion JWT
router.use(authenticateToken);

router.get('/summary', getFinancialSummary);
router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
