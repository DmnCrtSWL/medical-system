import { Router } from 'express';
import { getUsers, createUser, deleteUser } from '../controllers/user.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de administración de usuarios requieren autenticación y rol ADMIN
router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

router.get('/', getUsers);
router.post('/', createUser);
router.delete('/:id', deleteUser);

export default router;
