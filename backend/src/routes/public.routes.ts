import { Router } from 'express';
import { getPlans, checkout, searchServiceLocations } from '../controllers/subscription.controller';
import { getQuestionnaireByToken, saveQuestionnaireByToken } from '../controllers/questionnaire.controller';

const router = Router();

// Rutas públicas de la landing (sin autenticación)
router.get('/plans', getPlans);
router.post('/checkout', checkout);
router.get('/locations', searchServiceLocations);

// Cuestionario de descubrimiento: acceso solo con el link único (token)
router.get('/questionnaire/:token', getQuestionnaireByToken);
router.put('/questionnaire/:token', saveQuestionnaireByToken);

export default router;
