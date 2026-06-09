// src/controllers/AuthController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const TOKEN_EXPIRY = '1h'; // 1 hour for better user experience

if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET not set in environment variables. Using fallback (NOT RECOMMENDED FOR PRODUCTION)');
}

// Generate recovery code (8-character alphanumeric)
const generateRecoveryCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export class AuthController {
  // Create owner account
  public static async createAccount(req: Request, res: Response): Promise<void> {
    try {
      const {
        username,
        password,
        securityQuestion1,
        securityAnswer1,
        securityQuestion2,
        securityAnswer2
      } = req.body;

      console.log('🔐 Creating account for:', username);

      // Validate input
      if (!username || !password || !securityQuestion1 || !securityAnswer1 || !securityQuestion2 || !securityAnswer2) {
        res.status(400).json({
          success: false,
          error: 'All fields are required'
        });
        return;
      }

      // Check if username already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (existingUser.rows.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Username already exists'
        });
        return;
      }

      // Generate recovery code
      const recoveryCode = generateRecoveryCode();
      
      // Hash password, recovery code, and security answers
      const passwordHash = await bcrypt.hash(password, 12);
      const recoveryCodeHash = await bcrypt.hash(recoveryCode, 12);
      const securityAnswer1Hash = await bcrypt.hash(securityAnswer1.toLowerCase(), 12);
      const securityAnswer2Hash = await bcrypt.hash(securityAnswer2.toLowerCase(), 12);

      // Insert new user
      await pool.query(
        `INSERT INTO users (username, password_hash, recovery_code_hash, security_question_1, security_answer_1_hash, security_question_2, security_answer_2_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [username, passwordHash, recoveryCodeHash, securityQuestion1, securityAnswer1Hash, securityQuestion2, securityAnswer2Hash]
      );

      // Return success with recovery code (show this only once!)
      res.json({
        success: true,
        data: {
          username,
          recoveryCode // Only returned once during creation
        },
        message: 'Account created successfully! Save this recovery code in a safe place. You will need it if you forget your password.'
      });

    } catch (error) {
      console.error('Create account error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create account'
      });
    }
  }

  // Login with database credentials
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      console.log('🔐 Login attempt for:', username);

      // Validate input
      if (!username || !password) {
        res.status(400).json({
          success: false,
          error: 'Username and password are required'
        });
        return;
      }

      // Find user in database
      const userResult = await pool.query(
        'SELECT * FROM users WHERE username = $1 AND is_active = true',
        [username]
      );

      if (userResult.rows.length === 0) {
        console.log('❌ User not found:', username);
        res.status(401).json({
          success: false,
          error: 'Invalid username or password'
        });
        return;
      }

      const user = userResult.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        console.log('❌ Invalid password for user:', username);
        res.status(401).json({
          success: false,
          error: 'Invalid username or password'
        });
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id,
          username: user.username,
          role: 'owner',
          timestamp: Date.now()
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      console.log('✅ Login successful for:', username);

      res.json({
        success: true,
        data: {
          token,
          expiresIn: 86400, // 24 hours in seconds
          user: {
            id: user.id,
            username: user.username
          }
        },
        message: 'Login successful'
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  }

  // Get security questions for recovery
  public static async getSecurityQuestions(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;

      console.log('🔐 Getting security questions for:', username);

      const userResult = await pool.query(
        'SELECT security_question_1, security_question_2 FROM users WHERE username = $1 AND is_active = true',
        [username]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      const user = userResult.rows[0];

      res.json({
        success: true,
        data: {
          question1: user.security_question_1,
          question2: user.security_question_2
        }
      });

    } catch (error) {
      console.error('Get security questions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get security questions'
      });
    }
  }

  // Reset password (using security questions and recovery code)
  public static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const {
        username,
        securityAnswer1,
        securityAnswer2,
        recoveryCode,
        newPassword
      } = req.body;

      console.log('🔐 Password reset attempt for:', username);

      // Find user
      const userResult = await pool.query(
        'SELECT * FROM users WHERE username = $1 AND is_active = true',
        [username]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      const user = userResult.rows[0];

      // Verify security answers (case insensitive)
      const isValidAnswer1 = await bcrypt.compare(
        securityAnswer1.toLowerCase(), 
        user.security_answer_1_hash
      );
      const isValidAnswer2 = await bcrypt.compare(
        securityAnswer2.toLowerCase(), 
        user.security_answer_2_hash
      );

      if (!isValidAnswer1 || !isValidAnswer2) {
        console.log('❌ Invalid security answers for:', username);
        res.status(401).json({
          success: false,
          error: 'Invalid security answers'
        });
        return;
      }

      // Verify recovery code
      const isValidRecoveryCode = await bcrypt.compare(recoveryCode, user.recovery_code_hash);
      if (!isValidRecoveryCode) {
        console.log('❌ Invalid recovery code for:', username);
        res.status(401).json({
          success: false,
          error: 'Invalid recovery code'
        });
        return;
      }

      // Update password and generate new recovery code
      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      const newRecoveryCode = generateRecoveryCode();
      const newRecoveryCodeHash = await bcrypt.hash(newRecoveryCode, 12);

      await pool.query(
        'UPDATE users SET password_hash = $1, recovery_code_hash = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [newPasswordHash, newRecoveryCodeHash, user.id]
      );

      console.log('✅ Password reset successful for:', username);

      res.json({
        success: true,
        data: {
          recoveryCode: newRecoveryCode
        },
        message: 'Password reset successfully! Save this new recovery code in a safe place.'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset password'
      });
    }
  }

  // Change password (when logged in)
  public static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req as any).user?.userId;

      console.log('🔐 Change password attempt for user ID:', userId);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Find user and verify current password
      const userResult = await pool.query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      const user = userResult.rows[0];

      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
        return;
      }

      // Update password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, user.id]
      );

      console.log('✅ Password changed successfully for user ID:', userId);

      res.json({
        success: true,
        message: 'Password changed successfully!'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  }

  // Verify token validity
  public static async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      console.log('🔐 Token verification request received');
      
      if (!token) {
        res.status(401).json({
          success: false,
          error: 'No token provided'
        });
        return;
      }

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Check if user still exists and is active
      const userResult = await pool.query(
        'SELECT id, username FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'User no longer exists'
        });
        return;
      }

      const user = userResult.rows[0];

      res.json({
        success: true,
        data: {
          valid: true,
          user: {
            id: user.id,
            username: user.username
          },
          expiresAt: decoded.exp * 1000 // Convert to milliseconds
        }
      });
    } catch (error) {
      console.log('❌ Token verification failed:', error);
      res.status(401).json({
        success: false,
        data: {
          valid: false
        },
        error: 'Invalid or expired token'
      });
    }
  }

  // Logout (client-side token removal)
  public static async logout(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'Logout successful (client should remove token)'
    });
  }
}