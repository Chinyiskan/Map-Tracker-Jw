// backend/app.js
// Configuración principal de la aplicación Express para SheetDB

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Importar configuración de base de datos y validador
import { getRows, testConnection } from './config/db.js';
import { validateEnvironment } from './config/env-validator.js';

// Importar rutas modulares
import authRoutes from './routes/auth.js';
import reportesRoutes from './routes/reportes.js';
import salidasRoutes from './routes/salidas.js';
import capitanesRoutes from './routes/capitanes.js';
import ciclosRoutes from './routes/ciclos.js';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Crear aplicación Express
const app = express();

// ==========================================
// MIDDLEWARE GLOBAL
// ==========================================

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://localhost:5501',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://map-tracker-jw.vercel.app',
    'https://map-tracker-jw-git-main.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression({
  threshold: 1024,
  level: 6
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos del frontend (solo local, Vercel los sirve desde su CDN)
if (!process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, '..', 'frontend')));
}

// Middleware de logging simplificado
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// ==========================================
// REGISTRO DE RUTAS DE LA API
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/salidas', salidasRoutes);
app.use('/api/capitanes', capitanesRoutes);
app.use('/api/ciclos', ciclosRoutes);

// Endpoint adicional para compatibilidad con lista de barrios
app.get('/api/barrios', async (req, res) => {
  try {
    const manzanasRef = await getRows('manzanas_barrio_referencia');
    const validManzanas = manzanasRef.filter(m => m.es_valida === 'true' || m.es_valida === true || m.es_valida === undefined);
    const barriosUnicos = [...new Set(validManzanas.map(m => m.barrio || m.Barrio))].filter(Boolean).sort();
    res.json({ success: true, data: barriosUnicos });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});


// Simple test endpoint to diagnose Vercel crashes
app.get('/api/test-simple', (req, res) => {
  res.json({
    success: true,
    message: 'Express is running on Vercel!',
    nodeVersion: process.version,
    env: process.env.NODE_ENV
  });
});

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.json({
      status: dbStatus ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'Connected (SheetDB)' : 'Disconnected',
      environment: process.env.NODE_ENV || 'development',
      version: '2.2.0',
      architecture: 'Lightweight Modular / SheetDB'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// ==========================================
// REGISTRO DE RUTAS DEL FRONTEND (solo local)
// ==========================================

if (!process.env.VERCEL) {
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
}

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error('❌ Error global:', error);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: error.message
  });
});

// Inicialización de la aplicación
export async function initializeApp() {
  try {
    console.log('🚀 Inicializando aplicación...');
    validateEnvironment();
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️ Advertencia: No se pudo conectar a la API de SheetDB.');
    } else {
      console.log('✅ Conexión con SheetDB exitosa');
    }
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar aplicación:', error.message);
    return false;
  }
}

export default app;