// backend/routes/capitanes.js
// Rutas de Express para capitanes usando SheetDB

import express from 'express';
import { getRows, addRow, updateRow, deleteRow } from '../config/db.js';

const router = express.Router();

/**
 * GET /api/capitanes
 * Obtener todos los capitanes ordenados alfabéticamente por nombre
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/capitanes');
    const capitanes = await getRows('capitanes');
    
    // Ordenar alfabéticamente
    capitanes.sort((a, b) => {
      const nameA = `${a.nombre || ''} ${a.apellido || ''}`.trim().toLowerCase();
      const nameB = `${b.nombre || ''} ${b.apellido || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

    res.json({
      success: true,
      data: capitanes
    });
  } catch (error) {
    console.error('❌ Error en GET /api/capitanes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener capitanes',
      message: error.message
    });
  }
});

/**
 * POST /api/capitanes
 * Crear un nuevo capitán
 */
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/capitanes - Body:', req.body);
    const { nombre, apellido, telefono, email } = req.body;

    if (!nombre || !apellido) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y apellido son campos requeridos'
      });
    }

    const id = 'cap-' + Math.random().toString(36).substring(2, 11);
    const created_at = new Date().toISOString();

    const newCapitan = {
      id,
      nombre,
      apellido,
      telefono: telefono || '',
      email: email || '',
      created_at
    };

    await addRow('capitanes', newCapitan);

    res.status(201).json({
      success: true,
      data: newCapitan
    });
  } catch (error) {
    console.error('❌ Error en POST /api/capitanes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear capitán',
      message: error.message
    });
  }
});

/**
 * PUT /api/capitanes/:id
 * Actualizar datos de un capitán
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📝 PUT /api/capitanes/${id} - Body:`, req.body);
    const { nombre, apellido, telefono, email } = req.body;

    const capitanes = await getRows('capitanes');
    const current = capitanes.find(c => (c.id || c.ID) === id);

    if (!current) {
      return res.status(404).json({
        success: false,
        message: 'Capitán no encontrado'
      });
    }

    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (apellido !== undefined) updateData.apellido = apellido;
    if (telefono !== undefined) updateData.telefono = telefono || '';
    if (email !== undefined) updateData.email = email || '';
    updateData.updated_at = new Date().toISOString();

    await updateRow('capitanes', 'id', id, updateData);

    res.json({
      success: true,
      data: {
        id,
        ...current,
        ...updateData
      }
    });
  } catch (error) {
    console.error('❌ Error en PUT /api/capitanes/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar capitán',
      message: error.message
    });
  }
});

/**
 * DELETE /api/capitanes/:id
 * Eliminar un capitán
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/capitanes/${id}`);

    await deleteRow('capitanes', 'id', id);

    res.json({
      success: true,
      message: 'Capitán eliminado correctamente'
    });
  } catch (error) {
    console.error('❌ Error en DELETE /api/capitanes/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar capitán',
      message: error.message
    });
  }
});

export default router;
