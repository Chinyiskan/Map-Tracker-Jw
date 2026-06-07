// backend/routes/salidas.js
// Rutas de Express para salidas de predicación usando SheetDB

import express from 'express';
import { getRows, addRow, updateRow, deleteRow } from '../config/db.js';

const router = express.Router();

/**
 * GET /api/salidas
 * Obtener todas las salidas de predicación con información del capitán integrada
 */
router.get('/', async (req, res) => {
  try {
    const { capitan_id, barrio_asignado, dia_semana } = req.query;
    console.log(`📋 GET /api/salidas - Filtros: capitan=${capitan_id}, barrio=${barrio_asignado}, dia=${dia_semana}`);

    // Cargar salidas y capitanes en paralelo
    const [salidasRaw, capitanes] = await Promise.all([
      getRows('salidas_predicacion'),
      getRows('capitanes')
    ]);

    // Unir en memoria
    let salidas = salidasRaw.map(salida => {
      const cap = capitanes.find(c => (c.id || c.ID) === salida.capitan_id);
      return {
        id: salida.id || salida.ID,
        capitan_id: salida.capitan_id,
        barrio_asignado: salida.barrio_asignado,
        dia_semana: salida.dia_semana,
        hora: salida.hora,
        estado: salida.estado || 'activo',
        created_at: salida.created_at || new Date().toISOString(),
        capitanes: cap ? {
          id: cap.id || cap.ID,
          nombre: cap.nombre,
          apellido: cap.apellido,
          telefono: cap.telefono || ''
        } : null
      };
    });

    // Filtrar
    if (capitan_id) {
      salidas = salidas.filter(s => s.capitan_id === capitan_id);
    }
    if (barrio_asignado) {
      salidas = salidas.filter(s => s.barrio_asignado && s.barrio_asignado.toLowerCase() === barrio_asignado.toLowerCase());
    }
    if (dia_semana) {
      salidas = salidas.filter(s => s.dia_semana && s.dia_semana.toLowerCase() === dia_semana.toLowerCase());
    }

    // Ordenar por created_at desc
    salidas.sort((a, b) => b.created_at.localeCompare(a.created_at));

    res.json({
      success: true,
      data: salidas
    });
  } catch (error) {
    console.error('❌ Error en GET /api/salidas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener salidas',
      message: error.message
    });
  }
});

/**
 * POST /api/salidas
 * Programar una nueva salida
 */
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/salidas - Body:', req.body);
    const { capitan_id, barrio_asignado, dia_semana, hora } = req.body;

    if (!capitan_id || !barrio_asignado || !dia_semana || !hora) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: capitan_id, barrio_asignado, dia_semana, hora'
      });
    }

    const id = 'sal-' + Math.random().toString(36).substring(2, 11);
    const created_at = new Date().toISOString();

    const newSalida = {
      id,
      capitan_id,
      barrio_asignado,
      dia_semana,
      hora,
      estado: 'activo',
      created_at
    };

    await addRow('salidas_predicacion', newSalida);

    // Obtener información del capitán para el retorno esperado del frontend
    const capitanes = await getRows('capitanes');
    const cap = capitanes.find(c => (c.id || c.ID) === capitan_id);

    res.status(201).json({
      success: true,
      data: {
        ...newSalida,
        capitanes: cap ? {
          id: cap.id || cap.ID,
          nombre: cap.nombre,
          apellido: cap.apellido,
          telefono: cap.telefono || ''
        } : null
      }
    });
  } catch (error) {
    console.error('❌ Error en POST /api/salidas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear salida',
      message: error.message
    });
  }
});

/**
 * PUT /api/salidas/:id
 * Actualizar salida
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📝 PUT /api/salidas/${id} - Body:`, req.body);
    const { capitan_id, barrio_asignado, dia_semana, hora, estado } = req.body;

    // Obtener salida actual
    const salidas = await getRows('salidas_predicacion');
    const current = salidas.find(s => (s.id || s.ID) === id);

    if (!current) {
      return res.status(404).json({
        success: false,
        message: 'Salida no encontrada'
      });
    }

    const updateData = {};
    if (capitan_id !== undefined) updateData.capitan_id = capitan_id;
    if (barrio_asignado !== undefined) updateData.barrio_asignado = barrio_asignado;
    if (dia_semana !== undefined) updateData.dia_semana = dia_semana;
    if (hora !== undefined) updateData.hora = hora;
    if (estado !== undefined) updateData.estado = estado;
    updateData.updated_at = new Date().toISOString();

    await updateRow('salidas_predicacion', 'id', id, updateData);

    const capitanes = await getRows('capitanes');
    const cap = capitanes.find(c => (c.id || c.ID) === (capitan_id || current.capitan_id));

    res.json({
      success: true,
      data: {
        id,
        ...current,
        ...updateData,
        capitanes: cap ? {
          id: cap.id || cap.ID,
          nombre: cap.nombre,
          apellido: cap.apellido,
          telefono: cap.telefono || ''
        } : null
      }
    });
  } catch (error) {
    console.error('❌ Error en PUT /api/salidas/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar salida',
      message: error.message
    });
  }
});

/**
 * DELETE /api/salidas/:id
 * Eliminar salida
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/salidas/${id}`);

    await deleteRow('salidas_predicacion', 'id', id);

    res.json({
      success: true,
      message: 'Salida eliminada correctamente'
    });
  } catch (error) {
    console.error('❌ Error en DELETE /api/salidas/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar salida',
      message: error.message
    });
  }
});

export default router;
