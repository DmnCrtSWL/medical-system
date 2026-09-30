import { Router } from 'express';
import { login, getMe, verifySetPasswordTokenHandler, setPassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateToken, getMe);

// Rutas para flujo de invitacion y seteo de contrasenas
router.get('/verify-set-password-token', verifySetPasswordTokenHandler);
router.post('/set-password', setPassword);

export default router;
