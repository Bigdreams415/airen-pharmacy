// server/src/controllers/pharmacyController.ts

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../models/database';

const MAX_PHARMACIES = 5;

interface PharmacyData {
  id?: string;
  name: string;
  location: string;
  address?: string;
  phone_number?: string;
  email?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class PharmacyController {
  private async getActivePharmacyCount(): Promise<number> {
    const result = await dbService.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM pharmacies WHERE is_active = true'
    );
    return result?.count || 0;
  }

  getAllPharmacies = async (_: Request, res: Response): Promise<void> => {
    try {
      console.log('🔄 Fetching all active pharmacies...');
      
      const rows = await dbService.all<PharmacyData>(
        'SELECT * FROM pharmacies WHERE is_active = true ORDER BY created_at DESC'
      );
      
      console.log(`✅ Found ${rows.length} active pharmacies`);
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('❌ Error fetching pharmacies:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch pharmacies' });
    }
  };

  getPharmacyById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      console.log(`🔄 Fetching pharmacy by ID: ${id}`);
      
      const row = await dbService.get<PharmacyData>(
        'SELECT * FROM pharmacies WHERE id = $1 AND is_active = true',
        [id]
      );
      
      if (!row) {
        console.log(`❌ Pharmacy not found: ${id}`);
        res.status(404).json({ success: false, error: 'Pharmacy not found' });
        return;
      }
      
      console.log(`✅ Found pharmacy: ${row.name}`);
      res.json({ success: true, data: row });
    } catch (error) {
      console.error('❌ Error fetching pharmacy:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch pharmacy' });
    }
  };

  createPharmacy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, location, address, phone_number, email } = req.body;

      if (!name || !location) {
        console.log('❌ Validation failed: Name and location are required');
        res.status(400).json({ success: false, error: 'Name and location are required' });
        return;
      }

      const currentCount = await this.getActivePharmacyCount();
      console.log(`📊 Current pharmacy count: ${currentCount}/${MAX_PHARMACIES}`);
      
      if (currentCount >= MAX_PHARMACIES) {
        console.log('❌ Pharmacy limit reached');
        res.status(400).json({ 
          success: false,
          error: `Maximum limit of ${MAX_PHARMACIES} pharmacies reached. Please delete an existing pharmacy to create a new one.` 
        });
        return;
      }

      const newPharmacy: PharmacyData = {
        id: `pharmacy_${uuidv4()}`,
        name,
        location,
        address: address || '',
        phone_number: phone_number || '',
        email: email || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await dbService.query(
        `INSERT INTO pharmacies (id, name, location, address, phone_number, email, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          newPharmacy.id,
          newPharmacy.name,
          newPharmacy.location,
          newPharmacy.address,
          newPharmacy.phone_number,
          newPharmacy.email,
          newPharmacy.is_active,
          newPharmacy.created_at,
          newPharmacy.updated_at
        ]
      );

      const createdPharmacy = result.rows[0];

      console.log('✅ Pharmacy created successfully:', newPharmacy.id);
      res.status(201).json({
        success: true,
        data: createdPharmacy,
        message: 'Pharmacy created successfully!'
      });
    } catch (error) {
      console.error('❌ Error creating pharmacy:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create pharmacy: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    }
  };

  updatePharmacy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, location, address, phone_number, email, is_active } = req.body;
      
      console.log(`🔄 Updating pharmacy: ${id}`);

      const result = await dbService.query(
        `UPDATE pharmacies 
         SET name = COALESCE($1, name), 
             location = COALESCE($2, location), 
             address = COALESCE($3, address), 
             phone_number = COALESCE($4, phone_number), 
             email = COALESCE($5, email), 
             is_active = COALESCE($6, is_active),
             updated_at = $7
         WHERE id = $8
         RETURNING *`,
        [name, location, address, phone_number, email, is_active, new Date().toISOString(), id]
      );

      if (result.rows.length === 0) {
        console.log(`❌ Pharmacy not found: ${id}`);
        res.status(404).json({ success: false, error: 'Pharmacy not found' });
        return;
      }

      console.log(`✅ Pharmacy updated successfully: ${id}`);
      res.json({ 
        success: true, 
        data: result.rows[0],
        message: 'Pharmacy updated successfully' 
      });
    } catch (error) {
      console.error('❌ Error updating pharmacy:', error);
      res.status(500).json({ success: false, error: 'Failed to update pharmacy' });
    }
  };

  deletePharmacy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      console.log(`🔄 Deleting pharmacy: ${id}`);

      const currentCount = await this.getActivePharmacyCount();

      if (currentCount <= 1) {
        console.log('❌ Cannot delete the only active pharmacy');
        res.status(400).json({ success: false, error: 'Cannot delete the only active pharmacy' });
        return;
      }

      const result = await dbService.run(
        'UPDATE pharmacies SET is_active = false, updated_at = $1 WHERE id = $2',
        [new Date().toISOString(), id]
      );

      if (result.changes === 0) {
        console.log(`❌ Pharmacy not found: ${id}`);
        res.status(404).json({ success: false, error: 'Pharmacy not found' });
        return;
      }

      console.log(`✅ Pharmacy deleted successfully: ${id}`);
      res.json({ success: true, message: 'Pharmacy deleted successfully' });
    } catch (error) {
      console.error('❌ Error deleting pharmacy:', error);
      res.status(500).json({ success: false, error: 'Failed to delete pharmacy' });
    }
  };

  getPharmacyCount = async (_: Request, res: Response): Promise<void> => {
    try {
      console.log('🔄 Getting pharmacy count...');
      
      const count = await this.getActivePharmacyCount();
      
      res.json({ 
        success: true,
        data: {
          count,
          max_limit: MAX_PHARMACIES,
          remaining: MAX_PHARMACIES - count 
        }
      });
    } catch (error) {
      console.error('❌ Error counting pharmacies:', error);
      res.status(500).json({ success: false, error: 'Failed to count pharmacies' });
    }
  };

  // Optional: Hard delete pharmacy (use with caution)
  hardDeletePharmacy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      console.log(`🔄 Hard deleting pharmacy: ${id}`);

      // Check if this is the only pharmacy
      const currentCount = await this.getActivePharmacyCount();
      const pharmacy = await dbService.get<PharmacyData>(
        'SELECT * FROM pharmacies WHERE id = $1',
        [id]
      );

      if (!pharmacy) {
        res.status(404).json({ success: false, error: 'Pharmacy not found' });
        return;
      }

      if (pharmacy.is_active && currentCount <= 1) {
        console.log('❌ Cannot delete the only active pharmacy');
        res.status(400).json({ success: false, error: 'Cannot delete the only active pharmacy' });
        return;
      }

      const result = await dbService.run(
        'DELETE FROM pharmacies WHERE id = $1',
        [id]
      );

      if (result.changes === 0) {
        console.log(`❌ Pharmacy not found: ${id}`);
        res.status(404).json({ success: false, error: 'Pharmacy not found' });
        return;
      }

      console.log(`✅ Pharmacy hard deleted successfully: ${id}`);
      res.json({ success: true, message: 'Pharmacy permanently deleted' });
    } catch (error) {
      console.error('❌ Error hard deleting pharmacy:', error);
      res.status(500).json({ success: false, error: 'Failed to delete pharmacy' });
    }
  };
}