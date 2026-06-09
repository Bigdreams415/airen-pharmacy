// src/controllers/GatekeeperController.ts
import { Request, Response } from 'express';
import { pool } from '../config/database';

export class GatekeeperController {
  // Default access code (fallback) - Make it a static property
  private static readonly defaultCode = 'PHARMACY2025';

  // Get current access code
  public static async getAccessCode(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔐 Getting access code from database');
      
      const result = await pool.query(
        'SELECT setting_value FROM system_settings WHERE setting_key = $1',
        ['access_code']
      );

      let accessCode = GatekeeperController.defaultCode; // FIX: Use class name
      
      if (result.rows.length > 0) {
        accessCode = result.rows[0].setting_value;
        console.log('🔐 Access code found in database:', accessCode);
      } else {
        console.log('⚠️ Access code not found in database, using default');
      }
      
      res.json({
        success: true,
        data: {
          code: accessCode
        }
      });

    } catch (error) {
      console.error('Get access code error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get access code'
      });
    }
  }

  // Update access code
  public static async updateAccessCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.body;
      const userId = (req as any).user?.userId;

      console.log('🔐 Updating access code by user:', userId);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Validate input
      if (!code || typeof code !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Valid access code is required'
        });
        return;
      }

      if (code.length < 4) {
        res.status(400).json({
          success: false,
          error: 'Access code must be at least 4 characters long'
        });
        return;
      }

      // Update access code in database
      const result = await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value, description, updated_by) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (setting_key) 
         DO UPDATE SET 
           setting_value = EXCLUDED.setting_value,
           description = EXCLUDED.description,
           updated_by = EXCLUDED.updated_by,
           updated_at = CURRENT_TIMESTAMP
         RETURNING setting_value`,
        [
          'access_code',
          code,
          'Gatekeeper access code for site entry',
          userId
        ]
      );

      console.log('✅ Access code updated successfully by user:', userId);

      res.json({
        success: true,
        data: {
          code: result.rows[0].setting_value
        },
        message: 'Access code updated successfully! All staff will need to use the new code.'
      });

    } catch (error) {
      console.error('Update access code error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update access code'
      });
    }
  }

  // Verify access code - FIXED VERSION
  public static async verifyAccessCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.body;

      console.log('🔐 Verifying access code:', code);

      if (!code || typeof code !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Access code is required'
        });
        return;
      }

      // Get current access code from database
      const result = await pool.query(
        'SELECT setting_value FROM system_settings WHERE setting_key = $1',
        ['access_code']
      );

      let currentCode = GatekeeperController.defaultCode; // FIX: Use class name
      
      if (result.rows.length > 0) {
        currentCode = result.rows[0].setting_value;
        console.log('🔐 Current access code from database:', currentCode);
      } else {
        console.log('⚠️ No access code found in database, using default');
      }

      const isValid = code === currentCode;

      console.log(`🔐 Code verification: ${isValid ? 'VALID' : 'INVALID'}`);
      console.log(`🔐 Input: "${code}" vs Database: "${currentCode}"`);

      if (!isValid) {
        res.status(401).json({
          success: false,
          error: 'Invalid access code'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          verified: true
        },
        message: 'Access code verified successfully'
      });

    } catch (error: any) {
      console.error('Verify access code error:', error);
      console.error('Error details:', error.message, error.stack);
      
      res.status(500).json({
        success: false,
        error: 'Failed to verify access code: ' + error.message
      });
    }
  }

  // Initialize access code (set default if not set in database)
  public static async initializeAccessCode(): Promise<void> {
    try {
      // Check if access code exists in database
      const result = await pool.query(
        'SELECT setting_value FROM system_settings WHERE setting_key = $1',
        ['access_code']
      );

      if (result.rows.length === 0) {
        // Insert default access code
        await pool.query(
          `INSERT INTO system_settings (setting_key, setting_value, description) 
           VALUES ($1, $2, $3)
           ON CONFLICT (setting_key) DO NOTHING`,
          [
            'access_code',
            GatekeeperController.defaultCode, // FIX: Use class name
            'Gatekeeper access code for site entry'
          ]
        );
        console.log('🔐 Initialized default access code in database:', GatekeeperController.defaultCode);
      } else {
        console.log('🔐 Access code already exists in database:', result.rows[0].setting_value);
      }
    } catch (error: any) {
      console.error('Initialize access code error:', error);
      console.error('Error details:', error.message, error.stack);
    }
  }
}