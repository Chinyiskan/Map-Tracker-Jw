// backend/routes/ciclos.js
// Rutas de Express para progreso de barrios en base a actividad reciente de 30 días

import express from 'express';
import { getRows, normalizeDateStr } from '../config/db.js';

const router = express.Router();

// Helper para obtener el barrio de un reporte a partir de sus manzanas
function getBarrioFromReporte(reporte, manzanasMap) {
  if (reporte.barrio) return reporte.barrio;
  if (!reporte.manzanas) return '';
  const firstManzana = reporte.manzanas.split(',')[0]?.trim().toLowerCase();
  return manzanasMap.get(firstManzana) || '';
}

// Helper para construir mapa de manzanas a barrios
async function getManzanasMap() {
  const map = new Map();
  try {
    const manzanasRef = await getRows('manzanas_barrio_referencia');
    manzanasRef.forEach(row => {
      const manzana = row.manzana || row.Manzana;
      const barrio = row.barrio || row.Barrio;
      if (manzana && barrio) {
        map.set(manzana.trim().toLowerCase(), barrio.trim());
      }
    });
  } catch (error) {
    console.error('⚠️ Error al cargar manzanas de referencia:', error.message);
  }
  return map;
}

/**
 * GET /api/ciclos/barrios
 * Obtener lista de barrios únicos ordenados alfabéticamente
 */
router.get('/barrios', async (req, res) => {
  try {
    console.log('📋 GET /api/ciclos/barrios');
    const manzanasRef = await getRows('manzanas_barrio_referencia');
    const validManzanas = manzanasRef.filter(m => m.es_valida === 'true' || m.es_valida === true || m.es_valida === undefined);
    
    const barriosUnicos = [...new Set(validManzanas.map(m => m.barrio || m.Barrio))].filter(Boolean).sort();
    
    res.json({
      success: true,
      data: barriosUnicos
    });
  } catch (error) {
    console.error('❌ Error en GET /api/ciclos/barrios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener barrios',
      message: error.message
    });
  }
});

/**
 * GET /api/ciclos/progreso
 * Obtener el progreso general de todos los barrios basado en actividad de los últimos 30 días
 */
router.get('/progreso', async (req, res) => {
  try {
    console.log('📋 GET /api/ciclos/progreso (dinámico 30 días)');
    
    // Cargar manzanas de referencia y reportes (no necesitamos ciclos)
    const [manzanasRef, reportesRaw] = await Promise.all([
      getRows('manzanas_barrio_referencia'),
      getRows('reportes')
    ]);

    const manzanasMap = new Map();
    manzanasRef.forEach(row => {
      const manzana = row.manzana || row.Manzana;
      const barrio = row.barrio || row.Barrio;
      if (manzana && barrio) {
        manzanasMap.set(manzana.trim().toLowerCase(), barrio.trim());
      }
    });

    // Mapear reportes con barrio y normalizar fecha
    const reportes = reportesRaw.map(r => ({
      ...r,
      fecha: normalizeDateStr(r.Fecha || r.fecha),
      estado: r.Estado || r.estado,
      manzanas: r.Manzanas || r.manzanas || '',
      barrio: getBarrioFromReporte(r, manzanasMap)
    }));

    const validManzanas = manzanasRef.filter(m => m.es_valida === 'true' || m.es_valida === true || m.es_valida === undefined);
    const barriosUnicos = [...new Set(validManzanas.map(m => m.barrio || m.Barrio))].filter(Boolean);

    // Calcular fecha límite para considerar trabajo reciente (últimos 30 días)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const progresoBarrios = barriosUnicos.map(barrio => {
      const manzanasDelBarrio = validManzanas.filter(m => (m.barrio || m.Barrio).toLowerCase() === barrio.toLowerCase());
      const totalTerritorios = manzanasDelBarrio.length;
      
      // Filtrar reportes de este barrio que correspondan a los últimos 30 días
      const reportesDelBarrio = reportes.filter(r => r.barrio && r.barrio.toLowerCase() === barrio.toLowerCase());
      const reportesRecientes = reportesDelBarrio.filter(r => r.fecha >= cutoffStr);

      // Calcular manzanas únicas trabajadas recientemente
      const manzanasTrabajadas = new Set();
      reportesRecientes.forEach(r => {
        if (r.manzanas) {
          r.manzanas.split(',').forEach(m => {
            const trimmed = m.trim().toLowerCase();
            if (trimmed) manzanasTrabajadas.add(trimmed);
          });
        }
      });

      const territoriosCompletados = manzanasTrabajadas.size;
      const progresoPorcentaje = totalTerritorios > 0 ? Math.round((territoriosCompletados / totalTerritorios) * 100) : 0;
      
      const reportesCompletados = reportesDelBarrio.filter(r => r.estado === 'finalizado' || r.estado === 'completado').length;
      const reportesPendientes = reportesDelBarrio.length - reportesCompletados;
      
      return {
        barrio: barrio,
        numero_ciclo: 1, // Por defecto siempre ciclo 1
        fecha_inicio: cutoffStr,
        total_territorios: totalTerritorios,
        territorios_completados: territoriosCompletados,
        progreso_porcentaje: progresoPorcentaje,
        reportes_completados: reportesCompletados,
        reportes_pendientes: reportesPendientes,
        total_reportes: reportesDelBarrio.length,
        estado: 'activo'
      };
    });

    res.json({
      success: true,
      data: progresoBarrios,
      total: progresoBarrios.length,
      metodo: 'dinamico_30_dias_sheetdb'
    });
  } catch (error) {
    console.error('❌ Error en GET /api/ciclos/progreso:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener progreso general',
      message: error.message
    });
  }
});

/**
 * GET /api/ciclos/barrio/:barrio/activo
 * Mock: Retorna null ya que el sistema de ciclos fue desactivado
 */
router.get('/barrio/:barrio/activo', async (req, res) => {
  console.log(`🔍 GET /api/ciclos/barrio/${req.params.barrio}/activo (Mock - Ciclos Desactivados)`);
  res.json({
    success: true,
    data: null,
    message: 'El sistema de ciclos está desactivado en esta versión'
  });
});

/**
 * GET /api/ciclos/barrio/:barrio/progreso
 * Obtener el progreso detallado de un barrio específico basado en la actividad de los últimos 30 días
 */
router.get('/barrio/:barrio/progreso', async (req, res) => {
  try {
    const { barrio } = req.params;
    console.log(`📈 GET /api/ciclos/barrio/${barrio}/progreso (dinámico 30 días)`);

    const [reportesRaw, manzanasRef] = await Promise.all([
      getRows('reportes'),
      getRows('manzanas_barrio_referencia')
    ]);

    const manzanasMap = await getManzanasMap();

    // Mapear y filtrar reportes de este barrio
    const reportes = reportesRaw.map(r => ({
      ...r,
      fecha: normalizeDateStr(r.Fecha || r.fecha),
      estado: r.Estado || r.estado,
      manzanas: r.Manzanas || r.manzanas || '',
      barrio: getBarrioFromReporte(r, manzanasMap)
    })).filter(r => r.barrio && r.barrio.toLowerCase() === barrio.toLowerCase());

    const validManzanas = manzanasRef.filter(m => (m.barrio || m.Barrio || '').toLowerCase() === barrio.toLowerCase() && (m.es_valida === 'true' || m.es_valida === true || m.es_valida === undefined));
    const totalTerritorios = validManzanas.length;

    // Calcular fecha límite (últimos 30 días)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const reportesRecientes = reportes.filter(r => r.fecha >= cutoffStr);
    const manzanasTrabajadas = new Set();
    reportesRecientes.forEach(r => {
      if (r.manzanas) {
        r.manzanas.split(',').forEach(m => {
          const trimmed = m.trim().toLowerCase();
          if (trimmed) manzanasTrabajadas.add(trimmed);
        });
      }
    });

    const territoriosCompletados = manzanasTrabajadas.size;
    const progresoPorcentaje = totalTerritorios > 0 ? Math.round((territoriosCompletados / totalTerritorios) * 100) : 0;

    const reportesCompletados = reportes.filter(r => r.estado === 'finalizado' || r.estado === 'completado').length;
    const reportesPendientes = reportes.length - reportesCompletados;

    res.json({
      success: true,
      data: {
        barrio: barrio,
        progreso_porcentaje: progresoPorcentaje,
        reportes_completados: reportesCompletados,
        reportes_pendientes: reportesPendientes,
        total_reportes: reportes.length,
        total_territorios: totalTerritorios,
        ciclo_activo: null, // Desactivado
        estado: 'activo',
        ultima_actualizacion: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error en GET /api/ciclos/barrio/:barrio/progreso:', error);
    res.status(500).json({
      success: false,
      error: 'Error al calcular progreso del barrio',
      message: error.message
    });
  }
});

export default router;
