// backend/routes/observability.js
// Rutas para endpoints de observabilidad

import express from 'express';
import observabilityController from '../infrastructure/web/ObservabilityController.js';
import observabilityMiddleware from '../infrastructure/middleware/ObservabilityMiddleware.js';

const router = express.Router();

/**
 * @route GET /health
 * @desc Health check básico
 * @access Public
 */
router.get('/health', async (req, res) => {
  await observabilityController.healthCheck(req, res);
});

/**
 * @route GET /health/detailed
 * @desc Health check detallado con información completa del sistema
 * @access Public
 */
router.get('/health/detailed', async (req, res) => {
  await observabilityController.detailedHealthCheck(req, res);
});

/**
 * @route GET /metrics
 * @desc Métricas del sistema en formato JSON
 * @access Public
 */
router.get('/metrics', async (req, res) => {
  await observabilityController.getMetrics(req, res);
});

/**
 * @route GET /metrics/prometheus
 * @desc Métricas en formato Prometheus
 * @access Public
 */
router.get('/metrics/prometheus', async (req, res) => {
  await observabilityController.getPrometheusMetrics(req, res);
});

/**
 * @route GET /status
 * @desc Status completo del sistema
 * @access Public
 */
router.get('/status', async (req, res) => {
  await observabilityController.getStatus(req, res);
});

/**
 * @route GET /info
 * @desc Información de la aplicación
 * @access Public
 */
router.get('/info', async (req, res) => {
  await observabilityController.getInfo(req, res);
});

/**
 * @route GET /logs
 * @desc Logs recientes (solo desarrollo)
 * @access Public
 */
router.get('/logs', async (req, res) => {
  await observabilityController.getRecentLogs(req, res);
});

/**
 * @route GET /ping
 * @desc Ping simple para verificar conectividad
 * @access Public
 */
router.get('/ping', (req, res) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * @route GET /version
 * @desc Versión de la aplicación
 * @access Public
 */
router.get('/version', (req, res) => {
  res.json({
    version: process.env.npm_package_version || '1.0.0',
    name: 'Map Tracker JW',
    environment: process.env.NODE_ENV || 'development',
    node: process.version,
    platform: process.platform
  });
});

export default router;