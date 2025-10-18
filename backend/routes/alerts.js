// backend/routes/alerts.js
// Rutas para gestión de alertas

import express from 'express';
import alertsController from '../infrastructure/web/AlertsController.js';

const router = express.Router();

/**
 * @route GET /alerts/active
 * @desc Obtener alertas activas
 * @access Public
 */
router.get('/active', async (req, res) => {
  await alertsController.getActiveAlerts(req, res);
});

/**
 * @route GET /alerts/history
 * @desc Obtener historial de alertas
 * @query limit - Número máximo de alertas a retornar (default: 50)
 * @access Public
 */
router.get('/history', async (req, res) => {
  await alertsController.getAlertHistory(req, res);
});

/**
 * @route GET /alerts/config
 * @desc Obtener configuración de alertas
 * @access Public
 */
router.get('/config', async (req, res) => {
  await alertsController.getConfiguration(req, res);
});

/**
 * @route PUT /alerts/threshold
 * @desc Actualizar umbral de alerta
 * @body { metric: string, level: string, value: number }
 * @access Public
 */
router.put('/threshold', async (req, res) => {
  await alertsController.updateThreshold(req, res);
});

/**
 * @route PUT /alerts/metric/:metric
 * @desc Habilitar/deshabilitar métrica
 * @param metric - Nombre de la métrica
 * @body { enabled: boolean }
 * @access Public
 */
router.put('/metric/:metric', async (req, res) => {
  await alertsController.toggleMetric(req, res);
});

/**
 * @route POST /alerts/test
 * @desc Generar alerta de prueba
 * @body { metric?: string, level?: string }
 * @access Public
 */
router.post('/test', async (req, res) => {
  await alertsController.triggerTestAlert(req, res);
});

/**
 * @route GET /alerts/stats
 * @desc Obtener estadísticas de alertas
 * @access Public
 */
router.get('/stats', async (req, res) => {
  await alertsController.getAlertStats(req, res);
});

/**
 * @route GET /alerts/summary
 * @desc Obtener resumen de alertas para dashboard
 * @access Public
 */
router.get('/summary', async (req, res) => {
  await alertsController.getAlertSummary(req, res);
});

export default router;