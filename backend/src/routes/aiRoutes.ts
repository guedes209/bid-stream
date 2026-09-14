import { Router } from 'express';
import { generateSmartListing } from '../controllers/aiController';

const router = Router();

// Rota: POST /api/ai/smart-listing
router.post('/smart-listing', generateSmartListing);

export default router;
