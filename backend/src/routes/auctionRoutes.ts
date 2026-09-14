import { Router } from 'express';
import { createAuction, getAuctions, placeBid } from '../controllers/auctionController';

const router = Router();

router.post('/', createAuction);
router.get('/', getAuctions);
router.post('/:id/bids', placeBid); // Endpoint do Motor de Lances

export default router;
