// backend/infrastructure/web/routes/capitanes.js
// Rutas HTTP para el módulo de Capitanes - Clean Architecture

import express from 'express';
import container from '../../container.js';

const router = express.Router();

// Función helper para obtener el controlador de forma lazy
const getCapitanController = () => container.get('capitanController');

/**
 * @route GET /api/capitanes/health
 * @desc Health check del servicio de capitanes
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const controller = getCapitanController();
    await controller.healthCheck(req, res);
  } catch (error) {
    console.error('❌ Error en ruta GET /api/capitanes/health:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/capitanes/config
 * @desc Obtener configuración válida para capitanes
 * @access Public
 */
router.get('/config', async (req, res) => {
  try {
    const controller = getCapitanController();
    await controller.getConfig(req, res);
  } catch (error) {
    console.error('❌ Error en ruta GET /api/capitanes/config:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/capitanes/stats
 * @desc Obtener estadísticas de capitanes
 * @access Public
 */
router.get('/stats', async (req, res) => {
  try {
    const controller = getCapitanController();
    await controller.getStats(req, res);
  } catch (error) {
    console.error('❌ Error en ruta GET /api/capitanes/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/capitanes/search
 * @desc Buscar capitanes por término
 * @query {string} q - Término de búsqueda
 * @access Public
 */
router.get('/search', async (req, res) => {
  try {
    const controller = getCapitanController();
    await controller.searchCapitanes(req, res);
  } catch (error) {
    console.error('❌ Error en ruta GET /api/capitanes/search:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route POST /api/capitanes/validate
 * @desc Validar datos de capitán
 * @body {Object} capitanData - Datos del capitán a validar
 * @access Public
 */
router.post('/validate', async (req, res) => {
  try {
    const controller = getCapitanController();
    await controller.validateCapitanData(req, res);
  } catch (error) {
    console.error('❌ Error en ruta POST /api/capitanes/validate:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/capitanes
 * @desc Obtener todos los capitanes con filtros opcionales
 * @query {string} nombre - Filtro por nombre
 * @query {string} apellido - Filtro por apellido
 * @query {string} search - Búsqueda general por nombre completo
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const controller = getCapitanController();
    await controller.getAllCapitanes(req, res);
  } catch (error) {
    console.error('❌ Error en ruta GET /api/capitanes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route POST /api/capitanes
 * @desc Crear nuevo capitán
 * @body {Object} capitanData - Datos del capitán
 * @body {string} capitanData.nombre - Nombre del capitán
 * @body {string} capitanData.apellido - Apellido del capitán
 * @body {string} [capitanData.telefono] - Teléfono del capitán (opcional)
 * @body {string} [capitanData.email] - Email del capitán (opcional)
 * @access Public
 */
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/capitanes - Ruta alcanzada');
    console.log('📝 Body:', req.body);
    
    const controller = getCapitanController();
    console.log('📝 Controlador obtenido:', !!controller);
    
    await controller.createCapitan(req, res);
  } catch (error) {
    console.error('❌ Error en ruta POST /api/capitanes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route GET /api/capitanes/:id
 * @desc Obtener capitán por ID
 * @param {string} id - ID del capitán
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const controller = getCapitanController();
    await controller.getCapitanById(req, res);
  } catch (error) {
    console.error('❌ Error en ruta GET /api/capitanes/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route PUT /api/capitanes/:id
 * @desc Actualizar capitán existente
 * @param {string} id - ID del capitán
 * @body {Object} updateData - Datos a actualizar
 * @body {string} [updateData.nombre] - Nuevo nombre del capitán
 * @body {string} [updateData.apellido] - Nuevo apellido del capitán
 * @body {string} [updateData.telefono] - Nuevo teléfono del capitán
 * @body {string} [updateData.email] - Nuevo email del capitán
 * @access Public
 */
router.put('/:id', async (req, res) => {
  try {
    const controller = getCapitanController();
    await controller.updateCapitan(req, res);
  } catch (error) {
    console.error('❌ Error en ruta PUT /api/capitanes/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @route DELETE /api/capitanes/:id
 * @desc Eliminar capitán
 * @param {string} id - ID del capitán
 * @access Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const controller = getCapitanController();
    await controller.deleteCapitan(req, res);
  } catch (error) {
    console.error('❌ Error en ruta DELETE /api/capitanes/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Middleware de manejo de errores específico para capitanes
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de capitanes:', error);
  
  // Error de validación
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Error de validación',
      details: error.message
    });
  }
  
  // Error de duplicado
  if (error.message && error.message.includes('Ya existe')) {
    return res.status(409).json({
      success: false,
      error: 'Conflicto de datos',
      details: error.message
    });
  }
  
  // Error de no encontrado
  if (error.message && error.message.includes('no encontrado')) {
    return res.status(404).json({
      success: false,
      error: 'Recurso no encontrado',
      details: error.message
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