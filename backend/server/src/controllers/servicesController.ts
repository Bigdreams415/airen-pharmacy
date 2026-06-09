import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../models/database';
import { 
  Service, 
  CreateServiceRequest, 
  UpdateServiceRequest, 
  ServiceStats 
} from '../types';

export class ServicesController {
  // Get all services for current pharmacy
  public static async getServices(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;

      const services = await dbService.all<Service>(`
        SELECT * FROM services 
        WHERE pharmacy_id = $1 
        ORDER BY created_at DESC
      `, [pharmacyId]);

      res.json({
        success: true,
        data: services
      });
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch services'
      });
    }
  }

  // Create new service
  public static async createService(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;
      const { name, category, description, price, duration }: CreateServiceRequest = req.body;

      // Validate input
      if (!name || !category || price === undefined || duration === undefined) {
        res.status(400).json({
          success: false,
          error: 'Name, category, price, and duration are required'
        });
        return;
      }

      if (price < 0) {
        res.status(400).json({
          success: false,
          error: 'Price must be a positive number'
        });
        return;
      }

      if (duration <= 0) {
        res.status(400).json({
          success: false,
          error: 'Duration must be greater than 0'
        });
        return;
      }

      const serviceId = uuidv4();
      
      const result = await dbService.query(`
        INSERT INTO services (id, pharmacy_id, name, category, description, price, duration)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [serviceId, pharmacyId, name, category, description || '', price, duration]);

      const service = result.rows[0];

      res.status(201).json({
        success: true,
        data: service,
        message: 'Service created successfully'
      });
    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create service'
      });
    }
  }

  // Update service
  public static async updateService(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;
      const { id } = req.params;
      const updates: UpdateServiceRequest = req.body;

      // Check if service exists and belongs to pharmacy
      const existingService = await dbService.get<Service>(`
        SELECT * FROM services WHERE id = $1 AND pharmacy_id = $2
      `, [id, pharmacyId]);

      if (!existingService) {
        res.status(404).json({
          success: false,
          error: 'Service not found'
        });
        return;
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.name !== undefined) {
        updateFields.push(`name = $${paramCount}`);
        values.push(updates.name);
        paramCount++;
      }
      if (updates.category !== undefined) {
        updateFields.push(`category = $${paramCount}`);
        values.push(updates.category);
        paramCount++;
      }
      if (updates.description !== undefined) {
        updateFields.push(`description = $${paramCount}`);
        values.push(updates.description || '');
        paramCount++;
      }
      if (updates.price !== undefined) {
        if (updates.price < 0) {
          res.status(400).json({
            success: false,
            error: 'Price must be a positive number'
          });
          return;
        }
        updateFields.push(`price = $${paramCount}`);
        values.push(updates.price);
        paramCount++;
      }
      if (updates.duration !== undefined) {
        if (updates.duration <= 0) {
          res.status(400).json({
            success: false,
            error: 'Duration must be greater than 0'
          });
          return;
        }
        updateFields.push(`duration = $${paramCount}`);
        values.push(updates.duration);
        paramCount++;
      }

      if (updateFields.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
        return;
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id, pharmacyId);

      const result = await dbService.query(`
        UPDATE services 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount} AND pharmacy_id = $${paramCount + 1}
        RETURNING *
      `, values);

      const updatedService = result.rows[0];

      res.json({
        success: true,
        data: updatedService,
        message: 'Service updated successfully'
      });
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update service'
      });
    }
  }

  // Delete service
  public static async deleteService(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;
      const { id } = req.params;

      // Check if service exists and belongs to pharmacy
      const existingService = await dbService.get<Service>(`
        SELECT * FROM services WHERE id = $1 AND pharmacy_id = $2
      `, [id, pharmacyId]);

      if (!existingService) {
        res.status(404).json({
          success: false,
          error: 'Service not found'
        });
        return;
      }

      // Check if service has any sales (prevent deletion if there are sales)
      const serviceSales = await dbService.get<{ count: number }>(`
        SELECT COUNT(*) as count FROM service_sales 
        WHERE service_id = $1 AND pharmacy_id = $2
      `, [id, pharmacyId]);

      if (serviceSales && serviceSales.count > 0) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete service with existing sales records'
        });
        return;
      }

      await dbService.run(`
        DELETE FROM services WHERE id = $1 AND pharmacy_id = $2
      `, [id, pharmacyId]);

      res.json({
        success: true,
        message: 'Service deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete service'
      });
    }
  }

  // Toggle service active status
  public static async toggleServiceStatus(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;
      const { id } = req.params;

      // Check if service exists and belongs to pharmacy
      const existingService = await dbService.get<Service>(`
        SELECT * FROM services WHERE id = $1 AND pharmacy_id = $2
      `, [id, pharmacyId]);

      if (!existingService) {
        res.status(404).json({
          success: false,
          error: 'Service not found'
        });
        return;
      }

      const newStatus = !existingService.is_active;

      const result = await dbService.query(`
        UPDATE services 
        SET is_active = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND pharmacy_id = $3
        RETURNING *
      `, [newStatus, id, pharmacyId]);

      const updatedService = result.rows[0];

      res.json({
        success: true,
        data: updatedService,
        message: `Service ${newStatus ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling service status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update service status'
      });
    }
  }

  // Get service statistics
  public static async getServiceStats(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;

      const stats = await dbService.get<ServiceStats>(`
        SELECT 
          COUNT(*) as total_services,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_services,
          COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_services,
          COUNT(DISTINCT category) as total_categories
        FROM services 
        WHERE pharmacy_id = $1
      `, [pharmacyId]);

      const categoryStats = await dbService.all<{ 
        category: string; 
        service_count: number; 
        avg_price: number 
      }>(`
        SELECT 
          category,
          COUNT(*) as service_count,
          AVG(price) as avg_price
        FROM services 
        WHERE pharmacy_id = $1 AND is_active = true
        GROUP BY category
        ORDER BY service_count DESC
      `, [pharmacyId]);

      res.json({
        success: true,
        data: {
          summary: stats,
          categories: categoryStats
        }
      });
    } catch (error) {
      console.error('Error fetching service stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch service statistics'
      });
    }
  }

  // NEW: Get service by ID
  public static async getServiceById(req: Request, res: Response): Promise<void> {
    try {
      const pharmacyId = req.pharmacyId!;
      const { id } = req.params;

      const service = await dbService.get<Service>(`
        SELECT * FROM services WHERE id = $1 AND pharmacy_id = $2
      `, [id, pharmacyId]);

      if (!service) {
        res.status(404).json({
          success: false,
          error: 'Service not found'
        });
        return;
      }

      res.json({
        success: true,
        data: service
      });
    } catch (error) {
      console.error('Error fetching service:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch service'
      });
    }
  }
}