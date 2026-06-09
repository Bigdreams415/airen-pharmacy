import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../models/database';
import { Sale, SaleItem, CreateSaleRequest, SaleWithItems, ApiResponse } from '../types';

export class SaleController {
  // Create a new sale for current pharmacy
  public static async createSale(req: Request, res: Response): Promise<void> {
    try {
      const { items, payment_method }: CreateSaleRequest = req.body;
      const pharmacyId = req.pharmacyId!;

      console.log('Received sale request for pharmacy:', pharmacyId, { items, payment_method });

      // Validate input
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Sale must contain at least one item'
        });
        return;
      }

      if (!payment_method || !['cash', 'card', 'transfer'].includes(payment_method)) {
        res.status(400).json({
          success: false,
          error: 'Valid payment method is required (cash, card, transfer)'
        });
        return;
      }

      const saleId = uuidv4();
      let totalAmount = 0;
      let totalProfit = 0;

      // Use transaction to ensure data consistency
      const result = await dbService.transaction(async (client) => {
        // First, validate all products exist in current pharmacy and have sufficient stock
        for (const item of items) {
          const product = await client.query(
            'SELECT id, name, buy_price, sell_price, stock FROM products WHERE id = $1 AND pharmacy_id = $2',
            [item.product_id, pharmacyId]
          );

          console.log('Product lookup for ID:', item.product_id, 'Result:', product.rows[0]);

          if (!product.rows[0]) {
            throw new Error(`Product not found with ID: ${item.product_id} in current pharmacy. Please refresh the product list.`);
          }

          if (product.rows[0].stock < item.quantity) {
            throw new Error(`Insufficient stock for ${product.rows[0].name}. Available: ${product.rows[0].stock}, Requested: ${item.quantity}`);
          }
        }

        // Create sale record FIRST before any sale items
        await client.query(
          'INSERT INTO sales (id, pharmacy_id, total_amount, total_profit, payment_method) VALUES ($1, $2, $3, $4, $5)',
          [saleId, pharmacyId, 0, 0, payment_method] // Start with 0 values, update later
        );

        // Now process each sale item (sale exists now)
        for (const item of items) {
          // Get product details again within transaction
          const product = await client.query(
            'SELECT id, name, buy_price, sell_price, stock FROM products WHERE id = $1 AND pharmacy_id = $2',
            [item.product_id, pharmacyId]
          );

          // Calculate prices and profit
          const unitBuyPrice = product.rows[0].buy_price;
          const unitSellPrice = item.unit_sell_price;
          const totalSellPrice = unitSellPrice * item.quantity;
          const itemProfit = (unitSellPrice - unitBuyPrice) * item.quantity;

          totalAmount += totalSellPrice;
          totalProfit += itemProfit;

          console.log('Creating sale item for pharmacy:', pharmacyId, {
            productId: item.product_id,
            quantity: item.quantity,
            unitSellPrice,
            totalSellPrice,
            itemProfit
          });

          // Create sale item with pharmacy context
          const saleItemId = uuidv4();
          await client.query(
            `INSERT INTO sale_items (id, pharmacy_id, sale_id, product_id, quantity, unit_sell_price, unit_buy_price, total_sell_price, item_profit) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [saleItemId, pharmacyId, saleId, item.product_id, item.quantity, unitSellPrice, unitBuyPrice, totalSellPrice, itemProfit]
          );

          // Update product stock in current pharmacy
          await client.query(
            'UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND pharmacy_id = $3',
            [item.quantity, item.product_id, pharmacyId]
          );
        }

        // Update sale with final calculated totals
        await client.query(
          'UPDATE sales SET total_amount = $1, total_profit = $2 WHERE id = $3 AND pharmacy_id = $4',
          [totalAmount, totalProfit, saleId, pharmacyId]
        );

        return { saleId, totalAmount, totalProfit };
      });

      // Get the complete sale with items for response
      const sale = await SaleController.getSaleWithItems(saleId, pharmacyId);

      console.log('Sale completed successfully for pharmacy:', pharmacyId, saleId);

      res.status(201).json({
        success: true,
        data: sale,
        message: 'Sale completed successfully'
      });

    } catch (error) {
      console.error('Error creating sale:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create sale'
      });
    }
  }

  // Get all sales for current pharmacy with pagination
  public static async getSales(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      // Get sales with their items for current pharmacy - PostgreSQL JSON aggregation
      const sales = await dbService.all<Sale & { sale_items: any[] }>(`
        SELECT 
          s.*,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', si.id,
              'product_id', si.product_id,
              'quantity', si.quantity,
              'unit_sell_price', si.unit_sell_price,
              'unit_buy_price', si.unit_buy_price,
              'total_sell_price', si.total_sell_price,
              'item_profit', si.item_profit,
              'product_name', p.name
            )
          ) as sale_items
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id AND si.pharmacy_id = $1
        LEFT JOIN products p ON si.product_id = p.id AND p.pharmacy_id = $2
        WHERE s.pharmacy_id = $3
        GROUP BY s.id
        ORDER BY s.created_at DESC 
        LIMIT $4 OFFSET $5
      `, [pharmacyId, pharmacyId, pharmacyId, limit, offset]);

      // Parse the sale_items JSON (PostgreSQL returns as array directly)
      const salesWithItems = sales.map(sale => ({
        ...sale,
        items: sale.sale_items || []
      }));

      // Get total count for current pharmacy
      const totalResult = await dbService.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM sales WHERE pharmacy_id = $1', 
        [pharmacyId]
      );
      const total = totalResult?.count || 0;

      res.json({
        success: true,
        data: salesWithItems,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching sales:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sales'
      });
    }
  }

  // Get sale by ID with items for current pharmacy
  public static async getSaleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const pharmacyId = req.pharmacyId!;
      
      const sale = await SaleController.getSaleWithItems(id, pharmacyId);
      
      if (!sale) {
        res.status(404).json({
          success: false,
          error: 'Sale not found in current pharmacy'
        });
        return;
      }

      res.json({
        success: true,
        data: sale
      });
    } catch (error) {
      console.error('Error fetching sale:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sale'
      });
    }
  }

  // Get today's sales summary for current pharmacy
  public static async getTodaySales(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;
      const today = new Date().toISOString().split('T')[0];
      
      const sales = await dbService.all<Sale>(
        `SELECT * FROM sales 
         WHERE pharmacy_id = $1 AND DATE(created_at) = $2 
         ORDER BY created_at DESC`,
        [pharmacyId, today]
      );

      const summary = await dbService.get<{ total_sales: number; total_amount: number; total_profit: number }>(
        `SELECT 
           COUNT(*) as total_sales,
           COALESCE(SUM(total_amount), 0) as total_amount,
           COALESCE(SUM(total_profit), 0) as total_profit
         FROM sales 
         WHERE pharmacy_id = $1 AND DATE(created_at) = $2`,
        [pharmacyId, today]
      );

      res.json({
        success: true,
        data: {
          sales,
          summary: {
            totalSales: summary?.total_sales || 0,
            totalAmount: summary?.total_amount || 0,
            totalProfit: summary?.total_profit || 0
          },
          pharmacyId
        }
      });
    } catch (error) {
      console.error('Error fetching today sales:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch today sales'
      });
    }
  }

  // Helper method to get sale with items for specific pharmacy
  private static async getSaleWithItems(saleId: string, pharmacyId: string): Promise<SaleWithItems | null> {
    try {
      const sale = await dbService.get<Sale>(
        'SELECT * FROM sales WHERE id = $1 AND pharmacy_id = $2', 
        [saleId, pharmacyId]
      );
      
      if (!sale) {
        return null;
      }

      const items = await dbService.all<SaleItem & { product_name: string }>(`
        SELECT 
          si.*,
          p.name as product_name
        FROM sale_items si 
        LEFT JOIN products p ON si.product_id = p.id AND p.pharmacy_id = $1
        WHERE si.sale_id = $2 AND si.pharmacy_id = $3
      `, [pharmacyId, saleId, pharmacyId]);

      return {
        ...sale,
        items: items.map(item => ({
          ...item,
          product_name: item.product_name // ✅ Keep the product name!
        }))
      };
    } catch (error) {
      throw error;
    }
  }

  //  Simple endpoint to get sales by specific date
  public static async getSalesBySpecificDate(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;
      const { date, startDate, endDate } = req.query;

      console.log('🆕 getSalesBySpecificDate called:', { pharmacyId, date, startDate, endDate });

      // Handle date range filtering
      let query: string;
      let params: any[];

      if (startDate && endDate) {
        // Date range query
        console.log('📅 Using date range:', { startDate, endDate });
        
        query = `
          SELECT s.* 
          FROM sales s
          WHERE s.pharmacy_id = $1 
            AND s.created_at >= $2::date 
            AND s.created_at < ($3::date + INTERVAL '1 day')
          ORDER BY s.created_at DESC
        `;
        params = [pharmacyId, startDate, endDate];
        
      } else if (date) {
        // Single date query - using range to avoid timezone issues
        console.log('📅 Using single date:', date);
        
        query = `
          SELECT s.* 
          FROM sales s
          WHERE s.pharmacy_id = $1 
            AND s.created_at >= $2::date 
            AND s.created_at < ($2::date + INTERVAL '1 day')
          ORDER BY s.created_at DESC
        `;
        params = [pharmacyId, date];
        
      } else {
        res.status(400).json({
          success: false,
          error: 'Date parameter or date range (startDate and endDate) is required'
        });
        return;
      }

      // Execute query
      const sales = await dbService.all<Sale>(query, params);

      console.log('✅ Found sales:', sales.length);

      // Get items for each sale
      const salesWithItems = await Promise.all(
        sales.map(async (sale) => {
          const items = await dbService.all<SaleItem & { product_name: string }>(`
            SELECT 
              si.*,
              p.name as product_name
            FROM sale_items si 
            LEFT JOIN products p ON si.product_id = p.id AND p.pharmacy_id = $1
            WHERE si.sale_id = $2 AND si.pharmacy_id = $3
          `, [pharmacyId, sale.id, pharmacyId]);

          return {
            ...sale,
            items: items.map(item => ({
              ...item,
              product_name: item.product_name
            }))
          };
        })
      );

      // Calculate summary stats
      const summary = {
        totalSales: salesWithItems.length,
        totalAmount: salesWithItems.reduce((sum, sale) => sum + Number(sale.total_amount), 0),
        totalProfit: salesWithItems.reduce((sum, sale) => sum + Number(sale.total_profit), 0)
      };

      res.json({
        success: true,
        data: salesWithItems,
        summary,
        period: startDate && endDate ? { startDate, endDate } : { date }
      });

    } catch (error) {
      console.error('❌ Error in getSalesBySpecificDate:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sales by date'
      });
    }
  }


  // NEW: Refund a sale (soft delete)
  public static async refundSale(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const pharmacyId = req.pharmacyId!;

      // Use transaction to ensure data consistency
      await dbService.transaction(async (client) => {
        // Get sale items to restore stock
        const saleItems = await client.query(
          'SELECT product_id, quantity FROM sale_items WHERE sale_id = $1 AND pharmacy_id = $2',
          [id, pharmacyId]
        );

        // Restore product stock
        for (const item of saleItems.rows) {
          await client.query(
            'UPDATE products SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND pharmacy_id = $3',
            [item.quantity, item.product_id, pharmacyId]
          );
        }

        // Mark sale as refunded
        await client.query(
          'UPDATE sales SET status = $1 WHERE id = $2 AND pharmacy_id = $3',
          ['refunded', id, pharmacyId]
        );
      });

      res.json({
        success: true,
        message: 'Sale refunded successfully and stock restored'
      });
    } catch (error) {
      console.error('Error refunding sale:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refund sale'
      });
    }
  }
}