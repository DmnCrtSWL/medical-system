import { Router } from 'express';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getFinancialSummary,
  downloadTransactionReceipt,
  settleTransaction,
} from '../controllers/finance.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas financieras estan protegidas por autenticacion JWT y exclusivas para ADMIN
router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

router.get('/summary', getFinancialSummary);
router.get('/', getTransactions);
router.get('/:id/receipt', downloadTransactionReceipt);
router.get('/transactions/:id/receipt', downloadTransactionReceipt);
router.post('/:id/settle', settleTransaction);
router.post('/transactions/:id/settle', settleTransaction);
router.get('/:id', getTransactionById);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
