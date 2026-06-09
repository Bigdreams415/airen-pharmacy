import { Pool, PoolClient } from 'pg';
import { initializeDatabase, pool } from '../config/database';  

class DatabaseService {
  private static instance: DatabaseService;
  private db: Pool | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async connect(): Promise<Pool> {
    if (!this.db) {
      this.db = await initializeDatabase();
    }
    return this.db;
  }

  public getDatabase(): Pool {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  public async close(): Promise<void> {
    if (this.db) {
      await this.db.end();
      this.db = null;
      console.log('Database connection pool closed');
    }
  }

  // Utility method for running queries with better error handling
  public async run(query: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
    const client = await this.getDatabase().connect();
    try {
      const result = await client.query(query, params);
      return {
        changes: result.rowCount ?? undefined
      };
    } finally {
      client.release();
    }
  }

  public async get<T>(query: string, params: any[] = []): Promise<T | undefined> {
    const client = await this.getDatabase().connect();
    try {
      const result = await client.query(query, params);
      return result.rows[0] as T;
    } finally {
      client.release();
    }
  }

  public async all<T>(query: string, params: any[] = []): Promise<T[]> {
    const client = await this.getDatabase().connect();
    try {
      const result = await client.query(query, params);
      return result.rows as T[];
    } finally {
      client.release();
    }
  }

  // Transaction support for PostgreSQL
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getDatabase().connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async getTotalStockWorth(pharmacyId: string): Promise<number> {
    const result = await this.get<{ total_worth: number }>(`
      SELECT COALESCE(SUM(stock * buy_price), 0) as total_worth 
      FROM products 
      WHERE pharmacy_id = $1
    `, [pharmacyId]);
    
    return result?.total_worth || 0;
  }

  // Get database info
  public getDatabaseInfo() {
    return {
      connected: !!this.db,
      databaseType: 'PostgreSQL'
    };
  }

  // Additional PostgreSQL-specific helper methods
  public async query(query: string, params: any[] = []): Promise<any> {
    const client = await this.getDatabase().connect();
    try {
      const result = await client.query(query, params);
      return result;
    } finally {
      client.release();
    }
  }

  // For bulk operations
  public async multiInsert<T>(baseQuery: string, values: any[][]): Promise<void> {
    const client = await this.getDatabase().connect();
    try {
      await client.query('BEGIN');
      
      for (const params of values) {
        await client.query(baseQuery, params);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const dbService = DatabaseService.getInstance();