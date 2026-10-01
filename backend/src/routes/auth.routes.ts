import { Router } from 'express';
import {
  login,
  getMe,
  verifySetPasswordTokenHandler,
  setPassword,
  checkSmtpStatus,
  sendTestEmailHandler,
} from '../controllers/auth.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateToken, getMe);

// Rutas para flujo de invitacion y seteo de contrasenas
router.get('/verify-set-password-token', verifySetPasswordTokenHandler);
router.post('/set-password', setPassword);

// Rutas de diagnóstico y prueba de entrega SMTP (Solo administradores)
router.get('/smtp-status', authenticateToken, authorizeRole(['ADMIN', 'SUPERADMIN']), checkSmtpStatus);
router.post('/test-email', authenticateToken, authorizeRole(['ADMIN', 'SUPERADMIN']), sendTestEmailHandler);

export default router;
