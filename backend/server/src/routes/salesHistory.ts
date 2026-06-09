import { Router } from 'express';
import { SaleController } from '../controllers/saleController';

const router = Router();

// POST /api/sales-history - Create new sale
router.post('/', SaleController.createSale);
  
// GET /api/sales-history - Get all sales with pagination
router.get('/', SaleController.getSales);

// GET /api/sales-history/by-date - Get sales by date (ADD THIS!)
router.get('/by-date', SaleController.getSalesBySpecificDate);

// GET /api/sales-history/today - Get today's sales with summary
router.get('/today', SaleController.getTodaySales);

// GET /api/sales-history/:id - Get sale by ID with items
router.get('/:id', SaleController.getSaleById);

// POST /api/sales-history/:id/refund - Refund a sale
router.post('/:id/refund', SaleController.refundSale);

export default router;