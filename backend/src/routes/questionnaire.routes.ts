import { Router } from 'express';
import { createQuestionnaire, listQuestionnaires } from '../controllers/questionnaire.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Gestión de links de cuestionario: exclusivo para administradores
router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

router.post('/', createQuestionnaire);
router.get('/', listQuestionnaires);

export default router;
