// backend/infrastructure/web/routes/salidas.js
// Rutas HTTP para el módulo de Salidas - Clean Architecture

import express from 'express';
import container from '../../container.js';

const router = express.Router();

// Función helper para obtener el controlador de forma lazy
const getSalidaController = () => container.get('salidaController');

/**
 * @route GET /api/salidas
 * @desc Obtener todas las salidas con filtros opcionales
 * @query {string} capitan_id - ID del capitán
 * @query {string} barrio_asignado - Barrio asignado
 * @query {string} dia_semana - Día de la semana
 * @query {string} estado - Estado de la salida
 */
router.get('/', async (req, res) => {
  await getSalidaController().getAllSalidas(req, res);
});

/**
 * @route GET /api/salidas/config
 * @desc Obtener configuración (barrios, días, estados válidos)
 */
router.get('/config', async (req, res) => {
  await getSalidaController().getConfig(req, res);
});

/**
 * @route GET /api/salidas/stats
 * @desc Obtener estadísticas de salidas
 */
router.get('/stats', async (req, res) => {
  await getSalidaController().getStats(req, res);
});

/**
 * @route POST /api/salidas/validate
 * @desc Validar datos de salida
 * @body {Object} salidaData - Datos de la salida a validar
 */
router.post('/validate', async (req, res) => {
  await getSalidaController().validateSalidaData(req, res);
});

/**
 * @route GET /api/salidas/capitan/:capitanId
 * @desc Obtener salidas por capitán
 * @param {string} capitanId - ID del capitán
 */
router.get('/capitan/:capitanId', async (req, res) => {
  await getSalidaController().getSalidasByCapitan(req, res);
});

/**
 * @route GET /api/salidas/barrio/:barrio
 * @desc Obtener salidas por barrio
 * @param {string} barrio - Nombre del barrio
 */
router.get('/barrio/:barrio', async (req, res) => {
  await getSalidaController().getSalidasByBarrio(req, res);
});

/**
 * @route GET /api/salidas/:id
 * @desc Obtener una salida específica por ID
 * @param {string} id - ID de la salida
 */
router.get('/:id', async (req, res) => {
  await getSalidaController().getSalidaById(req, res);
});

/**
 * @route POST /api/salidas
 * @desc Crear una nueva salida
 * @body {Object} salidaData - Datos de la nueva salida
 * @body {string} salidaData.capitan_id - ID del capitán
 * @body {string} salidaData.barrio_asignado - Barrio asignado
 * @body {string} salidaData.dia_semana - Día de la semana
 * @body {string} salidaData.hora - Hora de la salida (HH:MM)
 * @body {string} [salidaData.estado] - Estado de la salida (opcional)
 * @body {string} [salidaData.observaciones] - Observaciones (opcional)
 */
router.post('/', async (req, res) => {
  await getSalidaController().createSalida(req, res);
});

/**
 * @route PUT /api/salidas/:id
 * @desc Actualizar una salida existente
 * @param {string} id - ID de la salida
 * @body {Object} updateData - Datos a actualizar
 */
router.put('/:id', async (req, res) => {
  await getSalidaController().updateSalida(req, res);
});

/**
 * @route PATCH /api/salidas/:id/status
 * @desc Cambiar estado de una salida
 * @param {string} id - ID de la salida
 * @body {string} estado - Nuevo estado
 */
router.patch('/:id/status', async (req, res) => {
  await getSalidaController().changeStatus(req, res);
});

/**
 * @route DELETE /api/salidas/:id
 * @desc Eliminar una salida
 * @param {string} id - ID de la salida
 */
router.delete('/:id', async (req, res) => {
  await getSalidaController().deleteSalida(req, res);
});

// Middleware de manejo de errores específico para salidas
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de salidas:', error);
  
  // Errores de validación
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Error de validación',
      details: error.message
    });
  }
  
  // Errores de base de datos
  if (error.code && error.code.startsWith('PGRST')) {
    return res.status(500).json({
      success: false,
      error: 'Error de base de datos',
      details: 'Error interno del servidor'
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