// backend/infrastructure/database/repositories/ProgresoRepository.js
// Repositorio para gestión de progreso de territorios en Supabase

import ProgresoTerritorio from '../../../domain/entities/ProgresoTerritorio.js';
import ErrorHandlingService from '../ErrorHandlingService.js';
import MockDataService from '../MockDataService.js';

/**
 * @implements {import('../../../domain/types/repositories').IProgresoRepository}
 */
class ProgresoRepository {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.tableName = 'progreso_territorios';
  }
  
  /**
   * Crear nuevo progreso de territorio
   * @param {Object} datosProgreso - Datos del progreso
   * @returns {Object} Progreso creado con ID
   */
  async crear(datosProgreso) {
    try {
      console.log('📍 Creando progreso territorio:', datosProgreso.territorio);
      
      // Crear entidad para validar
      const progreso = new ProgresoTerritorio(datosProgreso);
      const datosValidados = progreso.toDatabase();
      
      const { data, error } = await this.db
        .from(this.tableName)
        .insert(datosValidados)
        .select()
        .single();
        
      if (error) {
        // Si la tabla no existe, simular creación exitosa
        if (ErrorHandlingService.isTableNotExistError(error)) {
          console.log('⚠️ Tabla progreso_territorios no existe, simulando creación');
          return ErrorHandlingService.createMockWriteResult('create', datosValidados);
        }
        
        console.error('❌ Error en crear:', error);
        throw new Error(`Error creando progreso: ${error.message}`);
      }
      
      console.log('✅ Progreso creado exitosamente:', data.id);
      return data;
      
    } catch (error) {
      console.error('❌ Error en ProgresoRepository.crear:', error);
      
      // Si hay cualquier error de tabla no existente, simular creación
      if (ErrorHandlingService.isTableNotExistError(error)) {
        console.log('⚠️ Tabla progreso_territorios no existe, simulando creación');
        const progreso = new ProgresoTerritorio(datosProgreso);
        const datosValidados = progreso.toDatabase();
        return ErrorHandlingService.createMockWriteResult('create', datosValidados);
      }
      
      throw error;
    }
  }
  
  /**
   * Obtener progreso por ciclo
   * @param {string} cicloId - ID del ciclo
   * @param {Object} opciones - Opciones de consulta
   * @returns {Array} Array de progreso de territorios
   */
  async obtenerPorCiclo(cicloId, opciones = {}) {
    const operation = async () => {
      const {
        limite = 200,
        orden = 'asc',
        territorio = null
      } = opciones;
      
      let query = this.db
        .from(this.tableName)
        .select('*')
        .eq('ciclo_id', cicloId)
        .order('fecha_trabajado', { ascending: orden === 'asc' })
        .limit(limite);
      
      if (territorio) {
        query = query.eq('territorio', territorio.toUpperCase());
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data || [];
    };
    
    const mockDataProvider = (filters) => {
      const mockFilters = { ciclo_id: cicloId, ...filters, ...opciones };
      return MockDataService.getMockProgreso(mockFilters);
    };
    
    return await ErrorHandlingService.executeWithFallback(
      operation,
      'obtenerPorCiclo',
      this.tableName,
      mockDataProvider,
      { ciclo_id: cicloId, ...opciones }
    );
  }
  
  /**
   * Contar territorios completados por ciclo
   * @param {string} cicloId - ID del ciclo
   * @returns {number} Número de territorios completados
   */
  async contarPorCiclo(cicloId) {
    try {
      const { count, error } = await this.db
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('ciclo_id', cicloId);
      
      if (error) {
        console.error('❌ Error en ProgresoRepository.contarPorCiclo:', error);
        throw new Error(`Error contando progreso: ${error.message}`);
      }
      
      return count || 0;
      
    } catch (error) {
      console.error('❌ Error en ProgresoRepository.contarPorCiclo:', error.message);
      throw error;
    }
  }
  
  /**
   * Verificar si existe un territorio en un ciclo
   * @param {string} cicloId - ID del ciclo
   * @param {string} territorio - Nombre del territorio
   * @returns {boolean} True si existe
   */
  async existeTerritorio(cicloId, territorio) {
    try {
      const { count, error } = await this.db
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('ciclo_id', cicloId)
        .eq('territorio', territorio.toUpperCase());
      
      if (error) {
        console.error('❌ Error en ProgresoRepository.existeTerritorio:', error);
        throw new Error(`Error verificando territorio: ${error.message}`);
      }
      
      return count > 0;
      
    } catch (error) {
      console.error('❌ Error en ProgresoRepository.existeTerritorio:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener progreso por reporte
   * @param {string} reporteId - ID del reporte
   * @returns {Array} Array de progreso asociado al reporte
   */
  async obtenerPorReporte(reporteId) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('reporte_id', reporteId)
        .order('territorio', { ascending: true });
      
      if (error) {
        console.error('❌ Error en ProgresoRepository.obtenerPorReporte:', error);
        throw new Error(`Error obteniendo progreso por reporte: ${error.message}`);
      }
      
      return data || [];
      
    } catch (error) {
      console.error('❌ Error en ProgresoRepository.obtenerPorReporte:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener progreso por territorio específico
   * @param {string} territorio - Nombre del territorio
   * @param {Object} opciones - Opciones de consulta
   * @returns {Array} Historial del territorio
   */
  async obtenerPorTerritorio(territorio, opciones = {}) {
    try {
      const {
        limite = 50,
        fechaDesde = null,
        fechaHasta = null
      } = opciones;
      
      let query = this.db
        .from(this.tableName)
        .select('*, ciclos!inner(barrio, numero_ciclo)')
        .eq('territorio', territorio.toUpperCase())
        .order('fecha_trabajado', { ascending: false })
        .limit(limite);
      
      if (fechaDesde) {
        query = query.gte('fecha_trabajado', fechaDesde);
      }
      if (fechaHasta) {
        query = query.lte('fecha_trabajado', fechaHasta);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error en ProgresoRepository.obtenerPorTerritorio:', error);
        throw new Error(`Error obteniendo historial territorio: ${error.message}`);
      }
      
      return data || [];
      
    } catch (error) {
      console.error('❌ Error en ProgresoRepository.obtenerPorTerritorio:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener progreso por rango de fechas
   * @param {string} fechaInicio - Fecha de inicio
   * @param {string} fechaFin - Fecha de fin
   * @param {Object} opciones - Opciones adicionales
   * @returns {Array} Array de progreso en el rango
   */
  async obtenerPorRangoFechas(fechaInicio, fechaFin, opciones = {}) {
    try {
      const {
        cicloId = null,
        limite = 500
      } = opciones;
      
      let query = this.db
        .from(this.tableName)
        .select('*, ciclos!inner(barrio, numero_ciclo)')
        .gte('fecha_trabajado', fechaInicio)
        .lte('fecha_trabajado', fechaFin)
        .order('fecha_trabajado', { ascending: false })
        .limit(limite);
      
      if (cicloId) {
        query = query.eq('ciclo_id', cicloId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error en ProgresoRepository.obtenerPorRangoFechas:', error);
        throw new Error(`Error obteniendo progreso por rango: ${error.message}`);
      }
      
      return data || [];
      
    } catch (error) {
      console.error('❌ Error en ProgresoRepository.obtenerPorRangoFechas:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener estadísticas de progreso con agregaciones SQL optimizadas
   * @param {string} fechaInicio - Fecha de inicio
   * @param {string} fechaFin - Fecha de fin
   * @param {Object} opciones - Opciones adicionales
   * @returns {Object} Estadísticas de progreso
   */
  async obtenerEstadisticasOptimizadas(fechaInicio, fechaFin, opciones = {}) {
    try {
      console.log('📊 Calculando estadísticas de progreso con SQL optimizado');
      
      const { cicloId = null, barrio = null } = opciones;
      
      // Construir filtros WHERE
      let whereClause = 'WHERE p.fecha_trabajado >= $1 AND p.fecha_trabajado <= $2';
      const params = [fechaInicio, fechaFin];
      
      if (cicloId) {
        whereClause += ' AND p.ciclo_id = $' + (params.length + 1);
        params.push(cicloId);
      }
      
      if (barrio) {
        whereClause += ' AND c.barrio = $' + (params.length + 1);
        params.push(barrio);
      }
      
      // Consulta SQL optimizada con joins y agregaciones
      const sqlQuery = `
        SELECT 
          COUNT(*) as total_territorios_trabajados,
          COUNT(DISTINCT p.territorio) as territorios_unicos,
          COUNT(DISTINCT p.ciclo_id) as ciclos_activos,
          COUNT(DISTINCT c.barrio) as barrios_activos,
          MIN(p.fecha_trabajado) as fecha_primer_trabajo,
          MAX(p.fecha_trabajado) as fecha_ultimo_trabajo,
          AVG(EXTRACT(EPOCH FROM (p.fecha_trabajado - c.fecha_inicio)) / 86400) as promedio_dias_ciclo,
          COUNT(CASE WHEN p.fecha_trabajado >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as trabajados_ultima_semana,
          COUNT(CASE WHEN p.fecha_trabajado >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as trabajados_ultimo_mes
        FROM ${this.tableName} p
        INNER JOIN ciclos c ON p.ciclo_id = c.id
        ${whereClause}
      `;
      
      const { data, error } = await this.db.rpc('execute_sql', {
        query: sqlQuery,
        params: params
      });
      
      if (error) {
        console.error('❌ Error en consulta SQL optimizada de progreso:', error);
        // Fallback a método legacy
        return await this._obtenerEstadisticasLegacy(fechaInicio, fechaFin, opciones);
      }
      
      const resultado = data && data.length > 0 ? data[0] : {};
      
      const estadisticas = {
        total_territorios_trabajados: parseInt(resultado.total_territorios_trabajados) || 0,
        territorios_unicos: parseInt(resultado.territorios_unicos) || 0,
        ciclos_activos: parseInt(resultado.ciclos_activos) || 0,
        barrios_activos: parseInt(resultado.barrios_activos) || 0,
        fecha_primer_trabajo: resultado.fecha_primer_trabajo || null,
        fecha_ultimo_trabajo: resultado.fecha_ultimo_trabajo || null,
        promedio_dias_ciclo: parseFloat(resultado.promedio_dias_ciclo) || 0,
        trabajados_ultima_semana: parseInt(resultado.trabajados_ultima_semana) || 0,
        trabajados_ultimo_mes: parseInt(resultado.trabajados_ultimo_mes) || 0
      };
      
      console.log('✅ Estadísticas de progreso calculadas con SQL:', estadisticas);
      return estadisticas;
      
    } catch (error) {
      console.error('❌ Error en ProgresoRepository.obtenerEstadisticasOptimizadas:', error.message);
      // Fallback a método legacy
      return await this._obtenerEstadisticasLegacy(fechaInicio, fechaFin, opciones);
    }
  }
  
  /**
   * Obtener progreso agrupado por barrio con SQL optimizado
   * @param {string} fechaInicio - Fecha de inicio
   * @param {string} fechaFin - Fecha de fin
   * @returns {Array} Progreso agrupado por barrio
   */
  async obtenerProgresoPorBarrioOptimizado(fechaInicio, fechaFin) {
    try {
      console.log('📊 Calculando progreso por barrio con SQL optimizado');
      
      // Consulta SQL optimizada con agregaciones por barrio
      const sqlQuery = `
        SELECT 
          c.barrio,
          c.numero_ciclo,
          c.total_territorios,
          COUNT(DISTINCT p.territorio) as territorios_trabajados,
          COUNT(*) as total_trabajos,
          MIN(p.fecha_trabajado) as fecha_inicio_trabajo,
          MAX(p.fecha_trabajado) as fecha_ultimo_trabajo,
          ROUND(
            (COUNT(DISTINCT p.territorio)::decimal / NULLIF(c.total_territorios, 0)) * 100, 2
          ) as progreso_porcentaje,
          CASE 
            WHEN COUNT(DISTINCT p.territorio) = c.total_territorios THEN 'completado'
            WHEN COUNT(DISTINCT p.territorio) > 0 THEN 'activo'
            ELSE 'inactivo'
          END as estado
        FROM ciclos c
        LEFT JOIN ${this.tableName} p ON c.id = p.ciclo_id 
          AND p.fecha_trabajado >= $1 
          AND p.fecha_trabajado <= $2
        WHERE c.estado = 'activo'
        GROUP BY c.id, c.barrio, c.numero_ciclo, c.total_territorios
        ORDER BY progreso_porcentaje DESC, c.barrio
      `;
      
      const { data, error } = await this.db.rpc('execute_sql', {
        query: sqlQuery,
        params: [fechaInicio, fechaFin]
      });
      
      if (error) {
        console.error('❌ Error en consulta SQL de progreso por barrio:', error);
        // Fallback a método legacy
        return await this._obtenerProgresoPorBarrioLegacy(fechaInicio, fechaFin);
      }
      
      const progreso = (data || []).map(row => ({
        barrio: row.barrio,
        numero_ciclo: parseInt(row.numero_ciclo) || 0,
        total_territorios: parseInt(row.total_territorios) || 0,
        territorios_trabajados: parseInt(row.territorios_trabajados) || 0,
        total_trabajos: parseInt(row.total_trabajos) || 0,
        fecha_inicio_trabajo: row.fecha_inicio_trabajo || null,
        fecha_ultimo_trabajo: row.fecha_ultimo_trabajo || null,
        progreso_porcentaje: parseFloat(row.progreso_porcentaje) || 0,
        estado: row.estado || 'inactivo'
      }));
      
      console.log(`✅ Progreso por barrio calculado: ${progreso.length} barrios`);
      return progreso;
      
    } catch (error) {
      console.error('❌ Error en ProgresoRepository.obtenerProgresoPorBarrioOptimizado:', error.message);
      // Fallback a método legacy
      return await this._obtenerProgresoPorBarrioLegacy(fechaInicio, fechaFin);
    }
  }
  
  /**
   * Actualizar progreso existente
   * @param {string} id - ID del progreso
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Object} Progreso actualizado
   */
  async actualizar(id, datosActualizacion) {
    try {
      console.log('📝 Actualizando progreso:', id);
      
      const { data, error } = await this.db
        .from(this.tableName)
        .update({
          ...datosActualizacion,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Error en ProgresoRepository.actualizar:', error);
        throw new Error(`Error actualizando progreso: ${error.message}`);
      }
      
      console.log('✅ Progreso actualizado exitosamente');
      return data;
      
    } catch (error) {
      console.error('❌ Error en ProgresoRepository.actualizar:', error.message);
      throw error;
    }
  }
  
  /**
   * Eliminar progreso
   * @param {string} id - ID del progreso
   * @returns {boolean} True si se eliminó exitosamente
   */
  async eliminar(id) {
    try {
      console.log('🗑️ Eliminando progreso:', id);
      
      const { error } = await this.db
        .from(this.tableName)
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('❌ Error en ProgresoRepository.eliminar:', error);
        throw new Error(`Error eliminando progreso: ${error.message}`);
      }
      
      console.log('✅ Progreso eliminado exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error en ProgresoRepository.eliminar:', error.message);
      throw error;
    }
  }
  
  /**
   * Eliminar progreso por ciclo (para reset de ciclos)
   * @param {string} cicloId - ID del ciclo
   * @returns {number} Número de registros eliminados
   */
  async eliminarPorCiclo(cicloId) {
    try {
      console.log('🗑️ Eliminando progreso del ciclo:', cicloId);
      
      const { count, error } = await this.db
        .from(this.tableName)
        .delete({ count: 'exact' })
        .eq('ciclo_id', cicloId);
        
      if (error) {
        console.error('❌ Error en ProgresoRepository.eliminarPorCiclo:', error);
        throw new Error(`Error eliminando progreso del ciclo: ${error.message}`);
      }
      
      console.log(`✅ ${count} registros de progreso eliminados`);
      return count || 0;
      
    } catch (error) {
      console.error('❌ Error en ProgresoRepository.eliminarPorCiclo:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener estadísticas de progreso
   * @param {Object} opciones - Opciones de consulta
   * @returns {Object} Estadísticas de progreso
   */
  async obtenerEstadisticas(opciones = {}) {
    try {
      const {
        cicloId = null,
        fechaDesde = null,
        fechaHasta = null
      } = opciones;
      
      let query = this.db
        .from(this.tableName)
        .select('territorio, fecha_trabajado, ciclo_id');
      
      if (cicloId) {
        query = query.eq('ciclo_id', cicloId);
      }
      if (fechaDesde) {
        query = query.gte('fecha_trabajado', fechaDesde);
      }
      if (fechaHasta) {
        query = query.lte('fecha_trabajado', fechaHasta);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error en ProgresoRepository.obtenerEstadisticas:', error);
        throw new Error(`Error obteniendo estadísticas: ${error.message}`);
      }
      
      const progreso = data || [];
      
      // Calcular estadísticas
      const estadisticas = {
        total_territorios_trabajados: progreso.length,
        territorios_unicos: new Set(progreso.map(p => p.territorio)).size,
        ciclos_con_progreso: new Set(progreso.map(p => p.ciclo_id)).size,
        fecha_primer_trabajo: progreso.length > 0 
          ? Math.min(...progreso.map(p => new Date(p.fecha_trabajado)))
          : null,
        fecha_ultimo_trabajo: progreso.length > 0 
          ? Math.max(...progreso.map(p => new Date(p.fecha_trabajado)))
          : null
      };
      
      return estadisticas;
      
    } catch (error) {
      console.error('❌ Error en ProgresoRepository.obtenerEstadisticas:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtener territorios más trabajados
   * @param {Object} opciones - Opciones de consulta
   * @returns {Array} Array de territorios con frecuencia
   */
  async obtenerTerritoriosMasTrabajados(opciones = {}) {
    try {
      const {
        limite = 10,
        fechaDesde = null,
        fechaHasta = null
      } = opciones;
      
      let query = this.db
        .from(this.tableName)
        .select('territorio');
      
      if (fechaDesde) {
        query = query.gte('fecha_trabajado', fechaDesde);
      }
      if (fechaHasta) {
        query = query.lte('fecha_trabajado', fechaHasta);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error en ProgresoRepository.obtenerTerritoriosMasTrabajados:', error);
        throw new Error(`Error obteniendo territorios más trabajados: ${error.message}`);
      }
      
      // Contar frecuencias
      const frecuencias = {};
      (data || []).forEach(item => {
        frecuencias[item.territorio] = (frecuencias[item.territorio] || 0) + 1;
      });
      
      // Ordenar por frecuencia y limitar
      const territoriosOrdenados = Object.entries(frecuencias)
        .map(([territorio, frecuencia]) => ({ territorio, frecuencia }))
        .sort((a, b) => b.frecuencia - a.frecuencia)
        .slice(0, limite);
      
      return territoriosOrdenados;
      
    } catch (error) {
      console.error('❌ Error en ProgresoRepository.obtenerTerritoriosMasTrabajados:', error.message);
      throw error;
    }
  }
}

export default ProgresoRepository;