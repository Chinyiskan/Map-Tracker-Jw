// backend/infrastructure/web/routes/manzanas.js
// Rutas para gestión de manzanas y auto-detección

import express from 'express';
import container from '../../container.js';

// OPTIMIZACIÓN SPRINT 2: Rate Limiting específico
import { readRateLimit, criticalRateLimit } from '../../middleware/rateLimiting.js';

// OPTIMIZACIÓN SPRINT 2: Headers de Caché HTTP
import { dynamicCacheHeaders, criticalCacheHeaders, noCacheHeaders } from '../../middleware/cacheHeaders.js';

const router = express.Router();

// Obtener controlador del contenedor
const getManzanasController = () => container.get('manzanasController');

/**
 * @route GET /api/manzanas/health
 * @desc Health check del servicio de manzanas
 * @access Public
 */
router.get('/health', (req, res) => {
  const controller = getManzanasController();
  return controller.healthCheck(req, res);
});

/**
 * @route GET /api/manzanas/resumen
 * @desc Obtener resumen de manzanas por barrio
 * @access Public
 */
router.get('/resumen', readRateLimit, dynamicCacheHeaders, (req, res) => {
  const controller = getManzanasController();
  return controller.obtenerResumen(req, res);
});

/**
 * @route GET /api/manzanas/estadisticas
 * @desc Obtener estadísticas de auto-detección
 * @access Public
 */
router.get('/estadisticas', readRateLimit, dynamicCacheHeaders, (req, res) => {
  const controller = getManzanasController();
  return controller.obtenerEstadisticas(req, res);
});

/**
 * @route POST /api/manzanas/inicializar
 * @desc Inicializar auto-descubrimiento masivo
 * @access Public
 */
router.post('/inicializar', criticalRateLimit, noCacheHeaders, (req, res) => {
  const controller = getManzanasController();
  return controller.inicializarAutoDescubrimiento(req, res);
});

/**
 * @route GET /api/manzanas/barrio/:barrio
 * @desc Obtener manzanas específicas de un barrio
 * @access Public
 */
router.get('/barrio/:barrio', readRateLimit, dynamicCacheHeaders, (req, res) => {
  const controller = getManzanasController();
  return controller.obtenerManzanasBarrio(req, res);
});

// Middleware de manejo de errores específico para manzanas
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de manzanas:', error);
  
  res.status(500).json({
    success: false,
    error: 'Error interno en el módulo de manzanas',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
});

export default router;