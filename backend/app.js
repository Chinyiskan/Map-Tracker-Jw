// backend/app.js
// Configuración principal de la aplicación Express

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno ANTES de importar dependencias
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Importar rutas legacy
import authRoutes from './routes/auth.js';

// Importar rutas con Clean Architecture
import reportesRoutes from './infrastructure/web/routes/reportes.js';
import ciclosRoutes from './infrastructure/web/routes/ciclos.js';
import salidasRoutes from './infrastructure/web/routes/salidas.js';
import capitanesRoutes from './infrastructure/web/routes/capitanes.js';
import optimizacionRoutes from './infrastructure/web/routes/optimizacion.js';
import manzanasRoutes from './infrastructure/web/routes/manzanas.js';

// OPTIMIZACIÓN SPRINT 3: Rutas de métricas
import metricsRoutes from './infrastructure/web/routes/metrics.js';

// Importar contenedor de dependencias
import container from './infrastructure/container.js';

// Importar configuración de base de datos
import { testConnection } from './config/db.js';
import { DbService } from './services/dbService.js';

// OPTIMIZACIÓN SPRINT 2: Rate Limiting
import { generalRateLimit, logRateLimitStats } from './infrastructure/middleware/rateLimiting.js';

// OPTIMIZACIÓN SPRINT 3: Middleware de métricas
import { metricsMiddleware } from './infrastructure/middleware/metricsMiddleware.js';

// Configuración para Vercel
import { configureForVercel, isVercelEnvironment } from './config/vercel-config.js';

// Crear aplicación Express
const app = express();

// ==========================================
// MIDDLEWARE GLOBAL
// ==========================================

// CORS - Permitir solicitudes desde el frontend
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://localhost:3006',
    'http://localhost:3007',
    'http://localhost:5501',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
    'http://127.0.0.1:3004',
    'http://127.0.0.1:3005',
    'http://127.0.0.1:3006',
    'http://127.0.0.1:3007',
    'http://127.0.0.1:5501'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// OPTIMIZACIÓN SPRINT 1: Compresión Gzip automática
app.use(compression({
  threshold: 1024, // Comprimir respuestas mayores a 1KB
  level: 6, // Balance entre compresión y CPU (1-9)
  filter: (req, res) => {
    // No comprimir si el cliente no lo soporta
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Usar el filtro por defecto de compression
    return compression.filter(req, res);
  }
}));
console.log('🗜️ Compresión Gzip habilitada (threshold: 1KB, level: 6)');

// OPTIMIZACIÓN SPRINT 2: Rate Limiting General
app.use('/api/', generalRateLimit);
if (!isVercelEnvironment()) {
  logRateLimitStats();
}

// OPTIMIZACIÓN SPRINT 3: Middleware de métricas automáticas
app.use('/api/', metricsMiddleware);
console.log('📊 Middleware de métricas habilitado para todas las APIs');

// Configurar para Vercel si es necesario
configureForVercel(app);

// Parsear JSON
app.use(express.json({ limit: '10mb' }));

// Parsear URL-encoded
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Middleware de logging
app.use((req, res, next) => {
  // Solo loggear APIs, no archivos estáticos
  if (req.path.startsWith('/api/')) {
    const timestamp = new Date().toISOString();
    const query = Object.keys(req.query).length > 0 ? 
      `\n   Query: ${JSON.stringify(req.query)}` : '';
    
    console.log(`📡 ${timestamp} - ${req.method} ${req.path}${query}`);
    
    // Log especial para POST requests
    if (req.method === 'POST') {
      console.log('📝 POST Body:', req.body);
      console.log('📝 Content-Type:', req.get('Content-Type'));
    }
  }
  
  // Continuar con el siguiente middleware
  next();
});

// ==========================================
// RUTAS DE LA API
// ==========================================

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/api/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    const dbStatus = await testConnection();
    
    // Verificar salud del contenedor de dependencias
    const containerHealth = await container.checkHealth();
    
    res.json({
      status: containerHealth.status === 'healthy' && dbStatus ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'Connected' : 'Disconnected',
      container: containerHealth,
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      architecture: 'Clean Architecture'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'Error',
      container: { status: 'unhealthy', error: error.message },
      error: error.message
    });
  }
});

// Registrar rutas con Clean Architecture
app.use('/api/reportes', reportesRoutes);
app.use('/api/ciclos', ciclosRoutes);
app.use('/api/salidas', salidasRoutes);
app.use('/api/capitanes', capitanesRoutes);
app.use('/api/optimizacion', optimizacionRoutes);
app.use('/api/manzanas', manzanasRoutes);

// OPTIMIZACIÓN SPRINT 3: Métricas del sistema
app.use('/api/metrics', metricsRoutes);

// Registrar rutas legacy
app.use('/api/auth', authRoutes);

// NOTA: Las rutas de capitanes ahora están manejadas por Clean Architecture
// Ver: /infrastructure/web/routes/capitanes.js

// ==========================================
// RUTAS DEL FRONTEND
// ==========================================

// Servir páginas HTML del frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'admin.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

app.get('/mapa', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'mapa.html'));
});

app.get('/usuario', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'reportes.html'));
});

app.get('/reportes', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'reportes.html'));
});

// Ruta /barrio eliminada - funcionalidad integrada en el sistema modular de mapas

// ==========================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ==========================================

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`,
    availableRoutes: {
      api: [
        'GET /api/health',
        'GET /api/reportes',
        'POST /api/reportes',
        'GET /api/salidas',
        'POST /api/salidas',
        'GET /api/capitanes',
        'POST /api/capitanes'
      ],
      pages: [
        'GET /',
        'GET /admin',
        'GET /login',
        'GET /mapa',
        'GET /usuario',
        'GET /barrio'
      ]
    }
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error('❌ Error global:', error);
  
  // Error de sintaxis JSON
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: 'JSON inválido',
      message: 'El cuerpo de la solicitud contiene JSON malformado'
    });
  }
  
  // Error de límite de tamaño
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'Archivo demasiado grande',
      message: 'El tamaño del archivo excede el límite permitido'
    });
  }
  
  // Error genérico
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// ==========================================
// INICIALIZACIÓN
// ==========================================

// Función para inicializar la aplicación
export async function initializeApp() {
  try {
    console.log('🚀 Inicializando aplicación...');
    
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('No se pudo conectar a la base de datos');
    }
    
    console.log('✅ Aplicación inicializada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar aplicación:', error.message);
    return false;
  }
}

// Exportar la aplicación
export default app;