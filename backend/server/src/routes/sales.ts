import { Router } from 'express';
import { SaleController } from '../controllers/saleController';
import { AuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// ========== MAIN SALES ROUTES ==========

// POST /api/sales - Create new sale
router.post('/', SaleController.createSale);
  
// GET /api/sales - Get all sales with pagination
router.get('/', AuthMiddleware.requireAuth, SaleController.getSales);

// ⚠️ SPECIFIC ROUTES MUST COME BEFORE DYNAMIC ROUTES

// GET /api/sales/by-date - Get sales by date (BEFORE /:id)
router.get('/by-date', AuthMiddleware.requireAuth, SaleController.getSalesBySpecificDate);

// GET /api/sales/today - Get today's sales with summary (BEFORE /:id)
router.get('/today', AuthMiddleware.requireAuth, SaleController.getTodaySales);

// GET /api/sales/:id - Get sale by ID with items (AFTER specific routes)
router.get('/:id', AuthMiddleware.requireAuth, SaleController.getSaleById);

// POST /api/sales/:id/refund - Refund a sale
router.post('/:id/refund', SaleController.refundSale);

export default router;