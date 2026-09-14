import { Router } from 'express';
import { analyzeImage } from '../controllers/aiController';

const router = Router();

// Rota síncrona para não onerar o BullMQ com visão computacional
router.post('/analyze-image', analyzeImage);

export default router;
