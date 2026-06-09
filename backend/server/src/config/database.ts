// src/config/database.ts
import { Pool, PoolConfig } from 'pg';

// PostgreSQL connection configuration
const getDatabaseConfig = (): PoolConfig => {
  // For Supabase connection pooler
  const useSSL = false;  

  // Use DATABASE_URL from environment variables
  if (process.env.DATABASE_URL) {
    const safeUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
    console.log('📡 Using DATABASE_URL from environment');
    console.log('🔗 Connection:', safeUrl);

    return {
      connectionString: process.env.DATABASE_URL,
      ssl: useSSL,
      max: 5, 
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }

  // Fallback to individual parameters 
  console.log('📡 Using individual DB parameters');
  return {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: useSSL,
  };
};

// Create PostgreSQL connection pool
const pool = new Pool(getDatabaseConfig());

// Test database connection
export const initializeDatabase = async (): Promise<Pool> => {
  try {
    console.log('🚀 Connecting to PostgreSQL database...');
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');

    // Test query to verify connection
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL Version:', result.rows[0].version);

    client.release();

    // Create tables and default data
    await createTables();
    await createDefaultPharmacy();
    await createDefaultAccessCode(); // ADDED: Initialize access code

    return pool;
  } catch (error) {
    console.error('❌ Error connecting to PostgreSQL database:', error);
    throw error;
  }
};

const createTables = async (): Promise<void> => {
  const tableDefinitions = [
    // USERS TABLE FIRST (referenced by system_settings.updated_by)
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      recovery_code_hash VARCHAR(255) NOT NULL,
      security_question_1 VARCHAR(255) NOT NULL,
      security_answer_1_hash VARCHAR(255) NOT NULL,
      security_question_2 VARCHAR(255) NOT NULL,
      security_answer_2_hash VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // SYSTEM SETTINGS NEXT (references users)
    `CREATE TABLE IF NOT EXISTS system_settings (
      id SERIAL PRIMARY KEY,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      description TEXT,
      updated_by INTEGER REFERENCES users(id),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // PHARMACIES NEXT (referenced by most other tables)
    `CREATE TABLE IF NOT EXISTS pharmacies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      address TEXT,
      phone_number TEXT,
      email TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // PRODUCTS TABLE
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      pharmacy_id TEXT NOT NULL,
      name TEXT NOT NULL,
      buy_price DECIMAL(10,2) NOT NULL CHECK (buy_price >= 0),
      sell_price DECIMAL(10,2) NOT NULL CHECK (sell_price >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      category TEXT NOT NULL,
      description TEXT,
      barcode TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id) ON DELETE CASCADE,
      UNIQUE(pharmacy_id, barcode)
    )`,

    // SALES TABLE
    `CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      pharmacy_id TEXT NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
      total_profit DECIMAL(10,2) NOT NULL CHECK (total_profit >= 0),
      payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer')),
      status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id) ON DELETE CASCADE
    )`,

    // SALE ITEMS TABLE
    `CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      pharmacy_id TEXT NOT NULL,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_sell_price DECIMAL(10,2) NOT NULL CHECK (unit_sell_price >= 0),
      unit_buy_price DECIMAL(10,2) NOT NULL CHECK (unit_buy_price >= 0),
      total_sell_price DECIMAL(10,2) NOT NULL CHECK (total_sell_price >= 0),
      item_profit DECIMAL(10,2) NOT NULL CHECK (item_profit >= 0),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id) ON DELETE CASCADE,
      FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
    )`,

    // CUSTOMERS TABLE
    `CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      pharmacy_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id) ON DELETE CASCADE,
      UNIQUE(pharmacy_id, phone)
    )`,

    // SERVICES TABLE
    `CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      pharmacy_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
      duration INTEGER NOT NULL CHECK (duration > 0),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id) ON DELETE CASCADE
    )`,

    // SERVICE SALES TABLE
    `CREATE TABLE IF NOT EXISTS service_sales (
      id TEXT PRIMARY KEY,
      pharmacy_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
      total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
      served_by TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES pharmacies (id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE RESTRICT
    )`
  ];

  const indexDefinitions = [
    // System settings indexes
    'CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key)',
    'CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON system_settings(updated_at)',
    
    // Users indexes
    'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
    'CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)',
    
    // Pharmacy indexes
    'CREATE INDEX IF NOT EXISTS idx_pharmacies_name ON pharmacies(name)',
    'CREATE INDEX IF NOT EXISTS idx_pharmacies_location ON pharmacies(location)',
    'CREATE INDEX IF NOT EXISTS idx_pharmacies_is_active ON pharmacies(is_active)',
    
    // Product indexes
    'CREATE INDEX IF NOT EXISTS idx_products_pharmacy_id ON products(pharmacy_id)',
    'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)',
    'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)',
    'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)',
    'CREATE INDEX IF NOT EXISTS idx_products_pharmacy_category ON products(pharmacy_id, category)',
    'CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock)',
    
    // Sales indexes
    'CREATE INDEX IF NOT EXISTS idx_sales_pharmacy_id ON sales(pharmacy_id)',
    'CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_sales_pharmacy_created_at ON sales(pharmacy_id, created_at)',
    'CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method)',
    'CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status)',
    
    // Sale items indexes
    'CREATE INDEX IF NOT EXISTS idx_sale_items_pharmacy_id ON sale_items(pharmacy_id)',
    'CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id)',
    'CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id)',
    'CREATE INDEX IF NOT EXISTS idx_sale_items_pharmacy_sale ON sale_items(pharmacy_id, sale_id)',
    
    // Customer indexes
    'CREATE INDEX IF NOT EXISTS idx_customers_pharmacy_id ON customers(pharmacy_id)',
    'CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)',
    'CREATE INDEX IF NOT EXISTS idx_customers_pharmacy_phone ON customers(pharmacy_id, phone)',
    
    // Service indexes
    'CREATE INDEX IF NOT EXISTS idx_services_pharmacy_id ON services(pharmacy_id)',
    'CREATE INDEX IF NOT EXISTS idx_services_category ON services(category)',
    'CREATE INDEX IF NOT EXISTS idx_services_name ON services(name)',
    'CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_services_pharmacy_category ON services(pharmacy_id, category)',
    'CREATE INDEX IF NOT EXISTS idx_services_price ON services(price)',
    
    // Service sales indexes
    'CREATE INDEX IF NOT EXISTS idx_service_sales_pharmacy_id ON service_sales(pharmacy_id)',
    'CREATE INDEX IF NOT EXISTS idx_service_sales_service_id ON service_sales(service_id)',
    'CREATE INDEX IF NOT EXISTS idx_service_sales_created_at ON service_sales(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_service_sales_pharmacy_created_at ON service_sales(pharmacy_id, created_at)',
    'CREATE INDEX IF NOT EXISTS idx_service_sales_served_by ON service_sales(served_by)'
  ];

  try {
    // Execute all table creation statements
    for (const sql of tableDefinitions) {
      await pool.query(sql);
    }
    
    // Execute all index creation statements
    for (const sql of indexDefinitions) {
      await pool.query(sql);
    }
    
    console.log('✅ All database tables and indexes created successfully');
    console.log('🔐 Authentication system tables added');
    console.log('🔑 System settings table added for access code management');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

const createDefaultPharmacy = async (): Promise<void> => {
  const defaultPharmacy = {
    id: 'pharmacy_main',
    name: 'Abra Store',
    location: 'Primary Location',
    address: 'Primary Address',
    phone_number: '',
    email: 'store@abra.com'
  };

  try {
    const result = await pool.query(
      `INSERT INTO pharmacies (id, name, location, address, phone_number, email, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       ON CONFLICT (id) DO NOTHING`,
      [
        defaultPharmacy.id,
        defaultPharmacy.name,
        defaultPharmacy.location,
        defaultPharmacy.address,
        defaultPharmacy.phone_number,
        defaultPharmacy.email
      ]
    );

    if (result.rowCount && result.rowCount > 0) {
      console.log('✅ Default pharmacy created successfully');
      console.log('🏪 Pharmacy Name:', defaultPharmacy.name);
      console.log('📍 Users can create 4 more pharmacies (5 total limit)');
    } else {
      console.log('📝 Default pharmacy already exists');
    }
  } catch (error) {
    console.error('❌ Error creating default pharmacy:', error);
    throw error;
  }
};

const createDefaultAccessCode = async (): Promise<void> => {
  const defaultAccessCode = {
    key: 'access_code',
    value: 'Abra2025',
    description: 'Gatekeeper access code for site entry'
  };

  try {
    const result = await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value, description) 
       VALUES ($1, $2, $3)
       ON CONFLICT (setting_key) DO NOTHING`,
      [
        defaultAccessCode.key,
        defaultAccessCode.value,
        defaultAccessCode.description
      ]
    );

    if (result.rowCount && result.rowCount > 0) {
      console.log('🔐 Default access code created successfully');
      console.log('📝 Access Code:', defaultAccessCode.value);
      console.log('💡 Staff will need this code to enter the system');
    } else {
      console.log('📝 Access code already exists in system settings');
    }
  } catch (error) {
    console.error('❌ Error creating default access code:', error);
    throw error;
  }
};

// Export the pool for use in other files
export { pool };