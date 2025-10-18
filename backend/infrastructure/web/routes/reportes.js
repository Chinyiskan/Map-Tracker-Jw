// backend/infrastructure/web/routes/reportes.js
// Rutas para reportes con nueva arquitectura

import express from 'express';
import container from '../../container.js';

const router = express.Router();

// Obtener controlador del contenedor
const getReporteController = () => container.get('reporteController');

/**
 * @route POST /api/reportes
 * @desc Crear nuevo reporte
 * @access Public
 */
router.post('/', (req, res) => {
  console.log('📝 POST /api/reportes - Ruta alcanzada');
  console.log('📝 Body:', req.body);
  
  try {
    const controller = getReporteController();
    console.log('📝 Controlador obtenido:', !!controller);
    return controller.crear(req, res);
  } catch (error) {
    console.error('❌ Error en ruta POST /api/reportes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/reportes
 * @desc Obtener reportes (con compatibilidad para query barrio)
 * @access Public
 */
router.get('/', (req, res) => {
  const controller = getReporteController();
  return controller.obtenerTodos(req, res);
});

/**
 * @route GET /api/reportes/estadisticas
 * @desc Obtener estadísticas de reportes
 * @access Public
 */
router.get('/estadisticas', (req, res) => {
  const controller = getReporteController();
  return controller.obtenerEstadisticas(req, res);
});

/**
 * @route POST /api/reportes/validar
 * @desc Validar datos de reporte
 * @access Public
 */
router.post('/validar', (req, res) => {
  const controller = getReporteController();
  return controller.validarDatos(req, res);
});

/**
 * @route GET /api/reportes/rango
 * @desc Obtener reportes por rango de fechas
 * @access Public
 */
router.get('/rango', (req, res) => {
  const controller = getReporteController();
  return controller.obtenerPorRango(req, res);
});

/**
 * @route GET /api/reportes/barrio/:barrio
 * @desc Obtener reportes por barrio
 * @access Public
 */
router.get('/barrio/:barrio', (req, res) => {
  const controller = getReporteController();
  return controller.obtenerPorBarrio(req, res);
});

/**
 * @route GET /api/reportes/barrio/:barrio/count
 * @desc Contar reportes por barrio
 * @access Public
 */
router.get('/barrio/:barrio/count', (req, res) => {
  const controller = getReporteController();
  return controller.contarPorBarrio(req, res);
});

/**
 * @route GET /api/reportes/capitan/:nombre
 * @desc Obtener reportes por capitán
 * @access Public
 */
router.get('/capitan/:nombre', (req, res) => {
  const controller = getReporteController();
  return controller.obtenerPorCapitan(req, res);
});

/**
 * @route GET /api/reportes/:id
 * @desc Obtener reporte por ID
 * @access Public
 */
router.get('/:id', (req, res) => {
  const controller = getReporteController();
  return controller.obtenerPorId(req, res);
});

/**
 * @route PUT /api/reportes/:id
 * @desc Actualizar reporte existente
 * @access Public
 */
router.put('/:id', (req, res) => {
  const controller = getReporteController();
  return controller.actualizar(req, res);
});

/**
 * @route DELETE /api/reportes/:id
 * @desc Eliminar reporte
 * @access Public
 */
router.delete('/:id', (req, res) => {
  const controller = getReporteController();
  return controller.eliminar(req, res);
});

// Middleware de manejo de errores específico para reportes
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de reportes:', error);
  
  res.status(500).json({
    success: false,
    error: 'Error interno en el módulo de reportes',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
});

export default router;