// backend/infrastructure/web/routes/ciclos.js
// Rutas para ciclos con nueva arquitectura

import express from 'express';
import container from '../../container.js';

// OPTIMIZACIÓN SPRINT 2: Rate Limiting específico
import { readRateLimit, criticalRateLimit } from '../../middleware/rateLimiting.js';

// OPTIMIZACIÓN SPRINT 2: Headers de Caché HTTP
import { dynamicCacheHeaders, criticalCacheHeaders, noCacheHeaders } from '../../middleware/cacheHeaders.js';

const router = express.Router();

// Obtener controlador del contenedor
const getCicloController = () => container.get('cicloController');

/**
 * @route GET /api/ciclos/health
 * @desc Health check del servicio de ciclos
 * @access Public
 */
router.get('/health', (req, res) => {
  const controller = getCicloController();
  return controller.healthCheck(req, res);
});

/**
 * @route GET /api/ciclos/progreso
 * @desc Obtener progreso de todos los barrios
 * @access Public
 */
router.get('/progreso', readRateLimit, dynamicCacheHeaders, (req, res) => {
  const controller = getCicloController();
  return controller.obtenerProgresoTodos(req, res);
});

/**
 * @route GET /api/ciclos/activos
 * @desc Obtener todos los ciclos activos
 * @access Public
 */
router.get('/activos', readRateLimit, dynamicCacheHeaders, (req, res) => {
  const controller = getCicloController();
  return controller.obtenerCiclosActivos(req, res);
});

/**
 * @route GET /api/ciclos/estadisticas/generales
 * @desc Obtener estadísticas generales del sistema
 * @access Public
 */
router.get('/estadisticas/generales', readRateLimit, dynamicCacheHeaders, (req, res) => {
  const controller = getCicloController();
  return controller.obtenerEstadisticasGenerales(req, res);
});

/**
 * @route GET /api/ciclos/estadisticas
 * @desc Obtener estadísticas de ciclos
 * @access Public
 */
router.get('/estadisticas', readRateLimit, dynamicCacheHeaders, (req, res) => {
  const controller = getCicloController();
  return controller.obtenerEstadisticasCiclos(req, res);
});

/**
 * @route GET /api/ciclos/barrio/:barrio/activo
 * @desc Obtener ciclo activo de un barrio
 * @access Public
 */
router.get('/barrio/:barrio/activo', (req, res) => {
  const controller = getCicloController();
  return controller.obtenerCicloActivo(req, res);
});

/**
 * @route GET /api/ciclos/barrio/:barrio/progreso
 * @desc Obtener progreso de un barrio específico
 * @access Public
 */
router.get('/barrio/:barrio/progreso', criticalRateLimit, criticalCacheHeaders, (req, res) => {
  const controller = getCicloController();
  return controller.obtenerProgresoBarrio(req, res);
});

/**
 * @route GET /api/ciclos/barrio/:barrio/historial
 * @desc Obtener historial de ciclos de un barrio
 * @access Public
 */
router.get('/barrio/:barrio/historial', (req, res) => {
  const controller = getCicloController();
  return controller.obtenerHistorial(req, res);
});

/**
 * @route POST /api/ciclos/barrio/:barrio
 * @desc Crear nuevo ciclo para un barrio
 * @access Public
 */
router.post('/barrio/:barrio', criticalRateLimit, noCacheHeaders, (req, res) => {
  const controller = getCicloController();
  return controller.crearNuevoCiclo(req, res);
});

/**
 * @route GET /api/ciclos/:id/progreso
 * @desc Obtener progreso detallado de un ciclo
 * @access Public
 */
router.get('/:id/progreso', (req, res) => {
  const controller = getCicloController();
  return controller.obtenerProgresoCiclo(req, res);
});

/**
 * @route PUT /api/ciclos/:id/completar
 * @desc Completar ciclo manualmente
 * @access Public
 */
router.put('/:id/completar', criticalRateLimit, noCacheHeaders, (req, res) => {
  const controller = getCicloController();
  return controller.completarCiclo(req, res);
});

/**
 * @route PUT /api/ciclos/:id/pausar
 * @desc Pausar ciclo
 * @access Public
 */
router.put('/:id/pausar', criticalRateLimit, noCacheHeaders, (req, res) => {
  const controller = getCicloController();
  return controller.pausarCiclo(req, res);
});

/**
 * @route PUT /api/ciclos/:id/reactivar
 * @desc Reactivar ciclo pausado
 * @access Public
 */
router.put('/:id/reactivar', criticalRateLimit, noCacheHeaders, (req, res) => {
  const controller = getCicloController();
  return controller.reactivarCiclo(req, res);
});

// Middleware de manejo de errores específico para ciclos
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de ciclos:', error);
  
  res.status(500).json({
    success: false,
    error: 'Error interno en el módulo de ciclos',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
});

export default router;