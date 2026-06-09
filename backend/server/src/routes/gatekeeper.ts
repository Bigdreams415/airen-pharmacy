// src/routes/gatekeeper.ts
import { Router } from 'express';
import { GatekeeperController } from '../controllers/GatekeeperController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// GET /api/gatekeeper/code - Get current access code (requires auth)
router.get('/code', AuthMiddleware.requireAuth, GatekeeperController.getAccessCode);

// POST /api/gatekeeper/code - Update access code (requires auth)
router.post('/code', AuthMiddleware.requireAuth, GatekeeperController.updateAccessCode);

// POST /api/gatekeeper/verify - Verify access code (public endpoint)
router.post('/verify', GatekeeperController.verifyAccessCode);

export default router;