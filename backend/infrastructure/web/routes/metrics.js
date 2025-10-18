// backend/infrastructure/web/routes/metrics.js
// OPTIMIZACIÓN SPRINT 3: Rutas de Métricas

import express from 'express';
import MetricsController from '../controllers/MetricsController.js';

// OPTIMIZACIÓN SPRINT 2: Rate Limiting específico para métricas
import { readRateLimit } from '../../middleware/rateLimiting.js';

// OPTIMIZACIÓN SPRINT 2: Headers de Caché para métricas
import { dynamicCacheHeaders, noCacheHeaders } from '../../middleware/cacheHeaders.js';

const router = express.Router();
const metricsController = new MetricsController();

/**
 * @route GET /api/metrics
 * @desc Obtener métricas completas del sistema
 * @access Public
 */
router.get('/', readRateLimit, dynamicCacheHeaders, metricsController.getMetrics);

/**
 * @route GET /api/metrics/health
 * @desc Health check del sistema
 * @access Public
 */
router.get('/health', readRateLimit, dynamicCacheHeaders, metricsController.getHealthCheck);

/**
 * @route GET /api/metrics/prometheus
 * @desc Métricas en formato Prometheus
 * @access Public
 */
router.get('/prometheus', readRateLimit, noCacheHeaders, metricsController.getPrometheusMetrics);

/**
 * @route GET /api/metrics/system
 * @desc Información del sistema
 * @access Public
 */
router.get('/system', readRateLimit, dynamicCacheHeaders, metricsController.getSystemInfo);

/**
 * @route POST /api/metrics/reset
 * @desc Reset de métricas (solo desarrollo)
 * @access Public
 */
router.post('/reset', readRateLimit, noCacheHeaders, metricsController.resetMetrics);

/**
 * Middleware de manejo de errores específico para métricas
 */
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de métricas:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({
    success: false,
    error: 'Error interno en el sistema de métricas',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
});

export default router;