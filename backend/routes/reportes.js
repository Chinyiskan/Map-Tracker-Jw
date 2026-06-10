// backend/routes/reportes.js
// Rutas de Express para reportes usando SheetDB

import express from 'express';
import { getRows, addRow, updateRow, deleteRow, normalizeDateStr } from '../config/db.js';

const router = express.Router();

/**
 * Mapea el estado guardado en el Excel a los estados estándares esperados por el frontend:
 * "iniciado", "en_progreso", "finalizado"
 * @param {string} estado - Estado en crudo desde la hoja
 * @returns {string} Estado normalizado
 */
function mapEstadoToFrontend(estado) {
  if (!estado) return 'iniciado';
  const val = String(estado).trim().toLowerCase();
  
  if (val.includes('0') || val.includes('iniciando') || val.includes('iniciado')) {
    return 'iniciado';
  }
  if (val.includes('1') || val.includes('progreso') || val.includes('trabajando') || val.includes('asignado')) {
    return 'en_progreso';
  }
  if (val.includes('2') || val.includes('finalizado') || val.includes('completado') || val.includes('finalizando')) {
    return 'finalizado';
  }
  
  return 'iniciado'; // fallback
}

// Helper para mapear fila de Sheets a objeto de reporte esperado por el frontend
async function mapRowToReporte(row) {
  return {
    id: row.ID || row.id,
    fecha: normalizeDateStr(row.Fecha || row.fecha),
    manzanas: row.Manzanas || row.manzanas || '',
    estado: mapEstadoToFrontend(row.Estado || row.estado),
    nombre_capitan: row['Nombre del capitán'] || row.nombre_capitan || row.capitan || '',
    observaciones: row.Observaciones || row.observaciones || '',
    barrio: row.Barrio || row.barrio || '',
    created_at: row.created_at || row.Created_at || new Date().toISOString()
  };
}

/**
 * GET /api/reportes
 * Obtener todos los reportes (con filtros de barrio y fecha)
 */
router.get('/', async (req, res) => {
  try {
    const { barrio, fecha_inicio, fecha_fin, start_date, end_date } = req.query;
    console.log(`📋 GET /api/reportes - Filtros: barrio=${barrio}, inicio=${fecha_inicio || start_date}, fin=${fecha_fin || end_date}`);

    const reportesRaw = await getRows('reportes');
    
    // Mapear cada fila al formato esperado
    const reportes = await Promise.all(
      reportesRaw.map(row => mapRowToReporte(row))
    );

    // Filtrar por barrio y fecha
    let filteredReportes = reportes.filter(r => r.id); // Asegurar que tenga ID válido

    if (barrio) {
      filteredReportes = filteredReportes.filter(r => 
        r.barrio.toLowerCase() === barrio.toLowerCase()
      );
    }

    const inicio = fecha_inicio || start_date;
    const fin = fecha_fin || end_date;
    if (inicio && fin) {
      filteredReportes = filteredReportes.filter(r => 
        r.fecha >= inicio && r.fecha <= fin
      );
    }

    // Ordenar por fecha descendente
    filteredReportes.sort((a, b) => b.fecha.localeCompare(a.fecha));

    res.json({
      success: true,
      data: filteredReportes,
      total: filteredReportes.length
    });
  } catch (error) {
    console.error('❌ Error en GET /api/reportes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reportes',
      message: error.message
    });
  }
});

/**
 * GET /api/reportes/barrio/:barrio
 * Obtener reportes por barrio específico
 */
router.get('/barrio/:barrio', async (req, res) => {
  try {
    const { barrio } = req.params;
    console.log(`🔍 GET /api/reportes/barrio/${barrio}`);

    const reportesRaw = await getRows('reportes');
    
    const reportes = await Promise.all(
      reportesRaw.map(row => mapRowToReporte(row))
    );

    const filtered = reportes.filter(r => 
      r.barrio && r.barrio.toLowerCase() === barrio.toLowerCase()
    );

    filtered.sort((a, b) => b.fecha.localeCompare(a.fecha));

    res.json({
      success: true,
      data: filtered,
      total: filtered.length,
      barrio
    });
  } catch (error) {
    console.error('❌ Error en GET /api/reportes/barrio/:barrio:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener reportes del barrio',
      message: error.message
    });
  }
});

/**
 * GET /api/reportes/:id
 * Obtener un reporte por su ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 GET /api/reportes/${id}`);

    const reportesRaw = await getRows('reportes');
    const row = reportesRaw.find(r => (r.ID || r.id) === id);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    const reporte = await mapRowToReporte(row);

    res.json({
      success: true,
      data: reporte
    });
  } catch (error) {
    console.error('❌ Error en GET /api/reportes/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el reporte',
      message: error.message
    });
  }
});

/**
 * POST /api/reportes
 * Crear un nuevo reporte en la hoja de SheetDB
 */
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/reportes - Body recibido:', req.body);
    const { nombre_capitan, fecha, barrio, manzanas, estado, observaciones } = req.body;

    if (!fecha || !manzanas || !estado || !nombre_capitan) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: fecha, manzanas, estado, nombre_capitan'
      });
    }

    // Generar ID único
    const id = 'rep-' + Math.random().toString(36).substring(2, 11);

    // Normalizar fecha a YYYY-MM-DD antes de guardar para que sea legible en el Sheet directamente
    const fechaNormalizada = normalizeDateStr(fecha);

    // Mapear campos en el orden exacto de las columnas del Sheet:
    // ID, Fecha, Manzanas, Barrio, Estado, Nombre del capitán, Observaciones
    const newRow = {
      'ID': id,
      'Fecha': fechaNormalizada,
      'Manzanas': manzanas,
      'Barrio': barrio || '',
      'Estado': estado,
      'Nombre del capitán': nombre_capitan,
      'Observaciones': observaciones || ''
    };

    await addRow('reportes', newRow);

    res.status(201).json({
      success: true,
      data: {
        id,
        fecha: fechaNormalizada,
        barrio: barrio || '',
        manzanas,
        estado,
        observaciones,
        nombre_capitan
      }
    });
  } catch (error) {
    console.error('❌ Error en POST /api/reportes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear reporte',
      message: error.message
    });
  }
});

/**
 * PUT /api/reportes/:id
 * Actualizar un reporte existente
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📝 PUT /api/reportes/${id} - Body recibido:`, req.body);
    const { nombre_capitan, fecha, manzanas, estado, observaciones } = req.body;

    // Obtener los datos actuales del reporte para no sobreescribir con vacíos
    const reportesRaw = await getRows('reportes');
    const currentRow = reportesRaw.find(r => (r.ID || r.id) === id);

    if (!currentRow) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    // Preparar campos a actualizar
    const updateData = {};
    if (fecha !== undefined) updateData['Fecha'] = fecha;
    if (manzanas !== undefined) updateData['Manzanas'] = manzanas;
    if (estado !== undefined) updateData['Estado'] = estado;
    if (nombre_capitan !== undefined) updateData['Nombre del capitán'] = nombre_capitan;
    if (observaciones !== undefined) updateData['Observaciones'] = observaciones || '';

    await updateRow('reportes', 'ID', id, updateData);

    res.json({
      success: true,
      data: {
        id,
        ...req.body
      }
    });
  } catch (error) {
    console.error('❌ Error en PUT /api/reportes/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar reporte',
      message: error.message
    });
  }
});

/**
 * DELETE /api/reportes/:id
 * Eliminar un reporte
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/reportes/${id}`);

    await deleteRow('reportes', 'ID', id);

    res.json({
      success: true,
      message: 'Reporte eliminado correctamente'
    });
  } catch (error) {
    console.error('❌ Error en DELETE /api/reportes/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar reporte',
      message: error.message
    });
  }
});

export default router;
