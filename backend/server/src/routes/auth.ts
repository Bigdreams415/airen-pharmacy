// src/routes/auth.ts
import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// POST /api/auth/create-account - Create owner account
router.post('/create-account', AuthController.createAccount);

// POST /api/auth/login - Owner login
router.post('/login', AuthController.login);

// GET /api/auth/security-questions/:username - Get security questions for recovery
router.get('/security-questions/:username', AuthController.getSecurityQuestions);

// POST /api/auth/reset-password - Reset password with security questions and recovery code
router.post('/reset-password', AuthController.resetPassword);

// POST /api/auth/change-password - Change password (requires auth)
router.post('/change-password', AuthMiddleware.requireAuth, AuthController.changePassword);

// POST /api/auth/verify-token - Verify token validity
router.post('/verify-token', AuthController.verifyToken);

// POST /api/auth/logout - Logout
router.post('/logout', AuthController.logout);

export default router;