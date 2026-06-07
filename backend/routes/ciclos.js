// backend/routes/ciclos.js
// Rutas de Express para ciclos de progreso y barrios usando SheetDB

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
 * GET /api/barrios
 * Obtener lista de barrios únicos ordenados alfabéticamente
 */
router.get('/barrios', async (req, res) => {
  try {
    console.log('📋 GET /api/barrios');
    const manzanasRef = await getRows('manzanas_barrio_referencia');
    const validManzanas = manzanasRef.filter(m => m.es_valida === 'true' || m.es_valida === true || m.es_valida === undefined);
    
    const barriosUnicos = [...new Set(validManzanas.map(m => m.barrio || m.Barrio))].filter(Boolean).sort();
    
    res.json({
      success: true,
      data: barriosUnicos
    });
  } catch (error) {
    console.error('❌ Error en GET /api/barrios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener barrios',
      message: error.message
    });
  }
});

/**
 * GET /api/ciclos/progreso
 * Obtener el progreso general de todos los barrios
 */
router.get('/progreso', async (req, res) => {
  try {
    console.log('📋 GET /api/ciclos/progreso');
    
    // Cargar todas las tablas relevantes en paralelo
    const [manzanasRef, ciclos, reportesRaw] = await Promise.all([
      getRows('manzanas_barrio_referencia'),
      getRows('ciclos'),
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

    // Mapear reportes con barrio
    const reportes = reportesRaw.map(r => ({
      ...r,
      fecha: normalizeDateStr(r.Fecha || r.fecha),
      estado: r.Estado || r.estado,
      manzanas: r.Manzanas || r.manzanas || '',
      barrio: getBarrioFromReporte(r, manzanasMap)
    }));

    const validManzanas = manzanasRef.filter(m => m.es_valida === 'true' || m.es_valida === true || m.es_valida === undefined);
    const barriosUnicos = [...new Set(validManzanas.map(m => m.barrio || m.Barrio))].filter(Boolean);

    const ciclosActivos = ciclos.filter(c => c.estado === 'activo');

    const progresoBarrios = barriosUnicos.map(barrio => {
      const cicloActivo = ciclosActivos.find(c => (c.barrio || c.Barrio || '').toLowerCase() === barrio.toLowerCase());
      const manzanasDelBarrio = validManzanas.filter(m => (m.barrio || m.Barrio).toLowerCase() === barrio.toLowerCase());
      
      const totalTerritorios = cicloActivo ? parseInt(cicloActivo.total_territorios || cicloActivo.Total_territorios) : manzanasDelBarrio.length;
      
      // Filtrar reportes de este barrio que correspondan al ciclo activo (fecha >= fecha_inicio)
      const reportesDelBarrio = reportes.filter(r => r.barrio && r.barrio.toLowerCase() === barrio.toLowerCase());
      
      let reportesCiclo = reportesDelBarrio;
      if (cicloActivo && (cicloActivo.fecha_inicio || cicloActivo.Fecha_inicio)) {
        const fechaInicio = cicloActivo.fecha_inicio || cicloActivo.Fecha_inicio;
        reportesCiclo = reportesDelBarrio.filter(r => r.fecha >= fechaInicio);
      }

      // Calcular manzanas únicas trabajadas en este ciclo
      const manzanasTrabajadas = new Set();
      reportesCiclo.forEach(r => {
        if (r.manzanas) {
          r.manzanas.split(',').forEach(m => {
            const trimmed = m.trim().toLowerCase();
            if (trimmed) manzanasTrabajadas.add(trimmed);
          });
        }
      });

      const territoriosCompletados = cicloActivo ? parseInt(cicloActivo.territorios_completados || cicloActivo.Territorios_completados || 0) : manzanasTrabajadas.size;
      
      const reportesCompletados = reportesDelBarrio.filter(r => r.estado === 'finalizado' || r.estado === 'completado').length;
      const reportesPendientes = reportesDelBarrio.length - reportesCompletados;
      
      const progresoPorcentaje = totalTerritorios > 0 ? Math.round((territoriosCompletados / totalTerritorios) * 100) : 0;
      
      return {
        barrio: barrio,
        numero_ciclo: cicloActivo ? parseInt(cicloActivo.numero_ciclo || cicloActivo.Numero_ciclo) : 1,
        fecha_inicio: cicloActivo ? (cicloActivo.fecha_inicio || cicloActivo.Fecha_inicio) : new Date().toISOString().split('T')[0],
        total_territorios: totalTerritorios,
        territorios_completados: territoriosCompletados,
        progreso_porcentaje: progresoPorcentaje,
        reportes_completados: reportesCompletados,
        reportes_pendientes: reportesPendientes,
        total_reportes: reportesDelBarrio.length,
        estado: cicloActivo ? (cicloActivo.estado || cicloActivo.Estado) : 'sin_ciclo'
      };
    });

    res.json({
      success: true,
      data: progresoBarrios,
      total: progresoBarrios.length,
      metodo: 'in_memory_sheetdb'
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
 * Obtener el ciclo activo de un barrio
 */
router.get('/barrio/:barrio/activo', async (req, res) => {
  try {
    const { barrio } = req.params;
    console.log(`🔍 GET /api/ciclos/barrio/${barrio}/activo`);

    const ciclos = await getRows('ciclos');
    const cicloActivo = ciclos.find(c => 
      (c.barrio || c.Barrio || '').toLowerCase() === barrio.toLowerCase() && 
      (c.estado || c.Estado || '').toLowerCase() === 'activo'
    );

    if (cicloActivo) {
      // Normalizar claves para el frontend
      const normalized = {
        id: cicloActivo.id || cicloActivo.ID,
        barrio: cicloActivo.barrio || cicloActivo.Barrio,
        numero_ciclo: parseInt(cicloActivo.numero_ciclo || cicloActivo.Numero_ciclo || 1),
        estado: cicloActivo.estado || cicloActivo.Estado,
        fecha_inicio: cicloActivo.fecha_inicio || cicloActivo.Fecha_inicio,
        total_territorios: parseInt(cicloActivo.total_territorios || cicloActivo.Total_territorios || 0),
        territorios_completados: parseInt(cicloActivo.territorios_completados || cicloActivo.Territorios_completados || 0),
        progreso_porcentaje: parseFloat(cicloActivo.progreso_porcentaje || cicloActivo.Progreso_porcentaje || 0)
      };

      res.json({
        success: true,
        data: normalized
      });
    } else {
      res.json({
        success: false,
        data: null,
        message: 'No hay ciclo activo para este barrio'
      });
    }
  } catch (error) {
    console.error('❌ Error en GET /api/ciclos/barrio/:barrio/activo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el ciclo activo',
      message: error.message
    });
  }
});

/**
 * GET /api/ciclos/barrio/:barrio/progreso
 * Obtener el progreso detallado de un barrio específico
 */
router.get('/barrio/:barrio/progreso', async (req, res) => {
  try {
    const { barrio } = req.params;
    console.log(`📈 GET /api/ciclos/barrio/${barrio}/progreso`);

    const [reportesRaw, ciclos] = await Promise.all([
      getRows('reportes'),
      getRows('ciclos')
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

    const cicloActivo = ciclos.find(c => 
      (c.barrio || c.Barrio || '').toLowerCase() === barrio.toLowerCase() && 
      (c.estado || c.Estado || '').toLowerCase() === 'activo'
    );

    const totalReportes = reportes.length;
    const reportesCompletados = reportes.filter(r => r.estado === 'finalizado' || r.estado === 'completado').length;
    const reportesPendientes = totalReportes - reportesCompletados;

    let progresoPorcentaje = 0;
    if (totalReportes > 0) {
      progresoPorcentaje = Math.round((reportesCompletados / totalReportes) * 100);
    }

    const territoriosUnicos = new Set();
    reportes.forEach(r => {
      if (r.manzanas) {
        r.manzanas.split(',').forEach(m => {
          const trimmed = m.trim().toLowerCase();
          if (trimmed) territoriosUnicos.add(trimmed);
        });
      }
    });

    res.json({
      success: true,
      data: {
        barrio: barrio,
        progreso_porcentaje: progresoPorcentaje,
        reportes_completados: reportesCompletados,
        reportes_pendientes: reportesPendientes,
        total_reportes: totalReportes,
        total_territorios: territoriosUnicos.size,
        ciclo_activo: cicloActivo ? {
          id: cicloActivo.id || cicloActivo.ID,
          numero_ciclo: parseInt(cicloActivo.numero_ciclo || cicloActivo.Numero_ciclo || 1),
          fecha_inicio: cicloActivo.fecha_inicio || cicloActivo.Fecha_inicio,
          estado: cicloActivo.estado || cicloActivo.Estado
        } : null,
        estado: progresoPorcentaje === 100 ? 'completado' : 'en_progreso',
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
