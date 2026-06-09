import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

console.log('DATABASE_URL loaded:', !!process.env.DATABASE_URL);
console.log('NODE_ENV loaded:', process.env.NODE_ENV);

import { dbService } from './models/database';
import { PharmacyMiddleware } from './middleware/pharmacyMiddleware';
import productRoutes from './routes/products';
import saleRoutes from './routes/sales';
import dashboardRoutes from './routes/dashboard';
import servicesRoutes from './routes/services';
import serviceSalesRoutes from './routes/serviceSales';
import authRoutes from './routes/auth';
import pharmacyRoutes from './routes/pharmacyRoutes';
import gatekeeperRoutes from './routes/gatekeeper';
import salesHistoryRoutes from './routes/salesHistory';
import { GatekeeperController } from './controllers/GatekeeperController';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://stop2shop-project.vercel.app'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-pharmacy-id',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'Access-Control-Allow-Origin'
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400
}));

app.options('*', (req, res) => {
  console.log('Preflight request received for:', req.url);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, x-pharmacy-id, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.status(204).send();
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: false
}));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://stop2shop-project.vercel.app'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, x-pharmacy-id, X-Requested-With, Accept, Origin');
  
  if (req.method === 'OPTIONS') {
    console.log('CORS Preflight handled for:', req.url);
  }
  
  next();
});

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', PharmacyMiddleware.setPharmacyFromRequest);

app.get('/api/pharmacy/current', PharmacyMiddleware.getCurrentPharmacy);
app.post('/api/pharmacy/switch', PharmacyMiddleware.switchPharmacy);
app.get('/api/pharmacy/all', PharmacyMiddleware.getAllPharmacies);

async function startServer() {
  try {
    await dbService.connect();
    console.log('Database connected successfully');

    GatekeeperController.initializeAccessCode();

    app.use('/api/pharmacies', pharmacyRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/sales', saleRoutes);
    app.use('/api/sales-history', salesHistoryRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/services', servicesRoutes);
    app.use('/api/service-sales', serviceSalesRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/gatekeeper', gatekeeperRoutes);

    app.get('/api/health', (_req, res) => {
      res.json({ 
        success: true, 
        message: 'POS Server is running', 
        timestamp: new Date().toISOString(),
        cors: 'enabled',
        origins: [
          'https://stop2shop-project.vercel.app',
          'http://localhost:3000',
          'http://localhost:3001'
        ]
      });
    });

    app.get('/api', (_req, res) => {
      res.json({
        success: true,
        message: 'POS Inventory System API',
        version: '1.0.0',
        cors: 'enabled',
        endpoints: {
          products: '/api/products',
          sales: '/api/sales',
          dashboard: '/api/dashboard',
          pharmacies: '/api/pharmacies',
          services: '/api/services',
          'service-sales': '/api/service-sales',
          pharmacy: {
            current: '/api/pharmacy/current',
            switch: '/api/pharmacy/switch',
            all: '/api/pharmacy/all'
          },
          health: '/api/health'
        }
      });
    });

    app.get('/', (_req, res) => {
      res.redirect('/api');
    });

    app.use((req, res) => {
      if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({
          success: false,
          error: 'API endpoint not found',
          path: req.originalUrl
        });
      } else {
        res.redirect('/api');
      }
    });

    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    app.listen(PORT, () => {
      console.log('POS Server running on http://localhost:' + PORT);
      console.log('CORS Configuration: Enabled');
      console.log('Allowed Origins:');
      console.log('   - https://sales-inventory-system-fawn.vercel.app');
      console.log('   - http://localhost:3000');
      console.log('   - http://localhost:3001');
      console.log('Health check: http://localhost:' + PORT + '/api/health');
      console.log('API Base: http://localhost:' + PORT + '/api');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\nShutting down server gracefully...');
  try {
    await dbService.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down server gracefully...');
  try {
    await dbService.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

startServer();
