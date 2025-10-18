// backend/infrastructure/web/routes/optimizacion.js
// Rutas HTTP para consultas optimizadas y análisis avanzados

import express from 'express';
import container from '../../container.js';

const router = express.Router();

// Función helper para obtener el controlador de forma lazy
const getOptimizacionController = () => container.get('optimizacionController');

/**
 * @route GET /api/optimizacion/health
 * @desc Health check del servicio de optimización
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const controller = getOptimizacionController();
    await controller.healthCheck(req, res);
  } catch (error) {
    console.error('❌ Error en ruta GET /api/optimizacion/health:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/optimizacion/info
 * @desc Información sobre optimizaciones disponibles
 * @access Public
 */
router.get('/info', async (req, res) => {
  try {
    const controller = getOptimizacionController();
    await controller.getInfo(req, res);
  } catch (error) {
    console.error('❌ Error en ruta GET /api/optimizacion/info:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/optimizacion/estadisticas-globales
 * @desc Obtener estadísticas globales optimizadas con CTEs
 * @query {string} fechaDesde - Fecha de inicio (YYYY-MM-DD)
 * @query {string} fechaHasta - Fecha de fin (YYYY-MM-DD)
 * @query {string} barrio - Filtro por barrio específico
 * @access Public
 */
router.get('/estadisticas-globales', async (req, res) => {
  try {
    const controller = getOptimizacionController();
    await controller.getEstadisticasGlobales(req, res);
  } catch (error) {
    console.error('❌ Error en ruta GET /api/optimizacion/estadisticas-globales:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/optimizacion/ranking-barrios
 * @desc Obtener ranking de barrios con window functions
 * @query {number} limite - Número máximo de barrios a devolver (default: 10)
 * @query {string} fechaDesde - Fecha de inicio para filtrar datos
 * @query {string} fechaHasta - Fecha de fin para filtrar datos
 * @access Public
 */
router.get('/ranking-barrios', async (req, res) => {
  try {
    const controller = getOptimizacionController();
    await controller.getRankingBarrios(req, res);
  } catch (error) {
    console.error('❌ Error en ruta GET /api/optimizacion/ranking-barrios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/optimizacion/tendencias-temporales
 * @desc Análisis de tendencias temporales con series de tiempo
 * @query {string} fechaDesde - Fecha de inicio (default: 2024-01-01)
 * @query {string} fechaHasta - Fecha de fin (default: hoy)
 * @query {string} granularidad - Granularidad del análisis: day, week, month (default: month)
 * @access Public
 */
router.get('/tendencias-temporales', async (req, res) => {
  try {
    const controller = getOptimizacionController();
    await controller.getTendenciasTemporales(req, res);
  } catch (error) {
    console.error('❌ Error en ruta GET /api/optimizacion/tendencias-temporales:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/optimizacion/correlacion-reportes-progreso
 * @desc Análisis estadístico de correlación entre reportes y progreso
 * @query {string} fechaDesde - Fecha de inicio para el análisis
 * @query {string} fechaHasta - Fecha de fin para el análisis
 * @query {string} barrio - Filtro por barrio específico
 * @access Public
 */
router.get('/correlacion-reportes-progreso', async (req, res) => {
  try {
    const controller = getOptimizacionController();
    await controller.getCorrelacionReportesProgreso(req, res);
  } catch (error) {
    console.error('❌ Error en ruta GET /api/optimizacion/correlacion-reportes-progreso:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route POST /api/optimizacion/analisis-performance
 * @desc Análisis y optimización de consultas SQL personalizadas
 * @body {string} query - Consulta SQL a analizar
 * @body {Array} params - Parámetros de la consulta (opcional)
 * @access Public
 */
router.post('/analisis-performance', async (req, res) => {
  try {
    console.log('📝 POST /api/optimizacion/analisis-performance - Ruta alcanzada');
    console.log('📝 Body:', req.body);
    
    const controller = getOptimizacionController();
    console.log('📝 Controlador obtenido:', !!controller);
    
    await controller.getAnalisisPerformance(req, res);
  } catch (error) {
    console.error('❌ Error en ruta POST /api/optimizacion/analisis-performance:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Middleware de manejo de errores específico para optimización
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de optimización:', error);
  
  // Error de consulta SQL
  if (error.message && error.message.includes('SQL')) {
    return res.status(400).json({
      success: false,
      error: 'Error en consulta SQL',
      details: error.message
    });
  }
  
  // Error de parámetros inválidos
  if (error.message && error.message.includes('inválid')) {
    return res.status(400).json({
      success: false,
      error: 'Parámetros inválidos',
      details: error.message
    });
  }
  
  // Error de timeout
  if (error.message && error.message.includes('timeout')) {
    return res.status(408).json({
      success: false,
      error: 'Timeout en consulta',
      details: 'La consulta tardó demasiado en ejecutarse'
    });
  }
  
  // Error genérico
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: error.message
  });
});

export default router;