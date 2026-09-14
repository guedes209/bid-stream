import { Router } from 'express';
import { createAuction, getAuctions } from '../controllers/auctionController';

const router = Router();

router.post('/', createAuction);
router.get('/', getAuctions);

export default router;
